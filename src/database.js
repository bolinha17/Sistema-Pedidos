const Database = require('better-sqlite3');
const path = require('path');

let db;

if (process.env.NODE_ENV === 'test') {
  db = new Database(':memory:');
} else {
  const DB_PATH = path.join(__dirname, '..', 'data', 'loja.db');
  const fs = require('fs');
  const dataDir = path.dirname(DB_PATH);
  if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });
  db = new Database(DB_PATH);
  db.pragma('journal_mode = WAL');
}

db.exec(`
  CREATE TABLE IF NOT EXISTS produtos (
    id       INTEGER PRIMARY KEY AUTOINCREMENT,
    nome     TEXT    NOT NULL,
    preco    REAL    NOT NULL,
    criado_em TEXT   NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS clientes (
    id        INTEGER PRIMARY KEY AUTOINCREMENT,
    nome      TEXT    NOT NULL,
    email     TEXT    NOT NULL UNIQUE,
    telefone  TEXT,
    criado_em TEXT    NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS cupons (
    id        INTEGER PRIMARY KEY AUTOINCREMENT,
    codigo    TEXT    NOT NULL UNIQUE,
    tipo      TEXT    NOT NULL CHECK(tipo IN ('PERCENTUAL','FIXO')),
    valor     REAL    NOT NULL,
    criado_em TEXT    NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS pedidos (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    cliente_id INTEGER NOT NULL,
    status     TEXT    NOT NULL DEFAULT 'ABERTO',
    cupom_id   INTEGER,
    desconto   REAL    NOT NULL DEFAULT 0,
    rua        TEXT,
    numero     TEXT,
    bairro     TEXT,
    cidade     TEXT,
    criado_em  TEXT    NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (cliente_id) REFERENCES clientes(id),
    FOREIGN KEY (cupom_id)   REFERENCES cupons(id)
  );

  CREATE TABLE IF NOT EXISTS itens_pedido (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    pedido_id       INTEGER NOT NULL,
    produto_id      INTEGER NOT NULL,
    quantidade      INTEGER NOT NULL,
    preco_unitario  REAL    NOT NULL,
    FOREIGN KEY (pedido_id)  REFERENCES pedidos(id),
    FOREIGN KEY (produto_id) REFERENCES produtos(id)
  );

  CREATE TABLE IF NOT EXISTS historico_status (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    pedido_id   INTEGER NOT NULL,
    status      TEXT    NOT NULL,
    alterado_em TEXT    NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (pedido_id) REFERENCES pedidos(id)
  );
`);

module.exports = db;
