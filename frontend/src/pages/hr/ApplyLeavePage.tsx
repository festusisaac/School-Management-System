import { useState, useEffect } from 'react';
import { Calendar, FileText, Send, Clock, AlertCircle } from 'lucide-react';
import api from '../../services/api';
import { useToast } from '../../context/ToastContext';

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
        <div className="p-6 max-w-6xl mx-auto min-h-screen transition-colors duration-300">
            <div className="mb-8">
                <h1 className="text-3xl font-black text-gray-900 dark:text-white">Apply for Leave</h1>
                <p className="text-gray-500 dark:text-gray-400 font-medium">Submit your leave application for review by HR</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Application Form */}
                <div className="lg:col-span-1">
                    <div className="bg-white dark:bg-gray-800 rounded-3xl border border-gray-100 dark:border-gray-700 shadow-xl shadow-gray-200/50 dark:shadow-none overflow-hidden">
                        <div className="p-6 bg-blue-600 text-white">
                            <h2 className="text-lg font-bold flex items-center gap-2">
                                <Send size={20} />
                                New Application
                            </h2>
                        </div>
                        <form onSubmit={handleApply} className="p-6 space-y-5">
                            <div>
                                <label className="block text-xs font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-1.5 ml-1">Leave Category</label>
                                <select
                                    name="leaveTypeId"
                                    required
                                    value={selectedType}
                                    onChange={(e) => setSelectedType(e.target.value)}
                                    className="w-full bg-gray-50 dark:bg-gray-700 border-none rounded-2xl p-4 text-sm font-bold text-gray-700 dark:text-gray-300 focus:ring-4 focus:ring-blue-500/10 transition-all outline-none"
                                >
                                    <option value="" className="dark:bg-gray-800">Select Category</option>
                                    {leaveTypes.map((t: LeaveType) => <option key={t.id} value={t.id} className="dark:bg-gray-800">{t.name} (Max {t.maxDaysPerYear} days)</option>)}
                                </select>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-1.5 ml-1">Start Date</label>
                                    <input
                                        type="date"
                                        name="startDate"
                                        required
                                        value={startDate}
                                        onChange={(e) => setStartDate(e.target.value)}
                                        className="w-full bg-gray-50 dark:bg-gray-700 border-none rounded-2xl p-4 text-sm font-bold text-gray-700 dark:text-gray-300 focus:ring-4 focus:ring-blue-500/10 transition-all outline-none"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-1.5 ml-1">End Date</label>
                                    <input
                                        type="date"
                                        name="endDate"
                                        required
                                        value={endDate}
                                        onChange={(e) => setEndDate(e.target.value)}
                                        className="w-full bg-gray-50 dark:bg-gray-700 border-none rounded-2xl p-4 text-sm font-bold text-gray-700 dark:text-gray-300 focus:ring-4 focus:ring-blue-500/10 transition-all outline-none"
                                    />
                                </div>
                            </div>

                            {selectedDays > 0 && (
                                <div className={`p-4 rounded-2xl flex items-center justify-between ${isExceeding ? 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 border border-red-100 dark:border-red-900/30' : 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 border border-blue-100 dark:border-blue-900/30'}`}>
                                    <div className="text-xs font-black uppercase tracking-wider">Total Days: {selectedDays}</div>
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
                                    <label className="block text-xs font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-1.5 ml-1">Supporting Document (Required)</label>
                                    <input
                                        type="file"
                                        name="document"
                                        required
                                        accept=".pdf,.jpg,.jpeg,.png"
                                        className="w-full bg-gray-50 dark:bg-gray-700 border-none rounded-2xl p-4 text-sm font-bold text-gray-700 dark:text-gray-300 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-black file:bg-blue-600 file:text-white hover:file:bg-blue-700 transition-all outline-none"
                                    />
                                    <p className="text-[10px] text-gray-400 dark:text-gray-500 mt-1 ml-1">Accepted formats: PDF, JPG, PNG. Max size: 5MB</p>
                                </div>
                            )}

                            <div>
                                <label className="block text-xs font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-1.5 ml-1">Reason for Leave</label>
                                <textarea name="reason" rows={4} required placeholder="Briefly explain why you need this leave..." className="w-full bg-gray-50 dark:bg-gray-700 border-none rounded-2xl p-4 text-sm font-bold text-gray-700 dark:text-gray-300 focus:ring-4 focus:ring-blue-500/10 transition-all outline-none resize-none"></textarea>
                            </div>

                            <button
                                type="submit"
                                disabled={submitting}
                                className="w-full py-4 bg-gray-900 dark:bg-blue-600 text-white font-black rounded-2xl hover:bg-black dark:hover:bg-blue-700 transition-all shadow-xl shadow-gray-300 dark:shadow-none flex items-center justify-center gap-2 disabled:opacity-50"
                            >
                                {submitting ? 'Submitting...' : <><Send size={18} /> Submit Application</>}
                            </button>
                        </form>
                    </div>
                </div>

                {/* Status and History */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-3xl p-8 text-white shadow-xl shadow-blue-500/20 flex justify-between items-center">
                        <div>
                            <p className="text-blue-100 text-sm font-bold">Current Leave Status</p>
                            <h2 className="text-3xl font-black mt-1">{loading ? '...' : leaveBalance?.totalAvailable || 0} Days Available</h2>
                            <div className="mt-4 flex flex-wrap gap-2">
                                {leaveBalance?.details.map((d: any) => (
                                    <div key={d.leaveType} className="px-3 py-1 bg-white/10 rounded-lg text-[10px] font-bold border border-white/5">
                                        {d.leaveType}: {d.available}/{d.maxDays}
                                    </div>
                                ))}
                            </div>
                        </div>
                        <div className="p-4 bg-white/10 rounded-2xl backdrop-blur-sm border border-white/10">
                            <Calendar size={48} className="text-white/80" />
                        </div>
                    </div>

                    <div className="bg-white dark:bg-gray-800 rounded-3xl border border-gray-100 dark:border-gray-700 shadow-xl shadow-gray-200/50 dark:shadow-none overflow-hidden">
                        <div className="p-6 border-b border-gray-50 dark:border-gray-700 flex justify-between items-center bg-white dark:bg-gray-800">
                            <h2 className="text-lg font-black text-gray-900 dark:text-white flex items-center gap-2">
                                <Clock size={20} className="text-blue-600 dark:text-blue-400" />
                                Application History
                            </h2>
                        </div>
                        <div className="divide-y divide-gray-50 dark:divide-gray-700">
                            {loading ? (
                                <div className="p-12 text-center text-gray-400 font-bold">Loading records...</div>
                            ) : myRequests.length === 0 ? (
                                <div className="p-12 text-center text-gray-400 font-bold italic">No previous applications found</div>
                            ) : (
                                myRequests.map((req) => (
                                    <div key={req.id} className="p-6 hover:bg-gray-50/50 dark:hover:bg-gray-700/50 transition flex flex-col md:flex-row md:items-center justify-between gap-4">
                                        <div className="flex gap-4">
                                            <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded-2xl text-gray-400 dark:text-gray-500">
                                                <FileText size={24} />
                                            </div>
                                            <div>
                                                <h3 className="font-black text-gray-900 dark:text-white">{req.leaveType.name}</h3>
                                                <p className="text-xs text-gray-500 dark:text-gray-400 font-bold mt-0.5">
                                                    {new Date(req.startDate).toLocaleDateString()} - {new Date(req.endDate).toLocaleDateString()} • {req.numberOfDays} Days
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-4">
                                            <div className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase border ${getStatusColor(req.status)}`}>
                                                {req.status}
                                            </div>
                                            <button className="p-2 text-gray-300 dark:text-gray-600 hover:text-gray-600 dark:hover:text-gray-400 transition">
                                                <AlertCircle size={18} />
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
