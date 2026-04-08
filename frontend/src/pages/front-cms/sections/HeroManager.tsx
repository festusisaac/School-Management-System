import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Save, Loader2, Upload, Image as ImageIcon } from 'lucide-react';
import cmsService, { CmsHero } from '@services/cms.service';
import { useSystem } from '@/context/SystemContext';
import { useToast } from '@/context/ToastContext';
import MediaSelectorModal from '../components/MediaSelectorModal';

const HeroManager: React.FC = () => {
  const [hero, setHero] = useState<CmsHero | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { getFullUrl } = useSystem();
  const toast = useToast();
  const [isMediaModalOpen, setIsMediaModalOpen] = useState(false);

  const fetchHeroData = async () => {
    try {
      const data = await cmsService.getHero();
      setHero(data);
    } catch (error) {
      toast.showError('Failed to load hero data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHeroData();
  }, []);

  const handleUpdateHero = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!hero) return;
    setSaving(true);
    try {
      await cmsService.updateHero({
        title: hero.title,
        subtitle: hero.subtitle,
        welcomeText: hero.welcomeText,
      });
      toast.showSuccess('Hero text updated successfully');
    } catch (error) {
      toast.showError('Failed to update hero text');
    } finally {
      setSaving(false);
    }
  };

  const handleUploadImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      await cmsService.addCarouselImage(file);
      await fetchHeroData();
      toast.showSuccess('Image added to carousel');
    } catch (error) {
      toast.showError('Failed to upload image');
    }
  };

  const handleRemoveImage = async (id: number) => {
    if (!window.confirm('Remove this image from carousel?')) return;
    try {
      await cmsService.removeCarouselImage(id);
      await fetchHeroData();
      toast.showSuccess('Image removed');
    } catch (error) {
      toast.showError('Failed to remove image');
    }
  };

  if (loading) return <div className="flex justify-center p-12"><Loader2 className="animate-spin text-primary-600" /></div>;

  return (
    <div className="space-y-10">
      <div className="grid lg:grid-cols-2 gap-10">
        {/* Text Content Form */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm space-y-6">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white border-b border-gray-100 dark:border-gray-700 pb-4">Hero Content</h3>
          <form onSubmit={handleUpdateHero} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase text-gray-400 tracking-wider pl-1">Tagline / Welcome Text</label>
              <input
                type="text"
                value={hero?.welcomeText || ''}
                onChange={(e) => setHero(prev => prev ? { ...prev, welcomeText: e.target.value } : null)}
                placeholder="Excellence in Education"
                className="w-full px-4 py-2.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm focus:ring-2 focus:ring-primary-500 outline-none transition-all resize-none"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase text-gray-400 tracking-wider pl-1">Main Heading</label>
              <input
                type="text"
                value={hero?.title || ''}
                onChange={(e) => setHero(prev => prev ? { ...prev, title: e.target.value } : null)}
                placeholder="Nurturing Leaders of Tomorrow"
                className="w-full px-4 py-2.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm focus:ring-2 focus:ring-primary-500 outline-none transition-all resize-none"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase text-gray-400 tracking-wider pl-1">Sub-heading / Description</label>
              <textarea
                value={hero?.subtitle || ''}
                onChange={(e) => setHero(prev => prev ? { ...prev, subtitle: e.target.value } : null)}
                rows={3}
                placeholder="Welcome to our school, where we combine academic rigor..."
                className="w-full px-4 py-2.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm focus:ring-2 focus:ring-primary-500 outline-none transition-all resize-none"
              ></textarea>
            </div>
            <button
              type="submit"
              disabled={saving}
              className="flex items-center gap-2 bg-primary-600 hover:bg-primary-700 text-white px-6 py-2.5 rounded-lg font-bold transition-all shadow-sm active:scale-95 disabled:opacity-50"
            >
              {saving ? <Loader2 className="animate-spin w-4 h-4" /> : <Save size={18} />}
              Save Changes
            </button>
          </form>
        </div>

        {/* Carousel Manager */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm space-y-6">
          <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-700 pb-4">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white">Carousel Images</h3>
            <div className="flex items-center gap-2">
              <label className="cursor-pointer flex items-center gap-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 px-3 py-2 rounded-lg text-xs font-bold text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 transition-all shadow-sm">
                <Upload size={14} className="text-primary-600" />
                Upload
                <input type="file" className="hidden" accept="image/*" onChange={handleUploadImage} />
              </label>
              <button 
                onClick={() => setIsMediaModalOpen(true)}
                className="flex items-center gap-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 px-3 py-2 rounded-lg text-xs font-bold text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 transition-all shadow-sm"
              >
                <ImageIcon size={14} className="text-primary-600" />
                Library
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {hero?.carouselImages?.map((img) => (
              <div key={img.id} className="relative group rounded-lg overflow-hidden aspect-video bg-gray-50 dark:bg-gray-800 border border-gray-100 dark:border-gray-700">
                <img src={getFullUrl(img.imageUrl)} alt="Slide" className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <button
                    onClick={() => handleRemoveImage(img.id)}
                    className="p-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors shadow-lg"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
            ))}
            {(!hero?.carouselImages || hero.carouselImages.length === 0) && (
              <div className="col-span-2 py-12 text-center text-gray-400 bg-gray-50 dark:bg-gray-800/50 rounded-lg border-2 border-dashed border-gray-200 dark:border-gray-700">
                No images in carousel.
              </div>
            )}
          </div>
        </div>
      </div>
      <MediaSelectorModal 
        isOpen={isMediaModalOpen}
        onClose={() => setIsMediaModalOpen(false)}
        onSelect={async (media) => {
          try {
            setSaving(true);
            await cmsService.addCarouselImage(media.url);
            toast.showSuccess('Image added from library');
            fetchHeroData();
          } catch (error) {
            toast.showError('Failed to add image');
          } finally {
            setSaving(false);
          }
        }}
      />
    </div>
  );
};

export default HeroManager;
