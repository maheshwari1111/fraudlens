const express = require('express');
const cors = require('cors');
const env = require('./config/env');
const { errorHandler, notFound } = require('./middleware/errorHandler');

const app = express();

app.use(cors({ origin: env.CORS_ORIGIN }));
app.use(express.json());

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', demoMode: env.DEMO_MODE, timestamp: new Date() });
});

app.use('/api/transactions', require('./routes/transactions'));
app.use('/api/alerts', require('./routes/alerts'));
app.use('/api/investigations', require('./routes/investigations'));
app.use('/api/cases', require('./routes/cases'));
app.use('/api/dashboard', require('./routes/dashboard'));
app.use('/api/customers', require('./routes/customers'));

app.use(notFound);
app.use(errorHandler);

module.exports = app;
