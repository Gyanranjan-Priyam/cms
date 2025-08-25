/**
 * University Management System Setup Script
 * 
 * This script sets up the complete university management system according to the hierarchy:
 * 1. Admin (Head of system) - Can create departments and faculty
 * 2. Student Management Dashboard - Manages all student records
 * 3. Finance Department - Handles payments and transactions
 * 4. Faculty Dashboard - Manages timetables, marks, and attendance
 * 5. Student Dashboard - View personal info, marks, attendance, and payments
 */

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./models/User');
const Department = require('./models/Department');
const Branch = require('./models/Branch');
const Student = require('./models/Student');
const Payment = require('./models/Payment');
const Timetable = require('./models/Timetable');

require('dotenv').config();

async function setupUniversityManagementSystem() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/college_management');
    console.log('📊 Connected to MongoDB');

    console.log('\n🏛️  Setting up University Management System...\n');

    // ===================
    // 1. CREATE ADMIN USERS
    // ===================
    console.log('👨‍💼 Creating Admin Users...');

    // Head Admin
    const headAdmin = await User.findOne({ username: 'admin' }) || await User.create({
      username: 'admin',
      password: 'admin123',
      role: 'admin',
      name: 'System Administrator',
      email: 'admin@university.edu',
      employeeId: 'ADMIN001',
      department: 'Administration',
      designation: 'Head Administrator'
    });
    console.log('✅ Head Admin created: admin/admin123');

    // Student Management Admin
    const studentAdmin = await User.findOne({ username: 'student_admin' }) || await User.create({
      username: 'student_admin',
      password: 'student123',
      role: 'student_management',
      name: 'Student Records Manager',
      email: 'studentadmin@university.edu',
      employeeId: 'STD001',
      department: 'Student Affairs',
      designation: 'Student Records Administrator',
      createdBy: headAdmin._id
    });
    console.log('✅ Student Management Admin created: student_admin/student123');

    // Finance Officer
    const financeOfficer = await User.findOne({ username: 'finance_officer' }) || await User.create({
      username: 'finance_officer',
      password: 'finance123',
      role: 'finance_officer',
      name: 'Finance Department Head',
      email: 'finance@university.edu',
      employeeId: 'FIN001',
      department: 'Finance',
      designation: 'Finance Officer',
      createdBy: headAdmin._id
    });
    console.log('✅ Finance Officer created: finance_officer/finance123');

    // ===================
    // 2. CREATE DEPARTMENTS
    // ===================
    console.log('\n🏢 Creating Departments...');

    const departments = [
      {
        name: 'Computer Science and Engineering',
        code: 'CSE',
        description: 'Department of Computer Science and Engineering'
      },
      {
        name: 'Information Technology',
        code: 'IT',
        description: 'Department of Information Technology'
      },
      {
        name: 'Electronics and Communication',
        code: 'ECE',
        description: 'Department of Electronics and Communication Engineering'
      },
      {
        name: 'Mechanical Engineering',
        code: 'ME',
        description: 'Department of Mechanical Engineering'
      },
      {
        name: 'Civil Engineering',
        code: 'CE',
        description: 'Department of Civil Engineering'
      }
    ];

    const createdDepartments = [];
    for (const deptData of departments) {
      const existing = await Department.findOne({ code: deptData.code });
      if (!existing) {
        const dept = await Department.create({
          ...deptData,
          createdBy: headAdmin._id
        });
        createdDepartments.push(dept);
        console.log(`✅ Department created: ${dept.name} (${dept.code})`);
      } else {
        createdDepartments.push(existing);
        console.log(`⚠️  Department exists: ${existing.name} (${existing.code})`);
      }
    }

    // ===================
    // 3. CREATE BRANCHES
    // ===================
    console.log('\n🌳 Creating Branches...');

    const branches = [
      {
        name: 'Computer Science and Engineering',
        code: 'CSE',
        description: 'Bachelor of Technology in Computer Science and Engineering',
        department: createdDepartments.find(d => d.code === 'CSE')._id,
        duration: 4,
        totalSemesters: 8,
        academicFees: 80000,
        hostelFees: 30000,
        otherFees: 10000,
        createdBy: headAdmin._id
      },
      {
        name: 'Information Technology',
        code: 'IT',
        description: 'Bachelor of Technology in Information Technology',
        department: createdDepartments.find(d => d.code === 'IT')._id,
        duration: 4,
        totalSemesters: 8,
        academicFees: 75000,
        hostelFees: 30000,
        otherFees: 8000,
        createdBy: headAdmin._id
      },
      {
        name: 'Electronics and Communication Engineering',
        code: 'ECE',
        description: 'Bachelor of Technology in Electronics and Communication Engineering',
        department: createdDepartments.find(d => d.code === 'ECE')._id,
        duration: 4,
        totalSemesters: 8,
        academicFees: 70000,
        hostelFees: 30000,
        otherFees: 12000,
        createdBy: headAdmin._id
      },
      {
        name: 'Mechanical Engineering',
        code: 'ME',
        description: 'Bachelor of Technology in Mechanical Engineering',
        department: createdDepartments.find(d => d.code === 'ME')._id,
        duration: 4,
        totalSemesters: 8,
        academicFees: 65000,
        hostelFees: 30000,
        otherFees: 15000,
        createdBy: headAdmin._id
      }
    ];

    const createdBranches = [];
    for (const branchData of branches) {
      const existing = await Branch.findOne({ code: branchData.code });
      if (!existing) {
        const branch = await Branch.create(branchData);
        createdBranches.push(branch);
        console.log(`✅ Branch created: ${branch.name} (${branch.code})`);
      } else {
        createdBranches.push(existing);
        console.log(`⚠️  Branch exists: ${existing.name} (${existing.code})`);
      }
    }

    // ===================
    // 4. CREATE FACULTY MEMBERS
    // ===================
    console.log('\n👩‍🏫 Creating Faculty Members...');

    const facultyMembers = [
      {
        username: 'prof_kumar',
        password: 'faculty123',
        name: 'Dr. Rajesh Kumar',
        email: 'rajesh.kumar@university.edu',
        employeeId: 'FAC001',
        department: createdDepartments.find(d => d.code === 'CSE')._id,
        designation: 'Professor',
        facultyDepartment: 'Computer Science',
        specialization: 'Data Structures and Algorithms',
        experience: 15
      },
      {
        username: 'prof_sharma',
        password: 'faculty123',
        name: 'Dr. Priya Sharma',
        email: 'priya.sharma@university.edu',
        employeeId: 'FAC002',
        department: createdDepartments.find(d => d.code === 'IT')._id,
        designation: 'Associate Professor',
        facultyDepartment: 'Information Technology',
        specialization: 'Web Development',
        experience: 8
      },
      {
        username: 'prof_singh',
        password: 'faculty123',
        name: 'Dr. Amit Singh',
        email: 'amit.singh@university.edu',
        employeeId: 'FAC003',
        department: createdDepartments.find(d => d.code === 'ECE')._id,
        designation: 'Assistant Professor',
        facultyDepartment: 'Electronics',
        specialization: 'Digital Signal Processing',
        experience: 5
      }
    ];

    for (const facultyData of facultyMembers) {
      const existing = await User.findOne({ username: facultyData.username });
      if (!existing) {
        await User.createFaculty(facultyData, headAdmin._id);
        console.log(`✅ Faculty created: ${facultyData.name} (${facultyData.username})`);
      } else {
        console.log(`⚠️  Faculty exists: ${existing.name} (${existing.username})`);
      }
    }

    // ===================
    // 5. CREATE SAMPLE STUDENTS
    // ===================
    console.log('\n🎓 Creating Sample Students...');

    const sampleStudents = [
      {
        regdNo: 'CSE2024001',
        firstName: 'Rahul',
        lastName: 'Verma',
        email: 'rahul.verma@student.university.edu',
        phone: '9876543210',
        dateOfBirth: new Date('2004-05-15'),
        branch: createdBranches.find(b => b.code === 'CSE')._id,
        department: createdDepartments.find(d => d.code === 'CSE')._id,
        semester: 3,
        section: 'A',
        academicYear: '2024',
        gender: 'Male',
        category: 'General',
        fatherName: 'Mr. Suresh Verma',
        motherName: 'Mrs. Sunita Verma',
        guardianPhone: '9876543211',
        feeDetails: {
          tuitionFee: 80000,
          labFee: 10000,
          libraryFee: 2000,
          examFee: 3000
        }
      },
      {
        regdNo: 'IT2024001',
        firstName: 'Priya',
        lastName: 'Patel',
        email: 'priya.patel@student.university.edu',
        phone: '9876543220',
        dateOfBirth: new Date('2004-08-22'),
        branch: createdBranches.find(b => b.code === 'IT')._id,
        department: createdDepartments.find(d => d.code === 'IT')._id,
        semester: 3,
        section: 'A',
        academicYear: '2024',
        gender: 'Female',
        category: 'OBC',
        fatherName: 'Mr. Ramesh Patel',
        motherName: 'Mrs. Meera Patel',
        guardianPhone: '9876543221',
        feeDetails: {
          tuitionFee: 75000,
          labFee: 8000,
          libraryFee: 2000,
          examFee: 3000
        }
      },
      {
        regdNo: 'ECE2024001',
        firstName: 'Amit',
        lastName: 'Singh',
        email: 'amit.singh@student.university.edu',
        phone: '9876543230',
        dateOfBirth: new Date('2004-12-10'),
        branch: createdBranches.find(b => b.code === 'ECE')._id,
        department: createdDepartments.find(d => d.code === 'ECE')._id,
        semester: 3,
        section: 'A',
        academicYear: '2024',
        gender: 'Male',
        category: 'SC',
        fatherName: 'Mr. Vijay Singh',
        motherName: 'Mrs. Kavita Singh',
        guardianPhone: '9876543231',
        feeDetails: {
          tuitionFee: 70000,
          labFee: 12000,
          libraryFee: 2000,
          examFee: 3000
        }
      }
    ];

    for (const studentData of sampleStudents) {
      const existing = await Student.findOne({ regdNo: studentData.regdNo });
      if (!existing) {
        studentData.createdBy = studentAdmin._id;
        await Student.create(studentData);
        console.log(`✅ Student created: ${studentData.firstName} ${studentData.lastName} (${studentData.regdNo})`);
      } else {
        console.log(`⚠️  Student exists: ${existing.firstName} ${existing.lastName} (${existing.regdNo})`);
      }
    }

    // ===================
    // 6. CREATE SAMPLE PAYMENTS
    // ===================
    console.log('\n💳 Creating Sample Payment Records...');

    const students = await Student.find().limit(3);
    
    for (const student of students) {
      const existingPayment = await Payment.findOne({ student: student._id });
      if (!existingPayment) {
        await Payment.create({
          student: student._id,
          amount: student.feeDetails.totalAnnualFee * 0.5, // 50% of annual fee
          paymentType: 'academic',
          description: 'First semester fee payment',
          academicYear: student.academicYear,
          semester: student.semester,
          paymentMethod: 'online',
          status: 'completed',
          paidDate: new Date()
        });
        console.log(`✅ Payment created for: ${student.firstName} ${student.lastName}`);
      }
    }

    // ===================
    // 7. CREATE SAMPLE TIMETABLES
    // ===================
    console.log('\n📅 Creating Sample Timetables...');

    const faculty = await User.find({ role: 'faculty' });
    const subjects = [
      'Data Structures',
      'Database Management',
      'Web Development',
      'Computer Networks',
      'Software Engineering'
    ];

    for (let i = 0; i < faculty.length; i++) {
      const existingTimetable = await Timetable.findOne({ facultyId: faculty[i]._id });
      if (!existingTimetable) {
        await Timetable.create({
          facultyId: faculty[i]._id,
          subject: subjects[i % subjects.length],
          subjectCode: `CS${300 + i}`,
          semester: 3,
          branch: createdBranches.find(b => b.code === 'CSE').name,
          section: 'A',
          day: 'Monday',
          startTime: `${9 + i}:00`,
          endTime: `${10 + i}:00`,
          roomNumber: `R${101 + i}`,
          classType: 'Lecture',
          academicYear: '2024',
          isActive: true
        });
        console.log(`✅ Timetable created for: ${faculty[i].name} - ${subjects[i % subjects.length]}`);
      }
    }

    console.log('\n🎉 University Management System Setup Complete!\n');

    // ===================
    // SUMMARY
    // ===================
    console.log('📋 SYSTEM ACCESS CREDENTIALS:');
    console.log('===============================');
    console.log('👨‍💼 HEAD ADMIN');
    console.log('   Username: admin');
    console.log('   Password: admin123');
    console.log('   Role: Create departments, manage faculty');
    console.log('');
    console.log('📊 STUDENT MANAGEMENT');
    console.log('   Username: student_admin');
    console.log('   Password: student123');
    console.log('   Role: Manage all student records');
    console.log('');
    console.log('💰 FINANCE DEPARTMENT');
    console.log('   Username: finance_officer');
    console.log('   Password: finance123');
    console.log('   Role: Manage payments and financial records');
    console.log('');
    console.log('👩‍🏫 FACULTY MEMBERS');
    console.log('   Username: prof_kumar, prof_sharma, prof_singh');
    console.log('   Password: faculty123 (for all)');
    console.log('   Role: Manage timetables, marks, and attendance');
    console.log('');
    console.log('🎓 SAMPLE STUDENTS CREATED');
    console.log('   - Rahul Verma (CSE2024001)');
    console.log('   - Priya Patel (IT2024001)');
    console.log('   - Amit Singh (ECE2024001)');
    console.log('');
    console.log('🏛️  DEPARTMENTS CREATED');
    console.log('   - Computer Science and Engineering (CSE)');
    console.log('   - Information Technology (IT)');
    console.log('   - Electronics and Communication (ECE)');
    console.log('   - Mechanical Engineering (ME)');
    console.log('   - Civil Engineering (CE)');
    console.log('');
    console.log('🌐 API ENDPOINTS:');
    console.log('==================');
    console.log('Admin Routes:           /api/admin/*');
    console.log('Student Management:     /api/student-management/*');
    console.log('Finance Department:     /api/finance/*');
    console.log('Faculty Dashboard:      /api/faculty-dashboard/*');
    console.log('Student Dashboard:      /api/dashboard/*');
    console.log('Authentication:         /api/auth/*');

  } catch (error) {
    console.error('❌ Error setting up University Management System:', error);
  } finally {
    mongoose.connection.close();
    console.log('\n📊 Database connection closed');
  }
}

// Run the setup
setupUniversityManagementSystem();
