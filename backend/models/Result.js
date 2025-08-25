const mongoose = require('mongoose');

const resultSchema = new mongoose.Schema({
  studentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Student',
    required: true
  },
  semester: {
    type: Number,
    required: true,
    min: 1,
    max: 8
  },
  subjects: [{
    subjectCode: {
      type: String,
      required: true
    },
    subjectName: {
      type: String,
      required: true
    },
    credits: {
      type: Number,
      required: true,
      min: 1,
      max: 6
    },
    marks: {
      internal: {
        type: Number,
        min: 0,
        max: 100,
        default: 0
      },
      external: {
        type: Number,
        min: 0,
        max: 100,
        default: 0
      },
      total: {
        type: Number,
        min: 0,
        max: 100
      }
    },
    grade: {
      type: String,
      enum: ['A+', 'A', 'B+', 'B', 'C+', 'C', 'D', 'F'],
      required: true
    },
    gradePoints: {
      type: Number,
      min: 0,
      max: 10
    },
    result: {
      type: String,
      enum: ['Pass', 'Fail'],
      required: true
    }
  }],
  sgpa: {
    type: Number,
    min: 0,
    max: 10
  },
  cgpa: {
    type: Number,
    min: 0,
    max: 10
  },
  totalCredits: {
    type: Number,
    default: 0
  },
  earnedCredits: {
    type: Number,
    default: 0
  },
  percentage: {
    type: Number,
    min: 0,
    max: 100
  },
  status: {
    type: String,
    enum: ['Pass', 'Fail', 'Pending'],
    default: 'Pending'
  },
  publishedDate: {
    type: Date
  },
  academicYear: {
    type: String,
    required: true
  }
}, {
  timestamps: true
});

// Calculate total marks before saving
resultSchema.pre('save', function(next) {
  this.subjects.forEach(subject => {
    subject.marks.total = subject.marks.internal + subject.marks.external;
    
    // Calculate grade points based on total marks
    if (subject.marks.total >= 90) {
      subject.grade = 'A+';
      subject.gradePoints = 10;
    } else if (subject.marks.total >= 80) {
      subject.grade = 'A';
      subject.gradePoints = 9;
    } else if (subject.marks.total >= 70) {
      subject.grade = 'B+';
      subject.gradePoints = 8;
    } else if (subject.marks.total >= 60) {
      subject.grade = 'B';
      subject.gradePoints = 7;
    } else if (subject.marks.total >= 50) {
      subject.grade = 'C+';
      subject.gradePoints = 6;
    } else if (subject.marks.total >= 40) {
      subject.grade = 'C';
      subject.gradePoints = 5;
    } else if (subject.marks.total >= 35) {
      subject.grade = 'D';
      subject.gradePoints = 4;
    } else {
      subject.grade = 'F';
      subject.gradePoints = 0;
    }
    
    subject.result = subject.marks.total >= 35 ? 'Pass' : 'Fail';
  });
  
  // Calculate SGPA
  let totalCredits = 0;
  let totalGradePoints = 0;
  
  this.subjects.forEach(subject => {
    totalCredits += subject.credits;
    totalGradePoints += subject.gradePoints * subject.credits;
  });
  
  this.totalCredits = totalCredits;
  this.sgpa = totalCredits > 0 ? (totalGradePoints / totalCredits).toFixed(2) : 0;
  
  // Calculate percentage
  const totalMarks = this.subjects.reduce((sum, subject) => sum + subject.marks.total, 0);
  this.percentage = this.subjects.length > 0 ? (totalMarks / (this.subjects.length * 100) * 100).toFixed(2) : 0;
  
  // Determine overall status
  this.status = this.subjects.every(subject => subject.result === 'Pass') ? 'Pass' : 'Fail';
  this.earnedCredits = this.status === 'Pass' ? totalCredits : 0;
  
  next();
});

module.exports = mongoose.model('Result', resultSchema);
