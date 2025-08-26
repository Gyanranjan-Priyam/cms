const express = require('express');
const Payment = require('../models/Payment');
const Student = require('../models/Student');
const User = require('../models/User');
const Notification = require('../models/Notification');
const { auth } = require('../middleware/auth');

const router = express.Router();

// Finance Department middleware - ensures only admin or finance_officer can access
const financeAuth = async (req, res, next) => {
  try {
    if (!['admin', 'finance_officer'].includes(req.user.role)) {
      return res.status(403).json({ 
        success: false, 
        message: 'Access denied. Finance department privileges required.' 
      });
    }
    next();
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// ===================
// FINANCE DASHBOARD ENDPOINTS
// ===================

// Get all students for finance management
router.get('/students', auth, financeAuth, async (req, res) => {
  try {
    const students = await Student.find({ isActive: true })
      .populate('branch', 'name code')
      .populate('department', 'name code')
      .sort({ firstName: 1, lastName: 1 })
      .select('firstName lastName regdNo email phone branch department semester academicYear status');

    res.json({
      success: true,
      students
    });
  } catch (error) {
    console.error('Error fetching students:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch students'
    });
  }
});

// Get all transactions with student details
router.get('/transactions', auth, financeAuth, async (req, res) => {
  try {
    const transactions = await Payment.find({ student: { $ne: null } })
      .populate({
        path: 'student',
        select: 'firstName lastName regdNo email phone',
        populate: [
          { path: 'branch', select: 'name code' },
          { path: 'department', select: 'name code' }
        ]
      })
      .sort({ submittedDate: -1 })
      .lean();

    // Filter out any transactions where student population failed
    const validTransactions = transactions.filter(transaction => 
      transaction.student && transaction.student._id
    );

    res.json({
      success: true,
      transactions: validTransactions
    });
  } catch (error) {
    console.error('Error fetching transactions:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch transactions'
    });
  }
});

