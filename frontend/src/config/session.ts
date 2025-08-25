// Session management configuration
export const SESSION_CONFIG = {
  // Session timeout in milliseconds (default: 10 minutes)
  TIMEOUT: 10 * 60 * 1000,
  
  // Warning time before session expires (default: 2 minutes)
  WARNING_TIME: 2 * 60 * 1000,
  
  // Activity check interval (default: 10 seconds)
  CHECK_INTERVAL: 10 * 1000,
  
  // Activity throttle interval (default: 1 second)
  ACTIVITY_THROTTLE: 1000,
  
  // Session indicator visibility threshold (default: 5 minutes)
  INDICATOR_THRESHOLD: 5 * 60 * 1000,
  
  // Events that reset the session timer
  ACTIVITY_EVENTS: [
    'mousedown',
    'mousemove', 
    'keypress',
    'scroll',
    'touchstart',
    'click'
  ]
};

// You can override these values by setting environment variables:
// VITE_SESSION_TIMEOUT - Session timeout in minutes
// VITE_SESSION_WARNING - Warning time in minutes

if (import.meta.env.VITE_SESSION_TIMEOUT) {
  SESSION_CONFIG.TIMEOUT = parseInt(import.meta.env.VITE_SESSION_TIMEOUT) * 60 * 1000;
}

if (import.meta.env.VITE_SESSION_WARNING) {
  SESSION_CONFIG.WARNING_TIME = parseInt(import.meta.env.VITE_SESSION_WARNING) * 60 * 1000;
}
