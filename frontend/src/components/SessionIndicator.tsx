import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Clock, Wifi } from 'lucide-react';

interface SessionIndicatorProps {
  getRemainingTime: () => number;
  isVisible?: boolean;
  darkMode?: boolean;
}

const SessionIndicator: React.FC<SessionIndicatorProps> = ({ 
  getRemainingTime, 
  isVisible = true,
  darkMode = false 
}) => {
  const [remainingTime, setRemainingTime] = useState(getRemainingTime());
  const [showIndicator, setShowIndicator] = useState(false);

  useEffect(() => {
    if (!isVisible) return;

    const updateTimer = setInterval(() => {
      const remaining = getRemainingTime();
      setRemainingTime(remaining);
      
      // Show indicator when less than 5 minutes remain
      setShowIndicator(remaining <= 5 * 60 * 1000 && remaining > 0);
    }, 1000);

    return () => clearInterval(updateTimer);
  }, [getRemainingTime, isVisible]);

  const formatTime = (ms: number) => {
    const hours = Math.floor(ms / 3600000);
    const minutes = Math.floor((ms % 3600000) / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const getStatusColor = () => {
    const minutes = remainingTime / 60000;
    if (minutes <= 5) return 'text-red-500';
    if (minutes <= 10) return 'text-yellow-500';
    return 'text-green-500';
  };

  const getBackgroundColor = () => {
    const minutes = remainingTime / 60000;
    if (darkMode) {
      if (minutes <= 5) return 'bg-red-500/10 border-red-500/20';
      if (minutes <= 10) return 'bg-yellow-500/10 border-yellow-500/20';
      return 'bg-green-500/10 border-green-500/20';
    } else {
      if (minutes <= 5) return 'bg-red-50 border-red-200';
      if (minutes <= 10) return 'bg-yellow-50 border-yellow-200';
      return 'bg-green-50 border-green-200';
    }
  };

  if (!isVisible || !showIndicator) return null;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      className={`inline-flex items-center space-x-2 px-3 py-2 rounded-lg border ${getBackgroundColor()} transition-all duration-300`}
    >
      <motion.div
        animate={{ 
          rotate: [0, 360],
          scale: [1, 1.1, 1]
        }}
        transition={{ 
          duration: 2, 
          repeat: Infinity,
          ease: "easeInOut"
        }}
      >
        <Clock className={`w-4 h-4 ${getStatusColor()}`} />
      </motion.div>
      
      <div className="flex flex-col">
        <span className={`text-xs font-medium ${getStatusColor()}`}>
          Session expires in
        </span>
        <span className={`text-sm font-mono font-bold ${getStatusColor()}`}>
          {formatTime(remainingTime)}
        </span>
      </div>
      
      <motion.div
        animate={{ opacity: [0.5, 1, 0.5] }}
        transition={{ duration: 1.5, repeat: Infinity }}
      >
        <Wifi className={`w-3 h-3 ${getStatusColor()}`} />
      </motion.div>
    </motion.div>
  );
};

export default SessionIndicator;
