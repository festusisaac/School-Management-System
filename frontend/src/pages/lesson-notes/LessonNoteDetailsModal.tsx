import React, { useState } from 'react';
import { 
  X, 
  CheckCircle, 
  XCircle, 
  MessageSquare, 
  Calendar, 
  User, 
  Clock, 
  Printer, 
  AlertTriangle,
  FileText
} from 'lucide-react';
import { format } from 'date-fns';
import { LessonNote, lessonNoteService } from '../../services/lessonNote.service';
import { useToast } from '../../context/ToastContext';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  note: LessonNote | null;
  canApprove: boolean;
  onSuccess: () => void;
}

const LessonNoteDetailsModal: React.FC<Props> = ({ isOpen, onClose, note, canApprove, onSuccess }) => {
  const toast = useToast();
  const [reviewNotes, setReviewNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (!isOpen || !note) return null;

  const handleReview = async (status: 'approved' | 'rejected') => {
    if (status === 'rejected' && !reviewNotes.trim()) {
      toast.showError('Please provide review notes when rejecting');
      return;
    }

    try {
      setSubmitting(true);
      await lessonNoteService.reviewLessonNote(note.id, { status, reviewNotes });
      toast.showSuccess(`Lesson note ${status === 'approved' ? 'approved' : 'returned for correction'}`);
      onSuccess();
      onClose();
    } catch (error) {
      toast.showError('Failed to submit review');
    } finally {
      setSubmitting(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-[60] overflow-y-auto bg-slate-950/90 flex items-center justify-center p-0 md:p-4">
      {/* Print-only CSS */}
      <style>
        {`
          @media print {
            body * {
              visibility: hidden;
            }
            #printable-lesson-note, #printable-lesson-note * {
              visibility: visible;
            }
            #printable-lesson-note {
              position: absolute;
              left: 0;
              top: 0;
              width: 100%;
              padding: 0 !important;
              margin: 0 !important;
              border: none !important;
              box-shadow: none !important;
              background: white !important;
            }
            .no-print {
              display: none !important;
            }
          }
        `}
      </style>

      <div className="bg-white dark:bg-slate-950 w-full max-w-5xl md:rounded-xl border border-slate-200 dark:border-slate-800 flex flex-col h-full md:h-auto max-h-[100vh] md:max-h-[95vh] overflow-hidden">
        
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-white dark:bg-slate-950 no-print">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-slate-50 dark:bg-slate-900 text-slate-600 dark:text-slate-400 rounded-lg border border-slate-200 dark:border-slate-800">
              <FileText size={20} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white leading-tight">
                {note.topic}
              </h2>
              <p className="text-[10px] font-bold text-primary-600 dark:text-primary-400 uppercase tracking-widest mt-0.5">
                {note.subject?.name} • {note.class?.name}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button 
              onClick={handlePrint}
              className="p-2 text-slate-400 hover:text-primary-600 transition-colors"
              title="Print Lesson Note"
            >
              <Printer size={20} />
            </button>
            <button 
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
            >
              <X size={24} />
            </button>
          </div>
        </div>

        {/* Modal Content */}
        <div className="flex-1 overflow-y-auto p-6 md:p-10 space-y-8 bg-white dark:bg-slate-950 custom-scrollbar">
          
          {/* Metadata Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 no-print">
            <div className="flex items-center gap-3 p-3 bg-slate-50/50 dark:bg-slate-900/50 rounded-lg border border-slate-100 dark:border-slate-800">
              <User size={16} className="text-slate-400" />
              <div>
                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Teacher</p>
                <p className="text-xs font-bold text-slate-700 dark:text-slate-200">{note.teacher?.firstName} {note.teacher?.lastName}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 bg-slate-50/50 dark:bg-slate-900/50 rounded-lg border border-slate-100 dark:border-slate-800">
              <Calendar size={16} className="text-slate-400" />
              <div>
                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Date</p>
                <p className="text-xs font-bold text-slate-700 dark:text-slate-200">{note.date ? format(new Date(note.date), 'MMM dd, yyyy') : 'N/A'}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 bg-slate-50/50 dark:bg-slate-900/50 rounded-lg border border-slate-100 dark:border-slate-800">
              <Clock size={16} className="text-slate-400" />
              <div>
                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Session</p>
                <p className="text-xs font-bold text-slate-700 dark:text-slate-200">{note.term?.name} • {note.session?.name}</p>
              </div>
            </div>
          </div>

          {/* Lesson Note Document Area */}
          <div id="printable-lesson-note" className="bg-white dark:bg-slate-950 border border-slate-100 dark:border-slate-800 p-8 md:p-12 min-h-[400px]">
             {/* Printable Header - Only visible during print */}
             <div className="hidden print:block border-b-2 border-slate-900 pb-4 mb-8">
                <h1 className="text-2xl font-bold text-center uppercase tracking-tighter mb-2">Lesson Note</h1>
                <div className="grid grid-cols-2 gap-4 text-sm font-medium">
                   <div><strong>Topic:</strong> {note.topic}</div>
                   <div><strong>Subject:</strong> {note.subject?.name}</div>
                   <div><strong>Class:</strong> {note.class?.name}</div>
                   <div><strong>Date:</strong> {note.date ? format(new Date(note.date), 'MMMM dd, yyyy') : 'N/A'}</div>
                   <div><strong>Teacher:</strong> {note.teacher?.firstName} {note.teacher?.lastName}</div>
                   <div><strong>Duration:</strong> {note.duration}</div>
                </div>
             </div>

             <div className="prose prose-slate dark:prose-invert max-w-none print:prose-black">
                <div dangerouslySetInnerHTML={{ __html: note.content || '<p class="italic text-slate-400">This lesson note has no content.</p>' }} />
             </div>

             {/* Printable Footer - Status/Review */}
             <div className="hidden print:block mt-12 pt-8 border-t border-slate-200 text-xs italic text-slate-500">
                <div className="flex justify-between">
                   <span>Status: {note.status.toUpperCase()}</span>
                   {note.status === 'approved' && (
                      <span>Approved by: {note.reviewer?.firstName} {note.reviewer?.lastName} on {note.reviewedAt ? format(new Date(note.reviewedAt), 'MMM dd, yyyy') : ''}</span>
                   )}
                </div>
             </div>
          </div>

          {/* Supervisor Review Status (Only in UI) */}
          {(note.status === 'approved' || note.status === 'rejected') && (
            <div className={`p-6 rounded-xl border no-print ${
              note.status === 'approved' 
              ? 'bg-green-50/50 border-green-100 dark:bg-green-900/10 dark:border-green-900/30' 
              : 'bg-red-50/50 border-red-100 dark:bg-red-900/10 dark:border-red-900/30'
            }`}>
              <div className="flex items-start gap-4">
                <div className={`p-2 rounded-lg ${note.status === 'approved' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                  {note.status === 'approved' ? <CheckCircle size={20} /> : <AlertTriangle size={20} />}
                </div>
                <div className="space-y-1 flex-1">
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                    {note.status === 'approved' ? 'Officially Approved' : 'Returned for Correction'}
                  </h4>
                  <p className="text-[10px] font-medium text-slate-500">
                    By {note.reviewer?.firstName} {note.reviewer?.lastName} • {note.reviewedAt ? format(new Date(note.reviewedAt), 'MMM dd, yyyy HH:mm') : ''}
                  </p>
                  {note.reviewNotes && (
                    <div className="mt-3 p-3 bg-white/50 dark:bg-slate-900/50 rounded-lg border border-white dark:border-slate-800 text-xs text-slate-600 dark:text-slate-300">
                      <strong>Comments:</strong> {note.reviewNotes}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Supervisor Review Form (Only in UI) */}
          {canApprove && note.status === 'submitted' && (
            <div className="bg-slate-900 text-white p-8 rounded-xl no-print space-y-6">
              <div className="flex items-center gap-2">
                <MessageSquare className="text-primary-400" size={18} />
                <h3 className="text-lg font-bold">Academic Review</h3>
              </div>
              
              <div className="space-y-4">
                <textarea 
                  value={reviewNotes}
                  onChange={(e) => setReviewNotes(e.target.value)}
                  placeholder="Enter your feedback or correction notes..."
                  className="w-full bg-slate-800 border-slate-700 rounded-lg p-4 text-xs focus:ring-1 focus:ring-primary-500 outline-none min-h-[100px] transition-all text-white placeholder:text-slate-500"
                />
                <div className="flex flex-col md:flex-row items-center gap-3">
                  <button 
                    onClick={() => handleReview('rejected')}
                    disabled={submitting}
                    className="w-full md:flex-1 py-3 px-4 bg-red-600 hover:bg-red-700 rounded-lg font-bold text-xs flex items-center justify-center gap-2 transition-all disabled:opacity-50"
                  >
                    <XCircle size={16} />
                    Return for Correction
                  </button>
                  <button 
                    onClick={() => handleReview('approved')}
                    disabled={submitting}
                    className="w-full md:flex-1 py-3 px-4 bg-green-600 hover:bg-green-700 rounded-lg font-bold text-xs flex items-center justify-center gap-2 transition-all disabled:opacity-50"
                  >
                    <CheckCircle size={16} />
                    Approve Note
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-950 flex items-center justify-end gap-3 no-print">
          <button 
            onClick={onClose}
            className="px-5 py-2 bg-slate-100 dark:bg-slate-900 text-slate-600 dark:text-slate-400 rounded-lg hover:bg-slate-200 transition-colors font-bold text-xs"
          >
            Close
          </button>
          <button 
            onClick={handlePrint}
            className="flex items-center gap-2 px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors font-bold text-xs shadow-sm"
          >
            <Printer size={16} />
            Print Note
          </button>
        </div>
      </div>
    </div>
  );
};

export default LessonNoteDetailsModal;
