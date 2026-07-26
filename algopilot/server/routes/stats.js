const express = require('express');
const router = express.Router();
const SolvedQuestion = require('../models/SolvedQuestion');
const User = require('../models/User');
const { protect } = require('../middleware/auth');

router.get('/overview', protect, async (req, res) => {
  try {
    const uid = req.user._id;
    const totalSolved = await SolvedQuestion.countDocuments({ userId: uid });

    const todayStart = new Date(); todayStart.setHours(0,0,0,0);
    const weekStart  = new Date(); weekStart.setDate(weekStart.getDate() - 7);
    const monthStart = new Date(); monthStart.setDate(1); monthStart.setHours(0,0,0,0);

    const [solvedToday, solvedThisWeek, solvedThisMonth] = await Promise.all([
      SolvedQuestion.countDocuments({ userId: uid, solvedAt: { $gte: todayStart } }),
      SolvedQuestion.countDocuments({ userId: uid, solvedAt: { $gte: weekStart } }),
      SolvedQuestion.countDocuments({ userId: uid, solvedAt: { $gte: monthStart } }),
    ]);

    const user = await User.findById(uid).select('streak longestStreak codeforcesRating highestRating dailyGoal targetRating achievements');
    res.json({ success: true, stats: { totalSolved, solvedToday, solvedThisWeek, solvedThisMonth, streak: user.streak, longestStreak: user.longestStreak, codeforcesRating: user.codeforcesRating, highestRating: user.highestRating, dailyGoal: user.dailyGoal, targetRating: user.targetRating, achievements: user.achievements } });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

router.get('/topics', protect, async (req, res) => {
  try {
    const solved = await SolvedQuestion.find({ userId: req.user._id }).populate('questionId', 'topics platform');
    const topicMap = {}, platformMap = {};
    solved.forEach(({ questionId }) => {
      if (!questionId) return;
      platformMap[questionId.platform] = (platformMap[questionId.platform] || 0) + 1;
      (questionId.topics || []).forEach(t => { topicMap[t] = (topicMap[t] || 0) + 1; });
    });
    const topics = Object.entries(topicMap).map(([name, count]) => ({ name, count })).sort((a,b) => b.count - a.count);
    const platforms = Object.entries(platformMap).map(([name, count]) => ({ name, count })).sort((a,b) => b.count - a.count);
    res.json({ success: true, topics, platforms });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

router.get('/weekly', protect, async (req, res) => {
  try {
    const weeks = [];
    for (let i = 7; i >= 0; i--) {
      const end = new Date(); end.setDate(end.getDate() - i * 7); end.setHours(23,59,59,999);
      const start = new Date(end); start.setDate(start.getDate() - 6); start.setHours(0,0,0,0);
      const count = await SolvedQuestion.countDocuments({ userId: req.user._id, solvedAt: { $gte: start, $lte: end } });
      weeks.push({ label: `W${8-i}`, startDate: start.toISOString().split('T')[0], count });
    }
    res.json({ success: true, weeks });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Leaderboard route
router.get('/leaderboard', protect, async (req, res) => {
  try {
    const { category = 'solved' } = req.query;

    const users = await User.find({})
      .select('name username codeforcesRating streak college country isPremium avatar')
      .lean();

    // Calculate solved counts for each user
    const solvedCounts = await SolvedQuestion.aggregate([
      { $group: { _id: '$userId', count: { $sum: 1 } } }
    ]);
    const solvedMap = {};
    solvedCounts.forEach(s => { solvedMap[s._id.toString()] = s.count; });

    const list = users.map(u => ({
      ...u,
      solvedCount: solvedMap[u._id.toString()] || 0
    }));

    if (category === 'rating') {
      list.sort((a, b) => b.codeforcesRating - a.codeforcesRating);
    } else if (category === 'streak') {
      list.sort((a, b) => b.streak - a.streak);
    } else {
      list.sort((a, b) => b.solvedCount - a.solvedCount);
    }

    res.json({ success: true, category, leaderboard: list.slice(0, 50) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error fetching leaderboard' });
  }
});

// Admin overview stats
router.get('/admin-overview', protect, async (req, res) => {
  try {
    const Question = require('../models/Question');
    const Revision = require('../models/Revision');

    const [totalUsers, totalSolved, totalQuestions, totalRevisions] = await Promise.all([
      User.countDocuments(),
      SolvedQuestion.countDocuments(),
      Question.countDocuments(),
      Revision.countDocuments(),
    ]);

    res.json({
      success: true,
      metrics: { totalUsers, totalSolved, totalQuestions, totalRevisions }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error fetching admin stats' });
  }
});

module.exports = router;
