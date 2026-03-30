import api from './api';

export interface SystemSetting {
    id?: string;
    schoolName?: string;
    schoolAddress?: string;
    schoolEmail?: string;
    schoolPhone?: string;
    schoolMotto?: string;
    currentSessionId?: string;
    activeSessionName?: string;
    currentTermId?: string;
    activeTermName?: string;
    sessionStartDate?: string | Date;
    sessionEndDate?: string | Date;
    nextTermStartDate?: string | Date;
    dateFormat?: string;
    timezone?: string;
    startDayOfWeek?: number;
    primaryColor?: string;
    secondaryColor?: string;
    socialFacebook?: string;
    socialTwitter?: string;
    socialInstagram?: string;
    primaryLogo?: string;
    favicon?: string;
    printLogo?: string;
    invoiceLogo?: string;
    documentLogo?: string;
    // Financial Settings
    currencySymbol?: string;
    currencyCode?: string;
    taxNumber?: string;
    invoicePrefix?: string;
    // Student & Staff Prefixes
    admissionNumberPrefix?: string;
    staffIdPrefix?: string;
    // Enhanced Contact/Social
    officialWebsite?: string;
    whatsappNumber?: string;
    emailFromName?: string;
    socialYoutube?: string;
    socialLinkedin?: string;
    // System/Security
    isMaintenanceMode?: boolean;
    isInitialized?: boolean;
    sessionTimeoutMinutes?: number;
    maxFileUploadSizeMb?: number;
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
    daysOpened?: number;
    nextTermStartDate?: string | Date;
    createdAt?: string;
    updatedAt?: string;
}

export interface Permission {
    id: string;
    slug: string;
    name: string;
    module: string;
    description?: string;
}

export interface Role {
    id: string;
    name: string;
    description?: string;
    isSystem: boolean;
    permissions: Permission[];
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

    deleteLogo: async (type: string) => {
        const response = await api.delete<SystemSetting>(`/system/settings/logo/${type}`);
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

    // Roles & Permissions
    getRoles: async () => {
        const response = await api.get<Role[]>('/system/roles');
        return response;
    },

    getPermissions: async () => {
        const response = await api.get<Permission[]>('/system/roles/permissions');
        return response;
    },

    getRole: async (id: string) => {
        const response = await api.get<Role>(`/system/roles/${id}`);
        return response;
    },

    createRole: async (data: any) => {
        const response = await api.post<Role>('/system/roles', data);
        return response;
    },

    updateRole: async (id: string, data: any) => {
        const response = await api.put<Role>(`/system/roles/${id}`, data);
        return response;
    },

    deleteRole: async (id: string) => {
        const response = await api.delete(`/system/roles/${id}`);
        return response;
    },

    // User Management
    getUsers: async () => {
        const response = await api.get<any[]>('/system/users');
        return response;
    },

    createUser: async (data: any) => {
        const response = await api.post<any>('/system/users', data);
        return response;
    },

    updateUser: async (id: string, data: any) => {
        const response = await api.put<any>(`/system/users/${id}`, data);
        return response;
    },

    deleteUser: async (id: string) => {
        const response = await api.delete(`/system/users/${id}`);
        return response;
    },

    // System Setup
    getSetupStatus: async () => {
        const response = await api.get<{ isInitialized: boolean }>('/system/setup/status');
        return response;
    },

    initializeSystem: async (data: any) => {
        // This now expects FormData because of the logo upload
        const response = await api.post<{ message: string }>('/system/setup/initialize', data, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });
        return response;
    },
};
