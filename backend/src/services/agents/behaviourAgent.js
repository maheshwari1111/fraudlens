const Transaction = require('../../models/Transaction');

/**
 * Behaviour Agent — deterministic.
 * Compares current activity against the customer's historical behaviour
 * profile (amounts, locations, devices, hours, frequency).
 */
async function analyzeBehaviour({ transaction, customer }) {
  const evidence = [];
  const now = new Date();
  const ninetyDaysAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);

  const history = await Transaction.find({
    customerId: customer.customerId,
    timestamp: { $gte: ninetyDaysAgo },
  }).sort({ timestamp: -1 });

  const profile = {
    historicalCount: history.length,
    historicalAverage:
      history.length > 0
        ? Math.round(history.reduce((s, t) => s + t.amount, 0) / history.length)
        : 0,
    usualLocations: customer.usualLocations || [],
    usualDevices: customer.usualDevices || [],
    usualHours: customer.usualTransactionHours || [],
  };

  // Amount deviation
  if (customer.averageTransactionAmount > 0) {
    const ratio = transaction.amount / customer.averageTransactionAmount;
    if (ratio >= 2) {
      evidence.push({
        type: 'AMOUNT_DEVIATION',
        description: `Amount significantly above historical baseline.`,
        severity: ratio >= 5 ? 'HIGH' : 'MEDIUM',
        source: 'BehaviourAgent',
        details: {
          current: transaction.amount,
          historicalAverage: customer.averageTransactionAmount,
          ratio: Number(ratio.toFixed(2)),
        },
      });
    }
  }

  // Location deviation
  if (profile.usualLocations.length > 0 && !profile.usualLocations.includes(transaction.location)) {
    evidence.push({
      type: 'LOCATION_DEVIATION',
      description: `Current transaction occurred outside the customer's usual location pattern.`,
      severity: 'MEDIUM',
      source: 'BehaviourAgent',
      details: {
        current: transaction.location,
        usual: profile.usualLocations,
      },
    });
  }

  // Device deviation
  if (transaction.deviceId && profile.usualDevices.length > 0 && !profile.usualDevices.includes(transaction.deviceId)) {
    evidence.push({
      type: 'DEVICE_DEVIATION',
      description: `Device ${transaction.deviceId} not previously used by ${customer.customerId}.`,
      severity: 'HIGH',
      source: 'BehaviourAgent',
      details: { deviceId: transaction.deviceId, usualDevices: profile.usualDevices },
    });
  }

  // Time-of-day deviation
  const hour = new Date(transaction.timestamp).getHours();
  if (profile.usualHours.length > 0 && !profile.usualHours.includes(hour)) {
    evidence.push({
      type: 'TIME_DEVIATION',
      description: `Transaction at ${String(hour).padStart(2, '0')}:00 is outside the customer's usual transaction hours.`,
      severity: 'LOW',
      source: 'BehaviourAgent',
      details: { hour, usualHours: profile.usualHours },
    });
  }

  // Frequency deviation
  if (profile.historicalCount > 0) {
    const avgPerDay = profile.historicalCount / 90;
    const last24h = history.filter((t) => now - new Date(t.timestamp) <= 24 * 60 * 60 * 1000).length;
    if (avgPerDay > 0 && last24h > avgPerDay * 4) {
      evidence.push({
        type: 'FREQUENCY_DEVIATION',
        description: `Transaction frequency in last 24h is abnormally high vs 90-day baseline.`,
        severity: 'MEDIUM',
        source: 'BehaviourAgent',
        details: { last24h, avgPerDay: Number(avgPerDay.toFixed(2)) },
      });
    }
  }

  return {
    customerId: customer.customerId,
    profile,
    evidence,
  };
}

module.exports = { analyzeBehaviour };
