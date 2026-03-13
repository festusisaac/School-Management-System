import React, { useState, useEffect } from 'react';
import {
    Users,
    Search,
    Filter,
    Plus,
    Download,
    Eye,
    CheckCircle,
    XCircle,
    Trash2,
    Printer,
    DownloadCloud,
    Layers,
    FileSpreadsheet,
    History,
    Banknote,
    Calendar,
    CreditCard,
    ArrowRight,
} from 'lucide-react';
import { formatCurrency, currencyToWords } from '../../utils/currency';
import api from '../../services/api';
import { format } from 'date-fns';
import { useToast } from '../../context/ToastContext';

interface PayrollRecord {
    id: string;
    staffId: string;
    month: number;
    year: number;
    basicSalary: number;
    allowances: { name: string; amount: number }[];
    deductions: { name: string; amount: number }[];
    grossSalary: number;
    netSalary: number;
    workingDays: number;
    presentDays: number;
    absentDays: number;
    leaveDays: number;
    paymentDate: string | null;
    paymentMethod: string | null;
    status: 'Pending' | 'Processed' | 'Paid' | 'Cancelled';
    remarks: string;
    staff: {
        firstName: string;
        lastName: string;
        employeeId: string;
        photo: string;
        designation?: { title: string };
        department?: { name: string };
        bankName?: string;
        accountNumber?: string;
        accountTitle?: string;
    };
    createdAt: string;
}

