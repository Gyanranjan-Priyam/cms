import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  DollarSign,
  Users,
  TrendingUp,
  Download,
  Search,
  Plus,
  Trash2,
  Receipt,
  Building,
  CheckCircle,
  XCircle,
  Clock,
  RefreshCw,
  User,
  MapPin,
  Phone,
  Mail,
  Eye,
  Settings,
  Moon,
  Sun,
  LogOut
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import * as XLSX from 'xlsx';
import axios from 'axios';

interface Student {
  _id: string;
  regdNo: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  branch: {
    _id: string;
    name: string;
    code: string;
  };
  department: {
    _id: string;
    name: string;
    code: string;
  };
  semester: number;
  academicYear: string;
  status: string;
}

interface Transaction {
  _id: string;
  student: Student;
  amount: number;
  paymentType: string;
  paymentMethod: string;
  status: 'pending' | 'completed' | 'failed' | 'cancelled';
  transactionId: string;
  receiptNumber: string;
  razorpayPaymentId?: string;
  razorpayOrderId?: string;
  submittedDate: string;
  paidDate?: string;
  notes?: string;
}

interface PaymentStats {
  totalRevenue: number;
  totalTransactions: number;
  pendingAmount: number;
  completedTransactions: number;
  monthlyRevenue: number;
  revenueGrowth: number;
}

const FinanceDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'overview' | 'students' | 'transactions' | 'add-payment'>('overview');
  const [students, setStudents] = useState<Student[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [filteredTransactions, setFilteredTransactions] = useState<Transaction[]>([]);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(true);
  const [darkMode, setDarkMode] = useState(() => {
    const saved = localStorage.getItem('darkMode');
    return saved ? JSON.parse(saved) : false;
  });
  const [stats, setStats] = useState<PaymentStats>({
    totalRevenue: 0,
    totalTransactions: 0,
    pendingAmount: 0,
    completedTransactions: 0,
    monthlyRevenue: 0,
    revenueGrowth: 0
  });
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [paymentTypeFilter, setPaymentTypeFilter] = useState<string>('all');
  const [dateRange, setDateRange] = useState<{ start: string; end: string }>({
    start: '',
    end: ''
  });
  const [branchFilter, setBranchFilter] = useState<string>('all');
  const [semesterFilter, setSemesterFilter] = useState<string>('all');

  // Add Payment Form State
  const [paymentForm, setPaymentForm] = useState({
    targetType: 'individual', // individual, branch, all
    studentId: '',
    branchId: '',
    amount: '',
    paymentType: 'academic',
    dueDate: '',
    description: ''
  });

  useEffect(() => {
    fetchInitialData();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [transactions, searchTerm, statusFilter, paymentTypeFilter, dateRange]);

  // Dark mode effect
  useEffect(() => {
    localStorage.setItem('darkMode', JSON.stringify(darkMode));
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
  };

  const handleLogout = async () => {
    // Show confirmation dialog
    if (window.confirm('Are you sure you want to sign out?')) {
      try {
        setLoading(true);
        
        // Clear all authentication data first
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        localStorage.removeItem('lastActivity');
        sessionStorage.clear(); // Also clear session storage
        
        // Optional: Call backend logout endpoint if available
        try {
            await axios.post(`${import.meta.env.VITE_API_URL}/api/auth/logout`, {});
        } catch (error) {
          // Backend logout failed, but we already cleared frontend data
          console.warn('Backend logout failed, but frontend logout completed:', error);
        }
        
        // Force page reload to clear all state and redirect to login
        window.location.replace('/');
        
      } catch (error) {
        console.error('Logout error:', error);
        // Even if there's an error, force clear and redirect
        localStorage.clear();
        sessionStorage.clear();
        window.location.replace('/');
      }
    }
  };

  const getStudentTotalPaid = (studentId: string) => {
    return transactions
      .filter(transaction => 
        transaction.student && 
        transaction.student._id === studentId && 
        transaction.status === 'completed'
      )
      .reduce((total, transaction) => total + transaction.amount, 0);
  };

  const exportStudentsToExcel = () => {
    const filteredStudents = students.filter(student => {
      const matchesSearch = searchTerm === '' ||
        student.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        student.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        student.regdNo.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesBranch = branchFilter === 'all' || student.branch?._id === branchFilter;
      const matchesSemester = semesterFilter === 'all' || student.semester.toString() === semesterFilter;
      
      return matchesSearch && matchesBranch && matchesSemester;
    });

    const exportData = filteredStudents.map(student => ({
      'Registration No': student.regdNo,
      'First Name': student.firstName,
      'Last Name': student.lastName,
      'Full Name': `${student.firstName} ${student.lastName}`,
      'Email': student.email,
      'Phone': student.phone,
      'Branch': student.branch?.name || 'N/A',
      'Branch Code': student.branch?.code || 'N/A',
      'Department': student.department?.name || 'N/A',
      'Department Code': student.department?.code || 'N/A',
      'Semester': student.semester,
      'Academic Year': student.academicYear,
      'Status': student.status,
      'Total Amount Paid (₹)': getStudentTotalPaid(student._id)
    }));

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Students');
    
    const fileName = `students_data_${new Date().toISOString().split('T')[0]}.xlsx`;
    XLSX.writeFile(wb, fileName);
  };

  const fetchInitialData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        fetchStudents(),
        fetchTransactions(),
        fetchStats()
      ]);
    } catch (error) {
      console.error('Error fetching initial data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStudents = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${import.meta.env.VITE_API_URL}/api/finance/students`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setStudents(response.data.students || []);
    } catch (error) {
      console.error('Error fetching students:', error);
    }
  };

  const fetchTransactions = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${import.meta.env.VITE_API_URL}/api/finance/transactions`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      // Ensure we have valid transactions with student data
      const validTransactions = (response.data.transactions || []).filter((transaction: any) => 
        transaction && transaction.student && transaction.student._id
      );
      
      setTransactions(validTransactions);
    } catch (error) {
      console.error('Error fetching transactions:', error);
      setTransactions([]); // Ensure we have an empty array on error
    }
  };

  const fetchStats = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${import.meta.env.VITE_API_URL}/api/finance/stats`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setStats(response.data.stats || stats);
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const applyFilters = () => {
    let filtered = [...transactions];

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(transaction => 
        (transaction.student?.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) || false) ||
        (transaction.student?.lastName?.toLowerCase().includes(searchTerm.toLowerCase()) || false) ||
        (transaction.student?.regdNo?.toLowerCase().includes(searchTerm.toLowerCase()) || false) ||
        transaction.transactionId.toLowerCase().includes(searchTerm.toLowerCase()) ||
        transaction.receiptNumber.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(transaction => transaction.status === statusFilter);
    }

    // Payment type filter
    if (paymentTypeFilter !== 'all') {
      filtered = filtered.filter(transaction => transaction.paymentType === paymentTypeFilter);
    }

    // Date range filter
    if (dateRange.start && dateRange.end) {
      filtered = filtered.filter(transaction => {
        const transactionDate = new Date(transaction.submittedDate);
        const startDate = new Date(dateRange.start);
        const endDate = new Date(dateRange.end);
        return transactionDate >= startDate && transactionDate <= endDate;
      });
    }

    setFilteredTransactions(filtered);
  };

  const handleAddPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(`${import.meta.env.VITE_API_URL}/api/finance/add-payment`, paymentForm, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.success) {
        await fetchTransactions();
        await fetchStats();
        setPaymentForm({
          targetType: 'individual',
          studentId: '',
          branchId: '',
          amount: '',
          paymentType: 'academic',
          dueDate: '',
          description: ''
        });
        alert('Payment added successfully!');
      }
    } catch (error: any) {
      console.error('Error adding payment:', error);
      alert(error.response?.data?.message || 'Failed to add payment');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdatePaymentStatus = async (transactionId: string, newStatus: string) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.put(
        `${import.meta.env.VITE_API_URL}/api/finance/update-status/${transactionId}`,
        { status: newStatus },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.data.success) {
        await fetchTransactions();
        await fetchStats();
        alert('Payment status updated successfully!');
      }
    } catch (error: any) {
      console.error('Error updating payment status:', error);
      alert(error.response?.data?.message || 'Failed to update payment status');
    }
  };

  const handleDeleteTransaction = async (transactionId: string) => {
    if (!confirm('Are you sure you want to permanently delete this transaction?')) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await axios.delete(`${import.meta.env.VITE_API_URL}/api/finance/delete-transaction/${transactionId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.success) {
        await fetchTransactions();
        await fetchStats();
        alert('Transaction deleted successfully!');
      }
    } catch (error: any) {
      console.error('Error deleting transaction:', error);
      alert(error.response?.data?.message || 'Failed to delete transaction');
    }
  };

  const exportToExcel = () => {
    const exportData = filteredTransactions.map(transaction => ({
      'Transaction ID': transaction.transactionId,
      'Receipt Number': transaction.receiptNumber,
      'Student Name': `${transaction.student?.firstName || 'N/A'} ${transaction.student?.lastName || ''}`,
      'Registration No': transaction.student?.regdNo || 'N/A',
      'Branch': transaction.student?.branch?.name || 'N/A',
      'Department': transaction.student?.department?.name || 'N/A',
      'Amount': transaction.amount,
      'Payment Type': transaction.paymentType,
      'Payment Method': transaction.paymentMethod,
      'Status': transaction.status,
      'Submitted Date': new Date(transaction.submittedDate).toLocaleDateString(),
      'Paid Date': transaction.paidDate ? new Date(transaction.paidDate).toLocaleDateString() : 'N/A',
      'Notes': transaction.notes || 'N/A'
    }));

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Transactions');
    
    const fileName = `finance_transactions_${new Date().toISOString().split('T')[0]}.xlsx`;
    XLSX.writeFile(wb, fileName);
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      completed: { icon: CheckCircle, color: 'bg-green-100 text-green-800', label: 'Completed' },
      pending: { icon: Clock, color: 'bg-yellow-100 text-yellow-800', label: 'Pending' },
      failed: { icon: XCircle, color: 'bg-red-100 text-red-800', label: 'Failed' },
      cancelled: { icon: XCircle, color: 'bg-gray-100 text-gray-800', label: 'Cancelled' }
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;
    const Icon = config.icon;

    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.color}`}>
        <Icon className="w-3 h-3 mr-1" />
        {config.label}
      </span>
    );
  };

  const StatCard = ({ icon: Icon, title, value, subtitle, trend, color }: any) => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`rounded-xl shadow-lg p-6 border transition-colors duration-300 ${
        darkMode 
          ? 'bg-gray-800 border-gray-700' 
          : 'bg-white border-gray-100'
      }`}
    >
      <div className="flex items-center justify-between">
        <div>
          <p className={`text-sm font-medium transition-colors duration-300 ${
            darkMode ? 'text-gray-400' : 'text-gray-600'
          }`}>{title}</p>
          <p className={`text-2xl font-bold mt-1 transition-colors duration-300 ${
            darkMode ? 'text-white' : 'text-gray-900'
          }`}>{value}</p>
          {subtitle && <p className={`text-sm mt-1 transition-colors duration-300 ${
            darkMode ? 'text-gray-500' : 'text-gray-500'
          }`}>{subtitle}</p>}
        </div>
        <div className={`p-3 rounded-full ${color}`}>
          <Icon className="h-6 w-6 text-white" />
        </div>
      </div>
      {trend && (
        <div className="mt-4 flex items-center">
          <TrendingUp className="h-4 w-4 text-green-500 mr-1" />
          <span className="text-sm font-medium text-green-600">{trend}%</span>
          <span className={`text-sm ml-1 transition-colors duration-300 ${
            darkMode ? 'text-gray-400' : 'text-gray-500'
          }`}>from last month</span>
        </div>
      )}
    </motion.div>
  );

  return (
    <div className={`min-h-screen transition-colors duration-300 ${darkMode ? 'dark bg-gray-900' : 'bg-gray-50'}`}>
      {/* Sidebar */}
      <motion.div
        initial={false}
        animate={{ width: sidebarCollapsed ? 80 : 256 }}
        transition={{ duration: 0.3, ease: "easeInOut" }}
        onMouseEnter={() => setSidebarCollapsed(false)}
        onMouseLeave={() => setSidebarCollapsed(true)}
        className={`fixed inset-y-0 left-0 z-50 shadow-lg transition-colors duration-300 ${
          darkMode ? 'bg-gray-800 border-r border-gray-700' : 'bg-white border-r border-gray-200'
        }`}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className={`flex items-center justify-center h-16 px-4 transition-colors duration-300 ${
            darkMode ? 'bg-blue-600' : 'bg-blue-600'
          }`}>
            <DollarSign className="h-8 w-8 text-white flex-shrink-0" />
            <motion.span
              initial={false}
              animate={{ 
                opacity: sidebarCollapsed ? 0 : 1,
                width: sidebarCollapsed ? 0 : 'auto'
              }}
              transition={{ duration: 0.2 }}
              className="text-xl font-bold text-white ml-2 overflow-hidden whitespace-nowrap"
            >
              Finance Portal
            </motion.span>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 py-6 space-y-2">
            {[
              { id: 'overview', label: 'Overview', icon: TrendingUp },
              { id: 'students', label: 'Students', icon: Users },
              { id: 'transactions', label: 'Transactions', icon: Receipt },
              { id: 'add-payment', label: 'Add Payment', icon: Plus }
            ].map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id as any)}
                  className={`w-full flex items-center px-4 py-3 rounded-lg transition-all duration-200 group ${
                    activeTab === item.id
                      ? darkMode 
                        ? 'bg-blue-600 text-white' 
                        : 'bg-blue-100 text-blue-700 font-medium'
                      : darkMode
                        ? 'text-gray-300 hover:bg-gray-700 hover:text-white'
                        : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <Icon className="h-5 w-5 flex-shrink-0" />
                  <motion.span
                    initial={false}
                    animate={{ 
                      opacity: sidebarCollapsed ? 0 : 1,
                      width: sidebarCollapsed ? 0 : 'auto'
                    }}
                    transition={{ duration: 0.2 }}
                    className="ml-3 overflow-hidden whitespace-nowrap"
                  >
                    {item.label}
                  </motion.span>
                  
                  {/* Tooltip for collapsed state */}
                  {sidebarCollapsed && (
                    <div className="absolute left-20 px-2 py-1 bg-gray-900 text-white text-sm rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-50">
                      {item.label}
                    </div>
                  )}
                </button>
              );
            })}
          </nav>

          {/* Theme Toggle */}
          <div className="px-4 py-2">
            <button
              onClick={toggleDarkMode}
              className={`w-full flex items-center px-4 py-3 rounded-lg transition-all duration-200 group ${
                darkMode
                  ? 'text-gray-300 hover:bg-gray-700 hover:text-white'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              {darkMode ? (
                <Sun className="h-5 w-5 flex-shrink-0" />
              ) : (
                <Moon className="h-5 w-5 flex-shrink-0" />
              )}
              <motion.span
                initial={false}
                animate={{ 
                  opacity: sidebarCollapsed ? 0 : 1,
                  width: sidebarCollapsed ? 0 : 'auto'
                }}
                transition={{ duration: 0.2 }}
                className="ml-3 overflow-hidden whitespace-nowrap"
              >
                {darkMode ? 'Light Mode' : 'Dark Mode'}
              </motion.span>
              
              {/* Tooltip for collapsed state */}
              {sidebarCollapsed && (
                <div className="absolute left-20 px-2 py-1 bg-gray-900 text-white text-sm rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-50">
                  {darkMode ? 'Light Mode' : 'Dark Mode'}
                </div>
              )}
            </button>
          </div>

          {/* User Section */}
          <div className={`px-4 py-4 border-t transition-colors duration-300 ${
            darkMode ? 'border-gray-700' : 'border-gray-200'
          }`}>
            <div className="flex items-center space-x-3">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                darkMode ? 'bg-blue-600' : 'bg-blue-100'
              }`}>
                <User className={`h-5 w-5 ${darkMode ? 'text-white' : 'text-blue-600'}`} />
              </div>
              <motion.div
                initial={false}
                animate={{ 
                  opacity: sidebarCollapsed ? 0 : 1,
                  width: sidebarCollapsed ? 0 : 'auto'
                }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden"
              >
                <p className={`text-sm font-medium whitespace-nowrap ${
                  darkMode ? 'text-white' : 'text-gray-900'
                }`}>Finance Admin</p>
                <p className={`text-xs whitespace-nowrap ${
                  darkMode ? 'text-gray-400' : 'text-gray-500'
                }`}>finance@college.edu</p>
              </motion.div>
            </div>
            <motion.button
              initial={false}
              animate={{ 
                opacity: sidebarCollapsed ? 0 : 1,
                height: sidebarCollapsed ? 0 : 'auto'
              }}
              transition={{ duration: 0.2 }}
              onClick={handleLogout}
              disabled={loading}
              className={`w-full mt-3 px-4 py-2 text-sm transition-colors duration-200 overflow-hidden flex items-center justify-center group relative ${
                darkMode 
                  ? 'text-gray-400 hover:text-white disabled:opacity-50' 
                  : 'text-gray-600 hover:text-gray-900 disabled:opacity-50'
              }`}
            >
              <LogOut className="h-4 w-4 mr-2 flex-shrink-0" />
              {loading ? 'Signing Out...' : 'Sign Out'}
              
              {/* Tooltip for collapsed state */}
              {sidebarCollapsed && (
                <div className="absolute left-20 px-2 py-1 bg-gray-900 text-white text-sm rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-50">
                  Sign Out
                </div>
              )}
            </motion.button>
          </div>
        </div>
      </motion.div>

      {/* Main Content */}
      <motion.div
        initial={false}
        animate={{ marginLeft: sidebarCollapsed ? 80 : 256 }}
        transition={{ duration: 0.3, ease: "easeInOut" }}
        className="transition-all duration-300"
      >
        {/* Header */}
        <div className={`shadow-sm border-b px-6 py-4 transition-colors duration-300 ${
          darkMode 
            ? 'bg-gray-800 border-gray-700' 
            : 'bg-white border-gray-200'
        }`}>
          <div className="flex items-center justify-between">
            <div>
              <h1 className={`text-2xl font-bold transition-colors duration-300 ${
                darkMode ? 'text-white' : 'text-gray-900'
              }`}>
                {activeTab === 'overview' && 'Finance Overview'}
                {activeTab === 'students' && 'Student Management'}
                {activeTab === 'transactions' && 'Transaction History'}
                {activeTab === 'add-payment' && 'Add New Payment'}
              </h1>
              <p className={`mt-1 transition-colors duration-300 ${
                darkMode ? 'text-gray-400' : 'text-gray-600'
              }`}>
                {activeTab === 'overview' && 'Monitor financial performance and transactions'}
                {activeTab === 'students' && 'View and manage student information'}
                {activeTab === 'transactions' && 'View and manage all payment transactions'}
                {activeTab === 'add-payment' && 'Create new payment entries for students'}
              </p>
            </div>
            <div className="flex items-center space-x-3">
              <button
                onClick={fetchInitialData}
                className={`flex items-center px-4 py-2 rounded-lg transition-colors duration-200 ${
                  darkMode
                    ? 'bg-blue-600 text-white hover:bg-blue-700'
                    : 'bg-blue-600 text-white hover:bg-blue-700'
                }`}
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </button>
              <button
                onClick={() => navigate('/admin-dashboard')}
                className={`flex items-center px-4 py-2 border rounded-lg transition-colors duration-200 ${
                  darkMode
                    ? 'border-gray-600 text-gray-300 hover:bg-gray-700 hover:text-white'
                    : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                }`}
              >
                <Settings className="h-4 w-4 mr-2" />
                Admin Panel
              </button>
            </div>
          </div>
        </div>

        {/* Content Area */}
        <div className="p-6">
          <AnimatePresence mode="wait">
            {/* Overview Tab */}
            {activeTab === 'overview' && (
              <motion.div
                key="overview"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="space-y-6"
              >
                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  <StatCard
                    icon={DollarSign}
                    title="Total Revenue"
                    value={`₹${stats.totalRevenue.toLocaleString()}`}
                    subtitle="All time revenue"
                    color="bg-green-500"
                  />
                  <StatCard
                    icon={Receipt}
                    title="Total Transactions"
                    value={stats.totalTransactions.toLocaleString()}
                    subtitle={`${stats.completedTransactions} completed`}
                    color="bg-blue-500"
                  />
                  <StatCard
                    icon={Clock}
                    title="Pending Amount"
                    value={`₹${stats.pendingAmount.toLocaleString()}`}
                    subtitle="Awaiting payment"
                    color="bg-yellow-500"
                  />
                  <StatCard
                    icon={TrendingUp}
                    title="Monthly Revenue"
                    value={`₹${stats.monthlyRevenue.toLocaleString()}`}
                    trend={stats.revenueGrowth}
                    color="bg-purple-500"
                  />
                </div>

                {/* Recent Transactions */}
                <div className={`rounded-xl shadow-lg p-6 transition-colors duration-300 ${
                  darkMode 
                    ? 'bg-gray-800 border border-gray-700' 
                    : 'bg-white border border-gray-100'
                }`}>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className={`text-lg font-semibold transition-colors duration-300 ${
                      darkMode ? 'text-white' : 'text-gray-900'
                    }`}>Recent Transactions</h3>
                    <button
                      onClick={() => setActiveTab('transactions')}
                      className={`font-medium transition-colors duration-200 ${
                        darkMode ? 'text-blue-400 hover:text-blue-300' : 'text-blue-600 hover:text-blue-700'
                      }`}
                    >
                      View All
                    </button>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className={`border-b transition-colors duration-300 ${
                          darkMode ? 'border-gray-700' : 'border-gray-200'
                        }`}>
                          <th className={`text-left py-3 px-4 font-medium transition-colors duration-300 ${
                            darkMode ? 'text-gray-300' : 'text-gray-900'
                          }`}>Student</th>
                          <th className={`text-left py-3 px-4 font-medium transition-colors duration-300 ${
                            darkMode ? 'text-gray-300' : 'text-gray-900'
                          }`}>Amount</th>
                          <th className={`text-left py-3 px-4 font-medium transition-colors duration-300 ${
                            darkMode ? 'text-gray-300' : 'text-gray-900'
                          }`}>Type</th>
                          <th className={`text-left py-3 px-4 font-medium transition-colors duration-300 ${
                            darkMode ? 'text-gray-300' : 'text-gray-900'
                          }`}>Status</th>
                          <th className={`text-left py-3 px-4 font-medium transition-colors duration-300 ${
                            darkMode ? 'text-gray-300' : 'text-gray-900'
                          }`}>Date</th>
                        </tr>
                      </thead>
                      <tbody>
                        {loading ? (
                          <tr>
                            <td colSpan={5} className={`py-8 text-center transition-colors duration-300 ${
                              darkMode ? 'text-gray-400' : 'text-gray-500'
                            }`}>
                              Loading transactions...
                            </td>
                          </tr>
                        ) : transactions.length === 0 ? (
                          <tr>
                            <td colSpan={5} className={`py-8 text-center transition-colors duration-300 ${
                              darkMode ? 'text-gray-400' : 'text-gray-500'
                            }`}>
                              No transactions found
                            </td>
                          </tr>
                        ) : (
                          transactions.slice(0, 5).map((transaction) => (
                            <tr key={transaction._id} className={`border-b transition-colors duration-300 ${
                              darkMode ? 'border-gray-700 hover:bg-gray-700' : 'border-gray-100 hover:bg-gray-50'
                            }`}>
                              <td className="py-3 px-4">
                                <div>
                                  <p className={`font-medium transition-colors duration-300 ${
                                    darkMode ? 'text-white' : 'text-gray-900'
                                  }`}>
                                    {transaction.student?.firstName || 'N/A'} {transaction.student?.lastName || ''}
                                  </p>
                                  <p className={`text-sm transition-colors duration-300 ${
                                    darkMode ? 'text-gray-400' : 'text-gray-500'
                                  }`}>{transaction.student?.regdNo || 'N/A'}</p>
                                </div>
                              </td>
                              <td className={`py-3 px-4 font-medium transition-colors duration-300 ${
                                darkMode ? 'text-white' : 'text-gray-900'
                              }`}>
                                ₹{transaction.amount.toLocaleString()}
                              </td>
                              <td className={`py-3 px-4 transition-colors duration-300 ${
                                darkMode ? 'text-gray-300' : 'text-gray-600'
                              }`}>{transaction.paymentType}</td>
                              <td className="py-3 px-4">{getStatusBadge(transaction.status)}</td>
                              <td className={`py-3 px-4 transition-colors duration-300 ${
                                darkMode ? 'text-gray-300' : 'text-gray-600'
                              }`}>
                                {new Date(transaction.submittedDate).toLocaleDateString()}
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Students Tab */}
            {activeTab === 'students' && (
              <motion.div
                key="students"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="space-y-6"
              >
                {/* Search and Filters */}
                <div className={`rounded-xl shadow-lg p-6 transition-colors duration-300 ${
                  darkMode 
                    ? 'bg-gray-800 border border-gray-700' 
                    : 'bg-white border border-gray-100'
                }`}>
                  <div className="flex flex-wrap items-center gap-4 mb-4">
                    <div className="flex-1 min-w-64">
                      <div className="relative">
                        <Search className={`absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 transition-colors duration-300 ${
                          darkMode ? 'text-gray-500' : 'text-gray-400'
                        }`} />
                        <input
                          type="text"
                          placeholder="Search students..."
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          className={`w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors duration-300 ${
                            darkMode 
                              ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                              : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                          }`}
                        />
                      </div>
                    </div>

                    <select
                      value={branchFilter}
                      onChange={(e) => setBranchFilter(e.target.value)}
                      className={`px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors duration-300 ${
                        darkMode 
                          ? 'bg-gray-700 border-gray-600 text-white' 
                          : 'bg-white border-gray-300 text-gray-900'
                      }`}
                    >
                      <option value="all">All Branches</option>
                      {Array.from(new Set(students.map(s => s.branch?._id).filter(Boolean))).map((branchId) => {
                        const branch = students.find(s => s.branch?._id === branchId)?.branch;
                        return branch ? (
                          <option key={branch._id} value={branch._id}>
                            {branch.name} ({branch.code})
                          </option>
                        ) : null;
                      })}
                    </select>

                    <select
                      value={semesterFilter}
                      onChange={(e) => setSemesterFilter(e.target.value)}
                      className={`px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors duration-300 ${
                        darkMode 
                          ? 'bg-gray-700 border-gray-600 text-white' 
                          : 'bg-white border-gray-300 text-gray-900'
                      }`}
                    >
                      <option value="all">All Semesters</option>
                      {Array.from(new Set(students.map(s => s.semester).filter(Boolean))).sort((a, b) => a - b).map((semester) => (
                        <option key={semester} value={semester.toString()}>
                          Semester {semester}
                        </option>
                      ))}
                    </select>

                    <button
                      onClick={exportStudentsToExcel}
                      className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Export Excel
                    </button>
                  </div>

                  <div className="flex items-center space-x-4">
                    <button
                      onClick={() => {
                        setSearchTerm('');
                        setBranchFilter('all');
                        setSemesterFilter('all');
                      }}
                      className={`px-4 py-2 transition-colors ${
                        darkMode ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-gray-800'
                      }`}
                    >
                      Clear Filters
                    </button>
                    <span className={`text-sm transition-colors duration-300 ${
                      darkMode ? 'text-gray-400' : 'text-gray-600'
                    }`}>
                      Showing {students.filter(student => {
                        const matchesSearch = searchTerm === '' ||
                          student.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          student.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          student.regdNo.toLowerCase().includes(searchTerm.toLowerCase());
                        
                        const matchesBranch = branchFilter === 'all' || student.branch?._id === branchFilter;
                        const matchesSemester = semesterFilter === 'all' || student.semester.toString() === semesterFilter;
                        
                        return matchesSearch && matchesBranch && matchesSemester;
                      }).length} of {students.length} students
                    </span>
                  </div>
                </div>

                {/* Students Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {students
                    .filter(student => {
                      const matchesSearch = searchTerm === '' ||
                        student.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        student.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        student.regdNo.toLowerCase().includes(searchTerm.toLowerCase());
                      
                      const matchesBranch = branchFilter === 'all' || student.branch?._id === branchFilter;
                      const matchesSemester = semesterFilter === 'all' || student.semester.toString() === semesterFilter;
                      
                      return matchesSearch && matchesBranch && matchesSemester;
                    })
                    .map((student) => {
                      const totalPaid = getStudentTotalPaid(student._id);
                      return (
                    <motion.div
                      key={student._id}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className={`rounded-xl shadow-lg p-6 hover:shadow-xl transition-all duration-300 ${
                        darkMode 
                          ? 'bg-gray-800 border border-gray-700 hover:bg-gray-750' 
                          : 'bg-white border border-gray-100 hover:bg-gray-50'
                      }`}
                    >
                      <div className="flex items-center space-x-4 mb-4">
                        <div className={`w-12 h-12 rounded-full flex items-center justify-center transition-colors duration-300 ${
                          darkMode ? 'bg-blue-600' : 'bg-blue-100'
                        }`}>
                          <User className={`h-6 w-6 transition-colors duration-300 ${
                            darkMode ? 'text-white' : 'text-blue-600'
                          }`} />
                        </div>
                        <div className="flex-1">
                          <h3 className={`font-semibold transition-colors duration-300 ${
                            darkMode ? 'text-white' : 'text-gray-900'
                          }`}>
                            {student.firstName} {student.lastName}
                          </h3>
                          <p className={`text-sm transition-colors duration-300 ${
                            darkMode ? 'text-gray-400' : 'text-gray-500'
                          }`}>{student.regdNo}</p>
                        </div>
                        <div className="text-right">
                          <p className={`text-sm font-medium transition-colors duration-300 ${
                            darkMode ? 'text-green-400' : 'text-green-600'
                          }`}>
                            ₹{totalPaid.toLocaleString()}
                          </p>
                          <p className={`text-xs transition-colors duration-300 ${
                            darkMode ? 'text-gray-500' : 'text-gray-400'
                          }`}>
                            Total Paid
                          </p>
                        </div>
                      </div>
                      
                      <div className="space-y-2 text-sm">
                        <div className={`flex items-center transition-colors duration-300 ${
                          darkMode ? 'text-gray-300' : 'text-gray-600'
                        }`}>
                          <Building className="h-4 w-4 mr-2" />
                          {student.branch?.name || 'N/A'}
                        </div>
                        <div className={`flex items-center transition-colors duration-300 ${
                          darkMode ? 'text-gray-300' : 'text-gray-600'
                        }`}>
                          <MapPin className="h-4 w-4 mr-2" />
                          {student.department?.name || 'N/A'}
                        </div>
                        <div className={`flex items-center transition-colors duration-300 ${
                          darkMode ? 'text-gray-300' : 'text-gray-600'
                        }`}>
                          <User className="h-4 w-4 mr-2" />
                          Semester {student.semester}
                        </div>
                        <div className={`flex items-center transition-colors duration-300 ${
                          darkMode ? 'text-gray-300' : 'text-gray-600'
                        }`}>
                          <Mail className="h-4 w-4 mr-2" />
                          {student.email}
                        </div>
                        <div className={`flex items-center transition-colors duration-300 ${
                          darkMode ? 'text-gray-300' : 'text-gray-600'
                        }`}>
                          <Phone className="h-4 w-4 mr-2" />
                          {student.phone}
                        </div>
                      </div>

                      <div className="flex space-x-2 mt-4">
                        <button
                          onClick={() => {
                            setPaymentForm(prev => ({ ...prev, studentId: student._id }));
                            setActiveTab('add-payment');
                          }}
                          className="flex-1 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
                        >
                          Add Payment
                        </button>
                        <button
                          onClick={() => navigate(`/student-dashboard/${student.regdNo}`)}
                          className={`px-3 py-2 border rounded-lg transition-colors ${
                            darkMode 
                              ? 'border-gray-600 text-gray-300 hover:bg-gray-700 hover:text-white' 
                              : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                          }`}
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                      </div>
                    </motion.div>
                  )})}
                </div>
              </motion.div>
            )}

            {/* Transactions Tab */}
            {activeTab === 'transactions' && (
              <motion.div
                key="transactions"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="space-y-6"
              >
                {/* Filters and Export */}
                <div className={`rounded-xl shadow-lg p-6 transition-colors duration-300 ${
                  darkMode 
                    ? 'bg-gray-800 border border-gray-700' 
                    : 'bg-white border border-gray-100'
                }`}>
                  <div className="flex flex-wrap items-center gap-4 mb-4">
                    <div className="flex-1 min-w-64">
                      <div className="relative">
                        <Search className={`absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 transition-colors duration-300 ${
                          darkMode ? 'text-gray-500' : 'text-gray-400'
                        }`} />
                        <input
                          type="text"
                          placeholder="Search transactions..."
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          className={`w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors duration-300 ${
                            darkMode 
                              ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                              : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                          }`}
                        />
                      </div>
                    </div>
                    
                    <select
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value)}
                      className={`px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors duration-300 ${
                        darkMode 
                          ? 'bg-gray-700 border-gray-600 text-white' 
                          : 'bg-white border-gray-300 text-gray-900'
                      }`}
                    >
                      <option value="all">All Status</option>
                      <option value="completed">Completed</option>
                      <option value="pending">Pending</option>
                      <option value="failed">Failed</option>
                      <option value="cancelled">Cancelled</option>
                    </select>

                    <select
                      value={paymentTypeFilter}
                      onChange={(e) => setPaymentTypeFilter(e.target.value)}
                      className={`px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors duration-300 ${
                        darkMode 
                          ? 'bg-gray-700 border-gray-600 text-white' 
                          : 'bg-white border-gray-300 text-gray-900'
                      }`}
                    >
                      <option value="all">All Types</option>
                      <option value="academic">Academic Fee</option>
                      <option value="hostel">Hostel Fee</option>
                      <option value="other">Other Fees</option>
                    </select>

                    <button
                      onClick={exportToExcel}
                      className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Export Excel
                    </button>
                  </div>

                  {/* Date Range Filter */}
                  <div className="flex items-center space-x-4">
                    <div>
                      <label className={`block text-sm font-medium mb-1 transition-colors duration-300 ${
                        darkMode ? 'text-gray-300' : 'text-gray-700'
                      }`}>From Date</label>
                      <input
                        type="date"
                        value={dateRange.start}
                        onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
                        className={`px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors duration-300 ${
                          darkMode 
                            ? 'bg-gray-700 border-gray-600 text-white' 
                            : 'bg-white border-gray-300 text-gray-900'
                        }`}
                      />
                    </div>
                    <div>
                      <label className={`block text-sm font-medium mb-1 transition-colors duration-300 ${
                        darkMode ? 'text-gray-300' : 'text-gray-700'
                      }`}>To Date</label>
                      <input
                        type="date"
                        value={dateRange.end}
                        onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
                        className={`px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors duration-300 ${
                          darkMode 
                            ? 'bg-gray-700 border-gray-600 text-white' 
                            : 'bg-white border-gray-300 text-gray-900'
                        }`}
                      />
                    </div>
                    <button
                      onClick={() => setDateRange({ start: '', end: '' })}
                      className={`mt-6 px-4 py-2 transition-colors ${
                        darkMode ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-gray-800'
                      }`}
                    >
                      Clear
                    </button>
                  </div>
                </div>

                {/* Transactions Table */}
                <div className={`rounded-xl shadow-lg overflow-hidden transition-colors duration-300 ${
                  darkMode 
                    ? 'bg-gray-800 border border-gray-700' 
                    : 'bg-white border border-gray-100'
                }`}>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className={`transition-colors duration-300 ${
                        darkMode ? 'bg-gray-700' : 'bg-gray-50'
                      }`}>
                        <tr>
                          <th className={`text-left py-4 px-6 font-medium transition-colors duration-300 ${
                            darkMode ? 'text-gray-300' : 'text-gray-900'
                          }`}>Transaction</th>
                          <th className={`text-left py-4 px-6 font-medium transition-colors duration-300 ${
                            darkMode ? 'text-gray-300' : 'text-gray-900'
                          }`}>Student</th>
                          <th className={`text-left py-4 px-6 font-medium transition-colors duration-300 ${
                            darkMode ? 'text-gray-300' : 'text-gray-900'
                          }`}>Amount</th>
                          <th className={`text-left py-4 px-6 font-medium transition-colors duration-300 ${
                            darkMode ? 'text-gray-300' : 'text-gray-900'
                          }`}>Type</th>
                          <th className={`text-left py-4 px-6 font-medium transition-colors duration-300 ${
                            darkMode ? 'text-gray-300' : 'text-gray-900'
                          }`}>Status</th>
                          <th className={`text-left py-4 px-6 font-medium transition-colors duration-300 ${
                            darkMode ? 'text-gray-300' : 'text-gray-900'
                          }`}>Date</th>
                          <th className={`text-left py-4 px-6 font-medium transition-colors duration-300 ${
                            darkMode ? 'text-gray-300' : 'text-gray-900'
                          }`}>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredTransactions.map((transaction) => (
                          <tr key={transaction._id} className={`border-b transition-colors duration-300 ${
                            darkMode 
                              ? 'border-gray-700 hover:bg-gray-700' 
                              : 'border-gray-100 hover:bg-gray-50'
                          }`}>
                            <td className="py-4 px-6">
                              <div>
                                <p className={`font-medium transition-colors duration-300 ${
                                  darkMode ? 'text-white' : 'text-gray-900'
                                }`}>{transaction.transactionId}</p>
                                <p className={`text-sm transition-colors duration-300 ${
                                  darkMode ? 'text-gray-400' : 'text-gray-500'
                                }`}>Receipt: {transaction.receiptNumber}</p>
                              </div>
                            </td>
                            <td className="py-4 px-6">
                              <div>
                                <p className={`font-medium transition-colors duration-300 ${
                                  darkMode ? 'text-white' : 'text-gray-900'
                                }`}>
                                  {transaction.student?.firstName || 'N/A'} {transaction.student?.lastName || ''}
                                </p>
                                <p className={`text-sm transition-colors duration-300 ${
                                  darkMode ? 'text-gray-400' : 'text-gray-500'
                                }`}>{transaction.student?.regdNo || 'N/A'}</p>
                                <p className={`text-sm transition-colors duration-300 ${
                                  darkMode ? 'text-gray-400' : 'text-gray-500'
                                }`}>{transaction.student?.branch?.name || 'N/A'}</p>
                              </div>
                            </td>
                            <td className={`py-4 px-6 font-medium transition-colors duration-300 ${
                              darkMode ? 'text-white' : 'text-gray-900'
                            }`}>
                              ₹{transaction.amount.toLocaleString()}
                            </td>
                            <td className="py-4 px-6">
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                {transaction.paymentType}
                              </span>
                            </td>
                            <td className="py-4 px-6">{getStatusBadge(transaction.status)}</td>
                            <td className={`py-4 px-6 transition-colors duration-300 ${
                              darkMode ? 'text-gray-300' : 'text-gray-600'
                            }`}>
                              <div>
                                <p>Submitted: {new Date(transaction.submittedDate).toLocaleDateString()}</p>
                                {transaction.paidDate && (
                                  <p className="text-sm">Paid: {new Date(transaction.paidDate).toLocaleDateString()}</p>
                                )}
                              </div>
                            </td>
                            <td className="py-4 px-6">
                              <div className="flex items-center space-x-2">
                                <select
                                  value={transaction.status}
                                  onChange={(e) => handleUpdatePaymentStatus(transaction._id, e.target.value)}
                                  className={`text-sm border rounded px-2 py-1 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors duration-300 ${
                                    darkMode 
                                      ? 'bg-gray-700 border-gray-600 text-white' 
                                      : 'bg-white border-gray-300 text-gray-900'
                                  }`}
                                  disabled={transaction.status === 'completed'}
                                >
                                  <option value="pending">Pending</option>
                                  <option value="completed">Completed</option>
                                  <option value="failed">Failed</option>
                                  <option value="cancelled">Cancelled</option>
                                </select>
                                <button
                                  onClick={() => handleDeleteTransaction(transaction._id)}
                                  className="p-1 text-red-600 hover:text-red-800 transition-colors"
                                  title="Delete Transaction"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Add Payment Tab */}
            {activeTab === 'add-payment' && (
              <motion.div
                key="add-payment"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="max-w-4xl mx-auto"
              >
                <div className={`rounded-xl shadow-lg p-8 transition-colors duration-300 ${
                  darkMode 
                    ? 'bg-gray-800 border border-gray-700' 
                    : 'bg-white border border-gray-100'
                }`}>
                  <form onSubmit={handleAddPayment} className="space-y-6">
                    {/* Target Selection */}
                    <div>
                      <label className={`block text-sm font-medium mb-2 transition-colors duration-300 ${
                        darkMode ? 'text-gray-300' : 'text-gray-700'
                      }`}>Payment Target</label>
                      <div className="grid grid-cols-3 gap-4">
                        {[
                          { value: 'individual', label: 'Individual Student', icon: User },
                          { value: 'branch', label: 'Branch Students', icon: Building },
                          { value: 'all', label: 'All Students', icon: Users }
                        ].map((option) => {
                          const Icon = option.icon;
                          return (
                            <label
                              key={option.value}
                              className={`flex items-center p-4 border rounded-lg cursor-pointer transition-colors ${
                                paymentForm.targetType === option.value
                                  ? darkMode 
                                    ? 'border-blue-500 bg-blue-900/30' 
                                    : 'border-blue-500 bg-blue-50'
                                  : darkMode
                                    ? 'border-gray-600 hover:bg-gray-700'
                                    : 'border-gray-300 hover:bg-gray-50'
                              }`}
                            >
                              <input
                                type="radio"
                                name="targetType"
                                value={option.value}
                                checked={paymentForm.targetType === option.value}
                                onChange={(e) => setPaymentForm(prev => ({ ...prev, targetType: e.target.value }))}
                                className="sr-only"
                              />
                              <Icon className={`h-5 w-5 mr-2 transition-colors duration-300 ${
                                darkMode ? 'text-gray-400' : 'text-gray-600'
                              }`} />
                              <span className={`font-medium transition-colors duration-300 ${
                                darkMode ? 'text-gray-300' : 'text-gray-900'
                              }`}>{option.label}</span>
                            </label>
                          );
                        })}
                      </div>
                    </div>

                    {/* Conditional Fields */}
                    {paymentForm.targetType === 'individual' && (
                      <div>
                        <label className={`block text-sm font-medium mb-2 transition-colors duration-300 ${
                          darkMode ? 'text-gray-300' : 'text-gray-700'
                        }`}>Select Student</label>
                        <select
                          value={paymentForm.studentId}
                          onChange={(e) => setPaymentForm(prev => ({ ...prev, studentId: e.target.value }))}
                          required
                          className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors duration-300 ${
                            darkMode 
                              ? 'bg-gray-700 border-gray-600 text-white' 
                              : 'bg-white border-gray-300 text-gray-900'
                          }`}
                        >
                          <option value="">Choose a student...</option>
                          {students.map((student) => (
                            <option key={student._id} value={student._id}>
                              {student.firstName} {student.lastName} ({student.regdNo}) - {student.branch?.name || 'N/A'}
                            </option>
                          ))}
                        </select>
                      </div>
                    )}

                    {paymentForm.targetType === 'branch' && (
                      <div>
                        <label className={`block text-sm font-medium mb-2 transition-colors duration-300 ${
                          darkMode ? 'text-gray-300' : 'text-gray-700'
                        }`}>Select Branch</label>
                        <select
                          value={paymentForm.branchId}
                          onChange={(e) => setPaymentForm(prev => ({ ...prev, branchId: e.target.value }))}
                          required
                          className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors duration-300 ${
                            darkMode 
                              ? 'bg-gray-700 border-gray-600 text-white' 
                              : 'bg-white border-gray-300 text-gray-900'
                          }`}
                        >
                          <option value="">Choose a branch...</option>
                          {Array.from(new Set(students.map(s => s.branch._id))).map((branchId) => {
                            const branch = students.find(s => s.branch._id === branchId)?.branch;
                            return branch ? (
                              <option key={branch._id} value={branch._id}>
                                {branch.name} ({branch.code})
                              </option>
                            ) : null;
                          })}
                        </select>
                      </div>
                    )}

                    {/* Payment Details */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className={`block text-sm font-medium mb-2 transition-colors duration-300 ${
                          darkMode ? 'text-gray-300' : 'text-gray-700'
                        }`}>Payment Type</label>
                        <select
                          value={paymentForm.paymentType}
                          onChange={(e) => setPaymentForm(prev => ({ ...prev, paymentType: e.target.value }))}
                          className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors duration-300 ${
                            darkMode 
                              ? 'bg-gray-700 border-gray-600 text-white' 
                              : 'bg-white border-gray-300 text-gray-900'
                          }`}
                        >
                          <option value="academic">Academic Fee</option>
                          <option value="hostel">Hostel Fee</option>
                          <option value="other">Other Fees</option>
                        </select>
                      </div>

                      <div>
                        <label className={`block text-sm font-medium mb-2 transition-colors duration-300 ${
                          darkMode ? 'text-gray-300' : 'text-gray-700'
                        }`}>Amount (₹)</label>
                        <input
                          type="number"
                          value={paymentForm.amount}
                          onChange={(e) => setPaymentForm(prev => ({ ...prev, amount: e.target.value }))}
                          required
                          min="1"
                          className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors duration-300 ${
                            darkMode 
                              ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                              : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                          }`}
                          placeholder="Enter amount"
                        />
                      </div>

                      <div>
                        <label className={`block text-sm font-medium mb-2 transition-colors duration-300 ${
                          darkMode ? 'text-gray-300' : 'text-gray-700'
                        }`}>Due Date</label>
                        <input
                          type="date"
                          value={paymentForm.dueDate}
                          onChange={(e) => setPaymentForm(prev => ({ ...prev, dueDate: e.target.value }))}
                          className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors duration-300 ${
                            darkMode 
                              ? 'bg-gray-700 border-gray-600 text-white' 
                              : 'bg-white border-gray-300 text-gray-900'
                          }`}
                        />
                      </div>

                      <div>
                        <label className={`block text-sm font-medium mb-2 transition-colors duration-300 ${
                          darkMode ? 'text-gray-300' : 'text-gray-700'
                        }`}>Description</label>
                        <input
                          type="text"
                          value={paymentForm.description}
                          onChange={(e) => setPaymentForm(prev => ({ ...prev, description: e.target.value }))}
                          className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors duration-300 ${
                            darkMode 
                              ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                              : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                          }`}
                          placeholder="Payment description"
                        />
                      </div>
                    </div>

                    {/* Submit Button */}
                    <div className="flex justify-end space-x-4">
                      <button
                        type="button"
                        onClick={() => setPaymentForm({
                          targetType: 'individual',
                          studentId: '',
                          branchId: '',
                          amount: '',
                          paymentType: 'academic',
                          dueDate: '',
                          description: ''
                        })}
                        className={`px-6 py-2 border rounded-lg transition-colors ${
                          darkMode 
                            ? 'border-gray-600 text-gray-300 hover:bg-gray-700 hover:text-white' 
                            : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                        }`}
                      >
                        Reset
                      </button>
                      <button
                        type="submit"
                        disabled={loading}
                        className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                      >
                        {loading ? (
                          <>
                            <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                            Processing...
                          </>
                        ) : (
                          <>
                            <Plus className="h-4 w-4 mr-2" />
                            Add Payment
                          </>
                        )}
                      </button>
                    </div>
                  </form>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
};

export default FinanceDashboard;
