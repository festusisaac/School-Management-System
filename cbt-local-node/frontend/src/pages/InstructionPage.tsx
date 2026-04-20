import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { PlayCircle, ShieldAlert, User, Clock, ListChecks } from 'lucide-react';

const API_BASE = '/api';

export default function InstructionPage() {
    const navigate = useNavigate();
    const sessionData = JSON.parse(localStorage.getItem('cbt_session') || '{}');
    const { student, examDetails } = sessionData;
    const photoUrl = student?.photoUrl || '';
    const [questionCount, setQuestionCount] = useState<number | null>(null);

    const examTimeText = useMemo(() => {
        const start = examDetails?.startTime;
        const end = examDetails?.endTime;
        if (!start || !end) return 'Not specified';

        const examDate = new Date(examDetails?.examDate || new Date().toISOString());
        const [sh, sm, ss] = String(start).split(':');
        const [eh, em, es] = String(end).split(':');

        const startAt = new Date(examDate);
        startAt.setHours(Number(sh || 0), Number(sm || 0), Number(ss || 0), 0);

        const endAt = new Date(examDate);
        endAt.setHours(Number(eh || 0), Number(em || 0), Number(es || 0), 0);

        return `${startAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - ${endAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    }, [examDetails?.startTime, examDetails?.endTime, examDetails?.examDate]);

    const calculatedDurationMinutes = useMemo(() => {
        const start = examDetails?.startTime;
        const end = examDetails?.endTime;
        if (!start || !end) return Number(examDetails?.durationMinutes || 60);

        const examDate = new Date(examDetails?.examDate || new Date().toISOString());
        const [sh, sm, ss] = String(start).split(':');
        const [eh, em, es] = String(end).split(':');

        const startAt = new Date(examDate);
        startAt.setHours(Number(sh || 0), Number(sm || 0), Number(ss || 0), 0);

        const endAt = new Date(examDate);
        endAt.setHours(Number(eh || 0), Number(em || 0), Number(es || 0), 0);

        // Handle schedules that cross midnight.
        if (endAt.getTime() <= startAt.getTime()) {
            endAt.setDate(endAt.getDate() + 1);
        }

        const diffMinutes = Math.round((endAt.getTime() - startAt.getTime()) / 60000);
        return diffMinutes > 0 ? diffMinutes : Number(examDetails?.durationMinutes || 60);
    }, [examDetails?.startTime, examDetails?.endTime, examDetails?.examDate, examDetails?.durationMinutes]);

    useEffect(() => {
        if (!student) {
            navigate('/');
            return;
        }

        const loadQuestionCount = async () => {
            try {
                const res = await axios.get(`${API_BASE}/questions?studentId=${student.id}`);
                const count = Array.isArray(res.data) ? res.data.length : 0;
                setQuestionCount(count);
            } catch {
                setQuestionCount(null);
            }
        };

        loadQuestionCount();
    }, [student, navigate]);

    if (!student) return <div />;

    return (
        <div className="min-h-screen bg-gray-100 flex flex-col font-sans py-12 px-4 items-center justify-center">
            <div className="max-w-3xl w-full bg-white rounded-lg shadow-lg border border-gray-200 overflow-hidden flex flex-col">
                
                {/* Header */}
                <div className="bg-blue-900 px-6 py-4 flex items-center justify-between shadow-sm">
                    <span className="text-sm font-bold tracking-widest uppercase text-blue-100">CBT Verification</span>
                    <span className="text-xs bg-red-600 text-white font-mono px-2 py-0.5 rounded shadow">STRICTLY CONFIDENTIAL</span>
                </div>

                <div className="p-6 md:p-8 flex-1">
                    <div className="flex flex-col md:flex-row gap-8">
                        
                        {/* Student Details Column */}
                        <div className="md:w-1/3 flex flex-col items-center">
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
                                    className="w-24 h-24 object-cover bg-gray-100 border-2 border-gray-300 rounded-lg mb-4 shadow-inner"
                                />
                            ) : null}
                            <div
                                style={{ display: photoUrl ? 'none' : 'flex' }}
                                className="w-24 h-24 bg-gray-100 border-2 border-gray-300 text-gray-500 rounded-lg items-center justify-center mb-4 shadow-inner"
                            >
                                <User className="w-12 h-12 text-gray-400" />
                            </div>
                            <h2 className="text-lg font-bold text-gray-900 text-center mb-1">{student.fullName}</h2>
                            <p className="text-sm font-mono text-gray-600 bg-gray-100 px-3 py-1 rounded border border-gray-200">{student.admissionNo}</p>
                        </div>

                        {/* Exam Details & Rules Column */}
                        <div className="md:w-2/3">
                            <div className="mb-6 pb-4 border-b">
                                <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-2">Examination Details</h3>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <p className="text-xs text-gray-400 uppercase">Subject</p>
                                        <p className="text-base font-bold text-blue-900">{examDetails?.name || 'Loading Exam...'}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-gray-400 uppercase">Duration</p>
                                        <p className="text-sm font-bold text-gray-800 flex items-center">
                                            <Clock className="w-4 h-4 mr-1 text-gray-500" /> {calculatedDurationMinutes} Minutes
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-gray-400 uppercase">Exam Time</p>
                                        <p className="text-sm font-bold text-gray-800 flex items-center">
                                            <Clock className="w-4 h-4 mr-1 text-gray-500" /> {examTimeText}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-gray-400 uppercase">Total Questions</p>
                                        <p className="text-sm font-bold text-gray-800 flex items-center">
                                            <ListChecks className="w-4 h-4 mr-1 text-gray-500" /> {questionCount === null ? 'Loading...' : questionCount}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-amber-50 border-l-4 border-amber-400 p-4 rounded-r">
                                <h3 className="flex items-center text-amber-900 font-bold mb-2 text-sm uppercase tracking-wider">
                                    <ShieldAlert className="w-4 h-4 mr-1.5" /> Important Instructions
                                </h3>
                                <ul className="space-y-1.5 text-xs text-amber-800 font-medium list-disc list-inside">
                                    <li>Do not close or refresh this tab once started.</li>
                                    <li>Press <strong className="font-mono bg-amber-100 px-1 rounded">A, B, C, D</strong> to select answers rapidly.</li>
                                    <li>Use <strong className="font-mono bg-amber-100 px-1 rounded">Arrow Keys</strong> to easily navigate questions.</li>
                                    <li>Invigilators can remotely monitor your progression.</li>
                                </ul>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="bg-gray-50 border-t p-4 flex justify-end items-center">
                    <button
                        onClick={() => {
                            if (document.documentElement.requestFullscreen) {
                                document.documentElement.requestFullscreen().catch((e) => console.log('Fullscreen failed', e));
                            }
                            navigate('/exam');
                        }}
                        className="flex items-center px-6 py-2.5 rounded text-sm font-bold text-white bg-green-600 hover:bg-green-700 shadow transition-colors"
                    >
                        <PlayCircle className="w-5 h-5 mr-2" />
                        START EXAMINATION
                    </button>
                </div>
            </div>
        </div>
    );
}
