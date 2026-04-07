import api from './api';
import { User } from '@/types';

interface AuthResponse {
  success: boolean;
  message: string;
  data: {
    user: User;
  };
}

interface LoginCredentials {
  email: string;
  password: string;
}

interface RegisterCredentials extends LoginCredentials {
  name: string;
}

/**
 * Login user - backend sets HTTP-only cookie
 */
export const login = async (credentials: LoginCredentials): Promise<User> => {
  const { data } = await api.post<AuthResponse>('/auth/login', credentials);
  return data.data.user;
};

/**
 * Register new user - backend sets HTTP-only cookie
 */
export const register = async (credentials: RegisterCredentials): Promise<User> => {
  const { data } = await api.post<AuthResponse>('/auth/register', credentials);
  return data.data.user;
};

/**
 * Check if user is authenticated (used on app load)
 */
export const checkAuth = async (): Promise<User | null> => {
  try {
    const { data } = await api.get<AuthResponse>('/auth/check-auth');
    return data.data.user;
  } catch (error) {
    return null;
  }
};

/**
 * Refresh token before expiry
 */
export const refreshToken = async (): Promise<User> => {
  const { data } = await api.post<AuthResponse>('/auth/refresh');
  return data.data.user;
};

/**
 * Logout - clears HTTP-only cookie on backend
 */
export const logout = async (): Promise<void> => {
  await api.post('/auth/logout');
};

/**
 * Get user profile
 */
export const getProfile = async (): Promise<User> => {
  const { data } = await api.get<AuthResponse>('/auth/profile');
  return data.data.user;
};
