const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  student: { type: mongoose.Schema.Types.ObjectId, ref: 'Student' },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  type: { 
    type: String, 
    enum: ['payment_update', 'payment_reminder', 'general'],
    required: true 
  },
  title: { type: String, required: true },
  message: { type: String, required: true },
  paymentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Payment' },
  amount: { type: Number },
  paymentType: { type: String },
  receiptNumber: { type: String },
  isRead: { type: Boolean, default: false }
}, {
  timestamps: true
});

// Index for efficient queries
notificationSchema.index({ student: 1, createdAt: -1 });
notificationSchema.index({ student: 1, isRead: 1 });
notificationSchema.index({ user: 1, createdAt: -1 });

module.exports = mongoose.model('Notification', notificationSchema);

module.exports = mongoose.model('Notification', notificationSchema);
