const express = require('express');
const path = require('path');
const { metricsMiddleware, getMetrics } = require('./middleware/metrics');

const produtosRouter  = require('./routes/produtos');
const pedidosRouter   = require('./routes/pedidos');
const clientesRouter  = require('./routes/clientes');
const cuponsRouter    = require('./routes/cupons');
const v2Router        = require('./routes/v2/pedidos');

const app = express();

// Parse JSON body
app.use(express.json());

// Serve static frontend files
app.use(express.static(path.join(__dirname, '..', 'public')));

// Observability middleware
app.use(metricsMiddleware);

// API v1 Routes (retrocompatíveis)
app.use('/produtos', produtosRouter);
app.use('/pedidos',  pedidosRouter);
app.use('/clientes', clientesRouter);
app.use('/cupons',   cuponsRouter);

// API v2 Routes (versionada, camelCase, formato padronizado)
app.use('/api/v2', v2Router);

// Metrics endpoint
app.get('/metricas', (req, res) => {
  res.json({ sucesso: true, data: getMetrics() });
});

// 404 handler for unknown routes
app.use((req, res) => {
  res.status(404).json({ sucesso: false, erro: 'Rota não encontrada.' });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('[ERRO]', err.message);
  res.status(500).json({ sucesso: false, erro: 'Erro interno do servidor.' });
});

module.exports = app;
