import api from './axios';

export interface Company {
  id: number;
  name: string;
  cnpj?: string;
  email?: string;
  phone?: string;
  address?: string;
  team_id?: number;
  team?: {
    id: number;
    name: string;
  };
  tasks_count?: number;
  created_at?: string;
  updated_at?: string;
}

export interface CompaniesResponse {
  companies: Company[];
  total?: number;
}

export interface CompanyResponse {
  company: Company;
}

export interface CompanyFormData {
  name: string;
  cnpj?: string;
  email?: string;
  phone?: string;
  address?: string;
  team_id?: number;
}

export const companiesApi = {
  getAll: async (params?: { team_id?: number }): Promise<CompaniesResponse> => {
    const response = await api.get('/companies', { params });
    return response.data;
  },

  get: async (id: number | string): Promise<CompanyResponse> => {
    const response = await api.get(`/companies/${id}`);
    return response.data;
  },

  create: async (data: CompanyFormData): Promise<CompanyResponse> => {
    const response = await api.post('/companies', data);
    return response.data;
  },

  update: async (id: number | string, data: CompanyFormData): Promise<CompanyResponse> => {
    const response = await api.put(`/companies/${id}`, data);
    return response.data;
  },

  delete: async (id: number | string): Promise<void> => {
    await api.delete(`/companies/${id}`);
  },
};
