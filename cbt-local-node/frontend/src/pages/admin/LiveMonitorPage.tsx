import { useState, useEffect } from 'react';
import axios from 'axios';
import { RefreshCw, Download, Lock, Unlock, PlusCircle, CheckCircle2, AlertTriangle, Search } from 'lucide-react';
import { getAdminAuthConfig, getAdminToken } from '../../utils/adminAuth';

const API_BASE = '/api';

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
    'node.reset': 'Local node reset',
    'node.export': 'Backup exported',
    'settings.randomization': 'Randomization settings updated',
};

const friendlyAction = (action: string) => actionLabelMap[action] || 'Administrative action recorded';

const friendlyLogDetails = (log: any) => {
    const details = log?.details || {};
    switch (log?.action) {
        case 'session.add_time':
            return `${details.minutes ?? 0} minute(s) added to candidate ${details.studentId || 'unknown'}.`;
        case 'hall.pause_toggle':
            return details.isPaused ? 'All terminals paused.' : 'All terminals resumed.';
        case 'sync.pull':
            return `${details.studentCount ?? 0} candidates and ${details.questionCount ?? 0} questions synced.`;
        case 'sync.push':
            return `${details.pushedCount ?? 0} result record(s) uploaded.`;
        case 'sync.pull.failed':
        case 'sync.push.failed':
            return `Reason: ${details.reason || 'Unknown error.'}`;
        case 'admin.login.failed':
            return 'Wrong passcode was entered.';
        default:
            return '';
    }
};

