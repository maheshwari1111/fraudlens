const Transaction = require('../../models/Transaction');
const Customer = require('../../models/Customer');
const Device = require('../../models/Device');
const Alert = require('../../models/Alert');
const Investigation = require('../../models/Investigation');

/**
 * Focus Agent — scoped deep-dive for "Request Additional Investigation".
 *
 * The investigator selects investigation areas; this agent re-queries MongoDB
 * for ONLY those areas and returns additional evidence items. It is fully
 * deterministic: every statement is backed by a database record, and an area
 * with nothing to report returns an explicit "no records" evidence item rather
 * than being silently skipped.
 *
 * Areas:
 *   TRANSACTION_HISTORY  - full transaction history for the customer
 *   DEVICE_HISTORY       - every transaction ever seen on the device
 *   RELATED_ACCOUNTS     - other customers linked through the device
 *   LOCATION_HISTORY     - geo history for the customer + the device
 *   PREVIOUS_ALERTS      - alerts for the customer and on the device
 *   RELATED_TRANSACTIONS - transactions on the device by other customers
 */

const AREA_LABELS = {
  TRANSACTION_HISTORY: 'Transaction History',
  DEVICE_HISTORY: 'Device History',
  RELATED_ACCOUNTS: 'Related Accounts',
  LOCATION_HISTORY: 'Location History',
  PREVIOUS_ALERTS: 'Previous Alerts',
  RELATED_TRANSACTIONS: 'Related Transactions',
};

const SUPPORTED_AREAS = Object.keys(AREA_LABELS);

/** Reject unknown areas instead of silently ignoring them. */
function validateAreas(areas) {
  if (areas == null) return { areas: [], invalid: [] };
  const list = Array.isArray(areas) ? areas : [areas];
  const clean = [];
  const invalid = [];
  for (const a of list) {
    const key = String(a).trim().toUpperCase();
    if (SUPPORTED_AREAS.includes(key)) {
      if (!clean.includes(key)) clean.push(key);
    } else {
      invalid.push(String(a));
    }
  }
  return { areas: clean, invalid };
}

