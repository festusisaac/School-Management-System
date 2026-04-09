import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Save, Loader2, Upload, Calendar, User, Tag, Image as ImageIcon, Newspaper, Pencil, X } from 'lucide-react';
import cmsService, { CmsNews } from '@services/cms.service';
import { useSystem } from '@/context/SystemContext';
import { useToast } from '@/context/ToastContext';
import MediaSelectorModal from '../components/MediaSelectorModal';
import RichTextEditor from '../../../components/common/RichTextEditor';

const NewsManager: React.FC = () => {
  const [newsList, setNewsList] = useState<CmsNews[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  
  const toast = useToast();
  const { getFullUrl } = useSystem();

  const [formData, setFormData] = useState<Partial<CmsNews>>({
    title: '',
    tag: 'Academic',
    author: 'Admin',
    snippet: '',
    content: '',
  });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isMediaModalOpen, setIsMediaModalOpen] = useState(false);

  const tags = ['Academic', 'Sports', 'Events', 'Notices', 'Achievement'];

  const fetchNews = async () => {
    try {
      const data = await cmsService.getAllNews();
      setNewsList(data);
    } catch (error) {
      toast.showError('Failed to load news articles');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNews();
  }, []);

  const resetForm = () => {
    setFormData({ title: '', tag: 'Academic', author: 'Admin', snippet: '', content: '' });
    setSelectedFile(null);
    setIsAdding(false);
    setEditId(null);
  };

  const handleEdit = (news: CmsNews) => {
    setFormData({
      title: news.title,
      tag: news.tag,
      author: news.author,
      snippet: news.snippet,
      content: news.content,
      imageUrl: news.imageUrl
    });
    setEditId(news.id);
    setIsAdding(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.snippet) {
      toast.showError('Title and snippet are required');
      return;
    }
    setSaving(true);
    try {
      if (editId) {
        await cmsService.updateNews(editId, formData, selectedFile || undefined);
        toast.showSuccess('News article updated');
      } else {
        await cmsService.createNews(formData, selectedFile || undefined);
        toast.showSuccess('News article published');
      }
      resetForm();
      fetchNews();
    } catch (error) {
      toast.showError(editId ? 'Failed to update news' : 'Failed to publish news');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Are you sure you want to delete this article?')) return;
    try {
      await cmsService.deleteNews(id);
      toast.showSuccess('Article deleted');
      fetchNews();
    } catch (error) {
      toast.showError('Failed to delete news');
    }
  };

  if (loading) return <div className="flex justify-center p-12"><Loader2 className="animate-spin text-primary-600" /></div>;

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between gap-4 mb-6">
        <div />
        {!isAdding && (
          <button
            onClick={() => setIsAdding(true)}
            className="flex items-center gap-2 bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-lg text-sm font-bold transition-all shadow-sm"
          >
            <Plus size={18} /> Create Article
          </button>
        )}
      </div>

      {isAdding && (
        <form onSubmit={handleSubmit} className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm space-y-6 animate-in slide-in-from-top-4 duration-300">
          <div className="grid lg:grid-cols-2 gap-8">
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold uppercase text-gray-400 tracking-wider">Category</label>
                  <select
                    value={formData.tag}
                    onChange={(e) => setFormData({ ...formData, tag: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm focus:ring-2 focus:ring-primary-500 outline-none transition-all"
                  >
                    {tags.map((t) => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold uppercase text-gray-400 tracking-wider">Author Name</label>
                  <input
                    type="text"
                    value={formData.author}
                    onChange={(e) => setFormData({ ...formData, author: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm focus:ring-2 focus:ring-primary-500 outline-none transition-all"
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold uppercase text-gray-400 tracking-wider">Article Title</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Ex: Highlights from Inter-House Sports 2026"
                  className="w-full px-4 py-2.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm focus:ring-2 focus:ring-primary-500 outline-none transition-all"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold uppercase text-gray-400 tracking-wider">Summary / Snippet</label>
                <textarea
                  value={formData.snippet}
                  onChange={(e) => setFormData({ ...formData, snippet: e.target.value })}
                  rows={3}
                  placeholder="Short summary for the listing page..."
                  className="w-full px-4 py-2.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm focus:ring-2 focus:ring-primary-500 outline-none transition-all resize-none"
                ></textarea>
              </div>
            </div>

            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold uppercase text-gray-400 tracking-wider">Featured Image</label>
                <div className="relative aspect-video rounded-lg overflow-hidden bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 group">
                  {selectedFile ? (
                    <img src={URL.createObjectURL(selectedFile)} alt="Preview" className="w-full h-full object-cover" />
                  ) : formData.imageUrl ? (
                    <img src={getFullUrl(formData.imageUrl)} alt="Preview" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center text-gray-400 space-y-3">
                      <ImageIcon size={32} className="opacity-20" />
                      <span className="text-[10px] font-bold uppercase tracking-widest text-center px-4">Banner Image</span>
                    </div>
                  )}
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2 backdrop-blur-[2px]">
                    <label className="bg-white text-gray-900 px-4 py-2 rounded-lg text-xs font-bold shadow-sm cursor-pointer flex items-center gap-2 hover:bg-gray-50 transition-colors">
                      <Upload size={14} className="text-primary-600" />
                      Upload New
                      <input type="file" className="hidden" accept="image/*" onChange={(e) => {
                        setSelectedFile(e.target.files?.[0] || null);
                        setFormData({ ...formData, imageUrl: undefined });
                      }} />
                    </label>
                    <button 
                      type="button"
                      onClick={() => setIsMediaModalOpen(true)}
                      className="bg-white text-gray-900 px-4 py-2 rounded-lg text-xs font-bold shadow-sm flex items-center gap-2 hover:bg-gray-50 transition-colors"
                    >
                      <ImageIcon size={14} className="text-primary-600" />
                      From Library
                    </button>
                  </div>
                </div>
              </div>
              <div className="space-y-1.5 min-h-[300px]">
                <label className="text-xs font-semibold uppercase text-gray-400 tracking-wider">Full Content</label>
                <RichTextEditor 
                  value={formData.content || ''}
                  onChange={(val) => setFormData({ ...formData, content: val })}
                  placeholder="The full story goes here..."
                />
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 pt-4 border-t border-gray-100 dark:border-gray-700">
            <button
              type="submit"
              disabled={saving}
              className="bg-primary-600 hover:bg-primary-700 text-white px-8 py-2.5 rounded-lg font-bold flex items-center gap-2 shadow-sm transition-all active:scale-95 disabled:opacity-50"
            >
              {saving ? <Loader2 className="animate-spin w-4 h-4" /> : <Save size={18} />}
              {editId ? 'Update Article' : 'Publish Article'}
            </button>
            <button
              type="button"
              onClick={resetForm}
              className="bg-white dark:bg-gray-700 text-gray-600 dark:text-gray-300 px-8 py-2.5 rounded-lg font-bold border border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600 transition-all shadow-sm"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      <div className="space-y-4">
        {newsList.map((news) => (
          <div key={news.id} className="group bg-white dark:bg-gray-800 px-6 py-5 rounded-xl border border-gray-100 dark:border-gray-700 hover:shadow-sm transition-all flex flex-col md:flex-row items-center gap-6">
            <div className="w-full md:w-32 h-20 rounded-lg overflow-hidden flex-shrink-0 bg-gray-50 dark:bg-gray-700 border border-gray-100 dark:border-gray-700">
              {news.imageUrl ? (
                <img src={getFullUrl(news.imageUrl)} alt={news.title} className="w-full h-full object-cover transition-transform group-hover:scale-105" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-300"><ImageIcon size={20} /></div>
              )}
            </div>
            <div className="flex-grow space-y-1.5">
              <div className="flex flex-wrap items-center gap-3">
                <span className="flex items-center gap-1 text-[10px] font-bold uppercase text-primary-600 bg-primary-50 dark:bg-primary-900/20 px-2.5 py-0.5 rounded-full border border-primary-100 dark:border-primary-900/30">
                  <Tag size={10} /> {news.tag}
                </span>
                <span className="flex items-center gap-1 text-[10px] font-bold uppercase text-gray-400">
                  <Calendar size={10} /> {new Date(news.date).toLocaleDateString()}
                </span>
                <span className="flex items-center gap-1 text-[10px] font-bold uppercase text-gray-400">
                  <User size={10} /> {news.author}
                </span>
              </div>
              <h4 className="text-base font-bold text-gray-900 dark:text-white leading-tight group-hover:text-primary-600 transition-colors line-clamp-1">{news.title}</h4>
              <p className="text-gray-500 dark:text-gray-400 text-xs line-clamp-1">{news.snippet}</p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => handleEdit(news)}
                className="p-2 text-gray-400 hover:text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-900/10 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                title="Edit Article"
              >
                <Pencil size={18} />
              </button>
              <button
                onClick={() => handleDelete(news.id)}
                className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/10 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                title="Delete Article"
              >
                <Trash2 size={18} />
              </button>
            </div>
          </div>
        ))}
        {newsList.length === 0 && (
          <div className="text-center py-20 bg-gray-50 dark:bg-gray-900/50 rounded-xl border border-gray-100 dark:border-gray-700">
            <Newspaper size={48} className="mx-auto text-gray-300 mb-4" />
            <h4 className="text-lg font-bold text-gray-900 dark:text-white">No articles published yet</h4>
            <p className="text-gray-500 text-sm">Your school's news and updates will appear here.</p>
          </div>
        )}
      </div>

      <MediaSelectorModal 
        isOpen={isMediaModalOpen}
        onClose={() => setIsMediaModalOpen(false)}
        onSelect={(media) => {
          setFormData({ ...formData, imageUrl: media.url });
          setSelectedFile(null);
        }}
      />
    </div>
  );
};

export default NewsManager;
