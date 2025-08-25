const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Student = require('../models/Student');

const auth = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    console.log('Auth middleware - Token received:', token ? 'Present' : 'Missing');
    
    if (!token) {
      console.log('Auth middleware - No token provided');
      return res.status(401).json({ message: 'No token, authorization denied' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret');
    console.log('Auth middleware - Decoded token:', { id: decoded.id, role: decoded.role });
    
    let user;
    
    if (decoded.role === 'student') {
      // For student tokens, look in Student collection
      user = await Student.findById(decoded.id).populate('branch');
      console.log('Auth middleware - Student found:', user ? `${user.firstName} ${user.lastName} (${user.regdNo})` : 'Not found');
    } else {
      // For admin tokens, look in User collection
      user = await User.findById(decoded.id);
      console.log('Auth middleware - Admin user found:', user ? `${user.username} (${user.role})` : 'Not found');
    }
    
    if (!user) {
      console.log('Auth middleware - User/Student not found in database');
      return res.status(401).json({ message: 'Token is not valid' });
    }

    // Add role to user object for consistency
    user.role = decoded.role;
    req.user = user;
    next();
  } catch (error) {
    console.log('Auth middleware - Error:', error.message);
    res.status(401).json({ message: 'Token is not valid' });
  }
};

const authorize = (roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Authentication required' });
    }
    
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ message: 'Access denied' });
    }
    next();
  };
};

module.exports = { auth, authorize, authenticateToken: auth };
