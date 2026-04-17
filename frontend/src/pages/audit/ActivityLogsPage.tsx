import { useEffect, useState } from 'react';
import { Activity, Globe, Layout, RefreshCcw, Search, Shield, User, Users } from 'lucide-react';
import api from '../../services/api';
import { useToast } from '../../context/ToastContext';
import { formatDateLocal, formatTimeLocal } from '../../utils/date';

const PORTALS = [
  { id: 'ADMIN', name: 'Admin Portal', icon: Shield, color: 'text-blue-600 bg-blue-50 dark:bg-blue-900/20' },
  { id: 'STUDENT', name: 'Student Portal', icon: User, color: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20' },
  { id: 'STAFF', name: 'Staff Portal', icon: Users, color: 'text-amber-600 bg-amber-50 dark:bg-amber-900/20' },
  { id: 'PARENT', name: 'Parent Portal', icon: Layout, color: 'text-purple-600 bg-purple-50 dark:bg-purple-900/20' },
  { id: 'PUBLIC', name: 'Public/Auth', icon: Globe, color: 'text-gray-600 bg-gray-50 dark:bg-gray-700/20' },
];

export default function ActivityLogsPage() {
  const [loading, setLoading] = useState(true);
  const [logs, setLogs] = useState<any[]>([]);
  const [actions, setActions] = useState<string[]>([]);
  const [search, setSearch] = useState('');
  const [action, setAction] = useState('');
  const [portalFilter, setPortalFilter] = useState('');
  const { showError } = useToast();

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const response = await api.getAuditActivityLogs({ 
        search: search || undefined, 
        action: action || undefined, 
        portal: portalFilter || undefined,
        limit: 50 
      });
      setLogs(response.items || []);
      setActions(response.actions || []);
    } catch (error) {
      showError('Failed to load activity logs');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  const getPortalBadge = (portalId: string) => {
    const portal = PORTALS.find(p => p.id === portalId) || PORTALS[4];
    return (
      <div className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider ${portal.color}`}>
        <portal.icon size={12} />
        {portal.name.replace(' Portal', '')}
      </div>
    );
  };

  const getStatusBadge = (code: number) => {
    const isSuccess = code >= 200 && code < 300;
    const isError = code >= 400;
    const color = isSuccess ? 'text-green-700 bg-green-50 dark:bg-green-900/20' : isError ? 'text-red-700 bg-red-50 dark:bg-red-900/20' : 'text-gray-600 bg-gray-50';
    
    return (
      <span className={`rounded-md px-2 py-0.5 text-[10px] font-black ${color}`}>
        {isSuccess ? 'OK' : isError ? 'FAIL' : code || '???'}
      </span>
    );
  };

  const getMethodColor = (method: string): string => {
    switch (method) {
      case 'DELETE': return 'text-red-700 bg-red-50 dark:bg-red-900/20';
      case 'POST': return 'text-emerald-700 bg-emerald-50 dark:bg-emerald-900/20';
      case 'PUT':
      case 'PATCH': return 'text-blue-700 bg-blue-50 dark:bg-blue-900/20';
      default: return 'text-gray-700 bg-gray-50 dark:bg-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Activity Logs</h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Complete audit trail of all system actions and key operations.</p>
        </div>
        <button
          onClick={fetchLogs}
          className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-700 shadow-sm transition hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700"
        >
          <RefreshCcw size={16} />
          Refresh
        </button>
      </div>

      <div className="grid grid-cols-1 gap-4 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm md:grid-cols-[1fr_180px_220px_auto] dark:border-gray-700 dark:bg-gray-800">
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search email, action, details..."
            className="w-full rounded-xl border border-gray-200 bg-gray-50 py-2.5 pl-10 pr-3 text-sm outline-none transition focus:ring-2 focus:ring-primary-500 dark:border-gray-700 dark:bg-gray-900"
          />
        </div>
        <select
          value={portalFilter}
          onChange={(e) => setPortalFilter(e.target.value)}
          className="rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm outline-none transition focus:ring-2 focus:ring-primary-500 dark:border-gray-700 dark:bg-gray-900"
        >
          <option value="">All Portals</option>
          {PORTALS.map((p) => (
            <option key={p.id} value={p.id}>{p.name}</option>
          ))}
        </select>
        <select
          value={action}
          onChange={(e) => setAction(e.target.value)}
          className="rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm outline-none transition focus:ring-2 focus:ring-primary-500 dark:border-gray-700 dark:bg-gray-900"
        >
          <option value="">All Actions</option>
          {actions.map((item) => (
            <option key={item} value={item}>
              {item}
            </option>
          ))}
        </select>
        <button
          onClick={fetchLogs}
          className="rounded-xl bg-primary-600 px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-primary-700"
        >
          Apply
        </button>
      </div>

      <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-gray-50 dark:bg-gray-900/40">
              <tr>
                <th className="px-6 py-4 text-[11px] font-bold uppercase tracking-widest text-gray-400">Portal</th>
                <th className="px-6 py-4 text-[11px] font-bold uppercase tracking-widest text-gray-400">Activity</th>
                <th className="px-6 py-4 text-[11px] font-bold uppercase tracking-widest text-gray-400">Performed By</th>
                <th className="px-6 py-4 text-[11px] font-bold uppercase tracking-widest text-gray-400">Details</th>
                <th className="px-6 py-4 text-[11px] font-bold uppercase tracking-widest text-gray-400 w-[80px]">Status</th>
                <th className="px-6 py-4 text-[11px] font-bold uppercase tracking-widest text-gray-400">Timestamp</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-16 text-center">
                    <div className="mx-auto h-8 w-8 animate-spin rounded-full border-b-2 border-primary-600" />
                  </td>
                </tr>
              ) : logs.length > 0 ? logs.map((log) => (
                <tr key={log.id} className="hover:bg-gray-50/70 dark:hover:bg-gray-900/30">
                  <td className="px-6 py-4 whitespace-nowrap">
                    {getPortalBadge(log.portal)}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-block rounded-md px-2 py-0.5 text-xs font-bold ${getMethodColor(log.method)}`}>
                      {log.label}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-800 dark:text-gray-200">{log.userEmail}</td>
                  <td className="px-6 py-4">
                    <p className="text-sm text-gray-600 dark:text-gray-300 max-w-md break-words">
                      {log.details || '-'}
                    </p>
                  </td>
                  <td className="px-6 py-4">
                    {getStatusBadge(log.statusCode)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-[11px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-tighter">
                    {formatDateLocal(log.createdAt)} <br/> {formatTimeLocal(log.createdAt)}
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={6} className="px-6 py-16 text-center text-sm text-gray-500 dark:text-gray-400">
                    No activity logs matched the current filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
