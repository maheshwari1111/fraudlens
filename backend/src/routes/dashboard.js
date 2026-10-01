const express = require('express');
const Transaction = require('../models/Transaction');
const Alert = require('../models/Alert');
const Investigation = require('../models/Investigation');
const AgentLog = require('../models/AgentLog');

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

    // Attach transaction amounts to recent cases so the table needs no
    // extra round-trips from the browser.
    const recentCaseIds = recentCases.map((c) => c.transactionId);
    const recentTxns = await Transaction.find({ transactionId: { $in: recentCaseIds } }).select('transactionId amount');
    const txnMap = new Map(recentTxns.map((t) => [t.transactionId, t.amount]));
    const enrichedRecent = recentCases.map((c) => ({
      ...c.toObject(),
      amount: txnMap.get(c.transactionId) ?? null,
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

/**
 * GET /api/dashboard/agent-activity
 *
 * Live view of the investigation pipeline, read from the real AgentLog written
 * by the Supervisor. No statuses are invented here — if no agent has run, the
 * endpoint returns an empty pipeline and the UI says so.
 */
router.get('/agent-activity', async (req, res, next) => {
  try {
    // The case the dashboard reports on: most recently updated investigation
    // that has actually produced agent results.
    const focusCase = await Investigation.findOne({ 'agentResults.0': { $exists: true } })
      .sort({ updatedAt: -1 })
      .select('caseId status riskScore riskLevel updatedAt investigationCycles')
      .lean();

    const caseFilter = focusCase ? { caseId: focusCase.caseId } : {};

    // Latest log per agent for the focus case (newest cycle wins).
    const logs = await AgentLog.find(caseFilter).sort({ timestamp: -1 }).limit(400).lean();

    const latestByAgent = new Map();
    for (const log of logs) {
      const existing = latestByAgent.get(log.agentName);
      if (!existing || log.cycle > existing.cycle || (log.cycle === existing.cycle && new Date(log.timestamp) > new Date(existing.timestamp))) {
        latestByAgent.set(log.agentName, log);
      }
    }

    const agents = [...latestByAgent.values()]
      .map((log) => ({
        agentName: log.agentName,
        caseId: log.caseId,
        status: log.status,
        cycle: log.cycle,
        duration: log.duration,
        timestamp: log.timestamp,
        finding: log.outputSummary,
        input: log.inputSummary,
        evidenceCount: (log.evidenceIds || []).length,
        evidenceIds: log.evidenceIds || [],
      }))
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    const recentLogs = logs.slice(0, 20).map((log) => ({
      agentName: log.agentName,
      caseId: log.caseId,
      status: log.status,
      cycle: log.cycle,
      duration: log.duration,
      timestamp: log.timestamp,
      finding: log.outputSummary,
      evidenceCount: (log.evidenceIds || []).length,
    }));

    res.json({
      caseId: focusCase?.caseId || null,
      caseStatus: focusCase?.status || null,
      riskScore: focusCase?.riskScore ?? null,
      riskLevel: focusCase?.riskLevel || null,
      investigationCycles: focusCase?.investigationCycles ?? null,
      updatedAt: focusCase?.updatedAt || null,
      agents,
      recentLogs,
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
