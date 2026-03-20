const express = require('express');
const router = express.Router();
const {
  postPedido,
  getPedidos,
  postAdicionarItem,
  postAplicarCupom,
  postFinalizarPedido,
  postCancelarPedido,
  deletePedidoHandler,
} = require('../controllers/pedidoController');

router.post('/',             postPedido);
router.get('/',              getPedidos);           // ?status=X&cliente_id=Y
router.post('/:id/itens',    postAdicionarItem);
router.post('/:id/cupom',    postAplicarCupom);
router.post('/:id/finalizar',postFinalizarPedido);
router.post('/:id/cancelar', postCancelarPedido);
router.delete('/:id',        deletePedidoHandler);

module.exports = router;

