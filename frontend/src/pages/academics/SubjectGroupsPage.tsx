import { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Power, Layers } from 'lucide-react';
import api from '../../services/api';
import { useToast } from '../../context/ToastContext';

interface SubjectGroup {
    id: string;
    name: string;
    description?: string;
    isActive: boolean;
}

const SubjectGroupsPage = () => {
    const [groups, setGroups] = useState<SubjectGroup[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [editingGroup, setEditingGroup] = useState<SubjectGroup | null>(null);
    const [deleteTarget, setDeleteTarget] = useState<SubjectGroup | null>(null);

    // Form state
    const [formData, setFormData] = useState({
        name: '',
        description: '',
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
            const data = await api.getSubjectGroups();
            setGroups(data);
            setError('');
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to fetch subject groups');
        } finally {
            setLoading(false);
        }
    };

    const handleOpenModal = (group?: SubjectGroup) => {
        if (group) {
            setEditingGroup(group);
            setFormData({
                name: group.name,
                description: group.description || '',
                isActive: group.isActive
            });
        } else {
            setEditingGroup(null);
            setFormData({
                name: '',
                description: '',
                isActive: true
            });
        }
        setShowModal(true);
    };

    const handleCloseModal = () => {
        setShowModal(false);
        setEditingGroup(null);
        setFormData({ name: '', description: '', isActive: true });
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

            if (editingGroup) {
                await api.updateSubjectGroup(editingGroup.id, formData);
                toast.showSuccess('Subject group updated successfully!');
            } else {
                await api.createSubjectGroup(formData);
                toast.showSuccess('Subject group created successfully!');
            }

            await fetchData(); // Refresh list
            handleCloseModal();
        } catch (err: any) {
            setError(err.response?.data?.message || err.message || 'Failed to save subject group');
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = async () => {
        if (!deleteTarget) return;

        try {
            setSubmitting(true);
            await api.deleteSubjectGroup(deleteTarget.id);
            toast.showSuccess('Subject group deleted successfully!');
            await fetchData();
            setShowDeleteModal(false);
            setDeleteTarget(null);
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to delete subject group');
            setSubmitting(false);
        }
    };

    const handleToggleStatus = async (group: SubjectGroup) => {
        try {
            await api.toggleSubjectGroupStatus(group.id);
            toast.showSuccess(`Subject group ${group.isActive ? 'deactivated' : 'activated'} successfully!`);
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
                        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Subject Groups</h1>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                            Manage subject categories (e.g. Sciences, Arts)
                        </p>
                    </div>
                    <button
                        onClick={() => handleOpenModal()}
                        className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
                    >
                        <Plus className="w-4 h-4" />
                        Add Group
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
                        {groups.length === 0 ? (
                            <div className="p-8 text-center text-gray-500 dark:text-gray-400">
                                No subject groups found. Click "Add Group" to create one.
                            </div>
                        ) : (
                            <table className="w-full">
                                <thead className="bg-gray-50 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                            Group Name
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                            Description
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
                                    {groups.map((group) => (
                                        <tr key={group.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex items-center">
                                                    <div className="flex-shrink-0 h-10 w-10 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg flex items-center justify-center">
                                                        <Layers className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                                                    </div>
                                                    <div className="ml-4">
                                                        <div className="text-sm font-medium text-gray-900 dark:text-white">{group.name}</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm text-gray-500 dark:text-gray-400">
                                                    {group.description || '-'}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span
                                                    className={`px-2 py-1 text-xs font-medium rounded-full ${group.isActive
                                                        ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                                                        : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-400'
                                                        }`}
                                                >
                                                    {group.isActive ? 'Active' : 'Inactive'}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                <div className="flex items-center justify-end gap-2">
                                                    <button
                                                        onClick={() => handleToggleStatus(group)}
                                                        className="p-2 text-gray-600 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-500 hover:bg-primary-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                                                        title={group.isActive ? 'Deactivate' : 'Activate'}
                                                    >
                                                        <Power className="w-4 h-4" />
                                                    </button>
                                                    <button
                                                        onClick={() => handleOpenModal(group)}
                                                        className="p-2 text-gray-600 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-500 hover:bg-primary-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                                                        title="Edit"
                                                    >
                                                        <Edit2 className="w-4 h-4" />
                                                    </button>
                                                    <button
                                                        onClick={() => {
                                                            setDeleteTarget(group);
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
                                    {editingGroup ? 'Edit Subject Group' : 'Add New Subject Group'}
                                </h2>
                            </div>
                            <form onSubmit={handleSubmit} className="p-6 space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                        Group Name *
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                        placeholder="e.g., Sciences"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                        Description
                                    </label>
                                    <textarea
                                        value={formData.description}
                                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                        placeholder="Optional description..."
                                        rows={3}
                                    />
                                </div>

                                <div className="space-y-2">
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
                                        {submitting ? 'Saving...' : editingGroup ? 'Update' : 'Create'}
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
                                <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Delete Subject Group</h2>
                                <p className="text-gray-600 dark:text-gray-400 mb-6">
                                    Are you sure you want to delete group <strong>{deleteTarget.name}</strong>?
                                    <br /><span className="text-xs text-red-500 mt-2 block">Warning: You cannot delete a group if it has subjects assigned to it.</span>
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

export default SubjectGroupsPage;
