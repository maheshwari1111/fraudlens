const mongoose = require('mongoose');

const alertSchema = new mongoose.Schema(
  {
    alertId: { type: String, required: true, unique: true, index: true },
    transactionId: { type: String, required: true, index: true },
    customerId: { type: String, required: true, index: true },
    triggerReasons: { type: [String], default: [] },
    severity: { type: String, enum: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'], default: 'MEDIUM' },
    status: { type: String, enum: ['OPEN', 'UNDER_INVESTIGATION', 'RESOLVED', 'FALSE_POSITIVE'], default: 'OPEN' },
    relatedCaseId: { type: String, default: null },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Alert', alertSchema);
