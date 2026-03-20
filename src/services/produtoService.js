const db = require('../database');

function listarProdutos({ nome } = {}) {
  if (nome && nome.trim() !== '') {
    return db.prepare("SELECT * FROM produtos WHERE LOWER(nome) LIKE LOWER('%' || ? || '%') ORDER BY id").all(nome.trim());
  }
  return db.prepare('SELECT * FROM produtos ORDER BY id').all();
}

function buscarProdutoPorId(id) {
  return db.prepare('SELECT * FROM produtos WHERE id = ?').get(id);
}

function criarProduto({ nome, preco }) {
  if (!nome || typeof nome !== 'string' || nome.trim() === '') {
    throw new Error('Nome do produto é obrigatório.');
  }
  if (preco === undefined || preco === null) {
    throw new Error('Preço é obrigatório.');
  }
  const precoNum = Number(preco);
  if (isNaN(precoNum) || precoNum < 0) {
    throw new Error('Preço não pode ser negativo.');
  }

  const stmt = db.prepare('INSERT INTO produtos (nome, preco) VALUES (?, ?)');
  const result = stmt.run(nome.trim(), precoNum);
  return buscarProdutoPorId(result.lastInsertRowid);
}

module.exports = { listarProdutos, buscarProdutoPorId, criarProduto, deleteProduto };

function deleteProduto(id) {
  const produto = buscarProdutoPorId(id);
  if (!produto) throw new Error('Produto não encontrado.');

  // Prevent deletion if product is used in any order
  const emUso = db.prepare('SELECT 1 FROM itens_pedido WHERE produto_id = ? LIMIT 1').get(id);
  if (emUso) throw new Error('Produto não pode ser excluído pois está vinculado a um pedido.');

  db.prepare('DELETE FROM produtos WHERE id = ?').run(id);
  return { id };
}
