import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  User, 
  Calendar,
  Phone,
  Mail,
  GraduationCap,
  CreditCard,
  Receipt,
  LogOut,
  Download,
  Clock,
  CheckCircle,
  AlertCircle,
  Moon,
  Sun,
  Settings,
  Bell,
  Search,
  Filter,
  DollarSign,
  TrendingUp,
  BookOpen,
  Home,
  Eye,
  EyeOff,
  Printer,
  ChevronRight,
  ChevronLeft
} from 'lucide-react';
import axios from 'axios';
import SessionIndicator from '../components/SessionIndicator';

interface StudentDashboardProps {
  user: any;
  onLogout: () => void;
  getRemainingTime?: () => number;
}

// Type definitions for better TypeScript support

const StudentDashboardNew: React.FC<StudentDashboardProps> = ({ user, onLogout, getRemainingTime }) => {
  const navigate = useNavigate();
  const { regdNo } = useParams();
  const location = useLocation();
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('profile');
  const [paymentHistory, setPaymentHistory] = useState([]);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [showBalance, setShowBalance] = useState(true);
  const [showNotificationModal, setShowNotificationModal] = useState(false);
  const [notificationMessage, setNotificationMessage] = useState('');
  const [open, setOpen] = useState(window.innerWidth >= 768);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [loadingResults, setLoadingResults] = useState(false);

  useEffect(() => {
    // Route protection: ensure the regdNo matches the logged-in user
    if (regdNo && user?.regdNo && regdNo !== user.regdNo) {
      navigate(`/student-dashboard/${user.regdNo}`, { replace: true });
      return;
    }
    
    // Handle payment status messages from location state
    if (location.state?.paymentStatus) {
      const { message } = location.state;
      setNotificationMessage(message);
      setShowNotificationModal(true);
      
      // Clear the location state
      navigate(location.pathname, { replace: true, state: {} });
    }
    
    fetchDashboardData();
    if (activeTab === 'payments') {
      fetchPaymentHistory();
    } else if (activeTab === 'results') {
      fetchResults();
    }
  }, [activeTab, regdNo, user, navigate, location]);

  useEffect(() => {
    // Apply dark mode to document
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  useEffect(() => {
    // Handle window resize for responsive sidebar
    const handleResize = () => {
      if (window.innerWidth < 768) {
        setOpen(false);
      } else {
        setOpen(true);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    // Update current time every second
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const fetchDashboardData = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('http://localhost:5000/api/dashboard/student', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setDashboardData(response.data.dashboard);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchPaymentHistory = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`http://localhost:5000/api/payments/student/${user.id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setPaymentHistory(response.data.payments || []);
    } catch (error) {
      console.error('Error fetching payment history:', error);
    }
  };

  const fetchResults = async () => {
    setLoadingResults(true);
    try {
      const token = localStorage.getItem('token');
      await axios.get(`http://localhost:5000/api/results/student/${user.id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      // Results fetched successfully but not stored in state anymore
    } catch (error) {
      console.error('Error fetching results:', error);
      // No results to display
    } finally {
      setLoadingResults(false);
    }
  };

  const handlePayment = async (paymentType: string, amount: number) => {
    // Navigate to custom payment page with payment details
    navigate('/custom-payment', {
      state: {
        amount,
        paymentType,
        studentData: {
          firstName: user.name?.split(' ')[0] || '',
          lastName: user.name?.split(' ')[1] || '',
          regdNo: user.regdNo,
          email: user.email
        }
      }
    });
  };

  const handleRetryPayment = (paymentId: string, paymentType: string, amount: number) => {
    // Navigate to custom payment page for retry
    navigate('/custom-payment', {
      state: {
        amount,
        paymentType,
        retryPaymentId: paymentId,
        studentData: {
          firstName: user.name?.split(' ')[0] || '',
          lastName: user.name?.split(' ')[1] || '',
          regdNo: user.regdNo,
          email: user.email
        }
      }
    });
  };

  const handlePrintReceipt = (payment: any) => {
    const { student } = dashboardData || {};
    const receiptContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Payment Receipt</title>
        <style>
          body {
            font-family: Arial, sans-serif;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
            line-height: 1.6;
          }
          .header {
            text-align: center;
            border-bottom: 2px solid #333;
            padding-bottom: 20px;
            margin-bottom: 20px;
          }
          .receipt-info {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 20px;
            margin-bottom: 20px;
          }
          .receipt-row {
            display: flex;
            justify-content: space-between;
            padding: 8px 0;
            border-bottom: 1px solid #eee;
          }
          .amount {
            font-size: 1.5em;
            font-weight: bold;
            color: #10b981;
          }
          .signature-section {
            margin-top: 40px;
            padding: 20px;
            border: 1px solid #ddd;
            border-radius: 5px;
            background-color: #f9f9f9;
          }
          .signature-row {
            display: flex;
            justify-content: space-between;
            margin-bottom: 30px;
          }
          .signature-box {
            text-align: center;
            min-width: 200px;
          }
          .signature-line {
            border-bottom: 1px solid #333;
            height: 40px;
            margin-bottom: 5px;
          }
          .footer {
            text-align: center;
            margin-top: 30px;
            padding-top: 20px;
            border-top: 1px solid #eee;
            font-size: 0.9em;
            color: #666;
          }
          @media print {
            body { margin: 0; padding: 10px; }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>Payment Receipt</h1>
          <h2>College Management System</h2>
        </div>
        
        <div class="receipt-info">
          <div>
            <div class="receipt-row">
              <span><strong>Student Name:</strong></span>
              <span>${student?.firstName || ''} ${student?.lastName || ''}</span>
            </div>
            <div class="receipt-row">
              <span><strong>Registration No:</strong></span>
              <span>${student?.regdNo || 'N/A'}</span>
            </div>
            <div class="receipt-row">
              <span><strong>Branch:</strong></span>
              <span>${student?.branch?.name || 'N/A'}</span>
            </div>
            <div class="receipt-row">
              <span><strong>Semester:</strong></span>
              <span>${student?.semester || 'N/A'}</span>
            </div>
          </div>
          
          <div>
            <div class="receipt-row">
              <span><strong>Receipt Number:</strong></span>
              <span>${payment.receiptNumber}</span>
            </div>
            <div class="receipt-row">
              <span><strong>Payment Date:</strong></span>
              <span>${new Date(payment.paymentDate).toLocaleDateString()}</span>
            </div>
            <div class="receipt-row">
              <span><strong>Payment Type:</strong></span>
              <span>${payment.paymentType}</span>
            </div>
            <div class="receipt-row">
              <span><strong>Payment Status:</strong></span>
              <span style="color: #10b981; font-weight: bold;">COMPLETED</span>
            </div>
          </div>
        </div>
        
        <div class="receipt-row" style="font-size: 1.2em; font-weight: bold; border: 2px solid #333; padding: 15px; margin: 20px 0;">
          <span>Total Amount Paid:</span>
          <span class="amount">₹${payment.amount}</span>
        </div>
        
        <div class="signature-section">
          <h3 style="text-align: center; margin-bottom: 30px; color: #333;">Authorization & Verification</h3>
          <div class="signature-row">
            <div class="signature-box">
              <div class="signature-line"></div>
              <p><strong>Student Signature</strong></p>
            </div>
            <div class="signature-box">
              <div class="signature-line"></div>
              <p><strong>Finance Officer</strong></p>
            </div>
          </div>
          <div style="text-align: center; margin-top: 20px;">
            <p style="color: #10b981; font-weight: bold; font-size: 1.1em;">✓ VERIFIED</p>
            <p style="color: #666; font-size: 0.9em;">This receipt has been electronically verified and processed</p>
          </div>
        </div>
        
        <div class="footer">
          <p>This is a computer-generated receipt and does not require a signature.</p>
          <p>Thank you for your payment!</p>
          <p>Generated on: ${new Date().toLocaleString()}</p>
        </div>
      </body>
      </html>
    `;

    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(receiptContent);
      printWindow.document.close();
      printWindow.focus();
      printWindow.print();
      printWindow.close();
    } else {
      alert('Please allow popups to print the receipt');
    }
  };

  const filteredPaymentHistory = paymentHistory.filter((payment: any) => {
    const matchesSearch = payment.paymentType.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         payment.receiptNumber?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterType === 'all' || payment.paymentType === filterType;
    return matchesSearch && matchesFilter;
  });

  const toggleDarkMode = () => {
    setIsDarkMode(!isDarkMode);
  };

  // Sidebar navigation links for student
  const links = [
    {
      label: "Dashboard",
      href: "#",
      onClick: () => setActiveTab('profile'),
      icon: (
        <Home className="h-5 w-5 flex-shrink-0" />
      ),
      active: activeTab === 'profile'
    },
    {
      label: "Payments",
      href: "#",
      onClick: () => {
        setActiveTab('payments');
        fetchPaymentHistory();
      },
      icon: (
        <CreditCard className="h-5 w-5 flex-shrink-0" />
      ),
      active: activeTab === 'payments'
    },
    {
      label: "Receipts",
      href: "#",
      onClick: () => {
        setActiveTab('receipts');
        fetchPaymentHistory();
      },
      icon: (
        <Receipt className="h-5 w-5 flex-shrink-0" />
      ),
      active: activeTab === 'receipts'
    },
    {
      label: "Results",
      href: "#",
      onClick: () => {
        setActiveTab('results');
        fetchResults();
      },
      icon: (
        <BookOpen className="h-5 w-5 flex-shrink-0" />
      ),
      active: activeTab === 'results'
    },
  ];

  if (loading) {
    return (
      <div className={`min-h-screen ${isDarkMode ? 'bg-gray-900' : 'bg-gray-50'} flex items-center justify-center overflow-hidden`}>
        <motion.div 
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center relative z-10"
        >
          <div className="relative mb-8">
            <motion.div 
              animate={{ rotate: 360 }}
              transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
              className="w-20 h-20 border-4 border-purple-500/20 border-t-purple-500 rounded-full mx-auto"
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
            className={`${isDarkMode ? 'text-gray-300' : 'text-gray-600'} text-xl font-medium`}
          >
            Loading Student Dashboard
          </motion.p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className={isDarkMode ? 'dark' : ''}>
      <div className="flex h-screen w-full bg-gray-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 overflow-hidden">
          {/* Mobile backdrop */}
          {open && (
            <div 
              className="fixed inset-0 bg-black/50 z-40 md:hidden"
              onClick={() => setOpen(false)}
            />
          )}
          
          {/* Custom Modern Sidebar */}
          <motion.div
            initial={false}
            animate={{ width: open ? 280 : 80 }}
            transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
            className="fixed left-0 top-0 h-full bg-white/80 dark:bg-neutral-900/80 backdrop-blur-xl border-r border-neutral-200/50 dark:border-neutral-700/50 z-50 flex flex-col shadow-2xl"
          >
            {/* Toggle Button */}
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => setOpen(!open)}
              className="absolute -right-3 top-8 h-6 w-6 rounded-full bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 flex items-center justify-center shadow-lg hover:shadow-xl transition-all z-10"
            >
              {open ? (
                <ChevronLeft className="h-3 w-3 text-neutral-600 dark:text-neutral-400" />
              ) : (
                <ChevronRight className="h-3 w-3 text-neutral-600 dark:text-neutral-400" />
              )}
            </motion.button>

            {/* Header with Logo */}
            <div className="p-4 border-b border-neutral-200/50 dark:border-neutral-700/50">
              <motion.div
                initial={false}
                animate={{ opacity: open ? 1 : 0 }}
                transition={{ duration: 0.2 }}
                className="flex items-center space-x-3"
              >
                <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                  <GraduationCap className="h-5 w-5 text-white" />
                </div>
                {open && (
                  <motion.div
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.1 }}
                  >
                    <h2 className="text-lg font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                      EduCMS
                    </h2>
                    <p className="text-xs text-neutral-500 dark:text-neutral-400">Student Portal</p>
                  </motion.div>
                )}
              </motion.div>
            </div>

            {/* Navigation Links */}
            <div className="flex-1 p-4 space-y-2 overflow-y-auto">
              {links.map((link, idx) => (
                <motion.button
                  key={idx}
                  onClick={() => {
                    link.onClick();
                    if (window.innerWidth < 768) {
                      setOpen(false);
                    }
                  }}
                  whileHover={{ scale: 1.02, x: 2 }}
                  whileTap={{ scale: 0.98 }}
                  className={`w-full flex items-center space-x-3 px-3 py-3 rounded-xl transition-all duration-200 group ${
                    link.active 
                      ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg' 
                      : 'text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800/50'
                  }`}
                  title={!open ? link.label : undefined}
                >
                  <span className={`flex-shrink-0 transition-transform duration-200 ${link.active ? '' : 'group-hover:scale-110'}`}>
                    {link.icon}
                  </span>
                  {open && (
                    <motion.span
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.05 }}
                      className="font-medium"
                    >
                      {link.label}
                    </motion.span>
                  )}
                </motion.button>
              ))}
            </div>
            
            {/* User Profile Section */}
            <div className="p-4 border-t border-neutral-200/50 dark:border-neutral-700/50 space-y-3">
              <motion.div
                whileHover={{ scale: 1.02 }}
                className={`flex items-center space-x-3 p-3 rounded-xl bg-gradient-to-r from-neutral-100 to-neutral-50 dark:from-neutral-800/50 dark:to-neutral-700/50 ${
                  open ? '' : 'justify-center'
                }`}
              >
                <div className="h-10 w-10 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center flex-shrink-0">
                  <User className="h-5 w-5 text-white" />
                </div>
                {open && (
                  <motion.div
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.1 }}
                    className="flex-1 min-w-0"
                  >
                    <p className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 truncate">
                      {dashboardData?.student?.firstName || "Student"}
                    </p>
                    <p className="text-xs text-neutral-500 dark:text-neutral-400 truncate">
                      {dashboardData?.student?.email}
                    </p>
                  </motion.div>
                )}
              </motion.div>
              
              {/* Logout Button */}
              <motion.button
                onClick={onLogout}
                whileHover={{ scale: 1.02, x: 2 }}
                whileTap={{ scale: 0.98 }}
                className={`w-full flex items-center space-x-3 px-3 py-3 rounded-xl transition-all duration-200 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 group ${
                  open ? '' : 'justify-center'
                }`}
                title={!open ? "Logout" : undefined}
              >
                <LogOut className="h-5 w-5 flex-shrink-0 group-hover:scale-110 transition-transform duration-200" />
                {open && (
                  <motion.span
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="font-medium"
                  >
                    Logout
                  </motion.span>
                )}
              </motion.button>
            </div>
          </motion.div>
        
        {/* Main Content with proper margin */}
        <div className={`transition-all duration-300 ${open ? 'ml-[280px]' : 'ml-[80px]'} flex-1 min-h-screen`}>
          <StudentDashboardContent 
            onLogout={onLogout} 
            getRemainingTime={getRemainingTime}
            dashboardData={dashboardData}
            filteredPaymentHistory={filteredPaymentHistory}
            isDarkMode={isDarkMode}
            toggleDarkMode={toggleDarkMode}
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            fetchPaymentHistory={fetchPaymentHistory}
            fetchResults={fetchResults}
            handlePayment={handlePayment}
            handleRetryPayment={handleRetryPayment}
            handlePrintReceipt={handlePrintReceipt}
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
            filterType={filterType}
            setFilterType={setFilterType}
            showBalance={showBalance}
            setShowBalance={setShowBalance}
            showNotifications={showNotifications}
            setShowNotifications={setShowNotifications}
            showNotificationModal={showNotificationModal}
            setShowNotificationModal={setShowNotificationModal}
            notificationMessage={notificationMessage}
            user={user}
            currentTime={currentTime}
            loadingResults={loadingResults}
          />
        </div>
      </div>
    </div>
  );
};

// Logo components for student
export const StudentLogo = () => {
  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="font-normal flex space-x-3 items-center text-sm py-2 relative z-20"
    >
      <div className="h-8 w-8 bg-gradient-to-r from-blue-500 to-purple-500 rounded-xl flex items-center justify-center flex-shrink-0">
        <GraduationCap className="h-5 w-5 text-white" />
      </div>
      <motion.span 
        initial={{ width: 0 }}
        animate={{ width: "auto" }}
        className="font-semibold text-lg text-black dark:text-white whitespace-pre"
      >
        Student Portal
      </motion.span>
    </motion.div>
  );
};

export const StudentLogoIcon = () => {
  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="font-normal flex justify-center items-center text-sm py-2 relative z-20"
    >
      <div className="h-8 w-8 bg-gradient-to-r from-blue-500 to-purple-500 rounded-xl flex items-center justify-center flex-shrink-0">
        <GraduationCap className="h-5 w-5 text-white" />
      </div>
    </motion.div>
  );
};

// Dashboard content component
const StudentDashboardContent = ({ 
  getRemainingTime, 
  dashboardData,
  filteredPaymentHistory,
  isDarkMode, 
  toggleDarkMode, 
  activeTab,
  setActiveTab,
  fetchPaymentHistory,
  fetchResults,
  handlePayment,
  handleRetryPayment,
  handlePrintReceipt,
  searchTerm,
  setSearchTerm,
  filterType,
  setFilterType,
  showBalance,
  setShowBalance,
  showNotifications,
  setShowNotifications,
  showNotificationModal,
  setShowNotificationModal,
  notificationMessage,
  user,
  currentTime,
  loadingResults
}: any) => {
  const { student, financials } = dashboardData || {};

  return (
    <div className="flex flex-1 flex-col h-full bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-purple-900 transition-all duration-300">
      {/* Enhanced Header */}
      <motion.header 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl shadow-lg border-b border-gray-200/50 dark:border-gray-700/50 flex-shrink-0 z-10"
      >
        <div className="w-full px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <motion.div 
                whileHover={{ scale: 1.02 }}
                className="flex items-center space-x-4"
              >
                <div>
                  <h1 className="text-xl font-bold text-gray-900 dark:text-white">
                    Welcome Back, {user?.regdNo || user?.id || 'Student'}
                  </h1>
                  <div className="flex items-center space-x-4 text-sm text-gray-600 dark:text-gray-400">
                    <span className="font-medium">
                      {currentTime.toLocaleTimeString('en-US', { 
                        hour: '2-digit', 
                        minute: '2-digit',
                        second: '2-digit',
                        hour12: true 
                      })}
                    </span>
                    <span className="text-gray-400">•</span>
                    <span>
                      {currentTime.toLocaleDateString('en-US', { 
                        weekday: 'long',
                        year: 'numeric', 
                        month: 'long', 
                        day: 'numeric' 
                      })}
                    </span>
                  </div>
                </div>
              </motion.div>
            </div>

            <div className="flex items-center space-x-4">
              {/* Search Bar */}
              <motion.div 
                whileHover={{ scale: 1.02 }}
                className="hidden md:flex items-center space-x-2 bg-gray-100 dark:bg-gray-700 rounded-lg px-3 py-2"
              >
                <Search className="w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search payments..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="bg-transparent border-none outline-none text-sm text-gray-600 dark:text-gray-300 w-48"
                />
              </motion.div>

              {/* Theme Toggle */}
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={toggleDarkMode}
                className="p-2 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
              >
                {isDarkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
              </motion.button>

              {/* Notifications */}
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => setShowNotifications(!showNotifications)}
                className="relative p-2 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
              >
                <Bell className="w-5 h-5" />
                <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full"></span>
              </motion.button>

              {/* Session Indicator */}
              {getRemainingTime && (
                <SessionIndicator 
                  getRemainingTime={getRemainingTime}
                  darkMode={isDarkMode}
                />
              )}
            </div>
          </div>
        </div>
      </motion.header>

      {/* Enhanced Navigation Tabs */}
      <div className="w-full px-4 sm:px-6 lg:px-8 flex-shrink-0">
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="border-b border-gray-200/50 dark:border-gray-700/50"
        >
          <nav className="-mb-px flex space-x-6 md:space-x-8 justify-center flex-wrap">
            {[
              { id: 'profile', label: 'Profile', icon: User },
              { id: 'payments', label: 'Payments', icon: CreditCard },
              { id: 'receipts', label: 'Receipts', icon: Receipt },
              { id: 'results', label: 'Results', icon: BookOpen }
            ].map((tab) => {
              const Icon = tab.icon;
              return (
                <motion.button
                  key={tab.id}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => {
                    setActiveTab(tab.id);
                    if (tab.id === 'payments') {
                      fetchPaymentHistory();
                    } else if (tab.id === 'results') {
                      fetchResults();
                    }
                  }}
                  className={`group py-4 px-1 border-b-2 font-medium text-sm transition-all flex items-center space-x-2 ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                      : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:border-gray-300'
                  }`}
                >
                  <Icon className={`w-4 h-4 transition-colors ${
                    activeTab === tab.id ? 'text-blue-600 dark:text-blue-400' : 'text-gray-400 group-hover:text-gray-600'
                  }`} />
                  <span>{tab.label}</span>
                </motion.button>
              );
            })}
          </nav>
        </motion.div>
      </div>

      {/* Main Content Area */}
      <div className="w-full px-4 sm:px-6 lg:px-8 py-8 flex-1 overflow-y-auto">
        {activeTab === 'profile' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Profile Information */}
            <div className="lg:col-span-2 space-y-6">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-xl rounded-2xl shadow-xl p-6 border border-gray-200/50 dark:border-gray-700/50"
              >
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center space-x-2">
                    <User className="w-6 h-6 text-blue-600" />
                    <span>Personal Information</span>
                  </h2>
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    className="p-2 rounded-lg bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-colors"
                  >
                    <Settings className="w-4 h-4" />
                  </motion.button>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {[
                    { icon: User, label: 'Full Name', value: `${student?.firstName} ${student?.lastName}` },
                    { icon: GraduationCap, label: 'Registration No.', value: student?.regdNo },
                    { icon: Mail, label: 'Email', value: student?.email },
                    { icon: Phone, label: 'Phone', value: student?.phone },
                    { icon: BookOpen, label: 'Branch', value: student?.branch?.name },
                    { icon: Calendar, label: 'Semester', value: student?.semester }
                  ].map((item, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="group p-4 rounded-xl bg-gray-50 dark:bg-gray-700/50 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                    >
                      <div className="flex items-center space-x-3">
                        <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 group-hover:scale-110 transition-transform">
                          <item.icon className="w-4 h-4" />
                        </div>
                        <div>
                          <p className="text-sm text-gray-500 dark:text-gray-400">{item.label}</p>
                          <p className="font-semibold text-gray-900 dark:text-white">{item.value}</p>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </motion.div>

              {/* Academic Information */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-xl rounded-2xl shadow-xl p-6 border border-gray-200/50 dark:border-gray-700/50"
              >
                <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6 flex items-center space-x-2">
                  <GraduationCap className="w-6 h-6 text-green-600" />
                  <span>Academic Information</span>
                </h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {[
                    { icon: Calendar, label: 'Admission Date', value: new Date(student?.admissionDate).toLocaleDateString() },
                    { icon: BookOpen, label: 'Branch Code', value: student?.branch?.code }
                  ].map((item, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: (index + 6) * 0.1 }}
                      className="group p-4 rounded-xl bg-gray-50 dark:bg-gray-700/50 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                    >
                      <div className="flex items-center space-x-3">
                        <div className="p-2 rounded-lg bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 group-hover:scale-110 transition-transform">
                          <item.icon className="w-4 h-4" />
                        </div>
                        <div>
                          <p className="text-sm text-gray-500 dark:text-gray-400">{item.label}</p>
                          <p className="font-semibold text-gray-900 dark:text-white">{item.value}</p>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            </div>

            {/* Enhanced Fee Summary */}
            <div className="lg:col-span-1">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-xl rounded-2xl shadow-xl p-6 border border-gray-200/50 dark:border-gray-700/50 sticky top-24"
              >
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center space-x-2">
                    <DollarSign className="w-6 h-6 text-yellow-600" />
                    <span>Fee Summary</span>
                  </h2>
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => setShowBalance(!showBalance)}
                    className="p-2 rounded-lg bg-yellow-50 dark:bg-yellow-900/30 text-yellow-600 dark:text-yellow-400 hover:bg-yellow-100 dark:hover:bg-yellow-900/50 transition-colors"
                  >
                    {showBalance ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                  </motion.button>
                </div>
                
                <div className="space-y-4">
                  {[
                    { 
                      type: 'academic', 
                      label: 'Academic Fee', 
                      total: financials?.totalFees?.academic || 0,
                      due: financials?.dues?.academic || 0,
                      color: 'blue',
                      icon: BookOpen
                    },
                    { 
                      type: 'hostel', 
                      label: 'Hostel Fee', 
                      total: financials?.totalFees?.hostel || 0,
                      due: financials?.dues?.hostel || 0,
                      color: 'green',
                      icon: Home
                    },
                    { 
                      type: 'other', 
                      label: 'Other Fee', 
                      total: financials?.totalFees?.other || 0,
                      due: financials?.dues?.other || 0,
                      color: 'purple',
                      icon: Receipt
                    }
                  ].map((fee, index) => {
                    const Icon = fee.icon;
                    return (
                      <motion.div
                        key={fee.type}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.1 }}
                        whileHover={{ scale: 1.02 }}
                        className={`p-4 rounded-xl bg-gradient-to-r from-${fee.color}-50 to-${fee.color}-100 dark:from-${fee.color}-900/30 dark:to-${fee.color}-800/30 border border-${fee.color}-200 dark:border-${fee.color}-700/50 cursor-pointer group`}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center space-x-2">
                            <Icon className={`w-5 h-5 text-${fee.color}-600 dark:text-${fee.color}-400`} />
                            <p className="font-semibold text-gray-900 dark:text-white">{fee.label}</p>
                          </div>
                          <TrendingUp className={`w-4 h-4 text-${fee.color}-500 group-hover:scale-110 transition-transform`} />
                        </div>
                        <div className="space-y-1">
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-600 dark:text-gray-400">Total:</span>
                            <span className={`font-bold text-${fee.color}-600 dark:text-${fee.color}-400`}>
                              {showBalance ? `₹${fee.total.toLocaleString()}` : '••••••'}
                            </span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-600 dark:text-gray-400">Due:</span>
                            <span className={`font-bold ${fee.due > 0 ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'}`}>
                              {showBalance ? `₹${fee.due.toLocaleString()}` : '••••••'}
                            </span>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                  
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                    className="border-t border-gray-200 dark:border-gray-700 pt-4"
                  >
                    <div className="flex justify-between items-center p-4 bg-gradient-to-r from-red-50 to-pink-50 dark:from-red-900/30 dark:to-pink-900/30 rounded-xl border border-red-200 dark:border-red-700/50">
                      <div className="flex items-center space-x-2">
                        <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
                        <p className="font-bold text-gray-900 dark:text-white">Total Due</p>
                      </div>
                      <p className="text-2xl font-bold text-red-600 dark:text-red-400">
                        {showBalance ? `₹${(financials?.totalDue || 0).toLocaleString()}` : '••••••'}
                      </p>
                    </div>
                  </motion.div>
                </div>
              </motion.div>
            </div>
          </div>
        )}

        {activeTab === 'payments' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Enhanced Payment Actions */}
            <div className="lg:col-span-1">
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-xl rounded-2xl shadow-xl p-6 mb-6 border border-gray-200/50 dark:border-gray-700/50 sticky top-24"
              >
                <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6 flex items-center space-x-2">
                  <CreditCard className="w-6 h-6 text-blue-600" />
                  <span>Make Payment</span>
                </h2>
                
                <div className="space-y-4">
                  {financials?.dues?.academic > 0 && (
                    <motion.button
                      whileHover={{ scale: 1.02, y: -2 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => handlePayment('academic', financials.dues.academic)}
                      className="w-full group p-4 border-2 border-blue-200 dark:border-blue-700 rounded-xl hover:border-blue-300 dark:hover:border-blue-600 transition-all bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-900/30 dark:to-blue-800/30 hover:from-blue-100 hover:to-blue-200 dark:hover:from-blue-800/40 dark:hover:to-blue-700/40"
                    >
                      <div className="flex items-center justify-between">
                        <div className="text-left">
                          <div className="flex items-center space-x-2 mb-1">
                            <BookOpen className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                            <p className="font-semibold text-gray-900 dark:text-white">Academic Fee</p>
                          </div>
                          <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                            ₹{financials.dues.academic.toLocaleString()}
                          </p>
                          <p className="text-sm text-gray-500 dark:text-gray-400">Click to pay now</p>
                        </div>
                        <motion.div
                          whileHover={{ rotate: 360 }}
                          transition={{ duration: 0.3 }}
                          className="p-3 bg-blue-600 text-white rounded-xl group-hover:bg-blue-700 transition-colors"
                        >
                          <CreditCard className="w-6 h-6" />
                        </motion.div>
                      </div>
                    </motion.button>
                  )}
                  
                  {financials?.dues?.hostel > 0 && (
                    <motion.button
                      whileHover={{ scale: 1.02, y: -2 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => handlePayment('hostel', financials.dues.hostel)}
                      className="w-full group p-4 border-2 border-green-200 dark:border-green-700 rounded-xl hover:border-green-300 dark:hover:border-green-600 transition-all bg-gradient-to-r from-green-50 to-green-100 dark:from-green-900/30 dark:to-green-800/30 hover:from-green-100 hover:to-green-200 dark:hover:from-green-800/40 dark:hover:to-green-700/40"
                    >
                      <div className="flex items-center justify-between">
                        <div className="text-left">
                          <div className="flex items-center space-x-2 mb-1">
                            <Home className="w-5 h-5 text-green-600 dark:text-green-400" />
                            <p className="font-semibold text-gray-900 dark:text-white">Hostel Fee</p>
                          </div>
                          <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                            ₹{financials.dues.hostel.toLocaleString()}
                          </p>
                          <p className="text-sm text-gray-500 dark:text-gray-400">Click to pay now</p>
                        </div>
                        <motion.div
                          whileHover={{ rotate: 360 }}
                          transition={{ duration: 0.3 }}
                          className="p-3 bg-green-600 text-white rounded-xl group-hover:bg-green-700 transition-colors"
                        >
                          <CreditCard className="w-6 h-6" />
                        </motion.div>
                      </div>
                    </motion.button>
                  )}
                  
                  {financials?.dues?.other > 0 && (
                    <motion.button
                      whileHover={{ scale: 1.02, y: -2 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => handlePayment('other', financials.dues.other)}
                      className="w-full group p-4 border-2 border-purple-200 dark:border-purple-700 rounded-xl hover:border-purple-300 dark:hover:border-purple-600 transition-all bg-gradient-to-r from-purple-50 to-purple-100 dark:from-purple-900/30 dark:to-purple-800/30 hover:from-purple-100 hover:to-purple-200 dark:hover:from-purple-800/40 dark:hover:to-purple-700/40"
                    >
                      <div className="flex items-center justify-between">
                        <div className="text-left">
                          <div className="flex items-center space-x-2 mb-1">
                            <Receipt className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                            <p className="font-semibold text-gray-900 dark:text-white">Other Fee</p>
                          </div>
                          <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                            ₹{financials.dues.other.toLocaleString()}
                          </p>
                          <p className="text-sm text-gray-500 dark:text-gray-400">Click to pay now</p>
                        </div>
                        <motion.div
                          whileHover={{ rotate: 360 }}
                          transition={{ duration: 0.3 }}
                          className="p-3 bg-purple-600 text-white rounded-xl group-hover:bg-purple-700 transition-colors"
                        >
                          <CreditCard className="w-6 h-6" />
                        </motion.div>
                      </div>
                    </motion.button>
                  )}
                  
                  {financials?.totalDue === 0 && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.5 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="p-6 bg-gradient-to-r from-green-50 to-emerald-100 dark:from-green-900/30 dark:to-emerald-800/30 rounded-xl text-center border border-green-200 dark:border-green-700"
                    >
                      <motion.div
                        animate={{ rotate: [0, 360] }}
                        transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                      >
                        <CheckCircle className="w-12 h-12 text-green-600 dark:text-green-400 mx-auto mb-3" />
                      </motion.div>
                      <p className="text-green-800 dark:text-green-200 font-bold text-lg">All fees paid!</p>
                      <p className="text-green-600 dark:text-green-400 text-sm mt-1">You're all caught up</p>
                    </motion.div>
                  )}
                </div>
              </motion.div>
            </div>

            {/* Enhanced Payment History */}
            <div className="lg:col-span-2">
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-xl rounded-2xl shadow-xl p-6 border border-gray-200/50 dark:border-gray-700/50"
              >
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 space-y-4 sm:space-y-0">
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center space-x-2">
                    <Receipt className="w-6 h-6 text-blue-600" />
                    <span>Payment History</span>
                  </h2>
                  
                  <div className="flex items-center space-x-3">
                    {/* Filter Dropdown */}
                    <div className="relative">
                      <select
                        value={filterType}
                        onChange={(e) => setFilterType(e.target.value)}
                        className="appearance-none bg-gray-100 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg px-4 py-2 pr-8 text-sm font-medium text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="all">All Types</option>
                        <option value="academic">Academic</option>
                        <option value="hostel">Hostel</option>
                        <option value="other">Other</option>
                      </select>
                      <Filter className="absolute right-2 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                    </div>
                    
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                    >
                      <Download className="w-4 h-4" />
                      <span>Export</span>
                    </motion.button>
                  </div>
                </div>
                
                <div className="overflow-hidden rounded-xl border border-gray-200 dark:border-gray-700">
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                      <thead className="bg-gray-50 dark:bg-gray-800/50">
                        <tr>
                          {['Date', 'Type', 'Amount', 'Status', 'Receipt'].map((header) => (
                            <th key={header} className="px-6 py-4 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                              {header}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                        {filteredPaymentHistory.length === 0 ? (
                          <tr>
                            <td colSpan={5} className="px-6 py-12 text-center">
                              <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="flex flex-col items-center space-y-3"
                              >
                                <Receipt className="w-12 h-12 text-gray-400" />
                                <p className="text-gray-500 dark:text-gray-400 font-medium">No payment history found</p>
                                <p className="text-sm text-gray-400 dark:text-gray-500">Your payment records will appear here</p>
                              </motion.div>
                            </td>
                          </tr>
                        ) : (
                          filteredPaymentHistory.map((payment: any, index: number) => (
                            <motion.tr
                              key={index}
                              initial={{ opacity: 0, y: 20 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ delay: index * 0.05 }}
                              className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                            >
                              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                                {payment.paidDate ? new Date(payment.paidDate).toLocaleDateString() : 'N/A'}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <motion.span
                                  whileHover={{ scale: 1.05 }}
                                  className="inline-flex px-3 py-1 text-xs font-semibold rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200 capitalize"
                                >
                                  {payment.paymentType}
                                </motion.span>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900 dark:text-white">
                                ₹{payment.amount.toLocaleString()}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <motion.span
                                  whileHover={{ scale: 1.05 }}
                                  className={`inline-flex items-center px-3 py-1 text-xs font-semibold rounded-full ${
                                    payment.status === 'completed' ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200' :
                                    payment.status === 'pending' ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-200' :
                                    'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-200'
                                  }`}
                                >
                                  {payment.status === 'completed' && <CheckCircle className="w-3 h-3 mr-1" />}
                                  {payment.status === 'pending' && <Clock className="w-3 h-3 mr-1" />}
                                  {payment.status === 'failed' && <AlertCircle className="w-3 h-3 mr-1" />}
                                  {payment.status}
                                </motion.span>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                {payment.status === 'completed' && payment.receiptNumber && (
                                  <div className="flex items-center space-x-2">
                                    <motion.button
                                      whileHover={{ scale: 1.1 }}
                                      whileTap={{ scale: 0.9 }}
                                      className="p-2 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition-colors"
                                      title="View Receipt"
                                    >
                                      <Receipt className="w-4 h-4" />
                                    </motion.button>
                                    <motion.button
                                      whileHover={{ scale: 1.1 }}
                                      whileTap={{ scale: 0.9 }}
                                      onClick={() => handlePrintReceipt(payment)}
                                      className="p-2 text-green-600 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/30 rounded-lg transition-colors"
                                      title="Print Receipt"
                                    >
                                      <Printer className="w-4 h-4" />
                                    </motion.button>
                                  </div>
                                )}
                                {payment.status === 'failed' && (
                                  <motion.button
                                    whileHover={{ scale: 1.1 }}
                                    whileTap={{ scale: 0.9 }}
                                    onClick={() => handleRetryPayment(payment._id, payment.paymentType, payment.amount)}
                                    className="px-3 py-1 text-xs font-semibold text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors"
                                    title="Retry Payment"
                                  >
                                    Retry
                                  </motion.button>
                                )}
                                {payment.status === 'pending' && (
                                  <span className="text-xs text-gray-500 dark:text-gray-400">
                                    Under Verification
                                  </span>
                                )}
                              </td>
                            </motion.tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        )}

        {activeTab === 'receipts' && (
          <div className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-xl rounded-2xl shadow-xl p-6 border border-gray-200/50 dark:border-gray-700/50">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6 flex items-center space-x-2">
              <Receipt className="w-6 h-6 text-blue-600" />
              <span>Receipts & Downloads</span>
            </h2>
            <div className="space-y-4">
              {filteredPaymentHistory.filter((payment: any) => payment.status === 'completed').length > 0 ? (
                filteredPaymentHistory
                  .filter((payment: any) => payment.status === 'completed')
                  .map((payment: any, index: number) => (
                    <motion.div
                      key={payment._id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="flex items-center justify-between p-4 rounded-xl bg-neutral-50 dark:bg-neutral-700/50 border border-neutral-200 dark:border-neutral-600"
                    >
                      <div className="flex items-center space-x-4">
                        <div className="p-2 bg-green-100 dark:bg-green-500/20 rounded-lg">
                          <Receipt className="w-5 h-5 text-green-600 dark:text-green-400" />
                        </div>
                        <div>
                          <p className="font-medium text-neutral-900 dark:text-neutral-100">
                            Receipt #{payment._id.slice(-6)}
                          </p>
                          <p className="text-sm text-neutral-500 dark:text-neutral-400">
                            Amount: ₹{payment.amount} • {new Date(payment.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => handlePrintReceipt(payment)}
                          className="flex items-center space-x-2 px-4 py-2 rounded-lg bg-blue-100 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400 hover:bg-blue-200 dark:hover:bg-blue-500/30"
                        >
                          <Download className="w-4 h-4" />
                          <span className="text-sm font-medium">Download</span>
                        </motion.button>
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => handlePrintReceipt(payment)}
                          className="p-2 rounded-lg bg-neutral-100 dark:bg-neutral-700 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-200 dark:hover:bg-neutral-600"
                        >
                          <Printer className="w-4 h-4" />
                        </motion.button>
                      </div>
                    </motion.div>
                  ))
              ) : (
                <div className="text-center py-12">
                  <Receipt className="w-16 h-16 text-neutral-400 mx-auto mb-4" />
                  <p className="text-neutral-500 dark:text-neutral-400">No receipts available</p>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'results' && (
          <div className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-xl rounded-2xl shadow-xl p-6 border border-gray-200/50 dark:border-gray-700/50">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6 flex items-center space-x-2">
              <BookOpen className="w-6 h-6 text-green-600" />
              <span>Academic Results</span>
            </h2>
            
            {loadingResults ? (
              <div className="flex justify-center items-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
              </div>
            ) : (
              <div className="text-center py-12 space-y-6">
                <div className="mx-auto w-24 h-24 bg-gradient-to-r from-green-100 to-blue-100 dark:from-green-900/30 dark:to-blue-900/30 rounded-full flex items-center justify-center">
                  <BookOpen className="w-12 h-12 text-green-600 dark:text-green-400" />
                </div>
                
                <div>
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                    View Your Academic Results
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400 mb-6 max-w-md mx-auto">
                    Access your complete academic results, semester-wise performance, and detailed grade reports on our dedicated results portal.
                  </p>
                </div>

                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => window.open('https://gyanranjanpriyam.netlify.app', '_blank')}
                  className="inline-flex items-center space-x-3 px-8 py-4 bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-200"
                >
                  <BookOpen className="w-5 h-5" />
                  <span>View Your Results</span>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                </motion.button>

                {/* Help Section */}
                <div className="mt-8 p-6 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-200 dark:border-blue-700/50">
                  <div className="flex items-center justify-center space-x-2 mb-3">
                    <svg className="w-5 h-5 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <h4 className="font-semibold text-blue-900 dark:text-blue-100">Need Help?</h4>
                  </div>
                  <p className="text-blue-800 dark:text-blue-200 text-sm mb-3">
                    If you're having trouble accessing your results or need assistance with your academic records, please contact our examination department.
                  </p>
                  <div className="flex items-center justify-center space-x-2 text-blue-700 dark:text-blue-300">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                    <a 
                      href="mailto:contact.exam@gyanranjanpriyam.netlify.app" 
                      className="text-sm font-medium hover:underline"
                    >
                      contact.exam@gyanranjanpriyam.netlify.app
                    </a>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Notification Modal */}
      <AnimatePresence>
        {showNotificationModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white dark:bg-gray-800 rounded-2xl p-8 max-w-md w-full"
            >
              <div className="text-center">
                <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 ${
                  notificationMessage.includes('failed') || notificationMessage.includes('cancelled')
                    ? 'bg-red-100 dark:bg-red-900/30'
                    : notificationMessage.includes('pending')
                    ? 'bg-yellow-100 dark:bg-yellow-900/30'
                    : 'bg-green-100 dark:bg-green-900/30'
                }`}>
                  {notificationMessage.includes('failed') || notificationMessage.includes('cancelled') ? (
                    <AlertCircle className="w-8 h-8 text-red-600 dark:text-red-400" />
                  ) : notificationMessage.includes('pending') ? (
                    <Clock className="w-8 h-8 text-yellow-600 dark:text-yellow-400" />
                  ) : (
                    <CheckCircle className="w-8 h-8 text-green-600 dark:text-green-400" />
                  )}
                </div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                  {notificationMessage.includes('failed') || notificationMessage.includes('cancelled')
                    ? 'Payment Failed'
                    : notificationMessage.includes('pending')
                    ? 'Payment Submitted'
                    : 'Payment Status'}
                </h3>
                <p className="text-gray-600 dark:text-gray-300 mb-6">
                  {notificationMessage}
                </p>
                <button
                  onClick={() => setShowNotificationModal(false)}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
                >
                  OK
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default StudentDashboardNew;
