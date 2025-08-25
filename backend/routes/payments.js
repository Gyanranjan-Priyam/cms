const express = require('express');
const axios = require('axios');
const crypto = require('crypto');
const XLSX = require('xlsx');
const mongoose = require('mongoose');
const Payment = require('../models/Payment');
const Student = require('../models/Student');
const Notification = require('../models/Notification');
const { auth, authorize } = require('../middleware/auth');

const router = express.Router();

// Custom payment submission endpoint
router.post('/custom-payment', auth, async (req, res) => {
  try {
    const { amount, paymentType, paymentMethod, transactionId } = req.body;
    const studentId = req.user.id;

    // Validate required fields
    if (!amount || !paymentType || !paymentMethod || !transactionId) {
      return res.status(400).json({
        success: false,
        message: 'All fields are required'
      });
    }

    // Check if transaction ID already exists
    const existingPayment = await Payment.findOne({ transactionId: transactionId.trim() });
    if (existingPayment) {
      return res.status(400).json({
        success: false,
        message: 'Transaction ID already exists. Please use a different transaction ID.'
      });
    }

    // Get student details
    const student = await Student.findById(studentId);
    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student not found'
      });
    }

    // Generate unique receipt number
    const receiptNumber = `RCP${Date.now()}${Math.floor(Math.random() * 1000)}`;

    // Create payment record
    const payment = new Payment({
      student: studentId,
      amount: parseFloat(amount),
      paymentType,
      paymentMethod: paymentMethod, // Use paymentMethod directly since frontend already sends 'custom_qr'
      transactionId,
      receiptNumber,
      status: 'pending',
      submittedDate: new Date(),
      notes: `Payment submitted via ${paymentMethod.toUpperCase()} - Transaction ID: ${transactionId}`,
      // Set auto-delete timer for 5 minutes if no transaction ID or if payment fails
      autoDeleteAt: new Date(Date.now() + 5 * 60 * 1000) // 5 minutes from now
    });

    await payment.save();

    // Create notification for the student about payment submission
    if (transactionId && transactionId.trim()) {
      const notification = new Notification({
        student: studentId,
        type: 'payment_update',
        title: 'Payment Submitted',
        message: `Your payment of ₹${amount} for ${paymentType} has been submitted and is pending verification.`,
        paymentId: payment._id,
        amount: amount,
        paymentType: paymentType
      });

      await notification.save();
    }

    res.json({
      success: true,
      message: 'Payment submitted successfully. It will be verified by the finance department.',
      paymentId: payment._id,
      receiptNumber: payment.receiptNumber,
      status: 'pending'
    });

  } catch (error) {
    console.error('Error in custom payment submission:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// Approve or reject custom payment (Finance Department)
router.post('/verify-custom-payment', auth, async (req, res) => {
  try {
    const { paymentId, action, notes } = req.body; // action: 'approve' or 'reject'
    const financeUserId = req.user.id;

    // Validate input
    if (!paymentId || !action || !['approve', 'reject'].includes(action)) {
      return res.status(400).json({
        success: false,
        message: 'Payment ID and valid action (approve/reject) are required'
      });
    }

    // Check if user has finance department role
    if (req.user.role !== 'finance_department' && req.user.role !== 'head_admin' && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Finance department access required.'
      });
    }

    // Find the payment
    const payment = await Payment.findById(paymentId).populate('student');
    if (!payment) {
      return res.status(404).json({
        success: false,
        message: 'Payment not found'
      });
    }

    // Check if payment is in pending state
    if (payment.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: 'Payment has already been processed'
      });
    }

    // Update payment status
    if (action === 'approve') {
      payment.status = 'completed';
      payment.paidDate = new Date();
      payment.verifiedBy = financeUserId;
      payment.verifiedDate = new Date();
      if (notes) payment.notes = notes;
      
      // Generate receipt number if not exists
      if (!payment.receiptNumber) {
        payment.receiptNumber = `RCP${Date.now()}${Math.floor(Math.random() * 1000)}`;
      }
    } else {
      payment.status = 'rejected';
      payment.rejectionReason = notes || 'Payment rejected by finance department';
      payment.verifiedBy = financeUserId;
      payment.verifiedDate = new Date();
    }

    await payment.save();

    // Create notification for student
    const notification = new Notification({
      student: payment.student._id,
      title: action === 'approve' ? 'Payment Approved' : 'Payment Rejected',
      message: action === 'approve' 
        ? `Your payment of ₹${payment.amount} for ${payment.paymentType} has been approved and receipt generated.`
        : `Your payment of ₹${payment.amount} for ${payment.paymentType} has been rejected. ${payment.rejectionReason}`,
      type: 'payment_update', // Use valid enum value
      paymentId: payment._id,
      amount: payment.amount,
      paymentType: payment.paymentType,
      receiptNumber: payment.receiptNumber
    });

    await notification.save();

    res.json({
      success: true,
      message: `Payment ${action}d successfully`,
      payment: {
        id: payment._id,
        status: payment.status,
        receiptNumber: payment.receiptNumber,
        verifiedDate: payment.verifiedDate
      }
    });

  } catch (error) {
    console.error('Error in custom payment verification:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// Cashfree API configuration
const CASHFREE_API_URL = process.env.CASHFREE_BASE_URL || 'https://sandbox.cashfree.com/pg';
const CASHFREE_APP_ID = process.env.CASHFREE_APP_ID;
const CASHFREE_SECRET_KEY = process.env.CASHFREE_SECRET_KEY;
const DOMAIN = process.env.DOMAIN || 'https://your-domain.com';

// Create payment order
router.post('/create-order', auth, async (req, res) => {
  try {
    const { amount, paymentType, studentId } = req.body;
    
    console.log('Create order request:', { amount, paymentType, studentId, userRole: req.user.role, userId: req.user._id });
    
    // Validate required fields
    if (!amount || !paymentType) {
      return res.status(400).json({ message: 'Amount and payment type are required' });
    }

    // For students, use their own ID; for admins, use provided studentId
    const finalStudentId = req.user.role === 'student' ? req.user._id : studentId;
    
    console.log('Final student ID for payment:', finalStudentId);
    
    if (!finalStudentId) {
      return res.status(400).json({ message: 'Student ID is required' });
    }

    // Get student details for order
    const student = await Student.findById(finalStudentId);
    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }

    // Create unique order ID
    const orderId = `CF_ORDER_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
    
    // Create Cashfree order request
    const orderRequest = {
      order_id: orderId,
      order_amount: amount,
      order_currency: 'INR',
      customer_details: {
        customer_id: student.regdNo,
        customer_name: `${student.firstName} ${student.lastName}`,
        customer_email: student.email,
        customer_phone: student.mobile || '9999999999'
      },
      order_meta: {
        return_url: `${DOMAIN}/payment-success?order_id={order_id}`,
        notify_url: `${DOMAIN}/api/payments/webhook`,
        payment_methods: 'cc,dc,nb,upi,paylater,emi'
      },
      order_note: `Payment for ${paymentType} - ${student.firstName} ${student.lastName}`
    };

    console.log('Creating Cashfree order:', orderRequest);
    
    // Create order with Cashfree using direct API
    const cashfreeResponse = await axios.post(`${CASHFREE_API_URL}/orders`, orderRequest, {
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'x-client-id': CASHFREE_APP_ID,
        'x-client-secret': CASHFREE_SECRET_KEY,
        'x-api-version': '2022-09-01'
      }
    });
    
    console.log('Cashfree order created:', cashfreeResponse.data);
    
    // Create payment record
    const payment = new Payment({
      student: finalStudentId,
      amount,
      paymentType,
      cashfreeOrderId: orderId,
      cashfreeOrderToken: cashfreeResponse.data.order_token,
      status: 'pending'
    });
    
    await payment.save();
    console.log('Payment record created:', payment._id);

    res.json({
      orderId: orderId,
      orderToken: cashfreeResponse.data.order_token,
      amount: amount,
      currency: 'INR',
      paymentId: payment._id,
      paymentSessionId: cashfreeResponse.data.payment_session_id
    });
  } catch (error) {
    console.error('Error in create-order route:', error);
    
    // Handle specific Cashfree errors
    if (error.response && error.response.data) {
      const { code, message } = error.response.data;
      
      if (code === 'request_failed' && message.includes('transactions are not enabled')) {
        return res.status(400).json({ 
          message: 'Payment gateway not activated. Please complete KYC verification in your Cashfree dashboard.',
          error: 'Gateway not activated'
        });
      }
      
      return res.status(400).json({ 
        message: 'Payment gateway error: ' + message,
        error: code
      });
    }
    
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Verify payment
router.post('/verify', auth, async (req, res) => {
  try {
    const { orderId, paymentId } = req.body;
    
    console.log('Payment verification request:', { orderId, paymentId });
    
    if (!orderId) {
      return res.status(400).json({ success: false, message: 'Order ID is required' });
    }

    // Get payment status from Cashfree using direct API
    const cashfreeResponse = await axios.get(`${CASHFREE_API_URL}/orders/${orderId}/payments`, {
      headers: {
        'Accept': 'application/json',
        'x-client-id': CASHFREE_APP_ID,
        'x-client-secret': CASHFREE_SECRET_KEY,
        'x-api-version': '2022-09-01'
      }
    });
    
    console.log('Cashfree payment status:', cashfreeResponse.data);
    
    // Find the payment record
    const payment = await Payment.findById(paymentId);
    if (!payment) {
      return res.status(404).json({ success: false, message: 'Payment not found' });
    }
    
    // Check if response has payment data
    if (!cashfreeResponse.data || cashfreeResponse.data.length === 0) {
      return res.json({ 
        success: false, 
        message: 'No payment transactions found for this order. Payment may still be pending or not yet initiated.',
        status: 'pending'
      });
    }
    
    // Check if any payment in the response is successful
    const successfulPayment = cashfreeResponse.data.find(p => p.payment_status === 'SUCCESS');
    
    if (successfulPayment) {
      // Update payment record
      payment.cashfreePaymentId = successfulPayment.cf_payment_id;
      payment.status = 'completed';
      payment.transactionId = successfulPayment.payment_id || successfulPayment.cf_payment_id;
      payment.paidDate = new Date();
      
      await payment.save();
      
      console.log('Payment marked as completed with receipt number:', payment.receiptNumber);
      res.json({ success: true, message: 'Payment verified successfully' });
    } else {
      // Check for failed payments
      const failedPayment = cashfreeResponse.data.find(p => p.payment_status === 'FAILED');
      if (failedPayment) {
        payment.status = 'failed';
        await payment.save();
        res.json({ success: false, message: 'Payment failed' });
      } else {
        res.json({ success: false, message: 'Payment status is still pending' });
      }
    }
  } catch (error) {
    console.error('Error in payment verification:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
});

// Webhook endpoint for Cashfree notifications
router.post('/webhook', async (req, res) => {
  try {
    console.log('Cashfree webhook received:', req.body);
    
    const { orderId, paymentStatus, cfPaymentId, transactionId } = req.body;
    
    if (!orderId) {
      return res.status(400).json({ message: 'Order ID is required' });
    }
    
    // Find payment by Cashfree order ID
    const payment = await Payment.findOne({ cashfreeOrderId: orderId });
    if (!payment) {
      console.log('Payment not found for order ID:', orderId);
      return res.status(404).json({ message: 'Payment not found' });
    }
    
    // Update payment status based on webhook
    if (paymentStatus === 'SUCCESS') {
      payment.cashfreePaymentId = cfPaymentId;
      payment.status = 'completed';
      payment.transactionId = transactionId || cfPaymentId;
      payment.paidDate = new Date();
    } else if (paymentStatus === 'FAILED') {
      payment.status = 'failed';
    }
    
    await payment.save();
    console.log(`Payment ${orderId} updated to status: ${payment.status}`);
    
    res.status(200).json({ message: 'Webhook processed successfully' });
  } catch (error) {
    console.error('Error processing webhook:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get payments (Finance Department)
router.get('/', auth, authorize(['finance_department', 'head_admin', 'admin']), async (req, res) => {
  try {
    const { 
      student, 
      paymentType, 
      status, 
      branch,
      startDate, 
      endDate,
      page = 1,
      limit = 10
    } = req.query;
    
    let query = {};
    if (student) query.student = student;
    if (paymentType) query.paymentType = paymentType;
    if (status) query.status = status;
    if (startDate && endDate) {
      query.paymentDate = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }

    // Use aggregation pipeline for branch filtering
    const pipeline = [
      { $match: query },
      {
        $lookup: {
          from: 'students',
          localField: 'student',
          foreignField: '_id',
          as: 'student'
        }
      },
      { $unwind: '$student' },
      {
        $lookup: {
          from: 'branches',
          localField: 'student.branch',
          foreignField: '_id',
          as: 'student.branch'
        }
      },
      { $unwind: '$student.branch' },
      // Add branch filtering if specified
      ...(branch ? [{ $match: { 'student.branch._id': new mongoose.Types.ObjectId(branch) } }] : []),
      { $sort: { paymentDate: -1 } },
      { $skip: (parseInt(page) - 1) * parseInt(limit) },
      { $limit: parseInt(limit) }
    ];

    const [payments, totalCount] = await Promise.all([
      Payment.aggregate(pipeline),
      Payment.aggregate([
        ...pipeline.slice(0, -2), // Remove skip and limit for count
        { $count: 'total' }
      ])
    ]);

    const total = totalCount[0]?.total || 0;

    res.json({
      payments,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Get student payment history
router.get('/student/:studentId', auth, async (req, res) => {
  try {
    // For students, use their own ID; for admins, use the provided studentId parameter
    const studentId = req.user.role === 'student' ? req.user._id : req.params.studentId;
    
    console.log('Getting payments for student:', studentId, 'requested by:', req.user.role);
    
    const payments = await Payment.find({ 
      student: studentId
    }).sort({ createdAt: -1 }); // Changed from paymentDate to createdAt

    console.log('Found payments:', payments.length);
    
    res.json({ payments });
  } catch (error) {
    console.error('Error fetching student payments:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Add manual payment (Finance Department)
router.post('/manual', auth, authorize(['finance_department', 'head_admin', 'admin']), async (req, res) => {
  try {
    console.log('Manual payment request body:', req.body);
    
    const { studentId, amount, paymentType, paymentMethod, dueDate, semester, academicYear, description } = req.body;
    
    // Validate required fields
    if (!studentId || !amount || !paymentType) {
      return res.status(400).json({ message: 'Student ID, amount, and payment type are required' });
    }
    
    const payment = new Payment({
      student: studentId,
      amount: parseFloat(amount),
      paymentType,
      paymentMethod: paymentMethod || 'cash',
      dueDate: dueDate ? new Date(dueDate) : undefined,
      semester: semester || undefined,
      academicYear: academicYear || new Date().getFullYear().toString(),
      description: description || '',
      status: 'pending',
      transactionId: `MAN${Date.now()}`
    });
    
    console.log('Payment object before save:', {
      student: payment.student,
      amount: payment.amount,
      paymentType: payment.paymentType,
      status: payment.status,
      dueDate: payment.dueDate
    });
    
    await payment.save();
    await payment.populate('student', 'regdNo firstName lastName email phone');
    
    res.status(201).json(payment);
  } catch (error) {
    console.error('Error creating manual payment:', error);
    if (error.name === 'ValidationError') {
      res.status(400).json({ message: 'Validation error', details: error.message });
    } else if (error.code === 11000) {
      res.status(400).json({ message: 'Duplicate entry error', details: error.message });
    } else {
      res.status(500).json({ message: 'Server error', error: error.message });
    }
  }
});

// Update payment status (Finance Department)
router.patch('/:id/status', auth, authorize(['finance_department', 'head_admin', 'admin']), async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    
    if (!['pending', 'completed', 'failed'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }
    
    // Find the payment first to get current status
    const currentPayment = await Payment.findById(id).populate('student', 'regdNo firstName lastName email phone');
    
    if (!currentPayment) {
      return res.status(404).json({ message: 'Payment not found' });
    }
    
    // Update the payment status
    currentPayment.status = status;
    await currentPayment.save(); // This will trigger the pre-save hook for receipt generation
    
    // Reload the payment with updated data
    const updatedPayment = await Payment.findById(id).populate('student', 'regdNo firstName lastName email phone');
    
    // Send notification to student based on status change
    const notificationData = {
      student: updatedPayment.student._id,
      type: 'payment_update',
      title: `Payment ${status.charAt(0).toUpperCase() + status.slice(1)}`,
      message: '',
      paymentId: updatedPayment._id,
      amount: updatedPayment.amount,
      paymentType: updatedPayment.paymentType,
      receiptNumber: updatedPayment.receiptNumber,
      priority: status === 'completed' ? 'high' : status === 'failed' ? 'high' : 'medium'
    };
    
    if (status === 'completed') {
      notificationData.message = `Your ${updatedPayment.paymentType} payment of ₹${updatedPayment.amount.toLocaleString()} has been successfully verified and completed. Receipt Number: ${updatedPayment.receiptNumber}`;
    } else if (status === 'failed') {
      notificationData.message = `Your ${updatedPayment.paymentType} payment of ₹${updatedPayment.amount.toLocaleString()} has been marked as failed. Please contact the finance department for assistance.`;
    } else if (status === 'pending') {
      notificationData.message = `Your ${updatedPayment.paymentType} payment of ₹${updatedPayment.amount.toLocaleString()} is now pending review.`;
    }
    
    // Save notification to database
    const notification = new Notification(notificationData);
    await notification.save();
    
    // Log the notification (In a real app, you'd also send email/SMS)
    console.log('Payment Status Notification Created:', {
      student: `${updatedPayment.student.firstName} ${updatedPayment.student.lastName} (${updatedPayment.student.regdNo})`,
      email: updatedPayment.student.email,
      notification: notificationData
    });
    
    res.json({
      payment: updatedPayment,
      notification: notification,
      message: `Payment status updated to ${status} and notification sent to student`
    });
  } catch (error) {
    console.error('Error updating payment status:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Export payments to Excel
router.get('/export', auth, authorize(['finance_department', 'head_admin', 'admin']), async (req, res) => {
  try {
    const { student, paymentType, status, startDate, endDate, search } = req.query;
    const filter = {};
    
    if (student) filter.student = student;
    if (paymentType) filter.paymentType = paymentType;
    if (status) filter.status = status;
    if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate) filter.createdAt.$gte = new Date(startDate);
      if (endDate) filter.createdAt.$lte = new Date(endDate);
    }

    let payments = await Payment.find(filter)
      .populate('student', 'firstName lastName regdNo email phone')
      .sort({ createdAt: -1 });

    // Apply search filter if provided
    if (search) {
      payments = payments.filter(payment => 
        payment.student?.firstName?.toLowerCase().includes(search.toLowerCase()) ||
        payment.student?.lastName?.toLowerCase().includes(search.toLowerCase()) ||
        payment.student?.regdNo?.toLowerCase().includes(search.toLowerCase()) ||
        payment.student?.email?.toLowerCase().includes(search.toLowerCase()) ||
        payment.transactionId?.toLowerCase().includes(search.toLowerCase())
      );
    }

    // Prepare data for Excel export
    const excelData = payments.map(payment => ({
      'Registration Number': payment.student?.regdNo || 'N/A',
      'Student Name': payment.student ? `${payment.student.firstName} ${payment.student.lastName}` : 'N/A',
      'Email': payment.student?.email || 'N/A',
      'Phone': payment.student?.phone || 'N/A',
      'Amount': payment.amount,
      'Payment Type': payment.paymentType,
      'Status': payment.status,
      'Transaction ID': payment.transactionId || 'N/A',
      'Razorpay Order ID': payment.razorpayOrderId || 'N/A',
      'Payment Method': payment.paymentMethod || 'N/A',
      'Paid Date': payment.paidDate ? new Date(payment.paidDate).toLocaleDateString() : 'N/A',
      'Due Date': payment.dueDate ? new Date(payment.dueDate).toLocaleDateString() : 'N/A',
      'Created Date': new Date(payment.createdAt).toLocaleDateString(),
      'Description': payment.description || 'N/A'
    }));

    // Create workbook and worksheet
    const workbook = XLSX.utils.book_new();
    const worksheet = XLSX.utils.json_to_sheet(excelData);
    
    // Auto-fit column widths
    const columnWidths = Object.keys(excelData[0] || {}).map(key => ({
      wch: Math.max(key.length, 15)
    }));
    worksheet['!cols'] = columnWidths;

    XLSX.utils.book_append_sheet(workbook, worksheet, 'Payments');

    // Generate buffer
    const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });

    // Set response headers
    res.setHeader('Content-Disposition', `attachment; filename=payments_${new Date().toISOString().split('T')[0]}.xlsx`);
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    
    res.send(buffer);
  } catch (error) {
    console.error('Export error:', error);
    res.status(500).json({ message: 'Export failed', error: error.message });
  }
});

// Delete payment (Admin only) - Direct Database Deletion
router.delete('/:paymentId', auth, async (req, res) => {
  try {
    const { paymentId } = req.params;
    
    console.log(`Delete payment request - PaymentID: ${paymentId}, User: ${req.user.email}, Role: ${req.user.role}`);
    
    // Check if user has permission to delete payments
    if (req.user.role !== 'head_admin' && req.user.role !== 'finance_department') {
      console.log(`Access denied for user ${req.user.email} with role ${req.user.role}`);
      return res.status(403).json({ 
        success: false, 
        message: 'Access denied. Only admin and finance department can delete payments.' 
      });
    }

    console.log(`🗑️ Direct deletion request for payment: ${paymentId} by user: ${req.user.email}`);

    // Find payment first to verify existence
    const payment = await Payment.findById(paymentId);
    if (!payment) {
      return res.status(404).json({
        success: false,
        message: 'Payment not found'
      });
    }

    // Delete the payment record
    await Payment.findByIdAndDelete(paymentId);

    console.log('✅ Payment deleted successfully via direct database access');
    res.json({
      success: true,
      message: `Payment ${payment.paymentId || payment._id} has been deleted successfully`,
      deletedPayment: {
        id: payment._id,
        paymentId: payment.paymentId,
        amount: payment.amount,
        status: payment.status
      }
    });

  } catch (error) {
    console.error('❌ Error in direct payment deletion:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error while deleting payment', 
      error: error.message 
    });
  }
});

// Get payment result for the result page
router.get('/result/:orderId', auth, async (req, res) => {
  try {
    const { orderId } = req.params;
    
    console.log('Payment result request for order:', orderId);
    
    // Find payment by cashfreeOrderId
    const payment = await Payment.findOne({ 
      cashfreeOrderId: orderId 
    }).populate('student', 'firstName lastName regdNo email');
    
    if (!payment) {
      return res.status(404).json({ 
        success: false, 
        message: 'Payment not found' 
      });
    }
    
    // Check if user has permission to view this payment
    if (req.user.role === 'student' && payment.student._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ 
        success: false, 
        message: 'Access denied' 
      });
    }
    
    res.json({
      success: true,
      payment: {
        _id: payment._id,
        cashfreeOrderId: payment.cashfreeOrderId,
        amount: payment.amount,
        paymentType: payment.paymentType,
        status: payment.status,
        transactionId: payment.transactionId,
        receiptNumber: payment.receiptNumber,
        paidDate: payment.paidDate,
        createdAt: payment.createdAt,
        student: payment.student
      }
    });
    
  } catch (error) {
    console.error('Error fetching payment result:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error', 
      error: error.message 
    });
  }
});

// Get payment history (only completed payments)
router.get('/history', auth, async (req, res) => {
  try {
    const { page = 1, limit = 10, status = 'completed', student, paymentType, branch, startDate, endDate } = req.query;
    
    // Build query
    let query = { status: 'completed' }; // Only show completed payments in history
    
    if (student) query.student = student;
    if (paymentType) query.paymentType = paymentType;
    if (startDate || endDate) {
      query.paymentDate = {};
      if (startDate) query.paymentDate.$gte = new Date(startDate);
      if (endDate) query.paymentDate.$lte = new Date(endDate);
    }

    // Build aggregation pipeline to include branch filtering
    const pipeline = [
      { $match: query },
      {
        $lookup: {
          from: 'students',
          localField: 'student',
          foreignField: '_id',
          as: 'student'
        }
      },
      { $unwind: '$student' },
      {
        $lookup: {
          from: 'branches',
          localField: 'student.branch',
          foreignField: '_id',
          as: 'student.branch'
        }
      },
      { $unwind: '$student.branch' },
      // Add branch filtering if specified
      ...(branch ? [{ $match: { 'student.branch._id': new mongoose.Types.ObjectId(branch) } }] : []),
      { $sort: { paymentDate: -1 } },
      { $skip: (parseInt(page) - 1) * parseInt(limit) },
      { $limit: parseInt(limit) }
    ];

    const [payments, totalCount] = await Promise.all([
      Payment.aggregate(pipeline),
      Payment.aggregate([
        ...pipeline.slice(0, -2), // Remove skip and limit for count
        { $count: 'total' }
      ])
    ]);

    const total = totalCount[0]?.total || 0;
    const totalPages = Math.ceil(total / parseInt(limit));

    res.json({
      success: true,
      payments,
      pagination: {
        currentPage: parseInt(page),
        totalPages,
        totalRecords: total,
        limit: parseInt(limit)
      }
    });

  } catch (error) {
    console.error('Error fetching payment history:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

module.exports = router;
