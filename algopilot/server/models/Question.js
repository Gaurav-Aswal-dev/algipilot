const mongoose = require('mongoose');

const questionSchema = new mongoose.Schema({
  title:    { type: String, required: true, trim: true },
  platform: { type: String, required: true, enum: ['Codeforces','LeetCode','AtCoder','CodeChef','HackerRank','Other'], default: 'Codeforces' },
  rating:   { type: Number, min: 0, max: 4000, default: 0 },
  difficulty: { type: String, enum: ['Easy','Medium','Hard','Expert'], default: 'Medium' },
  topics: [{ type: String }],
  link:     { type: String, required: true, trim: true },
  contestId:    { type: String, default: '' },
  problemIndex: { type: String, default: '' },
  isActive:     { type: Boolean, default: true },
  addedBy:      { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
}, { timestamps: true });

questionSchema.index({ platform: 1, rating: 1, topics: 1 });

module.exports = mongoose.model('Question', questionSchema);
