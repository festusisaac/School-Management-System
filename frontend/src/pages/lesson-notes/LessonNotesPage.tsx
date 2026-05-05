import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Search, 
  BookOpen, 
  Edit2, 
  Trash2, 
  Copy, 
  CheckCircle, 
  Clock, 
  AlertCircle,
  ExternalLink,
  Eye,
  Calendar
} from 'lucide-react';
import { format } from 'date-fns';
import { lessonNoteService, LessonNote } from '../../services/lessonNote.service';
import { useToast } from '../../context/ToastContext';
import { useAuthStore } from '../../stores/authStore';
import { usePermissions } from '../../hooks/usePermissions';
import LessonNoteForm from './LessonNoteForm';
import LessonNoteDetailsModal from './LessonNoteDetailsModal';

const LessonNotesPage: React.FC = () => {
  const { user } = useAuthStore();
  const toast = useToast();
  const [loading, setLoading] = useState(true);
  const [lessonNotes, setLessonNotes] = useState<LessonNote[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  
  // Modals
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [selectedNoteId, setSelectedNoteId] = useState<string | undefined>(undefined);
  const [selectedNote, setSelectedNote] = useState<LessonNote | null>(null);

  // Check permissions
  const { hasPermission } = usePermissions();
  const userRole = (user?.role || user?.roleObject?.name || '').toLowerCase();
  const isTeacher = userRole.includes('teacher');
  const canApprove = hasPermission('lesson_notes:approve');
  const canManage = hasPermission('lesson_notes:manage');

  useEffect(() => {
    fetchLessonNotes();
  }, [filterStatus]);

  const fetchLessonNotes = async () => {
    try {
      setLoading(true);
      const params: any = {};
      if (filterStatus !== 'all') params.status = filterStatus;
      const response = await lessonNoteService.getLessonNotes(params);
      setLessonNotes(response || []);
    } catch (error) {
      console.error('Error fetching lesson notes:', error);
      toast.showError('Failed to load lesson notes');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    setSelectedNoteId(undefined);
    setIsFormOpen(true);
  };

  const handleEdit = (id: string) => {
    setSelectedNoteId(id);
    setIsFormOpen(true);
  };

  const handleView = (note: LessonNote) => {
    setSelectedNote(note);
    setIsDetailsOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this lesson note?')) return;
    try {
      await lessonNoteService.deleteLessonNote(id);
      toast.showSuccess('Lesson note deleted successfully');
      fetchLessonNotes();
    } catch (error) {
      toast.showError('Failed to delete lesson note');
    }
  };

  const handleClone = async (id: string) => {
    try {
      await lessonNoteService.cloneLessonNote(id);
      toast.showSuccess('Lesson note cloned as draft');
      fetchLessonNotes();
    } catch (error) {
      toast.showError('Failed to clone lesson note');
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return <span className="px-2.5 py-1 text-[10px] font-bold bg-green-50 text-green-600 dark:bg-green-900/20 dark:text-green-400 rounded-lg flex items-center gap-1 uppercase tracking-wider border border-green-100 dark:border-green-800/30"><CheckCircle size={12} /> Approved</span>;
      case 'submitted':
        return <span className="px-2.5 py-1 text-[10px] font-bold bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400 rounded-lg flex items-center gap-1 uppercase tracking-wider border border-blue-100 dark:border-blue-800/30"><Clock size={12} /> Pending Review</span>;
      case 'rejected':
        return <span className="px-2.5 py-1 text-[10px] font-bold bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400 rounded-lg flex items-center gap-1 uppercase tracking-wider border border-red-100 dark:border-red-800/30"><AlertCircle size={12} /> Needs Correction</span>;
      default:
        return <span className="px-2.5 py-1 text-[10px] font-bold bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 rounded-lg flex items-center gap-1 uppercase tracking-wider border border-slate-200 dark:border-slate-700/50">Draft</span>;
    }
  };

  const filteredNotes = lessonNotes.filter(n => 
    n.topic.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (n.subject?.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (n.class?.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (`${n.teacher?.firstName} ${n.teacher?.lastName}`).toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-10">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
            Lesson Notes & Academic Plans
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Manage and track instructional guides and academic documentation.
          </p>
        </div>
        <div className="flex items-center gap-3 w-full md:w-auto">
          {canManage ? (
            <button 
              onClick={handleCreate}
              className="flex items-center justify-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-all shadow-sm font-medium text-sm"
            >
              <Plus className="w-4 h-4" />
              New Lesson Note
            </button>
          ) : (
            <div className="px-4 py-2 bg-slate-100 dark:bg-slate-900 text-slate-600 dark:text-slate-400 rounded-lg text-xs font-bold border border-slate-200 dark:border-slate-800">
              Admin Review Mode
            </div>
          )}
        </div>
      </div>

      {/* Stats Area */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[
          { label: isTeacher ? 'My Total Notes' : 'All School Notes', value: lessonNotes.length, color: 'slate' },
          { label: 'Approved', value: lessonNotes.filter(n => n.status === 'approved').length, color: 'green' },
          { label: isTeacher ? 'Submitted' : 'Awaiting Review', value: lessonNotes.filter(n => n.status === 'submitted').length, color: 'blue' },
          { label: isTeacher ? 'Drafts/Needs Fix' : 'Returned Notes', value: lessonNotes.filter(n => n.status === 'draft' || n.status === 'rejected').length, color: 'amber' },
        ].map((stat, idx) => (
          <div key={idx} className="bg-white dark:bg-slate-900/50 p-4 rounded-xl border border-slate-100 dark:border-slate-800 shadow-sm">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">{stat.label}</p>
            <p className={`text-2xl font-bold ${stat.color === 'green' ? 'text-green-600' : stat.color === 'blue' ? 'text-blue-600' : stat.color === 'amber' ? 'text-amber-500' : 'text-slate-900 dark:text-white'}`}>
              {stat.value}
            </p>
          </div>
        ))}
      </div>

      {/* Filters Area */}
      <div className="bg-white dark:bg-slate-950 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm flex flex-col lg:flex-row gap-4 items-center">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input 
            type="text"
            placeholder="Search by topic, subject, class or teacher..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-11 pr-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 text-sm focus:ring-2 focus:ring-primary-500 outline-none transition-all"
          />
        </div>
        <div className="flex items-center gap-2 w-full lg:w-auto overflow-x-auto pb-1 lg:pb-0 scrollbar-hide">
          {['all', 'draft', 'submitted', 'approved', 'rejected'].map((status) => (
            <button
              key={status}
              onClick={() => setFilterStatus(status)}
              className={`px-4 py-2 rounded-lg text-xs font-bold whitespace-nowrap transition-all ${
                filterStatus === status 
                ? 'bg-primary-600 text-white shadow-md shadow-primary-500/20' 
                : 'bg-slate-50 dark:bg-slate-900 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              {status.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      {/* Content Area */}
      <div className="grid grid-cols-1 gap-4">
        {loading ? (
          Array(4).fill(0).map((_, i) => (
            <div key={i} className="bg-white dark:bg-slate-900/50 h-32 rounded-2xl animate-pulse border border-slate-100 dark:border-slate-800"></div>
          ))
        ) : filteredNotes.length > 0 ? (
          filteredNotes.map((note) => (
            <div key={note.id} className="group bg-white dark:bg-slate-950 p-6 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm hover:shadow-xl hover:border-primary-500/30 transition-all duration-500 relative overflow-hidden flex flex-col md:flex-row md:items-center gap-6">
              {/* Left Color Indicator */}
              <div className={`absolute left-0 top-0 bottom-0 w-1.5 ${
                note.status === 'approved' ? 'bg-green-500' : 
                note.status === 'submitted' ? 'bg-blue-500' : 
                note.status === 'rejected' ? 'bg-red-500' : 'bg-slate-300 dark:bg-slate-700'
              }`}></div>

              <div className="flex-1 flex gap-4">
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 shadow-inner ${
                  note.status === 'approved' ? 'bg-green-50 dark:bg-green-900/20 text-green-600' : 
                  note.status === 'submitted' ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600' :
                  'bg-slate-50 dark:bg-slate-900 text-slate-500'
                }`}>
                  <BookOpen className="w-7 h-7" />
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-3 flex-wrap">
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white group-hover:text-primary-600 transition-colors">{note.topic}</h3>
                    {getStatusBadge(note.status)}
                  </div>
                  <div className="flex flex-wrap items-center gap-y-1 gap-x-4 text-xs font-medium text-slate-500 dark:text-slate-400">
                    <span className="flex items-center gap-1.5 text-primary-600 dark:text-primary-400 font-bold bg-primary-50 dark:bg-primary-900/20 px-2 py-0.5 rounded-md">
                      {note.subject?.name} • {note.class?.name}
                    </span>
                    <span className="flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5" />
                      {note.date ? format(new Date(note.date), 'MMM dd, yyyy') : 'No Date Set'}
                    </span>
                    <span className="flex items-center gap-1.5 italic">
                      <Edit2 className="w-3.5 h-3.5" />
                      By: {note.teacher?.firstName} {note.teacher?.lastName}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3 shrink-0 ml-auto md:ml-0">
                <button 
                  onClick={() => handleView(note)}
                  className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:text-primary-600 dark:hover:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900/20 transition-all border border-transparent hover:border-primary-100 dark:hover:border-primary-900/30"
                  title="View Details"
                >
                  <Eye size={20} />
                </button>
                
                {((canManage && (note.status === 'draft' || note.status === 'rejected')) || canApprove) && (
                  <button 
                    onClick={() => handleEdit(note.id)}
                    className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all border border-transparent hover:border-blue-100 dark:hover:border-blue-900/30"
                    title="Edit Note"
                  >
                    <Edit2 size={20} />
                  </button>
                )}

                <div className="h-6 w-px bg-slate-200 dark:bg-slate-800 mx-1 hidden md:block"></div>

                <div className="flex items-center gap-2">
                  <button 
                    onClick={() => handleClone(note.id)}
                    className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-all border border-transparent hover:border-indigo-100 dark:hover:border-indigo-900/30"
                    title="Clone / Copy"
                  >
                    <Copy size={20} />
                  </button>
                  <button 
                    onClick={() => handleDelete(note.id)}
                    className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all border border-transparent hover:border-red-100 dark:hover:border-red-900/30"
                    title="Delete"
                  >
                    <Trash2 size={20} />
                  </button>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="bg-white dark:bg-slate-950 p-20 rounded-3xl border border-slate-100 dark:border-slate-800 text-center shadow-sm">
            <div className="w-20 h-20 bg-slate-50 dark:bg-slate-900 rounded-2xl flex items-center justify-center mx-auto mb-6 rotate-12 transition-transform duration-500">
              <BookOpen className="w-10 h-10 text-slate-300" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">No Lesson Notes Found</h3>
            <p className="text-slate-500 dark:text-slate-400 max-w-sm mx-auto mb-8 font-medium">
              Start by creating your first lesson note. You can also clone existing notes to save time.
            </p>
            {isTeacher && (
              <button 
                onClick={handleCreate}
                className="inline-flex items-center gap-2 px-8 py-3 bg-primary-600 text-white rounded-xl hover:bg-primary-700 transition-all font-bold text-sm shadow-lg shadow-primary-500/25"
              >
                <Plus className="w-5 h-5" />
                Create First Note
              </button>
            )}
          </div>
        )}
      </div>



      {/* Forms & Modals */}
      {isFormOpen && (
        <LessonNoteForm 
          id={selectedNoteId}
          onClose={() => setIsFormOpen(false)}
          onSuccess={fetchLessonNotes}
        />
      )}

      {isDetailsOpen && (
        <LessonNoteDetailsModal 
          isOpen={isDetailsOpen}
          onClose={() => setIsDetailsOpen(false)}
          note={selectedNote}
          canApprove={canApprove}
          onSuccess={fetchLessonNotes}
        />
      )}
    </div>
  );
};

export default LessonNotesPage;