export default function LiveMonitorPage() {
    const [students, setStudents] = useState<any[]>([]);
    const [isPaused, setIsPaused] = useState(false);
    const [loading, setLoading] = useState(false);
    const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
    const [recentLogs, setRecentLogs] = useState<any[]>([]);
    const [searchTerm, setSearchTerm] = useState('');

    const adminToken = getAdminToken();
    const authHeader = getAdminAuthConfig();

    useEffect(() => {
        fetchMonitorData();
        const interval = setInterval(fetchMonitorData, 5000);
        return () => clearInterval(interval);
    }, []);

    const fetchMonitorData = async () => {
        try {
            const res = await axios.get(`${API_BASE}/monitor`, authHeader);
            setStudents(res.data.students || []);
            setIsPaused(res.data.isPaused);
            setLastUpdated(new Date());

            const logsRes = await axios.get(`${API_BASE}/admin/audit?limit=8`, authHeader);
            setRecentLogs(logsRes.data.logs || []);
        } catch {
            // Silent background failure
        }
    };

    const handleForceSubmit = async (studentId: string) => {
        if (!window.confirm('Force-submit this session?')) return;
        try {
            await axios.post(`${API_BASE}/monitor/force-submit`, { studentId }, authHeader);
            fetchMonitorData();
        } catch (error: any) {
            alert(`Failed: ${error.message}`);
        }
    };

    const togglePause = async () => {
        const action = isPaused ? 'RESUME' : 'PAUSE';
        if (!window.confirm(`Are you sure you want to ${action} all terminals?`)) return;
        try {
            setLoading(true);
            const res = await axios.post(`${API_BASE}/admin/toggle-pause`, {}, authHeader);
            setIsPaused(res.data.isPaused);
            fetchMonitorData();
        } catch (error: any) {
            alert('Failed: ' + error.message);
        } finally {
            setLoading(false);
        }
    };

    const addTime = async (studentId: string, minutes: number) => {
        try {
            await axios.post(`${API_BASE}/admin/add-time`, { studentId, minutes }, authHeader);
            fetchMonitorData();
        } catch {
            alert('Failed to add time');
        }
    };

    const downloadBackup = () => {
        window.open(`${API_BASE}/admin/export?authorization=${adminToken}`, '_blank');
    };

    const activeCount = students.filter((student) => student.session && !student.session.isSubmitted).length;
    const submittedCount = students.filter((student) => student.session?.isSubmitted).length;
    const idleCount = students.filter((student) => !student.session).length;
    const normalizedSearch = searchTerm.trim().toLowerCase();
    const filteredStudents = students.filter((student) => {
        if (!normalizedSearch) return true;
        return (
            String(student?.fullName || '').toLowerCase().includes(normalizedSearch) ||
            String(student?.admissionNo || '').toLowerCase().includes(normalizedSearch) ||
            String(student?.id || '').toLowerCase().includes(normalizedSearch)
        );
    });

    return (
        <div className="space-y-4">
            <div className="bg-white border border-gray-200 rounded p-5 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                    <h2 className="text-lg font-bold text-gray-900">Live Monitor</h2>
                    <p className="text-sm text-gray-500 mt-1">
                        {lastUpdated ? `Updated ${lastUpdated.toLocaleTimeString()}` : 'Waiting for updates...'}
                    </p>
                </div>

                <div className="flex gap-2">
                    <button onClick={downloadBackup} className="px-3 py-2 rounded border border-gray-300 text-gray-700 hover:bg-gray-50">
                        <Download className="w-4 h-4" />
                    </button>
                    <button onClick={fetchMonitorData} className="px-3 py-2 rounded border border-gray-300 text-gray-700 hover:bg-gray-50">
                        <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                    </button>
                    <button
                        onClick={togglePause}
                        disabled={loading}
                        className={`px-3 py-2 rounded text-xs font-bold uppercase tracking-wider text-white ${
                            isPaused ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-rose-600 hover:bg-rose-700'
                        }`}
                    >
                        <span className="inline-flex items-center gap-1">
                            {isPaused ? <Unlock className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
                            {isPaused ? 'Resume' : 'Pause'}
                        </span>
                    </button>
                </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                {[
                    { label: 'Active', value: activeCount },
                    { label: 'Submitted', value: submittedCount },
                    { label: 'Idle', value: idleCount },
                    { label: 'Status', value: isPaused ? 'Paused' : 'Live' },
                ].map((stat) => (
                    <div key={stat.label} className="bg-white border border-gray-200 rounded p-4">
                        <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">{stat.label}</p>
                        <p className="text-xl font-bold text-gray-900 mt-1">{stat.value}</p>
                    </div>
                ))}
            </div>

            <div className="bg-white border border-gray-200 rounded overflow-x-auto">
                <div className="px-4 py-3 border-b border-gray-200 bg-gray-50">
                    <div className="relative max-w-md">
                        <Search className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
                        <input
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            placeholder="Search by candidate name or admission number"
                            className="w-full rounded border border-gray-300 bg-white text-sm text-gray-700 pl-9 pr-3 py-2 focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                        />
                    </div>
                </div>
                <table className="min-w-full">
                    <thead className="bg-gray-50 border-b border-gray-200">
                        <tr>
                            <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">Candidate</th>
                            <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wider text-gray-500">State</th>
                            <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wider text-gray-500">Extra Time</th>
                            <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wider text-gray-500">Answered</th>
                            <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-gray-500">Action</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredStudents.length === 0 && (
                            <tr>
                                <td colSpan={5} className="px-4 py-6 text-sm text-gray-500 text-center">
                                    No candidate matches your search.
                                </td>
                            </tr>
                        )}
                        {filteredStudents.map((student) => {
                            const isActive = student.session && !student.session.isSubmitted;
                            const isSubmitted = student.session?.isSubmitted === 1;
                            const grantedTime = Number(student.session?.extraTimeMinutes || 0);

                            let stateEl = <span className="text-xs text-gray-500">Idle</span>;
                            if (isActive) stateEl = <span className="text-xs text-blue-700 font-semibold">{isPaused ? 'Paused' : 'Active'}</span>;
                            if (isSubmitted) stateEl = <span className="text-xs text-emerald-700 font-semibold">Done</span>;

                            let answered = '0';
                            if (student.session?.answers) {
                                try {
                                    const ans = typeof student.session.answers === 'string' ? JSON.parse(student.session.answers) : student.session.answers;
                                    answered = Object.keys(ans).length.toString();
                                } catch {
                                    answered = 'Err';
                                }
                            }

                            return (
                                <tr key={student.id} className="border-b last:border-b-0">
                                    <td className="px-4 py-3">
                                        <p className="text-sm font-semibold text-gray-900">{student.fullName}</p>
                                        <p className="text-xs text-gray-500 font-mono">{student.admissionNo}</p>
                                    </td>
                                    <td className="px-4 py-3 text-center">{stateEl}</td>
                                    <td className="px-4 py-3 text-center">
                                        {isActive ? (
                                            <div className="inline-flex flex-col items-center gap-1">
                                                <span className="text-[11px] font-semibold text-blue-700">{grantedTime}m granted</span>
                                                <div className="inline-flex gap-1">
                                                    <button onClick={() => addTime(student.id, 5)} className="px-2 py-1 rounded border border-blue-200 text-blue-700 text-xs">
                                                        <span className="inline-flex items-center gap-1"><PlusCircle className="w-3 h-3" />5m</span>
                                                    </button>
                                                    <button onClick={() => addTime(student.id, 10)} className="px-2 py-1 rounded border border-blue-200 text-blue-700 text-xs">
                                                        <span className="inline-flex items-center gap-1"><PlusCircle className="w-3 h-3" />10m</span>
                                                    </button>
                                                </div>
                                            </div>
                                        ) : (
                                            <span className="text-gray-400">{grantedTime > 0 ? `${grantedTime}m granted` : '-'}</span>
                                        )}
                                    </td>
                                    <td className="px-4 py-3 text-center text-sm font-semibold text-gray-700">{answered}</td>
                                    <td className="px-4 py-3 text-right">
                                        {isActive ? (
                                            <button
                                                onClick={() => handleForceSubmit(student.id)}
                                                className="px-3 py-1.5 rounded border border-rose-200 text-rose-700 text-xs font-semibold hover:bg-rose-50"
                                            >
                                                <span className="inline-flex items-center gap-1">
                                                    <AlertTriangle className="w-3 h-3" />
                                                    Force Submit
                                                </span>
                                            </button>
                                        ) : (
                                            <span className="inline-flex items-center gap-1 text-xs text-gray-400">
                                                <CheckCircle2 className="w-3 h-3" />
                                                Locked
                                            </span>
                                        )}
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>

            <div className="bg-white border border-gray-200 rounded p-4">
                <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-3">Recent Admin Actions</h3>
                {recentLogs.length === 0 ? (
                    <p className="text-sm text-gray-500">No recent logs.</p>
                ) : (
                    <ul className="space-y-2">
                        {recentLogs.map((log) => (
                            <li key={log.id} className="flex flex-col md:flex-row md:items-center md:justify-between border border-gray-100 rounded p-2.5 bg-gray-50">
                                <div>
                                    <p className="text-sm font-semibold text-gray-800">{friendlyAction(log.action)}</p>
                                    <p className="text-xs text-gray-500">{friendlyLogDetails(log) || (log.clientId || 'unknown-client')}</p>
                                </div>
                                <span className="text-xs text-gray-500 mt-1 md:mt-0">{new Date(log.createdAt).toLocaleString()}</span>
                            </li>
                        ))}
                    </ul>
                )}
            </div>
        </div>
    );
}
