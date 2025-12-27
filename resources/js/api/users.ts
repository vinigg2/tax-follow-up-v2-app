import api from './axios';

export interface User {
  id: number;
  name: string;
  email: string;
  cpf?: string;
  phone?: string;
  avatar?: string;
  is_active?: boolean;
  team_id?: number;
  team?: {
    id: number;
    name: string;
  };
  created_at?: string;
  updated_at?: string;
}

export interface UsersResponse {
  users: User[];
  total?: number;
}

export interface UserResponse {
  user: User;
}

export interface UserFormData {
  name: string;
  email: string;
  cpf?: string;
  phone?: string;
  password?: string;
  password_confirmation?: string;
  is_active?: boolean;
  team_id?: number;
}

export const usersApi = {
  getAll: async (params?: { team_id?: number }): Promise<UsersResponse> => {
    const response = await api.get('/users', { params });
    return response.data;
  },

  get: async (id: number | string): Promise<UserResponse> => {
    const response = await api.get(`/users/${id}`);
    return response.data;
  },

  create: async (data: UserFormData): Promise<UserResponse> => {
    const response = await api.post('/users', data);
    return response.data;
  },

  update: async (id: number | string, data: Partial<UserFormData>): Promise<UserResponse> => {
    const response = await api.put(`/users/${id}`, data);
    return response.data;
  },

  delete: async (id: number | string): Promise<void> => {
    await api.delete(`/users/${id}`);
  },

  toggleActive: async (id: number | string): Promise<UserResponse> => {
    const response = await api.patch(`/users/${id}/toggle-active`);
    return response.data;
  },

  resetPassword: async (id: number | string, data: { password: string; password_confirmation: string }): Promise<void> => {
    await api.put(`/users/${id}/password`, data);
  },
};
