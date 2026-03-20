const express = require('express');
const router = express.Router();
const { postCliente, getClientes, deleteClienteHandler } = require('../controllers/clienteController');

router.post('/', postCliente);
router.get('/', getClientes);
router.delete('/:id', deleteClienteHandler);

module.exports = router;
