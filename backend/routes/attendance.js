const express = require('express');
const router = express.Router();
const attendanceController = require('../controllers/attendanceController');
const { authenticateToken } = require('../middleware/auth');

// Get all attendance for a student
router.get('/student/:studentId', authenticateToken, attendanceController.getStudentAttendance);

// Get attendance by semester
router.get('/student/:studentId/semester/:semester', authenticateToken, attendanceController.getAttendanceBySemester);

// Mark daily attendance
router.post('/daily', authenticateToken, attendanceController.markDailyAttendance);

// Get daily attendance
router.get('/student/:studentId/daily', authenticateToken, attendanceController.getDailyAttendance);

// Get class attendance (admin only)
router.get('/class', authenticateToken, attendanceController.getClassAttendance);

// Update attendance record
router.put('/:attendanceId', authenticateToken, attendanceController.updateAttendanceRecord);

module.exports = router;
