const express = require('express');
const Investigation = require('../models/Investigation');
const Transaction = require('../models/Transaction');
const Customer = require('../models/Customer');
const Alert = require('../models/Alert');
const AuditLog = require('../models/AuditLog');
const Report = require('../models/Report');
const { askCopilot } = require('../services/copilotService');

const router = express.Router();

// GET /api/cases
router.get('/', async (req, res, next) => {
  try {
    const cases = await Investigation.find().sort({ createdAt: -1 }).limit(100);
    res.json(cases);
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
    const { action, note, decidedBy } = req.body;
    const validActions = ['CLOSE_APPROVE', 'ESCALATE', 'REQUEST_INVESTIGATION', 'FALSE_POSITIVE'];
    if (!validActions.includes(action)) {
      return res.status(400).json({ error: `action must be one of: ${validActions.join(', ')}` });
    }
    const investigation = await Investigation.findOne({ caseId: req.params.id });
    if (!investigation) return res.status(404).json({ error: 'Case not found' });

    investigation.humanDecision = { action, note: note || '', decidedBy: decidedBy || 'investigator', decidedAt: new Date() };
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
      details: { note: note || '', riskLevel: investigation.riskLevel, riskScore: investigation.riskScore },
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
    const deviceAnalysis = await analyzeDevice({ transaction, customer });
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
