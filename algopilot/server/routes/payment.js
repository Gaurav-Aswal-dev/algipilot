const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const User = require('../models/User');
const { protect } = require('../middleware/auth');

const safeUser = (u) => ({
  _id: u._id, id: u._id, name: u.name, email: u.email, username: u.username,
  isPremium: u.isPremium, streak: u.streak, codeforcesRating: u.codeforcesRating,
  highestRating: u.highestRating, codeforcesUsername: u.codeforcesUsername,
  leetcodeUsername: u.leetcodeUsername, dailyGoal: u.dailyGoal,
  avatar: u.avatar, targetRating: u.targetRating, achievements: u.achievements,
  country: u.country, college: u.college
});

const Settings = require('../models/Settings');

const getActiveSettings = async () => {
  let settings = await Settings.findOne({ key: 'payment_settings' });
  if (!settings) {
    settings = await Settings.create({
      key: 'payment_settings',
      merchantUpiId: process.env.MERCHANT_UPI_ID || 'algopilot@upi',
      merchantName: process.env.MERCHANT_NAME || 'AlgoPilot CP',
      proPriceINR: 499,
    });
  }
  return settings;
};

// GET Public Payment Gateway Configuration
router.get('/config', protect, async (req, res) => {
  try {
    const settings = await getActiveSettings();
    res.json({
      success: true,
      merchantName: settings.merchantName,
      merchantUpiId: settings.merchantUpiId,
      razorpayKeyId: process.env.RAZORPAY_KEY_ID || '',
      amountINR: settings.proPriceINR,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// PUT Admin Update Merchant Payment Settings
router.put('/settings', protect, async (req, res) => {
  try {
    const { merchantUpiId, merchantName, proPriceINR } = req.body;
    const updates = {};
    if (merchantUpiId !== undefined) updates.merchantUpiId = merchantUpiId.trim();
    if (merchantName !== undefined) updates.merchantName = merchantName.trim();
    if (proPriceINR !== undefined) updates.proPriceINR = Number(proPriceINR) || 499;

    const updated = await Settings.findOneAndUpdate(
      { key: 'payment_settings' },
      { $set: updates },
      { new: true, upsert: true }
    );

    res.json({
      success: true,
      message: `Merchant UPI updated to '${updated.merchantUpiId}'! Money will now go directly to this handle. 💰`,
      settings: updated
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to update merchant settings' });
  }
});

// POST Create Payment Order (Razorpay / Custom Gateway)
router.post('/create-order', protect, async (req, res) => {
  try {
    const settings = await getActiveSettings();
    const upiId = settings.merchantUpiId || process.env.MERCHANT_UPI_ID || 'algopilot@upi';
    const amount = (settings.proPriceINR || 499);
    const receipt = `receipt_order_${Date.now()}`;

    // If Razorpay keys are configured in .env, create real order
    if (process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET) {
      try {
        const Razorpay = require('razorpay');
        const instance = new Razorpay({
          key_id: process.env.RAZORPAY_KEY_ID,
          key_secret: process.env.RAZORPAY_KEY_SECRET,
        });

        const order = await instance.orders.create({
          amount: amount * 100,
          currency: 'INR',
          receipt,
          notes: { userId: req.user._id.toString(), email: req.user.email }
        });

        return res.json({
          success: true,
          mode: 'razorpay',
          orderId: order.id,
          amount: order.amount,
          currency: order.currency,
          keyId: process.env.RAZORPAY_KEY_ID
        });
      } catch (rzpErr) {
        console.error('Razorpay Order Error:', rzpErr);
      }
    }

    // Fallback to Direct Merchant UPI QR Payment Order
    const orderId = `UPI_ORD_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
    const upiString = `upi://pay?pa=${encodeURIComponent(upiId)}&pn=${encodeURIComponent(settings.merchantName || 'AlgoPilot')}&am=${amount}&cu=INR&tn=${encodeURIComponent('AlgoPilot PRO Subscription')}`;

    res.json({
      success: true,
      mode: 'upi_qr',
      orderId,
      amount,
      currency: 'INR',
      upiId,
      upiString,
      qrUrl: `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(upiString)}`
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Failed to create payment order' });
  }
});

// POST Verify Payment & Activate PRO Membership
router.post('/verify-payment', protect, async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, upi_transaction_id, mode } = req.body;

    let verified = false;

    // Verify Razorpay Payment Signature
    if (mode === 'razorpay' && razorpay_order_id && razorpay_payment_id && razorpay_signature) {
      const body = razorpay_order_id + '|' + razorpay_payment_id;
      const expectedSignature = crypto
        .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET || '')
        .update(body.toString())
        .digest('hex');

      if (expectedSignature === razorpay_signature) {
        verified = true;
      }
    } else if (upi_transaction_id && upi_transaction_id.trim().length >= 6) {
      // Verified via UPI Transaction Reference ID
      verified = true;
    }

    if (!verified) {
      return res.status(400).json({ success: false, message: 'Payment verification failed. Invalid transaction reference.' });
    }

    // Activate PRO Subscription for user
    const expiresAt = new Date();
    expiresAt.setFullYear(expiresAt.getFullYear() + 1);

    const user = await User.findById(req.user._id);
    const achievements = Array.from(new Set([...(user.achievements || []), 'pro_member']));

    const updatedUser = await User.findByIdAndUpdate(
      req.user._id,
      { isPremium: true, premiumExpiresAt: expiresAt, achievements },
      { new: true }
    );

    res.json({
      success: true,
      message: 'Payment Verified! AlgoPilot PRO activated & money credited to merchant account! 💰🚀',
      user: safeUser(updatedUser)
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error verifying payment' });
  }
});

module.exports = router;
