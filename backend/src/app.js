const express = require('express');
const path = require('path');
const cors = require('cors');
const env = require('./config/env');
const { errorHandler, notFound } = require('./middleware/errorHandler');
const { readLimiter, limitWrites, securityHeaders, requestLogger } = require('./middleware/security');

const app = express();

app.disable('x-powered-by');

// Security + observability middleware
app.use(securityHeaders);
app.use(requestLogger);
app.use(cors({ origin: env.CORS_ORIGIN === '*' ? true : env.CORS_ORIGIN.split(',').map((s) => s.trim()), credentials: false }));
app.use(express.json({ limit: '1mb' }));

// Rate limiting: generous on reads, strict on writes
app.use('/api', readLimiter, limitWrites);

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    demoMode: env.DEMO_MODE,
    llmConfigured: Boolean(env.LLM_API_KEY),
    environment: env.NODE_ENV,
    timestamp: new Date().toISOString(),
  });
});

// API routes
app.use('/api/transactions', require('./routes/transactions'));
app.use('/api/alerts', require('./routes/alerts'));
app.use('/api/investigations', require('./routes/investigations'));
app.use('/api/cases', require('./routes/cases'));
app.use('/api/dashboard', require('./routes/dashboard'));
app.use('/api/customers', require('./routes/customers'));

// Serve the built frontend in production (single-origin deployment)
if (env.NODE_ENV === 'production') {
  const frontendDist = path.join(__dirname, '../../frontend/dist');
  app.use(express.static(frontendDist, { maxAge: '1d', index: false }));
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api')) return next();
    res.sendFile(path.join(frontendDist, 'index.html'));
  });
}

app.use(notFound);
app.use(errorHandler);

module.exports = app;
