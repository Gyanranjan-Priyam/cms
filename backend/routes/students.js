const express = require('express');
const XLSX = require('xlsx');
const Student = require('../models/Student');
const Branch = require('../models/Branch');
const Payment = require('../models/Payment');
const { auth, authorize } = require('../middleware/auth');

const router = express.Router();

// Get all students (Student Management access)
router.get('/', auth, authorize(['student_management', 'finance_department', 'head_admin', 'admin']), async (req, res) => {
  try {
    const { branch, semester, page = 1, limit = 10 } = req.query;
    const filter = { isActive: true };
    
    if (branch) filter.branch = branch;
    if (semester) filter.semester = semester;

    const students = await Student.find(filter)
      .populate('branch')
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort({ createdAt: -1 });

    const total = await Student.countDocuments(filter);

    res.json({
      students,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Check if registration number exists
router.get('/check-regdno/:regdNo', auth, authorize(['student_management', 'head_admin', 'admin']), async (req, res) => {
  try {
    const { regdNo } = req.params;
    
    // Find student with this registration number
    const existingStudent = await Student.findOne({ regdNo: regdNo, isActive: true });
    
    if (existingStudent) {
      return res.json({ 
        exists: true, 
        message: 'Registration number already exists',
        student: {
          firstName: existingStudent.firstName,
          lastName: existingStudent.lastName,
          email: existingStudent.email
        }
      });
    }
    
    return res.status(404).json({ 
      exists: false, 
      message: 'Registration number is available' 
    });
    
  } catch (error) {
    console.error('Error checking registration number:', error);
    res.status(500).json({ message: 'Server error while checking registration number' });
  }
});

// Add new student
router.post('/', auth, authorize(['student_management', 'head_admin', 'admin']), async (req, res) => {
  try {
    const studentData = { ...req.body };
    
    // Check for duplicate registration number
    const existingStudent = await Student.findOne({ regdNo: studentData.regdNo, isActive: true });
    if (existingStudent) {
      return res.status(400).json({ 
        message: `Registration number "${studentData.regdNo}" already exists`,
        error: 'DUPLICATE_REGDNO',
        existingStudent: {
          firstName: existingStudent.firstName,
          lastName: existingStudent.lastName,
          email: existingStudent.email
        }
      });
    }
    
    // Clean up optional enum fields - remove empty strings
    if (studentData.bloodGroup === '') {
      delete studentData.bloodGroup;
    }
    
    const student = new Student(studentData);
    await student.save();
    await student.populate('branch');
    
    // Automatically create pending payments for new student
    const currentYear = new Date().getFullYear();
    const currentSemester = studentData.semester || 1;
    
    // Create academic fees payment
    const academicPayment = new Payment({
      student: student._id,
      amount: 50000, // Default academic fee amount
      paymentType: 'academic',
      paymentMethod: 'online',
      status: 'pending',
      semester: currentSemester,
      academicYear: currentYear.toString(),
      dueDate: new Date(currentYear, 3, 30), // April 30th
      description: `Academic fees for semester ${currentSemester}`,
      transactionId: `AC${Date.now()}${student._id.toString().slice(-4)}`
    });
    
    // Create hostel fees payment if student needs hostel
    let hostelPayment = null;
    if (studentData.needsHostel || studentData.hostelRequired) {
      hostelPayment = new Payment({
        student: student._id,
        amount: 25000, // Default hostel fee amount
        paymentType: 'hostel',
        paymentMethod: 'online',
        status: 'pending',
        semester: currentSemester,
        academicYear: currentYear.toString(),
        dueDate: new Date(currentYear, 4, 15), // May 15th
        description: `Hostel fees for semester ${currentSemester}`,
        transactionId: `HS${Date.now()}${student._id.toString().slice(-4)}`
      });
    }
    
    // Save payments
    await academicPayment.save();
    if (hostelPayment) {
      await hostelPayment.save();
    }
    
    res.status(201).json({
      student,
      paymentsCreated: hostelPayment ? 2 : 1,
      message: 'Student created successfully with pending payments'
    });
  } catch (error) {
    console.error('Error creating student:', error);
    if (error.code === 11000) {
      res.status(400).json({ message: 'Registration number already exists' });
    } else if (error.name === 'ValidationError') {
      res.status(400).json({ message: 'Validation error', details: error.message });
    } else {
      res.status(500).json({ message: 'Server error', error: error.message });
    }
  }
});

// Update student
router.put('/:id', auth, authorize(['student_management', 'head_admin', 'admin']), async (req, res) => {
  try {
    const updateData = { ...req.body };
    
    // Clean up optional enum fields - remove empty strings
    if (updateData.bloodGroup === '') {
      delete updateData.bloodGroup;
    }
    
    const student = await Student.findByIdAndUpdate(
      req.params.id, 
      updateData, 
      { new: true }
    ).populate('branch');
    
    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }
    
    res.json(student);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete student
router.delete('/:id', auth, authorize(['student_management', 'head_admin', 'admin']), async (req, res) => {
  try {
    await Student.findByIdAndUpdate(req.params.id, { isActive: false });
    res.json({ message: 'Student deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Get student profile (for logged-in student)
router.get('/profile', auth, async (req, res) => {
  try {
    if (req.user.type !== 'student') {
      return res.status(403).json({ message: 'Access denied' });
    }
    
    const student = await Student.findById(req.user.id).populate('branch');
    res.json(student);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Get student by roll number (for finance department)
router.get('/rollno/:rollNo', auth, authorize(['finance_department', 'student_management', 'head_admin', 'admin']), async (req, res) => {
  try {
    const { rollNo } = req.params;
    
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
    
    res.json({
      success: true,
      data: {
        _id: student._id,
        name: `${student.firstName} ${student.lastName}`,
        rollNo: student.regdNo,
        department: student.branch?.name || 'N/A',
        semester: student.semester,
        email: student.email,
        phone: student.phone
      }
    });
  } catch (error) {
    console.error('Error fetching student by roll number:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error' 
    });
  }
});

// Get branch-wise student statistics
router.get('/stats/branches', auth, authorize(['student_management', 'finance_department', 'head_admin', 'admin']), async (req, res) => {
  try {
    const stats = await Student.aggregate([
      { $match: { isActive: true } },
      {
        $lookup: {
          from: 'branches',
          localField: 'branch',
          foreignField: '_id',
          as: 'branchInfo'
        }
      },
      {
        $group: {
          _id: '$branch',
          count: { $sum: 1 },
          branchName: { $first: { $arrayElemAt: ['$branchInfo.name', 0] } }
        }
      },
      {
        $project: {
          _id: 1,
          count: 1,
          branchName: { $ifNull: ['$branchName', 'Unknown'] }
        }
      },
      { $sort: { count: -1 } }
    ]);

    res.json(stats);
  } catch (error) {
    console.error('Stats error:', error);
    res.status(500).json({ message: 'Failed to fetch statistics', error: error.message });
  }
});

// Export students to Excel
router.get('/export', auth, authorize(['student_management', 'finance_department', 'head_admin', 'admin']), async (req, res) => {
  try {
    const { branch, semester, search } = req.query;
    const filter = { isActive: true };
    
    if (branch) filter.branch = branch;
    if (semester) filter.semester = semester;
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { registrationNumber: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } }
      ];
    }

    const students = await Student.find(filter)
      .populate('branch')
      .sort({ createdAt: -1 });

    // Prepare data for Excel export
    const excelData = students.map(student => ({
      'Registration Number': student.registrationNumber,
      'Name': student.name,
      'Email': student.email,
      'Phone': student.phone,
      'Branch': student.branch ? student.branch.name : 'N/A',
      'Semester': student.semester,
      'Date of Birth': student.dateOfBirth ? new Date(student.dateOfBirth).toLocaleDateString() : 'N/A',
      'Address': student.address || 'N/A',
      'Blood Group': student.bloodGroup || 'N/A',
      'Emergency Contact': student.emergencyContact || 'N/A',
      'Created Date': new Date(student.createdAt).toLocaleDateString()
    }));

    // Create workbook and worksheet
    const workbook = XLSX.utils.book_new();
    const worksheet = XLSX.utils.json_to_sheet(excelData);
    
    // Auto-fit column widths
    const columnWidths = Object.keys(excelData[0] || {}).map(key => ({
      wch: Math.max(key.length, 15)
    }));
    worksheet['!cols'] = columnWidths;

    XLSX.utils.book_append_sheet(workbook, worksheet, 'Students');

    // Generate buffer
    const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });

    // Set response headers
    res.setHeader('Content-Disposition', `attachment; filename=students_${new Date().toISOString().split('T')[0]}.xlsx`);
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    
    res.send(buffer);
  } catch (error) {
    console.error('Export error:', error);
    res.status(500).json({ message: 'Export failed', error: error.message });
  }
});

// Delete student (Admin only) - Direct Database Deletion
router.delete('/delete/:studentId', auth, authorize(['student_management', 'head_admin']), async (req, res) => {
  try {
    const { studentId } = req.params;
    
    console.log(`🗑️ Direct student deletion request for: ${studentId} by user: ${req.user.email}`);

    // Find student first to verify existence
    const student = await Student.findById(studentId);
    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student not found'
      });
    }

    // Delete the student record
    await Student.findByIdAndDelete(studentId);

    // Also remove from related collections if needed
    const Payment = require('../models/Payment');
    await Payment.deleteMany({ student: studentId });

    console.log('✅ Student deleted successfully via direct database access');
    res.json({
      success: true,
      message: `Student ${student.firstName} ${student.lastName} (${student.regdNo}) has been deleted successfully`,
      deletedStudent: {
        id: student._id,
        name: `${student.firstName} ${student.lastName}`,
        regdNo: student.regdNo
      }
    });

  } catch (error) {
    console.error('❌ Error in direct student deletion:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error while deleting student', 
      error: error.message 
    });
  }
});

module.exports = router;
