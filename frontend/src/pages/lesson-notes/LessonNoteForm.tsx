import React, { useState, useEffect } from 'react';
import { 
  Save, 
  Send, 
  X, 
  Info,
  FileText,
  AlertCircle
} from 'lucide-react';
import ModernRichTextEditor from '../../components/common/ModernRichTextEditor';
import { lessonNoteService, LessonNote } from '../../services/lessonNote.service';
import api from '../../services/api';
import systemService, { AcademicSession, AcademicTerm } from '../../services/systemService';
import { useToast } from '../../context/ToastContext';

interface Props {
  id?: string;
  onClose: () => void;
  onSuccess: () => void;
}

const LessonNoteForm: React.FC<Props> = ({ id, onClose, onSuccess }) => {
  const toast = useToast();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [autoSaving, setAutoSaving] = useState(false);
  const [lastSavedContent, setLastSavedContent] = useState('');
  
  // Form State
  const [formData, setFormData] = useState({
    subjectId: '',
    classId: '',
    sessionId: '',
    termId: '',
    topic: '',
    duration: '40 Minutes',
    date: new Date().toISOString().split('T')[0],
    content: ''
  });

  // Data for selects
  const [classes, setClasses] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [sessions, setSessions] = useState<AcademicSession[]>([]);
  const [terms, setTerms] = useState<AcademicTerm[]>([]);

  useEffect(() => {
    fetchInitialData();
    if (id) {
      fetchLessonNote();
    }
  }, [id]);

  const fetchInitialData = async () => {
    try {
      const [classesData, subjectsData, sessionsData, termsData] = await Promise.all([
        api.getClasses(),
        api.getSubjects(),
        systemService.getSessions(),
        systemService.getTerms()
      ]);
      setClasses(classesData || []);
      setSubjects(subjectsData || []);
      setSessions(sessionsData || []);
      setTerms(termsData || []);

      // Set defaults if creating new
      if (!id) {
        const activeSession = (sessionsData || []).find(s => s.isActive);
        const activeTerm = (termsData || []).find(t => t.isActive);
        if (activeSession) setFormData(prev => ({ ...prev, sessionId: activeSession.id }));
        if (activeTerm) setFormData(prev => ({ ...prev, termId: activeTerm.id }));
      }
    } catch (error) {
      console.error('Error fetching initial data:', error);
      toast.showError('Failed to load form data');
    }
  };

  const fetchLessonNote = async () => {
    if (!id) return;
    try {
      setLoading(true);
      const note = await lessonNoteService.getLessonNoteById(id);
      const initialData = {
        subjectId: note.subjectId,
        classId: note.classId,
        sessionId: note.sessionId || '',
        termId: note.termId || '',
        topic: note.topic,
        duration: note.duration || '',
        date: note.date ? note.date.split('T')[0] : '',
        content: note.content || ''
      };
      setFormData(initialData);
      setLastSavedContent(initialData.content);
    } catch (error) {
      console.error('Error fetching lesson note:', error);
      toast.showError('Failed to load lesson note');
    } finally {
      setLoading(false);
    }
  };

  // Auto-save logic
  useEffect(() => {
    if (!id || loading || saving || autoSaving) return;

    const timer = setTimeout(async () => {
      if (formData.content !== lastSavedContent && formData.content.length > 0) {
        try {
          setAutoSaving(true);
          await lessonNoteService.updateLessonNote(id, formData);
          setLastSavedContent(formData.content);
        } catch (error) {
          console.error('Auto-save failed:', error);
        } finally {
          setAutoSaving(false);
        }
      }
    }, 3000); // Auto-save after 3 seconds of inactivity

    return () => clearTimeout(timer);
  }, [formData.content, id, lastSavedContent, loading, saving, autoSaving]);

  const handleSubmit = async (submitForReview = false) => {
    if (!formData.topic || !formData.subjectId || !formData.classId) {
      toast.showError('Please fill in required fields (Topic, Subject, Class)');
      return;
    }

    try {
      setSaving(true);
      let response;
      if (id) {
        response = await lessonNoteService.updateLessonNote(id, formData);
      } else {
        response = await lessonNoteService.createLessonNote(formData);
      }

      if (submitForReview) {
        await lessonNoteService.submitLessonNote(response.id);
        toast.showSuccess('Lesson note saved and submitted for review');
      } else {
        toast.showSuccess('Lesson note saved successfully');
      }
      
      onSuccess();
      onClose();
    } catch (error) {
      console.error('Error saving lesson note:', error);
      toast.showError('Failed to save lesson note');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="fixed inset-0 z-[60] bg-slate-950/80 flex items-center justify-center p-4">
        <div className="bg-white dark:bg-slate-950 p-8 rounded-xl border border-slate-200 dark:border-slate-800 flex flex-col items-center">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-600 mb-4"></div>
          <p className="text-slate-600 dark:text-slate-400 font-medium text-sm">Loading data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[60] overflow-y-auto bg-slate-950/90 flex items-center justify-center p-0 md:p-4">
      <div className="bg-white dark:bg-slate-950 w-full max-w-7xl md:rounded-xl border border-slate-200 dark:border-slate-800 flex flex-col h-full md:h-auto max-h-[100vh] md:max-h-[95vh] overflow-hidden">
        {/* Header */}
        <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-white dark:bg-slate-950 sticky top-0 z-10">
          <div className="flex items-center gap-3">
             <div className="p-2 bg-slate-50 dark:bg-slate-900 text-primary-600 rounded-lg border border-slate-200 dark:border-slate-800">
               <FileText size={20} />
             </div>
             <div>
               <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                 {id ? 'Edit Lesson Note' : 'Create New Lesson Note'}
               </h2>
               <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">
                 Full Document Editing Mode
               </p>
             </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-6 md:p-8 space-y-8 bg-white dark:bg-slate-950 custom-scrollbar">
          
          {/* Top Section: Metadata */}
          <div className="bg-slate-50/50 dark:bg-slate-900/30 p-6 rounded-xl border border-slate-100 dark:border-slate-800 space-y-6">
            <div className="flex items-center gap-2 text-slate-900 dark:text-white font-bold border-b border-slate-200 dark:border-slate-800 pb-2">
              <Info size={16} className="text-slate-400" />
              <span className="text-sm">General Details</span>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Subject *</label>
                <select 
                  value={formData.subjectId}
                  onChange={(e) => setFormData({...formData, subjectId: e.target.value})}
                  className="w-full px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-sm focus:ring-1 focus:ring-primary-500 outline-none transition-all"
                >
                  <option value="">Select Subject</option>
                  {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Class *</label>
                <select 
                  value={formData.classId}
                  onChange={(e) => setFormData({...formData, classId: e.target.value})}
                  className="w-full px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-sm focus:ring-1 focus:ring-primary-500 outline-none transition-all"
                >
                  <option value="">Select Class</option>
                  {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Session</label>
                <select 
                  value={formData.sessionId}
                  onChange={(e) => setFormData({...formData, sessionId: e.target.value})}
                  className="w-full px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-sm focus:ring-1 focus:ring-primary-500 outline-none transition-all"
                >
                  <option value="">Select Session</option>
                  {sessions.map(s => <option key={s.id} value={s.id}>{s.name} {s.isActive ? '(Active)' : ''}</option>)}
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Term</label>
                <select 
                  value={formData.termId}
                  onChange={(e) => setFormData({...formData, termId: e.target.value})}
                  className="w-full px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-sm focus:ring-1 focus:ring-primary-500 outline-none transition-all"
                >
                  <option value="">Select Term</option>
                  {terms.map(t => <option key={t.id} value={t.id}>{t.name} {t.isActive ? '(Active)' : ''}</option>)}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="md:col-span-2 space-y-1.5">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Topic *</label>
                <input 
                  type="text"
                  value={formData.topic}
                  onChange={(e) => setFormData({...formData, topic: e.target.value})}
                  placeholder="e.g. Introduction to Algebra"
                  className="w-full px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-sm focus:ring-1 focus:ring-primary-500 outline-none transition-all font-medium"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Duration</label>
                <input 
                  type="text"
                  value={formData.duration}
                  onChange={(e) => setFormData({...formData, duration: e.target.value})}
                  placeholder="e.g. 40 Minutes"
                  className="w-full px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-sm focus:ring-1 focus:ring-primary-500 outline-none transition-all"
                />
              </div>
            </div>
          </div>

          {/* Big Box Section: Content */}
          <div className="space-y-4">
            <div className="flex items-center justify-between px-1">
              <div className="flex items-center gap-2 text-slate-900 dark:text-white font-bold">
                <FileText className="text-primary-600" size={18} />
                <span className="text-sm">Lesson Content</span>
              </div>
              <div className="text-[9px] text-slate-400 font-bold uppercase tracking-widest bg-slate-50 dark:bg-slate-900 px-2 py-1 rounded border border-slate-200 dark:border-slate-800">
                Word Mode Active
              </div>
            </div>
            
            <div className="border border-slate-200 dark:border-slate-800 rounded-lg overflow-hidden">
               <ModernRichTextEditor 
                 value={formData.content} 
                 onChange={(v) => setFormData({...formData, content: v})}
                 placeholder="Begin writing your lesson note here..."
                 minHeight="500px"
                 isSaving={autoSaving}
               />
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-950 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-xs text-slate-400 italic">
            <AlertCircle size={14} className="text-amber-500" />
            Always save your work manually before closing.
          </div>
          <div className="flex items-center gap-3 w-full md:w-auto">
            <button 
              onClick={() => handleSubmit(false)}
              disabled={saving}
              className="flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-2 bg-slate-100 dark:bg-slate-900 text-slate-600 dark:text-slate-400 rounded-lg hover:bg-slate-200 transition-colors font-bold text-xs disabled:opacity-50"
            >
              <Save size={16} />
              Save Draft
            </button>
            <button 
              onClick={() => handleSubmit(true)}
              disabled={saving}
              className="flex-1 md:flex-none flex items-center justify-center gap-2 px-8 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors font-bold text-xs shadow-sm disabled:opacity-50"
            >
              <Send size={16} />
              Submit for Review
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LessonNoteForm;
