import { useEffect, useState } from 'react';
import axios from 'axios';
import { RefreshCw } from 'lucide-react';
import { getAdminAuthConfig } from '../../utils/adminAuth';

const API_BASE = '/api';

type AuditLog = {
    id: number;
    action: string;
    actor: string;
    clientId: string;
    details: Record<string, any>;
    createdAt: string;
};

type UiTone = 'success' | 'warning' | 'error' | 'neutral';

const actionLabelMap: Record<string, string> = {
    'admin.login.success': 'Admin login successful',
    'admin.login.failed': 'Failed admin login attempt',
    'sync.pull': 'Exam package downloaded',
    'sync.pull.failed': 'Exam package download failed',
    'sync.push': 'Results uploaded to cloud',
    'sync.push.failed': 'Results upload failed',
    'session.force_submit': 'Candidate session force-submitted',
    'hall.pause_toggle': 'Exam hall status changed',
    'session.add_time': 'Extra time added to candidate',
    'node.reset': 'Local node was reset',
    'node.export': 'Backup file exported',
    'settings.randomization': 'Randomization settings updated',
};

const getActionLabel = (action: string) => actionLabelMap[action] || 'Administrative action recorded';

const getTone = (action: string): UiTone => {
    if (action.endsWith('.failed')) return 'error';
    if (action === 'admin.login.failed') return 'warning';
    if (action.includes('reset') || action.includes('force_submit')) return 'warning';
    if (action.endsWith('.success') || action === 'sync.pull' || action === 'sync.push') return 'success';
    return 'neutral';
};

const toneClassMap: Record<UiTone, string> = {
    success: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
    warning: 'bg-amber-50 text-amber-700 border border-amber-200',
    error: 'bg-rose-50 text-rose-700 border border-rose-200',
    neutral: 'bg-gray-50 text-gray-700 border border-gray-200',
};

const formatDetails = (log: AuditLog) => {
    const details = log.details || {};
    switch (log.action) {
        case 'sync.pull':
            return `${details.studentCount ?? 0} candidates and ${details.questionCount ?? 0} questions were synced from ${details.cloudUrl || 'campus server'}.`;
        case 'sync.pull.failed':
            return `Sync failed. Reason: ${details.reason || 'Unknown error.'}`;
        case 'sync.push':
            return `${details.pushedCount ?? 0} candidate records uploaded${details.forced ? ' (force mode enabled)' : ''}.`;
        case 'sync.push.failed':
            return `Push failed. Reason: ${details.reason || 'Unknown error.'}`;
        case 'hall.pause_toggle':
            return details.isPaused ? 'All terminals were paused.' : 'All terminals were resumed.';
        case 'session.add_time':
            return `${details.minutes ?? 0} minute(s) added for candidate ${details.studentId || 'unknown'}.`;
        case 'session.force_submit':
            return `Session was force-submitted for candidate ${details.studentId || 'unknown'}.`;
        case 'settings.randomization':
            return `Question shuffle: ${details.randomizeQuestions ? 'On' : 'Off'}, Option shuffle: ${details.randomizeOptions ? 'On' : 'Off'}.`;
        case 'admin.login.failed':
            return 'A wrong passcode was entered.';
        case 'admin.login.success':
            return 'Administrator signed in successfully.';
        default: {
            const entries = Object.entries(details);
            if (entries.length === 0) return 'No additional details.';
            return entries
                .slice(0, 4)
                .map(([key, value]) => `${key}: ${String(value)}`)
                .join(' | ');
        }
    }
};

