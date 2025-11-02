const resolveDefaultApiBaseUrl = () => {
  // Check for explicit environment variable first
  if (import.meta.env.VITE_API_BASE_URL) {
    return import.meta.env.VITE_API_BASE_URL;
  }

  // In browser, check if we're on production
  if (typeof window !== 'undefined') {
    const { hostname } = window.location;
    // If not localhost, use the deployed backend
    if (hostname !== 'localhost' && hostname !== '127.0.0.1') {
      return 'https://hack2heal-1.onrender.com/v1';
    }
    // Local development
    return `http://${hostname}:3000/v1`;
  }

  // Default fallback
  return 'https://hack2heal-1.onrender.com/v1';
};

export const API_BASE_URL = resolveDefaultApiBaseUrl();

export const STORAGE_KEYS = {
  ACCESS_TOKEN: 'access_token',
  REFRESH_TOKEN: 'refresh_token',
  USER: 'user',
};
