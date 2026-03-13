import React, { useState, useEffect } from 'react';

import {
    Search,
    CreditCard,
    Banknote,
    FileText,
    Printer,
    CheckCircle2,
    SearchX,
    Loader2,
    X
} from 'lucide-react';
import api from '../../services/api';
import { useToast } from '../../context/ToastContext';

import { formatCurrency, CURRENCY_SYMBOL } from '../../utils/currency';
import { clsx } from 'clsx';
import { createRoot } from 'react-dom/client';
import { ReceiptTemplate } from './components/ReceiptTemplate';

const scrollbarHideStyle = `
  .scrollbar-none::-webkit-scrollbar {
    display: none;
  }
  .scrollbar-none {
    -ms-overflow-style: none;
    scrollbar-width: none;
  }
  input::-webkit-outer-spin-button,
  input::-webkit-inner-spin-button {
    -webkit-appearance: none;
    margin: 0;
  }
  input[type=number] {
    -moz-appearance: textfield;
  }
`;

interface Student {
    id: string;
    firstName: string;
    lastName: string;
    admissionNo: string;
    studentPhoto?: string;
    class?: { id: string; name: string };
    section?: { id: string; name: string };
    fatherName?: string;
    dob?: string;
    mobileNumber?: string;
}

interface FinancialStatement {
    student: Student;
    totalDue: string;
    totalPaid: string;
    balance: string;
    assignedHeads: any[];
    transactions: any[];
}

