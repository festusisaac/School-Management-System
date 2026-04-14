import { useState, useEffect } from 'react';
import {
  Search,
  Filter,
  ArrowRightCircle,
  AlertTriangle,
  User,
  SearchX,
  CheckCircle2,
  X,
  ChevronLeft,
  ChevronRight,
  Loader2,
  History,
  ArrowRight,
  Calculator,
  Calendar
} from 'lucide-react';
import { formatCurrency } from '../../utils/currency';
import api from '../../services/api';
import { useToast } from '../../context/ToastContext';
import { useSystem } from '../../context/SystemContext';
import { clsx } from 'clsx';
import { useNavigate } from 'react-router-dom';
import { systemService, AcademicSession } from '../../services/systemService';

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
  discountApplied: string | null;
}

const CarryForwardPage = () => {
  const { showError, showSuccess, showInfo } = useToast();
  const { settings } = useSystem();
  const navigate = useNavigate();

  // ... (previous state)
  const [debtors, setDebtors] = useState<Debtor[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [selectedClass, setSelectedClass] = useState('all');
  const [classes, setClasses] = useState<{ id: string; name: string }[]>([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Carry Forward State
  const [availableSessions, setAvailableSessions] = useState<AcademicSession[]>([]);
  const [historyRecords, setHistoryRecords] = useState<Set<string>>(new Set());
  const [showCarryModal, setShowCarryModal] = useState<boolean>(false);
  const [showBulkConfirm, setShowBulkConfirm] = useState<boolean>(false);
  const [targetYear, setTargetYear] = useState('');
  const [processing, setProcessing] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<Debtor | null>(null);
  const [showProcessed, setShowProcessed] = useState(false);
  const [activeJobId, setActiveJobId] = useState<string | null>(null);
  const [jobProgress, setJobProgress] = useState(0);
  const [jobStatus, setJobStatus] = useState<string | null>(null);

  const limit = 50;

  // Search debouncing
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchQuery), 500);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Initial loads
  useEffect(() => {
    fetchClasses();
    fetchSessions();
  }, []);

  const fetchSessions = async () => {
    try {
      const data = await systemService.getSessions();
      setAvailableSessions(data || []);
    } catch (error) {
      console.error('Failed to fetch sessions');
    }
  };

  // Set default target year based on global session
  useEffect(() => {
    if (settings?.activeSessionName && !targetYear) {
      // If global session is 2024/2025, target should be 2025/2026
      const parts = settings.activeSessionName.split('/');
      if (parts.length === 2) {
        const startYear = parseInt(parts[0]);
        const endYear = parseInt(parts[1]);
        if (!isNaN(startYear) && !isNaN(endYear)) {
          setTargetYear(`${startYear + 1}/${endYear + 1}`);
        }
      }
    }
  }, [settings?.activeSessionName]);

  // Main fetch effect
  useEffect(() => {
    fetchDebtors();
  }, [debouncedSearch, selectedClass, page]);

  // Fetch history when targetYear changes to track processed students
  useEffect(() => {
    if (targetYear) {
      fetchProcessedHistory();
    } else {
      setHistoryRecords(new Set());
    }
  }, [targetYear]);

  const fetchProcessedHistory = async () => {
    try {
      const response = await api.listCarryForwards({
        academicYear: targetYear,
        limit: 1000 // Get a good batch for status tracking
      });
      const processedIds = new Set<string>(response.items?.map((r: any) => String(r.studentId)) || []);
      setHistoryRecords(processedIds);
    } catch (error) {
      console.error('Failed to fetch carry-forward history:', error);
    }
  };

  const fetchClasses = async () => {
    try {
      const data = await api.getClasses();
      setClasses(data);
    } catch (error) {
      console.error('Failed to fetch classes');
    }
  };

  const fetchDebtors = async () => {
    setLoading(true);
    try {
      const response = await api.getDebtorsList({
        classId: selectedClass === 'all' ? undefined : selectedClass,
        search: debouncedSearch || undefined,
        page,
        limit
      });
      setDebtors(response.items || []);
      setTotal(response.total || 0);
    } catch (error) {
      showError('Failed to fetch debtors list');
    } finally {
      setLoading(false);
    }
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === debtors.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(debtors.map(d => d.id)));
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

  const handleCarryForward = async (debtor?: Debtor) => {
    if (debtor) {
      setSelectedStudent(debtor);
      setShowCarryModal(true);
    } else if (selectedIds.size > 0) {
      setSelectedStudent(null);
      setShowCarryModal(true);
    } else {
      showInfo('Please select at least one student');
    }
  };

  const executeCarryForward = async () => {
    if (!targetYear) {
      showError('Please specify the target academic year');
      return;
    }

    setProcessing(true);
    try {
      if (selectedStudent) {
        await api.carryForward({
          studentId: selectedStudent.student.id,
          academicYear: targetYear
        });
        showSuccess(`Balance carried forward for ${selectedStudent.student.firstName}`);
      } else {
        // Bulk implementation for specific selections
        const promises = Array.from(selectedIds).map(id => {
          const debtor = debtors.find(d => d.id === id);
          if (debtor) {
            return api.carryForward({
              studentId: debtor.student.id,
              academicYear: targetYear
            });
          }
          return Promise.resolve();
        });
        await Promise.all(promises);
        showSuccess(`Balances carried forward for ${selectedIds.size} students`);
      }
      setShowCarryModal(false);
      setSelectedIds(new Set());
      fetchDebtors();
      fetchProcessedHistory();
    } catch (error: any) {
      showError(error.response?.data?.message || 'Failed to process carry forward');
    } finally {
      setProcessing(false);
    }
  };

  // Polling for job status
  useEffect(() => {
    let interval: any;
    if (activeJobId) {
      interval = setInterval(async () => {
        try {
          const status = await api.getJobStatus(activeJobId);
          setJobProgress(status.progress || 0);
          setJobStatus(status.state);

          if (status.state === 'completed' || status.state === 'failed') {
            setActiveJobId(null);
            setProcessing(false);
            if (status.state === 'completed') {
              showSuccess(`Successfully processed students.`);
              fetchDebtors();
              fetchProcessedHistory();
            } else {
              showError(`Job failed: ${status.failedReason || 'Unknown error'}`);
            }
          }
        } catch (error) {
          console.error('Polling error', error);
        }
      }, 2000);
    }
    return () => clearInterval(interval);
  }, [activeJobId]);

  const executeBulkCarryForward = async () => {
    if (!targetYear) {
      showError('Please specify the target academic year');
      return;
    }

    setProcessing(true);
    setJobProgress(0);
    setJobStatus('waiting');
    try {
      const { jobId } = await api.bulkCarryForward({
        oldSessionName: settings?.activeSessionName,
        newSessionName: targetYear,
        oldSessionId: settings?.currentSessionId
      });
      
      setActiveJobId(jobId);
      setShowBulkConfirm(false);
    } catch (error: any) {
      showError(error.response?.data?.message || 'Failed to initiate bulk carry forward');
      setProcessing(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-10">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-gray-900 dark:text-white uppercase tracking-tighter">Carry Forward</h1>
          <p className="text-gray-500 dark:text-gray-400 text-[10px] font-bold uppercase tracking-widest">Manage outstanding student arrears</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => navigate('/finance/carry-forward/history')}
            className="px-4 py-2 rounded-xl text-xs font-bold text-gray-500 bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 hover:bg-gray-50 transition-all uppercase tracking-wider flex items-center gap-2"
          >
            <History size={14} />
            History
          </button>
          <button
            onClick={() => setShowBulkConfirm(true)}
            className="px-4 py-2 rounded-xl text-xs font-black text-white bg-primary-600 hover:bg-primary-700 transition-all shadow-lg shadow-primary-500/10 uppercase tracking-widest flex items-center gap-2"
          >
            <CheckCircle2 size={14} />
            Process All Debtors
          </button>
        </div>
      </div>

      {/* Simplified Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-gray-800 p-4 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm">
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Pending Students</p>
          <p className="text-xl font-black text-gray-900 dark:text-white">
            {total - historyRecords.size < 0 ? 0 : total - historyRecords.size}
          </p>
        </div>
        <div className="bg-white dark:bg-gray-800 p-4 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm">
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Total Outstanding</p>
          <p className="text-xl font-black text-gray-900 dark:text-white">{formatCurrency(parseFloat(debtors.reduce((acc, curr) => acc + parseFloat(curr.balance), 0).toString()))}</p>
        </div>
        <div className="bg-white dark:bg-gray-800 p-4 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm">
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Target Session</p>
          <select 
            value={targetYear}
            onChange={(e) => setTargetYear(e.target.value)}
            className="w-full bg-transparent border-none p-0 text-sm font-black text-primary-600 focus:ring-0 cursor-pointer"
          >
            <option value="">Select Target...</option>
            {availableSessions.map(s => (
              <option key={s.id} value={s.name}>{s.name} {s.isActive ? '(Active)' : ''}</option>
            ))}
          </select>
        </div>
        <div className="bg-primary-50 dark:bg-primary-900/10 p-4 rounded-2xl border border-primary-100 dark:border-primary-900/20">
          <p className="text-[10px] font-black text-primary-600 uppercase tracking-widest mb-1">Processed</p>
          <p className="text-xl font-black text-primary-700 dark:text-primary-400">
            {targetYear ? historyRecords.size : '--'}
          </p>
        </div>
      </div>

      {/* Search & Bulk Action */}
      <div className="flex flex-col md:flex-row gap-3">
        <div className="relative flex-1 group">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-hover:text-primary-500 transition-colors" size={16} />
          <input
            type="text"
            placeholder="Search student or admission number..."
            className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-xl text-sm focus:ring-2 focus:ring-primary-500 transition-all"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-2">
          <select
              className="px-4 py-2.5 bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-xl text-xs font-bold transition-all text-gray-600"
              value={selectedClass}
              onChange={e => setSelectedClass(e.target.value)}
            >
              <option value="all">Every Class</option>
              {classes.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
          </select>
          <div className="flex items-center gap-1.5 px-3 py-2 bg-gray-50 dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700">
              <span className="text-[10px] font-black text-gray-400 uppercase">Show Processed</span>
              <button 
                onClick={() => setShowProcessed(!showProcessed)}
                className={clsx(
                  "w-8 h-4 rounded-full transition-all relative",
                  showProcessed ? "bg-primary-500" : "bg-gray-300 dark:bg-gray-600"
                )}
              >
                <div className={clsx(
                  "absolute top-0.5 w-3 h-3 bg-white rounded-full transition-all",
                  showProcessed ? "right-0.5" : "left-0.5"
                )} />
              </button>
          </div>
          <button
              onClick={() => handleCarryForward()}
              disabled={selectedIds.size === 0}
              className="px-4 py-2.5 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-xl text-xs font-black disabled:opacity-30 transition-all uppercase tracking-widest shrink-0"
          >
            Process Selected ({selectedIds.size})
          </button>
        </div>
      </div>

      {/* Minimal Table */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-gray-50/50 dark:bg-gray-900/50 border-b border-gray-100 dark:border-gray-700">
                <th className="px-6 py-3 w-10">
                  <button onClick={toggleSelectAll} className="w-4 h-4 rounded border-2 border-gray-300 dark:border-gray-600 flex items-center justify-center">
                    {selectedIds.size === debtors.length && debtors.length > 0 && <div className="w-2 h-2 bg-primary-500 rounded-px" />}
                  </button>
                </th>
                <th className="px-6 py-3 text-[10px] font-black text-gray-400 uppercase tracking-widest">Student</th>
                <th className="px-6 py-3 text-[10px] font-black text-gray-400 uppercase tracking-widest">Outstanding</th>
                <th className="px-6 py-3 text-[10px] font-black text-gray-400 uppercase tracking-widest">Status</th>
                <th className="px-6 py-3 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 dark:divide-gray-700">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-gray-400 text-xs font-medium italic">Searching for arrears...</td>
                </tr>
              ) : debtors.filter(d => showProcessed || !historyRecords.has(d.student.id)).map((debtor) => {
                const isProcessed = historyRecords.has(debtor.student.id);
                return (
                  <tr key={debtor.id} className={clsx(
                    "hover:bg-gray-50/30 dark:hover:bg-gray-700/30 transition-colors",
                    isProcessed && "opacity-60"
                  )}>
                    <td className="px-6 py-3">
                      <button
                        onClick={() => !isProcessed && toggleSelect(debtor.id)}
                        disabled={isProcessed}
                        className={clsx(
                          "w-4 h-4 rounded border-2 flex items-center justify-center transition-all",
                          selectedIds.has(debtor.id) ? "border-primary-500 bg-primary-500" : "border-gray-300 dark:border-gray-600",
                          isProcessed && "cursor-not-allowed bg-gray-100 dark:bg-gray-700"
                        )}
                      >
                        {selectedIds.has(debtor.id) && <div className="w-2 h-2 bg-white rounded-px" />}
                      </button>
                    </td>
                    <td className="px-6 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-900 border border-gray-100 dark:border-gray-800 flex items-center justify-center text-gray-400 text-xs font-black">
                          {debtor.student.firstName[0]}
                        </div>
                        <div>
                          <p className="text-sm font-bold text-gray-900 dark:text-white">{debtor.student.firstName} {debtor.student.lastName}</p>
                          <p className="text-[10px] text-gray-400 font-bold uppercase">{debtor.student.admissionNo}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-3">
                      <p className="text-sm font-black text-gray-900 dark:text-white">{formatCurrency(parseFloat(debtor.balance))}</p>
                    </td>
                    <td className="px-6 py-3">
                      {isProcessed ? (
                        <div className="flex items-center gap-1.5 text-green-600 dark:text-green-500">
                          <CheckCircle2 size={12} />
                          <span className="text-[10px] font-black uppercase tracking-widest">Processed</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1.5 text-amber-500">
                          <AlertTriangle size={12} />
                          <span className="text-[10px] font-black uppercase tracking-widest">Pending</span>
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-3 text-right">
                      {!isProcessed && (
                        <button
                          onClick={() => handleCarryForward(debtor)}
                          className="p-1.5 hover:bg-primary-600 hover:text-white rounded-lg transition-all text-gray-400"
                        >
                          <ArrowRightCircle size={18} />
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <div className="p-4 flex items-center justify-between bg-gray-50/30 dark:bg-gray-700/10">
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{total} Total Students</p>
          <div className="flex items-center gap-2">
              <button disabled={page === 1} onClick={() => setPage(page-1)} className="p-1 text-gray-400 disabled:opacity-20"><ChevronLeft size={18} /></button>
              <span className="text-xs font-black text-gray-400">{page}</span>
              <button disabled={page >= Math.ceil(total / limit)} onClick={() => setPage(page+1)} className="p-1 text-gray-400 disabled:opacity-20"><ChevronRight size={18} /></button>
          </div>
        </div>
      </div>

      {/* Confirmation Modal */}
      {(showCarryModal || showBulkConfirm) && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/60 backdrop-blur-[2px]" onClick={() => { !processing && (setShowCarryModal(false) || setShowBulkConfirm(false)); }} />
          <div className="relative bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-gray-100 dark:border-gray-700">
              <h3 className="text-lg font-black uppercase tracking-tighter">Confirm Operation</h3>
              <p className="text-xs text-gray-500 font-bold uppercase tracking-widest mt-1">Carry forward to {targetYear}</p>
            </div>
            <div className="p-6 space-y-4">
              <p className="text-xs text-gray-600 dark:text-gray-400 font-bold leading-relaxed">
                This will create a permanent opening balance record in the target session. Consolidated notifications will be sent to parents.
              </p>
              <div className="bg-amber-50 dark:bg-amber-900/10 p-4 rounded-xl border border-amber-100 dark:border-amber-900/20">
                <p className="text-[10px] font-black text-amber-700 dark:text-amber-500 uppercase">Selected Scope</p>
                <p className="text-sm font-black mt-1">
                  {showBulkConfirm ? 'Global: All Active Debtors' : selectedStudent ? `Student: ${selectedStudent.student.firstName}` : `${selectedIds.size} Selected Students`}
                </p>
              </div>
            </div>
            <div className="p-4 bg-gray-50 dark:bg-gray-900/50 flex flex-col gap-2">
              <button
                disabled={processing || !targetYear}
                onClick={showBulkConfirm ? executeBulkCarryForward : executeCarryForward}
                className="w-full py-3 bg-primary-600 text-white rounded-xl font-black text-xs uppercase tracking-widest hover:bg-primary-700 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {processing ? <Loader2 size={16} className="animate-spin" /> : null}
                {processing ? 'Processing...' : 'Confirm & Process'}
              </button>
              {!processing && (
                <button
                  onClick={() => { setShowCarryModal(false); setShowBulkConfirm(false); }}
                  className="w-full py-3 text-gray-400 font-black text-[10px] uppercase tracking-widest"
                >
                  Cancel
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Progress Overlay for Background Jobs */}
      {activeJobId && (
        <div className="fixed inset-0 z-[2000] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-md p-8 animate-in zoom-in-95 duration-200">
            <div className="text-center space-y-4">
              <div className="w-16 h-16 bg-primary-50 dark:bg-primary-900/20 rounded-full flex items-center justify-center mx-auto">
                <Loader2 className="text-primary-600 animate-spin" size={32} />
              </div>
              <div>
                <h3 className="text-xl font-black uppercase tracking-tighter">Processing Transfers</h3>
                <p className="text-xs text-gray-500 font-bold uppercase tracking-widest mt-1">Sending consolidated alerts to parents...</p>
              </div>
              
              <div className="w-full bg-gray-100 dark:bg-gray-700 rounded-full h-3 overflow-hidden">
                <div 
                  className="bg-primary-600 h-full transition-all duration-500 ease-out"
                  style={{ width: `${jobProgress}%` }}
                />
              </div>
              
              <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest text-gray-400">
                <span>{jobStatus}</span>
                <span className="text-primary-600">{jobProgress}% Complete</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CarryForwardPage;
