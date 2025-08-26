// API Configuration
// Environment validation
if (!import.meta.env.VITE_API_URL) {
  console.error('❌ VITE_API_URL environment variable is required');
  console.error('Please create a .env file based on .env.example');
}

const API_BASE_URL = import.meta.env.VITE_API_URL;

export const API_CONFIG = {
  baseURL: API_BASE_URL,
  timeout: 30000, // 30 seconds timeout for API calls
  headers: {
    'Content-Type': 'application/json',
  },
};

// Helper function to get full API URL
export const getApiUrl = (endpoint: string) => {
  // Remove leading slash if present to avoid double slashes
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint.slice(1) : endpoint;
  return `${API_CONFIG.baseURL}/${cleanEndpoint}`;
};

// Environment-specific configuration
export const ENV_CONFIG = {
  isDevelopment: import.meta.env.DEV,
  isProduction: import.meta.env.PROD,
  apiUrl: API_BASE_URL,
};

export default API_CONFIG;
