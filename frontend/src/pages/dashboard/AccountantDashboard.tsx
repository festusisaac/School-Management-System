import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  Banknote,
  CircleDollarSign,
  CreditCard,
  ReceiptText,
  TrendingDown,
  TrendingUp,
  Wallet,
} from 'lucide-react';
import apiService from '../../services/api';
import { useSystem } from '../../context/SystemContext';
import { formatCurrency } from '../../utils/currency';
import { useAuthStore } from '../../stores/authStore';

interface AccountantStats {
  feesOverview?: {
    unpaid: number;
    partial: number;
    paid: number;
  };
}

interface PaymentHistoryResponse {
  items?: Array<{
    id?: string;
    amount?: number | string;
    createdAt?: string;
    paymentMethod?: string;
    student?: {
      firstName?: string;
      lastName?: string;
      admissionNo?: string;
    };
  }>;
  totalAmount?: number | string;
}

interface ExpenseDashboardData {
  totalSpent?: string;
  pendingAmount?: string;
  recentExpenses?: Array<{
    id: string;
    title: string;
    amount: string;
    expenseDate: string;
    status: string;
    category?: { name?: string };
  }>;
}

interface DebtorResponse {
  items?: Array<{
    id: string;
    balance: string;
    student?: {
      id?: string;
      firstName?: string;
      lastName?: string;
      admissionNo?: string;
      class?: { name?: string };
    };
  }>;
  stats?: {
    totalOutstanding?: number | string;
  };
}

interface PayrollAnalytics {
  totalPayout?: number;
  totalStaff?: number;
  paidCount?: number;
}

interface AccountantDashboardSummary {
  totalRevenue: number;
  outstandingFees: number;
  totalExpenses: number;
  netBalance: number;
  payrollStatus: string;
}

type DebtorItem = NonNullable<DebtorResponse['items']>[number];

interface StaffProfile {
  sections?: Array<{
    id: string;
    name?: string;
  }>;
}

