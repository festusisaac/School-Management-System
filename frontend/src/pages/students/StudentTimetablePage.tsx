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

const getSubjectAbbreviation = (name: string): string => {
    const abbrevMap: { [key: string]: string } = {
        'english': 'ENG',
        'mathematics': 'MATHS',
        'kiswahili': 'KISW',
        'science': 'SCI',
        'social studies': 'SST',
        'religious education': 'REL.E',
        'christian religious education': 'CRE',
        'islamic religious education': 'IRE',
        'physical education': 'P.E & S',
        'agriculture': 'AGRIC',
        'home science': 'H. Scie',
        'art and craft': 'ART',
        'music': 'MUSIC',
        'business studies': 'BST',
        'integrated science': 'INT/SCI',
        'life skills': 'L/SKILL',
        'technology': 'TECH',
        'performing arts': 'P.Arts',
        'optional language': 'Opt Lang',
        'french': 'FRE',
        'german': 'GER',
        'arabic': 'ARAB',
        'computer': 'COMP',
        'history': 'HIST',
        'geography': 'GEO',
        'biology': 'BIO',
        'chemistry': 'CHEM',
        'physics': 'PHY',
    };

    const lowerName = name.toLowerCase();
    for (const [key, abbrev] of Object.entries(abbrevMap)) {
        if (lowerName.includes(key)) return abbrev;
    }
    return name.substring(0, 6).toUpperCase();
};

