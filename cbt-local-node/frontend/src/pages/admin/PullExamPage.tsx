import { useEffect, useState } from 'react';
import axios from 'axios';
import { DownloadCloud, RefreshCw, Server, Wifi, CheckCircle2, AlertTriangle } from 'lucide-react';

const API_BASE = '/api';

export default function PullExamPage() {
    const [cloudUrl, setCloudUrl] = useState('http://localhost:3000');
    const [syncKey, setSyncKey] = useState('');
    const [loading, setLoading] = useState(false);
    const [status, setStatus] = useState<{ type: 'success' | 'error' | 'idle'; message: string }>({ type: 'idle', message: '' });
    const [randomizeQuestions, setRandomizeQuestions] = useState(true);
    const [randomizeOptions, setRandomizeOptions] = useState(true);
    const [savingConfig, setSavingConfig] = useState(false);

    const loadRandomization = async () => {
        try {
            const res = await axios.get(`${API_BASE}/admin/randomization`);
            setRandomizeQuestions(!!res.data.randomizeQuestions);
            setRandomizeOptions(!!res.data.randomizeOptions);
        } catch {
            // no-op
        }
    };

    useEffect(() => {
        loadRandomization();
    }, []);

    const saveRandomization = async () => {
        try {
            setSavingConfig(true);
            await axios.post(`${API_BASE}/admin/randomization`, {
                randomizeQuestions,
                randomizeOptions,
            });
            setStatus({ type: 'success', message: 'Randomization settings saved.' });
        } catch (error: any) {
            setStatus({ type: 'error', message: error.response?.data?.error || 'Failed to save randomization settings.' });
        } finally {
            setSavingConfig(false);
        }
    };

    const handleSync = async () => {
        setLoading(true);
        setStatus({ type: 'idle', message: '' });
        try {
            const res = await axios.post(`${API_BASE}/sync`, { cloudUrl, syncKey });
            setStatus({
                type: 'success',
                message: `${res.data.studentCount} candidates and ${res.data.questionCount} questions synced successfully.`,
            });
        } catch (error: any) {
            setStatus({
                type: 'error',
                message: error.response?.data?.error || error.message,
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-4">
            <div className="bg-white border border-gray-200 rounded p-5">
                <h2 className="text-lg font-bold text-gray-900">Provision Local Node</h2>
                <p className="text-sm text-gray-500 mt-1">Download roster and exam package from the campus server.</p>
            </div>

            {status.type !== 'idle' && (
                <div className={`rounded border p-3 flex items-start gap-2 ${
                    status.type === 'success'
                        ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                        : 'bg-rose-50 border-rose-200 text-rose-800'
                }`}>
                    {status.type === 'success' ? <CheckCircle2 className="w-4 h-4 mt-0.5" /> : <AlertTriangle className="w-4 h-4 mt-0.5" />}
                    <p className="text-sm">{status.message}</p>
                </div>
            )}

            <div className="grid gap-4 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
                <div className="bg-white border border-gray-200 rounded p-5 space-y-4">
                    <div>
                        <label className="block text-xs font-semibold text-gray-600 mb-1 uppercase tracking-wider">Campus Endpoint</label>
                        <div className="relative">
                            <Server className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                            <input
                                type="text"
                                value={cloudUrl}
                                onChange={(e) => setCloudUrl(e.target.value)}
                                className="w-full pl-9 pr-3 py-2.5 rounded border border-gray-300 bg-gray-50 text-sm focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-semibold text-gray-600 mb-1 uppercase tracking-wider">Synchronization Key</label>
                        <div className="relative">
                            <Wifi className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                            <input
                                type="text"
                                value={syncKey}
                                onChange={(e) => setSyncKey(e.target.value.toUpperCase())}
                                className="w-full pl-9 pr-3 py-2.5 rounded border border-gray-300 bg-gray-50 text-sm font-mono tracking-wider focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                                placeholder="EXAM-XXXX-XXXX"
                            />
                        </div>
                    </div>

                    <button
                        onClick={handleSync}
                        disabled={loading || !syncKey}
                        className="w-full py-2.5 px-4 rounded bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                        {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <DownloadCloud className="w-4 h-4" />}
                        {loading ? 'Syncing...' : 'Pull Exam Package'}
                    </button>
                </div>

                <div className="bg-white border border-gray-200 rounded p-5">
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Important</p>
                    <p className="text-sm text-gray-700 leading-relaxed">
                        Do not run provisioning while an exam is active. It can overwrite current local data.
                    </p>
                    <div className="mt-4 pt-4 border-t border-gray-100 space-y-3">
                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Randomization</p>
                        <label className="flex items-center gap-2 text-sm text-gray-700">
                            <input
                                type="checkbox"
                                checked={randomizeQuestions}
                                onChange={(e) => setRandomizeQuestions(e.target.checked)}
                            />
                            Shuffle question order per student
                        </label>
                        <label className="flex items-center gap-2 text-sm text-gray-700">
                            <input
                                type="checkbox"
                                checked={randomizeOptions}
                                onChange={(e) => setRandomizeOptions(e.target.checked)}
                            />
                            Shuffle option order per question
                        </label>
                        <button
                            onClick={saveRandomization}
                            disabled={savingConfig}
                            className="w-full py-2 px-3 rounded border border-gray-300 text-gray-700 text-sm font-semibold hover:bg-gray-50 disabled:opacity-50"
                        >
                            {savingConfig ? 'Saving...' : 'Save Randomization Settings'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
