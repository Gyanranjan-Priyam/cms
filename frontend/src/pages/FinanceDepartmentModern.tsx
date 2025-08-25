import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { getApiUrl } from '../config/api';
import { 
  DollarSign, 
  Plus,
  LogOut,
  Download,
  Receipt,
  TrendingUp,
  Moon,
  Sun,
  Filter,
  RefreshCw,
  FileSpreadsheet,
  BarChart3,
  Search,
  Eye,
  CheckCircle,
  XCircle,
  Clock,
  AlertTriangle,
  History,
  Users,
  Building,
  X,
  Menu
} from 'lucide-react';
import { 
  PieChart, 
  Pie, 
  Cell, 
  ResponsiveContainer, 
  Tooltip, 
  Legend, 
  XAxis, 
  YAxis, 
  CartesianGrid,
  Area,
  AreaChart
} from 'recharts';
import axios from 'axios';
import * as XLSX from 'xlsx';
import SessionIndicator from '../components/SessionIndicator';

interface FinanceDepartmentProps {
  user: any;
  onLogout: () => void;
  getRemainingTime?: () => number;
}

interface Payment {
  _id: string;
  student: {
    firstName: string;
    lastName: string;
    regdNo: string;
    branch: string;
  };
  amount: number;
  paymentType: string;
  status: 'pending' | 'completed' | 'failed' | 'cancelled';
  paymentMethod: string;
  createdAt: string;
  updatedAt: string;
  semester?: string;
  academicYear?: string;
}

interface DashboardStats {
  totalRevenue: number;
  pendingPayments: number;
  completedPayments: number;
  monthlyRevenue: number;
  paymentsByStatus: Array<{ name: string; value: number; color: string }>;
  revenueByMonth: Array<{ month: string; revenue: number }>;
  paymentsByType: Array<{ type: string; amount: number; count: number }>;
}

