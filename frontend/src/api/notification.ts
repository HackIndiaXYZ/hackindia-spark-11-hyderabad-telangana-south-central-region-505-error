import { apiClient } from './client';

export interface NotificationItem {
  id: number;
  user_id: number;
  message: string;
  status: string;
  created_at: string;
}

export const notificationApi = {
  getNotifications: async (): Promise<NotificationItem[]> => {
    const res = await apiClient.get<NotificationItem[]>('/notifications');
    return res.data;
  },

  markRead: async (id: number): Promise<NotificationItem> => {
    const res = await apiClient.post<NotificationItem>(`/notifications/${id}/read`);
    return res.data;
  },
};
