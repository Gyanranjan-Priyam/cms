const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  username: { 
    type: String, 
    required: true, 
    unique: true,
    trim: true
  },
  password: { 
    type: String, 
    required: true 
  },
  role: { 
    type: String, 
    enum: [
      'admin',              // Head Admin - can create departments, add faculty
      'student_management', // Student Management Dashboard admin
      'finance_officer',    // Finance Department officer
      'faculty',           // Faculty members
      'student'            // Students (if using unified auth)
    ],
    required: true 
  },
  name: { 
    type: String, 
    required: true,
    trim: true
  },
  email: { 
    type: String, 
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  employeeId: {
    type: String,
    sparse: true, // Allow null for students
    unique: true,
    trim: true
  },
  department: { 
    type: String,
    trim: true
  },
  designation: { 
    type: String,
    trim: true
  },
  // Faculty specific fields
  facultyDepartment: {
    type: String,
    trim: true
  },
  specialization: {
    type: String,
    trim: true
  },
  experience: {
    type: Number,
    min: 0
  },
  // Access permissions
  permissions: {
    canCreateDepartments: { type: Boolean, default: false },
    canManageStudents: { type: Boolean, default: false },
    canManageFaculty: { type: Boolean, default: false },
    canManageFinance: { type: Boolean, default: false },
    canViewReports: { type: Boolean, default: false }
  },
  isActive: { 
    type: Boolean, 
    default: true 
  },
  lastLogin: { 
    type: Date 
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

// Pre-save hook for password hashing
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

// Pre-save hook for setting permissions based on role
userSchema.pre('save', function(next) {
  switch(this.role) {
    case 'admin':
      this.permissions = {
        canCreateDepartments: true,
        canManageStudents: true,
        canManageFaculty: true,
        canManageFinance: true,
        canViewReports: true
      };
      break;
    case 'student_management':
      this.permissions = {
        canCreateDepartments: false,
        canManageStudents: true,
        canManageFaculty: false,
        canManageFinance: false,
        canViewReports: true
      };
      break;
    case 'finance_officer':
      this.permissions = {
        canCreateDepartments: false,
        canManageStudents: false,
        canManageFaculty: false,
        canManageFinance: true,
        canViewReports: true
      };
      break;
    case 'faculty':
      this.permissions = {
        canCreateDepartments: false,
        canManageStudents: false,
        canManageFaculty: false,
        canManageFinance: false,
        canViewReports: false
      };
      break;
    default:
      this.permissions = {
        canCreateDepartments: false,
        canManageStudents: false,
        canManageFaculty: false,
        canManageFinance: false,
        canViewReports: false
      };
  }
  next();
});

// Method to compare password
userSchema.methods.comparePassword = async function(password) {
  return await bcrypt.compare(password, this.password);
};

// Method to update last login
userSchema.methods.updateLastLogin = function() {
  this.lastLogin = new Date();
  return this.save();
};

// Static method to create admin user
userSchema.statics.createAdmin = async function(adminData, createdBy = null) {
  const admin = new this({
    ...adminData,
    role: 'admin',
    createdBy
  });
  return await admin.save();
};

// Static method to create faculty user
userSchema.statics.createFaculty = async function(facultyData, createdBy) {
  const faculty = new this({
    ...facultyData,
    role: 'faculty',
    createdBy
  });
  return await faculty.save();
};

// Indexes for better performance
userSchema.index({ username: 1 });
userSchema.index({ email: 1 });
userSchema.index({ employeeId: 1 });
userSchema.index({ role: 1 });
userSchema.index({ isActive: 1 });

module.exports = mongoose.model('User', userSchema);
