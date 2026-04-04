import { useState, useEffect } from 'react';
import {
  Search,
  Filter,
  Download,
  CreditCard,
  AlertTriangle,
  User,
  ChevronRight,
  SearchX,
  TrendingDown,
  Users,
  Banknote,
  PieChart,
  Bell,
  CheckCircle2,
  X,
  FileText,
  ChevronLeft,
  Loader2
} from 'lucide-react';
import { formatCurrency } from '../../utils/currency';
import api, { getFileUrl } from '../../services/api';
import { useToast } from '../../context/ToastContext';
import { clsx } from 'clsx';
import { useNavigate } from 'react-router-dom';
import { useSystem } from '../../context/SystemContext';

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

interface Stats {
  totalOutstanding: number;
  debtorCount: number;
  totalPaid: number;
  totalDue: number;
}

const DebtorsListPage = () => {
  const { showError, showSuccess, showInfo } = useToast();
  const navigate = useNavigate();
  const { activeSectionId } = useSystem();

  // State
  const [debtors, setDebtors] = useState<Debtor[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [selectedClass, setSelectedClass] = useState('all');
  const [classes, setClasses] = useState<{ id: string; name: string }[]>([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [stats, setStats] = useState<Stats>({ totalOutstanding: 0, debtorCount: 0, totalPaid: 0, totalDue: 0 });
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [showBreakdown, setShowBreakdown] = useState<Debtor | null>(null);
  const [breakdownData, setBreakdownData] = useState<any>(null);
  const [loadingBreakdown, setLoadingBreakdown] = useState(false);
  const [riskFilter, setRiskFilter] = useState('all');

  // Family View State
  const [showFamilyModal, setShowFamilyModal] = useState<boolean>(false);
  const [familyData, setFamilyData] = useState<any>(null);
  const [loadingFamily, setLoadingFamily] = useState(false);

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
  }, [debouncedSearch, selectedClass, riskFilter, page, activeSectionId]);

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
        sectionId: activeSectionId || undefined,
        page,
        limit,
        riskLevel: riskFilter === 'all' ? undefined : riskFilter
      });
      setDebtors(response.items || []);
      setTotal(response.total || 0);
      setStats(response.stats || { totalOutstanding: 0, debtorCount: 0, totalPaid: 0, totalDue: 0 });
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

  const handleExportCSV = () => {
    if (debtors.length === 0) return;

    const headers = ['Admission No', 'First Name', 'Last Name', 'Class', 'Total Due', 'Total Paid', 'Balance'];
    const rows = debtors.map(d => [
      d.student.admissionNo,
      d.student.firstName,
      d.student.lastName,
      d.student.class?.name || 'N/A',
      d.totalDue,
      d.totalPaid,
      d.balance
    ]);

    const csvContent = [headers, ...rows].map(e => e.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `debtors_report_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showSuccess('CSV report downloaded successfully');
  };

  const handleViewBreakdown = async (debtor: Debtor) => {
    setShowBreakdown(debtor);
    setLoadingBreakdown(true);
    try {
      const data = await api.getStudentStatement(debtor.student.id);
      setBreakdownData(data);
    } catch (error) {
      showError('Failed to fetch breakdown data');
      setShowBreakdown(null);
    } finally {
      setLoadingBreakdown(false);
    }
  };

  const handleViewFamily = async (debtor: Debtor) => {
    setShowFamilyModal(true);
    setLoadingFamily(true);
    try {
      const data = await api.getFamilyFinancials(debtor.student.id);
      setFamilyData(data);
    } catch (error) {
      showError('Failed to fetch family data');
      setShowFamilyModal(false);
    } finally {
      setLoadingFamily(false);
    }
  };

  const handleBulkReminder = () => {
    if (selectedIds.size === 0) {
      showInfo('Please select at least one student');
      return;
    }
    showSuccess(`Reminders queued for ${selectedIds.size} students`);
    setSelectedIds(new Set());
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-10">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-gray-900 dark:text-white uppercase tracking-tighter">Debtors List</h1>
          <p className="text-gray-500 dark:text-gray-400 text-xs font-bold uppercase tracking-widest">Real-time outstanding balance management</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm font-semibold text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-all shadow-sm"
          >
            <Download size={18} />
            Export CSV
          </button>
          <button
            onClick={handleBulkReminder}
            disabled={selectedIds.size === 0}
            className={clsx(
              "flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all shadow-lg",
              selectedIds.size > 0
                ? "bg-red-600 text-white hover:bg-red-700 shadow-red-500/20"
                : "bg-gray-200 dark:bg-gray-700 text-gray-400 cursor-not-allowed shadow-none"
            )}
          >
            <Bell size={18} />
            Bulk Reminders {selectedIds.size > 0 && `(${selectedIds.size})`}
          </button>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm relative overflow-hidden group">
          <div className="absolute -right-4 -bottom-4 text-red-50 dark:text-red-900/10 transition-transform group-hover:scale-110">
            <TrendingDown size={80} />
          </div>
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Total Outstanding</p>
          <p className="text-2xl font-black text-gray-900 dark:text-white">{formatCurrency(stats.totalOutstanding)}</p>
          <div className="mt-2 flex items-center gap-1 text-[10px] font-bold text-red-500">
            <AlertTriangle size={12} />
            Immediate Collection Required
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm relative overflow-hidden group">
          <div className="absolute -right-4 -bottom-4 text-primary-50 dark:text-primary-900/10 transition-transform group-hover:scale-110">
            <Users size={80} />
          </div>
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Active Debtors</p>
          <p className="text-2xl font-black text-gray-900 dark:text-white">{stats.debtorCount}</p>
          <p className="text-[10px] text-gray-400 mt-2 font-medium">Filtered Result count: {total}</p>
        </div>

        <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm relative overflow-hidden group">
          <div className="absolute -right-4 -bottom-4 text-green-50 dark:text-green-900/10 transition-transform group-hover:scale-110">
            <PieChart size={80} />
          </div>
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Collection Progress</p>
          <p className="text-2xl font-black text-gray-900 dark:text-white">
            {stats.totalDue > 0 ? ((stats.totalPaid / stats.totalDue) * 100).toFixed(1) : 0}%
          </p>
          <div className="mt-2 w-full bg-gray-100 dark:bg-gray-700 h-1.5 rounded-full overflow-hidden">
            <div
              className="bg-primary-500 h-full transition-all duration-1000"
              style={{ width: `${stats.totalDue > 0 ? (stats.totalPaid / stats.totalDue) * 100 : 0}%` }}
            />
          </div>
        </div>

        <div className="bg-gradient-to-br from-gray-900 to-gray-800 p-6 rounded-2xl shadow-xl text-white relative overflow-hidden">
          <div className="relative z-10">
            <p className="text-[10px] font-black text-primary-300/60 uppercase tracking-widest mb-1">Avg Debt / Selected</p>
            <p className="text-2xl font-black">
              {formatCurrency(total > 0 ? stats.totalOutstanding / total : 0)}
            </p>
            <div className="mt-4 flex items-center gap-1.5 text-xs font-bold text-primary-500">
              <CheckCircle2 size={14} />
              Health Checked
            </div>
          </div>
          <Banknote size={80} className="absolute -right-4 -bottom-4 text-white/5" />
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
              className="w-full pl-10 pr-4 py-3 bg-gray-50 dark:bg-gray-900 border-none rounded-xl text-sm focus:ring-2 focus:ring-primary-500 transition-all font-medium"
              value={searchQuery}
              onChange={e => {
                setSearchQuery(e.target.value);
                setPage(1);
              }}
            />
          </div>
          <div className="flex gap-4">
            <div className="relative min-w-[200px]">
              <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
              <select
                className="w-full pl-10 pr-4 py-3 bg-gray-50 dark:bg-gray-900 border-none rounded-xl text-sm focus:ring-2 focus:ring-primary-500 appearance-none font-medium text-gray-600 dark:text-gray-300"
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
            <div className="relative min-w-[180px]">
              <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
              <select
                className="w-full pl-10 pr-4 py-3 bg-gray-50 dark:bg-gray-900 border-none rounded-xl text-sm focus:ring-2 focus:ring-primary-500 appearance-none font-medium text-gray-600 dark:text-gray-300"
                value={riskFilter}
                onChange={e => {
                  setRiskFilter(e.target.value);
                  setPage(1);
                }}
              >
                <option value="all">All Risks</option>
                <option value="HIGH">High Risk (&gt;50k)</option>
                <option value="MEDIUM">Medium Risk</option>
                <option value="LOW">Low Risk (&lt;20k)</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Debtor Table */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm overflow-hidden border-t-4 border-t-red-500">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-gray-50/50 dark:bg-gray-900/50 border-b border-gray-100 dark:border-gray-700">
                <th className="px-6 py-4 w-10">
                  <button onClick={toggleSelectAll} className="w-5 h-5 rounded border-2 border-gray-300 dark:border-gray-600 flex items-center justify-center transition-colors">
                    {selectedIds.size === debtors.length && debtors.length > 0 && <div className="w-3 h-3 bg-primary-500 rounded-sm" />}
                  </button>
                </th>
                <th className="px-6 py-4 text-[11px] font-bold text-gray-400 uppercase tracking-widest">Student Information</th>
                <th className="px-6 py-4 text-[11px] font-bold text-gray-400 uppercase tracking-widest">Billed Amt</th>
                <th className="px-6 py-4 text-[11px] font-bold text-gray-400 uppercase tracking-widest">Cleared Amt</th>
                <th className="px-6 py-4 text-[11px] font-bold text-gray-400 uppercase tracking-widest">Debt Balance</th>
                <th className="px-6 py-4 text-[11px] font-bold text-gray-400 uppercase tracking-widest">Level</th>
                <th className="px-6 py-4 text-[11px] font-bold text-gray-400 uppercase tracking-widest text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 dark:divide-gray-700">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-6 py-24 text-center">
                    <div className="flex flex-col items-center justify-center gap-3">
                      <Loader2 className="w-8 h-8 text-primary-500 animate-spin" />
                      <span className="text-sm font-medium text-gray-400">Loading debtors list...</span>
                    </div>
                  </td>
                </tr>
              ) : debtors.map((debtor) => (
                <tr key={debtor.id} className={clsx(
                  "group transition-all",
                  selectedIds.has(debtor.id) ? "bg-primary-50/50 dark:bg-primary-900/10" : "hover:bg-gray-50/50 dark:hover:bg-gray-700/50"
                )}>
                  <td className="px-6 py-4">
                    <button
                      onClick={() => toggleSelect(debtor.id)}
                      className={clsx(
                        "w-5 h-5 rounded border-2 transition-colors flex items-center justify-center",
                        selectedIds.has(debtor.id) ? "border-primary-500 bg-primary-500" : "border-gray-300 dark:border-gray-600"
                      )}
                    >
                      {selectedIds.has(debtor.id) && <div className="w-3 h-3 bg-white rounded-sm" />}
                    </button>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-full overflow-hidden bg-gray-100 flex-shrink-0 border border-gray-100 dark:border-gray-700">
                        {debtor.student.photo ? (
                          <img
                            src={getFileUrl(debtor.student.photo)}
                            alt=""
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              (e.target as HTMLImageElement).style.display = 'none';
                              (e.target as HTMLImageElement).nextElementSibling?.classList.remove('hidden');
                            }}
                          />
                        ) : null}
                        <div className={`w-full h-full flex items-center justify-center text-gray-400 ${debtor.student.photo ? 'hidden' : ''}`}>
                          <User size={20} />
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
                      <span className="text-sm font-bold text-gray-700 dark:text-gray-300">{formatCurrency(parseFloat(debtor.totalDue))}</span>
                      {debtor.discountApplied && (
                        <span className="text-[9px] text-primary-500 font-bold uppercase tracking-widest bg-primary-50 dark:bg-primary-900/20 px-1 py-0.5 rounded">
                          {debtor.discountApplied}
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col">
                      <span className="text-sm font-bold text-green-600 dark:text-green-500">{formatCurrency(parseFloat(debtor.totalPaid))}</span>
                      <div className="w-20 bg-gray-100 dark:bg-gray-700 h-1 rounded-full mt-1">
                        <div
                          className="bg-green-500 h-full"
                          style={{ width: `${Math.min(100, (parseFloat(debtor.totalPaid) / parseFloat(debtor.totalDue)) * 100)}%` }}
                        />
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col">
                      <span className="text-sm font-black text-red-600 dark:text-red-400">{formatCurrency(parseFloat(debtor.balance))}</span>
                      <span className="text-[10px] text-red-500 font-black uppercase tracking-tighter">Outstanding Balance</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    {parseFloat(debtor.balance) > 50000 ? (
                      <div className="flex items-center gap-1">
                        <span className="px-2.5 py-1 bg-red-600 text-white text-[10px] font-black rounded-lg shadow-lg shadow-red-500/20 border border-red-500 uppercase tracking-widest">Critical</span>
                      </div>
                    ) : parseFloat(debtor.balance) > 20000 ? (
                      <span className="px-2.5 py-1 bg-amber-500 text-white text-[10px] font-black rounded-lg shadow-lg shadow-amber-500/20 border border-amber-400 uppercase tracking-widest">Warning</span>
                    ) : (
                      <span className="px-2.5 py-1 bg-primary-500 text-white text-[10px] font-black rounded-lg shadow-lg shadow-primary-500/20 border border-primary-500 uppercase tracking-widest">Healthy</span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => handleViewBreakdown(debtor)}
                        className="p-2 hover:bg-white dark:hover:bg-gray-700 rounded-lg text-gray-400 hover:text-primary-600 transition-all border border-transparent hover:border-primary-100 dark:hover:border-primary-800 shadow-sm"
                        title="Fee Breakdown"
                      >
                        <FileText size={16} />
                      </button>
                      <button
                        onClick={() => handleViewFamily(debtor)}
                        className="p-2 hover:bg-white dark:hover:bg-gray-700 rounded-lg text-gray-400 hover:text-secondary-600 transition-all border border-transparent hover:border-secondary-100 dark:hover:border-secondary-800 shadow-sm"
                        title="View Family & Siblings"
                      >
                        <Users size={16} />
                      </button>
                      <button
                        onClick={() => navigate(`/finance/record-payment`, { state: { studentId: debtor.student.id } })}
                        className="p-2 hover:bg-white dark:hover:bg-gray-700 rounded-lg text-gray-400 hover:text-green-600 transition-all border border-transparent hover:border-green-100 dark:hover:border-green-800 shadow-sm"
                        title="Record Payment"
                      >
                        <CreditCard size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}

              {!loading && debtors.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-6 py-20 text-center">
                    <div className="flex flex-col items-center justify-center text-gray-400">
                      <SearchX size={48} className="mb-4 text-gray-200" />
                      <h4 className="text-lg font-bold text-gray-500">No matching debtors found</h4>
                      <p className="text-xs">Adjust your filters or try a different search term.</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="p-4 bg-gray-50/50 dark:bg-gray-900/50 border-t border-gray-100 dark:border-gray-700 flex items-center justify-between">
          <p className="text-xs text-gray-500 font-medium font-bold uppercase tracking-widest px-2 py-1 rounded-full bg-primary-50 dark:bg-primary-900/20 inline-block">
            Showing {debtors.length} of {total} Records
          </p>
          <div className="flex items-center gap-2">
            <button
              disabled={page === 1}
              onClick={() => setPage(page - 1)}
              className="p-2 hover:bg-white dark:hover:bg-gray-800 rounded-lg text-gray-400 disabled:opacity-30 transition-all border border-transparent hover:border-gray-200"
            >
              <ChevronLeft size={20} />
            </button>
            <span className="text-sm font-bold text-gray-600 dark:text-gray-400 px-4">Page {page} of {Math.ceil(total / limit) || 1}</span>
            <button
              disabled={page >= Math.ceil(total / limit)}
              onClick={() => setPage(page + 1)}
              className="p-2 hover:bg-white dark:hover:bg-gray-800 rounded-lg text-gray-400 disabled:opacity-30 transition-all border border-transparent hover:border-gray-200"
            >
              <ChevronRight size={20} />
            </button>
          </div>
        </div>
      </div>

      {/* Breakdown Modal */}
      {showBreakdown && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-300">
          <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden border border-white/20">
            <div className="p-6 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between bg-gradient-to-r from-gray-50 to-white dark:from-gray-900 dark:to-gray-800">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center text-primary-600 dark:text-primary-400 shadow-inner">
                  <FileText size={24} />
                </div>
                <div>
                  <h3 className="text-lg font-black text-gray-900 dark:text-white uppercase tracking-tighter">Debt Statement</h3>
                  <p className="text-xs text-gray-500 font-bold">{showBreakdown.student.firstName} {showBreakdown.student.lastName}</p>
                </div>
              </div>
              <button onClick={() => setShowBreakdown(null)} className="p-2 hover:bg-red-50 dark:hover:bg-red-900/20 text-gray-400 hover:text-red-500 rounded-xl transition-all">
                <X size={20} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {loadingBreakdown ? (
                <div className="flex flex-col items-center justify-center py-20 gap-4">
                  <div className="w-10 h-10 border-4 border-primary-100 dark:border-primary-900 border-t-blue-600 rounded-full animate-spin" />
                  <p className="text-sm text-gray-500 font-bold">Calculating Ledger...</p>
                </div>
              ) : breakdownData && (
                <>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="bg-primary-50/50 dark:bg-primary-900/10 p-4 rounded-2xl border border-primary-100 dark:border-primary-800">
                      <p className="text-[10px] font-bold text-primary-500 uppercase tracking-widest mb-1">Total Assessed</p>
                      <p className="text-lg font-black text-primary-700 dark:text-primary-300">{formatCurrency(parseFloat(breakdownData.totalDue))}</p>
                    </div>
                    <div className="bg-green-50/50 dark:bg-green-900/10 p-4 rounded-2xl border border-green-100 dark:border-green-800">
                      <p className="text-[10px] font-bold text-green-400 uppercase tracking-widest mb-1">Total Remitted</p>
                      <p className="text-lg font-black text-green-700 dark:text-green-300">{formatCurrency(parseFloat(breakdownData.totalPaid))}</p>
                    </div>
                    <div className="bg-red-50/50 dark:bg-red-900/10 p-4 rounded-2xl border border-red-100 dark:border-red-800">
                      <p className="text-[10px] font-bold text-red-400 uppercase tracking-widest mb-1">Net Balance</p>
                      <p className="text-lg font-black text-red-700 dark:text-red-300">{formatCurrency(parseFloat(breakdownData.balance))}</p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h4 className="text-xs font-black text-gray-400 uppercase tracking-widest">Assigned Fee Components</h4>
                    <div className="space-y-2">
                      {breakdownData.assignedHeads?.map((head: any, idx: number) => (
                        <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800">
                          <div>
                            <p className="text-sm font-bold text-gray-700 dark:text-gray-200">{head.name}</p>
                            <p className="text-[10px] text-gray-400 font-medium">Standard Fee Component</p>
                          </div>
                          <span className="text-sm font-black text-gray-900 dark:text-white">{formatCurrency(parseFloat(head.amount))}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </div>

            <div className="p-6 bg-gray-50 dark:bg-gray-900 border-t border-gray-100 dark:border-gray-700 flex gap-3">
              <button
                onClick={() => navigate(`/finance/record-payment`, { state: { studentId: showBreakdown.student.id } })}
                className="flex-1 py-3 bg-primary-600 hover:bg-primary-700 text-white rounded-2xl font-bold transition-all shadow-xl shadow-primary-500/20"
              >
                Apply Payment
              </button>
              <button
                onClick={() => setShowBreakdown(null)}
                className="flex-1 py-3 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700 rounded-2xl font-bold hover:bg-gray-50 transition-all"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Family Modal */}
      {showFamilyModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-300">
          <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-2xl max-w-3xl w-full max-h-[90vh] flex flex-col overflow-hidden border border-white/20">
            <div className="p-6 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between bg-gradient-to-r from-secondary-50 to-white dark:from-secondary-900/30 dark:to-gray-800">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-secondary-100 dark:bg-secondary-900/50 flex items-center justify-center text-secondary-600 dark:text-secondary-400 shadow-inner">
                  <Users size={24} />
                </div>
                <div>
                  <h3 className="text-lg font-black text-gray-900 dark:text-white uppercase tracking-tighter">Family Debt Overview</h3>
                  <p className="text-xs text-gray-500 font-bold">Consolidated Family Liability</p>
                </div>
              </div>
              <button onClick={() => setShowFamilyModal(false)} className="p-2 hover:bg-red-50 dark:hover:bg-red-900/20 text-gray-400 hover:text-red-500 rounded-xl transition-all">
                <X size={20} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-8">
              {loadingFamily ? (
                <div className="flex flex-col items-center justify-center py-20 gap-4">
                  <Loader2 className="w-10 h-10 text-secondary-600 animate-spin" />
                  <p className="text-sm text-gray-500 font-bold">Analysing Family Connections...</p>
                </div>
              ) : familyData && (
                <>
                  {/* Family Total Card */}
                  <div className="bg-gradient-to-br from-gray-900 to-gray-800 p-8 rounded-3xl text-white shadow-xl relative overflow-hidden">
                    <div className="relative z-10">
                      <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Total Family Liability</p>
                      <div className="flex items-baseline gap-2">
                        <h2 className="text-5xl font-black">{formatCurrency(parseFloat(familyData.familyBalance))}</h2>
                        <span className="text-sm font-bold text-red-400 bg-red-900/50 px-2 py-1 rounded-lg">OUTSTANDING</span>
                      </div>
                      <p className="mt-4 text-sm text-gray-400">
                        Across {familyData.siblingCount} Sibling{familyData.siblingCount !== 1 ? 's' : ''}
                      </p>
                    </div>
                    <Users size={180} className="absolute -right-10 -bottom-10 text-white/5" />
                  </div>

                  {/* Sibling Breakdown */}
                  <div>
                    <h4 className="text-sm font-black text-gray-900 dark:text-white uppercase tracking-widest mb-4 flex items-center gap-2">
                      <Users size={16} className="text-secondary-500" />
                      Sibling Breakdown
                    </h4>
                    <div className="grid gap-4">
                      {familyData.siblings.map((sib: any) => (
                        <div key={sib.student.id} className="group p-4 bg-gray-50 dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 hover:border-secondary-200 dark:hover:border-secondary-800 transition-all">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                              <div className="w-12 h-12 rounded-full bg-gray-200 dark:bg-gray-800 overflow-hidden">
                                {sib.student.photo ? (
                                  <img
                                    src={getFileUrl(sib.student.photo)}
                                    className="w-full h-full object-cover"
                                    alt=""
                                    onError={(e) => {
                                      (e.target as HTMLImageElement).style.display = 'none';
                                      (e.target as HTMLImageElement).nextElementSibling?.classList.remove('hidden');
                                    }}
                                  />
                                ) : null}
                                <div className={`w-full h-full flex items-center justify-center ${sib.student.photo ? 'hidden' : ''}`}>
                                  <User size={20} className="text-gray-400" />
                                </div>
                              </div>
                              <div>
                                <h5 className="font-bold text-gray-900 dark:text-white">{sib.student.firstName} {sib.student.lastName}</h5>
                                <p className="text-xs text-gray-500 font-bold">{sib.student.class?.name || 'N/A'} • {sib.student.admissionNo}</p>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="text-xs text-gray-400 font-bold uppercase">Outstanding</p>
                              <p className={`text-lg font-black ${parseFloat(sib.balance) > 0 ? 'text-red-600 dark:text-red-400' : 'text-green-600'}`}>
                                {formatCurrency(parseFloat(sib.balance))}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </div>

            <div className="p-6 bg-gray-50 dark:bg-gray-900 border-t border-gray-100 dark:border-gray-700">
              <button
                onClick={() => setShowFamilyModal(false)}
                className="w-full py-4 bg-white dark:bg-gray-800 text-gray-900 dark:text-white border border-gray-200 dark:border-gray-700 rounded-2xl font-bold hover:bg-gray-50 dark:hover:bg-gray-700 transition-all shadow-sm"
              >
                Close Overview
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DebtorsListPage;
