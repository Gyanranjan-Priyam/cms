const mongoose = require('mongoose');

const attendanceSchema = new mongoose.Schema({
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
  academicYear: {
    type: String,
    required: true
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
    totalClasses: {
      type: Number,
      default: 0,
      min: 0
    },
    attendedClasses: {
      type: Number,
      default: 0,
      min: 0
    },
    percentage: {
      type: Number,
      default: 0,
      min: 0,
      max: 100
    },
    status: {
      type: String,
      enum: ['Excellent', 'Good', 'Average', 'Poor', 'Critical'],
      default: 'Average'
    }
  }],
  overallAttendance: {
    totalClasses: {
      type: Number,
      default: 0
    },
    attendedClasses: {
      type: Number,
      default: 0
    },
    percentage: {
      type: Number,
      default: 0,
      min: 0,
      max: 100
    },
    status: {
      type: String,
      enum: ['Excellent', 'Good', 'Average', 'Poor', 'Critical'],
      default: 'Average'
    }
  },
  dailyAttendance: [{
    date: {
      type: Date,
      required: true
    },
    subjects: [{
      subjectCode: String,
      subjectName: String,
      status: {
        type: String,
        enum: ['Present', 'Absent', 'Late'],
        required: true
      },
      period: Number
    }]
  }]
}, {
  timestamps: true
});

// Calculate attendance percentages before saving
attendanceSchema.pre('save', function(next) {
  let totalOverallClasses = 0;
  let totalOverallAttended = 0;
  
  // Calculate subject-wise attendance
  this.subjects.forEach(subject => {
    if (subject.totalClasses > 0) {
      subject.percentage = ((subject.attendedClasses / subject.totalClasses) * 100).toFixed(2);
      
      // Determine status based on percentage
      if (subject.percentage >= 90) {
        subject.status = 'Excellent';
      } else if (subject.percentage >= 80) {
        subject.status = 'Good';
      } else if (subject.percentage >= 75) {
        subject.status = 'Average';
      } else if (subject.percentage >= 65) {
        subject.status = 'Poor';
      } else {
        subject.status = 'Critical';
      }
    }
    
    totalOverallClasses += subject.totalClasses;
    totalOverallAttended += subject.attendedClasses;
  });
  
  // Calculate overall attendance
  this.overallAttendance.totalClasses = totalOverallClasses;
  this.overallAttendance.attendedClasses = totalOverallAttended;
  
  if (totalOverallClasses > 0) {
    this.overallAttendance.percentage = ((totalOverallAttended / totalOverallClasses) * 100).toFixed(2);
    
    // Determine overall status
    if (this.overallAttendance.percentage >= 90) {
      this.overallAttendance.status = 'Excellent';
    } else if (this.overallAttendance.percentage >= 80) {
      this.overallAttendance.status = 'Good';
    } else if (this.overallAttendance.percentage >= 75) {
      this.overallAttendance.status = 'Average';
    } else if (this.overallAttendance.percentage >= 65) {
      this.overallAttendance.status = 'Poor';
    } else {
      this.overallAttendance.status = 'Critical';
    }
  }
  
  next();
});

module.exports = mongoose.model('Attendance', attendanceSchema);
