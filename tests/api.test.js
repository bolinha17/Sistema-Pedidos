const request = require('supertest');
process.env.NODE_ENV = 'test';
const app = require('../src/app');

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────
async function criarProduto(nome = 'Produto Teste', preco = 10) {
  const res = await request(app).post('/produtos').send({ nome, preco });
  return res.body.data;
}

async function criarCliente(nome = 'Ana Silva', email) {
  const em = email || `${Date.now()}@teste.com`;
  const res = await request(app).post('/clientes').send({ nome, email: em });
  return res.body.data;
}

async function criarPedido(clienteId) {
  const res = await request(app).post('/pedidos').send({
    cliente_id: clienteId,
    rua: 'Rua das Flores',
    numero: '123',
    bairro: 'Centro',
    cidade: 'São Paulo',
  });
  return res.body.data;
}

// ─────────────────────────────────────────────────────────────────────────────
// 1. Total calculado corretamente
// ─────────────────────────────────────────────────────────────────────────────
test('total do pedido é calculado corretamente', async () => {
  const cliente = await criarCliente();
  const produto = await criarProduto('Caneca', 15.5);
  const pedido  = await criarPedido(cliente.id);

  const res = await request(app)
    .post(`/pedidos/${pedido.id}/itens`)
    .send({ produto_id: produto.id, quantidade: 3 });

  expect(res.statusCode).toBe(200);
  expect(res.body.data.subtotal).toBeCloseTo(46.5, 2);
  expect(res.body.data.total).toBeCloseTo(46.5, 2);
});

// ─────────────────────────────────────────────────────────────────────────────
// 2. Validação de quantidade inválida
// ─────────────────────────────────────────────────────────────────────────────
test('quantidade inválida (0 ou negativa) deve retornar 400', async () => {
  const cliente = await criarCliente();
  const produto = await criarProduto('Livro', 30);
  const pedido  = await criarPedido(cliente.id);

  const resZero = await request(app)
    .post(`/pedidos/${pedido.id}/itens`)
    .send({ produto_id: produto.id, quantidade: 0 });
  expect(resZero.statusCode).toBe(400);

  const resNeg = await request(app)
    .post(`/pedidos/${pedido.id}/itens`)
    .send({ produto_id: produto.id, quantidade: -5 });
  expect(resNeg.statusCode).toBe(400);
});

// ─────────────────────────────────────────────────────────────────────────────
// 3. Pedido finalizado não aceita novos itens
// ─────────────────────────────────────────────────────────────────────────────
test('pedido finalizado não pode receber novos itens', async () => {
  const cliente = await criarCliente();
  const produto = await criarProduto('Caneta', 2);
  const pedido  = await criarPedido(cliente.id);

  await request(app).post(`/pedidos/${pedido.id}/itens`).send({ produto_id: produto.id, quantidade: 1 });
  await request(app).post(`/pedidos/${pedido.id}/finalizar`);

  const res = await request(app)
    .post(`/pedidos/${pedido.id}/itens`)
    .send({ produto_id: produto.id, quantidade: 1 });

  expect(res.statusCode).toBe(400);
  expect(res.body.sucesso).toBe(false);
});

// ─────────────────────────────────────────────────────────────────────────────
// 4. POST /pedidos cria pedido com status ABERTO
// ─────────────────────────────────────────────────────────────────────────────
test('POST /pedidos cria pedido com status ABERTO', async () => {
  const cliente = await criarCliente();
  const res = await criarPedido(cliente.id);
  expect(res.status).toBe('ABERTO');
  expect(res.id).toBeDefined();
  expect(res.cliente.id).toBe(cliente.id);
  expect(res.endereco.cidade).toBe('São Paulo');
});

// ─────────────────────────────────────────────────────────────────────────────
// 5. POST /pedidos/:id/finalizar muda status
// ─────────────────────────────────────────────────────────────────────────────
test('POST /pedidos/:id/finalizar muda status para FINALIZADO', async () => {
  const cliente = await criarCliente();
  const pedido  = await criarPedido(cliente.id);
  const res = await request(app).post(`/pedidos/${pedido.id}/finalizar`);
  expect(res.statusCode).toBe(200);
  expect(res.body.data.status).toBe('FINALIZADO');
  expect(res.body.data.historico.some(h => h.status === 'FINALIZADO')).toBe(true);
});

