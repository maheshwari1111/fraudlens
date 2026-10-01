const env = require('../../config/env');
const llmService = require('../llmService');

/**
 * Report Agent — generates the investigation report.
 * In DEMO_MODE the executive summary is composed deterministically from the
 * evidence; otherwise the LLM writes the narrative (grounded, no fabrication).
 */
async function generateReport({ investigation, transaction, customer, evidence, agentResults, risk, graph }) {
  const evidenceList = evidence.all ? evidence.all() : evidence;

  let executiveSummary;
  if (env.DEMO_MODE || !env.LLM_API_KEY) {
    executiveSummary = buildExecutiveSummary({ investigation, transaction, customer, evidenceList, risk });
  } else {
    const prompt = `Write a concise executive summary (3-5 sentences) for fraud investigation case ${investigation.caseId}.

STRICT RULES: only use the supplied facts. Do not invent transactions, customers, devices, locations, alerts, scores or relationships. Do not declare anyone a criminal. Use neutral language: "suspicious activity detected", "evidence indicates unusual behaviour", "human investigation required".

CASE DATA:
- Customer: ${customer.name} (${customer.customerId})
- Transaction: ${transaction.transactionId}, ₹${transaction.amount.toLocaleString('en-IN')}, ${transaction.location}, ${transaction.transactionId ? new Date(transaction.timestamp).toISOString() : ''}
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
    executiveSummary,
    findings,
    evidence: evidenceList,
    riskAssessment: {
      score: risk.score,
      level: risk.level,
      factors: risk.factors,
    },
    recommendation,
    humanDecision: investigation.humanDecision || {},
    auditTimeline: buildAuditTimeline(agentResults, investigation),
    generatedAt: new Date(),
  };
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
