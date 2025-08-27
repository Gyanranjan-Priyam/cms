const express = require('express');
const Result = require('../models/Result');
const Student = require('../models/Student');
const Subject = require('../models/Subject');
const { auth, authorize } = require('../middleware/auth');

const router = express.Router();

// Helper: compute grade metrics
function computeForSubjects(subjects = []) {
  return subjects.map(s => {
    const max = s.maxMarks || 100;
    const marks = Math.max(0, Math.min(s.marksObtained ?? 0, max));
    const percentage = Math.round((marks / max) * 10000) / 100; // 2 decimals
    let grade = 'F';
    let gradePoint = 0;
    if (percentage >= 90) { grade = 'O'; gradePoint = 10; }
    else if (percentage >= 80) { grade = 'E'; gradePoint = 9; }
    else if (percentage >= 70) { grade = 'A'; gradePoint = 8; }
    else if (percentage >= 60) { grade = 'B'; gradePoint = 7; }
    else if (percentage >= 50) { grade = 'C'; gradePoint = 6; }
    else if (percentage >= 40) { grade = 'D'; gradePoint = 5; }
    else { grade = 'F'; gradePoint = 0; }
    return {
      ...s,
      marksObtained: marks,
      maxMarks: max,
      percentage,
      grade,
      gradePoint,
      credits: s.credits ?? 3
    };
  });
}

function computeSgpa(subjects = []) {
  let totalCredits = 0;
  let earnedCredits = 0;
  let totalGradePoints = 0;
  subjects.forEach(s => {
    const credits = Number(s.credits || 0);
    totalCredits += credits;
    if (s.grade !== 'F') earnedCredits += credits;
    totalGradePoints += credits * Number(s.gradePoint || 0);
  });
  const sgpa = totalCredits > 0 ? Math.round((totalGradePoints / totalCredits) * 100) / 100 : 0;
  const status = subjects.some(s => s.grade === 'F') ? 'Fail' : 'Pass';
  return { sgpa, totalCredits, earnedCredits, status };
}

