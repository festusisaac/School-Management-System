import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search,
  Filter,
  Download,
  Printer,
  Calendar,
  CreditCard,
  User,
  ChevronLeft,
  ChevronRight,
  SearchX,
  FileText,
  ArrowUpRight,
  Banknote,
  MoreHorizontal,
  Eye,
  RefreshCcw,
  CheckCircle2,
  XCircle,
  Clock,
  X
} from 'lucide-react';
import { ReceiptTemplate } from './components/ReceiptTemplate';
import StudentFinancePage from './StudentFinancePage';
import ReactDOM from 'react-dom/client';
import api from '../../services/api';
import { useToast } from '../../context/ToastContext';
import { clsx } from 'clsx';
import { formatCurrency, CURRENCY_SYMBOL } from '../../utils/currency';
import { useSystem } from '../../context/SystemContext';
import { useAuthStore } from '../../stores/authStore';
import { formatDateLocal, formatTimeLocal } from '../../utils/date';

interface Transaction {
  id: string;
  amount: string;
  type: string;
  paymentMethod: string;
  reference: string;
  createdAt: string;
  student?: {
    firstName: string;
    lastName: string;
    admissionNo: string;
    class?: { name: string };
  };
  meta?: {
    note: string;
    isRefunded?: boolean;
    refundTransactionId?: string;
    allocations?: Array<{
      headId: string;
      name: string;
      amount: string;
      status: 'FULL' | 'PARTIAL' | 'NOT_PAID';
    }>;
  };
}


