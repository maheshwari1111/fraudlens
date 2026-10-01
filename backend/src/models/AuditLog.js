const mongoose = require('mongoose');

const auditLogSchema = new mongoose.Schema(
  {
    caseId: { type: String, required: true, index: true },
    action: { type: String, required: true },
    actor: { type: String, default: 'system' },
    details: { type: mongoose.Schema.Types.Mixed, default: {} },
    timestamp: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

module.exports = mongoose.model('AuditLog', auditLogSchema);
