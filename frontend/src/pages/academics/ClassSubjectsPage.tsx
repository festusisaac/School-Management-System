import { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Power, BookOpen, Layers } from 'lucide-react';
import api from '../../services/api';
import { useToast } from '../../context/ToastContext';

interface Class {
    id: string;
    name: string;
}

interface Subject {
    id: string;
    name: string;
    isActive: boolean;
}

interface ClassSubject {
    id: string;
    classId: string;
    subjectId: string;
    isCore: boolean;
    isActive: boolean;
    subject: Subject;
}

interface Section {
    id: string;
    name: string;
    classId: string;
}

const ClassSubjectsPage = () => {
    const [classes, setClasses] = useState<Class[]>([]);
    const [sections, setSections] = useState<Section[]>([]);
    const [subjects, setSubjects] = useState<Subject[]>([]);
    const [classSubjects, setClassSubjects] = useState<ClassSubject[]>([]);
    const [selectedClass, setSelectedClass] = useState('');
    const [selectedSection, setSelectedSection] = useState('');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [showAddModal, setShowAddModal] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [deleteTarget, setDeleteTarget] = useState<ClassSubject | null>(null);
    const [selectedSubjects, setSelectedSubjects] = useState<string[]>([]);
    const [submitting, setSubmitting] = useState(false);
    const toast = useToast();

    useEffect(() => {
        fetchInitialData();
    }, []);

    useEffect(() => {
        if (selectedClass) {
            fetchClassSubjects();
        } else {
            setClassSubjects([]);
            setSelectedSection('');
        }
    }, [selectedClass, selectedSection]);

    const fetchInitialData = async () => {
        try {
            setLoading(true);
            const [classesData, sectionsData, subjectsData] = await Promise.all([
                api.getClasses(),
                api.getSections(),
                api.getSubjects()
            ]);
            setClasses(classesData);
            setSections(sectionsData);
            setSubjects(subjectsData.filter((s: Subject) => s.isActive));
            setError('');
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to fetch data');
        } finally {
            setLoading(false);
        }
    };

    const fetchClassSubjects = async () => {
        try {
            setLoading(true);
            const data = await api.getClassSubjects(selectedClass, selectedSection);
            setClassSubjects(data);
            setError('');
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to fetch class subjects');
        } finally {
            setLoading(false);
        }
    };

    const handleOpenAddModal = () => {
        setSelectedSubjects([]);
        setShowAddModal(true);
    };

    const handleCloseAddModal = () => {
        setShowAddModal(false);
        setSelectedSubjects([]);
    };

    const handleToggleSubject = (subjectId: string) => {
        setSelectedSubjects(prev =>
            prev.includes(subjectId)
                ? prev.filter(id => id !== subjectId)
                : [...prev, subjectId]
        );
    };

    const handleBulkAssign = async () => {
        if (!selectedClass || selectedSubjects.length === 0) {
            toast.showWarning('Please select at least one subject');
            return;
        }

        try {
            setSubmitting(true);
            await api.bulkAssignClassSubjects({
                classId: selectedClass,
                sectionId: selectedSection || undefined,
                subjectIds: selectedSubjects,
                isCore: true
            });
            toast.showSuccess(`${selectedSubjects.length} subject(s) assigned successfully!`);
            await fetchClassSubjects();
            handleCloseAddModal();
        } catch (err: any) {
            toast.showError(err.response?.data?.message || 'Failed to assign subjects');
        } finally {
            setSubmitting(false);
        }
    };

    const handleToggleCore = async (classSubject: ClassSubject) => {
        try {
            await api.updateClassSubject(classSubject.id, { isCore: !classSubject.isCore });
            toast.showSuccess(`Subject marked as ${!classSubject.isCore ? 'Core' : 'Elective'}`);
            await fetchClassSubjects();
        } catch (err: any) {
            toast.showError(err.response?.data?.message || 'Failed to update subject');
        }
    };

    const handleToggleStatus = async (classSubject: ClassSubject) => {
        try {
            await api.toggleClassSubjectStatus(classSubject.id);
            toast.showSuccess(`Subject ${classSubject.isActive ? 'deactivated' : 'activated'} successfully!`);
            await fetchClassSubjects();
        } catch (err: any) {
            toast.showError(err.response?.data?.message || 'Failed to toggle status');
        }
    };

    const handleDelete = async () => {
        if (!deleteTarget) return;

        try {
            setSubmitting(true);
            await api.deleteClassSubject(deleteTarget.id);
            toast.showSuccess('Subject removed from class successfully!');
            await fetchClassSubjects();
            setShowDeleteModal(false);
            setDeleteTarget(null);
        } catch (err: any) {
            toast.showError(err.response?.data?.message || 'Failed to remove subject');
        } finally {
            setSubmitting(false);
        }
    };

    // Filter out already assigned subjects for the current selection
    const availableSubjects = subjects.filter(
        subject => !classSubjects.some(cs => cs.subjectId === subject.id)
    );

    const filteredSections = sections.filter(s => s.classId === selectedClass);

    return (
        <div className="p-6 bg-gray-50 dark:bg-gray-900 min-h-screen">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="flex justify-between items-center mb-6">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Assign Class Subjects</h1>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                            Assign subjects to specific classes and departments
                        </p>
                    </div>
                </div>

                {/* Selection Controls */}
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 mb-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 items-end">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Class
                            </label>
                            <select
                                value={selectedClass}
                                onChange={(e) => {
                                    setSelectedClass(e.target.value);
                                    setSelectedSection('');
                                }}
                                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                            >
                                <option value="">Choose a class...</option>
                                {classes.map((cls) => (
                                    <option key={cls.id} value={cls.id}>
                                        {cls.name}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 font-flex items-center gap-2">
                                Section / Department
                                <span className="text-xs text-gray-400 font-normal">(Optional)</span>
                            </label>
                            <select
                                value={selectedSection}
                                onChange={(e) => setSelectedSection(e.target.value)}
                                disabled={!selectedClass}
                                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white disabled:opacity-50"
                            >
                                <option value="">General (All Sections)</option>
                                {filteredSections.map((sec) => (
                                    <option key={sec.id} value={sec.id}>
                                        {sec.name}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {selectedClass && (
                            <button
                                onClick={handleOpenAddModal}
                                className="flex items-center justify-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors h-[42px]"
                            >
                                <Plus className="w-4 h-4" />
                                Add {selectedSection ? 'Department Subjects' : 'Subjects'}
                            </button>
                        )}
                    </div>
                </div>

                {/* Error Message */}
                {error && (
                    <div className="mb-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-900/30 rounded-lg">
                        <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
                    </div>
                )}

                {/* Class Subjects Table */}
                {selectedClass && (
                    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
                        {loading ? (
                            <div className="p-8 text-center text-gray-500 dark:text-gray-400">Loading...</div>
                        ) : classSubjects.length === 0 ? (
                            <div className="p-8 text-center text-gray-500 dark:text-gray-400">
                                No subjects assigned to this class yet. Click "Add Subjects" to get started.
                            </div>
                        ) : (
                            <table className="w-full">
                                <thead className="bg-gray-50 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                            Subject Name
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                            Type
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                            Status
                                        </th>
                                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                            Actions
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                                    {classSubjects.map((classSubject) => (
                                        <tr key={classSubject.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex items-center">
                                                    <div className="flex-shrink-0 h-10 w-10 bg-blue-100 dark:bg-primary-900/30 rounded-lg flex items-center justify-center">
                                                        <BookOpen className="h-5 w-5 text-primary-600 dark:text-primary-400" />
                                                    </div>
                                                    <div className="ml-4">
                                                        <div className="text-sm font-medium text-gray-900 dark:text-white">
                                                            {classSubject.subject.name}
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <button
                                                    onClick={() => handleToggleCore(classSubject)}
                                                    className={`px-3 py-1 text-xs font-medium rounded-full transition-colors ${classSubject.isCore
                                                        ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400 hover:bg-purple-200'
                                                        : 'bg-blue-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-400 hover:bg-blue-200'
                                                        }`}
                                                >
                                                    {classSubject.isCore ? 'Core' : 'Elective'}
                                                </button>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span
                                                    className={`px-2 py-1 text-xs font-medium rounded-full ${classSubject.isActive
                                                        ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                                                        : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-400'
                                                        }`}
                                                >
                                                    {classSubject.isActive ? 'Active' : 'Inactive'}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                <div className="flex items-center justify-end gap-2">
                                                    <button
                                                        onClick={() => handleToggleStatus(classSubject)}
                                                        className="p-2 text-gray-600 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-500 hover:bg-primary-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                                                        title={classSubject.isActive ? 'Deactivate' : 'Activate'}
                                                    >
                                                        <Power className="w-4 h-4" />
                                                    </button>
                                                    <button
                                                        onClick={() => {
                                                            setDeleteTarget(classSubject);
                                                            setShowDeleteModal(true);
                                                        }}
                                                        className="p-2 text-gray-600 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                                                        title="Remove"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </div>
                )}

                {/* Add Subjects Modal */}
                {showAddModal && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-2xl w-full max-h-[80vh] overflow-hidden flex flex-col">
                            <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
                                <h2 className="text-xl font-bold text-gray-900 dark:text-white">Add Subjects to Class</h2>
                                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                                    Select subjects to assign to this class
                                </p>
                            </div>
                            <div className="p-6 overflow-y-auto flex-1">
                                {availableSubjects.length === 0 ? (
                                    <p className="text-center text-gray-500 dark:text-gray-400 py-8">
                                        All available subjects have been assigned to this class.
                                    </p>
                                ) : (
                                    <div className="space-y-2">
                                        {availableSubjects.map((subject) => (
                                            <label
                                                key={subject.id}
                                                className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 cursor-pointer transition-colors"
                                            >
                                                <input
                                                    type="checkbox"
                                                    checked={selectedSubjects.includes(subject.id)}
                                                    onChange={() => handleToggleSubject(subject.id)}
                                                    className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                                                />
                                                <div className="flex items-center gap-3 flex-1">
                                                    <div className="flex-shrink-0 h-8 w-8 bg-blue-100 dark:bg-primary-900/30 rounded-lg flex items-center justify-center">
                                                        <Layers className="h-4 w-4 text-primary-600 dark:text-primary-400" />
                                                    </div>
                                                    <span className="text-sm font-medium text-gray-900 dark:text-white">
                                                        {subject.name}
                                                    </span>
                                                </div>
                                            </label>
                                        ))}
                                    </div>
                                )}
                            </div>
                            <div className="p-6 border-t border-gray-200 dark:border-gray-700 flex gap-3 flex-shrink-0">
                                <button
                                    type="button"
                                    onClick={handleCloseAddModal}
                                    className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                                    disabled={submitting}
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleBulkAssign}
                                    className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50"
                                    disabled={submitting || selectedSubjects.length === 0}
                                >
                                    {submitting ? 'Adding...' : `Add ${selectedSubjects.length} Subject(s)`}
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Delete Confirmation Modal */}
                {showDeleteModal && deleteTarget && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-md w-full">
                            <div className="p-6">
                                <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Remove Subject</h2>
                                <p className="text-gray-600 dark:text-gray-400 mb-6">
                                    Are you sure you want to remove <strong>{deleteTarget.subject.name}</strong> from this class?
                                </p>
                                <div className="flex gap-3">
                                    <button
                                        onClick={() => {
                                            setShowDeleteModal(false);
                                            setDeleteTarget(null);
                                        }}
                                        className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                                        disabled={submitting}
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={handleDelete}
                                        className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
                                        disabled={submitting}
                                    >
                                        {submitting ? 'Removing...' : 'Remove'}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ClassSubjectsPage;
