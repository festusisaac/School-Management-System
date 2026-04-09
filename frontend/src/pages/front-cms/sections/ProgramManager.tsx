import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Save, Loader2, Upload, Pencil, X, Image as ImageIcon } from 'lucide-react';
import cmsService, { CmsProgram } from '@services/cms.service';
import { useSystem } from '@/context/SystemContext';
import { useToast } from '@/context/ToastContext';
import MediaSelectorModal from '../components/MediaSelectorModal';
import RichTextEditor from '@/components/common/RichTextEditor';

const ProgramManager: React.FC = () => {
  const [programs, setPrograms] = useState<CmsProgram[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  
  const toast = useToast();
  const { getFullUrl } = useSystem();

  const [formData, setFormData] = useState<Partial<CmsProgram>>({ 
    title: '', 
    description: '', 
    level: 'Nursery' 
  });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isMediaModalOpen, setIsMediaModalOpen] = useState(false);

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

  const resetForm = () => {
    setFormData({ title: '', description: '', level: 'Nursery' });
    setSelectedFile(null);
    setIsAdding(false);
    setEditId(null);
  };

  const handleEdit = (program: CmsProgram) => {
    setFormData({
      title: program.title,
      description: program.description,
      level: program.level,
      imageUrl: program.imageUrl
    });
    setEditId(program.id);
    setIsAdding(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title?.trim()) {
      toast.showError('Please enter a program title');
      return;
    }
    if (!formData.description?.trim() || formData.description === '<p><br></p>') {
      toast.showError('Please enter a description');
      return;
    }
    if (!selectedFile && !formData.imageUrl) {
      toast.showError('Please select a banner image');
      return;
    }

    setSaving(true);
    try {
      if (editId) {
        await cmsService.updateProgram(editId, formData, selectedFile || undefined);
        toast.showSuccess('Program updated');
      } else {
        await cmsService.createProgram(formData, selectedFile || formData.imageUrl || '');
        toast.showSuccess('Program added');
      }
      resetForm();
      fetchPrograms();
    } catch (error) {
      toast.showError(editId ? 'Failed to update program' : 'Failed to add program');
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
      <div className="flex items-center justify-between gap-4 mb-2">
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
        <form onSubmit={handleSubmit} className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm space-y-6 animate-in slide-in-from-top-4 duration-300">
          <div className="grid lg:grid-cols-2 gap-8">
            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold uppercase text-gray-400 tracking-wider">Level / Category</label>
                <select
                  value={formData.level}
                  onChange={(e) => setFormData({ ...formData, level: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm focus:ring-2 focus:ring-primary-500 outline-none transition-all"
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
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Ex: Early Foundation"
                  className="w-full px-4 py-2.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm focus:ring-2 focus:ring-primary-500 outline-none transition-all"
                />
              </div>
              <div className="space-y-1.5 min-h-[200px]">
                <label className="text-xs font-semibold uppercase text-gray-400 tracking-wider">Description</label>
                <RichTextEditor 
                  value={formData.description || ''} 
                  onChange={(val) => setFormData({ ...formData, description: val })}
                  placeholder="Describe this academic stage..."
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase text-gray-400 tracking-wider">Program Banner Image</label>
              <div className="relative aspect-video rounded-lg overflow-hidden bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 group">
                {selectedFile ? (
                  <img src={URL.createObjectURL(selectedFile)} alt="Preview" className="w-full h-full object-cover" />
                ) : formData.imageUrl ? (
                  <img src={getFullUrl(formData.imageUrl)} alt="Preview" className="w-full h-full object-cover" />
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
          </div>

          <div className="flex items-center gap-3 pt-4 border-t border-gray-100 dark:border-gray-700">
            <button
              type="submit"
              disabled={saving}
              className="bg-primary-600 hover:bg-primary-700 text-white px-8 py-2.5 rounded-lg font-bold flex items-center gap-2 shadow-sm transition-all active:scale-95 disabled:opacity-50"
            >
              {saving ? <Loader2 className="animate-spin w-4 h-4" /> : <Save size={18} />}
              {editId ? 'Update Program' : 'Save Program'}
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

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {programs.map((program) => (
          <div key={program.id} className="group bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-100 dark:border-gray-700 hover:shadow-md transition-all duration-300 space-y-4">
            <div className="relative aspect-video rounded-lg overflow-hidden flex-shrink-0 bg-gray-50 dark:bg-gray-900">
              <img src={getFullUrl(program.imageUrl)} alt={program.title} className="w-full h-full object-cover" />
              <div className="absolute top-3 left-3 bg-primary-600 px-2 py-0.5 rounded text-[10px] font-bold text-white uppercase tracking-wider">{program.level}</div>
              
              <div className="absolute top-3 right-3 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={() => handleEdit(program)}
                  className="p-1.5 bg-white text-gray-700 rounded-md shadow-lg hover:bg-primary-600 hover:text-white transition-all transform hover:scale-110"
                >
                  <Pencil size={14} />
                </button>
                <button
                  onClick={() => handleDelete(program.id)}
                  className="p-1.5 bg-white text-red-600 rounded-md shadow-lg hover:bg-red-600 hover:text-white transition-all transform hover:scale-110"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
            <div className="px-1 space-y-1.5">
              <h4 className="text-base font-bold text-gray-900 dark:text-white leading-tight transition-colors line-clamp-1">{program.title}</h4>
              <div 
                className="text-gray-500 dark:text-gray-400 text-xs leading-relaxed line-clamp-2 prose prose-xs dark:prose-invert"
                dangerouslySetInnerHTML={{ __html: program.description }}
              />
            </div>
          </div>
        ))}
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

export default ProgramManager;
