import { useState, useEffect } from 'react';
import { Calendar, FileText, Send, Clock, AlertCircle, FilePlus, Bookmark } from 'lucide-react';
import api from '../../services/api';
import { useToast } from '../../context/ToastContext';
import { format } from 'date-fns';

interface LeaveType {
    id: string;
    name: string;
    maxDaysPerYear: number;
    requiresDocument: boolean;
}

interface LeaveRequest {
    id: string;
    leaveType: { name: string };
    startDate: string;
    endDate: string;
    numberOfDays: number;
    status: string;
    reason: string;
    createdAt: string;
}

const ApplyLeavePage = () => {
    const [leaveTypes, setLeaveTypes] = useState<LeaveType[]>([]);
    const [myRequests, setMyRequests] = useState<LeaveRequest[]>([]);
    const [leaveBalance, setLeaveBalance] = useState<{ totalAvailable: number; details: any[] } | null>(null);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const toast = useToast();

    // Form state
    const [selectedType, setSelectedType] = useState('');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            setLoading(true);
            const [types, requests, balance] = await Promise.all([
                api.getLeaveTypes(),
                api.getMyLeaveRequests(),
                api.getLeaveBalance()
            ]);
            setLeaveTypes(types);
            setMyRequests(requests);
            setLeaveBalance(balance);
        } catch (error) {
            console.error('Error fetching leave data:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleApply = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const formElement = e.currentTarget;

        const form = new FormData();
        form.append('leaveTypeId', selectedType);
        form.append('startDate', startDate);
        form.append('endDate', endDate);
        form.append('reason', new FormData(formElement).get('reason') as string);

        const fileInput = (formElement.elements.namedItem('document') as HTMLInputElement);
        if (fileInput?.files?.length) {
            form.append('document', fileInput.files[0]);
        }

        try {
            setSubmitting(true);
            await api.applyLeave(form);
            toast.showSuccess('Leave application submitted successfully!');
            setSelectedType('');
            setStartDate('');
            setEndDate('');
            formElement.reset();
            await fetchData();
        } catch (error: any) {
            console.error('Error applying for leave:', error);
            const message = error.response?.data?.message || 'Failed to submit application';
            toast.showError(Array.isArray(message) ? message.join(', ') : message);
        } finally {
            setSubmitting(false);
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'Approved': return 'text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800';
            case 'Rejected': return 'text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800';
            default: return 'text-yellow-600 dark:text-yellow-400 bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800';
        }
    };

    const calculateDays = () => {
        if (!startDate || !endDate) return 0;
        const start = new Date(startDate);
        const end = new Date(endDate);
        if (isNaN(start.getTime()) || isNaN(end.getTime())) return 0;
        const diffTime = Math.abs(end.getTime() - start.getTime());
        return Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
    };

    const selectedDays = calculateDays();
    const selectedLeaveType = leaveTypes.find(t => t.id === selectedType);
    const currentLimit = leaveBalance?.details.find((d: any) => d.leaveType === selectedLeaveType?.name)?.available || 0;
    const isExceeding = selectedType && selectedDays > currentLimit;
    const requiresDocument = selectedLeaveType?.requiresDocument;

    return (
        <div className="space-y-6 animate-in fade-in duration-500 pb-20">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-gray-800 p-6 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm transition-all">
                <div className="flex items-center gap-4">
                    <div className="p-3 bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400 rounded-xl">
                        <FilePlus className="w-6 h-6" />
                    </div>
                    <div>
                        <h1 className="text-xl font-bold text-gray-900 dark:text-white">Apply for Leave</h1>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Manage your leave applications and balance</p>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Application Form */}
                <div className="lg:col-span-1">
                    <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm overflow-hidden">
                        <div className="p-4 border-b border-gray-50 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/50 flex items-center gap-2">
                            <Bookmark size={16} className="text-primary-600" />
                            <h2 className="text-sm font-bold text-gray-700 dark:text-gray-200">New Application</h2>
                        </div>
                        <form onSubmit={handleApply} className="p-6 space-y-5">
                            <div>
                                <label className="block text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-1.5 ml-1">Leave Category</label>
                                <select
                                    name="leaveTypeId"
                                    required
                                    value={selectedType}
                                    onChange={(e) => setSelectedType(e.target.value)}
                                    className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg p-2.5 text-sm font-medium text-gray-700 dark:text-gray-300 focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all cursor-pointer"
                                >
                                    <option value="">Select Category</option>
                                    {leaveTypes.map((t: LeaveType) => <option key={t.id} value={t.id}>{t.name} (Max {t.maxDaysPerYear} days)</option>)}
                                </select>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-1.5 ml-1">Start Date</label>
                                    <div className="relative">
                                        <Calendar className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
                                        <input
                                            type="date"
                                            name="startDate"
                                            required
                                            value={startDate}
                                            onChange={(e) => setStartDate(e.target.value)}
                                            className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg pl-9 pr-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all outline-none"
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-1.5 ml-1">End Date</label>
                                    <div className="relative">
                                        <Calendar className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
                                        <input
                                            type="date"
                                            name="endDate"
                                            required
                                            value={endDate}
                                            onChange={(e) => setEndDate(e.target.value)}
                                            className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg pl-9 pr-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all outline-none"
                                        />
                                    </div>
                                </div>
                            </div>

                            {selectedDays > 0 && (
                                <div className={`p-4 rounded-xl flex items-center justify-between border ${isExceeding ? 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 border-red-100 dark:border-red-900/30' : 'bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400 border-primary-100 dark:border-primary-900/30'}`}>
                                    <div className="text-[10px] font-black uppercase tracking-wider">Total Days: {selectedDays}</div>
                                    {isExceeding && (
                                        <div className="flex items-center gap-1 text-[10px] font-black uppercase">
                                            <AlertCircle size={14} />
                                            Limit Exceeded
                                        </div>
                                    )}
                                </div>
                            )}

                            {requiresDocument && (
                                <div>
                                    <label className="block text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-1.5 ml-1">Supporting Document (Required)</label>
                                    <input
                                        type="file"
                                        name="document"
                                        required
                                        accept=".pdf,.jpg,.jpeg,.png"
                                        className="w-full text-xs text-gray-500 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg p-2 file:mr-4 file:py-1 file:px-3 file:rounded file:border-0 file:text-[10px] file:font-black file:uppercase file:bg-primary-600 file:text-white file:cursor-pointer hover:file:bg-primary-700 transition-all outline-none"
                                    />
                                    <p className="text-[10px] text-gray-400 dark:text-gray-500 mt-1.5 ml-1 italic">Accepted: PDF, JPG, PNG. Max 5MB</p>
                                </div>
                            )}

                            <div>
                                <label className="block text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-1.5 ml-1">Reason for Leave</label>
                                <textarea 
                                    name="reason" 
                                    rows={4} 
                                    required 
                                    placeholder="Briefly explain your reason..." 
                                    className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg p-3 text-sm font-medium text-gray-700 dark:text-gray-300 focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all outline-none resize-none"
                                ></textarea>
                            </div>

                            <button
                                type="submit"
                                disabled={submitting}
                                className="w-full py-2.5 bg-primary-600 text-white font-bold text-sm uppercase tracking-widest rounded-lg hover:bg-primary-700 transition-all shadow-sm flex items-center justify-center gap-2 disabled:opacity-50"
                            >
                                {submitting ? 'Submitting...' : <><Send size={16} /> Submit Application</>}
                            </button>
                        </form>
                    </div>
                </div>

                {/* Status and History */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-100 dark:border-gray-700 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                        <div className="flex-1">
                            <p className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-1">Leave Balance Status</p>
                            <h2 className="text-2xl font-black text-gray-900 dark:text-white">{loading ? '...' : leaveBalance?.totalAvailable || 0} Days Available</h2>
                            <div className="mt-4 flex flex-wrap gap-2">
                                {leaveBalance?.details.map((d: any) => (
                                    <div key={d.leaveType} className="px-2.5 py-1 bg-gray-50 dark:bg-gray-900 border border-gray-100 dark:border-gray-700 rounded-md text-[10px] font-bold text-gray-600 dark:text-gray-400">
                                        {d.leaveType}: <span className="text-primary-600 dark:text-primary-400">{d.available}</span>/{d.maxDays}
                                    </div>
                                ))}
                            </div>
                        </div>
                        <div className="p-3 bg-primary-50 dark:bg-primary-900/40 text-primary-600 dark:text-primary-400 rounded-xl hidden md:block">
                            <Clock size={32} />
                        </div>
                    </div>

                    <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm overflow-hidden">
                        <div className="p-4 border-b border-gray-50 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/50 flex justify-between items-center">
                            <h2 className="text-sm font-bold text-gray-700 dark:text-gray-200 flex items-center gap-2">
                                <Clock size={16} className="text-primary-600" />
                                Application History
                            </h2>
                        </div>
                        <div className="divide-y divide-gray-50 dark:divide-gray-700">
                            {loading ? (
                                <div className="p-10 text-center text-gray-400 text-xs font-bold uppercase tracking-widest">Loading records...</div>
                            ) : myRequests.length === 0 ? (
                                <div className="p-10 text-center text-gray-400 text-xs font-bold italic tracking-wide">No applications found</div>
                            ) : (
                                myRequests.map((req) => (
                                    <div key={req.id} className="p-5 hover:bg-gray-50/30 dark:hover:bg-gray-700/30 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-4">
                                        <div className="flex gap-4">
                                            <div className="p-2.5 bg-gray-50 dark:bg-gray-900/50 rounded-xl text-gray-400 border border-gray-100 dark:border-gray-700">
                                                <FileText size={20} />
                                            </div>
                                            <div>
                                                <h3 className="text-sm font-bold text-gray-900 dark:text-white">{req.leaveType.name}</h3>
                                                <div className="flex items-center gap-2 mt-0.5">
                                                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-tight">
                                                        {format(new Date(req.startDate), 'MMM dd')} - {format(new Date(req.endDate), 'MMM dd, yyyy')}
                                                    </span>
                                                    <span className="w-1 h-1 bg-gray-300 rounded-full" />
                                                    <span className="text-[10px] font-bold text-primary-600 uppercase tracking-tight">{req.numberOfDays} Days</span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <div className={`px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest border ${getStatusColor(req.status)}`}>
                                                {req.status}
                                            </div>
                                            <button className="p-1.5 text-gray-300 dark:text-gray-600 hover:text-gray-600 dark:hover:text-gray-400 transition-colors">
                                                <AlertCircle size={14} />
                                            </button>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ApplyLeavePage;
