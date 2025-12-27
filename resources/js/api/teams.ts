import api from './axios';

export interface User {
  id: number;
  name: string;
  email: string;
  avatar?: string;
}

export interface Company {
  id: number;
  name: string;
  cnpj?: string;
  team_id?: number;
}

export interface Team {
  id: number;
  name: string;
  description?: string;
  members?: User[];
  companies?: Company[];
  members_count?: number;
  companies_count?: number;
  created_at?: string;
  updated_at?: string;
}

export interface TeamsResponse {
  teams: Team[];
  total?: number;
}

export interface TeamResponse {
  team: Team;
}

export interface TeamFormData {
  name: string;
  description?: string;
}

export const teamsApi = {
  getAll: async (): Promise<TeamsResponse> => {
    const response = await api.get('/teams');
    return response.data;
  },

  get: async (id: number | string): Promise<TeamResponse> => {
    const response = await api.get(`/teams/${id}`);
    return response.data;
  },

  create: async (data: TeamFormData): Promise<TeamResponse> => {
    const response = await api.post('/teams', data);
    return response.data;
  },

  update: async (id: number | string, data: TeamFormData): Promise<TeamResponse> => {
    const response = await api.put(`/teams/${id}`, data);
    return response.data;
  },

  delete: async (id: number | string): Promise<void> => {
    await api.delete(`/teams/${id}`);
  },

  // Members management
  getMembers: async (teamId: number | string): Promise<{ members: User[] }> => {
    const response = await api.get(`/teams/${teamId}/members`);
    return response.data;
  },

  addMember: async (teamId: number | string, userId: number): Promise<void> => {
    await api.post(`/teams/${teamId}/members`, { user_id: userId });
  },

  removeMember: async (teamId: number | string, userId: number): Promise<void> => {
    await api.delete(`/teams/${teamId}/members/${userId}`);
  },

  // Companies management
  getCompanies: async (teamId: number | string): Promise<{ companies: Company[] }> => {
    const response = await api.get(`/teams/${teamId}/companies`);
    return response.data;
  },

  linkCompany: async (teamId: number | string, companyId: number): Promise<void> => {
    await api.post(`/teams/${teamId}/companies`, { company_id: companyId });
  },

  unlinkCompany: async (teamId: number | string, companyId: number): Promise<void> => {
    await api.delete(`/teams/${teamId}/companies/${companyId}`);
  },

  // Get available users (not in any team or for selection)
  getAvailableUsers: async (): Promise<{ users: User[] }> => {
    const response = await api.get('/users/available');
    return response.data;
  },

  // Get available companies (not linked to any team)
  getAvailableCompanies: async (): Promise<{ companies: Company[] }> => {
    const response = await api.get('/companies/available');
    return response.data;
  },
};
