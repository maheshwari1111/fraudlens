const Transaction = require('../../models/Transaction');

/**
 * Transaction Agent — deterministic.
 * Analyzes the subject transaction plus recent history and velocity.
 */
async function analyzeTransaction({ transaction, customer }) {
  const evidence = [];
  const now = new Date();

  // Recent transactions (last 30 days) for velocity context
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  const recent = await Transaction.find({
    customerId: customer.customerId,
    timestamp: { $gte: thirtyDaysAgo },
  }).sort({ timestamp: -1 });

  const last24h = recent.filter(
    (t) => now - new Date(t.timestamp) <= 24 * 60 * 60 * 1000
  );

  const velocity = {
    recentCount: recent.length,
    last24hCount: last24h.length,
    last24hAmount: last24h.reduce((s, t) => s + t.amount, 0),
  };

  // Velocity evidence: many transactions in a short window
  if (last24h.length >= 3) {
    evidence.push({
      type: 'VELOCITY_ANOMALY',
      description: `${last24h.length} transactions by ${customer.customerId} in the last 24 hours.`,
      severity: 'MEDIUM',
      source: 'TransactionAgent',
      details: { last24hCount: last24h.length, last24hAmount: velocity.last24hAmount },
    });
  }

  // Amount context vs customer baseline
  if (customer.averageTransactionAmount > 0) {
    const ratio = transaction.amount / customer.averageTransactionAmount;
    if (ratio >= 3) {
      evidence.push({
        type: 'AMOUNT_CONTEXT',
        description: `Transaction amount is ${ratio.toFixed(1)}x the customer's historical average.`,
        severity: ratio >= 5 ? 'HIGH' : 'MEDIUM',
        source: 'TransactionAgent',
        details: {
          amount: transaction.amount,
          average: customer.averageTransactionAmount,
          ratio: Number(ratio.toFixed(2)),
        },
      });
    }
  }

  return {
    transactionId: transaction.transactionId,
    amount: transaction.amount,
    customerId: transaction.customerId,
    location: transaction.location,
    deviceId: transaction.deviceId,
    transactionType: transaction.transactionType,
    merchant: transaction.merchant,
    timestamp: transaction.timestamp,
    transactionContext: `Recent 30d count: ${recent.length}; last 24h count: ${last24h.length}.`,
    velocity,
    evidence,
  };
}

module.exports = { analyzeTransaction };
