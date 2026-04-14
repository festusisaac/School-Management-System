import { useState, useEffect } from 'react';
import {
    ArrowLeft,
    Trash2,
    Search,
    Loader2,
    History,
    ChevronLeft,
    ChevronRight,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { formatDateLocal, formatTimeLocal } from '../../utils/date';
import { useToast } from '../../context/ToastContext';
import { formatCurrency } from '../../utils/currency';
import { useSystem } from '../../context/SystemContext';

interface CarryForwardRecord {
    id: string;
    studentId: string;
    amount: string;
    academicYear: string;
    createdAt: string;
    student: {
        id: string;
        firstName: string;
        lastName: string;
        admissionNo: string;
        class?: { name: string };
    };
}

const CarryForwardHistoryPage = () => {
    const [history, setHistory] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [total, setTotal] = useState(0);
    const [totalAmount, setTotalAmount] = useState(0);
    const [page, setPage] = useState(1);
    const [searchQuery, setSearchQuery] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');
    const [deletingId, setDeletingId] = useState<string | null>(null);
    const { showSuccess, showError } = useToast();
    const navigate = useNavigate();
    const { settings } = useSystem();

    const limit = 20;

    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearch(searchQuery);
        }, 500);
        return () => clearTimeout(timer);
    }, [searchQuery]);

    useEffect(() => {
        fetchHistory();
    }, [page, debouncedSearch]);

    const fetchHistory = async () => {
        try {
            setLoading(true);
            const data = await api.listCarryForwards({
                page,
                limit,
                search: debouncedSearch
            });
            setHistory(data.items || []);
            setTotal(data.total || 0);

            const amount = (data.items || []).reduce((acc: number, curr: any) => acc + parseFloat(curr.amount), 0);
            setTotalAmount(amount);
        } catch (error) {
            showError('Failed to fetch carry forward history');
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteClick = async (record: any) => {
        if (!window.confirm('Are you sure you want to delete this record? This will reverse the opening balance.')) return;

        setDeletingId(record.id);
        try {
            await api.deleteCarryForward(record.id);
            showSuccess('Record deleted successfully');
            fetchHistory();
        } catch (error) {
            showError('Failed to delete record');
        } finally {
            setDeletingId(null);
        }
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-500 pb-10">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-black text-gray-900 dark:text-white uppercase tracking-tighter">History</h1>
                    <p className="text-gray-500 dark:text-gray-400 text-[10px] font-bold uppercase tracking-widest">Audit logs of balance transfers</p>
                </div>
                <div className="flex items-center gap-2">
                  <div className="bg-white dark:bg-gray-800 px-4 py-2 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm flex items-center gap-3">
                    <p className="text-[10px] font-black text-gray-400 uppercase">Total Carried</p>
                    <p className="text-sm font-black text-primary-600">{formatCurrency(totalAmount)}</p>
                  </div>
                  <button
                      onClick={() => navigate('/finance/carry-forward')}
                      className="px-4 py-2 rounded-xl text-xs font-black text-white bg-gray-900 dark:bg-gray-700 hover:opacity-90 transition-all uppercase tracking-widest flex items-center gap-2"
                  >
                      <ArrowLeft size={14} />
                      Back to Table
                  </button>
                </div>
            </div>

            {/* Search */}
            <div className="relative group max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-hover:text-primary-500 transition-colors" size={16} />
                <input
                    type="text"
                    placeholder="Search history records..."
                    className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-xl text-sm focus:ring-2 focus:ring-primary-500 transition-all"
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                />
            </div>

            {/* Minimal History Table */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-gray-50/50 dark:bg-gray-900/50 border-b border-gray-100 dark:border-gray-700">
                                <th className="px-6 py-3 text-[10px] font-black text-gray-400 uppercase tracking-widest">Date</th>
                                <th className="px-6 py-3 text-[10px] font-black text-gray-400 uppercase tracking-widest">Student</th>
                                <th className="px-6 py-3 text-[10px] font-black text-gray-400 uppercase tracking-widest">Session</th>
                                <th className="px-6 py-3 text-[10px] font-black text-gray-400 uppercase tracking-widest">Fee Head</th>
                                <th className="px-6 py-3 text-[10px] font-black text-gray-400 uppercase tracking-widest">Amount</th>
                                <th className="px-6 py-3 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50 dark:divide-gray-700">
                            {loading ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-12 text-center text-gray-400 text-xs font-medium italic">Loading history...</td>
                                </tr>
                            ) : history.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-20 text-center text-gray-400">
                                        <History size={48} className="mx-auto mb-3 opacity-20" />
                                        <p className="text-sm font-medium">No history found</p>
                                    </td>
                                </tr>
                            ) : history.map((record) => (
                                <tr key={record.id} className="hover:bg-gray-50/30 dark:hover:bg-gray-700/30 transition-colors">
                                    <td className="px-6 py-3">
                                        <p className="text-[10px] font-bold text-gray-500 uppercase">{formatDateLocal(record.createdAt)}</p>
                                        <p className="text-[9px] text-gray-400">{formatTimeLocal(record.createdAt)}</p>
                                    </td>
                                    <td className="px-6 py-3">
                                        <div>
                                            <p className="text-sm font-bold text-gray-900 dark:text-white">{record.student?.firstName} {record.student?.lastName}</p>
                                            <p className="text-[10px] text-gray-400 font-bold uppercase">{record.student?.admissionNo}</p>
                                        </div>
                                    </td>
                                    <td className="px-6 py-3">
                                        <div className="inline-flex items-center px-2 py-0.5 rounded-full bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 text-[10px] font-black uppercase tracking-widest border border-blue-100 dark:border-blue-800">
                                            {record.academicYear}
                                        </div>
                                    </td>
                                    <td className="px-6 py-3">
                                        <p className="text-sm font-medium text-gray-600 dark:text-gray-300">{record.feeHead?.name || 'Opening Balance'}</p>
                                    </td>
                                    <td className="px-6 py-3">
                                        <p className="text-sm font-black text-gray-900 dark:text-white">{formatCurrency(parseFloat(record.amount))}</p>
                                    </td>
                                    <td className="px-6 py-3 text-right">
                                        <button
                                            onClick={() => handleDeleteClick(record)}
                                            disabled={deletingId === record.id}
                                            className="p-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-all disabled:opacity-50"
                                            title="Revert Transfer"
                                        >
                                            {deletingId === record.id ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                {/* Pagination */}
                <div className="p-4 bg-gray-50/30 dark:bg-gray-700/10 flex justify-between items-center">
                   <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{total} Records</p>
                   <div className="flex items-center gap-2">
                      <button disabled={page === 1} onClick={() => setPage(page-1)} className="p-1 text-gray-400 disabled:opacity-20"><ChevronLeft size={18} /></button>
                      <span className="text-xs font-black text-gray-400">{page}</span>
                      <button disabled={page >= Math.ceil(total / limit)} onClick={() => setPage(page+1)} className="p-1 text-gray-400 disabled:opacity-20"><ChevronRight size={18} /></button>
                   </div>
                </div>
            </div>
        </div>
    );
};

export default CarryForwardHistoryPage;
