import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Loader2, Upload } from 'lucide-react';
import cmsService, { CmsGalleryItem } from '@services/cms.service';
import { useSystem } from '@/context/SystemContext';
import { useToast } from '@/context/ToastContext';
import MediaSelectorModal from '../components/MediaSelectorModal';
import { Image as ImageIcon } from 'lucide-react';

const GalleryManager: React.FC = () => {
  const [items, setItems] = useState<CmsGalleryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [newItem, setNewItem] = useState<{ title: string; category: string; imageUrl?: string }>({ title: '', category: 'The Campus' });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isMediaModalOpen, setIsMediaModalOpen] = useState(false);
  const { getFullUrl } = useSystem();
  const toast = useToast();

  const categories = ['The Campus', 'Spirituality', 'Activities'];

  const fetchItems = async () => {
    try {
      const data = await cmsService.getGallery();
      setItems(data);
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
    if (!newItem.title || (!selectedFile && !newItem.imageUrl)) {
      toast.showError('Please provide a title and select an image');
      return;
    }
    setSaving(true);
    try {
      await cmsService.createGalleryItem({ title: newItem.title, category: newItem.category }, selectedFile || newItem.imageUrl || '');
      toast.showSuccess('Gallery item added');
      setNewItem({ title: '', category: 'The Campus' });
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
            {selectedFile ? (
              <img src={URL.createObjectURL(selectedFile)} alt="Preview" className="w-full h-full object-cover" />
            ) : newItem.imageUrl ? (
              <img src={getFullUrl(newItem.imageUrl)} alt="Preview" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center text-gray-400 space-y-3">
                <ImageIcon size={32} className="opacity-20" />
                <span className="text-[10px] font-bold uppercase tracking-widest text-center px-4">Click to select image</span>
              </div>
            )}
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-all duration-300 flex flex-col items-center justify-center gap-2 backdrop-blur-[2px]">
              <label className="bg-white text-gray-900 px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest shadow-sm cursor-pointer hover:bg-gray-50 transition-colors">
                <Upload size={14} className="inline mr-2 text-primary-600" />
                Upload File
                <input type="file" className="hidden" accept="image/*" onChange={(e) => {
                  setSelectedFile(e.target.files?.[0] || null);
                  setNewItem({ ...newItem, imageUrl: undefined });
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

          <div className="space-y-3">
            <input
              type="text"
              placeholder="Image Title..."
              value={newItem.title}
              onChange={(e) => setNewItem({ ...newItem, title: e.target.value })}
              className="w-full bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-primary-500 outline-none transition-all shadow-sm"
            />
            <select
              value={newItem.category}
              onChange={(e) => setNewItem({ ...newItem, category: e.target.value })}
              className="w-full bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg px-4 py-2.5 text-xs font-bold focus:ring-2 focus:ring-primary-500 outline-none transition-all shadow-sm"
            >
              {categories.map((cat) => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
            <button
              type="submit"
              disabled={saving || !newItem.title || (!selectedFile && !newItem.imageUrl)}
              className="w-full bg-primary-600 hover:bg-primary-700 text-white py-2.5 rounded-lg font-bold flex items-center justify-center gap-2 shadow-sm active:scale-95 transition-all disabled:opacity-50"
            >
              {saving ? <Loader2 className="animate-spin w-4 h-4" /> : <Plus size={18} />}
              Upload Item
            </button>
          </div>
        </form>

        {/* Gallery Items */}
        {items.map((item) => (
          <div key={item.id} className="group relative aspect-[4/5] rounded-xl overflow-hidden bg-gray-50 dark:bg-gray-800 border border-gray-100 dark:border-gray-700 shadow-sm">
            <img src={getFullUrl(item.imageUrl)} alt={item.title} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent flex flex-col justify-end p-5 translate-y-2 group-hover:translate-y-0 transition-all duration-300">
              <span className="text-[10px] font-bold text-primary-400 uppercase tracking-widest mb-1">{item.category}</span>
              <h4 className="text-sm font-bold text-white leading-tight mb-4">{item.title}</h4>
              <button
                onClick={() => handleDelete(item.id)}
                className="w-fit bg-red-600 text-white p-2 rounded-lg opacity-0 group-hover:opacity-100 transition-all shadow-xl hover:bg-red-700"
              >
                <Trash2 size={16} />
              </button>
            </div>
          </div>
        ))}
      </div>

      <MediaSelectorModal 
        isOpen={isMediaModalOpen}
        onClose={() => setIsMediaModalOpen(false)}
        onSelect={(media) => {
          setNewItem({ ...newItem, imageUrl: media.url });
          setSelectedFile(null);
        }}
      />
    </div>
  );
};

export default GalleryManager;
