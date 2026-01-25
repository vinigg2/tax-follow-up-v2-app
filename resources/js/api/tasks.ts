import api from './axios';
import { Document } from './documents';

export interface Task {
  id: number | string;
  title: string;
  task_hierarchy_title?: string;
  description?: string;
  status: string;
  days_until?: number;
  deadline?: string;
  formatted_deadline?: string;
  percent?: number;
  competency?: string;
  responsible_name?: string;
  company?: {
    id: number;
    name: string;
  };
  responsible_user?: {
    id: number;
    name: string;
  };
  documents?: Document[];
}

// Legacy interface for backwards compatibility
export interface TaskDocument {
  id: number;
  name: string;
  status: string;
  is_obligatory: boolean;
}

export interface TimelineEntry {
  id: number;
  type: string;
  description?: string;
  user_name?: string;
  created_at: string;
}

export interface TasksResponse {
  tasks: Task[];
}

export interface TaskResponse {
  task: Task;
}

export interface TimelineResponse {
  timeline: TimelineEntry[];
}

export interface TaskUpdateData {
  status?: string;
  [key: string]: unknown;
}

export interface TaskCreateData {
  title: string;
  description?: string;
  company_id: number;
  group_id: number;
  obligation_id?: number;
  responsible_user_id?: number;
  deadline: string;
  competency?: string;
}

export interface TimelineEntryData {
  type: string;
  description?: string;
}

export const tasksApi = {
  getAll: async (params: Record<string, unknown> = {}): Promise<TasksResponse> => {
    const response = await api.get('/tasks', { params });
    return response.data;
  },

  create: async (data: TaskCreateData): Promise<TaskResponse> => {
    const response = await api.post('/tasks', data);
    return response.data;
  },

  getByMethod: async (
    method: string,
    params: Record<string, unknown> = {}
  ): Promise<TasksResponse> => {
    const response = await api.get(`/tasks/method/${method}`, { params });
    return response.data;
  },

  get: async (id: number | string): Promise<TaskResponse> => {
    const response = await api.get(`/tasks/${id}`);
    return response.data;
  },

  update: async (
    id: number | string,
    data: TaskUpdateData
  ): Promise<TaskResponse> => {
    const response = await api.put(`/tasks/${id}`, data);
    return response.data;
  },

  correct: async (
    id: number | string,
    deadline: string
  ): Promise<TaskResponse> => {
    const response = await api.post(`/tasks/${id}/correct`, { deadline });
    return response.data;
  },

  archive: async (id: number | string): Promise<TaskResponse> => {
    const response = await api.post(`/tasks/${id}/archive`);
    return response.data;
  },

  unarchive: async (id: number | string): Promise<TaskResponse> => {
    const response = await api.post(`/tasks/${id}/unarchive`);
    return response.data;
  },

  getTimeline: async (id: number | string): Promise<TimelineResponse> => {
    const response = await api.get(`/tasks/${id}/timeline`);
    return response.data;
  },

  addTimelineEntry: async (
    id: number | string,
    data: TimelineEntryData
  ): Promise<TimelineEntry> => {
    const response = await api.post(`/tasks/${id}/timeline`, data);
    return response.data;
  },
};
