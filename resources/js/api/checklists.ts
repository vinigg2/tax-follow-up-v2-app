import api from './axios';

export type ChecklistStatus = 'pendente' | 'em_andamento' | 'concluido' | 'cancelado' | 'bloqueado';

export interface ChecklistItem {
  id: number;
  task_id: number;
  title: string;
  description?: string;
  status: ChecklistStatus;
  order: number;
  created_at?: string;
  updated_at?: string;
}

export interface ChecklistsResponse {
  checklists: ChecklistItem[];
  total?: number;
}

export interface ChecklistResponse {
  checklist: ChecklistItem;
}

export interface ChecklistFormData {
  title: string;
  description?: string;
  status?: ChecklistStatus;
  order?: number;
}

export const CHECKLIST_STATUSES: Record<ChecklistStatus, { label: string; color: string }> = {
  pendente: {
    label: 'Pendente',
    color: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
  },
  em_andamento: {
    label: 'Em Andamento',
    color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  },
  concluido: {
    label: 'Concluido',
    color: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  },
  cancelado: {
    label: 'Cancelado',
    color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  },
  bloqueado: {
    label: 'Bloqueado',
    color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  },
};

export const checklistsApi = {
  getByTask: async (taskId: number | string): Promise<ChecklistsResponse> => {
    const response = await api.get(`/tasks/${taskId}/checklists`);
    return response.data;
  },

  create: async (taskId: number | string, data: ChecklistFormData): Promise<ChecklistResponse> => {
    const response = await api.post(`/tasks/${taskId}/checklists`, data);
    return response.data;
  },

  update: async (id: number | string, data: Partial<ChecklistFormData>): Promise<ChecklistResponse> => {
    const response = await api.put(`/checklists/${id}`, data);
    return response.data;
  },

  delete: async (id: number | string): Promise<void> => {
    await api.delete(`/checklists/${id}`);
  },

  updateStatus: async (id: number | string, status: ChecklistStatus): Promise<ChecklistResponse> => {
    const response = await api.patch(`/checklists/${id}/status`, { status });
    return response.data;
  },

  reorder: async (taskId: number | string, itemIds: number[]): Promise<void> => {
    await api.patch(`/tasks/${taskId}/checklists/reorder`, { item_ids: itemIds });
  },
};
