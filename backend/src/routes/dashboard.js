const express = require('express');
const Transaction = require('../models/Transaction');
const Alert = require('../models/Alert');
const Investigation = require('../models/Investigation');

const router = express.Router();

// GET /api/dashboard/stats
router.get('/stats', async (req, res, next) => {
  try {
    const [totalTransactions, suspiciousTransactions, activeInvestigations, highRiskCases, pendingReviews, riskDistribution, alertsOverTime, investigationStatus, recentCases] = await Promise.all([
      Transaction.countDocuments(),
      Transaction.countDocuments({ status: { $in: ['FLAGGED', 'BLOCKED'] } }),
      Investigation.countDocuments({ status: 'IN_PROGRESS' }),
      Investigation.countDocuments({ riskLevel: { $in: ['HIGH', 'CRITICAL'] } }),
      Investigation.countDocuments({ status: 'AWAITING_HUMAN_REVIEW' }),
      Investigation.aggregate([{ $group: { _id: '$riskLevel', count: { $sum: 1 } } }]),
      Alert.aggregate([
        {
          $group: {
            _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
            count: { $sum: 1 },
          },
        },
        { $sort: { _id: 1 } },
        { $limit: 30 },
      ]),
      Investigation.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }]),
      Investigation.find().sort({ createdAt: -1 }).limit(8),
    ]);

  // Attach transaction amounts to recent cases
  const recentCaseIds = recentCases.map((c) => c.transactionId);
  const recentTxns = await Transaction.find({ transactionId: { $in: recentCaseIds } }).select('transactionId amount');
  const txnMap = new Map(recentTxns.map((t) => [t.transactionId, t.amount]));
  const enrichedRecent = recentCases.map((c) => ({
    ...c.toObject(),
    amount: txnMap.get(c.transactionId) || null,
  }));

    res.json({
      totalTransactions,
      suspiciousTransactions,
      activeInvestigations,
      highRiskCases,
      pendingHumanReviews: pendingReviews,
      riskDistribution: riskDistribution.reduce((acc, r) => ({ ...acc, [r._id]: r.count }), {}),
      alertsOverTime: alertsOverTime.map((a) => ({ date: a._id, count: a.count })),
      investigationStatus: investigationStatus.reduce((acc, s) => ({ ...acc, [s._id]: s.count }), {}),
      recentCases: enrichedRecent,
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
