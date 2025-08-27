import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import UnifiedLogin from '@/components/UnifiedLogin';
import SessionWarningModal from '@/components/SessionWarningModal';
import SessionTest from '@/components/SessionTest';
import { useSessionTimeout } from '@/hooks/useSessionTimeout';
import AdminDashboard from '@/pages/AdminDashboard';
import StudentDashboard from '@/pages/StudentDashboardNew';
import FinanceDashboard from '@/pages/FinanceDashboard';
import PaymentResult from '@/pages/PaymentResult';
import CustomPayment from '@/pages/CustomPayment';
import './App.css';

interface User {
  id: string;
  role: string;
  name: string;
  email?: string;
  regdNo?: string;
}

function App() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [showSessionWarning, setShowSessionWarning] = useState(false);
  const [isMobileBlocked, setIsMobileBlocked] = useState(false);

  // Session timeout configuration (10 minutes)
  const SESSION_TIMEOUT = 10 * 60 * 1000; // 10 minutes in milliseconds
  const WARNING_TIME = 2 * 60 * 1000;     // Show warning 2 minutes before timeout

  const handleSessionTimeout = () => {
    console.log('🚪 Session expired - logging out user');
    handleLogout();
    setShowSessionWarning(false);
    // Optionally show a toast notification
    alert('Your session has expired due to inactivity. Please log in again.');
  };

  const { resetTimeout, getRemainingTime } = useSessionTimeout({
    timeout: SESSION_TIMEOUT,
    warningTime: WARNING_TIME,
    onTimeout: handleSessionTimeout,
    isAuthenticated: !!user
  });

  console.log(`🔐 App component - User authenticated: ${!!user}, Session timeout: ${SESSION_TIMEOUT / 60000} minutes`);

  // Check for session warning
  useEffect(() => {
    if (!user) return;

    const checkWarning = setInterval(() => {
      const remaining = getRemainingTime();
      
      if (remaining <= WARNING_TIME && remaining > 0 && !showSessionWarning) {
        setShowSessionWarning(true);
      } else if (remaining <= 0) {
        setShowSessionWarning(false);
      }
    }, 10000); // Check every 10 seconds

    return () => clearInterval(checkWarning);
  }, [user, getRemainingTime, showSessionWarning]);

  const handleExtendSession = () => {
    resetTimeout();
    setShowSessionWarning(false);
  };

  useEffect(() => {
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');
    const checkMobile = () => {
      const ua = navigator.userAgent || navigator.vendor || (window as any).opera || '';
      const isUAForMobile = /android|iphone|ipad|ipod|iemobile|blackberry|opera mini|mobile/i.test(ua);
      const isSmallViewport = window.matchMedia('(max-width: 767px)').matches;
      setIsMobileBlocked(isUAForMobile || isSmallViewport);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    window.addEventListener('orientationchange', checkMobile);
    
    if (token && userData) {
      try {
        const parsedUser = JSON.parse(userData);
        setUser(parsedUser);
      } catch (error) {
        console.error('Error parsing user data:', error);
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      }
    }
    setLoading(false);
    return () => {
      window.removeEventListener('resize', checkMobile);
      window.removeEventListener('orientationchange', checkMobile);
    };
  }, []);

  const handleLogin = (userData: User, token: string) => {
    console.log('👤 User logging in, setting up session timeout');
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(userData));
    localStorage.setItem('lastActivity', Date.now().toString());
    setUser(userData);
    setShowSessionWarning(false);
    
    // Force session timeout initialization after login
    setTimeout(() => {
      console.log('🔄 Forcing session timeout reset after login');
      resetTimeout();
    }, 100);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('lastActivity');
    setUser(null);
    setShowSessionWarning(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Block mobile devices with a full-screen message
  if (isMobileBlocked) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-gray-900 text-white p-6 text-center">
        <div className="max-w-md">
          <h1 className="text-2xl font-semibold mb-4">Notice</h1>
          <p className="leading-relaxed">
            the website is not designed for mobile for better experience open it in desktop. Thank you for undersanding
          </p>
        </div>
      </div>
    );
  }

  return (
    <Router>
      <div className="App">
        <Routes>
          <Route 
            path="/" 
            element={
              user ? (
                user.role === 'student' ? (
                  <Navigate to={`/student-dashboard/${user.regdNo}`} replace />
                ) : user.role === 'head_admin' || user.role === 'admin' ? (
                  <Navigate to="/head-admin" replace />
                ) : user.role === 'finance_department' || user.role === 'finance_officer' ? (
                  <Navigate to="/finance-dashboard" replace />
                ) : user.role === 'faculty' ? (
                  <Navigate to="/faculty-dashboard" replace />
                ) : (
                  // Fallback for any other roles, maybe logout or show an error
                  <Navigate to="/" replace />
                )
              ) : (
                <UnifiedLogin onLogin={handleLogin} />
              )
            } 
          />
          
          {/* Session Test Route - for debugging */}
          <Route 
            path="/session-test" 
            element={
              user ? (
                <SessionTest 
                  getRemainingTime={getRemainingTime}
                  resetTimeout={resetTimeout}
                  onLogout={handleLogout}
                />
              ) : (
                <Navigate to="/" replace />
              )
            } 
          />
          
          <Route 
            path="/head-admin" 
            element={
              user?.role === 'head_admin' || user?.role === 'admin' ? (
                <AdminDashboard
                  user={user}
                  onLogout={handleLogout}
                />
              ) : (
                <Navigate to="/" replace />
              )
            } 
          />
          
          {/* Finance Department Route */}
          <Route 
            path="/finance-dashboard" 
            element={
              user?.role === 'finance_department' || user?.role === 'finance_officer' || user?.role === 'head_admin' || user?.role === 'admin' ? (
                <FinanceDashboard />
              ) : (
                <Navigate to="/" replace />
              )
            } 
          />
          
          {/* <Route 
            path="/finance-department" 
            element={
              user?.role === 'finance_department' || user?.role === 'finance_officer' || user?.role === 'head_admin' || user?.role === 'admin' ? (
                <FinanceDepartment user={user} onLogout={handleLogout} getRemainingTime={getRemainingTime} />
              ) : (
                <Navigate to="/" replace />
              )
            } 
          /> */}
          
          <Route 
            path="/faculty-dashboard" 
            element={
              <Navigate to="/" replace />
            } 
          />
          
          <Route 
            path="/student-dashboard" 
            element={
              user?.role === 'student' ? (
                <Navigate to={`/student-dashboard/${user.regdNo}`} replace />
              ) : (
                <Navigate to="/" replace />
              )
            } 
          />

          {/* Protected Student Dashboard with Registration Number */}
          <Route 
            path="/student-dashboard/:regdNo" 
            element={
              user?.role === 'student' ? (
                <StudentDashboard user={user} onLogout={handleLogout} getRemainingTime={getRemainingTime} />
              ) : (
                <Navigate to="/" replace />
              )
            } 
          />

          {/* Custom Payment Page - accessible to students */}
          <Route 
            path="/custom-payment" 
            element={
              user?.role === 'student' ? (
                <CustomPayment />
              ) : (
                <Navigate to="/" replace />
              )
            } 
          />
          
          {/* Redirect /admin to appropriate dashboard based on user role */}
          <Route 
            path="/admin" 
            element={
              user ? (
                user.role === 'head_admin' || user.role === 'admin' ? (
                  <Navigate to="/head-admin" replace />
                ) : user.role === 'finance_department' || user.role === 'finance_officer' ? (
                  <Navigate to="/finance-department" replace />
                ) : (
                  <Navigate to="/" replace />
                )
              ) : (
                <Navigate to="/" replace />
              )
            } 
          />
          
          {/* Payment Result Page - accessible to students */}
          <Route 
            path="/payment-result" 
            element={
              user?.role === 'student' ? (
                <PaymentResult />
              ) : (
                <Navigate to="/" replace />
              )
            } 
          />
          
          {/* Catch-all route - redirect to home */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>

      {/* Session Warning Modal */}
      <SessionWarningModal
        isOpen={showSessionWarning}
        remainingTime={showSessionWarning ? getRemainingTime() : 0}
        onExtendSession={handleExtendSession}
        onLogout={handleLogout}
      />
    </Router>
  );
}

export default App;
