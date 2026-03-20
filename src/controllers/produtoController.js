const { criarProduto, listarProdutos, deleteProduto } = require('../services/produtoService');

function postProduto(req, res) {
  try {
    const produto = criarProduto(req.body);
    return res.status(201).json({ sucesso: true, data: produto });
  } catch (err) {
    return res.status(400).json({ sucesso: false, erro: err.message });
  }
}

function getProdutos(req, res) {
  try {
    const { nome } = req.query;
    const produtos = listarProdutos({ nome });
    return res.status(200).json({ sucesso: true, data: produtos });
  } catch (err) {
    return res.status(500).json({ sucesso: false, erro: 'Erro interno do servidor.' });
  }
}

function deleteProdutoHandler(req, res) {
  try {
    const { id } = req.params;
    const result = deleteProduto(Number(id));
    return res.status(200).json({ sucesso: true, data: result });
  } catch (err) {
    const status = err.message.includes('não encontrado') ? 404 : 400;
    return res.status(status).json({ sucesso: false, erro: err.message });
  }
}

module.exports = { postProduto, getProdutos, deleteProdutoHandler };
