import React, { useState, useEffect } from 'react';
import { Save, Loader2, Upload, Type, History } from 'lucide-react';
import cmsService, { CmsSection } from '@services/cms.service';
import { useSystem } from '@/context/SystemContext';
import { useToast } from '@/context/ToastContext';
import MediaSelectorModal from '../components/MediaSelectorModal';
import { Image as ImageIcon } from 'lucide-react';

const SectionManager: React.FC = () => {
  const [activeSection, setActiveSection] = useState<'about' | 'heritage'>('about');
  const [sectionData, setSectionData] = useState<CmsSection | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isMediaModalOpen, setIsMediaModalOpen] = useState(false);
  const { getFullUrl } = useSystem();
  const toast = useToast();

  const fetchSectionData = async (key: string) => {
    setLoading(true);
    try {
      const data = await cmsService.getSection(key);
      setSectionData(data);
    } catch (error) {
      toast.showError(`Failed to load ${key} data`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSectionData(activeSection);
  }, [activeSection]);

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sectionData) return;
    setSaving(true);
    try {
      await cmsService.updateSection(activeSection, {
        title: sectionData.title,
        content: sectionData.content,
        metadata: sectionData.metadata,
        imageUrl: sectionData.imageUrl,
      }, selectedFile || undefined);
      toast.showSuccess(`${activeSection.charAt(0).toUpperCase() + activeSection.slice(1)} updated successfully`);
      setSelectedFile(null);
      await fetchSectionData(activeSection);
    } catch (error) {
      toast.showError('Failed to update section');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="flex justify-center p-12"><Loader2 className="animate-spin text-primary-600" /></div>;

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center gap-3 border-b border-gray-100 dark:border-gray-800 pb-6">
        <button
          onClick={() => setActiveSection('about')}
          className={`flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-bold transition-all ${
            activeSection === 'about'
              ? 'bg-primary-600 text-white shadow-sm'
              : 'bg-white dark:bg-gray-800 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 border border-gray-100 dark:border-gray-700'
          }`}
        >
          <Type size={16} />
          About Us Section
        </button>
        <button
          onClick={() => setActiveSection('heritage')}
          className={`flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-bold transition-all ${
            activeSection === 'heritage'
              ? 'bg-primary-600 text-white shadow-sm'
              : 'bg-white dark:bg-gray-800 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 border border-gray-100 dark:border-gray-700'
          }`}
        >
          <History size={16} />
          Our Heritage
        </button>
      </div>

      <form onSubmit={handleUpdate} className="grid lg:grid-cols-2 gap-10">
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm space-y-6">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold uppercase text-gray-400 tracking-wider pl-1">Section Title</label>
            <input
              type="text"
              value={sectionData?.title || ''}
              onChange={(e) => setSectionData(prev => prev ? { ...prev, title: e.target.value } : null)}
              className="w-full px-4 py-2.5 rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 text-sm focus:ring-2 focus:ring-primary-500 outline-none transition-all shadow-sm"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-semibold uppercase text-gray-400 tracking-wider pl-1">Content / Description</label>
            <textarea
              value={sectionData?.content || ''}
              onChange={(e) => setSectionData(prev => prev ? { ...prev, content: e.target.value } : null)}
              rows={10}
              className="w-full px-4 py-2.5 rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 text-sm focus:ring-2 focus:ring-primary-500 outline-none transition-all resize-none shadow-sm"
            ></textarea>
          </div>

          {activeSection === 'heritage' && (
            <div className="space-y-6 pt-6 border-t border-gray-100 dark:border-gray-800">
              <h4 className="text-sm font-bold text-gray-900 dark:text-white uppercase tracking-wider">Heritage Metadata</h4>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Quote Text</label>
                  <input
                    type="text"
                    value={sectionData?.metadata?.quote || ''}
                    onChange={(e) => setSectionData(prev => prev ? { ...prev, metadata: { ...prev.metadata, quote: e.target.value } } : null)}
                    className="w-full px-4 py-2.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm focus:ring-2 focus:ring-primary-500 outline-none transition-all shadow-sm"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Quote Author</label>
                  <input
                    type="text"
                    value={sectionData?.metadata?.author || ''}
                    onChange={(e) => setSectionData(prev => prev ? { ...prev, metadata: { ...prev.metadata, author: e.target.value } } : null)}
                    className="w-full px-4 py-2.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm focus:ring-2 focus:ring-primary-500 outline-none transition-all shadow-sm"
                  />
                </div>
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={saving}
            className="flex items-center gap-2 bg-primary-600 hover:bg-primary-700 text-white px-8 py-2.5 rounded-lg font-bold transition-all shadow-sm active:scale-95 disabled:opacity-50"
          >
            {saving ? <Loader2 className="animate-spin w-4 h-4" /> : <Save size={18} />}
            Save Changes
          </button>
        </div>

        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm space-y-6">
          <label className="text-xs font-semibold uppercase text-gray-400 tracking-wider pl-1">Section Image</label>
          <div className="relative aspect-[4/5] rounded-lg overflow-hidden bg-gray-50 dark:bg-gray-900 border border-gray-100 dark:border-gray-700 group">
            {selectedFile ? (
              <img src={URL.createObjectURL(selectedFile)} alt="Preview" className="w-full h-full object-cover" />
            ) : sectionData?.imageUrl ? (
              <img src={getFullUrl(sectionData.imageUrl)} alt="Section" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center text-slate-400 space-y-4">
                <Upload size={48} className="opacity-20" />
                <span className="font-bold text-sm">No image uploaded</span>
              </div>
            )}
            
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-all duration-300 flex flex-col items-center justify-center gap-3 backdrop-blur-[2px]">
              <label className="bg-white text-gray-900 px-6 py-2.5 rounded-lg font-bold flex items-center gap-2 shadow-sm cursor-pointer hover:bg-gray-50 transition-colors">
                <Upload size={18} className="text-primary-600" />
                {sectionData?.imageUrl ? 'Replace' : 'Upload'}
                <input type="file" className="hidden" accept="image/*" onChange={(e) => {
                  setSelectedFile(e.target.files?.[0] || null);
                }} />
              </label>
              <button 
                type="button"
                onClick={() => setIsMediaModalOpen(true)}
                className="bg-white text-gray-900 px-6 py-2.5 rounded-lg font-bold flex items-center gap-2 shadow-sm hover:bg-gray-50 transition-colors"
              >
                <ImageIcon size={18} className="text-primary-600" />
                From Library
              </button>
            </div>
          </div>
          <p className="text-[10px] text-gray-400 text-center italic">Best size: 800x1000px (4:5)</p>
        </div>
      </form>
      <MediaSelectorModal 
        isOpen={isMediaModalOpen}
        onClose={() => setIsMediaModalOpen(false)}
        onSelect={(media) => {
          if (sectionData) setSectionData({ ...sectionData, imageUrl: media.url });
          setSelectedFile(null);
        }}
      />
    </div>
  );
};

export default SectionManager;
