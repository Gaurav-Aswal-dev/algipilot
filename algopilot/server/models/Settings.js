const mongoose = require('mongoose');

const settingsSchema = new mongoose.Schema({
  key: { type: String, required: true, unique: true, default: 'payment_settings' },
  merchantUpiId: { type: String, default: 'algopilot@upi' },
  merchantName: { type: String, default: 'AlgoPilot CP' },
  proPriceINR: { type: Number, default: 499 },
}, { timestamps: true });

module.exports = mongoose.model('Settings', settingsSchema);
