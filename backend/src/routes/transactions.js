const express = require('express');
const Transaction = require('../models/Transaction');
const { runInvestigation } = require('../services/agents/supervisor');

const router = express.Router();

// POST /api/transactions
router.post('/', async (req, res, next) => {
  try {
    const { transactionId, customerId, amount, transactionType, merchant, location, deviceId, timestamp } = req.body;
    if (!transactionId || !customerId || amount == null) {
      return res.status(400).json({ error: 'transactionId, customerId and amount are required' });
    }
    const txn = await Transaction.create({
      transactionId,
      customerId,
      amount,
      transactionType,
      merchant,
      location,
      deviceId,
      timestamp: timestamp ? new Date(timestamp) : new Date(),
    });
    res.status(201).json(txn);
  } catch (err) {
    next(err);
  }
});

// GET /api/transactions/:id
router.get('/:id', async (req, res, next) => {
  try {
    const txn = await Transaction.findOne({ transactionId: req.params.id });
    if (!txn) return res.status(404).json({ error: 'Transaction not found' });
    res.json(txn);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
