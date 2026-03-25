import React, { useState, useEffect } from 'react';
import { 
    Calendar, 
    Search, 
    Save, 
    CheckCircle2, 
    XCircle, 
    Clock, 
    AlertCircle, 
    Users,
    ChevronDown,
    Filter,
    Check
} from 'lucide-react';
import api from '../../services/api';
import { useToast } from '../../context/ToastContext';
import { format } from 'date-fns';
import { clsx } from 'clsx';

interface Student {
    id: string;
    admissionNo: string;
    firstName: string;
    lastName: string;
    classId: string;
    sectionId: string;
}

interface AttendanceRecord {
    studentId: string;
    status: 'present' | 'absent' | 'late' | 'medical';
    remarks: string;
}

const StudentAttendanceMarkingPage: React.FC = () => {
    const [date, setDate] = useState(format(new Date(), 'yyyy-MM-dd'));
    const [classes, setClasses] = useState<any[]>([]);
    const [sections, setSections] = useState<any[]>([]);
    const [selectedClass, setSelectedClass] = useState('');
    const [selectedSection, setSelectedSection] = useState('');
    const [students, setStudents] = useState<Student[]>([]);
    const [attendance, setAttendance] = useState<Record<string, AttendanceRecord>>({});
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const toast = useToast();

    useEffect(() => {
        fetchClasses();
    }, []);

    useEffect(() => {
        if (selectedClass) {
            fetchSections(selectedClass);
        } else {
            setSections([]);
            setSelectedSection('');
        }
    }, [selectedClass]);

    const fetchClasses = async () => {
        try {
            const data = await api.getClasses();
            setClasses(data);
        } catch (error) {
            console.error('Error fetching classes:', error);
        }
    };

    const fetchSections = async (classId: string) => {
        try {
            const data = await api.getSections();
            setSections(data.filter((s: any) => s.classId === classId));
        } catch (error) {
            console.error('Error fetching sections:', error);
        }
    };

    useEffect(() => {
        if (!selectedClass) {
            setStudents([]);
            setAttendance({});
            return;
        }

        const fetchStudentData = async () => {
            try {
                setLoading(true);
                // 1. Fetch Students in the class/section
                const studentData = await api.get<Student[]>('/students', {
                    params: { classId: selectedClass, sectionId: selectedSection || undefined }
                });
                setStudents(studentData);

                // 2. Fetch existing attendance for the date
                const existingAttendance = await api.getStudentClassAttendance(selectedClass, date, selectedSection || undefined);
                
                const attendanceMap: Record<string, AttendanceRecord> = {};
                studentData.forEach(s => {
                    const record = existingAttendance.find((a: any) => a.studentId === s.id);
                    attendanceMap[s.id] = {
                        studentId: s.id,
                        status: (record?.status as any) || 'present',
                        remarks: record?.remarks || ''
                    };
                });
                setAttendance(attendanceMap);
            } catch (error) {
                console.error('Error fetching students/attendance:', error);
                toast.showError('Failed to load student data');
            } finally {
                setLoading(false);
            }
        };

        fetchStudentData();
    }, [selectedClass, selectedSection, date]);

    const handleStatusChange = (studentId: string, status: 'present' | 'absent' | 'late' | 'medical') => {
        setAttendance(prev => ({
            ...prev,
            [studentId]: { ...prev[studentId], status }
        }));
    };

    const handleRemarksChange = (studentId: string, remarks: string) => {
        setAttendance(prev => ({
            ...prev,
            [studentId]: { ...prev[studentId], remarks }
        }));
    };

    const markAllAs = (status: 'present' | 'absent') => {
        const newAttendance = { ...attendance };
        Object.keys(newAttendance).forEach(id => {
            newAttendance[id].status = status;
        });
        setAttendance(newAttendance);
    };

    const handleSave = async () => {
        try {
            setSaving(true);
            const records = Object.values(attendance).map(r => ({
                ...r,
                date,
                classId: selectedClass,
                sectionId: selectedSection || undefined
            }));

            await api.bulkMarkStudentAttendance({ records });
            toast.showSuccess('Attendance saved successfully');
        } catch (error) {
            console.error('Error saving attendance:', error);
            toast.showError('Failed to save attendance');
        } finally {
            setSaving(false);
        }
    };

    const filteredStudents = (students || []).filter(s => {
        const query = (searchTerm || '').toLowerCase();
        const fullName = `${s.firstName || ''} ${s.lastName || ''}`.toLowerCase();
        const admNo = (s.admissionNo || '').toLowerCase();
        return fullName.includes(query) || admNo.includes(query);
    });

    return (
        <div className="p-4 min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-300">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
                <div>
                    <h1 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                        <Users className="w-6 h-6 text-primary-600" />
                        Mark Student Attendance
                    </h1>
                    <p className="text-xs text-gray-600 dark:text-gray-400">Manage daily attendance for your classes</p>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                    <div className="relative">
                        <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                        <input
                            type="date"
                            className="pl-9 pr-3 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-sm text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-primary-500 outline-none transition-all shadow-sm"
                            value={date}
                            onChange={(e) => setDate(e.target.value)}
                        />
                    </div>
                    <button
                        onClick={handleSave}
                        disabled={saving || students.length === 0}
                        className="flex items-center gap-2 px-5 py-2 bg-primary-600 text-white text-sm font-bold rounded-lg hover:bg-primary-700 disabled:opacity-50 transition-all shadow-lg shadow-primary-500/25 active:scale-95"
                    >
                        <Save size={18} />
                        {saving ? 'Saving...' : 'Save Changes'}
                    </button>
                </div>
            </div>

            {/* Selectors */}
            <div className="bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm mb-6">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                    <div>
                        <label className="block text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-1.5">Class</label>
                        <div className="relative">
                            <select 
                                value={selectedClass}
                                onChange={(e) => setSelectedClass(e.target.value)}
                                className="w-full pl-3 pr-8 py-2 bg-gray-50 dark:bg-gray-900/50 border border-gray-100 dark:border-gray-700 text-sm text-gray-900 dark:text-white rounded-lg appearance-none focus:ring-2 focus:ring-primary-500 outline-none transition-all"
                            >
                                <option value="">Select Class</option>
                                {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                            </select>
                            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={16} />
                        </div>
                    </div>
                    <div>
                        <label className="block text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-1.5">Section (Optional)</label>
                        <div className="relative">
                            <select 
                                value={selectedSection}
                                onChange={(e) => setSelectedSection(e.target.value)}
                                className="w-full pl-3 pr-8 py-2 bg-gray-50 dark:bg-gray-900/50 border border-gray-100 dark:border-gray-700 text-sm text-gray-900 dark:text-white rounded-lg appearance-none focus:ring-2 focus:ring-primary-500 outline-none transition-all"
                                disabled={!selectedClass}
                            >
                                <option value="">No Section</option>
                                {sections.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                            </select>
                            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={16} />
                        </div>
                    </div>
                    <div className="flex gap-2 h-[38px]">
                        <button 
                            onClick={() => markAllAs('present')}
                            disabled={students.length === 0}
                            className="flex-1 px-2 text-[9px] font-black uppercase tracking-tighter bg-emerald-50 text-emerald-600 border border-emerald-100 rounded-lg hover:bg-emerald-100 transition-all disabled:opacity-30"
                        >
                            All Present
                        </button>
                        <button 
                            onClick={() => markAllAs('absent')}
                            disabled={students.length === 0}
                            className="flex-1 px-2 text-[9px] font-black uppercase tracking-tighter bg-rose-50 text-rose-600 border border-rose-100 rounded-lg hover:bg-rose-100 transition-all disabled:opacity-30"
                        >
                            All Absent
                        </button>
                    </div>
                </div>
            </div>

            {/* Search and Table */}
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm overflow-hidden min-h-[400px]">
                <div className="p-3 border-b border-gray-50 dark:border-gray-700 flex justify-between items-center">
                    <div className="relative max-w-xs">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                        <input
                            type="text"
                            placeholder="Find student..."
                            className="w-full pl-9 pr-3 py-2 bg-gray-50 dark:bg-gray-900/50 border border-gray-100 dark:border-gray-700 text-xs text-gray-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500/20 transition-all font-medium"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <div className="flex gap-4 items-center">
                        {[
                            { label: 'Present', color: 'bg-emerald-600' },
                            { label: 'Absent', color: 'bg-rose-600' },
                            { label: 'Late', color: 'bg-amber-500' },
                            { label: 'Medical', color: 'bg-blue-600' },
                        ].map(l => (
                            <div key={l.label} className="flex items-center gap-1.5">
                                <div className={`w-2 h-2 rounded-full ${l.color}`}></div>
                                <span className="text-[9px] font-black uppercase tracking-widest text-gray-400">{l.label}</span>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead className="bg-gray-50/50 dark:bg-gray-900/30 text-gray-400 dark:text-gray-500 text-[9px] font-black uppercase tracking-[0.2em]">
                            <tr>
                                <th className="px-5 py-3 border-b dark:border-gray-700 text-center w-12">#</th>
                                <th className="px-5 py-3 border-b dark:border-gray-700">Student Info</th>
                                <th className="px-5 py-3 border-b dark:border-gray-700">Admission No</th>
                                <th className="px-6 py-3 border-b dark:border-gray-700 text-center">Status</th>
                                <th className="px-5 py-3 border-b dark:border-gray-700">Remarks</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50 dark:divide-gray-700">
                            {loading ? (
                                <tr>
                                    <td colSpan={4} className="px-6 py-12 text-center text-gray-400">
                                        <div className="flex flex-col items-center gap-3">
                                            <div className="w-8 h-8 border-2 border-primary-600 border-t-transparent rounded-full animate-spin"></div>
                                            <span className="text-xs font-bold uppercase tracking-widest animate-pulse">Fetching Students...</span>
                                        </div>
                                    </td>
                                </tr>
                            ) : filteredStudents.length === 0 ? (
                                <tr>
                                    <td colSpan={4} className="px-6 py-12 text-center text-gray-400 font-bold uppercase tracking-widest opacity-50">
                                        {students.length === 0 ? 'No students loaded' : 'No matches found'}
                                    </td>
                                </tr>
                            ) : (
                                filteredStudents.map((student, i) => (
                                    <tr key={student.id} className="group hover:bg-gray-50/50 dark:hover:bg-gray-800/50 transition-colors">
                                        <td className="px-5 py-3 text-center text-[10px] font-bold text-gray-400">
                                            {i + 1}
                                        </td>
                                        <td className="px-5 py-3">
                                            <div className="flex items-center gap-2">
                                                <div className="w-8 h-8 bg-primary-50 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 rounded-lg flex items-center justify-center font-black text-[10px] shadow-sm uppercase">
                                                    {student.firstName?.charAt(0) || ''}{student.lastName?.charAt(0) || ''}
                                                </div>
                                                <div className="text-sm font-bold text-gray-900 dark:text-white capitalize">
                                                    {student.firstName} {student.lastName || ''}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-5 py-3 text-xs font-mono font-bold text-gray-500 dark:text-gray-400 uppercase">
                                            {student.admissionNo}
                                        </td>
                                        <td className="px-5 py-3">
                                            <div className="flex items-center justify-center gap-1">
                                                {[
                                                    { id: 'present', icon: CheckCircle2, label: 'P', color: 'emerald' },
                                                    { id: 'absent', icon: XCircle, label: 'A', color: 'rose' },
                                                    { id: 'late', icon: Clock, label: 'L', color: 'amber' },
                                                    { id: 'medical', icon: AlertCircle, label: 'M', color: 'blue' }
                                                ].map((stat) => (
                                                    <button
                                                        key={stat.id}
                                                        onClick={() => handleStatusChange(student.id, stat.id as any)}
                                                        className={clsx(
                                                            "w-8 h-8 flex flex-col items-center justify-center rounded-lg border transition-all relative group/btn",
                                                            attendance[student.id]?.status === stat.id
                                                            ? {
                                                                'bg-emerald-600 border-emerald-600 text-white shadow-md shadow-emerald-500/30': stat.color === 'emerald',
                                                                'bg-rose-600 border-rose-600 text-white shadow-md shadow-rose-500/30': stat.color === 'rose',
                                                                'bg-amber-500 border-amber-500 text-white shadow-md shadow-amber-500/30': stat.color === 'amber',
                                                                'bg-blue-600 border-blue-600 text-white shadow-md shadow-blue-500/30': stat.color === 'blue',
                                                              }
                                                            : "bg-white dark:bg-gray-800 border-gray-100 dark:border-gray-700 text-gray-300 dark:text-gray-500 hover:border-gray-200 dark:hover:border-gray-600"
                                                        )}
                                                        title={stat.id.toUpperCase()}
                                                    >
                                                        <stat.icon size={14} />
                                                        <span className={clsx(
                                                            "text-[7px] font-black mt-0.5",
                                                            attendance[student.id]?.status === stat.id ? "text-white" : "text-gray-400"
                                                        )}>{stat.label}</span>
                                                    </button>
                                                ))}
                                            </div>
                                        </td>
                                        <td className="px-5 py-3">
                                            <input
                                                type="text"
                                                placeholder="Remarks..."
                                                className="w-full text-[10px] font-medium p-1.5 bg-gray-50 dark:bg-gray-900/50 border border-gray-100 dark:border-gray-700 text-gray-900 dark:text-white rounded-lg focus:ring-1 focus:ring-primary-500/20 outline-none transition-all placeholder:text-gray-300"
                                                value={attendance[student.id]?.remarks || ''}
                                                onChange={(e) => handleRemarksChange(student.id, e.target.value)}
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

export default StudentAttendanceMarkingPage;
