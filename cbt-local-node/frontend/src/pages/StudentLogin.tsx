import { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { UserCircle, Shield, ArrowRight } from 'lucide-react';

const API_BASE = '/api';

export default function StudentLogin() {
    const [admissionNo, setAdmissionNo] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const res = await axios.post(`${API_BASE}/auth/login`, { admissionNo });
            const { session, examDetails } = res.data;
            
            // 1. Re-Entry Blocker
            if (session && session.isSubmitted === 1) {
                setError('You have already completed and submitted this examination. Re-entry is strictly prohibited.');
                setLoading(false);
                return;
            }

            // 2. Scheduled Window Validation
            if (examDetails.startTime && examDetails.endTime) {
                const now = new Date();
                const todayStr = now.toDateString();
                const [h_start, m_start] = examDetails.startTime.split(':');
                const [h_end, m_end] = examDetails.endTime.split(':');
                
                const schedDate = new Date(examDetails.examDate || new Date().toISOString());
                const schedDateStr = schedDate.toDateString();

                // a. Date Match
                if (todayStr !== schedDateStr) {
                    setError(`Access Denied: This examination is scheduled for ${schedDate.toLocaleDateString()}. Your local system date (${now.toLocaleDateString()}) does not match.`);
                    setLoading(false);
                    return;
                }
                
                const startWindow = new Date(schedDate);
                startWindow.setHours(parseInt(h_start), parseInt(m_start), 0);
                
                const endWindow = new Date(schedDate);
                endWindow.setHours(parseInt(h_end), parseInt(m_end), 0);
                
                // Buffer: Allow login 10 minutes early
                const earlyBuffer = 10 * 60 * 1000;

                if (now.getTime() < (startWindow.getTime() - earlyBuffer)) {
                    setError(`This examination is scheduled for ${examDetails.startTime}. Please wait for your session to begin.`);
                    setLoading(false);
                    return;
                }

                if (now.getTime() > endWindow.getTime()) {
                    setError(`Access Denied: The scheduled window for this examination (${examDetails.endTime}) has expired. Contact Invigilator.`);
                    setLoading(false);
                    return;
                }
            }

            localStorage.setItem('cbt_session', JSON.stringify(res.data));
            let parsedAnswers: Record<string, string> = {};
            try {
                parsedAnswers = typeof session?.answers === 'string' ? JSON.parse(session.answers || '{}') : (session?.answers || {});
            } catch {
                parsedAnswers = {};
            }
            const hasProgress = (session?.lastQuestionIndex || 0) > 0 || Object.keys(parsedAnswers).length > 0;
            navigate(hasProgress ? '/exam' : '/verify');
        } catch (error: any) {
            setError(error.response?.data?.error || 'System error. Contact Invigilator.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4 font-sans">
            <div className="max-w-sm w-full bg-white rounded-lg shadow-md border overflow-hidden">
                <div className="bg-blue-900 px-6 py-6 text-center">
                    <Shield className="w-10 h-10 text-blue-300 mx-auto mb-3" />
                    <h2 className="text-xl font-bold text-white tracking-wide uppercase">CBT Exam Node</h2>
                    <p className="text-blue-200 text-xs mt-1">Candidate Authentication Module</p>
                </div>

                <div className="p-6">
                    <form onSubmit={handleLogin} className="space-y-5">
                        {error && (
                            <div className="p-3 bg-red-50 text-red-700 text-sm border border-red-200 rounded">
                                {error}
                            </div>
                        )}
                        
                        <div>
                            <label className="block text-xs font-semibold text-gray-600 mb-1 uppercase tracking-wider">Candidate Admission No</label>
                            <div className="relative">
                                <span className="absolute inset-y-0 left-0 flex items-center pl-3">
                                    <UserCircle className="w-5 h-5 text-gray-400" />
                                </span>
                                <input
                                    type="text"
                                    value={admissionNo}
                                    onChange={(e) => setAdmissionNo(e.target.value.toUpperCase())}
                                    className="block w-full pl-10 pr-3 py-2.5 bg-gray-50 border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-sm font-mono tracking-wider font-semibold"
                                    placeholder="e.g. 2024/001"
                                    required
                                />
                            </div>
                        </div>
                        
                        <button
                            type="submit"
                            disabled={loading || !admissionNo}
                            className="w-full flex justify-between items-center py-2.5 px-4 rounded text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 transition-colors shadow-sm"
                        >
                            <span>{loading ? 'Authenticating...' : 'Proceed to Verification'}</span>
                            {!loading && <ArrowRight className="w-4 h-4" />}
                        </button>
                    </form>
                </div>
                
                <div className="bg-gray-50 px-6 py-3 border-t text-center">
                    <span className="text-[10px] text-gray-400 uppercase tracking-widest font-semibold">Strictly for Examination Purposes</span>
                </div>
            </div>
        </div>
    );
}
