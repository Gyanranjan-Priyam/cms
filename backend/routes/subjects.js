const express = require('express');
const Subject = require('../models/Subject');
const Branch = require('../models/Branch');
const { auth, authorize } = require('../middleware/auth');

const router = express.Router();

// List subjects with optional filters: branch, search, activeOnly
router.get('/', auth, authorize(['admin', 'head_admin']), async (req, res) => {
  try {
  const { branch, search, activeOnly, semester } = req.query;
    const filter = {};
    if (branch) filter.branch = branch;
  if (semester) filter.semester = parseInt(semester);
    if (activeOnly === 'true') filter.isActive = true;
    if (search) {
      const s = search.trim();
      filter.$or = [
        { name: { $regex: s, $options: 'i' } },
        { code: { $regex: s, $options: 'i' } }
      ];
    }

    const subjects = await Subject.find(filter)
      .populate('branch', 'name code')
      .populate('createdBy', 'username name email')
      .sort({ createdAt: -1 });

    res.json({ success: true, data: subjects });
  } catch (error) {
    console.error('Error fetching subjects:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Get single subject
router.get('/:id', auth, authorize(['admin', 'head_admin']), async (req, res) => {
  try {
    const subject = await Subject.findById(req.params.id)
      .populate('branch', 'name code')
      .populate('createdBy', 'username name email');
    if (!subject) return res.status(404).json({ success: false, message: 'Subject not found' });
    res.json({ success: true, data: subject });
  } catch (error) {
    console.error('Error fetching subject:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Create subject
router.post('/', auth, authorize(['admin', 'head_admin']), async (req, res) => {
  try {
    const { name, code, branch, description, semester } = req.body;
    if (!name || !code || !branch || !semester) {
      return res.status(400).json({ success: false, message: 'Name, code, branch and semester are required' });
    }

    // Ensure branch exists
    const branchDoc = await Branch.findById(branch);
    if (!branchDoc) {
      return res.status(400).json({ success: false, message: 'Invalid branch' });
    }

    // Check duplicates per branch
    const duplicate = await Subject.findOne({ branch, semester: parseInt(semester), $or: [ { code: code.trim().toUpperCase() }, { name: new RegExp(`^${name.trim()}$`, 'i') } ] });
    if (duplicate) {
      return res.status(400).json({ success: false, message: 'Subject with this name or code already exists for this branch and semester' });
    }

    const subject = await Subject.create({
      name: name.trim(),
      code: code.trim().toUpperCase(),
      branch,
      semester: parseInt(semester),
      description: description?.trim(),
      createdBy: req.user.id
    });

    const populated = await Subject.findById(subject._id)
      .populate('branch', 'name code')
      .populate('createdBy', 'username name email');

    req.io.emit('subjectAdded', populated);

    res.status(201).json({ success: true, message: 'Subject created', data: populated });
  } catch (error) {
    console.error('Error creating subject:', error);
    if (error.code === 11000) {
      return res.status(400).json({ success: false, message: 'Duplicate subject for this branch' });
    }
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Update subject
router.put('/:id', auth, authorize(['admin', 'head_admin']), async (req, res) => {
  try {
  const { name, code, branch, description, isActive, semester } = req.body;

    const subject = await Subject.findById(req.params.id);
    if (!subject) return res.status(404).json({ success: false, message: 'Subject not found' });

    if (branch) {
      const branchDoc = await Branch.findById(branch);
      if (!branchDoc) return res.status(400).json({ success: false, message: 'Invalid branch' });
      subject.branch = branch;
    }
    if (name !== undefined) subject.name = name.trim();
    if (code !== undefined) subject.code = code.trim().toUpperCase();
    if (description !== undefined) subject.description = description?.trim();
    if (isActive !== undefined) subject.isActive = !!isActive;
  if (semester !== undefined) subject.semester = parseInt(semester);

    // Duplicate check (excluding current)
    const dup = await Subject.findOne({
      _id: { $ne: subject._id },
  branch: subject.branch,
  semester: subject.semester,
      $or: [
        { code: subject.code },
        { name: new RegExp(`^${subject.name}$`, 'i') }
      ]
    });
    if (dup) {
  return res.status(400).json({ success: false, message: 'Another subject with same name or code exists for this branch and semester' });
    }

    await subject.save();
    const updated = await Subject.findById(subject._id)
      .populate('branch', 'name code')
      .populate('createdBy', 'username name email');

    req.io.emit('subjectUpdated', updated);

    res.json({ success: true, message: 'Subject updated', data: updated });
  } catch (error) {
    console.error('Error updating subject:', error);
    if (error.code === 11000) {
      return res.status(400).json({ success: false, message: 'Duplicate subject for this branch' });
    }
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Soft delete (deactivate) subject
router.delete('/:id', auth, authorize(['admin', 'head_admin']), async (req, res) => {
  try {
    const subject = await Subject.findById(req.params.id);
    if (!subject) return res.status(404).json({ success: false, message: 'Subject not found' });
    subject.isActive = false;
    await subject.save();
    req.io.emit('subjectDeleted', { id: subject._id });
    res.json({ success: true, message: 'Subject deactivated' });
  } catch (error) {
    console.error('Error deleting subject:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Permanent delete
router.delete('/:id/permanent', auth, authorize(['admin', 'head_admin']), async (req, res) => {
  try {
    const subject = await Subject.findByIdAndDelete(req.params.id);
    if (!subject) return res.status(404).json({ success: false, message: 'Subject not found' });
    res.json({ success: true, message: 'Subject permanently deleted' });
  } catch (error) {
    console.error('Error permanently deleting subject:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

module.exports = router;
