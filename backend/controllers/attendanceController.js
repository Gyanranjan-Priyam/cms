const Attendance = require('../models/Attendance');
const Student = require('../models/Student');

// Get student attendance
const getStudentAttendance = async (req, res) => {
  try {
    const { studentId } = req.params;
    const { semester, academicYear } = req.query;
    
    // Build query
    const query = { studentId };
    if (semester) query.semester = semester;
    if (academicYear) query.academicYear = academicYear;
    
    const attendance = await Attendance.find(query)
      .populate('studentId', 'firstName lastName regdNo')
      .sort({ semester: 1, academicYear: -1 });
    
    if (!attendance || attendance.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'No attendance records found for this student'
      });
    }
    
    // Calculate overall statistics
    let totalClasses = 0;
    let totalAttended = 0;
    
    attendance.forEach(record => {
      totalClasses += record.overallAttendance.totalClasses;
      totalAttended += record.overallAttendance.attendedClasses;
    });
    
    const overallPercentage = totalClasses > 0 ? ((totalAttended / totalClasses) * 100).toFixed(2) : 0;
    
    res.status(200).json({
      success: true,
      data: {
        attendance,
        summary: {
          totalSemesters: attendance.length,
          totalClasses,
          totalAttended,
          overallPercentage,
          status: overallPercentage >= 75 ? 'Good' : 'Poor'
        }
      }
    });
    
  } catch (error) {
    console.error('Error fetching student attendance:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching student attendance',
      error: error.message
    });
  }
};

// Get attendance by semester
const getAttendanceBySemester = async (req, res) => {
  try {
    const { studentId, semester } = req.params;
    const { academicYear } = req.query;
    
    const query = { studentId, semester };
    if (academicYear) query.academicYear = academicYear;
    
    const attendance = await Attendance.findOne(query)
      .populate('studentId', 'firstName lastName regdNo branch');
    
    if (!attendance) {
      return res.status(404).json({
        success: false,
        message: 'Attendance record not found for this semester'
      });
    }
    
    res.status(200).json({
      success: true,
      data: attendance
    });
    
  } catch (error) {
    console.error('Error fetching semester attendance:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching semester attendance',
      error: error.message
    });
  }
};

// Mark daily attendance
const markDailyAttendance = async (req, res) => {
  try {
    const { studentId, date, subjects } = req.body;
    
    // Validate student exists
    const student = await Student.findById(studentId);
    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student not found'
      });
    }
    
    const attendanceDate = new Date(date);
    const semester = student.semester;
    const academicYear = new Date().getFullYear().toString();
    
    // Find or create attendance record for the semester
    let attendanceRecord = await Attendance.findOne({
      studentId,
      semester,
      academicYear
    });
    
    if (!attendanceRecord) {
      attendanceRecord = new Attendance({
        studentId,
        semester,
        academicYear,
        subjects: [],
        dailyAttendance: []
      });
    }
    
    // Check if attendance for this date already exists
    const existingDayIndex = attendanceRecord.dailyAttendance.findIndex(
      day => day.date.toDateString() === attendanceDate.toDateString()
    );
    
    if (existingDayIndex !== -1) {
      // Update existing day attendance
      attendanceRecord.dailyAttendance[existingDayIndex].subjects = subjects;
    } else {
      // Add new day attendance
      attendanceRecord.dailyAttendance.push({
        date: attendanceDate,
        subjects
      });
    }
    
    // Update subject-wise attendance counts
    subjects.forEach(subjectAttendance => {
      const subjectIndex = attendanceRecord.subjects.findIndex(
        sub => sub.subjectCode === subjectAttendance.subjectCode
      );
      
      if (subjectIndex !== -1) {
        // Update existing subject
        if (existingDayIndex === -1) {
          // Only increment if it's a new day
          attendanceRecord.subjects[subjectIndex].totalClasses += 1;
          if (subjectAttendance.status === 'Present') {
            attendanceRecord.subjects[subjectIndex].attendedClasses += 1;
          }
        } else {
          // Recalculate for existing day
          const wasPresent = attendanceRecord.dailyAttendance[existingDayIndex].subjects
            .find(s => s.subjectCode === subjectAttendance.subjectCode)?.status === 'Present';
          const isPresent = subjectAttendance.status === 'Present';
          
          if (!wasPresent && isPresent) {
            attendanceRecord.subjects[subjectIndex].attendedClasses += 1;
          } else if (wasPresent && !isPresent) {
            attendanceRecord.subjects[subjectIndex].attendedClasses -= 1;
          }
        }
      } else {
        // Add new subject
        attendanceRecord.subjects.push({
          subjectCode: subjectAttendance.subjectCode,
          subjectName: subjectAttendance.subjectName,
          totalClasses: 1,
          attendedClasses: subjectAttendance.status === 'Present' ? 1 : 0
        });
      }
    });
    
    await attendanceRecord.save();
    
    res.status(200).json({
      success: true,
      message: 'Attendance marked successfully',
      data: attendanceRecord
    });
    
  } catch (error) {
    console.error('Error marking attendance:', error);
    res.status(500).json({
      success: false,
      message: 'Error marking attendance',
      error: error.message
    });
  }
};

