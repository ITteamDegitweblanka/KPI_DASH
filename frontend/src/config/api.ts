// Base URL for API requests - points to the API root of your backend server
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api';

// API endpoints with paths relative to the base URL
export const API_ENDPOINTS = {
  AUTH: {
    LOGIN: '/auth/login',
    REFRESH: '/auth/refresh-token',
    ME: '/auth/me',
  },
  USERS: {
    BASE: '/users',
    PROFILE: (userId: string) => `/users/${userId}/profile`,
  },
  KPI: {
    BASE: '/kpis',
    TEAM: '/kpis/team',
    EMPLOYEE: (employeeId: string) => `/kpis/employee/${employeeId}`,
  },
};

// Axios configuration
export const apiConfig = {
  // Base URL for all requests
  baseURL: API_BASE_URL,
  
  // Send cookies with cross-origin requests
  withCredentials: true,
  
  // Request timeout in milliseconds
  timeout: 10000,
  
  // Default headers for all requests
  headers: {
    'Accept': 'application/json',
    'Content-Type': 'application/json', // Ensure JSON body is sent
    'X-Requested-With': 'XMLHttpRequest',
  },
  
  // CSRF protection
  xsrfCookieName: 'XSRF-TOKEN',
  xsrfHeaderName: 'X-XSRF-TOKEN',
  
  // Enable debug logging in development
  // This will log all requests and responses
  // You can remove this in production
  ...(process.env.NODE_ENV === 'development' && {
    // Enable request/response logging
    transformRequest: [
      function (data: any, headers: any) {
        console.log('Request:', { data, headers });
        return JSON.stringify(data);
      },
    ],
    transformResponse: [
      function (data: string) {
        try {
          const parsed = JSON.parse(data);
          console.log('Response:', parsed);
          return parsed;
        } catch (e) {
          console.error('Failed to parse response:', e);
          return data;
        }
      },
    ],
  }),
};
