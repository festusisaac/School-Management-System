import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Save, Loader2, BarChart3 } from 'lucide-react';
import cmsService, { CmsStat } from '@services/cms.service';
import { useToast } from '@/context/ToastContext';

const StatManager: React.FC = () => {
  const [stats, setStats] = useState<CmsStat[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [newStat, setNewStat] = useState<Partial<CmsStat>>({ label: '', value: '', order: 0 });
  const toast = useToast();

  const fetchStats = async () => {
    try {
      const data = await cmsService.getStats();
      setStats(data);
    } catch (error) {
      toast.showError('Failed to load stats');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStat.label || !newStat.value) return;
    setSaving(true);
    try {
      await cmsService.createStat(newStat);
      toast.showSuccess('Stat added');
      setNewStat({ label: '', value: '', order: 0 });
      fetchStats();
    } catch (error) {
      toast.showError('Failed to add stat');
    } finally {
      setSaving(false);
    }
  };

  const handleUpdate = async (id: number, data: Partial<CmsStat>) => {
    try {
      await cmsService.updateStat(id, data);
      toast.showSuccess('Stat updated');
      fetchStats();
    } catch (error) {
      toast.showError('Failed to update stat');
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Are you sure you want to delete this stat?')) return;
    try {
      await cmsService.deleteStat(id);
      toast.showSuccess('Stat deleted');
      fetchStats();
    } catch (error) {
      toast.showError('Failed to delete stat');
    }
  };

  if (loading) return <div className="flex justify-center p-12"><Loader2 className="animate-spin text-primary-600" /></div>;

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between gap-4 mb-6">
        <div />
      </div>
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat) => (
          <div key={stat.id} className="bg-gray-50 dark:bg-gray-800/50 p-6 rounded-xl border border-gray-100 dark:border-gray-700 space-y-4 hover:shadow-sm transition-all group">
            <div className="flex justify-between items-start">
              <div className="w-10 h-10 rounded-lg bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center text-primary-600">
                <BarChart3 size={20} />
              </div>
              <button 
                onClick={() => handleDelete(stat.id)}
                className="opacity-0 group-hover:opacity-100 p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/10 rounded-lg transition-all"
              >
                <Trash2 size={16} />
              </button>
            </div>
            
            <div className="space-y-3">
              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase text-gray-400 tracking-wider">Value</label>
                <input
                  type="text"
                  value={stat.value}
                  onChange={(e) => handleUpdate(stat.id, { value: e.target.value })}
                  className="w-full bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-1.5 text-lg font-bold text-primary-600 focus:ring-2 focus:ring-primary-500 transition-all outline-none"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase text-gray-400 tracking-wider">Label Text</label>
                <input
                  type="text"
                  value={stat.label}
                  onChange={(e) => handleUpdate(stat.id, { label: e.target.value })}
                  className="w-full bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-1.5 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest focus:ring-2 focus:ring-primary-500 transition-all outline-none"
                />
              </div>
            </div>
          </div>
        ))}

        {/* Add New Stat Card */}
        <form onSubmit={handleCreate} className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 space-y-4 flex flex-col justify-center shadow-sm">
          <div className="space-y-3">
            <input
              type="text"
              placeholder="Ex: 500+"
              value={newStat.value}
              onChange={(e) => setNewStat({ ...newStat, value: e.target.value })}
              className="w-full px-4 py-2.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm focus:ring-2 focus:ring-primary-500 outline-none transition-all font-bold"
            />
            <input
              type="text"
              placeholder="Ex: Global Alumnae"
              value={newStat.label}
              onChange={(e) => setNewStat({ ...newStat, label: e.target.value })}
              className="w-full px-4 py-2.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-xs focus:ring-2 focus:ring-primary-500 outline-none transition-all font-bold"
            />
          </div>
          <button
            type="submit"
            disabled={saving || !newStat.label || !newStat.value}
            className="w-full bg-primary-600 hover:bg-primary-700 text-white py-2.5 rounded-lg font-bold transition-all shadow-sm flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50"
          >
            {saving ? <Loader2 className="animate-spin w-4 h-4" /> : <Plus size={18} />}
            Add Stat
          </button>
        </form>
      </div>
    </div>
  );
};

export default StatManager;
