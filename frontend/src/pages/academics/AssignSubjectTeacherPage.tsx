import { useState, useEffect } from 'react';
import { Save, BookOpen, AlertCircle } from 'lucide-react';
import api from '../../services/api';
import { useToast } from '../../context/ToastContext';

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

interface Staff {
    id: string;
    firstName: string;
    lastName: string;
    role: string;
    roleObject?: {
        name: string;
    };
    isTeachingStaff?: boolean;
    designation?: {
        title: string;
    };
}

const AssignSubjectTeacherPage = () => {
    const [classes, setClasses] = useState<Class[]>([]);
    const [sections, setSections] = useState<Section[]>([]);
    const [subjects, setSubjects] = useState<Subject[]>([]);
    const [teachers, setTeachers] = useState<Staff[]>([]);

    const [selectedClass, setSelectedClass] = useState('');
    const [selectedSection, setSelectedSection] = useState('');

    const [assignments, setAssignments] = useState<Record<string, string>>({}); // subjectId -> teacherId

    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const toast = useToast();

    useEffect(() => {
        fetchInitialData();
    }, []);

    useEffect(() => {
        if (selectedClass) {
            fetchClassSubjects();
        } else {
            setSubjects([]);
        }
    }, [selectedClass, selectedSection]);

    useEffect(() => {
        if (selectedClass) {
            fetchExistingAssignments();
        } else {
            setAssignments({});
        }
    }, [selectedClass, selectedSection]);

    const fetchInitialData = async () => {
        try {
            setLoading(true);
            const [classesData, sectionsData, staffData] = await Promise.all([
                api.getClasses(),
                api.getSections(),
                api.getStaff()
            ]);

            setClasses(classesData);
            setSections(sectionsData);

            // Filter teaching staff
            const teacherList = staffData.filter((s: Staff) => 
                s.isTeachingStaff === true || 
                s.roleObject?.name === 'Teacher' || 
                s.role === 'Teacher'
            );
            setTeachers(teacherList);
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to fetch initial data');
        } finally {
            setLoading(false);
        }
    };

    const fetchClassSubjects = async () => {
        try {
            setLoading(true);
            const data = await api.getClassSubjects(selectedClass, selectedSection);
            // Transform ClassSubject entities into Subject format
            const classSubjectsList = data
                .filter((cs: any) => cs.subject)
                .map((cs: any) => ({
                    id: cs.subject.id,
                    name: cs.subject.name,
                    code: cs.subject.code
                }));
            setSubjects(classSubjectsList);
            setError('');
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to fetch subjects for selected class');
        } finally {
            setLoading(false);
        }
    };

    const fetchExistingAssignments = async () => {
        try {
            setLoading(true);
            const data = await api.getSubjectTeachers(selectedClass, selectedSection);
            const mapping: Record<string, string> = {};
            data.forEach((item: any) => {
                mapping[item.subjectId] = item.teacherId;
            });
            setAssignments(mapping);
            setError('');
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to fetch existing assignments');
        } finally {
            setLoading(false);
        }
    };

    const handleAssignmentChange = (subjectId: string, teacherId: string) => {
        setAssignments(prev => ({
            ...prev,
            [subjectId]: teacherId
        }));
    };

    const handleSave = async () => {
        if (!selectedClass) {
            setError('Please select a class first');
            return;
        }

        try {
            setSaving(true);
            setError('');

            const payload = {
                classId: selectedClass,
                sectionId: selectedSection || undefined,
                assignments: Object.entries(assignments)
                    .map(([subjectId, teacherId]) => ({
                        subjectId,
                        teacherId: teacherId || null // Ensure null is sent for unassignment
                    }))
            };

            await api.assignSubjectTeachers(payload);
            toast.showSuccess('Subject teachers assigned successfully!');

            // Refresh to ensure sync
            await fetchExistingAssignments();

        } catch (err: any) {
            toast.showError(err.response?.data?.message || 'Failed to save assignments');
        } finally {
            setSaving(false);
        }
    };

    const filteredSections = sections.filter(s => s.classId === selectedClass);

    return (
        <div className="p-6 bg-gray-50 dark:bg-gray-900 min-h-screen">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="flex justify-between items-center mb-6">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Assign Subject Teachers</h1>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                            Map teachers to subjects for specific class sections
                        </p>
                    </div>
                </div>

                {/* Selection Controls */}
                <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 mb-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Class</label>
                            <select
                                value={selectedClass}
                                onChange={(e) => {
                                    setSelectedClass(e.target.value);
                                    setSelectedSection('');
                                }}
                                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                            >
                                <option value="">Select Class</option>
                                {classes.map(c => (
                                    <option key={c.id} value={c.id}>{c.name}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Section</label>
                            <select
                                value={selectedSection}
                                onChange={(e) => setSelectedSection(e.target.value)}
                                disabled={!selectedClass}
                                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white disabled:bg-gray-50 disabled:text-gray-400 dark:disabled:bg-gray-900"
                            >
                                {(() => {
                                    if (selectedClass && filteredSections.length === 0) {
                                        return <option value="">General / No Sections</option>;
                                    }
                                    return (
                                        <>
                                            <option value="">General (All Sections)</option>
                                            {filteredSections.map(s => (
                                                <option key={s.id} value={s.id}>{s.name}</option>
                                            ))}
                                        </>
                                    );
                                })()}
                            </select>
                        </div>
                    </div>
                </div>

                {/* Assignments Section */}
                {selectedClass && (
                    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
                        <div className="px-6 py-4 bg-gray-50 dark:bg-gray-700/50 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
                            <h3 className="font-bold text-gray-900 dark:text-white">Subject Assignments</h3>
                            <button
                                onClick={handleSave}
                                disabled={saving}
                                className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 transition-colors shadow-sm"
                            >
                                <Save className="w-4 h-4" />
                                {saving ? 'Saving...' : 'Save Changes'}
                            </button>
                        </div>

                        {loading ? (
                            <div className="p-12 text-center text-gray-500 dark:text-gray-400 font-medium">Loading details...</div>
                        ) : (
                            <div className="divide-y divide-gray-200 dark:divide-gray-700">
                                {subjects.length > 0 ? (
                                    subjects.map(subject => (
                                        <div key={subject.id} className="px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors">
                                            <div className="flex items-center">
                                                <div className="flex-shrink-0 h-10 w-10 bg-primary-100 dark:bg-primary-900/30 rounded-lg flex items-center justify-center">
                                                    <BookOpen className="h-5 w-5 text-primary-600 dark:text-primary-400" />
                                                </div>
                                                <div className="ml-4">
                                                    <div className="text-sm font-bold text-gray-900 dark:text-white">{subject.name}</div>
                                                    {subject.code && <div className="text-xs text-gray-500 dark:text-gray-400">{subject.code}</div>}
                                                </div>
                                            </div>
                                            <div className="w-full sm:w-72">
                                                <select
                                                    value={assignments[subject.id] || ''}
                                                    onChange={(e) => handleAssignmentChange(subject.id, e.target.value)}
                                                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                                                >
                                                    <option value="">Select Teacher</option>
                                                    {teachers.map(teacher => (
                                                        <option key={teacher.id} value={teacher.id}>
                                                            {teacher.firstName} {teacher.lastName} {teacher.designation ? `(${teacher.designation.title})` : ''}
                                                        </option>
                                                    ))}
                                                </select>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div className="p-12 text-center text-gray-500 dark:text-gray-400">
                                        No subjects assigned to this class. Go to "Class Subjects" to assign them first.
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default AssignSubjectTeacherPage;