// ─────────────────────────────────────────────────────────────────────────────
// 6. Produto inexistente retorna 404
// ─────────────────────────────────────────────────────────────────────────────
test('adicionar item com produto inexistente deve retornar 404', async () => {
  const cliente = await criarCliente();
  const pedido  = await criarPedido(cliente.id);
  const res = await request(app)
    .post(`/pedidos/${pedido.id}/itens`)
    .send({ produto_id: 999999, quantidade: 1 });
  expect(res.statusCode).toBe(404);
});

// ─────────────────────────────────────────────────────────────────────────────
// 7. Preço negativo é rejeitado
// ─────────────────────────────────────────────────────────────────────────────
test('criar produto com preço negativo deve retornar 400', async () => {
  const res = await request(app).post('/produtos').send({ nome: 'Inválido', preco: -5 });
  expect(res.statusCode).toBe(400);
  expect(res.body.erro).toMatch(/negativo/i);
});

// ─────────────────────────────────────────────────────────────────────────────
// 8. Confiabilidade — 20 chamadas a GET /pedidos
// ─────────────────────────────────────────────────────────────────────────────
test('GET /pedidos pode ser chamado 20 vezes sem erro', async () => {
  for (let i = 0; i < 20; i++) {
    const res = await request(app).get('/pedidos');
    expect(res.statusCode).toBe(200);
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// 9. [NOVO] Cancelar pedido
// ─────────────────────────────────────────────────────────────────────────────
test('POST /pedidos/:id/cancelar muda status para CANCELADO', async () => {
  const cliente = await criarCliente();
  const pedido  = await criarPedido(cliente.id);
  const res = await request(app).post(`/pedidos/${pedido.id}/cancelar`);
  expect(res.statusCode).toBe(200);
  expect(res.body.data.status).toBe('CANCELADO');
  expect(res.body.data.historico.some(h => h.status === 'CANCELADO')).toBe(true);
});

// ─────────────────────────────────────────────────────────────────────────────
// 10. [NOVO] Pedido cancelado não pode ser finalizado
// ─────────────────────────────────────────────────────────────────────────────
test('pedido cancelado não pode ser finalizado', async () => {
  const cliente = await criarCliente();
  const pedido  = await criarPedido(cliente.id);
  await request(app).post(`/pedidos/${pedido.id}/cancelar`);
  const res = await request(app).post(`/pedidos/${pedido.id}/finalizar`);
  expect(res.statusCode).toBe(400);
  expect(res.body.erro).toMatch(/cancelado/i);
});

// ─────────────────────────────────────────────────────────────────────────────
// 11. [NOVO] Cupom percentual calcula desconto corretamente
// ─────────────────────────────────────────────────────────────────────────────
test('cupom percentual aplica 10% de desconto corretamente', async () => {
  const cliente = await criarCliente();
  const produto = await criarProduto('Notebook', 1000);
  const pedido  = await criarPedido(cliente.id);

  await request(app).post('/cupons').send({ codigo: 'CUPOM10', tipo: 'PERCENTUAL', valor: 10 });
  await request(app).post(`/pedidos/${pedido.id}/itens`).send({ produto_id: produto.id, quantidade: 1 });

  const res = await request(app).post(`/pedidos/${pedido.id}/cupom`).send({ codigo: 'CUPOM10' });
  expect(res.statusCode).toBe(200);
  expect(res.body.data.desconto).toBeCloseTo(100, 2);   // 10% de 1000
  expect(res.body.data.total).toBeCloseTo(900, 2);
});

// ─────────────────────────────────────────────────────────────────────────────
// 12. [NOVO] Cupom de valor fixo calcula desconto corretamente
// ─────────────────────────────────────────────────────────────────────────────
test('cupom fixo aplica R$20 de desconto corretamente', async () => {
  const cliente = await criarCliente();
  const produto = await criarProduto('Tablet', 200);
  const pedido  = await criarPedido(cliente.id);

  await request(app).post('/cupons').send({ codigo: 'DESCONTO20', tipo: 'FIXO', valor: 20 });
  await request(app).post(`/pedidos/${pedido.id}/itens`).send({ produto_id: produto.id, quantidade: 1 });

  const res = await request(app).post(`/pedidos/${pedido.id}/cupom`).send({ codigo: 'DESCONTO20' });
  expect(res.statusCode).toBe(200);
  expect(res.body.data.desconto).toBeCloseTo(20, 2);
  expect(res.body.data.total).toBeCloseTo(180, 2);
});

// ─────────────────────────────────────────────────────────────────────────────
// 13. [NOVO] Filtrar pedidos por status
// ─────────────────────────────────────────────────────────────────────────────
test('GET /pedidos?status=CANCELADO retorna só pedidos cancelados', async () => {
  const cliente = await criarCliente();
  const p1 = await criarPedido(cliente.id);
  const p2 = await criarPedido(cliente.id);
  await request(app).post(`/pedidos/${p1.id}/cancelar`);

  const res = await request(app).get('/pedidos?status=CANCELADO');
  expect(res.statusCode).toBe(200);
  const ids = res.body.data.map(p => p.id);
  expect(ids).toContain(p1.id);
  expect(ids).not.toContain(p2.id);
  res.body.data.forEach(p => expect(p.status).toBe('CANCELADO'));
});

// ─────────────────────────────────────────────────────────────────────────────
// 14. [NOVO] Buscar produto por nome
// ─────────────────────────────────────────────────────────────────────────────
test('GET /produtos?nome=can busca por nome parcial', async () => {
  await criarProduto('Caneca de Porcelana', 25);
  await criarProduto('Mousepad', 40);

  const res = await request(app).get('/produtos?nome=can');
  expect(res.statusCode).toBe(200);
  const nomes = res.body.data.map(p => p.nome.toLowerCase());
  nomes.forEach(n => expect(n).toContain('can'));
  const temMousepad = res.body.data.some(p => p.nome === 'Mousepad');
  expect(temMousepad).toBe(false);
});

// ─────────────────────────────────────────────────────────────────────────────
// 15. [v2] GET /api/v2/pedidos — sucesso com campos camelCase
// ─────────────────────────────────────────────────────────────────────────────
test('[v2] GET /api/v2/pedidos retorna pedidos no formato camelCase', async () => {
  const cliente = await criarCliente();
  const produto = await criarProduto('Caderno', 18);
  const pedido  = await criarPedido(cliente.id);
  await request(app).post(`/pedidos/${pedido.id}/itens`).send({ produto_id: produto.id, quantidade: 2 });
  await request(app).post(`/pedidos/${pedido.id}/finalizar`);

  const res = await request(app).get('/api/v2/pedidos?status=FINALIZADO');

  expect(res.statusCode).toBe(200);
  expect(res.body.success).toBe(true);
  expect(res.body.message).toBeDefined();
  expect(Array.isArray(res.body.data)).toBe(true);

  const p = res.body.data.find(x => x.id === pedido.id);
  expect(p).toBeDefined();
  // camelCase fields
  expect(p.totalFinal).toBeDefined();
  expect(p.enderecoEntrega).toBeDefined();
  expect(p.enderecoEntrega.cidade).toBe('São Paulo');
  expect(p.status).toBe('FINALIZADO');
  expect(p.subtotal).toBeCloseTo(36, 2);     // 18 × 2
  expect(p.totalFinal).toBeCloseTo(36, 2);
  expect(p.cliente).toBeDefined();
  expect(p.itens[0].produtoNome).toBeDefined();
});

// ─────────────────────────────────────────────────────────────────────────────
// 16. [v2] GET /api/v2/pedidos — erro de validação com status inválido
// ─────────────────────────────────────────────────────────────────────────────
test('[v2] GET /api/v2/pedidos?status=INVALIDO retorna VALIDATION_ERROR', async () => {
  const res = await request(app).get('/api/v2/pedidos?status=INVALIDO');

  expect(res.statusCode).toBe(400);
  expect(res.body.success).toBe(false);
  expect(res.body.message).toMatch(/status inv/i);
  expect(res.body.error).toBeDefined();
  expect(res.body.error.code).toBe('VALIDATION_ERROR');
});
