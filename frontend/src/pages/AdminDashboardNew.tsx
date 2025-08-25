import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Users, 
  Building, 
  LogOut,
  BarChart3,
  Moon,
  Sun,
  Activity,
  RefreshCw,
  Settings,
  CreditCard,
  UserCog,
  GraduationCap,
  User
} from 'lucide-react';
import axios from 'axios';
import { SidebarProvider, Sidebar, SidebarBody } from '../components/ui/sidebar';
import SessionIndicator from '../components/SessionIndicator';
import FacultyManagement from './FacultyManagement';
import CollegeManagement from './CollegeManagement';

interface AdminDashboardProps {
  user: any;
  onLogout: () => void;
  getRemainingTime?: () => number;
}

const AdminDashboardNew: React.FC<AdminDashboardProps> = ({ user, onLogout, getRemainingTime }) => {
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [darkMode, setDarkMode] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [open, setOpen] = useState(false);
  const [activePage, setActivePage] = useState('dashboard');

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setRefreshing(true);
      const token = localStorage.getItem('token');
      
      // Fetch dashboard stats
      const dashboardResponse = await axios.get('http://localhost:5000/api/dashboard/head-admin', {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      // Fetch admin users
      const adminResponse = await axios.get('http://localhost:5000/api/auth/users', {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      // Fetch faculty stats
      const facultyResponse = await axios.get('http://localhost:5000/api/admin/overview', {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (dashboardResponse.data.success) {
        const combinedData = {
          ...dashboardResponse.data.dashboard,
          adminUsers: adminResponse.data.users || [],
          facultyStats: facultyResponse.data.success ? facultyResponse.data : null
        };
        setDashboardData(combinedData);
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
  };

  // Sidebar navigation links
  const links = [
    {
      label: "Dashboard",
      to: "dashboard",
      icon: (
        <BarChart3 className="text-neutral-700 dark:text-neutral-200 h-5 w-5 flex-shrink-0" />
      ),
    },
    {
      label: "Faculty Management",
      to: "faculty",
      icon: (
        <GraduationCap className="text-neutral-700 dark:text-neutral-200 h-5 w-5 flex-shrink-0" />
      ),
    },
    {
      label: "College Management",
      to: "college",
      icon: (
        <UserCog className="text-neutral-700 dark:text-neutral-200 h-5 w-5 flex-shrink-0" />
      ),
    },
    {
      label: "Payments",
      to: "payments",
      icon: (
        <CreditCard className="text-neutral-700 dark:text-neutral-200 h-5 w-5 flex-shrink-0" />
      ),
    },
    {
      label: "Branches",
      to: "branches",
      icon: (
        <Building className="text-neutral-700 dark:text-neutral-200 h-5 w-5 flex-shrink-0" />
      ),
    },
    {
      label: "Settings",
      to: "settings",
      icon: (
        <Settings className="text-neutral-700 dark:text-neutral-200 h-5 w-5 flex-shrink-0" />
      ),
    },
  ];

  if (loading) {
    return (
      <div className={`min-h-screen ${darkMode ? 'bg-gray-900' : 'bg-gray-50'} flex items-center justify-center overflow-hidden`}>
        {/* Animated background */}
        <div className="absolute inset-0">
          <motion.div
            animate={{
              scale: [1, 1.2, 1],
              rotate: [0, 180, 360],
              opacity: [0.3, 0.6, 0.3]
            }}
            transition={{
              duration: 8,
              repeat: Infinity,
              ease: "easeInOut"
            }}
            className={`absolute top-1/4 left-1/4 w-96 h-96 rounded-full ${
              darkMode ? 'bg-purple-500/20' : 'bg-purple-200/30'
            } blur-3xl`}
          />
          <motion.div
            animate={{
              scale: [1.2, 1, 1.2],
              rotate: [360, 180, 0],
              opacity: [0.4, 0.8, 0.4]
            }}
            transition={{
              duration: 10,
              repeat: Infinity,
              ease: "easeInOut"
            }}
            className={`absolute bottom-1/4 right-1/4 w-80 h-80 rounded-full ${
              darkMode ? 'bg-blue-500/20' : 'bg-blue-200/30'
            } blur-3xl`}
          />
        </div>

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
            className={`${darkMode ? 'text-gray-300' : 'text-gray-600'} text-xl font-medium`}
          >
            Loading Dashboard
          </motion.p>
        </motion.div>
      </div>
    );
  }

  // Remove unused destructuring
  // const { overview, branchStats, revenueByType, recentActivities } = dashboardData || {};

  return (
    <div className={darkMode ? 'dark' : ''}>
      <SidebarProvider>
        <div className="flex flex-row bg-gray-100 dark:bg-neutral-800 w-full h-screen overflow-hidden">
          <Sidebar open={open} setOpen={setOpen}>
            <SidebarBody className="justify-between gap-10">
              <div className="flex flex-col flex-1 overflow-y-auto overflow-x-hidden">
                {open ? <Logo /> : <LogoIcon />}
                <div className="mt-8 flex flex-col gap-2">
                  {links.map((link, idx) => (
                    <div
                      key={idx}
                      onClick={() => setActivePage(link.to)}
                      className={`flex items-center gap-2 p-2 rounded-lg cursor-pointer transition-colors ${
                        activePage === link.to 
                          ? 'bg-blue-500 text-white' 
                          : 'hover:bg-gray-200 dark:hover:bg-gray-700 text-neutral-700 dark:text-neutral-200'
                      }`}
                    >
                      {link.icon}
                      {open && (
                        <span className="text-sm font-medium">
                          {link.label}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <div
                  className="flex items-center gap-2 p-2 rounded-lg cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-700 text-neutral-700 dark:text-neutral-200"
                >
                  <div className="h-7 w-7 flex-shrink-0 rounded-full bg-blue-500 flex items-center justify-center">
                    <User className="h-4 w-4 text-white" />
                  </div>
                  {open && (
                    <span className="text-sm font-medium text-neutral-700 dark:text-neutral-200">
                      {user?.username || "Admin"}
                    </span>
                  )}
                </div>
              </div>
            </SidebarBody>
          </Sidebar>
          
          {/* Main Content */}
          <Dashboard 
            user={user} 
            onLogout={onLogout} 
            getRemainingTime={getRemainingTime}
            dashboardData={dashboardData}
            darkMode={darkMode}
            toggleDarkMode={toggleDarkMode}
            refreshing={refreshing}
            fetchDashboardData={fetchDashboardData}
            activePage={activePage}
          />
        </div>
      </SidebarProvider>
    </div>
  );
};

// Logo component
export const Logo = () => {
  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="font-normal flex space-x-2 items-center text-sm text-black py-1 relative z-20"
    >
      <div className="h-5 w-6 bg-black dark:bg-white rounded-br-lg rounded-tr-sm rounded-tl-lg rounded-bl-sm flex-shrink-0" />
      <motion.span 
        initial={{ width: 0 }}
        animate={{ width: "auto" }}
        className="font-medium text-black dark:text-white whitespace-pre"
      >
        CMS Admin
      </motion.span>
    </motion.div>
  );
};

export const LogoIcon = () => {
  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="font-normal flex space-x-2 items-center text-sm text-black py-1 relative z-20"
    >
      <div className="h-5 w-6 bg-black dark:bg-white rounded-br-lg rounded-tr-sm rounded-tl-lg rounded-bl-sm flex-shrink-0" />
    </motion.div>
  );
};

// Dashboard content component
const Dashboard = ({ 
  user, 
  onLogout, 
  getRemainingTime, 
  dashboardData, 
  darkMode, 
  toggleDarkMode, 
  refreshing, 
  fetchDashboardData,
  activePage 
}: any) => {
  const { overview } = dashboardData || {};

  const renderContent = () => {
    switch (activePage) {
      case 'faculty':
        return <FacultyManagement darkMode={darkMode} />;
      case 'college':
        return <CollegeManagement darkMode={darkMode} />;
      case 'payments':
        return (
          <div className="p-6">
            <h1 className="text-2xl font-bold">Payment Management</h1>
            <p className="text-gray-500 mt-2">Payment management features coming soon...</p>
          </div>
        );
      case 'branches':
        return (
          <div className="p-6">
            <h1 className="text-2xl font-bold">Branch Management</h1>
            <p className="text-gray-500 mt-2">Branch management features coming soon...</p>
          </div>
        );
      case 'settings':
        return (
          <div className="p-6">
            <h1 className="text-2xl font-bold">Settings</h1>
            <p className="text-gray-500 mt-2">Settings features coming soon...</p>
          </div>
        );
      default:
        return renderDashboard();
    }
  };

  const renderDashboard = () => (
    <>
      {/* Content */}
      <div className="flex-1 overflow-auto bg-neutral-50 dark:bg-neutral-900 p-6">
        {/* Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {[
            {
              icon: Users,
              label: "Total Admins",
              value: dashboardData?.adminUsers?.length || 0,
              change: "+2%",
              color: "from-blue-500 to-cyan-500"
            },
            {
              icon: GraduationCap,
              label: "Total Faculty",
              value: dashboardData?.facultyStats?.totalFaculty || 0,
              change: "+5%",
              color: "from-green-500 to-emerald-500"
            },
            {
              icon: Building,
              label: "Active Branches",
              value: overview?.totalBranches || 0,
              change: "+2%",
              color: "from-purple-500 to-violet-500"
            },
            {
              icon: Activity,
              label: "Pending Payments",
              value: overview?.pendingPayments || 0,
              change: "-5%",
              color: "from-orange-500 to-red-500"
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

        {/* Charts and Activities */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Admin Information */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-white dark:bg-neutral-800 rounded-2xl p-6 shadow-lg border border-neutral-200 dark:border-neutral-700"
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
                Admin Users
              </h3>
              <Users className="w-5 h-5 text-neutral-500" />
            </div>
            
            <div className="space-y-4">
              {Array.isArray(dashboardData?.adminUsers) && dashboardData.adminUsers.length > 0 ? (
                dashboardData.adminUsers.slice(0, 5).map((admin: any, index: number) => (
                  <div key={admin._id || index} className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white text-sm font-medium">
                        {admin.username ? admin.username[0].toUpperCase() : 'A'}
                      </div>
                      <div>
                        <span className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
                          {admin.username || 'Unknown Admin'}
                        </span>
                        <p className="text-xs text-neutral-500">{admin.email || 'No email'}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800">
                        {admin.role || 'Admin'}
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center text-gray-500 py-4">
                  <p>No admin users available</p>
                </div>
              )}
            </div>
          </motion.div>

          {/* Recent Activities */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.5 }}
            className="bg-white dark:bg-neutral-800 rounded-2xl p-6 shadow-lg border border-neutral-200 dark:border-neutral-700"
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
                Recent Faculty Activities
              </h3>
              <Activity className="w-5 h-5 text-neutral-500" />
            </div>
            
            <div className="space-y-4">
              {Array.isArray(dashboardData?.facultyUsers) && dashboardData.facultyUsers.length > 0 ? (
                dashboardData.facultyUsers.slice(0, 5).map((faculty: any, index: number) => (
                  <motion.div
                    key={faculty._id || index}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.6 + index * 0.1 }}
                    className="flex items-start space-x-3 p-3 rounded-xl bg-neutral-50 dark:bg-neutral-700/50"
                  >
                    <div className="w-8 h-8 bg-gradient-to-r from-green-500 to-blue-500 rounded-full flex items-center justify-center text-white text-xs font-medium">
                      {faculty.name ? faculty.name[0].toUpperCase() : 'F'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-neutral-900 dark:text-neutral-100">
                        {faculty.name || 'Unknown Faculty'}
                      </p>
                      <p className="text-xs text-neutral-500 mt-1">
                        {faculty.department || 'No department'} • {faculty.position || 'Faculty'} 
                        {faculty.experience && ` • ${faculty.experience} years exp`}
                      </p>
                    </div>
                  </motion.div>
                ))
              ) : (
                <div className="text-center text-gray-500 py-4">
                  <p>No faculty information available</p>
                </div>
              )}
            </div>
          </motion.div>
        </div>
      </div>
    </>
  );

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
            <div>
              <h1 className="text-2xl font-bold text-neutral-800 dark:text-neutral-200">
                {activePage === 'dashboard' ? 'Head Admin Dashboard' : 
                 activePage === 'faculty' ? 'Faculty Management' :
                 activePage === 'college' ? 'College Management' :
                 activePage.charAt(0).toUpperCase() + activePage.slice(1)}
              </h1>
              <p className="text-sm text-neutral-600 dark:text-neutral-400">
                Welcome back, <span className="font-medium text-purple-500">{user?.username}</span>
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            {/* Refresh Button */}
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={fetchDashboardData}
              disabled={refreshing}
              className="p-3 rounded-xl bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-all duration-300 disabled:opacity-50"
            >
              <motion.div
                animate={refreshing ? { rotate: 360 } : {}}
                transition={refreshing ? { duration: 1, repeat: Infinity, ease: "linear" } : {}}
              >
                <RefreshCw className="w-5 h-5" />
              </motion.div>
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

      {/* Page Content */}
      {renderContent()}
    </div>
  );
};

export default AdminDashboardNew;
