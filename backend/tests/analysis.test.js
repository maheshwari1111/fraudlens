const { test, before, after } = require('node:test');
const assert = require('node:assert');
const { connectDB, disconnectDB } = require('../src/config/db');
const { seed } = require('../seed/seed');

const Transaction = require('../src/models/Transaction');
const Customer = require('../src/models/Customer');
const Device = require('../src/models/Device');
const Investigation = require('../src/models/Investigation');
const Alert = require('../src/models/Alert');

const { analyzeTransaction } = require('../src/services/agents/transactionAgent');
const { analyzeBehaviour } = require('../src/services/agents/behaviourAgent');
const { detectAnomalies } = require('../src/services/agents/anomalyAgent');
const { analyzeDevice } = require('../src/services/agents/deviceAgent');
const { analyzeLocation } = require('../src/services/agents/locationAgent');
const { buildRelationshipGraph } = require('../src/services/agents/relationshipAgent');
const { calculateRisk } = require('../src/services/agents/riskEngine');
const { runInvestigation } = require('../src/services/agents/supervisor');

let transaction;
let customer;

before(async () => {
  await connectDB();
  await seed();
  transaction = await Transaction.findOne({ transactionId: 'TX1042' });
  customer = await Customer.findOne({ customerId: 'C1024' });
});

after(async () => {
  await disconnectDB();
});

test('Transaction Agent analyzes TX1042 correctly', async () => {
  const result = await analyzeTransaction({ transaction, customer });
  assert.strictEqual(result.transactionId, 'TX1042');
  assert.strictEqual(result.amount, 78500);
  assert.ok(result.evidence.length > 0);
  assert.ok(result.velocity.recentCount > 0);
});

test('Behaviour Agent detects amount deviation', async () => {
  const result = await analyzeBehaviour({ transaction, customer });
  const amountEv = result.evidence.find((e) => e.type === 'AMOUNT_DEVIATION');
  assert.ok(amountEv, 'Should detect amount deviation');
  assert.ok(amountEv.details.ratio > 5);
});

test('Behaviour Agent detects location deviation', async () => {
  const result = await analyzeBehaviour({ transaction, customer });
  const locEv = result.evidence.find((e) => e.type === 'LOCATION_DEVIATION');
  assert.ok(locEv, 'Should detect location deviation');
  assert.strictEqual(locEv.details.current, 'Mumbai');
});

test('Behaviour Agent detects device deviation', async () => {
  const result = await analyzeBehaviour({ transaction, customer });
  const devEv = result.evidence.find((e) => e.type === 'DEVICE_DEVIATION');
  assert.ok(devEv, 'Should detect device deviation');
  assert.strictEqual(devEv.details.deviceId, 'D8821');
});

test('Anomaly Agent detects all expected anomalies', async () => {
  const txnAnalysis = await analyzeTransaction({ transaction, customer });
  const behaviour = await analyzeBehaviour({ transaction, customer });
  const anomalies = detectAnomalies({ transaction, customer, behaviour, transactionAnalysis: txnAnalysis });
  const types = anomalies.map((a) => a.type);
  assert.ok(types.includes('AMOUNT_ANOMALY'), 'Should detect AMOUNT_ANOMALY');
  assert.ok(types.includes('UNUSUAL_TIME'), 'Should detect UNUSUAL_TIME');
  assert.ok(types.includes('NEW_DEVICE'), 'Should detect NEW_DEVICE');
  assert.ok(types.includes('UNUSUAL_LOCATION'), 'Should detect UNUSUAL_LOCATION');
});

test('Device Agent discovers shared customers', async () => {
  const result = await analyzeDevice({ transaction, customer, excludeCaseId: 'TEST' });
  assert.ok(result.relatedCustomers.includes('C1091'));
  assert.ok(result.relatedCustomers.includes('C1177'));
  assert.strictEqual(result.isNewForCustomer, true);
});

test('Device Agent discovers previous cases', async () => {
  const result = await analyzeDevice({ transaction, customer, excludeCaseId: 'TEST' });
  assert.ok(result.previousCases.includes('CASE887'), 'Should discover CASE887');
});

test('Location Agent detects unusual location', async () => {
  const result = await analyzeLocation({ transaction, customer });
  assert.strictEqual(result.isUnusual, true);
  assert.strictEqual(result.current, 'Mumbai');
});