export default function RecordPaymentPage() {
    const { showError, showSuccess } = useToast();

    const [keyword, setKeyword] = useState('');
    const [debouncedKeyword, setDebouncedKeyword] = useState('');

    // Table State
    const [students, setStudents] = useState<Student[]>([]);
    const [loading, setLoading] = useState(false);
    const [hasSearched, setHasSearched] = useState(false);

    // Fee Collection Modal State
    const [showCollectionModal, setShowCollectionModal] = useState(false);
    const [activeStudent, setActiveStudent] = useState<Student | null>(null);
    const [statement, setStatement] = useState<FinancialStatement | null>(null);
    const [loadingStatement, setLoadingStatement] = useState(false);

    // Payment Form State
    const [amount, setAmount] = useState('');
    const [paymentMethod, setPaymentMethod] = useState('CASH');
    const [reference, setReference] = useState('');
    const [note, setNote] = useState('');
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [processing, setProcessing] = useState(false);
    const [lastTransaction, setLastTransaction] = useState<any>(null);
    const [transactionType, setTransactionType] = useState<'FEE_PAYMENT' | 'WAIVER'>('FEE_PAYMENT');
    const [headAllocations, setHeadAllocations] = useState<Record<string, string>>({});

    // Debounce keyword
    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedKeyword(keyword);
        }, 500);
        return () => clearTimeout(timer);
    }, [keyword]);

    // Trigger search when debounced keyword changes
    useEffect(() => {
        if (debouncedKeyword.trim().length >= 2) {
            handleSearch();
        } else if (debouncedKeyword.trim().length === 0) {
            setStudents([]);
            setHasSearched(false);
        }
    }, [debouncedKeyword]);

    const handleSearch = async () => {
        setLoading(true);
        setHasSearched(true);
        try {
            const results = await api.getStudents({ keyword: debouncedKeyword });
            setStudents(results as any);
        } catch (error) {
            showError('Search failed');
        } finally {
            setLoading(false);
        }
    };

    const openCollectionModal = async (student: Student) => {
        setActiveStudent(student);
        setShowCollectionModal(true);
        setLoadingStatement(true);
        try {
            const data = await api.getStudentStatement(student.id);
            setStatement(data);
            setAmount('0'); // Default to zero for safety

            // Initialize allocations with zero
            const initialAllocations: Record<string, string> = {};
            if (data.assignedHeads) {
                data.assignedHeads.forEach((h: any) => {
                    initialAllocations[h.id] = '0';
                });
            }
            setHeadAllocations(initialAllocations);
        } catch (error) {
            showError('Failed to load student financial statement');
            setShowCollectionModal(false);
        } finally {
            setLoadingStatement(false);
        }
    };



    const handleHeadAmountChange = (headId: string, val: string) => {
        if (!statement) return;
        const head = statement.assignedHeads.find(h => h.id === headId);
        if (!head) return;

        let numVal = parseFloat(val) || 0;
        const limit = parseFloat(head.balance || head.amount);

        // Prevent exceeding the limit
        if (numVal > limit) {
            val = limit.toString();
        }

        const newAllocations = { ...headAllocations, [headId]: val };
        setHeadAllocations(newAllocations);

        // Sync total amount
        const total = Object.values(newAllocations).reduce((acc, curr) => acc + (parseFloat(curr) || 0), 0);
        setAmount(total.toFixed(2));
    };

    const handlePaymentSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!activeStudent || !statement) return;

        const paymentAmount = parseFloat(amount);
        const balance = parseFloat(statement.balance);

        if (isNaN(paymentAmount) || paymentAmount <= 0) {
            showError('Please enter a valid amount');
            return;
        }

        if (paymentAmount > balance + 0.01) { // 1 cent grace for rounding
            showError(`Amount exceeds balance (${formatCurrency(balance)})`);
            return;
        }

        setProcessing(true);
        try {
            // Prepare allocations for the API
            const allocations = statement.assignedHeads.map(h => {
                const paidNow = parseFloat(headAllocations[h.id] || '0');
                const outstandingBefore = parseFloat(h.balance || '0');
                const remainingAfter = outstandingBefore - paidNow;

                return {
                    id: h.id,
                    name: h.name,
                    amount: paidNow.toString(),
                    totalDue: outstandingBefore.toString(), // Outstanding before this payment
                    balance: remainingAfter.toString(),      // Remaining after this payment
                    status: remainingAfter > 0 ? 'PARTIAL' : 'PAID'
                };
            }).filter(a => parseFloat(a.amount) > 0);

            const res = await api.recordPayment({
                studentId: activeStudent.id,
                amount,
                paymentMethod: transactionType === 'WAIVER' ? 'CASH' : paymentMethod, // Default cash if waiver
                reference,
                type: transactionType,
                meta: {
                    note,
                    collectedAt: date,
                    allocations: allocations.length > 0 ? allocations : undefined
                },
            });

            showSuccess(transactionType === 'WAIVER' ? 'Waiver granted successfully' : 'Payment recorded successfully');
            // Handle response which may be an array of transactions (split by fee head)
            const resultData = Array.isArray(res) ? res : [res];
            const consolidatedTx = {
                ...resultData[0],
                amount, // Use the total input amount for the receipt/modal display
                student: activeStudent,
                createdAt: new Date().toISOString(),
                meta: {
                    ...resultData[0].meta,
                    // Aggregate allocations from all split transactions for the receipt breakdown
                    allocations: resultData.flatMap((tx: any) => tx.meta?.allocations || [])
                }
            };

            setLastTransaction(consolidatedTx);

            // Refresh current statement
            const updatedStatement = await api.getStudentStatement(activeStudent.id);
            setStatement(updatedStatement);
            setAmount('');
            setReference('');
            setNote('');
        } catch (error: any) {
            showError(error.response?.data?.message || 'Failed to record payment');
        } finally {
            setProcessing(false);
        }
    };



    return (
        <div className="max-w-[1600px] mx-auto space-y-6 animate-in fade-in duration-500 pb-20">
            <style>{scrollbarHideStyle}</style>
            {/* Page Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Offline Fee Collection</h1>
                    <p className="text-gray-500 dark:text-gray-400 text-sm italic">Manage manual fee entries and student billing</p>
                </div>
            </div>

            {/* Minimalist Unified Search */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm overflow-hidden">
                <div className="p-6 space-y-4">
                    <div className="flex items-center gap-2">
                        <Search size={16} className="text-primary-500" />
                        <h3 className="text-xs font-bold text-gray-500 underline uppercase tracking-widest">Search Student</h3>
                    </div>

                    <div className="relative group max-w-2xl">
                        <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-gray-400 group-focus-within:text-primary-500">
                            <Search size={18} />
                        </div>
                        <input
                            type="text"
                            placeholder="Ex: John or ADM-101..."
                            className="w-full pl-10 pr-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-100 dark:border-gray-700 focus:border-primary-500 focus:bg-white dark:focus:bg-gray-800 rounded-xl text-sm font-bold text-gray-900 dark:text-white transition-all"
                            value={keyword}
                            onChange={(e) => setKeyword(e.target.value)}
                            autoFocus
                        />
                        {loading && (
                            <div className="absolute right-4 top-1/2 -translate-y-1/2">
                                <Loader2 className="animate-spin text-primary-500" size={16} />
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Student List Table */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm overflow-hidden">


                <div className="overflow-x-auto min-h-[400px]">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-gray-50/40 dark:bg-gray-900/40 border-b border-gray-100/80 dark:border-gray-700">
                                <th className="px-6 py-4 text-[12px] font-bold text-slate-400/80 uppercase tracking-widest">Adm No.</th>
                                <th className="px-6 py-4 text-[12px] font-bold text-slate-400/80 uppercase tracking-widest">Student & Class</th>
                                <th className="px-6 py-4 text-[12px] font-bold text-slate-400/80 uppercase tracking-widest">Father Name</th>
                                <th className="px-6 py-4 text-[12px] font-bold text-slate-400/80 uppercase tracking-widest">DOB</th>
                                <th className="px-6 py-4 text-[12px] font-bold text-slate-400/80 uppercase tracking-widest">Mobile</th>
                                <th className="px-6 py-4 text-[12px] font-bold text-slate-400/80 uppercase tracking-widest text-right">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50 dark:divide-gray-700">
                            {loading ? (
                                Array.from({ length: 5 }).map((_, i) => (
                                    <tr key={i} className="animate-pulse">
                                        <td colSpan={6} className="px-6 py-6">
                                            <div className="h-4 bg-gray-100 dark:bg-gray-700 rounded w-full" />
                                        </td>
                                    </tr>
                                ))
                            ) : students.length > 0 ? (
                                students.map((student) => (
                                    <tr key={student.id} className="group hover:bg-primary-50/30 dark:hover:bg-primary-900/10 transition-colors">
                                        <td className="px-6 py-4">
                                            <span className="text-sm font-bold text-primary-600 dark:text-primary-400">{student.admissionNo}</span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex flex-col">
                                                <span className="font-bold text-gray-900 dark:text-white leading-tight">
                                                    {student.firstName} {student.lastName}
                                                </span>
                                                <span className="text-xs font-bold text-gray-400 uppercase tracking-tighter mt-0.5">
                                                    {student.class?.name || 'Unassigned'} • {student.section?.name || 'No Section'}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-500 font-medium">{student.fatherName || '---'}</td>
                                        <td className="px-6 py-4 text-xs text-gray-400 font-bold">
                                            {student.dob ? new Date(student.dob).toLocaleDateString() : '---'}
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-500 font-medium">{student.mobileNumber || '---'}</td>
                                        <td className="px-6 py-4 text-right">
                                            <button
                                                onClick={() => openCollectionModal(student)}
                                                className="px-4 py-2 text-primary-600 hover:text-white bg-primary-50/50 hover:bg-primary-600 rounded-md text-[11px] font-black transition-all duration-300 border border-primary-100 hover:border-primary-600 flex items-center gap-2 ml-auto uppercase tracking-widest shadow-sm hover:shadow-lg hover:shadow-primary-500/20 hover:-translate-y-0.5 active:translate-y-0 active:scale-95"
                                            >
                                                <CreditCard size={12} />
                                                Collect
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={6} className="px-6 py-20 text-center">
                                        <div className="flex flex-col items-center justify-center opacity-40">
                                            <div className="w-24 h-24 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mb-4">
                                                <SearchX size={48} />
                                            </div>
                                            <h4 className="text-xl font-black uppercase tracking-tighter">No results found</h4>
                                            <p className="text-xs font-bold text-gray-500 mt-2">
                                                {hasSearched ? 'Try searching with different keywords.' : 'Start typing in the search bar to find students.'}
                                            </p>
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Collection Modal */}
            {showCollectionModal && activeStudent && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-in fade-in duration-300">
                    <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-2xl max-w-5xl w-full max-h-[95vh] overflow-hidden border border-white/20 flex flex-col animate-in zoom-in-95 duration-200">
                        {/* Modal Header */}
                        <div className="p-6 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between bg-gradient-to-r from-primary-50 to-white dark:from-gray-900 dark:to-gray-800">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-2xl bg-primary-600 flex items-center justify-center text-white shadow-lg">
                                    <CreditCard size={24} />
                                </div>
                                <div>
                                    <h3 className="text-lg font-black text-gray-900 dark:text-white uppercase tracking-tighter leading-none">Record Fee Payment</h3>
                                    <p className="text-xs text-gray-500 font-bold mt-1">Collecting for: {activeStudent.firstName} {activeStudent.lastName} ({activeStudent.admissionNo})</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-6">
                                <div className="flex bg-gray-100 dark:bg-gray-900 p-1 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-inner">
                                    <button
                                        type="button"
                                        onClick={() => setTransactionType('FEE_PAYMENT')}
                                        className={clsx(
                                            "px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2",
                                            transactionType === 'FEE_PAYMENT'
                                                ? "bg-white dark:bg-gray-800 text-primary-600 shadow-md ring-1 ring-primary-50 dark:ring-primary-900"
                                                : "text-gray-400 hover:text-gray-600"
                                        )}
                                    >
                                        <Banknote size={14} />
                                        Collection
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setTransactionType('WAIVER')}
                                        className={clsx(
                                            "px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2",
                                            transactionType === 'WAIVER'
                                                ? "bg-amber-500 text-white shadow-md shadow-amber-500/20"
                                                : "text-gray-400 hover:text-gray-600"
                                        )}
                                    >
                                        <FileText size={14} />
                                        Waiver
                                    </button>
                                </div>
                                <button onClick={() => setShowCollectionModal(false)} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl text-gray-400 transition-colors">
                                    <X size={24} />
                                </button>
                            </div>
                        </div>

                        <div className="flex-1 overflow-y-auto">
                            {/* 1. Horizontal Financial Dashboard */}
                            <div className="bg-gray-50 dark:bg-gray-900/50 border-b border-gray-100 dark:border-gray-700">
                                <div className="p-8 grid grid-cols-1 md:grid-cols-3 gap-6">
                                    <div className="bg-white dark:bg-gray-800 p-5 rounded-3xl border border-gray-100 dark:border-gray-700 shadow-sm flex items-center gap-4">
                                        <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center text-slate-500">
                                            <FileText size={18} />
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Total Billed</p>
                                            <p className="text-lg font-black text-gray-900 dark:text-white">
                                                {loadingStatement ? '...' : formatCurrency(parseFloat(statement?.totalDue || '0'))}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="bg-white dark:bg-gray-800 p-5 rounded-3xl border border-gray-100 dark:border-gray-700 shadow-sm flex items-center gap-4">
                                        <div className="w-10 h-10 rounded-full bg-green-50 dark:bg-green-900/40 flex items-center justify-center text-green-600">
                                            <CheckCircle2 size={18} />
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Total Paid</p>
                                            <p className="text-lg font-black text-green-600">
                                                {loadingStatement ? '...' : formatCurrency(parseFloat(statement?.totalPaid || '0'))}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="bg-primary-600 p-5 rounded-3xl shadow-lg shadow-primary-500/20 flex items-center gap-4 relative overflow-hidden group">
                                        <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center text-white backdrop-blur-md">
                                            <Banknote size={18} />
                                        </div>
                                        <div className="relative z-10">
                                            <p className="text-[10px] font-bold text-primary-100 uppercase tracking-widest">Net Outstanding</p>
                                            <p className="text-xl font-black text-white">
                                                {loadingStatement ? '...' : formatCurrency(parseFloat(statement?.balance || '0'))}
                                            </p>
                                        </div>
                                        <div className="absolute -right-4 -bottom-4 opacity-10 rotate-12 transition-transform group-hover:scale-110">
                                            <Banknote size={80} />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* 2. Main Workspace Grid */}
                            <div className="p-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
                                {/* Left Column: Statement Workspace (Span 2) */}
                                <div className="lg:col-span-2 space-y-6">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <div className="w-1 bg-primary-600 h-4 rounded-full" />
                                            <h4 className="text-sm font-black text-gray-900 dark:text-white uppercase tracking-tighter">Student Ledger Summary</h4>
                                        </div>
                                    </div>

                                    {loadingStatement ? (
                                        <div className="flex items-center justify-center py-20 bg-gray-50 dark:bg-gray-900/50 rounded-3xl border border-dashed border-gray-200 dark:border-gray-800">
                                            <Loader2 className="animate-spin text-primary-500" size={32} />
                                        </div>
                                    ) : (
                                        <div className="space-y-6">
                                            <div className="bg-white dark:bg-gray-800 rounded-3xl border border-gray-100 dark:border-gray-700 overflow-hidden shadow-sm p-6">
                                                <div className="space-y-4">
                                                    <div className="flex justify-between items-center pb-4 border-b border-gray-100 dark:border-gray-700">
                                                        <span className="text-sm text-gray-500 font-bold uppercase tracking-widest">Current Balance</span>
                                                        <span className="text-2xl font-black text-gray-900 dark:text-white">{formatCurrency(parseFloat(statement?.balance || '0'))}</span>
                                                    </div>

                                                    {/* Fee Breakdown */}
                                                    {statement?.assignedHeads && statement.assignedHeads.length > 0 && (
                                                        <div className="space-y-4 pt-4 border-t border-gray-100 dark:border-gray-800">
                                                            <div className="flex justify-between items-center">
                                                                <p className="text-[10px] font-black text-primary-500 uppercase tracking-widest">Head Allocation</p>
                                                                <button
                                                                    type="button"
                                                                    onClick={() => {
                                                                        const zero: Record<string, string> = {};
                                                                        statement.assignedHeads.forEach(h => zero[h.id] = '0');
                                                                        setHeadAllocations(zero);
                                                                        setAmount('0');
                                                                    }}
                                                                    className="text-[9px] font-bold text-gray-400 hover:text-red-500 uppercase tracking-tighter"
                                                                >
                                                                    Clear All
                                                                </button>
                                                            </div>
                                                            <div className="space-y-3 max-h-[250px] overflow-y-auto pr-2 scrollbar-none">
                                                                {statement.assignedHeads.map((head, idx) => (
                                                                    <div key={idx} className="flex justify-between items-center p-3 bg-gray-50/50 dark:bg-gray-900/30 rounded-2xl border border-gray-100 dark:border-gray-800 focus-within:border-primary-200 transition-colors">
                                                                        <div className="flex flex-col">
                                                                            <span className="font-bold text-gray-700 dark:text-gray-300 text-xs">{head.name}</span>
                                                                            <span className="text-[8px] text-gray-400 uppercase font-black">{head.group}</span>
                                                                            <span className="text-[9px] text-red-500 mt-0.5">Due: {formatCurrency(parseFloat(head.balance))}</span>
                                                                        </div>
                                                                        <div className="relative group">
                                                                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-gray-400 group-focus-within:text-primary-500">
                                                                                {CURRENCY_SYMBOL}
                                                                            </span>
                                                                            <input
                                                                                type="number"
                                                                                step="0.01"
                                                                                className="w-24 pl-6 pr-3 py-1.5 bg-white dark:bg-gray-800 border-none rounded-lg text-xs font-bold text-gray-900 dark:text-white focus:ring-1 focus:ring-primary-500 shadow-sm"
                                                                                value={headAllocations[head.id] || ''}
                                                                                onChange={(e) => handleHeadAmountChange(head.id, e.target.value)}
                                                                                onKeyDown={(e) => {
                                                                                    if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
                                                                                        e.preventDefault();
                                                                                    }
                                                                                }}
                                                                                placeholder="0.00"
                                                                            />
                                                                        </div>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    )}

                                                    <p className="text-xs text-gray-400 italic pt-2 border-t border-gray-50 dark:border-gray-700">Enter the amount to be {transactionType === 'WAIVER' ? 'waived' : 'collected'} in the sidebar to proceed.</p>
                                                </div>
                                            </div>

                                            {/* Transaction History (Small preview) */}
                                            <div className="space-y-3">
                                                <div className="flex items-center justify-between px-1">
                                                    <h5 className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Recent Transactions</h5>
                                                    <span className="text-[9px] font-bold text-primary-500 uppercase tracking-tighter">Last 5 entries</span>
                                                </div>
                                                <div className="bg-white dark:bg-gray-800 rounded-3xl border border-gray-100 dark:border-gray-700 overflow-hidden shadow-sm">
                                                    <table className="w-full text-left">
                                                        <thead className="bg-gray-50/50 dark:bg-gray-900/50 border-b border-gray-100 dark:border-gray-700">
                                                            <tr>
                                                                <th className="px-6 py-3 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Details</th>
                                                                <th className="px-6 py-3 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Method</th>
                                                                <th className="px-6 py-3 text-[10px] font-bold text-gray-400 uppercase tracking-widest text-right">Amount</th>
                                                            </tr>
                                                        </thead>
                                                        <tbody className="divide-y divide-gray-50 dark:divide-gray-700">
                                                            {statement?.transactions.slice(0, 5).map((tx: any) => (
                                                                <tr key={tx.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-900/50 transition-colors">
                                                                    <td className="px-6 py-3">
                                                                        <div className="flex flex-col">
                                                                            <span className="text-[10px] font-black text-gray-900 dark:text-white uppercase leading-none">{tx.reference || 'NO REF'}</span>
                                                                            <span className="text-[9px] text-gray-400 font-bold mt-1">{new Date(tx.createdAt).toLocaleDateString()}</span>
                                                                        </div>
                                                                    </td>
                                                                    <td className="px-6 py-3">
                                                                        <span className={clsx(
                                                                            "px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-tighter ring-1 ring-inset",
                                                                            tx.type === 'WAIVER'
                                                                                ? "bg-amber-50 text-amber-600 ring-amber-500/20"
                                                                                : tx.type === 'REFUND'
                                                                                    ? "bg-red-50 text-red-600 ring-red-500/20"
                                                                                    : "bg-primary-50 text-primary-600 ring-primary-500/20"
                                                                        )}>
                                                                            {tx.type === 'REFUND' ? 'REFUND' : tx.paymentMethod || 'CASH'}
                                                                        </span>
                                                                    </td>
                                                                    <td className={clsx("px-6 py-3 text-xs font-black text-right",
                                                                        tx.type === 'WAIVER' ? "text-amber-600" :
                                                                            tx.type === 'REFUND' ? "text-red-600 font-black" :
                                                                                "text-primary-600")}>
                                                                        {tx.type === 'REFUND' && <span className="mr-1 text-[8px] font-black">REF</span>}
                                                                        {formatCurrency(Math.abs(parseFloat(tx.amount)))}
                                                                        {tx.type === 'WAIVER' && <span className="ml-1 text-[8px] font-black text-amber-500/40 opacity-70">WV</span>}
                                                                    </td>
                                                                </tr>
                                                            ))}
                                                        </tbody>
                                                    </table>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Right Column: Payment Details Sidebar */}
                                <div className="space-y-6">
                                    <div className="bg-gray-50 dark:bg-gray-900/50 p-6 rounded-3xl border border-gray-100 dark:border-gray-800 space-y-6 sticky top-0">
                                        <form onSubmit={handlePaymentSubmit} className="space-y-6">
                                            {/* Total To Post Display */}
                                            <div className={clsx(
                                                "p-6 rounded-2xl border shadow-sm relative overflow-hidden transition-colors",
                                                transactionType === 'WAIVER'
                                                    ? "bg-amber-50 dark:bg-amber-900/20 border-amber-100 dark:border-amber-900/50"
                                                    : "bg-white dark:bg-gray-800 border-primary-100 dark:border-primary-900/50"
                                            )}>
                                                <div className="relative z-10 text-center">
                                                    <p className={clsx(
                                                        "text-[10px] font-black uppercase tracking-widest mb-1",
                                                        transactionType === 'WAIVER' ? "text-amber-600" : "text-primary-500"
                                                    )}>
                                                        {transactionType === 'WAIVER' ? 'Total Amount to Waive' : 'Total Amount to record'}
                                                    </p>
                                                    <input
                                                        type="number"
                                                        step="0.01"
                                                        className={clsx(
                                                            "w-full bg-transparent text-center text-3xl font-black border-none focus:ring-0 p-0",
                                                            transactionType === 'WAIVER' ? "text-amber-600" : "text-primary-600 dark:text-primary-400"
                                                        )}
                                                        value={amount}
                                                        onChange={(e) => {
                                                            setAmount(e.target.value);
                                                            // If they manually change total, we clear allocations to reflect it's a general payment
                                                            setHeadAllocations({});
                                                        }}
                                                        onKeyDown={(e) => {
                                                            if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
                                                                e.preventDefault();
                                                            }
                                                        }}
                                                        placeholder="0.00"
                                                    />
                                                </div>
                                                {transactionType === 'WAIVER' ? (
                                                    <FileText className="absolute -left-2 -bottom-2 text-amber-600/5 -rotate-12" size={80} />
                                                ) : (
                                                    <Banknote className="absolute -left-2 -bottom-2 text-primary-600/5 -rotate-12" size={80} />
                                                )}
                                            </div>

                                            <div className="space-y-4">
                                                {transactionType === 'FEE_PAYMENT' && (
                                                    <div className="space-y-2">
                                                        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Payment Method</label>
                                                        <select
                                                            className="w-full px-4 py-3 bg-white dark:bg-gray-800 border-none rounded-xl text-sm font-bold focus:ring-2 focus:ring-primary-500 shadow-sm transition-all"
                                                            value={paymentMethod}
                                                            onChange={(e) => setPaymentMethod(e.target.value)}
                                                        >
                                                            <option value="CASH">Cash</option>
                                                            <option value="BANK_TRANSFER">Bank Transfer</option>
                                                            <option value="POS">POS</option>
                                                            <option value="ONLINE">Online Portal</option>
                                                        </select>
                                                    </div>
                                                )}

                                                <div className="space-y-2">
                                                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Transaction Date</label>
                                                    <input
                                                        type="date"
                                                        className="w-full px-4 py-3 bg-white dark:bg-gray-800 border-none rounded-xl text-sm font-bold focus:ring-2 focus:ring-primary-500 shadow-sm transition-all"
                                                        value={date}
                                                        onChange={(e) => setDate(e.target.value)}
                                                    />
                                                </div>

                                                {transactionType === 'FEE_PAYMENT' && (
                                                    <div className="space-y-2">
                                                        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Reference / Receipt Number</label>
                                                        <input
                                                            type="text"
                                                            className="w-full px-4 py-3 bg-white dark:bg-gray-800 border-none rounded-xl text-sm font-medium focus:ring-2 focus:ring-primary-500 shadow-sm transition-all placeholder:text-gray-300"
                                                            placeholder="E.g. Bank Ref #, Receipt No..."
                                                            value={reference}
                                                            onChange={(e) => setReference(e.target.value)}
                                                        />
                                                    </div>
                                                )}

                                                <div className="space-y-2">
                                                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Internal Remarks</label>
                                                    <textarea
                                                        className="w-full px-4 py-3 bg-white dark:bg-gray-800 border-none rounded-xl text-sm font-medium focus:ring-2 focus:ring-primary-500 h-24 shadow-sm transition-all placeholder:text-gray-300"
                                                        placeholder="Add a private note regarding this transaction..."
                                                        value={note}
                                                        onChange={(e) => setNote(e.target.value)}
                                                    />
                                                </div>
                                            </div>

                                            <button
                                                type="submit"
                                                disabled={processing || !amount || parseFloat(amount) <= 0}
                                                className={clsx(
                                                    "w-full py-5 text-white rounded-2xl text-base font-black uppercase tracking-widest shadow-xl transition-all transform active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-3 mt-4",
                                                    transactionType === 'WAIVER'
                                                        ? "bg-amber-600 shadow-amber-500/20 hover:bg-amber-700"
                                                        : "bg-primary-600 shadow-primary-500/20 hover:bg-primary-700"
                                                )}
                                            >
                                                {processing ? <Loader2 className="animate-spin" size={20} /> : (
                                                    <>
                                                        <CheckCircle2 size={20} />
                                                        {transactionType === 'WAIVER' ? 'Grant Waiver' : 'Post Payment'}
                                                    </>
                                                )}
                                            </button>
                                        </form>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Success Modal */}
            {lastTransaction && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80 backdrop-blur-lg animate-in fade-in duration-300">
                    <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-2xl max-w-md w-full overflow-hidden border border-white/20 animate-in zoom-in-95 duration-200">
                        <div className="p-8 text-center space-y-6">
                            <div className="w-24 h-24 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center text-green-600 mx-auto border-8 border-green-50 dark:border-green-900/10 shadow-lg" >
                                <CheckCircle2 size={48} />
                            </div>
                            <div className="space-y-2" >
                                <h3 className="text-3xl font-black text-gray-900 dark:text-white uppercase tracking-tighter" > {lastTransaction.type === 'WAIVER' ? 'WAIVER GRANTED!' : 'SUCCESSFUL!'}</h3>
                                <p className="text-sm font-bold text-gray-500 uppercase" > {lastTransaction.type === 'WAIVER' ? 'The fee adjustment has been applied to the ledger.' : 'Payment has been recorded in the ledger.'}</p>
                            </div>

                            <div className="bg-gray-50 dark:bg-gray-900 p-6 rounded-2xl border border-gray-100 dark:border-gray-700 space-y-4" >
                                <div className="flex justify-between items-center text-[10px] font-black text-gray-400 uppercase tracking-widest" >
                                    <span>Student</span>
                                    <span className="text-sm font-bold text-gray-900 dark:text-white" > {lastTransaction.student.firstName} {lastTransaction.student.lastName}</span>
                                </div>
                                <div className="flex justify-between items-center text-[10px] font-black text-gray-400 uppercase tracking-widest pt-2 border-t border-gray-200 dark:border-gray-700" >
                                    <span>{lastTransaction.type === 'WAIVER' ? 'Amount Waived' : 'Amount Credited'}</span>
                                    <span className={clsx(
                                        "text-2xl font-black",
                                        lastTransaction.type === 'WAIVER' ? "text-amber-600" : "text-primary-600"
                                    )} > {formatCurrency(parseFloat(lastTransaction.amount))}</span>
                                </div>
                            </div>

                            <div className="flex flex-col gap-3" >
                                <button
                                    onClick={() => handlePrintReceipt(lastTransaction)}
                                    className="w-full py-4 bg-gray-900 dark:bg-primary-600 text-white rounded-2xl font-black uppercase tracking-widest shadow-xl hover:bg-black dark:hover:bg-primary-700 transition-all flex items-center justify-center gap-3"
                                >
                                    <Printer size={20} />
                                    Print Receipt
                                </button>
                                <button
                                    onClick={() => { setLastTransaction(null); setShowCollectionModal(false); }}
                                    className="w-full py-4 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-white rounded-2xl font-bold uppercase tracking-widest hover:bg-gray-200 transition-all"
                                >
                                    Return to Dashboard
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

const handlePrintReceipt = (transaction: any) => {
    // Get school info
    const schoolInfo = {
        name: 'Minerva Academy Int\'l',
        address: '45 Wisdom Way, Victoria Island, Lagos',
        phone: '+234 800 MINERVA',
        email: 'bursar@minerva.edu',
        logo: 'https://img.freepik.com/free-vector/school-logo-template-design_23-2149635603.jpg'
    };

    const receiptDiv = document.createElement('div');
    receiptDiv.style.display = 'none';
    document.body.appendChild(receiptDiv);

    const root = createRoot(receiptDiv);
    root.render(<ReceiptTemplate transaction={transaction} schoolInfo={schoolInfo} />);

    // Wait for render to commit to DOM
    setTimeout(() => {
        const html = receiptDiv.innerHTML;
        root.unmount();
        document.body.removeChild(receiptDiv);

        if (!html || html.length < 100) {
            alert("Error generating receipt content. Please try again.");
            return;
        }

        const printWindow = window.open('', '_blank');
        if (!printWindow) return;

        printWindow.document.write(`
            <html>
                <head>
                    <title>Payment Receipt - ${transaction.id}</title>
                    <script src="https://cdn.tailwindcss.com"></script>
                    <style>
                        @media print {
                            body { margin: 0; padding: 0; overflow: visible !important; }
                            html { height: auto !important; overflow: visible !important; }
                        }
                        body { margin: 0; font-family: sans-serif; overflow: visible !important; background: white; }
                        * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
                    </style>
                </head>
                <body>
                    <div class="print-container">
                        ${html}
                    </div>
                    <script>
                        window.onload = () => {
                            // Give Tailwind CDN extra time
                            setTimeout(() => {
                                window.print();
                                window.close();
                            }, 1000);
                        };
                    </script>
                </body>
            </html>
        `);
        printWindow.document.close();
    }, 1200);
};
