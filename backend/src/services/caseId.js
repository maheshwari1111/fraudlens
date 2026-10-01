/**
 * Case ID derivation — single source of truth.
 *
 * A case is identified deterministically by its subject transaction so the
 * same transaction always maps to the same case ID, on every run and in every
 * surface (supervisor, alerts API, reports, UI links).
 *
 *   TX1042 -> CASE-1042
 *   TX8870 -> CASE-8870
 */
function deriveCaseId(transactionId) {
  if (!transactionId) return null;
  const numericPart = String(transactionId).replace(/\D/g, '');
  return numericPart ? `CASE-${numericPart}` : null;
}

module.exports = { deriveCaseId };
