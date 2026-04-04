import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Edit2, 
  Trash2, 
  Clock, 
  Pin, 
  CheckCircle2, 
  XCircle,
  Save,
  X,
  Megaphone,
  Users,
  Layout,
  Tag,
  Info
} from 'lucide-react';
import { api, Notice, NoticeType, NoticePriority, NoticeAudience } from '../../services/api';
import { format } from 'date-fns';
import { toast } from 'react-hot-toast';
import { clsx } from 'clsx';
import { useSystem } from '../../context/SystemContext';

export default function ManageNoticesPage() {
  const [notices, setNotices] = useState<Notice[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingNotice, setEditingNotice] = useState<Partial<Notice> | null>(null);
  const { activeSectionId, availableSections } = useSystem();
  
  // Form State
  const [formData, setFormData] = useState<Partial<Notice>>({
    title: '',
    content: '',
    type: NoticeType.ANNOUNCEMENT,
    targetAudience: NoticeAudience.ALL,
    priority: NoticePriority.MEDIUM,
    isSticky: false,
    isActive: true,
  });

  useEffect(() => {
    fetchNotices();
  }, [activeSectionId]);

  const fetchNotices = async () => {
    try {
      setLoading(true);
      const data = await api.getNoticesForAdmin({
        schoolSectionId: activeSectionId || undefined
      });
      setNotices(data);
    } catch (error) {
      toast.error('Failed to fetch notices');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (notice?: Notice) => {
    if (notice) {
      setEditingNotice(notice);
      setFormData(notice);
    } else {
      setEditingNotice(null);
      setFormData({
        title: '',
        content: '',
        type: NoticeType.ANNOUNCEMENT,
        targetAudience: NoticeAudience.ALL,
        priority: NoticePriority.MEDIUM,
        schoolSectionId: activeSectionId || undefined,
        isSticky: false,
        isActive: true,
      });
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingNotice?.id) {
        await api.updateNotice(editingNotice.id, formData);
        toast.success('Notice updated successfully');
      } else {
        await api.createNotice(formData);
        toast.success('Notice created successfully');
      }
      setIsModalOpen(false);
      fetchNotices();
    } catch (error) {
      toast.error('Operation failed');
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this notice?')) return;
    try {
      await api.deleteNotice(id);
      toast.success('Notice deleted');
      fetchNotices();
    } catch (error) {
      toast.error('Delete failed');
    }
  };

  return (
    <div className="p-6 space-y-6 bg-gray-50 dark:bg-gray-900 min-h-screen transition-colors duration-300">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            Manage Notices
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">Create and moderate school-wide announcements</p>
        </div>

        <button 
          onClick={() => handleOpenModal()}
          className="flex items-center gap-2 px-6 py-3 bg-primary-600 text-white rounded-xl font-bold shadow-lg hover:shadow-xl hover:bg-primary-700 transition-all active:scale-95"
        >
          <Plus size={20} />
          New Notice
        </button>
      </div>

      {/* Main Container Card */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
            <p className="mt-4 text-gray-500 dark:text-gray-400">Loading notices...</p>
          </div>
        ) : notices.length === 0 ? (
          <div className="p-12 text-center text-gray-500 dark:text-gray-400">
            <Megaphone size={48} className="mx-auto mb-4 opacity-20" />
            <p>No notices found.</p>
            <button 
              onClick={() => handleOpenModal()}
              className="mt-2 text-primary-600 dark:text-primary-400 font-semibold hover:underline"
            >
              Post your first notice
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-gray-50 dark:bg-gray-700/50 border-b border-gray-200 dark:border-gray-600">
                <tr>
                  <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest">Notice Details</th>
                  <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest">Audience</th>
                  <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest">Category</th>
                  <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest">Status</th>
                  <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {notices.map((notice) => (
                  <tr key={notice.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex items-start gap-3">
                        <div className={clsx(
                          "mt-0.5 p-2 rounded-lg",
                          notice.isSticky 
                            ? "bg-primary-100 text-primary-600 dark:bg-primary-900/30" 
                            : "bg-gray-100 text-gray-400 dark:bg-gray-700"
                        )}>
                          {notice.isSticky ? <Pin size={16} className="fill-current" /> : <Megaphone size={16} />}
                        </div>
                        <div className="min-w-0">
                          <p className="font-bold text-gray-900 dark:text-white group-hover:text-primary-600 transition-colors truncate max-w-md">
                            {notice.title}
                          </p>
                          <p className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase flex items-center gap-1.5 mt-1">
                            <Clock size={12} /> {format(new Date(notice.createdAt), 'MMM dd, yyyy · h:mm a')}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-600">
                        <Users size={12} />
                        {notice.targetAudience}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-1">
                        <span className="text-[10px] font-bold uppercase text-gray-400">{notice.type}</span>
                        <div className={clsx(
                          "text-[9px] font-bold uppercase tracking-widest w-fit px-2 py-0.5 rounded border leading-none",
                          notice.priority === NoticePriority.CRITICAL ? "bg-red-50 text-red-600 border-red-100 dark:bg-red-900/20 dark:border-red-900/40" : 
                          notice.priority === NoticePriority.HIGH ? "bg-orange-50 text-orange-600 border-orange-100 dark:bg-orange-900/20 dark:border-orange-900/40" : 
                          "bg-blue-50 text-blue-600 border-blue-100 dark:bg-blue-900/20 dark:border-blue-900/40"
                        )}>
                          {notice.priority}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {notice.isActive ? (
                        <div className="flex items-center gap-1.5 text-green-600 dark:text-green-400">
                          <CheckCircle2 size={16} />
                          <span className="text-[10px] font-bold uppercase tracking-widest">Active</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1.5 text-gray-400">
                          <XCircle size={16} />
                          <span className="text-[10px] font-bold uppercase tracking-widest">Hidden</span>
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button 
                          onClick={() => handleOpenModal(notice)}
                          className="p-2 text-gray-500 hover:text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-900/20 rounded-lg transition-all"
                          title="Edit"
                        >
                          <Edit2 size={16} />
                        </button>
                        <button 
                          onClick={() => handleDelete(notice.id)}
                          className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-all"
                          title="Delete"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Notice Management Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm transition-opacity" onClick={() => setIsModalOpen(false)} />
          
          <div className="relative w-full max-w-4xl bg-white dark:bg-gray-800 rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 fade-in duration-200 flex flex-col max-h-[90vh]">
            <form onSubmit={handleSubmit} className="flex flex-col overflow-hidden">
              {/* Modal Header (Fixed) */}
              <div className="px-6 py-5 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between flex-shrink-0">
                <div>
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                    {editingNotice ? 'Edit Notice' : 'Post New Notice'}
                  </h2>
                  <p className="text-gray-500 dark:text-gray-400 text-xs mt-0.5">Define announcement details and target audience</p>
                </div>
                <button type="button" onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl transition-colors">
                  <X size={24} className="text-gray-400" />
                </button>
              </div>

              {/* Modal Body (Scrollable) */}
              <div className="p-6 grid grid-cols-1 lg:grid-cols-3 gap-8 overflow-y-auto animate-in slide-in-from-bottom-2 duration-300">
                {/* Information Inputs */}
                <div className="lg:col-span-2 space-y-6">
                  <div className="space-y-4">
                    <div>
                      <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest pl-1 mb-1.5 flex items-center gap-2">
                        <Tag size={12} /> Notice Title
                      </label>
                      <input 
                        type="text"
                        required
                        value={formData.title}
                        onChange={e => setFormData({ ...formData, title: e.target.value })}
                        className="w-full px-4 py-2.5 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent text-gray-900 dark:text-white font-bold transition-all"
                        placeholder="E.g. Mid-Term Break Notice"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest pl-1 mb-1.5 flex items-center gap-2">
                        <Layout size={12} /> Content Body
                      </label>
                      <textarea 
                        required
                        rows={10}
                        value={formData.content}
                        onChange={e => setFormData({ ...formData, content: e.target.value })}
                        className="w-full px-4 py-3 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent text-gray-700 dark:text-gray-300 font-medium transition-all text-sm leading-relaxed"
                        placeholder="Enter the full message here..."
                      />
                    </div>
                  </div>
                </div>

                {/* Configuration Sidebar */}
                <div className="space-y-5">
                   <div className="bg-gray-50 dark:bg-gray-900/50 rounded-2xl p-5 border border-gray-100 dark:border-gray-700 space-y-5">
                      <div>
                        <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">Target Audience</label>
                        <select 
                          value={formData.targetAudience}
                          onChange={e => setFormData({ ...formData, targetAudience: e.target.value as NoticeAudience })}
                          className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-sm font-bold text-gray-700 dark:text-gray-300 transition-all focus:ring-2 focus:ring-primary-500 shadow-sm"
                        >
                          {Object.values(NoticeAudience).map(v => <option key={v} value={v}>{v}</option>)}
                        </select>
                      </div>

                      <div className="grid grid-cols-1 gap-5">
                          <div>
                            <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">Category</label>
                            <select 
                              value={formData.type}
                              onChange={e => setFormData({ ...formData, type: e.target.value as NoticeType })}
                              className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-sm font-bold text-gray-700 dark:text-gray-300 transition-all focus:ring-2 focus:ring-primary-500 shadow-sm"
                            >
                              {Object.values(NoticeType).map(v => <option key={v} value={v}>{v}</option>)}
                            </select>
                          </div>

                          <div>
                            <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">Priority</label>
                            <select 
                              value={formData.priority}
                              onChange={e => setFormData({ ...formData, priority: e.target.value as NoticePriority })}
                              className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-sm font-bold text-gray-700 dark:text-gray-300 transition-all focus:ring-2 focus:ring-primary-500 shadow-sm"
                            >
                              {Object.values(NoticePriority).map(v => <option key={v} value={v}>{v}</option>)}
                            </select>
                          </div>

                          <div>
                            <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">Target Section</label>
                            <select 
                              value={formData.schoolSectionId || ''}
                              onChange={e => setFormData({ ...formData, schoolSectionId: e.target.value || undefined })}
                              className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-sm font-bold text-gray-700 dark:text-gray-300 transition-all focus:ring-2 focus:ring-primary-500 shadow-sm"
                            >
                              <option value="">Global (All Sections)</option>
                              {availableSections.map((s: any) => <option key={s.id} value={s.id}>{s.name}</option>)}
                            </select>
                          </div>

                          <div>
                            <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">Expiry Date</label>
                            <input 
                              type="date"
                              value={formData.expiresAt ? format(new Date(formData.expiresAt), 'yyyy-MM-dd') : ''}
                              onChange={e => setFormData({ ...formData, expiresAt: e.target.value })}
                              className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-sm font-bold text-gray-700 dark:text-gray-300 transition-all focus:ring-2 focus:ring-primary-500 shadow-sm"
                            />
                          </div>
                      </div>

                      <div className="pt-4 space-y-3">
                          <label className="flex items-center gap-3 cursor-pointer group">
                            <input 
                              type="checkbox"
                              checked={formData.isSticky}
                              onChange={e => setFormData({ ...formData, isSticky: e.target.checked })}
                              className="w-4 h-4 rounded text-primary-600 focus:ring-primary-500 cursor-pointer transition-all border-gray-300"
                            />
                            <span className="text-xs font-bold text-gray-700 dark:text-gray-300 group-hover:text-primary-600 transition-colors">Pin to Top (Sticky)</span>
                          </label>

                          <label className="flex items-center gap-3 cursor-pointer group">
                            <input 
                              type="checkbox"
                              checked={formData.isActive}
                              onChange={e => setFormData({ ...formData, isActive: e.target.checked })}
                              className="w-4 h-4 rounded text-primary-600 focus:ring-primary-500 cursor-pointer transition-all border-gray-300"
                            />
                            <span className="text-xs font-bold text-gray-700 dark:text-gray-300 group-hover:text-primary-600 transition-colors">Publish to Board</span>
                          </label>
                      </div>

                      <div className="pt-6 mt-4 border-t border-gray-100 dark:border-gray-700">
                          <div className="flex items-start gap-2 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-xl text-[10px] text-blue-700 dark:text-blue-300 leading-relaxed font-semibold">
                            <Info size={14} className="flex-shrink-0 mt-0.5" />
                            Pinned notices stay at the very top of the board for all users.
                          </div>
                      </div>
                   </div>
                </div>
              </div>

              {/* Modal Footer (Fixed) */}
              <div className="px-6 py-5 bg-gray-50 dark:bg-gray-800/50 border-t border-gray-100 dark:border-gray-700 flex justify-end gap-3 flex-shrink-0">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-5 py-2.5 text-sm font-bold text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl transition-all"
                >
                  Discard
                </button>
                <button
                  type="submit"
                  className="px-8 py-2.5 bg-primary-600 text-white rounded-xl font-bold shadow-lg hover:shadow-xl hover:bg-primary-700 transition-all active:scale-95 flex items-center justify-center gap-2"
                >
                  <Save size={18} /> {editingNotice ? 'Update Change' : 'Publish Notice'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
