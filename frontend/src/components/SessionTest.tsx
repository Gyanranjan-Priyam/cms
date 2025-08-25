import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

interface SessionTestProps {
  getRemainingTime: () => number;
  resetTimeout: () => void;
  onLogout: () => void;
}

const SessionTest: React.FC<SessionTestProps> = ({ 
  getRemainingTime, 
  resetTimeout, 
  onLogout 
}) => {
  const [remainingTime, setRemainingTime] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      const remaining = getRemainingTime();
      setRemainingTime(remaining);
      console.log(`⏱️  Session Test - Remaining time: ${Math.floor(remaining / 1000)} seconds`);
    }, 1000);

    return () => clearInterval(interval);
  }, [getRemainingTime]);

  const formatTime = (ms: number) => {
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const handleManualTimeout = () => {
    console.log('🧪 Manual session timeout triggered');
    onLogout();
  };

  const handleExtendSession = () => {
    console.log('🔄 Manual session extension triggered');
    resetTimeout();
  };

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-2xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-lg shadow-lg p-8"
        >
          <h1 className="text-2xl font-bold text-gray-900 mb-6">
            Session Timeout Test Dashboard
          </h1>

          <div className="space-y-6">
            {/* Session Timer Display */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-blue-900 mb-2">
                Session Status
              </h3>
              <div className="text-3xl font-mono font-bold text-blue-600">
                {formatTime(remainingTime)}
              </div>
              <p className="text-sm text-blue-700 mt-1">
                Time remaining until automatic logout
              </p>
            </div>

            {/* Manual Controls */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleExtendSession}
                className="bg-green-600 hover:bg-green-700 text-white font-medium px-6 py-3 rounded-lg transition-colors"
              >
                Extend Session (Reset Timer)
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleManualTimeout}
                className="bg-red-600 hover:bg-red-700 text-white font-medium px-6 py-3 rounded-lg transition-colors"
              >
                Force Logout (Test)
              </motion.button>
            </div>

            {/* Activity Instructions */}
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-yellow-900 mb-2">
                Activity Test
              </h3>
              <p className="text-yellow-800">
                Move your mouse, click, scroll, or type to reset the session timer.
                The timer should reset automatically when you interact with the page.
              </p>
            </div>

            {/* Session Info */}
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Configuration
              </h3>
              <ul className="text-sm text-gray-700 space-y-1">
                <li>• Session Timeout: 10 minutes</li>
                <li>• Warning Time: 2 minutes before logout</li>
                <li>• Activity Detection: Mouse, keyboard, scroll, touch</li>
                <li>• Auto-refresh: Every second</li>
              </ul>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default SessionTest;
