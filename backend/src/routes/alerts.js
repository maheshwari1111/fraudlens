const express = require('express');
const Alert = require('../models/Alert');
const Transaction = require('../models/Transaction');
const Customer = require('../models/Customer');
const Investigation = require('../models/Investigation');
const { deriveCaseId } = require('../services/caseId');

const router = express.Router();

/**
 * GET /api/alerts
 *
 * Alerts are enriched with the subject transaction and customer so the alert
 * triage table can show amount / location / device without extra round-trips.
 * Supports ?search= &severity= &status= &from= &to=
 */
router.get('/', async (req, res, next) => {
  try {
    const { search, severity, status, from, to } = req.query;

    const query = {};
    if (severity && severity !== 'ALL') query.severity = severity;
    if (status && status !== 'ALL') query.status = status;
    if (from || to) {
      query.createdAt = {};
      if (from) query.createdAt.$gte = new Date(from);
      if (to) query.createdAt.$lte = new Date(to);
    }

    let alerts = await Alert.find(query).sort({ createdAt: -1 }).limit(200).lean();

    if (search) {
      const q = String(search).toLowerCase();
      alerts = alerts.filter(
        (a) =>
          a.alertId?.toLowerCase().includes(q) ||
          a.transactionId?.toLowerCase().includes(q) ||
          a.customerId?.toLowerCase().includes(q)
      );
    }

    const txnIds = [...new Set(alerts.map((a) => a.transactionId))];
    const custIds = [...new Set(alerts.map((a) => a.customerId))];

    const [txns, customers] = await Promise.all([
      Transaction.find({ transactionId: { $in: txnIds } })
        .select('transactionId amount location deviceId timestamp status transactionType merchant')
        .lean(),
      Customer.find({ customerId: { $in: custIds } }).select('customerId name').lean(),
    ]);

    const txnMap = new Map(txns.map((t) => [t.transactionId, t]));
    const custMap = new Map(customers.map((c) => [c.customerId, c]));

    // Which alerts already have a case on file? Lets the UI offer "View Case"
    // only where it leads somewhere, without the browser guessing IDs.
    const candidateCaseIds = alerts.map((a) => a.relatedCaseId || deriveCaseId(a.transactionId)).filter(Boolean);
    const existingCases = await Investigation.find({ caseId: { $in: candidateCaseIds } })
      .select('caseId status riskLevel')
      .lean();
    const caseMap = new Map(existingCases.map((c) => [c.caseId, c]));

    res.json(
      alerts.map((a) => {
        const txn = txnMap.get(a.transactionId) || null;
        const cust = custMap.get(a.customerId) || null;
        const caseId = a.relatedCaseId || deriveCaseId(a.transactionId);
        const existing = caseMap.get(caseId) || null;
        return {
          ...a,
          customerName: cust?.name || null,
          amount: txn?.amount ?? null,
          location: txn?.location ?? null,
          deviceId: txn?.deviceId ?? null,
          transactionTimestamp: txn?.timestamp ?? null,
          transactionType: txn?.transactionType ?? null,
          merchant: txn?.merchant ?? null,
          transactionStatus: txn?.status ?? null,
          // Allows "VIEW CASE" to work before an investigation has been started.
          caseId,
          hasCase: Boolean(existing),
          caseStatus: existing?.status || null,
          caseRiskLevel: existing?.riskLevel || null,
        };
      })
    );
  } catch (err) {
    next(err);
  }
});

// GET /api/alerts/:id
router.get('/:id', async (req, res, next) => {
  try {
    const alert = await Alert.findOne({ alertId: req.params.id });
    if (!alert) return res.status(404).json({ error: 'Alert not found' });
    const [transaction, customer] = await Promise.all([
      Transaction.findOne({ transactionId: alert.transactionId }),
      Customer.findOne({ customerId: alert.customerId }),
    ]);
    res.json({
      ...alert.toObject(),
      customerName: customer?.name || null,
      caseId: alert.relatedCaseId || deriveCaseId(alert.transactionId),
      transaction,
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
