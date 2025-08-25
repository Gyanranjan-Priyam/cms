import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Clock, LogOut, RotateCcw } from 'lucide-react';

interface SessionWarningModalProps {
  isOpen: boolean;
  remainingTime: number; // in milliseconds
  onExtendSession: () => void;
  onLogout: () => void;
}

const SessionWarningModal: React.FC<SessionWarningModalProps> = ({
  isOpen,
  remainingTime,
  onExtendSession,
  onLogout
}) => {
  const [timeLeft, setTimeLeft] = useState(remainingTime);

  useEffect(() => {
    if (isOpen) {
      setTimeLeft(remainingTime);
      
      const interval = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1000) {
            onLogout();
            return 0;
          }
          return prev - 1000;
        });
      }, 1000);

      return () => clearInterval(interval);
    }
  }, [isOpen, remainingTime, onLogout]);

  const formatTime = (ms: number) => {
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
            onClick={onLogout}
          />
          
          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="fixed inset-0 flex items-center justify-center z-50 p-4"
          >
            <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 border border-gray-200">
              {/* Header */}
              <div className="flex items-center justify-center mb-6">
                <motion.div
                  animate={{ 
                    rotate: [0, 10, -10, 0],
                    scale: [1, 1.1, 1]
                  }}
                  transition={{ 
                    duration: 2, 
                    repeat: Infinity,
                    ease: "easeInOut"
                  }}
                  className="p-3 bg-yellow-100 rounded-full"
                >
                  <Clock className="w-8 h-8 text-yellow-600" />
                </motion.div>
              </div>

              {/* Content */}
              <div className="text-center mb-6">
                <h3 className="text-xl font-bold text-gray-900 mb-2">
                  Session Expiring Soon
                </h3>
                <p className="text-gray-600 mb-4">
                  Your session will expire due to inactivity. Do you want to extend your session?
                </p>
                
                {/* Countdown Timer */}
                <motion.div
                  animate={{ scale: [1, 1.05, 1] }}
                  transition={{ duration: 1, repeat: Infinity }}
                  className="inline-flex items-center space-x-2 px-4 py-2 bg-red-50 border border-red-200 rounded-lg"
                >
                  <Clock className="w-5 h-5 text-red-500" />
                  <span className="text-lg font-mono font-bold text-red-600">
                    {formatTime(timeLeft)}
                  </span>
                </motion.div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-3">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={onExtendSession}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors duration-200"
                >
                  <RotateCcw className="w-4 h-4" />
                  Extend Session
                </motion.button>
                
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={onLogout}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-lg transition-colors duration-200"
                >
                  <LogOut className="w-4 h-4" />
                  Logout Now
                </motion.button>
              </div>

              {/* Auto-logout notice */}
              <p className="text-xs text-gray-500 text-center mt-4">
                You will be automatically logged out when the timer reaches zero
              </p>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default SessionWarningModal;
