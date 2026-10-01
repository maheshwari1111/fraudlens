const express = require('express');
const cors = require('cors');
const env = require('./config/env');
const { errorHandler, notFound } = require('./middleware/errorHandler');
const { apiLimiter, securityHeaders, requestLogger } = require('./middleware/security');

const app = express();

// Security middleware
app.use(securityHeaders);
app.use(requestLogger);
app.use(apiLimiter);
app.use(cors({ origin: env.CORS_ORIGIN }));
app.use(express.json({ limit: '10mb' }));

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', demoMode: env.DEMO_MODE, timestamp: new Date() });
});

// API routes
app.use('/api/transactions', require('./routes/transactions'));
app.use('/api/alerts', require('./routes/alerts'));
app.use('/api/investigations', require('./routes/investigations'));
app.use('/api/cases', require('./routes/cases'));
app.use('/api/dashboard', require('./routes/dashboard'));
app.use('/api/customers', require('./routes/customers'));

// Serve frontend build in production
if (process.env.NODE_ENV === 'production') {
  const path = require('path');
  const frontendDist = path.join(__dirname, '../../frontend/dist');
  app.use(express.static(frontendDist));
  app.get('*', (req, res) => {
    if (!req.path.startsWith('/api')) {
      res.sendFile(path.join(frontendDist, 'index.html'));
    }
  });
}

app.use(notFound);
app.use(errorHandler);

module.exports = app;
