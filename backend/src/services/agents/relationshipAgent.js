const Transaction = require('../../models/Transaction');
const Device = require('../../models/Device');
const Alert = require('../../models/Alert');
const Investigation = require('../../models/Investigation');

/**
 * Pattern / Relationship Agent — builds an entity graph from MongoDB data.
 * Entities: Customer, Transaction, Device, Location, Alert.
 * Relationships: MADE_TRANSACTION, USED_DEVICE, OCCURRED_AT,
 * ASSOCIATED_WITH, PREVIOUS_ALERT.
 *
 * Output is structured for React Flow consumption.
 */
async function buildRelationshipGraph({ transaction, customer, deviceAnalysis }) {
  const nodes = [];
  const edges = [];
  const nodeIds = new Set();

  const addNode = (node) => {
    if (nodeIds.has(node.id)) return;
    nodeIds.add(node.id);
    nodes.push(node);
  };

  const addEdge = (edge) => edges.push(edge);

  // Customer node
  addNode({
    id: `customer-${customer.customerId}`,
    type: 'customer',
    data: {
      label: `${customer.name}`,
      sublabel: customer.customerId,
      details: {
        customerId: customer.customerId,
        name: customer.name,
        averageTransactionAmount: customer.averageTransactionAmount,
        usualLocations: customer.usualLocations,
        accountAge: customer.accountAge,
      },
    },
  });

  // Transaction node
  addNode({
    id: `txn-${transaction.transactionId}`,
    type: 'transaction',
    data: {
      label: `₹${transaction.amount.toLocaleString('en-IN')}`,
      sublabel: transaction.transactionId,
      details: {
        transactionId: transaction.transactionId,
        amount: transaction.amount,
        merchant: transaction.merchant,
        timestamp: transaction.timestamp,
        status: transaction.status,
      },
    },
  });

  addEdge({
    id: `e-${customer.customerId}-${transaction.transactionId}`,
    source: `customer-${customer.customerId}`,
    target: `txn-${transaction.transactionId}`,
    label: 'MADE_TRANSACTION',
    type: 'MADE_TRANSACTION',
  });

  // Device node + edges
  if (transaction.deviceId) {
    addNode({
      id: `device-${transaction.deviceId}`,
      type: 'device',
      data: {
        label: transaction.deviceId,
        sublabel: 'Device',
        details: deviceAnalysis.device || { deviceId: transaction.deviceId },
      },
    });
    addEdge({
      id: `e-txn-${transaction.transactionId}-dev-${transaction.deviceId}`,
      source: `txn-${transaction.transactionId}`,
      target: `device-${transaction.deviceId}`,
      label: 'USED_DEVICE',
      type: 'USED_DEVICE',
    });

    // Other customers sharing this device
    for (const otherId of deviceAnalysis.relatedCustomers || []) {
      addNode({
        id: `customer-${otherId}`,
        type: 'customer',
        data: { label: otherId, sublabel: 'Related customer', details: { customerId: otherId } },
      });
      addEdge({
        id: `e-dev-${transaction.deviceId}-${otherId}`,
        source: `device-${transaction.deviceId}`,
        target: `customer-${otherId}`,
        label: 'ASSOCIATED_WITH',
        type: 'ASSOCIATED_WITH',
      });
    }
  }

  // Location node
  addNode({
    id: `loc-${transaction.location}`,
    type: 'location',
    data: { label: transaction.location, sublabel: 'Location', details: { location: transaction.location } },
  });
  addEdge({
    id: `e-txn-${transaction.transactionId}-loc`,
    source: `txn-${transaction.transactionId}`,
    target: `loc-${transaction.location}`,
    label: 'OCCURRED_AT',
    type: 'OCCURRED_AT',
  });

  // Alerts for this customer / transaction
  const alerts = await Alert.find({
    $or: [{ transactionId: transaction.transactionId }, { customerId: customer.customerId }],
  }).sort({ createdAt: -1 });

  for (const alert of alerts) {
    addNode({
      id: `alert-${alert.alertId}`,
      type: 'alert',
      data: {
        label: alert.alertId,
        sublabel: alert.severity,
        details: {
          alertId: alert.alertId,
          severity: alert.severity,
          status: alert.status,
          triggerReasons: alert.triggerReasons,
          createdAt: alert.createdAt,
        },
      },
    });
    addEdge({
      id: `e-${alert.alertId}-${transaction.transactionId}`,
      source: `alert-${alert.alertId}`,
      target: `txn-${transaction.transactionId}`,
      label: 'PREVIOUS_ALERT',
      type: 'PREVIOUS_ALERT',
    });
  }

  // Previous cases discovered via the device
  for (const caseId of deviceAnalysis.previousCases || []) {
    addNode({
      id: `case-${caseId}`,
      type: 'case',
      data: { label: caseId, sublabel: 'Previous case', details: { caseId } },
    });
    if (transaction.deviceId) {
      addEdge({
        id: `e-dev-${transaction.deviceId}-${caseId}`,
        source: `device-${transaction.deviceId}`,
        target: `case-${caseId}`,
        label: 'PREVIOUS_ALERT',
        type: 'PREVIOUS_ALERT',
      });
    }
  }

  return { nodes, edges };
}

module.exports = { buildRelationshipGraph };
