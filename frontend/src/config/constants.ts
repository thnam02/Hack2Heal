const resolveDefaultApiBaseUrl = () => {
  // Check for explicit environment variable first
  if (import.meta.env.VITE_API_BASE_URL) {
    const url = import.meta.env.VITE_API_BASE_URL;
    return url.endsWith('/v1') ? url : `${url}/v1`;
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

  // Default fallback - ensure /v1 is included
  return 'https://hack2heal-1.onrender.com/v1';
};

export const API_BASE_URL = resolveDefaultApiBaseUrl();

export const STORAGE_KEYS = {
  ACCESS_TOKEN: 'access_token',
  REFRESH_TOKEN: 'refresh_token',
  USER: 'user',
};
