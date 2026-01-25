import api from './axios';

export type NotificationType =
  | 'task_due'
  | 'task_late'
  | 'task_completed'
  | 'document_uploaded'
  | 'document_approved'
  | 'document_rejected'
  | 'approval_pending'
  | 'system';

export interface Notification {
  id: string;
  type: string;
  notifiable_type: string;
  notifiable_id: number;
  data: {
    type: NotificationType;
    title: string;
    message: string;
    task_id?: number;
    document_id?: number;
    link?: string;
  };
  read_at: string | null;
  created_at: string;
}

export interface NotificationsResponse {
  data: Notification[];
  meta: {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    unread_count: number;
  };
}

export interface UnreadCountResponse {
  count: number;
}

export interface NotificationPreferences {
  daily_notifications: boolean;
  weekly_notifications: boolean;
  monthly_notifications: boolean;
}

export const notificationsApi = {
  /**
   * Get paginated notifications
   */
  getAll: async (page = 1, perPage = 20): Promise<NotificationsResponse> => {
    const response = await api.get('/notifications', {
      params: { page, per_page: perPage },
    });
    return response.data;
  },

  /**
   * Get unread count
   */
  getUnreadCount: async (): Promise<UnreadCountResponse> => {
    const response = await api.get('/notifications/unread-count');
    return response.data;
  },

  /**
   * Mark notification as read
   */
  markAsRead: async (id: string): Promise<{ message: string; notification: Notification }> => {
    const response = await api.post(`/notifications/${id}/read`);
    return response.data;
  },

  /**
   * Mark all notifications as read
   */
  markAllAsRead: async (): Promise<{ message: string }> => {
    const response = await api.post('/notifications/mark-all-read');
    return response.data;
  },

  /**
   * Delete notification
   */
  delete: async (id: string): Promise<{ message: string }> => {
    const response = await api.delete(`/notifications/${id}`);
    return response.data;
  },

  /**
   * Delete all read notifications
   */
  deleteRead: async (): Promise<{ message: string; count: number }> => {
    const response = await api.delete('/notifications/read');
    return response.data;
  },

  /**
   * Get notification preferences
   */
  getPreferences: async (): Promise<NotificationPreferences> => {
    const response = await api.get('/notifications/preferences');
    return response.data;
  },

  /**
   * Update notification preferences
   */
  updatePreferences: async (
    preferences: Partial<NotificationPreferences>
  ): Promise<{ message: string; preferences: NotificationPreferences }> => {
    const response = await api.put('/notifications/preferences', preferences);
    return response.data;
  },
};
