const mongoose = require('mongoose');

const deviceSchema = new mongoose.Schema(
  {
    deviceId: { type: String, required: true, unique: true, index: true },
    customers: { type: [String], default: [] },
    locations: { type: [String], default: [] },
    transactionCount: { type: Number, default: 0 },
    previousAlerts: { type: [String], default: [] },
    firstSeen: { type: Date, default: Date.now },
    lastSeen: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Device', deviceSchema);
