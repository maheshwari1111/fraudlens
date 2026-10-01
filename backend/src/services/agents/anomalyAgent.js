/**
 * Anomaly Agent — deterministic rules.
 * Detects: amount anomaly, unusual time, new device, unusual location,
 * rapid transactions, abnormal frequency.
 */
function detectAnomalies({ transaction, customer, behaviour, transactionAnalysis }) {
  const anomalies = [];
  const hour = new Date(transaction.timestamp).getHours();

  // AMOUNT_ANOMALY
  if (customer.averageTransactionAmount > 0) {
    const ratio = transaction.amount / customer.averageTransactionAmount;
    if (ratio >= 3) {
      anomalies.push({
        type: 'AMOUNT_ANOMALY',
        severity: ratio >= 5 ? 'HIGH' : 'MEDIUM',
        description: 'Current transaction exceeds the customer\'s historical baseline.',
        details: {
          current: transaction.amount,
          baseline: customer.averageTransactionAmount,
          ratio: Number(ratio.toFixed(2)),
        },
      });
    }
  }

  // UNUSUAL_TIME (00:00–05:00)
  if (hour >= 0 && hour < 5) {
    anomalies.push({
      type: 'UNUSUAL_TIME',
      severity: 'MEDIUM',
      description: `Transaction occurred at ${String(hour).padStart(2, '0')}:00, within the unusual-hours window (00:00–05:00).`,
      details: { hour },
    });
  }

  // NEW_DEVICE
  if (transaction.deviceId && customer.usualDevices && !customer.usualDevices.includes(transaction.deviceId)) {
    anomalies.push({
      type: 'NEW_DEVICE',
      severity: 'HIGH',
      description: `Device ${transaction.deviceId} has not been used by ${customer.customerId} before.`,
      details: { deviceId: transaction.deviceId },
    });
  }

  // UNUSUAL_LOCATION
  if (customer.usualLocations && !customer.usualLocations.includes(transaction.location)) {
    anomalies.push({
      type: 'UNUSUAL_LOCATION',
      severity: 'MEDIUM',
      description: `Location ${transaction.location} is outside the customer's usual locations.`,
      details: { location: transaction.location, usual: customer.usualLocations },
    });
  }

  // RAPID_TRANSACTIONS
  if (transactionAnalysis.velocity.last24hCount >= 3) {
    anomalies.push({
      type: 'RAPID_TRANSACTIONS',
      severity: 'MEDIUM',
      description: `${transactionAnalysis.velocity.last24hCount} transactions in the last 24 hours.`,
      details: { last24hCount: transactionAnalysis.velocity.last24hCount },
    });
  }

  // ABNORMAL_FREQUENCY
  const freqEvidence = (behaviour.evidence || []).find((e) => e.type === 'FREQUENCY_DEVIATION');
  if (freqEvidence) {
    anomalies.push({
      type: 'ABNORMAL_FREQUENCY',
      severity: 'MEDIUM',
      description: 'Transaction frequency is abnormally high vs the 90-day baseline.',
      details: freqEvidence.details,
    });
  }

  return anomalies;
}

module.exports = { detectAnomalies };
