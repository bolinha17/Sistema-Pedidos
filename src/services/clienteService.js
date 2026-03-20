const db = require('../database');

function listarClientes() {
  return db.prepare('SELECT * FROM clientes ORDER BY id').all();
}

function buscarClientePorId(id) {
  return db.prepare('SELECT * FROM clientes WHERE id = ?').get(id);
}

function criarCliente({ nome, email, telefone }) {
  if (!nome || typeof nome !== 'string' || nome.trim() === '') {
    throw new Error('Nome do cliente é obrigatório.');
  }
  if (!email || typeof email !== 'string' || !email.includes('@')) {
    throw new Error('E-mail válido é obrigatório.');
  }

  try {
    const stmt = db.prepare(
      'INSERT INTO clientes (nome, email, telefone) VALUES (?, ?, ?)'
    );
    const result = stmt.run(nome.trim(), email.trim().toLowerCase(), telefone || null);
    return buscarClientePorId(result.lastInsertRowid);
  } catch (err) {
    if (err.message.includes('UNIQUE')) {
      throw new Error('Já existe um cliente com esse e-mail.');
    }
    throw err;
  }
}

function deleteCliente(id) {
  const cliente = buscarClientePorId(id);
  if (!cliente) throw new Error('Cliente não encontrado.');
  const emUso = db.prepare('SELECT 1 FROM pedidos WHERE cliente_id = ? LIMIT 1').get(id);
  if (emUso) throw new Error('Cliente não pode ser excluído pois possui pedidos.');
  db.prepare('DELETE FROM clientes WHERE id = ?').run(id);
  return { id };
}

module.exports = { listarClientes, buscarClientePorId, criarCliente, deleteCliente };
