const db = require('../database');
const { buscarProdutoPorId } = require('./produtoService');
const { buscarCupomPorCodigo, calcularDesconto } = require('./cupomService');
const { buscarClientePorId } = require('./clienteService');

// ─────────────────────────────────────────────────────────────────────────────
// Internal helpers
// ─────────────────────────────────────────────────────────────────────────────
function _registrarHistorico(pedidoId, status) {
  db.prepare('INSERT INTO historico_status (pedido_id, status) VALUES (?, ?)').run(pedidoId, status);
}

function _validarEndereco({ rua, numero, bairro, cidade }) {
  if (!rua || rua.trim() === '')    throw new Error('Rua é obrigatória no endereço.');
  if (!numero || numero.trim() === '') throw new Error('Número é obrigatório no endereço.');
  if (!bairro || bairro.trim() === '') throw new Error('Bairro é obrigatório no endereço.');
  if (!cidade || cidade.trim() === '') throw new Error('Cidade é obrigatória no endereço.');
}

function buscarPedidoPorId(id) {
  return db.prepare('SELECT * FROM pedidos WHERE id = ?').get(id);
}

function _buildPedidoCompleto(pedido) {
  if (!pedido) return null;

  const cliente = db.prepare('SELECT id, nome, email, telefone FROM clientes WHERE id = ?').get(pedido.cliente_id);

  const itens = db.prepare(`
    SELECT ip.*, p.nome AS produto_nome
    FROM itens_pedido ip
    JOIN produtos p ON ip.produto_id = p.id
    WHERE ip.pedido_id = ?
  `).all(pedido.id);

  const subtotal = parseFloat(
    itens.reduce((s, i) => s + i.preco_unitario * i.quantidade, 0).toFixed(2)
  );

  const historico = db.prepare(
    'SELECT status, alterado_em FROM historico_status WHERE pedido_id = ? ORDER BY id'
  ).all(pedido.id);

  let cupom = null;
  if (pedido.cupom_id) {
    cupom = db.prepare('SELECT codigo, tipo, valor FROM cupons WHERE id = ?').get(pedido.cupom_id);
  }

  const desconto = parseFloat((pedido.desconto || 0).toFixed(2));
  const total = parseFloat(Math.max(0, subtotal - desconto).toFixed(2));

  return {
    id: pedido.id,
    status: pedido.status,
    criado_em: pedido.criado_em,
    cliente,
    endereco: {
      rua: pedido.rua,
      numero: pedido.numero,
      bairro: pedido.bairro,
      cidade: pedido.cidade,
    },
    cupom,
    subtotal,
    desconto,
    total,
    itens,
    historico,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Public functions
// ─────────────────────────────────────────────────────────────────────────────
function criarPedido({ cliente_id, rua, numero, bairro, cidade }) {
  // Validate client exists
  const cliente = buscarClientePorId(cliente_id);
  if (!cliente) throw new Error('Cliente não encontrado.');

  // Validate address
  _validarEndereco({ rua, numero, bairro, cidade });

  const stmt = db.prepare(`
    INSERT INTO pedidos (cliente_id, status, rua, numero, bairro, cidade)
    VALUES (?, 'ABERTO', ?, ?, ?, ?)
  `);
  const result = stmt.run(cliente_id, rua.trim(), numero.trim(), bairro.trim(), cidade.trim());
  const pedido = buscarPedidoPorId(result.lastInsertRowid);
  _registrarHistorico(pedido.id, 'ABERTO');
  return _buildPedidoCompleto(pedido);
}

function listarPedidos({ status, cliente_id } = {}) {
  let query = 'SELECT * FROM pedidos WHERE 1=1';
  const params = [];

  if (status) {
    query += ' AND status = ?';
    params.push(status.toUpperCase());
  }
  if (cliente_id) {
    query += ' AND cliente_id = ?';
    params.push(Number(cliente_id));
  }

  query += ' ORDER BY id DESC';
  const pedidos = db.prepare(query).all(...params);
  return pedidos.map(_buildPedidoCompleto);
}

function adicionarItem(pedidoId, { produto_id, quantidade }) {
  const pedido = buscarPedidoPorId(pedidoId);
  if (!pedido) throw new Error('Pedido não encontrado.');
  if (pedido.status !== 'ABERTO') throw new Error('Não é possível adicionar itens a um pedido ' + pedido.status.toLowerCase() + '.');

  if (quantidade === undefined || quantidade === null) throw new Error('Quantidade é obrigatória.');
  const qtd = Number(quantidade);
  if (!Number.isInteger(qtd) || qtd <= 0) throw new Error('Quantidade deve ser um inteiro positivo.');

  const produto = buscarProdutoPorId(produto_id);
  if (!produto) throw new Error('Produto não encontrado.');

  db.prepare(
    'INSERT INTO itens_pedido (pedido_id, produto_id, quantidade, preco_unitario) VALUES (?, ?, ?, ?)'
  ).run(pedidoId, produto_id, qtd, produto.preco);

  return _buildPedidoCompleto(buscarPedidoPorId(pedidoId));
}

function aplicarCupom(pedidoId, codigo) {
  const pedido = buscarPedidoPorId(pedidoId);
  if (!pedido) throw new Error('Pedido não encontrado.');
  if (pedido.status !== 'ABERTO') throw new Error('Não é possível aplicar cupom em pedido ' + pedido.status.toLowerCase() + '.');

  const cupom = buscarCupomPorCodigo(codigo);
  if (!cupom) throw new Error('Cupom inválido ou não encontrado.');

  // Calculate current subtotal
  const itens = db.prepare('SELECT quantidade, preco_unitario FROM itens_pedido WHERE pedido_id = ?').all(pedidoId);
  const subtotal = itens.reduce((s, i) => s + i.preco_unitario * i.quantidade, 0);

  const desconto = calcularDesconto(cupom, subtotal);
  db.prepare('UPDATE pedidos SET cupom_id = ?, desconto = ? WHERE id = ?').run(cupom.id, desconto, pedidoId);

  return _buildPedidoCompleto(buscarPedidoPorId(pedidoId));
}

function finalizarPedido(pedidoId) {
  const pedido = buscarPedidoPorId(pedidoId);
  if (!pedido) throw new Error('Pedido não encontrado.');
  if (pedido.status === 'FINALIZADO') throw new Error('Pedido já está finalizado.');
  if (pedido.status === 'CANCELADO') throw new Error('Pedido cancelado não pode ser finalizado.');

  db.prepare("UPDATE pedidos SET status = 'FINALIZADO' WHERE id = ?").run(pedidoId);
  _registrarHistorico(pedidoId, 'FINALIZADO');
  return _buildPedidoCompleto(buscarPedidoPorId(pedidoId));
}

function cancelarPedido(pedidoId) {
  const pedido = buscarPedidoPorId(pedidoId);
  if (!pedido) throw new Error('Pedido não encontrado.');
  if (pedido.status === 'CANCELADO') throw new Error('Pedido já está cancelado.');
  if (pedido.status === 'FINALIZADO') throw new Error('Pedido finalizado não pode ser cancelado.');

  db.prepare("UPDATE pedidos SET status = 'CANCELADO' WHERE id = ?").run(pedidoId);
  _registrarHistorico(pedidoId, 'CANCELADO');
  return _buildPedidoCompleto(buscarPedidoPorId(pedidoId));
}

function deletePedido(pedidoId) {
  const pedido = buscarPedidoPorId(pedidoId);
  if (!pedido) throw new Error('Pedido não encontrado.');
  db.prepare('DELETE FROM itens_pedido WHERE pedido_id = ?').run(pedidoId);
  db.prepare('DELETE FROM historico_status WHERE pedido_id = ?').run(pedidoId);
  db.prepare('DELETE FROM pedidos WHERE id = ?').run(pedidoId);
  return { id: pedidoId };
}

module.exports = {
  criarPedido,
  listarPedidos,
  adicionarItem,
  aplicarCupom,
  finalizarPedido,
  cancelarPedido,
  deletePedido,
};
