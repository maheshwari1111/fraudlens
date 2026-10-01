const env = require('../config/env');
const llmService = require('./llmService');

/**
 * Case-specific AI copilot.
 *
 * Ground rules enforced here:
 *  - Answers are built ONLY from the current case's evidence and agent output.
 *  - When the case has no evidence for a question it replies exactly:
 *      "Insufficient evidence to answer this question."
 *  - It never computes a risk score (the deterministic Risk Engine owns that)
 *    and never labels a customer a fraudster.
 *
 * In DEMO_MODE answers are composed deterministically from evidence; otherwise
 * an LLM is called with a strict grounding prompt and its answer is discarded
 * if the call fails.
 */

const INSUFFICIENT = 'Insufficient evidence to answer this question.';

/** Joins sentences without doubling the full stop at the seam. */
const sentence = (text) => String(text || '').trim().replace(/[.\s]+$/, '');
const joinSentences = (parts) => parts.filter(Boolean).map(sentence).join('. ') + '.';
/** "EV-001 — description" with the trailing full stop trimmed. */
const evLine = (e) => `${e.evidenceId} — ${sentence(e.description)}`;

async function askCopilot({ question, investigation, transaction, customer, evidence, risk, deviceAnalysis, locationAnalysis }) {
  const evidenceList = evidence.all ? evidence.all() : evidence;

  if (!evidenceList || evidenceList.length === 0) {
    return INSUFFICIENT;
  }

  if (env.DEMO_MODE || !env.LLM_API_KEY) {
    return answerFromEvidence({ question, investigation, transaction, customer, evidenceList, risk, deviceAnalysis, locationAnalysis });
  }

  const prompt = `You are a case-specific investigation copilot. Answer the investigator's question using ONLY the supplied case evidence.

STRICT RULES:
- Only use facts present in the supplied evidence.
- Do NOT invent transactions, customers, devices, locations, alerts, scores or relationships.
- Reference evidence IDs (e.g. EV-001) where relevant.
- Do NOT calculate or restate a risk score — the deterministic risk engine owns that value.
- Do NOT declare anyone a criminal. Use neutral language: "suspicious activity detected", "unusual behaviour", "risk indicators".
- If the evidence does not cover the question, reply exactly: "${INSUFFICIENT}"

CASE: ${investigation.caseId}
CUSTOMER: ${customer.name} (${customer.customerId})
TRANSACTION: ${transaction.transactionId} ₹${transaction.amount.toLocaleString('en-IN')} at ${transaction.location}
RISK (computed by the deterministic engine, do not recompute): ${risk.level} (${risk.score}/100)
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
    return raw.summary || raw.executiveSummary || raw.answer || INSUFFICIENT;
  } catch {
    return answerFromEvidence({ question, investigation, transaction, customer, evidenceList, risk, deviceAnalysis, locationAnalysis });
  }
}

/** Deterministic, evidence-only answer. Returns INSUFFICIENT when nothing applies. */
function answerFromEvidence({ question, investigation, transaction, customer, evidenceList, risk, deviceAnalysis, locationAnalysis }) {
  const q = (question || '').toLowerCase();
  const summary = investigation.investigationSummary || {};
  const has = (...words) => words.some((w) => q.includes(w));
  const evById = (id) => evidenceList.find((e) => e.evidenceId === id);

  // --- Why is this case high risk? ----------------------------------------
  if (has('why is this case high risk', 'high risk', 'why risky', 'why risk', 'risk score', 'what is the risk')) {
    const factors = (risk.factors || []) || [];
    if (factors.length === 0) return INSUFFICIENT;
    const lines = factors.map((f) => `${labelFor(f.type)} (+${f.weight})${f.evidenceIds?.length ? ` [${f.evidenceIds.join(', ')}]` : ''}`);
    return (
      `The deterministic risk engine scored this case ${risk.score}/100 (${risk.level}). ` +
      `Contributing risk indicators: ${lines.join('; ')}. ` +
      `These come from ${evidenceList.length} evidence item(s) on file — no probability is inferred, the score is a fixed rule sum.`
    );
  }

  // --- What is the strongest evidence? ------------------------------------
  if (has('strongest evidence', 'strongest', 'best evidence', 'key evidence', 'main evidence')) {
    const strongest = summary.strongestEvidence || [];
    if (strongest.length === 0) {
      // Fall back to the highest-severity evidence actually on file.
      const ranked = [...evidenceList].sort(
        (a, b) => severityRank(b.severity) - severityRank(a.severity)
      );
      if (ranked.length === 0) return INSUFFICIENT;
      return `Strongest evidence by severity: ${ranked.slice(0, 3).map(evLine).join(' | ')}.`;
    }
    const items = strongest.map((id) => evById(id)).filter(Boolean);
    if (items.length === 0) return INSUFFICIENT;
    return `Strongest evidence: ${items.map(evLine).join(' | ')}.`;
  }
  // --- Why is this device suspicious? -------------------------------------
  if (has('device')) {
    if (!deviceAnalysis || !deviceAnalysis.deviceId) return INSUFFICIENT;
    const parts = [
      `Device ${deviceAnalysis.deviceId} is ${deviceAnalysis.isNewForCustomer ? 'not in the usual device set for this customer' : 'part of the usual device set'}.`,
    ];
    if (deviceAnalysis.relatedCustomers?.length) {
      parts.push(`It is also recorded against: ${deviceAnalysis.relatedCustomers.join(', ')}.`);
    }
    if (deviceAnalysis.previousCases?.length) {
      parts.push(`It previously appeared in case(s): ${deviceAnalysis.previousCases.join(', ')}.`);
    }
    if (deviceAnalysis.device?.previousAlerts?.length) {
      parts.push(`It was involved in prior alert(s): ${deviceAnalysis.device.previousAlerts.join(', ')}.`);
    }
    const ev = evidenceList.filter((e) => ['NEW_DEVICE', 'SHARED_DEVICE', 'PREVIOUS_ALERT', 'PREVIOUS_CASE'].includes(e.type));
    if (ev.length) parts.push(`Device evidence: ${ev.map((e) => e.evidenceId).join(', ')}.`);
    if (parts.length === 1) return INSUFFICIENT;
    return parts.join(' ');
  }

  // --- Which customers are connected? -------------------------------------
  if (has('connected', 'related customer', 'related account', 'which customer', 'linked', 'shared', 'associated')) {
    const related = deviceAnalysis?.relatedCustomers || [];
    if (related.length === 0) return INSUFFICIENT;
    const shared = evidenceList.find((e) => e.type === 'SHARED_DEVICE');
    return (
      `Customers connected to device ${deviceAnalysis.deviceId}: ${related.join(', ')}. ` +
      `This relationship was discovered from the device records in the database, not assumed.` +
      (shared ? ` Evidence: ${shared.evidenceId}.` : '')
    );
  }

  // --- Were there previous alerts? -----------------------------------------
  if (has('previous alert', 'prior alert', 'previous case', 'been flagged', 'earlier alert', 'history of alert')) {
    const related = evidenceList.filter((e) => ['PREVIOUS_ALERT', 'PREVIOUS_CASE'].includes(e.type));
    if (related.length === 0) return INSUFFICIENT;
    return `Prior activity on this case: ${related.map(evLine).join(' | ')}.`;
  }

  // --- What should I investigate next? ------------------------------------
  if (has('next', 'additional', 'what should i', 'further', 'more investigation', 'recommend')) {
    const suggestions = summary.additionalInvestigation || [];
    if (suggestions.length === 0) return INSUFFICIENT;
    const untested = (investigation.focusAreas || []).length
      ? ` Areas already deep-dived in this cycle: ${investigation.focusAreas.join(', ')}.`
      : '';
    return `Recommended next steps from the investigation: ${suggestions.join('; ')}.${untested}`;
  }

  // --- Where did the transaction happen? ----------------------------------
  if (has('location', 'where', 'city', 'geo')) {
    if (!locationAnalysis || !locationAnalysis.current) return INSUFFICIENT;
    const ev = evidenceList.filter((e) => ['LOCATION_ANOMALY', 'LOCATION_DEVIATION'].includes(e.type));
    return (
      `The transaction occurred in ${locationAnalysis.current}; the customer's usual locations are ${(locationAnalysis.usual || []).join(', ') || 'not recorded'}.` +
      (ev.length ? ` Evidence: ${ev.map((e) => e.evidenceId).join(', ')}.` : ' No location anomaly is recorded on this case.')
    );
  }

  // --- What happened? / general summary -----------------------------------
  if (has('summary', 'overview', 'what happened', 'summarise', 'summarize', 'tell me about')) {
    if (summary.summary) return summary.summary;
    if (evidenceList.length === 0) return INSUFFICIENT;
    return `Case ${investigation.caseId}: ${evidenceList.length} evidence item(s) recorded across ${customer.customerId} / ${transaction.transactionId}. Risk level ${risk.level} (${risk.score}/100), computed deterministically.`;
  }

  return INSUFFICIENT;
}

function labelFor(type) {
  return String(type)
    .toLowerCase()
    .split('_')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

function severityRank(s) {
  return { CRITICAL: 4, HIGH: 3, MEDIUM: 2, LOW: 1, INFO: 0 }[s] ?? 0;
}

module.exports = { askCopilot, INSUFFICIENT };
