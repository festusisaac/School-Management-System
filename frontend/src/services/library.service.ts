import api from './api';

export interface Author {
  id: string;
  name: string;
  bio?: string;
}

export interface Category {
  id: string;
  name: string;
  description?: string;
}

export interface BookCopy {
  id: string;
  bookId: string;
  barcode?: string;
  status: string; // available | loaned | lost
  location?: string;
}

export interface Book {
  id: string;
  title: string;
  isbn?: string;
  publisher?: string;
  publishedDate?: string;
  description?: string;
  coverPath?: string;
  authors?: Author[];
  categories?: Category[];
  copies?: BookCopy[];
}

export interface Loan {
  id: string;
  copyId: string;
  borrowerId?: string;
  issuedAt: string;
  dueAt: string;
  returnedAt?: string;
  status: string;
  copy?: BookCopy & { book?: Book };
}

export interface LibrarySettings {
  id: string;
  graceDays: number;
  finePerDay: number;
}

export const libraryService = {
  // Books
  getBooks: async (params: any = {}) => {
    return api.get<Book[]>('/library/books', { params });
  },
  getBook: async (id: string) => {
    return api.get<Book>(`/library/books/${id}`);
  },
  createBook: async (data: any) => {
    return api.post<Book>('/library/books', data, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
  updateBook: async (id: string, data: any) => {
    return api.patch<Book>(`/library/books/${id}`, data, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
  deleteBook: async (id: string) => {
    return api.delete(`/library/books/${id}`);
  },

  // Authors
  getAuthors: async () => {
    return api.get<Author[]>('/library/authors');
  },
  createAuthor: async (data: { name: string; bio?: string }) => {
    return api.post<Author>('/library/authors', data);
  },
  updateAuthor: async (id: string, data: { name?: string; bio?: string }) => {
    return api.patch<Author>(`/library/authors/${id}`, data);
  },
  deleteAuthor: async (id: string) => {
    return api.delete(`/library/authors/${id}`);
  },

  // Categories
  getCategories: async () => {
    return api.get<Category[]>('/library/categories');
  },
  createCategory: async (data: { name: string; description?: string }) => {
    return api.post<Category>('/library/categories', data);
  },
  updateCategory: async (id: string, data: { name?: string; description?: string }) => {
    return api.patch<Category>(`/library/categories/${id}`, data);
  },
  deleteCategory: async (id: string) => {
    return api.delete(`/library/categories/${id}`);
  },

  // Copies
  createCopy: async (bookId: string, data: { barcode?: string; location?: string }) => {
    return api.post<BookCopy>(`/library/books/${bookId}/copies`, data);
  },
  updateCopy: async (id: string, data: { barcode?: string; location?: string; status?: string }) => {
    return api.patch<BookCopy>(`/library/copies/${id}`, data);
  },
  deleteCopy: async (id: string) => {
    return api.delete(`/library/copies/${id}`);
  },

  // Loans
  issueLoan: async (data: { copyId: string; borrowerId: string; dueAt: string }) => {
    return api.post<Loan>('/library/loans', data);
  },
  returnLoan: async (loanId: string, returnedAt?: string) => {
    return api.post<Loan>(`/library/loans/return`, { loanId, returnedAt });
  },
  getOverdues: async (params: any = {}) => {
    return api.get<Loan[]>('/library/loans/overdue', { params });
  },

  // Settings
  getSettings: async () => {
    return api.get<LibrarySettings>('/library/settings');
  },
  updateSettings: async (data: { graceDays?: number; finePerDay?: number }) => {
    return api.post<LibrarySettings>('/library/settings', data);
  },

  // Dashboard & Misc
  getStats: async () => {
    return api.get<any>('/library/stats');
  },

  // Aliases for consistency with component usage
  issueBook: async (data: any) => libraryService.issueLoan(data),
  returnBook: async (loanId: string, returnedAt?: string) => libraryService.returnLoan(loanId, returnedAt),
  getOverdueLoans: async (params: any = {}) => libraryService.getOverdues(params),
};
