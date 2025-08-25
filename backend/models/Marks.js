const mongoose = require('mongoose');

const marksSchema = new mongoose.Schema({
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
  examType: {
    type: String,
    required: true,
    enum: ['Internal-1', 'Internal-2', 'Internal-3', 'Mid-Term', 'End-Semester', 'Assignment', 'Quiz', 'Project']
  },
  totalMarks: {
    type: Number,
    required: true,
    min: 0
  },
  obtainedMarks: {
    type: Number,
    required: true,
    min: 0
  },
  percentage: {
    type: Number,
    min: 0,
    max: 100
  },
  grade: {
    type: String,
    enum: ['A+', 'A', 'B+', 'B', 'C+', 'C', 'D', 'F']
  },
  remarks: {
    type: String,
    trim: true
  },
  academicYear: {
    type: String,
    required: true
  },
  dateOfExam: {
    type: Date,
    required: true
  },
  isPublished: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

// Calculate percentage and grade before saving
marksSchema.pre('save', function(next) {
  if (this.totalMarks && this.obtainedMarks !== undefined) {
    this.percentage = (this.obtainedMarks / this.totalMarks) * 100;
    
    // Calculate grade based on percentage
    if (this.percentage >= 90) this.grade = 'A+';
    else if (this.percentage >= 80) this.grade = 'A';
    else if (this.percentage >= 70) this.grade = 'B+';
    else if (this.percentage >= 60) this.grade = 'B';
    else if (this.percentage >= 50) this.grade = 'C+';
    else if (this.percentage >= 40) this.grade = 'C';
    else if (this.percentage >= 35) this.grade = 'D';
    else this.grade = 'F';
  }
  next();
});

// Index for efficient queries
marksSchema.index({ studentId: 1, subject: 1, examType: 1 });
marksSchema.index({ facultyId: 1, semester: 1, branch: 1 });

module.exports = mongoose.model('Marks', marksSchema);
