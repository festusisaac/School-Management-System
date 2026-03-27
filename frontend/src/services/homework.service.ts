import api from './api';

export interface Homework {
  id: string;
  title: string;
  description?: string;
  dueDate: string;
  attachmentUrl?: string;
  classId: string;
  subjectId: string;
  teacherId: string;
  class?: { name: string };
  subject?: { name: string };
  teacher?: { firstName: string, lastName: string };
  createdAt: string;
  updatedAt: string;
  submissions?: HomeworkSubmission[];
  submission?: HomeworkSubmission;
}

export interface HomeworkSubmission {
  id: string;
  homeworkId: string;
  studentId: string;
  content?: string;
  attachmentUrls?: string[];
  status: 'PENDING' | 'SUBMITTED' | 'GRADED' | 'RETURNED';
  grade?: string;
  feedback?: string;
  submittedAt: string;
  student?: { firstName: string, lastName: string };
}

export const homeworkService = {
  getHomework: async (params: any = {}) => {
    return api.get<Homework[]>('/homework', { params });
  },
  getHomeworkById: async (id: string) => {
    return api.get<Homework>(`/homework/${id}`);
  },
  createHomework: async (data: any) => {
    // If data is not FormData, we might need to convert it if there's a file
    return api.post<Homework>('/homework', data, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
  updateHomework: async (id: string, data: any) => {
    return api.patch<Homework>(`/homework/${id}`, data, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
  deleteHomework: async (id: string) => {
    return api.delete(`/homework/${id}`);
  },

  // Submissions
  submitHomework: async (data: FormData) => {
    return api.post<HomeworkSubmission>('/homework/student-submit', data, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
  getSubmissions: async (homeworkId: string) => {
    return api.get<HomeworkSubmission[]>(`/homework/${homeworkId}/submissions`);
  },
  getMySubmissions: async () => {
    return api.get<HomeworkSubmission[]>('/homework/submissions/my');
  },
  gradeSubmission: async (id: string, data: { grade: string, feedback?: string }) => {
    return api.patch<HomeworkSubmission>(`/homework/submissions/${id}/grade`, data);
  },
};

export default homeworkService;
