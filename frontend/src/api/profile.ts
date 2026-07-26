import { apiClient } from './client';
import { UserProfile } from './auth';

export const profileApi = {
  getProfile: async (): Promise<UserProfile> => {
    const res = await apiClient.get<UserProfile>('/auth/me');
    return res.data;
  },
};
