import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Save, Loader2, Star, Quote, CheckCircle2, XCircle } from 'lucide-react';
import cmsService, { CmsTestimonial } from '@services/cms.service';
import { useToast } from '@/context/ToastContext';

const TestimonialManager: React.FC = () => {
  const [testimonials, setTestimonials] = useState<CmsTestimonial[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const toast = useToast();
  const [newTestimonial, setNewTestimonial] = useState<Partial<CmsTestimonial>>({
    author: '',
    role: '',
    quote: '',
    rating: 5,
    isActive: true,
  });

  const fetchTestimonials = async () => {
    try {
      const data = await cmsService.getTestimonials();
      setTestimonials(data);
    } catch (error) {
      toast.showError('Failed to load testimonials');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTestimonials();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTestimonial.author || !newTestimonial.quote) return;
    setSaving(true);
    try {
      await cmsService.createTestimonial(newTestimonial);
      toast.showSuccess('Testimonial added');
      setIsAdding(false);
      setNewTestimonial({ author: '', role: '', quote: '', rating: 5, isActive: true });
      fetchTestimonials();
    } catch (error) {
      toast.showError('Failed to add testimonial');
    } finally {
      setSaving(false);
    }
  };

  const handleToggleStatus = async (id: number, currentStatus: boolean) => {
    try {
      await cmsService.updateTestimonial(id, { isActive: !currentStatus });
      toast.showSuccess(`Testimonial ${!currentStatus ? 'published' : 'hidden'} successfully`);
      fetchTestimonials();
    } catch (error) {
      toast.showError('Failed to update status');
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Delete this testimonial?')) return;
    try {
      await cmsService.deleteTestimonial(id);
      toast.showSuccess('Testimonial deleted');
      fetchTestimonials();
    } catch (error) {
      toast.showError('Failed to delete testimonial');
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
            <Plus size={18} /> Add Testimonial
          </button>
        )}
      </div>

      {isAdding && (
        <form onSubmit={handleCreate} className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm space-y-6 animate-in slide-in-from-top-4 duration-300">
          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase text-gray-400 tracking-wider">Author Name</label>
              <input
                type="text"
                value={newTestimonial.author}
                onChange={(e) => setNewTestimonial({ ...newTestimonial, author: e.target.value })}
                placeholder="Ex: Mrs. Florence Adebayor"
                className="w-full px-4 py-2.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm focus:ring-2 focus:ring-primary-500 outline-none transition-all shadow-sm"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase text-gray-400 tracking-wider">Role / Designation</label>
              <input
                type="text"
                value={newTestimonial.role}
                onChange={(e) => setNewTestimonial({ ...newTestimonial, role: e.target.value })}
                placeholder="Ex: Parent of Nursery 2 Student"
                className="w-full px-4 py-2.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm focus:ring-2 focus:ring-primary-500 outline-none transition-all shadow-sm"
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-semibold uppercase text-gray-400 tracking-wider">Quote Content</label>
            <textarea
              value={newTestimonial.quote}
              onChange={(e) => setNewTestimonial({ ...newTestimonial, quote: e.target.value })}
              rows={4}
              placeholder="What did the parent say?..."
              className="w-full px-4 py-2.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm focus:ring-2 focus:ring-primary-500 outline-none transition-all shadow-sm resize-none"
            ></textarea>
          </div>
          <div className="flex items-center gap-6">
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase text-gray-400">Star Rating</label>
              <div className="flex items-center gap-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setNewTestimonial({ ...newTestimonial, rating: star })}
                    className={`p-1 transition-all ${newTestimonial.rating && newTestimonial.rating >= star ? 'text-amber-500' : 'text-gray-200 dark:text-gray-700'}`}
                  >
                    <Star size={22} fill={newTestimonial.rating && newTestimonial.rating >= star ? 'currentColor' : 'none'} />
                  </button>
                ))}
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
              Save Testimonial
            </button>
            <button
              type="button"
              onClick={() => setIsAdding(false)}
              className="bg-white dark:bg-gray-700 text-gray-600 dark:text-gray-300 px-8 py-2.5 rounded-lg font-bold border border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600 transition-all shadow-sm"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      <div className="grid md:grid-cols-2 gap-8">
        {testimonials.map((t) => (
          <div key={t.id} className="relative bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 hover:shadow-md transition-all group overflow-hidden">
            <Quote className="text-gray-50 dark:text-gray-900 absolute top-4 right-4 w-12 h-12 opacity-50" />
            <div className="relative space-y-6">
              <div className="flex justify-between items-start">
                <div className="flex gap-1 text-amber-500">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} size={14} fill={i < t.rating ? "currentColor" : "none"} className={i < t.rating ? "" : "text-gray-200 dark:text-gray-700"} />
                  ))}
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleToggleStatus(t.id, t.isActive)}
                    className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider transition-all border ${
                      t.isActive 
                        ? 'bg-green-50 text-green-700 border-green-200 dark:bg-green-900/10 dark:text-green-500 dark:border-green-900/30' 
                        : 'bg-gray-100 text-gray-500 border-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-700'
                    }`}
                  >
                    {t.isActive ? (
                      <><CheckCircle2 size={12} /> Published</>
                    ) : (
                      <><XCircle size={12} /> Hidden</>
                    )}
                  </button>
                  <button
                    onClick={() => handleDelete(t.id)}
                    className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/10 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
              <p className="text-base text-gray-600 dark:text-gray-300 font-medium italic leading-relaxed">
                "{t.quote}"
              </p>
              <div className="pt-4 border-t border-gray-100 dark:border-gray-800/50">
                <h4 className="text-base font-bold text-gray-900 dark:text-white uppercase tracking-tight">{t.author}</h4>
                <p className="text-xs font-bold text-primary-600 uppercase tracking-widest">{t.role}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default TestimonialManager;
