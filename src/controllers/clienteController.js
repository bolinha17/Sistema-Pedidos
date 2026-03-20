const { criarCliente, listarClientes, deleteCliente } = require('../services/clienteService');

function postCliente(req, res) {
  try {
    const cliente = criarCliente(req.body);
    return res.status(201).json({ sucesso: true, data: cliente });
  } catch (err) {
    return res.status(400).json({ sucesso: false, erro: err.message });
  }
}

function getClientes(req, res) {
  try {
    return res.status(200).json({ sucesso: true, data: listarClientes() });
  } catch (err) {
    return res.status(500).json({ sucesso: false, erro: 'Erro interno do servidor.' });
  }
}

function deleteClienteHandler(req, res) {
  try {
    const result = deleteCliente(Number(req.params.id));
    return res.status(200).json({ sucesso: true, data: result });
  } catch (err) {
    const status = err.message.includes('não encontrado') ? 404 : 400;
    return res.status(status).json({ sucesso: false, erro: err.message });
  }
}

module.exports = { postCliente, getClientes, deleteClienteHandler };
