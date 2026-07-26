const express = require('express');
const router = express.Router();
const Revision = require('../models/Revision');
const { protect } = require('../middleware/auth');

router.get('/today', protect, async (req, res) => {
  try {
    const endOfDay = new Date(); endOfDay.setHours(23,59,59,999);
    const revisions = await Revision.find({ userId: req.user._id, revisionDate: { $lte: endOfDay }, completed: false })
      .populate('questionId', 'title platform rating topics link difficulty')
      .sort({ revisionDate: 1 });
    res.json({ success: true, count: revisions.length, revisions });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

router.get('/upcoming', protect, async (req, res) => {
  try {
    const from = new Date();
    const to = new Date(); to.setDate(to.getDate() + 30);
    const revisions = await Revision.find({ userId: req.user._id, revisionDate: { $gte: from, $lte: to }, completed: false })
      .populate('questionId', 'title platform rating topics')
      .sort({ revisionDate: 1 });
    res.json({ success: true, revisions });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

router.put('/:id/complete', protect, async (req, res) => {
  try {
    const revision = await Revision.findOneAndUpdate(
      { _id: req.params.id, userId: req.user._id },
      { completed: true, completedAt: new Date() },
      { new: true }
    );
    if (!revision) return res.status(404).json({ success: false, message: 'Not found' });
    res.json({ success: true, revision });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

router.get('/stats', protect, async (req, res) => {
  try {
    const uid = req.user._id;
    const total     = await Revision.countDocuments({ userId: uid });
    const completed = await Revision.countDocuments({ userId: uid, completed: true });
    const overdue   = await Revision.countDocuments({ userId: uid, completed: false, revisionDate: { $lt: new Date() } });
    res.json({ success: true, stats: { total, completed, pending: total - completed, overdue } });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

module.exports = router;
