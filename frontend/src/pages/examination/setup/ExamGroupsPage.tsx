import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, AlertTriangle } from 'lucide-react';
import { useToast } from '../../../context/ToastContext';
import { examinationService, ExamGroup } from '../../../services/examinationService';
import { DataTable } from '../../../components/ui/data-table';
import { ColumnDef } from '@tanstack/react-table';
import { Modal } from '../../../components/ui/modal';

const ExamGroupsPage = () => {
    const [groups, setGroups] = useState<ExamGroup[]>([]);
    const [loading, setLoading] = useState(true);
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [isDeleteOpen, setIsDeleteOpen] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [deletingGroup, setDeletingGroup] = useState<ExamGroup | null>(null);
    const { showSuccess, showError } = useToast();

    // Form State
    const [formData, setFormData] = useState({
        name: '',
        academicYear: '',
        term: '',
        startDate: '',
        endDate: '',
        description: ''
    });

    const fetchGroups = async () => {
        try {
            setLoading(true);
            const data = await examinationService.getExamGroups();
            setGroups(data || []);
        } catch (error) {
            showError('Failed to fetch exam groups');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchGroups();
    }, []);

    const resetForm = () => {
        setFormData({ name: '', academicYear: '', term: '', startDate: '', endDate: '', description: '' });
        setEditingId(null);
        setIsCreateOpen(false);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            if (editingId) {
                await examinationService.updateExamGroup(editingId, formData);
                showSuccess('Exam Group updated successfully');
            } else {
                await examinationService.createExamGroup(formData);
                showSuccess('Exam Group created successfully');
            }
            resetForm();
            fetchGroups();
        } catch (error) {
            showError('Failed to save exam group');
        }
    };

    const handleEdit = (group: ExamGroup) => {
        setFormData({
            name: group.name,
            academicYear: group.academicYear,
            term: group.term,
            startDate: group.startDate ? new Date(group.startDate).toISOString().split('T')[0] : '',
            endDate: group.endDate ? new Date(group.endDate).toISOString().split('T')[0] : '',
            description: group.description || ''
        });
        setEditingId(group.id);
        setIsCreateOpen(true);
    };

    const handleDeleteClick = (group: ExamGroup) => {
        setDeletingGroup(group);
        setIsDeleteOpen(true);
    };

    const confirmDelete = async () => {
        if (!deletingGroup) return;
        try {
            await examinationService.deleteExamGroup(deletingGroup.id);
            showSuccess('Exam Group deleted successfully');
            setIsDeleteOpen(false);
            setDeletingGroup(null);
            fetchGroups();
        } catch (error: any) {
            showError('Failed to delete exam group: ' + (error.response?.data?.message || 'Server error'));
        }
    };

    const columns: ColumnDef<ExamGroup>[] = [
        {
            accessorKey: 'name',
            header: 'Name',
        },
        {
            accessorKey: 'academicYear',
            header: 'Academic Year',
        },
        {
            accessorKey: 'term',
            header: 'Term',
        },
        {
            accessorKey: 'startDate',
            header: 'Start Date',
            cell: ({ row }) => new Date(row.original.startDate).toLocaleDateString(),
        },
        {
            accessorKey: 'endDate',
            header: 'End Date',
            cell: ({ row }) => new Date(row.original.endDate).toLocaleDateString(),
        },
        {
            accessorKey: 'isActive',
            header: 'Status',
            cell: ({ row }) => (
                <span className={`px-2 py-1 rounded-full text-xs font-semibold ${row.original.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                    {row.original.isActive ? 'Active' : 'Inactive'}
                </span>
            ),
        },
        {
            id: 'actions',
            header: () => <div className="text-right">Action</div>,
            cell: ({ row }) => (
                <div className="flex items-center justify-end gap-2">
                    <button
                        onClick={() => handleEdit(row.original)}
                        className="p-1.5 text-primary-600 bg-primary-50 hover:bg-blue-100 rounded-lg transition-colors"
                        title="Edit"
                    >
                        <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                        onClick={() => handleDeleteClick(row.original)}
                        className="p-1.5 text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors"
                        title="Delete"
                    >
                        <Trash2 className="w-4 h-4" />
                    </button>
                </div>
            ),
        },
    ];

    return (
        <div className="p-6 space-y-6 bg-gray-50 dark:bg-gray-900 min-h-screen">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Exam Groups</h1>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Manage Examination Terms and Sessions</p>
                </div>
                <button
                    onClick={() => { resetForm(); setIsCreateOpen(true); }}
                    className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
                >
                    <Plus className="w-4 h-4" />
                    Create Exam Group
                </button>
            </div>

            {/* Main Content */}
            {loading ? (
                <div className="p-12 text-center text-gray-500 dark:text-gray-400 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
                    <p className="mt-4">Loading exam groups...</p>
                </div>
            ) : (
                <DataTable
                    columns={columns}
                    data={groups}
                    searchKey="name"
                />
            )}

            {/* Create/Edit Modal */}
            {isCreateOpen && (
                <div className="fixed inset-0 z-50 overflow-y-auto">
                    <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
                        <div className="fixed inset-0 transition-opacity" aria-hidden="true" onClick={resetForm}>
                            <div className="absolute inset-0 bg-gray-500/75 dark:bg-gray-900/80 backdrop-blur-sm"></div>
                        </div>
                        <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
                        <div className="inline-block align-bottom bg-white dark:bg-gray-800 rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
                            <form onSubmit={handleSubmit}>
                                <div className="bg-white dark:bg-gray-800 px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                                    <div className="flex justify-between items-center mb-4">
                                        <h3 className="text-lg font-medium leading-6 text-gray-900 dark:text-white">
                                            {editingId ? 'Edit Exam Group' : 'Create New Exam Group'}
                                        </h3>
                                        <button type="button" onClick={resetForm} className="text-gray-400 hover:text-gray-500">
                                            <span className="sr-only">Close</span>
                                            <Plus className="h-6 w-6 rotate-45" />
                                        </button>
                                    </div>
                                    <div className="space-y-4">
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Academic Year</label>
                                                <select
                                                    required
                                                    className="w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                                                    value={formData.academicYear}
                                                    onChange={(e) => setFormData({ ...formData, academicYear: e.target.value })}
                                                >
                                                    <option value="">Select Year</option>
                                                    {Array.from({ length: 5 }, (_, i) => {
                                                        const y = new Date().getFullYear() + 1 - i;
                                                        return `${y}/${y + 1}`;
                                                    }).map(y => (
                                                        <option key={y} value={y}>{y}</option>
                                                    ))}
                                                </select>
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Term</label>
                                                <select
                                                    required
                                                    className="w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                                                    value={formData.term}
                                                    onChange={(e) => setFormData({ ...formData, term: e.target.value })}
                                                >
                                                    <option value="">Select Term</option>
                                                    <option value="1st Term">1st Term</option>
                                                    <option value="2nd Term">2nd Term</option>
                                                    <option value="3rd Term">3rd Term</option>
                                                </select>
                                            </div>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Group Name</label>
                                            <input
                                                type="text"
                                                required
                                                className="w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                                                placeholder="e.g. First Term Examination 2025"
                                                value={formData.name}
                                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                            />
                                        </div>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Start Date</label>
                                                <input
                                                    type="date"
                                                    required
                                                    className="w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                                                    value={formData.startDate}
                                                    onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">End Date</label>
                                                <input
                                                    type="date"
                                                    required
                                                    className="w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                                                    value={formData.endDate}
                                                    onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                                                />
                                            </div>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Description</label>
                                            <textarea
                                                className="w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                                                rows={3}
                                                value={formData.description}
                                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                            />
                                        </div>
                                    </div>
                                </div>
                                <div className="bg-gray-50 dark:bg-gray-700/50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                                    <button
                                        type="submit"
                                        className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-primary-600 text-base font-medium text-white hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 sm:ml-3 sm:w-auto sm:text-sm"
                                    >
                                        {editingId ? 'Update Group' : 'Create Group'}
                                    </button>
                                    <button
                                        type="button"
                                        onClick={resetForm}
                                        className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 dark:border-gray-600 shadow-sm px-4 py-2 bg-white dark:bg-gray-800 text-base font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                                    >
                                        Cancel
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}
            {/* Delete Confirmation Modal */}
            <Modal
                isOpen={isDeleteOpen}
                onClose={() => setIsDeleteOpen(false)}
                title="Delete Exam Group"
            >
                <div className="space-y-4">
                    <div className="flex items-center gap-3 p-4 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-lg">
                        <AlertTriangle className="w-6 h-6 shrink-0" />
                        <p className="text-sm font-medium">
                            Warning: This action is permanent and will delete all associated exams, results, and schedules.
                        </p>
                    </div>

                    <p className="text-gray-600 dark:text-gray-400 px-1">
                        Are you sure you want to delete <span className="font-bold text-gray-900 dark:text-white">"{deletingGroup?.name}"</span>?
                    </p>

                    <div className="flex justify-end gap-3 pt-2">
                        <button
                            onClick={() => setIsDeleteOpen(false)}
                            className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-800 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={confirmDelete}
                            className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors shadow-lg shadow-red-600/20"
                        >
                            Yes, Delete Group
                        </button>
                    </div>
                </div>
            </Modal>
        </div>
    );
};

export default ExamGroupsPage;
