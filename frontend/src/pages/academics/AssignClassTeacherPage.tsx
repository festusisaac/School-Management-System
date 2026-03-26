import { useState, useEffect } from 'react';
import { Users, UserCheck, Search, X, CheckCircle, AlertCircle } from 'lucide-react';
import api from '../../services/api';

interface Class {
    id: string;
    name: string;
    sections?: Section[];
}

interface Section {
    id: string;
    name: string;
    classId: string;
    class?: Class;
    classTeacherId?: string;
    classTeacher?: Staff;
}

interface Staff {
    id: string;
    firstName: string;
    lastName: string;
    employeeId: string;
    role: string;
    roleObject?: {
        name: string;
    };
    isTeachingStaff?: boolean;
    designation?: {
        title: string;
    };
}

const AssignClassTeacherPage = () => {
    const [classes, setClasses] = useState<Class[]>([]);
    const [sections, setSections] = useState<Section[]>([]);
    const [teachers, setTeachers] = useState<Staff[]>([]);
    const [selectedClass, setSelectedClass] = useState('');
    const [selectedSection, setSelectedSection] = useState('');
    const [selectedTeacher, setSelectedTeacher] = useState('');
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        fetchInitialData();
    }, []);

    const fetchInitialData = async () => {
        try {
            setLoading(true);
            const [classesData, sectionsData, staffData] = await Promise.all([
                api.getClasses(),
                api.getSections(),
                api.getStaff()
            ]);

            console.log('Fetched classes:', classesData);
            console.log('Fetched sections:', sectionsData);

            // Log each section's teacher status
            sectionsData.forEach((s: any) => {
                console.log(`Section ${s.name} (${s.id}):`, {
                    classTeacherId: s.classTeacherId,
                    hasClassTeacher: !!s.classTeacher,
                    classTeacher: s.classTeacher
                });
            });

            setClasses(classesData);
            setSections(sectionsData);

            // Filter staff based on isTeachingStaff flag or "Teacher" role
            const teacherList = Array.isArray(staffData)
                ? staffData.filter((s: Staff) => 
                    s.isTeachingStaff === true || 
                    s.roleObject?.name === 'Teacher' || 
                    s.role === 'Teacher'
                )
                : [];

            setTeachers(teacherList);

            if (teacherList.length === 0) {
                console.warn('No staff found with "isTeachingStaff" flag set to true.');
            }

            setError('');
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to fetch data');
        } finally {
            setLoading(false);
        }
    };

    const handleAssign = async () => {
        if (!selectedClass || !selectedTeacher || !selectedSection) {
            setError('Please select class, section/type, and teacher');
            return;
        }

        try {
            setSaving(true);
            const sectionId = selectedSection === 'GENERAL' ? undefined : selectedSection;
            await api.assignClassTeacher(selectedClass, sectionId, selectedTeacher);
            await fetchInitialData();
            setSuccess('Class teacher assigned successfully!');
            setSelectedClass('');
            setSelectedSection('');
            setSelectedTeacher('');
            setTimeout(() => setSuccess(''), 3000);
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to assign class teacher');
        } finally {
            setSaving(false);
        }
    };

    const handleRemove = async (classId: string, sectionId?: string) => {
        if (!confirm('Are you sure you want to remove this class teacher assignment?')) return;

        console.log('Removing teacher - classId:', classId, 'sectionId:', sectionId);
        try {
            const result = await api.removeClassTeacher(classId, sectionId);
            console.log('Remove API result:', result);
            await fetchInitialData();
            console.log('Data refetched after removal');

            // Check if the section still has a teacher
            if (sectionId) {
                const section = sections.find(s => s.id === sectionId);
                console.log('Section after refetch:', section);
            } else {
                const cls = classes.find(c => c.id === classId);
                console.log('Class after refetch:', cls);
            }

            setSuccess('Class teacher removed successfully!');
            setTimeout(() => setSuccess(''), 3000);
        } catch (err: any) {
            console.error('Remove error:', err);
            setError(err.response?.data?.message || 'Failed to remove class teacher');
        }
    };

    const combinedList = [
        // Show class-level assignments (where section is null/undefined)
        ...classes.map(c => ({
            id: `class-${c.id}`,
            isClass: true,
            classId: c.id,
            actualId: c.id, // Store the actual class ID for removal
            className: c.name,
            sectionName: 'General (All Sections)',
            classTeacher: (c as any).classTeacher,
            employeeId: (c as any).classTeacher?.employeeId
        })),
        // Show section-level assignments
        ...sections.map(s => ({
            id: `section-${s.id}`,
            isClass: false,
            classId: s.classId,
            actualId: s.id, // Store the actual section ID for removal
            className: s.class?.name || 'Unknown',
            sectionName: s.name,
            classTeacher: s.classTeacher,
            employeeId: s.classTeacher?.employeeId
        }))
    ];

    const filteredList = combinedList.filter(item => {
        const search = searchTerm.toLowerCase();
        // Only show items that have a teacher assigned OR match search if we wanted all?
        // Usually, we only want to list the ACTUAL assignments in the table
        if (!item.classTeacher) return false;

        return (
            item.className.toLowerCase().includes(search) ||
            item.sectionName.toLowerCase().includes(search) ||
            (item.classTeacher && (
                item.classTeacher.firstName.toLowerCase().includes(search) ||
                item.classTeacher.lastName.toLowerCase().includes(search)
            )) ||
            (item.employeeId && item.employeeId.toLowerCase().includes(search))
        );
    });

    const sectionsForClass = selectedClass
        ? sections.filter(s => s.classId === selectedClass)
        : [];

    if (loading) {
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
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4 md:p-8 transition-colors duration-200">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight flex items-center gap-3">
                        <UserCheck className="p-2 bg-primary-600 text-white rounded-lg shadow-lg shadow-primary-500/30" size={40} />
                        Assign Class Teacher
                    </h1>
                    <p className="text-gray-500 dark:text-gray-400 mt-2 text-sm font-medium">Assign teachers to manage specific class sections</p>
                </div>

                {/* Messages */}
                {error && (
                    <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 text-red-700 rounded-r shadow-sm flex items-center gap-2">
                        <AlertCircle className="w-5 h-5" />
                        <div className="flex-1">
                            <span className="font-semibold">Error:</span> {error}
                        </div>
                        <button onClick={() => setError('')} className="p-1 hover:bg-red-100 rounded-full transition-colors">
                            <X className="w-4 h-4" />
                        </button>
                    </div>
                )}
                {success && (
                    <div className="mb-6 p-4 bg-green-50 border-l-4 border-green-500 text-green-700 rounded-r shadow-sm flex items-center gap-2">
                        <CheckCircle className="w-5 h-5" />
                        <span className="font-semibold">Success:</span> {success}
                    </div>
                )}

                {/* Assignment Form */}
                <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 mb-8">
                    <h2 className="text-lg font-bold text-gray-800 dark:text-white mb-4">Assign New Class Teacher</h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Class</label>
                            <select
                                value={selectedClass}
                                onChange={(e) => {
                                    const classId = e.target.value;
                                    setSelectedClass(classId);
                                    const classArms = sections.filter(s => s.classId === classId);
                                    setSelectedSection(classId && classArms.length === 0 ? 'GENERAL' : '');
                                }}
                                className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-all text-gray-900 dark:text-white"
                            >
                                <option value="">Select Class</option>
                                {classes.map(cls => (
                                    <option key={cls.id} value={cls.id}>{cls.name}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Section</label>
                            <select
                                value={selectedSection}
                                onChange={(e) => setSelectedSection(e.target.value)}
                                disabled={!selectedClass}
                                className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-all text-gray-900 dark:text-white disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {(() => {
                                    if (selectedClass && sectionsForClass.length === 0) {
                                        return <option value="GENERAL">General / No Sections</option>;
                                    }
                                    return (
                                        <>
                                            <option value="">Select Section / Scope</option>
                                            <option value="GENERAL">General (All Sections)</option>
                                            {sectionsForClass.map(sec => (
                                                <option key={sec.id} value={sec.id}>{sec.name}</option>
                                            ))}
                                        </>
                                    );
                                })()}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Teacher</label>
                            <select
                                value={selectedTeacher}
                                onChange={(e) => setSelectedTeacher(e.target.value)}
                                className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-all text-gray-900 dark:text-white"
                            >
                                <option value="">Select Teacher</option>
                                {teachers.map(teacher => (
                                    <option key={teacher.id} value={teacher.id}>
                                        {teacher.firstName} {teacher.lastName} ({teacher.employeeId})
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>
                    <div className="mt-4">
                        <button
                            onClick={handleAssign}
                            disabled={!selectedClass || !selectedTeacher || !selectedSection || saving}
                            className="px-6 py-2.5 bg-primary-600 hover:bg-primary-700 text-white rounded-lg font-medium shadow-sm transition-all hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {saving ? 'Assigning...' : 'Assign Class Teacher'}
                        </button>
                    </div>
                </div>

                {/* Search */}
                <div className="mb-6">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                        <input
                            type="text"
                            placeholder="Search by class, section, or teacher name..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-all text-gray-900 dark:text-white"
                        />
                    </div>
                </div>

                {/* Assignments Table */}
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
                    <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
                        <h2 className="text-lg font-bold text-gray-800 dark:text-white flex items-center gap-2">
                            <Users className="w-5 h-5" />
                            Current Assignments
                        </h2>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-gray-50 dark:bg-gray-900">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">Class</th>
                                    <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">Section</th>
                                    <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">Class Teacher</th>
                                    <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">Employee ID</th>
                                    <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                                {filteredList.map(item => (
                                    <tr key={item.id} className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                                            {item.className}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-300">
                                            {item.sectionName}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-300">
                                            {item.classTeacher ? (
                                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                                                    {item.classTeacher.firstName} {item.classTeacher.lastName}
                                                </span>
                                            ) : (
                                                <span className="text-gray-400 italic">Not assigned</span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-300">
                                            {item.employeeId || '-'}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                                            {item.classTeacher && (
                                                <button
                                                    onClick={() => item.isClass ? handleRemove(item.actualId) : handleRemove(item.classId!, item.actualId)}
                                                    className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 font-medium transition-colors"
                                                >
                                                    Remove
                                                </button>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    {filteredList.length === 0 && (
                        <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                            No assignments found
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default AssignClassTeacherPage;
