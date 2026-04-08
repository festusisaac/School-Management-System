import { useState, useEffect } from 'react';
import { 
  Megaphone, 
  Save, 
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
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
                <div />
                <button
                    onClick={handleSave}
                    disabled={loading}
                    className="flex items-center justify-center gap-2 bg-primary-600 hover:bg-primary-700 disabled:bg-primary-300 text-white px-6 py-2.5 rounded-lg font-bold transition-all shadow-sm active:scale-95"
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
                    <div className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm space-y-6">
                        {/* Toggle Section */}
                        <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-900/50 rounded-lg border border-gray-100 dark:border-gray-700">
                            <div className="flex items-center gap-3">
                                <div className={`p-2 rounded-lg ${formData.isNoticeActive ? 'bg-primary-100 dark:bg-primary-900/30 text-primary-600' : 'bg-gray-200 dark:bg-gray-700 text-gray-500'}`}>
                                    <Megaphone size={20} />
                                </div>
                                <div>
                                    <h3 className="font-bold text-gray-900 dark:text-white text-sm">Status</h3>
                                    <p className="text-xs text-gray-500">{formData.isNoticeActive ? 'Enabled - Visible to visitors' : 'Disabled - Hidden'}</p>
                                </div>
                            </div>
                            <button 
                                onClick={handleToggle}
                                className="transition-transform active:scale-90"
                            >
                                {formData.isNoticeActive ? (
                                    <ToggleRight size={40} className="text-primary-600" />
                                ) : (
                                    <ToggleLeft size={40} className="text-gray-300 dark:text-gray-600" />
                                )}
                            </button>
                        </div>

                        {/* Text Content */}
                        <div className="space-y-2">
                            <label className="text-sm font-bold text-gray-700 dark:text-gray-300 flex items-center gap-2">
                                Announcement Text
                            </label>
                            <textarea
                                value={formData.noticeText}
                                onChange={(e) => setFormData(prev => ({ ...prev, noticeText: e.target.value }))}
                                placeholder="e.g. Admissions for 2026/2027 are now open!"
                                className="w-full px-4 py-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 focus:ring-2 focus:ring-primary-500 outline-none text-gray-700 dark:text-gray-300 font-medium resize-none shadow-sm transition-all"
                                rows={3}
                            />
                        </div>

                        {/* Action Link */}
                        <div className="space-y-2">
                            <label className="text-sm font-bold text-gray-700 dark:text-gray-300 flex items-center gap-2">
                                Action Link (Optional)
                            </label>
                            <input
                                type="text"
                                value={formData.noticeLink}
                                onChange={(e) => setFormData(prev => ({ ...prev, noticeLink: e.target.value }))}
                                placeholder="/admission"
                                className="w-full px-4 py-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 focus:ring-2 focus:ring-primary-500 outline-none text-gray-700 dark:text-gray-300 font-medium shadow-sm transition-all"
                            />
                        </div>
                    </div>
                </div>

                {/* Preview / Instructions Card */}
                <div className="space-y-6">
                    <div className="bg-gray-900 dark:bg-black p-6 rounded-xl border border-gray-800 shadow-sm overflow-hidden relative">
                        <div className="absolute top-0 right-0 p-4 opacity-10">
                            <Megaphone size={80} className="text-white rotate-12" />
                        </div>
                        
                        <h3 className="text-white/50 font-bold mb-4 flex items-center gap-2 tracking-wide uppercase text-[10px]">
                            Live Preview
                        </h3>
                        
                        {formData.isNoticeActive ? (
                            <div className="space-y-4 relative z-10">
                                <div className="bg-primary-600 rounded-lg p-3 text-center">
                                    <p className="text-white text-xs font-bold leading-tight">
                                        {formData.noticeText || 'Announcement text...'}
                                    </p>
                                    {formData.noticeLink && (
                                        <div className="mt-2 inline-block bg-white text-primary-600 text-[10px] px-2 py-0.5 rounded font-bold uppercase">
                                            Learn More
                                        </div>
                                    )}
                                </div>
                            </div>
                        ) : (
                            <div className="h-24 flex flex-col items-center justify-center border border-dashed border-gray-800 rounded-lg space-y-2 opacity-50">
                                <AlertCircle className="text-gray-500" size={24} />
                                <p className="text-[10px] text-gray-500 font-bold tracking-wide uppercase">Notice Hidden</p>
                            </div>
                        )}
                    </div>

                    <div className="bg-primary-50 dark:bg-primary-900/10 border border-primary-100 dark:border-primary-900/30 p-5 rounded-xl">
                        <div className="flex gap-3">
                            <HelpCircle className="text-primary-500 shrink-0" size={18} />
                            <div>
                                <h4 className="text-sm font-bold text-primary-900 dark:text-primary-100 mb-1">Tips</h4>
                                <ul className="text-[11px] text-primary-700 dark:text-primary-300 space-y-2 list-disc pl-4">
                                    <li>Use for internal news, holidays, or admission alerts.</li>
                                    <li>Keep messages under 80 characters for best visibility.</li>
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
