import api from './axios';
import {
  User,
  Group,
  Permissions,
  LoginCredentials,
  RegisterData,
} from '@/context/AuthContext';

interface AuthResponse {
  user: User;
  token: string;
  groups?: Group[];
  permissions?: Permissions;
}

interface UserResponse {
  user: User;
  groups?: Group[];
  permissions?: Permissions;
}

interface PasswordData {
  current_password: string;
  password: string;
  password_confirmation: string;
}

interface ResetPasswordData {
  token: string;
  email: string;
  password: string;
  password_confirmation: string;
}

export const authApi = {
  login: async (credentials: LoginCredentials): Promise<AuthResponse> => {
    const response = await api.post('/auth/login', credentials);
    return response.data;
  },

  register: async (data: RegisterData): Promise<AuthResponse> => {
    const response = await api.post('/auth/register', data);
    return response.data;
  },

  logout: async (): Promise<void> => {
    await api.post('/auth/logout');
  },

  getUser: async (): Promise<UserResponse> => {
    const response = await api.get('/auth/user');
    return response.data;
  },

  updateProfile: async (data: Partial<User>): Promise<{ user: User }> => {
    const response = await api.put('/auth/user', data);
    return response.data;
  },

  updatePassword: async (data: PasswordData): Promise<void> => {
    await api.put('/auth/user/password', data);
  },

  forgotPassword: async (email: string): Promise<void> => {
    await api.post('/auth/forgot-password', { email });
  },

  resetPassword: async (data: ResetPasswordData): Promise<void> => {
    await api.post('/auth/reset-password', data);
  },
};
