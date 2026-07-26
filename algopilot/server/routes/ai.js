const express = require('express');
const router = express.Router();
const OpenAI = require('openai');
const SolvedQuestion = require('../models/SolvedQuestion');
const User = require('../models/User');
const { protect, requirePremium } = require('../middleware/auth');

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const buildUserContext = async (userId) => {
  const user = await User.findById(userId).select('name codeforcesRating highestRating targetRating streak');
  const solved = await SolvedQuestion.find({ userId })
    .populate('questionId', 'topics platform rating')
    .sort({ solvedAt: -1 }).limit(100);

  const topicMap = {};
  let hintCount = 0;
  solved.forEach(({ questionId, timeTaken, hintUsed }) => {
    if (!questionId) return;
    if (hintUsed) hintCount++;
    (questionId.topics || []).forEach(t => {
      if (!topicMap[t]) topicMap[t] = { count: 0, totalTime: 0 };
      topicMap[t].count++;
      topicMap[t].totalTime += timeTaken || 0;
    });
  });

  const topicStats = Object.entries(topicMap)
    .map(([topic, d]) => ({ topic, count: d.count, avgTime: Math.round(d.totalTime / d.count) }))
    .sort((a, b) => b.count - a.count);

  return { user, topicStats, totalSolved: solved.length, hintCount };
};

// AI Performance Analyzer
router.post('/analyze', protect, requirePremium, async (req, res) => {
  try {
    const { user, topicStats, totalSolved, hintCount } = await buildUserContext(req.user._id);
    const topicsText = topicStats.map(t => `${t.topic}: ${t.count} solved, avg ${t.avgTime} min`).join('\n') || 'No data yet';

    const completion = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [{
        role: 'user',
        content: `You are AlgoPilot AI — a competitive programming coach.

Student: ${user.name} | CF Rating: ${user.codeforcesRating} | Target: ${user.targetRating}
Total Solved: ${totalSolved} | Solved with hints: ${hintCount} | Streak: ${user.streak} days

Topic Breakdown:
${topicsText}

Give:
1. Overall Score (out of 100) with brief reason
2. Strong Topics (3 topics)
3. Average Topics (2 topics)
4. Weak Topics (2-3 topics to focus on)
5. One specific recommendation for this week

Be structured, motivating, concise. Simple English.`
      }],
      max_tokens: 600, temperature: 0.7
    });

    res.json({ success: true, analysis: completion.choices[0].message.content, topicStats });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'AI analysis failed. Check your OpenAI API key.' });
  }
});

// AI Mentor — Roadmap
router.post('/mentor', protect, requirePremium, async (req, res) => {
  try {
    const { user, topicStats, totalSolved } = await buildUserContext(req.user._id);
    const weak   = topicStats.slice(-4).map(t => t.topic).join(', ') || 'Unknown';
    const strong = topicStats.slice(0, 3).map(t => t.topic).join(', ') || 'Unknown';

    const completion = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [{
        role: 'user',
        content: `You are AlgoPilot AI Mentor.

Student: ${user.name} | Current Rating: ${user.codeforcesRating} | Target: ${user.targetRating}
Strong: ${strong} | Weak: ${weak} | Total Solved: ${totalSolved}

Create a roadmap:
1. Estimated weeks to reach target
2. Weekly problem-solving goal
3. Priority topics in order
4. Recommended rating range for practice
5. One contest tip

Be specific, encouraging, realistic. Keep concise.`
      }],
      max_tokens: 500, temperature: 0.7
    });

    res.json({ success: true, roadmap: completion.choices[0].message.content });
  } catch (err) {
    res.status(500).json({ success: false, message: 'AI mentor failed.' });
  }
});

// AI Hint System
router.post('/hint', protect, requirePremium, async (req, res) => {
  try {
    const { questionTitle, platform, topic, rating, hintLevel = 1 } = req.body;
    if (!questionTitle) return res.status(400).json({ success: false, message: 'Question title required' });

    const hints = {
      1: 'Give a very subtle hint — just the direction. No approach, no algorithm name.',
      2: 'Mention the general technique or pattern but not the full approach.',
      3: 'Give the key observation needed. Still no code.',
      4: 'Explain the high-level approach. Mention algorithm and why it works.',
      5: 'Detailed approach with complexity. No code.'
    };

    const completion = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [{
        role: 'user',
        content: `You are AlgoPilot AI — a competitive programming mentor.

Problem: "${questionTitle}" | Platform: ${platform || 'CP'} | Topic: ${topic || 'Unknown'} | Rating: ${rating || 'Unknown'}

Hint Level ${hintLevel}/5: ${hints[hintLevel] || hints[1]}

IMPORTANT: Do NOT give full solution or code. Help student think.`
      }],
      max_tokens: 250, temperature: 0.6
    });

    res.json({ success: true, hintLevel, hint: completion.choices[0].message.content });
  } catch (err) {
    res.status(500).json({ success: false, message: 'AI hint failed.' });
  }
});

// Contest Review
router.post('/contest-review', protect, requirePremium, async (req, res) => {
  try {
    const { contestName, problems } = req.body;
    if (!problems || !Array.isArray(problems)) return res.status(400).json({ success: false, message: 'Problems array required' });

    const problemsText = problems.map(p =>
      `${p.label}: ${p.title || 'Unknown'} — ${p.solved ? `Solved in ${p.timeTaken} min` : 'Not solved'}, Wrong: ${p.wrongAttempts || 0}`
    ).join('\n');

    const completion = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [{
        role: 'user',
        content: `You are AlgoPilot AI — a CP coach.

Contest: ${contestName || 'Recent Contest'}
${problemsText}

Analyze and give:
1. What went well
2. Main bottleneck
3. What to practice next (rating range + topic)
4. One mindset tip for next contest

Direct, specific, motivating. Under 300 words.`
      }],
      max_tokens: 400, temperature: 0.7
    });

    res.json({ success: true, review: completion.choices[0].message.content });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Contest review failed.' });
  }
});

module.exports = router;
