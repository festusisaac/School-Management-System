import React, { useMemo } from 'react';
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { TrendingUp, TrendingDown, Calendar, DollarSign } from 'lucide-react';
import { formatCurrency } from '../../../utils/currency';

interface FinancialInsightsProps {
  history: any[];
  statement: any;
}

const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

export const FinancialInsights: React.FC<FinancialInsightsProps> = ({ history, statement }) => {
  // Payment trends over time (last 6 months)
  const paymentTrends = useMemo(() => {
    const monthlyData: { [key: string]: number } = {};
    const now = new Date();
    
    // Initialize last 6 months
    for (let i = 5; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
      monthlyData[key] = 0;
    }

    // Aggregate payments by month
    history.forEach((payment) => {
      const date = new Date(payment.createdAt);
      const key = date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
      if (monthlyData.hasOwnProperty(key)) {
        monthlyData[key] += parseFloat(payment.amount);
      }
    });

    return Object.entries(monthlyData).map(([month, amount]) => ({
      month,
      amount,
    }));
  }, [history]);

  // Payment method distribution
  const paymentMethodData = useMemo(() => {
    const methodCounts: { [key: string]: number } = {};
    
    history.forEach((payment) => {
      const method = payment.paymentMethod || 'Unknown';
      methodCounts[method] = (methodCounts[method] || 0) + parseFloat(payment.amount);
    });

    return Object.entries(methodCounts).map(([name, value]) => ({
      name,
      value,
    }));
  }, [history]);

  // Fee breakdown by status
  const feeStatusData = useMemo(() => {
    if (!statement?.assignedHeads) return [];

    const paid = statement.assignedHeads.filter((h: any) => parseFloat(h.balance) <= 0).length;
    const partial = statement.assignedHeads.filter((h: any) => {
      const balance = parseFloat(h.balance);
      const amount = parseFloat(h.amount);
      return balance > 0 && balance < amount;
    }).length;
    const pending = statement.assignedHeads.filter((h: any) => parseFloat(h.balance) === parseFloat(h.amount)).length;

    return [
      { name: 'Fully Paid', value: paid, color: '#10b981' },
      { name: 'Partial', value: partial, color: '#f59e0b' },
      { name: 'Pending', value: pending, color: '#ef4444' },
    ].filter(item => item.value > 0);
  }, [statement]);

  // Calculate statistics
  const stats = useMemo(() => {
    const totalPaid = parseFloat(statement?.totalPaid || '0');
    const balance = parseFloat(statement?.balance || '0');
    const totalDue = parseFloat(statement?.totalDue || '0');
    const paymentRate = totalDue > 0 ? (totalPaid / totalDue) * 100 : 0;

    // Recent payment trend (last 30 days vs previous 30 days)
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const sixtyDaysAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);

    const recentPayments = history.filter(p => new Date(p.createdAt) >= thirtyDaysAgo);
    const previousPayments = history.filter(p => {
      const date = new Date(p.createdAt);
      return date >= sixtyDaysAgo && date < thirtyDaysAgo;
    });

    const recentTotal = recentPayments.reduce((sum, p) => sum + parseFloat(p.amount), 0);
    const previousTotal = previousPayments.reduce((sum, p) => sum + parseFloat(p.amount), 0);
    const trend = previousTotal > 0 ? ((recentTotal - previousTotal) / previousTotal) * 100 : 0;

    return {
      paymentRate,
      trend,
      recentTotal,
      lastPaymentDate: history.length > 0 ? new Date(history[0].createdAt) : null,
    };
  }, [statement, history]);

  return (
    <div className="space-y-6">
      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-5 border border-gray-100 dark:border-gray-700 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Payment Rate</p>
            <div className="p-2 bg-blue-50 dark:bg-blue-900/30 rounded-lg">
              <DollarSign className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            </div>
          </div>
          <p className="text-2xl font-black text-gray-900 dark:text-white">{stats.paymentRate.toFixed(1)}%</p>
          <p className="text-xs text-gray-500 mt-1">of total fees paid</p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-2xl p-5 border border-gray-100 dark:border-gray-700 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">30-Day Trend</p>
            <div className={`p-2 rounded-lg ${stats.trend >= 0 ? 'bg-emerald-50 dark:bg-emerald-900/30' : 'bg-red-50 dark:bg-red-900/30'}`}>
              {stats.trend >= 0 ? (
                <TrendingUp className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              ) : (
                <TrendingDown className="w-4 h-4 text-red-600 dark:text-red-400" />
              )}
            </div>
          </div>
          <p className={`text-2xl font-black ${stats.trend >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
            {stats.trend >= 0 ? '+' : ''}{stats.trend.toFixed(1)}%
          </p>
          <p className="text-xs text-gray-500 mt-1">{formatCurrency(stats.recentTotal)} this month</p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-2xl p-5 border border-gray-100 dark:border-gray-700 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Last Payment</p>
            <div className="p-2 bg-purple-50 dark:bg-purple-900/30 rounded-lg">
              <Calendar className="w-4 h-4 text-purple-600 dark:text-purple-400" />
            </div>
          </div>
          <p className="text-2xl font-black text-gray-900 dark:text-white">
            {stats.lastPaymentDate ? stats.lastPaymentDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : 'N/A'}
          </p>
          <p className="text-xs text-gray-500 mt-1">
            {stats.lastPaymentDate ? stats.lastPaymentDate.toLocaleDateString('en-US', { year: 'numeric' }) : 'No payments yet'}
          </p>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Payment Trends Chart */}
        <div className="bg-white dark:bg-gray-800 rounded-3xl border border-gray-100 dark:border-gray-700 shadow-sm p-6">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Payment Trends</h3>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={paymentTrends}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="month" tick={{ fontSize: 12 }} stroke="#6b7280" />
              <YAxis tick={{ fontSize: 12 }} stroke="#6b7280" />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#fff',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                  fontSize: '12px',
                }}
                formatter={(value: any) => formatCurrency(value)}
              />
              <Line type="monotone" dataKey="amount" stroke="#3b82f6" strokeWidth={2} dot={{ fill: '#3b82f6', r: 4 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Payment Method Distribution */}
        <div className="bg-white dark:bg-gray-800 rounded-3xl border border-gray-100 dark:border-gray-700 shadow-sm p-6">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Payment Methods</h3>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie
                data={paymentMethodData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name} (${((percent || 0) * 100).toFixed(0)}%)`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {paymentMethodData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(value: any) => formatCurrency(value)} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Fee Status Distribution */}
        {feeStatusData.length > 0 && (
          <div className="bg-white dark:bg-gray-800 rounded-3xl border border-gray-100 dark:border-gray-700 shadow-sm p-6">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Fee Status</h3>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={feeStatusData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} stroke="#6b7280" />
                <YAxis tick={{ fontSize: 12 }} stroke="#6b7280" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#fff',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    fontSize: '12px',
                  }}
                />
                <Bar dataKey="value" radius={[8, 8, 0, 0]}>
                  {feeStatusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Top Fee Heads */}
        {statement?.assignedHeads && statement.assignedHeads.length > 0 && (
          <div className="bg-white dark:bg-gray-800 rounded-3xl border border-gray-100 dark:border-gray-700 shadow-sm p-6">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Fee Breakdown</h3>
            <div className="space-y-3">
              {statement.assignedHeads.slice(0, 5).map((head: any, index: number) => {
                const amount = parseFloat(head.amount);
                const balance = parseFloat(head.balance);
                const paid = amount - balance;
                const progress = amount > 0 ? (paid / amount) * 100 : 0;

                return (
                  <div key={head.id}>
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-sm font-bold text-gray-900 dark:text-white">{head.name}</span>
                      <span className="text-sm font-bold text-gray-600 dark:text-gray-400">{progress.toFixed(0)}%</span>
                    </div>
                    <div className="h-2 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-primary-500 to-primary-600 rounded-full transition-all duration-500"
                        style={{ width: `${Math.min(progress, 100)}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
