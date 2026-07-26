import { apiClient } from './client';

export interface AsyncTaskResponse {
  task_id: string;
  audit_id: number;
  status: string;
  progress: number;
  celery_active?: boolean;
  message: string;
}

export const auditApi = {
  uploadAndAudit: async (file: File, clientId?: string): Promise<AsyncTaskResponse> => {
    const formData = new FormData();
    formData.append('file', file);
    const url = clientId ? `/audit?client_id=${encodeURIComponent(clientId)}` : '/audit';
    const res = await apiClient.post<AsyncTaskResponse>(url, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return res.data;
  },
  auditExistingDocument: async (docId: number | string, clientId?: string): Promise<AsyncTaskResponse> => {
    const url = clientId ? `/audit/existing/${docId}?client_id=${encodeURIComponent(clientId)}` : `/audit/existing/${docId}`;
    const res = await apiClient.post<AsyncTaskResponse>(url, {});
    return res.data;
  },
};

