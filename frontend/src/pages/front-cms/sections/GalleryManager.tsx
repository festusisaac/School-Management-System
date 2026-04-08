import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Loader2, Upload } from 'lucide-react';
import cmsService, { CmsGalleryItem } from '@services/cms.service';
import { useSystem } from '@/context/SystemContext';
import { useToast } from '@/context/ToastContext';

const GalleryManager: React.FC = () => {
  const [items, setItems] = useState<CmsGalleryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [newItem, setNewItem] = useState({ title: '', category: 'The Campus' });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
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
    if (!newItem.title || !selectedFile) {
      toast.showError('Please provide a title and select an image');
      return;
    }
    setSaving(true);
    try {
      await cmsService.createGalleryItem(newItem, selectedFile);
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-100 dark:border-gray-800 pb-6">
        <div>
          <h3 className="text-lg font-bold text-gray-900 dark:text-white">Environment Gallery</h3>
          <p className="text-sm text-gray-500">Manage images shown in the landing page gallery.</p>
        </div>
      </div>

      <div className="grid lg:grid-cols-4 gap-8">
        {/* Upload Card */}
        <form onSubmit={handleCreate} className="bg-gray-50 dark:bg-gray-800/40 p-6 rounded-2xl border-2 border-dashed border-gray-200 dark:border-gray-700 space-y-4">
          <div className="relative aspect-[4/5] rounded-xl overflow-hidden bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 group cursor-pointer shadow-inner">
            {selectedFile ? (
              <img src={URL.createObjectURL(selectedFile)} alt="Preview" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center text-gray-400 space-y-3">
                <Upload size={32} className="opacity-20" />
                <span className="text-[10px] font-bold uppercase tracking-widest text-center px-4">Click to select image</span>
              </div>
            )}
            <input type="file" className="absolute inset-0 opacity-0 cursor-pointer" accept="image/*" onChange={(e) => setSelectedFile(e.target.files?.[0] || null)} />
          </div>

          <div className="space-y-3">
            <input
              type="text"
              placeholder="Image Title..."
              value={newItem.title}
              onChange={(e) => setNewItem({ ...newItem, title: e.target.value })}
              className="w-full bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-primary-500 outline-none transition-all shadow-sm"
            />
            <select
              value={newItem.category}
              onChange={(e) => setNewItem({ ...newItem, category: e.target.value })}
              className="w-full bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl px-4 py-2.5 text-xs font-bold focus:ring-2 focus:ring-primary-500 outline-none transition-all shadow-sm"
            >
              {categories.map((cat) => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
            <button
              type="submit"
              disabled={saving || !newItem.title || !selectedFile}
              className="w-full bg-primary-600 hover:bg-primary-700 text-white py-2.5 rounded-xl font-bold flex items-center justify-center gap-2 shadow-md shadow-primary-200 dark:shadow-none active:scale-95 transition-all disabled:opacity-50"
            >
              {saving ? <Loader2 className="animate-spin w-4 h-4" /> : <Plus size={18} />}
              Upload Item
            </button>
          </div>
        </form>

        {/* Gallery Items */}
        {items.map((item) => (
          <div key={item.id} className="group relative aspect-[4/5] rounded-2xl overflow-hidden bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-800 shadow-sm">
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
    </div>
  );
};

export default GalleryManager;
