import React, { useState, useEffect } from 'react';
import { Save, Upload, Image as ImageIcon, Globe, Settings, MapPin, Calendar, Clock, Phone, Mail } from 'lucide-react';
import { useToast } from '../../context/ToastContext';
import { systemService, SystemSetting, AcademicSession, AcademicTerm } from '../../services/systemService';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

// Helper for file uploads
const LogoUploader = ({
    label,
    type,
    currentUrl,
    onUpload
}: {
    label: string,
    type: string,
    currentUrl?: string,
    onUpload: (type: string, file: File) => Promise<void>
}) => {
    const [uploading, setUploading] = useState(false);

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            setUploading(true);
            await onUpload(type, e.target.files[0]);
            setUploading(false);
        }
    };

    return (
        <div className="flex flex-col md:flex-row items-center gap-6 p-4 border border-gray-200 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-gray-800/50">
            <div className="w-24 h-24 shrink-0 rounded-xl border-2 border-dashed border-gray-300 dark:border-gray-600 flex items-center justify-center bg-white dark:bg-gray-800 overflow-hidden relative group">
                {currentUrl ? (
                    <img src={currentUrl.startsWith('/') ? `http://localhost:3000${currentUrl}` : currentUrl} alt={label} className="w-full h-full object-contain p-2" />
                ) : (
                    <ImageIcon className="w-8 h-8 text-gray-400" />
                )}
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                    <label className="cursor-pointer">
                        <Upload className="w-6 h-6 text-white" />
                        <input type="file" className="hidden" accept="image/*" onChange={handleFileChange} disabled={uploading} />
                    </label>
                </div>
                {uploading && (
                    <div className="absolute inset-0 bg-white/80 dark:bg-gray-800/80 flex items-center justify-center">
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                    </div>
                )}
            </div>
            <div className="flex-1 text-center md:text-left">
                <h4 className="font-semibold text-gray-900 dark:text-white">{label}</h4>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    Recommended format: PNG or SVG. Max size: 2MB.
                </p>
                <div className="mt-3">
                    <label className="inline-flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-600 cursor-pointer transition-colors shadow-sm">
                        <Upload className="w-4 h-4" />
                        {uploading ? 'Uploading...' : 'Choose File'}
                        <input type="file" className="hidden" accept="image/*" onChange={handleFileChange} disabled={uploading} />
                    </label>
                </div>
            </div>
        </div>
    );
};

