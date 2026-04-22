import React, { useState, useRef, useEffect } from 'react';
import { Shield, User, Mail, Calendar, Activity, Key, Globe, Lock, Camera, History, Layout, Power } from 'lucide-react';
import { useAuthStore } from '../../stores/authStore';
import { getFileUrl } from '../../services/api';
import systemService from '../../services/systemService';
import { useToast } from '../../context/ToastContext';
import { useSystem } from '../../context/SystemContext';
import api from '../../services/api';
import { formatDateLocal, formatTimeLocal } from '../../utils/date';

const AdminProfilePage = () => {
    const { user, refreshUser } = useAuthStore();
    const { settings } = useSystem();
    const { showSuccess, showError } = useToast();
    const [viewTab, setViewTab] = useState<'info' | 'activity' | 'security'>('info');
    const [uploading, setUploading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [recentLogs, setRecentLogs] = useState<any[]>([]);

    useEffect(() => {
        if (viewTab === 'activity') {
            fetchRecentLogs();
        }
    }, [viewTab]);

    const fetchRecentLogs = async () => {
        try {
            const resp = await api.getAuditActivityLogs({ search: user.email, limit: 10 });
            setRecentLogs(resp.items || []);
        } catch (e) {
            console.error('Failed to load recent logs', e);
        }
    };

    const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (file.size > (settings?.maxFileUploadSizeMb || 5) * 1024 * 1024) {
            showError(`Photo is too large. Maximum allowed size is ${settings?.maxFileUploadSizeMb || 5}MB`);
            return;
        }

        try {
            setUploading(true);
            await systemService.uploadUserPhoto(user.id, file);
            await refreshUser();
            showSuccess('Profile photo updated successfully');
        } catch (error) {
            showError('Failed to upload profile photo');
        } finally {
            setUploading(false);
            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }
        }
    };

    if (!user) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[400px]">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
                <p className="mt-4 text-gray-500 dark:text-gray-400">Loading profile data...</p>
            </div>
        );
    }

    const roleName = user.roleObject?.name || user.role || 'System Administrator';
    const initials = `${user.firstName?.charAt(0) || ''}${user.lastName?.charAt(0) || ''}`;

    return (
        <div className="space-y-4 sm:space-y-6 animate-in fade-in duration-500 pb-8">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                    <Shield className="text-primary-600 dark:text-primary-400 shrink-0" />
                    <span className="truncate">Administrator Profile</span>
                </h1>
            </div>

            {/* Tabs */}
            <div className="overflow-x-auto no-scrollbar -mx-4 px-4 sm:mx-0 sm:px-0">
                <div className="flex bg-white dark:bg-gray-800 rounded-xl p-1 border border-gray-200 dark:border-gray-700 w-max sm:w-fit shadow-sm overflow-x-auto">
                    <button
                        onClick={() => setViewTab('info')}
                        className={`px-4 sm:px-8 py-2 text-xs sm:text-sm font-bold rounded-lg transition-all ${viewTab === 'info' ? 'bg-primary-600 text-white shadow-md' : 'text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700'}`}
                    >
                        <div className="flex items-center gap-2">
                            <User size={14} /> Basic Details
                        </div>
                    </button>
                    <button
                        onClick={() => setViewTab('activity')}
                        className={`px-4 sm:px-8 py-2 text-xs sm:text-sm font-bold rounded-lg transition-all ${viewTab === 'activity' ? 'bg-primary-600 text-white shadow-md' : 'text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700'}`}
                    >
                        <div className="flex items-center gap-2">
                            <History size={14} /> My Activity
                        </div>
                    </button>
                    <button
                        onClick={() => setViewTab('security')}
                        className={`px-4 sm:px-8 py-2 text-xs sm:text-sm font-bold rounded-lg transition-all ${viewTab === 'security' ? 'bg-primary-600 text-white shadow-md' : 'text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700'}`}
                    >
                        <div className="flex items-center gap-2">
                            <Lock size={14} /> Security
                        </div>
                    </button>
                </div>
            </div>

            {viewTab === 'activity' ? (
                <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden min-h-[400px]">
                    <div className="p-6 border-b border-gray-100 dark:border-gray-700">
                        <h5 className="font-bold text-gray-900 dark:text-white flex items-center gap-2">
                            <Activity className="text-primary-600" /> Recent Administrative Actions
                        </h5>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Your latest actions across the system portals.</p>
                    </div>
                    <div className="divide-y divide-gray-100 dark:divide-gray-700">
                        {recentLogs.length > 0 ? recentLogs.map(log => (
                            <div key={log.id} className="p-4 sm:p-6 hover:bg-gray-50 dark:hover:bg-gray-900/30 transition-colors flex flex-col sm:flex-row sm:items-center gap-4">
                                <div className="p-3 bg-primary-50 dark:bg-primary-900/20 text-primary-600 rounded-xl shrink-0 self-start sm:self-center">
                                    <Power size={20} />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-1">
                                        <span className={`px-2 py-0.5 text-[10px] font-black uppercase rounded bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300`}>{log.method}</span>
                                        <p className="text-sm font-bold text-gray-900 dark:text-white truncate">{log.label}</p>
                                    </div>
                                    <p className="text-xs text-gray-500 dark:text-gray-400 break-words">{log.details || 'No additional details provided.'}</p>
                                </div>
                                <div className="shrink-0 text-left sm:text-right">
                                    <p className="text-[11px] font-bold text-gray-500 dark:text-gray-400 uppercase">{formatDateLocal(log.createdAt)}</p>
                                    <p className="text-xs text-gray-400">{formatTimeLocal(log.createdAt)}</p>
                                </div>
                            </div>
                        )) : (
                            <div className="p-8 text-center flex flex-col items-center justify-center text-sm text-gray-500 dark:text-gray-400">
                                <History size={32} className="mb-4 opacity-50" />
                                No recent actions found on your account.
                            </div>
                        )}
                    </div>
                </div>
            ) : viewTab === 'info' ? (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
                    {/* Left Column: Photo & summary */}
                    <div className="lg:col-span-1 space-y-4 sm:space-y-6">
                        <div className="bg-white dark:bg-gray-800 p-6 sm:p-8 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm text-center relative">
                            <input 
                                type="file" 
                                ref={fileInputRef}
                                className="hidden" 
                                accept="image/*"
                                onChange={handlePhotoUpload}
                            />
                            <div 
                                className="relative inline-block mb-6 cursor-pointer group"
                                onClick={() => !uploading && fileInputRef.current?.click()}
                            >
                                {user.photo ? (
                                    <img
                                        src={getFileUrl(user.photo)}
                                        alt="Profile"
                                        className={`w-32 h-32 sm:w-40 sm:h-40 rounded-full object-cover mx-auto border-4 border-primary-50 dark:border-gray-700 shadow-xl transition-all ${uploading ? 'opacity-50' : 'group-hover:brightness-75'}`}
                                    />
                                ) : (
                                    <div className={`w-32 h-32 sm:w-40 sm:h-40 bg-primary-100 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 rounded-full flex items-center justify-center font-bold text-4xl sm:text-5xl mx-auto shadow-md border-4 border-primary-50 dark:border-primary-900/50 transition-all ${uploading ? 'opacity-50' : 'group-hover:brightness-75'}`}>
                                        {initials}
                                    </div>
                                )}
                                <div className="absolute inset-0 rounded-full bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                    <Camera className="text-white w-8 h-8" />
                                </div>
                                {uploading && (
                                    <div className="absolute inset-0 flex items-center justify-center rounded-full bg-white/50 dark:bg-black/50">
                                        <div className="w-8 h-8 rounded-full border-2 border-primary-600 border-t-transparent animate-spin"></div>
                                    </div>
                                )}
                                <div className="absolute bottom-1 right-1 p-1.5 bg-green-500 rounded-full border-4 border-white dark:border-gray-800" />
                            </div>
                            <h4 className="text-xl sm:text-2xl font-black text-gray-900 dark:text-white uppercase tracking-tight">
                                {user.firstName} {user.lastName}
                            </h4>
                            <div className="mt-2">
                                <span className={`px-4 py-1.5 text-[10px] font-black rounded-full uppercase tracking-widest bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400`}>
                                    {roleName}
                                </span>
                            </div>

                            <div className="mt-8 pt-6 border-t border-gray-100 dark:border-gray-700 grid grid-cols-1 gap-4 text-left">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-gray-50 dark:bg-gray-700 rounded-lg shrink-0">
                                        <Mail className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                                    </div>
                                    <div className="min-w-0">
                                        <p className="text-[10px] text-gray-400 dark:text-gray-500 uppercase font-black tracking-widest mb-0.5">Email Address</p>
                                        <p className="text-sm font-bold dark:text-gray-200 truncate">{user.email}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-gray-50 dark:bg-gray-700 rounded-lg shrink-0">
                                        <Globe className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                                    </div>
                                    <div>
                                        <p className="text-[10px] text-gray-400 dark:text-gray-500 uppercase font-black tracking-widest mb-0.5">Tenant ID</p>
                                        <p className="text-xs font-mono font-bold text-gray-500 dark:text-gray-400 truncate">{user.tenantId || 'Sytem Wide'}</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Right Column: Roles & Privileges */}
                    <div className="lg:col-span-2 space-y-4 sm:space-y-6">
                        <div className="bg-white dark:bg-gray-800 p-6 sm:p-8 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm relative overflow-hidden">
                            <div className="absolute top-0 right-0 p-6 opacity-5 pointer-events-none">
                                <Shield size={120} />
                            </div>
                            <div className="absolute top-0 left-0 w-1.5 h-full bg-primary-500"></div>
                            
                            <h5 className="font-black text-gray-900 dark:text-white mb-6 uppercase tracking-widest text-[10px] opacity-60">System Access Level</h5>
                            
                            <div className="space-y-6">
                                <div>
                                    <h6 className="text-sm font-bold text-gray-800 dark:text-gray-200 mb-2">Role Overview</h6>
                                    <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed max-w-2xl">
                                        You are signed in as a system-level administrator. This account overrides standard staff structures and directly manages core school configurations, security, and global roles. You do not require a separate HR Staff record to operate the system.
                                    </p>
                                </div>

                                <div className="border-t border-gray-100 dark:border-gray-700 pt-6">
                                    <h6 className="text-sm font-bold text-gray-800 dark:text-gray-200 mb-4">Granted Permissions</h6>
                                    
                                    {user.roleObject?.isSystem ? (
                                        <div className="p-4 bg-emerald-50 dark:bg-emerald-900/10 border border-emerald-100 dark:border-emerald-900/30 rounded-xl flex items-start gap-3">
                                            <Shield className="w-5 h-5 text-emerald-600 mt-0.5" />
                                            <div>
                                                <p className="text-sm font-bold text-emerald-900 dark:text-emerald-400">Unrestricted System Privileges</p>
                                                <p className="text-xs text-emerald-700 dark:text-emerald-500 mt-1">This role is hardcoded as a system-level super administrator. You have full recursive read, write, and delete permissions over all tenant modules and organizations.</p>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                            {user.roleObject?.permissions?.length ? user.roleObject.permissions.map((p: any) => (
                                                <div key={p.id} className="flex items-center gap-2 p-2 bg-gray-50 dark:bg-gray-700/50 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300">
                                                    <Key size={14} className="text-primary-500" />
                                                    <span className="truncate">{p.resource} • {p.action}</span>
                                                </div>
                                            )) : (
                                                <p className="text-sm text-gray-500 italic">No specific permissions explicitly attached. Role fallback active.</p>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                            <div className="col-span-1 sm:col-span-2 bg-gradient-to-br from-gray-900 to-gray-800 p-6 rounded-2xl shadow-sm relative overflow-hidden">
                                <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none text-white">
                                    <Activity size={120} />
                                </div>
                                <h5 className="font-black text-white mb-6 uppercase tracking-widest text-[10px] opacity-60 flex items-center gap-2">
                                    <Layout size={12} /> System Pulse Widget
                                </h5>
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                                    <div>
                                        <p className="text-[10px] text-gray-400 uppercase font-bold mb-1">Maintenance Mode</p>
                                        <p className="text-sm font-black text-white flex items-center gap-2">
                                            {settings?.isMaintenanceMode ? (
                                                <><span className="w-2 h-2 rounded-full bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.8)] animate-pulse"></span> Active / Restricted</>
                                            ) : (
                                                <><span className="w-2 h-2 rounded-full bg-green-500"></span> Disabled / Online</>
                                            )}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-[10px] text-gray-400 uppercase font-bold mb-1">Active Session</p>
                                        <p className="text-sm font-black text-white">{settings?.activeSessionName || 'Not Set'}</p>
                                    </div>
                                    <div>
                                        <p className="text-[10px] text-gray-400 uppercase font-bold mb-1">System State</p>
                                        <p className="text-sm font-black text-white">{settings?.isInitialized ? 'Fully Initialized' : 'Pending Setup'}</p>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-white dark:bg-gray-800 p-5 sm:p-6 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm flex items-center gap-4">
                                <div className="w-12 h-12 rounded-xl bg-blue-50 dark:bg-blue-900/20 flex flex-col items-center justify-center text-blue-600 dark:text-blue-400">
                                    <Activity size={20} />
                                </div>
                                <div>
                                    <p className="text-[10px] text-gray-400 dark:text-gray-500 uppercase font-black tracking-widest mb-0.5">Account Status</p>
                                    <p className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-2">
                                        <span className="w-2 h-2 rounded-full bg-green-500"></span> Active
                                    </p>
                                </div>
                            </div>
                            
                            <div className="bg-white dark:bg-gray-800 p-5 sm:p-6 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm flex items-center gap-4">
                                <div className="w-12 h-12 rounded-xl bg-purple-50 dark:bg-purple-900/20 flex flex-col items-center justify-center text-purple-600 dark:text-purple-400">
                                    <Calendar size={20} />
                                </div>
                                <div>
                                    <p className="text-[10px] text-gray-400 dark:text-gray-500 uppercase font-black tracking-widest mb-0.5">Account Creation</p>
                                    <p className="text-sm font-bold text-gray-900 dark:text-white">
                                        {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'System Default'}
                                    </p>
                                </div>
                            </div>
                        </div>

                    </div>
                </div>
            ) : (
                <div className="bg-white dark:bg-gray-800 p-6 sm:p-8 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm max-w-2xl">
                    <h5 className="font-bold text-gray-900 dark:text-white mb-2">Password & Security</h5>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-8 border-b border-gray-100 dark:border-gray-700 pb-4">
                        To update your password or enable further security layers like Two-Factor authentication, please visit the global security hub.
                    </p>

                    <div className="space-y-4">
                        <div className="flex justify-between items-center p-4 border border-gray-100 dark:border-gray-700 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                            <div>
                                <p className="font-bold text-gray-900 dark:text-white text-sm">Change Password</p>
                                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Update your account login password</p>
                            </div>
                            <a href="/change-password" className="px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-xs font-bold rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors">
                                Update
                            </a>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminProfilePage;
