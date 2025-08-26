const express = require('express');
const Razorpay = require('razorpay');
const crypto = require('crypto');
const Payment = require('../models/Payment');
const Student = require('../models/Student');
const Notification = require('../models/Notification');
const { auth } = require('../middleware/auth');

const router = express.Router();

// Initialize Razorpay instance
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

// Utility function to generate receipt number
const generateReceiptNumber = () => {
  const timestamp = Date.now();
  const random = Math.floor(Math.random() * 1000);
  return `RCPT_${timestamp}_${random}`;
};

// Utility function to validate amount
const validateAmount = (amount) => {
  const numAmount = parseFloat(amount);
  if (isNaN(numAmount) || numAmount <= 0) {
    throw new Error('Invalid amount');
  }
  return numAmount;
};

/**
 * @route POST /api/payments/razorpay/create-order
 * @desc Create Razorpay order
 * @access Private
 */
router.post('/create-order', auth, async (req, res) => {
  try {
    const { amount, paymentType, studentId } = req.body;
    const userId = req.user.id;

    // Validate required fields
    if (!amount || !paymentType) {
      return res.status(400).json({
        success: false,
        message: 'Amount and payment type are required'
      });
    }

    // Validate amount
    const validatedAmount = validateAmount(amount / 100); // Convert from paise to rupees
    
    // Get student details
    const targetStudentId = studentId || userId;
    const student = await Student.findById(targetStudentId);
    
    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student not found'
      });
    }

    // Check authorization - student can only create orders for themselves
    if (req.user.role === 'student' && targetStudentId !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized - cannot create order for another student'
      });
    }

    // Generate receipt number
    const receiptNumber = generateReceiptNumber();

    // Create Razorpay order
    const orderOptions = {
      amount: amount, // Amount in paise (already converted in frontend)
      currency: 'INR',
      receipt: receiptNumber,
      notes: {
        student_id: student._id.toString(),
        student_regdno: student.regdNo,
        student_name: `${student.firstName} ${student.lastName}`,
        payment_type: paymentType,
        created_by: req.user.id
      }
    };

    const razorpayOrder = await razorpay.orders.create(orderOptions);

    // Create pending payment record in database
    const payment = new Payment({
      student: student._id,
      amount: validatedAmount,
      paymentType,
      paymentMethod: 'razorpay',
      razorpayOrderId: razorpayOrder.id,
      status: 'pending',
      receiptNumber,
      submittedDate: new Date(),
      notes: `Razorpay order created - Order ID: ${razorpayOrder.id}`
    });

    await payment.save();

    // Log order creation
    console.log(`✅ Razorpay order created: ${razorpayOrder.id} for student: ${student.regdNo}`);

    res.json({
      success: true,
      order_id: razorpayOrder.id,
      amount: razorpayOrder.amount,
      currency: razorpayOrder.currency,
      receipt: razorpayOrder.receipt,
      student_name: `${student.firstName} ${student.lastName}`,
      student_email: student.email,
      student_phone: student.phone || '',
      payment_id: payment._id
    });

  } catch (error) {
    console.error('❌ Error creating Razorpay order:', error);
    
    // Handle Razorpay specific errors
    if (error.statusCode) {
      return res.status(error.statusCode).json({
        success: false,
        message: error.error?.description || 'Razorpay order creation failed',
        razorpay_error: true
      });
    }

    res.status(500).json({
      success: false,
      message: 'Failed to create payment order',
      error: error.message
    });
  }
});

/**
 * @route POST /api/payments/razorpay/verify-payment
 * @desc Verify Razorpay payment
 * @access Private
 */
