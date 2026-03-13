import { useState, useEffect } from 'react';
import { Search, Calendar, CheckCircle, XCircle, FileText } from 'lucide-react';
import api from '../../services/api';
import { useToast } from '../../context/ToastContext';

interface LeaveRequest {
    id: string;
    staff: {
        firstName: string;
        lastName: string;
        employeeId: string;
    };
    leaveType: {
        name: string;
    };
    startDate: string;
    endDate: string;
    totalDays: number;
    reason: string;
    status: 'Pending' | 'Approved' | 'Rejected';
    createdAt: string;
    supportingDocument?: string;
}

const ApproveLeavePage = () => {
    const [requests, setRequests] = useState<LeaveRequest[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState('All');
    const [selectedRequest, setSelectedRequest] = useState<LeaveRequest | null>(null);
    const [comment, setComment] = useState('');
    const toast = useToast();

    useEffect(() => {
        fetchRequests();
    }, []);

    const fetchRequests = async () => {
        try {
            setLoading(true);
            const data = await api.getAllLeaveRequests();
            setRequests(data);
        } catch (error) {
            console.error('Error fetching leave requests:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleAction = async (id: string, status: 'Approved' | 'Rejected') => {
        try {
            await api.approveLeave(id, { status, comment });
            toast.showSuccess(`Leave request ${status.toLowerCase()} successfully!`);
            setSelectedRequest(null);
            setComment('');
            fetchRequests();
        } catch (error) {
            console.error('Error updating leave status:', error);
            toast.showError('Failed to update status');
        }
    };

    const filteredRequests = requests.filter(r => {
        const matchesSearch = `${r.staff.firstName} ${r.staff.lastName}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
            r.staff.employeeId.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesStatus = filterStatus === 'All' || r.status === filterStatus;
        return matchesSearch && matchesStatus;
    });

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'Approved': return 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400 border-green-200 dark:border-green-800';
            case 'Rejected': return 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-400 border-red-200 dark:border-red-800';
            default: return 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-400 border-yellow-200 dark:border-yellow-800';
        }
    };

    return (
        <div className="p-6 bg-gray-50 dark:bg-gray-900 min-h-screen transition-colors duration-300">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Approve Leave Requests</h1>
                    <p className="text-gray-600 dark:text-gray-400">Review and action leave applications from staff</p>
                </div>
                <div className="flex gap-4 w-full md:w-auto">
                    <div className="relative flex-1 md:flex-none md:w-64">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500" size={20} />
                        <input
                            type="text"
                            placeholder="Search staff..."
                            className="w-full pl-10 pr-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 text-gray-900 dark:text-white rounded-lg outline-none focus:ring-2 focus:ring-primary-500/20"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <select
                        className="p-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 text-gray-900 dark:text-white rounded-lg outline-none focus:ring-2 focus:ring-primary-500/20"
                        value={filterStatus}
                        onChange={(e) => setFilterStatus(e.target.value)}
                    >
                        <option value="All" className="dark:bg-gray-800">All Status</option>
                        <option value="Pending" className="dark:bg-gray-800">Pending</option>
                        <option value="Approved" className="dark:bg-gray-800">Approved</option>
                        <option value="Rejected" className="dark:bg-gray-800">Rejected</option>
                    </select>
                </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden transition-all">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-gray-50 dark:bg-gray-800/50 border-b border-gray-100 dark:border-gray-700 italic text-xs uppercase tracking-widest text-gray-400 dark:text-gray-500 font-bold">
                            <tr>
                                <th className="px-6 py-4">Staff Member</th>
                                <th className="px-6 py-4">Leave Type</th>
                                <th className="px-6 py-4">Duration</th>
                                <th className="px-6 py-4">Total Days</th>
                                <th className="px-6 py-4">Status</th>
                                <th className="px-6 py-4 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                            {loading ? (
                                <tr><td colSpan={6} className="px-6 py-8 text-center text-gray-500">Loading requests...</td></tr>
                            ) : filteredRequests.length === 0 ? (
                                <tr><td colSpan={6} className="px-6 py-8 text-center text-gray-400 dark:text-gray-500">No leave requests found</td></tr>
                            ) : (
                                filteredRequests.map((req) => (
                                    <tr key={req.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-700/50 transition">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 flex items-center justify-center font-bold text-xs transition-colors">
                                                    {req.staff.firstName[0]}{req.staff.lastName[0]}
                                                </div>
                                                <div>
                                                    <div className="font-bold text-gray-900 dark:text-white leading-tight">{req.staff.firstName} {req.staff.lastName}</div>
                                                    <div className="text-[10px] text-gray-400 dark:text-gray-500 uppercase font-mono">{req.staff.employeeId}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400 font-medium">{req.leaveType.name}</td>
                                        <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-500">
                                            <div className="flex items-center gap-2">
                                                <Calendar size={14} className="text-gray-400 dark:text-gray-600" />
                                                {new Date(req.startDate).toLocaleDateString()} - {new Date(req.endDate).toLocaleDateString()}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-sm font-bold text-gray-900 dark:text-white">{req.totalDays} Days</td>
                                        <td className="px-6 py-4">
                                            <span className={`px-2 py-1 rounded text-[10px] font-bold border ${getStatusColor(req.status)}`}>
                                                {req.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <button
                                                onClick={() => setSelectedRequest(req)}
                                                className="px-3 py-1.5 bg-gray-900 dark:bg-primary-600 text-white rounded-lg text-xs font-bold hover:bg-black dark:hover:bg-primary-500 transition-all shadow-lg shadow-gray-200 dark:shadow-none"
                                            >
                                                Review
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Review Modal */}
            {selectedRequest && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="fixed inset-0 bg-black/60 backdrop-blur-md transition-opacity" onClick={() => setSelectedRequest(null)}></div>
                    <div className="relative bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col overflow-hidden transform transition-all border dark:border-gray-700">
                        <div className="p-6 border-b border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/50 flex justify-between items-center shrink-0">
                            <div>
                                <h3 className="text-xl font-black text-gray-900 dark:text-white">Leave Application Review</h3>
                                <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">Applied on {new Date(selectedRequest.createdAt).toLocaleDateString()}</p>
                            </div>
                            <button onClick={() => setSelectedRequest(null)} className="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"><CheckCircle className="rotate-45" size={24} /></button>
                        </div>

                        <div className="p-8 space-y-6 overflow-y-auto">
                            <div className="grid grid-cols-2 gap-8">
                                <div>
                                    <p className="text-[10px] uppercase font-bold text-gray-400 dark:text-gray-500 tracking-widest mb-1">Staff Member</p>
                                    <p className="font-bold text-gray-900 dark:text-white">{selectedRequest.staff.firstName} {selectedRequest.staff.lastName}</p>
                                    <p className="text-xs text-gray-500 dark:text-gray-400">{selectedRequest.staff.employeeId}</p>
                                </div>
                                <div>
                                    <p className="text-[10px] uppercase font-bold text-gray-400 dark:text-gray-500 tracking-widest mb-1">Leave Category</p>
                                    <p className="font-bold text-gray-900 dark:text-white">{selectedRequest.leaveType.name}</p>
                                </div>
                            </div>

                            <div>
                                <p className="text-[10px] uppercase font-bold text-gray-400 dark:text-gray-500 tracking-widest mb-1">Duration & Dates</p>
                                <div className="flex items-center gap-4 bg-primary-50/50 dark:bg-primary-900/20 p-3 rounded-xl border border-blue-100 dark:border-primary-800">
                                    <div className="text-center bg-white dark:bg-gray-800 p-2 rounded-lg border border-blue-200 dark:border-primary-700 min-w-[80px]">
                                        <p className="text-[10px] font-black text-primary-600 dark:text-primary-400 uppercase">Days</p>
                                        <p className="text-2xl font-black text-blue-800 dark:text-primary-300">{selectedRequest.totalDays}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm font-bold text-gray-800 dark:text-gray-200">From: {new Date(selectedRequest.startDate).toLocaleDateString()}</p>
                                        <p className="text-sm font-bold text-gray-800 dark:text-gray-200">To: {new Date(selectedRequest.endDate).toLocaleDateString()}</p>
                                    </div>
                                </div>
                            </div>

                            <div>
                                <p className="text-[10px] uppercase font-bold text-gray-400 dark:text-gray-500 tracking-widest mb-1">Reason for Leave</p>
                                <div className="bg-gray-50 dark:bg-gray-700/50 p-4 rounded-xl border border-gray-100 dark:border-gray-700 text-sm text-gray-700 dark:text-gray-300 leading-relaxed italic transition-colors">
                                    "{selectedRequest.reason}"
                                </div>
                            </div>

                            {selectedRequest.supportingDocument && (
                                <div className="p-4 rounded-xl bg-primary-50 dark:bg-primary-900/20 border border-blue-100 dark:border-primary-800 flex items-center justify-between transition-colors">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-white dark:bg-gray-700 rounded-lg text-primary-600 dark:text-primary-400">
                                            <FileText size={20} />
                                        </div>
                                        <div>
                                            <p className="text-xs font-black uppercase tracking-wider text-blue-900 dark:text-primary-300">Supporting Document</p>
                                            <p className="text-[10px] text-primary-600 dark:text-primary-400 font-bold">Attached to request</p>
                                        </div>
                                    </div>
                                    <a
                                        href={`http://localhost:3000${selectedRequest.supportingDocument}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="px-4 py-2 bg-white dark:bg-gray-800 text-primary-600 dark:text-primary-400 text-xs font-black uppercase tracking-wider rounded-lg border border-blue-200 dark:border-primary-700 hover:bg-primary-50 dark:hover:bg-blue-900/30 transition shadow-sm flex items-center gap-2"
                                    >
                                        View File
                                    </a>
                                </div>
                            )}

                            {selectedRequest.status === 'Pending' && (
                                <div>
                                    <p className="text-[10px] uppercase font-bold text-gray-400 dark:text-gray-500 tracking-widest mb-2">Review Comment (Optional)</p>
                                    <textarea
                                        className="w-full border border-gray-200 dark:border-gray-700 rounded-xl p-4 text-sm outline-none bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-4 focus:ring-primary-500/5 focus:border-primary-500 transition-all resize-none"
                                        rows={3}
                                        placeholder="Add any instructions or reason for rejection..."
                                        value={comment}
                                        onChange={(e) => setComment(e.target.value)}
                                    ></textarea>
                                </div>
                            )}
                        </div>

                        {selectedRequest.status === 'Pending' ? (
                            <div className="p-6 bg-gray-50 dark:bg-gray-800/80 flex gap-4 shrink-0 border-t dark:border-gray-700 transition-colors">
                                <button
                                    onClick={() => handleAction(selectedRequest.id, 'Approved')}
                                    className="flex-1 py-4 bg-green-600 text-white font-black rounded-xl hover:bg-green-700 shadow-xl shadow-green-500/20 dark:shadow-none transition-all flex items-center justify-center gap-2"
                                >
                                    <CheckCircle size={20} /> Approve Request
                                </button>
                                <button
                                    onClick={() => handleAction(selectedRequest.id, 'Rejected')}
                                    className="flex-1 py-4 bg-red-600 text-white font-black rounded-xl hover:bg-red-700 shadow-xl shadow-red-500/20 dark:shadow-none transition-all flex items-center justify-center gap-2"
                                >
                                    <XCircle size={20} /> Reject Request
                                </button>
                            </div>
                        ) : (
                            <div className="p-6 bg-gray-50 dark:bg-gray-800/80 text-center shrink-0 border-t dark:border-gray-700 transition-colors">
                                <div className={`inline-flex items-center gap-2 px-6 py-3 rounded-full font-black uppercase text-xs border transition-all ${getStatusColor(selectedRequest.status)}`}>
                                    {selectedRequest.status === 'Approved' ? <CheckCircle size={16} /> : <XCircle size={16} />}
                                    This request was {selectedRequest.status}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )
            }
        </div >
    );
};

export default ApproveLeavePage;
