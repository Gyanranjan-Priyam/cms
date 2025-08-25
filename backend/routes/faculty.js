const express = require('express');
const router = express.Router();
const facultyController = require('../controllers/facultyController');
const { authenticateToken, authorize } = require('../middleware/auth');

// All routes require authentication and admin access
router.use(authenticateToken);
router.use(authorize(['admin']));

// Faculty CRUD routes
router.get('/', facultyController.getAllFaculty);
router.get('/stats', facultyController.getFacultyStats);
router.get('/:facultyId', facultyController.getFacultyById);
router.post('/', facultyController.createFaculty);
router.put('/:facultyId', facultyController.updateFaculty);
router.delete('/:facultyId', facultyController.deleteFaculty);

// User management routes (admin only)
router.post('/change-password', facultyController.changeUserPassword);
router.post('/change-username', facultyController.changeUsername);

module.exports = router;
