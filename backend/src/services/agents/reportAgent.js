const env = require('../../config/env');
const llmService = require('../llmService');

/**
 * Report Agent — generates the evidence-backed investigation report.
 *
 * In DEMO_MODE the executive summary is composed deterministically from the
 * evidence; otherwise the LLM writes the narrative (grounded, no fabrication).
 *
 * The report is assembled from the SAME records the agents used, so every
 * section is reproducible and traceable back to evidence IDs.
 */
async function generateReport({ investigation, transaction, customer, evidence, agentResults, risk, graph, focus, analyses = {} }) {
  const evidenceList = evidence.all ? evidence.all() : evidence;
  const { txnAnalysis, behaviour, deviceAnalysis, locationAnalysis, anomalies = [] } = analyses;

  let executiveSummary;
  if (env.DEMO_MODE || !env.LLM_API_KEY) {
    executiveSummary = buildExecutiveSummary({ investigation, transaction, customer, evidenceList, risk });
  } else {
    const prompt = `Write a concise executive summary (3-5 sentences) for fraud investigation case ${investigation.caseId}.

STRICT RULES: only use the supplied facts. Do not invent transactions, customers, devices, locations, alerts, scores or relationships. Do not declare anyone a criminal. Use neutral language: "suspicious activity detected", "evidence indicates unusual behaviour", "human investigation required".

CASE DATA:
- Customer: ${customer.name} (${customer.customerId})
- Transaction: ${transaction.transactionId}, ₹${transaction.amount.toLocaleString('en-IN')}, ${transaction.location}, ${new Date(transaction.timestamp).toISOString()}
- Risk: ${risk.level} (${risk.score}/100)
- Evidence: ${JSON.stringify(evidenceList.map((e) => ({ id: e.evidenceId, type: e.type, description: e.description })))}
- Findings: ${JSON.stringify((investigation.investigationSummary?.findings || []).map((f) => f.finding))}

Respond with JSON only: {"executiveSummary": "..."}`;
    try {
      const raw = await llmService.chat(prompt);
      executiveSummary = raw.executiveSummary || buildExecutiveSummary({ investigation, transaction, customer, evidenceList, risk });
    } catch {
      executiveSummary = buildExecutiveSummary({ investigation, transaction, customer, evidenceList, risk });
    }
  }

  const findings = (investigation.investigationSummary?.findings || []).map((f) => ({
    finding: f.finding,
    evidenceIds: f.evidenceIds,
  }));

  const recommendation =
    risk.level === 'CRITICAL' || risk.level === 'HIGH'
      ? 'HUMAN INVESTIGATION REQUIRED — suspicious activity detected. Escalate to a human investigator for final decision.'
      : risk.level === 'MEDIUM'
        ? 'Review recommended — evidence indicates unusual behaviour. A human investigator should confirm the final decision.'
        : 'Low risk — routine monitoring. No immediate human action required.';

  return {
    caseId: investigation.caseId,
    alertId: investigation.alertId || null,
    status: investigation.status,
    investigationCycles: investigation.investigationCycles,
    executiveSummary,
    findings,
    evidence: evidenceList,
    riskAssessment: {
      score: risk.score,
      level: risk.level,
      factors: risk.factors,
      note: 'Demonstration rule set — configurable via RISK_WEIGHTS. Not a universal financial risk standard.',
    },
    recommendation,
    humanDecision: investigation.humanDecision || {},

    caseInformation: {
      caseId: investigation.caseId,
      alertId: investigation.alertId || null,
      status: investigation.status,
      investigationCycles: investigation.investigationCycles,
      openedAt: investigation.createdAt,
      lastUpdated: investigation.updatedAt,
      focusAreas: investigation.focusAreas || [],
    },

    transaction: {
      transactionId: transaction.transactionId,
      customerId: transaction.customerId,
      amount: transaction.amount,
      transactionType: transaction.transactionType,
      merchant: transaction.merchant,
      location: transaction.location,
      deviceId: transaction.deviceId,
      timestamp: transaction.timestamp,
      status: transaction.status,
    },

    customer: {
      customerId: customer.customerId,
      name: customer.name,
      accountAge: customer.accountAge,
      averageTransactionAmount: customer.averageTransactionAmount,
      usualLocations: customer.usualLocations || [],
      usualDevices: customer.usualDevices || [],
      usualTransactionHours: customer.usualTransactionHours || [],
    },

    behaviourAnalysis: {
      historicalCount: behaviour?.profile?.historicalCount ?? null,
      historicalAverage: behaviour?.profile?.historicalAverage ?? null,
      declaredAverage: customer.averageTransactionAmount,
      ratio: customer.averageTransactionAmount > 0
        ? Number((transaction.amount / customer.averageTransactionAmount).toFixed(2))
        : null,
      usualHours: customer.usualTransactionHours || [],
      transactionHour: new Date(transaction.timestamp).getHours(),
      findings: (behaviour?.evidence || []).map(slimEvidence),
    },

    deviceAnalysis: {
      deviceId: deviceAnalysis?.deviceId || transaction.deviceId || null,
      isNewForCustomer: deviceAnalysis?.isNewForCustomer ?? null,
      associatedCustomers: deviceAnalysis?.device?.customers || [],
      relatedCustomers: deviceAnalysis?.relatedCustomers || [],
      previousCases: deviceAnalysis?.previousCases || [],
      previousAlerts: deviceAnalysis?.device?.previousAlerts || [],
      transactionCount: deviceAnalysis?.device?.transactionCount ?? null,
      firstSeen: deviceAnalysis?.device?.firstSeen || null,
      lastSeen: deviceAnalysis?.device?.lastSeen || null,
      findings: (deviceAnalysis?.evidence || []).map(slimEvidence),
    },

    locationAnalysis: {
      current: transaction.location,
      usual: locationAnalysis?.usual || customer.usualLocations || [],
      isUnusual: locationAnalysis?.isUnusual ?? null,
      recentLocations: locationAnalysis?.recentLocations || [],
      findings: (locationAnalysis?.evidence || []).map(slimEvidence),
    },

    relationshipFindings: {
      nodeCount: graph?.nodes?.length || 0,
      edgeCount: graph?.edges?.length || 0,
      nodes: (graph?.nodes || []).map((n) => ({
        id: n.id,
        type: n.type,
        label: n.data?.label,
        sublabel: n.data?.sublabel,
      })),
      edges: (graph?.edges || []).map((e) => ({
        source: e.source,
        target: e.target,
        label: e.label,
      })),
    },

    previousAlerts: (deviceAnalysis?.device?.previousAlerts || []).map((alertId) => ({
      alertId,
      type: 'ALERT',
    })).concat((deviceAnalysis?.previousCases || []).map((caseId) => ({
      caseId,
      type: 'CASE',
    }))),

    anomalies: anomalies.map((a) => ({
      type: a.type,
      severity: a.severity,
      description: a.description,
      details: a.details,
    })),

    agentFindings: (agentResults || []).map((a) => ({
      agent: a.agentName,
      status: a.status,
      summary: a.summary,
      evidenceIds: a.evidenceIds || [],
      duration: a.duration,
    })),

    additionalInvestigation: focus
      ? {
          areas: focus.areaResults,
          totalRecords: focus.totalRecords,
          summary: focus.summary,
        }
      : null,

    investigationSummary: investigation.investigationSummary || null,

    auditTimeline: buildAuditTimeline(agentResults, investigation),
    generatedAt: new Date(),
  };
}

