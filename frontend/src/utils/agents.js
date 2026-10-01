/**
 * Shared agent registry.
 *
 * Single source of truth for the investigation pipeline: display order, human
 * labels, purposes, and status styling. Used by the case timeline and the
 * dashboard activity feed so both surfaces read identically.
 *
 * The pipeline is defined by the backend Supervisor (see
 * backend/src/services/agents/supervisor.js). Anything not yet executed is
 * rendered as PENDING rather than hidden, so the investigator can see what has
 * and has not run.
 */

export const AGENT_PIPELINE = [
  { name: 'Supervisor', label: 'Supervisor Agent', short: 'Supervisor', purpose: 'Orchestrates the investigation pipeline and coordinates the specialised agents.' },
  { name: 'TransactionAgent', label: 'Transaction Agent', short: 'Transaction', purpose: 'Analyses transaction amount, merchant category and 24h/30d velocity.' },
  { name: 'AnomalyAgent', label: 'Anomaly Agent', short: 'Anomaly', purpose: 'Applies deterministic anti-fraud rules for amount, time, device, location and frequency.' },
  { name: 'BehaviourAgent', label: 'Behaviour Agent', short: 'Behaviour', purpose: 'Compares the transaction against the customer\'s 90-day behaviour baseline.' },
  { name: 'DeviceAgent', label: 'Device Agent', short: 'Device', purpose: 'Discovers device reuse, associated accounts and prior cases involving the device.' },
  { name: 'LocationAgent', label: 'Location Agent', short: 'Location', purpose: 'Compares the transaction location against the customer\'s usual locations.' },
  { name: 'PatternAgent', label: 'Pattern Agent', short: 'Pattern', purpose: 'Builds the entity relationship graph from customers, devices, locations and alerts.' },
  { name: 'InvestigationAgent', label: 'Investigation Agent', short: 'Investigation', purpose: 'Explains the evidence. It reasons and summarises only — it never invents evidence and never computes risk.' },
  { name: 'FocusAgent', label: 'Focused Deep-Dive', short: 'Deep-Dive', purpose: 'Re-queries the database for investigator-selected areas (device history, related accounts, prior alerts…).' },
  { name: 'RiskEngine', label: 'Risk Engine', short: 'Risk Engine', purpose: 'Computes the risk score deterministically from configured weights. Not a probability.' },
  { name: 'HumanReview', label: 'Human Review', short: 'Human Review', purpose: 'Final decision by an investigator. HIGH and CRITICAL cases cannot close without it.' },
];

export const AGENT_NAMES = AGENT_PIPELINE.map((a) => a.name);
export const AGENT_BY_NAME = Object.fromEntries(AGENT_PIPELINE.map((a) => [a.name, a]));

export const agentLabel = (name) => AGENT_BY_NAME[name]?.label || name;
export const agentShort = (name) => AGENT_BY_NAME[name]?.short || name;
export const agentPurpose = (name) => AGENT_BY_NAME[name]?.purpose || '';

export const STATUS_STYLE = {
  SUCCESS: { text: 'COMPLETED', color: 'text-emerald-400', dot: 'bg-emerald-400', border: 'border-emerald-500/30', bg: 'bg-emerald-500/10' },
  FAILED: { text: 'FAILED', color: 'text-red-400', dot: 'bg-red-400', border: 'border-red-500/30', bg: 'bg-red-500/10' },
  PARTIAL: { text: 'PARTIAL', color: 'text-amber-400', dot: 'bg-amber-400', border: 'border-amber-500/30', bg: 'bg-amber-500/10' },
  RUNNING: { text: 'RUNNING', color: 'text-accent-400', dot: 'bg-accent-400', border: 'border-accent-500/30', bg: 'bg-accent-500/10' },
  PENDING: { text: 'PENDING', color: 'text-surface-400', dot: 'bg-surface-600', border: 'border-surface-700', bg: 'bg-surface-800/50' },
  PENDING_REVIEW: { text: 'AWAITING DECISION', color: 'text-amber-400', dot: 'bg-amber-400', border: 'border-amber-500/40', bg: 'bg-amber-500/10' },
  DECIDED: { text: 'DECIDED', color: 'text-sky-400', dot: 'bg-sky-400', border: 'border-sky-500/30', bg: 'bg-sky-500/10' },
};

export const statusStyle = (status) => STATUS_STYLE[status] || STATUS_STYLE.PENDING;
