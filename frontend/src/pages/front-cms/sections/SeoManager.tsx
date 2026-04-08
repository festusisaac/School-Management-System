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
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                        <Globe className="text-primary-600" size={24} />
                        SEO & Social Meta
                    </h2>
                    <p className="text-sm text-slate-500 mt-1">
                        Control how your school appears on Google, WhatsApp, Facebook, and Twitter.
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

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Search Engine Optimization */}
                <div className="space-y-6">
                    <div className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-sm space-y-6">
                        <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                            <Search size={16} className="text-primary-600" />
                            Search Engine Visibility
                        </h3>

                        <div className="space-y-2">
                            <label className="text-xs font-bold text-slate-700 flex items-center gap-2 ml-1">
                                Meta Title
                                <span title="Visible in browser tab and Google results.">
                                    <HelpCircle size={14} className="text-slate-300" />
                                </span>
                            </label>
                            <input
                                type="text"
                                value={formData.seoTitle}
                                onChange={(e) => setFormData(prev => ({ ...prev, seoTitle: e.target.value }))}
                                placeholder="e.g. Phoenix Heart Junior College - Excellence in Education"
                                className="w-full px-5 py-3.5 rounded-2xl bg-slate-50 border-none focus:ring-2 focus:ring-primary-500 transition-all font-medium text-slate-700 shadow-inner"
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs font-bold text-slate-700 flex items-center gap-2 ml-1">
                                Meta Description
                            </label>
                            <textarea
                                value={formData.seoDescription}
                                onChange={(e) => setFormData(prev => ({ ...prev, seoDescription: e.target.value }))}
                                placeholder="Provide a brief summary of your school (150-160 characters suggested)."
                                className="w-full px-5 py-3.5 rounded-2xl bg-slate-50 border-none focus:ring-2 focus:ring-primary-500 transition-all font-medium text-slate-700 shadow-inner resize-none"
                                rows={4}
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs font-bold text-slate-700 flex items-center gap-2 ml-1">
                                Keywords
                            </label>
                            <input
                                type="text"
                                value={formData.seoKeywords}
                                onChange={(e) => setFormData(prev => ({ ...prev, seoKeywords: e.target.value }))}
                                placeholder="e.g. education, high school, best school in Nigeria"
                                className="w-full px-5 py-3.5 rounded-2xl bg-slate-50 border-none focus:ring-2 focus:ring-primary-500 transition-all font-medium text-slate-700 shadow-inner"
                            />
                        </div>

                        {/* Google Preview */}
                        <div className="mt-8 p-6 bg-slate-50 rounded-2xl border border-slate-100">
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter mb-4">Google Search Preview</p>
                            <div className="space-y-1">
                                <h4 className="text-[#1a0dab] text-xl font-medium hover:underline cursor-pointer truncate">
                                    {formData.seoTitle || settings?.schoolName || 'Your School Title'}
                                </h4>
                                <p className="text-[#006621] text-sm truncate">
                                    {window.location.origin} › landing
                                </p>
                                <p className="text-[#545454] text-sm line-clamp-2 leading-relaxed">
                                    {formData.seoDescription || 'Add a meta description to see how your school appears in Google search results.'}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Social Media Preview */}
                <div className="space-y-6">
                    <div className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-sm space-y-6">
                        <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                            <Share2 size={16} className="text-primary-600" />
                            Social Sharing (WhatsApp/Facebook)
                        </h3>

                        <div className="space-y-4">
                            <label className="text-xs font-bold text-slate-700 flex items-center gap-2 ml-1">
                                Social Share Image (OpenGraph)
                                <ImageIcon size={14} className="text-slate-300" />
                            </label>
                            
                            <div className="relative group">
                                <div className="aspect-[1200/630] w-full bg-slate-100 rounded-2xl overflow-hidden border-2 border-dashed border-slate-200 flex flex-col items-center justify-center gap-2">
                                    {formData.ogImage ? (
                                        <img src={getFullUrl(formData.ogImage)} alt="Social preview" className="w-full h-full object-cover" />
                                    ) : (
                                        <>
                                            <ImageIcon size={40} className="text-slate-300" />
                                            <p className="text-xs font-bold text-slate-400 uppercase tracking-tighter">1200 x 630 Suggested</p>
                                        </>
                                    )}
                                    <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                        <label className="bg-white text-slate-900 px-4 py-2 rounded-xl text-xs font-bold cursor-pointer hover:scale-105 transition-transform shadow-xl">
                                            {formData.ogImage ? 'Change Image' : 'Upload Image'}
                                            <input type="file" className="hidden" accept="image/*" onChange={handleImageUpload} />
                                        </label>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* WhatsApp / Facebook Preview Card */}
                        <div className="mt-8 border border-slate-100 rounded-2xl overflow-hidden shadow-2xl shadow-slate-200">
                            <div className="bg-slate-50 p-2 border-b border-slate-100 flex items-center gap-2">
                                <div className="w-2 h-2 rounded-full bg-red-400"></div>
                                <div className="w-2 h-2 rounded-full bg-yellow-400"></div>
                                <div className="w-2 h-2 rounded-full bg-green-400"></div>
                                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest pl-2">Social Preview</span>
                            </div>
                            <div className="bg-white">
                                <div className="aspect-[1200/630] bg-slate-200 overflow-hidden">
                                    {formData.ogImage && <img src={getFullUrl(formData.ogImage)} alt="OG" className="w-full h-full object-cover" />}
                                </div>
                                <div className="p-5 bg-[#f0f2f5] space-y-1">
                                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">PHJCSCHOOL.EDU.NG</p>
                                    <h4 className="text-lg font-bold text-slate-900 line-clamp-1">
                                        {formData.seoTitle || settings?.schoolName}
                                    </h4>
                                    <p className="text-sm text-slate-500 line-clamp-1">
                                        {formData.seoDescription || 'Visit our official website for admissions and updates.'}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="bg-amber-50 border border-amber-100 p-6 rounded-[2rem]">
                        <div className="flex gap-4">
                            <AlertCircle className="text-amber-500 shrink-0" size={24} />
                            <div className="space-y-1">
                                <h4 className="text-sm font-black text-amber-900 uppercase tracking-widest">SEO Tip</h4>
                                <p className="text-xs text-amber-700 leading-relaxed font-medium">
                                    Search engines can take 24–48 hours to update their records. Social media previews (like WhatsApp) can be cached; try testing with a <b>brand new link</b> if changes don't appear immediately.
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
