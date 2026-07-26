import { apiClient } from './client';

export interface AnalyticsSummary {
  total_audits: number;
  average_risk_score: number;
  critical_findings_count: number;
  audits_by_risk?: Record<string, number>;
}

export const analyticsApi = {
  getAnalytics: async (): Promise<AnalyticsSummary> => {
    const res = await apiClient.get<AnalyticsSummary>('/analytics');
    return res.data;
  },
};