const GeneralSettingsPage = () => {
    const { showSuccess, showError } = useToast();
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
            showSuccess(`${type} uploaded successfully`);
        } catch (error) {
            showError(`Failed to upload ${type}`);
        }
    };

    // Derived filtered terms based on selected session
    const filteredTerms = settings.currentSessionId
        ? terms.filter(t => t.sessionId === settings.currentSessionId)
        : [];

    if (loading) {
        return (
            <div className="p-12 text-center text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-900 min-h-screen flex items-center justify-center">
                <div>
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
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
                {activeTab === 'system' && (
                    <button
                        onClick={handleSaveSettings}
                        disabled={saving}
                        className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                    >
                        {saving ? <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div> : <Save className="w-4 h-4" />}
                        {saving ? 'Saving...' : 'Save Settings'}
                    </button>
                )}
            </div>

            {/* Tabs */}
            <div className="border-b border-gray-200 dark:border-gray-800">
                <nav className="-mb-px flex space-x-8">
                    <button
                        onClick={() => setActiveTab('system')}
                        className={twMerge(
                            "whitespace-nowrap pb-4 px-1 border-b-2 font-medium text-sm transition-colors",
                            activeTab === 'system'
                                ? "border-blue-500 text-blue-600 dark:text-blue-400"
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
                                ? "border-blue-500 text-blue-600 dark:text-blue-400"
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
                                <Globe className="w-5 h-5 text-blue-500" />
                                School Information
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">School Name</label>
                                    <input
                                        type="text"
                                        name="schoolName"
                                        value={settings.schoolName || ''}
                                        onChange={handleChange}
                                        className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        placeholder="Enter full school name"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 flex items-center gap-1"><Phone className="w-3 h-3" /> Phone Number</label>
                                    <input
                                        type="text"
                                        name="schoolPhone"
                                        value={settings.schoolPhone || ''}
                                        onChange={handleChange}
                                        className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 flex items-center gap-1"><Mail className="w-3 h-3" /> Email Address</label>
                                    <input
                                        type="email"
                                        name="schoolEmail"
                                        value={settings.schoolEmail || ''}
                                        onChange={handleChange}
                                        className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>
                                <div className="md:col-span-2">
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 flex items-center gap-1"><MapPin className="w-3 h-3" /> Address</label>
                                    <textarea
                                        name="schoolAddress"
                                        rows={2}
                                        value={settings.schoolAddress || ''}
                                        onChange={handleChange}
                                        className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Defaults Section */}
                        <div>
                            <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2 mb-6 border-b border-gray-100 dark:border-gray-700 pb-3 mt-8">
                                <Calendar className="w-5 h-5 text-indigo-500" />
                                Sessions & Terms
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Current Academic Session</label>
                                    <select
                                        name="currentSessionId"
                                        value={settings.currentSessionId || ''}
                                        onChange={handleChange}
                                        className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    >
                                        <option value="">Select Target Default Session</option>
                                        {sessions.map(s => (
                                            <option key={s.id} value={s.id}>{s.name} {s.isActive ? '(Active)' : ''}</option>
                                        ))}
                                    </select>
                                    <p className="mt-1 text-xs text-gray-500">Sets the global default session for the entire system.</p>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Current Academic Term</label>
                                    <select
                                        name="currentTermId"
                                        value={settings.currentTermId || ''}
                                        onChange={handleChange}
                                        className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        disabled={!settings.currentSessionId}
                                    >
                                        <option value="">Select Target Default Term</option>
                                        {filteredTerms.map(t => (
                                            <option key={t.id} value={t.id}>{t.name} {t.isActive ? '(Active)' : ''}</option>
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
                                        className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Date Format</label>
                                    <select
                                        name="dateFormat"
                                        value={settings.dateFormat || 'DD/MM/YYYY'}
                                        onChange={handleChange}
                                        className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    >
                                        <option value="DD/MM/YYYY">DD/MM/YYYY (e.g. 25/12/2026)</option>
                                        <option value="MM/DD/YYYY">MM/DD/YYYY (e.g. 12/25/2026)</option>
                                        <option value="YYYY-MM-DD">YYYY-MM-DD (e.g. 2026-12-25)</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Timezone</label>
                                    <select
                                        name="timezone"
                                        value={settings.timezone || 'UTC'}
                                        onChange={handleChange}
                                        className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    >
                                        <option value="UTC">UTC</option>
                                        <option value="Africa/Lagos">Africa/Lagos (WAT)</option>
                                        <option value="America/New_York">America/New_York (EST)</option>
                                        <option value="Europe/London">Europe/London (GMT)</option>
                                        {/* Expand as necessary or use timezone package */}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Start Day of the Week</label>
                                    <select
                                        name="startDayOfWeek"
                                        value={settings.startDayOfWeek?.toString() || '1'}
                                        onChange={handleChange}
                                        className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    >
                                        <option value="0">Sunday</option>
                                        <option value="1">Monday</option>
                                        <option value="6">Saturday</option>
                                    </select>
                                </div>
                            </div>
                        </div>
                    </form>
                ) : (
                    <div className="p-6 md:p-8 space-y-8">
                        <div>
                            <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2 mb-2">
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
                                    onUpload={handleLogoUpload}
                                />
                                <LogoUploader
                                    label="Favicon (Icon)"
                                    type="favicon"
                                    currentUrl={settings.favicon}
                                    onUpload={handleLogoUpload}
                                />
                                <LogoUploader
                                    label="Print/Report Logo"
                                    type="printLogo"
                                    currentUrl={settings.printLogo}
                                    onUpload={handleLogoUpload}
                                />
                                <LogoUploader
                                    label="Invoice Header Logo"
                                    type="invoiceLogo"
                                    currentUrl={settings.invoiceLogo}
                                    onUpload={handleLogoUpload}
                                />
                                <LogoUploader
                                    label="Document Watermark/Logo"
                                    type="documentLogo"
                                    currentUrl={settings.documentLogo}
                                    onUpload={handleLogoUpload}
                                />
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default GeneralSettingsPage;
