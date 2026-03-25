import api from './api';

export interface Book {
  id: string;
  title: string;
  isbn?: string;
  publisher?: string;
  publishedDate?: string;
  description?: string;
  coverPath?: string;
}

export interface Loan {
  id: string;
  copyId: string;
  borrowerId?: string;
  issuedAt: string;
  dueAt: string;
  returnedAt?: string;
  status: string;
}

export const libraryService = {
  getBooks: async (params: any = {}) => {
    return api.get<Book[]>('/library/books', { params });
  },

  getBook: async (id: string) => {
    return api.get<Book>(`/library/books/${id}`);
  },

  createBook: async (data: any) => {
    return api.post<Book>('/library/books', data);
  },

  uploadCover: async (bookId: string, file: File) => {
    const fd = new FormData();
    fd.append('file', file);
    return api.put(`/library/books/${bookId}/cover`, fd, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },

  createCopy: async (bookId: string, data: any) => {
    return api.post<any>(`/library/books/${bookId}/copies`, data);
  },

  issueLoan: async (data: { copyId: string; borrowerId: string; dueAt: string }) => {
    return api.post<Loan>('/library/loans', data);
  },

  returnLoan: async (loanId: string) => {
    return api.post(`/library/loans/${loanId}/return`, {});
  },

  getOverdues: async (params: any = {}) => {
    return api.get<any[]>('/library/overdues', { params });
  },
};
