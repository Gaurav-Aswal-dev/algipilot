const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { protect } = require('../middleware/auth');

const secretKey = process.env.JWT_SECRET || 'algopilot_super_secret_jwt_key_2024';
const genToken = (id) => jwt.sign({ id }, secretKey, { expiresIn: process.env.JWT_EXPIRE || '30d' });

const safeUser = (u) => ({
  _id: u._id, id: u._id, name: u.name, email: u.email, username: u.username,
  isPremium: u.isPremium, streak: u.streak, codeforcesRating: u.codeforcesRating,
  highestRating: u.highestRating, codeforcesUsername: u.codeforcesUsername,
  leetcodeUsername: u.leetcodeUsername, dailyGoal: u.dailyGoal,
  avatar: u.avatar, targetRating: u.targetRating, achievements: u.achievements,
  country: u.country, college: u.college
});

router.post('/register', async (req, res) => {
  try {
    const { name, email, password, username } = req.body;
    if (!name || !email || !password) return res.status(400).json({ success: false, message: 'Name, email and password are required' });
    if (await User.findOne({ email })) return res.status(400).json({ success: false, message: 'Email already registered' });
    if (username && await User.findOne({ username })) return res.status(400).json({ success: false, message: 'Username already taken' });
    const user = await User.create({ name, email, password, username });
    res.status(201).json({ success: true, token: genToken(user._id), user: safeUser(user) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error during registration' });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ success: false, message: 'Email and password are required' });
    const user = await User.findOne({ email }).select('+password');
    if (!user || !(await user.matchPassword(password))) return res.status(401).json({ success: false, message: 'Invalid email or password' });
    res.json({ success: true, token: genToken(user._id), user: safeUser(user) });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error during login' });
  }
});

router.get('/me', protect, (req, res) => res.json({ success: true, user: req.user }));

router.put('/profile', protect, async (req, res) => {
  try {
    const allowed = ['name','username','country','college','codeforcesUsername','leetcodeUsername','targetRating','dailyGoal','avatar'];
    const updates = {};
    allowed.forEach(f => { if (req.body[f] !== undefined) updates[f] = req.body[f]; });
    if (updates.username) {
      const existing = await User.findOne({ username: updates.username, _id: { $ne: req.user._id } });
      if (existing) return res.status(400).json({ success: false, message: 'Username already taken' });
    }
    const user = await User.findByIdAndUpdate(req.user._id, updates, { new: true, runValidators: true });
    res.json({ success: true, user });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error updating profile' });
  }
});

router.put('/change-password', protect, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) return res.status(400).json({ success: false, message: 'Both passwords required' });
    const user = await User.findById(req.user._id).select('+password');
    if (!(await user.matchPassword(currentPassword))) return res.status(401).json({ success: false, message: 'Current password incorrect' });
    user.password = newPassword;
    await user.save();
    res.json({ success: true, message: 'Password updated!' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Live Codeforces Sync Route
router.post('/sync-codeforces', protect, async (req, res) => {
  try {
    const handle = req.user.codeforcesUsername || req.body.codeforcesUsername;
    if (!handle) {
      return res.status(400).json({ success: false, message: 'Please set your Codeforces handle first' });
    }

    const response = await fetch(`https://codeforces.com/api/user.info?handles=${encodeURIComponent(handle)}`);
    const data = await response.json();

    if (data.status !== 'OK' || !data.result?.[0]) {
      return res.status(404).json({ success: false, message: `Codeforces user '${handle}' not found` });
    }

    const cfUser = data.result[0];
    const updates = {
      codeforcesUsername: handle,
      codeforcesRating: cfUser.rating || 0,
      highestRating: cfUser.maxRating || cfUser.rating || 0,
      country: req.user.country || cfUser.country || '',
      college: req.user.college || cfUser.organization || '',
      avatar: cfUser.titlePhoto || cfUser.avatar || req.user.avatar || '',
    };

    const updatedUser = await User.findByIdAndUpdate(req.user._id, updates, { new: true });
    res.json({
      success: true,
      message: `Synced Codeforces handle '${handle}'!`,
      user: safeUser(updatedUser)
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Failed to sync with Codeforces API' });
  }
});

// Upgrade to PRO Membership Route
router.post('/upgrade-pro', protect, async (req, res) => {
  try {
    const { paymentMethod = 'UPI' } = req.body;
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
      message: 'Congratulations! You are now an AlgoPilot PRO member! 🚀',
      user: safeUser(updatedUser)
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error during upgrade' });
  }
});

module.exports = router;