// Get daily attendance
const getDailyAttendance = async (req, res) => {
  try {
    const { studentId } = req.params;
    const { date, semester, academicYear } = req.query;
    
    const query = { studentId };
    if (semester) query.semester = semester;
    if (academicYear) query.academicYear = academicYear;
    
    const attendance = await Attendance.findOne(query);
    
    if (!attendance) {
      return res.status(404).json({
        success: false,
        message: 'No attendance record found'
      });
    }
    
    let dailyRecord = null;
    if (date) {
      const searchDate = new Date(date);
      dailyRecord = attendance.dailyAttendance.find(
        day => day.date.toDateString() === searchDate.toDateString()
      );
    }
    
    res.status(200).json({
      success: true,
      data: {
        dailyRecord,
        fullRecord: attendance
      }
    });
    
  } catch (error) {
    console.error('Error fetching daily attendance:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching daily attendance',
      error: error.message
    });
  }
};

// Get class attendance (for admin)
const getClassAttendance = async (req, res) => {
  try {
    const { branchId, semester, academicYear, date } = req.query;
    
    const pipeline = [
      {
        $lookup: {
          from: 'students',
          localField: 'studentId',
          foreignField: '_id',
          as: 'student'
        }
      },
      {
        $unwind: '$student'
      }
    ];
    
    // Add filters
    const matchConditions = {};
    if (semester) matchConditions.semester = parseInt(semester);
    if (academicYear) matchConditions.academicYear = academicYear;
    if (branchId) matchConditions['student.branch'] = branchId;
    
    if (Object.keys(matchConditions).length > 0) {
      pipeline.push({ $match: matchConditions });
    }
    
    if (date) {
      pipeline.push({
        $addFields: {
          dailyRecord: {
            $filter: {
              input: '$dailyAttendance',
              as: 'day',
              cond: {
                $eq: [
                  { $dateToString: { format: '%Y-%m-%d', date: '$$day.date' } },
                  date
                ]
              }
            }
          }
        }
      });
    }
    
    pipeline.push({
      $sort: { 'student.regdNo': 1 }
    });
    
    const attendance = await Attendance.aggregate(pipeline);
    
    res.status(200).json({
      success: true,
      data: attendance
    });
    
  } catch (error) {
    console.error('Error fetching class attendance:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching class attendance',
      error: error.message
    });
  }
};

// Update attendance record
const updateAttendanceRecord = async (req, res) => {
  try {
    const { attendanceId } = req.params;
    const updateData = req.body;
    
    const attendance = await Attendance.findByIdAndUpdate(
      attendanceId,
      updateData,
      { new: true, runValidators: true }
    );
    
    if (!attendance) {
      return res.status(404).json({
        success: false,
        message: 'Attendance record not found'
      });
    }
    
    res.status(200).json({
      success: true,
      message: 'Attendance record updated successfully',
      data: attendance
    });
    
  } catch (error) {
    console.error('Error updating attendance record:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating attendance record',
      error: error.message
    });
  }
};

module.exports = {
  getStudentAttendance,
  getAttendanceBySemester,
  markDailyAttendance,
  getDailyAttendance,
  getClassAttendance,
  updateAttendanceRecord
};
