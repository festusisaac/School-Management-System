import api from './api';

export interface CmsHero {
  id: number;
  title: string;
  subtitle: string;
  welcomeText: string;
  carouselImages: CmsCarouselImage[];
}

export interface CmsCarouselImage {
  id: number;
  imageUrl: string;
  order: number;
}

export interface CmsSection {
  id: number;
  key: string;
  title: string;
  content: string;
  imageUrl?: string;
  metadata?: any;
}

export interface CmsStat {
  id: number;
  label: string;
  value: string;
  order: number;
}

export interface CmsTestimonial {
  id: number;
  author: string;
  role: string;
  quote: string;
  rating: number;
  isActive: boolean;
}

export interface CmsGalleryItem {
  id: number;
  imageUrl: string;
  title: string;
  category: string;
}

export interface CmsProgram {
  id: number;
  title: string;
  description: string;
  imageUrl: string;
  level: string;
}

export interface CmsNews {
  id: number;
  title: string;
  slug: string;
  tag: string;
  author: string;
  snippet: string;
  content: string;
  imageUrl?: string;
  date: string;
}

export interface CmsPublicInit {
  hero: CmsHero;
  stats: CmsStat[];
  testimonials: CmsTestimonial[];
  gallery: CmsGalleryItem[];
  programs: CmsProgram[];
  news: CmsNews[];
  sections: {
    about: CmsSection;
    heritage: CmsSection;
  };
}

const cmsService = {
  // Public
  getPublicInit: () => api.get<CmsPublicInit>('/front-cms/public/init'),
  getPublicNews: () => api.get<CmsNews[]>('/front-cms/public/news'),

  // Admin Hero
  getHero: () => api.get<CmsHero>('/front-cms/hero'),
  updateHero: (data: Partial<CmsHero>) => api.put<CmsHero>('/front-cms/hero', data),
  addCarouselImage: (image: File | string) => {
    if (typeof image === 'string') {
      return api.post<CmsCarouselImage>('/front-cms/hero/carousel', { imageUrl: image });
    }
    const formData = new FormData();
    formData.append('file', image);
    return api.post<CmsCarouselImage>('/front-cms/hero/carousel', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
  removeCarouselImage: (id: number) => api.delete(`/front-cms/hero/carousel/${id}`),

  // Admin Sections
  getSection: (key: string) => api.get<CmsSection>(`/front-cms/section/${key}`),
  updateSection: (key: string, data: Partial<CmsSection>, file?: File) => {
    const formData = new FormData();
    Object.keys(data).forEach(key => {
      if (data[key as keyof CmsSection] !== undefined) {
        formData.append(key, typeof data[key as keyof CmsSection] === 'object' ? JSON.stringify(data[key as keyof CmsSection]) : String(data[key as keyof CmsSection]));
      }
    });
    if (file) formData.append('file', file);
    return api.put<CmsSection>(`/front-cms/section/${key}`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },

  // Admin Stats
  getStats: () => api.get<CmsStat[]>('/front-cms/stats'),
  createStat: (data: Partial<CmsStat>) => api.post<CmsStat>('/front-cms/stats', data),
  updateStat: (id: number, data: Partial<CmsStat>) => api.put<CmsStat>(`/front-cms/stats/${id}`, data),
  deleteStat: (id: number) => api.delete(`/front-cms/stats/${id}`),

  // Admin Testimonials
  getTestimonials: () => api.get<CmsTestimonial[]>('/front-cms/testimonials'),
  createTestimonial: (data: Partial<CmsTestimonial>) => api.post<CmsTestimonial>('/front-cms/testimonials', data),
  updateTestimonial: (id: number, data: Partial<CmsTestimonial>) => api.put<CmsTestimonial>(`/front-cms/testimonials/${id}`, data),
  deleteTestimonial: (id: number) => api.delete(`/front-cms/testimonials/${id}`),

  // Admin Programs
  getPrograms: () => api.get<CmsProgram[]>('/front-cms/programs'),
  createProgram: (data: Partial<CmsProgram>, image: File | string) => {
    const formData = new FormData();
    Object.keys(data).forEach(key => {
      // Don't append imageUrl here if we are going to append it manually below
      if (key !== 'imageUrl' && data[key as keyof CmsProgram] !== undefined) {
        formData.append(key, String(data[key as keyof CmsProgram]));
      }
    });

    if (typeof image === 'string') {
      formData.append('imageUrl', image);
    } else if (image instanceof File) {
      formData.append('file', image);
    }
    
    return api.post<CmsProgram>('/front-cms/programs', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
  updateProgram: (id: number, data: Partial<CmsProgram>, file?: File) => {
    const formData = new FormData();
    Object.keys(data).forEach(key => {
      if (data[key as keyof CmsProgram] !== undefined) {
        formData.append(key, String(data[key as keyof CmsProgram]));
      }
    });
    if (file) formData.append('file', file);
    return api.put<CmsProgram>(`/front-cms/programs/${id}`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
  deleteProgram: (id: number) => api.delete(`/front-cms/programs/${id}`),

  // Admin Gallery
  getGallery: () => api.get<CmsGalleryItem[]>('/front-cms/gallery'),
  createGalleryItem: (data: { title: string; category: string }, image: File | string) => {
    const formData = new FormData();
    formData.append('title', data.title);
    formData.append('category', data.category);
    if (typeof image === 'string') {
      formData.append('imageUrl', image);
    } else {
      formData.append('file', image);
    }
    return api.post<CmsGalleryItem>('/front-cms/gallery', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
  deleteGalleryItem: (id: number) => api.delete(`/front-cms/gallery/${id}`),

  // Admin News
  getAllNews: () => api.get<CmsNews[]>('/front-cms/news'),
  createNews: (data: Partial<CmsNews>, file?: File) => {
    const formData = new FormData();
    Object.keys(data).forEach(key => formData.append(key, String(data[key as keyof CmsNews])));
    if (file) formData.append('file', file);
    return api.post<CmsNews>('/front-cms/news', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
  updateNews: (id: number, data: Partial<CmsNews>, file?: File) => {
    const formData = new FormData();
    Object.keys(data).forEach(key => formData.append(key, String(data[key as keyof CmsNews])));
    if (file) formData.append('file', file);
    return api.put<CmsNews>(`/front-cms/news/${id}`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
  deleteNews: (id: number) => api.delete(`/front-cms/news/${id}`),
  
  // Contacts
  submitContact: (data: { fullName: string; email: string; phone?: string; subject?: string; message: string }) => 
    api.post('/front-cms/contact', data),
  getContacts: () => api.get<CmsContact[]>('/front-cms/contacts'),
  markContactAsRead: (id: string) => api.put(`/front-cms/contacts/${id}/read`, {}),
  deleteContact: (id: string) => api.delete(`/front-cms/contacts/${id}`),

  // Media Library
  getMediaLibrary: () => api.get<CmsMedia[]>('/front-cms/media'),
  deleteMediaFile: (filename: string) => api.delete(`/front-cms/media/${filename}`),
  uploadMedia: (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post<{ url: string; name: string }>('/front-cms/media/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
};

export interface CmsMedia {
  name: string;
  size: number;
  createdAt: string;
  url: string;
}

export interface CmsContact {
  id: string;
  fullName: string;
  email: string;
  phone?: string;
  subject?: string;
  message: string;
  isRead: boolean;
  createdAt: string;
}

export default cmsService;
