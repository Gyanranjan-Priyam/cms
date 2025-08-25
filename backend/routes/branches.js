const express = require('express');
const Branch = require('../models/Branch');
const Student = require('../models/Student');
const { auth, authorize } = require('../middleware/auth');

const router = express.Router();

// Get all branches
router.get('/', auth, async (req, res) => {
  try {
    const branches = await Branch.find({ isActive: true })
      .populate('createdBy', 'username')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      branches
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get branch by ID
router.get('/:id', auth, async (req, res) => {
  try {
    const branch = await Branch.findById(req.params.id)
      .populate('createdBy', 'username');

    if (!branch) {
      return res.status(404).json({ message: 'Branch not found' });
    }

    // Get student count for this branch
    const studentCount = await Student.countDocuments({ 
      branch: req.params.id, 
      isActive: true 
    });

    res.json({
      success: true,
      branch: {
        ...branch.toObject(),
        studentCount
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Create new branch (Head Admin only)
router.post('/', auth, authorize(['head_admin', 'admin']), async (req, res) => {
  try {
    const {
      name,
      code,
      description,
      duration,
      totalSemesters,
      academicFees,
      hostelFees,
      otherFees
    } = req.body;

    // Check if branch already exists
    const existingBranch = await Branch.findOne({
      $or: [
        { name: { $regex: new RegExp(name, 'i') } },
        { code: code.toUpperCase() }
      ]
    });

    if (existingBranch) {
      return res.status(400).json({ 
        message: 'Branch with this name or code already exists' 
      });
    }

    const branch = new Branch({
      name,
      code: code.toUpperCase(),
      description,
      duration,
      totalSemesters,
      academicFees,
      hostelFees,
      otherFees,
      createdBy: req.user.id
    });

    await branch.save();
    await branch.populate('createdBy', 'username');

    // Emit real-time update
    req.io.emit('branchAdded', branch);

    res.status(201).json({
      success: true,
      message: 'Branch created successfully',
      branch
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update branch (Head Admin only)
router.put('/:id', auth, authorize(['head_admin', 'admin']), async (req, res) => {
  try {
    const branchId = req.params.id;
    const updateData = req.body;

    // Remove fields that shouldn't be updated directly
    delete updateData._id;
    delete updateData.createdBy;
    delete updateData.createdAt;
    delete updateData.updatedAt;

    // Uppercase the code if provided
    if (updateData.code) {
      updateData.code = updateData.code.toUpperCase();
    }

    const branch = await Branch.findByIdAndUpdate(
      branchId,
      updateData,
      { new: true, runValidators: true }
    ).populate('createdBy', 'username');

    if (!branch) {
      return res.status(404).json({ message: 'Branch not found' });
    }

    // Emit real-time update
    req.io.emit('branchUpdated', branch);

    res.json({
      success: true,
      message: 'Branch updated successfully',
      branch
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete branch (Head Admin only)
router.delete('/:id', auth, authorize(['head_admin', 'admin']), async (req, res) => {
  try {
    const branchId = req.params.id;

    // Check if there are active students in this branch
    const activeStudents = await Student.countDocuments({ 
      branch: branchId, 
      isActive: true 
    });

    if (activeStudents > 0) {
      return res.status(400).json({ 
        message: `Cannot delete branch. ${activeStudents} active students are enrolled in this branch.`,
        activeStudents 
      });
    }

    const branch = await Branch.findByIdAndUpdate(
      branchId,
      { isActive: false },
      { new: true }
    );

    if (!branch) {
      return res.status(404).json({ message: 'Branch not found' });
    }

    // Also deactivate all students in this branch
    await Student.updateMany(
      { branch: branchId },
      { isActive: false }
    );

    // Emit real-time update
    req.io.emit('branchDeleted', { id: branchId });

    res.json({
      success: true,
      message: 'Branch and all associated students deleted successfully'
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get branch statistics
router.get('/:id/stats', auth, async (req, res) => {
  try {
    const branchId = req.params.id;

    // Check if branch exists
    const branch = await Branch.findById(branchId);
    if (!branch) {
      return res.status(404).json({ message: 'Branch not found' });
    }

    // Get semester-wise student distribution
    const semesterStats = await Student.aggregate([
      { 
        $match: { 
          branch: branch._id, 
          isActive: true 
        } 
      },
      {
        $group: {
          _id: '$semester',
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    // Get gender distribution
    const genderStats = await Student.aggregate([
      { 
        $match: { 
          branch: branch._id, 
          isActive: true 
        } 
      },
      {
        $group: {
          _id: '$gender',
          count: { $sum: 1 }
        }
      }
    ]);

    // Get category distribution
    const categoryStats = await Student.aggregate([
      { 
        $match: { 
          branch: branch._id, 
          isActive: true 
        } 
      },
      {
        $group: {
          _id: '$category',
          count: { $sum: 1 }
        }
      }
    ]);

    const totalStudents = await Student.countDocuments({ 
      branch: branchId, 
      isActive: true 
    });

    res.json({
      success: true,
      stats: {
        totalStudents,
        semesterStats,
        genderStats,
        categoryStats,
        branch: {
          name: branch.name,
          code: branch.code
        }
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
