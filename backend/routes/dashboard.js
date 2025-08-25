const express = require('express');
const Student = require('../models/Student');
const Payment = require('../models/Payment');
const Branch = require('../models/Branch');
const User = require('../models/User');
const Faculty = require('../models/Faculty');
const { auth, authorize } = require('../middleware/auth');

const router = express.Router();

// Head Admin Dashboard
router.get('/head-admin', auth, authorize(['head_admin', 'admin']), async (req, res) => {
  try {
    // Basic counts
    const totalStudents = await Student.countDocuments({ isActive: true });
    const totalBranches = await Branch.countDocuments({ isActive: true });
    const totalUsers = await User.countDocuments();
    
    // Revenue statistics
    const totalRevenue = await Payment.aggregate([
      { $match: { status: 'completed' } },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);

    // Branch-wise student distribution
    const branchStats = await Student.aggregate([
      { $match: { isActive: true } },
      {
        $group: {
          _id: '$branch',
          count: { $sum: 1 }
        }
      },
      {
        $lookup: {
          from: 'branches',
          localField: '_id',
          foreignField: '_id',
          as: 'branchInfo'
        }
      },
      {
        $unwind: '$branchInfo'
      },
      {
        $project: {
          branchName: '$branchInfo.name',
          branchCode: '$branchInfo.code',
          count: 1
        }
      }
    ]);

    // Semester-wise distribution
    const semesterStats = await Student.aggregate([
      { $match: { isActive: true } },
      {
        $group: {
          _id: '$semester',
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    // Revenue by payment type
    const revenueByType = await Payment.aggregate([
      { $match: { status: 'completed' } },
      {
        $group: {
          _id: '$paymentType',
          total: { $sum: '$amount' },
          count: { $sum: 1 }
        }
      }
    ]);

    // Monthly revenue for current year
    const currentYear = new Date().getFullYear();
    const monthlyRevenue = await Payment.aggregate([
      { 
        $match: { 
          status: 'completed',
          paymentDate: {
            $gte: new Date(`${currentYear}-01-01`),
            $lte: new Date(`${currentYear}-12-31`)
          }
        } 
      },
      {
        $group: {
          _id: { $month: '$paymentDate' },
          total: { $sum: '$amount' },
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    // Recent activities (last 10 students added)
    const recentStudents = await Student.find({ isActive: true })
      .populate('branch', 'name code')
      .sort({ createdAt: -1 })
      .limit(10)
      .select('regdNo firstName lastName branch semester createdAt');

    // Recent payments (last 10)
    const recentPayments = await Payment.find({ status: 'completed' })
      .populate('student', 'regdNo firstName lastName')
      .sort({ paymentDate: -1 })
      .limit(10)
      .select('amount paymentType paymentDate student');

    res.json({
      success: true,
      dashboard: {
        overview: {
          totalStudents,
          totalBranches,
          totalUsers,
          totalRevenue: totalRevenue[0]?.total || 0
        },
        branchStats,
        semesterStats,
        revenueByType,
        monthlyRevenue,
        recentActivities: {
          students: recentStudents,
          payments: recentPayments
        }
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Student Management Dashboard
router.get('/student-management', auth, authorize(['student_management', 'head_admin', 'admin']), async (req, res) => {
  try {
    const totalStudents = await Student.countDocuments({ isActive: true });
    
    // Branch-wise distribution
    const branchDistribution = await Student.aggregate([
      { $match: { isActive: true } },
      {
        $group: {
          _id: '$branch',
          count: { $sum: 1 }
        }
      },
      {
        $lookup: {
          from: 'branches',
          localField: '_id',
          foreignField: '_id',
          as: 'branchInfo'
        }
      },
      {
        $unwind: '$branchInfo'
      },
      {
        $project: {
          branchName: '$branchInfo.name',
          branchCode: '$branchInfo.code',
          count: 1
        }
      }
    ]);

    // Semester-wise distribution
    const semesterDistribution = await Student.aggregate([
      { $match: { isActive: true } },
      {
        $group: {
          _id: '$semester',
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    // Gender distribution
    const genderDistribution = await Student.aggregate([
      { $match: { isActive: true } },
      {
        $group: {
          _id: '$gender',
          count: { $sum: 1 }
        }
      }
    ]);

    // Category distribution
    const categoryDistribution = await Student.aggregate([
      { $match: { isActive: true } },
      {
        $group: {
          _id: '$category',
          count: { $sum: 1 }
        }
      }
    ]);

    // Recent admissions (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const recentAdmissions = await Student.countDocuments({
      isActive: true,
      createdAt: { $gte: thirtyDaysAgo }
    });

    // Students by admission year
    const admissionYearStats = await Student.aggregate([
      { $match: { isActive: true } },
      {
        $group: {
          _id: { $year: '$admissionDate' },
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: -1 } }
    ]);

    res.json({
      success: true,
      dashboard: {
        overview: {
          totalStudents,
          recentAdmissions
        },
        distributions: {
          branch: branchDistribution,
          semester: semesterDistribution,
          gender: genderDistribution,
          category: categoryDistribution,
          admissionYear: admissionYearStats
        }
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Finance Dashboard
router.get('/finance', auth, authorize(['finance_department', 'head_admin', 'admin']), async (req, res) => {
  try {
    // Total collections
    const totalCollections = await Payment.aggregate([
      { $match: { status: 'completed' } },
      {
        $group: {
          _id: '$paymentType',
          total: { $sum: '$amount' },
          count: { $sum: 1 }
        }
      }
    ]);

    // Pending payments
    const pendingPayments = await Payment.aggregate([
      { $match: { status: 'pending' } },
      {
        $group: {
          _id: '$paymentType',
          total: { $sum: '$amount' },
          count: { $sum: 1 }
        }
      }
    ]);

    // Monthly collection for current year
    const currentYear = new Date().getFullYear();
    const monthlyCollections = await Payment.aggregate([
      { 
        $match: {
          status: 'completed',
          paymentDate: {
            $gte: new Date(`${currentYear}-01-01`),
            $lte: new Date(`${currentYear}-12-31`)
          }
        }
      },
      {
        $group: {
          _id: {
            month: { $month: '$paymentDate' },
            paymentType: '$paymentType'
          },
          total: { $sum: '$amount' },
          count: { $sum: 1 }
        }
      },
      { $sort: { '_id.month': 1 } }
    ]);

    // Branch-wise collections
    const branchCollections = await Payment.aggregate([
      { $match: { status: 'completed' } },
      {
        $lookup: {
          from: 'students',
          localField: 'student',
          foreignField: '_id',
          as: 'studentInfo'
        }
      },
      { $unwind: '$studentInfo' },
      {
        $lookup: {
          from: 'branches',
          localField: 'studentInfo.branch',
          foreignField: '_id',
          as: 'branchInfo'
        }
      },
      { $unwind: '$branchInfo' },
      {
        $group: {
          _id: {
            branchId: '$branchInfo._id',
            branchName: '$branchInfo.name',
            paymentType: '$paymentType'
          },
          total: { $sum: '$amount' },
          count: { $sum: 1 }
        }
      }
    ]);

    // Recent transactions
    const recentTransactions = await Payment.find({ status: 'completed' })
      .populate('student', 'regdNo firstName lastName branch')
      .populate('student.branch', 'name code')
      .sort({ paymentDate: -1 })
      .limit(15)
      .select('amount paymentType paymentDate student transactionId');

    // Payment method distribution
    const paymentMethodStats = await Payment.aggregate([
      { $match: { status: 'completed' } },
      {
        $group: {
          _id: '$paymentMethod',
          total: { $sum: '$amount' },
          count: { $sum: 1 }
        }
      }
    ]);

    // Calculate totals
    const totalRevenue = totalCollections.reduce((sum, item) => sum + item.total, 0);
    const totalPending = pendingPayments.reduce((sum, item) => sum + item.total, 0);
    const totalTransactions = totalCollections.reduce((sum, item) => sum + item.count, 0);

    res.json({
      success: true,
      dashboard: {
        overview: {
          totalRevenue,
          totalPending,
          totalTransactions
        },
        collections: {
          byType: totalCollections,
          pending: pendingPayments,
          monthly: monthlyCollections,
          byBranch: branchCollections,
          byPaymentMethod: paymentMethodStats
        },
        recentTransactions
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Student Dashboard (for logged-in students)
router.get('/student', auth, async (req, res) => {
  try {
    console.log('Student dashboard route - User:', { 
      id: req.user._id, 
      role: req.user.role, 
      name: req.user.username || `${req.user.firstName} ${req.user.lastName}` 
    });
    
    // Allow admin users to access student dashboard for testing
    // and also allow actual students
    if (!['student', 'head_admin', 'admin', 'student_management'].includes(req.user.role)) {
      console.log('Student dashboard route - Access denied for role:', req.user.role);
      return res.status(403).json({ message: 'Access denied' });
    }

    let student;
    
    if (req.user.role === 'student') {
      console.log('Student dashboard route - Actual student user accessing');
      // For actual student users, req.user is already the student
      student = req.user;
    } else {
      console.log('Student dashboard route - Admin user accessing, getting sample student');
      // If it's an admin user, get the first student for demo purposes
      student = await Student.findOne({ isActive: true })
        .populate('branch', 'name code academicFees hostelFees otherFees');
    }

    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }

    // Get payment history
    const payments = await Payment.find({ student: student._id })
      .sort({ createdAt: -1 });

    // Calculate payment summary
    const paymentSummary = await Payment.aggregate([
      { $match: { student: student._id } },
      {
        $group: {
          _id: '$paymentType',
          totalPaid: { 
            $sum: { 
              $cond: [{ $eq: ['$status', 'completed'] }, '$amount', 0] 
            } 
          },
          totalPending: { 
            $sum: { 
              $cond: [{ $eq: ['$status', 'pending'] }, '$amount', 0] 
            } 
          }
        }
      }
    ]);

    // Calculate dues
    const totalFees = {
      academic: student.branch.academicFees,
      hostel: student.branch.hostelFees,
      other: student.branch.otherFees
    };

    const paidAmounts = paymentSummary.reduce((acc, item) => {
      acc[item._id] = item.totalPaid;
      return acc;
    }, {});

    const dues = {
      academic: Math.max(0, totalFees.academic - (paidAmounts.academic || 0)),
      hostel: Math.max(0, totalFees.hostel - (paidAmounts.hostel || 0)),
      other: Math.max(0, totalFees.other - (paidAmounts.other || 0))
    };

    res.json({
      success: true,
      dashboard: {
        student: {
          id: student._id,
          regdNo: student.regdNo,
          firstName: student.firstName,
          lastName: student.lastName,
          email: student.email,
          phone: student.phone,
          branch: student.branch,
          semester: student.semester,
          admissionDate: student.admissionDate
        },
        financials: {
          totalFees,
          paidAmounts,
          dues,
          totalDue: Object.values(dues).reduce((sum, amount) => sum + amount, 0)
        },
        payments: payments.slice(0, 10), // Last 10 payments
        paymentSummary
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Admin Dashboard (with faculty management)
router.get('/admin', auth, authorize(['head_admin', 'admin']), async (req, res) => {
  try {
    // Student statistics
    const totalStudents = await Student.countDocuments({ isActive: true });
    const activeStudents = await Student.countDocuments({ isActive: true });

    // Faculty statistics
    const totalFaculty = await Faculty.countDocuments();
    const activeFaculty = await Faculty.countDocuments({ status: 'active' });
    const inactiveFaculty = await Faculty.countDocuments({ status: 'inactive' });
    const onLeaveFaculty = await Faculty.countDocuments({ status: 'on-leave' });
    
    // Faculty by department
    const facultyByDepartment = await Faculty.aggregate([
      {
        $group: {
          _id: '$department',
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } }
    ]);

    // Faculty by designation
    const facultyByDesignation = await Faculty.aggregate([
      {
        $group: {
          _id: '$designation',
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } }
    ]);

    // Recent faculty (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const recentFaculty = await Faculty.countDocuments({
      createdAt: { $gte: thirtyDaysAgo }
    });

    // Payment statistics
    const totalPayments = await Payment.countDocuments();
    const completedPayments = await Payment.countDocuments({ status: 'completed' });
    const pendingPayments = await Payment.countDocuments({ status: 'pending' });

    const dashboard = {
      students: {
        total: totalStudents,
        active: activeStudents
      },
      faculty: {
        total: totalFaculty,
        active: activeFaculty,
        inactive: inactiveFaculty,
        onLeave: onLeaveFaculty,
        recent: recentFaculty,
        departments: facultyByDepartment,
        designations: facultyByDesignation
      },
      payments: {
        total: totalPayments,
        completed: completedPayments,
        pending: pendingPayments
      }
    };

    res.json({
      success: true,
      dashboard
    });
  } catch (error) {
    console.error('Error fetching admin dashboard data:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error',
      error: error.message 
    });
  }
});

// Student payment endpoint
router.post('/payFees', auth, async (req, res) => {
  try {
    // Ensure only students can access this endpoint
    if (req.user.role !== 'student') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Student privileges required.'
      });
    }

    const {
      paymentId,
      amount,
      paymentMethod,
      transactionId,
      paymentGateway = 'custom'
    } = req.body;

    // Validate required fields
    if (!paymentId || !amount || !transactionId) {
      return res.status(400).json({
        success: false,
        message: 'Payment ID, amount, and transaction ID are required'
      });
    }

    // Find the payment record
    const payment = await Payment.findById(paymentId);
    if (!payment) {
      return res.status(404).json({
        success: false,
        message: 'Payment record not found'
      });
    }

    // Verify the payment belongs to the logged-in student
    if (payment.student.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized access to payment record'
      });
    }

    // Check if payment is already completed
    if (payment.status === 'completed') {
      return res.status(400).json({
        success: false,
        message: 'Payment has already been completed'
      });
    }

    // Check if transaction ID already exists
    const existingTransaction = await Payment.findOne({
      transactionId,
      _id: { $ne: paymentId }
    });

    if (existingTransaction) {
      return res.status(400).json({
        success: false,
        message: 'Transaction ID already exists'
      });
    }

    // Update payment with transaction details
    payment.status = 'completed';
    payment.paymentMethod = paymentMethod || 'online';
    payment.transactionId = transactionId;
    payment.completedAt = new Date();
    payment.paymentGateway = paymentGateway;

    await payment.save();

    // Create notification for successful payment
    const notification = new Notification({
      student: req.user.id,
      type: 'payment_success',
      title: 'Payment Successful',
      message: `Your payment of ₹${amount} for ${payment.paymentType} has been completed successfully.`,
      paymentId: payment._id,
      amount: amount,
      paymentType: payment.paymentType
    });

    await notification.save();

    res.json({
      success: true,
      message: 'Payment completed successfully',
      data: {
        paymentId: payment._id,
        receiptNumber: payment.receiptNumber,
        transactionId: payment.transactionId,
        amount: payment.amount,
        status: payment.status,
        completedAt: payment.completedAt
      }
    });

  } catch (error) {
    console.error('Error processing payment:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// Get student dashboard data by roll number
router.get('/:rollNo', auth, async (req, res) => {
  try {
    const { rollNo } = req.params;
    
    // Find student by roll number
    const student = await Student.findOne({ 
      regdNo: rollNo, 
      isActive: true 
    }).populate('branch');
    
    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student not found'
      });
    }
    
    // Get student's payments
    const payments = await Payment.find({ 
      student: student._id 
    }).sort({ createdAt: -1 });
    
    // Get student's notifications
    const notifications = await Notification.find({ 
      student: student._id 
    }).sort({ createdAt: -1 }).limit(10);
    
    // Calculate payment statistics
    const paymentStats = {
      total: payments.length,
      pending: payments.filter(p => p.status === 'pending').length,
      completed: payments.filter(p => p.status === 'completed').length,
      totalAmount: payments.reduce((sum, p) => sum + p.amount, 0),
      paidAmount: payments.filter(p => p.status === 'completed').reduce((sum, p) => sum + p.amount, 0)
    };
    
    res.json({
      success: true,
      data: {
        student: {
          _id: student._id,
          name: `${student.firstName} ${student.lastName}`,
          rollNo: student.regdNo,
          email: student.email,
          phone: student.phone,
          department: student.branch?.name || 'N/A',
          semester: student.semester
        },
        payments,
        notifications,
        paymentStats
      }
    });
    
  } catch (error) {
    console.error('Error fetching student dashboard data:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

module.exports = router;
