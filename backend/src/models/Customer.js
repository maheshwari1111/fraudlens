const mongoose = require('mongoose');

const customerSchema = new mongoose.Schema(
  {
    customerId: { type: String, required: true, unique: true, index: true },
    name: { type: String, required: true },
    averageTransactionAmount: { type: Number, default: 0 },
    normalTransactionRange: {
      min: { type: Number, default: 0 },
      max: { type: Number, default: 0 },
    },
    usualLocations: { type: [String], default: [] },
    usualDevices: { type: [String], default: [] },
    usualTransactionHours: { type: [Number], default: [] },
    accountAge: { type: Number, default: 0 }, // days
  },
  { timestamps: true }
);

module.exports = mongoose.model('Customer', customerSchema);
