const express = require('express');
const router = express.Router();
const SolvedQuestion = require('../models/SolvedQuestion');
const Revision = require('../models/Revision');
const User = require('../models/User');
const { protect } = require('../middleware/auth');

const updateStreak = async (userId) => {
  const user = await User.findById(userId);
  const today = new Date(); today.setHours(0,0,0,0);
  const lastDate = user.lastSolvedDate ? new Date(user.lastSolvedDate) : null;
  if (lastDate) lastDate.setHours(0,0,0,0);
  const yesterday = new Date(today); yesterday.setDate(yesterday.getDate() - 1);

  let newStreak = user.streak;
  if (!lastDate || lastDate < yesterday) {
    newStreak = 1;
  } else if (lastDate.getTime() === yesterday.getTime()) {
    newStreak = user.streak + 1;
  } else if (lastDate.getTime() === today.getTime()) {
    newStreak = Math.max(1, user.streak);
  }

  const longestStreak = Math.max(user.longestStreak, newStreak);
  await User.findByIdAndUpdate(userId, { streak: newStreak, longestStreak, lastSolvedDate: new Date() });
  return newStreak;
};

router.post('/', protect, async (req, res) => {
  try {
    const { questionId, timeTaken, hintUsed, perceivedDifficulty, observation, mistake, correctIdea, code, duringContest, contestName } = req.body;
    if (!questionId) return res.status(400).json({ success: false, message: 'questionId is required' });

    const solved = await SolvedQuestion.create({
      userId: req.user._id, questionId,
      timeTaken: timeTaken || 0, hintUsed: hintUsed || false,
      perceivedDifficulty: perceivedDifficulty || 'Medium',
      observation: observation || '', mistake: mistake || '',
      correctIdea: correctIdea || '', code: code || '',
      duringContest: duringContest || false, contestName: contestName || ''
    });

    await Revision.createSchedule(req.user._id, questionId, solved._id);
    const newStreak = await updateStreak(req.user._id);
    res.status(201).json({ success: true, solved, streak: newStreak, message: 'Solved! Revision scheduled.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

router.get('/', protect, async (req, res) => {
  try {
    const { page = 1, limit = 15 } = req.query;
    const skip = (Number(page) - 1) * Number(limit);
    const total = await SolvedQuestion.countDocuments({ userId: req.user._id });
    const solved = await SolvedQuestion.find({ userId: req.user._id })
      .populate('questionId', 'title platform rating topics link difficulty')
      .sort({ solvedAt: -1 }).skip(skip).limit(Number(limit));
    res.json({ success: true, total, page: Number(page), pages: Math.ceil(total / Number(limit)), solved });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

router.get('/:id', protect, async (req, res) => {
  try {
    const solved = await SolvedQuestion.findOne({ _id: req.params.id, userId: req.user._id }).populate('questionId');
    if (!solved) return res.status(404).json({ success: false, message: 'Not found' });
    res.json({ success: true, solved });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

router.put('/:id', protect, async (req, res) => {
  try {
    const allowed = ['observation','mistake','correctIdea','code','perceivedDifficulty'];
    const updates = {};
    allowed.forEach(f => { if (req.body[f] !== undefined) updates[f] = req.body[f]; });
    const solved = await SolvedQuestion.findOneAndUpdate({ _id: req.params.id, userId: req.user._id }, updates, { new: true });
    if (!solved) return res.status(404).json({ success: false, message: 'Not found' });
    res.json({ success: true, solved });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

module.exports = router;
