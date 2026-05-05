import api from './api';

export interface LessonNote {
  id: string;
  subjectId: string;
  classId: string;
  termId?: string;
  sessionId?: string;
  topic: string;
  duration?: string;
  date?: string;
  content?: string; // Single content field
  status: 'draft' | 'submitted' | 'approved' | 'rejected';
  reviewNotes?: string;
  reviewerId?: string;
  reviewedAt?: string;
  teacher?: { id: string; firstName: string; lastName: string };
  subject?: { id: string; name: string };
  class?: { id: string; name: string };
  reviewer?: { id: string; firstName: string; lastName: string };
  term?: { id: string; name: string };
  session?: { id: string; name: string };
  createdAt: string;
  updatedAt: string;
}

export const lessonNoteService = {
  getLessonNotes: async (params: any = {}) => {
    return api.get<LessonNote[]>('/lesson-notes', { params });
  },
  getLessonNoteById: async (id: string) => {
    return api.get<LessonNote>(`/lesson-notes/${id}`);
  },
  createLessonNote: async (data: any) => {
    return api.post<LessonNote>('/lesson-notes', data);
  },
  updateLessonNote: async (id: string, data: any) => {
    return api.patch<LessonNote>(`/lesson-notes/${id}`, data);
  },
  deleteLessonNote: async (id: string) => {
    return api.delete(`/lesson-notes/${id}`);
  },
  submitLessonNote: async (id: string) => {
    return api.post<LessonNote>(`/lesson-notes/${id}/submit`, {});
  },
  reviewLessonNote: async (id: string, data: { status: 'approved' | 'rejected', reviewNotes: string }) => {
    return api.post<LessonNote>(`/lesson-notes/${id}/review`, data);
  },
  cloneLessonNote: async (id: string) => {
    return api.post<LessonNote>(`/lesson-notes/${id}/clone`, {});
  },
};

export default lessonNoteService;
