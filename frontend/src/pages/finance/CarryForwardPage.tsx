import React, { useState, useEffect } from 'react';
import {
  Search,
  Filter,
  ArrowRightCircle,
  AlertTriangle,
  User,
  SearchX,
  Banknote,
  MoreHorizontal,
  Bell,
  CheckCircle2,
  X,
  FileText,
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
import { clsx } from 'clsx';
import { useNavigate } from 'react-router-dom';

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
  const navigate = useNavigate();

  // State
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
  const [showCarryModal, setShowCarryModal] = useState<boolean>(false);
  const [targetYear, setTargetYear] = useState('');
  const [processing, setProcessing] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<Debtor | null>(null);

  const limit = 20;

  // Search debouncing
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchQuery), 500);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Initial loads
  useEffect(() => {
    fetchClasses();
  }, []);

  // Main fetch effect
  useEffect(() => {
    fetchDebtors();
  }, [debouncedSearch, selectedClass, page]);

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
        // Bulk implementation
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
    } catch (error: any) {
      showError(error.response?.data?.message || 'Failed to process carry forward');
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-10">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-gray-900 dark:text-white uppercase tracking-tighter">Balance Carry Forward</h1>
          <p className="text-gray-500 dark:text-gray-400 text-xs font-bold uppercase tracking-widest">Move outstanding student debt to next session</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/finance/carry-forward/history')}
            className="px-4 py-2.5 rounded-xl text-xs font-bold text-gray-600 bg-white border border-gray-200 hover:bg-gray-50 transition-all uppercase tracking-wider flex items-center gap-2"
          >
            <History size={16} />
            View History
          </button>
          <button
            onClick={() => handleCarryForward()}
            disabled={selectedIds.size === 0}
            className={clsx(
              "flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-black transition-all shadow-lg uppercase tracking-widest",
              selectedIds.size > 0
                ? "bg-blue-600 text-white hover:bg-blue-700 shadow-blue-500/20"
                : "bg-gray-200 dark:bg-gray-700 text-gray-400 cursor-not-allowed shadow-none"
            )}
          >
            <ArrowRightCircle size={18} />
            Process Selected {selectedIds.size > 0 && `(${selectedIds.size})`}
          </button>
        </div>
      </div>


      {/* Stats Quick View */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm relative overflow-hidden group">
          <div className="absolute -right-4 -bottom-4 text-blue-50 dark:text-blue-900/10 transition-transform group-hover:scale-110">
            <Calculator size={80} />
          </div>
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Students with Balance</p>
          <p className="text-3xl font-black text-gray-900 dark:text-white">{total}</p>
          <div className="mt-2 flex items-center gap-1 text-[10px] font-bold text-gray-400">
            Available for carry forward
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm relative overflow-hidden group">
          <div className="absolute -right-4 -bottom-4 text-amber-50 dark:text-amber-900/10 transition-transform group-hover:scale-110">
            <AlertTriangle size={80} />
          </div>
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Total Outstanding</p>
          <p className="text-3xl font-black text-gray-900 dark:text-white">
            {formatCurrency(debtors.reduce((acc, curr) => acc + parseFloat(curr.balance), 0))}
          </p>
          <div className="mt-2 flex items-center gap-1 text-[10px] font-bold text-amber-600">
            Current page liability
          </div>
        </div>

        <div className="bg-gradient-to-br from-blue-600 to-indigo-700 p-6 rounded-2xl shadow-xl text-white relative overflow-hidden">
          <div className="relative z-10">
            <p className="text-[10px] font-black text-blue-100 uppercase tracking-widest mb-1">Selected Count</p>
            <p className="text-3xl font-black">{selectedIds.size}</p>
            <div className="mt-4 flex items-center gap-1.5 text-xs font-bold text-blue-100/80 bg-white/10 px-2 py-1 rounded-lg w-fit">
              <CheckCircle2 size={14} />
              Ready to process
            </div>
          </div>
          <History size={80} className="absolute -right-4 -bottom-4 text-white/10" />
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-gray-800 p-4 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm">
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              placeholder="Filter by name or admission number..."
              className="w-full pl-10 pr-4 py-3 bg-gray-50 dark:bg-gray-900 border-none rounded-xl text-sm focus:ring-2 focus:ring-blue-500 transition-all font-medium"
              value={searchQuery}
              onChange={e => {
                setSearchQuery(e.target.value);
                setPage(1);
              }}
            />
          </div>
          <div className="relative min-w-[200px]">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
            <select
              className="w-full pl-10 pr-4 py-3 bg-gray-50 dark:bg-gray-900 border-none rounded-xl text-sm focus:ring-2 focus:ring-blue-500 appearance-none font-medium text-gray-600 dark:text-gray-300"
              value={selectedClass}
              onChange={e => {
                setSelectedClass(e.target.value);
                setPage(1);
              }}
            >
              <option value="all">Every Class</option>
              {classes.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm overflow-hidden border-t-4 border-t-blue-500">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-gray-50/50 dark:bg-gray-900/50 border-b border-gray-100 dark:border-gray-700">
                <th className="px-6 py-4 w-10">
                  <button onClick={toggleSelectAll} className="w-5 h-5 rounded border-2 border-gray-300 dark:border-gray-600 flex items-center justify-center transition-colors">
                    {selectedIds.size === debtors.length && debtors.length > 0 && <div className="w-3 h-3 bg-blue-500 rounded-sm" />}
                  </button>
                </th>
                <th className="px-6 py-4 text-[11px] font-bold text-gray-400 uppercase tracking-widest">Student Information</th>
                <th className="px-6 py-4 text-[11px] font-bold text-gray-400 uppercase tracking-widest">Outstanding Balance</th>
                <th className="px-6 py-4 text-[11px] font-bold text-gray-400 uppercase tracking-widest">Status</th>
                <th className="px-6 py-4 text-[11px] font-bold text-gray-400 uppercase tracking-widest text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 dark:divide-gray-700">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-24 text-center">
                    <div className="flex flex-col items-center justify-center gap-3">
                      <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
                      <span className="text-sm font-medium text-gray-400">Querying balances...</span>
                    </div>
                  </td>
                </tr>
              ) : debtors.map((debtor) => (
                <tr key={debtor.id} className={clsx(
                  "group transition-all",
                  selectedIds.has(debtor.id) ? "bg-blue-50/50 dark:bg-blue-900/10" : "hover:bg-gray-50/50 dark:hover:bg-gray-700/50"
                )}>
                  <td className="px-6 py-4">
                    <button
                      onClick={() => toggleSelect(debtor.id)}
                      className={clsx(
                        "w-5 h-5 rounded border-2 transition-colors flex items-center justify-center",
                        selectedIds.has(debtor.id) ? "border-blue-500 bg-blue-500" : "border-gray-300 dark:border-gray-600"
                      )}
                    >
                      {selectedIds.has(debtor.id) && <div className="w-3 h-3 bg-white rounded-sm" />}
                    </button>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full overflow-hidden bg-gray-100 flex-shrink-0 border border-gray-100">
                        <div className="w-full h-full flex items-center justify-center text-gray-400 bg-gray-50 dark:bg-gray-900">
                          <User size={18} />
                        </div>
                      </div>
                      <div>
                        <div className="font-bold text-gray-900 dark:text-white">
                          {debtor.student.firstName} {debtor.student.lastName}
                        </div>
                        <div className="text-[10px] text-gray-500 font-bold uppercase tracking-wider mt-0.5">
                          {debtor.student.admissionNo} • {debtor.student.class?.name}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col">
                      <span className="text-base font-black text-gray-900 dark:text-white">{formatCurrency(parseFloat(debtor.balance))}</span>
                      <span className="text-[10px] text-gray-400 font-bold">Total Arrears</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    {parseFloat(debtor.balance) > 50000 ? (
                      <span className="px-2 py-0.5 bg-red-100 text-red-700 text-[10px] font-black rounded-full uppercase tracking-widest border border-red-200">Critical</span>
                    ) : (
                      <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-[10px] font-black rounded-full uppercase tracking-widest border border-blue-200">Eligible</span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button
                      onClick={() => handleCarryForward(debtor)}
                      className="p-2 bg-gray-50 dark:bg-gray-900 hover:bg-blue-600 hover:text-white rounded-xl text-blue-600 transition-all border border-gray-100 dark:border-gray-700 shadow-sm group/btn"
                      title="Carry Forward Balance"
                    >
                      <ArrowRight size={18} className="translate-x-0 group-hover/btn:translate-x-1 transition-transform" />
                    </button>
                  </td>
                </tr>
              ))}

              {!loading && debtors.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-20 text-center">
                    <div className="flex flex-col items-center justify-center text-gray-400">
                      <SearchX size={48} className="mb-4 text-gray-200" />
                      <h4 className="text-lg font-bold text-gray-500">All clear! No pending balances found.</h4>
                      <p className="text-xs">Adjust your filters if you were expecting results.</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="p-4 bg-gray-50/50 dark:bg-gray-900/50 border-t border-gray-100 dark:border-gray-700 flex items-center justify-between">
          <p className="text-[10px] text-gray-500 font-black uppercase tracking-widest px-3 py-1.5 rounded-xl bg-white dark:bg-gray-800 border border-gray-100 shadow-sm">
            {total} Students Total
          </p>
          <div className="flex items-center gap-2">
            <button
              disabled={page === 1}
              onClick={() => setPage(page - 1)}
              className="p-2 hover:bg-white dark:hover:bg-gray-800 rounded-lg text-gray-400 disabled:opacity-30 transition-all"
            >
              <ChevronLeft size={20} />
            </button>
            <span className="text-xs font-black text-gray-600 dark:text-gray-400 px-4">Page {page} of {Math.ceil(total / limit) || 1}</span>
            <button
              disabled={page >= Math.ceil(total / limit)}
              onClick={() => setPage(page + 1)}
              className="p-2 hover:bg-white dark:hover:bg-gray-800 rounded-lg text-gray-400 disabled:opacity-30 transition-all"
            >
              <ChevronRight size={20} />
            </button>
          </div>
        </div>
      </div>

      {/* Carry Forward Modal */}
      {showCarryModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-300">
          <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-2xl max-w-md w-full overflow-hidden border border-white/20">
            <div className="p-6 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between bg-gradient-to-r from-blue-50 to-white dark:from-blue-900/30 dark:to-gray-800">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400 shadow-inner">
                  <ArrowRightCircle size={24} />
                </div>
                <div>
                  <h3 className="text-lg font-black text-gray-900 dark:text-white uppercase tracking-tighter">Process Carry Forward</h3>
                  <p className="text-xs text-gray-500 font-bold">Transfer balance to new session</p>
                </div>
              </div>
              <button onClick={() => setShowCarryModal(false)} className="p-2 hover:bg-red-50 dark:hover:bg-red-900/20 text-gray-400 hover:text-red-500 rounded-xl transition-all">
                <X size={20} />
              </button>
            </div>

            <div className="p-8 space-y-6">
              <div className="bg-gray-50 dark:bg-gray-900/50 p-4 rounded-2xl border border-gray-100 dark:border-gray-800">
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">Scope of Transaction</p>
                {selectedStudent ? (
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold">
                      {selectedStudent.student.firstName[0]}
                    </div>
                    <div>
                      <p className="text-sm font-black text-gray-900 dark:text-white">{selectedStudent.student.firstName} {selectedStudent.student.lastName}</p>
                      <p className="text-[10px] text-gray-500 font-bold uppercase">{formatCurrency(parseFloat(selectedStudent.balance))} Outstanding</p>
                    </div>
                  </div>
                ) : (
                  <div className="p-2">
                    <p className="text-base font-black text-gray-900 dark:text-white">{selectedIds.size} Students Selected</p>
                    <p className="text-[10px] text-gray-500 font-bold uppercase">Multiple transfer operation</p>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-1">Target Academic Year</label>
                <div className="relative">
                  <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                  <select
                    className="w-full pl-12 pr-4 py-4 bg-gray-50 dark:bg-gray-900 border-2 border-transparent focus:border-blue-500 rounded-2xl text-base font-bold transition-all shadow-inner appearance-none"
                    value={targetYear}
                    onChange={e => setTargetYear(e.target.value)}
                  >
                    <option value="">Select Session...</option>
                    {Array.from({ length: 3 }, (_, i) => {
                      const y = new Date().getFullYear() + 1 - i;
                      return `${y}/${y + 1}`;
                    }).map(y => (
                      <option key={y} value={y}>{y}</option>
                    ))}
                  </select>
                </div>
                <p className="text-[10px] text-blue-500 font-bold pl-1">Balance will be added as "Opening Balance" in this session.</p>
              </div>

              <div className="p-4 bg-amber-50 dark:bg-amber-900/10 border border-amber-100 dark:border-amber-800 rounded-2xl flex gap-3">
                <AlertTriangle className="text-amber-600 flex-shrink-0" size={20} />
                <p className="text-xs text-amber-800 dark:text-amber-400 font-medium">
                  This action creates a permanent opening balance record. Ensure the target year is correct.
                </p>
              </div>
            </div>

            <div className="p-6 bg-gray-50 dark:bg-gray-900 border-t border-gray-100 dark:border-gray-700 flex gap-3">
              <button
                disabled={processing}
                onClick={executeCarryForward}
                className="flex-1 py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-black transition-all shadow-xl shadow-blue-500/20 disabled:opacity-50 uppercase tracking-widest text-sm flex items-center justify-center gap-2"
              >
                {processing ? <Loader2 className="animate-spin" size={18} /> : <CheckCircle2 size={18} />}
                Confirm Transfer
              </button>
              <button
                disabled={processing}
                onClick={() => setShowCarryModal(false)}
                className="flex-[0.5] py-4 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700 rounded-2xl font-bold hover:bg-gray-50 transition-all uppercase tracking-widest text-xs"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CarryForwardPage;
