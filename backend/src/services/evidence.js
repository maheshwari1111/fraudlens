/**
 * Evidence registry — the single source of truth for evidence IDs.
 * Every finding produced by any agent is registered here so the LLM and
 * the UI can reference stable, traceable evidence IDs (EV-001, EV-002, ...).
 */
class EvidenceRegistry {
  constructor() {
    this.items = [];
    this.counter = 0;
  }

  add({ type, description, severity = 'INFO', source, details = {} }) {
    this.counter += 1;
    const evidence = {
      evidenceId: `EV-${String(this.counter).padStart(3, '0')}`,
      type,
      description,
      severity,
      source,
      details,
    };
    this.items.push(evidence);
    return evidence;
  }

  get(id) {
    return this.items.find((e) => e.evidenceId === id) || null;
  }

  all() {
    return this.items;
  }

  ids() {
    return this.items.map((e) => e.evidenceId);
  }

  /** Validate a list of evidence IDs; returns only IDs that exist. */
  validateIds(ids) {
    if (!Array.isArray(ids)) return [];
    return ids.filter((id) => this.get(id));
  }
}

module.exports = { EvidenceRegistry };
