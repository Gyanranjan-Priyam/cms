import { useEffect, useRef, useCallback } from 'react';

interface UseSessionTimeoutProps {
  timeout?: number; // timeout in milliseconds (default: 10 minutes)
  warningTime?: number; // warning time in milliseconds (default: 2 minutes)
  onTimeout: () => void;
  isAuthenticated: boolean;
}

export const useSessionTimeout = ({ 
  timeout = 10 * 60 * 1000, // 10 minutes default
  warningTime = 2 * 60 * 1000, // 2 minutes default
  onTimeout, 
  isAuthenticated 
}: UseSessionTimeoutProps) => {
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const warningTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastActivityRef = useRef<number>(Date.now());

  const resetTimeout = useCallback(() => {
    if (!isAuthenticated) return;

    console.log('🔄 Resetting session timeout - User activity detected');

    // Clear existing timeouts
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    if (warningTimeoutRef.current) {
      clearTimeout(warningTimeoutRef.current);
    }

    // Update last activity time
    lastActivityRef.current = Date.now();
    localStorage.setItem('lastActivity', lastActivityRef.current.toString());

    // Set warning timeout (configurable time before logout)
    const warningTimeout = timeout - warningTime;
    console.log(`⚠️  Setting warning timeout for ${warningTimeout / 1000} seconds (${warningTimeout / 60000} minutes)`);
    
    if (warningTimeout > 0) {
      warningTimeoutRef.current = setTimeout(() => {
        console.log('⚠️  SESSION WARNING: Showing session expiry warning');
        
        // Show warning notification
        if ('Notification' in window && Notification.permission === 'granted') {
          new Notification('Session Warning', {
            body: `Your session will expire in ${Math.ceil(warningTime / 60000)} minutes due to inactivity.`,
            icon: '/favicon.ico'
          });
        }
        
        // You can also show an in-app warning modal here
        console.warn(`Session will expire in ${Math.ceil(warningTime / 60000)} minutes`);
      }, warningTimeout);
    }

    // Set logout timeout
    console.log(`⏰ Setting logout timeout for ${timeout / 1000} seconds (${timeout / 60000} minutes)`);
    timeoutRef.current = setTimeout(() => {
      console.log('🚪 SESSION EXPIRED: Logging out user due to inactivity');
      onTimeout();
    }, timeout);
  }, [timeout, warningTime, onTimeout, isAuthenticated]);

  const handleActivity = useCallback(() => {
    if (isAuthenticated) {
      console.log('👆 User activity detected, resetting session timer');
      resetTimeout();
    }
  }, [resetTimeout, isAuthenticated]);

  useEffect(() => {
    console.log(`🔐 Session timeout effect triggered. Authenticated: ${isAuthenticated}`);
    
    if (!isAuthenticated) {
      console.log('🚫 User not authenticated, clearing session timeouts');
      // Clear timeouts when user is not authenticated
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      if (warningTimeoutRef.current) {
        clearTimeout(warningTimeoutRef.current);
      }
      return;
    }

    console.log('✅ User authenticated, setting up session timeout');

    // Check if there's a stored last activity time
    const storedLastActivity = localStorage.getItem('lastActivity');
    if (storedLastActivity) {
      const lastActivity = parseInt(storedLastActivity);
      const timeSinceLastActivity = Date.now() - lastActivity;
      
      console.log(`📊 Time since last activity: ${timeSinceLastActivity / 1000} seconds`);
      
      if (timeSinceLastActivity >= timeout) {
        console.log('⏰ Session already expired based on stored activity');
        // Session has already expired
        onTimeout();
        return;
      }
      
      // Adjust timeout based on remaining time
      const remainingTime = timeout - timeSinceLastActivity;
      console.log(`⏳ Remaining session time: ${remainingTime / 1000} seconds`);
      
      if (remainingTime > 0) {
        timeoutRef.current = setTimeout(() => {
          console.log('⏰ Session expired - timeout from stored activity');
          onTimeout();
        }, remainingTime);
      }
    } else {
      console.log('🆕 No stored activity found, starting fresh session timeout');
      // No stored activity, start fresh
      resetTimeout();
    }

    console.log('👂 Setting up activity event listeners');
    
    // Activity event listeners
    const events = [
      'mousedown',
      'mousemove', 
      'keypress',
      'scroll',
      'touchstart',
      'click'
    ];

    // Throttle activity detection to avoid excessive resets
    let throttleTimer: NodeJS.Timeout | null = null;
    const throttledHandleActivity = () => {
      if (throttleTimer) return;
      
      throttleTimer = setTimeout(() => {
        handleActivity();
        throttleTimer = null;
      }, 1000); // Throttle to once per second
    };

    events.forEach((event) => {
      document.addEventListener(event, throttledHandleActivity, true);
    });
    
    console.log(`📝 Added event listeners for: ${events.join(', ')}`);

    // Handle tab visibility change
    const handleVisibilityChange = () => {
      console.log(`👁️  Tab visibility changed: ${document.visibilityState}`);
      if (document.visibilityState === 'visible') {
        // Check if session expired while tab was hidden
        const storedLastActivity = localStorage.getItem('lastActivity');
        if (storedLastActivity) {
          const lastActivity = parseInt(storedLastActivity);
          const timeSinceLastActivity = Date.now() - lastActivity;
          
          if (timeSinceLastActivity >= timeout) {
            onTimeout();
            return;
          }
        }
        handleActivity();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      // Cleanup
      events.forEach((event) => {
        document.removeEventListener(event, throttledHandleActivity, true);
      });
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      if (warningTimeoutRef.current) {
        clearTimeout(warningTimeoutRef.current);
      }
      if (throttleTimer) {
        clearTimeout(throttleTimer);
      }
    };
  }, [isAuthenticated, handleActivity, onTimeout, resetTimeout, timeout]);

  return {
    resetTimeout,
    getRemainingTime: () => {
      const lastActivity = parseInt(localStorage.getItem('lastActivity') || '0');
      const elapsed = Date.now() - lastActivity;
      return Math.max(0, timeout - elapsed);
    }
  };
};