const FinanceDepartmentNew: React.FC<FinanceDepartmentProps> = ({ user, onLogout, getRemainingTime }) => {
  const [dashboardStats, setDashboardStats] = useState<DashboardStats | null>(null);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [branches, setBranches] = useState<any[]>([]);
  const [paymentHistory, setPaymentHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [darkMode, setDarkMode] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    status: '',
    paymentType: '',
    dateFrom: '',
    dateTo: '',
    studentSearch: '',
    branch: '',
    department: ''
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [open, setOpen] = useState(false);
  const [showAddPaymentModal, setShowAddPaymentModal] = useState(false);
  const [newPayment, setNewPayment] = useState({
    student: '',
    amount: '',
    paymentType: '',
    semester: '',
    academicYear: '',
    description: ''
  });

  useEffect(() => {
    fetchData();
    fetchStudents();
    fetchBranches();
  }, [activeTab, currentPage, filters]);

  const fetchData = async () => {
    setLoading(true);
    try {
      if (activeTab === 'dashboard') {
        await fetchDashboardStats();
      } else if (activeTab === 'payments') {
        await fetchPayments();
      } else if (activeTab === 'outstanding') {
        await fetchOutstandingPayments();
      } else if (activeTab === 'history') {
        await fetchPaymentHistory();
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchDashboardStats = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(getApiUrl('api/finance/payments/stats'), {
        headers: { Authorization: `Bearer ${token}` }
      });
      setDashboardStats(response.data);
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
    }
  };

  const fetchPayments = async () => {
    try {
      const token = localStorage.getItem('token');
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: '20',
        search: searchTerm,
        ...filters
      });
      
      const response = await axios.get(getApiUrl(`api/finance/payments?${params}`), {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setPayments(response.data.payments || response.data.data || []);
      setTotalPages(response.data.totalPages || 1);
    } catch (error) {
      console.error('Error fetching payments:', error);
    }
  };

  const fetchOutstandingPayments = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(getApiUrl('api/finance/outstanding'), {
        headers: { Authorization: `Bearer ${token}` }
      });
      setPayments(response.data.payments || response.data.data || []);
    } catch (error) {
      console.error('Error fetching outstanding payments:', error);
    }
  };

  const fetchStudents = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(getApiUrl('api/student-management/students'), {
        headers: { Authorization: `Bearer ${token}` }
      });
      setStudents(response.data.students || response.data.data || []);
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
      setBranches(response.data.branches || response.data.data || []);
    } catch (error) {
      console.error('Error fetching branches:', error);
    }
  };

  const fetchPaymentHistory = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(getApiUrl('api/finance/payments'), {
        headers: { Authorization: `Bearer ${token}` }
      });
      setPaymentHistory(response.data.history || response.data.payments || response.data.data || []);
    } catch (error) {
      console.error('Error fetching payment history:', error);
    }
  };

  const updatePaymentStatus = async (paymentId: string, status: string) => {
    try {
      const token = localStorage.getItem('token');
      await axios.patch(getApiUrl(`api/finance/payments/${paymentId}`), 
        { status },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      fetchData(); // Refresh data
    } catch (error) {
      console.error('Error updating payment status:', error);
    }
  };

  const createPayment = async () => {
    try {
      const token = localStorage.getItem('token');
      await axios.post(getApiUrl('api/finance/payments'), newPayment, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setShowAddPaymentModal(false);
      setNewPayment({
        student: '',
        amount: '',
        paymentType: '',
        semester: '',
        academicYear: '',
        description: ''
      });
      fetchData(); // Refresh data
    } catch (error) {
      console.error('Error creating payment:', error);
    }
  };

  const exportToExcel = () => {
    const data = payments.map(payment => ({
      'Student ID': payment.student?.regdNo || 'N/A',
      'Student Name': `${payment.student?.firstName || ''} ${payment.student?.lastName || ''}`,
      'Branch': payment.student?.branch || 'N/A',
      'Amount': payment.amount,
      'Payment Type': payment.paymentType,
      'Status': payment.status,
      'Payment Method': payment.paymentMethod,
      'Date': new Date(payment.createdAt).toLocaleDateString(),
      'Academic Year': payment.academicYear || 'N/A',
      'Semester': payment.semester || 'N/A'
    }));

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Payments');
    XLSX.writeFile(wb, `payments_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'text-green-600 bg-green-100';
      case 'pending': return 'text-yellow-600 bg-yellow-100';
      case 'failed': return 'text-red-600 bg-red-100';
      case 'cancelled': return 'text-gray-600 bg-gray-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle className="w-4 h-4" />;
      case 'pending': return <Clock className="w-4 h-4" />;
      case 'failed': return <XCircle className="w-4 h-4" />;
      case 'cancelled': return <AlertTriangle className="w-4 h-4" />;
      default: return <Clock className="w-4 h-4" />;
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR'
    }).format(amount);
  };

  const sidebarLinks = [
    {
      label: "Dashboard",
      to: "#dashboard",
      icon: <BarChart3 className="text-neutral-700 dark:text-neutral-200 h-5 w-5 flex-shrink-0" />,
      active: activeTab === 'dashboard',
      onClick: () => setActiveTab('dashboard')
    },
    {
      label: "All Payments",
      to: "#payments",
      icon: <Receipt className="text-neutral-700 dark:text-neutral-200 h-5 w-5 flex-shrink-0" />,
      active: activeTab === 'payments',
      onClick: () => setActiveTab('payments')
    },
    {
      label: "Create Payment",
      to: "#create",
      icon: <Plus className="text-neutral-700 dark:text-neutral-200 h-5 w-5 flex-shrink-0" />,
      active: activeTab === 'create',
      onClick: () => setShowAddPaymentModal(true)
    },
    {
      label: "Outstanding",
      to: "#outstanding",
      icon: <AlertTriangle className="text-neutral-700 dark:text-neutral-200 h-5 w-5 flex-shrink-0" />,
      active: activeTab === 'outstanding',
      onClick: () => setActiveTab('outstanding')
    },
    {
      label: "History",
      to: "#history",
      icon: <History className="text-neutral-700 dark:text-neutral-200 h-5 w-5 flex-shrink-0" />,
      active: activeTab === 'history',
      onClick: () => setActiveTab('history')
    },
    {
      label: "Reports",
      to: "#reports",
      icon: <FileSpreadsheet className="text-neutral-700 dark:text-neutral-200 h-5 w-5 flex-shrink-0" />,
      active: activeTab === 'reports',
      onClick: () => setActiveTab('reports')
    }
  ];

  const renderDashboard = () => (
    <div className="space-y-8">
      {/* Enhanced Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-br from-green-500 to-emerald-500 rounded-xl p-6 text-white shadow-lg"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-100 text-sm font-medium">Total Revenue</p>
              <p className="text-2xl font-bold">
                {formatCurrency(dashboardStats?.totalRevenue || 0)}
              </p>
              <p className="text-green-100 text-sm mt-1">+15% from last month</p>
            </div>
            <div className="h-12 w-12 bg-white/20 rounded-lg flex items-center justify-center">
              <DollarSign className="h-6 w-6" />
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl p-6 text-white shadow-lg"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-100 text-sm font-medium">Completed Payments</p>
              <p className="text-2xl font-bold">
                {dashboardStats?.completedPayments || 0}
              </p>
              <p className="text-blue-100 text-sm mt-1">+12% from last month</p>
            </div>
            <div className="h-12 w-12 bg-white/20 rounded-lg flex items-center justify-center">
              <CheckCircle className="h-6 w-6" />
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-gradient-to-br from-orange-500 to-red-500 rounded-xl p-6 text-white shadow-lg"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-orange-100 text-sm font-medium">Pending Payments</p>
              <p className="text-2xl font-bold">
                {dashboardStats?.pendingPayments || 0}
              </p>
              <p className="text-orange-100 text-sm mt-1">-8% from last month</p>
            </div>
            <div className="h-12 w-12 bg-white/20 rounded-lg flex items-center justify-center">
              <Clock className="h-6 w-6" />
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-gradient-to-br from-purple-500 to-violet-500 rounded-xl p-6 text-white shadow-lg"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-purple-100 text-sm font-medium">Active Students</p>
              <p className="text-2xl font-bold">
                {students?.length || 0}
              </p>
              <p className="text-purple-100 text-sm mt-1">+2% from last month</p>
            </div>
            <div className="h-12 w-12 bg-white/20 rounded-lg flex items-center justify-center">
              <Users className="h-6 w-6" />
            </div>
          </div>
        </motion.div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Payment Status Distribution */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700"
        >
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Payment Status Distribution</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={dashboardStats?.paymentsByStatus || []}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name} ${((percent || 0) * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {dashboardStats?.paymentsByStatus?.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </motion.div>

        {/* Revenue Trend */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700"
        >
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Revenue Trend</h3>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={dashboardStats?.revenueByMonth || []}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip formatter={(value) => [formatCurrency(Number(value)), 'Revenue']} />
              <Area 
                type="monotone" 
                dataKey="revenue" 
                stroke="#3B82F6" 
                fill="#3B82F6" 
                fillOpacity={0.1}
              />
            </AreaChart>
          </ResponsiveContainer>
        </motion.div>
      </div>

      {/* Recent Payments Section */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Recent Payments</h3>
          <button
            onClick={() => setActiveTab('payments')}
            className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 text-sm font-medium"
          >
            View All
          </button>
        </div>
        <div className="space-y-3">
          {payments.slice(0, 5).map((payment) => (
            <div key={payment._id} className="flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-gray-700">
              <div className="flex items-center space-x-3">
                <div className={`p-2 rounded-lg ${getStatusColor(payment.status)}`}>
                  {getStatusIcon(payment.status)}
                </div>
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">
                    {payment.student?.firstName} {payment.student?.lastName}
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {payment.paymentType} • {payment.student?.regdNo}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="font-medium text-gray-900 dark:text-white">
                  {formatCurrency(payment.amount)}
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {new Date(payment.createdAt).toLocaleDateString()}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderPayments = () => (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            {activeTab === 'outstanding' ? 'Outstanding Payments' : 'All Payments'}
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            {activeTab === 'outstanding' 
              ? 'Track and manage outstanding payment transactions' 
              : 'Manage and track all payment transactions'
            }
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowAddPaymentModal(true)}
            className="inline-flex items-center px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-medium transition-colors"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Payment
          </button>
          
          <button
            onClick={exportToExcel}
            className="inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            <Download className="w-4 h-4 mr-2" />
            Export
          </button>
          
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            <Filter className="w-4 h-4 mr-2" />
            Filters
          </button>
          
          <button
            onClick={fetchData}
            className="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </button>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search by student name or ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
              />
            </div>
          </div>
          
          {showFilters && (
            <div className="flex flex-wrap gap-3">
              <select
                value={filters.status}
                onChange={(e) => setFilters({...filters, status: e.target.value})}
                className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              >
                <option value="">All Status</option>
                <option value="completed">Completed</option>
                <option value="pending">Pending</option>
                <option value="failed">Failed</option>
                <option value="cancelled">Cancelled</option>
              </select>
              
              <select
                value={filters.paymentType}
                onChange={(e) => setFilters({...filters, paymentType: e.target.value})}
                className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              >
                <option value="">All Types</option>
                <option value="tuition">Tuition Fee</option>
                <option value="hostel">Hostel Fee</option>
                <option value="library">Library Fee</option>
                <option value="exam">Exam Fee</option>
                <option value="other">Other</option>
              </select>
              
              <select
                value={filters.branch}
                onChange={(e) => setFilters({...filters, branch: e.target.value})}
                className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              >
                <option value="">All Branches</option>
                {branches.map((branch: any) => (
                  <option key={branch._id} value={branch.name}>
                    {branch.name}
                  </option>
                ))}
              </select>
              
              <input
                type="date"
                value={filters.dateFrom}
                onChange={(e) => setFilters({...filters, dateFrom: e.target.value})}
                className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                placeholder="From Date"
              />
              
              <input
                type="date"
                value={filters.dateTo}
                onChange={(e) => setFilters({...filters, dateTo: e.target.value})}
                className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                placeholder="To Date"
              />
            </div>
          )}
        </div>
      </div>

      {/* Payments Table */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Student
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Amount
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {payments.map((payment, index) => (
                <motion.tr
                  key={payment._id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900 dark:text-white">
                        {payment.student?.firstName} {payment.student?.lastName}
                      </div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        {payment.student?.regdNo} • {payment.student?.branch}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                    {formatCurrency(payment.amount)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400 capitalize">
                    {payment.paymentType}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(payment.status)}`}>
                      {getStatusIcon(payment.status)}
                      <span className="ml-1 capitalize">{payment.status}</span>
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                    {new Date(payment.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => console.log('View payment:', payment._id)}
                        className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      {payment.status === 'pending' && (
                        <>
                          <button
                            onClick={() => updatePaymentStatus(payment._id, 'completed')}
                            className="text-green-600 hover:text-green-800 dark:text-green-400 dark:hover:text-green-300"
                          >
                            <CheckCircle className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => updatePaymentStatus(payment._id, 'failed')}
                            className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300"
                          >
                            <XCircle className="w-4 h-4" />
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {/* Pagination */}
        {totalPages > 1 && (
          <div className="px-6 py-3 bg-gray-50 dark:bg-gray-700 border-t border-gray-200 dark:border-gray-600">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-700 dark:text-gray-300">
                Page {currentPage} of {totalPages}
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                  className="px-3 py-1 border border-gray-300 dark:border-gray-600 rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Previous
                </button>
                <button
                  onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                  disabled={currentPage === totalPages}
                  className="px-3 py-1 border border-gray-300 dark:border-gray-600 rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </div>
            </div>
          </div>
        )}
        
        {payments.length === 0 && (
          <div className="text-center py-12">
            <Receipt className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">No payments found</h3>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Try adjusting your search criteria or add a new payment.
            </p>
          </div>
        )}
      </div>
    </div>
  );

  const renderContent = () => {
    if (loading) {
      return (
        <div className="flex items-center justify-center h-96">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      );
    }

    switch (activeTab) {
      case 'dashboard':
        return renderDashboard();
      case 'payments':
        return renderPayments();
      case 'outstanding':
        return renderPayments(); // Can reuse the same component with different data
      case 'history':
        return renderHistory();
      case 'reports':
        return renderReports();
      default:
        return renderDashboard();
    }
  };

  const renderHistory = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Payment History</h2>
          <p className="text-gray-600 dark:text-gray-400">View all payment transactions and activities</p>
        </div>
        <button
          onClick={fetchData}
          className="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors"
        >
          <RefreshCw className="w-4 h-4 mr-2" />
          Refresh
        </button>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="space-y-4">
          {paymentHistory.slice(0, 20).map((item: any, index: number) => (
            <motion.div
              key={item._id || index}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className="flex items-center justify-between p-4 rounded-xl bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600"
            >
              <div className="flex items-center space-x-4">
                <div className="p-3 bg-blue-100 dark:bg-blue-900 rounded-lg">
                  <History className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">
                    {item.student?.firstName} {item.student?.lastName} - {item.paymentType}
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {new Date(item.createdAt || item.timestamp).toLocaleString()}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="font-medium text-gray-900 dark:text-white">
                  {formatCurrency(item.amount)}
                </p>
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(item.status)}`}>
                  {getStatusIcon(item.status)}
                  <span className="ml-1 capitalize">{item.status}</span>
                </span>
              </div>
            </motion.div>
          ))}
          {paymentHistory.length === 0 && (
            <div className="text-center py-12">
              <History className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">No payment history</h3>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                Payment history will appear here when available.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  const renderReports = () => (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Financial Reports</h2>
        <p className="text-gray-600 dark:text-gray-400">Generate and download various financial reports</p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[
          { 
            title: 'Monthly Revenue Report', 
            description: 'Detailed monthly revenue breakdown', 
            icon: TrendingUp,
            color: 'from-green-500 to-emerald-500'
          },
          { 
            title: 'Student Payment Report', 
            description: 'Individual student payment history', 
            icon: Users,
            color: 'from-blue-500 to-cyan-500'
          },
          { 
            title: 'Branch Performance Report', 
            description: 'Branch-wise financial performance', 
            icon: Building,
            color: 'from-purple-500 to-violet-500'
          },
          { 
            title: 'Payment Status Report', 
            description: 'Overview of payment statuses', 
            icon: Receipt,
            color: 'from-orange-500 to-red-500'
          },
          { 
            title: 'Outstanding Payments', 
            description: 'List of pending and overdue payments', 
            icon: AlertTriangle,
            color: 'from-red-500 to-pink-500'
          },
          { 
            title: 'Revenue Trends', 
            description: 'Historical revenue analysis', 
            icon: BarChart3,
            color: 'from-indigo-500 to-blue-500'
          }
        ].map((report, index) => (
          <motion.div
            key={report.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-lg transition-shadow"
          >
            <div className={`w-12 h-12 bg-gradient-to-br ${report.color} rounded-lg flex items-center justify-center mb-4`}>
              <report.icon className="w-6 h-6 text-white" />
            </div>
            <h4 className="font-semibold text-gray-900 dark:text-white mb-2">
              {report.title}
            </h4>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              {report.description}
            </p>
            <button
              onClick={exportToExcel}
              className="flex items-center space-x-2 text-blue-600 dark:text-blue-400 font-medium hover:text-blue-800 dark:hover:text-blue-300 transition-colors"
            >
              <Download className="w-4 h-4" />
              <span>Download</span>
            </button>
          </motion.div>
        ))}
      </div>
    </div>
  );

  return (
    <div className={`min-h-screen ${darkMode ? 'dark' : ''} bg-gray-50 dark:bg-gray-900`}>
      <div className="flex h-screen">
        {/* Mobile Sidebar Overlay */}
        <AnimatePresence>
          {open && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden"
              onClick={() => setOpen(false)}
            />
          )}
        </AnimatePresence>

        {/* Custom Sidebar */}
        <motion.div
          initial={{ width: open ? 280 : 70 }}
          animate={{ 
            width: open ? 280 : 70,
            x: 0
          }}
          transition={{ duration: 0.3 }}
          className={`bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex flex-col z-50 fixed md:relative h-full ${
            open ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
          }`}
          onMouseEnter={() => window.innerWidth >= 768 && setOpen(true)}
          onMouseLeave={() => window.innerWidth >= 768 && setOpen(false)}
        >
          {/* Logo/Header */}
          <div className="p-4 border-b border-gray-200 dark:border-gray-700">
            <motion.div
              animate={{ opacity: open ? 1 : 0 }}
              transition={{ duration: 0.2 }}
              className="flex items-center space-x-3"
            >
              <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                <DollarSign className="w-5 h-5 text-white" />
              </div>
              {open && (
                <div>
                  <h2 className="text-lg font-bold text-gray-900 dark:text-white">Finance</h2>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Management</p>
                </div>
              )}
            </motion.div>
          </div>

          {/* Navigation Links */}
          <div className="flex-1 py-4">
            <nav className="space-y-2 px-3">
              {sidebarLinks.map((link, idx) => (
                <motion.button
                  key={idx}
                  onClick={(e) => {
                    e.preventDefault();
                    link.onClick();
                    // Close mobile sidebar after navigation
                    if (window.innerWidth < 768) setOpen(false);
                  }}
                  className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-lg text-left transition-all duration-200 ${
                    link.active 
                      ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800' 
                      : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                  }`}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <div className="flex-shrink-0">
                    {link.icon}
                  </div>
                  <AnimatePresence>
                    {open && (
                      <motion.span
                        initial={{ opacity: 0, width: 0 }}
                        animate={{ opacity: 1, width: "auto" }}
                        exit={{ opacity: 0, width: 0 }}
                        transition={{ duration: 0.2 }}
                        className="text-sm font-medium whitespace-nowrap"
                      >
                        {link.label}
                      </motion.span>
                    )}
                  </AnimatePresence>
                </motion.button>
              ))}
            </nav>
          </div>

          {/* Bottom Actions */}
          <div className="border-t border-gray-200 dark:border-gray-700 p-3 space-y-2">
            <motion.button
              onClick={() => setDarkMode(!darkMode)}
              className="w-full flex items-center justify-center p-2.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              title={darkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
            >
              {darkMode ? 
                <Sun className="h-5 w-5 text-neutral-700 dark:text-neutral-200" /> : 
                <Moon className="h-5 w-5 text-neutral-700 dark:text-neutral-200" />
              }
              <AnimatePresence>
                {open && (
                  <motion.span
                    initial={{ opacity: 0, marginLeft: 0 }}
                    animate={{ opacity: 1, marginLeft: 12 }}
                    exit={{ opacity: 0, marginLeft: 0 }}
                    transition={{ duration: 0.2 }}
                    className="text-sm font-medium text-neutral-700 dark:text-neutral-200"
                  >
                    {darkMode ? "Light Mode" : "Dark Mode"}
                  </motion.span>
                )}
              </AnimatePresence>
            </motion.button>
            
            <motion.button
              onClick={onLogout}
              className="w-full flex items-center justify-center p-2.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-red-600 dark:text-red-400 transition-colors"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              title="Logout"
            >
              <LogOut className="h-5 w-5" />
              <AnimatePresence>
                {open && (
                  <motion.span
                    initial={{ opacity: 0, marginLeft: 0 }}
                    animate={{ opacity: 1, marginLeft: 12 }}
                    exit={{ opacity: 0, marginLeft: 0 }}
                    transition={{ duration: 0.2 }}
                    className="text-sm font-medium"
                  >
                    Logout
                  </motion.span>
                )}
              </AnimatePresence>
            </motion.button>
          </div>
        </motion.div>
        
        <div className={`flex-1 flex flex-col overflow-hidden transition-all duration-300 ${open && window.innerWidth < 768 ? 'ml-0' : 'md:ml-0'}`}>
          {/* Header */}
          <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                {/* Mobile Menu Button */}
                <button
                  onClick={() => setOpen(!open)}
                  className="md:hidden p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                >
                  <Menu className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                </button>
                
                <div>
                  <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Finance Department</h1>
                  <p className="text-gray-600 dark:text-gray-400">Welcome back, {user?.name}</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-4">
                {getRemainingTime && <SessionIndicator getRemainingTime={getRemainingTime} />}
              </div>
            </div>
          </header>
          
          {/* Main Content */}
          <main className="flex-1 overflow-y-auto p-6">
            {renderContent()}
          </main>
        </div>
      </div>
      
      {/* Add Payment Modal */}
      <AnimatePresence>
        {showAddPaymentModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white dark:bg-gray-800 rounded-xl p-6 w-full max-w-md shadow-xl"
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Add New Payment</h3>
                <button
                  onClick={() => setShowAddPaymentModal(false)}
                  className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Student
                  </label>
                  <select
                    value={newPayment.student}
                    onChange={(e) => setNewPayment({...newPayment, student: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                  >
                    <option value="">Select Student</option>
                    {students.map((student: any) => (
                      <option key={student._id} value={student._id}>
                        {student.firstName} {student.lastName} - {student.regdNo}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Amount
                  </label>
                  <input
                    type="number"
                    value={newPayment.amount}
                    onChange={(e) => setNewPayment({...newPayment, amount: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                    placeholder="Enter amount"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Payment Type
                  </label>
                  <select
                    value={newPayment.paymentType}
                    onChange={(e) => setNewPayment({...newPayment, paymentType: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                  >
                    <option value="">Select Type</option>
                    <option value="tuition">Tuition Fee</option>
                    <option value="hostel">Hostel Fee</option>
                    <option value="library">Library Fee</option>
                    <option value="exam">Exam Fee</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Semester
                    </label>
                    <input
                      type="text"
                      value={newPayment.semester}
                      onChange={(e) => setNewPayment({...newPayment, semester: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                      placeholder="e.g., 1st"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Academic Year
                    </label>
                    <input
                      type="text"
                      value={newPayment.academicYear}
                      onChange={(e) => setNewPayment({...newPayment, academicYear: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                      placeholder="2025-26"
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Description
                  </label>
                  <textarea
                    value={newPayment.description}
                    onChange={(e) => setNewPayment({...newPayment, description: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                    rows={3}
                    placeholder="Additional notes..."
                  />
                </div>
              </div>
              
              <div className="flex space-x-3 mt-6">
                <button
                  onClick={() => setShowAddPaymentModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={createPayment}
                  className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                >
                  Create Payment
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default FinanceDepartmentNew;
