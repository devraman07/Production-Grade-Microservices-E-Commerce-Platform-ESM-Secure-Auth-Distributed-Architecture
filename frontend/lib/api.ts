import axios, { AxiosError, AxiosRequestConfig } from 'axios';
import axiosRetry from 'axios-retry';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

// Create axios instance with credentials for HTTP-only cookies
const api = axios.create({
  baseURL: `${API_URL}/api`,
  withCredentials: true, // CRITICAL: Sends cookies with requests
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000, // 30 second timeout
});

// Configure retry with exponential backoff
axiosRetry(api, {
  retries: 3,
  retryDelay: axiosRetry.exponentialDelay,
  retryCondition: (error: AxiosError) => {
    // Retry on network errors or 5xx responses
    return axiosRetry.isNetworkOrIdempotentRequestError(error) || 
           (error.response?.status ?? 0) >= 500;
  },
});

// Request interceptor - add request ID for tracing
api.interceptors.request.use(
  (config) => {
    // Generate request ID for debugging
    const requestId = Math.random().toString(36).substring(2, 15);
    config.headers['X-Request-ID'] = requestId;
    
    // Log in development
    if (process.env.NODE_ENV === 'development') {
      console.log(`[API Request] ${config.method?.toUpperCase()} ${config.url}`);
    }
    
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor with centralized error handling
api.interceptors.response.use(
  (response) => {
    // Log in development
    if (process.env.NODE_ENV === 'development') {
      console.log(`[API Response] ${response.config.url} - ${response.status}`);
    }
    return response;
  },
  (error: AxiosError) => {
    const status = error.response?.status;
    const message = (error.response?.data as any)?.message || error.message;
    
    switch (status) {
      case 401:
        // Token expired or invalid - redirect to login
        if (typeof window !== 'undefined') {
          // Don't redirect if already on login page
          if (!window.location.pathname.includes('/login')) {
            console.log('[Auth] Session expired, redirecting to login');
            window.location.href = '/login?redirect=' + encodeURIComponent(window.location.pathname);
          }
        }
        break;
        
      case 403:
        console.error('[API Error] Access forbidden:', message);
        break;
        
      case 404:
        console.error('[API Error] Resource not found:', message);
        break;
        
      case 422:
        console.error('[API Error] Validation failed:', message);
        break;
        
      case 429:
        console.error('[API Error] Rate limited:', message);
        break;
        
      case 500:
      case 502:
      case 503:
        console.error('[API Error] Server error:', message);
        break;
        
      default:
        if (!status) {
          console.error('[API Error] Network error:', message);
        } else {
          console.error('[API Error]', status, message);
        }
    }
    
    return Promise.reject(error);
  }
);

export default api;
