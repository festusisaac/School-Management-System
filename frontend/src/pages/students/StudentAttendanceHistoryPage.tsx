import React, { useState, useEffect } from 'react';
import { 
    Calendar, 
    Search, 
    ChevronDown,
    Filter,
    FileText,
    TrendingUp,
    Download
} from 'lucide-react';
import api from '../../services/api';
import { useToast } from '../../context/ToastContext';
import { format, startOfMonth, endOfMonth } from 'date-fns';
import { clsx } from 'clsx';
import { downloadPDF } from '../../utils/pdfGenerator';

const StudentAttendanceHistoryPage: React.FC = () => {
    const [startDate, setStartDate] = useState(format(startOfMonth(new Date()), 'yyyy-MM-dd'));
    const [endDate, setEndDate] = useState(format(new Date(), 'yyyy-MM-dd'));
    const [classes, setClasses] = useState<any[]>([]);
    const [sections, setSections] = useState<any[]>([]);
    const [selectedClass, setSelectedClass] = useState('');
    const [selectedSection, setSelectedSection] = useState('');
    const [logs, setLogs] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const toast = useToast();

    useEffect(() => {
        fetchClasses();
    }, []);

    const fetchClasses = async () => {
        try {
            const data = await api.getClasses();
            setClasses(data);
        } catch (error) {
            console.error('Error fetching classes:', error);
        }
    };

    useEffect(() => {
        const fetchLogs = async () => {
            try {
                setLoading(true);
                const data = await api.getAttendanceLogs({ 
                    classId: selectedClass || undefined, 
                    sectionId: selectedSection || undefined,
                    startDate,
                    endDate
                });
                setLogs(data);
            } catch (error) {
                console.error('Error fetching attendance logs:', error);
                toast.showError('Failed to load attendance logs');
                setLogs([]);
            } finally {
                setLoading(false);
            }
        };

        fetchLogs();
    }, [startDate, endDate, selectedClass, selectedSection]);

    const filteredLogs = logs.filter(log => {
        const query = (searchTerm || '').toLowerCase();
        const first = (log.student?.firstName || '').toLowerCase();
        const last = (log.student?.lastName || '').toLowerCase();
        return first.includes(query) || last.includes(query);
    });

    const handleExportPDF = async () => {
        const element = document.getElementById('export-pdf-content');
        if (element) {
            try {
                await downloadPDF(element, { 
                    filename: `attendance-history-${format(new Date(), 'yyyy-MM-dd')}.pdf`,
                    orientation: 'portrait' 
                });
                toast.showSuccess('PDF downloaded successfully');
            } catch (error) {
                console.error('Error generating PDF:', error);
                toast.showError('Failed to generate PDF');
            }
        }
    };

    const getStatusColor = (status: string) => {
        switch (status.toLowerCase()) {
            case 'present': return 'text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20';
            case 'absent': return 'text-rose-600 bg-rose-50 dark:bg-rose-900/20';
            case 'late': return 'text-amber-600 bg-amber-50 dark:bg-amber-900/20';
            case 'medical': return 'text-blue-600 bg-blue-50 dark:bg-blue-900/20';
            default: return 'text-gray-600 bg-gray-50';
        }
    };

    return (
        <div className="p-4 min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-300">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
                <div>
                    <h1 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                        <FileText className="w-6 h-6 text-primary-600" />
                        Attendance History
                    </h1>
                    <p className="text-xs text-gray-600 dark:text-gray-400">View and audit past attendance records</p>
                </div>
                <button 
                    onClick={handleExportPDF}
                    className="flex items-center gap-2 px-5 py-2 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 border border-gray-200 dark:border-gray-700 text-sm font-bold rounded-lg hover:bg-gray-50 transition-all shadow-sm active:scale-95"
                >
                    <Download size={18} className="text-primary-600" />
                    Export PDF
                </button>
            </div>

            {/* Filters */}
            <div className="bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm mb-6 print:hidden">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-3 items-end">
                    <div>
                        <label className="block text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-1.5">From</label>
                        <input
                            type="date"
                            className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-900/50 border border-gray-100 dark:border-gray-700 text-xs text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-primary-500 outline-none transition-all"
                            value={startDate}
                            onChange={(e) => setStartDate(e.target.value)}
                        />
                    </div>
                    <div>
                        <label className="block text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-1.5">To</label>
                        <input
                            type="date"
                            className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-900/50 border border-gray-100 dark:border-gray-700 text-xs text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-primary-500 outline-none transition-all"
                            value={endDate}
                            onChange={(e) => setEndDate(e.target.value)}
                        />
                    </div>
                    <div>
                        <label className="block text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-1.5">Class</label>
                        <div className="relative">
                            <select 
                                value={selectedClass}
                                onChange={(e) => setSelectedClass(e.target.value)}
                                className="w-full pl-3 pr-8 py-2 bg-gray-50 dark:bg-gray-900/50 border border-gray-100 dark:border-gray-700 text-xs text-gray-900 dark:text-white rounded-lg appearance-none focus:ring-2 focus:ring-primary-500 outline-none transition-all"
                            >
                                <option value="">All Classes</option>
                                {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                            </select>
                            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={16} />
                        </div>
                    </div>
                    <div className="md:col-span-1 bg-primary-50 dark:bg-primary-900/10 p-2 rounded-lg border border-primary-100 dark:border-primary-900/30 flex items-center gap-2">
                        <TrendingUp className="text-primary-600 w-4 h-4" />
                        <div>
                            <p className="text-[9px] font-black text-primary-400 uppercase tracking-widest">Avg. Presence</p>
                            <p className="text-sm font-black text-primary-700 dark:text-primary-300">94.2%</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Logs Table */}
            <div id="export-pdf-content" className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm overflow-hidden min-h-[400px]">
                <div data-html2canvas-ignore="true" className="p-3 border-b border-gray-50 dark:border-gray-700">
                    <div className="relative max-w-xs">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                        <input
                            type="text"
                            placeholder="Find student records..."
                            className="w-full pl-9 pr-3 py-2 bg-gray-50 dark:bg-gray-900/50 border border-gray-100 dark:border-gray-700 text-xs text-gray-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500/20 transition-all font-medium"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-gray-50/50 dark:bg-gray-900/30 text-gray-400 dark:text-gray-500 text-[10px] font-black uppercase tracking-[0.2em]">
                            <tr>
                                <th className="px-6 py-4 border-b dark:border-gray-700">Date</th>
                                <th className="px-6 py-4 border-b dark:border-gray-700">Student</th>
                                <th className="px-6 py-4 border-b dark:border-gray-700">Class</th>
                                <th className="px-6 py-4 border-b dark:border-gray-700">Status</th>
                                <th className="px-6 py-4 border-b dark:border-gray-700">Remarks</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50 dark:divide-gray-700">
                            {loading ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-12 text-center text-gray-400">
                                        <div className="flex flex-col items-center gap-3">
                                            <div className="w-8 h-8 border-2 border-primary-600 border-t-transparent rounded-full animate-spin"></div>
                                            <span className="text-xs font-bold uppercase tracking-widest animate-pulse">Scanning Logs...</span>
                                        </div>
                                    </td>
                                </tr>
                            ) : filteredLogs.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-24 text-center">
                                        <div className="flex flex-col items-center gap-4 opacity-30">
                                            <Calendar size={48} className="text-gray-300" />
                                            <p className="font-black text-gray-400 uppercase tracking-widest text-sm">No attendance records found for this period</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                filteredLogs.map((log) => (
                                    <tr key={log.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-800/50 transition-colors">
                                        <td className="px-6 py-4 text-sm font-bold text-gray-900 dark:text-white whitespace-nowrap">
                                            {format(new Date(log.date), 'MMM dd, yyyy')}
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3 text-sm font-bold text-gray-900 dark:text-white capitalize">
                                                <div className="w-8 h-8 rounded-lg bg-gray-100 dark:bg-gray-700/50 flex items-center justify-center text-[10px] text-gray-500 uppercase">
                                                    {log.student?.firstName?.charAt(0) || ''}{log.student?.lastName?.charAt(0) || ''}
                                                </div>
                                                {log.student?.firstName || ''} {log.student?.lastName || ''}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-xs font-bold text-gray-500 dark:text-gray-400">
                                            {log.class?.name} {log.section?.name ? `(${log.section.name})` : ''}
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={clsx(
                                                "px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider",
                                                getStatusColor(log.status)
                                            )}>
                                                {log.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-xs text-gray-500 dark:text-gray-400 italic">
                                            {log.remarks || '-'}
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

export default StudentAttendanceHistoryPage;
