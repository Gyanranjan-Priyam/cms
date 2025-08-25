import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Users, 
  Calendar,
  BookOpen,
  Clock,
  MapPin,
  Phone,
  Mail,
  Award,
  LogOut,
  Sun,
  Moon,
  Menu,
  X,
  Home,
  FileText,
  UserCheck
} from 'lucide-react';
import axios from 'axios';
import FacultyTimetable from '../components/FacultyTimetable';
import StudentSection from '../components/StudentSection';

interface User {
  id: string;
  role: string;
  name: string;
  email?: string;
  employeeId?: string;
}

interface FacultyDashboardProps {
  user: User;
  onLogout: () => void;
  getRemainingTime: () => number;
}

interface Faculty {
  name: string;
  employeeId: string;
  department: string;
  designation: string;
  email: string;
  phone: string;
}

interface TimetableSlot {
  _id: string;
  subject: string;
  subjectCode: string;
  semester: number;
  branch: string;
  section: string;
  startTime: string;
  endTime: string;
  roomNumber: string;
  classType: string;
}

interface DashboardStats {
  totalStudents: number;
  todayAttendance: number;
  recentMarks: number;
  totalSubjects: number;
}

const FacultyDashboard: React.FC<FacultyDashboardProps> = ({ user, onLogout }) => {
  const [darkMode, setDarkMode] = useState(false);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [faculty, setFaculty] = useState<Faculty | null>(null);
  const [todayTimetable, setTodayTimetable] = useState<TimetableSlot[]>([]);
  const [assignedSubjects, setAssignedSubjects] = useState<string[]>([]);
  const [stats, setStats] = useState<DashboardStats>({ totalStudents: 0, todayAttendance: 0, recentMarks: 0, totalSubjects: 0 });
  const [loading, setLoading] = useState(true);

  const facultyId = user.id; // Use the user ID from props

  useEffect(() => {
    if (facultyId) {
      fetchDashboardData();
    }
  }, [facultyId]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await axios.get(`http://localhost:5000/api/faculty-dashboard/dashboard/${facultyId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.success) {
        const { faculty, todayTimetable, assignedSubjects, stats } = response.data.data;
        setFaculty(faculty);
        setTodayTimetable(todayTimetable);
        setAssignedSubjects(assignedSubjects);
        setStats(stats);
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const sidebarItems = [
    { id: 'dashboard', label: 'Dashboard', icon: Home },
    { id: 'timetable', label: 'Timetable', icon: Calendar },
    { id: 'students', label: 'Student Section', icon: Users },
  ];

  const getCurrentTimeSlot = () => {
    const now = new Date();
    const currentTime = now.getHours() * 60 + now.getMinutes();
    
    return todayTimetable.find(slot => {
      const [startHour, startMin] = slot.startTime.split(':').map(Number);
      const [endHour, endMin] = slot.endTime.split(':').map(Number);
      const startTime = startHour * 60 + startMin;
      const endTime = endHour * 60 + endMin;
      
      return currentTime >= startTime && currentTime <= endTime;
    });
  };

  const renderDashboard = () => (
    <div className="space-y-6">
      {/* Welcome Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className={`rounded-2xl p-6 ${darkMode ? 'bg-gray-800' : 'bg-white'} shadow-lg border ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}
      >
        <div className="flex items-center justify-between">
          <div>
            <h1 className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
              Welcome back, {faculty?.name || 'Faculty'}!
            </h1>
            <p className={`text-sm mt-1 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              {faculty?.designation} • {faculty?.department} Department
            </p>
          </div>
          <div className="flex items-center space-x-4">
            <div className="text-right">
              <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Employee ID</p>
              <p className={`font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>{faculty?.employeeId}</p>
            </div>
            <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white text-xl font-bold">
              {faculty?.name?.[0] || 'F'}
            </div>
          </div>
        </div>
      </motion.div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: 'Total Students', value: stats.totalStudents, icon: Users, color: 'from-blue-500 to-cyan-500' },
          { label: 'Today Attendance', value: stats.todayAttendance, icon: UserCheck, color: 'from-green-500 to-emerald-500' },
          { label: 'Recent Marks', value: stats.recentMarks, icon: Award, color: 'from-purple-500 to-violet-500' },
          { label: 'Assigned Subjects', value: stats.totalSubjects, icon: BookOpen, color: 'from-orange-500 to-red-500' },
        ].map((stat, index) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className={`rounded-2xl p-6 ${darkMode ? 'bg-gray-800' : 'bg-white'} shadow-lg border ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>{stat.label}</p>
                <p className={`text-2xl font-bold mt-1 ${darkMode ? 'text-white' : 'text-gray-900'}`}>{stat.value}</p>
              </div>
              <div className={`w-12 h-12 bg-gradient-to-r ${stat.color} rounded-lg flex items-center justify-center`}>
                <stat.icon className="w-6 h-6 text-white" />
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Today's Schedule */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className={`rounded-2xl p-6 ${darkMode ? 'bg-gray-800' : 'bg-white'} shadow-lg border ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}
        >
          <div className="flex items-center justify-between mb-6">
            <h3 className={`text-lg font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
              Today's Schedule
            </h3>
            <Calendar className={`w-5 h-5 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`} />
          </div>
          
          <div className="space-y-3">
            {todayTimetable.length > 0 ? (
              todayTimetable.map((slot) => {
                const isCurrent = getCurrentTimeSlot()?._id === slot._id;
                return (
                  <div
                    key={slot._id}
                    className={`p-4 rounded-lg border-l-4 ${
                      isCurrent
                        ? 'border-l-green-500 bg-green-50 dark:bg-green-900/20'
                        : 'border-l-blue-500 bg-blue-50 dark:bg-blue-900/20'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className={`font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                          {slot.subject}
                        </h4>
                        <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                          {slot.semester} Sem • {slot.branch} • Section {slot.section}
                        </p>
                      </div>
                      <div className="text-right">
                        <div className="flex items-center text-sm text-gray-500">
                          <Clock className="w-4 h-4 mr-1" />
                          {slot.startTime} - {slot.endTime}
                        </div>
                        <div className="flex items-center text-sm text-gray-500 mt-1">
                          <MapPin className="w-4 h-4 mr-1" />
                          Room {slot.roomNumber}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="text-center py-8">
                <Calendar className={`w-12 h-12 mx-auto mb-4 ${darkMode ? 'text-gray-600' : 'text-gray-400'}`} />
                <p className={`${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>No classes scheduled for today</p>
              </div>
            )}
          </div>
        </motion.div>

        {/* Quick Info */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className={`rounded-2xl p-6 ${darkMode ? 'bg-gray-800' : 'bg-white'} shadow-lg border ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}
        >
          <div className="flex items-center justify-between mb-6">
            <h3 className={`text-lg font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
              Quick Info
            </h3>
            <FileText className={`w-5 h-5 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`} />
          </div>
          
          <div className="space-y-4">
            <div className="flex items-center space-x-3">
              <Mail className="w-5 h-5 text-blue-500" />
              <div>
                <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Email</p>
                <p className={`font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>{faculty?.email}</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              <Phone className="w-5 h-5 text-green-500" />
              <div>
                <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Phone</p>
                <p className={`font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>{faculty?.phone}</p>
              </div>
            </div>

            <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
              <h4 className={`text-sm font-medium mb-3 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                Assigned Subjects ({assignedSubjects.length})
              </h4>
              <div className="space-y-2">
                {assignedSubjects.slice(0, 4).map((subject, index) => (
                  <div key={index} className="flex items-center space-x-2">
                    <BookOpen className="w-4 h-4 text-purple-500" />
                    <span className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>{subject}</span>
                  </div>
                ))}
                {assignedSubjects.length > 4 && (
                  <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    +{assignedSubjects.length - 4} more subjects
                  </p>
                )}
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className={`min-h-screen ${darkMode ? 'bg-gray-900' : 'bg-gray-50'} flex items-center justify-center`}>
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className={`${darkMode ? 'text-white' : 'text-gray-900'}`}>Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${darkMode ? 'bg-gray-900' : 'bg-gray-50'} flex`}>
      {/* Sidebar */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            initial={{ x: -300 }}
            animate={{ x: 0 }}
            exit={{ x: -300 }}
            className={`fixed lg:relative inset-y-0 left-0 z-50 w-72 ${
              darkMode ? 'bg-gray-800' : 'bg-white'
            } shadow-lg border-r ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}
          >
            {/* Sidebar Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
              <div>
                <h2 className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                  Faculty Portal
                </h2>
                <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  {faculty?.department}
                </p>
              </div>
              <button
                onClick={() => setSidebarOpen(false)}
                className={`lg:hidden p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 ${
                  darkMode ? 'text-gray-400' : 'text-gray-600'
                }`}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Navigation */}
            <nav className="p-6">
              <div className="space-y-2">
                {sidebarItems.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => setActiveTab(item.id)}
                    className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
                      activeTab === item.id
                        ? 'bg-blue-500 text-white'
                        : `${darkMode ? 'text-gray-300 hover:bg-gray-700' : 'text-gray-700 hover:bg-gray-100'}`
                    }`}
                  >
                    <item.icon className="w-5 h-5" />
                    <span className="font-medium">{item.label}</span>
                  </button>
                ))}
              </div>
            </nav>

            {/* Bottom Actions */}
            <div className="absolute bottom-0 left-0 right-0 p-6 border-t border-gray-200 dark:border-gray-700">
              <div className="space-y-3">
                <button
                  onClick={() => setDarkMode(!darkMode)}
                  className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
                    darkMode ? 'text-gray-300 hover:bg-gray-700' : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  {darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
                  <span>{darkMode ? 'Light Mode' : 'Dark Mode'}</span>
                </button>
                
                <button
                  onClick={onLogout}
                  className="w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                >
                  <LogOut className="w-5 h-5" />
                  <span>Logout</span>
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Header */}
        <header className={`${darkMode ? 'bg-gray-800' : 'bg-white'} shadow-sm border-b ${darkMode ? 'border-gray-700' : 'border-gray-200'} p-4`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className={`p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 ${
                  darkMode ? 'text-gray-400' : 'text-gray-600'
                }`}
              >
                <Menu className="w-5 h-5" />
              </button>
              
              <div>
                <h1 className={`text-xl font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                  {activeTab === 'dashboard' && 'Dashboard'}
                  {activeTab === 'timetable' && 'Timetable'}
                  {activeTab === 'students' && 'Student Section'}
                </h1>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <div className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                {new Date().toLocaleDateString('en-US', { 
                  weekday: 'long', 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })}
              </div>
            </div>
          </div>
        </header>

        {/* Content Area */}
        <main className="flex-1 overflow-y-auto p-6">
          <AnimatePresence mode="wait">
            {activeTab === 'dashboard' && (
              <motion.div
                key="dashboard"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
              >
                {renderDashboard()}
              </motion.div>
            )}
            
            {activeTab === 'timetable' && (
              <motion.div
                key="timetable"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
              >
                <FacultyTimetable darkMode={darkMode} facultyId={facultyId} />
              </motion.div>
            )}
            
            {activeTab === 'students' && (
              <motion.div
                key="students"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
              >
                <StudentSection darkMode={darkMode} facultyId={facultyId} />
              </motion.div>
            )}
          </AnimatePresence>
        </main>
      </div>

      {/* Mobile Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
  );
};

export default FacultyDashboard;
