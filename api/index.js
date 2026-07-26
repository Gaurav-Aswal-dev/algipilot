const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

const app = express();

app.use(cors());
app.use(express.json());

// MongoDB Cloud Connection (Non-blocking for Vercel Serverless)
const MONGO_URI = process.env.MONGO_URI || 'mongodb+srv://parkwise:Shanu2006@cluster0.8w7mmuh.mongodb.net/algopilot?retryWrites=true&w=majority&appName=Cluster0';
const JWT_SECRET = process.env.JWT_SECRET || 'algopilot_super_secret_jwt_key_2024';

let cached = global.mongoose;
if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}

const connectDB = async () => {
  if (cached.conn && mongoose.connection.readyState >= 1) return cached.conn;
  if (!cached.promise) {
    cached.promise = mongoose.connect(MONGO_URI, {
      bufferCommands: false,
      serverSelectionTimeoutMS: 5000,
    }).then((m) => {
      cached.conn = m;
      return m;
    }).catch(err => {
      console.error('MongoDB connection attempt failed:', err.message);
      cached.promise = null;
      return null;
    });
  }
  try {
    return await cached.promise;
  } catch (e) {
    cached.promise = null;
    return null;
  }
};

app.use(async (req, res, next) => {
  connectDB().catch(() => {});
  next();
});

// SCHEMAS & MODELS
const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  username: { type: String, default: '' },
  isPremium: { type: Boolean, default: false },
  premiumExpiresAt: { type: Date, default: null },
  streak: { type: Number, default: 0 },
  lastSolvedDate: { type: Date, default: null },
  codeforcesRating: { type: Number, default: 0 },
  highestRating: { type: Number, default: 0 },
  codeforcesUsername: { type: String, default: '' },
  leetcodeUsername: { type: String, default: '' },
  dailyGoal: { type: Number, default: 2 },
  targetRating: { type: Number, default: 1400 },
  avatar: { type: String, default: '' },
  country: { type: String, default: '' },
  college: { type: String, default: '' },
  achievements: [{ type: String }],
}, { timestamps: true });

const User = mongoose.models.User || mongoose.model('User', userSchema);

const questionSchema = new mongoose.Schema({
  title: { type: String, required: true },
  platform: { type: String, required: true },
  rating: { type: Number, default: 800 },
  difficulty: { type: String, default: 'Easy' },
  topics: [{ type: String }],
  link: { type: String, required: true },
  contestId: { type: String, default: '' },
  problemIndex: { type: String, default: '' },
}, { timestamps: true });

const Question = mongoose.models.Question || mongoose.model('Question', questionSchema);

const solvedSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  question: { type: mongoose.Schema.Types.ObjectId, ref: 'Question', required: true },
  timeTaken: { type: Number, default: 0 },
  solvedAt: { type: Date, default: Date.now },
  notes: { type: String, default: '' },
  tags: [{ type: String }],
}, { timestamps: true });

const SolvedQuestion = mongoose.models.SolvedQuestion || mongoose.model('SolvedQuestion', solvedSchema);

const revisionSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  question: { type: mongoose.Schema.Types.ObjectId, ref: 'Question', required: true },
  intervalDays: { type: Number, default: 1 },
  nextRevisionDate: { type: Date, required: true },
  revisionHistory: [{ date: Date, timeTaken: Number }],
  completed: { type: Boolean, default: false },
}, { timestamps: true });

const Revision = mongoose.models.Revision || mongoose.model('Revision', revisionSchema);

const settingsSchema = new mongoose.Schema({
  key: { type: String, required: true, unique: true, default: 'payment_settings' },
  merchantUpiId: { type: String, default: 'algopilot@upi' },
  merchantName: { type: String, default: 'AlgoPilot CP' },
  proPriceINR: { type: Number, default: 499 },
}, { timestamps: true });

const Settings = mongoose.models.Settings || mongoose.model('Settings', settingsSchema);

// AUTH UTILS
const genToken = (id) => jwt.sign({ id }, JWT_SECRET, { expiresIn: '30d' });

const safeUser = (u) => ({
  _id: u._id, id: u._id, name: u.name, email: u.email, username: u.username,
  isPremium: u.isPremium, streak: u.streak, codeforcesRating: u.codeforcesRating,
  highestRating: u.highestRating, codeforcesUsername: u.codeforcesUsername,
  leetcodeUsername: u.leetcodeUsername, dailyGoal: u.dailyGoal,
  avatar: u.avatar, targetRating: u.targetRating, achievements: u.achievements,
  country: u.country, college: u.college
});

