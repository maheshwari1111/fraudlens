/** Centralized Express error handler — safe error messages, no stack leakage. */
// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, next) {
  console.error(`[error] ${req.method} ${req.path}: ${err.message}`);

  if (err.name === 'ValidationError') {
    return res.status(400).json({ error: 'Validation failed', details: Object.values(err.errors).map((e) => e.message) });
  }
  if (err.name === 'CastError') {
    return res.status(400).json({ error: 'Invalid identifier format' });
  }
  if (err.code === 11000) {
    return res.status(409).json({ error: 'Duplicate key', details: err.keyValue });
  }
  if (err.message && err.message.includes('not found')) {
    return res.status(404).json({ error: err.message });
  }

  res.status(err.status || 500).json({ error: err.message || 'Internal server error' });
}

function notFound(req, res) {
  res.status(404).json({ error: `Route not found: ${req.method} ${req.path}` });
}

module.exports = { errorHandler, notFound };
