const {
  criarPedido,
  listarPedidos,
  adicionarItem,
  aplicarCupom,
  finalizarPedido,
  cancelarPedido,
  deletePedido,
} = require('../services/pedidoService');

function postPedido(req, res) {
  try {
    const pedido = criarPedido(req.body);
    return res.status(201).json({ sucesso: true, data: pedido });
  } catch (err) {
    const status = err.message.includes('não encontrado') ? 404 : 400;
    return res.status(status).json({ sucesso: false, erro: err.message });
  }
}

function getPedidos(req, res) {
  try {
    const { status, cliente_id } = req.query;
    const pedidos = listarPedidos({ status, cliente_id });
    return res.status(200).json({ sucesso: true, data: pedidos });
  } catch (err) {
    return res.status(500).json({ sucesso: false, erro: 'Erro interno do servidor.' });
  }
}

function postAdicionarItem(req, res) {
  try {
    const pedido = adicionarItem(Number(req.params.id), req.body);
    return res.status(200).json({ sucesso: true, data: pedido });
  } catch (err) {
    const status = err.message.includes('não encontrado') ? 404 : 400;
    return res.status(status).json({ sucesso: false, erro: err.message });
  }
}

function postAplicarCupom(req, res) {
  try {
    const pedido = aplicarCupom(Number(req.params.id), req.body.codigo);
    return res.status(200).json({ sucesso: true, data: pedido });
  } catch (err) {
    const status = err.message.includes('não encontrado') ? 404 : 400;
    return res.status(status).json({ sucesso: false, erro: err.message });
  }
}

function postFinalizarPedido(req, res) {
  try {
    const pedido = finalizarPedido(Number(req.params.id));
    return res.status(200).json({ sucesso: true, data: pedido });
  } catch (err) {
    const status = err.message.includes('não encontrado') ? 404 : 400;
    return res.status(status).json({ sucesso: false, erro: err.message });
  }
}

function postCancelarPedido(req, res) {
  try {
    const pedido = cancelarPedido(Number(req.params.id));
    return res.status(200).json({ sucesso: true, data: pedido });
  } catch (err) {
    const status = err.message.includes('não encontrado') ? 404 : 400;
    return res.status(status).json({ sucesso: false, erro: err.message });
  }
}

function deletePedidoHandler(req, res) {
  try {
    const result = deletePedido(Number(req.params.id));
    return res.status(200).json({ sucesso: true, data: result });
  } catch (err) {
    const status = err.message.includes('não encontrado') ? 404 : 400;
    return res.status(status).json({ sucesso: false, erro: err.message });
  }
}

module.exports = {
  postPedido, getPedidos, postAdicionarItem,
  postAplicarCupom, postFinalizarPedido, postCancelarPedido, deletePedidoHandler,
};