test('Relationship Agent builds graph with all entity types', async () => {
  const deviceAnalysis = await analyzeDevice({ transaction, customer, excludeCaseId: 'TEST' });
  const graph = await buildRelationshipGraph({ transaction, customer, deviceAnalysis });
  const nodeTypes = new Set(graph.nodes.map((n) => n.type));
  assert.ok(nodeTypes.has('customer'));
  assert.ok(nodeTypes.has('transaction'));
  assert.ok(nodeTypes.has('device'));
  assert.ok(nodeTypes.has('location'));
  assert.ok(graph.edges.length > 0);
});

test('Risk Engine calculates correct score for CASE-1042', async () => {
  const txnAnalysis = await analyzeTransaction({ transaction, customer });
  const behaviour = await analyzeBehaviour({ transaction, customer });
  const anomalies = detectAnomalies({ transaction, customer, behaviour, transactionAnalysis: txnAnalysis });
  const { EvidenceRegistry } = require('../src/services/evidence');
  const ev = new EvidenceRegistry();
  ev.add({ type: 'AMOUNT_ANOMALY', description: 'test', severity: 'HIGH', source: 'test' });
  ev.add({ type: 'NEW_DEVICE', description: 'test', severity: 'HIGH', source: 'test' });
  ev.add({ type: 'UNUSUAL_LOCATION', description: 'test', severity: 'MEDIUM', source: 'test' });
  ev.add({ type: 'UNUSUAL_TIME', description: 'test', severity: 'MEDIUM', source: 'test' });
  ev.add({ type: 'SHARED_DEVICE', description: 'test', severity: 'HIGH', source: 'test' });
  ev.add({ type: 'PREVIOUS_ALERT', description: 'test', severity: 'HIGH', source: 'test' });
  const risk = calculateRisk(anomalies, ev.all());
  assert.strictEqual(risk.score, 100);
  assert.strictEqual(risk.level, 'CRITICAL');
  assert.strictEqual(risk.factors.length, 6);
});

test('Risk Engine score is capped at 100', () => {
  const anomalies = [
    { type: 'AMOUNT_ANOMALY' }, { type: 'NEW_DEVICE' }, { type: 'UNUSUAL_LOCATION' },
    { type: 'UNUSUAL_TIME' }, { type: 'PREVIOUS_ALERT' }, { type: 'SHARED_DEVICE' },
  ];
  const risk = calculateRisk(anomalies, []);
  assert.ok(risk.score <= 100);
});

test('Risk Engine level thresholds are correct', () => {
  const { levelForScore } = require('../src/services/agents/riskEngine');
  assert.strictEqual(levelForScore(0), 'LOW');
  assert.strictEqual(levelForScore(25), 'LOW');
  assert.strictEqual(levelForScore(26), 'MEDIUM');
  assert.strictEqual(levelForScore(50), 'MEDIUM');
  assert.strictEqual(levelForScore(51), 'HIGH');
  assert.strictEqual(levelForScore(75), 'HIGH');
  assert.strictEqual(levelForScore(76), 'CRITICAL');
  assert.strictEqual(levelForScore(100), 'CRITICAL');
});

test('Full investigation of CASE-1042 produces evidence and requires human review', async () => {
  const result = await runInvestigation({ transactionId: 'TX1042', customerId: 'C1024', cycle: 1 });
  assert.strictEqual(result.investigation.caseId, 'CASE-1042');
  assert.strictEqual(result.investigation.status, 'AWAITING_HUMAN_REVIEW');
  assert.ok(result.investigation.riskScore >= 76);
  assert.ok(result.evidence.length >= 5);
  assert.ok(result.agentResults.length >= 6);

  // Verify evidence IDs are unique
  const ids = result.evidence.map((e) => e.evidenceId);
  assert.strictEqual(new Set(ids).size, ids.length);
});

test('Investigation creates AgentLogs', async () => {
  const AgentLog = require('../src/models/AgentLog');
  const logs = await AgentLog.find({ caseId: 'CASE-1042' });
  assert.ok(logs.length >= 6);
  const names = logs.map((l) => l.agentName);
  assert.ok(names.includes('TransactionAgent'));
  assert.ok(names.includes('BehaviourAgent'));
  assert.ok(names.includes('DeviceAgent'));
  assert.ok(names.includes('RiskEngine'));
});
