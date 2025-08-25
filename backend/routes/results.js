const express = require('express');
const router = express.Router();
const resultController = require('../controllers/resultController');
const { authenticateToken } = require('../middleware/auth');

// Get all results for a student
router.get('/student/:studentId', authenticateToken, resultController.getStudentResults);

// Get result by semester
router.get('/student/:studentId/semester/:semester', authenticateToken, resultController.getResultBySemester);

// Create or update result
router.post('/', authenticateToken, resultController.createOrUpdateResult);

// Update result
router.put('/', authenticateToken, resultController.createOrUpdateResult);

// Delete result
router.delete('/:resultId', authenticateToken, resultController.deleteResult);

// Get class results (admin only)
router.get('/class', authenticateToken, resultController.getClassResults);

module.exports = router;
