const { listarPedidos } = require('../services/pedidoService');

// Valid status values accepted by v2
const STATUS_VALIDOS = ['ABERTO', 'FINALIZADO', 'CANCELADO'];

/**
 * Transform a pedido object from internal snake_case format
 * to the camelCase format required by API v2.
 */
function transformarPedido(p) {
  return {
    id: p.id,
    status: p.status,
    criadoEm: p.criado_em,
    cliente: p.cliente
      ? {
          id: p.cliente.id,
          nome: p.cliente.nome,
          email: p.cliente.email,
          telefone: p.cliente.telefone || null,
        }
      : null,
    enderecoEntrega: {
      rua: p.endereco?.rua || null,
      numero: p.endereco?.numero || null,
      bairro: p.endereco?.bairro || null,
      cidade: p.endereco?.cidade || null,
    },
    itens: (p.itens || []).map(i => ({
      produtoId: i.produto_id,
      produtoNome: i.produto_nome,
      quantidade: i.quantidade,
      precoUnitario: i.preco_unitario,
      subtotalItem: parseFloat((i.preco_unitario * i.quantidade).toFixed(2)),
    })),
    cupom: p.cupom
      ? { codigo: p.cupom.codigo, tipo: p.cupom.tipo, valor: p.cupom.valor }
      : null,
    subtotal: p.subtotal,
    desconto: p.desconto,
    totalFinal: p.total,
    historico: (p.historico || []).map(h => ({
      status: h.status,
      alteradoEm: h.alterado_em,
    })),
  };
}

function listarPedidosV2({ status } = {}) {
  // Validate status if provided
  if (status && !STATUS_VALIDOS.includes(status.toUpperCase())) {
    const err = new Error('Status inválido. Use: ABERTO, FINALIZADO ou CANCELADO.');
    err.code = 'VALIDATION_ERROR';
    throw err;
  }

  const pedidos = listarPedidos({ status });
  return pedidos.map(transformarPedido);
}

module.exports = { listarPedidosV2 };
