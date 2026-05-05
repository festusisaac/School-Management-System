
import api from './api';
import { API_BASE_URL } from './apiConfig';
import { authSession } from './session';

export type DownloadResourceType = 'material' | 'syllabus' | 'video' | 'academic_program' | 'other';
export type DownloadResourceStatus = 'draft' | 'published' | 'archived';
export type DownloadResourceVisibility = 'all' | 'students' | 'parents' | 'staff' | 'public';

export interface DownloadResource {
  id: string;
  title: string;
  description?: string;
  resourceType: DownloadResourceType;
  category?: string;
  fileUrl?: string;
  externalUrl?: string;
  provider?: string;
  mimeType?: string;
  fileSize?: number;
  classId?: string;
  sectionId?: string;
  subjectId?: string;
  sessionId?: string;
  termId?: string;
  visibility: DownloadResourceVisibility;
  status: DownloadResourceStatus;
  isFeatured: boolean;
  downloadCount: number;
  viewCount: number;
  class?: { id: string; name: string };
  section?: { id: string; name: string };
  subject?: { id: string; name: string };
  session?: { id: string; name: string };
  term?: { id: string; name: string };
  createdAt: string;
  updatedAt: string;
}

export const downloadCenterService = {
  getResources: (params: any = {}) => api.get<DownloadResource[]>('/download-center', { params }),
  getResource: (id: string) => api.get<DownloadResource>(`/download-center/${id}`),
  createResource: (data: FormData) => api.post<DownloadResource>('/download-center', data, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),
  updateResource: (id: string, data: FormData) => api.patch<DownloadResource>(`/download-center/${id}`, data, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),
  deleteResource: (id: string) => api.delete(`/download-center/${id}`),
  /** Direct URL for file downloads — avoids XHR so IDM/browser handle it natively */
  getDownloadUrl: (id: string): string => {
    const token = authSession.getAccessToken();
    // Use the apiConfig API_BASE_URL to build the direct URL
    const base = `${API_BASE_URL}/download-center/${id}/file?download=true`;
    return token ? `${base}&token=${encodeURIComponent(token)}` : base;
  },
  /** XHR blob — use only for inline previews (PDF viewer, image, audio, text) */
  getResourceFile: async (id: string): Promise<Blob> => {
    return api.get<Blob>(`/download-center/${id}/file`, {
      responseType: 'blob',
      timeout: 60000,
    });
  },
  trackView: (id: string) => api.post(`/download-center/${id}/view`, {}),
  trackDownload: (id: string) => api.post(`/download-center/${id}/download`, {}),
};

export default downloadCenterService;
