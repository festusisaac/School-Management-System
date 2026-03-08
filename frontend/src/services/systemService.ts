import api from './api';

export interface SystemSetting {
    id?: string;
    schoolName?: string;
    schoolAddress?: string;
    schoolEmail?: string;
    schoolPhone?: string;
    currentSessionId?: string;
    currentTermId?: string;
    sessionStartDate?: string | Date;
    dateFormat?: string;
    timezone?: string;
    startDayOfWeek?: number;
    primaryLogo?: string;
    favicon?: string;
    printLogo?: string;
    invoiceLogo?: string;
    documentLogo?: string;
    createdAt?: string;
    updatedAt?: string;
}

export interface AcademicSession {
    id: string;
    name: string;
    startDate?: string;
    endDate?: string;
    isActive: boolean;
    createdAt?: string;
    updatedAt?: string;
}

export interface AcademicTerm {
    id: string;
    name: string;
    sessionId: string;
    startDate?: string;
    endDate?: string;
    isActive: boolean;
    createdAt?: string;
    updatedAt?: string;
}

export const systemService = {
    // System Settings
    getSettings: async () => {
        const response = await api.get<SystemSetting>('/system/settings');
        return response;
    },

    updateSettings: async (data: Partial<SystemSetting>) => {
        const response = await api.put<SystemSetting>('/system/settings', data);
        return response;
    },

    uploadLogo: async (type: string, file: File) => {
        const formData = new FormData();
        formData.append('file', file);
        const response = await api.put<SystemSetting>(`/system/settings/logo/${type}`, formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });
        return response;
    },

    // Academic Sessions
    getSessions: async () => {
        const response = await api.get<AcademicSession[]>('/system/academic-sessions');
        return response;
    },

    getSession: async (id: string) => {
        const response = await api.get<AcademicSession>(`/system/academic-sessions/${id}`);
        return response;
    },

    createSession: async (data: Partial<AcademicSession>) => {
        const response = await api.post<AcademicSession>('/system/academic-sessions', data);
        return response;
    },

    updateSession: async (id: string, data: Partial<AcademicSession>) => {
        const response = await api.put<AcademicSession>(`/system/academic-sessions/${id}`, data);
        return response;
    },

    deleteSession: async (id: string) => {
        const response = await api.delete(`/system/academic-sessions/${id}`);
        return response;
    },

    // Academic Terms
    getTerms: async () => {
        const response = await api.get<AcademicTerm[]>('/system/academic-terms');
        return response;
    },

    getTermsBySession: async (sessionId: string) => {
        const response = await api.get<AcademicTerm[]>(`/system/academic-terms/session/${sessionId}`);
        return response;
    },

    getTerm: async (id: string) => {
        const response = await api.get<AcademicTerm>(`/system/academic-terms/${id}`);
        return response;
    },

    createTerm: async (data: Partial<AcademicTerm>) => {
        const response = await api.post<AcademicTerm>('/system/academic-terms', data);
        return response;
    },

    updateTerm: async (id: string, data: Partial<AcademicTerm>) => {
        const response = await api.put<AcademicTerm>(`/system/academic-terms/${id}`, data);
        return response;
    },

    deleteTerm: async (id: string) => {
        const response = await api.delete(`/system/academic-terms/${id}`);
        return response;
    },
};
