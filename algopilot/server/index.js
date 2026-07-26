require('dotenv').config();
const express = require('express');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const connectDB = require('./config/db');

const authRoutes     = require('./routes/auth');
const questionRoutes = require('./routes/questions');
const solvedRoutes   = require('./routes/solved');
const revisionRoutes = require('./routes/revision');
const aiRoutes       = require('./routes/ai');
const statsRoutes    = require('./routes/stats');
const paymentRoutes  = require('./routes/payment');

const app = express();

connectDB();

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: { success: false, message: 'Too many requests, please try again later.' }
});

const allowedOrigins = [
  process.env.CLIENT_URL,
  'http://localhost:5173',
  'http://localhost:5174',
  'http://localhost:3000'
].filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(null, true); // Allow during dev
    }
  },
  credentials: true
}));
app.use(express.json());
app.use('/api/auth', limiter);

app.use('/api/auth',      authRoutes);
app.use('/api/questions', questionRoutes);
app.use('/api/solved',    solvedRoutes);
app.use('/api/revision',  revisionRoutes);
app.use('/api/ai',        aiRoutes);
app.use('/api/stats',     statsRoutes);
app.use('/api/payment',   paymentRoutes);

app.get('/api/health', (req, res) => {
  res.json({ success: true, message: 'AlgoPilot API is running', timestamp: new Date() });
});

app.use((req, res) => res.status(404).json({ success: false, message: 'Route not found' }));

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.statusCode || 500).json({ success: false, message: err.message || 'Internal Server Error' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`\n  AlgoPilot server running on http://localhost:${PORT}`);
  console.log(`  Mode: ${process.env.NODE_ENV}\n`);
});
