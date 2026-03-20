const db = require('../database');

function listarCupons() {
  return db.prepare('SELECT * FROM cupons ORDER BY id').all();
}

function buscarCupomPorCodigo(codigo) {
  return db.prepare('SELECT * FROM cupons WHERE UPPER(codigo) = UPPER(?)').get(codigo);
}

function criarCupom({ codigo, tipo, valor }) {
  if (!codigo || typeof codigo !== 'string' || codigo.trim() === '') {
    throw new Error('Código do cupom é obrigatório.');
  }
  if (!['PERCENTUAL', 'FIXO'].includes(tipo)) {
    throw new Error('Tipo deve ser PERCENTUAL ou FIXO.');
  }
  const v = Number(valor);
  if (isNaN(v) || v <= 0) {
    throw new Error('Valor do cupom deve ser positivo.');
  }
  if (tipo === 'PERCENTUAL' && v > 100) {
    throw new Error('Desconto percentual não pode ser maior que 100%.');
  }

  try {
    const stmt = db.prepare('INSERT INTO cupons (codigo, tipo, valor) VALUES (?, ?, ?)');
    const result = stmt.run(codigo.trim().toUpperCase(), tipo, v);
    return db.prepare('SELECT * FROM cupons WHERE id = ?').get(result.lastInsertRowid);
  } catch (err) {
    if (err.message.includes('UNIQUE')) {
      throw new Error('Já existe um cupom com esse código.');
    }
    throw err;
  }
}

/**
 * Calculates the discount amount given a coupon and a subtotal.
 */
function calcularDesconto(cupom, subtotal) {
  if (!cupom) return 0;
  if (cupom.tipo === 'PERCENTUAL') {
    return parseFloat(((subtotal * cupom.valor) / 100).toFixed(2));
  }
  // FIXO: discount cannot exceed subtotal
  return parseFloat(Math.min(cupom.valor, subtotal).toFixed(2));
}

module.exports = { listarCupons, buscarCupomPorCodigo, criarCupom, calcularDesconto };
