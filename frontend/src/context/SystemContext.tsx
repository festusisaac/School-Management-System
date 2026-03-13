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
 * Converts a hex color string like "#0284c7" to RGB array [2, 132, 199]
 */
function hexToRgbChannels(hex: string): number[] | null {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex.trim());
    if (!result) return null;
    return [parseInt(result[1], 16), parseInt(result[2], 16), parseInt(result[3], 16)];
}

function applyThemeColors(prefix: string, hex: string | undefined, defaultChannels: number[]) {
    const root = document.documentElement;
    const rgb = hex ? hexToRgbChannels(hex) : defaultChannels;
    if (!rgb) return;
    
    root.style.setProperty(`--color-${prefix}-rgb`, rgb.join(' '));
    
    const mix = (c1: number[], c2: number[], weight: number) => {
        return c1.map((c, i) => Math.round(c * weight + c2[i] * (1 - weight)));
    };
    
    const white = [255, 255, 255];
    const black = [0, 0, 0];
    
    root.style.setProperty(`--color-${prefix}-50`, mix(white, rgb, 0.95).join(' '));
    root.style.setProperty(`--color-${prefix}-100`, mix(white, rgb, 0.9).join(' '));
    root.style.setProperty(`--color-${prefix}-200`, mix(white, rgb, 0.75).join(' '));
    root.style.setProperty(`--color-${prefix}-300`, mix(white, rgb, 0.6).join(' '));
    root.style.setProperty(`--color-${prefix}-400`, mix(white, rgb, 0.3).join(' '));
    root.style.setProperty(`--color-${prefix}-500`, rgb.join(' '));
    root.style.setProperty(`--color-${prefix}-600`, mix(black, rgb, 0.15).join(' '));
    root.style.setProperty(`--color-${prefix}-700`, mix(black, rgb, 0.3).join(' '));
    root.style.setProperty(`--color-${prefix}-800`, mix(black, rgb, 0.5).join(' '));
    root.style.setProperty(`--color-${prefix}-900`, mix(black, rgb, 0.7).join(' '));
    root.style.setProperty(`--color-${prefix}-950`, mix(black, rgb, 0.85).join(' '));
}

export const SystemProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [settings, setSettings] = useState<SystemSetting>({});
    const [loading, setLoading] = useState(true);

    const applyColors = useCallback((primaryColor?: string, secondaryColor?: string) => {
        applyThemeColors('primary', primaryColor, [2, 132, 199]);   // Default #0284c7
        applyThemeColors('secondary', secondaryColor, [124, 58, 237]); // Default #7c3aed
    }, []);

    const refreshSettings = useCallback(async () => {
        try {
            const data = await systemService.getSettings();
            
            // Fetch session and term names
            if (data?.currentSessionId) {
                try {
                    const sessionData = await systemService.getSession(data.currentSessionId);
                    data.activeSessionName = sessionData?.name;
                } catch (e) {
                    console.error('Failed to load active session name');
                }
            }
            if (data?.currentTermId) {
                try {
                    const termData = await systemService.getTerm(data.currentTermId);
                    data.activeTermName = termData?.name;
                } catch (e) {
                    console.error('Failed to load active term name');
                }
            }
            
            setSettings(data || {});
            applyColors(data?.primaryColor, data?.secondaryColor);
            
            // Generate full URL internally to avoid depending on getFullUrl which needs to be in useCallback scope
            const buildUrl = (url?: string) => {
                if (!url) return '';
                if (url.startsWith('http')) return url;
                const cleanUrl = url.startsWith('/') ? url : `/${url}`;
                const apiBaseUrl = (import.meta as any).env.VITE_API_BASE_URL || 'http://localhost:3000/api/v1';
                const serverUrl = apiBaseUrl.split('/api')[0];
                return `${serverUrl}${cleanUrl}`;
            };

            // Update Tab Title
            if (data?.schoolName) {
                document.title = data.schoolName;
            }

            // Update Favicon Tab Logo
            if (data?.primaryLogo) {
                const favicon = document.getElementById('favicon') as HTMLLinkElement;
                if (favicon) {
                    favicon.href = buildUrl(data.primaryLogo);
                }
            }
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
