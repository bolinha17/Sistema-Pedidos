const { listarPedidosV2 } = require('../services/pedidoV2Service');

function getPedidosV2(req, res) {
  try {
    const { status } = req.query;
    const pedidos = listarPedidosV2({ status });

    return res.status(200).json({
      success: true,
      message: 'Pedidos listados com sucesso.',
      data: pedidos,
    });
  } catch (err) {
    if (err.code === 'VALIDATION_ERROR') {
      return res.status(400).json({
        success: false,
        message: err.message,
        error: { code: 'VALIDATION_ERROR' },
      });
    }
    return res.status(500).json({
      success: false,
      message: 'Erro interno do servidor.',
      error: { code: 'INTERNAL_ERROR' },
    });
  }
}

module.exports = { getPedidosV2 };
