const resolveDefaultApiBaseUrl = () => {
  // Always prefer environment variable
  if (import.meta.env.VITE_API_BASE_URL) {
    const url = import.meta.env.VITE_API_BASE_URL;
    return url.endsWith('/v1') ? url : `${url}/v1`;
  }

  // For local development only (when running dev server)
  if (typeof window !== 'undefined' && import.meta.env.DEV) {
    const { hostname } = window.location;
    // Only use localhost for local development
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
      return `http://${hostname}:3000/v1`;
    }
  }

  // Production fallback - should never reach here if env vars are set correctly
  // Log warning in development
  if (import.meta.env.DEV) {
    console.warn(
      '⚠️ VITE_API_BASE_URL not set. Please set environment variable for production deployment.'
    );
  }

  // Throw error in production if env var is missing
  throw new Error(
    'VITE_API_BASE_URL environment variable is required. Please set it in your deployment configuration.'
  );
};

export const API_BASE_URL = resolveDefaultApiBaseUrl();

export const STORAGE_KEYS = {
  ACCESS_TOKEN: 'access_token',
  REFRESH_TOKEN: 'refresh_token',
  USER: 'user',
};
