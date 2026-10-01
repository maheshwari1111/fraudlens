const mongoose = require('mongoose');

const reportSchema = new mongoose.Schema(
  {
    caseId: { type: String, required: true, unique: true, index: true },
    executiveSummary: { type: String, default: '' },
    findings: { type: [mongoose.Schema.Types.Mixed], default: [] },
    evidence: { type: [mongoose.Schema.Types.Mixed], default: [] },
    riskAssessment: { type: mongoose.Schema.Types.Mixed, default: {} },
    recommendation: { type: String, default: '' },
    humanDecision: { type: mongoose.Schema.Types.Mixed, default: {} },
    auditTimeline: { type: [mongoose.Schema.Types.Mixed], default: [] },
    generatedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Report', reportSchema);
