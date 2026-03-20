// Observability: track response time and error counts per route
const metrics = {
  requests: {},
  errors: {},
};

function metricsMiddleware(req, res, next) {
  const start = Date.now();
  const route = `${req.method} ${req.path}`;

  res.on('finish', () => {
    const duration = Date.now() - start;

    if (!metrics.requests[route]) {
      metrics.requests[route] = { count: 0, totalMs: 0 };
    }
    metrics.requests[route].count++;
    metrics.requests[route].totalMs += duration;

    if (res.statusCode >= 400) {
      if (!metrics.errors[route]) metrics.errors[route] = 0;
      metrics.errors[route]++;
    }

    console.log(
      `[${new Date().toISOString()}] ${route} → ${res.statusCode} (${duration}ms)`
    );
  });

  next();
}

function getMetrics() {
  const summary = {};
  for (const route in metrics.requests) {
    const { count, totalMs } = metrics.requests[route];
    summary[route] = {
      requisicoes: count,
      media_ms: count > 0 ? Math.round(totalMs / count) : 0,
      erros: metrics.errors[route] || 0,
    };
  }
  return summary;
}

module.exports = { metricsMiddleware, getMetrics };
