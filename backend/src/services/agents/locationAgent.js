const Transaction = require('../../models/Transaction');

/**
 * Location Analysis Agent — deterministic.
 * Compares the transaction location against the customer's usual locations
 * and recent transaction locations.
 */
async function analyzeLocation({ transaction, customer }) {
  const evidence = [];
  const usual = customer.usualLocations || [];
  const current = transaction.location;

  const isUnusual = usual.length > 0 && !usual.includes(current);

  if (isUnusual) {
    evidence.push({
      type: 'LOCATION_ANOMALY',
      description: `Current transaction occurred outside the customer's usual location pattern.`,
      severity: 'MEDIUM',
      source: 'LocationAgent',
      details: { current, usual },
    });
  }

  // Recent locations for context
  const recent = await Transaction.find({ customerId: customer.customerId })
    .sort({ timestamp: -1 })
    .limit(20);
  const recentLocations = [...new Set(recent.map((t) => t.location))];

  return {
    current,
    usual,
    isUnusual,
    recentLocations,
    evidence,
  };
}

module.exports = { analyzeLocation };
