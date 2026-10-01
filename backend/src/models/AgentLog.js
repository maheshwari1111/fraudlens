const mongoose = require('mongoose');

const agentLogSchema = new mongoose.Schema(
  {
    caseId: { type: String, required: true, index: true },
    agentName: { type: String, required: true },
    status: { type: String, enum: ['SUCCESS', 'FAILED', 'PARTIAL'], default: 'SUCCESS' },
    inputSummary: { type: String, default: '' },
    outputSummary: { type: String, default: '' },
    evidenceIds: { type: [String], default: [] },
    cycle: { type: Number, default: 1 },
    duration: { type: Number, default: 0 }, // ms
    timestamp: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

module.exports = mongoose.model('AgentLog', agentLogSchema);
