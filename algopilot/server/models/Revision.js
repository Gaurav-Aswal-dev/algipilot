const mongoose = require('mongoose');

const INTERVALS = [1, 3, 7, 15, 30];

const revisionSchema = new mongoose.Schema({
  userId:          { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  questionId:      { type: mongoose.Schema.Types.ObjectId, ref: 'Question', required: true },
  solvedQuestionId:{ type: mongoose.Schema.Types.ObjectId, ref: 'SolvedQuestion', required: true },
  stage:           { type: Number, default: 0, min: 0, max: 4 },
  revisionDate:    { type: Date, required: true },
  completed:       { type: Boolean, default: false },
  completedAt:     { type: Date, default: null },
}, { timestamps: true });

revisionSchema.statics.createSchedule = async function(userId, questionId, solvedQuestionId, base = new Date()) {
  const revisions = INTERVALS.map((days, i) => {
    const d = new Date(base);
    d.setDate(d.getDate() + days);
    return { userId, questionId, solvedQuestionId, stage: i, revisionDate: d };
  });
  return await this.insertMany(revisions);
};

revisionSchema.index({ userId: 1, revisionDate: 1, completed: 1 });

module.exports = mongoose.model('Revision', revisionSchema);
