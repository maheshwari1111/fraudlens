const express = require('express');
const Customer = require('../models/Customer');
const Transaction = require('../models/Transaction');

const router = express.Router();

// GET /api/customers/:id
router.get('/:id', async (req, res, next) => {
  try {
    const customer = await Customer.findOne({ customerId: req.params.id });
    if (!customer) return res.status(404).json({ error: 'Customer not found' });
    const transactions = await Transaction.find({ customerId: customer.customerId }).sort({ timestamp: -1 }).limit(50);
    res.json({ customer, transactions });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
