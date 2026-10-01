/**
 * Seed script — creates synthetic demo data.
 *
 * Main demonstration case: CASE-1042
 *   Customer C1024 (usual: Nagpur, avg ₹8,200)
 *   Transaction TX1042 ₹78,500 at 02:17 AM from Mumbai
 *   Device D8821 — shared with C1091, C1177; appeared in CASE887
 *
 * All data is synthetic. Relationships are stored in MongoDB so the
 * application discovers them via queries — nothing is hardcoded in the UI.
 */
const mongoose = require('mongoose');
const { connectDB, disconnectDB } = require('../src/config/db');

const Customer = require('../src/models/Customer');
const Transaction = require('../src/models/Transaction');
const Device = require('../src/models/Device');
const Alert = require('../src/models/Alert');
const Investigation = require('../src/models/Investigation');
const AgentLog = require('../src/models/AgentLog');
const Report = require('../src/models/Report');
const AuditLog = require('../src/models/AuditLog');

const NOW = Date.now();
const daysAgo = (d, h = 12, m = 0) => new Date(NOW - d * 24 * 60 * 60 * 1000 - (12 - h) * 60 * 60 * 1000 - (60 - m) * 60 * 1000);

async function clearAll() {
  await Promise.all([
    Customer.deleteMany({}),
    Transaction.deleteMany({}),
    Device.deleteMany({}),
    Alert.deleteMany({}),
    Investigation.deleteMany({}),
    AgentLog.deleteMany({}),
    Report.deleteMany({}),
    AuditLog.deleteMany({}),
  ]);
}

