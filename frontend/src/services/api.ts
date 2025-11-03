import axios, { AxiosError, AxiosInstance, InternalAxiosRequestConfig } from 'axios';
import { API_BASE_URL, STORAGE_KEYS } from '../config/constants';

// Log API_BASE_URL in development to debug
if (import.meta.env.DEV) {
  console.log('API_BASE_URL:', API_BASE_URL);
}

// Ensure baseURL includes /v1
const baseURL = API_BASE_URL.endsWith('/v1') ? API_BASE_URL : `${API_BASE_URL}/v1`;

// Create axios instance
const api: AxiosInstance = axios.create({
  baseURL,
  timeout: 30000, // 30 seconds timeout
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    // Log full URL in development for debugging
    if (import.meta.env.DEV) {
      const fullUrl = config.baseURL && config.url 
        ? `${config.baseURL}${config.url.startsWith('/') ? config.url : `/${config.url}`}`
        : config.url;
      console.log('API Request:', config.method?.toUpperCase(), fullUrl);
    }
    
    return config;
  },
  (error: unknown) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle token refresh
api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    // If error is 401 and we haven't retried, try to refresh token
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = localStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN);
        if (refreshToken) {
          const response = await axios.post(`${API_BASE_URL}/auth/refresh-tokens`, {
            refreshToken,
          });

          const { access, refresh } = response.data;
          localStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, access.token);
          localStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, refresh.token);

          // Retry original request with new token
          if (originalRequest.headers) {
            originalRequest.headers.Authorization = `Bearer ${access.token}`;
          }
          return api(originalRequest);
        }
      } catch (refreshError) {
        // Refresh failed, clear storage and redirect to login
        try {
          localStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN);
          localStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN);
          localStorage.removeItem(STORAGE_KEYS.USER);
        } catch (storageError) {
          // Log storage error in development
          if (import.meta.env.DEV) {
            console.warn('[api] Error clearing storage:', storageError);
          }
        }
        
        // Use window.location.replace instead of href to prevent back button issues
        // Add try-catch for safety
        try {
          window.location.replace('/login');
        } catch (redirectError) {
          // Fallback: try href if replace fails
          if (import.meta.env.DEV) {
            console.warn('[api] Error with location.replace, trying href:', redirectError);
          }
          try {
            window.location.href = '/login';
          } catch (fallbackError) {
            // Last resort: reload page if redirect fails completely
            if (import.meta.env.DEV) {
              console.error('[api] All redirect methods failed:', fallbackError);
            }
            window.location.reload();
          }
        }
        
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export default api;

