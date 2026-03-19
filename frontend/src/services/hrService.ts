import api from './api';

export const staffService = {
    getAllStaff: async () => {
        return api.getStaff();
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
    }
};
