const mongoose = require('mongoose');

const studentSchema = new mongoose.Schema({
  regdNo: { 
    type: String, 
    required: true, 
    unique: true,
    trim: true,
    uppercase: true
  },
  firstName: { 
    type: String, 
    required: true,
    trim: true
  },
  lastName: { 
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
  phone: { 
    type: String, 
    required: true,
    trim: true
  },
  dateOfBirth: { 
    type: Date,
    required: true 
  },
  branch: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Branch', 
    required: true 
  },
  department: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Department'
  },
  semester: { 
    type: Number, 
    required: true, 
    min: 1, 
    max: 8 
  },
  section: { 
    type: String, 
    default: 'A',
    uppercase: true,
    trim: true
  },
  academicYear: {
    type: String,
    required: true,
    default: () => new Date().getFullYear().toString()
  },
  
  // Address Information
  address: { 
    street: { type: String, trim: true },
    city: { type: String, trim: true },
    state: { type: String, trim: true },
    pincode: { type: String, trim: true },
    country: { type: String, default: 'India', trim: true }
  },
  
  // Family Information
  fatherName: { 
    type: String, 
    required: true,
    trim: true
  },
  motherName: { 
    type: String, 
    required: true,
    trim: true
  },
  guardianName: {
    type: String,
    trim: true
  },
  guardianPhone: { 
    type: String, 
    required: true,
    trim: true
  },
  guardianEmail: {
    type: String,
    lowercase: true,
    trim: true
  },
  guardianRelation: {
    type: String,
    enum: ['Father', 'Mother', 'Guardian', 'Other'],
    default: 'Father'
  },
  
  // Personal Information
  bloodGroup: { 
    type: String, 
    enum: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-', 'Unknown'],
    default: 'Unknown'
  },
  gender: { 
    type: String, 
    enum: ['Male', 'Female', 'Other'],
    required: true 
  },
  category: { 
    type: String, 
    enum: ['General', 'OBC', 'SC', 'ST', 'EWS', 'Other'],
    required: true 
  },
  nationality: {
    type: String,
    default: 'Indian',
    trim: true
  },
  religion: {
    type: String,
    trim: true
  },
  
  // Academic Information
  admissionDate: { 
    type: Date, 
    default: Date.now 
  },
  enrollmentType: {
    type: String,
    enum: ['Regular', 'Lateral Entry', 'Transfer'],
    default: 'Regular'
  },
  previousEducation: {
    institution: { type: String, trim: true },
    board: { type: String, trim: true },
    percentage: { type: Number, min: 0, max: 100 },
    yearOfPassing: { type: Number }
  },
  
  // Fee Information
  feeDetails: {
    tuitionFee: { type: Number, default: 50000 },
    hostelFee: { type: Number, default: 0 },
    transportFee: { type: Number, default: 0 },
    libraryFee: { type: Number, default: 2000 },
    labFee: { type: Number, default: 5000 },
    examFee: { type: Number, default: 3000 },
    otherFees: { type: Number, default: 0 },
    totalAnnualFee: { type: Number, default: 60000 }
  },
  
  // Status and Tracking
  isActive: { 
    type: Boolean, 
    default: true 
  },
  status: {
    type: String,
    enum: ['Active', 'Inactive', 'Suspended', 'Graduated', 'Dropped'],
    default: 'Active'
  },
  profileImage: { 
    type: String, 
    default: '' 
  },
  
  // System Fields
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  
  // Login credentials (if students have direct login)
  username: {
    type: String,
    sparse: true, // Allow null values but enforce uniqueness when present
    unique: true,
    trim: true
  },
  password: {
    type: String,
    select: false // Don't include in queries by default
  },
  hasLogin: {
    type: Boolean,
    default: false
  },
  lastLogin: {
    type: Date
  }
}, {
  timestamps: true
});

// Pre-save middleware to calculate total fee
studentSchema.pre('save', function(next) {
  if (this.feeDetails) {
    const {
      tuitionFee = 0,
      hostelFee = 0,
      transportFee = 0,
      libraryFee = 0,
      labFee = 0,
      examFee = 0,
      otherFees = 0
    } = this.feeDetails;
    
    this.feeDetails.totalAnnualFee = 
      tuitionFee + hostelFee + transportFee + libraryFee + labFee + examFee + otherFees;
  }
  next();
});

// Instance method to get full name
studentSchema.methods.getFullName = function() {
  return `${this.firstName} ${this.lastName}`;
};

// Instance method to get current academic info
studentSchema.methods.getAcademicInfo = function() {
  return {
    regdNo: this.regdNo,
    semester: this.semester,
    section: this.section,
    academicYear: this.academicYear,
    branch: this.branch
  };
};

// Static method to find students by branch and semester
studentSchema.statics.findByBranchAndSemester = function(branchId, semester) {
  return this.find({
    branch: branchId,
    semester: semester,
    isActive: true
  }).populate('branch', 'name code');
};

// Static method to get fee summary for a student
studentSchema.statics.getFeeSummary = async function(studentId) {
  const Payment = require('./Payment');
  
  const student = await this.findById(studentId);
  if (!student) return null;
  
  const payments = await Payment.find({
    studentId: studentId,
    status: 'completed'
  });
  
  const totalPaid = payments.reduce((sum, payment) => sum + payment.amount, 0);
  const totalDue = student.feeDetails.totalAnnualFee - totalPaid;
  
  return {
    totalFee: student.feeDetails.totalAnnualFee,
    totalPaid,
    totalDue: Math.max(0, totalDue),
    paymentHistory: payments
  };
};

// Indexes for better performance
studentSchema.index({ regdNo: 1 });
studentSchema.index({ email: 1 });
studentSchema.index({ branch: 1, semester: 1 });
studentSchema.index({ isActive: 1 });
studentSchema.index({ academicYear: 1 });
studentSchema.index({ username: 1 });

module.exports = mongoose.model('Student', studentSchema);
