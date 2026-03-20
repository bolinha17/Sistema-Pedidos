const express = require('express');
const router = express.Router();
const { getPedidosV2 } = require('../../controllers/pedidoV2Controller');

// GET /api/v2/pedidos?status=ABERTO|FINALIZADO|CANCELADO
router.get('/pedidos', getPedidosV2);

module.exports = router;
