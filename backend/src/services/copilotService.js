const env = require('../config/env');
const llmService = require('./llmService');

/**
 * Case-specific AI copilot.
 * Receives ONLY the current case evidence. If evidence is unavailable it says
 * so — it never fabricates. In DEMO_MODE it answers deterministically from
 * the evidence; otherwise it calls the LLM with a strict grounding prompt.
 */
async function askCopilot({ question, investigation, transaction, customer, evidence, risk, deviceAnalysis, locationAnalysis }) {
  const evidenceList = evidence.all ? evidence.all() : evidence;
  const q = (question || '').toLowerCase();

  if (env.DEMO_MODE || !env.LLM_API_KEY) {
    return answerDemo({ q, investigation, transaction, customer, evidenceList, risk, deviceAnalysis, locationAnalysis });
  }

  const prompt = `You are a case-specific investigation copilot. Answer the investigator's question using ONLY the supplied case evidence.

STRICT RULES:
- Only use facts present in the supplied evidence.
- Do NOT invent transactions, customers, devices, locations, alerts, scores or relationships.
- Reference evidence IDs where relevant.
- If evidence is unavailable, respond exactly: "I do not have sufficient evidence in this investigation to answer that."
- Do NOT declare anyone a criminal. Use neutral language.

CASE: ${investigation.caseId}
CUSTOMER: ${customer.name} (${customer.customerId})
TRANSACTION: ${transaction.transactionId} ₹${transaction.amount.toLocaleString('en-IN')} at ${transaction.location}
RISK: ${risk.level} (${risk.score}/100)
EVIDENCE:
${JSON.stringify(evidenceList, null, 2)}
FINDINGS:
${JSON.stringify((investigation.investigationSummary?.findings || []).map((f) => ({ finding: f.finding, evidenceIds: f.evidenceIds })), null, 2)}
RISK FACTORS:
${JSON.stringify(risk.factors, null, 2)}

QUESTION: ${question}

Answer concisely (2-4 sentences).`;

  try {
    const raw = await llmService.chat(prompt);
    return raw.summary || raw.executiveSummary || 'Unable to answer from available evidence.';
  } catch {
    return answerDemo({ q, investigation, transaction, customer, evidenceList, risk, deviceAnalysis, locationAnalysis });
  }
}

function answerDemo({ q, investigation, transaction, customer, evidenceList, risk, deviceAnalysis, locationAnalysis }) {
  const has = (...words) => words.some((w) => q.includes(w));

  if (has('high risk', 'risk', 'score', 'why')) {
    const factorTexts = (risk.factors || []).map((f) => `${f.type} (+${f.weight})`).join(', ');
    return (
      `This case is rated ${risk.level} (${risk.score}/100) because of: ${factorTexts || 'no specific factors'}. ` +
      `The score is calculated deterministically by the Risk Engine from ${evidenceList.length} evidence item(s). ` +
      `Key evidence: ${(investigation.investigationSummary?.strongestEvidence || []).join(', ') || 'see evidence panel'}.`
    );
  }

  if (has('strongest evidence', 'strongest', 'best evidence')) {
    const strongest = investigation.investigationSummary?.strongestEvidence || [];
    if (strongest.length === 0) return 'I do not have sufficient evidence in this investigation to answer that.';
    const items = strongest.map((id) => evidenceList.find((e) => e.evidenceId === id)).filter(Boolean);
    return `Strongest evidence: ${items.map((e) => `${e.evidenceId} — ${e.description}`).join(' | ')}.`;
  }

  if (has('device', 'suspicious device')) {
    if (!deviceAnalysis || !deviceAnalysis.deviceId) {
      return 'I do not have sufficient evidence in this investigation to answer that.';
    }
    const parts = [`Device ${deviceAnalysis.deviceId} is ${deviceAnalysis.isNewForCustomer ? 'new for this customer' : 'known to this customer'}.`];
    if (deviceAnalysis.relatedCustomers?.length) {
      parts.push(`It is also used by: ${deviceAnalysis.relatedCustomers.join(', ')}.`);
    }
    if (deviceAnalysis.previousCases?.length) {
      parts.push(`It previously appeared in case(s): ${deviceAnalysis.previousCases.join(', ')}.`);
    }
    const ev = evidenceList.find((e) => e.type === 'SHARED_DEVICE' || e.type === 'PREVIOUS_CASE');
    if (ev) parts.push(`Evidence: ${ev.evidenceId}.`);
    return parts.join(' ');
  }

  if (has('connected', 'related customer', 'which customer', 'shared')) {
    const related = deviceAnalysis?.relatedCustomers || [];
    if (related.length === 0) return 'I do not have sufficient evidence in this investigation to answer that.';
    return `Customers connected to device ${deviceAnalysis.deviceId}: ${related.join(', ')}. This relationship was discovered from MongoDB device records.`;
  }

  if (has('previous alert', 'prior alert', 'alert')) {
    const alerts = evidenceList.filter((e) => e.type === 'PREVIOUS_ALERT' || e.type === 'PREVIOUS_CASE');
    if (alerts.length === 0) return 'I do not have sufficient evidence in this investigation to answer that.';
    return `Relevant previous alerts: ${alerts.map((e) => `${e.evidenceId} — ${e.description}`).join(' | ')}.`;
  }

  if (has('additional', 'what should', 'investigate more', 'next')) {
    const suggestions = investigation.investigationSummary?.additionalInvestigation || [];
    if (suggestions.length === 0) return 'I do not have sufficient evidence in this investigation to answer that.';
    return `Recommended additional investigation: ${suggestions.join('; ')}.`;
  }

  if (has('what happened', 'summary', 'overview')) {
    return investigation.investigationSummary?.summary || 'Investigation summary is not yet available.';
  }

  return 'I do not have sufficient evidence in this investigation to answer that.';
}

module.exports = { askCopilot };
