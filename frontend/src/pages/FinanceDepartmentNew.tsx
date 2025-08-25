import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  DollarSign, 
  Plus, 
  CreditCard,
  LogOut,
  Download,
  Receipt,
  TrendingUp,
  Moon,
  Sun,
  Filter,
  Settings,
  RefreshCw,
  History,
  FileSpreadsheet,
  Users,
  Building,
  BarChart3
} from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import axios from 'axios';
import * as XLSX from 'xlsx';
import { SidebarProvider, Sidebar, SidebarBody, SidebarLink } from '../components/ui/sidebar';
import SessionIndicator from '../components/SessionIndicator';

interface FinanceDepartmentProps {
  user: any;
  onLogout: () => void;
  getRemainingTime?: () => number;
}

const FinanceDepartmentNew: React.FC<FinanceDepartmentProps> = ({ user, onLogout, getRemainingTime }) => {
  const [payments, setPayments] = useState([]);
  const [students, setStudents] = useState([]);
  const [branches, setBranches] = useState([]);
  const [paymentHistory, setPaymentHistory] = useState([]);
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [darkMode, setDarkMode] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    student: '',
    paymentType: '',
    status: '',
    startDate: '',
    endDate: '',
    branch: '',
    department: ''
  });
  const [currentPage, _setCurrentPage] = useState(1);
  const [_totalPages, _setTotalPages] = useState(1);
  const [_showAddPaymentModal, _setShowAddPaymentModal] = useState(false);
  const [_searchTerm, _setSearchTerm] = useState('');
  const [_refreshing, _setRefreshing] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (activeTab === 'dashboard') {
      fetchDashboardData();
    } else if (activeTab === 'payments') {
      fetchPayments();
    } else if (activeTab === 'history') {
      fetchPaymentHistory();
    }
    fetchStudents();
    fetchBranches();
  }, [activeTab, filters, currentPage]);

  const fetchDashboardData = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('http://localhost:5000/api/finance/payments/stats', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setDashboardData(response.data);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchPayments = async () => {
    try {
      const token = localStorage.getItem('token');
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: '10',
        ...filters
      });
      
      const response = await axios.get(`http://localhost:5000/api/finance/payments?${params}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setPayments(response.data.payments);
      _setTotalPages(response.data.totalPages);
    } catch (error) {
      console.error('Error fetching payments:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStudents = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('http://localhost:5000/api/student-management/students', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setStudents(response.data.students);
    } catch (error) {
      console.error('Error fetching students:', error);
    }
  };

  const fetchBranches = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('http://localhost:5000/api/branches', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setBranches(response.data.branches);
    } catch (error) {
      console.error('Error fetching branches:', error);
    }
  };

  const fetchPaymentHistory = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('http://localhost:5000/api/finance/payments', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setPaymentHistory(response.data.history);
    } catch (error) {
      console.error('Error fetching payment history:', error);
    }
  };

  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
  };

  const exportToExcel = () => {
    const worksheet = XLSX.utils.json_to_sheet(payments);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Payments');
    XLSX.writeFile(workbook, 'payments-report.xlsx');
  };

  // Sidebar navigation links for finance
  const links = [
    {
      label: "Dashboard",
      to: "/finance",
      icon: (
        <BarChart3 className="text-neutral-700 dark:text-neutral-200 h-5 w-5 flex-shrink-0" />
      ),
    },
    {
      label: "Payments",
      to: "/finance/payments",
      icon: (
        <CreditCard className="text-neutral-700 dark:text-neutral-200 h-5 w-5 flex-shrink-0" />
      ),
    },
    {
      label: "Create Payment",
      to: "/finance/create-payment",
      icon: (
        <Plus className="text-neutral-700 dark:text-neutral-200 h-5 w-5 flex-shrink-0" />
      ),
    },
    {
      label: "Reports",
      to: "/finance/reports",
      icon: (
        <FileSpreadsheet className="text-neutral-700 dark:text-neutral-200 h-5 w-5 flex-shrink-0" />
      ),
    },
    {
      label: "History",
      to: "/finance/history",
      icon: (
        <History className="text-neutral-700 dark:text-neutral-200 h-5 w-5 flex-shrink-0" />
      ),
    },
    {
      label: "Settings",
      to: "/finance/settings",
      icon: (
        <Settings className="text-neutral-700 dark:text-neutral-200 h-5 w-5 flex-shrink-0" />
      ),
    },
  ];

  if (loading) {
    return (
      <div className={`min-h-screen ${darkMode ? 'bg-gray-900' : 'bg-gray-50'} flex items-center justify-center overflow-hidden`}>
        <motion.div 
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center relative z-10"
        >
          <div className="relative mb-8">
            <motion.div 
              animate={{ rotate: 360 }}
              transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
              className="w-20 h-20 border-4 border-green-500/20 border-t-green-500 rounded-full mx-auto"
            />
            <motion.div 
              animate={{ rotate: -360 }}
              transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
              className="absolute inset-0 w-20 h-20 border-4 border-blue-500/20 border-r-blue-500 rounded-full mx-auto"
            />
          </div>
          <motion.p 
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ repeat: Infinity, duration: 2 }}
            className={`${darkMode ? 'text-gray-300' : 'text-gray-600'} text-xl font-medium`}
          >
            Loading Finance Dashboard
          </motion.p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className={darkMode ? 'dark' : ''}>
      <SidebarProvider>
        <div className="rounded-md flex flex-col md:flex-row bg-gray-100 dark:bg-neutral-800 w-full flex-1 max-w-7xl mx-auto border border-neutral-200 dark:border-neutral-700 overflow-hidden h-screen">
          <Sidebar open={open} setOpen={setOpen}>
            <SidebarBody className="justify-between gap-10">
              <div className="flex flex-col flex-1 overflow-y-auto overflow-x-hidden">
                {open ? <FinanceLogo /> : <FinanceLogoIcon />}
                <div className="mt-8 flex flex-col gap-2">
                  {links.map((link, idx) => (
                    <SidebarLink key={idx} link={link} />
                  ))}
                </div>
              </div>
              <div>
                <SidebarLink
                  link={{
                    label: user?.username || "Finance",
                    to: "#",
                    icon: (
                      <img
                        src="https://assets.aceternity.com/manu.png"
                        className="h-7 w-7 flex-shrink-0 rounded-full"
                        width={50}
                        height={50}
                        alt="Avatar"
                      />
                    ),
                  }}
                />
              </div>
            </SidebarBody>
          </Sidebar>
          
          {/* Main Content */}
          <FinanceDashboardContent 
            user={user} 
            onLogout={onLogout} 
            getRemainingTime={getRemainingTime}
            dashboardData={dashboardData}
            payments={payments}
            students={students}
            branches={branches}
            paymentHistory={paymentHistory}
            darkMode={darkMode}
            toggleDarkMode={toggleDarkMode}
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            filters={filters}
            setFilters={setFilters}
            showFilters={showFilters}
            setShowFilters={setShowFilters}
            exportToExcel={exportToExcel}
            fetchDashboardData={fetchDashboardData}
          />
        </div>
      </SidebarProvider>
    </div>
  );
};

// Logo components for finance
export const FinanceLogo = () => {
  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="font-normal flex space-x-2 items-center text-sm text-black py-1 relative z-20"
    >
      <div className="h-5 w-6 bg-gradient-to-r from-green-500 to-emerald-500 rounded-br-lg rounded-tr-sm rounded-tl-lg rounded-bl-sm flex-shrink-0" />
      <motion.span 
        initial={{ width: 0 }}
        animate={{ width: "auto" }}
        className="font-medium text-black dark:text-white whitespace-pre"
      >
        Finance Dept
      </motion.span>
    </motion.div>
  );
};

export const FinanceLogoIcon = () => {
  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="font-normal flex space-x-2 items-center text-sm text-black py-1 relative z-20"
    >
      <div className="h-5 w-6 bg-gradient-to-r from-green-500 to-emerald-500 rounded-br-lg rounded-tr-sm rounded-tl-lg rounded-bl-sm flex-shrink-0" />
    </motion.div>
  );
};

// Dashboard content component
const FinanceDashboardContent = ({ 
  user, 
  onLogout, 
  getRemainingTime, 
  dashboardData,
  payments,
  branches,
  paymentHistory,
  darkMode, 
  toggleDarkMode, 
  activeTab,
  setActiveTab,
  filters,
  setFilters,
  showFilters,
  setShowFilters,
  exportToExcel,
  fetchDashboardData
}: any) => {
  
  const COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff7300', '#0088fe'];

  return (
    <div className="flex flex-1 flex-col">
      {/* Header */}
      <motion.header 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="border-b border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 p-4"
      >
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-3">
            <motion.div
              animate={{ rotate: [0, 360] }}
              transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
              className="p-2 bg-gradient-to-r from-green-500 to-emerald-500 rounded-xl"
            >
              <DollarSign className="w-6 h-6 text-white" />
            </motion.div>
            <div>
              <h1 className="text-2xl font-bold text-neutral-800 dark:text-neutral-200">
                Finance Department
              </h1>
              <p className="text-sm text-neutral-600 dark:text-neutral-400">
                Welcome back, <span className="font-medium text-green-500">{user?.username}</span>
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            {/* Refresh Button */}
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={fetchDashboardData}
              className="p-3 rounded-xl bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-all duration-300"
            >
              <RefreshCw className="w-5 h-5" />
            </motion.button>

            {/* Export Button */}
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={exportToExcel}
              className="p-3 rounded-xl bg-green-100 dark:bg-green-500/20 text-green-600 dark:text-green-400 hover:bg-green-200 dark:hover:bg-green-500/30 transition-all duration-300"
            >
              <FileSpreadsheet className="w-5 h-5" />
            </motion.button>

            {/* Dark Mode Toggle */}
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={toggleDarkMode}
              className="p-3 rounded-xl bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-all duration-300"
            >
              {darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </motion.button>
            
            {/* Session Indicator */}
            {getRemainingTime && (
              <SessionIndicator 
                getRemainingTime={getRemainingTime}
                darkMode={darkMode}
              />
            )}
            
            {/* Logout Button */}
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={onLogout}
              className="flex items-center space-x-2 px-4 py-2 rounded-xl bg-red-50 dark:bg-red-500/20 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-500/30 border border-red-200 dark:border-red-500/20 transition-all duration-300"
            >
              <LogOut className="w-4 h-4" />
              <span className="font-medium">Logout</span>
            </motion.button>
          </div>
        </div>
      </motion.header>

      {/* Content */}
      <div className="flex-1 overflow-auto bg-neutral-50 dark:bg-neutral-900 p-6">
        {/* Tab Navigation */}
        <div className="flex space-x-1 mb-8">
          {[
            { id: 'dashboard', label: 'Dashboard', icon: BarChart3 },
            { id: 'payments', label: 'Payments', icon: CreditCard },
            { id: 'reports', label: 'Reports', icon: FileSpreadsheet },
            { id: 'history', label: 'History', icon: History }
          ].map((tab) => (
            <motion.button
              key={tab.id}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center space-x-2 px-6 py-3 rounded-xl font-medium transition-all duration-300 ${
                activeTab === tab.id
                  ? 'bg-green-500 text-white shadow-lg'
                  : 'bg-white dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-50 dark:hover:bg-neutral-700'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </motion.button>
          ))}
        </div>

        {/* Tab Content */}
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          {activeTab === 'dashboard' && (
            <div>
              {/* Overview Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                {[
                  {
                    icon: DollarSign,
                    label: "Total Revenue",
                    value: `₹${dashboardData?.totalRevenue?.toLocaleString() || 0}`,
                    change: "+15%",
                    color: "from-green-500 to-emerald-500"
                  },
                  {
                    icon: CreditCard,
                    label: "Pending Payments",
                    value: dashboardData?.pendingPayments || 0,
                    change: "-8%",
                    color: "from-orange-500 to-red-500"
                  },
                  {
                    icon: Users,
                    label: "Paying Students",
                    value: dashboardData?.payingStudents || 0,
                    change: "+12%",
                    color: "from-blue-500 to-cyan-500"
                  },
                  {
                    icon: Building,
                    label: "Active Branches",
                    value: dashboardData?.activeBranches || 0,
                    change: "+2%",
                    color: "from-purple-500 to-violet-500"
                  }
                ].map((card, index) => (
                  <motion.div
                    key={card.label}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    whileHover={{ scale: 1.02, y: -5 }}
                    className="relative overflow-hidden rounded-2xl bg-white dark:bg-neutral-800 p-6 shadow-lg border border-neutral-200 dark:border-neutral-700"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-neutral-600 dark:text-neutral-400">
                          {card.label}
                        </p>
                        <p className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">
                          {card.value}
                        </p>
                        <p className={`text-sm font-medium ${
                          card.change.startsWith('+') ? 'text-green-500' : 'text-red-500'
                        }`}>
                          {card.change} from last month
                        </p>
                      </div>
                      <div className={`p-3 rounded-2xl bg-gradient-to-r ${card.color}`}>
                        <card.icon className="w-6 h-6 text-white" />
                      </div>
                    </div>
                    
                    {/* Animated background gradient */}
                    <motion.div
                      animate={{
                        opacity: [0.1, 0.2, 0.1],
                      }}
                      transition={{
                        duration: 3,
                        repeat: Infinity,
                        ease: "easeInOut"
                      }}
                      className={`absolute inset-0 bg-gradient-to-r ${card.color} opacity-10`}
                    />
                  </motion.div>
                ))}
              </div>

              {/* Charts */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Revenue Chart */}
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.4 }}
                  className="bg-white dark:bg-neutral-800 rounded-2xl p-6 shadow-lg border border-neutral-200 dark:border-neutral-700"
                >
                  <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100 mb-6">
                    Monthly Revenue
                  </h3>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={dashboardData?.monthlyRevenue || []}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="revenue" fill="#10b981" />
                    </BarChart>
                  </ResponsiveContainer>
                </motion.div>

                {/* Payment Types Chart */}
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.5 }}
                  className="bg-white dark:bg-neutral-800 rounded-2xl p-6 shadow-lg border border-neutral-200 dark:border-neutral-700"
                >
                  <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100 mb-6">
                    Payment Types
                  </h3>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={dashboardData?.paymentTypes || []}
                        cx="50%"
                        cy="50%"
                        outerRadius={100}
                        fill="#8884d8"
                        dataKey="value"
                        label
                      >
                        {(dashboardData?.paymentTypes || []).map((_entry: any, index: number) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </motion.div>
              </div>
            </div>
          )}

          {activeTab === 'payments' && (
            <div className="bg-white dark:bg-neutral-800 rounded-2xl p-6 shadow-lg border border-neutral-200 dark:border-neutral-700">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
                  Recent Payments
                </h3>
                <div className="flex space-x-2">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setShowFilters(!showFilters)}
                    className="flex items-center space-x-2 px-4 py-2 rounded-lg bg-neutral-100 dark:bg-neutral-700 text-neutral-600 dark:text-neutral-400"
                  >
                    <Filter className="w-4 h-4" />
                    <span>Filter</span>
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="flex items-center space-x-2 px-4 py-2 rounded-lg bg-green-500 text-white"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Add Payment</span>
                  </motion.button>
                </div>
              </div>

              {/* Filters */}
              {showFilters && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mb-6 p-4 bg-neutral-50 dark:bg-neutral-700/50 rounded-xl"
                >
                  <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
                    <input
                      type="text"
                      placeholder="Student name..."
                      value={filters.student}
                      onChange={(e) => setFilters({...filters, student: e.target.value})}
                      className="px-3 py-2 rounded-lg border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100"
                    />
                    <select
                      value={filters.status}
                      onChange={(e) => setFilters({...filters, status: e.target.value})}
                      className="px-3 py-2 rounded-lg border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100"
                    >
                      <option value="">All Status</option>
                      <option value="completed">Completed</option>
                      <option value="pending">Pending</option>
                      <option value="failed">Failed</option>
                    </select>
                    <input
                      type="date"
                      value={filters.startDate}
                      onChange={(e) => setFilters({...filters, startDate: e.target.value})}
                      className="px-3 py-2 rounded-lg border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100"
                    />
                    <input
                      type="date"
                      value={filters.endDate}
                      onChange={(e) => setFilters({...filters, endDate: e.target.value})}
                      className="px-3 py-2 rounded-lg border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100"
                    />
                    <select
                      value={filters.branch}
                      onChange={(e) => setFilters({...filters, branch: e.target.value})}
                      className="px-3 py-2 rounded-lg border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100"
                    >
                      <option value="">All Branches</option>
                      {branches.map((branch: any) => (
                        <option key={branch._id} value={branch._id}>{branch.name}</option>
                      ))}
                    </select>
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setFilters({
                        student: '',
                        paymentType: '',
                        status: '',
                        startDate: '',
                        endDate: '',
                        branch: '',
                      })}
                      className="px-4 py-2 rounded-lg bg-red-500 text-white"
                    >
                      Clear
                    </motion.button>
                  </div>
                </motion.div>
              )}

              {/* Payments Table */}
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-neutral-200 dark:border-neutral-700">
                      <th className="text-left py-3 px-4 font-medium text-neutral-600 dark:text-neutral-400">Student</th>
                      <th className="text-left py-3 px-4 font-medium text-neutral-600 dark:text-neutral-400">Amount</th>
                      <th className="text-left py-3 px-4 font-medium text-neutral-600 dark:text-neutral-400">Status</th>
                      <th className="text-left py-3 px-4 font-medium text-neutral-600 dark:text-neutral-400">Date</th>
                      <th className="text-left py-3 px-4 font-medium text-neutral-600 dark:text-neutral-400">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {payments.slice(0, 10).map((payment: any, index: number) => (
                      <motion.tr
                        key={payment._id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className="border-b border-neutral-100 dark:border-neutral-700 hover:bg-neutral-50 dark:hover:bg-neutral-700/50"
                      >
                        <td className="py-3 px-4 text-neutral-900 dark:text-neutral-100">
                          {payment.studentName || 'N/A'}
                        </td>
                        <td className="py-3 px-4 text-neutral-900 dark:text-neutral-100">
                          ₹{payment.amount?.toLocaleString()}
                        </td>
                        <td className="py-3 px-4">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            payment.status === 'completed' ? 'bg-green-100 text-green-800 dark:bg-green-500/20 dark:text-green-400' :
                            payment.status === 'pending' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-500/20 dark:text-yellow-400' :
                            'bg-red-100 text-red-800 dark:bg-red-500/20 dark:text-red-400'
                          }`}>
                            {payment.status}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-neutral-600 dark:text-neutral-400">
                          {new Date(payment.createdAt).toLocaleDateString()}
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex space-x-2">
                            <motion.button
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                              className="p-1 rounded text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-500/20"
                            >
                              <Download className="w-4 h-4" />
                            </motion.button>
                            <motion.button
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                              className="p-1 rounded text-green-600 dark:text-green-400 hover:bg-green-100 dark:hover:bg-green-500/20"
                            >
                              <Receipt className="w-4 h-4" />
                            </motion.button>
                          </div>
                        </td>
                      </motion.tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'reports' && (
            <div className="bg-white dark:bg-neutral-800 rounded-2xl p-6 shadow-lg border border-neutral-200 dark:border-neutral-700">
              <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100 mb-6">
                Financial Reports
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[
                  { title: 'Monthly Revenue Report', description: 'Detailed monthly revenue breakdown', icon: TrendingUp },
                  { title: 'Student Payment Report', description: 'Individual student payment history', icon: Users },
                  { title: 'Branch Performance Report', description: 'Branch-wise financial performance', icon: Building }
                ].map((report, index) => (
                  <motion.div
                    key={report.title}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    whileHover={{ scale: 1.02 }}
                    className="p-6 border border-neutral-200 dark:border-neutral-700 rounded-xl hover:bg-neutral-50 dark:hover:bg-neutral-700/50 cursor-pointer"
                  >
                    <report.icon className="w-8 h-8 text-green-500 mb-4" />
                    <h4 className="font-semibold text-neutral-900 dark:text-neutral-100 mb-2">
                      {report.title}
                    </h4>
                    <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-4">
                      {report.description}
                    </p>
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className="flex items-center space-x-2 text-green-600 dark:text-green-400 font-medium"
                    >
                      <Download className="w-4 h-4" />
                      <span>Download</span>
                    </motion.button>
                  </motion.div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'history' && (
            <div className="bg-white dark:bg-neutral-800 rounded-2xl p-6 shadow-lg border border-neutral-200 dark:border-neutral-700">
              <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100 mb-6">
                Payment History
              </h3>
              <div className="space-y-4">
                {paymentHistory.slice(0, 20).map((item: any, index: number) => (
                  <motion.div
                    key={item._id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="flex items-center justify-between p-4 rounded-xl bg-neutral-50 dark:bg-neutral-700/50 border border-neutral-200 dark:border-neutral-600"
                  >
                    <div className="flex items-center space-x-4">
                      <div className="p-2 bg-green-100 dark:bg-green-500/20 rounded-lg">
                        <History className="w-5 h-5 text-green-600 dark:text-green-400" />
                      </div>
                      <div>
                        <p className="font-medium text-neutral-900 dark:text-neutral-100">
                          {item.description || 'Payment Transaction'}
                        </p>
                        <p className="text-sm text-neutral-500 dark:text-neutral-400">
                          {new Date(item.timestamp).toLocaleString()}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-medium text-neutral-900 dark:text-neutral-100">
                        ₹{item.amount?.toLocaleString()}
                      </p>
                      <p className="text-sm text-neutral-500 dark:text-neutral-400">
                        {item.type}
                      </p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
};

export default FinanceDepartmentNew;
