import { useState, useEffect } from 'react';
import { Calendar, Search, Save, CheckCircle2, XCircle, Clock, AlertCircle } from 'lucide-react';
import api from '../../services/api';
import { useToast } from '../../context/ToastContext';
import { useSystem } from '../../context/SystemContext';

interface Staff {
    id: string;
    employeeId: string;
    firstName: string;
    lastName: string;
    department: { name: string };
    designation: { title: string };
}

interface AttendanceRecord {
    staffId: string;
    status: string;
    remarks: string;
    checkInTime?: string;
    checkOutTime?: string;
}

const StaffAttendancePage = () => {
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [staffList, setStaffList] = useState<Staff[]>([]);
    const [attendance, setAttendance] = useState<Record<string, AttendanceRecord>>({});
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [summary, setSummary] = useState({ present: 0, absent: 0, late: 0, halfDay: 0, onLeave: 0 });
    const toast = useToast();

    const { activeSectionId } = useSystem();

    useEffect(() => {
        fetchInitialData();
    }, [date, activeSectionId]);

    const fetchInitialData = async () => {
        try {
            setLoading(true);
            const [staffData, attendanceData, summaryData] = await Promise.all([
                api.getStaff({ sectionId: activeSectionId }),
                api.getDailyAttendance(date, activeSectionId),
                api.getAttendanceSummary(date, activeSectionId)
            ]);

            setStaffList(staffData);
            setSummary(summaryData);

            // Initialize attendance state from fetched data
            const attendanceMap: Record<string, AttendanceRecord> = {};
            staffData.forEach((s: Staff) => {
                const record = attendanceData.find((a: any) => a.staffId === s.id);
                attendanceMap[s.id] = {
                    staffId: s.id,
                    status: record?.status || 'Present',
                    remarks: record?.remarks || '',
                    checkInTime: record?.checkInTime || '',
                    checkOutTime: record?.checkOutTime || ''
                };
            });
            setAttendance(attendanceMap);
        } catch (error) {
            console.error('Error fetching attendance data:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleStatusChange = (staffId: string, status: string) => {
        setAttendance(prev => ({
            ...prev,
            [staffId]: { ...prev[staffId], status }
        }));
    };

    const handleRemarksChange = (staffId: string, remarks: string) => {
        setAttendance(prev => ({
            ...prev,
            [staffId]: { ...prev[staffId], remarks }
        }));
    };

    const handleSave = async () => {
        try {
            setSaving(true);
            const attendanceArray = Object.values(attendance).map(record => ({
                ...record,
                date: date
            }));
            await api.bulkMarkAttendance({ attendance: attendanceArray });
            toast.showSuccess('Attendance saved successfully!');
            fetchInitialData();
        } catch (error: any) {
            console.error('Error saving attendance:', error);
            const message = error.response?.data?.message || 'Failed to save attendance';
            toast.showError(Array.isArray(message) ? message.join(', ') : message);
        } finally {
            setSaving(false);
        }
    };

    const filteredStaff = staffList.filter(s =>
        `${s.firstName} ${s.lastName}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.employeeId.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="p-6 min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-300">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Staff Attendance</h1>
                    <p className="text-gray-600 dark:text-gray-400">Mark and manage daily staff attendance</p>
                </div>
                <div className="flex items-center gap-4">
                    <div className="relative">
                        <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500" size={20} />
                        <input
                            type="date"
                            className="pl-10 pr-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-primary-500 outline-none transition-colors"
                            value={date}
                            onChange={(e) => setDate(e.target.value)}
                        />
                    </div>
                    <button
                        onClick={handleSave}
                        disabled={saving}
                        className="flex items-center gap-2 px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 transition-colors"
                    >
                        <Save size={20} />
                        {saving ? 'Saving...' : 'Save Attendance'}
                    </button>
                </div>
            </div>

            {/* Stats Summary */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
                <div className="bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm flex items-center gap-3">
                    <div className="p-2 bg-green-50 dark:bg-green-900/30 text-green-600 dark:text-green-400 rounded-lg"><CheckCircle2 size={24} /></div>
                    <div><p className="text-xs text-gray-500 dark:text-gray-400 font-bold uppercase">Present</p><p className="text-xl font-bold dark:text-white">{summary.present}</p></div>
                </div>
                <div className="bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm flex items-center gap-3">
                    <div className="p-2 bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-lg"><XCircle size={24} /></div>
                    <div><p className="text-xs text-gray-500 dark:text-gray-400 font-bold uppercase">Absent</p><p className="text-xl font-bold dark:text-white">{summary.absent}</p></div>
                </div>
                <div className="bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm flex items-center gap-3">
                    <div className="p-2 bg-yellow-50 dark:bg-yellow-900/30 text-yellow-600 dark:text-yellow-400 rounded-lg"><Clock size={24} /></div>
                    <div><p className="text-xs text-gray-500 dark:text-gray-400 font-bold uppercase">Late</p><p className="text-xl font-bold dark:text-white">{summary.late}</p></div>
                </div>
                <div className="bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm flex items-center gap-3">
                    <div className="p-2 bg-orange-50 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 rounded-lg"><AlertCircle size={24} /></div>
                    <div><p className="text-xs text-gray-500 dark:text-gray-400 font-bold uppercase">Half Day</p><p className="text-xl font-bold dark:text-white">{summary.halfDay}</p></div>
                </div>
                <div className="bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm flex items-center gap-3">
                    <div className="p-2 bg-primary-50 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 rounded-lg"><Calendar size={24} /></div>
                    <div><p className="text-xs text-gray-500 dark:text-gray-400 font-bold uppercase">On Leave</p><p className="text-xl font-bold dark:text-white">{summary.onLeave}</p></div>
                </div>
            </div>

            {/* Search and Table */}
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
                <div className="p-4 border-b border-gray-100 dark:border-gray-700">
                    <div className="relative max-w-md">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500" size={18} />
                        <input
                            type="text"
                            placeholder="Search staff..."
                            className="w-full pl-10 pr-4 py-2 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-gray-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500/20"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-gray-50 dark:bg-gray-800/50 text-gray-500 dark:text-gray-400 text-xs font-bold uppercase tracking-widest">
                            <tr>
                                <th className="px-6 py-4 border-b dark:border-gray-700">Staff Member</th>
                                <th className="px-6 py-4 border-b dark:border-gray-700">ID</th>
                                <th className="px-6 py-4 border-b dark:border-gray-700">Role</th>
                                <th className="px-6 py-4 border-b dark:border-gray-700">Status</th>
                                <th className="px-6 py-4 border-b dark:border-gray-700">Remarks</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                            {loading ? (
                                <tr><td colSpan={5} className="px-6 py-8 text-center text-gray-400">Loading staff list...</td></tr>
                            ) : filteredStaff.length === 0 ? (
                                <tr><td colSpan={5} className="px-6 py-8 text-center text-gray-400">No staff found</td></tr>
                            ) : (
                                filteredStaff.map((staff) => (
                                    <tr key={staff.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-700/50 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center text-xs font-bold text-gray-600 dark:text-gray-400">
                                                    {staff.firstName[0]}{staff.lastName[0]}
                                                </div>
                                                <div>
                                                    <div className="font-bold text-gray-900 dark:text-white">{staff.firstName} {staff.lastName}</div>
                                                    <div className="text-[10px] text-gray-400 dark:text-gray-500">{staff.department.name}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-sm font-mono text-gray-500 dark:text-gray-400">{staff.employeeId}</td>
                                        <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">{staff.designation.title}</td>
                                        <td className="px-6 py-4">
                                            <div className="flex gap-2">
                                                {['Present', 'Absent', 'Late', 'Half-Day', 'On Leave'].map((status) => (
                                                    <button
                                                        key={status}
                                                        onClick={() => handleStatusChange(staff.id, status)}
                                                        className={`px-3 py-1 rounded-full text-[10px] font-bold transition-all border ${attendance[staff.id]?.status === status
                                                            ? status === 'Present' ? 'bg-green-600 border-green-600 text-white shadow-lg shadow-green-500/30' :
                                                                status === 'Absent' ? 'bg-red-600 border-red-600 text-white shadow-lg shadow-red-500/30' :
                                                                    status === 'Late' ? 'bg-yellow-500 border-yellow-500 text-white shadow-lg shadow-yellow-500/30' :
                                                                        status === 'Half-Day' ? 'bg-orange-500 border-orange-500 text-white shadow-lg shadow-orange-500/30' :
                                                                            'bg-primary-600 border-primary-600 text-white shadow-lg shadow-primary-500/30'
                                                            : 'bg-white dark:bg-gray-700 text-gray-400 dark:text-gray-500 border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500'
                                                            }`}
                                                    >
                                                        {status}
                                                    </button>
                                                ))}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <input
                                                type="text"
                                                placeholder="Add remarks..."
                                                className="w-full text-xs p-2 border border-transparent hover:border-gray-200 dark:hover:border-gray-600 focus:border-primary-500 dark:focus:border-primary-500 rounded outline-none bg-transparent text-gray-900 dark:text-white transition-colors"
                                                value={attendance[staff.id]?.remarks || ''}
                                                onChange={(e) => handleRemarksChange(staff.id, e.target.value)}
                                            />
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default StaffAttendancePage;