function slimEvidence(e) {
  return { evidenceId: e.evidenceId, type: e.type, description: e.description, severity: e.severity, details: e.details || {} };
}

function buildExecutiveSummary({ investigation, transaction, customer, evidenceList, risk }) {
  const topEvidence = evidenceList
    .filter((e) => e.severity === 'HIGH' || e.severity === 'CRITICAL')
    .slice(0, 3)
    .map((e) => e.description)
    .join(' ');

  return (
    `Case ${investigation.caseId} concerns transaction ${transaction.transactionId} ` +
    `(₹${transaction.amount.toLocaleString('en-IN')}) by customer ${customer.name} (${customer.customerId}) ` +
    `in ${transaction.location}. The deterministic risk engine scored this case ${risk.score}/100 (${risk.level}). ` +
    (topEvidence ? `Key evidence: ${topEvidence} ` : '') +
    `Suspicious activity detected; evidence indicates unusual behaviour. ` +
    (risk.level === 'HIGH' || risk.level === 'CRITICAL'
      ? 'Human investigation required — a human investigator must make the final decision.'
      : 'Review recommended.')
  );
}

function buildAuditTimeline(agentResults, investigation) {
  const timeline = (agentResults || []).map((a) => ({
    agent: a.agentName,
    status: a.status,
    summary: a.summary,
    duration: a.duration,
  }));
  if (investigation.humanDecision?.action) {
    timeline.push({
      agent: 'Human Review',
      status: 'SUCCESS',
      summary: `Decision: ${investigation.humanDecision.action}${investigation.humanDecision.note ? ` — ${investigation.humanDecision.note}` : ''}`,
      duration: 0,
    });
  }
  return timeline;
}

module.exports = { generateReport };
