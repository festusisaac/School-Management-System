import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import {
  Search,
  User,
  CreditCard,
  AlertCircle,
  CheckCircle2,
  Banknote,
  Receipt,
  ArrowUpRight,
  ChevronRight,
  ArrowLeft,
  X,
  FileText,
  DollarSign,
  ShieldCheck,
  Check,
  RefreshCcw,
  Clock,
  Wallet,
  TrendingUp,
  SearchX
} from 'lucide-react';
import api from '../../services/api';
import { useToast } from '../../context/ToastContext';
import { clsx } from 'clsx';
import { formatCurrency, currencyToWords } from '../../utils/currency';

interface Transaction {
  id: string;
  amount: string;
  type: string;
  paymentMethod: string;
  reference: string;
  createdAt: string;
  student?: any;
}

interface StudentStatement {
  totalDue: number;
  totalPaid: number;
  balance: number;
  transactions: Transaction[];
  assignedHeads: any[];
}

export default function RecordPaymentPage() {
  const { showSuccess, showError, showWarning } = useToast();
  const location = useLocation();

  // App State
  const [searchQuery, setSearchQuery] = useState('');
  const [searching, setSearching] = useState(false);
  const [students, setStudents] = useState<any[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<any | null>(null);
  const [statement, setStatement] = useState<StudentStatement | null>(null);
  const [loadingStatement, setLoadingStatement] = useState(false);

  // Billing State
  const [amount, setAmount] = useState('0');
  const [selectedFeesMap, setSelectedFeesMap] = useState<Record<string, number>>({});
  const [paymentMethod, setPaymentMethod] = useState('CASH');
  const [reference, setReference] = useState('');
  const [note, setNote] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [todayTotal, setTodayTotal] = useState(0);

  useEffect(() => {
    fetchTodayTotal();
  }, []);

  useEffect(() => {
    const state = location.state as any;
    if (state?.studentId) loadPreSelected(state.studentId);
  }, [location.state]);

  const loadPreSelected = async (id: string) => {
    try {
      const student = await api.getStudentById(id);
      setSelectedStudent(student);
    } catch (e) {
      showError('System error loading student identity');
    }
  };

  const fetchTodayTotal = async () => {
    try {
      const today = new Date().toISOString().split('T')[0];
      const res = await api.getFinancePayments({ startDate: today, limit: 1 });
      setTodayTotal((res as any).totalAmount || 0);
    } catch (e) {
      console.error('Revenue sync failed');
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    setSearching(true);
    try {
      const results = await api.getStudents({ keyword: searchQuery });
      setStudents(results);
      if (results.length === 0) showWarning('No matching records found');
    } catch (e) {
      showError('Network latency during lookup');
    } finally {
      setSearching(false);
    }
  };

  const fetchStatement = async (id: string) => {
    setLoadingStatement(true);
    try {
      const data = await api.getStudentStatement(id);
      setStatement(data);
    } catch (e) {
      showError('Failed to fetch financial ledger');
    } finally {
      setLoadingStatement(false);
    }
  };

  useEffect(() => {
    if (selectedStudent) {
      fetchStatement(selectedStudent.id);
      resetBilling();
    }
  }, [selectedStudent]);

  const resetBilling = () => {
    setSelectedFeesMap({});
    setAmount('0');
    setReference('');
    setNote('');
  };

  const toggleFee = (h: any) => {
    setSelectedFeesMap(prev => {
      const next = { ...prev };
      if (next[h.id]) {
        delete next[h.id];
      } else {
        next[h.id] = parseFloat(h.amount);
      }
      setAmount(Object.values(next).reduce((a, b) => a + b, 0).toFixed(2));
      return next;
    });
  };

  const handlePartialChange = (id: string, val: string) => {
    const num = parseFloat(val) || 0;
    setSelectedFeesMap(prev => {
      const next = { ...prev, [id]: num };
      setAmount(Object.values(next).reduce((a, b) => a + b, 0).toFixed(2));
      return next;
    });
  };

  const selectAll = () => {
    if (!statement) return;
    const isAll = Object.keys(selectedFeesMap).length === statement.assignedHeads.length;
    if (isAll) {
      setSelectedFeesMap({});
      setAmount('0');
    } else {
      const next: Record<string, number> = {};
      statement.assignedHeads.forEach(h => next[h.id] = parseFloat(h.amount));
      setSelectedFeesMap(next);
      setAmount(Object.values(next).reduce((a, b) => a + b, 0).toFixed(2));
    }
  };

  const handleFinalize = async () => {
    setSubmitting(true);
    try {
      const allocatedFees = statement?.assignedHeads
        .filter(h => !!selectedFeesMap[h.id])
        .map(h => ({ headId: h.id, name: h.name, amountPaid: selectedFeesMap[h.id] }));

      await api.recordPayment({
        studentId: selectedStudent.id,
        amount,
        paymentMethod,
        reference,
        meta: { note, allocatedFees }
      });

      showSuccess('Payment recorded successfully');
      setShowConfirmation(false);
      fetchStatement(selectedStudent.id);
      fetchTodayTotal();
    } catch (error: any) {
      showError(error.response?.data?.message || 'Transaction authorization failed');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-gray-50/50 dark:bg-gray-950 animate-in fade-in duration-500">
      {/* Header Area */}
      <div className="flex items-center justify-between px-8 py-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Offline Fees Collection</h1>
          <p className="text-gray-500 text-sm">Search student and record payments securely.</p>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-xl border border-blue-100 dark:border-blue-800 shadow-sm">
          <TrendingUp size={16} />
          <span className="text-sm font-bold tracking-tight">Total Collection Today: {formatCurrency(todayTotal)}</span>
        </div>
      </div>

      <div className="flex flex-1 gap-8 px-8 pb-10 overflow-hidden">
        {/* Left Sidebar: Student Search */}
        <aside className="w-88 flex flex-col bg-white dark:bg-gray-800 rounded-3xl border border-gray-100 dark:border-gray-700 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-gray-50 dark:border-gray-700">
            <h2 className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-2 mb-6">
              <Search size={18} className="text-blue-600" />
              Student Search
            </h2>

            <div className="flex gap-2">
              <div className="relative flex-1 group">
                <input
                  type="text"
                  placeholder="Ex: ADM001"
                  className="w-full pl-9 pr-4 py-2 bg-gray-50 dark:bg-gray-900 border-none rounded-xl text-sm font-medium focus:ring-2 focus:ring-blue-500 transition-all"
                  value={searchQuery}
                  onKeyDown={e => e.key === 'Enter' && handleSearch()}
                  onChange={e => setSearchQuery(e.target.value)}
                />
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-blue-500" size={16} />
                {searching && <RefreshCcw className="absolute right-3 top-1/2 -translate-y-1/2 text-blue-500 animate-spin" size={14} />}
              </div>
              <button
                onClick={handleSearch}
                className="px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-bold hover:bg-blue-700 transition-all shadow-sm"
              >
                Search
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto custom-scrollbar p-3 space-y-1">
            {students.map(s => (
              <button
                key={s.id}
                onClick={() => setSelectedStudent(s)}
                className={clsx(
                  "w-full p-4 rounded-2xl flex items-center gap-4 transition-all group text-left",
                  selectedStudent?.id === s.id
                    ? "bg-blue-50 dark:bg-blue-900/20 border-blue-100 dark:border-blue-800 border shadow-sm"
                    : "hover:bg-gray-50 dark:hover:bg-gray-900/50"
                )}
              >
                <div className="w-10 h-10 rounded-full bg-gray-100 dark:bg-gray-700 flex-shrink-0 flex items-center justify-center text-gray-400 group-hover:text-blue-600">
                  <User size={20} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className={clsx(
                    "text-sm font-bold truncate",
                    selectedStudent?.id === s.id ? "text-blue-600" : "text-gray-900 dark:text-white"
                  )}>
                    {s.firstName} {s.lastName}
                  </p>
                  <p className="text-[10px] font-bold text-gray-400 uppercase truncate mt-0.5">{s.admissionNo}</p>
                </div>
                <ChevronRight size={16} className="text-gray-300 group-hover:text-blue-500" />
              </button>
            ))}

            {students.length === 0 && !searching && (
              <div className="py-20 text-center text-gray-400 opacity-60">
                <SearchX size={32} className="mx-auto mb-2" />
                <p className="text-xs font-bold uppercase tracking-widest">No results</p>
              </div>
            )}
          </div>
        </aside>

        {/* Right Area: Fee Statement or Placeholder */}
        <main className="flex-1 flex flex-col bg-white dark:bg-gray-800 rounded-3xl border border-gray-100 dark:border-gray-700 shadow-sm overflow-hidden relative">
          {!selectedStudent ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-12">
              <div className="w-20 h-20 bg-blue-50 dark:bg-blue-900/20 rounded-full flex items-center justify-center text-blue-600 mb-6">
                <Wallet size={40} />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Start Processing Fees</h2>
              <p className="text-gray-500 max-w-sm">Search and select a student from the sidebar to view their fee history and record new payments.</p>
            </div>
          ) : (
            <div className="flex-1 flex flex-col min-h-0">
              {/* Student Context Header */}
              <div className="p-6 border-b border-gray-100 dark:border-gray-700 bg-gray-50/30 dark:bg-gray-900/10 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 overflow-hidden flex-shrink-0 shadow-sm">
                    {selectedStudent.studentPhoto ? <img src={`http://localhost:3000/${selectedStudent.studentPhoto}`} className="w-full h-full object-cover" /> : <User size={28} className="w-full h-full p-3 text-gray-300" />}
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-gray-900 dark:text-white leading-tight">{selectedStudent.firstName} {selectedStudent.lastName}</h2>
                    <p className="text-xs font-bold text-blue-600 uppercase tracking-widest mt-0.5">{selectedStudent.admissionNo} • {selectedStudent.class?.name}</p>
                  </div>
                </div>

                <div className="flex items-center gap-8 pr-4">
                  <div className="text-right">
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Total Outstanding</p>
                    <p className="text-xl font-black text-rose-500 tabular-nums">{loadingStatement ? '---' : formatCurrency(statement?.balance || 0)}</p>
                  </div>
                  <div className="w-px h-10 bg-gray-100 dark:bg-gray-700" />
                  <div className="text-right">
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Total Remitted</p>
                    <p className="text-xl font-black text-emerald-600 tabular-nums">{loadingStatement ? '---' : formatCurrency(statement?.totalPaid || 0)}</p>
                  </div>
                </div>
              </div>

              {/* Functional Dual-Pane Area */}
              <div className="flex-1 flex min-h-0">
                {/* Ledger Listing */}
                <div className="flex-1 flex flex-col border-r border-gray-100 dark:border-gray-700">
                  <div className="px-6 py-4 border-b border-gray-50 dark:border-gray-800 flex items-center justify-between">
                    <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
                      <Receipt size={14} className="text-blue-500" />
                      Pending Invoices
                    </h3>
                    <button
                      onClick={selectAll}
                      className="text-[10px] font-bold text-blue-600 hover:text-blue-700 uppercase tracking-widest"
                    >
                      {Object.keys(selectedFeesMap).length === statement?.assignedHeads.length ? 'Clear Selection' : 'Select All'}
                    </button>
                  </div>

                  <div className="flex-1 overflow-y-auto custom-scrollbar">
                    <table className="w-full text-left">
                      <thead className="bg-gray-50/50 dark:bg-gray-900/50 sticky top-0 z-10">
                        <tr className="border-b border-gray-100 dark:border-gray-700">
                          <th className="px-6 py-3 w-10"></th>
                          <th className="px-6 py-3 text-[10px] font-black text-gray-400 uppercase tracking-widest">Fee Item</th>
                          <th className="px-6 py-3 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">Balance</th>
                          <th className="px-6 py-3 text-[10px] font-black text-gray-400 uppercase tracking-widest text-center">Amount to Pay</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-50 dark:divide-gray-800">
                        {loadingStatement ? (
                          Array.from({ length: 4 }).map((_, i) => (
                            <tr key={i} className="animate-pulse">
                              <td colSpan={4} className="px-6 py-10">
                                <div className="h-4 bg-gray-100 dark:bg-gray-800 rounded w-full" />
                              </td>
                            </tr>
                          ))
                        ) : statement?.assignedHeads.map(h => (
                          <tr key={h.id} className={clsx("group transition-all", selectedFeesMap[h.id] !== undefined ? "bg-blue-50/30 dark:bg-blue-900/10" : "hover:bg-gray-50/50 dark:hover:bg-gray-900/50")}>
                            <td className="px-6 py-4">
                              <div
                                onClick={() => toggleFee(h)}
                                className={clsx(
                                  "w-5 h-5 rounded flex items-center justify-center cursor-pointer transition-all border-2",
                                  selectedFeesMap[h.id] !== undefined ? "bg-blue-600 border-blue-600 text-white" : "border-gray-200 dark:border-gray-700"
                                )}
                              >
                                {selectedFeesMap[h.id] !== undefined && <Check size={12} strokeWidth={4} />}
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <p className="text-sm font-bold text-gray-900 dark:text-white leading-tight">{h.name}</p>
                              <p className="text-[9px] font-bold text-gray-400 uppercase tracking-tighter mt-0.5">{h.group}</p>
                            </td>
                            <td className="px-6 py-4 text-right">
                              <span className="text-sm font-black text-gray-700 dark:text-gray-300 tabular-nums">{formatCurrency(h.amount)}</span>
                            </td>
                            <td className="px-6 py-4">
                              {selectedFeesMap[h.id] !== undefined && (
                                <input
                                  type="number"
                                  className="w-24 mx-auto block px-3 py-1.5 bg-white dark:bg-gray-950 border-2 border-blue-500/20 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-right font-bold text-blue-600 text-sm"
                                  value={selectedFeesMap[h.id]}
                                  onChange={e => handlePartialChange(h.id, e.target.value)}
                                />
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Confirm Sidebar */}
                <div className="w-80 flex flex-col bg-gray-50/30 dark:bg-gray-950/20">
                  <div className="p-6 space-y-8 flex-1 overflow-y-auto custom-scrollbar">
                    <div className="space-y-4">
                      <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest pl-1">Payment Finalization</h3>

                      <div className="p-5 bg-blue-600 rounded-2xl text-white shadow-lg shadow-blue-500/20 relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-20 h-20 bg-white/10 -rotate-45 translate-x-8 -translate-y-8" />
                        <p className="text-[10px] font-black text-blue-100 uppercase tracking-widest">Calculated Total</p>
                        <h4 className="text-2xl font-black mt-1 tabular-nums">{formatCurrency(amount)}</h4>
                      </div>

                      <div className="space-y-3">
                        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest pl-1">Remittance Type</label>
                        <select
                          className="w-full px-4 py-3 bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-xl text-sm font-bold focus:ring-2 focus:ring-blue-500 outline-none"
                          value={paymentMethod}
                          onChange={e => setPaymentMethod(e.target.value)}
                        >
                          <option value="CASH">Cash Payment</option>
                          <option value="BANK_TRANSFER">Bank Transfer</option>
                          <option value="POS">POS Terminal</option>
                        </select>
                      </div>

                      <div className="space-y-3">
                        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest pl-1">TX Reference (Optional)</label>
                        <input
                          type="text"
                          className="w-full px-4 py-3 bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-xl text-sm font-bold focus:ring-2 focus:ring-blue-500 outline-none"
                          placeholder="Ex: #4400-991"
                          value={reference}
                          onChange={e => setReference(e.target.value)}
                        />
                      </div>

                      <div className="space-y-3">
                        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest pl-1">Internal Log</label>
                        <textarea
                          rows={3}
                          className="w-full px-4 py-3 bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-xl text-sm font-medium focus:ring-2 focus:ring-blue-500 outline-none resize-none"
                          placeholder="Add private note..."
                          value={note}
                          onChange={e => setNote(e.target.value)}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="p-6 border-t border-gray-100 dark:border-gray-700">
                    <button
                      onClick={() => setShowConfirmation(true)}
                      disabled={submitting || parseFloat(amount) <= 0}
                      className="w-full py-4 bg-blue-600 text-white rounded-2xl font-bold uppercase tracking-widest text-sm hover:bg-blue-700 transition-all shadow-lg active:scale-95 disabled:opacity-40 disabled:grayscale"
                    >
                      {submitting ? 'Recording...' : 'Collect Fees'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* Confirmation Modal */}
      {showConfirmation && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-300">
          <div className="bg-white dark:bg-gray-800 w-full max-w-md rounded-3xl border border-gray-100 dark:border-gray-700 shadow-2xl p-8 animate-in zoom-in-95 duration-200">
            <div className="w-16 h-16 bg-blue-50 dark:bg-blue-900/20 rounded-2xl flex items-center justify-center mx-auto mb-6 text-blue-600">
              <ShieldCheck size={32} />
            </div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white text-center mb-2">Authorize Collection</h2>
            <p className="text-sm text-gray-500 text-center mb-8 px-4">
              Confirming payment of <span className="font-black text-blue-600">{formatCurrency(amount)}</span> for <span className="font-bold text-gray-900 dark:text-white">{selectedStudent?.firstName} {selectedStudent?.lastName}</span>.
            </p>

            <div className="flex gap-4">
              <button
                onClick={() => setShowConfirmation(false)}
                className="flex-1 py-3 text-sm font-bold text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-2xl transition-all"
              >
                Abort
              </button>
              <button
                onClick={handleFinalize}
                disabled={submitting}
                className="flex-1 py-3 text-sm font-bold bg-blue-600 text-white rounded-2xl hover:bg-blue-700 transition-all shadow-lg"
              >
                {submitting ? 'Syncing...' : 'Yes, Confirm'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
