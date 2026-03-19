import React, { useState, useEffect } from 'react';
import { Save, Upload, Image as ImageIcon, Globe, Settings, MapPin, Calendar, Clock, Phone, Mail, Trash2, Facebook, Twitter, Instagram, Palette, Coins, IdCard, ShieldCheck, Youtube, Linkedin, Link, MessageSquare } from 'lucide-react';
import { useToast } from '../../context/ToastContext';
import { useSystem } from '../../context/SystemContext';
import { systemService, SystemSetting, AcademicSession, AcademicTerm } from '../../services/systemService';
import { twMerge } from 'tailwind-merge';

// Helper for file uploads
const LogoUploader = ({
    label,
    type,
    currentUrl,
    recommended,
    onUpload,
    onDelete
}: {
    label: string,
    type: string,
    currentUrl?: string,
    recommended?: string,
    onUpload: (type: string, file: File) => Promise<void>,
    onDelete: (type: string) => Promise<void>
}) => {
    const [uploading, setUploading] = useState(false);
    const [dimensions, setDimensions] = useState<{ width: number; height: number } | null>(null);
    const toast = useToast();
    const { settings } = useSystem();

    const getFullUrl = (url?: string) => {
        if (!url) return '';
        if (url.startsWith('http')) return url;
        const cleanUrl = url.startsWith('/') ? url : `/${url}`;
        const apiBaseUrl = (import.meta as any).env.VITE_API_BASE_URL || 'http://localhost:3000/api/v1';
        const serverUrl = apiBaseUrl.split('/api')[0];
        return `${serverUrl}${cleanUrl}`;
    };

    useEffect(() => {
        if (currentUrl) {
            const img = new Image();
            img.src = getFullUrl(currentUrl);
            img.onload = () => {
                setDimensions({ width: img.width, height: img.height });
            };
        } else {
            setDimensions(null);
        }
    }, [currentUrl]);

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            const file = e.target.files[0];
            const maxMB = settings?.maxFileUploadSizeMb || 2;
            if (file.size > maxMB * 1024 * 1024) {
                toast.showWarning(`File size exceeds ${maxMB}MB limit.`);
                return;
            }
            setUploading(true);
            await onUpload(type, file);
            setUploading(false);
        }
    };

    return (
        <div className="flex flex-col md:flex-row items-center gap-6 p-4 border border-gray-200 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-gray-800/50">
            <div className="w-24 h-24 shrink-0 rounded-xl border-2 border-dashed border-gray-300 dark:border-gray-600 flex items-center justify-center bg-white dark:bg-gray-800 overflow-hidden relative group font-mono text-[10px]">
                {currentUrl ? (
                    <img src={getFullUrl(currentUrl)} alt={label} className="w-full h-full object-contain p-2" />
                ) : (
                    <ImageIcon className="w-8 h-8 text-gray-400" />
                )}
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity gap-2">
                    <label className="cursor-pointer p-2 hover:bg-white/20 rounded-lg" title="Change logo">
                        <Upload className="w-5 h-5 text-white" />
                        <input type="file" className="hidden" accept="image/*" onChange={handleFileChange} disabled={uploading} />
                    </label>
                    {currentUrl && (
                        <button
                            onClick={() => onDelete(type)}
                            className="p-2 hover:bg-red-500/20 rounded-lg group/del"
                            title="Remove logo"
                        >
                            <Trash2 className="w-5 h-5 text-white group-hover/del:text-red-400" />
                        </button>
                    )}
                </div>
                {uploading && (
                    <div className="absolute inset-0 bg-white/80 dark:bg-gray-800/80 flex items-center justify-center">
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary-600"></div>
                    </div>
                )}
            </div>
            <div className="flex-1 text-center md:text-left">
                <div className="flex items-center justify-center md:justify-start gap-2">
                    <h4 className="font-semibold text-gray-900 dark:text-white">{label}</h4>
                    {dimensions && (
                        <span className="text-[10px] font-mono px-1.5 py-0.5 bg-gray-200 dark:bg-gray-700 rounded text-gray-600 dark:text-gray-400">
                            {dimensions.width}x{dimensions.height}
                        </span>
                    )}
                </div>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 line-clamp-1">
                    PNG/SVG, Max 2MB. {recommended && <span className="text-xs text-primary-500 font-medium">Rec: {recommended}</span>}
                </p>
                <div className="mt-3 flex items-center justify-center md:justify-start gap-2">
                    <label className="inline-flex items-center gap-2 px-3 py-1.5 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-xs font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-600 cursor-pointer transition-colors shadow-sm">
                        <Upload className="w-3.5 h-3.5" />
                        {uploading ? 'Uploading...' : (currentUrl ? 'Change' : 'Choose')}
                        <input type="file" className="hidden" accept="image/*" onChange={handleFileChange} disabled={uploading} />
                    </label>
                    {currentUrl && (
                        <button
                            onClick={() => onDelete(type)}
                            className="inline-flex items-center gap-2 px-3 py-1.5 bg-red-50 dark:bg-red-900/10 border border-red-100 dark:border-red-900/30 rounded-lg text-xs font-medium text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/20 transition-colors"
                        >
                            <Trash2 className="w-3.5 h-3.5" />
                            Remove
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

const CURRENCIES = [
    { code: 'USD', symbol: '$', name: 'US Dollar ($)' },
    { code: 'EUR', symbol: '€', name: 'Euro (€)' },
    { code: 'GBP', symbol: '£', name: 'British Pound (£)' },
    { code: 'NGN', symbol: '₦', name: 'Nigerian Naira (₦)' },
    { code: 'INR', symbol: '₹', name: 'Indian Rupee (₹)' },
    { code: 'JPY', symbol: '¥', name: 'Japanese Yen (¥)' },
    { code: 'CAD', symbol: '$', name: 'Canadian Dollar ($)' },
    { code: 'AUD', symbol: '$', name: 'Australian Dollar ($)' },
    { code: 'ZAR', symbol: 'R', name: 'South African Rand (R)' },
    { code: 'GHS', symbol: 'GH₵', name: 'Ghanaian Cedi (GH₵)' },
    { code: 'KES', symbol: 'KSh', name: 'Kenyan Shilling (KSh)' },
    { code: 'CNY', symbol: '¥', name: 'Chinese Yuan (¥)' },
];

const GeneralSettingsPage = () => {
    const { showSuccess, showError } = useToast();
    const { refreshSettings } = useSystem();
    const [activeTab, setActiveTab] = useState<'system' | 'logos'>('system');
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    // Data
    const [settings, setSettings] = useState<SystemSetting>({});
    const [sessions, setSessions] = useState<AcademicSession[]>([]);
    const [terms, setTerms] = useState<AcademicTerm[]>([]);

    useEffect(() => {
        const loadData = async () => {
            try {
                setLoading(true);
                const [settingsData, sessionsData, termsData] = await Promise.all([
                    systemService.getSettings(),
                    systemService.getSessions(),
                    systemService.getTerms()
                ]);

                // Format date for inputs
                if (settingsData.sessionStartDate) {
                    settingsData.sessionStartDate = new Date(settingsData.sessionStartDate as string | Date).toISOString().split('T')[0];
                }

                setSettings(settingsData || {});
                setSessions(sessionsData || []);
                setTerms(termsData || []);
            } catch (error) {
                showError('Failed to load settings');
            } finally {
                setLoading(false);
            }
        };
        loadData();
    }, []);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setSettings(prev => ({ ...prev, [name]: value }));
    };

    const handleSaveSettings = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            setSaving(true);
            await systemService.updateSettings(settings);
            showSuccess('Settings saved successfully');
            // Refresh global settings so colors apply immediately across the app
            await refreshSettings();
        } catch (error) {
            showError('Failed to save settings');
        } finally {
            setSaving(false);
        }
    };

    const handleLogoUpload = async (type: string, file: File) => {
        try {
            const updatedSettings = await systemService.uploadLogo(type, file);
            setSettings(prev => ({ ...prev, [type]: updatedSettings[type as keyof SystemSetting] }));
            showSuccess(`${labelMap[type as keyof typeof labelMap] || type} uploaded successfully`);
        } catch (error) {
            showError(`Failed to upload logo`);
        }
    };

    const handleLogoDelete = async (type: string) => {
        if (!window.confirm('Are you sure you want to remove this logo?')) return;
        try {
            await systemService.deleteLogo(type);
            setSettings(prev => ({ ...prev, [type]: null }));
            showSuccess('Logo removed successfully');
        } catch (error) {
            showError('Failed to remove logo');
        }
    };

    const labelMap = {
        primaryLogo: 'Primary Logo',
        favicon: 'Favicon',
        printLogo: 'Print Logo',
        invoiceLogo: 'Invoice Logo',
        documentLogo: 'Document Logo'
    };

    // Derived filtered terms based on selected session
    const filteredTerms = settings.currentSessionId
        ? terms.filter(t => t.sessionId === settings.currentSessionId)
        : [];

    if (loading) {
        return (
            <div className="p-12 text-center text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-900 min-h-screen flex items-center justify-center">
                <div>
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
                    <p className="mt-4">Loading settings...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="p-6 space-y-6 bg-gray-50 dark:bg-gray-900 min-h-screen">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">General Settings</h1>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Configure global system defaults and branding</p>
                </div>
                <button
                    onClick={handleSaveSettings}
                    disabled={saving}
                    className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50 shadow-sm"
                >
                    {saving ? <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div> : <Save className="w-4 h-4" />}
                    {saving ? 'Saving...' : 'Save Settings'}
                </button>
            </div>

            {/* Tabs */}
            <div className="border-b border-gray-200 dark:border-gray-800">
                <nav className="-mb-px flex space-x-8">
                    <button
                        onClick={() => setActiveTab('system')}
                        className={twMerge(
                            "whitespace-nowrap pb-4 px-1 border-b-2 font-medium text-sm transition-colors",
                            activeTab === 'system'
                                ? "border-primary-500 text-primary-600 dark:text-primary-400"
                                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300"
                        )}
                    >
                        <Settings className="w-4 h-4 inline-block mr-2" />
                        System & Localization
                    </button>
                    <button
                        onClick={() => setActiveTab('logos')}
                        className={twMerge(
                            "whitespace-nowrap pb-4 px-1 border-b-2 font-medium text-sm transition-colors",
                            activeTab === 'logos'
                                ? "border-primary-500 text-primary-600 dark:text-primary-400"
                                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300"
                        )}
                    >
                        <ImageIcon className="w-4 h-4 inline-block mr-2" />
                        Logos & Branding
                    </button>
                </nav>
            </div>

            {/* Tab Contents */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
                {activeTab === 'system' ? (
                    <form onSubmit={handleSaveSettings} className="p-6 md:p-8 space-y-8">
                        {/* School Info Section */}
                        <div>
                            <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2 mb-6 border-b border-gray-100 dark:border-gray-700 pb-3">
                                <Globe className="w-5 h-5 text-primary-500" />
                                School Information
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                        School Name <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        name="schoolName"
                                        value={settings.schoolName || ''}
                                        onChange={handleChange}
                                        required
                                        className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                                        placeholder="Enter full school name"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                        School Motto / Slogan
                                    </label>
                                    <input
                                        type="text"
                                        name="schoolMotto"
                                        value={settings.schoolMotto || ''}
                                        onChange={handleChange}
                                        className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                                        placeholder="e.g. Knowledge is Power"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 flex items-center gap-1"><Phone className="w-3 h-3" /> Phone Number <span className="text-red-500">*</span></label>
                                    <input
                                        type="text"
                                        name="schoolPhone"
                                        value={settings.schoolPhone || ''}
                                        onChange={handleChange}
                                        required
                                        className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 flex items-center gap-1"><Mail className="w-3 h-3" /> Email Address <span className="text-red-500">*</span></label>
                                    <input
                                        type="email"
                                        name="schoolEmail"
                                        value={settings.schoolEmail || ''}
                                        onChange={handleChange}
                                        required
                                        className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                                    />
                                </div>
                                <div className="md:col-span-2">
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 flex items-center gap-1"><MapPin className="w-3 h-3" /> Address <span className="text-red-500">*</span></label>
                                    <textarea
                                        name="schoolAddress"
                                        rows={2}
                                        value={settings.schoolAddress || ''}
                                        onChange={handleChange}
                                        required
                                        className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Defaults Section */}
                        <div>
                            <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2 mb-6 border-b border-gray-100 dark:border-gray-700 pb-3 mt-8">
                                <Calendar className="w-5 h-5 text-primary-500" />
                                Sessions & Terms
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                        Current Academic Session <span className="text-red-500">*</span>
                                    </label>
                                    <select
                                        name="currentSessionId"
                                        value={settings.currentSessionId || ''}
                                        onChange={handleChange}
                                        required
                                        className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                                    >
                                        <option value="">Select Target Default Session</option>
                                        {sessions.filter(s => s.isActive).map(s => (
                                            <option key={s.id} value={s.id}>{s.name}</option>
                                        ))}
                                    </select>
                                    <p className="mt-1 text-xs text-gray-500">Sets the global default session for the entire system.</p>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                        Current Academic Term <span className="text-red-500">*</span>
                                    </label>
                                    <select
                                        name="currentTermId"
                                        value={settings.currentTermId || ''}
                                        onChange={handleChange}
                                        required
                                        className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                                        disabled={!settings.currentSessionId}
                                    >
                                        <option value="">Select Target Default Term</option>
                                        {filteredTerms.filter(t => t.isActive).map(t => (
                                            <option key={t.id} value={t.id}>{t.name}</option>
                                        ))}
                                    </select>
                                    {settings.currentSessionId && filteredTerms.length === 0 && (
                                        <p className="mt-1 text-xs text-orange-500">No terms found for this session. Add terms first.</p>
                                    )}
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Session Start Date</label>
                                    <input
                                        type="date"
                                        name="sessionStartDate"
                                        value={settings.sessionStartDate as string || ''}
                                        onChange={handleChange}
                                        className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Localization Section */}
                        <div>
                            <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2 mb-6 border-b border-gray-100 dark:border-gray-700 pb-3 mt-8">
                                <Clock className="w-5 h-5 text-emerald-500" />
                                Date & Time Localization
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                        Date Format <span className="text-red-500">*</span>
                                    </label>
                                    <select
                                        name="dateFormat"
                                        value={settings.dateFormat || 'DD/MM/YYYY'}
                                        onChange={handleChange}
                                        required
                                        className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                                    >
                                        <option value="DD/MM/YYYY">DD/MM/YYYY (e.g. 25/12/2026)</option>
                                        <option value="MM/DD/YYYY">MM/DD/YYYY (e.g. 12/25/2026)</option>
                                        <option value="YYYY-MM-DD">YYYY-MM-DD (e.g. 2026-12-25)</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                        Timezone <span className="text-red-500">*</span>
                                    </label>
                                    <select
                                        name="timezone"
                                        value={settings.timezone || 'UTC'}
                                        onChange={handleChange}
                                        required
                                        className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                                    >
                                        <option value="UTC">UTC</option>
                                        <option value="Africa/Lagos">Africa/Lagos (WAT)</option>
                                        <option value="America/New_York">America/New_York (EST)</option>
                                        <option value="Europe/London">Europe/London (GMT)</option>
                                        {/* Expand as necessary or use timezone package */}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                        Start Day of the Week <span className="text-red-500">*</span>
                                    </label>
                                    <select
                                        name="startDayOfWeek"
                                        value={settings.startDayOfWeek?.toString() || '1'}
                                        onChange={handleChange}
                                        required
                                        className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                                    >
                                        <option value="0">Sunday</option>
                                        <option value="1">Monday</option>
                                        <option value="6">Saturday</option>
                                    </select>
                                </div>
                            </div>
                        </div>

                        {/* Financial Settings Section */}
                        <div>
                            <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2 mb-6 border-b border-gray-100 dark:border-gray-700 pb-3 mt-8">
                                <Coins className="w-5 h-5 text-amber-500" />
                                Financial & Payment Settings
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">System Currency</label>
                                    <select
                                        name="currencyCode"
                                        value={settings.currencyCode || 'NGN'}
                                        onChange={(e) => {
                                            const selected = CURRENCIES.find(c => c.code === e.target.value);
                                            if (selected) {
                                                setSettings(prev => ({
                                                    ...prev,
                                                    currencyCode: selected.code,
                                                    currencySymbol: selected.symbol
                                                }));
                                            }
                                        }}
                                        className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                                    >
                                        {CURRENCIES.map(c => (
                                            <option key={c.code} value={c.code}>{c.name}</option>
                                        ))}
                                    </select>
                                    <p className="mt-1 text-xs text-gray-500">Select the primary currency for fees and payments.</p>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Currency Symbol (Preview)</label>
                                    <input
                                        type="text"
                                        name="currencySymbol"
                                        value={settings.currencySymbol || ''}
                                        readOnly
                                        className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 px-4 py-2.5 text-sm font-mono cursor-not-allowed"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Tax / VAT Number</label>
                                    <input
                                        type="text"
                                        name="taxNumber"
                                        value={settings.taxNumber || ''}
                                        onChange={handleChange}
                                        className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Invoice/Receipt Prefix</label>
                                    <input
                                        type="text"
                                        name="invoicePrefix"
                                        value={settings.invoicePrefix || ''}
                                        onChange={handleChange}
                                        className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                                        placeholder="e.g. INV-"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Identification Prefixes */}
                        <div>
                            <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2 mb-6 border-b border-gray-100 dark:border-gray-700 pb-3 mt-8">
                                <IdCard className="w-5 h-5 text-indigo-500" />
                                Identification Prefixes
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Admission Number Prefix</label>
                                    <input
                                        type="text"
                                        name="admissionNumberPrefix"
                                        value={settings.admissionNumberPrefix || ''}
                                        onChange={handleChange}
                                        className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                                        placeholder="e.g. SCH/"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Staff ID Prefix</label>
                                    <input
                                        type="text"
                                        name="staffIdPrefix"
                                        value={settings.staffIdPrefix || ''}
                                        onChange={handleChange}
                                        className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                                        placeholder="e.g. STF/"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* System & Security */}
                        <div>
                            <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2 mb-6 border-b border-gray-100 dark:border-gray-700 pb-3 mt-8">
                                <ShieldCheck className="w-5 h-5 text-rose-500" />
                                System & Security
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Maintenance Mode</label>
                                    <div className="flex items-center gap-3 h-10">
                                        <button
                                            type="button"
                                            onClick={() => setSettings(prev => ({ ...prev, isMaintenanceMode: !prev.isMaintenanceMode }))}
                                            className={twMerge(
                                                "relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2",
                                                settings.isMaintenanceMode ? "bg-primary-600" : "bg-gray-200 dark:bg-gray-700"
                                            )}
                                        >
                                            <span
                                                className={twMerge(
                                                    "inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out",
                                                    settings.isMaintenanceMode ? "translate-x-5" : "translate-x-0"
                                                )}
                                            />
                                        </button>
                                        <span className="text-sm text-gray-600 dark:text-gray-400">
                                            {settings.isMaintenanceMode ? 'Enabled' : 'Disabled'}
                                        </span>
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Session Timeout (Mins)</label>
                                    <input
                                        type="number"
                                        name="sessionTimeoutMinutes"
                                        value={settings.sessionTimeoutMinutes || ''}
                                        onChange={handleChange}
                                        className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Max Upload Size (MB)</label>
                                    <input
                                        type="number"
                                        name="maxFileUploadSizeMb"
                                        value={settings.maxFileUploadSizeMb || ''}
                                        onChange={handleChange}
                                        className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                                    />
                                </div>
                            </div>
                        </div>
                    </form>
                ) : (
                    <div className="p-6 md:p-8 space-y-10">
                        {/* Theme Colors Section */}
                        <div>
                            <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2 mb-2">
                                <Palette className="w-5 h-5 text-primary-500" />
                                Theme & System Colors
                            </h3>
                            <p className="text-sm text-gray-500 dark:text-gray-400 mb-6 pb-4 border-b border-gray-100 dark:border-gray-800">
                                Define the primary and secondary colors used for buttons, menus, and highlights across the application.
                            </p>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div className="flex items-center gap-4 p-4 rounded-xl border border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/30">
                                    <div
                                        className="w-12 h-12 rounded-lg border-2 border-white dark:border-gray-700 shadow-sm shrink-0"
                                        style={{ backgroundColor: settings.primaryColor || '#4f46e5' }}
                                    ></div>
                                    <div className="flex-1">
                                        <label className="block text-sm font-semibold text-gray-900 dark:text-white">Primary Theme Color</label>
                                        <div className="mt-1 flex items-center gap-2">
                                            <input
                                                type="color"
                                                name="primaryColor"
                                                value={settings.primaryColor || '#4f46e5'}
                                                onChange={handleChange}
                                                className="w-8 h-8 rounded cursor-pointer border-0 p-0 bg-transparent"
                                            />
                                            <input
                                                type="text"
                                                name="primaryColor"
                                                value={settings.primaryColor || '#4f46e5'}
                                                onChange={handleChange}
                                                className="flex-1 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded px-2 py-1 text-xs font-mono uppercase"
                                            />
                                        </div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-4 p-4 rounded-xl border border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/30">
                                    <div
                                        className="w-12 h-12 rounded-lg border-2 border-white dark:border-gray-700 shadow-sm shrink-0"
                                        style={{ backgroundColor: settings.secondaryColor || '#94a3b8' }}
                                    ></div>
                                    <div className="flex-1">
                                        <label className="block text-sm font-semibold text-gray-900 dark:text-white">Secondary Color</label>
                                        <div className="mt-1 flex items-center gap-2">
                                            <input
                                                type="color"
                                                name="secondaryColor"
                                                value={settings.secondaryColor || '#94a3b8'}
                                                onChange={handleChange}
                                                className="w-8 h-8 rounded cursor-pointer border-0 p-0 bg-transparent"
                                            />
                                            <input
                                                type="text"
                                                name="secondaryColor"
                                                value={settings.secondaryColor || '#94a3b8'}
                                                onChange={handleChange}
                                                className="flex-1 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded px-2 py-1 text-xs font-mono uppercase"
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Brand Logos Section */}
                        <div className="pt-2 border-t border-gray-100 dark:border-gray-800">
                            <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2 mb-2">
                                <ImageIcon className="w-5 h-5 text-primary-500" />
                                Brand Logos
                            </h3>
                            <p className="text-sm text-gray-500 dark:text-gray-400 mb-6 pb-4 border-b border-gray-100 dark:border-gray-800">
                                Upload different variants of your school's logo for use across the application, reports, and invoices.
                            </p>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <LogoUploader
                                    label="Primary App Logo"
                                    type="primaryLogo"
                                    currentUrl={settings.primaryLogo}
                                    recommended="200x60"
                                    onUpload={handleLogoUpload}
                                    onDelete={handleLogoDelete}
                                />
                                <LogoUploader
                                    label="Favicon (Icon)"
                                    type="favicon"
                                    currentUrl={settings.favicon}
                                    recommended="32x32"
                                    onUpload={handleLogoUpload}
                                    onDelete={handleLogoDelete}
                                />
                                <LogoUploader
                                    label="Print/Report Logo"
                                    type="printLogo"
                                    currentUrl={settings.printLogo}
                                    recommended="300x100"
                                    onUpload={handleLogoUpload}
                                    onDelete={handleLogoDelete}
                                />
                                <LogoUploader
                                    label="Invoice Header Logo"
                                    type="invoiceLogo"
                                    currentUrl={settings.invoiceLogo}
                                    recommended="400x120"
                                    onUpload={handleLogoUpload}
                                    onDelete={handleLogoDelete}
                                />
                                <LogoUploader
                                    label="Document Watermark/Logo"
                                    type="documentLogo"
                                    currentUrl={settings.documentLogo}
                                    recommended="600x600"
                                    onUpload={handleLogoUpload}
                                    onDelete={handleLogoDelete}
                                />
                            </div>
                        </div>

                        {/* Social Media Section */}
                        <div className="pt-8 border-t border-gray-100 dark:border-gray-800">
                            <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2 mb-2">
                                Social Media Links
                            </h3>
                            <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
                                Connect your school's official social media profiles.
                            </p>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 flex items-center gap-2">
                                        <Facebook className="w-4 h-4 text-primary-600" /> Facebook URL
                                    </label>
                                    <input
                                        type="url"
                                        name="socialFacebook"
                                        value={settings.socialFacebook || ''}
                                        onChange={handleChange}
                                        className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                                        placeholder="https://facebook.com/yourschool"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 flex items-center gap-2">
                                        <Twitter className="w-4 h-4 text-sky-500" /> X (Twitter) URL
                                    </label>
                                    <input
                                        type="url"
                                        name="socialTwitter"
                                        value={settings.socialTwitter || ''}
                                        onChange={handleChange}
                                        className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                                        placeholder="https://x.com/yourschool"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 flex items-center gap-2">
                                        <Instagram className="w-4 h-4 text-pink-600" /> Instagram URL
                                    </label>
                                    <input
                                        type="url"
                                        name="socialInstagram"
                                        value={settings.socialInstagram || ''}
                                        onChange={handleChange}
                                        className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                                        placeholder="https://instagram.com/yourschool"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 flex items-center gap-2">
                                        <Youtube className="w-4 h-4 text-red-600" /> YouTube URL
                                    </label>
                                    <input
                                        type="url"
                                        name="socialYoutube"
                                        value={settings.socialYoutube || ''}
                                        onChange={handleChange}
                                        className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                                        placeholder="https://youtube.com/@yourschool"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 flex items-center gap-2">
                                        <Linkedin className="w-4 h-4 text-blue-700" /> LinkedIn URL
                                    </label>
                                    <input
                                        type="url"
                                        name="socialLinkedin"
                                        value={settings.socialLinkedin || ''}
                                        onChange={handleChange}
                                        className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                                        placeholder="https://linkedin.com/school/yourschool"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 flex items-center gap-2">
                                        <MessageSquare className="w-4 h-4 text-green-500" /> WhatsApp Number
                                    </label>
                                    <input
                                        type="text"
                                        name="whatsappNumber"
                                        value={settings.whatsappNumber || ''}
                                        onChange={handleChange}
                                        className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                                        placeholder="+234 800 000 0000"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 flex items-center gap-2">
                                        <Link className="w-4 h-4 text-gray-500" /> Official Website URL
                                    </label>
                                    <input
                                        type="url"
                                        name="officialWebsite"
                                        value={settings.officialWebsite || ''}
                                        onChange={handleChange}
                                        className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                                        placeholder="https://yourschool.edu"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 flex items-center gap-2">
                                        <Mail className="w-4 h-4 text-orange-500" /> Email "From" Name
                                    </label>
                                    <input
                                        type="text"
                                        name="emailFromName"
                                        value={settings.emailFromName || ''}
                                        onChange={handleChange}
                                        className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                                        placeholder="e.g. Greenwood Academy Admin"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                )
                }
            </div >
        </div >
    );
};

export default GeneralSettingsPage;
