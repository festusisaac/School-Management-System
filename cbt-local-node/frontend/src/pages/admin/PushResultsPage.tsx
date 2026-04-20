import { useEffect, useState } from 'react';
import axios from 'axios';
import { RefreshCw, CheckCircle2, AlertTriangle, ShieldCheck, Trash2 } from 'lucide-react';
import { getAdminAuthConfig } from '../../utils/adminAuth';

const API_BASE = '/api';

export default function PushResultsPage() {
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');
    const [summary, setSummary] = useState<{
        totalStudents: number;
        totalSessions: number;
        submittedCount: number;
        missingCount: number;
        missingStudents: Array<{ admissionNo: string; fullName: string }>;
    } | null>(null);
    const [allowForcePush, setAllowForcePush] = useState(false);
    const [pushJob, setPushJob] = useState<{
        jobId: string;
        state: string;
        progress: number;
        failedReason: string | null;
        assessmentTypeId: string | null;
        assessmentTypeLabel: string | null;
    } | null>(null);

    const isSuccess = message.startsWith('Success');
    const blockPush = !!summary && summary.missingCount > 0 && !allowForcePush;

    const loadSummary = async () => {
        try {
            const res = await axios.get(`${API_BASE}/push/summary`, getAdminAuthConfig());
            setSummary(res.data);
        } catch {
            // ignore
        }
    };

    const loadPushStatus = async (jobId?: string) => {
        try {
            const url = jobId ? `${API_BASE}/push/status?jobId=${encodeURIComponent(jobId)}` : `${API_BASE}/push/status`;
            const res = await axios.get(url, getAdminAuthConfig());
            setPushJob({
                jobId: String(res.data.jobId || ''),
                state: String(res.data.state || 'unknown'),
                progress: Number(res.data.progress || 0),
                failedReason: res.data.failedReason || null,
                assessmentTypeId: res.data.assessmentTypeId ? String(res.data.assessmentTypeId) : null,
                assessmentTypeLabel: res.data.assessmentTypeLabel ? String(res.data.assessmentTypeLabel) : null
            });
        } catch {
            if (jobId) {
                setPushJob({
                    jobId,
                    state: 'tracking_unavailable',
                    progress: 0,
                    failedReason: 'Job tracking endpoint is not reachable. Restart cloud and CBT backends.',
                    assessmentTypeId: null,
                    assessmentTypeLabel: null
                });
            }
        }
    };

    useEffect(() => {
        loadSummary();
        loadPushStatus();
    }, []);

    useEffect(() => {
        if (!pushJob?.jobId) return;
        const state = pushJob.state.toLowerCase();
        if (state === 'completed' || state === 'failed' || state === 'not_found' || state === 'forbidden') return;

        const interval = setInterval(() => {
            loadPushStatus(pushJob.jobId);
        }, 2500);
        return () => clearInterval(interval);
    }, [pushJob?.jobId, pushJob?.state]);

    const handlePush = async () => {
        setLoading(true);
        setMessage('');
        try {
            const res = await axios.post(`${API_BASE}/push`, { force: allowForcePush }, getAdminAuthConfig());
            const jobId = res.data?.jobId ? String(res.data.jobId) : '';
            const assessmentTypeId = res.data?.assessmentTypeId ? String(res.data.assessmentTypeId) : null;
            const assessmentTypeLabel = res.data?.assessmentTypeLabel ? String(res.data.assessmentTypeLabel) : null;
            setMessage(
                `Success! Pushed ${res.data.count} candidate records to cloud grading.` +
                (jobId
                    ? ` Job ID: ${jobId}`
                    : ' Cloud did not return a job ID, so live tracking is unavailable for this push.')
            );
            if (jobId) {
                setPushJob({ jobId, state: 'queued', progress: 0, failedReason: null, assessmentTypeId, assessmentTypeLabel });
                loadPushStatus(jobId);
            } else {
                setPushJob({
                    jobId: 'N/A',
                    state: 'tracking_unavailable',
                    progress: 0,
                    failedReason: 'No job ID returned by cloud. Ensure cloud backend has upload-status endpoint and restart services.',
                    assessmentTypeId,
                    assessmentTypeLabel
                });
            }
            loadSummary();
        } catch (error: any) {
            setMessage(`Sync failed: ${error.response?.data?.error || error.message}`);
        } finally {
            setLoading(false);
        }
    };

    const handleResetNode = async () => {
        if (!window.confirm('This will permanently clear local students and questions. Continue?')) return;
        try {
            await axios.post(`${API_BASE}/admin/reset`, {}, getAdminAuthConfig());
            setMessage('Success! Local registry has been reset for a new provisioning cycle.');
            loadSummary();
        } catch (error: any) {
            alert('Reset failed: ' + error.message);
        }
    };

    return (
        <div className="space-y-4">
            <div className="bg-white border border-gray-200 rounded p-5">
                <h2 className="text-lg font-bold text-gray-900">Push Results</h2>
                <p className="text-sm text-gray-500 mt-1">Upload completed local sessions to the campus cloud for grading.</p>
            </div>

            {message && (
                <div className={`rounded border p-3 flex items-start gap-2 ${
                    isSuccess ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-rose-50 border-rose-200 text-rose-800'
                }`}>
                    {isSuccess ? <CheckCircle2 className="w-4 h-4 mt-0.5" /> : <AlertTriangle className="w-4 h-4 mt-0.5" />}
                    <p className="text-sm">{message}</p>
                </div>
            )}

            <div className="grid gap-4 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
                <div className="bg-white border border-gray-200 rounded p-5 space-y-4">
                    {pushJob && (
                        <div className="border border-gray-200 rounded p-4 bg-gray-50 space-y-1">
                            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Cloud Import Job</p>
                            <p className="text-sm text-gray-700">Job ID: <span className="font-mono">{pushJob.jobId}</span></p>
                            <p className="text-sm text-gray-700">Assessment Type: <span className="font-semibold">{pushJob.assessmentTypeLabel || 'Not provided by cloud'}</span></p>
                            <p className="text-sm text-gray-700">
                                State:{' '}
                                <span className={`font-semibold ${
                                    pushJob.state.toLowerCase() === 'completed'
                                        ? 'text-emerald-700'
                                        : pushJob.state.toLowerCase() === 'failed'
                                          ? 'text-rose-700'
                                          : 'text-blue-700'
                                }`}>
                                    {pushJob.state}
                                </span>
                            </p>
                            <p className="text-sm text-gray-700">Progress: <span className="font-semibold">{pushJob.progress}%</span></p>
                            {pushJob.failedReason && (
                                <p className="text-xs text-rose-700">Reason: {pushJob.failedReason}</p>
                            )}
                        </div>
                    )}

                    {summary && (
                        <div className="border border-gray-200 rounded p-4 bg-gray-50 space-y-2">
                            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Pre-Push Verification</p>
                            <p className="text-sm text-gray-700">Total Candidates: <span className="font-semibold">{summary.totalStudents}</span></p>
                            <p className="text-sm text-gray-700">Submitted Sessions: <span className="font-semibold">{summary.submittedCount}</span></p>
                            <p className={`text-sm ${summary.missingCount > 0 ? 'text-rose-700' : 'text-emerald-700'}`}>
                                Missing Submissions: <span className="font-semibold">{summary.missingCount}</span>
                            </p>
                            {summary.missingCount > 0 && (
                                <div className="text-xs text-rose-700 bg-rose-50 border border-rose-200 rounded p-2">
                                    Incomplete candidates: {summary.missingStudents.map(s => s.admissionNo).join(', ')}
                                </div>
                            )}
                            <label className="flex items-center gap-2 text-sm text-gray-700 pt-1">
                                <input
                                    type="checkbox"
                                    checked={allowForcePush}
                                    onChange={(e) => setAllowForcePush(e.target.checked)}
                                />
                                Allow force push when submissions are incomplete
                            </label>
                        </div>
                    )}

                    <div className="border border-gray-200 rounded p-4 bg-gray-50">
                        <p className="text-sm text-gray-700">
                            Run this only after the examination is complete and no terminal is still active.
                        </p>
                    </div>

                    <button
                        onClick={handlePush}
                        disabled={loading || blockPush}
                        className="w-full py-2.5 px-4 rounded bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                        {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <ShieldCheck className="w-4 h-4" />}
                        {loading ? 'Pushing...' : 'Push Results To Cloud'}
                    </button>
                    {blockPush && (
                        <p className="text-xs text-rose-700">Enable force push if you still want to continue with missing submissions.</p>
                    )}
                </div>

                <div className="bg-white border border-gray-200 rounded p-5 space-y-3">
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Optional Maintenance</p>
                    <p className="text-sm text-gray-700">
                        After a successful push, you can reset this local node before provisioning another exam.
                    </p>
                    <button
                        onClick={handleResetNode}
                        className="w-full py-2.5 px-4 rounded border border-rose-200 text-rose-700 text-sm font-semibold hover:bg-rose-50 flex items-center justify-center gap-2"
                    >
                        <Trash2 className="w-4 h-4" />
                        Wipe Local Registry
                    </button>
                </div>
            </div>
        </div>
    );
}