export default function StudentTimetablePage() {
    const { user, selectedChildId, childrenList } = useAuthStore();
    const isParent = (user?.role || user?.roleObject?.name || '').toLowerCase() === 'parent';
    
    const [student, setStudent] = useState<any>(null);
    const [periods, setPeriods] = useState<Period[]>([]);
    const [timetable, setTimetable] = useState<TimetableSlot[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<number>(new Date().getDay() || 1); 
    const [currentTime, setCurrentTime] = useState(new Date());

    const fetchData = useCallback(async () => {
        const studentId = isParent ? selectedChildId : user?.id;
        if (!studentId) return;
        if (isParent && childrenList.length === 0) return;

        setLoading(true);
        try {
            let studentData: any;
            if (isParent) {
                studentData = childrenList.find((c: any) => c.id === selectedChildId);
            } else {
                studentData = await api.getStudentProfile();
            }
            setStudent(studentData);

            if (studentData?.classId) {
                const [periodsData, timetableData] = await Promise.all([
                    api.getPeriods(),
                    api.getTimetable(studentData.classId, studentData.sectionId)
                ]);
                
                const sortedPeriods = [...periodsData].sort((a, b) => a.periodOrder - b.periodOrder);
                setPeriods(sortedPeriods);
                setTimetable(timetableData);
            }
        } catch (error: any) {
            console.error('Failed to load timetable data', error);
        } finally {
            setLoading(false);
        }
    }, [user?.id, isParent, selectedChildId, childrenList]);

    useEffect(() => {
        fetchData();
        const timer = setInterval(() => setCurrentTime(new Date()), 60000);
        return () => clearInterval(timer);
    }, [fetchData]);

    const formatTime = (time: string) => {
        if (!time) return '';
        const [hours, minutes] = time.split(':');
        const h = parseInt(hours);
        const ampm = h >= 12 ? 'PM' : 'AM';
        const displayHour = h > 12 ? h - 12 : (h === 0 ? 12 : h);
        return `${displayHour}:${minutes}${ampm}`;
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

            {/* Timetable Contents */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden print:shadow-none print:border-none print:rounded-none">
                
                {/* Desktop Grid View (Admin Style) */}
                <div className="hidden lg:block overflow-x-auto print:block">
                    <table className="w-full border-collapse">
                        <thead>
                            <tr>
                                {/* Corner Header */}
                                <th
                                    className="border border-black bg-white dark:bg-gray-900 p-0 relative"
                                    style={{ width: '120px', height: '80px', borderRight: '1px solid black' }}
                                >
                                    <svg className="absolute inset-0 w-full h-full" preserveAspectRatio="none">
                                        <line x1="0" y1="0" x2="100%" y2="100%" stroke="currentColor" strokeWidth="1" className="text-black dark:text-gray-600" />
                                    </svg>
                                    <span className="absolute top-2 right-2 font-bold text-xs text-black dark:text-gray-400">TIME</span>
                                    <span className="absolute bottom-2 left-2 font-bold text-xs text-black dark:text-gray-400">DAY</span>
                                </th>

                                {/* Period Headers */}
                                {periods.map(period => (
                                    <th
                                        key={period.id}
                                        className="border border-black p-2 bg-white dark:bg-gray-900 align-top"
                                        style={{ minWidth: period.type === 'LESSON' ? '100px' : '50px' }}
                                    >
                                        <div className="flex flex-col items-center justify-center h-full">
                                            <span className="text-primary-700 dark:text-primary-400 font-bold text-[11px] whitespace-nowrap">
                                                {formatTime(period.startTime)}
                                            </span>
                                            <span className="text-primary-700 dark:text-primary-400 font-bold text-[11px]">-</span>
                                            <span className="text-primary-700 dark:text-primary-400 font-bold text-[11px] whitespace-nowrap">
                                                {formatTime(period.endTime)}
                                            </span>
                                        </div>
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {DAYS.map((day, dayIndex) => (
                                <tr key={day.value}>
                                    <td className="border border-black p-4 font-bold text-sm text-center uppercase bg-white dark:bg-gray-900 text-black dark:text-white">
                                        {day.label}
                                    </td>
                                    {periods.map((period) => {
                                        const slot = getSlot(day.value, period.id);
                                        const isLesson = period.type === 'LESSON';
                                        
                                        if (!isLesson) {
                                            if (dayIndex === 0) {
                                                return (
                                                    <td
                                                        key={period.id}
                                                        rowSpan={DAYS.length}
                                                        className="border border-black p-0 bg-white dark:bg-gray-900 align-middle text-center"
                                                    >
                                                        <div
                                                            className="h-full flex items-center justify-center"
                                                            style={{
                                                                writingMode: 'vertical-rl',
                                                                transform: 'rotate(180deg)',
                                                                maxHeight: '400px'
                                                            }}
                                                        >
                                                            <span className="font-bold text-primary-900 dark:text-primary-400 text-xs tracking-wider uppercase whitespace-nowrap px-2">
                                                                {period.name}
                                                            </span>
                                                        </div>
                                                    </td>
                                                );
                                            }
                                            return null;
                                        }

                                        const active = isCurrentPeriod(period, day.value);

                                        return (
                                            <td
                                                key={period.id}
                                                className={clsx(
                                                    "border border-black p-0 relative h-16 transition-colors",
                                                    active ? "bg-primary-50 dark:bg-primary-900/20" : "bg-white dark:bg-gray-800"
                                                )}
                                            >
                                                <div className="w-full h-full flex flex-col items-center justify-center p-1">
                                                    {slot ? (
                                                        <>
                                                            <span className="font-bold text-sm text-center uppercase text-gray-900 dark:text-white">
                                                                {slot.subject?.code || getSubjectAbbreviation(slot.subject?.name || '')}
                                                            </span>
                                                            {slot.roomNumber && (
                                                                <span className="text-[10px] text-gray-500 dark:text-gray-400">{slot.roomNumber}</span>
                                                            )}
                                                        </>
                                                    ) : (
                                                        <span className="text-gray-200 dark:text-gray-700/50">-</span>
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

                {/* Mobile List View (Original Design) */}
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
                    @page {
                        size: A4 landscape;
                        margin: 5mm;
                    }
                    body * { visibility: hidden !important; }
                    #timetable-page, #timetable-page * { visibility: visible !important; }
                    #timetable-page { position: absolute; left: 0; top: 0; width: 100%; padding: 0 !important; margin: 0 !important; }
                    .print\\:hidden { display: none !important; }
                    .rounded-2xl { border-radius: 0 !important; }
                    .shadow-sm, .shadow-md, .shadow-lg, .shadow-2xl { box-shadow: none !important; }
                    table { border: 2px solid black !important; width: 100% !important; border-collapse: collapse !important; }
                    th, td { border: 1px solid black !important; color: black !important; padding: 4px !important; }
                    .bg-primary-50, .bg-emerald-50, .bg-gray-50 { background-color: transparent !important; }
                    .text-primary-600, .text-emerald-600, .text-gray-900 { color: black !important; }
                    
                    /* Force grid view for print */
                    .lg\\:hidden { display: none !important; }
                    .hidden.lg\\:block { display: block !important; }
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
