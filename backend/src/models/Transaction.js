const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema(
  {
    transactionId: { type: String, required: true, unique: true, index: true },
    customerId: { type: String, required: true, index: true },
    amount: { type: Number, required: true },
    transactionType: {
      type: String,
      enum: ['PURCHASE', 'TRANSFER', 'WITHDRAWAL', 'ONLINE_PAYMENT', 'ATM'],
      default: 'PURCHASE',
    },
    merchant: { type: String, default: 'Unknown' },
    location: { type: String, default: 'Unknown' },
    deviceId: { type: String, default: null },
    timestamp: { type: Date, default: Date.now },
    status: {
      type: String,
      enum: ['COMPLETED', 'PENDING', 'FLAGGED', 'BLOCKED'],
      default: 'COMPLETED',
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Transaction', transactionSchema);
