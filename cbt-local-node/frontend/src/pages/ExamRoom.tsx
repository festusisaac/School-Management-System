import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { Clock, ChevronRight, ChevronLeft, Menu, Lock } from 'lucide-react';

const API_BASE = '/api';

export default function ExamRoom() {
    const navigate = useNavigate();
    const [questions, setQuestions] = useState<any[]>([]);
    const [currentIdx, setCurrentIdx] = useState(0);
    const [answers, setAnswers] = useState<Record<string, string>>({});
    const [timeLeft, setTimeLeft] = useState(0);
    const [loading, setLoading] = useState(true);
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const [isPaused, setIsPaused] = useState(false);
    const [error, setError] = useState('');

    const sessionData = JSON.parse(localStorage.getItem('cbt_session') || '{}');
    const { student, examDetails, session } = sessionData;
    const progressKey = student ? `cbt_progress_${student.id}` : 'cbt_progress_unknown';

    const persistProgressLocal = (answersState: Record<string, string>, idx: number) => {
        if (!student) return;
        localStorage.setItem(progressKey, JSON.stringify({
            answers: answersState,
            currentIdx: idx,
            savedAt: new Date().toISOString()
        }));
    };

    useEffect(() => {
        if (!student) {
            navigate('/');
            return;
        }

        const fetchQuestions = async () => {
            try {
                const res = await axios.get(`${API_BASE}/questions?studentId=${student.id}`);
                setQuestions(res.data);

                const serverAnswers = session.answers
                    ? (typeof session.answers === 'string' ? JSON.parse(session.answers) : session.answers)
                    : {};
                const localProgress = JSON.parse(localStorage.getItem(progressKey) || '{}');
                const localAnswers = localProgress?.answers || {};
                const mergedAnswers = { ...serverAnswers, ...localAnswers };
                const restoredIdx = Math.max(
                    0,
                    Number(localProgress?.currentIdx ?? session?.lastQuestionIndex ?? 0)
                );
                const safeIdx = Math.min(restoredIdx, Math.max(0, res.data.length - 1));

                setAnswers(mergedAnswers);
                setCurrentIdx(safeIdx);
                persistProgressLocal(mergedAnswers, safeIdx);

                // Recovery Sync: push locally cached answers/progress back to server if needed.
                if (Object.keys(localAnswers).length > 0 || safeIdx > 0) {
                    try {
                        await axios.post(`${API_BASE}/session/bulk-save`, {
                            studentId: student.id,
                            answers: mergedAnswers,
                            currentIndex: safeIdx
                        });
                    } catch {
                        // continue offline; we keep local cache for next retry.
                    }
                }

                calculateTime();
                setLoading(false);
            } catch (error) {
                console.error(error);
                setError('Critical failure loading exam environment.');
            }
        };

        fetchQuestions();

        // Polling for Pause State
        const pauseInterval = setInterval(async () => {
            try {
                const res = await axios.get(`${API_BASE}/session/status`);
                setIsPaused(res.data.isPaused);
            } catch (e) { /* background fail ok */ }
        }, 5000);

        const disableContextMenu = (e: MouseEvent) => e.preventDefault();
        document.addEventListener('contextmenu', disableContextMenu);
        return () => {
            document.removeEventListener('contextmenu', disableContextMenu);
            clearInterval(pauseInterval);
        };
    }, []);

    const calculateTime = () => {
        const now = new Date().getTime();
        
        // Strategy: Use Schedule End Time + Individual Compensation
        // If no schedule provided, fall back to Duration from start
        let targetEndTime;
        
        if (examDetails.endTime) {
            // Absolute scheduled end time from cloud
            const [h, m, s] = examDetails.endTime.split(':');
            const scheduledEnd = new Date(examDetails.examDate || new Date().toISOString());
            scheduledEnd.setHours(parseInt(h), parseInt(m), parseInt(s || '0'));
            targetEndTime = scheduledEnd.getTime();
        } else {
            // Relative fallback
            const startTime = new Date(session.startTime).getTime();
            const durationMs = (examDetails.durationMinutes || 60) * 60 * 1000;
            targetEndTime = startTime + durationMs;
        }

        // Factor in individual extra time (compensation)
        const compensationMs = (session.extraTimeMinutes || 0) * 60 * 1000;
        targetEndTime += compensationMs;

        if (now >= targetEndTime) {
            forceTimeUp();
        } else {
            setTimeLeft(Math.floor((targetEndTime - now) / 1000));
        }
    };

    const forceTimeUp = async () => {
        try {
            await axios.post(`${API_BASE}/session/submit`, { studentId: student.id });
            localStorage.removeItem('cbt_session');
            localStorage.removeItem(`cbt_progress_${student.id}`);
            navigate('/success');
        } catch (error) {
            alert('Error auto-submitting. Contact Invigilator.');
        }
    };

    useEffect(() => {
        if (loading || isPaused) return;
        const timer = setInterval(() => {
            setTimeLeft(prev => {
                if (prev <= 1) {
                    clearInterval(timer);
                    forceTimeUp();
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);
        return () => clearInterval(timer);
    }, [loading, isPaused]);

    const handleSelectOption = async (questionId: string, optionId: string) => {
        if (isPaused) return;
        const newAnswers = { ...answers, [questionId]: optionId };
        setAnswers(newAnswers);
        persistProgressLocal(newAnswers, currentIdx);
        
        try {
            await axios.post(`${API_BASE}/session/save`, { studentId: student.id, questionId, optionId, currentIndex: currentIdx });
            const currentSessionStore = JSON.parse(localStorage.getItem('cbt_session') || '{}');
            currentSessionStore.session.answers = JSON.stringify(newAnswers);
            currentSessionStore.session.lastQuestionIndex = currentIdx;
            localStorage.setItem('cbt_session', JSON.stringify(currentSessionStore));
        } catch (error) {
            console.error('Save failed', error);
        }
    };

    const goToReview = () => {
        if (isPaused) return;
        localStorage.setItem('cbt_review', JSON.stringify({
            totalQuestions: questions.length,
            answeredCount: Object.keys(answers).length
        }));
        navigate('/review');
    };

    const handleKeyDown = useCallback((e: KeyboardEvent) => {
        if (loading || isPaused || questions.length === 0) return;
        const currentQ = questions[currentIdx];
        const options = currentQ.options || [];

        if (e.key === 'ArrowRight' || e.key.toLowerCase() === 'n') {
            setCurrentIdx(prev => Math.min(questions.length - 1, prev + 1));
        } else if (e.key === 'ArrowLeft' || e.key.toLowerCase() === 'p') {
            setCurrentIdx(prev => Math.max(0, prev - 1));
        }

        const keyMap: Record<string, number> = { 'a': 0, 'b': 1, 'c': 2, 'd': 3, 'e': 4, 'A': 0, 'B': 1, 'C': 2, 'D': 3, 'E': 4 };
        const index = keyMap[e.key];
        
        if (index !== undefined && index < options.length) {
            handleSelectOption(currentQ.id, options[index].id);
        }
    }, [loading, isPaused, questions, currentIdx, handleSelectOption]);

    useEffect(() => {
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [handleKeyDown]);

    useEffect(() => {
        if (!student || loading) return;
        persistProgressLocal(answers, currentIdx);

        const currentSessionStore = JSON.parse(localStorage.getItem('cbt_session') || '{}');
        if (currentSessionStore?.session) {
            currentSessionStore.session.lastQuestionIndex = currentIdx;
            currentSessionStore.session.answers = JSON.stringify(answers);
            localStorage.setItem('cbt_session', JSON.stringify(currentSessionStore));
        }

        const syncProgress = async () => {
            try {
                await axios.post(`${API_BASE}/session/progress`, { studentId: student.id, currentIndex: currentIdx });
            } catch {
                // keep local progress cache; backend sync can happen later.
            }
        };
        syncProgress();
    }, [answers, currentIdx, loading, student?.id]);

    const formatTime = (seconds: number) => {
        const h = Math.floor(seconds / 3600);
        const m = Math.floor((seconds % 3600) / 60);
        const s = seconds % 60;
        return `${h > 0 ? h + ':' : ''}${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    };

    if (error) return <div className="h-screen flex items-center justify-center bg-rose-50 text-rose-800 p-10 text-center font-bold">{error}</div>;
    if (loading) return <div className="flex h-screen items-center justify-center text-sm font-bold bg-slate-950 text-slate-500 uppercase tracking-widest animate-pulse">Initializing Command Environment...</div>;

    const question = questions[currentIdx];

    return (
        <div className="h-screen bg-gray-100 flex flex-col font-sans select-none overflow-hidden relative">
            
            {/* GLOBAL PAUSE OVERLAY */}
            {isPaused && (
                <div className="absolute inset-0 z-[100] backdrop-blur-md bg-slate-900/80 flex flex-col items-center justify-center p-10 text-center animate-in fade-in duration-500">
                    <div className="bg-blue-600 p-6 rounded-[2.5rem] shadow-2xl mb-8 animate-bounce">
                        <Lock className="w-16 h-16 text-white" />
                    </div>
                    <h1 className="text-5xl font-black text-white tracking-tight mb-4 uppercase">Examination Paused</h1>
                    <p className="text-blue-300 text-xl font-bold uppercase tracking-[0.2em] max-w-lg leading-relaxed">
                        The invigilator has temporarily suspended all terminals. <br/>
                        <span className="text-white">Timer is frozen.</span> Please remain in your seat.
                    </p>
                </div>
            )}

            {/* Slim Header */}
            <header className="h-14 bg-white shadow-sm border-b px-6 flex items-center justify-between shrink-0 z-20">
                <div className="flex items-center space-x-6">
                    <button onClick={() => setSidebarOpen(!sidebarOpen)} className="md:hidden p-1 text-gray-500 hover:bg-gray-100 rounded">
                        <Menu className="w-5 h-5"/>
                    </button>
                    <div className="flex items-center space-x-4">
                        <span className="text-sm font-black text-slate-800 uppercase tracking-wide">{examDetails.subject || examDetails.name}</span>
                        <span className="w-1 h-1 bg-slate-300 rounded-full"></span>
                        <span className="text-[10px] font-mono font-bold text-slate-400 bg-slate-100 px-3 py-1 rounded-full uppercase tracking-widest">{student.admissionNo}</span>
                    </div>
                </div>
                <div className={`flex items-center px-5 py-1.5 rounded-full border shadow-sm font-mono text-sm font-black transition-all ${timeLeft < 300 ? 'bg-rose-600 text-white border-rose-600 animate-pulse' : 'bg-slate-950 text-white border-slate-900'}`}>
                    <Clock className="w-4 h-4 mr-2 opacity-70" /> {formatTime(timeLeft)}
                </div>
            </header>

            {/* Main Content Area */}
            <main className="flex-1 flex overflow-hidden">
                {/* Question Area */}
                <div className="flex-1 overflow-y-auto p-4 md:p-10">
                    <div className="max-w-4xl mx-auto bg-white rounded-[2rem] shadow-sm border border-slate-200 flex flex-col min-h-full">
                        
                        <div className="px-10 py-6 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center shrink-0">
                            <h2 className="text-xl font-black text-slate-900 tracking-tight">
                                Question {currentIdx + 1} <span className="text-slate-400 font-bold text-sm ml-2 uppercase tracking-widest">/ {questions.length}</span>
                            </h2>
                            <span className="bg-slate-950 text-white text-[10px] font-black px-3 py-1.5 rounded-lg uppercase tracking-[0.2em]">
                                {question.marks} Points
                            </span>
                        </div>

                        <div className="px-10 py-12 flex-1 flex flex-col">
                            <div className="text-lg text-slate-800 whitespace-pre-wrap leading-relaxed flex-grow mb-12 font-semibold">
                                {question.content}
                            </div>

                            <div className="space-y-4">
                                {question.options?.map((opt: any, index: number) => {
                                    const isSelected = answers[question.id] === opt.id;
                                    const optionLetters = ['A', 'B', 'C', 'D', 'E'];
                                    return (
                                        <button
                                            key={opt.id}
                                            onClick={() => handleSelectOption(question.id, opt.id)}
                                            className={`w-full group text-left px-8 py-5 rounded-2xl border transition-all flex items-start ${
                                                isSelected 
                                                    ? 'border-blue-600 bg-blue-600 text-white shadow-xl shadow-blue-600/20' 
                                                    : 'border-slate-200 hover:border-blue-500 hover:bg-slate-50'
                                            }`}
                                        >
                                            <span className={`flex-shrink-0 flex justify-center items-center w-8 h-8 rounded-xl border mr-5 text-sm font-black transition-all ${
                                                isSelected ? 'bg-white text-blue-600 border-white' : 'border-slate-200 text-slate-400 bg-white group-hover:border-blue-500 group-hover:text-blue-500'
                                            }`}>
                                                {optionLetters[index]}
                                            </span>
                                            <span className="text-base leading-relaxed font-bold">
                                                {opt.content}
                                            </span>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        <div className="px-10 py-8 border-t border-slate-100 bg-slate-50/50 flex justify-between items-center shrink-0">
                            <button 
                                onClick={() => setCurrentIdx(prev => Math.max(0, prev - 1))}
                                disabled={currentIdx === 0}
                                className="flex items-center px-6 py-3 rounded-2xl text-sm font-black text-slate-500 bg-white border border-slate-200 hover:bg-slate-100 disabled:opacity-40 transition-all active:scale-95"
                            >
                                <ChevronLeft className="w-5 h-5 mr-2" /> Previous
                            </button>
                            
                            {currentIdx === questions.length - 1 ? (
                                <button
                                    onClick={goToReview}
                                    className="flex items-center px-10 py-3 rounded-2xl text-sm font-black text-white bg-emerald-600 hover:bg-emerald-700 shadow-xl shadow-emerald-500/20 transition-all active:scale-95"
                                >
                                    Finish & Review Session
                                </button>
                            ) : (
                                <button 
                                    onClick={() => setCurrentIdx(prev => Math.min(questions.length - 1, prev + 1))}
                                    className="flex items-center px-10 py-3 rounded-2xl text-sm font-black text-white bg-blue-600 hover:bg-blue-700 shadow-xl shadow-blue-500/20 transition-all active:scale-95"
                                >
                                    Next Question <ChevronRight className="w-5 h-5 ml-2" />
                                </button>
                            )}
                        </div>
                    </div>
                </div>

                {/* Question Sidebar Nav */}
                <div className={`${sidebarOpen ? 'block' : 'hidden'} md:block w-80 bg-white border-l border-slate-200 shadow-sm flex flex-col shrink-0`}>
                    <div className="px-6 py-6 border-b border-slate-100 bg-slate-50/50">
                        <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Roster Navigation</h3>
                    </div>
                    
                    <div className="p-6 flex-1 overflow-y-auto">
                        <div className="grid grid-cols-5 gap-3">
                            {questions.map((q, idx) => {
                                const isAnswered = !!answers[q.id];
                                const isCurrent = idx === currentIdx;
                                
                                let baseClass = 'bg-slate-50 border-slate-200 text-slate-400 hover:bg-slate-100';
                                if (isAnswered) baseClass = 'bg-blue-600 border-blue-600 text-white shadow-lg shadow-blue-500/10';
                                
                                if (isCurrent) {
                                    baseClass += ' ring-4 ring-slate-900/5 border-slate-950 text-slate-950 bg-white scale-110 z-10';
                                }

                                return (
                                    <button
                                        key={q.id}
                                        onClick={() => setCurrentIdx(idx)}
                                        className={`h-10 rounded-xl border text-xs font-black transition-all ${baseClass}`}
                                    >
                                        {idx + 1}
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    <div className="p-8 border-t border-slate-100">
                        <div className="flex flex-col space-y-4">
                            <div className="flex items-center text-[10px] font-black text-slate-500 uppercase tracking-widest">
                                <span className="w-3 h-3 rounded-full bg-blue-600 mr-3"></span> Complete
                            </div>
                            <div className="flex items-center text-[10px] font-black text-slate-500 uppercase tracking-widest">
                                <span className="w-3 h-3 rounded-full bg-slate-100 border border-slate-200 mr-3"></span> Pending
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}
