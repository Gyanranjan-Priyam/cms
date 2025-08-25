const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const Student = require('../models/Student');
const { auth } = require('../middleware/auth');

const router = express.Router();

// Admin login
router.post('/admin/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    
    const user = await User.findOne({ username });
    if (!user || !(await user.comparePassword(password))) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { 
        id: user._id, 
        role: user.role,
        userId: user._id 
      },
      process.env.JWT_SECRET || 'fallback_secret',
      { expiresIn: '24h' }
    );

    res.json({
      success: true,
      token,
      user: {
        id: user._id,
        username: user.username,
        role: user.role,
        email: user.email,
        name: user.username
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Student login
router.post('/student/login', async (req, res) => {
  try {
    const { regdNo, dateOfBirth } = req.body;
    
    const student = await Student.findOne({ 
      regdNo, 
      isActive: true 
    }).populate('branch');
    
    if (!student) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Check date of birth
    const studentDOB = new Date(student.dateOfBirth).toDateString();
    const inputDOB = new Date(dateOfBirth).toDateString();

    if (studentDOB !== inputDOB) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { id: student._id, role: 'student' },
      process.env.JWT_SECRET || 'fallback_secret',
      { expiresIn: '24h' }
    );

    res.json({
      success: true,
      token,
      student: {
        id: student._id,
        regdNo: student.regdNo,
        firstName: student.firstName,
        lastName: student.lastName,
        email: student.email,
        branch: student.branch,
        semester: student.semester,
        role: 'student'
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Create default admin
router.post('/create-admin', async (req, res) => {
  try {
    const { username, password, email, role } = req.body;

    const existingUser = await User.findOne({ 
      $or: [{ username }, { email }] 
    });

    if (existingUser) {
      return res.status(400).json({ message: 'User already exists' });
    }

    const user = new User({
      username,
      password,
      email,
      role: role || 'head_admin'
    });

    await user.save();

    res.status(201).json({
      success: true,
      message: 'Admin created successfully',
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Verify token
router.get('/verify', auth, async (req, res) => {
  try {
    if (req.user.role === 'student') {
      const student = await Student.findById(req.user.id)
        .populate('branch', 'name code');
      
      return res.json({
        success: true,
        user: {
          id: student._id,
          regdNo: student.regdNo,
          firstName: student.firstName,
          lastName: student.lastName,
          email: student.email,
          branch: student.branch,
          semester: student.semester,
          role: 'student'
        }
      });
    } else {
      const user = await User.findById(req.user.id).select('-password');
      res.json({
        success: true,
        user: {
          id: user._id,
          username: user.username,
          email: user.email,
          role: user.role
        }
      });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get all admin users (for college management)
router.get('/users', auth, async (req, res) => {
  try {
    const users = await User.find({}, { password: 0 }).sort({ createdAt: -1 });
    
    res.json({
      success: true,
      users
    });
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error fetching users',
      error: error.message
    });
  }
});

// Change admin password
router.post('/change-password', auth, async (req, res) => {
  try {
    const { userId, newPassword } = req.body;
    
    if (!userId || !newPassword) {
      return res.status(400).json({ 
        success: false,
        message: 'User ID and new password are required' 
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ 
        success: false,
        message: 'Password must be at least 6 characters long' 
      });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ 
        success: false,
        message: 'User not found' 
      });
    }

    // Hash the new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    
    // Update only the password field to avoid validation issues
    await User.findByIdAndUpdate(userId, { 
      password: hashedPassword 
    }, { 
      runValidators: false // Skip validation since we're only updating password
    });

    res.json({
      success: true,
      message: 'Password updated successfully'
    });
  } catch (error) {
    console.error('Error changing password:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error changing password',
      error: error.message
    });
  }
});

// Change admin username
router.post('/change-username', auth, async (req, res) => {
  try {
    const { userId, newUsername, oldUsername } = req.body;
    
    if (!userId || !newUsername) {
      return res.status(400).json({ 
        success: false,
        message: 'User ID and new username are required' 
      });
    }

    // Check if username already exists
    const existingUser = await User.findOne({ 
      username: newUsername,
      _id: { $ne: userId }
    });
    
    if (existingUser) {
      return res.status(400).json({ 
        success: false,
        message: 'Username already exists' 
      });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ 
        success: false,
        message: 'User not found' 
      });
    }

    // Update only the username field to avoid validation issues
    await User.findByIdAndUpdate(userId, { 
      username: newUsername 
    }, { 
      runValidators: false // Skip validation since we're only updating username
    });

    res.json({
      success: true,
      message: 'Username updated successfully'
    });
  } catch (error) {
    console.error('Error changing username:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error changing username',
      error: error.message
    });
  }
});

module.exports = router;
