import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Save, Loader2, Upload } from 'lucide-react';
import cmsService, { CmsProgram } from '@services/cms.service';
import { useSystem } from '@/context/SystemContext';
import { useToast } from '@/context/ToastContext';
import MediaSelectorModal from '../components/MediaSelectorModal';
import { Image as ImageIcon } from 'lucide-react';

const ProgramManager: React.FC = () => {
  const [programs, setPrograms] = useState<CmsProgram[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const toast = useToast();
  const [newProgram, setNewProgram] = useState<Partial<CmsProgram>>({ title: '', description: '', level: 'Nursery' });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isMediaModalOpen, setIsMediaModalOpen] = useState(false);
  const { getFullUrl } = useSystem();

  const fetchPrograms = async () => {
    try {
      const data = await cmsService.getPrograms();
      setPrograms(data);
    } catch (error) {
      toast.showError('Failed to load programs');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPrograms();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProgram.title || !newProgram.description || !selectedFile) {
      toast.showError('Please fill all fields and select an image');
      return;
    }
    setSaving(true);
    try {
      await cmsService.createProgram(newProgram, selectedFile || newProgram.imageUrl || '');
      toast.showSuccess('Program added');
      setIsAdding(false);
      setNewProgram({ title: '', description: '', level: 'Nursery' });
      setSelectedFile(null);
      fetchPrograms();
    } catch (error) {
      toast.showError('Failed to add program');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Are you sure you want to delete this program?')) return;
    try {
      await cmsService.deleteProgram(id);
      toast.showSuccess('Program deleted');
      fetchPrograms();
    } catch (error) {
      toast.showError('Failed to delete program');
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
            <Plus size={18} /> Add New Program
          </button>
        )}
      </div>

      {isAdding && (
        <form onSubmit={handleCreate} className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm space-y-6 animate-in slide-in-from-top-4 duration-300">
          <div className="grid lg:grid-cols-2 gap-8">
            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold uppercase text-gray-400 tracking-wider">Level / Category</label>
                <select
                  value={newProgram.level}
                  onChange={(e) => setNewProgram({ ...newProgram, level: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm focus:ring-2 focus:ring-primary-500 outline-none transition-all resize-none shadow-sm"
                >
                  <option value="Nursery">Nursery</option>
                  <option value="Primary">Primary</option>
                  <option value="Secondary">Secondary</option>
                  <option value="A-Level">A-Level</option>
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold uppercase text-gray-400 tracking-wider">Program Title</label>
                <input
                  type="text"
                  value={newProgram.title}
                  onChange={(e) => setNewProgram({ ...newProgram, title: e.target.value })}
                  placeholder="Ex: Early Foundation"
                  className="w-full px-4 py-2.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm focus:ring-2 focus:ring-primary-500 outline-none transition-all resize-none shadow-sm"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold uppercase text-gray-400 tracking-wider">Description</label>
                <textarea
                  value={newProgram.description}
                  onChange={(e) => setNewProgram({ ...newProgram, description: e.target.value })}
                  rows={4}
                  placeholder="Describe this academic stage..."
                  className="w-full px-4 py-2.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm focus:ring-2 focus:ring-primary-500 outline-none transition-all resize-none shadow-sm"
                ></textarea>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase text-gray-400 tracking-wider">Program Banner Image</label>
              <div className="relative aspect-video rounded-lg overflow-hidden bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 group">
                {selectedFile ? (
                  <img src={URL.createObjectURL(selectedFile)} alt="Preview" className="w-full h-full object-cover" />
                ) : newProgram.imageUrl ? (
                  <img src={getFullUrl(newProgram.imageUrl)} alt="Preview" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center text-gray-400 space-y-3">
                    <ImageIcon size={32} className="opacity-20" />
                    <span className="text-[10px] font-bold uppercase tracking-widest text-center px-4">Click to select banner</span>
                  </div>
                )}
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2 backdrop-blur-[2px]">
                  <label className="bg-white text-gray-900 px-4 py-2 rounded-lg text-xs font-bold shadow-sm cursor-pointer flex items-center gap-2 hover:bg-gray-50 transition-colors">
                    <Upload size={14} className="text-primary-600" />
                    Upload New
                    <input type="file" className="hidden" accept="image/*" onChange={(e) => {
                      setSelectedFile(e.target.files?.[0] || null);
                      setNewProgram({ ...newProgram, imageUrl: undefined });
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
          </div>

          <div className="flex items-center gap-3 pt-4 border-t border-gray-100 dark:border-gray-700">
            <button
              type="submit"
              disabled={saving}
              className="bg-primary-600 hover:bg-primary-700 text-white px-8 py-2.5 rounded-lg font-bold flex items-center gap-2 shadow-sm transition-all active:scale-95 disabled:opacity-50"
            >
              {saving ? <Loader2 className="animate-spin w-4 h-4" /> : <Save size={18} />}
              Save Program
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

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
        {programs.map((program) => (
          <div key={program.id} className="group bg-white dark:bg-gray-800 rounded-xl p-5 shadow-sm border border-gray-100 dark:border-gray-700 hover:shadow-md transition-all duration-300 space-y-6">
            <div className="relative aspect-video rounded-lg overflow-hidden">
              <img src={getFullUrl(program.imageUrl)} alt={program.title} className="w-full h-full object-cover" />
              <div className="absolute top-4 left-4 bg-primary-600 px-2.5 py-1 rounded-full text-[10px] font-bold text-white uppercase tracking-widest">{program.level}</div>
              <button
                onClick={() => handleDelete(program.id)}
                className="absolute top-4 right-4 p-1.5 bg-red-600 text-white rounded-lg opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
              >
                <Trash2 size={16} />
              </button>
            </div>
            <div className="px-1 space-y-2">
              <h4 className="text-xl font-bold text-gray-900 dark:text-white leading-tight group-hover:text-primary-600 transition-colors">{program.title}</h4>
              <p className="text-gray-500 dark:text-gray-400 text-sm leading-relaxed line-clamp-3">{program.description}</p>
            </div>
          </div>
        ))}
      </div>
      <MediaSelectorModal 
        isOpen={isMediaModalOpen}
        onClose={() => setIsMediaModalOpen(false)}
        onSelect={(media) => {
          setNewProgram({ ...newProgram, imageUrl: media.url });
          setSelectedFile(null);
        }}
      />
    </div>
  );
};

export default ProgramManager;
