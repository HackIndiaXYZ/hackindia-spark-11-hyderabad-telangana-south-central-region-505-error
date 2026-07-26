import { apiClient } from './client';

const API_BASE_URL = import.meta.env.VITE_API_URL || import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000';

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

export interface DocumentInfo {
  id?: number;
  filename?: string;
  file_type?: string;
  file_size?: number;
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
  created_at: string;
  document?: DocumentInfo;
  findings?: FindingItem[];
}

export const historyApi = {
  getAudits: async (): Promise<AuditRecord[]> => {
    const res = await apiClient.get<AuditRecord[]>('/audits');
    return res.data;
  },

  getAuditById: async (auditId: number | string): Promise<AuditRecord> => {
    const res = await apiClient.get<AuditRecord>(`/audits/${auditId}`);
    return res.data;
  },

  deleteAudit: async (auditId: number | string): Promise<{ message: string }> => {
    const res = await apiClient.delete<{ message: string }>(`/audits/${auditId}`);
    return res.data;
  },

  searchFindings: async (params?: { q?: string; agent?: string; severity?: string }): Promise<FindingItem[]> => {
    const res = await apiClient.get<FindingItem[]>('/findings/search', { params });
    return res.data;
  },

  getPdfUrl: (auditId: number | string): string => {
    const base = API_BASE_URL.replace(/\/$/, '');
    return `${base}/reports/${auditId}/pdf`;
  },

  getExcelUrl: (auditId: number | string): string => {
    const base = API_BASE_URL.replace(/\/$/, '');
    return `${base}/reports/${auditId}/excel`;
  },

  getJsonUrl: (auditId: number | string): string => {
    const base = API_BASE_URL.replace(/\/$/, '');
    return `${base}/reports/${auditId}/json`;
  },
};