// Create or update a student's semester result
router.post('/', auth, authorize(['admin', 'head_admin', 'student_management']), async (req, res) => {
  try {
    const { studentId, semester, academicYear, subjects } = req.body;
    if (!studentId || !semester || !academicYear || !Array.isArray(subjects)) {
      return res.status(400).json({ success: false, message: 'studentId, semester, academicYear and subjects[] are required' });
    }

    const student = await Student.findById(studentId).populate('branch');
    if (!student) return res.status(404).json({ success: false, message: 'Student not found' });

    // Normalize subjects with name/code from Subject model if subject ids are provided
    const normalized = [];
    for (const item of subjects) {
      let subjDoc = null;
      if (item.subject) {
        subjDoc = await Subject.findById(item.subject);
      } else if (item.code && student.branch) {
        subjDoc = await Subject.findOne({ code: String(item.code).toUpperCase(), branch: student.branch._id, semester: Number(semester) });
      }

      const base = {
        subject: subjDoc?._id || item.subject || undefined,
        name: subjDoc?.name || item.name,
        code: subjDoc?.code || (item.code ? String(item.code).toUpperCase() : undefined),
        marksObtained: Number(item.marksObtained ?? 0),
        maxMarks: Number(item.maxMarks ?? 100),
        credits: Number(item.credits ?? 3)
      };
      if (!base.name || !base.code) {
        return res.status(400).json({ success: false, message: 'Each subject must have name and code (or valid subject id)' });
      }
      normalized.push(base);
    }

    const computedSubjects = computeForSubjects(normalized);
    const { sgpa, totalCredits, earnedCredits, status } = computeSgpa(computedSubjects);

    const update = {
      subjects: computedSubjects,
      sgpa,
      totalCredits,
      earnedCredits,
      status
    };

    const opts = { new: true, upsert: true, setDefaultsOnInsert: true };
    const result = await Result.findOneAndUpdate(
      { studentId, semester, academicYear },
      { $set: update, $setOnInsert: { studentId, semester, academicYear } },
      opts
    ).populate('studentId', 'firstName lastName regdNo branch');

    return res.status(200).json({ success: true, data: result });
  } catch (error) {
    console.error('Result create/update error:', error);
    return res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
});

// Class-level publish before id-specific publish to avoid route conflicts
router.post('/class/publish', auth, authorize(['admin', 'head_admin']), async (req, res) => {
  try {
    const { branchId, semester, academicYear } = req.body;
    if (!branchId || !semester || !academicYear) {
      return res.status(400).json({ success: false, message: 'branchId, semester and academicYear are required' });
    }
    const students = await Student.find({ branch: branchId, semester: Number(semester), isActive: true }).select('_id');
    const ids = students.map(s => s._id);
    const result = await Result.updateMany(
      { studentId: { $in: ids }, semester: Number(semester), academicYear },
      { $set: { published: true, publishedDate: new Date() } }
    );
    res.json({ success: true, matched: result.matchedCount ?? result.n, modified: result.modifiedCount ?? result.nModified });
  } catch (error) {
    console.error('Bulk publish error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Class-level unpublish
router.post('/class/unpublish', auth, authorize(['admin', 'head_admin']), async (req, res) => {
  try {
    const { branchId, semester, academicYear } = req.body;
    if (!branchId || !semester || !academicYear) {
      return res.status(400).json({ success: false, message: 'branchId, semester and academicYear are required' });
    }
    const students = await Student.find({ branch: branchId, semester: Number(semester), isActive: true }).select('_id');
    const ids = students.map(s => s._id);
    const result = await Result.updateMany(
      { studentId: { $in: ids }, semester: Number(semester), academicYear },
      { $set: { published: false, publishedDate: null } }
    );
    res.json({ success: true, matched: result.matchedCount ?? result.n, modified: result.modifiedCount ?? result.nModified });
  } catch (error) {
    console.error('Bulk unpublish error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Publish or unpublish a single result by id
router.post('/:id/publish', auth, authorize(['admin', 'head_admin']), async (req, res) => {
  try {
    const { published } = req.body;
    const result = await Result.findById(req.params.id);
    if (!result) return res.status(404).json({ success: false, message: 'Result not found' });
    result.published = !!published;
    result.publishedDate = result.published ? new Date() : null;
    await result.save();
    res.json({ success: true, data: result });
  } catch (error) {
    console.error('Publish error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Get class results by branch and semester
router.get('/class', auth, authorize(['admin', 'head_admin', 'student_management']), async (req, res) => {
  try {
    const { branchId, semester, academicYear } = req.query;
    if (!branchId || !semester || !academicYear) {
      return res.status(400).json({ success: false, message: 'branchId, semester and academicYear are required' });
    }

    const students = await Student.find({ branch: branchId, semester: Number(semester), isActive: true }).select('_id firstName lastName regdNo');
    const studentIds = students.map(s => s._id);

    const results = await Result.find({ studentId: { $in: studentIds }, semester: Number(semester), academicYear })
      .populate('studentId', 'firstName lastName regdNo');

    // Ensure all students present (empty results for missing)
    const map = new Map(results.map(r => [String(r.studentId._id), r]));
    const combined = students.map(s => map.get(String(s._id)) || { studentId: s, semester: Number(semester), academicYear, subjects: [], sgpa: 0, status: 'Pending' });

    res.json({ success: true, data: combined });
  } catch (error) {
    console.error('Get class results error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Get student results (summary + per semester)
router.get('/student/:studentId', auth, authorize(['admin', 'head_admin', 'student_management', 'student']), async (req, res) => {
  try {
    const { studentId } = req.params;
    const { academicYear, semester } = req.query;
    const filter = { studentId };

    // Students can only view their own results and only when published
    if (req.user?.role === 'student') {
      if (String(req.user._id) !== String(studentId)) {
        return res.status(403).json({ success: false, message: 'Access denied' });
      }
      filter.published = true;
    }
    if (academicYear) filter.academicYear = academicYear;
    if (semester) filter.semester = Number(semester);

  const results = await Result.find(filter).sort({ semester: 1 }).lean();
    if (!results.length) return res.json({ success: true, data: { results: [], cgpa: 0 } });

    let sum = 0; let count = 0;
    for (const r of results) {
      if (typeof r.sgpa === 'number' && r.subjects?.length) { sum += r.sgpa; count += 1; }
    }
    const cgpa = count > 0 ? Math.round((sum / count) * 100) / 100 : 0;
    res.json({ success: true, data: { results, cgpa } });
  } catch (error) {
    console.error('Get student results error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Export class results as CSV
router.get('/export', auth, authorize(['admin', 'head_admin', 'student_management']), async (req, res) => {
  try {
    const { branchId, semester, academicYear } = req.query;
    if (!branchId || !semester || !academicYear) {
      return res.status(400).json({ success: false, message: 'branchId, semester and academicYear are required' });
    }

    const students = await Student.find({ branch: branchId, semester: Number(semester), isActive: true }).select('_id firstName lastName regdNo');
    const results = await Result.find({ studentId: { $in: students.map(s => s._id) }, semester: Number(semester), academicYear }).populate('studentId', 'firstName lastName regdNo');

    const rows = [];
    for (const r of results) {
      const base = {
        regdNo: r.studentId.regdNo,
        name: `${r.studentId.firstName} ${r.studentId.lastName}`,
        semester: r.semester,
        academicYear: r.academicYear,
        sgpa: r.sgpa,
        status: r.status
      };
      if (!r.subjects?.length) {
        rows.push(base);
        continue;
      }
      r.subjects.forEach((s, idx) => {
        rows.push({
          ...base,
          subjectIndex: idx + 1,
          subjectCode: s.code,
          subjectName: s.name,
          marksObtained: s.marksObtained,
          maxMarks: s.maxMarks,
          percentage: s.percentage,
          grade: s.grade,
          gradePoint: s.gradePoint,
          credits: s.credits
        });
      });
    }

    const headers = Object.keys(rows[0] || { message: 'No data' });
    const csv = [headers.join(',')].concat(rows.map(r => headers.map(h => JSON.stringify(r[h] ?? '')).join(','))).join('\n');
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=class_results_${semester}_${academicYear}.csv`);
    res.send(csv);
  } catch (error) {
    console.error('Export error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Delete a result by student+semester+academicYear (must be before '/:id')
router.delete('/by-student', auth, authorize(['admin', 'head_admin', 'student_management']), async (req, res) => {
  try {
    const { studentId, semester, academicYear } = req.query;
    if (!studentId || !semester || !academicYear) {
      return res.status(400).json({ success: false, message: 'studentId, semester and academicYear are required' });
    }
    const deleted = await Result.findOneAndDelete({ studentId, semester: Number(semester), academicYear });
    if (!deleted) return res.status(404).json({ success: false, message: 'Result not found' });
    res.json({ success: true, message: 'Result deleted permanently' });
  } catch (error) {
    console.error('Delete by student error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Delete a result by id (placed after specific routes)
router.delete('/:id', auth, authorize(['admin', 'head_admin', 'student_management']), async (req, res) => {
  try {
    const deleted = await Result.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ success: false, message: 'Result not found' });
    res.json({ success: true, message: 'Result deleted permanently' });
  } catch (error) {
    console.error('Delete result error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});


module.exports = router;