const AccountantDashboard: React.FC = () => {
  const { user } = useAuthStore();
  const { activeSectionId, settings } = useSystem();
  const currentSessionId = settings?.currentSessionId;
  const currentTermId = settings?.currentTermId;
  const currentSessionName = settings?.activeSessionName || 'Current Session';
  const currentTermName = settings?.activeTermName || 'Current Term';
  const currentDate = new Date();
  const currentMonth = currentDate.getMonth() + 1;
  const currentYear = currentDate.getFullYear();

  const [stats, setStats] = useState<AccountantStats | null>(null);
  const [summary, setSummary] = useState<AccountantDashboardSummary | null>(null);
  const [payments, setPayments] = useState<PaymentHistoryResponse | null>(null);
  const [expenseDashboard, setExpenseDashboard] = useState<ExpenseDashboardData | null>(null);
  const [debtors, setDebtors] = useState<DebtorItem[]>([]);
  const [staffProfile, setStaffProfile] = useState<StaffProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const userRole = (user?.roleObject?.name || user?.role || '').toLowerCase();
  const assignedSections = staffProfile?.sections || [];
  const assignedSectionIds = assignedSections.map((section) => section.id);
  const hasMultipleAssignedSections = assignedSectionIds.length > 1;
  const fallbackAssignedSectionId = assignedSectionIds[0];
  const effectiveSectionId = (userRole === 'accountant' || userRole === 'bursar')
    ? (
        activeSectionId && assignedSectionIds.includes(activeSectionId)
          ? activeSectionId
          : (fallbackAssignedSectionId || undefined)
      )
    : (activeSectionId || undefined);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const profileData = await apiService.getMyProfile().catch(() => null);
        setStaffProfile(profileData);

        const profileAssignedSectionIds = profileData?.sections?.map((section: { id: string }) => section.id) || [];
        const resolvedSectionId = (userRole === 'accountant' || userRole === 'bursar')
          ? (
              activeSectionId && profileAssignedSectionIds.includes(activeSectionId)
                ? activeSectionId
                : (profileAssignedSectionIds[0] || undefined)
            )
          : effectiveSectionId;

        const params = {
          sectionId: resolvedSectionId,
          sessionId: currentSessionId || undefined,
          termId: currentTermId || undefined,
        };

        const [statsData, paymentsData, expenseData, debtorsData, payrollData] = await Promise.all([
          apiService.getAdminStats(params).catch(() => null),
          apiService.getFinancePayments({
            page: 1,
            limit: 6,
            sectionId: resolvedSectionId,
          }).catch(() => ({ items: [], totalAmount: 0 })),
          apiService.getExpenseDashboard({
            schoolSectionId: resolvedSectionId,
            page: 1,
            limit: 5,
          }).catch(() => null),
          apiService.getDebtorsList({ page: 1, limit: 5, sectionId: resolvedSectionId }).catch(() => ({ items: [], stats: { totalOutstanding: 0 } })),
          apiService.getPayrollAnalytics({
            month: currentMonth,
            year: currentYear,
            sectionId: resolvedSectionId,
          }).catch(() => null),
        ]);

        const totalRevenue = Number(paymentsData?.totalAmount || 0);
        const totalExpenses = Number(expenseData?.totalSpent || 0) + Number(payrollData?.totalPayout || 0);
        const totalOutstanding = Number(debtorsData?.stats?.totalOutstanding || 0);
        const payrollStatus = payrollData?.totalStaff
          ? ((payrollData?.paidCount || 0) >= payrollData.totalStaff
              ? 'Paid'
              : (payrollData?.paidCount || 0) > 0
                ? 'Partially Paid'
                : 'Pending')
          : 'No Payroll';

        setStats(statsData);
        setPayments(paymentsData);
        setExpenseDashboard(expenseData);
        setDebtors(debtorsData?.items || []);
        setSummary({
          totalRevenue,
          outstandingFees: totalOutstanding,
          totalExpenses,
          netBalance: totalRevenue - totalExpenses,
          payrollStatus,
        });
      } catch (error) {
        console.error('Failed to fetch accountant dashboard data', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [activeSectionId, currentMonth, currentTermId, currentSessionId, currentYear, effectiveSectionId, userRole]);

  const cards = useMemo(() => {
    const totalRevenue = summary?.totalRevenue || 0;
    const outstandingFees = summary?.outstandingFees || 0;
    const totalExpenses = summary?.totalExpenses || 0;
    const netBalance = summary?.netBalance || 0;

    return [
      {
        label: 'Revenue Collected',
        value: formatCurrency(totalRevenue),
        icon: CircleDollarSign,
        tone: 'from-emerald-500 to-emerald-600',
      },
      {
        label: 'Outstanding Fees',
        value: formatCurrency(outstandingFees),
        icon: CreditCard,
        tone: 'from-amber-500 to-orange-500',
      },
      {
        label: 'Total Expenses',
        value: formatCurrency(totalExpenses),
        icon: TrendingDown,
        tone: 'from-rose-500 to-rose-600',
      },
      {
        label: 'Net Balance',
        value: formatCurrency(netBalance),
        icon: netBalance >= 0 ? TrendingUp : Wallet,
        tone: netBalance >= 0 ? 'from-sky-500 to-cyan-500' : 'from-slate-600 to-slate-800',
      },
    ];
  }, [summary]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 overflow-x-hidden p-4 sm:p-6 lg:p-8">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.24em] text-primary-600">Finance Workspace</p>
          <h1 className="mt-2 text-2xl font-extrabold tracking-tight text-gray-900 dark:text-white">Accountant Dashboard</h1>
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
            Focused on collections, outstanding balances, spending, and recent finance activity for {currentSessionName} {currentTermName}.
          </p>
          {assignedSectionIds.length > 0 && (
            <p className="mt-2 text-xs font-semibold uppercase tracking-wider text-primary-600 dark:text-primary-400">
              {hasMultipleAssignedSections
                ? 'Use the section switcher to view your assigned school sections'
                : 'Filtered to your assigned school section'}
            </p>
          )}
        </div>
        <div className="rounded-2xl border border-primary-100 bg-primary-50/80 px-4 py-3 text-sm text-primary-700 dark:border-primary-900/40 dark:bg-primary-950/20 dark:text-primary-300">
          <span className="font-bold">Payroll Status:</span> {summary?.payrollStatus || 'Not available'}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        {cards.map((card) => (
          <div key={card.label} className="rounded-3xl border border-gray-100 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-900">
            <div className={`inline-flex rounded-2xl bg-gradient-to-br p-3 text-white ${card.tone}`}>
              <card.icon size={20} />
            </div>
            <p className="mt-4 text-sm text-gray-500 dark:text-gray-400">{card.label}</p>
            <p className="mt-1 text-2xl font-black text-gray-900 dark:text-white">{card.value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <section className="rounded-3xl border border-gray-100 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white">Quick Actions</h2>
            <Banknote className="text-primary-600" size={18} />
          </div>
          <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
            {[
              { label: 'Record Payment', path: '/finance/record-payment' },
              { label: 'Fees History', path: '/finance/payments' },
              { label: 'Debtors List', path: '/finance/debtors' },
              { label: 'Expense Records', path: '/expenses/records' },
              { label: 'Expense Dashboard', path: '/expenses' },
              { label: 'Payment Reminders', path: '/finance/reminders' },
            ].map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className="group flex items-center justify-between rounded-2xl border border-gray-100 bg-gray-50 px-4 py-3 text-sm font-semibold text-gray-700 transition hover:border-primary-200 hover:bg-primary-50 hover:text-primary-700 dark:border-gray-800 dark:bg-gray-800/70 dark:text-gray-200 dark:hover:border-primary-900/50 dark:hover:bg-primary-950/20"
              >
                <span>{item.label}</span>
                <ArrowRight size={16} className="transition group-hover:translate-x-0.5" />
              </Link>
            ))}
          </div>
        </section>

        <section className="rounded-3xl border border-gray-100 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white">Collections Snapshot</h2>
            <ReceiptText className="text-primary-600" size={18} />
          </div>
          <div className="mt-5 space-y-3">
            {[
              { label: 'Fully Paid', value: stats?.feesOverview?.paid || 0 },
              { label: 'Partial Payments', value: stats?.feesOverview?.partial || 0 },
              { label: 'Unpaid', value: stats?.feesOverview?.unpaid || 0 },
              { label: 'Pending Expenses', value: formatCurrency(expenseDashboard?.pendingAmount || 0) },
            ].map((item) => (
              <div key={item.label} className="flex items-center justify-between rounded-2xl bg-gray-50 px-4 py-3 dark:bg-gray-800/70">
                <span className="text-sm font-medium text-gray-600 dark:text-gray-300">{item.label}</span>
                <span className="text-sm font-black text-gray-900 dark:text-white">{item.value}</span>
              </div>
            ))}
          </div>
        </section>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <section className="rounded-3xl border border-gray-100 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white">Recent Payments</h2>
            <Link to="/finance/payments" className="text-sm font-semibold text-primary-600 hover:text-primary-700">
              View all
            </Link>
          </div>
          <div className="mt-5 space-y-3">
            {(payments?.items || []).slice(0, 6).map((payment, index) => {
              const studentName = `${payment.student?.firstName || ''} ${payment.student?.lastName || ''}`.trim() || 'Student';
              return (
                <div key={payment.id || index} className="rounded-2xl border border-gray-100 px-4 py-3 dark:border-gray-800">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="font-semibold text-gray-900 dark:text-white">{studentName}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {payment.student?.admissionNo || 'No admission no.'} • {(payment.paymentMethod || 'Unknown').replace(/_/g, ' ')}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-black text-gray-900 dark:text-white">{formatCurrency(payment.amount || 0)}</p>
                      <p className="text-xs text-gray-400">{payment.createdAt ? new Date(payment.createdAt).toLocaleDateString() : ''}</p>
                    </div>
                  </div>
                </div>
              );
            })}
            {!(payments?.items || []).length && (
              <p className="text-sm text-gray-500 dark:text-gray-400">No recent payments recorded yet.</p>
            )}
          </div>
        </section>

        <section className="rounded-3xl border border-gray-100 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white">Priority Debtors</h2>
            <Link to="/finance/debtors" className="text-sm font-semibold text-primary-600 hover:text-primary-700">
              Open debtors
            </Link>
          </div>
          <div className="mt-5 space-y-3">
            {debtors.slice(0, 6).map((debtor) => {
              const studentName = `${debtor.student?.firstName || ''} ${debtor.student?.lastName || ''}`.trim() || 'Student';
              return (
                <div key={debtor.id} className="rounded-2xl border border-gray-100 px-4 py-3 dark:border-gray-800">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="font-semibold text-gray-900 dark:text-white">{studentName}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {debtor.student?.class?.name || 'No class'} • {debtor.student?.admissionNo || 'No admission no.'}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-black text-rose-600 dark:text-rose-400">{formatCurrency(debtor.balance || 0)}</p>
                    </div>
                  </div>
                </div>
              );
            })}
            {!debtors.length && (
              <p className="text-sm text-gray-500 dark:text-gray-400">No debtor data available right now.</p>
            )}
          </div>
        </section>
      </div>

      <section className="rounded-3xl border border-gray-100 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white">Recent Expenses</h2>
          <Link to="/expenses/records" className="text-sm font-semibold text-primary-600 hover:text-primary-700">
            Manage expenses
          </Link>
        </div>
        <div className="mt-5 grid grid-cols-1 gap-3 lg:grid-cols-2">
          {(expenseDashboard?.recentExpenses || []).slice(0, 4).map((expense) => (
            <div key={expense.id} className="rounded-2xl bg-gray-50 px-4 py-3 dark:bg-gray-800/70">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="font-semibold text-gray-900 dark:text-white">{expense.title}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {expense.category?.name || 'Uncategorized'} • {new Date(expense.expenseDate).toLocaleDateString()}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-black text-gray-900 dark:text-white">{formatCurrency(expense.amount || 0)}</p>
                  <p className="text-xs font-semibold text-gray-400">{expense.status}</p>
                </div>
              </div>
            </div>
          ))}
          {!(expenseDashboard?.recentExpenses || []).length && (
            <p className="text-sm text-gray-500 dark:text-gray-400">No recent expenses available.</p>
          )}
        </div>
      </section>
    </div>
  );
};

export default AccountantDashboard;
