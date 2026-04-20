import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import {
    Clock,
    ChevronRight,
    ChevronLeft,
    Menu,
    Lock,
    Wifi,
    WifiOff,
    Save,
    CheckCircle2,
    AlertTriangle,
    Search,
    UserCircle,
} from 'lucide-react';

const API_BASE = '/api';

type SaveState = 'idle' | 'saving' | 'saved' | 'error';

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
    const [saveState, setSaveState] = useState<SaveState>('idle');
    const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null);
    const [extraTimeMinutes, setExtraTimeMinutes] = useState(0);
    const [isOnline, setIsOnline] = useState(typeof navigator !== 'undefined' ? navigator.onLine : true);
    const [paletteSearch, setPaletteSearch] = useState('');

    const autoSubmittedRef = useRef(false);
    const sessionData = JSON.parse(localStorage.getItem('cbt_session') || '{}');
    const { student, examDetails, session } = sessionData;
    const progressKey = student ? `cbt_progress_${student.id}` : 'cbt_progress_unknown';

    const persistProgressLocal = (answersState: Record<string, string>, idx: number) => {
        if (!student) return;
        localStorage.setItem(
            progressKey,
            JSON.stringify({
                answers: answersState,
                currentIdx: idx,
                savedAt: new Date().toISOString(),
            }),
        );
    };

    useEffect(() => {
        if (!student) {
            navigate('/');
            return;
        }

        const fetchQuestions = async () => {
            try {
                const res = await axios.get(`${API_BASE}/questions?studentId=${student.id}`);
                const loadedQuestions = Array.isArray(res.data) ? res.data : [];
                setQuestions(loadedQuestions);

                const serverAnswers = session?.answers
                    ? typeof session.answers === 'string'
                        ? JSON.parse(session.answers)
                        : session.answers
                    : {};
                const localProgress = JSON.parse(localStorage.getItem(progressKey) || '{}');
                const localAnswers = localProgress?.answers || {};
                const mergedAnswers = { ...serverAnswers, ...localAnswers };
                const restoredIdx = Math.max(0, Number(localProgress?.currentIdx ?? session?.lastQuestionIndex ?? 0));
                const safeIdx = Math.min(restoredIdx, Math.max(0, loadedQuestions.length - 1));

                setAnswers(mergedAnswers);
                setCurrentIdx(safeIdx);
                setExtraTimeMinutes(Number(session?.extraTimeMinutes || 0));
                persistProgressLocal(mergedAnswers, safeIdx);

                if (Object.keys(localAnswers).length > 0 || safeIdx > 0) {
                    try {
                        await axios.post(`${API_BASE}/session/bulk-save`, {
                            studentId: student.id,
                            answers: mergedAnswers,
                            currentIndex: safeIdx,
                        });
                    } catch {
                        // Continue offline using local cache.
                    }
                }

                setLoading(false);
            } catch (loadError) {
                console.error(loadError);
                setError('Critical failure loading exam environment.');
            }
        };

        const refreshSessionStatus = async () => {
            try {
                const res = await axios.get(`${API_BASE}/session/status?studentId=${student.id}`);
                setIsPaused(!!res.data.isPaused);
                const liveExtraTime = Number(res.data.extraTimeMinutes || 0);
                setExtraTimeMinutes(liveExtraTime);

                if (res.data.isSubmitted) {
                    autoSubmittedRef.current = true;
                    localStorage.removeItem('cbt_session');
                    localStorage.removeItem(`cbt_progress_${student.id}`);
                    navigate('/success');
                    return;
                }

                const currentSessionStore = JSON.parse(localStorage.getItem('cbt_session') || '{}');
                if (currentSessionStore?.session) {
                    currentSessionStore.session.extraTimeMinutes = liveExtraTime;
                    localStorage.setItem('cbt_session', JSON.stringify(currentSessionStore));
                }
            } catch {
                // Background status polling can fail silently; exam continues locally.
            }
        };

        fetchQuestions();
        refreshSessionStatus();
        const statusInterval = setInterval(refreshSessionStatus, 2000);

        const disableContextMenu = (e: MouseEvent) => e.preventDefault();
        const handleOnline = () => setIsOnline(true);
        const handleOffline = () => setIsOnline(false);
        const handleBeforeUnload = (e: BeforeUnloadEvent) => {
            if (autoSubmittedRef.current) return;
            e.preventDefault();
            e.returnValue = '';
        };

        document.addEventListener('contextmenu', disableContextMenu);
        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);
        window.addEventListener('beforeunload', handleBeforeUnload);

        return () => {
            document.removeEventListener('contextmenu', disableContextMenu);
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
            window.removeEventListener('beforeunload', handleBeforeUnload);
            clearInterval(statusInterval);
        };
    }, []);

    const deadlineMs = useMemo(() => {
        let targetEndTime: number;
        if (examDetails?.endTime && typeof examDetails.endTime === 'string') {
            const [h, m, s] = examDetails.endTime.split(':');
            const scheduledEnd = new Date(examDetails.examDate || new Date().toISOString());
            scheduledEnd.setHours(Number(h || 0), Number(m || 0), Number(s || 0), 0);
            targetEndTime = scheduledEnd.getTime();
        } else {
            const startIso = session?.startTime || new Date().toISOString();
            const startTime = new Date(startIso).getTime();
            const durationMs = Number(examDetails?.durationMinutes || 60) * 60 * 1000;
            targetEndTime = startTime + durationMs;
        }
        return targetEndTime + extraTimeMinutes * 60 * 1000;
    }, [examDetails?.endTime, examDetails?.examDate, examDetails?.durationMinutes, session?.startTime, extraTimeMinutes]);

    const forceTimeUp = async () => {
        if (!student || autoSubmittedRef.current) return;
        autoSubmittedRef.current = true;
        try {
            await axios.post(`${API_BASE}/session/submit`, { studentId: student.id });
            localStorage.removeItem('cbt_session');
            localStorage.removeItem(`cbt_progress_${student.id}`);
            navigate('/success');
        } catch {
            autoSubmittedRef.current = false;
            alert('Error auto-submitting. Contact invigilator immediately.');
        }
    };

    useEffect(() => {
        if (loading) return;
        setTimeLeft(Math.max(0, Math.floor((deadlineMs - Date.now()) / 1000)));
    }, [deadlineMs, loading]);

    useEffect(() => {
        if (loading || isPaused) return;
        const timer = setInterval(() => {
            const remaining = Math.max(0, Math.floor((deadlineMs - Date.now()) / 1000));
            setTimeLeft(remaining);
            if (remaining <= 0) forceTimeUp();
        }, 1000);
        return () => clearInterval(timer);
    }, [loading, isPaused, deadlineMs]);

    const handleSelectOption = async (questionId: string, optionId: string) => {
        if (isPaused || !student) return;
        const newAnswers = { ...answers, [questionId]: optionId };
        setAnswers(newAnswers);
        setSaveState('saving');
        persistProgressLocal(newAnswers, currentIdx);

        try {
            await axios.post(`${API_BASE}/session/save`, {
                studentId: student.id,
                questionId,
                optionId,
                currentIndex: currentIdx,
            });

            const currentSessionStore = JSON.parse(localStorage.getItem('cbt_session') || '{}');
            if (currentSessionStore?.session) {
                currentSessionStore.session.answers = JSON.stringify(newAnswers);
                currentSessionStore.session.lastQuestionIndex = currentIdx;
                localStorage.setItem('cbt_session', JSON.stringify(currentSessionStore));
            }

            setSaveState('saved');
            setLastSavedAt(new Date());
        } catch {
            setSaveState('error');
        }
    };

    const goToReview = () => {
        if (isPaused) return;
        localStorage.setItem(
            'cbt_review',
            JSON.stringify({
                totalQuestions: questions.length,
                answeredCount: Object.keys(answers).length,
            }),
        );
        navigate('/review');
    };

    const handleKeyDown = useCallback(
        (e: KeyboardEvent) => {
            if (loading || isPaused || questions.length === 0) return;
            const targetTag = (e.target as HTMLElement | null)?.tagName || '';
            if (targetTag === 'INPUT' || targetTag === 'TEXTAREA') return;

            const currentQ = questions[currentIdx];
            const options = currentQ?.options || [];

            if (e.key === 'ArrowRight' || e.key.toLowerCase() === 'n') {
                setCurrentIdx((prev) => Math.min(questions.length - 1, prev + 1));
                return;
            }

            if (e.key === 'ArrowLeft' || e.key.toLowerCase() === 'p') {
                setCurrentIdx((prev) => Math.max(0, prev - 1));
                return;
            }

            const keyMap: Record<string, number> = { a: 0, b: 1, c: 2, d: 3, e: 4 };
            const index = keyMap[e.key.toLowerCase()];
            if (index !== undefined && index < options.length) {
                handleSelectOption(currentQ.id, options[index].id);
            }
        },
        [loading, isPaused, questions, currentIdx, answers],
    );

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
                // keep local progress cache
            }
        };
        syncProgress();
    }, [answers, currentIdx, loading, student?.id]);

    const formatTime = (seconds: number) => {
        const safe = Math.max(0, seconds);
        const h = Math.floor(safe / 3600);
        const m = Math.floor((safe % 3600) / 60);
        const s = safe % 60;
        return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    };

    const answeredCount = Object.keys(answers).length;
    const totalQuestions = questions.length;
    const unansweredCount = Math.max(0, totalQuestions - answeredCount);
    const completionPercent = totalQuestions > 0 ? Math.round((answeredCount / totalQuestions) * 100) : 0;
    const question = questions[currentIdx];

    const normalizedSearch = paletteSearch.trim();
    const filteredQuestionIndexes = questions
        .map((q, idx) => ({ q, idx }))
        .filter(({ idx }) => {
            if (!normalizedSearch) return true;
            return String(idx + 1).includes(normalizedSearch);
        })
        .map(({ idx }) => idx);

    if (error) {
        return (
            <div className="h-screen flex items-center justify-center bg-rose-50 text-rose-800 p-8 text-center">
                <div className="max-w-lg space-y-3">
                    <AlertTriangle className="w-8 h-8 mx-auto" />
                    <p className="font-bold">Exam workspace could not load.</p>
                    <p className="text-sm">{error}</p>
                </div>
            </div>
        );
    }

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-100 flex items-center justify-center">
                <div className="text-sm font-bold text-gray-600 uppercase tracking-wider">Preparing exam workspace...</div>
            </div>
        );
    }

    if (!question) {
        return (
            <div className="min-h-screen bg-gray-100 flex items-center justify-center p-6">
                <div className="max-w-md w-full bg-white border border-gray-200 rounded-lg shadow-md p-6 text-center space-y-4">
                    <AlertTriangle className="w-8 h-8 mx-auto text-amber-600" />
                    <p className="font-bold text-gray-900">No questions were loaded for this exam.</p>
                    <p className="text-sm text-gray-600">Please contact the invigilator to re-provision this node.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-100 font-sans flex flex-col">
            {isPaused && (
                <div className="fixed inset-0 z-[120] bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-6">
                    <div className="max-w-lg w-full bg-white rounded-lg border border-gray-200 shadow-xl p-8 text-center">
                        <div className="mx-auto mb-4 w-16 h-16 rounded-full bg-blue-100 text-blue-800 flex items-center justify-center">
                            <Lock className="w-8 h-8" />
                        </div>
                        <h2 className="text-2xl font-bold text-gray-900 uppercase tracking-wide">Examination Paused</h2>
                        <p className="text-sm text-gray-600 mt-3">
                            The invigilator has temporarily paused all terminals. Timer is frozen. Remain on this screen.
                        </p>
                    </div>
                </div>
            )}

            <header className="bg-blue-900 border-b border-blue-800 px-4 md:px-6 py-3">
                <div className="max-w-[1400px] mx-auto flex flex-wrap gap-3 items-center justify-between">
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => setSidebarOpen((prev) => !prev)}
                            className="md:hidden p-2 rounded border border-blue-700 text-blue-100 hover:bg-blue-800"
                        >
                            <Menu className="w-4 h-4" />
                        </button>
                        <div>
                            <p className="text-[11px] text-blue-200 uppercase tracking-[0.2em] font-semibold">CBT Examination</p>
                            <h1 className="text-sm md:text-base font-bold text-white">{examDetails?.subject || examDetails?.name || 'Exam Room'}</h1>
                        </div>
                    </div>

                    <div className="flex flex-wrap gap-2 items-center">
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded border border-blue-700 bg-blue-800 text-blue-100 text-xs font-semibold">
                            <UserCircle className="w-3.5 h-3.5" />
                            {student?.admissionNo || 'Candidate'}
                        </span>
                        <span
                            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded text-xs font-semibold border ${
                                isOnline
                                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                    : 'bg-rose-50 text-rose-700 border-rose-200'
                            }`}
                        >
                            {isOnline ? <Wifi className="w-3.5 h-3.5" /> : <WifiOff className="w-3.5 h-3.5" />}
                            {isOnline ? 'Connected' : 'Offline'}
                        </span>
                        <span
                            className={`inline-flex items-center gap-1 px-3 py-1 rounded text-xs font-semibold border ${
                                saveState === 'saving'
                                    ? 'bg-amber-50 text-amber-700 border-amber-200'
                                    : saveState === 'error'
                                      ? 'bg-rose-50 text-rose-700 border-rose-200'
                                      : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            }`}
                        >
                            {saveState === 'saving' ? <Save className="w-3.5 h-3.5 animate-pulse" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                            {saveState === 'saving' && 'Saving'}
                            {saveState === 'saved' && `Saved${lastSavedAt ? ` ${lastSavedAt.toLocaleTimeString()}` : ''}`}
                            {saveState === 'error' && 'Save failed'}
                            {saveState === 'idle' && 'Ready'}
                        </span>
                        <span
                            className={`inline-flex items-center gap-1 px-3 py-1 rounded border text-sm font-bold ${
                                timeLeft <= 300
                                    ? 'bg-rose-600 text-white border-rose-600 animate-pulse'
                                    : 'bg-slate-900 text-white border-slate-900'
                            }`}
                        >
                            <Clock className="w-4 h-4" />
                            {formatTime(timeLeft)}
                        </span>
                    </div>
                </div>
            </header>

            <main className="flex-1 overflow-hidden">
                <div className="max-w-[1400px] mx-auto h-full flex">
                    <section className="flex-1 overflow-y-auto p-4 md:p-6">
                        <div className="space-y-4">
                            <div className="bg-white border border-gray-200 rounded-lg p-4 md:p-5">
                                <div className="flex flex-wrap gap-3 items-center justify-between">
                                    <div className="space-y-1">
                                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Question {currentIdx + 1} of {totalQuestions}</p>
                                        <h2 className="text-lg font-bold text-gray-900">Answer Selection Panel</h2>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-xs text-gray-500 uppercase tracking-wider">Completion</p>
                                        <p className="text-lg font-bold text-blue-900">{completionPercent}%</p>
                                    </div>
                                </div>
                                <div className="mt-4 h-2 bg-gray-100 rounded">
                                    <div className="h-2 bg-blue-600 rounded" style={{ width: `${completionPercent}%` }} />
                                </div>
                                {unansweredCount > 0 && (
                                    <p className="mt-3 text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded px-3 py-2">
                                        You still have {unansweredCount} unanswered question(s).
                                    </p>
                                )}
                            </div>

                            <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                                <div className="border-b border-gray-200 px-4 md:px-6 py-4 bg-gray-50 flex items-start justify-between gap-4">
                                    <div>
                                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Question Content</p>
                                        <p className="text-sm text-gray-500 mt-1">Marks: <span className="font-bold text-gray-800">{question.marks || 0}</span></p>
                                    </div>
                                </div>

                                <div className="px-4 md:px-6 py-6">
                                    <p className="text-base md:text-lg text-gray-900 leading-relaxed whitespace-pre-wrap">{question.content}</p>

                                    <div className="mt-6 space-y-3">
                                        {(question.options || []).map((opt: any, index: number) => {
                                            const isSelected = answers[question.id] === opt.id;
                                            const letter = ['A', 'B', 'C', 'D', 'E'][index] || String(index + 1);
                                            return (
                                                <button
                                                    key={opt.id}
                                                    onClick={() => handleSelectOption(question.id, opt.id)}
                                                    className={`w-full text-left border rounded-lg px-4 py-3 transition-colors ${
                                                        isSelected
                                                            ? 'border-blue-600 bg-blue-50'
                                                            : 'border-gray-300 bg-white hover:border-blue-400 hover:bg-blue-50/40'
                                                    }`}
                                                >
                                                    <div className="flex items-start gap-3">
                                                        <span
                                                            className={`w-7 h-7 shrink-0 rounded-full border flex items-center justify-center text-xs font-bold ${
                                                                isSelected
                                                                    ? 'bg-blue-600 border-blue-600 text-white'
                                                                    : 'bg-gray-50 border-gray-300 text-gray-600'
                                                            }`}
                                                        >
                                                            {letter}
                                                        </span>
                                                        <span className="text-sm md:text-base text-gray-900 leading-relaxed">{opt.content}</span>
                                                    </div>
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>

                                <div className="px-4 md:px-6 py-4 border-t border-gray-200 bg-gray-50 flex items-center justify-between gap-2">
                                    <button
                                        onClick={() => setCurrentIdx((prev) => Math.max(0, prev - 1))}
                                        disabled={currentIdx === 0}
                                        className="inline-flex items-center px-4 py-2 rounded border border-gray-300 text-sm font-semibold text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                                    >
                                        <ChevronLeft className="w-4 h-4 mr-1" />
                                        Previous
                                    </button>

                                    {currentIdx === totalQuestions - 1 ? (
                                        <button
                                            onClick={goToReview}
                                            className="inline-flex items-center px-5 py-2 rounded text-sm font-bold text-white bg-green-600 hover:bg-green-700"
                                        >
                                            Review & Submit
                                        </button>
                                    ) : (
                                        <button
                                            onClick={() => setCurrentIdx((prev) => Math.min(totalQuestions - 1, prev + 1))}
                                            className="inline-flex items-center px-5 py-2 rounded text-sm font-bold text-white bg-blue-600 hover:bg-blue-700"
                                        >
                                            Next
                                            <ChevronRight className="w-4 h-4 ml-1" />
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    </section>

                    <aside className={`${sidebarOpen ? 'block' : 'hidden'} md:block w-80 border-l border-gray-200 bg-white overflow-y-auto`}>
                        <div className="p-4 border-b border-gray-200 bg-gray-50">
                            <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Exam Navigator</p>
                            <div className="grid grid-cols-2 gap-2 mt-3">
                                <div className="bg-white border border-gray-200 rounded p-2 text-center">
                                    <p className="text-[11px] text-gray-500 uppercase">Answered</p>
                                    <p className="text-base font-bold text-emerald-700">{answeredCount}</p>
                                </div>
                                <div className="bg-white border border-gray-200 rounded p-2 text-center">
                                    <p className="text-[11px] text-gray-500 uppercase">Pending</p>
                                    <p className="text-base font-bold text-amber-700">{unansweredCount}</p>
                                </div>
                            </div>

                            <div className="relative mt-3">
                                <Search className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
                                <input
                                    value={paletteSearch}
                                    onChange={(e) => setPaletteSearch(e.target.value.replace(/[^\d]/g, ''))}
                                    placeholder="Jump by question number"
                                    className="w-full pl-9 pr-3 py-2 text-sm bg-white border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                                />
                            </div>
                        </div>

                        <div className="p-4">
                            <div className="grid grid-cols-5 gap-2">
                                {filteredQuestionIndexes.map((idx) => {
                                    const q = questions[idx];
                                    const isCurrent = idx === currentIdx;
                                    const isAnswered = !!answers[q.id];
                                    let base = 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50';
                                    if (isAnswered) base = 'bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100';
                                    if (isCurrent) base = 'bg-blue-600 text-white border-blue-600 shadow';

                                    return (
                                        <button
                                            key={q.id}
                                            onClick={() => setCurrentIdx(idx)}
                                            className={`h-9 rounded border text-xs font-bold transition-colors ${base}`}
                                            title={`Question ${idx + 1}`}
                                        >
                                            {idx + 1}
                                        </button>
                                    );
                                })}
                            </div>

                            {filteredQuestionIndexes.length === 0 && (
                                <p className="text-sm text-gray-500 text-center py-6">No matching question number.</p>
                            )}
                        </div>

                        <div className="px-4 pb-5 space-y-2">
                            <div className="flex items-center gap-2 text-xs text-gray-600">
                                <span className="w-3 h-3 rounded border border-blue-600 bg-blue-600" />
                                Current question
                            </div>
                            <div className="flex items-center gap-2 text-xs text-gray-600">
                                <span className="w-3 h-3 rounded border border-emerald-300 bg-emerald-50" />
                                Answered
                            </div>
                            <div className="flex items-center gap-2 text-xs text-gray-600">
                                <span className="w-3 h-3 rounded border border-gray-300 bg-white" />
                                Unanswered
                            </div>
                        </div>
                    </aside>
                </div>
            </main>
        </div>
    );
}
