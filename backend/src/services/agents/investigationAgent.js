const env = require('../../config/env');
const llmService = require('../llmService');

/**
 * Investigation Agent — receives structured evidence and produces a grounded
 * investigation explanation. In DEMO_MODE it synthesizes the explanation
 * deterministically from the evidence; otherwise it calls the LLM with a
 * strict no-fabrication prompt and validates returned evidence IDs.
 */
async function investigate({ caseId, transaction, customer, evidence, anomalies, deviceAnalysis, locationAnalysis, relationshipGraph }) {
  const evidenceList = evidence.all ? evidence.all() : evidence;

  if (env.DEMO_MODE || !env.LLM_API_KEY) {
    return buildDemoInvestigation({ caseId, transaction, customer, evidenceList, anomalies, deviceAnalysis, locationAnalysis });
  }

  const prompt = buildPrompt({ transaction, customer, evidenceList, anomalies, deviceAnalysis, locationAnalysis });
  const raw = await llmService.chat(prompt);

  // Validate: strip any evidence IDs the LLM invented.
  const validIds = new Set(evidenceList.map((e) => e.evidenceId));
  const findings = (raw.findings || []).map((f) => ({
    ...f,
    evidenceIds: (f.evidenceIds || []).filter((id) => validIds.has(id)),
  }));
  const strongestEvidence = (raw.strongestEvidence || []).filter((id) => validIds.has(id));

  return {
    summary: raw.summary || 'Investigation summary unavailable.',
    findings,
    strongestEvidence,
    additionalInvestigation: raw.additionalInvestigation || [],
    limitations: raw.limitations || [],
    grounded: true,
  };
}

function buildDemoInvestigation({ caseId, transaction, customer, evidenceList, anomalies, deviceAnalysis, locationAnalysis }) {
  const findings = [];
  const strongestEvidence = [];
  const limitations = [];

  const amountAnomaly = anomalies.find((a) => a.type === 'AMOUNT_ANOMALY');
  if (amountAnomaly) {
    const ev = evidenceList.find((e) => e.type === 'AMOUNT_DEVIATION' || e.type === 'AMOUNT_CONTEXT');
    findings.push({
      finding: `Transaction of ₹${transaction.amount.toLocaleString('en-IN')} is ${amountAnomaly.details.ratio}x the customer's historical average of ₹${customer.averageTransactionAmount.toLocaleString('en-IN')}.`,
      evidenceIds: ev ? [ev.evidenceId] : [],
    });
    if (ev) strongestEvidence.push(ev.evidenceId);
  }

  if (deviceAnalysis.isNewForCustomer) {
    const ev = evidenceList.find((e) => e.type === 'NEW_DEVICE');
    findings.push({
      finding: `Device ${transaction.deviceId} was not previously used by ${customer.customerId}.`,
      evidenceIds: ev ? [ev.evidenceId] : [],
    });
    if (ev) strongestEvidence.push(ev.evidenceId);
  }

  if (deviceAnalysis.relatedCustomers.length > 0) {
    const ev = evidenceList.find((e) => e.type === 'SHARED_DEVICE');
    findings.push({
      finding: `Device ${transaction.deviceId} is shared with ${deviceAnalysis.relatedCustomers.join(', ')}.`,
      evidenceIds: ev ? [ev.evidenceId] : [],
    });
    if (ev) strongestEvidence.push(ev.evidenceId);
  }

  if (deviceAnalysis.previousCases.length > 0) {
    const ev = evidenceList.find((e) => e.type === 'PREVIOUS_CASE');
    findings.push({
      finding: `Device ${transaction.deviceId} previously appeared in case(s): ${deviceAnalysis.previousCases.join(', ')}.`,
      evidenceIds: ev ? [ev.evidenceId] : [],
    });
    if (ev) strongestEvidence.push(ev.evidenceId);
  }

  if (locationAnalysis.isUnusual) {
    const ev = evidenceList.find((e) => e.type === 'LOCATION_ANOMALY' || e.type === 'LOCATION_DEVIATION');
    findings.push({
      finding: `Transaction location ${transaction.location} is outside the customer's usual location(s): ${(customer.usualLocations || []).join(', ')}.`,
      evidenceIds: ev ? [ev.evidenceId] : [],
    });
    if (ev) strongestEvidence.push(ev.evidenceId);
  }

  const unusualTime = anomalies.find((a) => a.type === 'UNUSUAL_TIME');
  if (unusualTime) {
    findings.push({
      finding: `Transaction occurred at an unusual hour (${String(unusualTime.details.hour).padStart(2, '0')}:00).`,
      evidenceIds: [],
    });
  }

  if (findings.length === 0) {
    findings.push({
      finding: 'No significant anomalies detected against the customer baseline.',
      evidenceIds: [],
    });
  }

  limitations.push('Analysis is based on available historical data; external factors (travel, device replacement) are not observable.');

  const summary =
    `Investigation of ${caseId}: ${findings.length} finding(s) identified. ` +
    `Key concerns: ${findings.map((f) => f.finding).join(' ')} ` +
    `Suspicious activity detected; evidence indicates unusual behaviour. Human investigation review recommended.`;

  return {
    summary,
    findings,
    strongestEvidence,
    additionalInvestigation: [
      'Verify customer contact details for transaction confirmation.',
      'Check for recent travel or device changes reported by the customer.',
    ],
    limitations,
    grounded: true,
  };
}

function buildPrompt({ transaction, customer, evidenceList, anomalies, deviceAnalysis, locationAnalysis }) {
  return `You are an investigation assistant for a financial fraud investigation platform.

STRICT RULES:
- You may ONLY use facts present in the supplied investigation evidence below.
- Do NOT invent transactions, customers, devices, locations, alerts, scores or relationships.
- Every factual finding MUST reference supplied evidence IDs (e.g. "EV-001").
- If information is missing, say that sufficient evidence is unavailable.
- Do NOT declare any customer to be a criminal or fraudster. Use neutral language:
  "suspicious activity detected", "evidence indicates unusual behaviour",
  "human investigation required".
- Do NOT calculate or state a risk score — risk is computed by a separate deterministic engine.

SUBJECT TRANSACTION:
${JSON.stringify(transaction, null, 2)}

CUSTOMER PROFILE:
${JSON.stringify(customer, null, 2)}

EVIDENCE (${evidenceList.length} items):
${JSON.stringify(evidenceList, null, 2)}

DETECTED ANOMALIES:
${JSON.stringify(anomalies, null, 2)}

DEVICE ANALYSIS:
${JSON.stringify(deviceAnalysis, null, 2)}

LOCATION ANALYSIS:
${JSON.stringify(locationAnalysis, null, 2)}

Answer these questions:
1. What happened?
2. What is unusual?
3. What evidence supports the concern?
4. Are there related entities?
5. Are there previous alerts?
6. What evidence is strongest?
7. What evidence is inconclusive?
8. What additional investigation may be useful?

Respond with STRICT JSON only:
{
  "summary": "...",
  "findings": [{"finding": "...", "evidenceIds": ["EV-001"]}],
  "strongestEvidence": ["EV-001"],
  "additionalInvestigation": ["..."],
  "limitations": ["..."]
}`;
}

module.exports = { investigate };
