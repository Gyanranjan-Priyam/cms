const express = require('express');
const User = require('../models/User');
const Timetable = require('../models/Timetable');
const Marks = require('../models/Marks');
const DailyAttendance = require('../models/DailyAttendance');
const Student = require('../models/Student');
const { auth } = require('../middleware/auth');

const router = express.Router();

// Faculty Dashboard Data
router.get('/dashboard/:facultyId', auth, async (req, res) => {
  try {
    const { facultyId } = req.params;
    
    // Get faculty details
    const faculty = await User.findById(facultyId).select('-password');
    if (!faculty || faculty.role !== 'faculty') {
      return res.status(404).json({ success: false, message: 'Faculty not found' });
    }

    // Get current week timetable
    const currentDate = new Date();
    const weekdays = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const todayName = weekdays[currentDate.getDay()];
    
    const todayTimetable = await Timetable.find({
      facultyId,
      day: todayName,
      isActive: true
    }).sort({ startTime: 1 });

    // Get subjects assigned to faculty
    const assignedSubjects = await Timetable.distinct('subject', { facultyId, isActive: true });
    
    // Get total students under faculty (through timetable)
    const facultyTimetable = await Timetable.find({ facultyId, isActive: true });
    const semesters = [...new Set(facultyTimetable.map(t => t.semester))];
    const branches = [...new Set(facultyTimetable.map(t => t.branch))];
    
    // Get branch IDs from branch names
    const Branch = require('../models/Branch');
    const branchDocs = await Branch.find({ name: { $in: branches } });
    const branchIds = branchDocs.map(b => b._id);
    
    const studentCount = await Student.countDocuments({
      semester: { $in: semesters },
      branch: { $in: branchIds }
    });

    // Get recent attendance stats
    const today = new Date();
    const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    
    const todayAttendance = await DailyAttendance.countDocuments({
      facultyId,
      date: { $gte: todayStart }
    });

    // Get recent marks count
    const recentMarks = await Marks.countDocuments({
      facultyId,
      createdAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } // Last 7 days
    });

    res.json({
      success: true,
      data: {
        faculty: {
          name: faculty.name,
          employeeId: faculty.employeeId,
          department: faculty.department,
          designation: faculty.designation,
          email: faculty.email,
          phone: faculty.phone
        },
        todayTimetable,
        assignedSubjects,
        stats: {
          totalStudents: studentCount,
          todayAttendance,
          recentMarks,
          totalSubjects: assignedSubjects.length
        }
      }
    });
  } catch (error) {
    console.error('Error fetching faculty dashboard:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Get Faculty Timetable
router.get('/timetable/:facultyId', auth, async (req, res) => {
  try {
    const { facultyId } = req.params;
    const { week, semester, branch } = req.query;

    let query = { facultyId, isActive: true };
    
    if (semester) query.semester = parseInt(semester);
    if (branch) query.branch = branch;

    const timetable = await Timetable.find(query).sort({ day: 1, startTime: 1 });

    // Group by day
    const groupedTimetable = {
      Monday: [],
      Tuesday: [],
      Wednesday: [],
      Thursday: [],
      Friday: [],
      Saturday: []
    };

    timetable.forEach(slot => {
      groupedTimetable[slot.day].push(slot);
    });

    res.json({
      success: true,
      data: groupedTimetable
    });
  } catch (error) {
    console.error('Error fetching timetable:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Get Students for Marks/Attendance
router.get('/students/:facultyId', auth, async (req, res) => {
  try {
    const { facultyId } = req.params;
    const { semester, branch, section, subject } = req.query;

    // Build query based on filters
    let query = {};
    
    if (semester) query.semester = parseInt(semester);
    
    // For branch, we need to populate and handle both ObjectId and string cases
    let students;
    if (branch || section) {
      // First, get all students that match semester
      students = await Student.find(query).populate('branch');
      
      // Filter by branch name if provided
      if (branch) {
        students = students.filter(student => 
          student.branch && (student.branch.name === branch || student.branch._id.toString() === branch)
        );
      }
    } else {
      students = await Student.find(query).populate('branch');
    }

    // If subject filter is applied, get only students from faculty's classes
    if (subject) {
      const timetableEntries = await Timetable.find({
        facultyId,
        subject,
        ...(semester && { semester: parseInt(semester) }),
        ...(branch && { branch }),
        ...(section && { section })
      });
      
      if (timetableEntries.length === 0) {
        students = []; // No students if no timetable entry found
      }
    }

    // Format the response
    const formattedStudents = students.map(student => ({
      _id: student._id,
      regdNo: student.regdNo,
      firstName: student.firstName,
      lastName: student.lastName,
      semester: student.semester,
      branch: student.branch ? student.branch.name : 'Unknown',
      section: student.section || 'A', // Default section if not specified
      email: student.email,
      phone: student.phone
    }));

    res.json({
      success: true,
      data: formattedStudents
    });
  } catch (error) {
    console.error('Error fetching students:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Add/Update Marks
router.post('/marks', auth, async (req, res) => {
  try {
    const {
      studentId,
      studentRegNo,
      facultyId,
      subject,
      subjectCode,
      semester,
      branch,
      section,
      examType,
      totalMarks,
      obtainedMarks,
      academicYear,
      dateOfExam,
      remarks
    } = req.body;

    // Check if marks already exist for this combination
    const existingMarks = await Marks.findOne({
      studentId,
      subject,
      examType,
      academicYear
    });

    if (existingMarks) {
      // Update existing marks
      existingMarks.obtainedMarks = obtainedMarks;
      existingMarks.totalMarks = totalMarks;
      existingMarks.remarks = remarks;
      existingMarks.dateOfExam = dateOfExam;
      
      await existingMarks.save();
      
      res.json({
        success: true,
        message: 'Marks updated successfully',
        data: existingMarks
      });
    } else {
      // Create new marks entry
      const newMarks = new Marks({
        studentId,
        studentRegNo,
        facultyId,
        subject,
        subjectCode,
        semester,
        branch,
        section,
        examType,
        totalMarks,
        obtainedMarks,
        academicYear,
        dateOfExam,
        remarks
      });

      await newMarks.save();
      
      res.json({
        success: true,
        message: 'Marks added successfully',
        data: newMarks
      });
    }
  } catch (error) {
    console.error('Error saving marks:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Get Marks
router.get('/marks/:facultyId', auth, async (req, res) => {
  try {
    const { facultyId } = req.params;
    const { semester, branch, section, subject, examType } = req.query;

    let query = { facultyId };
    
    if (semester) query.semester = parseInt(semester);
    if (branch) query.branch = branch;
    if (section) query.section = section;
    if (subject) query.subject = subject;
    if (examType) query.examType = examType;

    const marks = await Marks.find(query)
      .populate('studentId', 'regdNo firstName lastName')
      .sort({ dateOfExam: -1 });

    // Ensure percentage is calculated for all marks
    const processedMarks = marks.map(mark => {
      const markObj = mark.toObject();
      if (!markObj.percentage && markObj.totalMarks && markObj.obtainedMarks !== undefined) {
        markObj.percentage = (markObj.obtainedMarks / markObj.totalMarks) * 100;
      }
      return markObj;
    });

    res.json({
      success: true,
      data: processedMarks
    });
  } catch (error) {
    console.error('Error fetching marks:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Add/Update Attendance
router.post('/attendance', auth, async (req, res) => {
  try {
    const {
      attendanceData, // Array of attendance records
      facultyId,
      subject,
      subjectCode,
      semester,
      branch,
      section,
      date,
      period,
      classType,
      academicYear
    } = req.body;

    const savedAttendance = [];

    for (const record of attendanceData) {
      const { studentId, studentRegNo, status, remarks } = record;

      // Check if attendance already exists for this combination
      const existingAttendance = await DailyAttendance.findOne({
        studentId,
        subject,
        date: new Date(date),
        period,
        academicYear
      });

      if (existingAttendance) {
        // Update existing attendance
        existingAttendance.status = status;
        existingAttendance.remarks = remarks;
        await existingAttendance.save();
        savedAttendance.push(existingAttendance);
      } else {
        // Create new attendance record
        const newAttendance = new DailyAttendance({
          studentId,
          studentRegNo,
          facultyId,
          subject,
          subjectCode,
          semester,
          branch,
          section,
          date: new Date(date),
          period,
          status,
          classType,
          remarks,
          academicYear
        });

        await newAttendance.save();
        savedAttendance.push(newAttendance);
      }
    }

    res.json({
      success: true,
      message: 'Attendance recorded successfully',
      data: savedAttendance
    });
  } catch (error) {
    console.error('Error saving attendance:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Get Attendance
router.get('/attendance/:facultyId', auth, async (req, res) => {
  try {
    const { facultyId } = req.params;
    const { semester, branch, section, subject, date, period } = req.query;

    let query = { facultyId };
    
    if (semester) query.semester = parseInt(semester);
    if (branch) query.branch = branch;
    if (section) query.section = section;
    if (subject) query.subject = subject;
    if (date) query.date = new Date(date);
    if (period) query.period = parseInt(period);

    const attendance = await DailyAttendance.find(query)
      .populate('studentId', 'regdNo firstName lastName')
      .sort({ date: -1, period: 1 });

    res.json({
      success: true,
      data: attendance
    });
  } catch (error) {
    console.error('Error fetching attendance:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Publish Marks (make visible to students)
router.put('/marks/publish/:markId', auth, async (req, res) => {
  try {
    const { markId } = req.params;
    
    const marks = await Marks.findByIdAndUpdate(
      markId,
      { isPublished: true },
      { new: true }
    );

    if (!marks) {
      return res.status(404).json({ success: false, message: 'Marks not found' });
    }

    res.json({
      success: true,
      message: 'Marks published successfully',
      data: marks
    });
  } catch (error) {
    console.error('Error publishing marks:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

module.exports = router;