async function runFocusAnalysis({ transaction, customer, areas, excludeCaseId = null }) {
  const evidence = [];
  const areaResults = [];

  const addArea = (area, found, evidenceItems, note) => {
    areaResults.push({ area, label: AREA_LABELS[area], recordCount: found, note });
    for (const item of evidenceItems) evidence.push({ ...item, source: 'FocusAgent', details: { ...(item.details || {}), area } });
  };

  // --- TRANSACTION_HISTORY -------------------------------------------------
  if (areas.includes('TRANSACTION_HISTORY')) {
    const history = await Transaction.find({ customerId: customer.customerId }).sort({ timestamp: -1 });
    const total = history.reduce((s, t) => s + t.amount, 0);
    const flagged = history.filter((t) => t.status === 'FLAGGED' || t.status === 'BLOCKED');
    addArea(
      'TRANSACTION_HISTORY',
      history.length,
      [
        {
          type: 'FOCUS_TRANSACTION_HISTORY',
          description: `Deep-dive: ${customer.customerId} has ${history.length} recorded transactions totalling ₹${total.toLocaleString('en-IN')}; ${flagged.length} flagged or blocked.`,
          severity: flagged.length > 0 ? 'HIGH' : 'INFO',
          details: { transactionCount: history.length, totalAmount: total, flaggedCount: flagged.length, transactionIds: history.slice(0, 25).map((t) => t.transactionId) },
        },
      ],
      `${history.length} transactions reviewed`
    );
  }

  // --- DEVICE_HISTORY ------------------------------------------------------
  if (areas.includes('DEVICE_HISTORY')) {
    if (!transaction.deviceId) {
      addArea('DEVICE_HISTORY', 0, [], 'No device on the subject transaction');
    } else {
      const device = await Device.findOne({ deviceId: transaction.deviceId });
      const deviceTxns = await Transaction.find({ deviceId: transaction.deviceId }).sort({ timestamp: -1 });
      const locations = [...new Set(deviceTxns.map((t) => t.location))];
      addArea(
        'DEVICE_HISTORY',
        deviceTxns.length,
        [
          {
            type: 'FOCUS_DEVICE_HISTORY',
            description:
              `Deep-dive: device ${transaction.deviceId} has ${deviceTxns.length} transactions` +
              (device?.previousAlerts?.length ? ` and appeared in ${device.previousAlerts.length} previous alert(s): ${device.previousAlerts.join(', ')}` : ' and no previous alerts') +
              '.',
            severity: device?.previousAlerts?.length ? 'HIGH' : 'INFO',
            details: {
              deviceId: transaction.deviceId,
              transactionCount: deviceTxns.length,
              locations,
              firstSeen: device?.firstSeen,
              lastSeen: device?.lastSeen,
              previousAlerts: device?.previousAlerts || [],
            },
          },
        ],
        `${deviceTxns.length} device transactions reviewed`
      );
    }
  }

  // --- RELATED_ACCOUNTS ----------------------------------------------------
  if (areas.includes('RELATED_ACCOUNTS')) {
    if (!transaction.deviceId) {
      addArea('RELATED_ACCOUNTS', 0, [], 'No device on the subject transaction');
    } else {
      const device = await Device.findOne({ deviceId: transaction.deviceId });
      const relatedIds = (device?.customers || []).filter((c) => c !== customer.customerId);
      const related = await Customer.find({ customerId: { $in: relatedIds } }).select('customerId name accountAge averageTransactionAmount');
      addArea(
        'RELATED_ACCOUNTS',
        related.length,
        [
          {
            type: 'FOCUS_RELATED_ACCOUNTS',
            description:
              related.length > 0
                ? `Deep-dive: device ${transaction.deviceId} links ${customer.customerId} to ${related.length} related account(s): ${related.map((r) => `${r.name} (${r.customerId})`).join(', ')}.`
                : `Deep-dive: no other account is currently linked to device ${transaction.deviceId}.`,
            severity: related.length > 0 ? 'HIGH' : 'INFO',
            details: {
              deviceId: transaction.deviceId,
              relatedAccounts: related.map((r) => ({
                customerId: r.customerId,
                name: r.name,
                accountAge: r.accountAge,
                averageTransactionAmount: r.averageTransactionAmount,
              })),
            },
          },
        ],
        related.length > 0 ? `${related.length} linked account(s)` : 'No linked accounts'
      );
    }
  }

  // --- LOCATION_HISTORY ----------------------------------------------------
  if (areas.includes('LOCATION_HISTORY')) {
    const history = await Transaction.find({ customerId: customer.customerId }).sort({ timestamp: -1 }).limit(60);
    const counts = history.reduce((acc, t) => ({ ...acc, [t.location]: (acc[t.location] || 0) + 1 }), {});
    const usual = customer.usualLocations || [];
    const currentCount = counts[transaction.location] || 0;
    addArea(
      'LOCATION_HISTORY',
      history.length,
      [
        {
          type: 'FOCUS_LOCATION_HISTORY',
          description:
            `Deep-dive: ${transaction.location} appears in ${currentCount} of the last ${history.length} transactions for ${customer.customerId}` +
            (usual.length ? `; declared usual location(s): ${usual.join(', ')}.` : '.'),
          severity: usual.length > 0 && !usual.includes(transaction.location) ? 'MEDIUM' : 'INFO',
          details: { locationCounts: counts, current: transaction.location, currentCount, usual, sampledTransactions: history.length },
        },
      ],
      `${Object.keys(counts).length} distinct location(s)`
    );
  }

  // --- PREVIOUS_ALERTS -----------------------------------------------------
  if (areas.includes('PREVIOUS_ALERTS')) {
    const query = [{ customerId: customer.customerId }];
    if (transaction.deviceId) query.push({ 'devices.deviceId': transaction.deviceId });
    const customerAlerts = await Alert.find({ customerId: customer.customerId }).sort({ createdAt: -1 });
    const deviceTxns = transaction.deviceId
      ? await Transaction.find({ deviceId: transaction.deviceId }).select('transactionId')
      : [];
    const deviceAlerts = transaction.deviceId
      ? await Alert.find({ transactionId: { $in: deviceTxns.map((t) => t.transactionId) } }).sort({ createdAt: -1 })
      : [];
    const byId = new Map();
    for (const a of [...customerAlerts, ...deviceAlerts]) byId.set(a.alertId, a);
    const all = [...byId.values()].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    addArea(
      'PREVIOUS_ALERTS',
      all.length,
      [
        {
          type: 'FOCUS_PREVIOUS_ALERTS',
          description:
            all.length > 0
              ? `Deep-dive: ${all.length} alert(s) found for this customer or device: ${all.map((a) => `${a.alertId} (${a.severity})`).join(', ')}.`
              : 'Deep-dive: no previous alerts found for this customer or device.',
          severity: all.length > 0 ? 'HIGH' : 'INFO',
          details: { alerts: all.map((a) => ({ alertId: a.alertId, severity: a.severity, status: a.status, transactionId: a.transactionId, createdAt: a.createdAt })) },
        },
      ],
      all.length > 0 ? `${all.length} alert(s)` : 'No previous alerts'
    );
  }

  // --- RELATED_TRANSACTIONS -----------------------------------------------
  if (areas.includes('RELATED_TRANSACTIONS')) {
    if (!transaction.deviceId) {
      addArea('RELATED_TRANSACTIONS', 0, [], 'No device on the subject transaction');
    } else {
      const deviceTxns = await Transaction.find({ deviceId: transaction.deviceId, transactionId: { $ne: transaction.transactionId } }).sort({ timestamp: -1 });
      const foreign = deviceTxns.filter((t) => t.customerId !== customer.customerId);
      const caseIds = await Investigation.find({
        transactionId: { $in: deviceTxns.map((t) => t.transactionId) },
        ...(excludeCaseId ? { caseId: { $ne: excludeCaseId } } : {}),
      }).distinct('caseId');
      addArea(
        'RELATED_TRANSACTIONS',
        deviceTxns.length,
        [
          {
            type: 'FOCUS_RELATED_TRANSACTIONS',
            description:
              deviceTxns.length > 0
                ? `Deep-dive: device ${transaction.deviceId} carries ${deviceTxns.length} other transaction(s), ${foreign.length} of them belonging to other customers` +
                  (caseIds.length ? `; linked to prior case(s) ${caseIds.join(', ')}.` : '; no linked prior cases.')
                : `Deep-dive: no other transactions recorded on device ${transaction.deviceId}.`,
            severity: foreign.length > 0 ? 'HIGH' : 'INFO',
            details: {
              deviceId: transaction.deviceId,
              transactionCount: deviceTxns.length,
              foreignTransactionCount: foreign.length,
              transactions: deviceTxns.slice(0, 25).map((t) => ({ transactionId: t.transactionId, customerId: t.customerId, amount: t.amount, location: t.location, status: t.status })),
              linkedCaseIds: caseIds,
            },
          },
        ],
        deviceTxns.length > 0 ? `${deviceTxns.length} related transaction(s)` : 'No related transactions'
      );
    }
  }

  const totalRecords = areaResults.reduce((s, a) => s + a.recordCount, 0);
  const summary = areas.length === 0
    ? 'No additional investigation areas selected'
    : `Deep-dive across ${areas.length} area(s): ${areaResults.map((a) => `${a.label} (${a.recordCount} record(s))`).join(', ')}`;

  return { evidence, areaResults, areas, summary, totalRecords };
}

module.exports = { runFocusAnalysis, validateAreas, SUPPORTED_AREAS, AREA_LABELS };
