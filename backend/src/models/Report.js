const mongoose = require('mongoose');

const reportSchema = new mongoose.Schema(
  {
    caseId: { type: String, required: true, unique: true, index: true },
    alertId: { type: String, default: null },
    status: { type: String, default: '' },

    // Narrative
    executiveSummary: { type: String, default: '' },
    recommendation: { type: String, default: '' },
    findings: { type: [mongoose.Schema.Types.Mixed], default: [] },

    // Risk
    riskAssessment: { type: mongoose.Schema.Types.Mixed, default: {} },

    // Human decision
    humanDecision: { type: mongoose.Schema.Types.Mixed, default: {} },

    // Evidence + agent execution
    evidence: { type: [mongoose.Schema.Types.Mixed], default: [] },
    agentFindings: { type: [mongoose.Schema.Types.Mixed], default: [] },
    anomalies: { type: [mongoose.Schema.Types.Mixed], default: [] },
    auditTimeline: { type: [mongoose.Schema.Types.Mixed], default: [] },

    // Structured sections. These mirror the source records so the report is
    // reproducible: every field is copied from the case, transaction, customer
    // or agent output rather than re-derived in the browser.
    caseInformation: { type: mongoose.Schema.Types.Mixed, default: {} },
    transaction: { type: mongoose.Schema.Types.Mixed, default: {} },
    customer: { type: mongoose.Schema.Types.Mixed, default: {} },
    behaviourAnalysis: { type: mongoose.Schema.Types.Mixed, default: {} },
    locationAnalysis: { type: mongoose.Schema.Types.Mixed, default: {} },
    deviceAnalysis: { type: mongoose.Schema.Types.Mixed, default: {} },
    relationshipFindings: { type: mongoose.Schema.Types.Mixed, default: {} },
    previousAlerts: { type: [mongoose.Schema.Types.Mixed], default: [] },
    additionalInvestigation: { type: mongoose.Schema.Types.Mixed, default: null },
    investigationSummary: { type: mongoose.Schema.Types.Mixed, default: null },

    investigationCycles: { type: Number, default: 1 },
    generatedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Report', reportSchema);
