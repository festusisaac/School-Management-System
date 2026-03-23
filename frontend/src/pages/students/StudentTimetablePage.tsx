import { useState, useEffect, useCallback } from 'react';
import { 
    Calendar, 
    Clock, 
    BookOpen, 
    MapPin, 
    User, 
    Printer,
    Info
} from 'lucide-react';
import api from '../../services/api';
import { useAuthStore } from '../../stores/authStore';
import { clsx } from 'clsx';

interface Period {
    id: string;
    name: string;
    type: string;
    startTime: string;
    endTime: string;
}

interface TimetableSlot {
    dayOfWeek: number;
    periodId: string;
    subject?: { name: string; code?: string };
    teacher?: { firstName: string; lastName: string };
    roomNumber?: string;
}

const DAYS = [
    { value: 1, label: 'Monday' },
    { value: 2, label: 'Tuesday' },
    { value: 3, label: 'Wednesday' },
    { value: 4, label: 'Thursday' },
    { value: 5, label: 'Friday' },
];

export default function StudentTimetablePage() {
    const { user } = useAuthStore();
    
    const [student, setStudent] = useState<any>(null);
    const [periods, setPeriods] = useState<Period[]>([]);
    const [timetable, setTimetable] = useState<TimetableSlot[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<number>(new Date().getDay() || 1); // Default to today or Monday
    const [currentTime, setCurrentTime] = useState(new Date());

    const fetchData = useCallback(async () => {
        if (!user?.id) return;
        setLoading(true);
        try {
            // 1. Get Student Profile to find Class/Section
            const studentData = await api.getStudentById(user.id);
            setStudent(studentData);

            if (studentData.classId) {
                // 2. Fetch Periods and Timetable slots
                const [periodsData, timetableData] = await Promise.all([
                    api.getPeriods(),
                    api.getTimetable(studentData.classId, studentData.sectionId)
                ]);
                
                // Sort periods by time
                const sortedPeriods = [...periodsData].sort((a, b) => a.startTime.localeCompare(b.startTime));
                setPeriods(sortedPeriods);
                setTimetable(timetableData);
            }
        } catch (error: any) {
            console.error('Failed to load timetable data', error);
        } finally {
            setLoading(false);
        }
    }, [user?.id]);

    useEffect(() => {
        fetchData();
        
        // Update clock every minute for live highlighting
        const timer = setInterval(() => setCurrentTime(new Date()), 60000);
        return () => clearInterval(timer);
    }, [fetchData]);

    const formatTime = (time: string) => {
        if (!time) return '';
        const [hours, minutes] = time.split(':');
        const h = parseInt(hours);
        const ampm = h >= 12 ? 'PM' : 'AM';
        const displayHour = h > 12 ? h - 12 : (h === 0 ? 12 : h);
        return `${displayHour}:${minutes} ${ampm}`;
    };

    const isCurrentPeriod = (period: Period, dayValue: number) => {
        const now = currentTime;
        const currentDay = now.getDay();
        if (currentDay !== dayValue) return false;

        const [startH, startM] = period.startTime.split(':').map(Number);
        const [endH, endM] = period.endTime.split(':').map(Number);
        
        const startTime = new Date(now);
        startTime.setHours(startH, startM, 0);
        
        const endTime = new Date(now);
        endTime.setHours(endH, endM, 0);
        
        return now >= startTime && now <= endTime;
    };

    const getSlot = (dayValue: number, periodId: string) => {
        return timetable.find(s => s.dayOfWeek === dayValue && s.periodId === periodId);
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
            </div>
        );
    }

    if (!student?.classId) {
        return (
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-12 text-center shadow-sm border border-gray-100 dark:border-gray-700">
                <Info className="w-16 h-16 text-blue-500 mx-auto mb-4 opacity-50" />
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">Unassigned Class</h2>
                <p className="text-gray-500 dark:text-gray-400 mt-2 max-w-md mx-auto">
                    You have not been assigned to any class yet. Please contact the administrator to set up your academic profile.
                </p>
            </div>
        );
    }

    return (
        <div id="timetable-page" className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-full">
            {/* Header Card */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-6 md:p-8 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-primary-50 dark:bg-primary-900/10 rounded-full blur-3xl -mr-20 -mt-20"></div>
                <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div>
                        <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight">Class Timetable</h1>
                        <div className="mt-3 flex flex-wrap items-center gap-3">
                            <span className="px-3 py-1 bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 text-xs font-bold rounded-full border border-primary-200 dark:border-primary-800 uppercase tracking-wider">
                                {student.class?.name} {student.section?.name}
                            </span>
                            <span className="text-gray-300 dark:text-gray-600">|</span>
                            <span className="flex items-center text-sm font-medium text-gray-500 dark:text-gray-400">
                                <Calendar className="w-4 h-4 mr-2 text-primary-500" />
                                Week Schedule
                            </span>
                        </div>
                    </div>
                    <div className="flex gap-2">
                        <button 
                            onClick={() => window.print()}
                            className="p-2.5 bg-gray-50 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-600 transition shadow-sm print:hidden"
                            title="Print Timetable"
                        >
                            <Printer className="w-5 h-5" />
                        </button>
                    </div>
                </div>
            </div>

            {/* Mobile Day Selector Tabs */}
            <div className="lg:hidden flex overflow-x-auto pb-2 gap-2 no-scrollbar print:hidden">
                {DAYS.map(day => (
                    <button
                        key={day.value}
                        onClick={() => setActiveTab(day.value)}
                        className={clsx(
                            "flex-shrink-0 px-5 py-2.5 rounded-xl font-bold text-sm transition-all duration-200",
                            activeTab === day.value
                                ? "bg-primary-600 text-white shadow-lg shadow-primary-600/20"
                                : "bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400 border border-gray-100 dark:border-gray-700"
                        )}
                    >
                        {day.label}
                    </button>
                ))}
            </div>

            {/* Timetable Grid (Desktop) / List (Mobile) */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
                {/* Desktop Grid View */}
                <div className="hidden lg:block overflow-x-auto print:block">
                    <table className="w-full border-collapse">
                        <thead>
                            <tr className="bg-gray-50/50 dark:bg-gray-900/50">
                                <th className="p-4 text-left text-xs font-bold text-gray-400 uppercase tracking-widest border-b border-gray-100 dark:border-gray-700 w-40">Period</th>
                                {DAYS.map(day => (
                                    <th key={day.value} className="p-4 text-center text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest border-b border-gray-100 dark:border-gray-700">
                                        {day.label}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-gray-700 font-sans">
                            {periods.map(period => (
                                <tr key={period.id} className="group hover:bg-gray-50/30 dark:hover:bg-gray-900/20 transition-colors">
                                    <td className="p-5 border-r border-gray-50 dark:border-gray-700/50">
                                        <div className="flex flex-col">
                                            <span className="text-sm font-extrabold text-gray-900 dark:text-white uppercase tracking-tight">{period.name}</span>
                                            <div className="flex items-center text-xs text-gray-500 dark:text-gray-400 mt-1">
                                                <Clock className="w-3 h-3 mr-1.5 text-primary-500" />
                                                {formatTime(period.startTime)}
                                            </div>
                                        </div>
                                    </td>
                                    {DAYS.map(day => {
                                        const slot = getSlot(day.value, period.id);
                                        const active = isCurrentPeriod(period, day.value);
                                        const isBreak = period.type !== 'LESSON';
                                        
                                        return (
                                            <td key={`${day.value}-${period.id}`} className={clsx(
                                                "p-4 relative min-w-[140px]",
                                                isBreak && "bg-gray-50/30 dark:bg-gray-900/10"
                                            )}>
                                                {active && (
                                                    <div className="absolute inset-x-1 inset-y-1 bg-primary-50/50 dark:bg-primary-900/10 border-2 border-primary-500 rounded-xl z-0 animate-pulse-subtle print:border-primary-600"></div>
                                                )}
                                                
                                                <div className="relative z-10 flex flex-col items-center justify-center min-h-[80px]">
                                                    {isBreak ? (
                                                        <span className="text-[10px] font-black text-gray-300 dark:text-gray-600 uppercase tracking-[0.2em] transform rotate-[-15deg]">
                                                            {period.name}
                                                        </span>
                                                    ) : slot ? (
                                                        <>
                                                            <div className="w-9 h-9 bg-primary-50 dark:bg-primary-900/30 rounded-lg flex items-center justify-center mb-2 text-primary-700 dark:text-primary-400 font-bold text-xs ring-1 ring-primary-200 dark:ring-primary-800">
                                                                {slot.subject?.code || slot.subject?.name?.substring(0, 3).toUpperCase()}
                                                            </div>
                                                            <h4 className="text-sm font-bold text-gray-900 dark:text-white text-center line-clamp-2 leading-tight px-1">{slot.subject?.name}</h4>
                                                            {slot.roomNumber && (
                                                                <span className="mt-2 text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/30 px-2 py-0.5 rounded-full flex items-center shadow-sm">
                                                                    <MapPin className="w-2.5 h-2.5 mr-1" /> {slot.roomNumber}
                                                                </span>
                                                            )}
                                                        </>
                                                    ) : (
                                                        <div className="w-8 h-8 rounded-full border border-dashed border-gray-200 dark:border-gray-700 opacity-40"></div>
                                                    )}
                                                </div>
                                            </td>
                                        );
                                    })}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Mobile List View */}
                <div className="lg:hidden p-4 space-y-4 print:hidden">
                    {periods.map(period => {
                        const slot = getSlot(activeTab, period.id);
                        const active = isCurrentPeriod(period, activeTab);
                        const isBreak = period.type !== 'LESSON';
                        
                        return (
                            <div 
                                key={period.id} 
                                className={clsx(
                                    "p-5 rounded-2xl border transition-all duration-300",
                                    active 
                                        ? "bg-primary-50 dark:bg-primary-900/20 border-primary-200 dark:border-primary-800 shadow-md ring-1 ring-primary-500" 
                                        : "bg-white dark:bg-gray-800 border-gray-100 dark:border-gray-700 hover:border-gray-200 shadow-sm"
                                )}
                            >
                                <div className="flex justify-between items-start mb-4">
                                    <div className="flex items-center">
                                        <div className={clsx(
                                            "w-2.5 h-2.5 rounded-full mr-3 shadow-sm",
                                            active ? "bg-primary-500 animate-pulse" : "bg-gray-200 dark:bg-gray-700"
                                        )}></div>
                                        <h3 className="font-bold text-gray-900 dark:text-white uppercase tracking-wider text-[10px]">{period.name}</h3>
                                    </div>
                                    <span className="text-xs font-bold text-primary-600 dark:text-primary-400 bg-primary-50/50 dark:bg-primary-900/30 px-3 py-1.5 rounded-xl border border-primary-100 dark:border-primary-800 shadow-sm">
                                        {formatTime(period.startTime)} - {formatTime(period.endTime)}
                                    </span>
                                </div>
                                
                                {isBreak ? (
                                    <div className="py-2 text-center">
                                        <span className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest">{period.name} Break</span>
                                    </div>
                                ) : slot ? (
                                    <div className="flex items-center gap-4">
                                        <div className="w-14 h-14 bg-gray-50 dark:bg-gray-700/50 rounded-2xl flex items-center justify-center text-primary-600 dark:text-primary-400 font-bold shadow-inner border border-gray-100 dark:border-gray-600">
                                            {slot.subject?.code || <BookOpen className="w-6 h-6" />}
                                        </div>
                                        <div className="flex-1">
                                            <h4 className="font-bold text-gray-900 dark:text-white text-lg leading-tight">{slot.subject?.name}</h4>
                                            <div className="flex flex-wrap gap-x-4 gap-y-2 mt-2">
                                                <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center bg-gray-50 dark:bg-gray-700/50 px-2 py-1 rounded-lg">
                                                    <User className="w-3.5 h-3.5 mr-2 text-primary-500" /> 
                                                    {slot.teacher ? `${slot.teacher.firstName} ${slot.teacher.lastName}` : 'TBA'}
                                                </p>
                                                {slot.roomNumber && (
                                                    <p className="text-xs font-bold text-emerald-600 dark:text-emerald-400 flex items-center bg-emerald-50 dark:bg-emerald-900/20 px-2 py-1 rounded-lg">
                                                        <MapPin className="w-3.5 h-3.5 mr-2" /> {slot.roomNumber}
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="text-center py-4 bg-gray-50/50 dark:bg-gray-900/50 rounded-xl border border-dashed border-gray-200 dark:border-gray-700">
                                        <p className="text-gray-400 dark:text-gray-500 text-xs font-medium italic"> No lesson scheduled </p>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Print Only Styles */}
            <style dangerouslySetInnerHTML={{ __html: `
                @media print {
                    body * { visibility: hidden !important; }
                    #timetable-page, #timetable-page * { visibility: visible !important; }
                    #timetable-page { position: absolute; left: 0; top: 0; width: 100%; padding: 0 !important; margin: 0 !important; }
                    .print\\:hidden { display: none !important; }
                    .rounded-2xl { border-radius: 0 !important; }
                    .shadow-sm, .shadow-md, .shadow-lg, .shadow-2xl { box-shadow: none !important; }
                    table { border: 2px solid black !important; }
                    th, td { border: 1px solid black !important; color: black !important; }
                    .bg-primary-50, .bg-emerald-50, .bg-gray-50 { background-color: transparent !important; }
                    .text-primary-600, .text-emerald-600, .text-gray-900 { color: black !important; }
                }
                @keyframes pulse-subtle {
                    0%, 100% { opacity: 0.8; }
                    50% { opacity: 0.4; }
                }
                .animate-pulse-subtle {
                    animation: pulse-subtle 3s cubic-bezier(0.4, 0, 0.6, 1) infinite;
                }
                .no-scrollbar::-webkit-scrollbar { display: none; }
                .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
            `}} />
        </div>
    );
}