async function seed() {
  await connectDB();
  await clearAll();
  console.log('[seed] Cleared existing data');

  // --- Customers -----------------------------------------------------------
  const customers = [
    {
      customerId: 'C1024',
      name: 'Ananya Sharma',
      averageTransactionAmount: 8200,
      normalTransactionRange: { min: 2000, max: 15000 },
      usualLocations: ['Nagpur'],
      usualDevices: ['D1001'],
      usualTransactionHours: [9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21],
      accountAge: 720,
    },
    {
      customerId: 'C1091',
      name: 'Rohan Mehta',
      averageTransactionAmount: 12500,
      normalTransactionRange: { min: 3000, max: 25000 },
      usualLocations: ['Mumbai', 'Pune'],
      usualDevices: ['D1002'],
      usualTransactionHours: [8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20],
      accountAge: 540,
    },
    {
      customerId: 'C1177',
      name: 'Priya Nair',
      averageTransactionAmount: 6800,
      normalTransactionRange: { min: 1500, max: 12000 },
      usualLocations: ['Kochi', 'Mumbai'],
      usualDevices: ['D1003'],
      usualTransactionHours: [9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22],
      accountAge: 430,
    },
    {
      customerId: 'C1001',
      name: 'Arjun Patel',
      averageTransactionAmount: 15000,
      normalTransactionRange: { min: 5000, max: 30000 },
      usualLocations: ['Delhi'],
      usualDevices: ['D1004'],
      usualTransactionHours: [9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20],
      accountAge: 900,
    },
    {
      customerId: 'C1002',
      name: 'Sneha Kulkarni',
      averageTransactionAmount: 5400,
      normalTransactionRange: { min: 1000, max: 10000 },
      usualLocations: ['Bangalore'],
      usualDevices: ['D1005'],
      usualTransactionHours: [10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21],
      accountAge: 610,
    },
    {
      customerId: 'C1003',
      name: 'Vikram Reddy',
      averageTransactionAmount: 22000,
      normalTransactionRange: { min: 8000, max: 45000 },
      usualLocations: ['Hyderabad', 'Chennai'],
      usualDevices: ['D1006'],
      usualTransactionHours: [8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21],
      accountAge: 830,
    },
    {
      customerId: 'C1004',
      name: 'Meera Iyer',
      averageTransactionAmount: 9100,
      normalTransactionRange: { min: 2500, max: 18000 },
      usualLocations: ['Chennai'],
      usualDevices: ['D1007'],
      usualTransactionHours: [9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22],
      accountAge: 380,
    },
    {
      customerId: 'C1005',
      name: 'Karan Singh',
      averageTransactionAmount: 11300,
      normalTransactionRange: { min: 3000, max: 22000 },
      usualLocations: ['Jaipur'],
      usualDevices: ['D1008'],
      usualTransactionHours: [9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21],
      accountAge: 500,
    },
  ];
  await Customer.insertMany(customers);
  console.log(`[seed] Inserted ${customers.length} customers`);

  // --- Devices -------------------------------------------------------------
  const devices = [
    {
      deviceId: 'D1001',
      customers: ['C1024'],
      locations: ['Nagpur'],
      transactionCount: 18,
      previousAlerts: [],
      firstSeen: daysAgo(700),
      lastSeen: daysAgo(1),
    },
    {
      deviceId: 'D1002',
      customers: ['C1091'],
      locations: ['Mumbai', 'Pune'],
      transactionCount: 22,
      previousAlerts: [],
      firstSeen: daysAgo(500),
      lastSeen: daysAgo(2),
    },
    {
      deviceId: 'D1003',
      customers: ['C1177'],
      locations: ['Kochi', 'Mumbai'],
      transactionCount: 15,
      previousAlerts: [],
      firstSeen: daysAgo(400),
      lastSeen: daysAgo(3),
    },
    {
      deviceId: 'D1004',
      customers: ['C1001'],
      locations: ['Delhi'],
      transactionCount: 25,
      previousAlerts: [],
      firstSeen: daysAgo(850),
      lastSeen: daysAgo(1),
    },
    {
      deviceId: 'D1005',
      customers: ['C1002'],
      locations: ['Bangalore'],
      transactionCount: 12,
      previousAlerts: [],
      firstSeen: daysAgo(600),
      lastSeen: daysAgo(4),
    },
    {
      deviceId: 'D1006',
      customers: ['C1003'],
      locations: ['Hyderabad', 'Chennai'],
      transactionCount: 20,
      previousAlerts: [],
      firstSeen: daysAgo(800),
      lastSeen: daysAgo(2),
    },
    {
      deviceId: 'D1007',
      customers: ['C1004'],
      locations: ['Chennai'],
      transactionCount: 14,
      previousAlerts: [],
      firstSeen: daysAgo(350),
      lastSeen: daysAgo(5),
    },
    {
      deviceId: 'D1008',
      customers: ['C1005'],
      locations: ['Jaipur'],
      transactionCount: 16,
      previousAlerts: [],
      firstSeen: daysAgo(480),
      lastSeen: daysAgo(3),
    },
    {
      // The suspicious shared device — central to CASE-1042
      deviceId: 'D8821',
      customers: ['C1024', 'C1091', 'C1177'],
      locations: ['Mumbai', 'Nagpur', 'Pune', 'Kochi'],
      transactionCount: 9,
      previousAlerts: ['ALR-887'],
      firstSeen: daysAgo(45),
      lastSeen: daysAgo(0, 2, 17),
    },
  ];
  await Device.insertMany(devices);
  console.log(`[seed] Inserted ${devices.length} devices`);

  // --- Transactions --------------------------------------------------------
  const txns = [];

  // C1024 historical transactions (Nagpur, normal amounts, device D1001)
  const c1024History = [
    { amount: 7500, d: 30, loc: 'Nagpur', dev: 'D1001' },
    { amount: 9200, d: 28, loc: 'Nagpur', dev: 'D1001' },
    { amount: 6800, d: 25, loc: 'Nagpur', dev: 'D1001' },
    { amount: 11000, d: 22, loc: 'Nagpur', dev: 'D1001' },
    { amount: 5400, d: 19, loc: 'Nagpur', dev: 'D1001' },
    { amount: 8900, d: 16, loc: 'Nagpur', dev: 'D1001' },
    { amount: 12300, d: 14, loc: 'Nagpur', dev: 'D1001' },
    { amount: 7100, d: 11, loc: 'Nagpur', dev: 'D1001' },
    { amount: 9800, d: 8, loc: 'Nagpur', dev: 'D1001' },
    { amount: 6200, d: 5, loc: 'Nagpur', dev: 'D1001' },
    { amount: 10500, d: 3, loc: 'Nagpur', dev: 'D1001' },
    { amount: 8400, d: 1, loc: 'Nagpur', dev: 'D1001' },
  ];
  c1024History.forEach((t, i) => {
    txns.push({
      transactionId: `TX${2000 + i}`,
      customerId: 'C1024',
      amount: t.amount,
      transactionType: 'PURCHASE',
      merchant: 'Retail Store',
      location: t.loc,
      deviceId: t.dev,
      timestamp: daysAgo(t.d, 14, 30),
      status: 'COMPLETED',
    });
  });

  // TX1042 — the suspicious transaction (CASE-1042)
  txns.push({
    transactionId: 'TX1042',
    customerId: 'C1024',
    amount: 78500,
    transactionType: 'TRANSFER',
    merchant: 'QuickPay Transfer',
    location: 'Mumbai',
    deviceId: 'D8821',
    timestamp: daysAgo(0, 2, 17),
    status: 'FLAGGED',
  });

  // C1091 transactions (some on D8821 — shared device)
  const c1091Txns = [
    { id: 'TX3001', amount: 14000, d: 20, loc: 'Mumbai', dev: 'D1002' },
    { id: 'TX3002', amount: 9800, d: 18, loc: 'Pune', dev: 'D1002' },
    { id: 'TX3003', amount: 16500, d: 15, loc: 'Mumbai', dev: 'D1002' },
    { id: 'TX3004', amount: 11200, d: 12, loc: 'Mumbai', dev: 'D1002' },
    { id: 'TX3005', amount: 22000, d: 10, loc: 'Mumbai', dev: 'D8821' }, // shared device
    { id: 'TX3006', amount: 8700, d: 7, loc: 'Pune', dev: 'D1002' },
    { id: 'TX3007', amount: 13400, d: 4, loc: 'Mumbai', dev: 'D1002' },
    { id: 'TX3008', amount: 19800, d: 2, loc: 'Mumbai', dev: 'D8821' }, // shared device
  ];
  c1091Txns.forEach((t) => {
    txns.push({
      transactionId: t.id,
      customerId: 'C1091',
      amount: t.amount,
      transactionType: 'ONLINE_PAYMENT',
      merchant: 'E-Commerce',
      location: t.loc,
      deviceId: t.dev,
      timestamp: daysAgo(t.d, 16, 0),
      status: 'COMPLETED',
    });
  });

  // C1177 transactions (some on D8821)
  const c1177Txns = [
    { id: 'TX4001', amount: 5600, d: 25, loc: 'Kochi', dev: 'D1003' },
    { id: 'TX4002', amount: 7200, d: 21, loc: 'Mumbai', dev: 'D1003' },
    { id: 'TX4003', amount: 4800, d: 17, loc: 'Kochi', dev: 'D1003' },
    { id: 'TX4004', amount: 9100, d: 13, loc: 'Mumbai', dev: 'D8821' }, // shared device
    { id: 'TX4005', amount: 6300, d: 9, loc: 'Kochi', dev: 'D1003' },
    { id: 'TX4006', amount: 10500, d: 6, loc: 'Mumbai', dev: 'D1003' },
    { id: 'TX4007', amount: 5900, d: 3, loc: 'Kochi', dev: 'D1003' },
  ];
  c1177Txns.forEach((t) => {
    txns.push({
      transactionId: t.id,
      customerId: 'C1177',
      amount: t.amount,
      transactionType: 'PURCHASE',
      merchant: 'Retail Store',
      location: t.loc,
      deviceId: t.dev,
      timestamp: daysAgo(t.d, 11, 0),
      status: 'COMPLETED',
    });
  });

  // C1001 transactions (Delhi, normal)
  for (let i = 0; i < 8; i++) {
    txns.push({
      transactionId: `TX${5000 + i}`,
      customerId: 'C1001',
      amount: 8000 + Math.floor(Math.random() * 20000),
      transactionType: 'PURCHASE',
      merchant: 'Retail Store',
      location: 'Delhi',
      deviceId: 'D1004',
      timestamp: daysAgo(2 + i * 3, 15, 0),
      status: 'COMPLETED',
    });
  }

  // C1002 transactions (Bangalore, normal)
  for (let i = 0; i < 6; i++) {
    txns.push({
      transactionId: `TX${6000 + i}`,
      customerId: 'C1002',
      amount: 2000 + Math.floor(Math.random() * 8000),
      transactionType: 'PURCHASE',
      merchant: 'Retail Store',
      location: 'Bangalore',
      deviceId: 'D1005',
      timestamp: daysAgo(1 + i * 4, 13, 0),
      status: 'COMPLETED',
    });
  }

  // C1003 transactions (Hyderabad, normal)
  for (let i = 0; i < 7; i++) {
    txns.push({
      transactionId: `TX${7000 + i}`,
      customerId: 'C1003',
      amount: 10000 + Math.floor(Math.random() * 25000),
      transactionType: 'TRANSFER',
      merchant: 'Bank Transfer',
      location: i % 3 === 0 ? 'Chennai' : 'Hyderabad',
      deviceId: 'D1006',
      timestamp: daysAgo(2 + i * 3, 17, 0),
      status: 'COMPLETED',
    });
  }

  // C1004 transactions (Chennai, normal)
  for (let i = 0; i < 5; i++) {
    txns.push({
      transactionId: `TX${8000 + i}`,
      customerId: 'C1004',
      amount: 3000 + Math.floor(Math.random() * 12000),
      transactionType: 'PURCHASE',
      merchant: 'Retail Store',
      location: 'Chennai',
      deviceId: 'D1007',
      timestamp: daysAgo(3 + i * 5, 12, 0),
      status: 'COMPLETED',
    });
  }

  // C1005 transactions (Jaipur, normal)
  for (let i = 0; i < 6; i++) {
    txns.push({
      transactionId: `TX${9000 + i}`,
      customerId: 'C1005',
      amount: 4000 + Math.floor(Math.random() * 15000),
      transactionType: 'PURCHASE',
      merchant: 'Retail Store',
      location: 'Jaipur',
      deviceId: 'D1008',
      timestamp: daysAgo(2 + i * 4, 14, 0),
      status: 'COMPLETED',
    });
  }

  // CASE887 historical transaction (C1091 on D8821 — previous case)
  txns.push({
    transactionId: 'TX8870',
    customerId: 'C1091',
    amount: 45000,
    transactionType: 'TRANSFER',
    merchant: 'QuickPay Transfer',
    location: 'Mumbai',
    deviceId: 'D8821',
    timestamp: daysAgo(40, 3, 0),
    status: 'FLAGGED',
  });

  await Transaction.insertMany(txns);
  console.log(`[seed] Inserted ${txns.length} transactions`);

  // --- Alerts --------------------------------------------------------------
  const alerts = [
    {
      alertId: 'ALR-1042',
      transactionId: 'TX1042',
      customerId: 'C1024',
      triggerReasons: ['AMOUNT_ANOMALY', 'UNUSUAL_TIME', 'NEW_DEVICE', 'UNUSUAL_LOCATION'],
      severity: 'CRITICAL',
      status: 'OPEN',
    },
    {
      alertId: 'ALR-1043',
      transactionId: 'TX3005',
      customerId: 'C1091',
      triggerReasons: ['SHARED_DEVICE'],
      severity: 'HIGH',
      status: 'RESOLVED',
      relatedCaseId: 'CASE-1043',
    },
    {
      alertId: 'ALR-1044',
      transactionId: 'TX4004',
      customerId: 'C1177',
      triggerReasons: ['SHARED_DEVICE'],
      severity: 'HIGH',
      status: 'RESOLVED',
      relatedCaseId: 'CASE-1044',
    },
    {
      alertId: 'ALR-1045',
      transactionId: 'TX5003',
      customerId: 'C1001',
      triggerReasons: ['AMOUNT_ANOMALY'],
      severity: 'MEDIUM',
      status: 'RESOLVED',
      relatedCaseId: 'CASE-1045',
    },
    {
      alertId: 'ALR-1046',
      transactionId: 'TX7002',
      customerId: 'C1003',
      triggerReasons: ['UNUSUAL_TIME'],
      severity: 'LOW',
      status: 'FALSE_POSITIVE',
      relatedCaseId: 'CASE-1046',
    },
    {
      alertId: 'ALR-1047',
      transactionId: 'TX6001',
      customerId: 'C1002',
      triggerReasons: ['AMOUNT_ANOMALY'],
      severity: 'MEDIUM',
      status: 'OPEN',
    },
    {
      alertId: 'ALR-1048',
      transactionId: 'TX8002',
      customerId: 'C1004',
      triggerReasons: ['UNUSUAL_LOCATION'],
      severity: 'LOW',
      status: 'OPEN',
    },
    {
      alertId: 'ALR-887',
      transactionId: 'TX8870',
      customerId: 'C1091',
      triggerReasons: ['AMOUNT_ANOMALY', 'UNUSUAL_TIME', 'SHARED_DEVICE'],
      severity: 'HIGH',
      status: 'RESOLVED',
      relatedCaseId: 'CASE887',
    },
  ];
  await Alert.insertMany(alerts);
  console.log(`[seed] Inserted ${alerts.length} alerts`);

  // --- Previous investigation cases ----------------------------------------
  // CASE887 — previous case involving D8821 (discoverable via TX8870)
  const prevCases = [
    {
      caseId: 'CASE887',
      alertId: 'ALR-887',
      transactionId: 'TX8870',
      customerId: 'C1091',
      status: 'ESCALATED',
      evidence: [
        { evidenceId: 'EV-001', type: 'AMOUNT_ANOMALY', description: 'Amount 3.6x above baseline', severity: 'HIGH', source: 'AnomalyAgent', details: {} },
        { evidenceId: 'EV-002', type: 'UNUSUAL_TIME', description: 'Transaction at 03:00', severity: 'MEDIUM', source: 'AnomalyAgent', details: {} },
        { evidenceId: 'EV-003', type: 'SHARED_DEVICE', description: 'Device D8821 shared across customers', severity: 'HIGH', source: 'DeviceAgent', details: {} },
      ],
      agentResults: [
        { agentName: 'Supervisor', status: 'SUCCESS', summary: 'Investigation completed', evidenceIds: [], duration: 1200 },
        { agentName: 'RiskEngine', status: 'SUCCESS', summary: 'Score 65/100 (HIGH)', evidenceIds: [], duration: 0 },
      ],
      riskScore: 65,
      riskLevel: 'HIGH',
      riskFactors: [
        { type: 'AMOUNT_ANOMALY', weight: 20, evidenceIds: ['EV-001'], description: 'Amount anomaly' },
        { type: 'UNUSUAL_TIME', weight: 10, evidenceIds: ['EV-002'], description: 'Unusual time' },
        { type: 'SHARED_DEVICE', weight: 15, evidenceIds: ['EV-003'], description: 'Shared device' },
      ],
      recommendation: 'HUMAN INVESTIGATION REQUIRED',
      humanDecision: { action: 'ESCALATE', note: 'Confirmed suspicious pattern', decidedBy: 'investigator', decidedAt: daysAgo(38) },
      investigationCycles: 1,
    },
    {
      caseId: 'CASE-1043',
      alertId: 'ALR-1043',
      transactionId: 'TX3005',
      customerId: 'C1091',
      // Below the HIGH threshold, so the supervisor closes it without a
      // mandatory human decision. Kept consistent with runInvestigation().
      status: 'CLOSED',
      evidence: [
        { evidenceId: 'EV-001', type: 'SHARED_DEVICE', description: 'Device D8821 shared with C1024, C1177', severity: 'HIGH', source: 'DeviceAgent', details: {} },
      ],
      agentResults: [
        { agentName: 'Supervisor', status: 'SUCCESS', summary: 'Investigation completed', evidenceIds: [], duration: 900 },
        { agentName: 'RiskEngine', status: 'SUCCESS', summary: 'Score 15/100 (LOW)', evidenceIds: [], duration: 0 },
      ],
      riskScore: 15,
      riskLevel: 'LOW',
      riskFactors: [{ type: 'SHARED_DEVICE', weight: 15, evidenceIds: ['EV-001'], description: 'Shared device' }],
      recommendation: 'No immediate human action required',
      humanDecision: { action: 'CLOSE_APPROVE', note: 'Shared device already known; no further action.', decidedBy: 'investigator', decidedAt: daysAgo(21) },
      investigationCycles: 1,
    },
    {
      caseId: 'CASE-1044',
      alertId: 'ALR-1044',
      transactionId: 'TX4004',
      customerId: 'C1177',
      status: 'CLOSED',
      evidence: [
        { evidenceId: 'EV-001', type: 'SHARED_DEVICE', description: 'Device D8821 shared with C1024, C1091', severity: 'HIGH', source: 'DeviceAgent', details: {} },
      ],
      agentResults: [
        { agentName: 'Supervisor', status: 'SUCCESS', summary: 'Investigation completed', evidenceIds: [], duration: 800 },
        { agentName: 'RiskEngine', status: 'SUCCESS', summary: 'Score 15/100 (LOW)', evidenceIds: [], duration: 0 },
      ],
      riskScore: 15,
      riskLevel: 'LOW',
      riskFactors: [{ type: 'SHARED_DEVICE', weight: 15, evidenceIds: ['EV-001'], description: 'Shared device' }],
      recommendation: 'No immediate human action required',
      humanDecision: { action: 'CLOSE_APPROVE', note: 'Shared device already known; no further action.', decidedBy: 'investigator', decidedAt: daysAgo(20) },
      investigationCycles: 1,
    },
    {
      caseId: 'CASE-1045',
      alertId: 'ALR-1045',
      transactionId: 'TX5003',
      customerId: 'C1001',
      status: 'CLOSED',
      evidence: [
        { evidenceId: 'EV-001', type: 'AMOUNT_ANOMALY', description: 'Amount above baseline', severity: 'MEDIUM', source: 'AnomalyAgent', details: {} },
      ],
      agentResults: [
        { agentName: 'Supervisor', status: 'SUCCESS', summary: 'Investigation completed', evidenceIds: [], duration: 700 },
        { agentName: 'RiskEngine', status: 'SUCCESS', summary: 'Score 20/100 (LOW)', evidenceIds: [], duration: 0 },
      ],
      riskScore: 20,
      riskLevel: 'LOW',
      riskFactors: [{ type: 'AMOUNT_ANOMALY', weight: 20, evidenceIds: ['EV-001'], description: 'Amount anomaly' }],
      recommendation: 'No immediate human action required',
      humanDecision: { action: 'CLOSE_APPROVE', note: 'Within acceptable range', decidedBy: 'investigator', decidedAt: daysAgo(1) },
      investigationCycles: 1,
    },
    {
      caseId: 'CASE-1046',
      alertId: 'ALR-1046',
      transactionId: 'TX7002',
      customerId: 'C1003',
      status: 'FALSE_POSITIVE',
      evidence: [
        { evidenceId: 'EV-001', type: 'UNUSUAL_TIME', description: 'Transaction at unusual hour', severity: 'LOW', source: 'AnomalyAgent', details: {} },
      ],
      agentResults: [
        { agentName: 'Supervisor', status: 'SUCCESS', summary: 'Investigation completed', evidenceIds: [], duration: 600 },
        { agentName: 'RiskEngine', status: 'SUCCESS', summary: 'Score 10/100 (LOW)', evidenceIds: [], duration: 0 },
      ],
      riskScore: 10,
      riskLevel: 'LOW',
      riskFactors: [{ type: 'UNUSUAL_TIME', weight: 10, evidenceIds: ['EV-001'], description: 'Unusual time' }],
      recommendation: 'No immediate human action required',
      humanDecision: { action: 'FALSE_POSITIVE', note: 'Customer confirmed travel', decidedBy: 'investigator', decidedAt: daysAgo(1) },
      investigationCycles: 1,
    },
  ];
  await Investigation.insertMany(prevCases);
  console.log(`[seed] Inserted ${prevCases.length} previous investigation cases`);

  // --- Agent log for the pre-investigated cases -----------------------------
  // The dashboard agent-activity feed reads AgentLog. These cases were seeded
  // already-investigated, so their log is derived directly from the persisted
  // agentResults — no statuses are invented here. CASE-1042 is seeded as a
  // transaction rather than an investigation, so the investigator runs that
  // pipeline live from the case page.
  const agentLogs = [];
  for (const c of prevCases) {
    for (const r of c.agentResults) {
      agentLogs.push({
        caseId: c.caseId,
        agentName: r.agentName,
        status: r.status,
        inputSummary: `${c.caseId} subject transaction`,
        outputSummary: r.summary,
        evidenceIds: r.evidenceIds || [],
        cycle: 1,
        duration: r.duration || 0,
        timestamp: new Date(),
      });
    }
  }
  await AgentLog.insertMany(agentLogs);
  console.log(`[seed] Inserted ${agentLogs.length} agent log entries`);

  console.log('[seed] Seed complete');
  console.log('[seed] Main demo case: CASE-1042 (C1024, TX1042, ₹78,500, Mumbai, 02:17 AM, D8821)');
}

if (require.main === module) {
  seed()
    .then(() => disconnectDB())
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('[seed] Failed:', err);
      process.exit(1);
    });
}

module.exports = { seed };
