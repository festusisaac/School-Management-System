import React, { useState, useEffect, useCallback } from 'react';
import {
  CreditCard,
  DollarSign,
  Printer,
  Calendar,
  Clock,
  CheckCircle2,
  FileText,
  AlertCircle
} from 'lucide-react';
import api from '../../services/api';
import { useToast } from '../../context/ToastContext';
import { formatCurrency } from '../../utils/currency';
import { PaymentModal } from '../students/components/PaymentModal';
import { useAuthStore } from '../../stores/authStore';
import { ReceiptTemplate } from './components/ReceiptTemplate';
import ReactDOM from 'react-dom/client';
import { useSystem } from '../../context/SystemContext';

export default function StudentFinancePage() {
  const { user } = useAuthStore();
  const { showError, showSuccess } = useToast();
  const { getSchoolInfo } = useSystem();
  
  const [statement, setStatement] = useState<any>(null);
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedFeeHead, setSelectedFeeHead] = useState<any>(null);

  const studentId = user?.id;

  const fetchData = useCallback(async () => {
    if (!studentId) return;
    setLoading(true);
    try {
      const [stmtRes, histRes] = await Promise.all([
        api.getStudentStatement(studentId),
        api.getFinancePayments({ studentId, limit: 100 }) // get recent history
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

  const handlePrintReceipt = (tx: any) => {
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

  if (loading) {
      return (
          <div className="flex flex-col items-center justify-center min-h-[400px] gap-3">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
              <p className="text-gray-500 font-medium animate-pulse">Loading financial data...</p>
          </div>
      );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-10">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Financial Center</h1>
        <p className="text-gray-500 dark:text-gray-400 text-sm">Manage your payments, view outstanding fees, and download receipts.</p>
      </div>

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
              {statement?.assignedHeads?.length > 0 ? (
                  statement.assignedHeads.map((head: any) => {
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
                                  
                                  {/* Progress Bar */}
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
                  })
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
          <div className="px-6 py-5 border-b border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/80 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gray-100 dark:bg-gray-700 rounded-xl">
                <Clock className="w-5 h-5 text-gray-600 dark:text-gray-300" />
              </div>
              <h2 className="text-lg font-bold text-gray-900 dark:text-white tracking-tight">Recent Transactions</h2>
            </div>
          </div>
          <div className="overflow-x-auto">
              <table className="w-full text-left min-w-[600px] sm:min-w-0">
                  <thead className="bg-gray-50/50 dark:bg-gray-900/30">
                      <tr>
                          <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Date & Time</th>
                          <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Reference ID</th>
                          <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Method</th>
                          <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">Amount</th>
                          <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">Receipt</th>
                      </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50 dark:divide-gray-800/50">
                      {history.length > 0 ? (
                          history.map((tx: any) => (
                              <tr key={tx.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-900/30 transition-colors group">
                                  <td className="px-6 py-4">
                                      <p className="text-sm font-bold text-gray-900 dark:text-white">
                                          {new Date(tx.createdAt).toLocaleDateString(undefined, { dateStyle: 'medium' })}
                                      </p>
                                      <p className="text-xs font-semibold text-gray-500">
                                          {new Date(tx.createdAt).toLocaleTimeString(undefined, { timeStyle: 'short' })}
                                      </p>
                                  </td>
                                  <td className="px-6 py-4">
                                      <p className="text-sm font-semibold text-gray-600 dark:text-gray-300 font-mono bg-gray-50 dark:bg-gray-800 px-2 py-1 rounded inline-block">{tx.reference || 'N/A'}</p>
                                  </td>
                                  <td className="px-6 py-4">
                                      <span className="text-xs font-bold px-2.5 py-1 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 rounded-lg">
                                        {tx.paymentMethod}
                                      </span>
                                  </td>
                                  <td className="px-6 py-4 text-right">
                                      <p className="text-base font-black text-emerald-600 tabular-nums">{formatCurrency(parseFloat(tx.amount))}</p>
                                  </td>
                                  <td className="px-6 py-4 text-right">
                                      <button 
                                          onClick={() => handlePrintReceipt(tx)}
                                          className="p-2.5 text-gray-400 hover:text-white hover:bg-primary-600 rounded-xl transition-all shadow-sm hover:shadow-md inline-flex items-center justify-center outline-none"
                                          title="Print Receipt"
                                      >
                                          <Printer size={16} />
                                      </button>
                                  </td>
                              </tr>
                          ))
                      ) : (
                          <tr><td colSpan={5} className="p-16 text-center text-gray-400 italic font-medium">No transactions found.</td></tr>
                      )}
                  </tbody>
              </table>
          </div>
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
