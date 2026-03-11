import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { systemService, SystemSetting } from '../services/systemService';

interface SystemContextType {
    settings: SystemSetting;
    loading: boolean;
    refreshSettings: () => Promise<void>;
    getFullUrl: (path?: string) => string;
}

const SystemContext = createContext<SystemContextType | undefined>(undefined);

export const SystemProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [settings, setSettings] = useState<SystemSetting>({});
    const [loading, setLoading] = useState(true);

    const refreshSettings = useCallback(async () => {
        try {
            const data = await systemService.getSettings();
            setSettings(data || {});

            // Apply dynamic colors if present
            if (data?.primaryColor) {
                document.documentElement.style.setProperty('--color-primary', data.primaryColor);
            }
            if (data?.secondaryColor) {
                document.documentElement.style.setProperty('--color-secondary', data.secondaryColor);
            }
        } catch (error) {
            console.error('Failed to fetch system settings:', error);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        refreshSettings();
    }, [refreshSettings]);

    const getFullUrl = (url?: string) => {
        if (!url) return '';
        if (url.startsWith('http')) return url;
        const cleanUrl = url.startsWith('/') ? url : `/${url}`;
        const apiBaseUrl = (import.meta as any).env.VITE_API_BASE_URL || 'http://localhost:3000/api/v1';
        const serverUrl = apiBaseUrl.split('/api')[0];
        return `${serverUrl}${cleanUrl}`;
    };

    return (
        <SystemContext.Provider value={{ settings, loading, refreshSettings, getFullUrl }}>
            {children}
        </SystemContext.Provider>
    );
};

export const useSystem = () => {
    const context = useContext(SystemContext);
    if (context === undefined) {
        throw new Error('useSystem must be used within a SystemProvider');
    }
    return context;
};