// Get payment statistics for dashboard
router.get('/stats', auth, financeAuth, async (req, res) => {
  try {
    const currentDate = new Date();
    const currentMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
    const previousMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1);
    const currentMonthEnd = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);

    // Get total revenue (completed payments)
    const totalRevenueResult = await Payment.aggregate([
      { $match: { status: 'completed' } },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);
    const totalRevenue = totalRevenueResult[0]?.total || 0;

    // Get total transactions count
    const totalTransactions = await Payment.countDocuments();

    // Get completed transactions count
    const completedTransactions = await Payment.countDocuments({ status: 'completed' });

    // Get pending amount
    const pendingAmountResult = await Payment.aggregate([
      { $match: { status: 'pending' } },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);
    const pendingAmount = pendingAmountResult[0]?.total || 0;

    // Get current month revenue
    const currentMonthRevenueResult = await Payment.aggregate([
      {
        $match: {
          status: 'completed',
          paidDate: { $gte: currentMonth, $lte: currentMonthEnd }
        }
      },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);
    const monthlyRevenue = currentMonthRevenueResult[0]?.total || 0;

    // Get previous month revenue for growth calculation
    const previousMonthRevenueResult = await Payment.aggregate([
      {
        $match: {
          status: 'completed',
          paidDate: { $gte: previousMonth, $lt: currentMonth }
        }
      },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);
    const previousMonthRevenue = previousMonthRevenueResult[0]?.total || 0;

    // Calculate revenue growth percentage
    const revenueGrowth = previousMonthRevenue > 0 
      ? ((monthlyRevenue - previousMonthRevenue) / previousMonthRevenue * 100).toFixed(1)
      : 0;

    const stats = {
      totalRevenue,
      totalTransactions,
      pendingAmount,
      completedTransactions,
      monthlyRevenue,
      revenueGrowth: parseFloat(revenueGrowth)
    };

    res.json({
      success: true,
      stats
    });
  } catch (error) {
    console.error('Error fetching stats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch statistics'
    });
  }
});

// Add new payment for individual student, branch, or all students
router.post('/add-payment', auth, financeAuth, async (req, res) => {
  try {
    const { targetType, studentId, branchId, amount, paymentType, dueDate, description } = req.body;

    // Validate required fields
    if (!targetType || !amount || !paymentType) {
      return res.status(400).json({
        success: false,
        message: 'Target type, amount, and payment type are required'
      });
    }

    const validatedAmount = parseFloat(amount);
    if (isNaN(validatedAmount) || validatedAmount <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Invalid amount'
      });
    }

    let targetStudents = [];

    // Get target students based on type
    switch (targetType) {
      case 'individual':
        if (!studentId) {
          return res.status(400).json({
            success: false,
            message: 'Student ID is required for individual payments'
          });
        }
        const student = await Student.findById(studentId);
        if (!student) {
          return res.status(404).json({
            success: false,
            message: 'Student not found'
          });
        }
        targetStudents = [student];
        break;

      case 'branch':
        if (!branchId) {
          return res.status(400).json({
            success: false,
            message: 'Branch ID is required for branch payments'
          });
        }
        targetStudents = await Student.find({ 'branch': branchId, status: 'active' });
        break;

      case 'all':
        targetStudents = await Student.find({ status: 'active' });
        break;

      default:
        return res.status(400).json({
          success: false,
          message: 'Invalid target type'
        });
    }

    if (targetStudents.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'No active students found for the specified target'
      });
    }

    // Create payments for all target students
    const payments = [];
    const notifications = [];

    for (const student of targetStudents) {
      // Generate unique receipt number
      const receiptNumber = `RCPT_${Date.now()}_${Math.floor(Math.random() * 1000)}`;

      const payment = new Payment({
        student: student._id,
        amount: validatedAmount,
        paymentType,
        paymentMethod: 'online',
        status: 'pending',
        receiptNumber,
        submittedDate: new Date(),
        dueDate: dueDate ? new Date(dueDate) : undefined,
        notes: description || `${paymentType} payment added by finance department`
      });

      payments.push(payment);

      // Create notification for student
      const notification = new Notification({
        student: student._id,
        type: 'payment_update',
        title: 'New Payment Due',
        message: `A new payment of ₹${validatedAmount} for ${paymentType} has been added to your account.${dueDate ? ` Due date: ${new Date(dueDate).toLocaleDateString()}` : ''}`,
        paymentId: payment._id,
        amount: validatedAmount,
        paymentType,
        dueDate: dueDate ? new Date(dueDate) : undefined
      });

      notifications.push(notification);
    }

    // Save all payments and notifications
    await Payment.insertMany(payments);
    await Notification.insertMany(notifications);

    res.json({
      success: true,
      message: `Successfully added payments for ${targetStudents.length} student(s)`,
      paymentsCreated: payments.length
    });

  } catch (error) {
    console.error('Error adding payment:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to add payment'
    });
  }
});

