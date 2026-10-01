const Investigation = require('../../models/Investigation');
const AgentLog = require('../../models/AgentLog');
const Report = require('../../models/Report');
const AuditLog = require('../../models/AuditLog');
const Transaction = require('../../models/Transaction');
const Customer = require('../../models/Customer');
const Alert = require('../../models/Alert');
const { EvidenceRegistry } = require('../evidence');

const { analyzeTransaction } = require('./transactionAgent');
const { analyzeBehaviour } = require('./behaviourAgent');
const { detectAnomalies } = require('./anomalyAgent');
const { analyzeDevice } = require('./deviceAgent');
const { analyzeLocation } = require('./locationAgent');
const { buildRelationshipGraph } = require('./relationshipAgent');
const { investigate } = require('./investigationAgent');
const { calculateRisk } = require('./riskEngine');
const { generateReport } = require('./reportAgent');

/**
 * Supervisor Agent — orchestrates the full investigation pipeline.
 *
 * Pipeline:
 *   1. Create investigation record
 *   2. Run analysis agents (parallel where safe)
 *   3. Combine evidence into a single registry
 *   4. Investigation Agent (LLM, grounded in evidence)
 *   5. Deterministic Risk Engine
 *   6. Human-review determination
 *   7. Report generation
 *   8. AgentLog + AuditLog recording
 *
 * If an individual agent fails, the failure is logged and the investigation
 * continues with the evidence available (marked PARTIAL).
 */