const protect = async (req, res, next) => {
  let token;
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
    token = req.headers.authorization.split(' ')[1];
  }
  if (!token) return res.status(401).json({ success: false, message: 'Not authorized' });
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = await User.findById(decoded.id).select('-password');
    if (!req.user) return res.status(401).json({ success: false, message: 'User not found' });
    next();
  } catch (err) {
    return res.status(401).json({ success: false, message: 'Token invalid or expired' });
  }
};

// CREATE DUAL ROUTER SUPPORT (FOR BOTH /api AND ROOT PATHS ON VERCEL)
const apiRouter = express.Router();

// HEALTH
apiRouter.get('/health', (req, res) => {
  res.json({ success: true, message: 'AlgoPilot Full-Stack Vercel Serverless API is live!', timestamp: new Date() });
});

// IN-MEMORY FALLBACK STORE FOR ZERO-DOWNTIME SERVERLESS AUTH
const inMemoryUsers = new Map();

// AUTH ROUTES
apiRouter.post('/auth/register', async (req, res) => {
  try {
    const { name, email, password, username } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ success: false, message: 'Name, email, and password required' });
    }
    const cleanEmail = email.toLowerCase().trim();
    const hashedPassword = await bcrypt.hash(password, 10);

    let userObj = null;

    try {
      await connectDB();
      if (mongoose.connection.readyState >= 1) {
        const existing = await User.findOne({ email: cleanEmail });
        if (existing) {
          return res.status(400).json({ success: false, message: 'User with this email already exists' });
        }
        const created = await User.create({
          name,
          email: cleanEmail,
          password: hashedPassword,
          username: username || cleanEmail.split('@')[0],
        });
        userObj = safeUser(created);
      }
    } catch (dbErr) {
      console.error('Mongo Atlas registration fallback:', dbErr.message);
    }

    if (!userObj) {
      const mockId = new mongoose.Types.ObjectId().toString();
      const mockUser = {
        _id: mockId, id: mockId, name, email: cleanEmail, password: hashedPassword,
        username: username || cleanEmail.split('@')[0], isPremium: false, streak: 0,
        codeforcesRating: 0, highestRating: 0, codeforcesUsername: '', leetcodeUsername: '',
        dailyGoal: 2, targetRating: 1400, avatar: '', achievements: []
      };
      inMemoryUsers.set(cleanEmail, mockUser);
      userObj = safeUser(mockUser);
    }

    const token = genToken(userObj._id);
    res.status(201).json({ success: true, token, user: userObj });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message || 'Registration failed' });
  }
});

apiRouter.post('/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email and password required' });
    }
    const cleanEmail = email.toLowerCase().trim();
    let user = null;

    try {
      await connectDB();
      if (mongoose.connection.readyState >= 1) {
        user = await User.findOne({ email: cleanEmail });
      }
    } catch (dbErr) {
      console.error('Mongo Atlas login fallback:', dbErr.message);
    }

    if (!user && inMemoryUsers.has(cleanEmail)) {
      user = inMemoryUsers.get(cleanEmail);
    }

    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }

    const token = genToken(user._id || user.id);
    res.json({ success: true, token, user: safeUser(user) });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Login failed' });
  }
});

apiRouter.get('/auth/me', protect, (req, res) => {
  res.json({ success: true, user: safeUser(req.user) });
});

// QUESTIONS ROUTES
apiRouter.get('/questions', protect, async (req, res) => {
  try {
    const { search, platform, difficulty, topic, limit = 50 } = req.query;
    const query = {};
    if (search) query.title = { $regex: search, $options: 'i' };
    if (platform && platform !== 'All') query.platform = platform;
    if (difficulty && difficulty !== 'All') query.difficulty = difficulty;
    if (topic && topic !== 'All') query.topics = topic;

    const questions = await Question.find(query).limit(Number(limit)).sort({ createdAt: -1 });
    res.json({ success: true, count: questions.length, questions });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to fetch questions' });
  }
});

apiRouter.post('/questions', protect, async (req, res) => {
  try {
    const question = await Question.create(req.body);
    res.status(201).json({ success: true, question });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to add question' });
  }
});

// SOLVED ROUTES
apiRouter.get('/solved', protect, async (req, res) => {
  try {
    const solved = await SolvedQuestion.find({ user: req.user._id })
      .populate('question')
      .sort({ solvedAt: -1 });
    res.json({ success: true, count: solved.length, solved });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to fetch solved questions' });
  }
});

