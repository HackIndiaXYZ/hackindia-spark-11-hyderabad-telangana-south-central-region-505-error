import { apiClient } from './client';

export interface UserRegisterPayload {
  name: string;
  email: string;
  password: string;
  company?: string;
}

export interface UserLoginPayload {
  email: string;
  password: string;
}

export interface UserProfile {
  id: number;
  name: string;
  email: string;
  role: string;
  company?: string;
  created_at: string;
}

export interface TokenResponse {
  access_token: string;
  token_type: string;
}

export const authApi = {
  register: async (payload: UserRegisterPayload): Promise<UserProfile> => {
    const res = await apiClient.post<UserProfile>('/auth/register', payload);
    return res.data;
  },

  login: async (payload: UserLoginPayload): Promise<TokenResponse> => {
    const res = await apiClient.post<TokenResponse>('/auth/login', payload);
    const data = res.data;
    if (data.access_token) {
      localStorage.setItem('token', data.access_token);
      localStorage.setItem('ca_token', data.access_token);
    }
    return data;
  },

  getMe: async (): Promise<UserProfile> => {
    const res = await apiClient.get<UserProfile>('/auth/me');
    if (res.data) {
      localStorage.setItem('user', JSON.stringify(res.data));
      localStorage.setItem('ca_user', JSON.stringify(res.data));
    }
    return res.data;
  },

  logout: async (): Promise<{ message: string }> => {
    try {
      const res = await apiClient.post<{ message: string }>('/auth/logout');
      return res.data;
    } finally {
      localStorage.removeItem('token');
      localStorage.removeItem('ca_token');
      localStorage.removeItem('user');
      localStorage.removeItem('ca_user');
    }
  },
};
