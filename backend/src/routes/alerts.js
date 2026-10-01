const express = require('express');
const Alert = require('../models/Alert');

const router = express.Router();

// GET /api/alerts
router.get('/', async (req, res, next) => {
  try {
    const alerts = await Alert.find().sort({ createdAt: -1 }).limit(100);
    res.json(alerts);
  } catch (err) {
    next(err);
  }
});

// GET /api/alerts/:id
router.get('/:id', async (req, res, next) => {
  try {
    const alert = await Alert.findOne({ alertId: req.params.id });
    if (!alert) return res.status(404).json({ error: 'Alert not found' });
    res.json(alert);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