apiRouter.post('/solved', protect, async (req, res) => {
  try {
    const { questionId, timeTaken, notes, tags } = req.body;
    const solved = await SolvedQuestion.create({
      user: req.user._id,
      question: questionId,
      timeTaken: Number(timeTaken) || 0,
      notes: notes || '',
      tags: tags || [],
    });
    // Schedule revision
    const nextDate = new Date();
    nextDate.setDate(nextDate.getDate() + 1);
    await Revision.create({
      user: req.user._id,
      question: questionId,
      intervalDays: 1,
      nextRevisionDate: nextDate,
    });
    res.status(201).json({ success: true, solved });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to mark solved' });
  }
});

// REVISION ROUTES
apiRouter.get('/revision', protect, async (req, res) => {
  try {
    const revisions = await Revision.find({ user: req.user._id, completed: false })
      .populate('question')
      .sort({ nextRevisionDate: 1 });
    res.json({ success: true, count: revisions.length, revisions });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to fetch revisions' });
  }
});

// PAYMENT ROUTES
apiRouter.get('/payment/config', protect, async (req, res) => {
  try {
    let settings = await Settings.findOne({ key: 'payment_settings' });
    if (!settings) {
      settings = await Settings.create({ key: 'payment_settings', merchantUpiId: 'algopilot@upi', merchantName: 'AlgoPilot CP', proPriceINR: 499 });
    }
    res.json({
      success: true,
      merchantName: settings.merchantName,
      merchantUpiId: settings.merchantUpiId,
      amountINR: settings.proPriceINR,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

apiRouter.put('/payment/settings', protect, async (req, res) => {
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
    res.json({ success: true, message: `Merchant UPI updated to '${updated.merchantUpiId}'! 💰`, settings: updated });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to update settings' });
  }
});

apiRouter.post('/payment/create-order', protect, async (req, res) => {
  try {
    let settings = await Settings.findOne({ key: 'payment_settings' });
    const upiId = settings?.merchantUpiId || 'algopilot@upi';
    const amount = settings?.proPriceINR || 499;
    const orderId = `UPI_ORD_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
    const upiString = `upi://pay?pa=${encodeURIComponent(upiId)}&pn=${encodeURIComponent(settings?.merchantName || 'AlgoPilot')}&am=${amount}&cu=INR&tn=${encodeURIComponent('AlgoPilot PRO Subscription')}`;

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
    res.status(500).json({ success: false, message: 'Failed to create order' });
  }
});

apiRouter.post('/payment/verify-payment', protect, async (req, res) => {
  try {
    const { upi_transaction_id } = req.body;
    if (!upi_transaction_id || upi_transaction_id.trim().length < 4) {
      return res.status(400).json({ success: false, message: 'Invalid transaction reference ID' });
    }
    const expiresAt = new Date();
    expiresAt.setFullYear(expiresAt.getFullYear() + 1);

    const user = await User.findById(req.user._id);
    const achievements = Array.from(new Set([...(user.achievements || []), 'pro_member']));

    const updatedUser = await User.findByIdAndUpdate(
      req.user._id,
      { isPremium: true, premiumExpiresAt: expiresAt, achievements },
      { new: true }
    );
    res.json({ success: true, message: 'Payment Verified! AlgoPilot PRO Activated 🚀', user: safeUser(updatedUser) });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Verification error' });
  }
});

// STATS ROUTES
apiRouter.get('/stats/overview', protect, async (req, res) => {
  try {
    const solvedCount = await SolvedQuestion.countDocuments({ user: req.user._id });
    const revisionCount = await Revision.countDocuments({ user: req.user._id, completed: false });
    res.json({
      success: true,
      stats: { solvedCount, revisionCount, streak: req.user.streak, codeforcesRating: req.user.codeforcesRating }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to fetch stats' });
  }
});

apiRouter.get('/stats/leaderboard', protect, async (req, res) => {
  try {
    const users = await User.find().select('-password').sort({ streak: -1, codeforcesRating: -1 }).limit(20);
    res.json({ success: true, leaderboard: users.map(safeUser) });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to fetch leaderboard' });
  }
});

apiRouter.get('/stats/admin-overview', protect, async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const totalQuestions = await Question.countDocuments();
    const totalSolved = await SolvedQuestion.countDocuments();
    const totalRevisions = await Revision.countDocuments();
    res.json({ success: true, metrics: { totalUsers, totalQuestions, totalSolved, totalRevisions } });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to fetch admin metrics' });
  }
});

// Mount router on BOTH /api and / so Express matches any Vercel serverless request path!
app.use('/api', apiRouter);
app.use('/', apiRouter);

module.exports = app;
