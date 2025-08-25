const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
  student: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true },
  amount: { type: Number, required: true },
  paymentType: { 
    type: String, 
    enum: ['academic', 'hostel', 'other'],
    required: true 
  },
  paymentMethod: { 
    type: String, 
    enum: ['online', 'cash', 'cheque', 'custom_upi', 'custom_qr'],
    default: 'online'
  },
  transactionId: { type: String, unique: true, sparse: true },
  cashfreeOrderId: { type: String },
  cashfreePaymentId: { type: String },
  cashfreeOrderToken: { type: String },
  status: { 
    type: String, 
    enum: ['pending', 'completed', 'failed', 'rejected'],
    default: 'pending'
  },
  paymentDate: { type: Date, default: Date.now },
  paidDate: { type: Date },
  dueDate: { type: Date },
  semester: { type: Number },
  academicYear: { type: String },
  description: { type: String },
  receiptNumber: { type: String, unique: true, sparse: true },
  submittedDate: { type: Date }, // When custom payment was submitted
  verifiedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // Finance user who verified
  verifiedDate: { type: Date }, // When payment was verified
  notes: { type: String }, // Additional notes
  rejectionReason: { type: String }, // If payment is rejected
  autoDeleteAt: { type: Date } // Auto-delete failed payments after this time
}, {
  timestamps: true
});

// Generate receipt number and set paidDate when payment is completed
paymentSchema.pre('save', async function(next) {
  if (this.isModified('status') || this.isNew) {
    if (this.status === 'completed' && !this.receiptNumber) {
      const count = await this.constructor.countDocuments({ receiptNumber: { $exists: true } });
      this.receiptNumber = `RCP${Date.now()}${(count + 1).toString().padStart(4, '0')}`;
      this.paidDate = new Date();
    } else if (this.status === 'failed') {
      // Remove receiptNumber if payment failed
      this.receiptNumber = undefined;
      this.paidDate = undefined;
    } else if (this.status === 'pending') {
      // Ensure no receiptNumber for pending payments
      this.receiptNumber = undefined;
      this.paidDate = undefined;
    }
  }
  next();
});

module.exports = mongoose.model('Payment', paymentSchema);