router.post('/verify-payment', auth, async (req, res) => {
  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      paymentType,
      amount
    } = req.body;

    // Validate required fields
    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({
        success: false,
        message: 'Missing payment verification parameters'
      });
    }

    // Verify signature
    const body = razorpay_order_id + '|' + razorpay_payment_id;
    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(body.toString())
      .digest('hex');

    if (expectedSignature !== razorpay_signature) {
      console.error('❌ Payment signature verification failed');
      return res.status(400).json({
        success: false,
        message: 'Payment signature verification failed',
        signature_mismatch: true
      });
    }

    // Find payment record
    const payment = await Payment.findOne({ 
      razorpayOrderId: razorpay_order_id 
    }).populate('student');
    
    if (!payment) {
      return res.status(404).json({
        success: false,
        message: 'Payment record not found'
      });
    }

    // Check if payment already processed
    if (payment.status === 'completed') {
      return res.status(400).json({
        success: false,
        message: 'Payment already processed'
      });
    }

    // Check authorization
    if (req.user.role === 'student' && payment.student._id.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized - cannot verify payment for another student'
      });
    }

    // Fetch payment details from Razorpay to double-check
    try {
      const razorpayPayment = await razorpay.payments.fetch(razorpay_payment_id);
      
      if (razorpayPayment.status !== 'captured') {
        return res.status(400).json({
          success: false,
          message: 'Payment not captured by Razorpay',
          razorpay_status: razorpayPayment.status
        });
      }
    } catch (fetchError) {
      console.error('❌ Error fetching payment from Razorpay:', fetchError);
      // Continue with verification as signature was valid
    }

    // Update payment record
    payment.status = 'completed';
    payment.razorpayPaymentId = razorpay_payment_id;
    payment.razorpaySignature = razorpay_signature;
    payment.transactionId = razorpay_payment_id;
    payment.paidDate = new Date();
    payment.notes = `Payment completed via Razorpay - Payment ID: ${razorpay_payment_id}`;

    // Generate final receipt number if not exists
    if (!payment.receiptNumber) {
      payment.receiptNumber = generateReceiptNumber();
    }

    await payment.save();

    // Create success notification
    const notification = new Notification({
      student: payment.student._id,
      type: 'payment_update',
      title: 'Payment Successful',
      message: `Your payment of ₹${payment.amount} for ${payment.paymentType} has been completed successfully via Razorpay.`,
      paymentId: payment._id,
      amount: payment.amount,
      paymentType: payment.paymentType,
      receiptNumber: payment.receiptNumber
    });

    await notification.save();

    // Log successful payment
    console.log(`✅ Payment verified successfully: ${razorpay_payment_id} for student: ${payment.student.regdNo}`);

    res.json({
      success: true,
      message: 'Payment verified and completed successfully',
      payment: {
        id: payment._id,
        status: payment.status,
        receiptNumber: payment.receiptNumber,
        transactionId: payment.transactionId,
        amount: payment.amount,
        paymentType: payment.paymentType,
        paidDate: payment.paidDate,
        razorpayPaymentId: payment.razorpayPaymentId,
        razorpayOrderId: payment.razorpayOrderId
      },
      student: {
        name: `${payment.student.firstName} ${payment.student.lastName}`,
        regdNo: payment.student.regdNo,
        email: payment.student.email
      }
    });

  } catch (error) {
    console.error('❌ Error verifying payment:', error);
    res.status(500).json({
      success: false,
      message: 'Payment verification failed',
      error: error.message
    });
  }
});

/**
 * @route GET /api/payments/razorpay/order/:orderId
 * @desc Get Razorpay order details
 * @access Private
 */
router.get('/order/:orderId', auth, async (req, res) => {
  try {
    const { orderId } = req.params;

    // Fetch order from Razorpay
    const razorpayOrder = await razorpay.orders.fetch(orderId);
    
    // Find corresponding payment in our database
    const payment = await Payment.findOne({ 
      razorpayOrderId: orderId 
    }).populate('student', 'firstName lastName regdNo email');

    res.json({
      success: true,
      razorpay_order: razorpayOrder,
      local_payment: payment
    });

  } catch (error) {
    console.error('❌ Error fetching order:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch order details',
      error: error.message
    });
  }
});

/**
 * @route POST /api/payments/razorpay/webhook
 * @desc Handle Razorpay webhooks
 * @access Public (but verified)
 */
router.post('/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  try {
    const signature = req.get('X-Razorpay-Signature');
    const body = req.body;

    // Verify webhook signature
    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_WEBHOOK_SECRET)
      .update(body)
      .digest('hex');

    if (signature !== expectedSignature) {
      return res.status(400).json({ error: 'Invalid signature' });
    }

    const event = JSON.parse(body);
    
    // Handle different webhook events
    switch (event.event) {
      case 'payment.captured':
        await handlePaymentCaptured(event.payload.payment.entity);
        break;
      case 'payment.failed':
        await handlePaymentFailed(event.payload.payment.entity);
        break;
      default:
        console.log(`Unhandled webhook event: ${event.event}`);
    }

    res.json({ status: 'ok' });

  } catch (error) {
    console.error('❌ Webhook error:', error);
    res.status(500).json({ error: 'Webhook processing failed' });
  }
});

// Helper function to handle payment captured webhook
async function handlePaymentCaptured(paymentData) {
  try {
    const payment = await Payment.findOne({ 
      razorpayOrderId: paymentData.order_id 
    });
    
    if (payment && payment.status === 'pending') {
      payment.status = 'completed';
      payment.razorpayPaymentId = paymentData.id;
      payment.paidDate = new Date();
      await payment.save();
      
      console.log(`✅ Webhook: Payment captured for order ${paymentData.order_id}`);
    }
  } catch (error) {
    console.error('❌ Error handling payment captured webhook:', error);
  }
}

// Helper function to handle payment failed webhook
async function handlePaymentFailed(paymentData) {
  try {
    const payment = await Payment.findOne({ 
      razorpayOrderId: paymentData.order_id 
    });
    
    if (payment && payment.status === 'pending') {
      payment.status = 'failed';
      payment.notes = `Payment failed: ${paymentData.error_description || 'Unknown error'}`;
      await payment.save();
      
      console.log(`❌ Webhook: Payment failed for order ${paymentData.order_id}`);
    }
  } catch (error) {
    console.error('❌ Error handling payment failed webhook:', error);
  }
}

module.exports = router;
