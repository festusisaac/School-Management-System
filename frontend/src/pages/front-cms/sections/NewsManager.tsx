import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Save, Loader2, Upload, Calendar, User, Tag, Image as ImageIcon, Newspaper } from 'lucide-react';
import cmsService, { CmsNews } from '@services/cms.service';
import { useSystem } from '@/context/SystemContext';
import { useToast } from '@/context/ToastContext';

const NewsManager: React.FC = () => {
  const [newsList, setNewsList] = useState<CmsNews[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const toast = useToast();
  const [newNews, setNewNews] = useState<Partial<CmsNews>>({
    title: '',
    tag: 'Academic',
    author: 'Admin',
    snippet: '',
    content: '',
  });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const { getFullUrl } = useSystem();

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

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNews.title || !newNews.snippet) {
      toast.showError('Title and snippet are required');
      return;
    }
    setSaving(true);
    try {
      await cmsService.createNews(newNews, selectedFile || undefined);
      toast.showSuccess('News article published');
      setIsAdding(false);
      setNewNews({ title: '', tag: 'Academic', author: 'Admin', snippet: '', content: '' });
      setSelectedFile(null);
      fetchNews();
    } catch (error) {
      toast.showError('Failed to publish news');
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-100 dark:border-gray-800 pb-6">
        <div>
          <h3 className="text-lg font-bold text-gray-900 dark:text-white">News & Announcements</h3>
          <p className="text-sm text-gray-500">Publish articles and updates to the school blog.</p>
        </div>
        {!isAdding && (
          <button
            onClick={() => setIsAdding(true)}
            className="flex items-center gap-2 bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-xl font-bold transition-all shadow-md shadow-primary-200 dark:shadow-none"
          >
            <Plus size={18} /> Create Article
          </button>
        )}
      </div>

      {isAdding && (
        <form onSubmit={handleCreate} className="bg-white dark:bg-gray-950 p-6 md:p-8 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-xl space-y-6 animate-in slide-in-from-top-4 duration-300">
          <div className="grid lg:grid-cols-2 gap-8">
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold uppercase text-gray-400 tracking-wider">Category Tag</label>
                  <select
                    value={newNews.tag}
                    onChange={(e) => setNewNews({ ...newNews, tag: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 text-sm focus:ring-2 focus:ring-primary-500 outline-none transition-all"
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
                    value={newNews.author}
                    onChange={(e) => setNewNews({ ...newNews, author: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 text-sm focus:ring-2 focus:ring-primary-500 outline-none transition-all"
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold uppercase text-gray-400 tracking-wider">Article Title</label>
                <input
                  type="text"
                  value={newNews.title}
                  onChange={(e) => setNewNews({ ...newNews, title: e.target.value })}
                  placeholder="Ex: Highlights from Inter-House Sports 2026"
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 text-sm focus:ring-2 focus:ring-primary-500 outline-none transition-all"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold uppercase text-gray-400 tracking-wider">Summary / Snippet</label>
                <textarea
                  value={newNews.snippet}
                  onChange={(e) => setNewNews({ ...newNews, snippet: e.target.value })}
                  rows={3}
                  placeholder="Short summary for the listing page..."
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 text-sm focus:ring-2 focus:ring-primary-500 outline-none transition-all resize-none"
                ></textarea>
              </div>
            </div>

            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold uppercase text-gray-400 tracking-wider">Featured Image</label>
                <div className="relative aspect-video rounded-2xl overflow-hidden bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 group shadow-inner">
                  {selectedFile ? (
                    <img src={URL.createObjectURL(selectedFile)} alt="Preview" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center text-gray-400 space-y-3">
                      <Upload size={32} className="opacity-20" />
                      <span className="text-[10px] font-bold uppercase tracking-widest">Click to upload banner</span>
                    </div>
                  )}
                  <input type="file" className="absolute inset-0 opacity-0 cursor-pointer" accept="image/*" onChange={(e) => setSelectedFile(e.target.files?.[0] || null)} />
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold uppercase text-gray-400 tracking-wider">Full Content (Markdown Supported)</label>
                <textarea
                  value={newNews.content}
                  onChange={(e) => setNewNews({ ...newNews, content: e.target.value })}
                  rows={4}
                  placeholder="The full story goes here..."
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 text-sm focus:ring-2 focus:ring-primary-500 outline-none transition-all resize-none"
                ></textarea>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 pt-4 border-t border-gray-100 dark:border-gray-800">
            <button
              type="submit"
              disabled={saving}
              className="bg-primary-600 hover:bg-primary-700 text-white px-8 py-2.5 rounded-xl font-bold flex items-center gap-2 shadow-md shadow-primary-200 dark:shadow-none transition-all active:scale-95 disabled:opacity-50"
            >
              {saving ? <Loader2 className="animate-spin w-4 h-4" /> : <Save size={18} />}
              Publish Article
            </button>
            <button
              type="button"
              onClick={() => setIsAdding(false)}
              className="bg-white dark:bg-gray-800 text-gray-600 px-8 py-2.5 rounded-xl font-bold border border-gray-200 dark:border-gray-700 hover:bg-gray-50 transition-all shadow-sm"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      <div className="space-y-4">
        {newsList.map((news) => (
          <div key={news.id} className="group bg-white dark:bg-gray-900 px-6 py-5 rounded-2xl border border-gray-200 dark:border-gray-800/50 hover:shadow-lg transition-all duration-300 flex flex-col md:flex-row items-center gap-6">
            <div className="w-full md:w-32 h-20 rounded-xl overflow-hidden flex-shrink-0 bg-gray-50 dark:bg-gray-800 border border-gray-100 dark:border-gray-700">
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
                onClick={() => handleDelete(news.id)}
                className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/10 rounded-lg transition-all opacity-0 group-hover:opacity-100"
              >
                <Trash2 size={18} />
              </button>
            </div>
          </div>
        ))}
        {newsList.length === 0 && (
          <div className="text-center py-20 bg-gray-50 dark:bg-gray-800/40 rounded-2xl border-2 border-dashed border-gray-200 dark:border-gray-700">
            <Newspaper size={48} className="mx-auto text-gray-300 mb-4" />
            <h4 className="text-lg font-bold text-gray-900 dark:text-white">No articles published yet</h4>
            <p className="text-gray-500 text-sm">Your school's news and updates will appear here.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default NewsManager;