// Update payment status
router.put('/update-status/:transactionId', auth, financeAuth, async (req, res) => {
  try {
    const { transactionId } = req.params;
    const { status } = req.body;

    if (!['pending', 'completed', 'failed', 'cancelled'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status'
      });
    }

    const payment = await Payment.findById(transactionId).populate('student');
    if (!payment) {
      return res.status(404).json({
        success: false,
        message: 'Payment not found'
      });
    }

    const oldStatus = payment.status;
    payment.status = status;

    // Update paid date if status is completed
    if (status === 'completed' && oldStatus !== 'completed') {
      payment.paidDate = new Date();
      if (!payment.transactionId) {
        payment.transactionId = `TXN_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
      }
    }

    await payment.save();

    // Create notification for status change
    let notificationMessage = '';
    let notificationType = 'payment_update';

    switch (status) {
      case 'completed':
        notificationMessage = `Your payment of ₹${payment.amount} for ${payment.paymentType} has been marked as completed.`;
        break;
      case 'failed':
        notificationMessage = `Your payment of ₹${payment.amount} for ${payment.paymentType} has failed. Please contact the finance department.`;
        break;
      case 'cancelled':
        notificationMessage = `Your payment of ₹${payment.amount} for ${payment.paymentType} has been cancelled.`;
        break;
      default:
        notificationMessage = `Your payment status for ${payment.paymentType} has been updated to ${status}.`;
    }

    const notification = new Notification({
      student: payment.student._id,
      type: notificationType,
      title: 'Payment Status Updated',
      message: notificationMessage,
      paymentId: payment._id,
      amount: payment.amount,
      paymentType: payment.paymentType
    });

    await notification.save();

    res.json({
      success: true,
      message: 'Payment status updated successfully',
      payment: {
        id: payment._id,
        status: payment.status,
        paidDate: payment.paidDate,
        transactionId: payment.transactionId
      }
    });

  } catch (error) {
    console.error('Error updating payment status:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update payment status'
    });
  }
});

// Delete transaction permanently
router.delete('/delete-transaction/:transactionId', auth, financeAuth, async (req, res) => {
  try {
    const { transactionId } = req.params;

    const payment = await Payment.findById(transactionId).populate('student');
    if (!payment) {
      return res.status(404).json({
        success: false,
        message: 'Transaction not found'
      });
    }

    // Store payment details for notification before deletion
    const studentId = payment.student._id;
    const amount = payment.amount;
    const paymentType = payment.paymentType;

    // Delete the payment
    await Payment.findByIdAndDelete(transactionId);

    // Delete related notifications
    await Notification.deleteMany({ paymentId: transactionId });

    // Create notification about deletion
    const notification = new Notification({
      student: studentId,
      type: 'payment_update',
      title: 'Payment Record Deleted',
      message: `A payment record for ₹${amount} (${paymentType}) has been removed by the finance department.`,
      amount,
      paymentType
    });

    await notification.save();

    res.json({
      success: true,
      message: 'Transaction deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting transaction:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete transaction',
      error: error.message
    });
  }
});

// Get all payments with pagination and filters
router.get('/payments', auth, financeAuth, async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      status,
      paymentType,
      academicYear,
      semester,
      search,
      dateFrom,
      dateTo,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    const query = {};

    // Filter by status
    if (status && status !== 'all') {
      query.status = status;
    }

    // Filter by payment type
    if (paymentType && paymentType !== 'all') {
      query.paymentType = paymentType;
    }

    // Filter by academic year
    if (academicYear) query.academicYear = academicYear;

    // Filter by semester
    if (semester) query.semester = parseInt(semester);

    // Date range filter
    if (dateFrom || dateTo) {
      query.createdAt = {};
      if (dateFrom) query.createdAt.$gte = new Date(dateFrom);
      if (dateTo) query.createdAt.$lte = new Date(dateTo);
    }

    // Search functionality
    if (search) {
      const searchRegex = new RegExp(search, 'i');
      // First, find students that match the search
      const matchingStudents = await Student.find({
        $or: [
          { regdNo: searchRegex },
          { firstName: searchRegex },
          { lastName: searchRegex }
        ]
      }).select('_id');

      const studentIds = matchingStudents.map(s => s._id);
      
      query.$or = [
        { paymentId: searchRegex },
        { orderId: searchRegex },
        { studentId: { $in: studentIds } }
      ];
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const sort = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

    const [payments, totalCount] = await Promise.all([
      Payment.find(query)
        .populate('studentId', 'regdNo firstName lastName semester')
        .sort(sort)
        .skip(skip)
        .limit(parseInt(limit)),
      Payment.countDocuments(query)
    ]);

    const totalPages = Math.ceil(totalCount / parseInt(limit));

    res.json({
      success: true,
      data: {
        payments,
        pagination: {
          currentPage: parseInt(page),
          totalPages,
          totalCount,
          hasNext: parseInt(page) < totalPages,
          hasPrev: parseInt(page) > 1
        }
      }
    });
  } catch (error) {
    console.error('Error fetching payments:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Get payment statistics
router.get('/payments/stats', auth, financeAuth, async (req, res) => {
  try {
    const { academicYear, semester } = req.query;
    
    const matchQuery = {};
    if (academicYear) matchQuery.academicYear = academicYear;
    if (semester) matchQuery.semester = parseInt(semester);

    const [
      totalPayments,
      statusStats,
      typeStats,
      monthlyStats,
      revenueStats
    ] = await Promise.all([
      Payment.countDocuments(matchQuery),
      
      Payment.aggregate([
        { $match: matchQuery },
        {
          $group: {
            _id: '$status',
            count: { $sum: 1 },
            totalAmount: { $sum: '$amount' }
          }
        }
      ]),
      
      Payment.aggregate([
        { $match: matchQuery },
        {
          $group: {
            _id: '$paymentType',
            count: { $sum: 1 },
            totalAmount: { $sum: '$amount' }
          }
        }
      ]),
      
      Payment.aggregate([
        { $match: matchQuery },
        {
          $group: {
            _id: {
              year: { $year: '$createdAt' },
              month: { $month: '$createdAt' }
            },
            count: { $sum: 1 },
            totalAmount: { $sum: '$amount' }
          }
        },
        { $sort: { '_id.year': 1, '_id.month': 1 } },
        { $limit: 12 }
      ]),
      
      Payment.aggregate([
        { $match: { ...matchQuery, status: 'completed' } },
        {
          $group: {
            _id: null,
            totalRevenue: { $sum: '$amount' },
            averagePayment: { $avg: '$amount' },
            maxPayment: { $max: '$amount' },
            minPayment: { $min: '$amount' }
          }
        }
      ])
    ]);

    res.json({
      success: true,
      data: {
        overview: {
          totalPayments,
          totalRevenue: revenueStats[0]?.totalRevenue || 0,
          averagePayment: revenueStats[0]?.averagePayment || 0
        },
        statusBreakdown: statusStats,
        typeBreakdown: typeStats,
        monthlyTrend: monthlyStats,
        revenueStats: revenueStats[0] || {}
      }
    });
  } catch (error) {
    console.error('Error fetching payment statistics:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Get single payment details
router.get('/payments/:id', auth, financeAuth, async (req, res) => {
  try {
    const payment = await Payment.findById(req.params.id)
      .populate('studentId', 'regdNo firstName lastName semester email phone');

    if (!payment) {
      return res.status(404).json({
        success: false,
        message: 'Payment not found'
      });
    }

    res.json({
      success: true,
      data: payment
    });
  } catch (error) {
    console.error('Error fetching payment:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Create manual payment entry
router.post('/payments', auth, financeAuth, async (req, res) => {
  try {
    const {
      studentId,
      amount,
      paymentType,
      description,
      academicYear,
      semester,
      dueDate,
      paymentMethod = 'manual'
    } = req.body;

    // Validate required fields
    if (!studentId || !amount || !paymentType) {
      return res.status(400).json({
        success: false,
        message: 'Student ID, amount, and payment type are required'
      });
    }

    // Validate student exists
    const student = await Student.findById(studentId);
    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student not found'
      });
    }

    // Generate unique payment ID
    const paymentId = `PAY${Date.now()}${Math.random().toString(36).substr(2, 4).toUpperCase()}`;

    const payment = new Payment({
      paymentId,
      studentId,
      amount: parseFloat(amount),
      paymentType,
      description: description?.trim(),
      academicYear: academicYear || new Date().getFullYear().toString(),
      semester: semester || student.semester,
      dueDate: dueDate ? new Date(dueDate) : undefined,
      paymentMethod,
      status: 'completed', // Manual entries are completed by default
      completedAt: new Date(),
      createdBy: req.user.id
    });

    await payment.save();

    const populatedPayment = await Payment.findById(payment._id)
      .populate('studentId', 'regdNo firstName lastName');

    // Notify student (via socket if implemented)
    if (req.io) {
      req.io.emit('payment_added', {
        studentId,
        payment: populatedPayment
      });
    }

    res.status(201).json({
      success: true,
      message: 'Payment added successfully',
      data: populatedPayment
    });
  } catch (error) {
    console.error('Error creating payment:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Add payment for student (by finance department)
router.post('/addPayment', auth, financeAuth, async (req, res) => {
  try {
    const {
      rollNo,
      amount,
      paymentType = 'tuition',
      dueDate,
      description,
      academicYear,
      semester
    } = req.body;

    // Validate required fields
    if (!rollNo || !amount) {
      return res.status(400).json({
        success: false,
        message: 'Roll number and amount are required'
      });
    }

    // Find student by roll number
    const student = await Student.findOne({ 
      regdNo: rollNo, 
      isActive: true 
    });
    
    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student not found'
      });
    }

    // Generate unique payment record
    const payment = new Payment({
      student: student._id,
      amount: parseFloat(amount),
      paymentType,
      paymentMethod: 'online',
      status: 'pending',
      semester: semester || student.semester,
      academicYear: academicYear || new Date().getFullYear().toString(),
      dueDate: dueDate ? new Date(dueDate) : undefined,
      description: description || `${paymentType} fee for ${student.firstName} ${student.lastName}`,
      transactionId: `PENDING_${Date.now()}_${student._id}`,
      receiptNumber: `RCP${Date.now()}${Math.floor(Math.random() * 1000)}`
    });

    await payment.save();

    const populatedPayment = await Payment.findById(payment._id)
      .populate('student', 'regdNo firstName lastName semester branch');

    res.status(201).json({
      success: true,
      message: 'Payment record created successfully',
      data: populatedPayment
    });
  } catch (error) {
    console.error('Error adding payment:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error',
      error: error.message 
    });
  }
});

// Update payment
router.put('/payments/:id', auth, financeAuth, async (req, res) => {
  try {
    const paymentId = req.params.id;
    const updateData = req.body;

    const payment = await Payment.findById(paymentId);
    if (!payment) {
      return res.status(404).json({
        success: false,
        message: 'Payment not found'
      });
    }

    // Prevent updating completed payments unless it's status change
    if (payment.status === 'completed' && updateData.status !== 'refunded') {
      return res.status(400).json({
        success: false,
        message: 'Cannot modify completed payments except for refunds'
      });
    }

    // Update allowed fields
    const allowedFields = [
      'amount', 'paymentType', 'description', 'dueDate', 'status'
    ];

    allowedFields.forEach(field => {
      if (updateData[field] !== undefined) {
        if (field === 'dueDate') {
          payment[field] = updateData[field] ? new Date(updateData[field]) : undefined;
        } else {
          payment[field] = updateData[field];
        }
      }
    });

    // Update completion time if status changed to completed
    if (updateData.status === 'completed' && payment.status !== 'completed') {
      payment.completedAt = new Date();
    }

    payment.updatedBy = req.user.id;
    await payment.save();

    const updatedPayment = await Payment.findById(paymentId)
      .populate('studentId', 'regdNo firstName lastName');

    res.json({
      success: true,
      message: 'Payment updated successfully',
      data: updatedPayment
    });
  } catch (error) {
    console.error('Error updating payment:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Delete payment (soft delete for completed, hard delete for pending)
router.delete('/payments/:id', auth, financeAuth, async (req, res) => {
  try {
    const paymentId = req.params.id;

    const payment = await Payment.findById(paymentId);
    if (!payment) {
      return res.status(404).json({
        success: false,
        message: 'Payment not found'
      });
    }

    if (payment.status === 'completed') {
      // Soft delete for completed payments (for audit trail)
      payment.status = 'cancelled';
      payment.updatedBy = req.user.id;
      await payment.save();
    } else {
      // Hard delete for pending payments
      await Payment.findByIdAndDelete(paymentId);
    }

    res.json({
      success: true,
      message: 'Payment deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting payment:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// ===================
// FINANCIAL REPORTS
// ===================

// Generate financial report
router.get('/reports/financial', auth, financeAuth, async (req, res) => {
  try {
    const {
      academicYear,
      semester,
      paymentType,
      dateFrom,
      dateTo,
      format = 'json'
    } = req.query;

    const matchQuery = { status: 'completed' };
    
    if (academicYear) matchQuery.academicYear = academicYear;
    if (semester) matchQuery.semester = parseInt(semester);
    if (paymentType) matchQuery.paymentType = paymentType;

    if (dateFrom || dateTo) {
      matchQuery.completedAt = {};
      if (dateFrom) matchQuery.completedAt.$gte = new Date(dateFrom);
      if (dateTo) matchQuery.completedAt.$lte = new Date(dateTo);
    }

    const reportData = await Payment.aggregate([
      { $match: matchQuery },
      {
        $lookup: {
          from: 'students',
          localField: 'studentId',
          foreignField: '_id',
          as: 'student'
        }
      },
      { $unwind: '$student' },
      {
        $group: {
          _id: {
            paymentType: '$paymentType',
            semester: '$semester'
          },
          totalAmount: { $sum: '$amount' },
          count: { $sum: 1 },
          payments: {
            $push: {
              paymentId: '$paymentId',
              studentRegNo: '$student.regdNo',
              studentName: { $concat: ['$student.firstName', ' ', '$student.lastName'] },
              amount: '$amount',
              completedAt: '$completedAt'
            }
          }
        }
      },
      {
        $group: {
          _id: '$_id.paymentType',
          totalRevenue: { $sum: '$totalAmount' },
          totalTransactions: { $sum: '$count' },
          semesterBreakdown: {
            $push: {
              semester: '$_id.semester',
              amount: '$totalAmount',
              count: '$count',
              payments: '$payments'
            }
          }
        }
      }
    ]);

    const summary = await Payment.aggregate([
      { $match: matchQuery },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: '$amount' },
          totalTransactions: { $sum: 1 },
          averageTransaction: { $avg: '$amount' }
        }
      }
    ]);

    const report = {
      summary: summary[0] || {
        totalRevenue: 0,
        totalTransactions: 0,
        averageTransaction: 0
      },
      breakdown: reportData,
      generated: new Date(),
      filters: {
        academicYear,
        semester,
        paymentType,
        dateFrom,
        dateTo
      }
    };

    if (format === 'csv') {
      // Convert to CSV format
      const csv = convertToCSV(report);
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename=financial-report.csv');
      return res.send(csv);
    }

    res.json({
      success: true,
      data: report
    });
  } catch (error) {
    console.error('Error generating financial report:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Get outstanding payments
router.get('/outstanding', auth, financeAuth, async (req, res) => {
  try {
    const { semester, academicYear } = req.query;
    
    const matchQuery = { status: 'pending' };
    if (semester) matchQuery.semester = parseInt(semester);
    if (academicYear) matchQuery.academicYear = academicYear;

    // Add overdue condition
    const now = new Date();
    matchQuery.dueDate = { $lt: now };

    const outstandingPayments = await Payment.find(matchQuery)
      .populate('studentId', 'regdNo firstName lastName semester email phone')
      .sort({ dueDate: 1 });

    const summary = await Payment.aggregate([
      { $match: matchQuery },
      {
        $group: {
          _id: null,
          totalOutstanding: { $sum: '$amount' },
          count: { $sum: 1 }
        }
      }
    ]);

    res.json({
      success: true,
      data: {
        payments: outstandingPayments,
        summary: summary[0] || { totalOutstanding: 0, count: 0 }
      }
    });
  } catch (error) {
    console.error('Error fetching outstanding payments:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Helper function to convert report to CSV
function convertToCSV(report) {
  let csv = 'Payment Type,Semester,Student Reg No,Student Name,Amount,Completed Date\n';
  
  report.breakdown.forEach(type => {
    type.semesterBreakdown.forEach(sem => {
      sem.payments.forEach(payment => {
        csv += `${type._id},${sem.semester},${payment.studentRegNo},"${payment.studentName}",${payment.amount},${payment.completedAt}\n`;
      });
    });
  });
  
  return csv;
}

// Get payments by roll number
router.get('/getPayments/:rollNo', auth, financeAuth, async (req, res) => {
  try {
    const { rollNo } = req.params;
    
    // Find student by roll number
    const student = await Student.findOne({ 
      regdNo: rollNo, 
      isActive: true 
    });
    
    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student not found'
      });
    }
    
    // Get all payments for this student
    const payments = await Payment.find({ 
      student: student._id 
    })
      .populate('student', 'regdNo firstName lastName semester branch')
      .sort({ createdAt: -1 });
    
    res.json({
      success: true,
      data: {
        student: {
          _id: student._id,
          name: `${student.firstName} ${student.lastName}`,
          rollNo: student.regdNo,
          department: student.branch?.name || 'N/A',
          semester: student.semester
        },
        payments,
        totalPayments: payments.length,
        pendingPayments: payments.filter(p => p.status === 'pending').length,
        completedPayments: payments.filter(p => p.status === 'completed').length,
        totalAmount: payments.reduce((sum, p) => sum + p.amount, 0),
        paidAmount: payments.filter(p => p.status === 'completed').reduce((sum, p) => sum + p.amount, 0)
      }
    });
  } catch (error) {
    console.error('Error fetching payments by roll number:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error' 
    });
  }
});

module.exports = router;
