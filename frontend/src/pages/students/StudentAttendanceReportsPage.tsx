import React, { useState, useEffect } from 'react';
import { 
    BarChart3, 
    Download, 
    Calendar, 
    Users, 
    TrendingUp, 
    AlertCircle,
    ChevronDown,
    Filter,
    PieChart as PieChartIcon
} from 'lucide-react';
import api from '../../services/api';
import { useToast } from '../../context/ToastContext';
import { format, startOfMonth, endOfMonth, subMonths } from 'date-fns';
import { clsx } from 'clsx';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  PieChart,
  Pie,
} from 'recharts';
import { exportToExcel } from '../../utils/excelExport';
import { downloadPDF } from '../../utils/pdfGenerator';

const StudentAttendanceReportsPage: React.FC = () => {
    const [startDate, setStartDate] = useState(format(subMonths(new Date(), 1), 'yyyy-MM-dd'));
    const [endDate, setEndDate] = useState(format(new Date(), 'yyyy-MM-dd'));
    const [selectedClass, setSelectedClass] = useState('');
    const [classes, setClasses] = useState<any[]>([]);
    const [reportData, setReportData] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [stats, setStats] = useState({ avgPresence: '0%', absents: '0', students: '0' });
    const [pieData, setPieData] = useState<any[]>([]);
    const [rawLogs, setRawLogs] = useState<any[]>([]);
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

    const handleExportPDF = async () => {
        const element = document.getElementById('export-pdf-content');
        if (element) {
            try {
                toast.showLoading('Generating PDF Download...');
                await downloadPDF(element, { 
                    filename: `attendance-report-${format(new Date(), 'yyyy-MM-dd')}.pdf`,
                    orientation: 'landscape' 
                });
                toast.showSuccess('Report exported successfully');
            } catch (error) {
                console.error('Error generating PDF:', error);
                toast.showError('Failed to generate report');
            }
        }
    };

    const handleExportCSV = () => {
        if (rawLogs.length === 0) {
            toast.showError('No data available to export');
            return;
        }
        
        const columns = [
            { header: 'Date', key: 'date', formatter: (val: any) => format(new Date(val), 'MMM dd, yyyy') },
            { header: 'Student First Name', key: 'student', formatter: (val: any) => val?.firstName || '' },
            { header: 'Student Last Name', key: 'student', formatter: (val: any) => val?.lastName || '' },
            { header: 'Admission No', key: 'student', formatter: (val: any) => val?.admissionNo || '' },
            { header: 'Class', key: 'class', formatter: (val: any) => val?.name || '' },
            { header: 'Section', key: 'section', formatter: (val: any) => val?.name || '' },
            { header: 'Status', key: 'status', formatter: (val: string) => val.toUpperCase() },
            { header: 'Remarks', key: 'remarks', formatter: (val: any) => val || '' },
        ];
        
        try {
            exportToExcel(rawLogs, columns, `attendance-logs-${format(new Date(), 'yyyy-MM-dd')}.xlsx`, 'Attendance Logs');
            toast.showSuccess('CSV downloaded successfully');
        } catch (error) {
            console.error('Error exporting CSV:', error);
            toast.showError('Failed to download CSV');
        }
    };

    useEffect(() => {
        const fetchReportData = async () => {
            try {
                setLoading(true);
                const logs = await api.getAttendanceLogs({ 
                    startDate, 
                    endDate, 
                    classId: selectedClass || undefined 
                });
                setRawLogs(logs);

                // 1. Calculate Summary Stats
                const total = logs.length;
                if (total > 0) {
                    const present = logs.filter(l => l.status === 'present').length;
                    const absent = logs.filter(l => l.status === 'absent').length;
                    const late = logs.filter(l => l.status === 'late').length;
                    const medical = logs.filter(l => l.status === 'medical').length;
                    const uniqueStudents = new Set(logs.map(l => l.studentId)).size;

                    setStats({
                        avgPresence: `${((present / total) * 100).toFixed(1)}%`,
                        absents: absent.toString(),
                        students: uniqueStudents.toString()
                    });

                    // 2. Prepare Pie Chart Data
                    setPieData([
                        { name: 'Present', value: Math.round((present / total) * 100), color: '#10b981' },
                        { name: 'Absent', value: Math.round((absent / total) * 100), color: '#f43f5e' },
                        { name: 'Late', value: Math.round((late / total) * 100), color: '#f59e0b' },
                        { name: 'Medical', value: Math.round((medical / total) * 100), color: '#3b82f6' },
                    ]);

                    // 3. Prepare Bar Chart Data (Class-wise)
                    const classMap: Record<string, { name: string, presentCount: number, totalCount: number }> = {};
                    logs.forEach(log => {
                        const cId = log.classId;
                        if (!classMap[cId]) {
                            classMap[cId] = { name: log.class?.name || 'Unknown', presentCount: 0, totalCount: 0 };
                        }
                        classMap[cId].totalCount++;
                        if (log.status === 'present') classMap[cId].presentCount++;
                    });

                    const barData = Object.values(classMap).map(c => ({
                        name: c.name,
                        present: Math.round((c.presentCount / c.totalCount) * 100)
                    }));
                    setReportData(barData);
                } else {
                    setStats({ avgPresence: '0%', absents: '0', students: '0' });
                    setPieData([]);
                    setReportData([]);
                }
            } catch (error) {
                console.error('Error fetching report:', error);
                toast.showError('Failed to load report data');
            } finally {
                setLoading(false);
            }
        };

        fetchReportData();
    }, [startDate, endDate, selectedClass]);

    return (
        <div className="p-2 sm:p-4 min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-300">
            {/* Top Action Bar (Outside PDF) */}
            <div className="flex justify-end gap-3 mb-4">
                <button 
                    onClick={handleExportCSV}
                    className="flex items-center gap-2 px-6 py-2 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 border border-gray-200 dark:border-gray-700 text-sm font-bold rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-all shadow-sm active:scale-95"
                >
                    <Download size={18} className="text-primary-600" />
                    Export CSV
                </button>
                <button 
                    onClick={handleExportPDF}
                    className="flex items-center gap-2 px-6 py-2 bg-primary-600 text-white text-sm font-bold rounded-lg hover:bg-primary-700 transition-all shadow-lg shadow-primary-500/25 active:scale-95"
                >
                    <Download size={18} />
                    Download PDF Report
                </button>
            </div>

            {/* Exportable PDF Content */}
            <div id="export-pdf-content" className="flex flex-col gap-5 bg-gray-50 dark:bg-gray-900 sm:p-2 rounded-xl">
                
                {/* PDF Header - Premium Design */}
                <div className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div className="flex items-center gap-4">
                        <div className="w-14 h-14 bg-gradient-to-br from-primary-500 to-primary-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-primary-500/30">
                            <BarChart3 size={28} />
                        </div>
                        <div>
                            <h1 className="text-2xl font-black text-gray-900 dark:text-white uppercase tracking-tight">Official Attendance Report</h1>
                            <p className="text-sm font-bold text-gray-500 dark:text-gray-400 mt-1 flex items-center gap-2">
                                <Calendar size={14} />
                                Period: {format(new Date(startDate), 'MMM dd, yyyy')} — {format(new Date(endDate), 'MMM dd, yyyy')}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Filters (Hidden during PDF generation) */}
                <div data-html2canvas-ignore="true" className="bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm mb-2">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-2">
                {[
                    { label: 'Avg. Attendance', value: stats.avgPresence, icon: TrendingUp, color: 'emerald' },
                    { label: 'Total Absents', value: stats.absents, icon: AlertCircle, color: 'rose' },
                    { label: 'Active Students', value: stats.students, icon: Users, color: 'blue' },
                    { label: 'Reporting Period', value: 'Selected Range', icon: Calendar, color: 'amber' },
                ].map((stat, i) => (
                    <div key={i} className="bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm flex items-center gap-3">
                        <div className={clsx(
                            "w-10 h-10 rounded-lg flex items-center justify-center",
                            stat.color === 'emerald' && 'bg-emerald-50 text-emerald-600',
                            stat.color === 'rose' && 'bg-rose-50 text-rose-600',
                            stat.color === 'blue' && 'bg-blue-50 text-blue-600',
                            stat.color === 'amber' && 'bg-amber-50 text-amber-600'
                        )}>
                            <stat.icon size={24} />
                        </div>
                        <div>
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-1">{stat.label}</p>
                            <p className="text-xl font-black text-gray-900 dark:text-white tracking-tight">{stat.value}</p>
                        </div>
                    </div>
                ))}
            </div>

                {/* Quick Stats */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-2">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 items-end">
                    <div>
                        <label className="block text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-1.5">Start Date</label>
                        <input
                            type="date"
                            className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-900/50 border border-gray-100 dark:border-gray-700 text-xs text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-primary-500 outline-none transition-all"
                            value={startDate}
                            onChange={(e) => setStartDate(e.target.value)}
                        />
                    </div>
                    <div>
                        <label className="block text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-1.5">End Date</label>
                        <input
                            type="date"
                            className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-900/50 border border-gray-100 dark:border-gray-700 text-xs text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-primary-500 outline-none transition-all"
                            value={endDate}
                            onChange={(e) => setEndDate(e.target.value)}
                        />
                    </div>
                    <div>
                        <label className="block text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-1.5">Class Filter</label>
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
                </div>
            </div>

            {/* Charts View */}
            <div className="relative">
                {loading && (
                    <div className="absolute inset-0 z-10 bg-white/50 dark:bg-gray-900/50 backdrop-blur-[2px] rounded-xl flex items-center justify-center">
                        <div className="flex flex-col items-center gap-2">
                            <div className="w-8 h-8 border-4 border-primary-600 border-t-transparent rounded-full animate-spin"></div>
                            <span className="text-[10px] font-black uppercase tracking-widest text-primary-600">Analyzing...</span>
                        </div>
                    </div>
                )}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
                    {/* Bar Chart - Class Wise Performance */}
                    <div className="lg:col-span-2 bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm relative overflow-hidden">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="font-black text-gray-400 uppercase tracking-widest text-[9px]">Class-wise Presence %</h3>
                            <TrendingUp size={14} className="text-primary-600" />
                        </div>
                        <div className="h-[250px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={reportData}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                                    <XAxis 
                                        dataKey="name" 
                                        axisLine={false} 
                                        tickLine={false} 
                                        tick={{ fill: '#9CA3AF', fontSize: 9, fontWeight: 700 }}
                                        dy={10}
                                    />
                                    <YAxis 
                                        axisLine={false} 
                                        tickLine={false} 
                                        tick={{ fill: '#9CA3AF', fontSize: 9, fontWeight: 700 }}
                                    />
                                    <Tooltip 
                                        cursor={{ fill: '#F3F4F6' }}
                                        contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', fontSize: '10px' }}
                                    />
                                    <Bar dataKey="present" fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={30} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* Pie Chart - Overall Distribution */}
                    <div className="bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="font-black text-gray-400 uppercase tracking-widest text-[9px]">Distribution</h3>
                            <PieChartIcon size={14} className="text-primary-600" />
                        </div>
                        <div className="h-[200px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={pieData}
                                        innerRadius={50}
                                        outerRadius={70}
                                        paddingAngle={5}
                                        dataKey="value"
                                    >
                                        {pieData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={entry.color} />
                                        ))}
                                    </Pie>
                                    <Tooltip contentStyle={{ fontSize: '10px', borderRadius: '8px' }} />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                        <div className="space-y-2 mt-4">
                            {pieData.map((item, i) => (
                                <div key={i} className="flex justify-between items-center text-xs font-bold">
                                    <div className="flex items-center gap-2 text-gray-500">
                                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }}></div>
                                        {item.name}
                                    </div>
                                    <span className="text-gray-900 dark:text-white">{item.value}%</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
            </div>
        </div>
    );
};

export default StudentAttendanceReportsPage;
