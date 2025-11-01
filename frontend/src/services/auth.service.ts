import api from './api';
import { STORAGE_KEYS } from '../config/constants';

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  name: string;
  email: string;
  password: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  isEmailVerified: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface AuthResponse {
  user: User;
  tokens: {
    access: {
      token: string;
      expires: string;
    };
    refresh: {
      token: string;
      expires: string;
    };
  };
}

export const authService = {
  async login(credentials: LoginRequest): Promise<AuthResponse> {
    const response = await api.post<AuthResponse>('/auth/login', credentials);
    const { user, tokens } = response.data;
    
    // Store tokens and user in localStorage
    localStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, tokens.access.token);
    localStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, tokens.refresh.token);
    localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user));
    
    return response.data;
  },

  async register(userData: RegisterRequest): Promise<AuthResponse> {
    const response = await api.post<AuthResponse>('/auth/register', userData);
    const { user, tokens } = response.data;
    
    // Store tokens and user in localStorage
    localStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, tokens.access.token);
    localStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, tokens.refresh.token);
    localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user));
    
    return response.data;
  },

  async logout(): Promise<void> {
    const refreshToken = localStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN);
    if (refreshToken) {
      try {
        await api.post('/auth/logout', { refreshToken });
      } catch (error) {
        console.error('Logout error:', error);
      }
    }
    
    // Clear storage
    localStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN);
    localStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN);
    localStorage.removeItem(STORAGE_KEYS.USER);
  },

  getCurrentUser(): User | null {
    const userStr = localStorage.getItem(STORAGE_KEYS.USER);
    return userStr ? JSON.parse(userStr) : null;
  },

  getAccessToken(): string | null {
    return localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
  },

  isAuthenticated(): boolean {
    return !!this.getAccessToken();
  },
};