async function runInvestigation({ alertId, transactionId, customerId, cycle = 1, requestedBy = 'system' }) {
  const startedAt = Date.now();

  // --- Load core entities -------------------------------------------------
  const transaction = await Transaction.findOne({ transactionId });
  if (!transaction) throw new Error(`Transaction ${transactionId} not found`);

  const customer = await Customer.findOne({ customerId: customerId || transaction.customerId });
  if (!customer) throw new Error(`Customer ${customerId || transaction.customerId} not found`);

  const alert = alertId ? await Alert.findOne({ alertId }) : null;

  // --- Create or fetch investigation --------------------------------------
  let investigation = await Investigation.findOne({ transactionId });
  if (!investigation) {
    // Derive case ID from transaction ID: TX1042 → CASE-1042
    const numericPart = transactionId.replace(/\D/g, '');
    const caseId = `CASE-${numericPart}`;
    investigation = await Investigation.create({
      caseId,
      alertId: alert ? alert.alertId : null,
      transactionId,
      customerId: customer.customerId,
      status: 'IN_PROGRESS',
      investigationCycles: cycle,
    });
  } else if (cycle > 1) {
    investigation.investigationCycles = cycle;
    investigation.status = 'IN_PROGRESS';
  }

  const evidence = new EvidenceRegistry();
  const agentResults = [];
  const logAgent = async (name, fn, inputSummary) => {
    const t0 = Date.now();
    try {
      const result = await fn();
      const duration = Date.now() - t0;
      agentResults.push({
        agentName: name,
        status: 'SUCCESS',
        summary: result.summary || `${name} completed`,
        evidenceIds: result.evidence ? result.evidence.map((e) => e.evidenceId) : [],
        anomalies: result.anomalies || [],
        data: result.data || result,
        duration,
      });
      await AgentLog.create({
        caseId: investigation.caseId,
        agentName: name,
        status: 'SUCCESS',
        inputSummary,
        outputSummary: result.summary || `${name} completed`,
        evidenceIds: result.evidence ? result.evidence.map((e) => e.evidenceId) : [],
        cycle,
        duration,
      });
      return result;
    } catch (err) {
      const duration = Date.now() - t0;
      agentResults.push({
        agentName: name,
        status: 'FAILED',
        summary: `${name} failed: ${err.message}`,
        duration,
        error: err.message,
      });
      await AgentLog.create({
        caseId: investigation.caseId,
        agentName: name,
        status: 'FAILED',
        inputSummary,
        outputSummary: `Failed: ${err.message}`,
        cycle,
        duration,
      });
      return null;
    }
  };

  // --- Phase 1: parallel deterministic analysis ---------------------------
  const [txnAnalysis, behaviour, deviceAnalysis, locationAnalysis] = await Promise.all([
    logAgent('TransactionAgent', () => analyzeTransaction({ transaction, customer }), `transaction=${transaction.transactionId}`),
    logAgent('BehaviourAgent', () => analyzeBehaviour({ transaction, customer }), `customer=${customer.customerId}`),
    logAgent('DeviceAgent', () => analyzeDevice({ transaction, customer, excludeCaseId: investigation.caseId }), `device=${transaction.deviceId}`),
    logAgent('LocationAgent', () => analyzeLocation({ transaction, customer }), `location=${transaction.location}`),
  ]);

  // --- Phase 2: anomaly detection (depends on txn + behaviour) ------------
  const anomalies = await logAgent('AnomalyAgent', () => {
    const result = detectAnomalies({
      transaction,
      customer,
      behaviour: behaviour || { evidence: [] },
      transactionAnalysis: txnAnalysis || { velocity: { last24hCount: 0 } },
    });
    return { anomalies: result, summary: `${result.length} anomaly type(s) detected` };
  }, `transaction=${transaction.transactionId}`);

  // --- Phase 3: relationship graph (depends on device analysis) ------------
  const graph = await logAgent('PatternAgent', () =>
    buildRelationshipGraph({
      transaction,
      customer,
      deviceAnalysis: deviceAnalysis || { relatedCustomers: [], previousCases: [] },
    }), `transaction=${transaction.transactionId}`);

  // --- Combine evidence into the registry ---------------------------------
  const collectEvidence = (agentEvidence) => {
    for (const e of agentEvidence || []) {
      evidence.add({ type: e.type, description: e.description, severity: e.severity, source: e.source, details: e.details || {} });
    }
  };
  collectEvidence(txnAnalysis?.evidence);
  collectEvidence(behaviour?.evidence);
  collectEvidence(deviceAnalysis?.evidence);
  collectEvidence(locationAnalysis?.evidence);

  // Anomaly evidence (map anomaly types to evidence entries)
  for (const a of anomalies?.anomalies || []) {
    evidence.add({
      type: a.type,
      description: a.description,
      severity: a.severity,
      source: 'AnomalyAgent',
      details: a.details || {},
    });
  }

  // --- Phase 4: Investigation Agent (LLM, grounded) -----------------------
  const investigationSummary = await logAgent('InvestigationAgent', () =>
    investigate({
      caseId: investigation.caseId,
      transaction,
      customer,
      evidence,
      anomalies: anomalies?.anomalies || [],
      deviceAnalysis: deviceAnalysis || {},
      locationAnalysis: locationAnalysis || {},
      relationshipGraph: graph || { nodes: [], edges: [] },
    }), `evidence=${evidence.all().length} items`);

  // --- Phase 5: Deterministic Risk Engine ---------------------------------
  const risk = calculateRisk(anomalies?.anomalies || [], evidence.all());
  agentResults.push({
    agentName: 'RiskEngine',
    status: 'SUCCESS',
    summary: `Score ${risk.score}/100 (${risk.level})`,
    evidenceIds: risk.factors.flatMap((f) => f.evidenceIds),
    data: risk,
    duration: 0,
  });
  await AgentLog.create({
    caseId: investigation.caseId,
    agentName: 'RiskEngine',
    status: 'SUCCESS',
    inputSummary: `evidence=${evidence.all().length} items`,
    outputSummary: `Score ${risk.score}/100 (${risk.level})`,
    evidenceIds: risk.factors.flatMap((f) => f.evidenceIds),
    cycle,
    duration: 0,
  });

  // --- Phase 6: human-review determination + persistence -------------------
  const requiresHumanReview = risk.level === 'HIGH' || risk.level === 'CRITICAL';
  investigation.evidence = evidence.all();
  investigation.agentResults = agentResults;
  investigation.investigationSummary = investigationSummary;
  investigation.riskScore = risk.score;
  investigation.riskLevel = risk.level;
  investigation.riskFactors = risk.factors;
  investigation.recommendation = requiresHumanReview
    ? 'HUMAN INVESTIGATION REQUIRED'
    : 'No immediate human action required';
  investigation.status = requiresHumanReview ? 'AWAITING_HUMAN_REVIEW' : 'CLOSED';
  await investigation.save();

  if (alert) {
    alert.status = 'UNDER_INVESTIGATION';
    alert.relatedCaseId = investigation.caseId;
    await alert.save();
  }

  await AuditLog.create({
    caseId: investigation.caseId,
    action: cycle > 1 ? 'REINVESTIGATION_COMPLETED' : 'INVESTIGATION_COMPLETED',
    actor: requestedBy,
    details: {
      riskScore: risk.score,
      riskLevel: risk.level,
      evidenceCount: evidence.all().length,
      agentCount: agentResults.length,
      duration: Date.now() - startedAt,
      cycle,
    },
  });

  // --- Phase 7: Report -----------------------------------------------------
  const report = await generateReport({
    investigation,
    transaction,
    customer,
    evidence,
    agentResults,
    risk,
    graph,
  });
  await Report.findOneAndUpdate({ caseId: investigation.caseId }, report, { upsert: true, new: true });

  return { investigation, report, risk, evidence: evidence.all(), agentResults };
}

module.exports = { runInvestigation };
