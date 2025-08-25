const mongoose = require('mongoose');

const dailyAttendanceSchema = new mongoose.Schema({
  studentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Student',
    required: true
  },
  studentRegNo: {
    type: String,
    required: true
  },
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
  date: {
    type: Date,
    required: true
  },
  period: {
    type: Number,
    required: true,
    min: 1,
    max: 8
  },
  status: {
    type: String,
    required: true,
    enum: ['Present', 'Absent', 'Late', 'Excused']
  },
  classType: {
    type: String,
    enum: ['Lecture', 'Tutorial', 'Practical', 'Lab'],
    default: 'Lecture'
  },
  remarks: {
    type: String,
    trim: true
  },
  academicYear: {
    type: String,
    required: true
  }
}, {
  timestamps: true
});

// Index for efficient queries
dailyAttendanceSchema.index({ studentId: 1, subject: 1, date: 1 });
dailyAttendanceSchema.index({ facultyId: 1, semester: 1, branch: 1, date: 1 });

module.exports = mongoose.model('DailyAttendance', dailyAttendanceSchema);