export default function AuditLogsPage() {
    const [logs, setLogs] = useState<AuditLog[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [limit, setLimit] = useState(50);
    const [health, setHealth] = useState<any>(null);

    const fetchLogs = async () => {
        setLoading(true);
        setError('');
        try {
            const res = await axios.get(`${API_BASE}/admin/audit?limit=${limit}`, getAdminAuthConfig());
            setLogs(res.data.logs || []);
            const healthRes = await axios.get(`${API_BASE}/admin/health`, getAdminAuthConfig());
            setHealth(healthRes.data || null);
        } catch (err: any) {
            setError(err.response?.data?.error || 'Failed to load audit logs.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchLogs();
    }, [limit]);

    return (
        <div className="space-y-4">
            <div className="bg-white border border-gray-200 rounded p-5 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                <div>
                    <h2 className="text-lg font-bold text-gray-900">Audit Logs</h2>
                    <p className="text-sm text-gray-500 mt-1">Review admin actions and timestamps across this node.</p>
                </div>

                <div className="flex items-center gap-2">
                    <select
                        value={limit}
                        onChange={(e) => setLimit(Number(e.target.value))}
                        className="px-3 py-2 rounded border border-gray-300 text-sm text-gray-700 bg-white"
                    >
                        <option value={25}>Last 25</option>
                        <option value={50}>Last 50</option>
                        <option value={100}>Last 100</option>
                        <option value={200}>Last 200</option>
                    </select>
                    <button
                        onClick={fetchLogs}
                        className="px-3 py-2 rounded border border-gray-300 text-gray-700 hover:bg-gray-50"
                        title="Refresh logs"
                    >
                        <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                    </button>
                </div>
            </div>

            {error && <div className="bg-rose-50 border border-rose-200 text-rose-700 rounded p-3 text-sm">{error}</div>}

            {health && (
                <div className="bg-white border border-gray-200 rounded p-4">
                    <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-3">Node Health</h3>
                    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                        <div className="border border-gray-200 rounded p-3 bg-gray-50">
                            <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">Memory (Used)</p>
                            <p className="text-lg font-bold text-gray-900 mt-1">{health.node?.usedMemMb ?? 0} MB</p>
                        </div>
                        <div className="border border-gray-200 rounded p-3 bg-gray-50">
                            <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">CPU Spike</p>
                            <p className="text-lg font-bold text-gray-900 mt-1">{health.node?.cpuSpikePercent ?? 0}%</p>
                        </div>
                        <div className="border border-gray-200 rounded p-3 bg-gray-50">
                            <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">DB Size</p>
                            <p className="text-lg font-bold text-gray-900 mt-1">
                                {Math.round(Number(health.storage?.dbSizeBytes || 0) / 1024)} KB
                            </p>
                        </div>
                        <div className="border border-gray-200 rounded p-3 bg-gray-50">
                            <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">Cloud Reachability</p>
                            <p className={`text-sm font-bold mt-1 ${health.cloud?.reachable ? 'text-emerald-700' : 'text-rose-700'}`}>
                                {health.cloud?.reachable ? `Reachable (${health.cloud?.latencyMs ?? '-'} ms)` : 'Unreachable'}
                            </p>
                            {health.cloud?.error && (
                                <p className="text-xs text-gray-500 mt-1">{health.cloud.error}</p>
                            )}
                        </div>
                    </div>
                </div>
            )}

            <div className="bg-white border border-gray-200 rounded overflow-x-auto">
                <table className="min-w-full">
                    <thead className="bg-gray-50 border-b border-gray-200">
                        <tr>
                            <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">Time</th>
                            <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">Activity</th>
                            <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">Status</th>
                            <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">Handled By</th>
                            <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">Source Device</th>
                            <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">What Happened</th>
                        </tr>
                    </thead>
                    <tbody>
                        {logs.length === 0 && !loading && (
                            <tr>
                                <td colSpan={6} className="px-4 py-6 text-sm text-gray-500 text-center">
                                    No activity yet. Actions like login, sync, pause/resume, and uploads will appear here.
                                </td>
                            </tr>
                        )}
                        {logs.map((log) => (
                            <tr key={log.id} className="border-b last:border-b-0">
                                <td className="px-4 py-3 text-xs text-gray-600 whitespace-nowrap">
                                    {new Date(log.createdAt).toLocaleString()}
                                </td>
                                <td className="px-4 py-3 text-sm font-semibold text-gray-900">{getActionLabel(log.action)}</td>
                                <td className="px-4 py-3 text-xs">
                                    <span className={`inline-flex px-2 py-1 rounded-full font-semibold ${toneClassMap[getTone(log.action)]}`}>
                                        {getTone(log.action).toUpperCase()}
                                    </span>
                                </td>
                                <td className="px-4 py-3 text-sm text-gray-700">{log.actor}</td>
                                <td className="px-4 py-3 text-xs font-mono text-gray-600">{log.clientId || '-'}</td>
                                <td className="px-4 py-3 text-xs text-gray-700 max-w-[520px]">
                                    {formatDetails(log)}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
