const express = require('express');
const Payment = require('../models/Payment');
const Student = require('../models/Student');
const User = require('../models/User');
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
// PAYMENT MANAGEMENT
// ===================

// Get all payments with filtering and pagination
router.get('/payments', auth, financeAuth, async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      search,
      status,
      paymentType,
      academicYear,
      semester,
      dateFrom,
      dateTo,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    const query = {};
    
    // Build query based on filters
    if (status) query.status = status;
    if (paymentType) query.paymentType = paymentType;
    if (academicYear) query.academicYear = academicYear;
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
