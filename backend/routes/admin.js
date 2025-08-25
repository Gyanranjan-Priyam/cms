const express = require('express');
const User = require('../models/User');
const Department = require('../models/Department');
const Student = require('../models/Student');
const { auth } = require('../middleware/auth');

const router = express.Router();

// Admin middleware - ensures only admin can access these routes
const adminAuth = async (req, res, next) => {
  try {
    if (req.user.role !== 'admin' && req.user.role !== 'head_admin') {
      return res.status(403).json({ 
        success: false, 
        message: 'Access denied. Admin privileges required.' 
      });
    }
    next();
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// ===================
// DEPARTMENT MANAGEMENT
// ===================

// Get all departments
router.get('/departments', auth, adminAuth, async (req, res) => {
  try {
    const departments = await Department.find({ isActive: true })
      .populate('hodId', 'name email employeeId')
      .populate('branches', 'name code')
      .sort({ name: 1 });

    // Update counts for each department
    for (let dept of departments) {
      await dept.updateCounts();
    }

    res.json({
      success: true,
      data: departments
    });
  } catch (error) {
    console.error('Error fetching departments:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Create new department
router.post('/departments', auth, adminAuth, async (req, res) => {
  try {
    const { name, code, description, hodId } = req.body;

    // Validate required fields
    if (!name || !code) {
      return res.status(400).json({
        success: false,
        message: 'Department name and code are required'
      });
    }

    // Check if department already exists
    const existingDept = await Department.findOne({
      $or: [
        { name: name.trim() },
        { code: code.trim().toUpperCase() }
      ]
    });

    if (existingDept) {
      return res.status(400).json({
        success: false,
        message: 'Department with this name or code already exists'
      });
    }

    // If HOD is specified, validate they are faculty
    if (hodId) {
      const hod = await User.findById(hodId);
      if (!hod || hod.role !== 'faculty') {
        return res.status(400).json({
          success: false,
          message: 'HOD must be a faculty member'
        });
      }
    }

    const department = new Department({
      name: name.trim(),
      code: code.trim(),
      description: description?.trim(),
      hodId: hodId || null,
      createdBy: req.user.id
    });

    await department.save();

    const populatedDepartment = await Department.findById(department._id)
      .populate('hodId', 'name email employeeId')
      .populate('createdBy', 'name email');

    res.status(201).json({
      success: true,
      message: 'Department created successfully',
      data: populatedDepartment
    });
  } catch (error) {
    console.error('Error creating department:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Update department
router.put('/departments/:id', auth, adminAuth, async (req, res) => {
  try {
    const { name, code, description, hodId } = req.body;
    const departmentId = req.params.id;

    const department = await Department.findById(departmentId);
    if (!department) {
      return res.status(404).json({
        success: false,
        message: 'Department not found'
      });
    }

    // Check for duplicate name/code (excluding current department)
    if (name || code) {
      const duplicateQuery = {
        _id: { $ne: departmentId },
        $or: []
      };

      if (name) duplicateQuery.$or.push({ name: name.trim() });
      if (code) duplicateQuery.$or.push({ code: code.trim().toUpperCase() });

      const duplicate = await Department.findOne(duplicateQuery);
      if (duplicate) {
        return res.status(400).json({
          success: false,
          message: 'Department with this name or code already exists'
        });
      }
    }

    // Validate HOD if provided
    if (hodId) {
      const hod = await User.findById(hodId);
      if (!hod || hod.role !== 'faculty') {
        return res.status(400).json({
          success: false,
          message: 'HOD must be a faculty member'
        });
      }
    }

    // Update fields
    if (name) department.name = name.trim();
    if (code) department.code = code.trim();
    if (description !== undefined) department.description = description?.trim();
    if (hodId !== undefined) department.hodId = hodId || null;

    await department.save();

    const updatedDepartment = await Department.findById(departmentId)
      .populate('hodId', 'name email employeeId');

    res.json({
      success: true,
      message: 'Department updated successfully',
      data: updatedDepartment
    });
  } catch (error) {
    console.error('Error updating department:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Delete department (soft delete)
router.delete('/departments/:id', auth, adminAuth, async (req, res) => {
  try {
    const departmentId = req.params.id;

    const department = await Department.findById(departmentId);
    if (!department) {
      return res.status(404).json({
        success: false,
        message: 'Department not found'
      });
    }

    // Check if department has active faculty or students
    const [facultyCount, studentCount] = await Promise.all([
      User.countDocuments({ 
        role: 'faculty', 
        department: departmentId,
        isActive: true 
      }),
      Student.countDocuments({ 
        department: departmentId,
        isActive: true 
      })
    ]);

    if (facultyCount > 0 || studentCount > 0) {
      return res.status(400).json({
        success: false,
        message: `Cannot delete department. It has ${facultyCount} active faculty and ${studentCount} active students.`
      });
    }

    department.isActive = false;
    await department.save();

    res.json({
      success: true,
      message: 'Department deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting department:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// ===================
// FACULTY MANAGEMENT
// ===================

// Get all faculty members
router.get('/faculty', auth, adminAuth, async (req, res) => {
  try {
    const faculty = await User.find({ 
      role: 'faculty',
      isActive: true 
    })
    .select('-password')
    .populate('department', 'name code')
    .populate('createdBy', 'name email')
    .sort({ name: 1 });

    res.json({
      success: true,
      data: faculty
    });
  } catch (error) {
    console.error('Error fetching faculty:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Create new faculty member
router.post('/faculty', auth, adminAuth, async (req, res) => {
  try {
    const {
      username,
      password,
      name,
      email,
      employeeId,
      department,
      designation,
      facultyDepartment,
      specialization,
      experience
    } = req.body;

    // Validate required fields
    if (!username || !password || !name || !email || !employeeId) {
      return res.status(400).json({
        success: false,
        message: 'Username, password, name, email, and employee ID are required'
      });
    }

    // Check for existing user
    const existingUser = await User.findOne({
      $or: [
        { username: username.trim() },
        { email: email.trim().toLowerCase() },
        { employeeId: employeeId.trim() }
      ]
    });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'User with this username, email, or employee ID already exists'
      });
    }

    // Validate department if provided
    if (department) {
      const dept = await Department.findById(department);
      if (!dept || !dept.isActive) {
        return res.status(400).json({
          success: false,
          message: 'Invalid department'
        });
      }
    }

    const faculty = await User.createFaculty({
      username: username.trim(),
      password,
      name: name.trim(),
      email: email.trim().toLowerCase(),
      employeeId: employeeId.trim(),
      department: department || null,
      designation: designation?.trim(),
      facultyDepartment: facultyDepartment?.trim(),
      specialization: specialization?.trim(),
      experience: experience || 0
    }, req.user.id);

    const populatedFaculty = await User.findById(faculty._id)
      .select('-password')
      .populate('department', 'name code')
      .populate('createdBy', 'name email');

    res.status(201).json({
      success: true,
      message: 'Faculty member created successfully',
      data: populatedFaculty
    });
  } catch (error) {
    console.error('Error creating faculty:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Update faculty member
router.put('/faculty/:id', auth, adminAuth, async (req, res) => {
  try {
    const facultyId = req.params.id;
    const updateData = req.body;

    const faculty = await User.findOne({ 
      _id: facultyId, 
      role: 'faculty',
      isActive: true 
    });

    if (!faculty) {
      return res.status(404).json({
        success: false,
        message: 'Faculty member not found'
      });
    }

    // Check for duplicates if updating unique fields
    if (updateData.username || updateData.email || updateData.employeeId) {
      const duplicateQuery = {
        _id: { $ne: facultyId },
        $or: []
      };

      if (updateData.username) duplicateQuery.$or.push({ username: updateData.username.trim() });
      if (updateData.email) duplicateQuery.$or.push({ email: updateData.email.trim().toLowerCase() });
      if (updateData.employeeId) duplicateQuery.$or.push({ employeeId: updateData.employeeId.trim() });

      const duplicate = await User.findOne(duplicateQuery);
      if (duplicate) {
        return res.status(400).json({
          success: false,
          message: 'User with this username, email, or employee ID already exists'
        });
      }
    }

    // Validate department if provided
    if (updateData.department) {
      const dept = await Department.findById(updateData.department);
      if (!dept || !dept.isActive) {
        return res.status(400).json({
          success: false,
          message: 'Invalid department'
        });
      }
    }

    // Update allowed fields
    const allowedFields = [
      'name', 'email', 'employeeId', 'department', 'designation',
      'facultyDepartment', 'specialization', 'experience'
    ];

    allowedFields.forEach(field => {
      if (updateData[field] !== undefined) {
        if (typeof updateData[field] === 'string') {
          faculty[field] = updateData[field].trim();
        } else {
          faculty[field] = updateData[field];
        }
      }
    });

    // Handle email lowercase
    if (updateData.email) {
      faculty.email = updateData.email.trim().toLowerCase();
    }

    await faculty.save();

    const updatedFaculty = await User.findById(facultyId)
      .select('-password')
      .populate('department', 'name code');

    res.json({
      success: true,
      message: 'Faculty member updated successfully',
      data: updatedFaculty
    });
  } catch (error) {
    console.error('Error updating faculty:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Delete faculty member (soft delete)
router.delete('/faculty/:id', auth, adminAuth, async (req, res) => {
  try {
    const facultyId = req.params.id;

    const faculty = await User.findOne({ 
      _id: facultyId, 
      role: 'faculty',
      isActive: true 
    });

    if (!faculty) {
      return res.status(404).json({
        success: false,
        message: 'Faculty member not found'
      });
    }

    faculty.isActive = false;
    await faculty.save();

    res.json({
      success: true,
      message: 'Faculty member deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting faculty:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// ===================
// SYSTEM OVERVIEW
// ===================

// Get admin dashboard overview
router.get('/overview', auth, adminAuth, async (req, res) => {
  try {
    const [
      totalDepartments,
      totalFaculty,
      totalStudents,
      totalActiveUsers,
      recentFaculty,
      recentDepartments
    ] = await Promise.all([
      Department.countDocuments({ isActive: true }),
      User.countDocuments({ role: 'faculty', isActive: true }),
      Student.countDocuments({ isActive: true }),
      User.countDocuments({ isActive: true }),
      User.find({ role: 'faculty', isActive: true })
        .select('-password')
        .populate('department', 'name')
        .sort({ createdAt: -1 })
        .limit(5),
      Department.find({ isActive: true })
        .populate('hodId', 'name')
        .sort({ createdAt: -1 })
        .limit(5)
    ]);

    res.json({
      success: true,
      data: {
        stats: {
          totalDepartments,
          totalFaculty,
          totalStudents,
          totalActiveUsers
        },
        recent: {
          faculty: recentFaculty,
          departments: recentDepartments
        }
      }
    });
  } catch (error) {
    console.error('Error fetching admin overview:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

module.exports = router;
