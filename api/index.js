const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');

const app = express();

app.use(cors());
app.use(express.json());

// Connect MongoDB Atlas
const mongoUri = process.env.MONGO_URI || 'mongodb+srv://parkwise:Shanu2006@cluster0.8w7mmuh.mongodb.net/algopilot?retryWrites=true&w=majority&appName=Cluster0';
if (mongoose.connection.readyState === 0) {
  mongoose.connect(mongoUri).catch(err => console.error('MongoDB error:', err));
}

// Import routes
const authRoutes     = require('../algopilot/server/routes/auth');
const questionRoutes = require('../algopilot/server/routes/questions');
const solvedRoutes   = require('../algopilot/server/routes/solved');
const revisionRoutes = require('../algopilot/server/routes/revision');
const aiRoutes       = require('../algopilot/server/routes/ai');
const statsRoutes    = require('../algopilot/server/routes/stats');
const paymentRoutes  = require('../algopilot/server/routes/payment');

app.use('/api/auth',      authRoutes);
app.use('/api/questions', questionRoutes);
app.use('/api/solved',    solvedRoutes);
app.use('/api/revision',  revisionRoutes);
app.use('/api/ai',        aiRoutes);
app.use('/api/stats',     statsRoutes);
app.use('/api/payment',   paymentRoutes);

app.get('/api/health', (req, res) => {
  res.json({ success: true, message: 'AlgoPilot Serverless API is running live on Vercel', timestamp: new Date() });
});

module.exports = app;
