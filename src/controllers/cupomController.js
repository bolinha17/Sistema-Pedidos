const { criarCupom, listarCupons } = require('../services/cupomService');

function postCupom(req, res) {
  try {
    const cupom = criarCupom(req.body);
    return res.status(201).json({ sucesso: true, data: cupom });
  } catch (err) {
    return res.status(400).json({ sucesso: false, erro: err.message });
  }
}

function getCupons(req, res) {
  try {
    return res.status(200).json({ sucesso: true, data: listarCupons() });
  } catch (err) {
    return res.status(500).json({ sucesso: false, erro: 'Erro interno do servidor.' });
  }
}

module.exports = { postCupom, getCupons };
