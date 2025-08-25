const Faculty = require('../models/Faculty');
const User = require('../models/User');
const Student = require('../models/Student');
const bcrypt = require('bcryptjs');

// Get all faculty members
const getAllFaculty = async (req, res) => {
  try {
    const { page = 1, limit = 10, department, status, search } = req.query;
    
    // Build query
    const query = {};
    if (department && department !== 'all') query.department = department;
    if (status && status !== 'all') query.status = status;
    if (search) {
      query.$or = [
        { firstName: { $regex: search, $options: 'i' } },
        { lastName: { $regex: search, $options: 'i' } },
        { employeeId: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { designation: { $regex: search, $options: 'i' } }
      ];
    }
    
    const options = {
      page: parseInt(page),
      limit: parseInt(limit),
      sort: { createdAt: -1 },
      populate: {
        path: 'createdBy',
        select: 'username email'
      }
    };
    
    const faculty = await Faculty.paginate(query, options);
    
    res.status(200).json({
      success: true,
      faculty: faculty.docs,
      pagination: {
        currentPage: faculty.page,
        totalPages: faculty.totalPages,
        totalItems: faculty.totalDocs,
        hasNext: faculty.hasNextPage,
        hasPrev: faculty.hasPrevPage
      }
    });
  } catch (error) {
    console.error('Error fetching faculty:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching faculty members',
      error: error.message
    });
  }
};

// Get single faculty member
const getFacultyById = async (req, res) => {
  try {
    const { facultyId } = req.params;
    
    const faculty = await Faculty.findById(facultyId)
      .populate('createdBy', 'username email');
    
    if (!faculty) {
      return res.status(404).json({
        success: false,
        message: 'Faculty member not found'
      });
    }
    
    res.status(200).json({
      success: true,
      faculty
    });
  } catch (error) {
    console.error('Error fetching faculty:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching faculty member',
      error: error.message
    });
  }
};

// Create new faculty member
const createFaculty = async (req, res) => {
  try {
    const {
      employeeId,
      firstName,
      lastName,
      email,
      phone,
      department,
      designation,
      specialization,
      qualification,
      experience,
      dateOfJoining,
      dateOfBirth,
      address,
      emergencyContact,
      username,
      password,
      role,
      subjects
    } = req.body;
    
    // Check if faculty with same employee ID or email exists
    const existingFaculty = await Faculty.findOne({
      $or: [{ employeeId }, { email }, { username }]
    });
    
    if (existingFaculty) {
      return res.status(400).json({
        success: false,
        message: 'Faculty with this employee ID, email, or username already exists'
      });
    }
    
    // Create new faculty member
    const faculty = new Faculty({
      employeeId,
      firstName,
      lastName,
      email,
      phone,
      department,
      designation,
      specialization,
      qualification,
      experience,
      dateOfJoining,
      dateOfBirth,
      address,
      emergencyContact,
      username,
      password,
      role: role || 'faculty',
      subjects: subjects || [],
      createdBy: req.user._id
    });
    
    await faculty.save();
    
    // Remove password from response
    const facultyResponse = faculty.toObject();
    delete facultyResponse.password;
    
    res.status(201).json({
      success: true,
      message: 'Faculty member created successfully',
      faculty: facultyResponse
    });
  } catch (error) {
    console.error('Error creating faculty:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating faculty member',
      error: error.message
    });
  }
};

// Update faculty member
const updateFaculty = async (req, res) => {
  try {
    const { facultyId } = req.params;
    const updateData = req.body;
    
    // Don't allow direct password updates through this route
    delete updateData.password;
    
    const faculty = await Faculty.findByIdAndUpdate(
      facultyId,
      updateData,
      { new: true, runValidators: true }
    ).populate('createdBy', 'username email');
    
    if (!faculty) {
      return res.status(404).json({
        success: false,
        message: 'Faculty member not found'
      });
    }
    
    // Remove password from response
    const facultyResponse = faculty.toObject();
    delete facultyResponse.password;
    
    res.status(200).json({
      success: true,
      message: 'Faculty member updated successfully',
      faculty: facultyResponse
    });
  } catch (error) {
    console.error('Error updating faculty:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating faculty member',
      error: error.message
    });
  }
};

