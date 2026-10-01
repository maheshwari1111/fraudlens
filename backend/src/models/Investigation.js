const mongoose = require('mongoose');

const evidenceSchema = new mongoose.Schema(
  {
    evidenceId: { type: String, required: true },
    type: { type: String, required: true },
    description: { type: String, required: true },
    severity: { type: String, enum: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL', 'INFO'], default: 'INFO' },
    source: { type: String, required: true },
    details: { type: mongoose.Schema.Types.Mixed, default: {} },
  },
  { _id: false }
);

const agentResultSchema = new mongoose.Schema(
  {
    agentName: { type: String, required: true },
    status: { type: String, enum: ['SUCCESS', 'FAILED', 'PARTIAL'], default: 'SUCCESS' },
    summary: { type: String, default: '' },
    evidenceIds: { type: [String], default: [] },
    anomalies: { type: [mongoose.Schema.Types.Mixed], default: [] },
    data: { type: mongoose.Schema.Types.Mixed, default: {} },
    duration: { type: Number, default: 0 }, // ms
    error: { type: String, default: null },
  },
  { _id: false }
);

const investigationSchema = new mongoose.Schema(
  {
    caseId: { type: String, required: true, unique: true, index: true },
    alertId: { type: String, default: null },
    transactionId: { type: String, required: true, index: true },
    customerId: { type: String, required: true, index: true },
    status: {
      type: String,
      enum: ['IN_PROGRESS', 'AWAITING_HUMAN_REVIEW', 'CLOSED', 'ESCALATED', 'FALSE_POSITIVE', 'PARTIAL'],
      default: 'IN_PROGRESS',
    },
    evidence: { type: [evidenceSchema], default: [] },
    agentResults: { type: [agentResultSchema], default: [] },
    investigationSummary: { type: mongoose.Schema.Types.Mixed, default: null },
    riskScore: { type: Number, default: 0 },
    riskLevel: { type: String, enum: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'], default: 'LOW' },
    riskFactors: { type: [mongoose.Schema.Types.Mixed], default: [] },
    recommendation: { type: String, default: '' },
    humanDecision: {
      action: { type: String, enum: ['CLOSE_APPROVE', 'ESCALATE', 'REQUEST_INVESTIGATION', 'FALSE_POSITIVE', null], default: null },
      note: { type: String, default: '' },
      decidedBy: { type: String, default: '' },
      decidedAt: { type: Date, default: null },
      // Areas requested when the decision was REQUEST_INVESTIGATION.
      areas: { type: [String], default: [] },
    },
    investigationCycles: { type: Number, default: 1 },
    focusAreas: { type: [String], default: [] },
    lastFocusResult: { type: mongoose.Schema.Types.Mixed, default: null },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Investigation', investigationSchema);
