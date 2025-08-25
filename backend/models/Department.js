const mongoose = require('mongoose');

const departmentSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  code: {
    type: String,
    required: true,
    unique: true,
    uppercase: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  hodId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User', // Faculty who is Head of Department
    default: null
  },
  facultyCount: {
    type: Number,
    default: 0
  },
  studentCount: {
    type: Number,
    default: 0
  },
  branches: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Branch'
  }],
  establishedDate: {
    type: Date,
    default: Date.now
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

// Pre-save hook to uppercase the code
departmentSchema.pre('save', function(next) {
  if (this.code) {
    this.code = this.code.toUpperCase();
  }
  next();
});

// Static method to get department with faculty and student counts
departmentSchema.statics.getDepartmentStats = async function(departmentId) {
  const User = require('./User');
  const Student = require('./Student');
  
  const [facultyCount, studentCount] = await Promise.all([
    User.countDocuments({ 
      role: 'faculty', 
      department: departmentId,
      isActive: true 
    }),
    Student.countDocuments({ 
      department: departmentId,
      isActive: true 
    })
  ]);
  
  return { facultyCount, studentCount };
};

// Instance method to update counts
departmentSchema.methods.updateCounts = async function() {
  const stats = await this.constructor.getDepartmentStats(this._id);
  this.facultyCount = stats.facultyCount;
  this.studentCount = stats.studentCount;
  return await this.save();
};

// Indexes for better performance
departmentSchema.index({ name: 1 });
departmentSchema.index({ code: 1 });
departmentSchema.index({ isActive: 1 });
departmentSchema.index({ createdBy: 1 });

module.exports = mongoose.model('Department', departmentSchema);