// Delete faculty member
const deleteFaculty = async (req, res) => {
  try {
    const { facultyId } = req.params;
    
    const faculty = await Faculty.findByIdAndDelete(facultyId);
    
    if (!faculty) {
      return res.status(404).json({
        success: false,
        message: 'Faculty member not found'
      });
    }
    
    res.status(200).json({
      success: true,
      message: 'Faculty member deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting faculty:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting faculty member',
      error: error.message
    });
  }
};

// Change password (for any user - admin only)
const changeUserPassword = async (req, res) => {
  try {
    const { userId, userType, newPassword } = req.body;
    
    if (!userId || !userType || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'User ID, user type, and new password are required'
      });
    }
    
    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters long'
      });
    }
    
    let user;
    let Model;
    
    // Determine which model to use
    switch (userType) {
      case 'admin':
        Model = User;
        break;
      case 'faculty':
        Model = Faculty;
        break;
      case 'student':
        Model = Student;
        break;
      default:
        return res.status(400).json({
          success: false,
          message: 'Invalid user type'
        });
    }
    
    // Find user
    user = await Model.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    // Hash new password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);
    
    // Update password
    user.password = hashedPassword;
    await user.save();
    
    res.status(200).json({
      success: true,
      message: 'Password updated successfully',
      userType,
      username: user.username || user.regdNo || user.email
    });
  } catch (error) {
    console.error('Error changing password:', error);
    res.status(500).json({
      success: false,
      message: 'Error changing password',
      error: error.message
    });
  }
};

// Change username (for any user - admin only)
const changeUsername = async (req, res) => {
  try {
    const { userId, userType, newUsername } = req.body;
    
    if (!userId || !userType || !newUsername) {
      return res.status(400).json({
        success: false,
        message: 'User ID, user type, and new username are required'
      });
    }
    
    let user;
    let Model;
    
    // Determine which model to use
    switch (userType) {
      case 'admin':
        Model = User;
        break;
      case 'faculty':
        Model = Faculty;
        break;
      case 'student':
        // Students use regdNo, not username
        return res.status(400).json({
          success: false,
          message: 'Cannot change username for students (use registration number)'
        });
      default:
        return res.status(400).json({
          success: false,
          message: 'Invalid user type'
        });
    }
    
    // Check if username is already taken
    const existingUser = await Model.findOne({ username: newUsername });
    if (existingUser && existingUser._id.toString() !== userId) {
      return res.status(400).json({
        success: false,
        message: 'Username already exists'
      });
    }
    
    // Find and update user
    user = await Model.findByIdAndUpdate(
      userId,
      { username: newUsername },
      { new: true, runValidators: true }
    );
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    res.status(200).json({
      success: true,
      message: 'Username updated successfully',
      userType,
      newUsername,
      oldUsername: req.body.oldUsername
    });
  } catch (error) {
    console.error('Error changing username:', error);
    res.status(500).json({
      success: false,
      message: 'Error changing username',
      error: error.message
    });
  }
};

// Get dashboard stats
const getFacultyStats = async (req, res) => {
  try {
    const totalFaculty = await Faculty.countDocuments();
    const activeFaculty = await Faculty.countDocuments({ status: 'active' });
    const inactiveFaculty = await Faculty.countDocuments({ status: 'inactive' });
    const onLeaveFaculty = await Faculty.countDocuments({ status: 'on-leave' });
    
    // Department-wise count
    const departmentStats = await Faculty.aggregate([
      {
        $group: {
          _id: '$department',
          count: { $sum: 1 }
        }
      },
      {
        $sort: { count: -1 }
      }
    ]);
    
    // Designation-wise count
    const designationStats = await Faculty.aggregate([
      {
        $group: {
          _id: '$designation',
          count: { $sum: 1 }
        }
      },
      {
        $sort: { count: -1 }
      }
    ]);
    
    // Recent faculty (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const recentFaculty = await Faculty.countDocuments({
      createdAt: { $gte: sevenDaysAgo }
    });
    
    res.status(200).json({
      success: true,
      stats: {
        total: totalFaculty,
        active: activeFaculty,
        inactive: inactiveFaculty,
        onLeave: onLeaveFaculty,
        recent: recentFaculty,
        departments: departmentStats,
        designations: designationStats
      }
    });
  } catch (error) {
    console.error('Error fetching faculty stats:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching faculty statistics',
      error: error.message
    });
  }
};

module.exports = {
  getAllFaculty,
  getFacultyById,
  createFaculty,
  updateFaculty,
  deleteFaculty,
  changeUserPassword,
  changeUsername,
  getFacultyStats
};
