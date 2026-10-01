const Device = require('../../models/Device');
const Transaction = require('../../models/Transaction');
const Investigation = require('../../models/Investigation');

/**
 * Device Analysis Agent — deterministic, MongoDB-driven.
 * Discovers: device novelty for the customer, shared customers, transaction
 * count, previous alerts, and prior cases the device appeared in.
 */
async function analyzeDevice({ transaction, customer, excludeCaseId = null }) {
  const evidence = [];
  const deviceId = transaction.deviceId;

  if (!deviceId) {
    return { deviceId: null, isNewForCustomer: false, evidence, relatedCustomers: [], previousCases: [] };
  }

  const device = await Device.findOne({ deviceId });
  const isNewForCustomer =
    customer.usualDevices && !customer.usualDevices.includes(deviceId);

  if (isNewForCustomer) {
    evidence.push({
      type: 'NEW_DEVICE',
      description: `Device ${deviceId} not previously used by ${customer.customerId}.`,
      severity: 'HIGH',
      source: 'DeviceAgent',
      details: { deviceId },
    });
  }

  const relatedCustomers = device ? device.customers.filter((c) => c !== customer.customerId) : [];
  if (relatedCustomers.length > 0) {
    evidence.push({
      type: 'SHARED_DEVICE',
      description: `Device ${deviceId} is associated with ${relatedCustomers.length + 1} customers: ${[customer.customerId, ...relatedCustomers].join(', ')}.`,
      severity: 'HIGH',
      source: 'DeviceAgent',
      details: { deviceId, customers: [customer.customerId, ...relatedCustomers] },
    });
  }

  // Transactions on this device
  const deviceTxns = await Transaction.find({ deviceId }).sort({ timestamp: -1 });
  if (deviceTxns.length > 0) {
    evidence.push({
      type: 'DEVICE_HISTORY',
      description: `Device ${deviceId} has ${deviceTxns.length} recorded transactions.`,
      severity: 'INFO',
      source: 'DeviceAgent',
      details: { deviceId, transactionCount: deviceTxns.length },
    });
  }

  // Previous alerts on this device
  const previousAlerts = device ? device.previousAlerts : [];
  if (previousAlerts.length > 0) {
    evidence.push({
      type: 'PREVIOUS_ALERT',
      description: `Device ${deviceId} appeared in previous alert(s): ${previousAlerts.join(', ')}.`,
      severity: 'HIGH',
      source: 'DeviceAgent',
      details: { deviceId, previousAlerts },
    });
  }

  // Prior investigations involving this device (via transactions on the device)
  const deviceTxnIds = deviceTxns.map((t) => t.transactionId);
  const previousCases = await Investigation.find({
    transactionId: { $in: deviceTxnIds },
    caseId: { $ne: excludeCaseId },
  }).distinct('caseId');

  if (previousCases.length > 0) {
    evidence.push({
      type: 'PREVIOUS_CASE',
      description: `Device ${deviceId} appeared in previous investigation case(s): ${previousCases.join(', ')}.`,
      severity: 'HIGH',
      source: 'DeviceAgent',
      details: { deviceId, previousCases },
    });
  }

  return {
    deviceId,
    isNewForCustomer,
    device: device
      ? {
          deviceId: device.deviceId,
          customers: device.customers,
          locations: device.locations,
          transactionCount: device.transactionCount,
          previousAlerts: device.previousAlerts,
          firstSeen: device.firstSeen,
          lastSeen: device.lastSeen,
        }
      : null,
    relatedCustomers,
    previousCases,
    evidence,
  };
}

module.exports = { analyzeDevice };
