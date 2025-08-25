const Result = require('../models/Result');
const Student = require('../models/Student');

// Get student results
const getStudentResults = async (req, res) => {
  try {
    const { studentId } = req.params;
    const { semester, academicYear } = req.query;
    
    // Build query
    const query = { studentId };
    if (semester) query.semester = semester;
    if (academicYear) query.academicYear = academicYear;
    
    const results = await Result.find(query)
      .populate('studentId', 'firstName lastName regdNo')
      .sort({ semester: 1, academicYear: -1 });
    
    if (!results || results.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'No results found for this student'
      });
    }
    
    // Calculate overall CGPA
    let totalCredits = 0;
    let totalGradePoints = 0;
    
    results.forEach(result => {
      if (result.status === 'Pass') {
        totalCredits += result.earnedCredits;
        totalGradePoints += result.sgpa * result.earnedCredits;
      }
    });
    
    const overallCGPA = totalCredits > 0 ? (totalGradePoints / totalCredits).toFixed(2) : 0;
    
    res.status(200).json({
      success: true,
      data: {
        results,
        summary: {
          totalSemesters: results.length,
          totalCredits,
          overallCGPA,
          passedSemesters: results.filter(r => r.status === 'Pass').length,
          failedSemesters: results.filter(r => r.status === 'Fail').length
        }
      }
    });
    
  } catch (error) {
    console.error('Error fetching student results:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching student results',
      error: error.message
    });
  }
};

// Get result by semester
const getResultBySemester = async (req, res) => {
  try {
    const { studentId, semester } = req.params;
    const { academicYear } = req.query;
    
    const query = { studentId, semester };
    if (academicYear) query.academicYear = academicYear;
    
    const result = await Result.findOne(query)
      .populate('studentId', 'firstName lastName regdNo branch');
    
    if (!result) {
      return res.status(404).json({
        success: false,
        message: 'Result not found for this semester'
      });
    }
    
    res.status(200).json({
      success: true,
      data: result
    });
    
  } catch (error) {
    console.error('Error fetching semester result:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching semester result',
      error: error.message
    });
  }
};

// Create or update result
const createOrUpdateResult = async (req, res) => {
  try {
    const { studentId, semester, subjects, academicYear } = req.body;
    
    // Validate student exists
    const student = await Student.findById(studentId);
    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student not found'
      });
    }
    
    // Check if result already exists
    const existingResult = await Result.findOne({ studentId, semester, academicYear });
    
    if (existingResult) {
      // Update existing result
      existingResult.subjects = subjects;
      await existingResult.save();
      
      res.status(200).json({
        success: true,
        message: 'Result updated successfully',
        data: existingResult
      });
    } else {
      // Create new result
      const newResult = new Result({
        studentId,
        semester,
        subjects,
        academicYear,
        publishedDate: new Date()
      });
      
      await newResult.save();
      
      res.status(201).json({
        success: true,
        message: 'Result created successfully',
        data: newResult
      });
    }
    
  } catch (error) {
    console.error('Error creating/updating result:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating/updating result',
      error: error.message
    });
  }
};

// Delete result
const deleteResult = async (req, res) => {
  try {
    const { resultId } = req.params;
    
    const result = await Result.findByIdAndDelete(resultId);
    
    if (!result) {
      return res.status(404).json({
        success: false,
        message: 'Result not found'
      });
    }
    
    res.status(200).json({
      success: true,
      message: 'Result deleted successfully'
    });
    
  } catch (error) {
    console.error('Error deleting result:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting result',
      error: error.message
    });
  }
};

// Get class-wise results (for admin)
const getClassResults = async (req, res) => {
  try {
    const { branchId, semester, academicYear } = req.query;
    
    // Build aggregation pipeline
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
    
    pipeline.push({
      $sort: { 'student.regdNo': 1, semester: 1 }
    });
    
    const results = await Result.aggregate(pipeline);
    
    res.status(200).json({
      success: true,
      data: results
    });
    
  } catch (error) {
    console.error('Error fetching class results:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching class results',
      error: error.message
    });
  }
};

module.exports = {
  getStudentResults,
  getResultBySemester,
  createOrUpdateResult,
  deleteResult,
  getClassResults
};
