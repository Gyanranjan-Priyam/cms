const mongoose = require('mongoose');

const subjectSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  code: {
    type: String,
    required: true,
    trim: true,
    uppercase: true
  },
  branch: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Branch',
    required: true
  },
  description: {
    type: String,
    trim: true
  },
  semester: {
    type: Number,
    required: true,
    min: 1,
    max: 12,
    default: 1
  },
  isActive: {
    type: Boolean,
    default: true
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true
});

// Unique subject name/code per branch and semester
subjectSchema.index({ branch: 1, semester: 1, code: 1 }, { unique: true });
subjectSchema.index({ branch: 1, semester: 1, name: 1 }, { unique: true });

module.exports = mongoose.model('Subject', subjectSchema);
