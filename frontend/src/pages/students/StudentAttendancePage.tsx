import React, { useState, useEffect } from 'react';
import { 
    Calendar as CalendarIcon, 
    CheckCircle, 
    XCircle, 
    Clock, 
    AlertCircle, 
    ChevronLeft, 
    ChevronRight,
    TrendingUp,
    Download
} from 'lucide-react';
import api from '../../services/api';
import { useAuthStore } from '../../stores/authStore';
import { useToast } from '../../context/ToastContext';
import { 
    format, 
    startOfMonth, 
    endOfMonth, 
    isSameMonth, 
    isToday, 
    isSameDay, 
    addMonths, 
    subMonths, 
    startOfWeek, 
    endOfWeek,
    addDays
} from 'date-fns';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

const StudentAttendancePage: React.FC = () => {
    const { user } = useAuthStore();
    const toast = useToast();
    
    const [currentMonth, setCurrentMonth] = useState(new Date());
    const [attendanceData, setAttendanceData] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({
        present: 0,
        absent: 0,
        late: 0,
        medical: 0,
        total: 0,
        percentage: 0
    });

    useEffect(() => {
        if (user?.id) {
            fetchAttendance();
        }
    }, [currentMonth, user?.id]);

    const fetchAttendance = async () => {
        try {
            setLoading(true);
            const start = format(startOfMonth(currentMonth), 'yyyy-MM-dd');
            const end = format(endOfMonth(currentMonth), 'yyyy-MM-dd');
            
            console.log('Fetching attendance for:', user?.id, 'from:', start, 'to:', end);
            const data = await api.getStudentAttendance(user!.id, start, end);
            console.log('Received attendance data:', data);
            setAttendanceData(data);
            calculateStats(data);
        } catch (error) {
            console.error('Error fetching attendance:', error);
            toast.showError('Failed to load attendance records');
        } finally {
            setLoading(false);
        }
    };

    const calculateStats = (data: any[]) => {
        const present = data.filter(d => d.status === 'present').length;
        const absent = data.filter(d => d.status === 'absent').length;
        const late = data.filter(d => d.status === 'late').length;
        const medical = data.filter(d => d.status === 'medical').length;
        const holiday = data.filter(d => d.status === 'holiday').length;
        const total = data.length;
        // Exclude holidays from the base "school days" for percentage calculation
        const schoolDays = total - holiday;
        const percentage = schoolDays > 0 ? Math.round(((present + late + medical) / schoolDays) * 100) : 0;

        setStats({ present, absent, late, medical, total, percentage });
    };

    const nextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));
    const prevMonth = () => setCurrentMonth(subMonths(currentMonth, 1));

    const StatCard = ({ label, value, icon: Icon, color, sub }: any) => {
        const colors: any = {
            blue: "bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400 border-blue-100 dark:border-blue-800",
            green: "bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400 border-emerald-100 dark:border-emerald-800",
            red: "bg-rose-50 text-rose-600 dark:bg-rose-900/30 dark:text-rose-400 border-rose-100 dark:border-rose-800",
            primary: "bg-primary-50 text-primary-600 dark:bg-primary-900/30 dark:text-primary-400 border-primary-100 dark:border-primary-800"
        };

        return (
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-100 dark:border-gray-700 shadow-sm hover:shadow-md transition-all group overflow-hidden relative">
                <div className={cn("absolute top-0 right-0 w-24 h-24 blur-3xl opacity-10 transition-opacity group-hover:opacity-20", colors[color])}></div>
                <div className="flex justify-between items-start relative z-10">
                    <div>
                        <p className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-1">{label}</p>
                        <h3 className="text-3xl font-black text-gray-900 dark:text-white">{value}</h3>
                    </div>
                    <div className={cn("p-3 rounded-xl transition-transform group-hover:scale-110 duration-300", colors[color])}>
                        <Icon className="w-6 h-6" />
                    </div>
                </div>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-4 flex items-center font-medium">
                    {sub}
                </p>
            </div>
        );
    };

    const StatusBadge = ({ status }: { status: string }) => {
        const config: any = {
            present: { label: 'Present', color: 'bg-emerald-500', text: 'text-emerald-500', bg: 'bg-emerald-50 dark:bg-emerald-900/20' },
            absent: { label: 'Absent', color: 'bg-rose-500', text: 'text-rose-500', bg: 'bg-rose-50 dark:bg-rose-900/20' },
            late: { label: 'Late', color: 'bg-amber-500', text: 'text-amber-500', bg: 'bg-amber-50 dark:bg-amber-900/20' },
            medical: { label: 'Medical', color: 'bg-blue-500', text: 'text-blue-500', bg: 'bg-blue-50 dark:bg-blue-900/20' },
            halfday: { label: 'Half Day', color: 'bg-purple-500', text: 'text-purple-500', bg: 'bg-purple-50 dark:bg-purple-900/20' },
            holiday: { label: 'Holiday', color: 'bg-purple-600', text: 'text-purple-600', bg: 'bg-purple-50 dark:bg-purple-900/20' }
        };
        const c = config[status.toLowerCase()] || config.present;
        return (
            <span className={cn("px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5", c.bg, c.text)}>
                <span className={cn("w-1.5 h-1.5 rounded-full ", c.color)}></span>
                {c.label}
            </span>
        );
    };

    const renderCalendarDays = () => {
        const monthStart = startOfMonth(currentMonth);
        const monthEnd = endOfMonth(monthStart);
        const startDate = startOfWeek(monthStart);
        const endDate = endOfWeek(monthEnd);
        
        const days = [];
        let day = startDate;

        while (day <= endDate) {
            const cloneDay = day;
            const record = attendanceData.find(d => isSameDay(new Date(d.date), cloneDay));
            
            days.push(
                <div
                    key={day.toString()}
                    className={cn(
                        "min-h-[120px] p-4 border-r border-b border-gray-100 dark:border-gray-700/50 relative group transition-all",
                        !isSameMonth(day, monthStart) 
                            ? "bg-gray-50/30 dark:bg-gray-900/20 opacity-30 cursor-not-allowed" 
                            : "bg-white dark:bg-gray-800/40 hover:bg-gray-50/50 dark:hover:bg-gray-700/40"
                    )}
                >
                    <div className="flex justify-between items-start">
                        <span className={cn(
                            "text-sm font-bold transition-all",
                            isToday(day) 
                                ? "w-8 h-8 bg-primary-600 text-white rounded-xl flex items-center justify-center -mt-1 -ml-1 shadow-lg shadow-primary-500/40 ring-4 ring-primary-50 dark:ring-primary-900/20" 
                                : "text-gray-400 dark:text-gray-500 group-hover:text-gray-900 dark:group-hover:text-white"
                        )}>
                            {format(day, 'd')}
                        </span>
                        {isToday(day) && <span className="text-[10px] font-black text-primary-600 animate-pulse">TODAY</span>}
                    </div>
                    
                    <div className="mt-4">
                        {record ? (
                            <div className="space-y-2 animate-in fade-in slide-in-from-bottom-2 duration-500">
                                <StatusBadge status={record.status} />
                                {record.remarks && (
                                    <p className="text-[10px] text-gray-500 dark:text-gray-400 italic line-clamp-2 leading-relaxed bg-gray-50 dark:bg-gray-800/80 p-1.5 rounded-lg border border-gray-100 dark:border-gray-700/50">
                                        {record.remarks}
                                    </p>
                                )}
                            </div>
                        ) : isSameMonth(day, monthStart) && day < new Date() ? (
                            <div className="pt-2 flex flex-col items-center gap-2 opacity-20 group-hover:opacity-100 transition-opacity">
                                <AlertCircle className="w-5 h-5 text-gray-300" />
                                <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest text-center">Unrecorded</span>
                            </div>
                        ) : null}
                    </div>
                </div>
            );
            day = addDays(day, 1);
        }

        return days;
    };

    return (
        <div className="space-y-8 animate-in fade-in duration-700">
            {/* Header Section */}
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 p-8 bg-white dark:bg-gray-800 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-700 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-primary-50/50 dark:bg-primary-900/10 rounded-full blur-3xl -mr-20 -mt-20"></div>
                <div className="relative z-10">
                    <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight flex items-center gap-3">
                        <CalendarIcon className="w-8 h-8 text-primary-600" />
                        Attendance Calendar
                    </h1>
                    <p className="text-gray-500 dark:text-gray-400 mt-2 font-medium max-w-lg">
                        Visualizing your daily presence. Maintain a high attendance record for better academic results.
                    </p>
                </div>
                
                <div className="flex flex-wrap items-center gap-4 relative z-10 w-full lg:w-auto">
                    <div className="flex items-center gap-2 bg-gray-50 dark:bg-gray-900/50 p-1.5 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-inner w-full sm:w-auto justify-between">
                        <button 
                            onClick={prevMonth}
                            className="p-2 hover:bg-white dark:hover:bg-gray-800 rounded-xl transition-all text-gray-600 dark:text-gray-400 hover:shadow-sm"
                        >
                            <ChevronLeft className="w-5 h-5" />
                        </button>
                        <div className="px-6 py-2 text-sm font-black text-gray-900 dark:text-white min-w-[160px] text-center uppercase tracking-widest">
                            {format(currentMonth, 'MMMM yyyy')}
                        </div>
                        <button 
                            onClick={nextMonth}
                            className="p-2 hover:bg-white dark:hover:bg-gray-800 rounded-xl transition-all text-gray-600 dark:text-gray-400 hover:shadow-sm"
                        >
                            <ChevronRight className="w-5 h-5" />
                        </button>
                    </div>
                    
                    <button className="flex items-center gap-2 px-6 py-3 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 border border-gray-200 dark:border-gray-700 font-bold rounded-2xl hover:bg-gray-50 dark:hover:bg-gray-700 transition-all shadow-sm active:scale-95 w-full sm:w-auto justify-center">
                        <Download className="w-5 h-5 text-primary-600" />
                        <span>Export PDF</span>
                    </button>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard 
                    label="Current Rate" 
                    value={`${stats.percentage}%`} 
                    icon={TrendingUp} 
                    color="blue" 
                    sub={stats.percentage >= 90 ? 'High Performance' : 'Keep improving!'}
                />
                <StatCard 
                    label="Present Days" 
                    value={stats.present + stats.late} 
                    icon={CheckCircle} 
                    color="green" 
                    sub={`${stats.late} instances of Lateness`}
                />
                <StatCard 
                    label="Absent Days" 
                    value={stats.absent} 
                    icon={XCircle} 
                    color="red" 
                    sub={`${stats.medical} medically excused`}
                />
                <StatCard 
                    label="Total Entries" 
                    value={stats.total} 
                    icon={Clock} 
                    color="primary" 
                    sub="Recorded so far"
                />
            </div>

            {/* Calendar Main Section */}
            <div className="bg-white dark:bg-gray-800 rounded-[2.5rem] shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
                <div className="grid grid-cols-7 border-b border-gray-100 dark:border-gray-700">
                    {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                        <div key={day} className="py-5 text-center text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 dark:text-gray-500 bg-gray-50/50 dark:bg-gray-900/30">
                            {day}
                        </div>
                    ))}
                </div>
                
                <div className="grid grid-cols-7 relative">
                    {loading ? (
                        <div className="absolute inset-0 z-20 bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm flex items-center justify-center">
                            <div className="flex flex-col items-center gap-4">
                                <div className="w-12 h-12 border-4 border-primary-600 border-t-transparent rounded-full animate-spin"></div>
                                <p className="text-sm font-bold text-gray-500 uppercase tracking-widest animate-pulse">Syncing Calendar...</p>
                            </div>
                        </div>
                    ) : null}
                    
                    {renderCalendarDays()}
                </div>
            </div>

            {/* Legend and Info */}
            <div className="flex flex-wrap items-center justify-center gap-8 py-4 opacity-70">
                <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-emerald-500 shadow-sm shadow-emerald-500/50"></div>
                    <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Present</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-rose-500 shadow-sm shadow-rose-500/50"></div>
                    <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Absent</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-amber-500 shadow-sm shadow-amber-500/50"></div>
                    <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Late</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-blue-500 shadow-sm shadow-blue-500/50"></div>
                    <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Medical Leave</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-purple-500 shadow-sm shadow-purple-500/50"></div>
                    <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Half Day</span>
                </div>
            </div>
        </div>
    );
};

export default StudentAttendancePage;
