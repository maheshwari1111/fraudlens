const express = require('express');
const Investigation = require('../models/Investigation');
const Transaction = require('../models/Transaction');
const Customer = require('../models/Customer');
const { runInvestigation } = require('../services/agents/supervisor');

const router = express.Router();

// POST /api/investigations/start
router.post('/start', async (req, res, next) => {
  try {
    const { alertId, transactionId, customerId } = req.body;
    if (!transactionId) return res.status(400).json({ error: 'transactionId is required' });
    const result = await runInvestigation({ alertId, transactionId, customerId, cycle: 1, requestedBy: req.body.requestedBy || 'system' });
    res.status(201).json(result);
  } catch (err) {
    next(err);
  }
});

// GET /api/investigations/:id
router.get('/:id', async (req, res, next) => {
  try {
    const investigation = await Investigation.findOne({ caseId: req.params.id });
    if (!investigation) return res.status(404).json({ error: 'Investigation not found' });
    res.json(investigation);
  } catch (err) {
    next(err);
  }
});

// GET /api/investigations/:id/evidence
router.get('/:id/evidence', async (req, res, next) => {
  try {
    const investigation = await Investigation.findOne({ caseId: req.params.id });
    if (!investigation) return res.status(404).json({ error: 'Investigation not found' });
    res.json(investigation.evidence);
  } catch (err) {
    next(err);
  }
});

// GET /api/investigations/:id/agents
router.get('/:id/agents', async (req, res, next) => {
  try {
    const investigation = await Investigation.findOne({ caseId: req.params.id });
    if (!investigation) return res.status(404).json({ error: 'Investigation not found' });
    res.json(investigation.agentResults);
  } catch (err) {
    next(err);
  }
});

// GET /api/investigations/:id/graph
router.get('/:id/graph', async (req, res, next) => {
  try {
    const investigation = await Investigation.findOne({ caseId: req.params.id });
    if (!investigation) return res.status(404).json({ error: 'Investigation not found' });
    const { buildRelationshipGraph } = require('../services/agents/relationshipAgent');
    const transaction = await Transaction.findOne({ transactionId: investigation.transactionId });
    const customer = await Customer.findOne({ customerId: investigation.customerId });
    const { analyzeDevice } = require('../services/agents/deviceAgent');
    const deviceAnalysis = await analyzeDevice({ transaction, customer });
    const graph = await buildRelationshipGraph({ transaction, customer, deviceAnalysis });
    res.json(graph);
  } catch (err) {
    next(err);
  }
});

// POST /api/investigations/:id/reinvestigate
router.post('/:id/reinvestigate', async (req, res, next) => {
  try {
    const investigation = await Investigation.findOne({ caseId: req.params.id });
    if (!investigation) return res.status(404).json({ error: 'Investigation not found' });
    const result = await runInvestigation({
      alertId: investigation.alertId,
      transactionId: investigation.transactionId,
      customerId: investigation.customerId,
      cycle: investigation.investigationCycles + 1,
      requestedBy: req.body.requestedBy || 'system',
    });
    res.json(result);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
