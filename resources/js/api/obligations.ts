import api from './axios';

export type ObligationKind = 'obrigacoes_acessorias' | 'impostos_diretos' | 'impostos_indiretos' | 'outros';
export type ObligationFrequency = 'MM' | 'QT' | 'AA';

export interface Obligation {
  id: number;
  title: string;
  description?: string;
  kind: ObligationKind;
  frequency: ObligationFrequency;
  day_deadline: number;
  month_deadline?: number;
  period: number;
  group_id: number;
  generate_automatic_tasks: boolean;
  months_advanced: number;
  initial_generation_date?: string;
  final_generation_date?: string;
  last_competence?: string;
  show_dashboard: boolean;
  deleted: boolean;
  version: number;
  created_at?: string;
  updated_at?: string;
  // Computed
  frequency_label?: string;
  tasks_count?: number;
  companies_count?: number;
  companies?: Array<{ id: number; name: string }>;
}

export interface ObligationsResponse {
  obligations: Obligation[];
  total?: number;
}

export interface ObligationResponse {
  obligation: Obligation;
}

export interface ObligationFormData {
  title: string;
  kind: ObligationKind;
  description?: string;
  frequency: ObligationFrequency;
  day_deadline: number;
  month_deadline?: number;
  period: number;
  company_ids?: number[];
  generate_automatic_tasks: boolean;
  months_advanced?: number;
  initial_generation_date?: string;
  final_generation_date?: string;
  show_dashboard?: boolean;
}

export interface ObligationPreviewData {
  competency: string;
  deadline: string;
  formatted_deadline: string;
}

export interface GenerateTasksData {
  company_ids?: number[];
  competencies?: string[];
}

export const OBLIGATION_KINDS: Record<ObligationKind, string> = {
  obrigacoes_acessorias: 'Obrigacoes Acessorias',
  impostos_diretos: 'Impostos Diretos',
  impostos_indiretos: 'Impostos Indiretos',
  outros: 'Outros',
};

export const OBLIGATION_FREQUENCIES: Record<ObligationFrequency, string> = {
  MM: 'Mensal',
  QT: 'Trimestral',
  AA: 'Anual',
};

export const OBLIGATION_PERIODS: Record<number, string> = {
  0: 'Periodo Atual',
  1: '1 Periodo Depois',
  2: '2 Periodos Depois',
};

export const obligationsApi = {
  getAll: async (params?: { kind?: ObligationKind; frequency?: ObligationFrequency }): Promise<ObligationsResponse> => {
    const response = await api.get('/obligations', { params });
    return response.data;
  },

  get: async (id: number | string): Promise<ObligationResponse> => {
    const response = await api.get(`/obligations/${id}`);
    return response.data;
  },

  create: async (data: ObligationFormData): Promise<ObligationResponse> => {
    const response = await api.post('/obligations', data);
    return response.data;
  },

  update: async (id: number | string, data: Partial<ObligationFormData>): Promise<ObligationResponse> => {
    const response = await api.put(`/obligations/${id}`, data);
    return response.data;
  },

  delete: async (id: number | string): Promise<void> => {
    await api.delete(`/obligations/${id}`);
  },

  preview: async (data: Partial<ObligationFormData>): Promise<ObligationPreviewData> => {
    const response = await api.post('/obligations/preview', data);
    return response.data;
  },

  generateTasks: async (id: number | string, data?: GenerateTasksData): Promise<{ tasks_created: number }> => {
    const response = await api.post(`/obligations/${id}/generate-tasks`, data);
    return response.data;
  },

  getCompanies: async (id: number | string): Promise<{ companies: Array<{ id: number; name: string }> }> => {
    const response = await api.get(`/obligations/${id}/companies`);
    return response.data;
  },

  assignCompanies: async (id: number | string, company_ids: number[]): Promise<void> => {
    await api.post(`/obligations/${id}/companies`, { company_ids });
  },
};
