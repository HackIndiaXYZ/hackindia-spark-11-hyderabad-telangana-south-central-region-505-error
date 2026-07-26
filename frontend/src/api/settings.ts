import { apiClient } from './client';

export interface UserSetting {
  id?: number;
  user_id?: number;
  selected_model: string;
  theme: string;
  language: string;
  notifications_enabled: boolean;
  updated_at?: string;
}

export const settingsApi = {
  getSettings: async (): Promise<UserSetting> => {
    const res = await apiClient.get<UserSetting>('/settings');
    return res.data;
  },

  updateSettings: async (updates: Partial<UserSetting>): Promise<UserSetting> => {
    const res = await apiClient.put<UserSetting>('/settings', updates);
    return res.data;
  },
};
