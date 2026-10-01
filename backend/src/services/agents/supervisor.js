const Investigation = require('../../models/Investigation');
const AgentLog = require('../../models/AgentLog');
const Report = require('../../models/Report');
const AuditLog = require('../../models/AuditLog');
const Transaction = require('../../models/Transaction');
const Customer = require('../../models/Customer');
const Alert = require('../../models/Alert');
const { EvidenceRegistry } = require('../evidence');
const { deriveCaseId } = require('../caseId');

const { analyzeTransaction } = require('./transactionAgent');
const { analyzeBehaviour } = require('./behaviourAgent');
const { detectAnomalies } = require('./anomalyAgent');
const { analyzeDevice } = require('./deviceAgent');
const { analyzeLocation } = require('./locationAgent');
const { buildRelationshipGraph } = require('./relationshipAgent');
const { runFocusAnalysis, validateAreas, AREA_LABELS } = require('./focusAgent');
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
 *   3b. Optional focused deep-dive ("Request Additional Investigation")
 *   4. Investigation Agent (LLM, grounded in evidence)
 *   5. Deterministic Risk Engine
 *   6. Human-review determination
 *   7. Report generation
 *   8. AgentLog + AuditLog recording
 *
 * If an individual agent fails, the failure is logged and the investigation
 * continues with the evidence available (marked PARTIAL).
 */
async function runInvestigation({ alertId, transactionId, customerId, cycle = 1, requestedBy = 'system', focusAreas = null }) {
  const startedAt = Date.now();

  const { areas, invalid: invalidAreas } = validateAreas(focusAreas);

  // --- Load core entities -------------------------------------------------
  const transaction = await Transaction.findOne({ transactionId });
  if (!transaction) throw new Error(`Transaction ${transactionId} not found`);

  const customer = await Customer.findOne({ customerId: customerId || transaction.customerId });
  if (!customer) throw new Error(`Customer ${customerId || transaction.customerId} not found`);

  const alert = alertId ? await Alert.findOne({ alertId }) : null;

  // --- Create or fetch investigation --------------------------------------
  let investigation = await Investigation.findOne({ transactionId });
  if (!investigation) {
    // Case ID is derived from the transaction ID: TX1042 → CASE-1042
    const caseId = deriveCaseId(transactionId);
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

  /**
   * Builds a short, factual finding for an agent from the result it returned.
   * Agents do not all expose a `summary`; without this the log would only say
   * "DeviceAgent completed", which tells an investigator nothing. Every string
   * here is composed from values already present in the agent's own output.
   */
  const describeResult = (name, result) => {
    if (!result) return null;
    if (result.summary) return result.summary;

    const money = (n) => `₹${Number(n).toLocaleString('en-IN')}`;

    switch (name) {
      case 'TransactionAgent': {
        const v = result.velocity || {};
        return `${v.recentCount ?? 0} transaction(s) in the last 30 days, ${v.last24hCount ?? 0} in the last 24h totalling ${money(v.last24hAmount ?? 0)}.`;
      }
      case 'BehaviourAgent': {
        const p = result.profile || {};
        const dev = result.deviation ? ` Deviation: ${result.deviation}.` : '';
        return `Compared against ${p.historicalCount ?? 0} prior transaction(s) averaging ${money(p.historicalAverage ?? 0)}.${dev}`;
      }
      case 'AnomalyAgent': {
        const list = result.anomalies || [];
        if (list.length === 0) return 'No rule-based anomalies detected.';
        return `${list.length} anomaly type(s) detected: ${list.map((a) => a.type).join(', ')}.`;
      }
      case 'DeviceAgent': {
        const parts = [];
        if (result.deviceId) {
          parts.push(`Device ${result.deviceId}`);
          parts.push(result.isNewForCustomer ? 'is new for this customer' : 'is in the usual device set');
          if (result.relatedCustomers?.length) parts.push(`shared with ${result.relatedCustomers.join(', ')}`);
          if (result.previousCases?.length) parts.push(`seen in prior case(s) ${result.previousCases.join(', ')}`);
          return `${parts.join(' — ')}.`;
        }
        return 'No device recorded on the subject transaction.';
      }
      case 'LocationAgent': {
        return result.isUnusual
          ? `${result.current} is outside the customer's usual location(s): ${(result.usual || []).join(', ') || 'none recorded'}.`
          : `${result.current} matches the customer's usual location pattern.`;
      }
      case 'PatternAgent': {
        const n = result.nodes?.length ?? 0;
        const e = result.edges?.length ?? 0;
        return `Discovered ${n} entit(y/ies) and ${e} relationship(s) from the database.`;
      }
      case 'InvestigationAgent': {
        const f = result.findings || [];
        return f.length
          ? `${f.length} finding(s) grounded in registered evidence.`
          : 'No grounded findings produced.';
      }
      case 'FocusAgent': {
        return result.summary || 'No additional areas selected.';
      }
      case 'RiskEngine': {
        return result.level
          ? `Score ${result.score}/100 (${result.level}) from ${(result.factors || []).length} weighted rule(s).`
          : null;
      }
      case 'Supervisor':
        return 'Investigation pipeline executed.';
      default:
        return null;
    }
  };

  const logAgent = async (name, fn, inputSummary) => {
    const t0 = Date.now();
    try {
      const result = await fn();
      const duration = Date.now() - t0;
      const summary = describeResult(name, result) || `${name} completed`;
      agentResults.push({
        agentName: name,
        status: 'SUCCESS',
        summary,
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
        outputSummary: summary,
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

  // --- Phase 3b: focused deep-dive (Request Additional Investigation) ------
  // Runs BEFORE the reasoning/risk phases so newly discovered evidence is
  // visible to the Investigation Agent and the evidence panel.
  let focus = null;
  if (areas.length > 0) {
    focus = await logAgent('FocusAgent', () =>
      runFocusAnalysis({ transaction, customer, areas, excludeCaseId: investigation.caseId }),
      `areas=${areas.join(',')}`);

    for (const e of focus?.evidence || []) {
      evidence.add({
        type: e.type,
        description: e.description,
        severity: e.severity,
        source: e.source,
        details: e.details || {},
      });
    }
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
  investigation.focusAreas = focus ? focus.areas : [];
  investigation.lastFocusResult = focus
    ? { areas: focus.areaResults, totalRecords: focus.totalRecords, cycle, at: new Date() }
    : investigation.lastFocusResult;
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
      ...(areas.length ? { focusAreas: areas, focusAreaLabels: areas.map((a) => AREA_LABELS[a]) } : {}),
      ...(invalidAreas.length ? { rejectedFocusAreas: invalidAreas } : {}),
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
    focus,
    analyses: { txnAnalysis, behaviour, deviceAnalysis, locationAnalysis, anomalies: anomalies?.anomalies || [] },
  });
  await Report.findOneAndUpdate({ caseId: investigation.caseId }, report, { upsert: true, new: true });

  return { investigation, report, risk, evidence: evidence.all(), agentResults, focus, rejectedFocusAreas: invalidAreas };
}

module.exports = { runInvestigation };
