const mongoose = require('mongoose');

const subjectResultSchema = new mongoose.Schema({
  subject: { type: mongoose.Schema.Types.ObjectId, ref: 'Subject', required: true },
  name: { type: String, required: true, trim: true },
  code: { type: String, required: true, trim: true, uppercase: true },
  marksObtained: { type: Number, required: true, min: 0 },
  maxMarks: { type: Number, default: 100, min: 1 },
  percentage: { type: Number, min: 0, max: 100 },
  grade: { type: String, enum: ['O', 'E', 'A', 'B', 'C', 'D', 'F'], default: 'F' },
  gradePoint: { type: Number, min: 0, max: 10, default: 0 },
  credits: { type: Number, default: 3, min: 0 },
}, { _id: false });

const resultSchema = new mongoose.Schema({
  studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true },
  semester: { type: Number, required: true, min: 1, max: 12 },
  academicYear: { type: String, required: true, default: () => new Date().getFullYear().toString() },
  subjects: { type: [subjectResultSchema], default: [] },
  totalCredits: { type: Number, default: 0 },
  earnedCredits: { type: Number, default: 0 },
  sgpa: { type: Number, default: 0 },
  status: { type: String, enum: ['Pass', 'Fail', 'Pending'], default: 'Pending' },
  published: { type: Boolean, default: false },
  publishedDate: { type: Date },
}, { timestamps: true });

// Ensure uniqueness per student per semester and academic year
resultSchema.index({ studentId: 1, semester: 1, academicYear: 1 }, { unique: true });

module.exports = mongoose.model('Result', resultSchema);
