import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { systemService, SystemSetting } from '../services/systemService';

interface SystemContextType {
    settings: SystemSetting;
    loading: boolean;
    refreshSettings: () => Promise<void>;
    getFullUrl: (path?: string) => string;
}

const SystemContext = createContext<SystemContextType | undefined>(undefined);

/**
 * Converts a hex color string like "#0284c7" to space-separated RGB channels "2 132 199"
 * This format is required by Tailwind's `rgb(var(--x) / <alpha-value>)` pattern.
 */
function hexToRgbChannels(hex: string): string | null {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex.trim());
    if (!result) return null;
    const r = parseInt(result[1], 16);
    const g = parseInt(result[2], 16);
    const b = parseInt(result[3], 16);
    return `${r} ${g} ${b}`;
}

export const SystemProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [settings, setSettings] = useState<SystemSetting>({});
    const [loading, setLoading] = useState(true);

    const applyColors = useCallback((primaryColor?: string, secondaryColor?: string) => {
        const root = document.documentElement;

        if (primaryColor) {
            const rgb = hexToRgbChannels(primaryColor);
            if (rgb) root.style.setProperty('--color-primary-rgb', rgb);
        } else {
            root.style.removeProperty('--color-primary-rgb');
        }

        if (secondaryColor) {
            const rgb = hexToRgbChannels(secondaryColor);
            if (rgb) root.style.setProperty('--color-secondary-rgb', rgb);
        } else {
            root.style.removeProperty('--color-secondary-rgb');
        }
    }, []);

    const refreshSettings = useCallback(async () => {
        try {
            const data = await systemService.getSettings();
            setSettings(data || {});
            applyColors(data?.primaryColor, data?.secondaryColor);
        } catch (error) {
            console.error('Failed to fetch system settings:', error);
        } finally {
            setLoading(false);
        }
    }, [applyColors]);

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
