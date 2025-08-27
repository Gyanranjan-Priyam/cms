import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Users, 
  DollarSign, 
  Settings,
  LogOut,
  Bell,
  Search,
  GraduationCap,
  School,
  BookOpen,
  FileText,
  Moon,
  Sun,
  Home,
  Building,
  UserCheck,
  AlertCircle,
  CheckCircle,
  Clock,
  RefreshCw,
  Plus,
  Edit3,
  Trash2,
  Filter,
  ChevronDown,
  Calendar,
  Phone,
  Mail,
  Eye,
  FileSpreadsheet,
  X
} from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import axios from 'axios';
import { getApiUrl } from '../config/api';
import { Table } from '../components/ui/simple-table';
import Examination from './Examination';

interface AdminDashboardProps {
  user: any;
  onLogout: () => void;
}

// Unified recent activity item shape
type ActivityItem = {
  type: 'student' | 'payment';
  message: string;
  time: Date;
  timeText: string;
  icon: React.ComponentType<{ className?: string }>;
};

const AdminDashboard: React.FC<AdminDashboardProps> = ({ user, onLogout }) => {
  const [activeTab, setActiveTab] = useState('overview');
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [darkMode, setDarkMode] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [sidebarExpanded, setSidebarExpanded] = useState(false);
  // Recent activity state (real data)
  const [recentStudents, setRecentStudents] = useState<any[]>([]);
  const [recentPayments, setRecentPayments] = useState<any[]>([]);

  // Student Management States
  const [students, setStudents] = useState([]);
  const [branches, setBranches] = useState([]);
  const [branchStats, setBranchStats] = useState([]);
  // Subjects management state
  const [subjects, setSubjects] = useState<any[]>([]);
  const [subjectFilters, setSubjectFilters] = useState<{ branch: string; semester: string; search: string; activeOnly: boolean }>({ branch: '', semester: '', search: '', activeOnly: true });
  const [showSubjectModal, setShowSubjectModal] = useState(false);
  const [selectedSubject, setSelectedSubject] = useState<any | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [showFilters, setShowFilters] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteStudentData, setDeleteStudentData] = useState<{student: any, studentInfo: any} | null>(null);
  
  // Branch Management States
  const [showBranchModal, setShowBranchModal] = useState(false);
  const [selectedBranch, setSelectedBranch] = useState(null);
  const [showBranchDeleteModal, setShowBranchDeleteModal] = useState(false);
  const [deleteBranchData, setDeleteBranchData] = useState<{branch: any} | null>(null);
  
  const [filters, setFilters] = useState({
    branch: '',
    semester: '',
    search: ''
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    fetchDashboardData();
    fetchNotifications();
    fetchBranches();
  fetchRecentActivities();
    const theme = localStorage.getItem('theme');
    if (theme === 'dark') {
      setDarkMode(true);
      document.documentElement.classList.add('dark');
    }
  }, []);

  useEffect(() => {
    if (activeTab === 'students') {
      fetchStudents();
    } else if (activeTab === 'overview') {
      fetchBranchStats();
    } else if (activeTab === 'subjects') {
      fetchSubjects();
    }
  }, [activeTab, filters, currentPage]);

  // Refresh subjects when subject filters change
  useEffect(() => {
    if (activeTab === 'subjects') {
      fetchSubjects();
    }
  }, [subjectFilters, activeTab]);

  useEffect(() => {
    // Apply dark mode to document
    if (darkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [darkMode]);

  const fetchDashboardData = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${import.meta.env.VITE_API_URL}/api/dashboard/admin`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setDashboardData(response.data.dashboard);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchNotifications = async () => {
    try {
      // Since notifications endpoint doesn't exist, just set empty array
      setNotifications([]);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    }
  };

  // Fetch recent activities (students + payments) from head-admin dashboard
  const fetchRecentActivities = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(getApiUrl('api/dashboard/head-admin'), {
        headers: { Authorization: `Bearer ${token}` }
      });
      const ra = response.data?.dashboard?.recentActivities || {};
      setRecentStudents(ra.students || []);
      setRecentPayments(ra.payments || []);
    } catch (error) {
      console.error('Error fetching recent activities:', error);
      setRecentStudents([]);
      setRecentPayments([]);
    }
  };

  const fetchStudents = async () => {
    try {
      const token = localStorage.getItem('token');
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: '10',
        ...filters
      });
      
      const response = await axios.get(getApiUrl(`api/students?${params}`), {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setStudents(response.data.students);
      setTotalPages(response.data.totalPages);
    } catch (error) {
      console.error('Error fetching students:', error);
    }
  };

  const fetchBranches = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(getApiUrl('api/branches'), {
        headers: { Authorization: `Bearer ${token}` }
      });
      setBranches(response.data); // Backend returns array directly
    } catch (error) {
      console.error('Error fetching branches:', error);
    }
  };

  const fetchSubjects = async () => {
    try {
      const token = localStorage.getItem('token');
      const params = new URLSearchParams();
      if (subjectFilters.branch) params.append('branch', subjectFilters.branch);
  if (subjectFilters.search) params.append('search', subjectFilters.search);
  if (subjectFilters.semester) params.append('semester', subjectFilters.semester);
      if (subjectFilters.activeOnly) params.append('activeOnly', 'true');
      const response = await axios.get(getApiUrl(`api/subjects?${params.toString()}`), {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSubjects(response.data.data || []);
    } catch (error) {
      console.error('Error fetching subjects:', error);
    }
  };

  const fetchBranchStats = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(getApiUrl('api/students/stats/branches'), {
        headers: { Authorization: `Bearer ${token}` }
      });
      setBranchStats(response.data || []);
    } catch (error) {
      console.error('Error fetching branch stats:', error);
    }
  };

  const handleAddStudent = () => {
    setSelectedStudent(null);
    setShowAddModal(true);
  };

  const handleEditStudent = (student: any) => {
    setSelectedStudent(student);
    setShowAddModal(true);
  };

  const handleDeleteStudent = async (studentId: string, studentInfo: any, permanent: boolean = false) => {
    const deleteType = permanent ? 'PERMANENTLY DELETE' : 'DEACTIVATE';
    
    const confirmDelete = window.confirm(
      `⚠️ ${deleteType} STUDENT WARNING ⚠️\n\n` +
      `Are you sure you want to ${deleteType.toLowerCase()} this student?\n\n` +
      `Student: ${studentInfo.firstName} ${studentInfo.lastName}\n` +
      `ID: ${studentInfo.regdNo}\n` +
      `Email: ${studentInfo.email}\n` +
      `Branch: ${studentInfo.branch?.name || 'N/A'}\n\n` +
      (permanent ? 
        `This will PERMANENTLY DELETE:\n` +
        `• Student record from database\n` +
        `• All payment records\n` +
        `• All notifications\n` +
        `• All related data\n\n` +
        `⚠️ THIS ACTION CANNOT BE UNDONE! ⚠️` :
        `This will deactivate the student:\n` +
        `• Student will be marked as inactive\n` +
        `• Data will be preserved\n` +
        `• Can be reactivated later\n\n` +
        `This is a reversible action.`
      )
    );

    if (!confirmDelete) return;

    const originalStudents = [...students];
    if (permanent) {
      setStudents(prev => prev.filter((s: any) => s._id !== studentId));
    }

    try {
      const token = localStorage.getItem('token');
      const endpoint = permanent ? 
        `api/student-management/students/${studentId}/permanent` : 
        `api/student-management/students/${studentId}`;
        
      const response = await axios.delete(getApiUrl(endpoint), {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.success) {
        const message = permanent ? 
          `✅ Student permanently deleted: ${response.data.deletedStudent?.name}` :
          `✅ Student deactivated: ${studentInfo.firstName} ${studentInfo.lastName}`;
        alert(message);
        await Promise.all([fetchStudents(), fetchBranchStats()]);
      } else {
        if (permanent) setStudents(originalStudents);
        alert(`❌ Failed to ${deleteType.toLowerCase()} student: ` + response.data.message);
      }
    } catch (error: any) {
      console.error(`❌ Error ${deleteType.toLowerCase()} student:`, error);
      if (permanent) setStudents(originalStudents);
      
      if (error.response?.status === 403) {
        alert(`❌ Access denied. You do not have permission to ${deleteType.toLowerCase()} students.`);
      } else if (error.response?.status === 404) {
        alert(`❌ Student not found. They may have already been deleted. Refreshing data...`);
        await Promise.all([fetchStudents(), fetchBranchStats()]);
      } else {
        alert(`❌ Failed to ${deleteType.toLowerCase()} student. Please try again.`);
      }
    }
  };

  const handleOpenDeleteModal = (student: any) => {
    const studentInfo = {
      firstName: student.firstName,
      lastName: student.lastName,
      regdNo: student.regdNo,
      email: student.email,
      branch: student.branch
    };
    setDeleteStudentData({ student, studentInfo });
    setShowDeleteModal(true);
  };

  const handleCloseDeleteModal = () => {
    setShowDeleteModal(false);
    setDeleteStudentData(null);
  };

  const handleViewStudent = (student: any) => {
    setSelectedStudent(student);
    setShowViewModal(true);
  };

  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setCurrentPage(1);
  };

  // Branch Management Functions
  const handleAddBranch = () => {
    setSelectedBranch(null);
    setShowBranchModal(true);
  };

  const handleEditBranch = (branch: any) => {
    setSelectedBranch(branch);
    setShowBranchModal(true);
  };

  const handleDeleteBranch = async (branchId: string, branchInfo: any, permanent: boolean = false) => {
    const deleteType = permanent ? 'PERMANENTLY DELETE' : 'DEACTIVATE';
    
    const confirmDelete = window.confirm(
      `⚠️ ${deleteType} BRANCH WARNING ⚠️\n\n` +
      `Are you sure you want to ${deleteType.toLowerCase()} this branch?\n\n` +
      `Branch: ${branchInfo.name} (${branchInfo.code})\n` +
      `Total Students: ${branchInfo.totalStudents || 0}\n\n` +
      (permanent ? 
        `This will PERMANENTLY DELETE:\n` +
        `• Branch record from database\n` +
        `• All students in this branch\n` +
        `• All related payment records\n` +
        `• All notifications\n` +
        `• All related data\n\n` +
        `⚠️ THIS ACTION CANNOT BE UNDONE! ⚠️` :
        `This will deactivate the branch:\n` +
        `• Branch will be marked as inactive\n` +
        `• Students will remain but branch unavailable for new students\n` +
        `• Data will be preserved\n` +
        `• Can be reactivated later\n\n` +
        `This is a reversible action.`
      )
    );

    if (!confirmDelete) return;

    try {
      const token = localStorage.getItem('token');
      const endpoint = permanent ? 
        `api/branches/${branchId}/permanent` : 
        `api/branches/${branchId}`;
        
      const response = await axios.delete(getApiUrl(endpoint), {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.success) {
        const message = permanent ? 
          `✅ Branch permanently deleted: ${branchInfo.name}` :
          `✅ Branch deactivated: ${branchInfo.name}`;
        alert(message);
        await Promise.all([fetchBranches(), fetchBranchStats(), fetchStudents()]);
      } else {
        alert(`❌ Failed to ${deleteType.toLowerCase()} branch: ` + response.data.message);
      }
    } catch (error: any) {
      console.error(`❌ Error ${deleteType.toLowerCase()} branch:`, error);
      
      if (error.response?.status === 403) {
        alert(`❌ Access denied. You do not have permission to ${deleteType.toLowerCase()} branches.`);
      } else if (error.response?.status === 404) {
        alert(`❌ Branch not found. It may have already been deleted. Refreshing data...`);
        await Promise.all([fetchBranches(), fetchBranchStats()]);
      } else {
        alert(`❌ Failed to ${deleteType.toLowerCase()} branch. Please try again.`);
      }
    }
  };

  const handleOpenBranchDeleteModal = (branch: any) => {
    setDeleteBranchData({ branch });
    setShowBranchDeleteModal(true);
  };

  const handleCloseBranchDeleteModal = () => {
    setShowBranchDeleteModal(false);
    setDeleteBranchData(null);
  };

  const exportToExcel = async () => {
    try {
      const token = localStorage.getItem('token');
      const params = new URLSearchParams();
      
      if (filters.search) params.append('search', filters.search);
      if (filters.branch) params.append('branch', filters.branch);
      if (filters.semester) params.append('semester', filters.semester);
      
      const response = await axios.get(getApiUrl(`api/students/export?${params}`), {
        headers: { Authorization: `Bearer ${token}` },
        responseType: 'blob'
      });
      
      const blob = new Blob([response.data], { 
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
      });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      const filterSuffix = filters.search || filters.branch || filters.semester ? '_filtered' : '';
      link.download = `students${filterSuffix}_${new Date().toISOString().split('T')[0]}.xlsx`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      alert('Excel file exported successfully!');
    } catch (error) {
      console.error('Error exporting to Excel:', error);
      alert('Failed to export data. Please try again.');
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await Promise.all([
        fetchDashboardData(), 
        fetchNotifications(),
  fetchRecentActivities(),
        activeTab === 'students' ? fetchStudents() : Promise.resolve(),
        activeTab === 'overview' ? fetchBranchStats() : Promise.resolve()
      ]);
    } finally {
      setRefreshing(false);
    }
  };

  const stats = dashboardData ? [
    {
      title: 'Total Students',
      value: dashboardData.totalStudents || 0,
      icon: Users,
      color: 'blue',
      gradient: 'from-blue-400 to-blue-600',
      change: '+12%',
      trend: 'up'
    },
    {
      title: 'Total Revenue',
      value: `₹${(dashboardData.totalRevenue || 0).toLocaleString()}`,
      icon: DollarSign,
      color: 'green',
      gradient: 'from-green-400 to-emerald-600',
      change: '+8.2%',
      trend: 'up'
    },
    {
      title: 'Pending Payments',
      value: dashboardData.pendingPayments || 0,
      icon: AlertCircle,
      color: 'orange',
      gradient: 'from-orange-400 to-red-500',
      change: '-3.1%',
      trend: 'down'
    },
    {
      title: 'Active Branches',
      value: dashboardData.totalBranches || 0,
      icon: Building,
      color: 'purple',
      gradient: 'from-purple-400 to-pink-600',
      change: '+2',
      trend: 'up'
    }
  ] : [];

  const quickActions = [
    {
      title: 'Add New Student',
      description: 'Register a new student',
      icon: UserCheck,
      color: 'blue',
      action: () => {
        setActiveTab('students');
        setTimeout(() => handleAddStudent(), 100);
      }
    },
    {
      title: 'View Students',
      description: 'Manage student records',
      icon: Users,
      color: 'green',
      action: () => setActiveTab('students')
    },
    {
      title: 'Manage Subjects',
      description: 'Add or edit branch subjects',
      icon: BookOpen,
      color: 'purple',
      action: () => setActiveTab('subjects')
    },
    {
      title: 'System Settings',
      description: 'Configure system preferences',
      icon: Settings,
      color: 'gray',
      action: () => setActiveTab('settings')
    }
  ];

  // Build a unified, time-sorted recent activities list from real data
  const recentActivities = React.useMemo<ActivityItem[]>(() => {
    const studentItems: ActivityItem[] = (recentStudents || []).map((s: any) => {
      const time = s.createdAt ? new Date(s.createdAt) : new Date(0);
      return {
        type: 'student',
        message: `New student registration: ${s.firstName || ''} ${s.lastName || ''} (${s.regdNo || 'N/A'})${s.branch?.code ? ` • ${s.branch.code}` : ''}${s.semester ? ` • Sem ${s.semester}` : ''}`.trim(),
        time,
        timeText: time.toLocaleString(),
        icon: Users
      };
    });
    const paymentItems: ActivityItem[] = (recentPayments || []).map((p: any) => {
      const time = p.paymentDate ? new Date(p.paymentDate) : new Date(0);
      return {
        type: 'payment',
        message: `Payment received: ₹${Number(p.amount || 0).toLocaleString()}${p.paymentType ? ` • ${p.paymentType}` : ''}${p.student ? ` • ${p.student.firstName || ''} ${p.student.lastName || ''} (${p.student.regdNo || 'N/A'})` : ''}`.trim(),
        time,
        timeText: time.toLocaleString(),
        icon: DollarSign
      };
    });
    return [...studentItems, ...paymentItems]
      .sort((a, b) => b.time.getTime() - a.time.getTime())
      .slice(0, 10);
  }, [recentStudents, recentPayments]);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        duration: 0.6,
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: { duration: 0.4 }
    }
  };

  return (
    <div className={`min-h-screen transition-colors duration-300 ${
      darkMode ? 'bg-gray-900 text-white' : 'bg-gray-50 text-gray-900'
    }`}>
      {/* Modern Collapsible Sidebar */}
      <motion.div
        className={`fixed left-0 top-0 h-full z-50 ${
          darkMode ? 'bg-gray-800' : 'bg-white'
        } shadow-2xl border-r ${
          darkMode ? 'border-gray-700' : 'border-gray-200'
        }`}
        initial={{ width: '64px' }}
        animate={{ 
          width: sidebarExpanded ? '280px' : '64px',
          transition: {
            duration: 0.2,
            ease: [0.4, 0, 0.2, 1], // Custom cubic-bezier for smooth easing
            type: "tween"
          }
        }}
        onMouseEnter={() => setSidebarExpanded(true)}
        onMouseLeave={() => setSidebarExpanded(false)}
      >
        {/* Sidebar Header */}
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-3">
            {sidebarExpanded && (
              <div className="w-8 h-8 rounded-lg bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center">
                <GraduationCap className="w-5 h-5 text-white" />
              </div>
            )}
            <motion.div
              initial={{ opacity: 0, width: 0 }}
              animate={{ 
                opacity: sidebarExpanded ? 1 : 0,
                width: sidebarExpanded ? 'auto' : 0,
                transition: {
                  opacity: { duration: 0.15, delay: sidebarExpanded ? 0.1 : 0 },
                  width: { duration: 0.2, ease: [0.4, 0, 0.2, 1] }
                }
              }}
              className="overflow-hidden"
            >
              <h1 className="text-lg font-bold whitespace-nowrap">CMS Admin</h1>
            </motion.div>
          </div>
        </div>

        {/* Navigation Items */}
        <nav className="p-2 space-y-1">
            {[ 
            { id: 'overview', label: 'Overview', icon: Home },
            { id: 'students', label: 'Student Management', icon: Users },
            { id: 'subjects', label: 'Subjects', icon: BookOpen },
            { id: 'exams', label: 'Examinations', icon: FileText },
            { id: 'settings', label: 'Settings', icon: Settings }
          ].map((tab) => (
            <motion.button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`w-full flex items-center space-x-3 p-3 rounded-xl transition-all duration-200 group ${
                activeTab === tab.id
                  ? 'bg-blue-500 text-white shadow-lg'
                  : darkMode 
                    ? 'text-gray-300 hover:bg-gray-700 hover:text-white' 
                    : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
              }`}
              whileHover={{ 
                x: sidebarExpanded ? 4 : 0,
                transition: { duration: 0.1, ease: "easeOut" }
              }}
              whileTap={{ scale: 0.95 }}
            >
              <tab.icon className="w-5 h-5 flex-shrink-0" />
              <motion.span
                className="whitespace-nowrap overflow-hidden"
                initial={{ opacity: 0, x: -10 }}
                animate={{ 
                  opacity: sidebarExpanded ? 1 : 0,
                  x: sidebarExpanded ? 0 : -10,
                  transition: {
                    duration: 0.15,
                    delay: sidebarExpanded ? 0.08 : 0,
                    ease: [0.4, 0, 0.2, 1]
                  }
                }}
              >
                {tab.label}
              </motion.span>
            </motion.button>
          ))}
        </nav>

        {/* Sidebar Footer */}
        <div className="absolute bottom-0 left-0 right-0 p-2 border-t border-gray-200 dark:border-gray-700">
          {/* Theme Toggle */}
          <motion.button
            onClick={() => {
              setDarkMode(!darkMode);
              localStorage.setItem('theme', !darkMode ? 'dark' : 'light');
            }}
            className={`w-full flex items-center space-x-3 p-3 rounded-xl transition-all duration-200 mb-2 ${
              darkMode 
                ? 'text-gray-300 hover:bg-gray-700 hover:text-white' 
                : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
            }`}
            whileHover={{ 
              x: sidebarExpanded ? 4 : 0,
              transition: { duration: 0.1, ease: "easeOut" }
            }}
            whileTap={{ scale: 0.95 }}
          >
            {darkMode ? <Sun className="w-5 h-5 flex-shrink-0" /> : <Moon className="w-5 h-5 flex-shrink-0" />}
            <motion.span
              className="whitespace-nowrap overflow-hidden"
              initial={{ opacity: 0, x: -10 }}
              animate={{ 
                opacity: sidebarExpanded ? 1 : 0,
                x: sidebarExpanded ? 0 : -10,
                transition: {
                  duration: 0.15,
                  delay: sidebarExpanded ? 0.08 : 0,
                  ease: [0.4, 0, 0.2, 1]
                }
              }}
            >
              {darkMode ? 'Light Mode' : 'Dark Mode'}
            </motion.span>
          </motion.button>

          {/* Logout */}
          <motion.button
            onClick={onLogout}
            className={`w-full flex items-center space-x-3 p-3 rounded-xl transition-all duration-200 ${
              darkMode 
                ? 'text-red-400 hover:bg-red-900/20 hover:text-red-300' 
                : 'text-red-600 hover:bg-red-50 hover:text-red-700'
            }`}
            whileHover={{ 
              x: sidebarExpanded ? 4 : 0,
              transition: { duration: 0.1, ease: "easeOut" }
            }}
            whileTap={{ scale: 0.95 }}
          >
            <LogOut className="w-5 h-5 flex-shrink-0" />
            <motion.span
              className="whitespace-nowrap overflow-hidden"
              initial={{ opacity: 0, x: -10 }}
              animate={{ 
                opacity: sidebarExpanded ? 1 : 0,
                x: sidebarExpanded ? 0 : -10,
                transition: {
                  duration: 0.15,
                  delay: sidebarExpanded ? 0.08 : 0,
                  ease: [0.4, 0, 0.2, 1]
                }
              }}
            >
              Logout
            </motion.span>
          </motion.button>
        </div>
      </motion.div>

      {/* Main Content Area with Left Margin */}
      <div className="ml-16">
      {/* Enhanced Header */}
      <header className={`${
        darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
      } shadow-lg border-b transition-colors duration-300`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <motion.div
              initial={{ x: -20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ duration: 0.5 }}
              className="flex items-center space-x-4"
            >
              <div className={`p-2 rounded-lg ${
                darkMode ? 'bg-blue-900' : 'bg-blue-100'
              }`}>
                <GraduationCap className="w-8 h-8 text-blue-600" />
              </div>
              <div>
                <h1 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  Admin Dashboard
                </h1>
                <p className={`text-sm ${
                  darkMode ? 'text-gray-400' : 'text-gray-600'
                }`}>
                  College Management System
                </p>
              </div>
            </motion.div>

            <div className="flex items-center space-x-4">
              {/* Search Bar */}
              <div className="hidden md:block relative">
                <Search className={`absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 ${
                  darkMode ? 'text-gray-400' : 'text-gray-500'
                }`} />
                <input
                  type="text"
                  placeholder="Search..."
                  className={`pl-10 pr-4 py-2 rounded-lg border transition-all ${
                    darkMode 
                      ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:border-blue-500' 
                      : 'bg-white border-gray-300 placeholder-gray-500 focus:border-blue-500'
                  } focus:ring-2 focus:ring-blue-500 focus:ring-opacity-20`}
                />
              </div>
              {/* Refresh Button */}
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleRefresh}
                disabled={refreshing}
                className={`p-2 rounded-lg transition-colors ${
                  darkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-100 hover:bg-gray-200'
                } ${refreshing ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                <RefreshCw className={`w-5 h-5 ${refreshing ? 'animate-spin' : ''}`} />
              </motion.button>

              {/* Notifications */}
              <div className="relative">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setShowNotifications(!showNotifications)}
                  className={`p-2 rounded-lg transition-colors relative ${
                    darkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-100 hover:bg-gray-200'
                  }`}
                >
                  <Bell className="w-5 h-5" />
                  {(notifications || []).length > 0 && (
                    <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full animate-pulse"></span>
                  )}
                </motion.button>

                <AnimatePresence>
                  {showNotifications && (
                    <motion.div
                      initial={{ opacity: 0, y: -10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -10, scale: 0.95 }}
                      transition={{ duration: 0.2 }}
                      className={`absolute right-0 mt-2 w-80 rounded-lg shadow-lg border z-50 ${
                        darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
                      }`}
                    >
                      <div className="p-4">
                        <h3 className="font-semibold mb-3">Recent Notifications</h3>
                        <div className="space-y-3 max-h-64 overflow-y-auto">
                          {(notifications || []).length > 0 ? (notifications || []).map((notification: any, index: number) => (
                            <div key={index} className={`p-3 rounded-lg ${
                              darkMode ? 'bg-gray-700' : 'bg-gray-50'
                            }`}>
                              <p className="text-sm">{notification.message}</p>
                              <p className={`text-xs mt-1 ${
                                darkMode ? 'text-gray-400' : 'text-gray-500'
                              }`}>
                                {new Date(notification.createdAt).toLocaleString()}
                              </p>
                            </div>
                          )) : (
                            <p className={`text-sm ${
                              darkMode ? 'text-gray-400' : 'text-gray-500'
                            }`}>
                              No new notifications
                            </p>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* User Menu */}
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center">
                  <span className="text-white text-sm font-semibold">
                    {user?.firstName?.charAt(0) || 'A'}
                  </span>
                </div>
                <div className="hidden sm:block">
                  <p className="font-medium">{user?.firstName || 'Admin'}</p>
                  <p className={`text-sm ${
                    darkMode ? 'text-gray-400' : 'text-gray-500'
                  }`}>
                    Administrator
                  </p>
                </div>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={onLogout}
                  className={`p-2 rounded-lg transition-colors ${
                    darkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-100 hover:bg-gray-200'
                  }`}
                >
                  <LogOut className="w-5 h-5" />
                </motion.button>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Navigation Tabs */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className={`border-b ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
          <nav className="-mb-px flex space-x-8">
            {[
              { id: 'overview', label: 'Overview', icon: Home },
              { id: 'students', label: 'Student Management', icon: Users },
              { id: 'subjects', label: 'Subjects', icon: BookOpen },
              { id: 'exams', label: 'Examinations', icon: FileText },
              { id: 'settings', label: 'Settings', icon: Settings }
            ].map((tab) => (
              <motion.button
                key={tab.id}
                whileHover={{ y: -2 }}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm transition-all ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : `border-transparent ${
                        darkMode ? 'text-gray-400 hover:text-gray-300 hover:border-gray-600' 
                                 : 'text-gray-500 hover:text-gray-700 hover:border-gray-300'
                      }`
                }`}
              >
                <tab.icon className="w-5 h-5" />
                <span>{tab.label}</span>
              </motion.button>
            ))}
          </nav>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'overview' && (
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            {loading ? (
              <div className="flex items-center justify-center h-64">
                <div className="relative">
                  <div className="w-12 h-12 border-4 border-blue-200 rounded-full animate-spin"></div>
                  <div className="absolute top-0 left-0 w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                </div>
              </div>
            ) : (
              <>
                {/* Stats Cards */}
                <motion.div 
                  variants={itemVariants}
                  className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8"
                >
                  {stats.map((stat, index) => (
                    <motion.div
                      key={index}
                      whileHover={{ y: -5, scale: 1.02 }}
                      className={`relative overflow-hidden rounded-xl shadow-lg p-6 ${
                        darkMode ? 'bg-gray-800' : 'bg-white'
                      }`}
                    >
                      <div className={`absolute inset-0 bg-gradient-to-br ${stat.gradient} opacity-5`}></div>
                      <div className="relative flex items-center justify-between">
                        <div>
                          <p className={`text-sm font-medium ${
                            darkMode ? 'text-gray-400' : 'text-gray-600'
                          }`}>
                            {stat.title}
                          </p>
                          <p className="text-2xl font-bold">{stat.value}</p>
                          <div className="flex items-center mt-2">
                            <span className={`text-sm font-medium ${
                              stat.trend === 'up' ? 'text-green-600' : 'text-red-600'
                            }`}>
                              {stat.change}
                            </span>
                            <span className={`text-sm ml-1 ${
                              darkMode ? 'text-gray-400' : 'text-gray-600'
                            }`}>
                              vs last month
                            </span>
                          </div>
                        </div>
                        <div className={`p-3 rounded-lg bg-gradient-to-br ${stat.gradient}`}>
                          <stat.icon className="w-6 h-6 text-white" />
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </motion.div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  {/* Quick Actions */}
                  <motion.div
                    variants={itemVariants}
                    className={`lg:col-span-2 rounded-xl shadow-lg p-6 ${
                      darkMode ? 'bg-gray-800' : 'bg-white'
                    }`}
                  >
                    <h3 className="text-lg font-semibold mb-6 flex items-center">
                      <School className="w-5 h-5 mr-2 text-blue-600" />
                      Quick Actions
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {quickActions.map((action, index) => (
                        <motion.div
                          key={index}
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={action.action}
                          className={`p-4 rounded-lg border-2 border-dashed cursor-pointer transition-all ${
                            darkMode 
                              ? 'border-gray-600 hover:border-blue-500 hover:bg-gray-700' 
                              : 'border-gray-300 hover:border-blue-500 hover:bg-blue-50'
                          }`}
                        >
                          <div className="flex items-center space-x-3">
                            <div className={`p-2 rounded-lg ${
                              action.color === 'blue' ? 'bg-blue-100 text-blue-600' :
                              action.color === 'green' ? 'bg-green-100 text-green-600' :
                              action.color === 'purple' ? 'bg-purple-100 text-purple-600' :
                              'bg-gray-100 text-gray-600'
                            }`}>
                              <action.icon className="w-5 h-5" />
                            </div>
                            <div>
                              <h4 className="font-medium">{action.title}</h4>
                              <p className={`text-sm ${
                                darkMode ? 'text-gray-400' : 'text-gray-600'
                              }`}>
                                {action.description}
                              </p>
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </motion.div>

                  {/* Recent Activities */}
                  <motion.div
                    variants={itemVariants}
                    className={`rounded-xl shadow-lg p-6 ${
                      darkMode ? 'bg-gray-800' : 'bg-white'
                    }`}
                  >
                    <h3 className="text-lg font-semibold mb-6 flex items-center">
                      <Clock className="w-5 h-5 mr-2 text-green-600" />
                      Recent Activities
                    </h3>
                    <div className="space-y-4">
                      {recentActivities.map((activity, index) => (
                        <motion.div
                          key={index}
                          initial={{ x: -20, opacity: 0 }}
                          animate={{ x: 0, opacity: 1 }}
                          transition={{ delay: index * 0.1 }}
                          className="flex items-start space-x-3"
                        >
                          <div className={`p-2 rounded-lg ${
                            activity.type === 'student' ? 'bg-blue-100 text-blue-600' :
                            activity.type === 'payment' ? 'bg-green-100 text-green-600' :
                            activity.type === 'system' ? 'bg-purple-100 text-purple-600' :
                            'bg-orange-100 text-orange-600'
                          }`}>
                            <activity.icon className="w-4 h-4" />
                          </div>
                          <div className="flex-1">
                            <p className={`text-sm ${
                              darkMode ? 'text-gray-300' : 'text-gray-700'
                            }`}>
                              {activity.message}
                            </p>
                            <p className={`text-xs ${
                              darkMode ? 'text-gray-500' : 'text-gray-500'
                            }`}>
                              {activity.timeText}
                            </p>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </motion.div>
                </div>

                {/* Branch Statistics */}
                {(branchStats || []).length > 0 && (
                  <motion.div
                    variants={itemVariants}
                    className={`mt-8 rounded-xl shadow-lg p-6 ${
                      darkMode ? 'bg-gray-800' : 'bg-white'
                    }`}
                  >
                    <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-6 text-center">
                      Student Distribution by Branch
                    </h3>
                    <div className="h-96">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={(branchStats || []).map((branch: any, index: number) => ({
                              name: branch.branchCode,
                              value: branch.count,
                              fullName: branch.branchName,
                              color: [
                                '#3B82F6', '#8B5CF6', '#10B981', '#F59E0B', 
                                '#EF4444', '#06B6D4', '#84CC16', '#F97316'
                              ][index % 8]
                            }))}
                            cx="50%"
                            cy="50%"
                            outerRadius={120}
                            innerRadius={60}
                            paddingAngle={2}
                            dataKey="value"
                            animationBegin={0}
                            animationDuration={1500}
                          >
                            {(branchStats || []).map((_entry: any, index: number) => (
                              <Cell 
                                key={`cell-${index}`} 
                                fill={[
                                  '#3B82F6', '#8B5CF6', '#10B981', '#F59E0B', 
                                  '#EF4444', '#06B6D4', '#84CC16', '#F97316'
                                ][index % 8]}
                              />
                            ))}
                          </Pie>
                          <Tooltip 
                            contentStyle={{
                              backgroundColor: 'rgba(255, 255, 255, 0.9)',
                              border: 'none',
                              borderRadius: '12px',
                              boxShadow: '0 10px 25px rgba(0, 0, 0, 0.15)'
                            }}
                            formatter={(value: any, _name: any, props: any) => [
                              `${value} students`, 
                              props.payload.fullName
                            ]}
                          />
                          <Legend 
                            verticalAlign="bottom" 
                            height={36}
                            formatter={(_value: any, entry: any) => (
                              <span style={{ color: entry.color }}>
                                {entry.payload.fullName} ({entry.payload.value})
                              </span>
                            )}
                          />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  </motion.div>
                )}
              </>
            )}
          </motion.div>
        )}
        {activeTab === 'exams' && (
          <div>
            <Examination />
          </div>
        )}

        {/* Student Management Tab */}
        {activeTab === 'students' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-8"
          >
            {/* Student Management Header */}
            <div className="text-center">
              <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
                Student Management
              </h2>
              <p className="text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
                Comprehensive student records management system
              </p>
            </div>

            {/* Enhanced Control Panel */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className={`backdrop-blur-lg rounded-2xl shadow-xl p-6 mb-8 border ${
                darkMode ? 'bg-gray-800/80 border-gray-700/20' : 'bg-white/80 border-gray-200/20'
              }`}
            >
              <div className="flex flex-col space-y-4">
                {/* Top Row */}
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
                  <div className="flex items-center space-x-4">
                    {/* Enhanced Search */}
                    <div className="relative group">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 group-focus-within:text-blue-500 w-5 h-5 transition-colors" />
                      <input
                        type="text"
                        placeholder="Search students..."
                        value={filters.search}
                        onChange={(e) => handleFilterChange('search', e.target.value)}
                        className={`pl-10 pr-4 py-3 w-64 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 ${
                          darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'
                        }`}
                      />
                    </div>

                    {/* Filter Toggle */}
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setShowFilters(!showFilters)}
                      className={`flex items-center space-x-2 px-4 py-3 rounded-xl transition-all ${showFilters 
                        ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300' 
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                      }`}
                    >
                      <Filter className="w-4 h-4" />
                      <span>Filters</span>
                      <motion.div
                        animate={{ rotate: showFilters ? 180 : 0 }}
                        transition={{ duration: 0.2 }}
                      >
                        <ChevronDown className="w-4 h-4" />
                      </motion.div>
                    </motion.button>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex space-x-3">
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={handleAddStudent}
                      className="flex items-center space-x-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-3 rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all shadow-lg hover:shadow-xl"
                    >
                      <Plus className="w-5 h-5" />
                      <span>Add Student</span>
                    </motion.button>
                    
                    <motion.button 
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={exportToExcel}
                      className="flex items-center space-x-2 bg-gradient-to-r from-green-600 to-emerald-600 text-white px-6 py-3 rounded-xl hover:from-green-700 hover:to-emerald-700 transition-all shadow-lg hover:shadow-xl relative"
                    >
                      <FileSpreadsheet className="w-5 h-5" />
                      <span>
                        {filters.search || filters.branch || filters.semester 
                          ? 'Export Filtered' 
                          : 'Export All'
                        }
                      </span>
                      {(filters.search || filters.branch || filters.semester) && (
                        <span className="absolute -top-1 -right-1 bg-orange-500 text-white text-xs rounded-full w-3 h-3 flex items-center justify-center">
                          !
                        </span>
                      )}
                    </motion.button>
                  </div>
                </div>

                {/* Animated Filters */}
                <AnimatePresence>
                  {showFilters && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3 }}
                      className="overflow-hidden"
                    >
                      <div className={`flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4 pt-4 border-t ${
                        darkMode ? 'border-gray-700' : 'border-gray-200'
                      }`}>
                        <div className="flex-1">
                          <label className={`block text-sm font-medium mb-2 ${
                            darkMode ? 'text-gray-300' : 'text-gray-700'
                          }`}>
                            Branch
                          </label>
                          <select
                            value={filters.branch}
                            onChange={(e) => handleFilterChange('branch', e.target.value)}
                            className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${
                              darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'
                            }`}
                          >
                            <option value="">All Branches</option>
                            {(branches || []).map((branch: any) => (
                              <option key={branch._id} value={branch._id}>
                                {branch.name} ({branch.code})
                              </option>
                            ))}
                          </select>
                        </div>

                        <div className="flex-1">
                          <label className={`block text-sm font-medium mb-2 ${
                            darkMode ? 'text-gray-300' : 'text-gray-700'
                          }`}>
                            Semester
                          </label>
                          <select
                            value={filters.semester}
                            onChange={(e) => handleFilterChange('semester', e.target.value)}
                            className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${
                              darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'
                            }`}
                          >
                            <option value="">All Semesters</option>
                            {[1, 2, 3, 4, 5, 6, 7, 8].map(sem => (
                              <option key={sem} value={sem}>Semester {sem}</option>
                            ))}
                          </select>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>

            {/* Enhanced Students Table */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className={`backdrop-blur-lg rounded-2xl shadow-xl overflow-hidden border ${
                darkMode ? 'bg-gray-800/80 border-gray-700/20' : 'bg-white/80 border-gray-200/20'
              }`}
            >
              <div className="overflow-x-auto">
                <Table.Root className={`${darkMode ? 'text-white' : 'text-gray-900'}`}>
                  <Table.Caption className={`${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    Student Management Dashboard
                  </Table.Caption>
                  <Table.Head className={`${darkMode ? 'bg-gray-700/50' : 'bg-gray-50/50'}`}>
                    <Table.Row>
                      <Table.Header className={`${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                        Student
                      </Table.Header>
                      <Table.Header className={`${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                        Registration
                      </Table.Header>
                      <Table.Header className={`${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                        Branch
                      </Table.Header>
                      <Table.Header className={`${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                        Semester
                      </Table.Header>
                      <Table.Header className={`${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                        Contact
                      </Table.Header>
                      <Table.Header textAlign="right" className={`${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                        Actions
                      </Table.Header>
                    </Table.Row>
                  </Table.Head>
                  <Table.Body className={`divide-y ${darkMode ? 'divide-gray-700' : 'divide-gray-200'}`}>
                    {loading ? (
                      <Table.Row>
                        <Table.Cell colSpan={6} textAlign="center">
                          <div className="flex justify-center items-center space-x-2 py-8">
                            <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                            <span className={`${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Loading students...</span>
                          </div>
                        </Table.Cell>
                      </Table.Row>
                    ) : (students?.length || 0) === 0 ? (
                      <Table.Row>
                        <Table.Cell colSpan={6} textAlign="center">
                          <div className="flex flex-col items-center space-y-3 py-8">
                            <Users className={`w-12 h-12 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`} />
                            <span className={`text-lg ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>No students found</span>
                          </div>
                        </Table.Cell>
                      </Table.Row>
                    ) : (
                      (students || []).map((student: any) => (
                        <Table.Row
                          key={student._id}
                          className={`transition-colors duration-200 ${
                            darkMode ? 'hover:bg-gray-700/50' : 'hover:bg-gray-50'
                          }`}
                        >
                          <Table.Cell>
                            <div className="flex items-center space-x-4">
                              <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-semibold">
                                {student.firstName?.[0]}{student.lastName?.[0]}
                              </div>
                              <div>
                                <div className={`text-sm font-semibold ${
                                  darkMode ? 'text-white' : 'text-gray-900'
                                }`}>
                                  {student.firstName} {student.lastName}
                                </div>
                                <div className={`flex items-center space-x-1 text-sm ${
                                  darkMode ? 'text-gray-400' : 'text-gray-500'
                                }`}>
                                  <Mail className="w-3 h-3" />
                                  <span>{student.email}</span>
                                </div>
                              </div>
                            </div>
                          </Table.Cell>
                          <Table.Cell>
                            <span className="text-sm font-mono bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 px-3 py-1 rounded-full">
                              {student.regdNo}
                            </span>
                          </Table.Cell>
                          <Table.Cell>
                            <div>
                              <div className={`text-sm font-medium ${
                                darkMode ? 'text-white' : 'text-gray-900'
                              }`}>
                                {student.branch?.name}
                              </div>
                              <div className={`text-sm ${
                                darkMode ? 'text-gray-400' : 'text-gray-500'
                              }`}>
                                {student.branch?.code}
                              </div>
                            </div>
                          </Table.Cell>
                          <Table.Cell>
                            <span className={`flex items-center space-x-1 text-sm ${
                              darkMode ? 'text-white' : 'text-gray-900'
                            }`}>
                              <Calendar className="w-3 h-3" />
                              <span>Sem {student.semester}</span>
                            </span>
                          </Table.Cell>
                          <Table.Cell>
                            <div className={`flex items-center space-x-1 text-sm ${
                              darkMode ? 'text-white' : 'text-gray-900'
                            }`}>
                              <Phone className="w-3 h-3" />
                              <span>{student.phone}</span>
                            </div>
                          </Table.Cell>
                          <Table.Cell textAlign="right">
                            <StudentActionButtons
                              student={student}
                              onEdit={handleEditStudent}
                              onDelete={handleOpenDeleteModal}
                              onView={handleViewStudent}
                              darkMode={darkMode}
                            />
                          </Table.Cell>
                        </Table.Row>
                      ))
                    )}
                  </Table.Body>
                  <Table.Foot className={`${darkMode ? 'bg-gray-700/50' : 'bg-gray-50/50'}`}>
                    <Table.Row>
                      <Table.Cell colSpan={4}>
                        <span className={`text-sm ${
                          darkMode ? 'text-gray-300' : 'text-gray-700'
                        }`}>
                          Total Students: {students?.length || 0}
                        </span>
                      </Table.Cell>
                      <Table.Cell colSpan={2} textAlign="right">
                        <span className={`text-sm font-medium ${
                          darkMode ? 'text-gray-300' : 'text-gray-700'
                        }`}>
                          Page {currentPage} of {totalPages}
                        </span>
                      </Table.Cell>
                    </Table.Row>
                  </Table.Foot>
                </Table.Root>
              </div>

              {/* Enhanced Pagination */}
              {totalPages > 1 && (
                <div className={`px-6 py-4 flex items-center justify-between border-t ${
                  darkMode ? 'bg-gray-700/50 border-gray-600' : 'bg-gray-50 border-gray-200'
                }`}>
                  <div className="flex items-center">
                    <span className={`text-sm ${
                      darkMode ? 'text-gray-300' : 'text-gray-700'
                    }`}>
                      Page {currentPage} of {totalPages}
                    </span>
                  </div>
                  <div className="flex space-x-2">
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                      disabled={currentPage === 1}
                      className={`px-4 py-2 text-sm font-medium border rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
                        darkMode 
                          ? 'text-gray-400 bg-gray-600 border-gray-500 hover:bg-gray-500' 
                          : 'text-gray-500 bg-white border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      Previous
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                      disabled={currentPage === totalPages}
                      className={`px-4 py-2 text-sm font-medium border rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
                        darkMode 
                          ? 'text-gray-400 bg-gray-600 border-gray-500 hover:bg-gray-500' 
                          : 'text-gray-500 bg-white border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      Next
                    </motion.button>
                  </div>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}

        {/* Subjects Tab */}
        {activeTab === 'subjects' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className={`space-y-6 rounded-xl ${darkMode ? '' : ''}`}
          >
            <div className="flex items-center justify-between">
              <div>
                <h3 className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>Subject Management</h3>
                <p className={`${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Create and manage subjects per branch</p>
              </div>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => { setSelectedSubject(null); setShowSubjectModal(true); }}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-medium transition-all flex items-center space-x-2"
              >
                <Plus className="w-5 h-5" />
                <span>Add Subject</span>
              </motion.button>
            </div>

            {/* Filters */}
            <div className={`rounded-xl p-4 border ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                <div>
                  <label className={`block text-sm mb-1 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Branch</label>
                  <select
                    value={subjectFilters.branch}
                    onChange={(e) => setSubjectFilters(prev => ({ ...prev, branch: e.target.value }))}
                    onBlur={fetchSubjects}
                    className={`w-full px-3 py-2 rounded-lg border ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'}`}
                  >
                    <option value="">All Branches</option>
                    {(branches || []).map((b: any) => (
                      <option key={b._id} value={b._id}>{b.name} ({b.code})</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className={`block text-sm mb-1 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Semester</label>
                  <select
                    value={subjectFilters.semester}
                    onChange={(e) => setSubjectFilters(prev => ({ ...prev, semester: e.target.value }))}
                    onBlur={fetchSubjects}
                    className={`w-full px-3 py-2 rounded-lg border ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'}`}
                  >
                    <option value="">All</option>
                    {[1,2,3,4,5,6,7,8].map(s => (
                      <option key={s} value={String(s)}>Semester {s}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className={`block text-sm mb-1 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Search</label>
                  <input
                    value={subjectFilters.search}
                    onChange={(e) => setSubjectFilters(prev => ({ ...prev, search: e.target.value }))}
                    onKeyDown={(e) => e.key === 'Enter' && fetchSubjects()}
                    placeholder="Name or code"
                    className={`w-full px-3 py-2 rounded-lg border ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'}`}
                  />
                </div>
                <div className="flex items-end">
                  <label className="inline-flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={subjectFilters.activeOnly}
                      onChange={(e) => { setSubjectFilters(prev => ({ ...prev, activeOnly: e.target.checked })); setTimeout(fetchSubjects, 0); }}
                      className="mr-2"
                    />
                    <span className={`${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Active only</span>
                  </label>
                </div>
              </div>
              <div className="mt-3">
                <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} onClick={fetchSubjects} className={`px-4 py-2 rounded-lg ${darkMode ? 'bg-gray-700 text-white' : 'bg-gray-100'}`}>Apply</motion.button>
              </div>
            </div>

            {/* Table */}
            <div className={`rounded-2xl shadow-xl overflow-hidden border ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
              <div className="overflow-x-auto">
                <Table.Root className={`${darkMode ? 'text-white' : 'text-gray-900'}`}>
                  <Table.Caption className={`${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Subjects</Table.Caption>
                  <Table.Head className={`${darkMode ? 'bg-gray-700/50' : 'bg-gray-50/50'}`}>
                    <Table.Row>
                      <Table.Header className={`${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>Subject</Table.Header>
                      <Table.Header className={`${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>Code</Table.Header>
                      <Table.Header className={`${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>Branch</Table.Header>
                      <Table.Header className={`${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>Semester</Table.Header>
                      <Table.Header className={`${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>Status</Table.Header>
                      <Table.Header textAlign="right" className={`${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>Actions</Table.Header>
                    </Table.Row>
                  </Table.Head>
                  <Table.Body className={`divide-y ${darkMode ? 'divide-gray-700' : 'divide-gray-200'}`}>
                    {(subjects || []).length === 0 ? (
                      <Table.Row>
                        <Table.Cell colSpan={5} textAlign="center">
                          <div className="py-8 text-sm">No subjects found</div>
                        </Table.Cell>
                      </Table.Row>
                    ) : (
                      (subjects || []).map((s: any) => (
                        <Table.Row key={s._id} className={`transition-colors ${darkMode ? 'hover:bg-gray-700/50' : 'hover:bg-gray-50'}`}>
                          <Table.Cell>
                            <div className="font-medium">{s.name}</div>
                            <div className={`${darkMode ? 'text-gray-400' : 'text-gray-500'} text-sm`}>{s.description || '—'}</div>
                          </Table.Cell>
                          <Table.Cell>
                            <span className="text-sm font-mono bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-300 px-3 py-1 rounded-full">{s.code}</span>
                          </Table.Cell>
                          <Table.Cell>
                            <div className="text-sm">{s.branch?.name}</div>
                            <div className={`${darkMode ? 'text-gray-400' : 'text-gray-500'} text-sm`}>{s.branch?.code}</div>
                          </Table.Cell>
                          <Table.Cell>
                            <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${darkMode ? 'bg-indigo-900/30 text-indigo-300' : 'bg-indigo-100 text-indigo-800'}`}>Sem {s.semester}</span>
                          </Table.Cell>
                          <Table.Cell>
                            <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${
                              s.isActive ? (darkMode ? 'bg-green-900/30 text-green-300' : 'bg-green-100 text-green-800') : (darkMode ? 'bg-red-900/30 text-red-300' : 'bg-red-100 text-red-800')
                            }`}>{s.isActive ? 'Active' : 'Inactive'}</span>
                          </Table.Cell>
                          <Table.Cell textAlign="right">
                            <div className="flex items-center justify-end space-x-2">
                              <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} onClick={() => { setSelectedSubject(s); setShowSubjectModal(true); }} className={`p-2 rounded-lg ${darkMode ? 'text-green-400 hover:bg-green-900/30' : 'text-green-600 hover:bg-green-100'}`} title="Edit Subject"><Edit3 className="w-4 h-4" /></motion.button>
                              <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} onClick={async () => {
                                const confirm = window.confirm(`Deactivate subject ${s.name}?`);
                                if (!confirm) return;
                                try {
                                  const token = localStorage.getItem('token');
                                  await axios.delete(getApiUrl(`api/subjects/${s._id}`), { headers: { Authorization: `Bearer ${token}` } });
                                  fetchSubjects();
                                } catch (e) { console.error(e); alert('Failed to delete subject'); }
                              }} className={`p-2 rounded-lg ${darkMode ? 'text-red-400 hover:bg-red-900/30' : 'text-red-600 hover:bg-red-100'}`} title="Delete Subject"><Trash2 className="w-4 h-4" /></motion.button>
                            </div>
                          </Table.Cell>
                        </Table.Row>
                      ))
                    )}
                  </Table.Body>
                </Table.Root>
              </div>
            </div>

            {/* Subject Modal */}
            <AnimatePresence>
              {showSubjectModal && (
                <SubjectModal
                  subject={selectedSubject}
                  branches={branches}
                  onClose={() => { setShowSubjectModal(false); setSelectedSubject(null); }}
                  onSave={() => { setShowSubjectModal(false); setSelectedSubject(null); fetchSubjects(); }}
                  darkMode={darkMode}
                />
              )}
            </AnimatePresence>
          </motion.div>
        )}

        {/* Settings Tab */}
        {activeTab === 'settings' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className={`rounded-xl shadow-lg p-6 ${
              darkMode ? 'bg-gray-800' : 'bg-white'
            }`}
          >
            {/* Branch Management Header */}
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className={`text-2xl font-bold ${
                  darkMode ? 'text-white' : 'text-gray-900'
                }`}>
                  Branch Management
                </h3>
                <p className={`text-sm ${
                  darkMode ? 'text-gray-400' : 'text-gray-600'
                }`}>
                  Manage academic branches and their configurations
                </p>
              </div>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleAddBranch}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-medium transition-all flex items-center space-x-2"
              >
                <Plus className="w-5 h-5" />
                <span>Add Branch</span>
              </motion.button>
            </div>

            {/* Branch Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <motion.div
                whileHover={{ scale: 1.02 }}
                className={`p-6 rounded-xl border ${
                  darkMode 
                    ? 'bg-gradient-to-r from-blue-900/50 to-purple-900/50 border-blue-700/50' 
                    : 'bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className={`text-sm font-medium ${
                      darkMode ? 'text-blue-300' : 'text-blue-600'
                    }`}>
                      Total Branches
                    </p>
                    <p className={`text-3xl font-bold ${
                      darkMode ? 'text-white' : 'text-gray-900'
                    }`}>
                      {branches?.length || 0}
                    </p>
                  </div>
                  <Building className={`w-8 h-8 ${
                    darkMode ? 'text-blue-400' : 'text-blue-500'
                  }`} />
                </div>
              </motion.div>

              <motion.div
                whileHover={{ scale: 1.02 }}
                className={`p-6 rounded-xl border ${
                  darkMode 
                    ? 'bg-gradient-to-r from-green-900/50 to-emerald-900/50 border-green-700/50' 
                    : 'bg-gradient-to-r from-green-50 to-emerald-50 border-green-200'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className={`text-sm font-medium ${
                      darkMode ? 'text-green-300' : 'text-green-600'
                    }`}>
                      Active Branches
                    </p>
                    <p className={`text-3xl font-bold ${
                      darkMode ? 'text-white' : 'text-gray-900'
                    }`}>
                      {(branches || []).filter((b: any) => b.isActive !== false).length}
                    </p>
                  </div>
                  <CheckCircle className={`w-8 h-8 ${
                    darkMode ? 'text-green-400' : 'text-green-500'
                  }`} />
                </div>
              </motion.div>

              <motion.div
                whileHover={{ scale: 1.02 }}
                className={`p-6 rounded-xl border ${
                  darkMode 
                    ? 'bg-gradient-to-r from-purple-900/50 to-pink-900/50 border-purple-700/50' 
                    : 'bg-gradient-to-r from-purple-50 to-pink-50 border-purple-200'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className={`text-sm font-medium ${
                      darkMode ? 'text-purple-300' : 'text-purple-600'
                    }`}>
                      Total Students
                    </p>
                    <p className={`text-3xl font-bold ${
                      darkMode ? 'text-white' : 'text-gray-900'
                    }`}>
                      {students?.length || 0}
                    </p>
                  </div>
                  <Users className={`w-8 h-8 ${
                    darkMode ? 'text-purple-400' : 'text-purple-500'
                  }`} />
                </div>
              </motion.div>
            </div>

            {/* Branch Table */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className={`backdrop-blur-lg rounded-2xl shadow-xl overflow-hidden border ${
                darkMode ? 'bg-gray-800/80 border-gray-700/20' : 'bg-white/80 border-gray-200/20'
              }`}
            >
              <div className="overflow-x-auto">
                <Table.Root className={`${darkMode ? 'text-white' : 'text-gray-900'}`}>
                  <Table.Caption className={`${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    Branch Management System
                  </Table.Caption>
                  <Table.Head className={`${darkMode ? 'bg-gray-700/50' : 'bg-gray-50/50'}`}>
                    <Table.Row>
                      <Table.Header className={`${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                        Branch Details
                      </Table.Header>
                      <Table.Header className={`${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                        Code
                      </Table.Header>
                      <Table.Header className={`${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                        Strength
                      </Table.Header>
                      <Table.Header className={`${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                        Students
                      </Table.Header>
                      <Table.Header className={`${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                        Status
                      </Table.Header>
                      <Table.Header textAlign="right" className={`${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                        Actions
                      </Table.Header>
                    </Table.Row>
                  </Table.Head>
                  <Table.Body className={`divide-y ${darkMode ? 'divide-gray-700' : 'divide-gray-200'}`}>
                    {loading ? (
                      <Table.Row>
                        <Table.Cell colSpan={6} textAlign="center">
                          <div className="flex justify-center items-center space-x-2 py-8">
                            <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                            <span className={`${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Loading branches...</span>
                          </div>
                        </Table.Cell>
                      </Table.Row>
                    ) : (branches?.length || 0) === 0 ? (
                      <Table.Row>
                        <Table.Cell colSpan={6} textAlign="center">
                          <div className="flex flex-col items-center space-y-3 py-8">
                            <Building className={`w-12 h-12 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`} />
                            <span className={`text-lg ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>No branches found</span>
                          </div>
                        </Table.Cell>
                      </Table.Row>
                    ) : (
                      (branches || []).map((branch: any) => {
                        const branchStudents = (students || []).filter((s: any) => s.branch?._id === branch._id);
                        return (
                          <Table.Row
                            key={branch._id}
                            className={`transition-colors duration-200 ${
                              darkMode ? 'hover:bg-gray-700/50' : 'hover:bg-gray-50'
                            }`}
                          >
                            <Table.Cell>
                              <div className="flex items-center space-x-4">
                                <div className="w-10 h-10 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full flex items-center justify-center text-white font-semibold">
                                  {branch.name?.[0]?.toUpperCase()}
                                </div>
                                <div>
                                  <div className={`text-sm font-semibold ${
                                    darkMode ? 'text-white' : 'text-gray-900'
                                  }`}>
                                    {branch.name}
                                  </div>
                                  <div className={`text-sm ${
                                    darkMode ? 'text-gray-400' : 'text-gray-500'
                                  }`}>
                                    {branch.description || 'No description'}
                                  </div>
                                </div>
                              </div>
                            </Table.Cell>
                            <Table.Cell>
                              <span className="text-sm font-mono bg-indigo-100 dark:bg-indigo-900/30 text-indigo-800 dark:text-indigo-300 px-3 py-1 rounded-full">
                                {branch.code}
                              </span>
                            </Table.Cell>
                            <Table.Cell>
                              <div className={`text-sm font-medium ${
                                darkMode ? 'text-white' : 'text-gray-900'
                              }`}>
                                {branch.maxStrength || 'N/A'}
                              </div>
                            </Table.Cell>
                            <Table.Cell>
                              <div className="flex items-center space-x-2">
                                <span className={`text-sm font-medium ${
                                  darkMode ? 'text-white' : 'text-gray-900'
                                }`}>
                                  {branchStudents.length}
                                </span>
                                <div className={`w-16 h-2 rounded-full ${
                                  darkMode ? 'bg-gray-700' : 'bg-gray-200'
                                }`}>
                                  <div 
                                    className="h-2 rounded-full bg-gradient-to-r from-blue-500 to-purple-500"
                                    style={{ 
                                      width: `${Math.min(100, (branchStudents.length / (branch.maxStrength || 100)) * 100)}%` 
                                    }}
                                  ></div>
                                </div>
                              </div>
                            </Table.Cell>
                            <Table.Cell>
                              <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${
                                branch.isActive !== false
                                  ? darkMode 
                                    ? 'bg-green-900/30 text-green-300' 
                                    : 'bg-green-100 text-green-800'
                                  : darkMode
                                    ? 'bg-red-900/30 text-red-300'
                                    : 'bg-red-100 text-red-800'
                              }`}>
                                {branch.isActive !== false ? 'Active' : 'Inactive'}
                              </span>
                            </Table.Cell>
                            <Table.Cell textAlign="right">
                              <BranchActionButtons
                                branch={branch}
                                onEdit={handleEditBranch}
                                onDelete={handleOpenBranchDeleteModal}
                                darkMode={darkMode}
                                totalStudents={branchStudents.length}
                              />
                            </Table.Cell>
                          </Table.Row>
                        );
                      })
                    )}
                  </Table.Body>
                  <Table.Foot className={`${darkMode ? 'bg-gray-700/50' : 'bg-gray-50/50'}`}>
                    <Table.Row>
                      <Table.Cell colSpan={4}>
                        <span className={`text-sm ${
                          darkMode ? 'text-gray-300' : 'text-gray-700'
                        }`}>
                          Total Branches: {branches?.length || 0}
                        </span>
                      </Table.Cell>
                      <Table.Cell colSpan={2} textAlign="right">
                        <span className={`text-sm font-medium ${
                          darkMode ? 'text-gray-300' : 'text-gray-700'
                        }`}>
                          Active: {(branches || []).filter((b: any) => b.isActive !== false).length}
                        </span>
                      </Table.Cell>
                    </Table.Row>
                  </Table.Foot>
                </Table.Root>
              </div>
            </motion.div>
          </motion.div>
        )}
      </div>

      {/* Modals */}
      <AnimatePresence>
        {showAddModal && (
          <StudentModal
            student={selectedStudent}
            branches={branches}
            onClose={() => setShowAddModal(false)}
            onSave={() => {
              setShowAddModal(false);
              fetchStudents();
              fetchBranchStats();
            }}
            darkMode={darkMode}
          />
        )}
        
        {showViewModal && selectedStudent && (
          <StudentViewModal
            student={selectedStudent}
            onClose={() => {
              setShowViewModal(false);
              setSelectedStudent(null);
            }}
            darkMode={darkMode}
          />
        )}

        {showDeleteModal && deleteStudentData && (
          <DeleteModal
            studentData={deleteStudentData}
            onClose={handleCloseDeleteModal}
            onDelete={handleDeleteStudent}
            darkMode={darkMode}
          />
        )}

        {showBranchModal && (
          <BranchModal
            branch={selectedBranch}
            onClose={() => {
              setShowBranchModal(false);
              setSelectedBranch(null);
            }}
            onSave={() => {
              setShowBranchModal(false);
              setSelectedBranch(null);
              fetchBranches();
              fetchBranchStats();
              fetchStudents();
            }}
            darkMode={darkMode}
          />
        )}

        {showBranchDeleteModal && deleteBranchData && (
          <BranchDeleteModal
            branchData={deleteBranchData}
            onClose={handleCloseBranchDeleteModal}
            onDelete={handleDeleteBranch}
            darkMode={darkMode}
          />
        )}
      </AnimatePresence>
      </div> {/* Close main content area */}
    </div>
  );
};

// Student Action Buttons Component
const StudentActionButtons: React.FC<{
  student: any;
  onEdit: (student: any) => void;
  onDelete: (student: any) => void;
  onView: (student: any) => void;
  darkMode: boolean;
}> = ({ student, onEdit, onDelete, onView, darkMode }) => {
  return (
    <div className="flex items-center space-x-2">
      {/* View Button */}
      <motion.button
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={() => onView(student)}
        className={`p-2 rounded-lg transition-all ${
          darkMode ? 'text-blue-400 hover:bg-blue-900/30' : 'text-blue-600 hover:bg-blue-100'
        }`}
        title="View Details"
      >
        <Eye className="w-4 h-4" />
      </motion.button>

      {/* Edit Button */}
      <motion.button
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={() => onEdit(student)}
        className={`p-2 rounded-lg transition-all ${
          darkMode ? 'text-green-400 hover:bg-green-900/30' : 'text-green-600 hover:bg-green-100'
        }`}
        title="Edit Student"
      >
        <Edit3 className="w-4 h-4" />
      </motion.button>

      {/* Delete Button */}
      <motion.button
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={() => onDelete(student)}
        className={`p-2 rounded-lg transition-all ${
          darkMode ? 'text-red-400 hover:bg-red-900/30' : 'text-red-600 hover:bg-red-100'
        }`}
        title="Delete Options"
      >
        <Trash2 className="w-4 h-4" />
      </motion.button>
    </div>
  );
};

// Branch Action Buttons Component
const BranchActionButtons: React.FC<{
  branch: any;
  onEdit: (branch: any) => void;
  onDelete: (branch: any) => void;
  darkMode: boolean;
  totalStudents: number;
}> = ({ branch, onEdit, onDelete, darkMode, totalStudents }) => {
  return (
    <div className="flex items-center space-x-2">
      {/* Edit Button */}
      <motion.button
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={() => onEdit(branch)}
        className={`p-2 rounded-lg transition-all ${
          darkMode ? 'text-green-400 hover:bg-green-900/30' : 'text-green-600 hover:bg-green-100'
        }`}
        title="Edit Branch"
      >
        <Edit3 className="w-4 h-4" />
      </motion.button>

      {/* Delete Button */}
      <motion.button
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={() => onDelete({...branch, totalStudents})}
        className={`p-2 rounded-lg transition-all ${
          darkMode ? 'text-red-400 hover:bg-red-900/30' : 'text-red-600 hover:bg-red-100'
        }`}
        title="Delete Options"
      >
        <Trash2 className="w-4 h-4" />
      </motion.button>
    </div>
  );
};

// Student View Modal Component
const StudentViewModal: React.FC<{
  student: any;
  onClose: () => void;
  darkMode: boolean;
}> = ({ student, onClose, darkMode }) => {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.9, opacity: 0, y: 20 }}
        onClick={(e) => e.stopPropagation()}
        className={`rounded-2xl p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto shadow-2xl ${
          darkMode ? 'bg-gray-800' : 'bg-white'
        }`}
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
            Student Details
          </h2>
          <button
            onClick={onClose}
            className={`p-2 rounded-lg transition-colors ${
              darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'
            }`}
          >
            ✕
          </button>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div>
              <label className={`text-sm font-medium ${
                darkMode ? 'text-gray-400' : 'text-gray-500'
              }`}>Full Name</label>
              <p className={`text-lg font-semibold ${
                darkMode ? 'text-white' : 'text-gray-900'
              }`}>
                {student.firstName} {student.lastName}
              </p>
            </div>
            
            <div>
              <label className={`text-sm font-medium ${
                darkMode ? 'text-gray-400' : 'text-gray-500'
              }`}>Registration Number</label>
              <p className={`text-lg font-semibold ${
                darkMode ? 'text-white' : 'text-gray-900'
              }`}>{student.regdNo}</p>
            </div>
            
            <div>
              <label className={`text-sm font-medium ${
                darkMode ? 'text-gray-400' : 'text-gray-500'
              }`}>Email</label>
              <p className={`text-lg ${
                darkMode ? 'text-white' : 'text-gray-900'
              }`}>{student.email}</p>
            </div>
            
            <div>
              <label className={`text-sm font-medium ${
                darkMode ? 'text-gray-400' : 'text-gray-500'
              }`}>Phone</label>
              <p className={`text-lg ${
                darkMode ? 'text-white' : 'text-gray-900'
              }`}>{student.phone}</p>
            </div>
            
            <div>
              <label className={`text-sm font-medium ${
                darkMode ? 'text-gray-400' : 'text-gray-500'
              }`}>Date of Birth</label>
              <p className={`text-lg ${
                darkMode ? 'text-white' : 'text-gray-900'
              }`}>
                {new Date(student.dateOfBirth).toLocaleDateString()}
              </p>
            </div>
            
            <div>
              <label className={`text-sm font-medium ${
                darkMode ? 'text-gray-400' : 'text-gray-500'
              }`}>Gender</label>
              <p className={`text-lg ${
                darkMode ? 'text-white' : 'text-gray-900'
              }`}>{student.gender}</p>
            </div>
          </div>
          
          <div className="space-y-4">
            <div>
              <label className={`text-sm font-medium ${
                darkMode ? 'text-gray-400' : 'text-gray-500'
              }`}>Branch</label>
              <p className={`text-lg font-semibold ${
                darkMode ? 'text-white' : 'text-gray-900'
              }`}>
                {student.branch?.name} ({student.branch?.code})
              </p>
            </div>
            
            <div>
              <label className={`text-sm font-medium ${
                darkMode ? 'text-gray-400' : 'text-gray-500'
              }`}>Semester</label>
              <p className={`text-lg ${
                darkMode ? 'text-white' : 'text-gray-900'
              }`}>{student.semester}</p>
            </div>
            
            <div>
              <label className={`text-sm font-medium ${
                darkMode ? 'text-gray-400' : 'text-gray-500'
              }`}>Father's Name</label>
              <p className={`text-lg ${
                darkMode ? 'text-white' : 'text-gray-900'
              }`}>{student.fatherName}</p>
            </div>
            
            <div>
              <label className={`text-sm font-medium ${
                darkMode ? 'text-gray-400' : 'text-gray-500'
              }`}>Mother's Name</label>
              <p className={`text-lg ${
                darkMode ? 'text-white' : 'text-gray-900'
              }`}>{student.motherName}</p>
            </div>
            
            <div>
              <label className={`text-sm font-medium ${
                darkMode ? 'text-gray-400' : 'text-gray-500'
              }`}>Guardian Phone</label>
              <p className={`text-lg ${
                darkMode ? 'text-white' : 'text-gray-900'
              }`}>{student.guardianPhone}</p>
            </div>
            
            <div>
              <label className={`text-sm font-medium ${
                darkMode ? 'text-gray-400' : 'text-gray-500'
              }`}>Category</label>
              <p className={`text-lg ${
                darkMode ? 'text-white' : 'text-gray-900'
              }`}>{student.category}</p>
            </div>
            
            {student.bloodGroup && (
              <div>
                <label className={`text-sm font-medium ${
                  darkMode ? 'text-gray-400' : 'text-gray-500'
                }`}>Blood Group</label>
                <p className={`text-lg ${
                  darkMode ? 'text-white' : 'text-gray-900'
                }`}>{student.bloodGroup}</p>
              </div>
            )}
            
            <div>
              <label className={`text-sm font-medium ${
                darkMode ? 'text-gray-400' : 'text-gray-500'
              }`}>Admission Date</label>
              <p className={`text-lg ${
                darkMode ? 'text-white' : 'text-gray-900'
              }`}>
                {new Date(student.admissionDate).toLocaleDateString()}
              </p>
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

// Delete Confirmation Modal Component
const DeleteModal: React.FC<{
  studentData: {student: any, studentInfo: any} | null;
  onClose: () => void;
  onDelete: (studentId: string, studentInfo: any, permanent?: boolean) => void;
  darkMode: boolean;
}> = ({ studentData, onClose, onDelete, darkMode }) => {
  if (!studentData) return null;

  const { student, studentInfo } = studentData;

  const handleDelete = (permanent: boolean) => {
    onDelete(student._id, studentInfo, permanent);
    onClose();
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.9, opacity: 0, y: 20 }}
        className={`w-full max-w-md rounded-2xl shadow-2xl p-6 ${
          darkMode ? 'bg-gray-800 border border-gray-700' : 'bg-white border border-gray-200'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header with Close Button */}
        <div className="flex items-center justify-between mb-6">
          <h2 className={`text-xl font-bold ${
            darkMode ? 'text-white' : 'text-gray-900'
          }`}>
            Delete Student
          </h2>
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={onClose}
            className={`p-2 rounded-lg transition-all ${
              darkMode 
                ? 'text-gray-400 hover:text-white hover:bg-gray-700' 
                : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100'
            }`}
          >
            <X className="w-5 h-5" />
          </motion.button>
        </div>

        {/* Student Info */}
        <div className={`mb-6 p-4 rounded-lg ${
          darkMode ? 'bg-gray-700/50' : 'bg-gray-50'
        }`}>
          <div className="flex items-center space-x-3 mb-2">
            <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-semibold">
              {studentInfo.firstName?.[0]}{studentInfo.lastName?.[0]}
            </div>
            <div>
              <p className={`font-semibold ${
                darkMode ? 'text-white' : 'text-gray-900'
              }`}>
                {studentInfo.firstName} {studentInfo.lastName}
              </p>
              <p className={`text-sm ${
                darkMode ? 'text-gray-400' : 'text-gray-500'
              }`}>
                {studentInfo.regdNo}
              </p>
            </div>
          </div>
          <div className={`text-sm ${
            darkMode ? 'text-gray-400' : 'text-gray-600'
          }`}>
            <p>{studentInfo.email}</p>
            <p>{studentInfo.branch?.name} ({studentInfo.branch?.code})</p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="space-y-3">
          {/* Deactivate Button */}
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => handleDelete(false)}
            className={`w-full p-4 rounded-lg border-2 transition-all ${
              darkMode 
                ? 'border-yellow-500/50 bg-yellow-900/20 hover:bg-yellow-900/30 text-yellow-300' 
                : 'border-yellow-300 bg-yellow-50 hover:bg-yellow-100 text-yellow-700'
            }`}
          >
            <div className="flex items-center justify-center space-x-2">
              <AlertCircle className="w-5 h-5" />
              <div className="text-left">
                <div className="font-semibold">Deactivate Student</div>
                <div className="text-sm opacity-80">Reversible action - can be reactivated later</div>
              </div>
            </div>
          </motion.button>

          {/* Permanent Delete Button */}
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => handleDelete(true)}
            className={`w-full p-4 rounded-lg border-2 transition-all ${
              darkMode 
                ? 'border-red-500/50 bg-red-900/20 hover:bg-red-900/30 text-red-300' 
                : 'border-red-300 bg-red-50 hover:bg-red-100 text-red-700'
            }`}
          >
            <div className="flex items-center justify-center space-x-2">
              <Trash2 className="w-5 h-5" />
              <div className="text-left">
                <div className="font-semibold">Delete Permanently</div>
                <div className="text-sm opacity-80">⚠️ Cannot be undone - removes all data</div>
              </div>
            </div>
          </motion.button>
        </div>

        {/* Cancel Button */}
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={onClose}
          className={`w-full mt-4 py-3 px-4 rounded-lg border transition-all ${
            darkMode 
              ? 'border-gray-600 text-gray-300 hover:bg-gray-700' 
              : 'border-gray-300 text-gray-700 hover:bg-gray-50'
          }`}
        >
          Cancel
        </motion.button>
      </motion.div>
    </motion.div>
  );
};

// Branch Delete Confirmation Modal Component
const BranchDeleteModal: React.FC<{
  branchData: {branch: any} | null;
  onClose: () => void;
  onDelete: (branchId: string, branchInfo: any, permanent?: boolean) => void;
  darkMode: boolean;
}> = ({ branchData, onClose, onDelete, darkMode }) => {
  if (!branchData) return null;

  const { branch } = branchData;

  const handleDelete = (permanent: boolean) => {
    onDelete(branch._id, branch, permanent);
    onClose();
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.9, opacity: 0, y: 20 }}
        className={`w-full max-w-md rounded-2xl shadow-2xl p-6 ${
          darkMode ? 'bg-gray-800 border border-gray-700' : 'bg-white border border-gray-200'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header with Close Button */}
        <div className="flex items-center justify-between mb-6">
          <h2 className={`text-xl font-bold ${
            darkMode ? 'text-white' : 'text-gray-900'
          }`}>
            Delete Branch
          </h2>
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={onClose}
            className={`p-2 rounded-lg transition-all ${
              darkMode 
                ? 'text-gray-400 hover:text-white hover:bg-gray-700' 
                : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100'
            }`}
          >
            <X className="w-5 h-5" />
          </motion.button>
        </div>

        {/* Branch Info */}
        <div className={`mb-6 p-4 rounded-lg ${
          darkMode ? 'bg-gray-700/50' : 'bg-gray-50'
        }`}>
          <div className="flex items-center space-x-3 mb-2">
            <div className="w-10 h-10 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full flex items-center justify-center text-white font-semibold">
              {branch.name?.[0]?.toUpperCase()}
            </div>
            <div>
              <p className={`font-semibold ${
                darkMode ? 'text-white' : 'text-gray-900'
              }`}>
                {branch.name}
              </p>
              <p className={`text-sm ${
                darkMode ? 'text-gray-400' : 'text-gray-500'
              }`}>
                Code: {branch.code}
              </p>
            </div>
          </div>
          <div className={`text-sm ${
            darkMode ? 'text-gray-400' : 'text-gray-600'
          }`}>
            <p>Max Strength: {branch.maxStrength || 'N/A'}</p>
            <p>Current Students: {branch.totalStudents || 0}</p>
            {branch.totalStudents > 0 && (
              <p className="text-red-500 font-medium mt-2">
                ⚠️ Warning: This branch has {branch.totalStudents} students
              </p>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="space-y-3">
          {/* Deactivate Button */}
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => handleDelete(false)}
            className={`w-full p-4 rounded-lg border-2 transition-all ${
              darkMode 
                ? 'border-yellow-500/50 bg-yellow-900/20 hover:bg-yellow-900/30 text-yellow-300' 
                : 'border-yellow-300 bg-yellow-50 hover:bg-yellow-100 text-yellow-700'
            }`}
          >
            <div className="flex items-center justify-center space-x-2">
              <AlertCircle className="w-5 h-5" />
              <div className="text-left">
                <div className="font-semibold">Deactivate Branch</div>
                <div className="text-sm opacity-80">Reversible - students remain safe</div>
              </div>
            </div>
          </motion.button>

          {/* Permanent Delete Button */}
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => handleDelete(true)}
            className={`w-full p-4 rounded-lg border-2 transition-all ${
              darkMode 
                ? 'border-red-500/50 bg-red-900/20 hover:bg-red-900/30 text-red-300' 
                : 'border-red-300 bg-red-50 hover:bg-red-100 text-red-700'
            }`}
          >
            <div className="flex items-center justify-center space-x-2">
              <Trash2 className="w-5 h-5" />
              <div className="text-left">
                <div className="font-semibold">Delete Permanently</div>
                <div className="text-sm opacity-80">⚠️ Deletes branch AND all students</div>
              </div>
            </div>
          </motion.button>
        </div>

        {/* Cancel Button */}
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={onClose}
          className={`w-full mt-4 py-3 px-4 rounded-lg border transition-all ${
            darkMode 
              ? 'border-gray-600 text-gray-300 hover:bg-gray-700' 
              : 'border-gray-300 text-gray-700 hover:bg-gray-50'
          }`}
        >
          Cancel
        </motion.button>
      </motion.div>
    </motion.div>
  );
};

// Branch Modal Component
const BranchModal: React.FC<{
  branch: any;
  onClose: () => void;
  onSave: () => void;
  darkMode: boolean;
}> = ({ branch, onClose, onSave, darkMode }) => {
  const [formData, setFormData] = useState({
    name: branch?.name || '',
    code: branch?.code || '',
    description: branch?.description || '',
    maxStrength: branch?.maxStrength || ''
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Validate required fields
      if (!formData.name.trim()) {
        alert('❌ Branch name is required');
        setLoading(false);
        return;
      }
      
      if (!formData.code.trim()) {
        alert('❌ Branch code is required');
        setLoading(false);
        return;
      }
      
      if (!formData.description.trim()) {
        alert('❌ Branch description is required');
        setLoading(false);
        return;
      }

      const token = localStorage.getItem('token');
      
      // Check for duplicate branch code only when adding a new branch
      if (!branch) {
        const checkResponse = await axios.get(getApiUrl(`api/branches/check-code/${formData.code}`), {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        if (checkResponse.data.exists) {
          alert('❌ Branch code already exists. Please use a different code.');
          setLoading(false);
          return;
        }
      }

      const url = branch 
        ? getApiUrl(`api/branches/${branch._id}`)
        : getApiUrl('api/branches');
      
      const method = branch ? 'put' : 'post';
      
      const response = await axios[method](url, formData, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.success) {
        alert(branch ? '✅ Branch updated successfully!' : '✅ Branch created successfully!');
        onSave();
      } else {
        alert('❌ Failed to save branch: ' + response.data.message);
      }
    } catch (error: any) {
      console.error('❌ Error saving branch:', error);
      if (error.response?.status === 400) {
        alert('❌ ' + (error.response.data.message || 'Invalid branch data'));
      } else {
        alert('❌ Failed to save branch. Please try again.');
      }
    }
    
    setLoading(false);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.9, opacity: 0, y: 20 }}
        className={`w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden ${
          darkMode ? 'bg-gray-800 border border-gray-700' : 'bg-white border border-gray-200'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className={`px-6 py-4 border-b ${
          darkMode ? 'border-gray-700 bg-gray-700/50' : 'border-gray-200 bg-gray-50'
        }`}>
          <div className="flex items-center justify-between">
            <h2 className={`text-xl font-bold ${
              darkMode ? 'text-white' : 'text-gray-900'
            }`}>
              {branch ? 'Edit Branch' : 'Add New Branch'}
            </h2>
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={onClose}
              className={`p-2 rounded-lg transition-all ${
                darkMode 
                  ? 'text-gray-400 hover:text-white hover:bg-gray-600' 
                  : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100'
              }`}
            >
              <X className="w-5 h-5" />
            </motion.button>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Branch Name */}
            <div>
              <label className={`block text-sm font-medium mb-2 ${
                darkMode ? 'text-gray-300' : 'text-gray-700'
              }`}>
                Branch Name *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${
                  darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'
                }`}
                placeholder="Computer Science Engineering"
                required
              />
            </div>

            {/* Branch Code */}
            <div>
              <label className={`block text-sm font-medium mb-2 ${
                darkMode ? 'text-gray-300' : 'text-gray-700'
              }`}>
                Branch Code *
              </label>
              <input
                type="text"
                value={formData.code}
                onChange={(e) => setFormData(prev => ({ ...prev, code: e.target.value.toUpperCase() }))}
                className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${
                  darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'
                }`}
                placeholder="CSE"
                maxLength={10}
                required
              />
            </div>
          </div>

          {/* Max Strength */}
          <div>
            <label className={`block text-sm font-medium mb-2 ${
              darkMode ? 'text-gray-300' : 'text-gray-700'
            }`}>
              Maximum Strength
            </label>
            <input
              type="number"
              value={formData.maxStrength}
              onChange={(e) => setFormData(prev => ({ ...prev, maxStrength: e.target.value }))}
              className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${
                darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'
              }`}
              placeholder="120"
              min="1"
            />
          </div>

          {/* Description */}
          <div>
            <label className={`block text-sm font-medium mb-2 ${
              darkMode ? 'text-gray-300' : 'text-gray-700'
            }`}>
              Description *
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              rows={3}
              className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all resize-none ${
                darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'
              }`}
              placeholder="Brief description of the branch..."
              required
            />
          </div>

          {/* Action Buttons */}
          <div className="flex space-x-4">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              type="button"
              onClick={onClose}
              className={`flex-1 py-3 px-4 rounded-xl border font-medium transition-all ${
                darkMode 
                  ? 'border-gray-600 text-gray-300 hover:bg-gray-700' 
                  : 'border-gray-300 text-gray-700 hover:bg-gray-50'
              }`}
            >
              Cancel
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              type="submit"
              disabled={loading}
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-3 px-4 rounded-xl font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
            >
              {loading && <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>}
              <span>{branch ? 'Update Branch' : 'Create Branch'}</span>
            </motion.button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
};

// Enhanced Student Modal Component
const StudentModal: React.FC<{
  student: any;
  branches: any[];
  onClose: () => void;
  onSave: () => void;
  darkMode: boolean;
}> = ({ student, branches, onClose, onSave, darkMode }) => {
  const [formData, setFormData] = useState({
    regdNo: student?.regdNo || '',
    firstName: student?.firstName || '',
    lastName: student?.lastName || '',
    email: student?.email || '',
    phone: student?.phone || '',
    dateOfBirth: student?.dateOfBirth ? new Date(student.dateOfBirth).toISOString().split('T')[0] : '',
    branch: student?.branch?._id || '',
    semester: student?.semester || 1,
    address: {
      street: student?.address?.street || '',
      city: student?.address?.city || '',
      state: student?.address?.state || '',
      pincode: student?.address?.pincode || ''
    },
    fatherName: student?.fatherName || '',
    motherName: student?.motherName || '',
    guardianPhone: student?.guardianPhone || '',
    bloodGroup: student?.bloodGroup || '',
    gender: student?.gender || '',
    category: student?.category || ''
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const token = localStorage.getItem('token');
      
      // Check for duplicate registration number only when adding a new student
      if (!student) {
        try {
          const checkResponse = await axios.get(getApiUrl(`api/students/check-regdno/${formData.regdNo}`), {
            headers: { Authorization: `Bearer ${token}` }
          });
          
          if (checkResponse.data.exists) {
            alert(`❌ Registration number "${formData.regdNo}" already exists! Please use a different registration number.`);
            setLoading(false);
            return;
          }
        } catch (checkError: any) {
          if (checkError.response?.status !== 404) {
            console.error('Error checking registration number:', checkError);
            alert('❌ Error validating registration number. Please try again.');
            setLoading(false);
            return;
          }
        }
      }
      
      const url = student 
        ? getApiUrl(`api/students/${student._id}`)
        : getApiUrl('api/students');
      
      const method = student ? 'PUT' : 'POST';
      
      await axios({
        method,
        url,
        data: formData,
        headers: { Authorization: `Bearer ${token}` }
      });

      onSave();
    } catch (error: any) {
      console.error('Error saving student:', error);
      
      if (error.response?.status === 400 && error.response?.data?.error === 'DUPLICATE_REGDNO') {
        const existing = error.response.data.existingStudent;
        alert(`❌ Registration number "${formData.regdNo}" already exists!\n\nExisting student: ${existing.firstName} ${existing.lastName}\nEmail: ${existing.email}\n\nPlease use a different registration number.`);
      } else if (error.response?.data?.message) {
        alert(`❌ Error: ${error.response.data.message}`);
      } else {
        alert('❌ Failed to save student. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50"
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.9, opacity: 0, y: 20 }}
        className={`rounded-2xl p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto shadow-2xl border ${
          darkMode ? 'bg-gray-800 border-gray-700/20' : 'bg-white border-gray-200/20'
        }`}
      >
        <div className="flex items-center space-x-3 mb-6">
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-2 rounded-lg">
            <Users className="w-6 h-6 text-white" />
          </div>
          <h2 className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
            {student ? 'Edit Student' : 'Add New Student'}
          </h2>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Personal Information */}
          <div className={`rounded-xl p-4 ${
            darkMode ? 'bg-gray-700/50' : 'bg-gray-50'
          }`}>
            <h3 className={`text-lg font-semibold mb-4 ${
              darkMode ? 'text-white' : 'text-gray-900'
            }`}>Personal Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className={`block text-sm font-medium mb-2 ${
                  darkMode ? 'text-gray-300' : 'text-gray-700'
                }`}>
                  Registration Number *
                </label>
                <input
                  type="text"
                  required
                  value={formData.regdNo}
                  onChange={(e) => setFormData(prev => ({ ...prev, regdNo: e.target.value }))}
                  className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${
                    darkMode ? 'bg-gray-600 border-gray-500 text-white' : 'bg-white border-gray-300'
                  }`}
                />
              </div>
              
              <div>
                <label className={`block text-sm font-medium mb-2 ${
                  darkMode ? 'text-gray-300' : 'text-gray-700'
                }`}>
                  First Name *
                </label>
                <input
                  type="text"
                  required
                  value={formData.firstName}
                  onChange={(e) => setFormData(prev => ({ ...prev, firstName: e.target.value }))}
                  className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${
                    darkMode ? 'bg-gray-600 border-gray-500 text-white' : 'bg-white border-gray-300'
                  }`}
                />
              </div>

              <div>
                <label className={`block text-sm font-medium mb-2 ${
                  darkMode ? 'text-gray-300' : 'text-gray-700'
                }`}>
                  Last Name *
                </label>
                <input
                  type="text"
                  required
                  value={formData.lastName}
                  onChange={(e) => setFormData(prev => ({ ...prev, lastName: e.target.value }))}
                  className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${
                    darkMode ? 'bg-gray-600 border-gray-500 text-white' : 'bg-white border-gray-300'
                  }`}
                />
              </div>

              <div>
                <label className={`block text-sm font-medium mb-2 ${
                  darkMode ? 'text-gray-300' : 'text-gray-700'
                }`}>
                  Email *
                </label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                  className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${
                    darkMode ? 'bg-gray-600 border-gray-500 text-white' : 'bg-white border-gray-300'
                  }`}
                />
              </div>

              <div>
                <label className={`block text-sm font-medium mb-2 ${
                  darkMode ? 'text-gray-300' : 'text-gray-700'
                }`}>
                  Phone *
                </label>
                <input
                  type="tel"
                  required
                  value={formData.phone}
                  onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                  className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${
                    darkMode ? 'bg-gray-600 border-gray-500 text-white' : 'bg-white border-gray-300'
                  }`}
                />
              </div>

              <div>
                <label className={`block text-sm font-medium mb-2 ${
                  darkMode ? 'text-gray-300' : 'text-gray-700'
                }`}>
                  Date of Birth *
                </label>
                <input
                  type="date"
                  required
                  value={formData.dateOfBirth}
                  onChange={(e) => setFormData(prev => ({ ...prev, dateOfBirth: e.target.value }))}
                  className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${
                    darkMode ? 'bg-gray-600 border-gray-500 text-white' : 'bg-white border-gray-300'
                  }`}
                />
              </div>
            </div>
          </div>

          {/* Academic Information */}
          <div className={`rounded-xl p-4 ${
            darkMode ? 'bg-gray-700/50' : 'bg-gray-50'
          }`}>
            <h3 className={`text-lg font-semibold mb-4 ${
              darkMode ? 'text-white' : 'text-gray-900'
            }`}>Academic Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className={`block text-sm font-medium mb-2 ${
                  darkMode ? 'text-gray-300' : 'text-gray-700'
                }`}>
                  Branch *
                </label>
                <select
                  required
                  value={formData.branch}
                  onChange={(e) => setFormData(prev => ({ ...prev, branch: e.target.value }))}
                  className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${
                    darkMode ? 'bg-gray-600 border-gray-500 text-white' : 'bg-white border-gray-300'
                  }`}
                >
                  <option value="">Select Branch</option>
                  {(branches || []).map((branch: any) => (
                    <option key={branch._id} value={branch._id}>
                      {branch.name} ({branch.code})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className={`block text-sm font-medium mb-2 ${
                  darkMode ? 'text-gray-300' : 'text-gray-700'
                }`}>
                  Semester *
                </label>
                <select
                  required
                  value={formData.semester}
                  onChange={(e) => setFormData(prev => ({ ...prev, semester: parseInt(e.target.value) }))}
                  className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${
                    darkMode ? 'bg-gray-600 border-gray-500 text-white' : 'bg-white border-gray-300'
                  }`}
                >
                  {[1, 2, 3, 4, 5, 6, 7, 8].map(sem => (
                    <option key={sem} value={sem}>Semester {sem}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Family Information */}
          <div className={`rounded-xl p-4 ${
            darkMode ? 'bg-gray-700/50' : 'bg-gray-50'
          }`}>
            <h3 className={`text-lg font-semibold mb-4 ${
              darkMode ? 'text-white' : 'text-gray-900'
            }`}>Family Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className={`block text-sm font-medium mb-2 ${
                  darkMode ? 'text-gray-300' : 'text-gray-700'
                }`}>
                  Father's Name *
                </label>
                <input
                  type="text"
                  required
                  value={formData.fatherName}
                  onChange={(e) => setFormData(prev => ({ ...prev, fatherName: e.target.value }))}
                  className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${
                    darkMode ? 'bg-gray-600 border-gray-500 text-white' : 'bg-white border-gray-300'
                  }`}
                />
              </div>

              <div>
                <label className={`block text-sm font-medium mb-2 ${
                  darkMode ? 'text-gray-300' : 'text-gray-700'
                }`}>
                  Mother's Name *
                </label>
                <input
                  type="text"
                  required
                  value={formData.motherName}
                  onChange={(e) => setFormData(prev => ({ ...prev, motherName: e.target.value }))}
                  className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${
                    darkMode ? 'bg-gray-600 border-gray-500 text-white' : 'bg-white border-gray-300'
                  }`}
                />
              </div>

              <div>
                <label className={`block text-sm font-medium mb-2 ${
                  darkMode ? 'text-gray-300' : 'text-gray-700'
                }`}>
                  Guardian Phone *
                </label>
                <input
                  type="tel"
                  required
                  value={formData.guardianPhone}
                  onChange={(e) => setFormData(prev => ({ ...prev, guardianPhone: e.target.value }))}
                  className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${
                    darkMode ? 'bg-gray-600 border-gray-500 text-white' : 'bg-white border-gray-300'
                  }`}
                />
              </div>
            </div>
          </div>

          {/* Additional Information */}
          <div className={`rounded-xl p-4 ${
            darkMode ? 'bg-gray-700/50' : 'bg-gray-50'
          }`}>
            <h3 className={`text-lg font-semibold mb-4 ${
              darkMode ? 'text-white' : 'text-gray-900'
            }`}>Additional Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className={`block text-sm font-medium mb-2 ${
                  darkMode ? 'text-gray-300' : 'text-gray-700'
                }`}>
                  Gender *
                </label>
                <select
                  required
                  value={formData.gender}
                  onChange={(e) => setFormData(prev => ({ ...prev, gender: e.target.value }))}
                  className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${
                    darkMode ? 'bg-gray-600 border-gray-500 text-white' : 'bg-white border-gray-300'
                  }`}
                >
                  <option value="">Select Gender</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div>
                <label className={`block text-sm font-medium mb-2 ${
                  darkMode ? 'text-gray-300' : 'text-gray-700'
                }`}>
                  Category *
                </label>
                <select
                  required
                  value={formData.category}
                  onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                  className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${
                    darkMode ? 'bg-gray-600 border-gray-500 text-white' : 'bg-white border-gray-300'
                  }`}
                >
                  <option value="">Select Category</option>
                  <option value="General">General</option>
                  <option value="OBC">OBC</option>
                  <option value="SC">SC</option>
                  <option value="ST">ST</option>
                  <option value="EWS">EWS</option>
                </select>
              </div>

              <div>
                <label className={`block text-sm font-medium mb-2 ${
                  darkMode ? 'text-gray-300' : 'text-gray-700'
                }`}>
                  Blood Group
                </label>
                <select
                  value={formData.bloodGroup}
                  onChange={(e) => setFormData(prev => ({ ...prev, bloodGroup: e.target.value }))}
                  className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${
                    darkMode ? 'bg-gray-600 border-gray-500 text-white' : 'bg-white border-gray-300'
                  }`}
                >
                  <option value="">Select Blood Group</option>
                  <option value="A+">A+</option>
                  <option value="A-">A-</option>
                  <option value="B+">B+</option>
                  <option value="B-">B-</option>
                  <option value="AB+">AB+</option>
                  <option value="AB-">AB-</option>
                  <option value="O+">O+</option>
                  <option value="O-">O-</option>
                </select>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end space-x-4 pt-6">
            <motion.button
              type="button"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={onClose}
              className={`px-6 py-3 border rounded-xl transition-all ${
                darkMode ? 'text-gray-400 border-gray-600 hover:bg-gray-700' : 'text-gray-600 border-gray-300 hover:bg-gray-50'
              }`}
            >
              Cancel
            </motion.button>
            <motion.button
              type="submit"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              disabled={loading}
              className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl hover:from-blue-700 hover:to-purple-700 disabled:opacity-50 transition-all shadow-lg disabled:cursor-not-allowed"
            >
              {loading ? (
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Saving...</span>
                </div>
              ) : (
                'Save Student'
              )}
            </motion.button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
};

export default AdminDashboard;

// Subject Modal Component
const SubjectModal: React.FC<{
  subject: any | null;
  branches: any[];
  onClose: () => void;
  onSave: () => void;
  darkMode: boolean;
}> = ({ subject, branches, onClose, onSave, darkMode }) => {
  const isEdit = !!subject?._id;
  const [form, setForm] = useState({
    name: subject?.name || '',
    code: subject?.code || '',
    branch: subject?.branch?._id || subject?.branch || '',
    description: subject?.description || '',
    semester: subject?.semester || 1,
    isActive: subject?.isActive ?? true
  });
  const [saving, setSaving] = useState(false);

  const handleChange = (key: string, value: any) => setForm(prev => ({ ...prev, [key]: value }));

  const submit = async () => {
    if (!form.name || !form.code || !form.branch) {
      alert('Name, code and branch are required');
      return;
    }
    setSaving(true);
    try {
      const token = localStorage.getItem('token');
      if (isEdit) {
        await axios.put(getApiUrl(`api/subjects/${subject._id}`), {
          name: form.name,
          code: form.code,
          branch: form.branch,
          description: form.description,
          semester: form.semester,
          isActive: form.isActive
        }, { headers: { Authorization: `Bearer ${token}` } });
      } else {
        await axios.post(getApiUrl('api/subjects'), {
          name: form.name,
          code: form.code,
          branch: form.branch,
          description: form.description,
          semester: form.semester
        }, { headers: { Authorization: `Bearer ${token}` } });
      }
      onSave();
    } catch (e: any) {
      console.error('Error saving subject', e);
      alert(e?.response?.data?.message || 'Failed to save subject');
    } finally {
      setSaving(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.95, opacity: 0, y: 20 }}
        onClick={(e) => e.stopPropagation()}
        className={`rounded-2xl p-6 w-full max-w-xl shadow-2xl ${darkMode ? 'bg-gray-800' : 'bg-white'}`}
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>{isEdit ? 'Edit Subject' : 'Add Subject'}</h3>
          <button onClick={onClose} className={`p-2 rounded-lg ${darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}><X className="w-4 h-4" /></button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="sm:col-span-2">
            <label className={`block text-sm mb-1 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Subject Name</label>
            <input value={form.name} onChange={(e) => handleChange('name', e.target.value)} className={`w-full px-3 py-2 rounded-lg border ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'}`} />
          </div>
          <div>
            <label className={`block text-sm mb-1 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Subject Code</label>
            <input value={form.code} onChange={(e) => handleChange('code', e.target.value)} className={`w-full px-3 py-2 rounded-lg border ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'}`} />
          </div>
          <div>
            <label className={`block text-sm mb-1 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Branch</label>
            <select value={form.branch} onChange={(e) => handleChange('branch', e.target.value)} className={`w-full px-3 py-2 rounded-lg border ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'}`}>
              <option value="">Select branch</option>
              {(branches || []).map((b: any) => (
                <option key={b._id} value={b._id}>{b.name} ({b.code})</option>
              ))}
            </select>
          </div>
          <div>
            <label className={`block text-sm mb-1 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Semester</label>
            <select value={form.semester} onChange={(e) => handleChange('semester', parseInt(e.target.value))} className={`w-full px-3 py-2 rounded-lg border ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'}`}>
              {[1,2,3,4,5,6,7,8].map(s => (
                <option key={s} value={s}>Semester {s}</option>
              ))}
            </select>
          </div>
          <div className="sm:col-span-2">
            <label className={`block text-sm mb-1 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Description</label>
            <textarea value={form.description} onChange={(e) => handleChange('description', e.target.value)} rows={3} className={`w-full px-3 py-2 rounded-lg border ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'}`} />
          </div>
          {isEdit && (
            <div className="sm:col-span-2">
              <label className="inline-flex items-center space-x-2">
                <input type="checkbox" checked={form.isActive} onChange={(e) => handleChange('isActive', e.target.checked)} />
                <span className={`${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Active</span>
              </label>
            </div>
          )}
        </div>

        <div className="mt-6 flex justify-end space-x-3">
          <button onClick={onClose} className={`px-4 py-2 rounded-lg ${darkMode ? 'bg-gray-700 text-white' : 'bg-gray-100'}`}>Cancel</button>
          <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} onClick={submit} disabled={saving} className={`px-5 py-2 rounded-lg text-white ${saving ? 'opacity-60 cursor-not-allowed' : ''} bg-gradient-to-r from-blue-600 to-purple-600`}>
            {saving ? 'Saving...' : isEdit ? 'Update Subject' : 'Create Subject'}
          </motion.button>
        </div>
      </motion.div>
    </motion.div>
  );
};