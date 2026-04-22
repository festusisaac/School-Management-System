import api from './api';

export const staffService = {
    getAllStaff: async (params?: any) => {
        return api.getStaff(params);
    },

    getDepartments: async () => {
        return api.getDepartments();
    },

    getDesignations: async () => {
        return api.getDesignations();
    },

    getStaffStatistics: async () => {
        return api.getStaffStatistics();
    },

    getMyProfile: async () => {
        return api.getMyProfile();
    },

    updateStaff: async (id: string, data: any) => {
        return api.updateStaff(id, data);
    },

    createStaff: async (data: any) => {
        return api.createStaff(data);
    },

    getPayrolls: async (params?: any) => {
        return api.getPayrolls(params);
    },

    deleteStaff: async (id: string) => {
        return api.deleteStaff(id);
    },
    
    validateBulkStaff: async (data: any[]) => {
        return api.validateBulkStaff(data);
    },

    importBulkStaff: async (data: any[]) => {
        return api.importBulkStaff(data);
    },

    getImportStatus: async (jobId: string) => {
        return api.getStaffImportStatus(jobId);
    },
    
    getNextStaffId: async () => {
        return api.getNextStaffId();
    },

    restoreStaff: async (id: string) => {
        return api.restoreStaff(id);
    }
};
