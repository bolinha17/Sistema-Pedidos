const express = require('express');
const router = express.Router();
const { postProduto, getProdutos, deleteProdutoHandler } = require('../controllers/produtoController');

router.post('/', postProduto);
router.get('/', getProdutos);
router.delete('/:id', deleteProdutoHandler);

module.exports = router;
