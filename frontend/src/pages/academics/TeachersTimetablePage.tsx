import { useState, useEffect, useRef } from 'react';
import { Printer, ChevronDown, Calendar, User, Clock } from 'lucide-react';
import api from '../../services/api';
import { useAuthStore } from '../../stores/authStore';

interface Staff {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    employeeId: string;
    role: string;
    roleObject?: {
        name: string;
    };
    isTeachingStaff?: boolean;
}

interface Class {
    id: string;
    name: string;
}

interface Section {
    id: string;
    name: string;
}

interface Subject {
    id: string;
    name: string;
    code?: string;
}

interface Period {
    id: string;
    name: string;
    type: string;
    startTime: string;
    endTime: string;
    periodOrder: number;
}

interface TimetableSlot {
    id: string;
    dayOfWeek: number;
    periodId: string;
    subjectId: string;
    classId: string;
    sectionId: string;
    roomNumber?: string;
    subject?: Subject;
    period?: Period;
    class?: Class;
    section?: Section;
}

const DAYS = [
    { value: 1, label: 'Monday' },
    { value: 2, label: 'Tuesday' },
    { value: 3, label: 'Wednesday' },
    { value: 4, label: 'Thursday' },
    { value: 5, label: 'Friday' },
];

const formatTime = (time: string): string => {
    if (!time) return '';
    const [hours, minutes] = time.split(':');
    const h = parseInt(hours);
    const ampm = h >= 12 ? 'PM' : 'AM';
    const displayHour = h > 12 ? h - 12 : (h === 0 ? 12 : h);
    return `${displayHour}:${minutes} ${ampm}`;
};

const getSubjectColor = (subjectName: string): string => {
    const colors = [
        'bg-primary-100 text-primary-800 border-primary-200',
        'bg-green-100 text-green-800 border-green-200',
        'bg-secondary-100 text-secondary-800 border-secondary-200',
        'bg-orange-100 text-orange-800 border-orange-200',
        'bg-pink-100 text-pink-800 border-pink-200',
        'bg-primary-100 text-primary-800 border-primary-200',
        'bg-teal-100 text-teal-800 border-teal-200',
        'bg-yellow-100 text-yellow-800 border-yellow-200',
    ];
    const hash = subjectName.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return colors[hash % colors.length];
};

