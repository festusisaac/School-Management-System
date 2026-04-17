import { useEffect, useState } from 'react';
import { Activity, AlertTriangle, BarChart3, CheckCircle2, FileText, Mail, Shield, Wallet } from 'lucide-react';
import api from '../../services/api';
import { useToast } from '../../context/ToastContext';
import { formatDateLocal, formatTimeLocal } from '../../utils/date';

export default function AuditOverviewPage() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);
  const { showError } = useToast();

  useEffect(() => {
    const fetchOverview = async () => {
      try {
        setLoading(true);
        const response = await api.getAuditOverview();
        setData(response);
      } catch (error) {
        showError('Failed to load audit overview');
      } finally {
        setLoading(false);
      }
    };

    fetchOverview();
  }, [showError]);

  const metrics = data?.metrics || {};
  const topActions = data?.topActions || [];
  const recentActivity = data?.recentActivity || [];
  const recentCommunication = data?.recentCommunication || [];

  if (loading) {
    return (
      <div className="flex min-h-[420px] items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-b-2 border-primary-600" />
      </div>
    );
  }

  const statCards = [
    { label: 'Activity Logs', value: metrics.totalActivityLogs || 0, icon: Activity, tone: 'text-primary-600 bg-primary-50 dark:bg-primary-900/20' },
    { label: 'Today Activity', value: metrics.todayActivityLogs || 0, icon: Shield, tone: 'text-blue-600 bg-blue-50 dark:bg-blue-900/20' },
    { label: 'Comm Logs', value: metrics.totalCommunicationLogs || 0, icon: Mail, tone: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20' },
    { label: 'Failed Messages', value: metrics.failedCommunicationLogs || 0, icon: AlertTriangle, tone: 'text-red-600 bg-red-50 dark:bg-red-900/20' },
    { label: 'Delivered', value: metrics.deliveredCommunicationLogs || 0, icon: CheckCircle2, tone: 'text-green-600 bg-green-50 dark:bg-green-900/20' },
    { label: 'Fee Transactions', value: metrics.totalFinancialTransactions || 0, icon: Wallet, tone: 'text-amber-600 bg-amber-50 dark:bg-amber-900/20' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Audit & Reports</h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Review audit signals, recent system activity, communication history, and reporting entry points.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        {statCards.map((card) => (
          <div key={card.label} className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-700 dark:bg-gray-800">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-widest text-gray-400">{card.label}</span>
              <div className={`rounded-xl p-2 ${card.tone}`}>
                <card.icon size={18} />
              </div>
            </div>
            <p className="mt-3 text-3xl font-black text-gray-900 dark:text-white">{card.value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[0.95fr_1.05fr]">
        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-700 dark:bg-gray-800">
          <div className="mb-4 flex items-center gap-2">
            <BarChart3 size={18} className="text-primary-600" />
            <h2 className="text-lg font-bold text-gray-900 dark:text-white">Top Recorded Actions</h2>
          </div>
          <div className="space-y-3">
            {topActions.length > 0 ? topActions.map((item: any, i: number) => (
              <div key={i} className="flex items-center justify-between rounded-xl bg-gray-50 px-4 py-3 dark:bg-gray-900/40">
                <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">{item.action}</span>
                <span className="rounded-full bg-primary-100 px-2.5 py-1 text-xs font-black text-primary-700 dark:bg-primary-900/30 dark:text-primary-300">
                  {item.count}
                </span>
              </div>
            )) : (
              <p className="text-sm text-gray-500 dark:text-gray-400">No action records yet.</p>
            )}
          </div>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-700 dark:bg-gray-800">
          <div className="mb-4 flex items-center gap-2">
            <FileText size={18} className="text-primary-600" />
            <h2 className="text-lg font-bold text-gray-900 dark:text-white">Recent System Activity</h2>
          </div>
          <div className="space-y-3">
            {recentActivity.length > 0 ? recentActivity.map((log: any) => (
              <div key={log.id} className="rounded-xl border border-gray-100 p-4 dark:border-gray-700">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm font-bold text-gray-900 dark:text-white">{log.label}</p>
                  <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400 whitespace-nowrap">
                    {formatDateLocal(log.createdAt)} {formatTimeLocal(log.createdAt)}
                  </span>
                </div>
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">{log.userEmail}</p>
                {log.details && log.details.length > 0 && (
                  <p className="mt-2 text-xs text-gray-600 dark:text-gray-400 truncate max-w-full">{log.details}</p>
                )}
              </div>
            )) : (
              <p className="text-sm text-gray-500 dark:text-gray-400">No activity logs yet.</p>
            )}
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-700 dark:bg-gray-800">
        <div className="mb-4 flex items-center gap-2">
          <Mail size={18} className="text-primary-600" />
          <h2 className="text-lg font-bold text-gray-900 dark:text-white">Recent Communication Audit</h2>
        </div>
        <div className="space-y-3">
          {recentCommunication.length > 0 ? recentCommunication.map((log: any) => (
            <div key={log.id} className="flex flex-col gap-2 rounded-xl border border-gray-100 p-4 dark:border-gray-700 md:flex-row md:items-start md:justify-between">
              <div className="min-w-0">
                <p className="text-sm font-bold text-gray-900 dark:text-white">{log.recipientName || log.recipient}</p>
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">{log.type} | {log.status}</p>
                <p className="mt-2 truncate text-sm text-gray-600 dark:text-gray-300">{log.subject || log.body}</p>
              </div>
              <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400">
                {formatDateLocal(log.createdAt)} {formatTimeLocal(log.createdAt)}
              </span>
            </div>
          )) : (
            <p className="text-sm text-gray-500 dark:text-gray-400">No communication logs yet.</p>
          )}
        </div>
      </div>
    </div>
  );
}
