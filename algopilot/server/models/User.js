const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name:     { type: String, required: true, trim: true, maxlength: 50 },
  email:    { type: String, required: true, unique: true, lowercase: true, match: [/^\S+@\S+\.\S+$/, 'Invalid email'] },
  password: { type: String, required: true, minlength: 6, select: false },
  username: { type: String, unique: true, sparse: true, trim: true, maxlength: 30 },
  country:  { type: String, default: '' },
  college:  { type: String, default: '' },
  codeforcesUsername: { type: String, default: '' },
  leetcodeUsername:   { type: String, default: '' },
  codeforcesRating:   { type: Number, default: 0 },
  highestRating:      { type: Number, default: 0 },
  targetRating:       { type: Number, default: 1400 },
  streak:             { type: Number, default: 0 },
  longestStreak:      { type: Number, default: 0 },
  lastSolvedDate:     { type: Date, default: null },
  dailyGoal:          { type: Number, default: 2 },
  isPremium:          { type: Boolean, default: false },
  premiumExpiresAt:   { type: Date, default: null },
  achievements:       [{ type: String }],
  avatar:             { type: String, default: '' },
}, { timestamps: true });

userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  const salt = await bcrypt.genSalt(12);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

userSchema.methods.matchPassword = async function(enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('User', userSchema);