const PayrollPage: React.FC = () => {
    const [payrolls, setPayrolls] = useState<PayrollRecord[]>([]);
    const [staffList, setStaffList] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [showGenModal, setShowGenModal] = useState(false);
    const [showSlipModal, setShowSlipModal] = useState(false);
    const [selectedPayroll, setSelectedPayroll] = useState<PayrollRecord | null>(null);
    const toast = useToast();

    // Filters
    const [month, setMonth] = useState(new Date().getMonth() + 1);
    const [year, setYear] = useState(new Date().getFullYear());
    const [search, setSearch] = useState('');

    // Generation Form State
    const [genForm, setGenForm] = useState({
        staffId: '',
        month: new Date().getMonth() + 1,
        year: new Date().getFullYear(),
        workingDays: 22 as number | string,
        presentDays: 22 as number | string,
        leaveDays: 0 as number | string,
        allowances: [] as { name: string; amount: number }[],
        deductions: [] as { name: string; amount: number }[],
        basicSalary: 0,
        remarks: ''
    });

    const months = [
        "January", "February", "March", "April", "May", "June",
        "July", "August", "September", "October", "November", "December"
    ];

    const years = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - 2 + i);

    useEffect(() => {
        fetchPayrolls();
        fetchStaff();
    }, [month, year]);

    const fetchPayrolls = async () => {
        try {
            setLoading(true);
            const data = await api.getPayrolls({ month, year });
            setPayrolls(data);
        } catch (error) {
            console.error('Error fetching payrolls:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchStaff = async () => {
        try {
            const data = await api.getStaff();
            setStaffList(data);
        } catch (error) {
            console.error('Error fetching staff:', error);
        }
    };

    const handleStaffChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const staffId = e.target.value;
        const staff = staffList.find(s => s.id === staffId);
        if (staff) {
            setGenForm({
                ...genForm,
                staffId,
                basicSalary: Number(staff.basicSalary),
                allowances: staff.allowances || [],
                deductions: staff.deductions || [],
                // Attendance will be auto-calculated by backend if left as default
            });
        }
    };

    const handleBulkGenerate = async () => {
        if (!window.confirm(`Generate payroll for ALL active staff for ${months[month - 1]} ${year}?`)) return;
        try {
            setLoading(true);
            const result = await api.bulkCreatePayroll({ month, year });
            toast.showSuccess(`Generated: ${result.generated}, Skipped: ${result.skipped}`);
            fetchPayrolls();
        } catch (error: any) {
            toast.showError(error.response?.data?.message || 'Error in bulk generation');
        } finally {
            setLoading(false);
        }
    };

    const handleExportCSV = () => {
        if (payrolls.length === 0) return toast.showWarning('No records to export');

        const headers = ['Staff Name', 'Employee ID', 'Month', 'Year', 'Basic Salary', 'Gross Salary', 'Net Salary', 'Status'];
        const rows = payrolls.map(p => [
            `${p.staff.firstName} ${p.staff.lastName}`,
            p.staff.employeeId,
            months[p.month - 1],
            p.year,
            p.basicSalary,
            p.grossSalary,
            p.netSalary,
            p.status
        ]);

        const csvContent = [headers, ...rows].map(e => e.join(",")).join("\n");
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement("a");
        const url = URL.createObjectURL(blob);
        link.setAttribute("href", url);
        link.setAttribute("download", `Payroll_${months[month - 1]}_${year}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const handleGenerate = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const dataToSubmit = {
                ...genForm,
                workingDays: genForm.workingDays === '' ? undefined : Number(genForm.workingDays),
                presentDays: genForm.presentDays === '' ? undefined : Number(genForm.presentDays),
                leaveDays: genForm.leaveDays === '' ? undefined : Number(genForm.leaveDays),
            };
            await api.createPayroll(dataToSubmit);
            setShowGenModal(false);
            fetchPayrolls();
        } catch (error: any) {
            toast.showError(error.response?.data?.message || 'Error generating payroll');
        }
    };

    const handleUpdateStatus = async (id: string, status: string) => {
        if (!window.confirm(`Are you sure you want to mark this payroll as ${status}?`)) return;
        try {
            await api.updatePayrollStatus(id, { status });
            fetchPayrolls();
            if (selectedPayroll?.id === id) {
                const updated = await api.getPayrollById(id);
                setSelectedPayroll(updated);
            }
        } catch (error) {
            console.error('Error updating status:', error);
        }
    };

    const handleDelete = async (id: string) => {
        if (!window.confirm('Are you sure you want to delete this payroll record?')) return;
        try {
            await api.deletePayroll(id);
            fetchPayrolls();
        } catch (error) {
            console.error('Error deleting payroll:', error);
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'Paid': return 'bg-green-100 text-green-700 border-green-200';
            case 'Processed': return 'bg-blue-100 text-primary-700 border-blue-200';
            case 'Pending': return 'bg-yellow-100 text-yellow-700 border-yellow-200';
            case 'Cancelled': return 'bg-red-100 text-red-700 border-red-200';
            default: return 'bg-gray-100 text-gray-700 border-gray-200';
        }
    };

    const filteredPayrolls = payrolls.filter(p =>
        `${p.staff.firstName} ${p.staff.lastName}`.toLowerCase().includes(search.toLowerCase()) ||
        p.staff.employeeId.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div className="p-6 bg-gray-50 dark:bg-gray-900 min-h-screen transition-colors duration-300">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                <div>
                    <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white flex items-center gap-3">
                        <Banknote className="p-2 bg-primary-600 text-white rounded-lg shadow-lg shadow-primary-500/30" size={40} />
                        Payroll Management
                    </h1>
                    <p className="text-gray-500 dark:text-gray-400 mt-1">Manage staff salaries, allowances, and generate payslips</p>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        onClick={handleBulkGenerate}
                        className="flex items-center justify-center gap-2 bg-white dark:bg-gray-800 border-2 border-primary-600 text-primary-600 dark:text-primary-400 hover:bg-primary-50 dark:hover:bg-blue-900/30 px-6 py-3 rounded-xl font-bold transition-all transform hover:scale-[1.02] active:scale-[0.98]"
                    >
                        <Layers size={20} />
                        Bulk Generate
                    </button>
                    <button
                        onClick={() => setShowGenModal(true)}
                        className="flex items-center justify-center gap-2 bg-primary-600 hover:bg-primary-700 text-white px-6 py-3 rounded-xl font-bold shadow-lg shadow-primary-500/30 transition-all transform hover:scale-[1.02] active:scale-[0.98]"
                    >
                        <Plus size={20} />
                        Generate Payroll
                    </button>
                </div>
            </div>

            {/* Records List */}
            <div className="space-y-8">
                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                    <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm transition-all duration-300">
                        <p className="text-sm font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-2">Total Payout</p>
                        <h3 className="text-2xl font-black text-gray-900 dark:text-white">
                            {formatCurrency(payrolls.reduce((sum, p) => sum + Number(p.netSalary), 0))}
                        </h3>
                        <div className="mt-2 flex items-center gap-1 text-xs text-primary-600 dark:text-primary-400 font-bold">
                            <Calendar size={12} /> {months[month - 1]} {year}
                        </div>
                    </div>
                    <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm transition-all duration-300">
                        <p className="text-sm font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-2">Total Staff</p>
                        <h3 className="text-2xl font-black text-gray-900 dark:text-white">{payrolls.length}</h3>
                        <div className="mt-2 flex items-center gap-1 text-xs text-green-600 dark:text-green-400 font-bold">
                            Processed Records
                        </div>
                    </div>
                    <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm text-green-600 dark:text-green-400 transition-all duration-300">
                        <p className="text-sm font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-2">Paid</p>
                        <h3 className="text-2xl font-black">{payrolls.filter(p => p.status === 'Paid').length}</h3>
                        <div className="mt-2 flex items-center gap-1 text-xs font-bold">
                            Completed Payments
                        </div>
                    </div>
                    <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm text-yellow-600 dark:text-yellow-400 transition-all duration-300">
                        <p className="text-sm font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-2">Pending</p>
                        <h3 className="text-2xl font-black">{payrolls.filter(p => p.status === 'Pending').length}</h3>
                        <div className="mt-2 flex items-center gap-1 text-xs font-bold">
                            Awaiting Processing
                        </div>
                    </div>
                </div>

                {/* Table View */}
                <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-md overflow-hidden transition-all duration-300">
                    {/* Search & Filters */}
                    <div className="p-6 border-b border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800/50 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                        <div className="relative flex-1 max-w-md">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500" size={18} />
                            <input
                                type="text"
                                placeholder="Search staff name or ID..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="w-full pl-10 pr-4 py-2.5 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-gray-900 dark:text-white rounded-xl outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all"
                            />
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="flex items-center gap-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl px-3 py-1">
                                <Calendar size={16} className="text-gray-400 dark:text-gray-500" />
                                <select
                                    value={month}
                                    onChange={(e) => setMonth(Number(e.target.value))}
                                    className="bg-transparent py-1.5 outline-none font-medium text-gray-700 dark:text-gray-300 text-sm cursor-pointer"
                                >
                                    {months.map((m, i) => <option key={i} value={i + 1} className="dark:bg-gray-800">{m}</option>)}
                                </select>
                                <select
                                    value={year}
                                    onChange={(e) => setYear(Number(e.target.value))}
                                    className="bg-transparent py-1.5 outline-none font-medium text-gray-700 dark:text-gray-300 text-sm border-l dark:border-gray-600 pl-2 cursor-pointer"
                                >
                                    {years.map(y => <option key={y} value={y} className="dark:bg-gray-800">{y}</option>)}
                                </select>
                            </div>
                            <button
                                onClick={handleExportCSV}
                                className="p-2.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 transition-all"
                                title="Export to CSV"
                            >
                                <FileSpreadsheet size={20} />
                            </button>
                        </div>
                    </div>

                    {/* Table */}
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-gray-50 dark:bg-gray-800/50 border-b border-gray-100 dark:border-gray-700">
                                <tr>
                                    <th className="px-6 py-4 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Staff Member</th>
                                    <th className="px-6 py-4 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Basic Salary</th>
                                    <th className="px-6 py-4 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Allowances</th>
                                    <th className="px-6 py-4 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Deductions</th>
                                    <th className="px-6 py-4 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Net Salary</th>
                                    <th className="px-6 py-4 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider text-center">Status</th>
                                    <th className="px-6 py-4 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 dark:divide-gray-700 transition-colors duration-300">
                                {loading ? (
                                    <tr>
                                        <td colSpan={7} className="px-6 py-12 text-center text-gray-400 italic">Loading records...</td>
                                    </tr>
                                ) : filteredPayrolls.length === 0 ? (
                                    <tr>
                                        <td colSpan={7} className="px-6 py-12 text-center text-gray-400">No payroll records found for this period</td>
                                    </tr>
                                ) : filteredPayrolls.map((payroll) => (
                                    <tr key={payroll.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors group">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 flex items-center justify-center font-bold text-sm shadow-sm transition-colors">
                                                    {payroll.staff.firstName[0]}{payroll.staff.lastName[0]}
                                                </div>
                                                <div>
                                                    <p className="font-bold text-gray-900 dark:text-white leading-tight">{payroll.staff.firstName} {payroll.staff.lastName}</p>
                                                    <p className="text-xs text-gray-500 dark:text-gray-400">{payroll.staff.employeeId} • {payroll.staff.designation?.title}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-700 dark:text-gray-300">
                                            {formatCurrency(payroll.basicSalary)}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-green-600 dark:text-green-400 font-bold transition-colors">
                                            +{formatCurrency((payroll.allowances || []).reduce((s, a) => s + Number(a.amount), 0))}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-red-500 dark:text-red-400 font-bold transition-colors">
                                            -{formatCurrency((payroll.deductions || []).reduce((s, d) => s + Number(d.amount), 0))}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap font-black text-gray-900 dark:text-white border-x border-transparent group-hover:bg-gray-100/50 dark:group-hover:bg-gray-800 transition-all">
                                            {formatCurrency(payroll.netSalary)}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-center">
                                            <span className={`px-3 py-1 rounded-full text-xs font-bold border transition-all duration-300 ${getStatusColor(payroll.status)}`}>
                                                {payroll.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <button
                                                    onClick={() => { setSelectedPayroll(payroll); setShowSlipModal(true); }}
                                                    className="p-2 text-gray-400 dark:text-gray-500 hover:text-primary-600 dark:hover:text-primary-500 hover:bg-primary-50 dark:hover:bg-blue-900/30 rounded-lg transition-all"
                                                    title="View Payslip"
                                                >
                                                    <Eye size={18} />
                                                </button>
                                                {payroll.status !== 'Paid' && (
                                                    <>
                                                        <button
                                                            onClick={() => handleUpdateStatus(payroll.id, 'Paid')}
                                                            className="p-2 text-gray-400 dark:text-gray-500 hover:text-green-600 dark:hover:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/30 rounded-lg transition-all"
                                                            title="Mark as Paid"
                                                        >
                                                            <CheckCircle size={18} />
                                                        </button>
                                                        <button
                                                            onClick={() => handleDelete(payroll.id)}
                                                            className="p-2 text-gray-400 dark:text-gray-500 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-all"
                                                            title="Delete"
                                                        >
                                                            <Trash2 size={18} />
                                                        </button>
                                                    </>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* Generate Payroll Modal */}
            {showGenModal && (
                <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4">
                    <div className="fixed inset-0 bg-gray-900/40 dark:bg-black/60 backdrop-blur-sm transition-opacity" onClick={() => setShowGenModal(false)}></div>
                    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto relative animate-in fade-in zoom-in duration-200 border dark:border-gray-700">
                        <div className="p-6 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center sticky top-0 bg-white dark:bg-gray-800 z-10">
                            <div>
                                <h3 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                                    <Plus className="text-primary-600 dark:text-primary-400" /> Generate Payroll Record
                                </h3>
                                <p className="text-sm text-gray-500 dark:text-gray-400">Create a new salary record for a staff member</p>
                            </div>
                            <button onClick={() => setShowGenModal(false)} className="bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 p-2 rounded-full transition-colors text-gray-500 dark:text-gray-400">
                                <Plus className="rotate-45" size={24} />
                            </button>
                        </div>
                        <form onSubmit={handleGenerate} className="p-8 space-y-8">
                            {/* Staff Selection */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <div className="md:col-span-1">
                                    <label className="block text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-2">Select Staff member *</label>
                                    <select
                                        required
                                        value={genForm.staffId}
                                        onChange={handleStaffChange}
                                        className="w-full border border-gray-200 dark:border-gray-600 rounded-xl p-3 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all font-medium"
                                    >
                                        <option value="" className="dark:bg-gray-800">Select Staff</option>
                                        {staffList.map(s => (
                                            <option key={s.id} value={s.id} className="dark:bg-gray-800">{s.firstName} {s.lastName} ({s.employeeId})</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-2">Month</label>
                                    <select
                                        value={genForm.month}
                                        onChange={(e) => setGenForm({ ...genForm, month: Number(e.target.value) })}
                                        className="w-full border border-gray-200 dark:border-gray-600 rounded-xl p-3 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all font-medium"
                                    >
                                        {months.map((m, i) => <option key={i} value={i + 1} className="dark:bg-gray-800">{m}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-2">Year</label>
                                    <select
                                        value={genForm.year}
                                        onChange={(e) => setGenForm({ ...genForm, year: Number(e.target.value) })}
                                        className="w-full border border-gray-200 dark:border-gray-600 rounded-xl p-3 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all font-medium"
                                    >
                                        {years.map(y => <option key={y} value={y} className="dark:bg-gray-800">{y}</option>)}
                                    </select>
                                </div>
                            </div>

                            {/* Attendance & Basic */}
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                                <div>
                                    <label className="block text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-2">Working Days</label>
                                    <input
                                        type="number"
                                        placeholder="Auto"
                                        value={genForm.workingDays}
                                        onChange={(e) => setGenForm({ ...genForm, workingDays: e.target.value })}
                                        className="w-full border border-gray-200 dark:border-gray-600 rounded-xl p-3 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all font-medium"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-2">Present Days</label>
                                    <input
                                        type="number"
                                        placeholder="Auto"
                                        value={genForm.presentDays}
                                        onChange={(e) => setGenForm({ ...genForm, presentDays: e.target.value })}
                                        className="w-full border border-gray-200 dark:border-gray-600 rounded-xl p-3 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all font-medium"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-2">Leave Days</label>
                                    <input
                                        type="number"
                                        placeholder="Auto"
                                        value={genForm.leaveDays}
                                        onChange={(e) => setGenForm({ ...genForm, leaveDays: e.target.value })}
                                        className="w-full border border-gray-200 dark:border-gray-600 rounded-xl p-3 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all font-medium"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-2">Basic Salary</label>
                                    <input
                                        type="number"
                                        value={genForm.basicSalary}
                                        onChange={(e) => setGenForm({ ...genForm, basicSalary: Number(e.target.value) })}
                                        className="w-full border border-gray-200 dark:border-gray-600 rounded-xl p-3 bg-primary-50 dark:bg-primary-900/30 outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all font-bold text-blue-800 dark:text-primary-300"
                                    />
                                </div>
                            </div>

                            {/* Allowances & Deductions */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div className="space-y-4">
                                    <div className="flex justify-between items-center text-green-600 dark:text-green-400">
                                        <h5 className="font-bold flex items-center gap-2"><CreditCard size={16} /> Allowances</h5>
                                        <button
                                            type="button"
                                            onClick={() => setGenForm({ ...genForm, allowances: [...genForm.allowances, { name: '', amount: 0 }] })}
                                            className="text-xs font-black uppercase tracking-tighter hover:underline"
                                        >+ Add New</button>
                                    </div>
                                    <div className="bg-gray-50 dark:bg-gray-700/50 p-4 rounded-2xl border border-gray-100 dark:border-gray-600 space-y-3">
                                        {genForm.allowances.length === 0 && <p className="text-center text-xs text-gray-400 dark:text-gray-500 py-4">No allowances added</p>}
                                        {genForm.allowances.map((a, i) => (
                                            <div key={i} className="flex gap-2">
                                                <input
                                                    placeholder="Name"
                                                    value={a.name}
                                                    onChange={(e) => {
                                                        const newArr = [...genForm.allowances];
                                                        newArr[i].name = e.target.value;
                                                        setGenForm({ ...genForm, allowances: newArr });
                                                    }}
                                                    className="flex-1 text-sm bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 text-gray-900 dark:text-white rounded-lg p-2 outline-none focus:border-primary-500 transition-colors"
                                                />
                                                <input
                                                    type="number"
                                                    placeholder="Amount"
                                                    value={a.amount}
                                                    onChange={(e) => {
                                                        const newArr = [...genForm.allowances];
                                                        newArr[i].amount = Number(e.target.value);
                                                        setGenForm({ ...genForm, allowances: newArr });
                                                    }}
                                                    className="w-24 text-sm bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 text-gray-900 dark:text-white rounded-lg p-2 outline-none focus:border-primary-500 font-bold transition-colors"
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => setGenForm({ ...genForm, allowances: genForm.allowances.filter((_, idx) => idx !== i) })}
                                                    className="p-2 text-red-400 hover:text-red-500"
                                                ><Trash2 size={16} /></button>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                                <div className="space-y-4">
                                    <div className="flex justify-between items-center text-red-500 dark:text-red-400">
                                        <h5 className="font-bold flex items-center gap-2"><CreditCard size={16} /> Deductions</h5>
                                        <button
                                            type="button"
                                            onClick={() => setGenForm({ ...genForm, deductions: [...genForm.deductions, { name: '', amount: 0 }] })}
                                            className="text-xs font-black uppercase tracking-tighter hover:underline"
                                        >+ Add New</button>
                                    </div>
                                    <div className="bg-gray-50 dark:bg-gray-700/50 p-4 rounded-2xl border border-gray-100 dark:border-gray-600 space-y-3">
                                        {genForm.deductions.length === 0 && <p className="text-center text-xs text-gray-400 dark:text-gray-500 py-4">No deductions added</p>}
                                        {genForm.deductions.map((d, i) => (
                                            <div key={i} className="flex gap-2">
                                                <input
                                                    placeholder="Name"
                                                    value={d.name}
                                                    onChange={(e) => {
                                                        const newArr = [...genForm.deductions];
                                                        newArr[i].name = e.target.value;
                                                        setGenForm({ ...genForm, deductions: newArr });
                                                    }}
                                                    className="flex-1 text-sm bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 text-gray-900 dark:text-white rounded-lg p-2 outline-none focus:border-primary-500 transition-colors"
                                                />
                                                <input
                                                    type="number"
                                                    placeholder="Amount"
                                                    value={d.amount}
                                                    onChange={(e) => {
                                                        const newArr = [...genForm.deductions];
                                                        newArr[i].amount = Number(e.target.value);
                                                        setGenForm({ ...genForm, deductions: newArr });
                                                    }}
                                                    className="w-24 text-sm bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 text-gray-900 dark:text-white rounded-lg p-2 outline-none focus:border-primary-500 font-bold transition-colors"
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => setGenForm({ ...genForm, deductions: genForm.deductions.filter((_, idx) => idx !== i) })}
                                                    className="p-2 text-red-400 hover:text-red-500"
                                                ><Trash2 size={16} /></button>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            {/* Summary & Submit */}
                            <div className="bg-primary-600 rounded-2xl p-8 text-white flex flex-col md:flex-row md:items-center justify-between gap-6">
                                <div>
                                    <div className="flex items-center gap-4 mb-2">
                                        <div className="opacity-70 text-sm">Gross: {formatCurrency(genForm.basicSalary + genForm.allowances.reduce((s, a) => s + a.amount, 0))}</div>
                                        <div className="opacity-70 text-sm">Deds: {formatCurrency(genForm.deductions.reduce((s, d) => s + d.amount, 0))}</div>
                                    </div>
                                    <div className="text-xs font-bold uppercase tracking-widest opacity-80 mb-1">Estimated Net Payout</div>
                                    <div className="text-4xl font-black">
                                        {formatCurrency(genForm.basicSalary + genForm.allowances.reduce((s, a) => s + a.amount, 0) - genForm.deductions.reduce((s, d) => s + d.amount, 0))}
                                    </div>
                                </div>
                                <button
                                    type="submit"
                                    className="bg-white dark:bg-gray-100 text-primary-600 px-10 py-4 rounded-xl font-black shadow-xl hover:bg-gray-50 dark:hover:bg-white transition-all flex items-center justify-center gap-2 group"
                                >
                                    Proceed to Generate <ArrowRight className="group-hover:translate-x-1 transition-transform" />
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Payslip Modal */}
            {showSlipModal && selectedPayroll && (
                <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4">
                    <div className="fixed inset-0 bg-gray-900/60 dark:bg-black/80 backdrop-blur-sm transition-opacity" onClick={() => setShowSlipModal(false)}></div>
                    <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-2xl w-full max-w-3xl overflow-hidden relative animate-in fade-in slide-in-from-bottom-4 duration-300 border dark:border-gray-700">
                        {/* Payslip Content Area (Printable) */}
                        <div id="payslip-content" className="p-10 bg-white dark:bg-gray-800 transition-colors">
                            {/* Header */}
                            <div className="flex justify-between items-start mb-12">
                                <div>
                                    <h2 className="text-3xl font-black text-primary-600 dark:text-primary-400 leading-tight uppercase tracking-tighter">Payslip</h2>
                                    <p className="text-gray-400 dark:text-gray-500 font-bold uppercase tracking-widest text-xs mt-1">Earnings Statement</p>
                                </div>
                                <div className="text-right">
                                    <h3 className="text-xl font-black text-gray-900 dark:text-white leading-tight">SMS Admin System</h3>
                                    <p className="text-xs text-gray-400 dark:text-gray-500">Payroll Service Portal</p>
                                    <div className="mt-4 bg-gray-100 dark:bg-gray-700 px-4 py-2 rounded-lg text-sm font-bold inline-block dark:text-gray-300">
                                        {months[selectedPayroll.month - 1]} {selectedPayroll.year}
                                    </div>
                                </div>
                            </div>

                            {/* Employee Info */}
                            <div className="grid grid-cols-2 gap-8 mb-12 p-8 bg-gray-50 dark:bg-gray-700/50 rounded-2xl border border-gray-100 dark:border-gray-700">
                                <div className="space-y-4">
                                    <div>
                                        <p className="text-xs font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-1">Employee Details</p>
                                        <p className="text-lg font-black text-gray-900 dark:text-white">{selectedPayroll.staff.firstName} {selectedPayroll.staff.lastName}</p>
                                        <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">{selectedPayroll.staff.designation?.title} • {selectedPayroll.staff.employeeId}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-1">Bank Information</p>
                                        <p className="text-sm font-bold text-gray-700 dark:text-gray-300">{selectedPayroll.staff.bankName || 'N/A'}</p>
                                        <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">{selectedPayroll.staff.accountNumber || 'N/A'}</p>
                                    </div>
                                </div>
                                <div className="space-y-4 text-right">
                                    <div>
                                        <p className="text-xs font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-1">Attendance Summary</p>
                                        <div className="flex justify-end gap-4 text-sm font-bold">
                                            <div className="text-primary-600 dark:text-primary-400">Work: {selectedPayroll.workingDays}d</div>
                                            <div className="text-green-600 dark:text-green-400">Pres: {selectedPayroll.presentDays}d</div>
                                            <div className="text-red-500 dark:text-red-400">Abs: {selectedPayroll.absentDays}d</div>
                                        </div>
                                    </div>
                                    <div>
                                        <p className="text-xs font-black text-gray-400 uppercase tracking-widest mb-1">Payment Status</p>
                                        <span className={`px-4 py-1.5 rounded-full text-xs font-black border uppercase tracking-wider ${getStatusColor(selectedPayroll.status)}`}>
                                            {selectedPayroll.status}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Earnings & Deductions Tables */}
                            <div className="grid grid-cols-2 gap-10 mb-12">
                                <div>
                                    <h4 className="text-sm font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-4 pb-2 border-b-2 border-green-500/20 text-green-600 dark:text-green-400">Earnings</h4>
                                    <div className="space-y-3">
                                        <div className="flex justify-between text-base font-bold text-gray-700 dark:text-gray-300">
                                            <span>Basic Salary</span>
                                            <span>{formatCurrency(selectedPayroll.basicSalary)}</span>
                                        </div>
                                        {(selectedPayroll.allowances || []).map((a, i) => (
                                            <div key={i} className="flex justify-between text-sm text-gray-600 dark:text-gray-400 font-medium">
                                                <span>{a.name}</span>
                                                <span>+ {formatCurrency(a.amount)}</span>
                                            </div>
                                        ))}
                                        <div className="pt-4 mt-2 border-t border-dashed dark:border-gray-700 flex justify-between text-lg font-black text-gray-900 dark:text-white bg-green-50/50 dark:bg-green-900/20 p-2 rounded-lg">
                                            <span>Total Earnings</span>
                                            <span>{formatCurrency(selectedPayroll.grossSalary)}</span>
                                        </div>
                                    </div>
                                </div>
                                <div>
                                    <h4 className="text-sm font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-4 pb-2 border-b-2 border-red-500/20 text-red-500 dark:text-red-400">Deductions</h4>
                                    <div className="space-y-3">
                                        {(selectedPayroll.deductions || []).length === 0 && (
                                            <p className="text-sm text-gray-400 dark:text-gray-500 font-medium italic">No deductions applied</p>
                                        )}
                                        {(selectedPayroll.deductions || []).map((d, i) => (
                                            <div key={i} className="flex justify-between text-sm text-gray-600 dark:text-gray-400 font-medium">
                                                <span>{d.name}</span>
                                                <span className="text-red-500 dark:text-red-400">- {formatCurrency(d.amount)}</span>
                                            </div>
                                        ))}
                                        {(selectedPayroll.deductions || []).length > 0 && (
                                            <div className="pt-4 mt-2 border-t border-dashed dark:border-gray-700 flex justify-between text-lg font-black text-gray-900 dark:text-white bg-red-50/50 dark:bg-red-900/20 p-2 rounded-lg">
                                                <span>Total Deds</span>
                                                <span className="text-red-500 dark:text-red-400">- {formatCurrency((selectedPayroll.deductions || []).reduce((s, d) => s + Number(d.amount), 0))}</span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Final Amount */}
                            <div className="bg-primary-600 rounded-3xl p-10 text-white relative overflow-hidden">
                                <Banknote className="absolute -right-10 -bottom-10 opacity-10" size={200} />
                                <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                                    <div>
                                        <p className="text-xs font-black uppercase tracking-[0.2em] opacity-80 mb-2 leading-none">Net Payable Amount</p>
                                        <h3 className="text-5xl font-black leading-none italic tracking-tighter">{formatCurrency(selectedPayroll.netSalary)}</h3>
                                        <p className="text-xs font-bold mt-4 italic opacity-70">Amount in words: {currencyToWords(selectedPayroll.netSalary)}</p>
                                    </div>
                                    <div className="text-right text-xs opacity-80 dark:opacity-60 space-y-1">
                                        <p>Processed On: {format(new Date(selectedPayroll.createdAt), 'PPP')}</p>
                                        {selectedPayroll.paymentDate && <p>Paid On: {format(new Date(selectedPayroll.paymentDate), 'PPP')}</p>}
                                        <p>Transaction ID: PAY-{selectedPayroll.id.slice(0, 8).toUpperCase()}</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Modal Actions */}
                        <div className="bg-gray-50 dark:bg-gray-800/80 px-10 py-6 border-t dark:border-gray-700 flex items-center justify-between">
                            <div className="flex gap-3">
                                <button
                                    onClick={() => window.print()}
                                    className="px-6 py-2.5 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-xl font-black text-sm hover:bg-gray-100 dark:hover:bg-gray-600 transition-all shadow-sm flex items-center gap-2"
                                >
                                    <Printer size={16} /> Print Slip
                                </button>
                                <button className="px-6 py-2.5 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-xl font-black text-sm hover:bg-gray-100 dark:hover:bg-gray-600 transition-all shadow-sm flex items-center gap-2">
                                    <DownloadCloud size={16} /> Download PDF
                                </button>
                            </div>
                            <div className="flex gap-4 items-center">
                                {selectedPayroll.status !== 'Paid' && (
                                    <button
                                        onClick={() => handleUpdateStatus(selectedPayroll.id, 'Paid')}
                                        className="px-10 py-3 bg-green-600 hover:bg-green-700 text-white rounded-xl font-black shadow-lg shadow-green-500/30 transition-all"
                                    >
                                        Complete Payment
                                    </button>
                                )}
                                <button
                                    onClick={() => setShowSlipModal(false)}
                                    className="px-8 py-3 bg-gray-900 dark:bg-gray-700 text-white rounded-xl font-black hover:bg-gray-800 dark:hover:bg-gray-600 transition-all shadow-lg shadow-gray-200 dark:shadow-none"
                                >
                                    Close
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default PayrollPage;
