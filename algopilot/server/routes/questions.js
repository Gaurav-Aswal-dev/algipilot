const express = require('express');
const router = express.Router();
const Question = require('../models/Question');
const { protect } = require('../middleware/auth');

const escapeRegex = (str) => str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

router.get('/', protect, async (req, res) => {
  try {
    const { platform, topic, difficulty, ratingMin, ratingMax, search, page = 1, limit = 15 } = req.query;
    const filter = { isActive: true };
    if (platform) filter.platform = platform;
    if (difficulty) filter.difficulty = difficulty;
    if (topic) filter.topics = { $in: [topic] };
    if (ratingMin || ratingMax) {
      filter.rating = {};
      if (ratingMin) filter.rating.$gte = Number(ratingMin);
      if (ratingMax) filter.rating.$lte = Number(ratingMax);
    }
    if (search) filter.title = { $regex: escapeRegex(search), $options: 'i' };

    const skip = (Number(page) - 1) * Number(limit);
    const total = await Question.countDocuments(filter);
    const questions = await Question.find(filter).sort({ rating: 1 }).skip(skip).limit(Number(limit));
    res.json({ success: true, total, page: Number(page), pages: Math.ceil(total / Number(limit)), questions });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

router.get('/daily', protect, async (req, res) => {
  try {
    const count = await Question.countDocuments({ isActive: true });
    if (!count) return res.status(404).json({ success: false, message: 'No questions available' });
    const skip = Math.floor(Date.now() / 86400000) % count;
    const question = await Question.findOne({ isActive: true }).skip(skip);
    res.json({ success: true, question });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

router.get('/:id', protect, async (req, res) => {
  try {
    const question = await Question.findById(req.params.id);
    if (!question) return res.status(404).json({ success: false, message: 'Not found' });
    res.json({ success: true, question });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

router.post('/', protect, async (req, res) => {
  try {
    const { title, platform, rating, difficulty, topics, link, contestId, problemIndex } = req.body;
    if (!title || !platform || !link) return res.status(400).json({ success: false, message: 'Title, platform and link required' });
    const question = await Question.create({ title, platform, rating, difficulty, topics: topics || [], link, contestId, problemIndex, addedBy: req.user._id });
    res.status(201).json({ success: true, question });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

module.exports = router;
