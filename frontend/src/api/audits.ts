import { apiClient } from './client';

export interface FindingItem {
  id: number;
  audit_id: number;
  agent_name: string;
  title: string;
  description?: string;
  severity: string;
  category: string;
  confidence?: number;
  recommendation?: string;
  status: string;
  created_at: string;
}

export interface RecommendationItem {
  id: number;
  audit_id: number;
  priority: string;
  recommendation: string;
  estimated_effort: string;
  created_at: string;
}

export interface AgentResultItem {
  id: number;
  audit_id: number;
  agent_name: string;
  risk_score?: number;
  risk_level?: string;
  execution_time?: number;
  result_json?: any;
  created_at: string;
}

export interface AuditLogItem {
  id: number;
  audit_id: number;
  step: string;
  status: string;
  message?: string;
}

export interface DocumentInfo {
  id?: number;
  filename?: string;
  file_type?: string;
  file_size?: number;
  file_path?: string;
}

export interface AuditRecord {
  id: number;
  document_id?: number;
  user_id?: number;
  overall_score: number;
  overall_risk: string;
  executive_summary?: string;
  overall_health_verdict?: string;
  processing_time?: number;
  model_used?: string;
  status?: string;
  created_at: string;
  document?: DocumentInfo;
  agent_results?: AgentResultItem[];
  findings?: FindingItem[];
  recommendations?: RecommendationItem[];
  audit_logs?: AuditLogItem[];
}

export interface AuditResponseFull {
  audit_id: number;
  filename: string;
  processing_time_seconds: number;
  audit_result: any;
  agent_reports: any;
}

export interface AnalyticsSummary {
  total_audits: number;
  average_risk_score: number;
  critical_findings_count: number;
  audits_by_risk: Record<string, number>;
}

export interface UserSetting {
  id: number;
  user_id: number;
  selected_model: string;
  theme: string;
  language: string;
  notifications_enabled: boolean;
  updated_at: string;
}

export interface NotificationItem {
  id: number;
  user_id: number;
  message: string;
  status: string;
  created_at: string;
}

export const auditsApi = {
  uploadAndAudit: async (file: File): Promise<AuditResponseFull> => {
    const formData = new FormData();
    formData.append('file', file);
    const res = await apiClient.post<AuditResponseFull>('/audit', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return res.data;
  },

  getAudits: async (): Promise<AuditRecord[]> => {
    const res = await apiClient.get<AuditRecord[]>('/audits');
    return res.data;
  },

  getAuditById: async (auditId: number): Promise<AuditRecord> => {
    const res = await apiClient.get<AuditRecord>(`/audits/${auditId}`);
    return res.data;
  },

  getAnalytics: async (): Promise<AnalyticsSummary> => {
    const res = await apiClient.get<AnalyticsSummary>('/analytics');
    return res.data;
  },

  searchFindings: async (params?: { q?: string; agent?: string; severity?: string }): Promise<FindingItem[]> => {
    const res = await apiClient.get<FindingItem[]>('/findings/search', { params });
    return res.data;
  },

  getSettings: async (): Promise<UserSetting> => {
    const res = await apiClient.get<UserSetting>('/settings');
    return res.data;
  },

  updateSettings: async (updates: Partial<UserSetting>): Promise<UserSetting> => {
    const res = await apiClient.put<UserSetting>('/settings', updates);
    return res.data;
  },

  getNotifications: async (): Promise<NotificationItem[]> => {
    const res = await apiClient.get<NotificationItem[]>('/notifications');
    return res.data;
  },

  markNotificationRead: async (notifId: number): Promise<NotificationItem> => {
    const res = await apiClient.post<NotificationItem>(`/notifications/${notifId}/read`);
    return res.data;
  },
};
