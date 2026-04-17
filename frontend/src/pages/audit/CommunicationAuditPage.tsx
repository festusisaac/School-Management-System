import { useEffect, useState } from 'react';
import { CheckCircle2, Mail, MessageSquare, RefreshCcw, Search, XCircle } from 'lucide-react';
import api from '../../services/api';
import { useToast } from '../../context/ToastContext';
import { formatDateLocal, formatTimeLocal } from '../../utils/date';

export default function CommunicationAuditPage() {
  const [loading, setLoading] = useState(true);
  const [logs, setLogs] = useState<any[]>([]);
  const [stats, setStats] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [type, setType] = useState('');
  const [status, setStatus] = useState('');
  const { showError } = useToast();

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const response = await api.getAuditCommunicationLogs({
        search: search || undefined,
        type: type || undefined,
        status: status || undefined,
        limit: 50,
      });
      setLogs(response.items || []);
      setStats(response.stats || []);
    } catch (error) {
      showError('Failed to load communication audit logs');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  const total = stats.reduce((sum, item) => sum + (item.count || 0), 0);
  const delivered = stats.filter((item) => ['DELIVERED', 'OPENED'].includes(item.status)).reduce((sum, item) => sum + item.count, 0);
  const failed = stats.filter((item) => ['FAILED', 'BOUNCED'].includes(item.status)).reduce((sum, item) => sum + item.count, 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Communication Audit</h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Review outbound messages, delivery outcomes, and recipient-level communication history.</p>
        </div>
        <button
          onClick={fetchLogs}
          className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-700 shadow-sm transition hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700"
        >
          <RefreshCcw size={16} />
          Refresh
        </button>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-700 dark:bg-gray-800">
          <p className="text-[11px] font-bold uppercase tracking-widest text-gray-400">Total Logs</p>
          <p className="mt-3 text-3xl font-black text-gray-900 dark:text-white">{total}</p>
        </div>
        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-700 dark:bg-gray-800">
          <p className="text-[11px] font-bold uppercase tracking-widest text-gray-400">Delivered / Opened</p>
          <p className="mt-3 text-3xl font-black text-emerald-600">{delivered}</p>
        </div>
        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-700 dark:bg-gray-800">
          <p className="text-[11px] font-bold uppercase tracking-widest text-gray-400">Failed / Bounced</p>
          <p className="mt-3 text-3xl font-black text-red-600">{failed}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm md:grid-cols-[1fr_180px_180px_auto] dark:border-gray-700 dark:bg-gray-800">
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search recipient, subject, or body..."
            className="w-full rounded-xl border border-gray-200 bg-gray-50 py-2.5 pl-10 pr-3 text-sm outline-none transition focus:ring-2 focus:ring-primary-500 dark:border-gray-700 dark:bg-gray-900"
          />
        </div>
        <select
          value={type}
          onChange={(e) => setType(e.target.value)}
          className="rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm outline-none transition focus:ring-2 focus:ring-primary-500 dark:border-gray-700 dark:bg-gray-900"
        >
          <option value="">All Channels</option>
          <option value="EMAIL">Email</option>
          <option value="SMS">SMS</option>
        </select>
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm outline-none transition focus:ring-2 focus:ring-primary-500 dark:border-gray-700 dark:bg-gray-900"
        >
          <option value="">All Statuses</option>
          {stats.map((item) => (
            <option key={item.status} value={item.status}>{item.status}</option>
          ))}
        </select>
        <button
          onClick={fetchLogs}
          className="rounded-xl bg-primary-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-primary-700"
        >
          Apply Filters
        </button>
      </div>

      <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-gray-50 dark:bg-gray-900/40">
              <tr>
                <th className="px-6 py-4 text-[11px] font-bold uppercase tracking-widest text-gray-400">Channel</th>
                <th className="px-6 py-4 text-[11px] font-bold uppercase tracking-widest text-gray-400">Recipient</th>
                <th className="px-6 py-4 text-[11px] font-bold uppercase tracking-widest text-gray-400">Content</th>
                <th className="px-6 py-4 text-[11px] font-bold uppercase tracking-widest text-gray-400">Status</th>
                <th className="px-6 py-4 text-[11px] font-bold uppercase tracking-widest text-gray-400">Created</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-16 text-center">
                    <div className="mx-auto h-8 w-8 animate-spin rounded-full border-b-2 border-primary-600" />
                  </td>
                </tr>
              ) : logs.length > 0 ? logs.map((log) => (
                <tr key={log.id} className="hover:bg-gray-50/70 dark:hover:bg-gray-900/30">
                  <td className="px-6 py-4">
                    <div className="inline-flex items-center gap-2 text-sm font-semibold text-gray-700 dark:text-gray-300">
                      {log.type === 'EMAIL' ? <Mail size={16} className="text-blue-600" /> : <MessageSquare size={16} className="text-emerald-600" />}
                      {log.type}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-sm font-semibold text-gray-900 dark:text-white">{log.recipientName || '-'}</p>
                    <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">{log.recipient}</p>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-sm font-medium text-gray-800 dark:text-gray-200">{log.subject || '(No subject)'}</p>
                    <p className="mt-1 max-w-[420px] truncate text-xs text-gray-500 dark:text-gray-400">{log.body}</p>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-black uppercase tracking-wider ${
                      ['DELIVERED', 'OPENED'].includes(log.status)
                        ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-300'
                        : ['FAILED', 'BOUNCED'].includes(log.status)
                          ? 'bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-300'
                          : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
                    }`}>
                      {['DELIVERED', 'OPENED'].includes(log.status) ? <CheckCircle2 size={12} /> : ['FAILED', 'BOUNCED'].includes(log.status) ? <XCircle size={12} /> : null}
                      {log.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                    {formatDateLocal(log.createdAt)} {formatTimeLocal(log.createdAt)}
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={5} className="px-6 py-16 text-center text-sm text-gray-500 dark:text-gray-400">
                    No communication logs matched the current filters.
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
