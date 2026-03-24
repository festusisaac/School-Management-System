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
    const [error, setError] = useState('');
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
        const classArms = sections.filter(s => s.classId === selectedClass);
        if (selectedSection || (selectedClass && classArms.length === 0)) {
            fetchExistingAssignments();
        } else {
            setAssignments({});
        }
    }, [selectedClass, selectedSection, sections]);

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
            const teacherList = staffData.filter((s: Staff) => s.isTeachingStaff === true);
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
                    .filter(([_, teacherId]) => teacherId) // Only send assigned ones
                    .map(([subjectId, teacherId]) => ({
                        subjectId,
                        teacherId
                    }))
            };

            await api.assignSubjectTeachers(payload);
            toast.showSuccess('Subject teachers assigned successfully!');

            // Refresh to ensure sync
            await fetchExistingAssignments();

        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to save assignments');
        } finally {
            setSaving(false);
        }
    };

    const filteredSections = sections.filter(s => s.classId === selectedClass);

    return (
        <div className="p-6 max-w-7xl mx-auto text-gray-900 dark:text-white">
            <div className="flex items-center gap-3 mb-8">
                <BookOpen className="w-8 h-8 text-primary-600" />
                <div>
                    <h1 className="text-2xl font-bold">Assign Subject Teachers</h1>
                    <p className="text-gray-500 dark:text-gray-400 text-sm">Map teachers to subjects for specific class sections</p>
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
                            className="w-full rounded-lg border-gray-300 dark:border-gray-600 dark:bg-gray-700 shadow-sm focus:border-primary-500 focus:ring-primary-500"
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
                            className="w-full rounded-lg border-gray-300 dark:border-gray-600 dark:bg-gray-700 shadow-sm focus:border-primary-500 focus:ring-primary-500 disabled:bg-gray-50 disabled:text-gray-400 dark:disabled:bg-gray-900"
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

            {/* Messages */}
            {error && (
                <div className="mb-6 bg-red-50 dark:bg-red-900/20 border-l-4 border-red-500 p-4 rounded-r flex items-center gap-3">
                    <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
                    <p className="text-red-700 dark:text-red-300">{error}</p>
                </div>
            )}

            {/* Assignments Grid */}
            {selectedClass && (
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
                    <div className="p-4 bg-gray-50 dark:bg-gray-700/50 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
                        <h3 className="font-semibold text-gray-900 dark:text-white">Subject Assignments</h3>
                        <button
                            onClick={handleSave}
                            disabled={saving}
                            className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 transition-colors"
                        >
                            {saving ? 'Saving...' : 'Save Changes'}
                            <Save className="w-4 h-4" />
                        </button>
                    </div>

                    {loading ? (
                        <div className="p-8 text-center text-gray-500 dark:text-gray-400">Loading details...</div>
                    ) : (
                        <div className="divide-y divide-gray-200 dark:divide-gray-700">
                            {subjects.length > 0 ? (
                                subjects.map(subject => (
                                    <div key={subject.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-gray-50 dark:hover:bg-gray-700/30">
                                        <div className="flex-1">
                                            <p className="font-medium text-gray-900 dark:text-white">{subject.name}</p>
                                            {subject.code && <p className="text-sm text-gray-500 dark:text-gray-400">{subject.code}</p>}
                                        </div>
                                        <div className="w-full sm:w-72">
                                            <select
                                                value={assignments[subject.id] || ''}
                                                onChange={(e) => handleAssignmentChange(subject.id, e.target.value)}
                                                className="w-full rounded-lg border-gray-300 dark:border-gray-600 dark:bg-gray-700 shadow-sm focus:border-primary-500 focus:ring-primary-500 text-sm"
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
                                <div className="p-8 text-center text-gray-500 dark:text-gray-400">No subjects assigned to this class. Go to "Class Subjects" to assign them first.</div>
                            )}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default AssignSubjectTeacherPage;
