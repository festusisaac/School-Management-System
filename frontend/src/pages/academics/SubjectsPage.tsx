import { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Power, BookOpen } from 'lucide-react';
import api from '../../services/api';
import { useToast } from '../../context/ToastContext';

interface SubjectGroup {
    id: string;
    name: string;
}

interface Subject {
    id: string;
    name: string;
    groupId?: string;
    group?: SubjectGroup;
    isCore: boolean;
    isActive: boolean;
}

const SubjectsPage = () => {
    const [subjects, setSubjects] = useState<Subject[]>([]);
    const [groups, setGroups] = useState<SubjectGroup[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [editingSubject, setEditingSubject] = useState<Subject | null>(null);
    const [deleteTarget, setDeleteTarget] = useState<Subject | null>(null);

    // Form state
    const [formData, setFormData] = useState({
        name: '',
        groupId: '',
        isCore: true,
        isActive: true
    });
    const [submitting, setSubmitting] = useState(false);
    const toast = useToast();

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            setLoading(true);
            const [subjectsData, groupsData] = await Promise.all([
                api.getSubjects(),
                api.getSubjectGroups()
            ]);
            setSubjects(subjectsData);
            setGroups(groupsData);
            setError('');
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to fetch data');
        } finally {
            setLoading(false);
        }
    };

    const handleOpenModal = (subject?: Subject) => {
        if (subject) {
            setEditingSubject(subject);
            setFormData({
                name: subject.name,
                groupId: subject.groupId || subject.group?.id || '',
                isCore: subject.isCore,
                isActive: subject.isActive
            });
        } else {
            setEditingSubject(null);
            setFormData({
                name: '',
                groupId: groups.length > 0 ? groups[0].id : '',
                isCore: true,
                isActive: true
            });
        }
        setShowModal(true);
    };

    const handleCloseModal = () => {
        setShowModal(false);
        setEditingSubject(null);
        setFormData({ name: '', groupId: '', isCore: true, isActive: true });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.name.trim()) {
            setError('Please fill in all required fields');
            return;
        }

        try {
            setSubmitting(true);
            setError('');

            if (editingSubject) {
                await api.updateSubject(editingSubject.id, formData);
                toast.showSuccess('Subject updated successfully!');
            } else {
                await api.createSubject(formData);
                toast.showSuccess('Subject created successfully!');
            }

            await fetchData(); // Refresh list
            handleCloseModal();
        } catch (err: any) {
            setError(err.response?.data?.message || err.message || 'Failed to save subject');
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = async () => {
        if (!deleteTarget) return;

        try {
            setSubmitting(true);
            await api.deleteSubject(deleteTarget.id);
            toast.showSuccess('Subject deleted successfully!');
            await fetchData();
            setShowDeleteModal(false);
            setDeleteTarget(null);
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to delete subject');
        } finally {
            setSubmitting(false);
        }
    };

    const handleToggleStatus = async (subject: Subject) => {
        try {
            await api.toggleSubjectStatus(subject.id);
            toast.showSuccess(`Subject ${subject.isActive ? 'deactivated' : 'activated'} successfully!`);
            await fetchData();
        } catch (err: any) {
            toast.showError(err.response?.data?.message || 'Failed to toggle status');
        }
    };

    return (
        <div className="p-6 bg-gray-50 dark:bg-gray-900 min-h-screen">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="flex justify-between items-center mb-6">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Subjects</h1>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                            Manage academic subjects and groups
                        </p>
                    </div>
                    <button
                        onClick={() => handleOpenModal()}
                        className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
                    >
                        <Plus className="w-4 h-4" />
                        Add Subject
                    </button>
                </div>

                {/* Error Message */}
                {error && (
                    <div className="mb-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-900/30 rounded-lg">
                        <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
                    </div>
                )}

                {loading ? (
                    <div className="p-8 text-center text-gray-500 dark:text-gray-400">Loading...</div>
                ) : (
                    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
                        {subjects.length === 0 ? (
                            <div className="p-8 text-center text-gray-500 dark:text-gray-400">
                                No subjects found. Click "Add Subject" to create one.
                            </div>
                        ) : (
                            <table className="w-full">
                                <thead className="bg-gray-50 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                            Subject Name
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                            Group
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
                                    {subjects.map((subject) => (
                                        <tr key={subject.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex items-center">
                                                    <div className="flex-shrink-0 h-10 w-10 bg-primary-100 dark:bg-primary-900/30 rounded-lg flex items-center justify-center">
                                                        <BookOpen className="h-5 w-5 text-primary-600 dark:text-primary-400" />
                                                    </div>
                                                    <div className="ml-4">
                                                        <div className="text-sm font-medium text-gray-900 dark:text-white">{subject.name}</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm text-gray-500 dark:text-gray-400">
                                                    {subject.group?.name || '-'}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className={`px-2 py-1 text-xs font-medium rounded-full ${subject.isCore
                                                    ? 'bg-secondary-100 dark:bg-secondary-900/30 text-secondary-700 dark:text-secondary-400'
                                                    : 'bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-400'
                                                    }`}>
                                                    {subject.isCore ? 'Core' : 'Elective'}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span
                                                    className={`px-2 py-1 text-xs font-medium rounded-full ${subject.isActive
                                                        ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                                                        : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-400'
                                                        }`}
                                                >
                                                    {subject.isActive ? 'Active' : 'Inactive'}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                <div className="flex items-center justify-end gap-2">
                                                    <button
                                                        onClick={() => handleToggleStatus(subject)}
                                                        className="p-2 text-gray-600 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-500 hover:bg-primary-50 dark:hover:bg-primary-900/20 rounded-lg transition-colors"
                                                        title={subject.isActive ? 'Deactivate' : 'Activate'}
                                                    >
                                                        <Power className="w-4 h-4" />
                                                    </button>
                                                    <button
                                                        onClick={() => handleOpenModal(subject)}
                                                        className="p-2 text-gray-600 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-500 hover:bg-primary-50 dark:hover:bg-primary-900/20 rounded-lg transition-colors"
                                                        title="Edit"
                                                    >
                                                        <Edit2 className="w-4 h-4" />
                                                    </button>
                                                    <button
                                                        onClick={() => {
                                                            setDeleteTarget(subject);
                                                            setShowDeleteModal(true);
                                                        }}
                                                        className="p-2 text-gray-600 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                                                        title="Delete"
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

                {/* Add/Edit Modal */}
                {showModal && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-md w-full">
                            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                                <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                                    {editingSubject ? 'Edit Subject' : 'Add New Subject'}
                                </h2>
                            </div>
                            <form onSubmit={handleSubmit} className="p-6 space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                        Subject Name *
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                        placeholder="e.g., Mathematics"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                        Subject Group
                                    </label>
                                    <select
                                        value={formData.groupId}
                                        onChange={(e) => setFormData({ ...formData, groupId: e.target.value })}
                                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                    >
                                        <option value="">Select a Group</option>
                                        {groups.map((grp) => (
                                            <option key={grp.id} value={grp.id}>
                                                {grp.name}
                                            </option>
                                        ))}
                                    </select>
                                    <p className="text-xs text-gray-500 mt-1">Optional. Groups help categorize subjects (e.g. Sciences)</p>
                                </div>

                                <div className="space-y-2">
                                    <div className="flex items-center gap-2">
                                        <input
                                            type="checkbox"
                                            id="isCore"
                                            checked={formData.isCore}
                                            onChange={(e) => setFormData({ ...formData, isCore: e.target.checked })}
                                            className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                                        />
                                        <label htmlFor="isCore" className="text-sm text-gray-700 dark:text-gray-300">
                                            Is Core Subject?
                                        </label>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <input
                                            type="checkbox"
                                            id="isActive"
                                            checked={formData.isActive}
                                            onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                                            className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                                        />
                                        <label htmlFor="isActive" className="text-sm text-gray-700 dark:text-gray-300">
                                            Active
                                        </label>
                                    </div>
                                </div>

                                <div className="flex gap-3 pt-4">
                                    <button
                                        type="button"
                                        onClick={handleCloseModal}
                                        className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                                        disabled={submitting}
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50"
                                        disabled={submitting}
                                    >
                                        {submitting ? 'Saving...' : editingSubject ? 'Update' : 'Create'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                {/* Delete Confirmation Modal */}
                {showDeleteModal && deleteTarget && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-md w-full">
                            <div className="p-6">
                                <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Delete Subject</h2>
                                <p className="text-gray-600 dark:text-gray-400 mb-6">
                                    Are you sure you want to delete subject <strong>{deleteTarget.name}</strong>?
                                    <br /><span className="text-xs text-red-500 mt-2 block">Warning: This might affect students assigned to this subject.</span>
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
                                        {submitting ? 'Deleting...' : 'Delete'}
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

export default SubjectsPage;
