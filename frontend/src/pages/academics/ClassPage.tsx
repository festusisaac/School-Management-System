import { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Power } from 'lucide-react';
import api from '../../services/api';
import { useToast } from '../../context/ToastContext';

interface Class {
    id: string;
    name: string;
    isActive: boolean;
    schoolSectionId?: string;
    schoolSection?: {
        name: string;
    };
    sections?: any[];
    createdAt: string;
}

interface SchoolSection {
    id: string;
    name: string;
}

const ClassPage = () => {
    const [classes, setClasses] = useState<Class[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [showModal, setShowModal] = useState(false);
    const toast = useToast();
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [editingClass, setEditingClass] = useState<Class | null>(null);
    const [deleteTarget, setDeleteTarget] = useState<Class | null>(null);
    const [formData, setFormData] = useState({ name: '', isActive: true, schoolSectionId: '' });
    const [submitting, setSubmitting] = useState(false);
    const [schoolSections, setSchoolSections] = useState<SchoolSection[]>([]);

    useEffect(() => {
        fetchClasses();
        fetchSchoolSections();
    }, []);

    const fetchSchoolSections = async () => {
        try {
            const data = await api.getSchoolSections();
            setSchoolSections(data);
        } catch (err) {
            console.error('Failed to fetch school sections');
        }
    };

    const fetchClasses = async () => {
        try {
            setLoading(true);
            const data = await api.getClasses();
            setClasses(data);
            setError('');
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to fetch classes');
        } finally {
            setLoading(false);
        }
    };

    const handleOpenModal = (cls?: Class) => {
        if (cls) {
            setEditingClass(cls);
            setFormData({
                name: cls.name,
                isActive: cls.isActive,
                schoolSectionId: cls.schoolSectionId || ''
            });
        } else {
            setEditingClass(null);
            setFormData({ name: '', isActive: true, schoolSectionId: '' });
        }
        setShowModal(true);
    };

    const handleCloseModal = () => {
        setShowModal(false);
        setEditingClass(null);
        setFormData({ name: '', isActive: true, schoolSectionId: '' });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.name.trim()) return;

        try {
            setSubmitting(true);
            setError(''); // Clear previous errors
            if (editingClass) {
                await api.updateClass(editingClass.id, formData);
                toast.showSuccess('Class updated successfully!');
            } else {
                await api.createClass(formData);
                toast.showSuccess('Class created successfully!');
            }
            await fetchClasses();
            handleCloseModal();
        } catch (err: any) {
            // Check if it's an authentication error (401)
            if (err.response?.status === 401) {
                setError('Your session has expired. Please log in again.');
                // The API service will handle redirecting to login
                // But we should still reset the submitting state
            } else {
                setError(err.response?.data?.message || err.message || 'Failed to save class');
            }
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = async () => {
        if (!deleteTarget) return;

        try {
            setSubmitting(true);
            await api.deleteClass(deleteTarget.id);
            toast.showSuccess('Class deleted successfully!');
            await fetchClasses();
            setShowDeleteModal(false);
            setDeleteTarget(null);
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to delete class');
            setSubmitting(false);
        }
    };

    const handleToggleStatus = async (cls: Class) => {
        try {
            await api.toggleClassStatus(cls.id);
            toast.showSuccess(`Class ${cls.isActive ? 'deactivated' : 'activated'} successfully!`);
            await fetchClasses();
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
                        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Classes</h1>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                            Manage school classes and grade levels
                        </p>
                    </div>
                    <button
                        onClick={() => handleOpenModal()}
                        className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
                    >
                        <Plus className="w-4 h-4" />
                        Add Class
                    </button>
                </div>

                {/* Error Message */}
                {error && (
                    <div className="mb-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-900/30 rounded-lg">
                        <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
                    </div>
                )}

                {/* Table */}
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
                    {loading ? (
                        <div className="p-8 text-center text-gray-500 dark:text-gray-400">Loading...</div>
                    ) : classes.length === 0 ? (
                        <div className="p-8 text-center text-gray-500 dark:text-gray-400">
                            No classes found. Click "Add Class" to create one.
                        </div>
                    ) : (
                        <table className="w-full">
                            <thead className="bg-gray-50 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                        Class Name
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                        School Section
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                        Sections
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
                                {classes.map((cls) => (
                                    <tr key={cls.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm font-medium text-gray-900 dark:text-white">{cls.name}</div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm text-gray-900 dark:text-white font-bold">
                                                {cls.schoolSection?.name || <span className="text-red-400 italic font-medium">Unassigned</span>}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm text-gray-500 dark:text-gray-400">
                                                {cls.sections?.length || 0} arm(s)
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span
                                                className={`px-2 py-1 text-xs font-medium rounded-full ${cls.isActive
                                                    ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                                                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-400'
                                                    }`}
                                            >
                                                {cls.isActive ? 'Active' : 'Inactive'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                            <div className="flex items-center justify-end gap-2">
                                                <button
                                                    onClick={() => handleToggleStatus(cls)}
                                                    className="p-2 text-gray-600 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-500 hover:bg-primary-50 dark:hover:bg-primary-900/20 rounded-lg transition-colors"
                                                    title={cls.isActive ? 'Deactivate' : 'Activate'}
                                                >
                                                    <Power className="w-4 h-4" />
                                                </button>
                                                <button
                                                    onClick={() => handleOpenModal(cls)}
                                                    className="p-2 text-gray-600 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-500 hover:bg-primary-50 dark:hover:bg-primary-900/20 rounded-lg transition-colors"
                                                    title="Edit"
                                                >
                                                    <Edit2 className="w-4 h-4" />
                                                </button>
                                                <button
                                                    onClick={() => {
                                                        setDeleteTarget(cls);
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

                {/* Add/Edit Modal */}
                {showModal && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-md w-full">
                            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                                <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                                    {editingClass ? 'Edit Class' : 'Add New Class'}
                                </h2>
                            </div>
                            <form onSubmit={handleSubmit} className="p-6 space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                        Class Name *
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                        placeholder="e.g., JSS1, SS2, Grade 10"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                        School Section *
                                    </label>
                                    <select
                                        value={formData.schoolSectionId}
                                        onChange={(e) => setFormData({ ...formData, schoolSectionId: e.target.value })}
                                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white font-medium"
                                        required
                                    >
                                        <option value="">Select Section</option>
                                        {schoolSections.map(ss => (
                                            <option key={ss.id} value={ss.id}>
                                                {ss.name}
                                            </option>
                                        ))}
                                    </select>
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
                                        {submitting ? 'Saving...' : editingClass ? 'Update' : 'Create'}
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
                                <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Delete Class</h2>
                                <p className="text-gray-600 dark:text-gray-400 mb-6">
                                    Are you sure you want to delete <strong>{deleteTarget.name}</strong>?
                                    {deleteTarget.sections && deleteTarget.sections.length > 0 && (
                                        <span className="block mt-2 text-red-600 dark:text-red-400 text-sm">
                                            This class has {deleteTarget.sections.length} section(s) and cannot be deleted.
                                        </span>
                                    )}
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
                                        disabled={submitting || (deleteTarget.sections && deleteTarget.sections.length > 0)}
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

export default ClassPage;
