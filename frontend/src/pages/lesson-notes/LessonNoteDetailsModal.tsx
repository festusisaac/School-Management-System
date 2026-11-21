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
    const printWindow = window.open('', '_blank', 'width=900,height=700');
    if (!printWindow) {
      toast.showError('Pop-up blocked. Please allow pop-ups for this site to print.');
      return;
    }

    const noteDate = note.date ? format(new Date(note.date), 'MMMM dd, yyyy') : 'N/A';
    const teacherName = `${note.teacher?.firstName || ''} ${note.teacher?.lastName || ''}`.trim() || 'N/A';
    const reviewerName = note.reviewer ? `${note.reviewer.firstName || ''} ${note.reviewer.lastName || ''}`.trim() : '';
    const reviewedDate = note.reviewedAt ? format(new Date(note.reviewedAt), 'MMM dd, yyyy') : '';

    printWindow.document.write(`
      <!doctype html>
      <html>
        <head>
          <meta charset="utf-8" />
          <title>Lesson Note - ${(note.topic || '').replace(/</g, '&lt;')}</title>
          <style>
            @page {
              size: A4;
              margin: 10mm 10mm;
            }
            * { box-sizing: border-box; margin: 0; padding: 0; }
            html, body {
              width: 100%;
              font-family: 'Segoe UI', system-ui, -apple-system, sans-serif;
              font-size: 14px;
              line-height: 1.6;
              color: #1a1a1a;
              background: #fff;
              -webkit-print-color-adjust: exact;
              print-color-adjust: exact;
            }
            .container {
              width: 100%;
              max-width: 100%;
              padding: 0;
            }
            .header {
              text-align: center;
              border-bottom: 2px solid #1e293b;
              padding-bottom: 16px;
              margin-bottom: 24px;
            }
            .header h1 {
              font-size: 22px;
              font-weight: 800;
              text-transform: uppercase;
              letter-spacing: -0.5px;
              color: #0f172a;
              margin-bottom: 16px;
            }
            .meta-grid {
              display: grid;
              grid-template-columns: 1fr 1fr;
              gap: 8px 24px;
              font-size: 13px;
              text-align: left;
            }
            .meta-grid div {
              padding: 2px 0;
            }
            .meta-grid strong {
              color: #334155;
            }
            .content {
              margin-top: 8px;
            }
            .content h1, .content h2, .content h3, .content h4, .content h5, .content h6 {
              margin-top: 1em;
              margin-bottom: 0.5em;
              color: #0f172a;
            }
            .content p {
              margin-bottom: 0.8em;
            }
            .content ul, .content ol {
              margin-bottom: 0.8em;
              padding-left: 24px;
            }
            .content li {
              margin-bottom: 0.3em;
            }
            .content table {
              width: 100%;
              border-collapse: collapse;
              margin: 1em 0;
              break-inside: avoid;
            }
            .content table th,
            .content table td {
              border: 1px solid #cbd5e1;
              padding: 6px 10px;
              text-align: left;
              font-size: 13px;
            }
            .content table th {
              background: #f1f5f9;
              font-weight: 700;
            }
            .content img {
              max-width: 100%;
              height: auto;
            }
            .content blockquote {
              border-left: 3px solid #94a3b8;
              padding-left: 12px;
              margin: 1em 0;
              color: #475569;
              font-style: italic;
            }
            .footer {
              margin-top: 40px;
              padding-top: 12px;
              border-top: 1px solid #e2e8f0;
              font-size: 11px;
              font-style: italic;
              color: #94a3b8;
              display: flex;
              justify-content: space-between;
              break-inside: avoid;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Lesson Note</h1>
              <div class="meta-grid">
                <div><strong>Topic:</strong> ${(note.topic || '').replace(/</g, '&lt;')}</div>
                <div><strong>Subject:</strong> ${(note.subject?.name || 'N/A').replace(/</g, '&lt;')}</div>
                <div><strong>Class:</strong> ${(note.class?.name || 'N/A').replace(/</g, '&lt;')}</div>
                <div><strong>Date:</strong> ${noteDate}</div>
                <div><strong>Teacher:</strong> ${teacherName.replace(/</g, '&lt;')}</div>
                <div><strong>Duration:</strong> ${(note.duration || 'N/A').replace(/</g, '&lt;')}</div>
              </div>
            </div>

            <div class="content">
              ${note.content || '<p style="color: #94a3b8; font-style: italic;">This lesson note has no content.</p>'}
            </div>

            <div class="footer">
              <span>Status: ${(note.status || '').toUpperCase()}</span>
              ${note.status === 'approved' && reviewerName ? `<span>Approved by: ${reviewerName.replace(/</g, '&lt;')} on ${reviewedDate}</span>` : ''}
            </div>
          </div>

          <script>
            (function() {
              var images = Array.from(document.images || []);
              var done = false;

              function doPrint() {
                if (done) return;
                done = true;
                setTimeout(function() {
                  window.focus();
                  window.print();
                  window.addEventListener('mouseover', function() {
                    setTimeout(function() { window.close(); }, 500);
                  }, { once: true });
                }, 400);
              }

              if (images.length === 0) {
                window.addEventListener('load', doPrint, { once: true });
                setTimeout(doPrint, 1500);
              } else {
                var loaded = 0;
                function check() {
                  loaded++;
                  if (loaded >= images.length) doPrint();
                }
                images.forEach(function(img) {
                  if (img.complete) check();
                  else {
                    img.addEventListener('load', check, { once: true });
                    img.addEventListener('error', check, { once: true });
                  }
                });
                setTimeout(doPrint, 3000);
              }
            })();
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  return (
    <div className="fixed inset-0 z-[60] overflow-y-auto bg-slate-950/90 flex items-center justify-center p-0 md:p-4">
      <div className="bg-white dark:bg-slate-950 w-full max-w-5xl md:rounded-xl border border-slate-200 dark:border-slate-800 flex flex-col h-full md:h-auto max-h-[100vh] md:max-h-[95vh] overflow-hidden">
        
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-white dark:bg-slate-950">
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
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
          <div className="bg-white dark:bg-slate-950 border border-slate-100 dark:border-slate-800 p-8 md:p-12 min-h-[400px]">
             <div className="prose prose-slate dark:prose-invert max-w-none">
                <div dangerouslySetInnerHTML={{ __html: note.content || '<p class="italic text-slate-400">This lesson note has no content.</p>' }} />
             </div>
          </div>

          {/* Supervisor Review Status (Only in UI) */}
          {(note.status === 'approved' || note.status === 'rejected') && (
            <div className={`p-6 rounded-xl border ${
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
            <div className="bg-slate-900 text-white p-8 rounded-xl space-y-6">
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
        <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-950 flex items-center justify-end gap-3">
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