const TeachersTimetablePage = () => {
    const [teachers, setTeachers] = useState<Staff[]>([]);
    const [selectedTeacher, setSelectedTeacher] = useState('');
    const [timetable, setTimetable] = useState<TimetableSlot[]>([]);
    const [periods, setPeriods] = useState<Period[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const { user } = useAuthStore();
    const isTeacher = user?.role?.toLowerCase() === 'teacher';
    const isAdmin = user?.role?.toLowerCase() === 'admin' || user?.role?.toLowerCase() === 'superadmin';

    const printRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        fetchInitialData();
    }, []);

    useEffect(() => {
        if (selectedTeacher) {
            fetchTeacherTimetable();
        }
    }, [selectedTeacher]);

    const fetchInitialData = async () => {
        try {
            setLoading(true);
            const [staffData, periodsData] = await Promise.all([
                api.getStaff(),
                api.getPeriods()
            ]);
            // Filter only teachers using isTeachingStaff flag or "Teacher" role
            const teacherList = staffData.filter((s: Staff) => 
                s.isTeachingStaff === true || 
                s.roleObject?.name?.toLowerCase() === 'teacher' || 
                s.role?.toLowerCase() === 'teacher'
            );
            setTeachers(teacherList);
            setPeriods(periodsData.sort((a: Period, b: Period) => a.periodOrder - b.periodOrder));

            // Auto-select current teacher if applicable
            if (isTeacher) {
                const currentTeacher = teacherList.find((t: Staff) => t.email === user.email);
                if (currentTeacher) {
                    setSelectedTeacher(currentTeacher.id);
                }
            }
            
            setError('');
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to fetch data');
        } finally {
            setLoading(false);
        }
    };

    const fetchTeacherTimetable = async () => {
        try {
            setLoading(true);
            const data = await api.getTeacherTimetable(selectedTeacher);
            setTimetable(data);
            setError('');
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to fetch teacher timetable');
            setTimetable([]);
        } finally {
            setLoading(false);
        }
    };

    const getSlots = (dayValue: number, periodId: string): TimetableSlot[] => {
        return timetable.filter(slot => slot.dayOfWeek === dayValue && slot.periodId === periodId);
    };

    const handlePrint = () => {
        window.print();
    };

    const selectedTeacherData = teachers.find(t => t.id === selectedTeacher);
    const teacherName = selectedTeacherData
        ? `${selectedTeacherData.firstName} ${selectedTeacherData.lastName}`
        : '';

    const lessonPeriods = periods.filter(p => p.type === 'LESSON');

    if (loading && teachers.length === 0) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
                    <p className="text-gray-600">Loading...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4 md:p-8 print:p-0 print:bg-white print:min-h-0 print:h-0 print:overflow-visible transition-colors duration-200 overflow-x-hidden w-full">
            <div className="max-w-7xl mx-auto w-full print:hidden">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8">
                    <div>
                        <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight">Teacher Timetable</h1>
                        <p className="text-gray-500 dark:text-gray-400 mt-2 text-sm font-medium">View teacher weekly schedules</p>
                    </div>

                    <button
                        onClick={handlePrint}
                        disabled={!selectedTeacher}
                        className="flex items-center gap-2 px-5 py-2.5 bg-primary-600 hover:bg-primary-700 text-white rounded-lg shadow-sm font-medium transition-all hover:shadow-md text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <Printer className="w-4 h-4" />
                        Print Schedule
                    </button>
                </div>

                {/* Error Message */}
                {error && (
                    <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 text-red-700 rounded-r shadow-sm">
                        <span className="font-semibold">Error:</span> {error}
                    </div>
                )}

                {/* Teacher Selection */}
                <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 mb-8">
                    <div className="space-y-2">
                        <label className="text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-2">
                            <User className="w-4 h-4" />
                            Select Teacher
                        </label>
                        <div className="relative">
                            <select
                                value={selectedTeacher}
                                onChange={(e) => setSelectedTeacher(e.target.value)}
                                disabled={isTeacher && !isAdmin}
                                className="w-full pl-4 pr-10 py-2.5 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-all appearance-none cursor-pointer text-gray-900 dark:text-white disabled:bg-gray-100 disabled:cursor-not-allowed"
                            >
                                <option value="">{isTeacher ? 'Loading your schedule...' : 'Choose a teacher...'}</option>
                                {teachers.map(teacher => (
                                    <option key={teacher.id} value={teacher.id}>
                                        {teacher.firstName} {teacher.lastName} ({teacher.employeeId})
                                    </option>
                                ))}
                            </select>
                            <ChevronDown className="w-4 h-4 absolute right-3 top-3 text-gray-500 pointer-events-none" />
                        </div>
                    </div>
                </div>

                {/* Timetable View */}
                {selectedTeacher && lessonPeriods.length > 0 ? (
                    <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
                        {/* On-Screen Header */}
                        <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50">
                            <h2 className="text-lg font-bold text-gray-800 uppercase tracking-wide flex items-center gap-2">
                                <Calendar className="w-5 h-5" />
                                Weekly Schedule
                            </h2>
                            <p className="text-sm text-gray-600 mt-1">{teacherName}</p>
                        </div>

                        <div className="grid grid-cols-1 w-full max-w-full">
                            <div className="overflow-x-auto w-full min-w-0">
                                <table className="w-full border-collapse">
                                    <thead>
                                        <tr>
                                            <th className="border border-gray-300 bg-gray-100 p-3 text-left font-bold text-sm text-gray-700">
                                                Day / Period
                                            </th>
                                            {lessonPeriods.map(period => (
                                                <th
                                                    key={period.id}
                                                    className="border border-gray-300 bg-gray-100 p-3 text-center font-bold text-xs text-gray-700"
                                                >
                                                    <div className="flex flex-col items-center gap-1">
                                                        <span className="text-gray-900">{period.name}</span>
                                                        <span className="text-[10px] text-gray-600 flex items-center gap-1">
                                                            <Clock className="w-3 h-3" />
                                                            {formatTime(period.startTime)} - {formatTime(period.endTime)}
                                                        </span>
                                                    </div>
                                                </th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {DAYS.map(day => (
                                            <tr key={day.value}>
                                                <td className="border border-gray-300 p-4 font-bold text-sm text-gray-800 bg-gray-50">
                                                    {day.label}
                                                </td>
                                                {lessonPeriods.map(period => {
                                                    const slots = getSlots(day.value, period.id);
                                                    return (
                                                        <td
                                                            key={period.id}
                                                            className="border border-gray-300 p-2 text-center align-middle"
                                                        >
                                                            {slots.length > 0 ? (
                                                                <div className="flex flex-col gap-2">
                                                                    {slots.map((slot, idx) => (
                                                                        <div key={slot.id} className={`p-3 rounded-lg border-2 ${getSubjectColor(slot.subject?.name || '')} ${slots.length > 1 ? 'border-red-500 shadow-sm relative' : ''}`}>
                                                                            {slots.length > 1 && (
                                                                                <div className="absolute -top-2 -right-2 bg-red-600 text-white text-[8px] font-bold px-1.5 py-0.5 rounded-full uppercase shadow-sm z-10">
                                                                                    Conflict
                                                                                </div>
                                                                            )}
                                                                            <div className="font-bold text-sm mb-1">
                                                                                {slot.subject?.code || slot.subject?.name}
                                                                            </div>
                                                                            <div className="text-xs opacity-90">
                                                                                {slot.class?.name} - {slot.section?.name}
                                                                            </div>
                                                                            {slot.roomNumber && (
                                                                                <div className="text-[10px] mt-1 opacity-75">
                                                                                    Room: {slot.roomNumber}
                                                                                </div>
                                                                            )}
                                                                        </div>
                                                                    ))}
                                                                </div>
                                                            ) : (
                                                                <div className="text-gray-300 text-xs">-</div>
                                                            )}
                                                        </td>
                                                    );
                                                })}
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            {/* Summary Stats */}
                            <div className="p-6 bg-gray-50 border-t border-gray-200">
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div className="bg-white p-4 rounded-lg border border-gray-200">
                                        <div className="text-2xl font-bold text-primary-600">
                                            {timetable.length}
                                        </div>
                                        <div className="text-sm text-gray-600">Total Classes</div>
                                    </div>
                                    <div className="bg-white p-4 rounded-lg border border-gray-200">
                                        <div className="text-2xl font-bold text-green-600">
                                            {new Set(timetable.map(s => s.subjectId)).size}
                                        </div>
                                        <div className="text-sm text-gray-600">Subjects Taught</div>
                                    </div>
                                    <div className="bg-white p-4 rounded-lg border border-gray-200">
                                        <div className="text-2xl font-bold text-secondary-600">
                                            {new Set(timetable.map(s => `${s.classId}-${s.sectionId}`)).size}
                                        </div>
                                        <div className="text-sm text-gray-600">Classes Assigned</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center h-64 border-2 border-dashed border-gray-300 rounded-xl bg-gray-50">
                        <User className="w-16 h-16 text-gray-300 mb-4" />
                        <p className="text-gray-500 text-lg font-medium">
                            {selectedTeacher ? 'No timetable assigned to this teacher' : 'Please select a teacher to view their timetable'}
                        </p>
                    </div>
                )}
            </div>

            {/* Dedicated Absolute Print View - Hidden normally */}
            {selectedTeacher && lessonPeriods.length > 0 && (
                <div id="print-area" className="hidden print:flex flex-col w-full h-[100vh] bg-white overflow-hidden absolute top-0 left-0 z-[9999]">
                    <div className="w-full h-full flex flex-col p-2" style={{ transform: 'scale(0.98)', transformOrigin: 'center center' }}>
                        {/* Print Header */}
                        <div className="text-center mb-1 shrink-0">
                            <h2 className="text-xl font-bold uppercase tracking-wide text-primary-900 border-b-2 border-primary-900 inline-block px-6 py-0.5 mb-1">
                                Teacher Timetable
                            </h2>
                            <div className="flex items-center justify-center gap-3">
                                <p className="text-lg font-bold uppercase text-gray-900">{teacherName}</p>
                                <p className="text-base text-gray-600 font-medium">|</p>
                                <p className="text-base text-gray-700 font-medium">ID: {selectedTeacherData?.employeeId}</p>
                            </div>
                        </div>

                        {/* Print Table */}
                        <div className="flex-grow w-full overflow-hidden">
                            <table className="w-full h-full border-collapse table-fixed">
                                <thead>
                                    <tr className="h-8">
                                        <th className="border border-gray-400 bg-gray-50 px-1 py-1 text-center font-bold text-xs text-gray-900 w-24">
                                            Day / Period
                                        </th>
                                        {lessonPeriods.map(period => (
                                            <th
                                                key={period.id}
                                                className="border border-gray-400 bg-gray-50 px-1 py-1 text-center overflow-hidden"
                                            >
                                                <div className="flex flex-col items-center justify-center h-full gap-0">
                                                    <span className="text-gray-900 text-xs font-bold truncate w-full">{period.name}</span>
                                                    <span className="text-[9px] text-gray-600 whitespace-nowrap">
                                                        {formatTime(period.startTime)} - {formatTime(period.endTime)}
                                                    </span>
                                                </div>
                                            </th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {DAYS.map(day => (
                                        <tr key={day.value} className="h-auto">
                                            <td className="border border-gray-400 px-1 py-2 font-bold text-base text-gray-900 bg-gray-50 text-center">
                                                {day.label}
                                            </td>
                                            {lessonPeriods.map(period => {
                                                const slots = getSlots(day.value, period.id);
                                                return (
                                                    <td
                                                        key={period.id}
                                                        className="border border-gray-400 p-0.5 text-center align-middle h-auto"
                                                    >
                                                        {slots.length > 0 ? (
                                                            <div className="flex flex-col gap-1">
                                                                {slots.map(slot => (
                                                                    <div key={slot.id} className={`w-full h-full p-1 rounded border ${slots.length > 1 ? 'border-red-600' : 'border-gray-300'} ${getSubjectColor(slot.subject?.name || '')} flex flex-col justify-center items-center`}>
                                                                        {slots.length > 1 && (
                                                                            <div className="text-[8px] text-red-700 font-bold uppercase mb-0.5">! Conflict</div>
                                                                        )}
                                                                        <div className="font-bold text-sm leading-tight truncate w-full">
                                                                            {slot.subject?.code || slot.subject?.name}
                                                                        </div>
                                                                        <div className="text-xs font-semibold opacity-90 truncate w-full">
                                                                            {slot.class?.name} - {slot.section?.name}
                                                                        </div>
                                                                        {slot.roomNumber && (
                                                                            <div className="text-[9px] font-medium opacity-80 mt-0.5">
                                                                                Rm: {slot.roomNumber}
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        ) : (
                                                            <div className="text-gray-300 text-xs">-</div>
                                                        )}
                                                    </td>
                                                );
                                            })}
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}

            <style>{`
                @media print {
                    @page {
                        size: A4 landscape;
                        margin: 0;
                    }
                    
                    body {
                        visibility: hidden;
                        background: white !important;
                        margin: 0;
                        padding: 0;
                        overflow: hidden;
                    }

                    #print-area {
                        visibility: visible;
                        display: flex !important;
                        position: absolute;
                        top: 0;
                        left: 0;
                        width: 100vw;
                        height: 100vh;
                        margin: 0;
                        padding: 0;
                        background: white;
                        z-index: 9999;
                    }

                    #print-area * {
                        visibility: visible;
                    }
                    
                    * {
                        -webkit-print-color-adjust: exact !important;
                        print-color-adjust: exact !important;
                    }
                }
            `}</style>
        </div>
    );
};

export default TeachersTimetablePage;
