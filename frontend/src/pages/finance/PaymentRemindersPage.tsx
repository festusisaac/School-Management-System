import { useState, useEffect } from 'react';
import {
  Bell,
  Search,
  CheckCircle2,
  AlertCircle,
  Clock,
  Send,
  User,
  History,
  Mail,
  MessageSquare,
  ChevronRight,
  ChevronLeft,
  Loader2,
  Check,
  Info,
  SendHorizontal
} from 'lucide-react';
import { formatCurrency } from '../../utils/currency';
import api from '../../services/api';
import { useToast } from '../../context/ToastContext';
import { clsx } from 'clsx';

interface Debtor {
  id: string;
  student: {
    id: string;
    firstName: string;
    lastName: string;
    admissionNo: string;
    class?: { id: string; name: string };
    photo?: string;
  };
  totalDue: string;
  totalPaid: string;
  balance: string;
}

interface ReminderHistory {
  id: string;
  studentId: string;
  amount: number;
  dueDate: string;
  message: string | null;
  channel: 'SMS' | 'EMAIL' | 'BOTH';
  status: 'PENDING' | 'SENT' | 'FAILED';
  error: string | null;
  createdAt: string;
  student?: {
    firstName: string;
    lastName: string;
    admissionNo: string;
  };
}

const PaymentRemindersPage = () => {
  const { showError, showSuccess, showInfo } = useToast();
  const [activeTab, setActiveTab] = useState<'composer' | 'history'>('composer');

  // Debtors State
  const [debtors, setDebtors] = useState<Debtor[]>([]);
  const [loadingDebtors, setLoadingDebtors] = useState(true);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedClass, setSelectedClass] = useState('all');
  const [classes, setClasses] = useState<{ id: string; name: string }[]>([]);

  // Composer State
  const [channel, setChannel] = useState<'EMAIL' | 'SMS' | 'BOTH'>('EMAIL');
  const [messageTemplate, setMessageTemplate] = useState('');
  const [sending, setSending] = useState(false);
  const [debouncedSearch, setDebouncedSearch] = useState('');

  // History State
  const [history, setHistory] = useState<ReminderHistory[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [historyPage, setHistoryPage] = useState(1);
  const [historyTotal, setHistoryTotal] = useState(0);

  // Search debouncing
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchQuery), 500);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  useEffect(() => {
    fetchClasses();
  }, []);

  useEffect(() => {
    fetchDebtors();
  }, [selectedClass, debouncedSearch]);

  useEffect(() => {
    if (activeTab === 'history') {
      fetchHistory();
    }
  }, [activeTab, historyPage]);

  const fetchClasses = async () => {
    try {
      const data = await api.getClasses();
      setClasses(data);
    } catch (error) {
      console.error('Failed to fetch classes');
    }
  };

  const fetchDebtors = async () => {
    setLoadingDebtors(true);
    try {
      const response = await api.getDebtorsList({
        classId: selectedClass === 'all' ? undefined : selectedClass,
        search: debouncedSearch || undefined,
        limit: 100, // Load a larger batch for selection
      });
      setDebtors(response.items || []);
    } catch (error) {
      showError('Failed to fetch debtors');
    } finally {
      setLoadingDebtors(false);
    }
  };

  const fetchHistory = async () => {
    setLoadingHistory(true);
    try {
      const response = await api.getReminders({
        page: historyPage,
        limit: 15,
      });
      setHistory(response.items || []);
      setHistoryTotal(response.total || 0);
    } catch (error) {
      showError('Failed to fetch reminder history');
    } finally {
      setLoadingHistory(false);
    }
  };

  const toggleSelect = (id: string) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedIds(newSelected);
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === debtors.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(debtors.map(d => d.student.id)));
    }
  };

  const handleSendReminders = async () => {
    if (selectedIds.size === 0) {
      showInfo('Please select at least one student');
      return;
    }

    setSending(true);
    try {
      await api.sendBulkReminders({
        studentIds: Array.from(selectedIds),
        channel,
        messageTemplate: messageTemplate || undefined,
      });
      showSuccess(`Reminders queued for ${selectedIds.size} students`);
      setSelectedIds(new Set());
      setMessageTemplate('');
    } catch (error) {
      showError('Failed to send reminders');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-10">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-gray-900 dark:text-white uppercase tracking-tighter">Payment Reminders</h1>
          <p className="text-gray-500 dark:text-gray-400 text-xs font-bold uppercase tracking-widest">Multi-channel debt notification center</p>
        </div>
        <div className="flex bg-gray-100 dark:bg-gray-800 p-1 rounded-xl">
          <button
            onClick={() => setActiveTab('composer')}
            className={clsx(
              "px-4 py-2 rounded-lg text-sm font-bold transition-all flex items-center gap-2",
              activeTab === 'composer' ? "bg-white dark:bg-gray-700 text-primary-600 shadow-sm" : "text-gray-500 hover:text-gray-700"
            )}
          >
            <Send size={16} />
            Composer
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={clsx(
              "px-4 py-2 rounded-lg text-sm font-bold transition-all flex items-center gap-2",
              activeTab === 'history' ? "bg-white dark:bg-gray-700 text-primary-600 shadow-sm" : "text-gray-500 hover:text-gray-700"
            )}
          >
            <History size={16} />
            History
          </button>
        </div>
      </div>

      {activeTab === 'composer' ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Debtor Selection Panel */}
          <div className="lg:col-span-8 space-y-6">
            <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm overflow-hidden">
              <div className="p-4 border-b border-gray-50 dark:border-gray-700 flex flex-col sm:flex-row gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                  <input
                    type="text"
                    placeholder="Search debtors..."
                    className="w-full pl-10 pr-4 py-2 bg-gray-50 dark:bg-gray-900 border-none rounded-xl text-sm focus:ring-2 focus:ring-primary-500 transition-all font-medium"
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                  />
                </div>
                <select
                  className="bg-gray-50 dark:bg-gray-900 border-none rounded-xl text-sm font-medium focus:ring-2 focus:ring-primary-500 px-4 py-2"
                  value={selectedClass}
                  onChange={e => setSelectedClass(e.target.value)}
                >
                  <option value="all">All Classes</option>
                  {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>

              <div className="max-h-[600px] overflow-y-auto">
                <table className="w-full text-left">
                  <thead className="bg-gray-50/50 dark:bg-gray-900/50 sticky top-0 z-10">
                    <tr>
                      <th className="px-6 py-4 w-10">
                        <button
                          onClick={toggleSelectAll}
                          className="w-5 h-5 rounded border-2 border-gray-300 flex items-center justify-center"
                        >
                          {selectedIds.size === debtors.length && debtors.length > 0 && <Check size={14} className="text-primary-500" />}
                        </button>
                      </th>
                      <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest font-bold">Student</th>
                      <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest font-bold">Balance</th>
                      <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest font-bold">Progress</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50 dark:divide-gray-700">
                    {loadingDebtors ? (
                      <tr>
                        <td colSpan={4} className="px-6 py-20 text-center">
                          <Loader2 className="w-8 h-8 text-primary-500 animate-spin mx-auto" />
                        </td>
                      </tr>
                    ) : debtors.map(d => (
                      <tr
                        key={d.id}
                        className={clsx(
                          "group transition-all cursor-pointer",
                          selectedIds.has(d.student.id) ? "bg-primary-50/50 dark:bg-primary-900/10" : "hover:bg-gray-50/30"
                        )}
                        onClick={() => toggleSelect(d.student.id)}
                      >
                        <td className="px-6 py-4">
                          <div className={clsx(
                            "w-5 h-5 rounded border-2 flex items-center justify-center transition-all",
                            selectedIds.has(d.student.id) ? "border-primary-500 bg-primary-500 text-white" : "border-gray-200"
                          )}>
                            {selectedIds.has(d.student.id) && <Check size={14} />}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center overflow-hidden">
                              {d.student.photo ? (
                                <img src={`${new URL((import.meta as any).env.VITE_API_BASE_URL || 'http://localhost:3000').origin}/${d.student.photo}`} alt="" className="w-full h-full object-cover" />
                              ) : <User size={14} className="text-gray-400" />}
                            </div>
                            <div>
                              <div className="text-sm font-bold text-gray-900 dark:text-white">{d.student.firstName} {d.student.lastName}</div>
                              <div className="text-[10px] text-gray-400 font-bold uppercase">{d.student.admissionNo} • {d.student.class?.name}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm font-black text-red-500">{formatCurrency(parseFloat(d.balance))}</td>
                        <td className="px-6 py-4">
                          <div className="w-24 bg-gray-100 dark:bg-gray-700 h-1.5 rounded-full overflow-hidden">
                            <div
                              className="bg-green-500 h-full"
                              style={{ width: `${(parseFloat(d.totalPaid) / parseFloat(d.totalDue)) * 100}%` }}
                            />
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Configuration Panel */}
          <div className="lg:col-span-4 space-y-6">
            <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm sticky top-6">
              <h3 className="text-sm font-black text-gray-900 dark:text-white uppercase tracking-tighter mb-4 flex items-center gap-2">
                <Bell size={18} className="text-primary-500" />
                Reminder Settings
              </h3>

              <div className="space-y-6">
                <div>
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 block font-bold">Delivery Channels</label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { id: 'EMAIL', icon: Mail, label: 'Email' },
                      { id: 'SMS', icon: MessageSquare, label: 'SMS' },
                      { id: 'BOTH', icon: SendHorizontal, label: 'Both' }
                    ].map(ch => (
                      <button
                        key={ch.id}
                        onClick={() => setChannel(ch.id as any)}
                        className={clsx(
                          "flex flex-col items-center gap-2 p-3 rounded-xl border-2 transition-all",
                          channel === ch.id
                            ? "border-primary-500 bg-primary-50 dark:bg-primary-900/20 text-primary-600"
                            : "border-gray-100 dark:border-gray-700 text-gray-400 hover:border-gray-200"
                        )}
                      >
                        <ch.icon size={20} />
                        <span className="text-[10px] font-bold uppercase">{ch.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 block font-bold">Custom Message (Optional)</label>
                  <textarea
                    className="w-full p-4 bg-gray-50 dark:bg-gray-900 border-none rounded-xl text-sm font-medium focus:ring-2 focus:ring-primary-500 min-h-[120px]"
                    placeholder="E.g. Please clear the pending balance by Friday to avoid late fees..."
                    value={messageTemplate}
                    onChange={e => setMessageTemplate(e.target.value)}
                  />
                  <p className="text-[10px] text-gray-500 mt-2 flex items-center gap-2 font-medium">
                    <Info size={12} />
                    Leave blank to use system default template.
                  </p>
                </div>

                <div className="p-4 bg-primary-50 dark:bg-primary-900/20 rounded-xl border border-primary-100 dark:border-primary-800">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[11px] font-bold text-primary-600 dark:text-primary-400 uppercase">Selected Students</span>
                    <span className="text-xl font-black text-primary-700 dark:text-primary-300">{selectedIds.size}</span>
                  </div>
                  <p className="text-[10px] text-primary-500/70 font-medium">
                    {selectedIds.size > 0
                      ? `You are about to notify ${selectedIds.size} student(s) via ${channel.toLowerCase()}.`
                      : "Please select students from the list."}
                  </p>
                </div>

                <button
                  onClick={handleSendReminders}
                  disabled={selectedIds.size === 0 || sending}
                  className={clsx(
                    "w-full py-4 rounded-xl font-bold flex items-center justify-center gap-2 transition-all shadow-lg",
                    selectedIds.size > 0 && !sending
                      ? "bg-primary-600 text-white hover:bg-primary-700 shadow-primary-500/20"
                      : "bg-gray-200 dark:bg-gray-700 text-gray-400 cursor-not-allowed"
                  )}
                >
                  {sending ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send size={18} />}
                  Send Bulk Reminders
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* History View */
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-gray-50/50 dark:bg-gray-900/50">
                <tr>
                  <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest font-bold">Student</th>
                  <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest font-bold">Amount</th>
                  <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest font-bold">Channel</th>
                  <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest font-bold">Status</th>
                  <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest font-bold">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 dark:divide-gray-700">
                {loadingHistory ? (
                  <tr><td colSpan={5} className="px-6 py-20 text-center"><Loader2 className="w-8 h-8 text-primary-500 animate-spin mx-auto" /></td></tr>
                ) : history.length === 0 ? (
                  <tr><td colSpan={5} className="px-6 py-20 text-center text-gray-400 text-sm font-bold">No reminders sent yet.</td></tr>
                ) : history.map(h => (
                  <tr key={h.id} className="hover:bg-gray-50/30 transition-all">
                    <td className="px-6 py-4">
                      {h.student ? (
                        <div>
                          <div className="text-sm font-bold text-gray-900 dark:text-white uppercase">{h.student.firstName} {h.student.lastName}</div>
                          <div className="text-[10px] text-gray-400 font-bold tracking-tight">{h.student.admissionNo}</div>
                        </div>
                      ) : <span className="text-gray-400 text-xs">Unknown Student</span>}
                    </td>
                    <td className="px-6 py-4 text-sm font-black text-gray-700 dark:text-gray-300">{formatCurrency(h.amount)}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1.5 text-xs font-bold text-gray-500">
                        {h.channel === 'EMAIL' ? <Mail size={14} /> : h.channel === 'SMS' ? <MessageSquare size={14} /> : <SendHorizontal size={14} />}
                        {h.channel}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className={clsx(
                        "inline-flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-black uppercase tracking-tighter",
                        h.status === 'SENT' ? "bg-green-50 text-green-600 dark:bg-green-900/20" :
                          h.status === 'FAILED' ? "bg-red-50 text-red-600 dark:bg-red-900/20" : "bg-gray-50 text-gray-600"
                      )}>
                        {h.status === 'SENT' ? <CheckCircle2 size={12} /> : h.status === 'FAILED' ? <AlertCircle size={12} /> : <Clock size={12} />}
                        {h.status}
                      </div>
                      {h.error && <p className="text-[9px] text-red-400 mt-1 max-w-[150px] truncate">{h.error}</p>}
                    </td>
                    <td className="px-6 py-4 text-xs font-bold text-gray-400">{new Date(h.createdAt).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="p-4 border-t border-gray-50 dark:border-gray-700 flex items-center justify-between">
            <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest bg-gray-50 dark:bg-gray-900 px-3 py-1 rounded-lg">
              Showing {history.length} of {historyTotal}
            </span>
            <div className="flex gap-2">
              <button
                disabled={historyPage === 1}
                onClick={() => setHistoryPage(p => p - 1)}
                className="p-2 border border-gray-100 dark:border-gray-700 rounded-lg disabled:opacity-30 hover:bg-gray-50"
              >
                <ChevronLeft size={16} />
              </button>
              <button
                disabled={historyPage * 15 >= historyTotal}
                onClick={() => setHistoryPage(p => p + 1)}
                className="p-2 border border-gray-100 dark:border-gray-700 rounded-lg disabled:opacity-30 hover:bg-gray-50"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PaymentRemindersPage;
