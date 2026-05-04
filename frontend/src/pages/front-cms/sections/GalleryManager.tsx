import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Loader2, Upload, Video as VideoIcon, Image as ImageIcon, Play, Youtube } from 'lucide-react';
import cmsService, { CmsGalleryItem } from '@services/cms.service';
import { useSystem } from '@/context/SystemContext';
import { useToast } from '@/context/ToastContext';
import MediaSelectorModal from '../components/MediaSelectorModal';

const GalleryManager: React.FC = () => {
  const [items, setItems] = useState<CmsGalleryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [newItem, setNewItem] = useState<{ title: string; category: string; imageUrl?: string; type: 'image' | 'video'; videoUrl?: string }>({ 
    title: '', 
    category: '', 
    type: 'image' 
  });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isMediaModalOpen, setIsMediaModalOpen] = useState(false);
  const { getFullUrl } = useSystem();
  const toast = useToast();

  const renderVideo = (url: string, className: string, isHovered: boolean = false) => {
    if (!url) return null;

    // YouTube
    const youtubeRegExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const youtubeMatch = url.match(youtubeRegExp);
    const youtubeId = (youtubeMatch && youtubeMatch[2].length === 11) ? youtubeMatch[2] : null;

    if (youtubeId) {
      const autoplayParam = isHovered ? 'autoplay=1' : 'autoplay=0';
      return (
        <iframe
          src={`https://www.youtube.com/embed/${youtubeId}?${autoplayParam}&mute=1&controls=1&modestbranding=1&rel=0`}
          className={className}
          allow="autoplay; encrypted-media"
          allowFullScreen
        />
      );
    }

    // Vimeo
    const vimeoRegExp = /vimeo\.com\/(?:video\/)?(\d+)/;
    const vimeoMatch = url.match(vimeoRegExp);
    if (vimeoMatch) {
      const autoplayParam = isHovered ? '1' : '0';
      return (
        <iframe
          src={`https://player.vimeo.com/video/${vimeoMatch[1]}?autoplay=${autoplayParam}&muted=1&autopause=0`}
          className={className}
          allow="autoplay; fullscreen; picture-in-picture"
          allowFullScreen
        />
      );
    }

    // TikTok
    const tiktokRegExp = /\/video\/(\d+)/;
    const tiktokMatch = url.match(tiktokRegExp);
    const tiktokId = tiktokMatch ? tiktokMatch[1] : null;

    if (tiktokId) {
      return (
        <iframe
          src={`https://www.tiktok.com/embed/v2/${tiktokId}`}
          className={className}
          allow="autoplay; encrypted-media"
          allowFullScreen
        />
      );
    }

    // Generic Iframe
    if (url.includes('<iframe')) {
      return <div className={className} dangerouslySetInnerHTML={{ __html: url }} />;
    }

    // Direct Link
    return (
      <video 
        src={url.startsWith('http') ? url : getFullUrl(url)} 
        className={className} 
        controls={isHovered} 
        autoPlay={isHovered} 
        muted 
      />
    );
  };

  const GalleryItem = ({ item, onDelete }: { item: CmsGalleryItem; onDelete: (id: number) => void }) => {
    const [isHovered, setIsHovered] = useState(false);
    const isVideo = item.type === 'video' && item.videoUrl;

    // Auto-generate YouTube thumbnail if missing or if it's accidentally set to the video URL
    const isYoutube = item.videoUrl?.includes('youtube.com') || item.videoUrl?.includes('youtu.be');
    let effectiveImageUrl = item.imageUrl && item.imageUrl !== item.videoUrl ? getFullUrl(item.imageUrl) : '';

    if (!effectiveImageUrl && isVideo && isYoutube) {
      const youtubeRegExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
      const youtubeMatch = item.videoUrl?.match(youtubeRegExp);
      const youtubeId = (youtubeMatch && youtubeMatch[2].length === 11) ? youtubeMatch[2] : null;
      if (youtubeId) {
        effectiveImageUrl = `https://img.youtube.com/vi/${youtubeId}/maxresdefault.jpg`;
      }
    }

    return (
      <div 
        className="group relative aspect-[4/5] rounded-xl overflow-hidden bg-gray-50 dark:bg-gray-800 border border-gray-100 dark:border-gray-700 shadow-sm"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {isVideo ? (
          <>
            {isHovered ? (
              renderVideo(item.videoUrl || '', "w-full h-full object-cover", true)
            ) : (
              <div className="relative w-full h-full bg-slate-100 dark:bg-slate-900">
                {effectiveImageUrl ? (
                  <img 
                    src={effectiveImageUrl} 
                    alt={item.title} 
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      if (effectiveImageUrl.includes('maxresdefault')) {
                        const newUrl = effectiveImageUrl.replace('maxresdefault', 'hqdefault');
                        (e.target as HTMLImageElement).src = newUrl;
                      }
                    }}
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Youtube size={32} className="text-slate-400 opacity-20" />
                  </div>
                )}
                <div className="absolute inset-0 flex items-center justify-center bg-black/20 group-hover:bg-black/10 transition-colors">
                  <div className="w-12 h-12 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center border border-white/30 text-white transform group-hover:scale-110 transition-transform">
                    <Play fill="currentColor" size={24} className="ml-1" />
                  </div>
                </div>
              </div>
            )}
          </>
        ) : (
          <img 
            src={effectiveImageUrl} 
            alt={item.title} 
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" 
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent flex flex-col justify-end p-5 translate-y-2 group-hover:translate-y-0 transition-all duration-300">
          <span className="text-[10px] font-bold text-primary-400 uppercase tracking-widest mb-1">{item.category}</span>
          <div className="flex items-center justify-between gap-2">
            <h4 className="text-sm font-bold text-white leading-tight">{item.title}</h4>
            {isVideo && <Youtube size={14} className="text-white/50" />}
          </div>
          <button
            onClick={() => onDelete(item.id)}
            className="w-fit mt-4 bg-red-600 text-white p-2 rounded-lg opacity-0 group-hover:opacity-100 transition-all shadow-xl hover:bg-red-700"
          >
            <Trash2 size={16} />
          </button>
        </div>
      </div>
    );
  };

  const defaultCategories = ['The Campus', 'Spirituality', 'Activities', 'Events', 'Classroom', 'Sports'];
  const [allCategories, setAllCategories] = useState<string[]>(defaultCategories);

  const fetchItems = async () => {
    try {
      const data = await cmsService.getGallery();
      setItems(data);
      
      // Update dynamic categories list
      const uniqueCats = Array.from(new Set([...defaultCategories, ...data.map(i => i.category)]));
      setAllCategories(uniqueCats);
    } catch (error) {
      toast.showError('Failed to load gallery items');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchItems();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItem.title || !newItem.category || (newItem.type === 'image' && !selectedFile && !newItem.imageUrl) || (newItem.type === 'video' && !selectedFile && !newItem.videoUrl)) {
      toast.showError('Please provide a title, category and select a file');
      return;
    }
    setSaving(true);
    try {
      await cmsService.createGalleryItem({ 
        title: newItem.title, 
        category: newItem.category, 
        type: newItem.type,
        imageUrl: newItem.imageUrl || '',
        videoUrl: newItem.videoUrl
      }, selectedFile || (newItem.type === 'image' ? newItem.imageUrl : '') || '');
      toast.showSuccess('Gallery item added');
      setNewItem({ title: '', category: newItem.category, type: 'image', imageUrl: undefined, videoUrl: undefined });
      setSelectedFile(null);
      fetchItems();
    } catch (error) {
      toast.showError('Failed to add gallery item');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Delete this gallery item?')) return;
    try {
      await cmsService.deleteGalleryItem(id);
      toast.showSuccess('Gallery item deleted');
      fetchItems();
    } catch (error) {
      toast.showError('Failed to delete item');
    }
  };

  if (loading) return <div className="flex justify-center p-12"><Loader2 className="animate-spin text-primary-600" /></div>;

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between gap-4 mb-6">
        <div />
      </div>
      <div className="grid lg:grid-cols-4 gap-8">
        {/* Upload Card */}
        <form onSubmit={handleCreate} className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm space-y-4">
          <div className="relative aspect-[4/5] rounded-lg overflow-hidden bg-gray-50 dark:bg-gray-900 border border-gray-100 dark:border-gray-800 group cursor-pointer shadow-inner">
            {newItem.type === 'video' ? (
              selectedFile ? (
                <video src={URL.createObjectURL(selectedFile)} className="w-full h-full object-cover" />
              ) : newItem.videoUrl ? (
                renderVideo(newItem.videoUrl, "w-full h-full object-cover")
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center text-gray-400 space-y-3">
                  <VideoIcon size={32} className="opacity-20" />
                  <span className="text-[10px] font-bold uppercase tracking-widest text-center px-4">Select or Paste video</span>
                </div>
              )
            ) : selectedFile ? (
              <img src={URL.createObjectURL(selectedFile)} alt="Preview" className="w-full h-full object-cover" />
            ) : newItem.imageUrl ? (
              <img src={getFullUrl(newItem.imageUrl)} alt="Preview" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center text-gray-400 space-y-3">
                <ImageIcon size={32} className="opacity-20" />
                <span className="text-[10px] font-bold uppercase tracking-widest text-center px-4">Select image</span>
              </div>
            )}
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-all duration-300 flex flex-col items-center justify-center gap-2 backdrop-blur-[2px]">
              <label className="bg-white text-gray-900 px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest shadow-sm cursor-pointer hover:bg-gray-50 transition-colors">
                <Upload size={14} className="inline mr-2 text-primary-600" />
                Upload File
                <input type="file" className="hidden" accept={newItem.type === 'image' ? "image/*" : "video/*"} onChange={(e) => {
                  setSelectedFile(e.target.files?.[0] || null);
                  if (newItem.type === 'image') setNewItem({ ...newItem, imageUrl: undefined });
                  else setNewItem({ ...newItem, videoUrl: undefined });
                }} />
              </label>
              <button 
                type="button"
                onClick={() => setIsMediaModalOpen(true)}
                className="bg-white text-gray-900 px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest shadow-sm hover:bg-gray-50 transition-colors"
              >
                <ImageIcon size={14} className="inline mr-2 text-primary-600" />
                From Library
              </button>
            </div>
          </div>
          
          <div className="flex bg-gray-100 dark:bg-gray-900 p-1 rounded-lg">
            <button
              type="button"
              onClick={() => {
                setNewItem({ ...newItem, type: 'image' });
                setSelectedFile(null);
              }}
              className={`flex-1 py-1.5 text-[10px] font-black uppercase tracking-widest rounded-md transition-all ${newItem.type === 'image' ? 'bg-white dark:bg-gray-800 text-primary-600 shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
            >
              Image
            </button>
            <button
              type="button"
              onClick={() => {
                setNewItem({ ...newItem, type: 'video' });
                setSelectedFile(null);
              }}
              className={`flex-1 py-1.5 text-[10px] font-black uppercase tracking-widest rounded-md transition-all ${newItem.type === 'video' ? 'bg-white dark:bg-gray-800 text-primary-600 shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
            >
              Video
            </button>
          </div>
          
          <div className="space-y-3">

            {newItem.type === 'video' && (
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">External Video URL</label>
                <input
                  type="text"
                  placeholder="https://example.com/video.mp4"
                  value={newItem.videoUrl || ''}
                  onChange={(e) => {
                    setNewItem({ ...newItem, videoUrl: e.target.value });
                    setSelectedFile(null);
                  }}
                  className="w-full bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg px-4 py-2.5 text-xs focus:ring-2 focus:ring-primary-500 outline-none transition-all shadow-sm"
                />
              </div>
            )}
            <input
              type="text"
              placeholder="Image Title..."
              value={newItem.title}
              onChange={(e) => setNewItem({ ...newItem, title: e.target.value })}
              className="w-full bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-primary-500 outline-none transition-all shadow-sm"
            />
            <div className="relative">
              <input
                type="text"
                list="gallery-categories"
                placeholder="Category (e.g. Sports Day)"
                value={newItem.category}
                onChange={(e) => setNewItem({ ...newItem, category: e.target.value })}
                className="w-full bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg px-4 py-2.5 text-xs font-bold focus:ring-2 focus:ring-primary-500 outline-none transition-all shadow-sm"
              />
              <datalist id="gallery-categories">
                {allCategories.map((cat) => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </datalist>
            </div>
            <button
              type="submit"
              disabled={saving || !newItem.title || (newItem.type === 'image' ? (!selectedFile && !newItem.imageUrl) : (!selectedFile && !newItem.videoUrl))}
              className="w-full bg-primary-600 hover:bg-primary-700 text-white py-2.5 rounded-lg font-bold flex items-center justify-center gap-2 shadow-sm active:scale-95 transition-all disabled:opacity-50"
            >
              {saving ? <Loader2 className="animate-spin w-4 h-4" /> : <Plus size={18} />}
              Upload Item
            </button>
          </div>
        </form>

        {/* Gallery Items */}
        {items.map((item) => (
          <GalleryItem key={item.id} item={item} onDelete={handleDelete} />
        ))}
      </div>

      <MediaSelectorModal 
        isOpen={isMediaModalOpen}
        onClose={() => setIsMediaModalOpen(false)}
        onSelect={(media) => {
          if (newItem.type === 'image') {
            setNewItem({ ...newItem, imageUrl: media.url });
          } else {
            setNewItem({ ...newItem, videoUrl: media.url });
          }
          setSelectedFile(null);
        }}
      />
    </div>
  );
};

export default GalleryManager;
