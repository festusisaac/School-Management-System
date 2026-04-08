import React, { useState, useEffect } from 'react';
import { 
  Megaphone, 
  Save, 
  Trash2, 
  Link as LinkIcon,
  ToggleLeft,
  ToggleRight,
  AlertCircle,
  HelpCircle
} from 'lucide-react';
import { useSystem } from '../../../context/SystemContext';
import { useToast } from '../../../context/ToastContext';
import systemService from '../../../services/systemService';

const NoticeManager = () => {
    const { settings, refreshSettings } = useSystem();
    const { showToast } = useToast();
    const [loading, setLoading] = useState(false);
    
    const [formData, setFormData] = useState({
        isNoticeActive: false,
        noticeText: '',
        noticeLink: ''
    });

    useEffect(() => {
        if (settings) {
            setFormData({
                isNoticeActive: settings.isNoticeActive || false,
                noticeText: settings.noticeText || '',
                noticeLink: settings.noticeLink || ''
            });
        }
    }, [settings]);

    const handleSave = async () => {
        if (formData.isNoticeActive && !formData.noticeText.trim()) {
            showToast('Please provide notice text if the bar is active', 'error');
            return;
        }

        setLoading(true);
        try {
            await systemService.updateSettings(formData);
            await refreshSettings();
            showToast('Announcement Bar updated successfully', 'success');
        } catch (error) {
            console.error('Update failed:', error);
            showToast('Failed to update announcement bar', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleToggle = () => {
        setFormData(prev => ({ ...prev, isNoticeActive: !prev.isNoticeActive }));
    };

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Header section */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                        <Megaphone className="text-primary-600" size={24} />
                        Announcement Bar
                    </h2>
                    <p className="text-sm text-slate-500 mt-1">
                        Display a high-visibility message at the very top of your landing page for urgent updates.
                    </p>
                </div>
                <button
                    onClick={handleSave}
                    disabled={loading}
                    className="flex items-center justify-center gap-2 bg-primary-600 hover:bg-primary-700 disabled:bg-primary-300 text-white px-6 py-2.5 rounded-xl font-semibold transition-all shadow-lg shadow-primary-200 active:scale-95"
                >
                    {loading ? (
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                        <Save size={18} />
                    )}
                    Save Changes
                </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Configuration Card */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-6">
                        {/* Toggle Section */}
                        <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-100">
                            <div className="flex items-center gap-3">
                                <div className={`p-2 rounded-lg ${formData.isNoticeActive ? 'bg-primary-100 text-primary-600' : 'bg-slate-200 text-slate-500'}`}>
                                    <Megaphone size={20} />
                                </div>
                                <div>
                                    <h3 className="font-bold text-slate-900 text-sm">Status</h3>
                                    <p className="text-xs text-slate-500">{formData.isNoticeActive ? 'Enabled - Visible to visitors' : 'Disabled - Hidden from visitors'}</p>
                                </div>
                            </div>
                            <button 
                                onClick={handleToggle}
                                className="transition-transform active:scale-90"
                            >
                                {formData.isNoticeActive ? (
                                    <ToggleRight size={44} className="text-primary-600" />
                                ) : (
                                    <ToggleLeft size={44} className="text-slate-300" />
                                )}
                            </button>
                        </div>

                        {/* Text Content */}
                        <div className="space-y-2">
                            <label className="text-sm font-bold text-slate-700 flex items-center gap-2">
                                Announcement Text
                                <HelpCircle size={14} className="text-slate-400" title="Keep it short and impactful" />
                            </label>
                            <textarea
                                value={formData.noticeText}
                                onChange={(e) => setFormData(prev => ({ ...prev, noticeText: e.target.value }))}
                                placeholder="e.g. Admissions for 2026/2027 are now open! Apply today."
                                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all outline-none text-slate-700 font-medium resize-none"
                                rows={3}
                            />
                        </div>

                        {/* Action Link */}
                        <div className="space-y-2">
                            <label className="text-sm font-bold text-slate-700 flex items-center gap-2">
                                Action Link (Optional)
                                <LinkIcon size={14} className="text-slate-400" />
                            </label>
                            <input
                                type="text"
                                value={formData.noticeLink}
                                onChange={(e) => setFormData(prev => ({ ...prev, noticeLink: e.target.value }))}
                                placeholder="e.g. /admission or https://external-link.com"
                                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all outline-none text-slate-700 font-medium"
                            />
                            <p className="text-[10px] text-slate-400 pl-1 italic">
                                Add a button link like '/admission' to direct users to a specific page.
                            </p>
                        </div>
                    </div>
                </div>

                {/* Preview / Instructions Card */}
                <div className="space-y-6">
                    <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800 shadow-xl overflow-hidden relative group">
                        <div className="absolute top-0 right-0 p-4 opacity-10">
                            <Megaphone size={80} className="text-white rotate-12" />
                        </div>
                        
                        <h3 className="text-white font-bold mb-4 flex items-center gap-2 tracking-wide uppercase text-xs">
                            Live Preview
                        </h3>
                        
                        {formData.isNoticeActive ? (
                            <div className="space-y-4 relative z-10">
                                <div className="bg-primary-600 rounded-lg p-3 border border-primary-500/30 text-center animate-pulse-subtle">
                                    <p className="text-white text-xs font-bold leading-tight">
                                        {formData.noticeText || 'Your announcement will appear here...'}
                                    </p>
                                    {formData.noticeLink && (
                                        <div className="mt-2 inline-block bg-white text-primary-600 text-[10px] px-2 py-0.5 rounded font-black uppercase ring-2 ring-primary-400/20">
                                            Learn More
                                        </div>
                                    )}
                                </div>
                                <p className="text-[10px] text-slate-400 text-center italic">
                                    Preview of how it looks at the top of the page.
                                </p>
                            </div>
                        ) : (
                            <div className="h-24 flex flex-col items-center justify-center border-2 border-dashed border-slate-700 rounded-xl space-y-2 opacity-50">
                                <AlertCircle className="text-slate-500" size={24} />
                                <p className="text-xs text-slate-500 font-medium tracking-wide uppercase">Notice is Disabled</p>
                            </div>
                        )}
                    </div>

                    <div className="bg-blue-50 border border-blue-100 p-5 rounded-2xl">
                        <div className="flex gap-3">
                            <HelpCircle className="text-blue-500 shrink-0" size={20} />
                            <div>
                                <h4 className="text-sm font-bold text-blue-900 mb-1">Effective Usage</h4>
                                <ul className="text-xs text-blue-700 space-y-2 list-disc pl-4">
                                    <li>Use for internal news, holidays, or admission alerts.</li>
                                    <li>Keep messages under 80 characters for best mobile visibility.</li>
                                    <li>Only <b>one</b> announcement can be active at a time.</li>
                                </ul>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default NoticeManager;
