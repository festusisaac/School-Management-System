import { useState, useEffect } from 'react';
import { 
  Globe, 
  Save, 
  Search, 
  Share2, 
  Image as ImageIcon,
  AlertCircle,
  HelpCircle
} from 'lucide-react';
import { useSystem } from '../../../context/SystemContext';
import { useToast } from '../../../context/ToastContext';
import systemService from '../../../services/systemService';

const SeoManager = () => {
    const { settings, refreshSettings, getFullUrl } = useSystem();
    const { showToast } = useToast();
    const [loading, setLoading] = useState(false);
    
    const [formData, setFormData] = useState({
        seoTitle: '',
        seoDescription: '',
        seoKeywords: '',
        ogImage: ''
    });

    useEffect(() => {
        if (settings) {
            setFormData({
                seoTitle: settings.seoTitle || '',
                seoDescription: settings.seoDescription || '',
                seoKeywords: settings.seoKeywords || '',
                ogImage: settings.ogImage || ''
            });
        }
    }, [settings]);

    const handleSave = async () => {
        setLoading(true);
        try {
            await systemService.updateSettings(formData);
            await refreshSettings();
            showToast('SEO settings updated successfully', 'success');
        } catch (error) {
            console.error('Update failed:', error);
            showToast('Failed to update SEO settings', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const uploadFormData = new FormData();
        uploadFormData.append('file', file);
        
        try {
            const response = await systemService.updateSettingsFile('ogImage', uploadFormData);
            setFormData(prev => ({ ...prev, ogImage: response.ogImage ?? '' }));
            showToast('Social sharing image uploaded', 'success');
        } catch (error) {
            showToast('Image upload failed', 'error');
        }
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

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Search Engine Optimization */}
                <div className="space-y-6">
                    <div className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm space-y-6">
                        <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
                            <Search size={14} className="text-primary-600" />
                            Search Visibility
                        </h3>

                        <div className="space-y-2">
                            <input
                                type="text"
                                value={formData.seoTitle}
                                onChange={(e) => setFormData(prev => ({ ...prev, seoTitle: e.target.value }))}
                                placeholder="Site Title"
                                className="w-full px-4 py-2.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 focus:ring-2 focus:ring-primary-500 outline-none text-gray-700 dark:text-gray-300 font-medium shadow-sm transition-all"
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs font-bold text-gray-700 dark:text-gray-300 flex items-center gap-2 ml-1">
                                Meta Description
                            </label>
                            <textarea
                                value={formData.seoDescription}
                                onChange={(e) => setFormData(prev => ({ ...prev, seoDescription: e.target.value }))}
                                placeholder="Brief overview..."
                                className="w-full px-4 py-2.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 focus:ring-2 focus:ring-primary-500 outline-none text-gray-700 dark:text-gray-300 font-medium shadow-sm transition-all resize-none"
                                rows={4}
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs font-bold text-gray-700 dark:text-gray-300 flex items-center gap-2 ml-1">
                                Keywords
                            </label>
                            <input
                                type="text"
                                value={formData.seoKeywords}
                                onChange={(e) => setFormData(prev => ({ ...prev, seoKeywords: e.target.value }))}
                                placeholder="education, school..."
                                className="w-full px-4 py-2.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 focus:ring-2 focus:ring-primary-500 outline-none text-gray-700 dark:text-gray-300 font-medium shadow-sm transition-all"
                            />
                        </div>

                        {/* Google Preview */}
                        <div className="mt-8 p-6 bg-gray-50 dark:bg-gray-900/50 rounded-xl border border-gray-100 dark:border-gray-700 shadow-inner">
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-4">Search Preview</p>
                            <div className="space-y-1">
                                <h4 className="text-[#1a0dab] dark:text-blue-400 text-lg font-medium hover:underline cursor-pointer truncate">
                                    {formData.seoTitle || 'Site Title'}
                                </h4>
                                <p className="text-[#006621] dark:text-green-400 text-sm truncate">
                                    {window.location.origin}
                                </p>
                                <p className="text-[#545454] dark:text-gray-400 text-sm line-clamp-2 leading-relaxed">
                                    {formData.seoDescription || 'Description...'}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Social Media Preview */}
                <div className="space-y-6">
                    <div className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm space-y-6">
                        <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
                            <Share2 size={14} className="text-primary-600" />
                            Social Sharing
                        </h3>

                        <div className="space-y-4">
                            <label className="text-xs font-bold text-gray-700 dark:text-gray-300 flex items-center gap-2 ml-1">
                                Social Banner Image
                            </label>
                            
                            <div className="relative group">
                                <div className="aspect-[1200/630] w-full bg-gray-50 dark:bg-gray-900 rounded-lg overflow-hidden border-2 border-dashed border-gray-200 dark:border-gray-700 flex flex-col items-center justify-center gap-2">
                                    {formData.ogImage ? (
                                        <img src={getFullUrl(formData.ogImage)} alt="Social" className="w-full h-full object-cover" />
                                    ) : (
                                        <>
                                            <ImageIcon size={32} className="text-gray-300" />
                                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">1200 x 630</p>
                                        </>
                                    )}
                                    <div className="absolute inset-0 bg-gray-900/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                        <label className="bg-white text-gray-900 px-4 py-2 rounded-lg text-xs font-bold cursor-pointer transition-transform shadow-sm">
                                            {formData.ogImage ? 'Change' : 'Upload'}
                                            <input type="file" className="hidden" accept="image/*" onChange={handleImageUpload} />
                                        </label>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* WhatsApp / Facebook Preview Card */}
                        <div className="mt-8 border border-gray-100 dark:border-gray-700 rounded-lg overflow-hidden shadow-sm">
                            <div className="bg-gray-50 dark:bg-gray-900 p-2 border-b border-gray-100 dark:border-gray-700 flex items-center gap-2 text-[10px] font-bold text-gray-400 uppercase px-3">
                                Preview
                            </div>
                            <div className="bg-white dark:bg-gray-800">
                                <div className="aspect-[1200/630] bg-gray-100 dark:bg-gray-700 overflow-hidden">
                                    {formData.ogImage && <img src={getFullUrl(formData.ogImage)} alt="OG" className="w-full h-full object-cover" />}
                                </div>
                                <div className="p-4 bg-gray-50 dark:bg-gray-900/50 space-y-1">
                                    <h4 className="text-sm font-bold text-gray-900 dark:text-white line-clamp-1">
                                        {formData.seoTitle || settings?.schoolName}
                                    </h4>
                                    <p className="text-xs text-gray-500 line-clamp-1">
                                        {formData.seoDescription || 'Visit our site...'}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="bg-primary-50 dark:bg-primary-900/10 border border-primary-100 dark:border-primary-900/30 p-6 rounded-xl">
                        <div className="flex gap-4">
                            <AlertCircle className="text-primary-500 shrink-0" size={20} />
                            <div className="space-y-1">
                                <h4 className="text-xs font-bold text-primary-900 dark:text-primary-100 uppercase tracking-widest">SEO Tip</h4>
                                <p className="text-[11px] text-primary-700 dark:text-primary-300 leading-relaxed font-medium">
                                    Search engines can take 24–48 hours to update their records. Social media previews can be cached; try a brand new browser tab to see changes.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SeoManager;
