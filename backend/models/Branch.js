const mongoose = require('mongoose');

const branchSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true
  },
  code: {
    type: String,
    required: true,
    unique: true,
    uppercase: true
  },
  description: {
    type: String,
    required: true
  },
  duration: {
    type: Number,
    required: true,
    default: 4 // in years
  },
  totalSemesters: {
    type: Number,
    required: true,
    default: 8
  },
  academicFees: {
    type: Number,
    required: true,
    default: 50000
  },
  hostelFees: {
    type: Number,
    required: true,
    default: 30000
  },
  otherFees: {
    type: Number,
    required: true,
    default: 5000
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

// Pre-remove middleware to handle student deletion when branch is deleted
branchSchema.pre('remove', async function(next) {
  const Student = mongoose.model('Student');
  await Student.deleteMany({ branch: this._id });
  next();
});

module.exports = mongoose.model('Branch', branchSchema);
