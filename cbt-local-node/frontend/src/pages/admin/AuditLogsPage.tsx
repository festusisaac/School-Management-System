import { useEffect, useState } from 'react';
import axios from 'axios';
import { RefreshCw } from 'lucide-react';

const API_BASE = '/api';

type AuditLog = {
    id: number;
    action: string;
    actor: string;
    clientId: string;
    details: Record<string, any>;
    createdAt: string;
};

export default function AuditLogsPage() {
    const [logs, setLogs] = useState<AuditLog[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [limit, setLimit] = useState(50);

    const fetchLogs = async () => {
        setLoading(true);
        setError('');
        try {
            const res = await axios.get(`${API_BASE}/admin/audit?limit=${limit}`);
            setLogs(res.data.logs || []);
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

            <div className="bg-white border border-gray-200 rounded overflow-x-auto">
                <table className="min-w-full">
                    <thead className="bg-gray-50 border-b border-gray-200">
                        <tr>
                            <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">Time</th>
                            <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">Action</th>
                            <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">Actor</th>
                            <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">Client</th>
                            <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">Details</th>
                        </tr>
                    </thead>
                    <tbody>
                        {logs.length === 0 && !loading && (
                            <tr>
                                <td colSpan={5} className="px-4 py-6 text-sm text-gray-500 text-center">
                                    No audit logs found.
                                </td>
                            </tr>
                        )}
                        {logs.map((log) => (
                            <tr key={log.id} className="border-b last:border-b-0">
                                <td className="px-4 py-3 text-xs text-gray-600 whitespace-nowrap">
                                    {new Date(log.createdAt).toLocaleString()}
                                </td>
                                <td className="px-4 py-3 text-sm font-semibold text-gray-900">{log.action}</td>
                                <td className="px-4 py-3 text-sm text-gray-700">{log.actor}</td>
                                <td className="px-4 py-3 text-xs font-mono text-gray-600">{log.clientId || '-'}</td>
                                <td className="px-4 py-3 text-xs text-gray-600 max-w-[420px]">
                                    <code className="bg-gray-50 border border-gray-200 rounded px-2 py-1 inline-block whitespace-pre-wrap break-all">
                                        {JSON.stringify(log.details || {})}
                                    </code>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
