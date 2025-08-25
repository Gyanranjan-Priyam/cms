const mongoose = require('mongoose');

const timetableSchema = new mongoose.Schema({
  facultyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Faculty',
    required: true
  },
  subject: {
    type: String,
    required: true,
    trim: true
  },
  subjectCode: {
    type: String,
    required: true,
    trim: true
  },
  semester: {
    type: Number,
    required: true,
    min: 1,
    max: 8
  },
  branch: {
    type: String,
    required: true,
    trim: true
  },
  section: {
    type: String,
    required: true,
    trim: true
  },
  day: {
    type: String,
    required: true,
    enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
  },
  startTime: {
    type: String,
    required: true
  },
  endTime: {
    type: String,
    required: true
  },
  roomNumber: {
    type: String,
    required: true,
    trim: true
  },
  classType: {
    type: String,
    enum: ['Lecture', 'Tutorial', 'Practical', 'Lab'],
    default: 'Lecture'
  },
  academicYear: {
    type: String,
    required: true
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Index for efficient queries
timetableSchema.index({ facultyId: 1, day: 1, startTime: 1 });
timetableSchema.index({ semester: 1, branch: 1, section: 1 });

module.exports = mongoose.model('Timetable', timetableSchema);
