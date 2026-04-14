import { useState, useEffect, useRef } from 'react';
import { Settings, Printer, X, Plus, Trash2, Copy, RefreshCw, ChevronDown, ArrowUp, ArrowDown } from 'lucide-react';
import api from '../../services/api';
import { useAuthStore } from '../../stores/authStore';
import { useToast } from '../../context/ToastContext';
import { AlertCircle } from 'lucide-react';

interface Class {
    id: string;
    name: string;
}

interface Section {
    id: string;
    name: string;
    classId: string;
}

interface Subject {
    id: string;
    name: string;
    code?: string;
}

enum PeriodType {
    LESSON = 'LESSON',
    ASSEMBLY = 'ASSEMBLY',
    BREAK = 'BREAK',
    LUNCH = 'LUNCH',
    GAMES = 'GAMES',
    ACTIVITY = 'ACTIVITY'
}

interface Period {
    id: string;
    name: string;
    type: PeriodType;
    startTime: string;
    endTime: string;
    periodOrder: number;
}

interface TimetableSlot {
    id: string;
    dayOfWeek: number;
    periodId: string;
    subjectId: string;
    subject?: Subject;
    period?: Period;
    roomNumber?: string;
    teacherId?: string;
}

const DAYS = [
    { value: 1, label: 'MONDAY' },
    { value: 2, label: 'TUESDAY' },
    { value: 3, label: 'WEDNESDAY' },
    { value: 4, label: 'THURSDAY' },
    { value: 5, label: 'FRIDAY' },
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

const formatTime = (time: string): string => {
    if (!time) return '';
    const [hours, minutes] = time.split(':');
    const h = parseInt(hours);
    const ampm = h >= 12 ? 'PM' : 'AM';
    const displayHour = h > 12 ? h - 12 : (h === 0 ? 12 : h);
    return `${displayHour}:${minutes}${ampm}`;
};

const ClassTimetablePage = () => {
    const [classes, setClasses] = useState<Class[]>([]);
    const [sections, setSections] = useState<Section[]>([]);
    const [subjects, setSubjects] = useState<Subject[]>([]);
    const [periods, setPeriods] = useState<Period[]>([]);
    const [timetable, setTimetable] = useState<TimetableSlot[]>([]);
    const [selectedClass, setSelectedClass] = useState('');
    const [selectedSection, setSelectedSection] = useState('');
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [showPeriodModal, setShowPeriodModal] = useState(false);
    const [showCopyModal, setShowCopyModal] = useState(false);
    const [editingCell, setEditingCell] = useState<{ day: number; periodId: string } | null>(null);
    const [selectedSubject, setSelectedSubject] = useState('');
    const { user } = useAuthStore();
    const toast = useToast();
    const isAdmin = user?.role?.toLowerCase() === 'admin' || user?.role?.toLowerCase() === 'superadmin' || user?.role?.toLowerCase() === 'super administrator';

    const printRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        fetchInitialData();
    }, []);

    useEffect(() => {
        if (selectedClass) {
            fetchSections(selectedClass);
            fetchClassSubjects(selectedClass);
        } else {
            setSubjects([]);
        }
    }, [selectedClass]);

    useEffect(() => {
        if (selectedClass) {
            const classArms = sections.filter(s => s.classId === selectedClass);
            if (selectedSection || classArms.length === 0) {
                fetchTimetable();
            } else {
                setTimetable([]);
            }
        }
    }, [selectedClass, selectedSection, sections]);

    const fetchInitialData = async () => {
        try {
            setLoading(true);
            const [classesData, periodsData] = await Promise.all([
                api.getClasses(),
                api.getPeriods()
            ]);
            setClasses(classesData);
            setPeriods(periodsData);
        } catch (err: any) {
            toast.showError(err.response?.data?.message || 'Failed to fetch data');
        } finally {
            setLoading(false);
        }
    };

    const fetchSections = async (classId: string) => {
        try {
            const data = await api.getSections();
            setSections(data.filter((s: Section) => s.classId === classId));
        } catch (err: any) {
            toast.showError(err.response?.data?.message || 'Failed to fetch sections');
        }
    };

    const fetchClassSubjects = async (classId: string) => {
        try {
            const data = await api.getClassSubjects(classId);
            const classSubjectsList = data
                .filter((cs: any) => cs.subject)
                .map((cs: any) => ({
                    id: cs.subject.id,
                    name: cs.subject.name,
                    code: cs.subject.code
                }));
            setSubjects(classSubjectsList);
        } catch (err: any) {
            console.error('Failed to fetch class subjects:', err);
            // Fallback to empty or handle error if needed
            setSubjects([]);
        }
    };

    const fetchTimetable = async () => {
        try {
            const data = await api.getTimetable(selectedClass, selectedSection || undefined);
            setTimetable(data);
        } catch (err: any) {
            toast.showError(err.response?.data?.message || 'Failed to fetch timetable');
        }
    };

    const initializePeriods = async () => {
        try {
            setLoading(true);
            await api.initializeDefaultPeriods();
            await fetchInitialData();
            toast.showSuccess('Default periods initialized successfully!');
        } catch (err: any) {
            toast.showError(err.response?.data?.message || 'Failed to initialize periods');
        } finally {
            setLoading(false);
        }
    };

    const getSlot = (dayValue: number, periodId: string): TimetableSlot | undefined => {
        return timetable.find(slot => slot.dayOfWeek === dayValue && slot.periodId === periodId);
    };

    const handleCellClick = (dayValue: number, period: Period) => {
        if (!isAdmin) return; // Teachers can't edit
        if (period.type !== PeriodType.LESSON) return;
        const slot = getSlot(dayValue, period.id);
        setEditingCell({ day: dayValue, periodId: period.id });
        setSelectedSubject(slot?.subjectId || '');
    };

    const handleSaveCell = async () => {
        if (!editingCell || !selectedSubject) return;

        try {
            setSaving(true);
            const existingSlot = getSlot(editingCell.day, editingCell.periodId);
            const slotData = {
                dayOfWeek: editingCell.day,
                periodId: editingCell.periodId,
                subjectId: selectedSubject,
            };

            if (existingSlot) {
                await api.updateTimetableSlot(existingSlot.id, slotData);
            } else {
                await api.createTimetableSlot({
                    classId: selectedClass,
                    sectionId: selectedSection || undefined,
                    ...slotData
                });
            }

            await fetchTimetable();
            setEditingCell(null);
            setSelectedSubject('');
            toast.showSuccess('Slot saved successfully!');
        } catch (err: any) {
            toast.showError(err.response?.data?.message || 'Failed to save slot');
        } finally {
            setSaving(false);
        }
    };

    const handleDeleteSlot = async (dayValue: number, periodId: string) => {
        const slot = getSlot(dayValue, periodId);
        if (!slot) return;
        if (!confirm('Delete this subject from the timetable?')) return;
        try {
            await api.deleteTimetableSlot(slot.id);
            await fetchTimetable();
            toast.showSuccess('Slot deleted successfully!');
        } catch (err: any) {
            toast.showError(err.response?.data?.message || 'Failed to delete slot');
        }
    };

    const handlePrint = () => {
        window.print();
    };

    const sortedPeriods = [...periods].sort((a, b) => a.periodOrder - b.periodOrder);
    const selectedClassName = classes.find(c => c.id === selectedClass)?.name || '';
    const section = sections.find(s => s.id === selectedSection);
    const selectedSectionName = section ? section.name : 'General / No Sections';

    if (loading && classes.length === 0) {
        return (
            <div className="min-h-screen bg-white flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-900 mx-auto mb-4"></div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4 md:p-8 print:p-0 print:bg-white font-sans transition-colors duration-200 overflow-x-hidden w-full">
            <div className="max-w-7xl mx-auto w-full">
                {/* Header & Controls */}
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8 print:hidden">
                    <div>
                        <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight">Class Timetable</h1>
                        <p className="text-gray-500 dark:text-gray-400 mt-2 text-sm font-medium">Manage and organize weekly class schedules</p>
                    </div>

                    <div className="flex flex-wrap items-center gap-3">
                        {periods.length === 0 && isAdmin && (
                             <button
                                onClick={initializePeriods}
                                className="flex items-center gap-2 px-5 py-2.5 bg-primary-600 hover:bg-primary-700 text-white rounded-lg shadow-sm font-medium transition-all hover:shadow text-sm"
                            >
                                <RefreshCw className="w-4 h-4" />
                                Initialize Defaults
                            </button>
                        )}
                        <button
                            onClick={handlePrint}
                            disabled={!selectedClass || (sections.filter(s => s.classId === selectedClass).length > 0 && !selectedSection) || periods.length === 0}
                            className="flex items-center gap-2 px-5 py-2.5 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 rounded-lg shadow-sm font-medium transition-all hover:border-gray-300 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <Printer className="w-4 h-4" />
                            Print
                        </button>
                        {selectedClass && (selectedSection || sections.filter(s => s.classId === selectedClass).length === 0) && isAdmin && (
                            <button
                                onClick={() => setShowCopyModal(true)}
                                className="flex items-center gap-2 px-5 py-2.5 bg-secondary-600 hover:bg-secondary-700 text-white rounded-lg shadow-sm font-medium transition-all hover:shadow-md text-sm"
                            >
                                <Copy className="w-4 h-4" />
                                Copy
                            </button>
                        )}
                        {isAdmin && (
                            <button
                                onClick={() => setShowPeriodModal(true)}
                                className="flex items-center gap-2 px-5 py-2.5 bg-gray-800 hover:bg-gray-900 text-white rounded-lg shadow-sm font-medium transition-all hover:shadow-md text-sm"
                            >
                                <Settings className="w-4 h-4" />
                                Manage Periods
                            </button>
                        )}
                    </div>
                </div>

                {/* Filters */}
                <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 mb-8 grid grid-cols-1 md:grid-cols-2 gap-6 print:hidden">
                    <div className="space-y-2">
                        <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">Class</label>
                        <div className="relative">
                            <select
                                value={selectedClass}
                                onChange={(e) => {
                                    setSelectedClass(e.target.value);
                                    setSelectedSection('');
                                    setTimetable([]);
                                }}
                                className="w-full pl-4 pr-10 py-2.5 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-all appearance-none cursor-pointer text-gray-900 dark:text-white"
                            >
                                <option value="">Select Class</option>
                                {classes.map(cls => (
                                    <option key={cls.id} value={cls.id}>{cls.name}</option>
                                ))}
                            </select>
                            <ChevronDown className="w-4 h-4 absolute right-3 top-3 text-gray-500 pointer-events-none" />
                        </div>
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">Section</label>
                        <div className="relative">
                            <select
                                value={selectedSection}
                                onChange={(e) => setSelectedSection(e.target.value)}
                                disabled={!selectedClass}
                                className="w-full pl-4 pr-10 py-2.5 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-all appearance-none cursor-pointer text-gray-900 dark:text-white disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {(() => {
                                    const classArms = sections.filter(s => s.classId === selectedClass);
                                    if (selectedClass && classArms.length === 0) {
                                        return <option value="">General / No Sections</option>;
                                    }
                                    return (
                                        <>
                                            <option value="">General (All Sections)</option>
                                            {classArms.map(sec => (
                                                <option key={sec.id} value={sec.id}>{sec.name}</option>
                                            ))}
                                        </>
                                    );
                                })()}
                            </select>
                            <ChevronDown className="w-4 h-4 absolute right-3 top-3 text-gray-500 pointer-events-none" />
                        </div>
                    </div>
                </div>

                {/* Timetable View */}
                {selectedClass && periods.length > 0 ? (
                    <div id="printable-timetable" ref={printRef} className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden print:shadow-none print:border-none print:rounded-none max-w-full w-full">
                        {/* On-Screen Header */}
                        <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 print:hidden">
                            <div>
                                <h2 className="text-lg font-bold text-gray-800 uppercase tracking-wide">Weekly Schedule</h2>
                                <div className="flex items-center gap-2 mt-1">
                                    <span className="px-2 py-0.5 rounded text-xs font-bold bg-primary-100 text-primary-700 border border-primary-200 uppercase">{selectedClassName}</span>
                                    <span className="text-gray-400">•</span>
                                    <span className="px-2 py-0.5 rounded text-xs font-bold bg-secondary-100 text-secondary-700 border border-secondary-200 uppercase">{selectedSectionName}</span>
                                </div>
                            </div>
                        </div>

                        {/* Print Header (Visible only when printing) */}
                        <div className="hidden print:block text-center mb-6 pt-4">
                            <h2 className="text-2xl font-bold uppercase tracking-wide text-primary-900 border-b-2 border-primary-900 inline-block px-4 mb-2">
                                Class Timetable
                            </h2>
                            <p className="text-lg font-bold uppercase">{selectedClassName} - {selectedSectionName}</p>
                        </div>

                        <div className="grid grid-cols-1 w-full max-w-full print:block print:w-auto">
                            <div className="overflow-x-auto w-full min-w-0 print:overflow-visible print:w-auto">
                                <table className="w-full border-collapse">
                                    <thead>
                                        <tr>
                                            {/* Corner Header */}
                                            <th
                                                className="border border-black bg-white p-0 relative"
                                                style={{ width: '120px', height: '80px', borderRight: '1px solid black' }}
                                            >
                                                <svg className="absolute inset-0 w-full h-full" preserveAspectRatio="none">
                                                    <line x1="0" y1="0" x2="100%" y2="100%" stroke="black" strokeWidth="1" />
                                                </svg>
                                                <span className="absolute top-2 right-2 font-bold text-xs">TIME</span>
                                                <span className="absolute bottom-2 left-2 font-bold text-xs">DAY</span>
                                            </th>

                                            {/* Period Headers */}
                                            {sortedPeriods.map(period => (
                                                <th
                                                    key={period.id}
                                                    className="border border-black p-2 bg-white align-top"
                                                    style={{ minWidth: period.type === PeriodType.LESSON ? '100px' : '50px' }}
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
                                                <td className="border border-black p-4 font-bold text-sm text-center uppercase bg-white">
                                                    {day.label}
                                                </td>
                                                {sortedPeriods.map((period) => {
                                                    const slot = getSlot(day.value, period.id);
                                                    const isLesson = period.type === PeriodType.LESSON;
                                                    const isEditing = editingCell?.day === day.value && editingCell?.periodId === period.id;

                                                    if (!isLesson) {
                                                        if (dayIndex === 0) {
                                                            let displayText = period.name;

                                                            return (
                                                                <td
                                                                    key={period.id}
                                                                    rowSpan={DAYS.length}
                                                                    className="border border-black p-0 bg-white align-middle text-center"
                                                                >
                                                                    <div
                                                                        className="h-full flex items-center justify-center"
                                                                        style={{
                                                                            writingMode: 'vertical-rl',
                                                                            transform: 'rotate(180deg)',
                                                                            maxHeight: '400px'
                                                                        }}
                                                                    >
                                                                        <span className="font-bold text-primary-900 text-xs tracking-wider uppercase whitespace-nowrap px-2">
                                                                            {displayText}
                                                                        </span>
                                                                    </div>
                                                                </td>
                                                            );
                                                        }
                                                        return null;
                                                    }

                                                    return (
                                                        <td
                                                            key={period.id}
                                                            className={`border border-black p-0 relative transition-colors h-16 ${isEditing ? 'bg-primary-50' : (isAdmin ? 'hover:bg-gray-50' : '')
                                                                }`}
                                                            onClick={() => handleCellClick(day.value, period)}
                                                            style={{ cursor: isAdmin ? 'pointer' : 'default' }}
                                                        >
                                                            {isEditing ? (
                                                                <div className="absolute inset-0 z-10 bg-white flex flex-col p-1">
                                                                    <select
                                                                        value={selectedSubject}
                                                                        onChange={e => setSelectedSubject(e.target.value)}
                                                                        className="text-xs p-1 border rounded w-full mb-1"
                                                                        autoFocus
                                                                        onClick={e => e.stopPropagation()}
                                                                    >
                                                                        <option value="">Subject</option>
                                                                        {subjects.map(s => (
                                                                            <option key={s.id} value={s.id}>{s.name}</option>
                                                                        ))}
                                                                    </select>
                                                                    <div className="flex gap-1 mt-auto">
                                                                        <button
                                                                            onClick={e => { e.stopPropagation(); handleSaveCell(); }}
                                                                            disabled={saving}
                                                                            className="flex-1 bg-green-600 text-white text-[10px] py-1 rounded disabled:opacity-50"
                                                                        >
                                                                            {saving ? '...' : 'Save'}
                                                                        </button>
                                                                        <button
                                                                            onClick={e => { e.stopPropagation(); setEditingCell(null); }}
                                                                            className="flex-1 bg-gray-400 text-white text-[10px] py-1 rounded"
                                                                        >
                                                                            Cancel
                                                                        </button>
                                                                    </div>
                                                                </div>
                                                            ) : (
                                                                <div className="w-full h-full flex flex-col items-center justify-center p-1 group">
                                                                    {slot ? (
                                                                        <>
                                                                            <span className="font-bold text-sm text-center uppercase">
                                                                                {slot.subject?.code || getSubjectAbbreviation(slot.subject?.name || '')}
                                                                            </span>
                                                                            {slot.roomNumber && (
                                                                                <span className="text-[10px] text-gray-500">{slot.roomNumber}</span>
                                                                            )}
                                                                            {isAdmin && (
                                                                                <button
                                                                                    onClick={(e) => { e.stopPropagation(); handleDeleteSlot(day.value, period.id); }}
                                                                                    className="hidden group-hover:block absolute top-0 right-0 p-1 text-red-500 print:hidden"
                                                                                >
                                                                                    <Trash2 size={12} />
                                                                                </button>
                                                                            )}
                                                                        </>
                                                                    ) : (
                                                                        <span className="hidden group-hover:block text-gray-300 print:hidden">
                                                                            <Plus size={16} />
                                                                        </span>
                                                                    )}
                                                                </div>
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
                ) : (
                    <div className="flex flex-col items-center justify-center h-64 border-2 border-dashed border-gray-300 rounded bg-gray-50">
                        <p className="text-gray-500 mb-4">Please configure periods or select a Class/Section</p>
                        {periods.length === 0 && (
                            <button
                                onClick={initializePeriods}
                                className="px-4 py-2 bg-primary-600 text-white rounded hover:bg-primary-700"
                            >
                                Set Default Periods
                            </button>
                        )}
                    </div>
                )}

                {/* Modals */}
                {showPeriodModal && (
                    <PeriodManagementModal
                        periods={sortedPeriods}
                        onClose={() => setShowPeriodModal(false)}
                        onRefresh={fetchInitialData}
                    />
                )}
                {showCopyModal && (
                    <CopyTimetableModal
                        classes={classes}
                        currentClassId={selectedClass}
                        currentSectionId={selectedSection}
                        onClose={() => setShowCopyModal(false)}
                        onSuccess={() => {
                            setShowCopyModal(false);
                            toast.showSuccess('Timetable copied successfully!');
                        }}
                    />
                )}
            </div>

            <style>{`
                @media print {
                    @page {
                        size: A4 landscape;
                        margin: 5mm;
                    }
                    
                    /* EXHAUSTIVE UI HIDING */
                    /* Targeted structural selectors for the Sidebar and TopBar */
                    #root > div > div:first-child, /* The Sidebar container */
                    #root > div > div:first-child *, /* Everything inside the sidebar */
                    #root > div > div:nth-child(2) > header, /* The TopBar */
                    #root > div > div:nth-child(2) > header *, /* Everything inside the topbar */
                    aside, nav, header, footer,
                    [class*="sidebar"], [class*="Sidebar"],
                    [class*="logo"], [class*="Logo"],
                    [class*="footer"], [class*="Footer"],
                    .print\\:hidden {
                        display: none !important;
                        height: 0 !important;
                        margin: 0 !important;
                        padding: 0 !important;
                        visibility: hidden !important;
                        opacity: 0 !important;
                        pointer-events: none !important;
                    }

                    /* CONTENT ISOLATION & EXPANSION */
                    /* Force the main content container to take up NO extra space and expand to full width */
                    html, body, #root, #root > div, #root > div > div:nth-child(2), main {
                        margin: 0 !important;
                        padding: 0 !important;
                        width: 100% !important;
                        height: auto !important;
                        min-height: 0 !important;
                        display: block !important;
                        position: static !important;
                        background: white !important;
                        max-width: none !important;
                        overflow: visible !important;
                    }

                    main {
                        padding: 0 !important;
                    }

                    .max-w-7xl {
                        max-width: none !important;
                        width: 100% !important;
                        margin: 0 !important;
                        padding: 0 !important;
                    }

                    /* THE PRINTABLE TIMETABLE */
                    #printable-timetable {
                        display: block !important;
                        width: 100% !important;
                        margin: 0 !important;
                        padding: 0 !important;
                        border: none !important;
                        box-shadow: none !important;
                        visibility: visible !important;
                    }

                    table {
                        width: 100% !important;
                        border-collapse: collapse !important;
                        table-layout: fixed !important;
                        page-break-after: avoid !important;
                        page-break-before: avoid !important;
                        page-break-inside: avoid !important;
                    }

                    th, td {
                        border: 1px solid black !important;
                        padding: 3px !important;
                        font-size: 8pt !important;
                        word-wrap: break-word !important;
                        overflow-wrap: break-word !important;
                    }

                    /* Ensure background colors (like red headers) print */
                    * {
                        -webkit-print-color-adjust: exact !important;
                        print-color-adjust: exact !important;
                    }
                }
            `}</style>
        </div>
    );
};

const PeriodManagementModal = ({ periods, onClose, onRefresh }: { periods: Period[], onClose: () => void, onRefresh: () => void }) => {
    const [formData, setFormData] = useState({
        name: '',
        type: PeriodType.LESSON,
        startTime: '',
        endTime: '',
        periodOrder: periods.length + 1
    });
    const [editingPeriod, setEditingPeriod] = useState<Period | null>(null);
    const [loading, setLoading] = useState(false);
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            if (editingPeriod) {
                await api.updatePeriod(editingPeriod.id, formData);
            } else {
                await api.createPeriod(formData);
            }
            await onRefresh();
            setFormData({
                name: '',
                type: PeriodType.LESSON,
                startTime: '',
                endTime: '',
                periodOrder: periods.length + 2
            });
            setEditingPeriod(null);
        } catch (err: any) {
            console.error('Failed to save period:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleEdit = (period: Period) => {
        setEditingPeriod(period);
        setFormData({
            name: period.name,
            type: period.type,
            startTime: period.startTime,
            endTime: period.endTime,
            periodOrder: period.periodOrder
        });
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this period? This will affect all timetables using this period.')) return;
        setLoading(true);
        try {
            await api.deletePeriod(id);
            await onRefresh();
        } catch (err: any) {
            console.error('Failed to delete period:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleMovePeriod = async (index: number, direction: 'up' | 'down') => {
        if (loading) return;
        const newPeriods = [...periods];
        const swapIndex = direction === 'up' ? index - 1 : index + 1;

        if (swapIndex < 0 || swapIndex >= newPeriods.length) return;

        // Swap
        [newPeriods[index], newPeriods[swapIndex]] = [newPeriods[swapIndex], newPeriods[index]];

        setLoading(true);
        try {
            // Send new order of IDs
            await api.reorderPeriods(newPeriods.map(p => p.id));
            await onRefresh();
        } catch (err: any) {
            console.error('Failed to reorder periods:', err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
                <div className="p-4 border-b flex justify-between items-center bg-gray-50">
                    <h3 className="font-bold text-lg">Manage Periods</h3>
                    <button onClick={onClose}><X className="w-5 h-5 text-gray-500" /></button>
                </div>

                <div className="p-6 overflow-y-auto flex-1">
                    <form onSubmit={handleSubmit} className="mb-8 bg-gray-50 p-4 rounded border">
                        <div className="grid grid-cols-5 gap-4 mb-4">
                            <div className="col-span-2">
                                <label className="block text-xs font-semibold mb-1">Name</label>
                                <input
                                    className="w-full border p-2 rounded text-sm"
                                    placeholder="e.g. Morning Lesson"
                                    value={formData.name}
                                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                                    required
                                />
                            </div>
                            <div className="col-span-1">
                                <label className="block text-xs font-semibold mb-1">Type</label>
                                <select
                                    className="w-full border p-2 rounded text-sm"
                                    value={formData.type}
                                    onChange={e => setFormData({ ...formData, type: e.target.value as PeriodType })}
                                >
                                    {Object.values(PeriodType).map(t => (
                                        <option key={t} value={t}>{t}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="col-span-1">
                                <label className="block text-xs font-semibold mb-1">Start Time</label>
                                <input
                                    type="time"
                                    className="w-full border p-2 rounded text-sm"
                                    value={formData.startTime}
                                    onChange={e => setFormData({ ...formData, startTime: e.target.value })}
                                    required
                                />
                            </div>
                            <div className="col-span-1">
                                <label className="block text-xs font-semibold mb-1">End Time</label>
                                <input
                                    type="time"
                                    className="w-full border p-2 rounded text-sm"
                                    value={formData.endTime}
                                    onChange={e => setFormData({ ...formData, endTime: e.target.value })}
                                    required
                                />
                            </div>
                        </div>
                        <div className="flex gap-2">
                            <input
                                type="number"
                                className="w-20 border p-2 rounded text-sm hidden"
                                placeholder="Order"
                                value={formData.periodOrder}
                                onChange={e => setFormData({ ...formData, periodOrder: parseInt(e.target.value) })}
                            />
                            <button
                                type="submit"
                                disabled={loading}
                                className="bg-primary-600 text-white px-4 py-2 rounded text-sm hover:bg-primary-700 disabled:opacity-50"
                            >
                                {loading ? 'Saving...' : editingPeriod ? 'Update Period' : 'Add New Period'}
                            </button>
                            {editingPeriod && (
                                <button
                                    type="button"
                                    onClick={() => {
                                        setEditingPeriod(null);
                                        setFormData({
                                            name: '',
                                            type: PeriodType.LESSON,
                                            startTime: '',
                                            endTime: '',
                                            periodOrder: periods.length + 1
                                        });
                                    }}
                                    className="bg-gray-400 text-white px-4 py-2 rounded text-sm hover:bg-gray-500"
                                >
                                    Cancel
                                </button>
                            )}
                        </div>
                    </form>

                    <div className="border rounded overflow-hidden">
                        <table className="w-full text-sm text-left">
                            <thead className="bg-gray-100 text-gray-700 font-semibold border-b">
                                <tr>
                                    <th className="p-3">Order</th>
                                    <th className="p-3">Name</th>
                                    <th className="p-3">Type</th>
                                    <th className="p-3">Time</th>
                                    <th className="p-3 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y">
                                {periods.map((period, index) => (
                                    <tr key={period.id} className="hover:bg-gray-50">
                                        <td className="p-3">{period.periodOrder}</td>
                                        <td className="p-3 font-medium">{period.name}</td>
                                        <td className="p-3">
                                            <span className={`px-2 py-1 rounded text-xs ${period.type === PeriodType.LESSON ? 'bg-primary-100 text-primary-800' :
                                                period.type === PeriodType.BREAK ? 'bg-orange-100 text-orange-800' :
                                                    period.type === PeriodType.LUNCH ? 'bg-yellow-100 text-yellow-800' :
                                                        'bg-secondary-100 text-secondary-800'
                                                }`}>
                                                {period.type}
                                            </span>
                                        </td>
                                        <td className="p-3">{formatTime(period.startTime)} - {formatTime(period.endTime)}</td>
                                        <td className="p-3 text-right flex justify-end gap-2">
                                            <div className="flex flex-col gap-1 mr-4">
                                                <button
                                                    onClick={() => handleMovePeriod(index, 'up')}
                                                    disabled={index === 0 || loading}
                                                    className="p-1 hover:bg-gray-200 rounded disabled:opacity-30 disabled:cursor-not-allowed text-gray-600"
                                                    title="Move Up"
                                                >
                                                    <ArrowUp className="w-3 h-3" />
                                                </button>
                                                <button
                                                    onClick={() => handleMovePeriod(index, 'down')}
                                                    disabled={index === periods.length - 1 || loading}
                                                    className="p-1 hover:bg-gray-200 rounded disabled:opacity-30 disabled:cursor-not-allowed text-gray-600"
                                                    title="Move Down"
                                                >
                                                    <ArrowDown className="w-3 h-3" />
                                                </button>
                                            </div>
                                            <button
                                                onClick={() => handleEdit(period)}
                                                className="text-primary-600 hover:text-primary-800"
                                            >
                                                Edit
                                            </button>
                                            <button
                                                onClick={() => handleDelete(period.id)}
                                                className="text-red-600 hover:text-red-800"
                                            >
                                                Delete
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                                {periods.length === 0 && (
                                    <tr>
                                        <td colSpan={5} className="p-6 text-center text-gray-500">
                                            No periods found. Add one above.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
};

const CopyTimetableModal = ({ classes, currentClassId, currentSectionId, onClose, onSuccess }: any) => {
    const [targetClassId, setTargetClassId] = useState('');
    const [targetSectionId, setTargetSectionId] = useState('');
    const [targetSections, setTargetSections] = useState<Section[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        if (targetClassId) {
            api.getSections().then((data: Section[]) => {
                setTargetSections(data.filter(s => s.classId === targetClassId));
            });
        }
    }, [targetClassId]);

    const handleCopy = async () => {
        const targetClassArms = targetSections || [];
        if (!targetClassId || (targetClassArms.length > 0 && !targetSectionId)) return;
        setLoading(true);
        try {
            await api.copyTimetable({
                sourceClassId: currentClassId,
                sourceSectionId: currentSectionId || undefined,
                targetClassId,
                targetSectionId: targetSectionId || undefined
            });
            onSuccess();
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to copy timetable');
        } finally {
            setLoading(false);
        }
    };

    const targetClassArms = targetSections || [];
    const isReady = targetClassId && (targetClassArms.length === 0 || targetSectionId);

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md">
                <h3 className="text-lg font-bold mb-4">Copy Timetable</h3>
                {error && <p className="text-red-500 text-sm mb-3">{error}</p>}

                <div className="mb-4">
                    <label className="block text-sm font-semibold mb-1">Target Class</label>
                    <select
                        className="w-full border p-2 rounded"
                        value={targetClassId}
                        onChange={e => {
                            setTargetClassId(e.target.value);
                            setTargetSectionId('');
                        }}
                    >
                        <option value="">Select Class</option>
                        {classes.filter((c: Class) => c.id !== currentClassId).map((c: Class) => (
                            <option key={c.id} value={c.id}>{c.name}</option>
                        ))}
                    </select>
                </div>

                <div className="mb-6">
                    <label className="block text-sm font-semibold mb-1">Target Section</label>
                    <select
                        className="w-full border p-2 rounded"
                        value={targetSectionId}
                        onChange={e => setTargetSectionId(e.target.value)}
                        disabled={!targetClassId || targetClassArms.length === 0}
                    >
                        <option value="">{targetClassArms.length === 0 ? 'No Sections Available' : 'Select Section'}</option>
                        {targetClassArms.map(s => (
                            <option key={s.id} value={s.id}>{s.name}</option>
                        ))}
                    </select>
                </div>

                <div className="flex justify-end gap-2">
                    <button onClick={onClose} className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300">Cancel</button>
                    <button
                        onClick={handleCopy}
                        disabled={loading || !isReady}
                        className="px-4 py-2 bg-primary-600 text-white rounded hover:bg-primary-700 disabled:opacity-50"
                    >
                        {loading ? 'Copying...' : 'Copy Timetable'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ClassTimetablePage;
