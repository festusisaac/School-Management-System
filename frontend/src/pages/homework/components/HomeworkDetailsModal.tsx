import { useState, useEffect } from 'react';
import { X, Calendar, User, BookOpen, Download, FileText, CheckCircle, Clock, Paperclip, Loader2, Save } from 'lucide-react';
import { format } from 'date-fns';
import homeworkService, { Homework, HomeworkSubmission } from '../../../services/homework.service';
import { getFileUrl } from '../../../services/api';
import { useToast } from '../../../context/ToastContext';

interface HomeworkDetailsModalProps {
    isOpen: boolean;
    onClose: () => void;
    homework: Homework | null;
    isStaff: boolean;
    onStatusClick?: () => void; // e.g. for student to open submission modal
}

export default function HomeworkDetailsModal({ isOpen, onClose, homework, isStaff, onStatusClick }: HomeworkDetailsModalProps) {
    const toast = useToast();
    const [submissions, setSubmissions] = useState<HomeworkSubmission[]>([]);
    const [loadingSubmissions, setLoadingSubmissions] = useState(false);
    const [gradingId, setGradingId] = useState<string | null>(null);
    const [gradeForm, setGradeForm] = useState({ grade: '', feedback: '' });
    const [savingGrade, setSavingGrade] = useState(false);

    useEffect(() => {
        if (isOpen && homework && isStaff) {
            fetchSubmissions();
        }
    }, [isOpen, homework, isStaff]);

    const fetchSubmissions = async () => {
        if (!homework) return;
        try {
            setLoadingSubmissions(true);
            const data = await homeworkService.getSubmissions(homework.id);
            setSubmissions(data || []);
        } catch (error) {
            console.error('Error fetching submissions:', error);
            toast.showError('Failed to load submissions');
        } finally {
            setLoadingSubmissions(false);
        }
    };

    const handleGrade = async (submissionId: string) => {
        try {
            setSavingGrade(true);
            await homeworkService.gradeSubmission(submissionId, gradeForm);
            toast.showSuccess('Submission graded successfully');
            setGradingId(null);
            fetchSubmissions();
        } catch (error) {
            toast.showError('Failed to save grade');
        } finally {
            setSavingGrade(false);
        }
    };

    if (!isOpen || !homework) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 border border-gray-100 dark:border-gray-700">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-900/50">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-primary-50 dark:bg-primary-900/20 flex items-center justify-center text-primary-600 dark:text-primary-400">
                            <BookOpen className="w-5 h-5" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-gray-900 dark:text-white">{homework.title}</h2>
                            <p className="text-sm text-gray-500 dark:text-gray-400">{homework.subject?.name} • {homework.class?.name}</p>
                        </div>
                    </div>
                    <button 
                        onClick={onClose} 
                        className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl transition-colors text-gray-400"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto custom-scrollbar">
                    {/* Meta Info */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-900/50 rounded-xl border border-gray-100 dark:border-gray-700">
                            <Calendar className="w-5 h-5 text-gray-400" />
                            <div>
                                <p className="text-[10px] font-bold text-gray-400 uppercase">Due Date</p>
                                <p className="text-sm font-bold text-gray-900 dark:text-white">
                                    {format(new Date(homework.dueDate), 'MMM dd, yyyy - hh:mm a')}
                                </p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-900/50 rounded-xl border border-gray-100 dark:border-gray-700">
                            <User className="w-5 h-5 text-gray-400" />
                            <div>
                                <p className="text-[10px] font-bold text-gray-400 uppercase">Teacher</p>
                                <p className="text-sm font-bold text-gray-900 dark:text-white">
                                    {homework.teacher?.firstName} {homework.teacher?.lastName}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Description */}
                    <div className="space-y-2">
                        <h3 className="text-sm font-bold text-gray-900 dark:text-white uppercase tracking-wider">Instructions</h3>
                        <div className="p-4 bg-gray-50 dark:bg-gray-900/50 rounded-2xl border border-gray-100 dark:border-gray-700 text-sm text-gray-600 dark:text-gray-300 leading-relaxed whitespace-pre-wrap">
                            {homework.description || 'No instructions provided.'}
                        </div>
                    </div>

                    {/* Attachment */}
                    {homework.attachmentUrl && (
                        <div className="space-y-2">
                            <h3 className="text-sm font-bold text-gray-900 dark:text-white uppercase tracking-wider">Materials</h3>
                            <a 
                                href={getFileUrl(homework.attachmentUrl)}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-3 p-4 bg-primary-50 dark:bg-primary-900/10 rounded-2xl border border-primary-100 dark:border-primary-900/20 group hover:bg-primary-100 transition-all shadow-sm"
                            >
                                <div className="w-10 h-10 rounded-xl bg-primary-100 dark:bg-primary-800 flex items-center justify-center text-primary-600 dark:text-primary-300">
                                    <FileText className="w-5 h-5" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-bold text-gray-900 dark:text-white underline decoration-primary-200">Download Reference Material</p>
                                    <p className="text-xs text-gray-500">Click to view/download attachment</p>
                                </div>
                                <Download className="w-5 h-5 text-primary-600 dark:text-primary-400 group-hover:translate-y-0.5 transition-transform" />
                            </a>
                        </div>
                    )}

                    {/* SUBMISSIONS LIST (Visible to Staff) */}
                    {isStaff && (
                        <div className="space-y-4 pt-4 border-t border-gray-100 dark:border-gray-700">
                            <div className="flex items-center justify-between mb-2">
                                <h3 className="text-sm font-bold text-gray-900 dark:text-white uppercase tracking-wider">Student Submissions</h3>
                                <span className="px-2 py-0.5 text-[10px] font-bold bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-lg">
                                    {submissions.length} Total
                                </span>
                            </div>

                            {loadingSubmissions ? (
                                <div className="flex flex-col items-center justify-center py-8 gap-3">
                                    <Loader2 className="w-8 h-8 text-primary-600 animate-spin" />
                                    <p className="text-sm text-gray-500">Loading submissions...</p>
                                </div>
                            ) : submissions.length > 0 ? (
                                <div className="space-y-4">
                                    {submissions.map((sub) => (
                                        <div key={sub.id} className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-700 overflow-hidden shadow-sm">
                                            <div className="p-4 border-b border-gray-50 dark:border-gray-800 flex justify-between items-start">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 rounded-xl bg-gray-50 dark:bg-gray-800 flex items-center justify-center font-bold text-primary-600">
                                                        {sub.student?.firstName?.[0]}{sub.student?.lastName?.[0]}
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-bold text-gray-900 dark:text-white">{sub.student?.firstName} {sub.student?.lastName}</p>
                                                        <p className="text-[10px] text-gray-500 uppercase font-medium">{format(new Date(sub.submittedAt), 'MMM dd, yyyy - HH:mm')}</p>
                                                    </div>
                                                </div>
                                                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                                                    sub.status === 'GRADED' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                                                }`}>
                                                    {sub.status}
                                                </span>
                                            </div>

                                            <div className="p-4 space-y-3">
                                                {sub.content && (
                                                    <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed bg-gray-50/50 dark:bg-gray-800/50 p-3 rounded-xl italic">"{sub.content}"</p>
                                                )}

                                                {sub.attachmentUrls && sub.attachmentUrls.length > 0 && (
                                                    <div className="flex flex-wrap gap-2">
                                                        {sub.attachmentUrls.map((url, i) => (
                                                            <a key={i} href={getFileUrl(url)} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-50 dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-lg text-[10px] font-bold text-primary-600 hover:underline">
                                                                <Paperclip className="w-3 h-3" />
                                                                File {i + 1}
                                                            </a>
                                                        ))}
                                                    </div>
                                                )}

                                                {/* Grading View */}
                                                {gradingId === sub.id ? (
                                                    <div className="pt-3 border-t border-gray-50 dark:border-gray-800 space-y-3 animate-in slide-in-from-top-2">
                                                        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                                                            <div className="md:col-span-1">
                                                                <label className="block text-[10px] uppercase font-bold text-gray-400 mb-1">Grade</label>
                                                                <input 
                                                                    type="text" 
                                                                    className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 text-xs font-bold"
                                                                    placeholder="A, 90, etc."
                                                                    value={gradeForm.grade}
                                                                    onChange={e => setGradeForm({...gradeForm, grade: e.target.value})}
                                                                />
                                                            </div>
                                                            <div className="md:col-span-3">
                                                                <label className="block text-[10px] uppercase font-bold text-gray-400 mb-1">Feedback</label>
                                                                <input 
                                                                    type="text" 
                                                                    className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 text-xs"
                                                                    placeholder="Well done!"
                                                                    value={gradeForm.feedback}
                                                                    onChange={e => setGradeForm({...gradeForm, feedback: e.target.value})}
                                                                />
                                                            </div>
                                                        </div>
                                                        <div className="flex gap-2">
                                                            <button 
                                                                onClick={() => handleGrade(sub.id)}
                                                                disabled={savingGrade}
                                                                className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg text-xs font-bold hover:bg-primary-700"
                                                            >
                                                                {savingGrade ? <Loader2 className="w-3 h-3 animate-spin"/> : <Save className="w-3 h-3"/>}
                                                                Save Grade
                                                            </button>
                                                            <button 
                                                                onClick={() => setGradingId(null)}
                                                                className="px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg text-xs font-bold"
                                                            >
                                                                Cancel
                                                            </button>
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <div className="pt-3 border-t border-gray-50 dark:border-gray-800 flex items-center justify-between gap-4">
                                                        {sub.grade ? (
                                                            <div className="flex-1">
                                                                <p className="text-[11px] font-bold text-gray-900 dark:text-white">Grade: <span className="text-primary-600">{sub.grade}</span></p>
                                                                {sub.feedback && <p className="text-[10px] text-gray-500 italic truncate tracking-tight">{sub.feedback}</p>}
                                                            </div>
                                                        ) : <p className="text-[10px] text-gray-400 italic">Not graded yet</p>}
                                                        <button 
                                                            onClick={() => {
                                                                setGradingId(sub.id);
                                                                setGradeForm({ grade: sub.grade || '', feedback: sub.feedback || '' });
                                                            }}
                                                            className="px-4 py-1.5 bg-gray-50 dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-lg text-[10px] font-bold hover:bg-white transition-colors"
                                                        >
                                                            {sub.grade ? 'Edit Grade' : 'Grade Submission'}
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-8 bg-gray-50 dark:bg-gray-900/50 rounded-2xl border border-gray-100 dark:border-gray-700">
                                    <Clock className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                                    <p className="text-sm text-gray-500 italic">No submissions yet.</p>
                                </div>
                            )}
                        </div>
                    )}

                    {/* YOUR SUBMISSION (Visible to Student) */}
                    {!isStaff && homework.submission && (
                        <div className="space-y-2">
                            <h3 className="text-sm font-bold text-gray-900 dark:text-white uppercase tracking-wider">Your Submission</h3>
                            <div className="p-4 bg-green-50/50 dark:bg-green-900/10 rounded-2xl border border-green-100 dark:border-green-900/20 space-y-3 shadow-sm">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <CheckCircle className="w-4 h-4 text-green-600" />
                                        <span className="text-xs font-bold text-green-700 dark:text-green-300">Submitted on {format(new Date(homework.submission.submittedAt), 'MMM dd, yyyy')}</span>
                                    </div>
                                    <span className="px-2 py-0.5 rounded-full bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 text-[10px] font-bold uppercase tracking-tighter">
                                        {homework.submission.status}
                                    </span>
                                </div>
                                {homework.submission.content && (
                                    <p className="text-xs text-gray-600 dark:text-gray-400 italic bg-white/60 dark:bg-black/20 p-3 rounded-xl">"{homework.submission.content}"</p>
                                )}
                                {homework.submission.attachmentUrls && homework.submission.attachmentUrls.length > 0 && (
                                    <div className="flex flex-wrap gap-2">
                                        {homework.submission.attachmentUrls.map((url, index) => (
                                            <a 
                                                key={index}
                                                href={getFileUrl(url)}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="text-[10px] bg-white/60 dark:bg-black/20 px-3 py-1.5 rounded-lg text-primary-600 font-bold flex items-center gap-1.5 hover:underline border border-green-100/50 dark:border-green-900/20 shadow-sm"
                                            >
                                                <Paperclip className="w-3 h-3" />
                                                File {index + 1}
                                            </a>
                                        ))}
                                    </div>
                                )}
                                {homework.submission.grade && (
                                    <div className="pt-3 border-t border-green-100/50 dark:border-green-900/30">
                                        <p className="text-xs font-bold text-gray-900 dark:text-white mb-1 tracking-tight">Grade: <span className="text-primary-600">{homework.submission.grade}</span></p>
                                        {homework.submission.feedback && (
                                            <div className="p-2 bg-primary-50/30 dark:bg-primary-900/20 rounded-lg">
                                                <p className="text-[10px] text-gray-600 dark:text-gray-400 leading-relaxed"><span className="font-bold">Feedback:</span> {homework.submission.feedback}</p>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer / Actions */}
                <div className="p-6 border-t border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-900/50 flex justify-end">
                    {!isStaff ? (
                        <button 
                            onClick={onStatusClick}
                            className={`flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold transition-all shadow-lg active:scale-[0.98] font-premium ${
                                homework.submission 
                                ? 'bg-white dark:bg-gray-800 border border-primary-600 text-primary-600 hover:bg-primary-50 shadow-primary-500/5' 
                                : 'bg-primary-600 hover:bg-primary-700 text-white shadow-primary-500/20'
                            }`}
                        >
                            {homework.submission ? <Clock className="w-4 h-4" /> : <CheckCircle className="w-4 h-4" />}
                            {homework.submission ? 'Resubmit Assignment' : 'Submit Assignment'}
                        </button>
                    ) : (
                        <button 
                            onClick={onClose}
                            className="px-6 py-2.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl font-bold text-gray-600 dark:text-gray-300 hover:bg-gray-50 transition-all font-premium shadow-sm active:scale-[0.98]"
                        >
                            Close Details
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}
