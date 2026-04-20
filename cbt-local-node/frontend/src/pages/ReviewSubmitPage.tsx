import { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { AlertTriangle, CheckCircle, ArrowLeft, ClipboardList } from 'lucide-react';

const API_BASE = '/api';

export default function ReviewSubmitPage() {
    const navigate = useNavigate();
    const sessionData = JSON.parse(localStorage.getItem('cbt_session') || '{}');
    const { student } = sessionData;
    const photoUrl = student?.photoUrl || '';
    const reviewData = JSON.parse(localStorage.getItem('cbt_review') || '{}');

    const [submitting, setSubmitting] = useState(false);
    const [confirm, setConfirm] = useState(false);

    useEffect(() => {
        if (!student || !reviewData.totalQuestions) {
            navigate('/');
        }
    }, [student, reviewData, navigate]);

    const handleFinalSubmit = async () => {
        setSubmitting(true);
        try {
            await axios.post(`${API_BASE}/session/submit`, { studentId: student.id });
            localStorage.removeItem('cbt_review');
            localStorage.removeItem('cbt_session');
            localStorage.removeItem(`cbt_progress_${student.id}`);
            navigate('/success');
        } catch (error) {
            alert('Error submitting exam. Please inform the invigilator immediately.');
            setSubmitting(false);
            setConfirm(false);
        }
    };

    if (!student) return <div />;

    const { answeredCount, totalQuestions } = reviewData;
    const unansweredCount = totalQuestions - answeredCount;

    return (
        <div className="min-h-screen bg-gray-100 flex flex-col font-sans py-10 px-4 items-center justify-center">
            
            <div className="max-w-2xl w-full bg-white rounded-lg shadow-lg border border-gray-200 overflow-hidden">
                
                <div className="bg-blue-900 px-6 py-4 flex items-center justify-between">
                    <div className="flex items-center space-x-3 text-white">
                        <ClipboardList className="w-5 h-5 text-blue-300" />
                        <span className="text-sm font-bold tracking-widest uppercase">Submission Review</span>
                    </div>
                </div>

                <div className="p-6 md:p-8">
                    
                    <div className="flex items-center space-x-4 mb-6 pb-4 border-b">
                        {photoUrl ? (
                            <img
                                src={photoUrl}
                                alt={`${student.fullName} passport`}
                                onError={(e) => {
                                    const target = e.currentTarget;
                                    target.style.display = 'none';
                                    const fallback = target.nextElementSibling as HTMLDivElement | null;
                                    if (fallback) fallback.style.display = 'flex';
                                }}
                                className="w-12 h-12 rounded-full object-cover border border-gray-300 bg-gray-100"
                            />
                        ) : null}
                        <div
                            style={{ display: photoUrl ? 'none' : 'flex' }}
                            className="w-12 h-12 bg-gray-100 rounded-full items-center justify-center font-bold text-gray-500 text-lg border border-gray-300"
                        >
                            {student.fullName.charAt(0)}
                        </div>
                        <div>
                            <p className="text-sm font-bold text-gray-900">{student.fullName}</p>
                            <p className="text-xs font-mono text-gray-500">{student.admissionNo}</p>
                        </div>
                    </div>

                    <div className="bg-gray-50 rounded border p-4 mb-8">
                        <div className="flex justify-between items-center py-2 border-b border-gray-200">
                            <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Total Questions</span>
                            <span className="text-sm font-bold text-gray-900">{totalQuestions}</span>
                        </div>
                        <div className="flex justify-between items-center py-2 border-b border-gray-200">
                            <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Answered</span>
                            <span className="text-sm font-bold text-green-700">{answeredCount}</span>
                        </div>
                        <div className="flex justify-between items-center py-2">
                            <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Unanswered</span>
                            <span className={`text-sm font-bold ${unansweredCount > 0 ? 'text-red-600' : 'text-gray-900'}`}>{unansweredCount}</span>
                        </div>
                    </div>

                    {!confirm ? (
                        <div className="flex justify-between items-center">
                            <button 
                                onClick={() => navigate('/exam')}
                                className="flex items-center px-4 py-2 rounded text-sm font-semibold text-gray-600 bg-white border hover:bg-gray-50 transition-colors"
                            >
                                <ArrowLeft className="w-4 h-4 mr-1.5" /> Return to Exam
                            </button>
                            
                            <button 
                                onClick={() => setConfirm(true)}
                                className="flex items-center px-6 py-2 rounded text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 shadow-sm transition-all"
                            >
                                <CheckCircle className="w-4 h-4 mr-1.5" /> Submit Answers
                            </button>
                        </div>
                    ) : (
                        <div className="bg-amber-50 border border-amber-300 rounded p-5">
                            <div className="flex items-start space-x-3 mb-4">
                                <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                                <div>
                                    <h3 className="text-sm font-bold text-amber-900">Final Confirmation</h3>
                                    <p className="text-xs text-amber-800 mt-1">You are about to submit your exam. You cannot undo this action or return to the questions afterward.</p>
                                </div>
                            </div>
                            
                            <div className="flex justify-end gap-3 border-t border-amber-200 pt-3">
                                <button 
                                    onClick={() => setConfirm(false)}
                                    disabled={submitting}
                                    className="px-4 py-1.5 rounded text-xs font-bold text-amber-900 bg-white border border-amber-300 hover:bg-amber-100 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button 
                                    onClick={handleFinalSubmit}
                                    disabled={submitting}
                                    className="px-6 py-1.5 rounded text-xs font-bold text-white bg-green-600 hover:bg-green-700 shadow-sm transition-colors"
                                >
                                    {submitting ? 'Submitting...' : 'Yes, Submit Now'}
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
