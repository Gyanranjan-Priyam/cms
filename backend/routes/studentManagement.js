const express = require('express');
const Student = require('../models/Student');
const User = require('../models/User');
const Branch = require('../models/Branch');
const Department = require('../models/Department');
const { auth } = require('../middleware/auth');

const router = express.Router();

// Student Management middleware - ensures only admin or student_management can access
const studentManagementAuth = async (req, res, next) => {
  try {
    if (!['admin', 'student_management'].includes(req.user.role)) {
      return res.status(403).json({ 
        success: false, 
        message: 'Access denied. Student management privileges required.' 
      });
    }
    next();
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// ===================
// STUDENT MANAGEMENT
// ===================

// Get all students with filtering and pagination
router.get('/students', auth, studentManagementAuth, async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      search,
      semester,
      branch,
      section,
      academicYear,
      status = 'active'
    } = req.query;

    const query = {};
    
    // Build query based on filters
    if (status === 'active') query.isActive = true;
    else if (status === 'inactive') query.isActive = false;
    
    if (semester) query.semester = parseInt(semester);
    if (branch) query.branch = branch;
    if (section) query.section = section;
    if (academicYear) query.academicYear = academicYear;

    // Search functionality
    if (search) {
      const searchRegex = new RegExp(search, 'i');
      query.$or = [
        { regdNo: searchRegex },
        { firstName: searchRegex },
        { lastName: searchRegex },
        { email: searchRegex },
        { phone: searchRegex }
      ];
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [students, totalCount] = await Promise.all([
      Student.find(query)
        .populate('branch', 'name code')
        .select('-password') // Exclude password if students have login
        .sort({ regdNo: 1 })
        .skip(skip)
        .limit(parseInt(limit)),
      Student.countDocuments(query)
    ]);

    const totalPages = Math.ceil(totalCount / parseInt(limit));

    res.json({
      success: true,
      data: {
        students,
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
    console.error('Error fetching students:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Get single student details
router.get('/students/:id', auth, studentManagementAuth, async (req, res) => {
  try {
    const student = await Student.findById(req.params.id)
      .populate('branch', 'name code department')
      .select('-password');

    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student not found'
      });
    }

    // Get additional details like marks, attendance summary
    const Marks = require('../models/Marks');
    const DailyAttendance = require('../models/DailyAttendance');

    const [marksCount, attendanceStats] = await Promise.all([
      Marks.countDocuments({ studentId: student._id }),
      DailyAttendance.aggregate([
        { $match: { studentId: student._id } },
        {
          $group: {
            _id: null,
            totalClasses: { $sum: 1 },
            attendedClasses: {
              $sum: { $cond: [{ $eq: ['$status', 'present'] }, 1, 0] }
            }
          }
        }
      ])
    ]);

    const attendancePercentage = attendanceStats.length > 0 
      ? (attendanceStats[0].attendedClasses / attendanceStats[0].totalClasses * 100).toFixed(2)
      : 0;

    res.json({
      success: true,
      data: {
        ...student.toObject(),
        stats: {
          totalMarksEntries: marksCount,
          attendancePercentage: parseFloat(attendancePercentage),
          totalClasses: attendanceStats.length > 0 ? attendanceStats[0].totalClasses : 0
        }
      }
    });
  } catch (error) {
    console.error('Error fetching student:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Add new student
router.post('/students', auth, studentManagementAuth, async (req, res) => {
  try {
    const {
      regdNo,
      firstName,
      lastName,
      email,
      phone,
      dateOfBirth,
      gender,
      address,
      semester,
      branch,
      section,
      academicYear,
      admissionDate,
      guardianName,
      guardianPhone,
      guardianEmail
    } = req.body;

    // Validate required fields
    if (!regdNo || !firstName || !lastName || !email || !phone || !semester || !branch) {
      return res.status(400).json({
        success: false,
        message: 'Registration number, name, email, phone, semester, and branch are required'
      });
    }

    // Check if student already exists
    const existingStudent = await Student.findOne({
      $or: [
        { regdNo: regdNo.trim() },
        { email: email.trim().toLowerCase() }
      ]
    });

    if (existingStudent) {
      return res.status(400).json({
        success: false,
        message: 'Student with this registration number or email already exists'
      });
    }

    // Validate branch
    const branchDoc = await Branch.findById(branch);
    if (!branchDoc) {
      return res.status(400).json({
        success: false,
        message: 'Invalid branch'
      });
    }

    const student = new Student({
      regdNo: regdNo.trim(),
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      email: email.trim().toLowerCase(),
      phone: phone.trim(),
      dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : undefined,
      gender,
      address: address?.trim(),
      semester: parseInt(semester),
      branch,
      section: section || 'A',
      academicYear: academicYear || new Date().getFullYear().toString(),
      admissionDate: admissionDate ? new Date(admissionDate) : new Date(),
      guardianName: guardianName?.trim(),
      guardianPhone: guardianPhone?.trim(),
      guardianEmail: guardianEmail?.trim().toLowerCase(),
      createdBy: req.user.id
    });

    await student.save();

    const populatedStudent = await Student.findById(student._id)
      .populate('branch', 'name code');

    res.status(201).json({
      success: true,
      message: 'Student added successfully',
      data: populatedStudent
    });
  } catch (error) {
    console.error('Error adding student:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Update student
router.put('/students/:id', auth, studentManagementAuth, async (req, res) => {
  try {
    const studentId = req.params.id;
    const updateData = req.body;

    const student = await Student.findById(studentId);
    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student not found'
      });
    }

    // Check for duplicates if updating unique fields
    if (updateData.regdNo || updateData.email) {
      const duplicateQuery = {
        _id: { $ne: studentId },
        $or: []
      };

      if (updateData.regdNo) duplicateQuery.$or.push({ regdNo: updateData.regdNo.trim() });
      if (updateData.email) duplicateQuery.$or.push({ email: updateData.email.trim().toLowerCase() });

      const duplicate = await Student.findOne(duplicateQuery);
      if (duplicate) {
        return res.status(400).json({
          success: false,
          message: 'Student with this registration number or email already exists'
        });
      }
    }

    // Validate branch if updating
    if (updateData.branch) {
      const branchDoc = await Branch.findById(updateData.branch);
      if (!branchDoc) {
        return res.status(400).json({
          success: false,
          message: 'Invalid branch'
        });
      }
    }

    // Update allowed fields
    const allowedFields = [
      'regdNo', 'firstName', 'lastName', 'email', 'phone', 'dateOfBirth',
      'gender', 'address', 'semester', 'branch', 'section', 'academicYear',
      'admissionDate', 'guardianName', 'guardianPhone', 'guardianEmail'
    ];

    allowedFields.forEach(field => {
      if (updateData[field] !== undefined) {
        if (typeof updateData[field] === 'string') {
          student[field] = updateData[field].trim();
        } else if (field === 'dateOfBirth' || field === 'admissionDate') {
          student[field] = updateData[field] ? new Date(updateData[field]) : undefined;
        } else {
          student[field] = updateData[field];
        }
      }
    });

    // Handle email lowercase
    if (updateData.email) {
      student.email = updateData.email.trim().toLowerCase();
    }
    if (updateData.guardianEmail) {
      student.guardianEmail = updateData.guardianEmail.trim().toLowerCase();
    }

    student.updatedBy = req.user.id;
    await student.save();

    const updatedStudent = await Student.findById(studentId)
      .populate('branch', 'name code');

    res.json({
      success: true,
      message: 'Student updated successfully',
      data: updatedStudent
    });
  } catch (error) {
    console.error('Error updating student:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Delete student (soft delete)
router.delete('/students/:id', auth, studentManagementAuth, async (req, res) => {
  try {
    const studentId = req.params.id;

    const student = await Student.findById(studentId);
    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student not found'
      });
    }

    student.isActive = false;
    student.updatedBy = req.user.id;
    await student.save();

    res.json({
      success: true,
      message: 'Student deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting student:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Permanently delete student (hard delete)
router.delete('/students/:id/permanent', auth, studentManagementAuth, async (req, res) => {
  try {
    const studentId = req.params.id;

    // Check if student exists
    const student = await Student.findById(studentId);
    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student not found'
      });
    }

    // Store student info for logging
    const studentInfo = {
      regdNo: student.regdNo,
      name: `${student.firstName} ${student.lastName}`,
      email: student.email
    };

    // Permanently delete from database
    await Student.findByIdAndDelete(studentId);

    console.log(`Student permanently deleted: ${studentInfo.name} (${studentInfo.regdNo}) by admin ${req.user.id}`);

    res.json({
      success: true,
      message: `Student ${studentInfo.name} (${studentInfo.regdNo}) has been permanently deleted from the database`,
      deletedStudent: studentInfo
    });
  } catch (error) {
    console.error('Error permanently deleting student:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error while permanently deleting student' 
    });
  }
});

// Bulk permanent delete
router.post('/students/bulk-permanent-delete', auth, studentManagementAuth, async (req, res) => {
  try {
    const { studentIds } = req.body;

    if (!Array.isArray(studentIds) || studentIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No student IDs provided'
      });
    }

    // Get student info before deletion for logging
    const studentsToDelete = await Student.find({
      _id: { $in: studentIds }
    }).select('regdNo firstName lastName email');

    if (studentsToDelete.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'No students found with provided IDs'
      });
    }

    // Permanently delete all students
    const deleteResult = await Student.deleteMany({
      _id: { $in: studentIds }
    });

    const deletedStudentInfo = studentsToDelete.map(student => ({
      regdNo: student.regdNo,
      name: `${student.firstName} ${student.lastName}`,
      email: student.email
    }));

    console.log(`Bulk permanent delete: ${deleteResult.deletedCount} students permanently deleted by admin ${req.user.id}`);
    console.log('Deleted students:', deletedStudentInfo);

    res.json({
      success: true,
      message: `${deleteResult.deletedCount} students have been permanently deleted from the database`,
      deletedCount: deleteResult.deletedCount,
      deletedStudents: deletedStudentInfo
    });
  } catch (error) {
    console.error('Error in bulk permanent delete:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error while permanently deleting students' 
    });
  }
});

// Bulk operations
router.post('/students/bulk-upload', auth, studentManagementAuth, async (req, res) => {
  try {
    const { students } = req.body;

    if (!Array.isArray(students) || students.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No student data provided'
      });
    }

    const results = {
      success: [],
      errors: []
    };

    for (let i = 0; i < students.length; i++) {
      try {
        const studentData = students[i];
        
        // Validate required fields
        if (!studentData.regdNo || !studentData.firstName || !studentData.email) {
          results.errors.push({
            row: i + 1,
            error: 'Missing required fields: regdNo, firstName, or email'
          });
          continue;
        }

        // Check for existing student
        const existing = await Student.findOne({
          $or: [
            { regdNo: studentData.regdNo.trim() },
            { email: studentData.email.trim().toLowerCase() }
          ]
        });

        if (existing) {
          results.errors.push({
            row: i + 1,
            regdNo: studentData.regdNo,
            error: 'Student already exists'
          });
          continue;
        }

        // Create student
        const student = new Student({
          ...studentData,
          email: studentData.email.trim().toLowerCase(),
          createdBy: req.user.id
        });

        await student.save();
        results.success.push({
          row: i + 1,
          regdNo: studentData.regdNo,
          name: `${studentData.firstName} ${studentData.lastName}`
        });

      } catch (error) {
        results.errors.push({
          row: i + 1,
          error: error.message
        });
      }
    }

    res.json({
      success: true,
      message: `Processed ${students.length} students. ${results.success.length} added, ${results.errors.length} errors.`,
      data: results
    });
  } catch (error) {
    console.error('Error in bulk upload:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// ===================
// STUDENT STATISTICS
// ===================

// Get student statistics
router.get('/stats', auth, studentManagementAuth, async (req, res) => {
  try {
    const [
      totalStudents,
      activeStudents,
      inactiveStudents,
      branchWiseStats,
      semesterWiseStats,
      recentStudents
    ] = await Promise.all([
      Student.countDocuments({}),
      Student.countDocuments({ isActive: true }),
      Student.countDocuments({ isActive: false }),
      Student.aggregate([
        { $match: { isActive: true } },
        {
          $lookup: {
            from: 'branches',
            localField: 'branch',
            foreignField: '_id',
            as: 'branchInfo'
          }
        },
        { $unwind: '$branchInfo' },
        {
          $group: {
            _id: '$branchInfo.name',
            count: { $sum: 1 },
            branchCode: { $first: '$branchInfo.code' }
          }
        },
        { $sort: { count: -1 } }
      ]),
      Student.aggregate([
        { $match: { isActive: true } },
        {
          $group: {
            _id: '$semester',
            count: { $sum: 1 }
          }
        },
        { $sort: { _id: 1 } }
      ]),
      Student.find({ isActive: true })
        .populate('branch', 'name code')
        .sort({ createdAt: -1 })
        .limit(10)
        .select('regdNo firstName lastName semester branch createdAt')
    ]);

    res.json({
      success: true,
      data: {
        overview: {
          totalStudents,
          activeStudents,
          inactiveStudents
        },
        branchWise: branchWiseStats,
        semesterWise: semesterWiseStats,
        recentStudents
      }
    });
  } catch (error) {
    console.error('Error fetching statistics:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

module.exports = router;
