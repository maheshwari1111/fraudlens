const express = require('express');
const Investigation = require('../models/Investigation');
const Transaction = require('../models/Transaction');
const Customer = require('../models/Customer');
const Alert = require('../models/Alert');
const AuditLog = require('../models/AuditLog');
const Report = require('../models/Report');
const { askCopilot } = require('../services/copilotService');
const { deriveCaseId } = require('../services/caseId');
const { validateAreas, AREA_LABELS } = require('../services/agents/focusAgent');

const router = express.Router();

// GET /api/cases/:id/meta — investigation areas supported by a re-investigation
router.get('/:id/meta', async (req, res, next) => {
  try {
    const investigation = await Investigation.findOne({ caseId: req.params.id }).select('caseId focusAreas lastFocusResult').lean();
    if (!investigation) return res.status(404).json({ error: 'Case not found' });
    res.json({
      caseId: investigation.caseId,
      focusAreas: investigation.focusAreas || [],
      lastFocusResult: investigation.lastFocusResult || null,
      availableAreas: Object.entries(AREA_LABELS).map(([value, label]) => ({ value, label })),
    });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/cases
 * Enriched with transaction amount and a human-review status so the case
 * inventory can be sorted/triaged without extra requests.
 * Supports ?search= &status= &risk=
 */
router.get('/', async (req, res, next) => {
  try {
    const { search, status, risk } = req.query;

    const query = {};
    if (status && status !== 'ALL') query.status = status;
    if (risk && risk !== 'ALL') query.riskLevel = risk;

    let cases = await Investigation.find(query).sort({ createdAt: -1 }).limit(200).lean();

    if (search) {
      const q = String(search).toLowerCase();
      cases = cases.filter(
        (c) =>
          c.caseId?.toLowerCase().includes(q) ||
          c.customerId?.toLowerCase().includes(q) ||
          c.transactionId?.toLowerCase().includes(q)
      );
    }

    const txnIds = [...new Set(cases.map((c) => c.transactionId))];
    const custIds = [...new Set(cases.map((c) => c.customerId))];
    const [txns, customers] = await Promise.all([
      Transaction.find({ transactionId: { $in: txnIds } })
        .select('transactionId amount location deviceId timestamp')
        .lean(),
      Customer.find({ customerId: { $in: custIds } }).select('customerId name').lean(),
    ]);

    const txnMap = new Map(txns.map((t) => [t.transactionId, t]));
    const custMap = new Map(customers.map((c) => [c.customerId, c]));

    res.json(
      cases.map((c) => {
        const txn = txnMap.get(c.transactionId) || null;
        const decision = c.humanDecision || {};
        return {
          ...c,
          amount: txn?.amount ?? null,
          location: txn?.location ?? null,
          deviceId: txn?.deviceId ?? null,
          transactionTimestamp: txn?.timestamp ?? null,
          customerName: custMap.get(c.customerId)?.name || null,
          humanReviewStatus: decision.action || (c.status === 'AWAITING_HUMAN_REVIEW' ? 'PENDING' : 'NOT_REQUIRED'),
          evidenceCount: (c.evidence || []).length,
          agentCount: (c.agentResults || []).length,
        };
      })
    );
  } catch (err) {
    next(err);
  }
});

// GET /api/cases/:id
router.get('/:id', async (req, res, next) => {
  try {
    const investigation = await Investigation.findOne({ caseId: req.params.id });
    if (!investigation) return res.status(404).json({ error: 'Case not found' });
    const [transaction, customer, alerts] = await Promise.all([
      Transaction.findOne({ transactionId: investigation.transactionId }),
      Customer.findOne({ customerId: investigation.customerId }),
      Alert.find({ customerId: investigation.customerId }).sort({ createdAt: -1 }),
    ]);
    res.json({ investigation, transaction, customer, alerts });
  } catch (err) {
    next(err);
  }
});

// POST /api/cases/:id/review
router.post('/:id/review', async (req, res, next) => {
  try {
    const { action, note, decidedBy, areas } = req.body;
    const validActions = ['CLOSE_APPROVE', 'ESCALATE', 'REQUEST_INVESTIGATION', 'FALSE_POSITIVE'];
    if (!validActions.includes(action)) {
      return res.status(400).json({ error: `action must be one of: ${validActions.join(', ')}` });
    }
    const investigation = await Investigation.findOne({ caseId: req.params.id });
    if (!investigation) return res.status(404).json({ error: 'Case not found' });

    const { areas: cleanAreas, invalid } = validateAreas(areas);
    if (invalid.length) {
      return res.status(400).json({ error: `Unsupported investigation area(s): ${invalid.join(', ')}` });
    }

    investigation.humanDecision = {
      action,
      note: note || '',
      decidedBy: decidedBy || 'investigator',
      decidedAt: new Date(),
      areas: cleanAreas,
    };
    investigation.status =
      action === 'ESCALATE' ? 'ESCALATED'
      : action === 'FALSE_POSITIVE' ? 'FALSE_POSITIVE'
      : action === 'REQUEST_INVESTIGATION' ? 'IN_PROGRESS'
      : 'CLOSED';
    await investigation.save();

    await AuditLog.create({
      caseId: investigation.caseId,
      action: `HUMAN_REVIEW_${action}`,
      actor: decidedBy || 'investigator',
      details: {
        note: note || '',
        riskLevel: investigation.riskLevel,
        riskScore: investigation.riskScore,
        ...(cleanAreas.length ? { requestedAreas: cleanAreas, requestedAreaLabels: cleanAreas.map((a) => AREA_LABELS[a]) } : {}),
      },
    });

    res.json(investigation);
  } catch (err) {
    next(err);
  }
});

// POST /api/cases/:id/copilot
router.post('/:id/copilot', async (req, res, next) => {
  try {
    const { question } = req.body;
    if (!question) return res.status(400).json({ error: 'question is required' });
    const investigation = await Investigation.findOne({ caseId: req.params.id });
    if (!investigation) return res.status(404).json({ error: 'Case not found' });
    const transaction = await Transaction.findOne({ transactionId: investigation.transactionId });
    const customer = await Customer.findOne({ customerId: investigation.customerId });
    const { analyzeDevice } = require('../services/agents/deviceAgent');
    // Exclude the case under review so the copilot never reports the current
    // case as a "previous case" about itself.
    const deviceAnalysis = await analyzeDevice({ transaction, customer, excludeCaseId: investigation.caseId });
    const { analyzeLocation } = require('../services/agents/locationAgent');
    const locationAnalysis = await analyzeLocation({ transaction, customer });

    const answer = await askCopilot({
      question,
      investigation,
      transaction,
      customer,
      evidence: investigation.evidence,
      risk: { score: investigation.riskScore, level: investigation.riskLevel, factors: investigation.riskFactors },
      deviceAnalysis,
      locationAnalysis,
    });

    await AuditLog.create({
      caseId: investigation.caseId,
      action: 'COPILOT_QUERY',
      actor: 'investigator',
      details: { question, answer },
    });

    res.json({ question, answer });
  } catch (err) {
    next(err);
  }
});

// GET /api/cases/:id/report
router.get('/:id/report', async (req, res, next) => {
  try {
    const report = await Report.findOne({ caseId: req.params.id });
    if (!report) return res.status(404).json({ error: 'Report not found — run an investigation first' });
    res.json(report);
  } catch (err) {
    next(err);
  }
});

// GET /api/cases/:id/audit
router.get('/:id/audit', async (req, res, next) => {
  try {
    const logs = await AuditLog.find({ caseId: req.params.id }).sort({ timestamp: -1 });
    res.json(logs);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
