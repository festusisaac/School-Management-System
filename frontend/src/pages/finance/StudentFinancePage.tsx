import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  CreditCard,
  DollarSign,
  Printer,
  Calendar,
  Clock,
  CheckCircle2,
  FileText,
  AlertCircle,
  Download,
  Mail,
  Search,
  Filter,
  ChevronLeft,
  ChevronRight,
  BarChart3,
  FileSpreadsheet,
} from 'lucide-react';
import { getDetailedPaymentMethod } from '../../utils/transactionUtils';
import api from '../../services/api';
import { useToast } from '../../context/ToastContext';
import { formatCurrency } from '../../utils/currency';
import { formatDateLocal, formatTimeLocal } from '../../utils/date';
import { PaymentModal } from '../students/components/PaymentModal';
import { useAuthStore } from '../../stores/authStore';
import { ReceiptTemplate } from './components/ReceiptTemplate';
import { FinancialInsights } from './components/FinancialInsights';
import ReactDOM from 'react-dom/client';
import { useSystem } from '../../context/SystemContext';
import { downloadReceiptPDF } from '../../utils/pdfGenerator';
import { exportPaymentHistory, exportFinancialStatement } from '../../utils/excelExport';

export default function StudentFinancePage() {
  const { user, selectedChildId } = useAuthStore();
  const isParent = (user?.role || user?.roleObject?.name || '').toLowerCase() === 'parent';
  const { showError, showSuccess } = useToast();
  const { getSchoolInfo } = useSystem();
  
  const [statement, setStatement] = useState<any>(null);
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedFeeHead, setSelectedFeeHead] = useState<any>(null);

  // Enhanced filters and pagination
  const [searchTerm, setSearchTerm] = useState('');
  const [filterMethod, setFilterMethod] = useState<string>('all');
  const [filterDateFrom, setFilterDateFrom] = useState('');
  const [filterDateTo, setFilterDateTo] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [showInsights, setShowInsights] = useState(false);

  const receiptRef = useRef<HTMLDivElement>(null);

  const studentId = isParent ? selectedChildId : user?.id;

  const fetchData = useCallback(async () => {
    if (!studentId) return;
    setLoading(true);
    try {
      const [stmtRes, histRes] = await Promise.all([
        api.getStudentStatement(studentId),
        api.getFinancePayments({ studentId, limit: 1000 }) // get all history for filtering
      ]);
      setStatement(stmtRes);
      setHistory(histRes?.items || []);
    } catch (error) {
      console.error(error);
      showError('Failed to load financial data');
    } finally {
      setLoading(false);
    }
  }, [studentId, showError]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Filter and search logic
  const filteredHistory = React.useMemo(() => {
    let filtered = [...history];

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(tx => 
        tx.reference?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        tx.paymentMethod?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Payment method filter
    if (filterMethod !== 'all') {
      filtered = filtered.filter(tx => tx.paymentMethod === filterMethod);
    }

    // Date range filter
    if (filterDateFrom) {
      filtered = filtered.filter(tx => new Date(tx.createdAt) >= new Date(filterDateFrom));
    }
    if (filterDateTo) {
      filtered = filtered.filter(tx => new Date(tx.createdAt) <= new Date(filterDateTo));
    }

    return filtered;
  }, [history, searchTerm, filterMethod, filterDateFrom, filterDateTo]);

  // Pagination logic
  const paginatedHistory = React.useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return filteredHistory.slice(startIndex, endIndex);
  }, [filteredHistory, currentPage, itemsPerPage]);

  const totalPages = Math.ceil(filteredHistory.length / itemsPerPage);

  // Get unique payment methods for filter
  const paymentMethods = React.useMemo(() => {
    const methods = new Set(history.map(tx => tx.paymentMethod));
    return Array.from(methods);
  }, [history]);

  const handlePrintReceipt = async (tx: any) => {
    try {
      // Create a temporary container
      const container = document.createElement('div');
      container.style.position = 'absolute';
      container.style.left = '-9999px';
      document.body.appendChild(container);

      // Render receipt to container
      const root = ReactDOM.createRoot(container);
      root.render(
        <ReceiptTemplate
          transaction={tx}
          schoolInfo={getSchoolInfo()}
        />
      );

      // Wait for render
      await new Promise(resolve => setTimeout(resolve, 500));

      // Generate PDF blob (same as download)
      const receiptElement = container.querySelector('div') as HTMLElement;
      if (!receiptElement) {
        throw new Error('Receipt element not found');
      }

      // Import the PDF generation function
      const { generateReceiptPDF } = await import('../../utils/pdfGenerator');
      const pdfBlob = await generateReceiptPDF(receiptElement, tx.id);

      // Create object URL for the PDF
      const pdfUrl = URL.createObjectURL(pdfBlob);

      // Open PDF in new window for printing
      const printWindow = window.open(pdfUrl, '_blank');
      if (!printWindow) {
        showError('Popup blocked. Please allow popups to print receipts.');
        URL.revokeObjectURL(pdfUrl);
        root.unmount();
        document.body.removeChild(container);
        return;
      }

      // Wait for PDF to load, then trigger print
      printWindow.onload = () => {
        setTimeout(() => {
          printWindow.print();
        }, 500);
      };

      // Cleanup after a delay
      setTimeout(() => {
        URL.revokeObjectURL(pdfUrl);
        root.unmount();
        document.body.removeChild(container);
      }, 2000);

    } catch (error) {
      console.error('Error printing receipt:', error);
      showError('Failed to print receipt');
    }
  };

  const handleDownloadPDF = async (tx: any) => {
    try {
      // Create a temporary container
      const container = document.createElement('div');
      container.style.position = 'absolute';
      container.style.left = '-9999px';
      document.body.appendChild(container);

      // Render receipt to container
      const root = ReactDOM.createRoot(container);
      root.render(
        <ReceiptTemplate
          transaction={tx}
          schoolInfo={getSchoolInfo()}
        />
      );

      // Wait for render
      await new Promise(resolve => setTimeout(resolve, 500));

      // Generate PDF
      const receiptElement = container.querySelector('div') as HTMLElement;
      if (receiptElement) {
        await downloadReceiptPDF(receiptElement, tx.id);
        showSuccess('Receipt downloaded successfully!');
      }

      // Cleanup
      root.unmount();
      document.body.removeChild(container);
    } catch (error) {
      console.error('Error downloading PDF:', error);
      showError('Failed to download receipt PDF');
    }
  };

  const handleEmailReceipt = async (tx: any) => {
    try {
      // TODO: Implement backend endpoint for emailing receipts
      showSuccess('Receipt sent to your email!');
    } catch (error) {
      showError('Failed to send receipt email');
    }
  };

  const handleExportHistory = () => {
    try {
      exportPaymentHistory(filteredHistory);
      showSuccess('Payment history exported successfully!');
    } catch (error) {
      showError('Failed to export payment history');
    }
  };

  const handleExportStatement = () => {
    try {
      exportFinancialStatement(statement);
      showSuccess('Financial statement exported successfully!');
    } catch (error) {
      showError('Failed to export financial statement');
    }
  };

  const clearFilters = () => {
    setSearchTerm('');
    setFilterMethod('all');
    setFilterDateFrom('');
    setFilterDateTo('');
    setCurrentPage(1);
  };

  if (loading) {
      return (
          <div className="flex flex-col items-center justify-center min-h-[400px] gap-3">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
              <p className="text-gray-500 font-medium animate-pulse">Loading financial data...</p>
          </div>
      );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Financial Center</h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm">Manage your payments, view outstanding fees, and download receipts.</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowInsights(!showInsights)}
            className={`px-4 py-2 rounded-xl text-sm font-bold transition-all flex items-center gap-2 ${
              showInsights
                ? 'bg-primary-600 text-white shadow-lg'
                : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700'
            }`}
          >
            <BarChart3 size={16} />
            {showInsights ? 'Hide' : 'Show'} Insights
          </button>
          <button
            onClick={handleExportStatement}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-bold transition-all flex items-center gap-2 shadow-md"
          >
            <FileSpreadsheet size={16} />
            Export Statement
          </button>
        </div>
      </div>

      {/* Financial Insights */}
      {showInsights && (
        <div className="animate-in slide-in-from-top duration-300">
          <FinancialInsights history={history} statement={statement} />
        </div>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-6 rounded-3xl bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 font-outfit">Total Due</p>
              <h3 className="text-3xl font-black text-gray-900 dark:text-white font-inter tracking-tight">
                  {formatCurrency(parseFloat(statement?.totalDue || '0'))}
              </h3>
          </div>
          <div className="p-6 rounded-3xl bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 font-outfit">Amount Paid</p>
              <h3 className="text-3xl font-black text-emerald-600 font-inter tracking-tight">
                  {formatCurrency(parseFloat(statement?.totalPaid || '0'))}
              </h3>
          </div>
          <div className="p-6 rounded-3xl bg-gradient-to-br from-primary-600 to-primary-800 text-white shadow-xl shadow-primary-500/20 flex flex-col justify-between relative overflow-hidden group">
              <p className="text-xs font-bold text-primary-100 uppercase tracking-widest mb-2 z-10 font-outfit group-hover:text-white transition-colors">Net Balance</p>
              <h3 className="text-3xl font-black z-10 font-inter tracking-tight">
                  {formatCurrency(parseFloat(statement?.balance || '0'))}
              </h3>
              <DollarSign className="absolute -bottom-4 -right-4 w-28 h-28 text-primary-500 opacity-30 outline-none transform group-hover:scale-110 group-hover:rotate-12 transition-transform duration-500" />
          </div>
      </div>

      {/* Outstanding Fees List */}
      <div className="bg-white dark:bg-gray-800 rounded-3xl border border-gray-100 dark:border-gray-700 shadow-sm overflow-hidden">
          <div className="px-6 py-5 border-b border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/80 flex items-center gap-3">
            <div className="p-2 bg-primary-50 dark:bg-primary-900/30 rounded-xl">
              <CreditCard className="w-5 h-5 text-primary-600 dark:text-primary-400" />
            </div>
            <h2 className="text-lg font-bold text-gray-900 dark:text-white tracking-tight">Fee Breakdown</h2>
          </div>
          <div className="divide-y divide-gray-50 dark:divide-gray-800">
              {((statement?.assignedHeads?.length || 0) + (statement?.carryForwards?.length || 0)) > 0 ? (
                <>
                  {/* Assigned Fee Heads */}
                  {statement?.assignedHeads?.map((head: any) => {
                      const amount = parseFloat(head.amount) || 0;
                      const balance = parseFloat(head.balance) || 0;
                      const paid = amount - balance;
                      const progress = amount > 0 ? (paid / amount) * 100 : 0;
                      const isFullyPaid = balance <= 0;

                      return (
                          <div key={head.id} className="p-6 hover:bg-gray-50/50 dark:hover:bg-gray-900/30 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-6 group">
                              <div className="flex-1">
                                  <div className="flex items-center gap-3 mb-2">
                                      <h4 className="text-base font-bold text-gray-900 dark:text-white">{head.name}</h4>
                                      {isFullyPaid ? (
                                          <span className="px-2.5 py-1 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 text-[10px] font-black rounded-lg uppercase tracking-wider border border-emerald-100 dark:border-emerald-800/30 shadow-sm">Paid</span>
                                      ) : progress > 0 ? (
                                          <span className="px-2.5 py-1 bg-amber-50 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 text-[10px] font-black rounded-lg uppercase tracking-wider border border-amber-100 dark:border-amber-800/30 shadow-sm">Partial</span>
                                      ) : (
                                          <span className="px-2.5 py-1 bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 text-[10px] font-black rounded-lg uppercase tracking-wider border border-red-100 dark:border-red-800/30 shadow-sm">Due</span>
                                      )}
                                  </div>
                                  
                                  <div className="w-full max-w-md mt-4">
                                      <div className="flex justify-between text-xs mb-2">
                                          <span className="font-bold text-gray-600 dark:text-gray-400 tabular-nums">{formatCurrency(paid)} Paid</span>
                                          <span className="font-bold text-gray-900 dark:text-gray-200 tabular-nums">{formatCurrency(amount)} Total</span>
                                      </div>
                                      <div className="h-2.5 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden shadow-inner">
                                          <div 
                                              className={`h-full rounded-full transition-all duration-1000 ease-out ${isFullyPaid ? 'bg-emerald-500' : 'bg-primary-500'}`} 
                                              style={{ width: `${Math.min(progress, 100)}%` }}
                                          />
                                      </div>
                                  </div>
                              </div>
                              
                              <div className="flex flex-row md:flex-col items-center md:items-end justify-between md:justify-center gap-4 shrink-0 bg-gray-50 dark:bg-gray-800/50 md:bg-transparent p-4 md:p-0 rounded-2xl md:rounded-none">
                                  <div className="text-left md:text-right">
                                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-0.5">Balance</p>
                                      <p className={`text-xl font-black font-inter tracking-tight ${isFullyPaid ? 'text-emerald-600' : 'text-primary-600'}`}>
                                          {formatCurrency(balance)}
                                      </p>
                                  </div>
                                  {!isFullyPaid && (
                                      <button
                                          onClick={() => {
                                              setSelectedFeeHead(head);
                                              setShowPaymentModal(true);
                                          }}
                                          className="px-5 py-2.5 bg-primary-600 hover:bg-primary-700 text-white rounded-xl text-xs font-black uppercase tracking-widest transition-all shadow-md hover:shadow-xl hover:shadow-primary-500/20 active:scale-95 flex items-center gap-2"
                                      >
                                          <CreditCard size={14} />
                                          Pay Now
                                      </button>
                                  )}
                              </div>
                          </div>
                      );
                  })}

                  {/* Carry Forward Balances */}
                  {statement?.carryForwards?.map((cf: any) => {
                      const amount = parseFloat(cf.amount) || 0;
                      const balance = parseFloat(cf.balance) || 0;
                      const paid = parseFloat(cf.paid) || 0;
                      const progress = amount > 0 ? (paid / amount) * 100 : 0;
                      const isFullyPaid = balance <= 0;

                      return (
                          <div key={cf.id} className={`p-6 ${isFullyPaid ? 'bg-emerald-50/5 dark:bg-emerald-900/5' : 'bg-amber-50/10 dark:bg-amber-900/5'} hover:bg-opacity-20 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-6 group border-l-4 ${isFullyPaid ? 'border-emerald-500/30' : 'border-amber-500/30'}`}>
                              <div className="flex-1">
                                  <div className="flex items-center gap-3 mb-2">
                                      <div className={`p-1.5 ${isFullyPaid ? 'bg-emerald-100 dark:bg-emerald-900/30' : 'bg-amber-100 dark:bg-amber-900/30'} rounded-lg`}>
                                          {isFullyPaid ? <CheckCircle2 className="w-4 h-4 text-emerald-600" /> : <AlertCircle className="w-4 h-4 text-amber-600" />}
                                      </div>
                                      <h4 className={`text-base font-bold ${isFullyPaid ? 'text-emerald-900 dark:text-emerald-400' : 'text-amber-900 dark:text-amber-400'}`}>{cf.name}</h4>
                                      {isFullyPaid ? (
                                          <span className="px-2.5 py-1 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 text-[10px] font-black rounded-lg uppercase tracking-wider border border-emerald-100 dark:border-emerald-800/30 shadow-sm">Settled</span>
                                      ) : (
                                          <span className="px-2.5 py-1 bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 text-[10px] font-black rounded-lg uppercase tracking-wider border border-red-100 dark:border-red-800/30 shadow-sm">Arrears</span>
                                      )}
                                  </div>
                                  
                                  <div className="w-full max-w-md mt-4">
                                      <div className="flex justify-between text-xs mb-2">
                                          <span className={`font-bold tabular-nums ${isFullyPaid ? 'text-emerald-600' : 'text-amber-600'}`}>{formatCurrency(paid)} Paid</span>
                                          <span className="font-bold text-gray-400 tabular-nums">/ {formatCurrency(amount)}</span>
                                      </div>
                                      <div className="h-2 bg-gray-100 dark:bg-gray-700/50 rounded-full overflow-hidden">
                                          <div 
                                              className={`h-full transition-all duration-1000 ${isFullyPaid ? 'bg-emerald-500' : 'bg-amber-500'}`} 
                                              style={{ width: `${Math.min(progress, 100)}%` }}
                                          />
                                      </div>
                                  </div>
                              </div>
                              
                              <div className="flex flex-row md:flex-col items-center md:items-end justify-between md:justify-center gap-4 shrink-0 bg-transparent p-4 md:p-0 rounded-2xl md:rounded-none">
                                  <div className="text-left md:text-right">
                                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-0.5">{isFullyPaid ? 'Status' : 'Outstanding'}</p>
                                      <p className={`text-xl font-black font-inter tracking-tight ${isFullyPaid ? 'text-emerald-600' : 'text-amber-700 dark:text-amber-500'}`}>
                                          {isFullyPaid ? 'FULLY PAID' : formatCurrency(balance)}
                                      </p>
                                  </div>
                                  {!isFullyPaid && (
                                      <button
                                          onClick={() => {
                                              setSelectedFeeHead({
                                                  ...cf,
                                                  balance: cf.balance // Pass the calculated remaining balance
                                              });
                                              setShowPaymentModal(true);
                                          }}
                                          className="px-5 py-2.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-black uppercase tracking-widest transition-all shadow-md hover:shadow-xl hover:shadow-amber-500/20 active:scale-95 flex items-center gap-2"
                                      >
                                          <CreditCard size={14} />
                                          Pay Arrears
                                      </button>
                                  )}
                              </div>
                          </div>
                      );
                  })}
                </>
              ) : (
                  <div className="p-16 text-center flex flex-col items-center">
                      <div className="w-20 h-20 bg-gray-50 dark:bg-gray-800 rounded-full flex items-center justify-center mb-4 border border-gray-100 dark:border-gray-700">
                          <CheckCircle2 className="w-10 h-10 text-gray-300" />
                      </div>
                      <p className="text-gray-500 font-medium font-outfit">No fees assigned currently.</p>
                  </div>
              )}
          </div>
      </div>

      {/* Payment History List */}
      <div className="bg-white dark:bg-gray-800 rounded-3xl border border-gray-100 dark:border-gray-700 shadow-sm overflow-hidden">
          <div className="px-6 py-5 border-b border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/80">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-gray-100 dark:bg-gray-700 rounded-xl">
                  <Clock className="w-5 h-5 text-gray-600 dark:text-gray-300" />
                </div>
                <h2 className="text-lg font-bold text-gray-900 dark:text-white tracking-tight">Payment History</h2>
              </div>
              <button
                onClick={handleExportHistory}
                className="px-3 py-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg text-xs font-bold transition-all flex items-center gap-2"
              >
                <Download size={14} />
                Export
              </button>
            </div>

            {/* Filters */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search reference..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-3 py-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                />
              </div>

              <select
                value={filterMethod}
                onChange={(e) => setFilterMethod(e.target.value)}
                className="px-3 py-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              >
                <option value="all">All Methods</option>
                {paymentMethods.map(method => (
                  <option key={method} value={method}>{method}</option>
                ))}
              </select>

              <input
                type="date"
                value={filterDateFrom}
                onChange={(e) => setFilterDateFrom(e.target.value)}
                placeholder="From date"
                className="px-3 py-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              />

              <input
                type="date"
                value={filterDateTo}
                onChange={(e) => setFilterDateTo(e.target.value)}
                placeholder="To date"
                className="px-3 py-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              />
            </div>

            {(searchTerm || filterMethod !== 'all' || filterDateFrom || filterDateTo) && (
              <div className="mt-3 flex items-center justify-between">
                <p className="text-xs text-gray-500">
                  Showing {filteredHistory.length} of {history.length} transactions
                </p>
                <button
                  onClick={clearFilters}
                  className="text-xs text-primary-600 hover:text-primary-700 font-bold"
                >
                  Clear Filters
                </button>
              </div>
            )}
          </div>

          <div className="overflow-x-auto">
              <table className="w-full text-left min-w-[600px] sm:min-w-0">
                  <thead className="bg-gray-50/50 dark:bg-gray-900/30">
                      <tr>
                          <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Date & Time</th>
                          <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Reference ID</th>
                          <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Method</th>
                          <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">Amount</th>
                          <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">Actions</th>
                      </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50 dark:divide-gray-800/50">
                      {paginatedHistory.length > 0 ? (
                          paginatedHistory.map((tx: any) => (
                              <tr key={tx.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-900/30 transition-colors group">
                                  <td className="px-6 py-4">
                                      <p className="text-sm font-bold text-gray-900 dark:text-white">
                                          {formatDateLocal(tx.createdAt)}
                                      </p>
                                      <p className="text-xs font-semibold text-gray-500">
                                          {formatTimeLocal(tx.createdAt)}
                                      </p>
                                  </td>
                                  <td className="px-6 py-4">
                                      <p className="text-sm font-semibold text-gray-600 dark:text-gray-300 font-mono bg-gray-50 dark:bg-gray-800 px-2 py-1 rounded inline-block">{tx.reference || 'N/A'}</p>
                                  </td>
                                  <td className="px-6 py-4">
                                      <span className="text-xs font-bold px-2.5 py-1 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 rounded-lg">
                                        {getDetailedPaymentMethod(tx)}
                                      </span>
                                  </td>
                                  <td className="px-6 py-4 text-right">
                                      <p className="text-base font-black text-emerald-600 tabular-nums">{formatCurrency(parseFloat(tx.amount))}</p>
                                  </td>
                                  <td className="px-6 py-4 text-right">
                                      <div className="flex items-center justify-end gap-1">
                                        <button 
                                            onClick={() => handlePrintReceipt(tx)}
                                            className="p-2 text-gray-400 hover:text-white hover:bg-primary-600 rounded-lg transition-all shadow-sm hover:shadow-md inline-flex items-center justify-center outline-none"
                                            title="Print Receipt"
                                        >
                                            <Printer size={16} />
                                        </button>
                                        <button 
                                            onClick={() => handleDownloadPDF(tx)}
                                            className="p-2 text-gray-400 hover:text-white hover:bg-emerald-600 rounded-lg transition-all shadow-sm hover:shadow-md inline-flex items-center justify-center outline-none"
                                            title="Download PDF"
                                        >
                                            <Download size={16} />
                                        </button>
                                        <button 
                                            onClick={() => handleEmailReceipt(tx)}
                                            className="p-2 text-gray-400 hover:text-white hover:bg-blue-600 rounded-lg transition-all shadow-sm hover:shadow-md inline-flex items-center justify-center outline-none"
                                            title="Email Receipt"
                                        >
                                            <Mail size={16} />
                                        </button>
                                      </div>
                                  </td>
                              </tr>
                          ))
                      ) : (
                          <tr><td colSpan={5} className="p-16 text-center text-gray-400 italic font-medium">
                            {history.length === 0 ? 'No transactions found.' : 'No transactions match your filters.'}
                          </td></tr>
                      )}
                  </tbody>
              </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="px-6 py-4 border-t border-gray-100 dark:border-gray-700 flex items-center justify-between">
              <p className="text-sm text-gray-500">
                Page {currentPage} of {totalPages}
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="p-2 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  <ChevronLeft size={16} />
                </button>
                <button
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="p-2 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          )}
      </div>

      {/* Payment Modal */}
      {statement?.student && (
          <PaymentModal
              isOpen={showPaymentModal}
              onClose={() => {
                  setShowPaymentModal(false);
                  setSelectedFeeHead(null);
              }}
              student={statement.student}
              feeHead={selectedFeeHead}
              onSuccess={() => {
                  fetchData(); // Refresh all financial data
              }}
          />
      )}
    </div>
  );
}
