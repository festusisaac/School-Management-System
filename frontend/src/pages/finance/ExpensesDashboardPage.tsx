import { useEffect, useMemo, useState } from 'react';
import { ArrowRight, ChartPie, CircleDollarSign, Clock3, ReceiptText, Wallet } from 'lucide-react';
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import api from '../../services/api';
import { formatCurrency } from '../../utils/currency';
import { useToast } from '../../context/ToastContext';

interface DashboardData {
  totalRecords: number;
  totalSpent: string;
  pendingAmount: string;
  categoryCount: number;
  vendorCount: number;
  statusBreakdown: Array<{ status: string; count: number; amount: string }>;
  categoryBreakdown: Array<{ id: string; name: string; amount: string; count: number }>;
  monthlyTrend: Array<{ key: string; label: string; total: string }>;
  recentExpenses: Array<{
    id: string;
    title: string;
    amount: string;
    expenseDate: string;
    status: string;
    category?: { name: string };
    vendor?: { name: string };
  }>;
}

const statusColors: Record<string, string> = {
  DRAFT: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200',
  PENDING: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300',
  APPROVED: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
  PAID: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300',
  REJECTED: 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300',
};

export default function ExpensesDashboardPage() {
  const { showError } = useToast();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const response = await api.getExpenseDashboard();
        setData(response);
      } catch (error) {
        console.error('Failed to load expense dashboard', error);
        showError('Failed to load expense dashboard');
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [showError]);

  const trendData = useMemo(() => {
    return (data?.monthlyTrend || []).map((item) => ({
      month: item.label,
      amount: parseFloat(item.total || '0'),
    }));
  }, [data?.monthlyTrend]);
  const hasNonZeroTrend = trendData.some((item) => item.amount > 0);

  return (
    <div className="space-y-6 pb-10">
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Expense Dashboard</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400">Track school spending, pending approvals, and top cost centers at a glance.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        {[
          { label: 'Total Spent', value: formatCurrency(data?.totalSpent || 0), icon: CircleDollarSign, tone: 'from-emerald-500 to-emerald-600' },
          { label: 'Pending Value', value: formatCurrency(data?.pendingAmount || 0), icon: Clock3, tone: 'from-amber-500 to-orange-500' },
          { label: 'Expense Records', value: `${data?.totalRecords || 0}`, icon: ReceiptText, tone: 'from-sky-500 to-cyan-500' },
          { label: 'Active Suppliers', value: `${data?.vendorCount || 0}`, icon: Wallet, tone: 'from-fuchsia-500 to-pink-500' },
        ].map((card) => (
          <div key={card.label} className="rounded-3xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 p-5 shadow-sm">
            <div className={`inline-flex rounded-2xl p-3 text-white bg-gradient-to-br ${card.tone}`}>
              <card.icon size={20} />
            </div>
            <p className="mt-4 text-sm text-gray-500 dark:text-gray-400">{card.label}</p>
            <p className="mt-1 text-2xl font-black text-gray-900 dark:text-white">{loading ? '...' : card.value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[1.2fr_0.8fr] gap-6">
        <section className="rounded-3xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-5">
            <ChartPie size={18} className="text-primary-600" />
            <h2 className="text-lg font-bold text-gray-900 dark:text-white">Monthly Spending Trend</h2>
          </div>
          {!loading && trendData.length ? (
            <div className="rounded-[28px] border border-gray-100 bg-gradient-to-br from-slate-50 via-white to-primary-50/40 p-4 dark:border-gray-800 dark:from-gray-900 dark:via-gray-900 dark:to-primary-950/20">
              <div className="h-[320px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={trendData} margin={{ top: 24, right: 18, left: 4, bottom: 10 }}>
                    <defs>
                      <linearGradient id="expenseTrendFill" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.28} />
                        <stop offset="100%" stopColor="#3b82f6" stopOpacity={0.04} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
                    <XAxis
                      dataKey="month"
                      tick={{ fontSize: 12, fill: '#64748b', fontWeight: 600 }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis
                      tick={{ fontSize: 12, fill: '#94a3b8' }}
                      axisLine={false}
                      tickLine={false}
                      tickFormatter={(value) => formatCurrency(value)}
                      width={84}
                      domain={hasNonZeroTrend ? [0, 'dataMax'] : [0, 1]}
                      ticks={hasNonZeroTrend ? undefined : [0, 0.25, 0.5, 0.75, 1]}
                    />
                    <Tooltip
                      cursor={{ stroke: '#93c5fd', strokeDasharray: '4 4' }}
                      contentStyle={{
                        backgroundColor: '#ffffff',
                        border: '1px solid #e5e7eb',
                        borderRadius: '14px',
                        boxShadow: '0 10px 30px rgba(15, 23, 42, 0.08)',
                        fontSize: '12px',
                      }}
                      formatter={(value) => formatCurrency(Number(value || 0))}
                    />
                    <Area
                      type="monotone"
                      dataKey="amount"
                      stroke="#2563eb"
                      strokeWidth={3}
                      fill="url(#expenseTrendFill)"
                      dot={{ r: 5, fill: '#2563eb', stroke: '#ffffff', strokeWidth: 2 }}
                      activeDot={{ r: 6, fill: '#1d4ed8', stroke: '#ffffff', strokeWidth: 2 }}
                      isAnimationActive={false}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
              {!hasNonZeroTrend && (
                <p className="mt-2 text-center text-sm font-medium text-gray-400 dark:text-gray-500">
                  No spending recorded for this period yet.
                </p>
              )}
            </div>
          ) : (
            <div className="rounded-3xl border border-dashed border-gray-200 bg-gray-50/70 px-6 py-12 text-center dark:border-gray-800 dark:bg-gray-800/40">
              <p className="text-sm font-semibold text-gray-700 dark:text-gray-200">No trend data available yet.</p>
              <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">Monthly spending will appear here once expense records start coming in.</p>
            </div>
          )}
        </section>

        <section className="rounded-3xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 p-6 shadow-sm">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-5">Status Snapshot</h2>
          <div className="space-y-3">
            {(data?.statusBreakdown || []).map((item) => (
              <div key={item.status} className="flex items-center justify-between rounded-2xl bg-gray-50 dark:bg-gray-800/70 px-4 py-3">
                <div>
                  <span className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-bold ${statusColors[item.status] || statusColors.DRAFT}`}>
                    {item.status}
                  </span>
                  <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">{item.count} record(s)</p>
                </div>
                <p className="text-sm font-black text-gray-900 dark:text-white">{formatCurrency(item.amount)}</p>
              </div>
            ))}
          </div>
        </section>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <section className="rounded-3xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 p-6 shadow-sm">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white">Top Categories</h2>
            <span className="text-xs font-bold uppercase tracking-widest text-gray-400">{data?.categoryCount || 0} categories</span>
          </div>
          <div className="space-y-3">
            {(data?.categoryBreakdown || []).map((item) => (
              <div key={item.id} className="rounded-2xl border border-gray-100 dark:border-gray-800 p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-gray-900 dark:text-white">{item.name}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{item.count} expense(s)</p>
                  </div>
                  <p className="font-black text-primary-600 dark:text-primary-400">{formatCurrency(item.amount)}</p>
                </div>
              </div>
            ))}
            {!loading && !data?.categoryBreakdown?.length && (
              <p className="text-sm text-gray-500 dark:text-gray-400">No category spend has been recorded yet.</p>
            )}
          </div>
        </section>

        <section className="rounded-3xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 p-6 shadow-sm">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white">Recent Expenses</h2>
            <ArrowRight size={16} className="text-gray-400" />
          </div>
          <div className="space-y-3">
            {(data?.recentExpenses || []).map((expense) => (
              <div key={expense.id} className="rounded-2xl bg-gray-50 dark:bg-gray-800/70 px-4 py-3">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="font-semibold text-gray-900 dark:text-white">{expense.title}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {expense.category?.name || 'Uncategorized'}{expense.vendor?.name ? ` • ${expense.vendor.name}` : ''}
                    </p>
                    <p className="mt-1 text-xs text-gray-400">{new Date(expense.expenseDate).toLocaleDateString()}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-black text-gray-900 dark:text-white">{formatCurrency(expense.amount)}</p>
                    <span className={`mt-1 inline-flex rounded-full px-2.5 py-1 text-[10px] font-bold ${statusColors[expense.status] || statusColors.DRAFT}`}>
                      {expense.status}
                    </span>
                  </div>
                </div>
              </div>
            ))}
            {!loading && !data?.recentExpenses?.length && (
              <p className="text-sm text-gray-500 dark:text-gray-400">No expense records yet.</p>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
