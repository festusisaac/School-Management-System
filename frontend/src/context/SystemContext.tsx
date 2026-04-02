import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { systemService, SystemSetting } from '../services/systemService';
import { api, getFileUrl } from '../services/api';
import { updateCurrencyConfig, formatCurrency as genericFormatCurrency, formatCurrencyCompact as genericFormatCurrencyCompact } from '../utils/currency';

interface SchoolInfo {
    name: string;
    address: string;
    phone: string;
    email: string;
    logo: string;
    invoicePrefix?: string;
    currencyName?: string;
    subunitName?: string;
}

interface SystemContextType {
    settings: SystemSetting;
    loading: boolean;
    refreshSettings: () => Promise<void>;
    getFullUrl: (path?: string) => string;
    formatCurrency: (amount: number | string | undefined | null, includeSymbol?: boolean) => string;
    formatCurrencyCompact: (amount: number | string | undefined | null) => string;
    getSchoolInfo: () => SchoolInfo;
    activeSectionId: string;
    setActiveSectionId: (id: string) => void;
    availableSections: any[];
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
    const [settings, setSettings] = useState<SystemSetting>(() => {
        const cached = localStorage.getItem('system_settings');
        return cached ? JSON.parse(cached) : {};
    });
    const [loading, setLoading] = useState(true);
    
    // Multi-Section Multi-Tenancy Architecture 🚀
    const [activeSectionId, setActiveSectionIdState] = useState<string>(() => {
        return localStorage.getItem('active_section_id') || '';
    });
    const [availableSections, setAvailableSections] = useState<any[]>([]);

    const setActiveSectionId = useCallback((id: string) => {
        setActiveSectionIdState(id);
        localStorage.setItem('active_section_id', id);
    }, []);

    const applyColors = useCallback((primaryColor?: string, secondaryColor?: string) => {
        applyThemeColors('primary', primaryColor, [2, 132, 199]);   // Default #0284c7
        applyThemeColors('secondary', secondaryColor, [124, 58, 237]); // Default #7c3aed
    }, []);

    const refreshSettings = useCallback(async () => {
        try {
            const data = await systemService.getSettings();
            
            // Try fetching sections using the base api call
            try {
                const sectData = await api.getSchoolSections();
                setAvailableSections(sectData || []);
            } catch (e) {
                console.error('Failed to load sections', e);
            }

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
            
            localStorage.setItem('system_settings', JSON.stringify(data || {}));
            setSettings(data || {});
            applyColors(data?.primaryColor, data?.secondaryColor);

            // Update global currency config
            if (data?.currencySymbol && data?.currencyCode) {
                updateCurrencyConfig(data.currencySymbol, data.currencyCode);
            }
            
            // Generate full URL internally to avoid depending on getFullUrl which needs to be in useCallback scope
            const buildUrl = (url?: string) => getFileUrl(url || '');

            // Update Tab Title
            if (data?.schoolName) {
                document.title = data.schoolName;
            }

            // Update Favicon Tab Logo
            const faviconUrl = data?.favicon;
            const favicon = document.getElementById('favicon') as HTMLLinkElement;
            if (favicon) {
                // Append timestamp as cache buster if updatedAt is available
                const cacheBuster = data?.updatedAt ? `?v=${new Date(data.updatedAt).getTime()}` : '';
                favicon.href = faviconUrl ? `${buildUrl(faviconUrl)}${cacheBuster}` : '/vite.svg';
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

    const getFullUrl = (url?: string) => getFileUrl(url || '');

    const formatCurrency = useCallback((amount: number | string | undefined | null, includeSymbol: boolean = true) => {
        return genericFormatCurrency(amount, includeSymbol);
    }, [settings.currencySymbol, settings.currencyCode]);

    const formatCurrencyCompact = useCallback((amount: number | string | undefined | null) => {
        return genericFormatCurrencyCompact(amount);
    }, [settings.currencySymbol, settings.currencyCode]);

    const getSchoolInfo = useCallback((): SchoolInfo => {
        const majorMinorMap: Record<string, [string, string]> = {
            'NGN': ['Naira', 'Kobo'],
            'USD': ['Dollars', 'Cents'],
            'GBP': ['Pounds', 'Pence'],
            'EUR': ['Euros', 'Cents'],
            'GHS': ['Cedis', 'Pesewas'],
            'KES': ['Shillings', 'Cents'],
        };
        const [currencyName, subunitName] = majorMinorMap[settings.currencyCode || 'NGN'] || ['Units', 'Sub-units'];

        return {
            name: settings.schoolName || 'YOUR SCHOOL NAME',
            address: settings.schoolAddress || '123 Education Lane',
            phone: settings.schoolPhone || '+1 234 567 890',
            email: settings.schoolEmail || 'school@example.com',
            logo: getFullUrl(settings.invoiceLogo || settings.primaryLogo),
            invoicePrefix: settings.invoicePrefix,
            currencyName,
            subunitName
        };
    }, [settings, getFullUrl]);

    return (
        <SystemContext.Provider value={{ 
            settings, 
            loading, 
            refreshSettings, 
            getFullUrl, 
            formatCurrency, 
            formatCurrencyCompact,
            getSchoolInfo,
            activeSectionId,
            setActiveSectionId,
            availableSections
        }}>
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
