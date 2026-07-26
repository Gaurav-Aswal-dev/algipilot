const mongoose = require('mongoose');

const solvedQuestionSchema = new mongoose.Schema({
  userId:     { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  questionId: { type: mongoose.Schema.Types.ObjectId, ref: 'Question', required: true },
  timeTaken:  { type: Number, min: 0, default: 0 },
  hintUsed:   { type: Boolean, default: false },
  perceivedDifficulty: { type: String, enum: ['Easy','Medium','Hard'], default: 'Medium' },
  observation:  { type: String, default: '', maxlength: 2000 },
  mistake:      { type: String, default: '', maxlength: 2000 },
  correctIdea:  { type: String, default: '', maxlength: 2000 },
  code:         { type: String, default: '', maxlength: 10000 },
  duringContest: { type: Boolean, default: false },
  contestName:   { type: String, default: '' },
  solvedAt:      { type: Date, default: Date.now },
}, { timestamps: true });

solvedQuestionSchema.index({ userId: 1, solvedAt: -1 });

module.exports = mongoose.model('SolvedQuestion', solvedQuestionSchema);
