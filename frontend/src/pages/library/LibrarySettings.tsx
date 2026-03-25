import React, { useEffect, useState } from 'react';
import { libraryService, LibrarySettings as SettingsType } from '../../services/library.service';
import { useToast } from '../../context/ToastContext';
import { Save, Clock, Banknote, AlertTriangle } from 'lucide-react';

const LibrarySettings: React.FC = () => {
  const [settings, setSettings] = useState<SettingsType | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { showSuccess, showError } = useToast();

  const [graceDays, setGraceDays] = useState(3);
  const [finePerDay, setFinePerDay] = useState(50);

  useEffect(() => {
    libraryService.getSettings()
      .then(data => {
        if (data) {
          setSettings(data);
          setGraceDays(data.graceDays);
          setFinePerDay(data.finePerDay);
        }
      })
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await libraryService.updateSettings({ graceDays, finePerDay });
      showSuccess('Settings updated');
    } catch (err) {
      showError('Failed to update settings');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="p-20 text-center text-xs font-black uppercase tracking-widest animate-pulse">Loading system settings...</div>;

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-2xl mx-auto space-y-6 animate-in fade-in duration-500">
      <div>
        <h1 className="text-2xl font-extrabold text-gray-900 dark:text-white tracking-tight">Library Configuration</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Manage global circulation rules and fine rates.</p>
      </div>

      <form onSubmit={handleSave} className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm overflow-hidden">
        <div className="p-6 space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                <Clock size={12} className="text-primary-500" />
                Grace Period (Days)
              </label>
              <input
                type="number"
                min="0"
                value={graceDays}
                onChange={(e) => setGraceDays(parseInt(e.target.value))}
                className="w-full px-4 py-2.5 rounded-lg bg-gray-50 dark:bg-gray-900 border border-transparent focus:border-primary-500 outline-none transition-all text-sm font-bold"
              />
              <p className="text-[10px] text-gray-400 italic">Day limit before fines are calculated.</p>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                <Banknote size={12} className="text-green-500" />
                Daily Fine Rate
              </label>
              <input
                type="number"
                min="0"
                value={finePerDay}
                onChange={(e) => setFinePerDay(parseInt(e.target.value))}
                className="w-full px-4 py-2.5 rounded-lg bg-gray-50 dark:bg-gray-900 border border-transparent focus:border-primary-500 outline-none transition-all text-sm font-bold"
              />
              <p className="text-[10px] text-gray-400 italic">Charge per overdue day (₦).</p>
            </div>
          </div>

          <div className="p-4 bg-amber-50 dark:bg-amber-900/10 rounded-xl border border-amber-500/10 flex gap-3">
            <AlertTriangle className="text-amber-500 shrink-0" size={16} />
            <p className="text-[10px] text-amber-700/80 dark:text-amber-400 italic font-medium leading-relaxed">
              Updating these values will affect all future return calculations. Existing recorded fines on fully returned books remain unchanged.
            </p>
          </div>
        </div>

        <div className="px-6 py-4 bg-gray-50 dark:bg-gray-800/40 flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="flex items-center px-8 py-2.5 bg-gray-900 dark:bg-white text-white dark:text-gray-900 text-[10px] font-black uppercase tracking-[0.2em] rounded-lg hover:opacity-90 transition-all shadow-xl disabled:opacity-50"
          >
            {saving ? 'Saving...' : 'Save Settings'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default LibrarySettings;