export default function FeesHistoryPage() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { showError, showSuccess } = useToast();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [totalAmount, setTotalAmount] = useState(0);
  const [stats, setStats] = useState({
    paymentCount: 0,
    refundCount: 0,
    waiverCount: 0,
    partialCount: 0
  });
  const [page, setPage] = useState(1);
  const [limit] = useState(10);

  // User Role Check
  const currentUserRole = (user?.role || user?.roleObject?.name || 'student').toLowerCase();
  const isStudent = currentUserRole === 'student' || currentUserRole === 'parent';

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [method, setMethod] = useState('');
  const [type, setType] = useState('');

  const { settings, getSchoolInfo, activeSectionId } = useSystem();

  // Actions
  const [selectedTx, setSelectedTx] = useState<Transaction | null>(null);
  const [showReceipt, setShowReceipt] = useState(false);
  const [showRefund, setShowRefund] = useState(false);
  const [refundReason, setRefundReason] = useState('');
  const [processingRefund, setProcessingRefund] = useState(false);

  const fetchHistory = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.getFinancePayments({
        studentId: searchQuery || undefined,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
        method: method || undefined,
        type: type || undefined,
        sectionId: activeSectionId || undefined,
        page,
        limit
      });
      setTransactions(res.items || []);
      setTotal(res.total || 0);
      setTotalAmount(res.totalAmount || 0);
      setStats(res.stats || {
        paymentCount: 0,
        refundCount: 0,
        waiverCount: 0,
        partialCount: 0
      });
    } catch (error) {
      showError('Failed to load transaction history');
    } finally {
      setLoading(false);
    }
  }, [page, limit, startDate, endDate, method, type, searchQuery, showError, activeSectionId]);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  // Removed session loader


  // Removed handleSessionChange


  const handleExportCSV = () => {
    if (transactions.length === 0) return;

    const headers = ['Date', 'Student', 'Admission ID', `Amount (${CURRENCY_SYMBOL})`, 'Method', 'Reference', 'Type'];
    const rows = transactions.map(t => [
      formatDateLocal(t.createdAt),
      `${t.student?.firstName} ${t.student?.lastName}`,
      t.student?.admissionNo,
      t.amount,
      t.paymentMethod,
      t.reference || 'N/A',
      t.type
    ]);

    const csvContent = [headers, ...rows].map(e => e.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `Fees_History_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showSuccess('Export started');
  };

  const handleRefundSubmit = async () => {
    if (!selectedTx || !refundReason) return;

    if (!window.confirm('Are you sure you want to refund this transaction? This action cannot be undone.')) return;

    setProcessingRefund(true);
    try {
      await api.refundPayment(selectedTx.id, refundReason);
      showSuccess('Refund processed successfully');
      setShowRefund(false);
      setRefundReason('');
      setSelectedTx(null);
      fetchHistory(); // Refresh list
    } catch (error) {
      showError('Failed to process refund');
    } finally {
      setProcessingRefund(false);
    }
  };

  const handlePrintReceipt = (tx: Transaction) => {
    // Open a new window
    const printWindow = window.open('', '', 'width=800,height=600');
    if (!printWindow) {
      showError('Popup blocked. Please allow popups to print receipts.');
      return;
    }

    // Write basic HTML structure
    printWindow.document.write(`
      <html>
        <head>
          <title>Print Receipt - ${tx.id}</title>
          <script src="https://cdn.tailwindcss.com"></script>
        </head>
        <body>
          <div id="print-root"></div>
          <script>
            setTimeout(() => {
              window.print();
              window.close();
            }, 1000);
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();

    // Render the receipt component into the new window
    const root = ReactDOM.createRoot(printWindow.document.getElementById('print-root') as HTMLElement);
    root.render(
      <ReceiptTemplate
        transaction={tx}
        schoolInfo={getSchoolInfo()}
      />
    );
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-10">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Fees History</h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm">Monitor and manage all financial transactions.</p>
        </div>
        <div className="flex items-center gap-3">
          {isStudent && (
              <button
                onClick={() => navigate(`/students/profile/${user?.id}`)}
                className="flex items-center gap-2 px-4 py-2 bg-primary-600 border border-primary-600 rounded-xl text-sm font-semibold text-white hover:bg-primary-700 transition-all shadow-sm"
              >
                <CreditCard size={18} />
                Make Payment
              </button>
          )}
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm font-semibold text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-all shadow-sm"
          >
            <Download size={18} />
            Export CSV
          </button>
        </div>
      </div>

      {/* Quick Stats Banner */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {/* Payments Count */}
        <div className="bg-white dark:bg-gray-800 p-4 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary-50 dark:bg-primary-900/20 flex items-center justify-center text-primary-600 dark:text-primary-400">
            <CheckCircle2 size={20} />
          </div>
          <div>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest font-outfit">Total Payments</p>
            <h5 className="text-xl font-black text-gray-900 dark:text-white font-inter tracking-tight">
              {stats.paymentCount}
            </h5>
          </div>
        </div>

        {/* Partial Paid */}
        <div className="bg-white dark:bg-gray-800 p-4 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary-50 dark:bg-primary-900/20 flex items-center justify-center text-primary-600 dark:text-primary-400">
            <Clock size={20} />
          </div>
          <div>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest font-outfit">Partial Paid</p>
            <h5 className="text-xl font-black text-gray-900 dark:text-white font-inter tracking-tight">
              {stats.partialCount}
            </h5>
          </div>
        </div>

        {/* Refunds */}
        <div className="bg-white dark:bg-gray-800 p-4 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-red-50 dark:bg-red-900/20 flex items-center justify-center text-red-600 dark:text-red-400">
            <XCircle size={20} />
          </div>
          <div>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest font-outfit">Refunds</p>
            <h5 className="text-xl font-black text-gray-900 dark:text-white font-inter tracking-tight">
              {stats.refundCount}
            </h5>
          </div>
        </div>

        {/* Waivers */}
        <div className="bg-white dark:bg-gray-800 p-4 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-900/20 flex items-center justify-center text-amber-600 dark:text-amber-400">
            <FileText size={20} />
          </div>
          <div>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest font-outfit">Waivers</p>
            <h5 className="text-xl font-black text-gray-900 dark:text-white font-inter tracking-tight">
              {stats.waiverCount}
            </h5>
          </div>
        </div>

        {/* Total Value */}
        <div className="bg-gradient-to-r from-primary-600 to-primary-600 p-4 rounded-2xl shadow-xl shadow-primary-500/20 text-white flex items-center justify-between overflow-hidden relative">
          <div className="relative z-10">
            <p className="text-[10px] font-bold text-primary-100 uppercase tracking-widest font-outfit">Total Revenue</p>
            <h5 className="text-2xl font-black font-inter tracking-tighter tabular-nums">{formatCurrency(totalAmount)}</h5>
          </div>
          <FileText size={32} className="text-white/10 -mr-1" />
          <div className="absolute -left-6 -top-6 w-24 h-24 bg-white/10 rounded-full blur-2xl" />
        </div>
      </div>

      {/* Filters Bar */}
      <div className="bg-white dark:bg-gray-800 p-4 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          {/* Redundant Session Filter removed */}

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              placeholder="ID, Name, or Admission No..." // Updated placeholder
              className="w-full pl-10 pr-4 py-2.5 bg-gray-50 dark:bg-gray-900 border-none rounded-xl text-sm focus:ring-2 focus:ring-primary-500"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
          </div>

          {/* Date Range Start */}
          <div className="relative">
            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={17} />
            <input
              type="date"
              className="w-full pl-10 pr-4 py-2.5 bg-gray-50 dark:bg-gray-900 border-none rounded-xl text-sm focus:ring-2 focus:ring-primary-500"
              value={startDate}
              onChange={e => setStartDate(e.target.value)}
            />
          </div>

          {/* Date Range End */}
          <div className="relative">
            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={17} />
            <input
              type="date"
              className="w-full pl-10 pr-4 py-2.5 bg-gray-50 dark:bg-gray-900 border-none rounded-xl text-sm focus:ring-2 focus:ring-primary-500"
              value={endDate}
              onChange={e => setEndDate(e.target.value)}
            />
          </div>

          {/* Method Filter */}
          <div className="relative">
            <CreditCard className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={17} />
            <select
              className="w-full pl-10 pr-4 py-2.5 bg-gray-50 dark:bg-gray-900 border-none rounded-xl text-sm focus:ring-2 focus:ring-primary-500 appearance-none"
              value={method}
              onChange={e => setMethod(e.target.value)}
            >
              <option value="ONLINE">Online</option>
            </select>
          </div>

          {/* Type Filter */}
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={17} />
            <select
              className="w-full pl-10 pr-4 py-2.5 bg-gray-50 dark:bg-gray-900 border-none rounded-xl text-sm focus:ring-2 focus:ring-primary-500 appearance-none"
              value={type}
              onChange={e => setType(e.target.value)}
            >
              <option value="">All Types</option>
              <option value="FEE_PAYMENT">Payments</option>
              <option value="WAIVER">Waivers</option>
              <option value="REFUND">Refunds</option>
              <option value="CARRY_FORWARD">Balance Transfers</option>
            </select>
          </div>

        </div>
      </div>

      {/* Transactions Table */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm overflow-hidden">
        <div className="overflow-x-auto min-h-[400px]">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-gray-50/50 dark:bg-gray-900/50 border-b border-gray-100 dark:border-gray-700">
                <th className="px-3 py-3 text-[11px] font-bold text-gray-400 uppercase tracking-widest">Transaction Info</th>
                <th className="px-3 py-3 text-[11px] font-bold text-gray-400 uppercase tracking-widest">Student Details</th>
                <th className="px-3 py-3 text-[11px] font-bold text-gray-400 uppercase tracking-widest">Fee Breakdown</th>
                <th className="px-3 py-3 text-[11px] font-bold text-gray-400 uppercase tracking-widest text-center">Amount</th>
                <th className="px-3 py-3 text-[11px] font-bold text-gray-400 uppercase tracking-widest text-center">Status</th>
                <th className="px-3 py-3 text-[11px] font-bold text-gray-400 uppercase tracking-widest">Method & Ref</th>
                <th className="px-3 py-3 text-[11px] font-bold text-gray-400 uppercase tracking-widest text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 dark:divide-gray-700">
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td colSpan={7} className="px-6 py-8">
                      <div className="h-4 bg-gray-100 dark:bg-gray-700 rounded w-full"></div>
                    </td>
                  </tr>
                ))
              ) : transactions.map((tx) => (
                <tr key={tx.id} className="group hover:bg-gray-50/50 dark:hover:bg-gray-700/50 transition-all">
                  <td className="px-3 py-3 border-b border-gray-50 dark:border-gray-800">
                    <div className="flex flex-col min-w-[100px]">
                      <span className="text-sm font-bold text-gray-900 dark:text-white whitespace-nowrap">
                        {formatDateLocal(tx.createdAt)}
                      </span>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span className="text-[10px] text-gray-400">#{tx.id.split('-')[0].toUpperCase()}</span>
                      </div>
                      <span className="text-[10px] text-primary-600 dark:text-primary-400 font-black whitespace-nowrap tracking-tighter">
                        {formatTimeLocal(tx.createdAt)}
                      </span>
                    </div>
                  </td>
                  <td className="px-3 py-3 border-b border-gray-50 dark:border-gray-800">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-primary-50 dark:bg-primary-900/20 flex items-center justify-center text-primary-600 dark:text-primary-400 border border-primary-100 dark:border-primary-800 flex-shrink-0">
                        <User size={16} />
                      </div>
                      <div className="flex flex-col">
                        <span className="text-sm font-bold text-gray-900 dark:text-white group-hover:text-primary-600 transition-colors">
                          {tx.student ? `${tx.student.firstName} ${tx.student.lastName}` : 'Direct'}
                        </span>
                        <span className="text-[10px] text-gray-500 font-medium uppercase tracking-tighter">
                          {tx.student?.admissionNo || 'N/A'}
                        </span>
                      </div>
                    </div>
                  </td>
                  <td className="px-3 py-3 border-b border-gray-50 dark:border-gray-800">
                    <div className="flex flex-col gap-1">
                      {tx.meta?.allocations && tx.meta.allocations.length > 0 ? (
                        tx.meta.allocations.map((a: any, idx: number) => (
                          <div key={idx} className="flex items-center gap-1.5">
                            <div className="w-1 h-1 rounded-full bg-primary-500"></div>
                            <span className="text-[10px] font-bold text-gray-700 dark:text-gray-300 uppercase tracking-tight">{a.name}</span>
                          </div>
                        ))
                      ) : (
                        <span className="text-[10px] text-gray-400 italic">No allocation</span>
                      )}
                      {tx.meta?.note && (
                        <span className="text-[9px] text-gray-400 italic mt-0.5 truncate max-w-[150px]">
                          "{tx.meta.note}"
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-3 py-3 text-center border-b border-gray-50 dark:border-gray-800">
                    <div className={clsx(
                      "inline-flex items-center px-2.5 py-1 rounded-lg border",
                      tx.type === 'REFUND'
                        ? "bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 border-red-100 dark:border-red-800"
                        : "bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-400 border-primary-100 dark:border-primary-800"
                    )}>
                      <span className="text-sm font-black">{formatCurrency(tx.amount)}</span>
                    </div>
                  </td>
                  <td className="px-3 py-3 text-center border-b border-gray-50 dark:border-gray-800">
                    <div className={clsx(
                       "inline-flex items-center gap-1.5 px-2 py-1 rounded-lg border text-[9px] font-bold uppercase tracking-widest",
                      tx.type === 'REFUND'
                        ? "bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 border-red-100 dark:border-red-800"
                        : tx.type === 'WAIVER'
                          ? "bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800"
                          : tx.type === 'CARRY_FORWARD'
                            ? "bg-orange-50 dark:bg-orange-900/20 text-orange-700 dark:text-orange-400 border-orange-200 dark:border-orange-800"
                            : tx.meta?.allocations?.some((a: any) => a.status === 'PARTIAL')
                              ? "bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-400 border-primary-200 dark:border-primary-800"
                              : "bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 border-green-200 dark:border-green-800"
                    )}>
                      {tx.type === 'REFUND'
                        ? 'REFUNDED'
                        : tx.type === 'WAIVER'
                          ? 'WAIVED'
                          : tx.type === 'CARRY_FORWARD'
                            ? 'TRANSFERRED'
                            : tx.meta?.allocations?.some((a: any) => a.status === 'PARTIAL')
                              ? 'PARTIAL'
                              : 'PAID'}
                    </div>
                  </td>
                  <td className="px-3 py-3 border-b border-gray-50 dark:border-gray-800">
                    <div className="flex flex-col gap-0.5">
                      {tx.type !== 'WAIVER' ? (
                        <>
                          <div className="flex items-center gap-1.5">
                            {tx.paymentMethod === 'CASH' && <Banknote size={10} className="text-gray-400" />}
                            {tx.paymentMethod === 'BANK_TRANSFER' && <ArrowUpRight size={10} className="text-gray-400" />}
                            {tx.paymentMethod === 'POS' && <CreditCard size={10} className="text-gray-400" />}
                            <span className="text-[9px] font-bold text-gray-600 dark:text-gray-400 uppercase tracking-widest">{tx.paymentMethod?.replace('_', ' ') || '---'}</span>
                          </div>
                          <div className="flex flex-col pl-0.5">
                            <span className="text-[9px] font-medium text-gray-500 tracking-wider truncate max-w-[100px]">
                              {tx.reference || '---'}
                            </span>
                          </div>
                        </>
                      ) : (
                        <span className="text-[10px] text-amber-500 font-black uppercase tracking-tighter">Adjustment</span>
                      )}
                    </div>
                  </td>
                  <td className="px-3 py-3 text-right border-b border-gray-50 dark:border-gray-800">
                    <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => { setSelectedTx(tx); setShowReceipt(true); }}
                        className="p-1.5 hover:bg-primary-50 dark:hover:bg-primary-900/20 rounded text-gray-400 hover:text-primary-600 transition-colors"
                        title="View Receipt"
                      >
                        <Eye size={14} />
                      </button>
                      <button
                        onClick={() => handlePrintReceipt(tx)}
                        className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded text-gray-400 hover:text-gray-600 transition-colors"
                        title="Print Receipt"
                      >
                        <Printer size={14} />
                      </button>
                      {tx.type === 'FEE_PAYMENT' && !tx.meta?.isRefunded && (
                        <button
                          onClick={() => { setSelectedTx(tx); setShowRefund(true); }}
                          className="p-1.5 hover:bg-red-50 dark:hover:bg-red-900/20 rounded text-gray-400 hover:text-red-500 transition-colors"
                          title="Refund"
                        >
                          <RefreshCcw size={14} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}

              {!loading && transactions.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-3 py-16 text-center">
                    <div className="flex flex-col items-center justify-center text-gray-400">
                      <SearchX size={48} className="mb-4 text-gray-200" />
                      <h4 className="text-lg font-bold text-gray-500">No Transactions Found</h4>
                      <p className="text-xs">Try adjusting your filters or search query.</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="px-6 py-4 bg-gray-50/30 dark:bg-gray-900/30 border-t border-gray-100 dark:border-gray-700 flex items-center justify-between">
          <p className="text-xs text-gray-500 font-medium">
            Showing <span className="text-gray-900 dark:text-white font-bold">{transactions.length > 0 ? (page - 1) * limit + 1 : 0}</span> to{' '}
            <span className="text-gray-900 dark:text-white font-bold">{Math.min(page * limit, total)}</span> of{' '}
            <span className="text-gray-900 dark:text-white font-bold">{total}</span> records
          </p>
          <div className="flex items-center gap-2">
            <button
              disabled={page === 1}
              onClick={() => setPage(prev => prev - 1)}
              className="p-2 rounded-xl border border-gray-200 dark:border-gray-700 text-gray-500 hover:bg-white dark:hover:bg-gray-700 disabled:opacity-50 transition-all sm:flex items-center gap-1.5"
            >
              <ChevronLeft size={16} />
              <span className="hidden sm:inline text-xs font-bold uppercase tracking-wider">Prev</span>
            </button>
            <div className="flex items-center gap-1">
              {Array.from({ length: Math.ceil(total / limit) }, (_, i) => i + 1).map((p) => (
                <button
                  key={p}
                  onClick={() => setPage(p)}
                  className={clsx(
                    "w-8 h-8 rounded-lg text-xs font-bold transition-all",
                    page === p
                      ? "bg-primary-600 text-white shadow-lg shadow-primary-500/20"
                      : "text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700"
                  )}
                >
                  {p}
                </button>
              ))}
            </div>
            <button
              disabled={page >= Math.ceil(total / limit)}
              onClick={() => setPage(prev => prev + 1)}
              className="p-2 rounded-xl border border-gray-200 dark:border-gray-700 text-gray-500 hover:bg-white dark:hover:bg-gray-700 disabled:opacity-50 transition-all sm:flex items-center gap-1.5"
            >
              <span className="hidden sm:inline text-xs font-bold uppercase tracking-wider">Next</span>
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* Refund Modal */}
      {showRefund && selectedTx && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                  <RefreshCcw className="text-red-500" size={20} />
                  Refund Transaction
                </h3>
                <button onClick={() => setShowRefund(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                  <XCircle size={24} />
                </button>
              </div>

              <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-xl border border-red-100 dark:border-red-800 mb-6">
                <p className="text-sm text-red-700 dark:text-red-300 font-medium">
                  You are about to refund <span className="font-bold">{formatCurrency(selectedTx.amount)}</span> from {selectedTx.student?.firstName}'s account.
                </p>
                <p className="text-xs text-red-500 dark:text-red-400 mt-1">
                  This action creates a negative transaction record and updates the student's balance. It cannot be undone.
                </p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">Reason for Refund</label>
                  <textarea
                    className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-900 border-none rounded-xl text-sm focus:ring-2 focus:ring-red-500 h-24"
                    placeholder="E.g., Duplicate payment, Wrong amount entered..."
                    value={refundReason}
                    onChange={e => setRefundReason(e.target.value)}
                  />
                </div>
              </div>

              <div className="flex items-center gap-3 mt-8">
                <button
                  onClick={() => setShowRefund(false)}
                  className="flex-1 px-4 py-2.5 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-xl text-sm font-bold hover:bg-gray-200 dark:hover:bg-gray-600 transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={handleRefundSubmit}
                  disabled={!refundReason || processingRefund}
                  className="flex-1 px-4 py-2.5 bg-red-600 text-white rounded-xl text-sm font-bold hover:bg-red-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-red-500/20 flex items-center justify-center gap-2"
                >
                  {processingRefund ? (
                    <RefreshCcw className="animate-spin" size={18} />
                  ) : (
                    'Confirm Refund'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Receipt Modal (View only) */}
      {showReceipt && selectedTx && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 right-0 p-4 flex justify-end bg-white border-b border-gray-100 z-10">
              <button
                onClick={() => handlePrintReceipt(selectedTx)}
                className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg text-sm font-bold mr-2 hover:bg-primary-700"
              >
                <Printer size={16} /> Print
              </button>
              <button onClick={() => setShowReceipt(false)} className="text-gray-400 hover:text-gray-600">
                <X size={24} />
              </button>
            </div>
            <ReceiptTemplate
              transaction={selectedTx}
              schoolInfo={getSchoolInfo()}
            />
          </div>
        </div>
      )}


    </div>
  );
}
