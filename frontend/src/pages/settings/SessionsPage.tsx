import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, AlertTriangle } from 'lucide-react';
import { useToast } from '../../context/ToastContext';
import { systemService, AcademicSession } from '../../services/systemService';
import { DataTable } from '../../components/ui/data-table';
import { ColumnDef } from '@tanstack/react-table';
import { Modal } from '../../components/ui/modal';

const SessionsPage = () => {
    const [sessions, setSessions] = useState<AcademicSession[]>([]);
    const [loading, setLoading] = useState(true);
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [isDeleteOpen, setIsDeleteOpen] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [deletingSession, setDeletingSession] = useState<AcademicSession | null>(null);
    const { showSuccess, showError } = useToast();

    // Form State
    const [formData, setFormData] = useState({
        name: '',
        startDate: '',
        endDate: '',
        isActive: false
    });

    const fetchSessions = async () => {
        try {
            setLoading(true);
            const data = await systemService.getSessions();
            setSessions(data || []);
        } catch (error) {
            showError('Failed to fetch academic sessions');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchSessions();
    }, []);

    const resetForm = () => {
        setFormData({ name: '', startDate: '', endDate: '', isActive: false });
        setEditingId(null);
        setIsCreateOpen(false);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            if (editingId) {
                await systemService.updateSession(editingId, formData);
                showSuccess('Session updated successfully');
            } else {
                await systemService.createSession(formData);
                showSuccess('Session created successfully');
            }
            resetForm();
            fetchSessions();
        } catch (error: any) {
            const message = error.response?.data?.message || 'Failed to save academic session';
            showError(message);
        }
    };

    const handleEdit = (session: AcademicSession) => {
        setFormData({
            name: session.name,
            startDate: session.startDate ? new Date(session.startDate).toISOString().split('T')[0] : '',
            endDate: session.endDate ? new Date(session.endDate).toISOString().split('T')[0] : '',
            isActive: session.isActive
        });
        setEditingId(session.id);
        setIsCreateOpen(true);
    };

    const handleDeleteClick = (session: AcademicSession) => {
        setDeletingSession(session);
        setIsDeleteOpen(true);
    };

    const confirmDelete = async () => {
        if (!deletingSession) return;
        try {
            await systemService.deleteSession(deletingSession.id);
            showSuccess('Session deleted successfully');
            setIsDeleteOpen(false);
            setDeletingSession(null);
            fetchSessions();
        } catch (error: any) {
            showError('Failed to delete session: ' + (error.response?.data?.message || 'Server error'));
        }
    };

    const columns: ColumnDef<AcademicSession>[] = [
        {
            accessorKey: 'name',
            header: 'Session Name',
        },
        {
            accessorKey: 'startDate',
            header: 'Start Date',
            cell: ({ row }) => row.original.startDate ? new Date(row.original.startDate).toLocaleDateString() : 'N/A',
        },
        {
            accessorKey: 'endDate',
            header: 'End Date',
            cell: ({ row }) => row.original.endDate ? new Date(row.original.endDate).toLocaleDateString() : 'N/A',
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
                        className="p-1.5 text-primary-600 bg-primary-50 hover:bg-primary-100 rounded-lg transition-colors"
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
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Academic Sessions</h1>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Manage the school's academic years/sessions</p>
                </div>
                <button
                    onClick={() => { resetForm(); setIsCreateOpen(true); }}
                    className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
                >
                    <Plus className="w-4 h-4" />
                    New Session
                </button>
            </div>

            {/* Main Content */}
            {loading ? (
                <div className="p-12 text-center text-gray-500 dark:text-gray-400 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
                    <p className="mt-4">Loading sessions...</p>
                </div>
            ) : (
                <DataTable
                    columns={columns}
                    data={sessions}
                    searchKey="name"
                />
            )}

            {/* Create/Edit Modal */}
            <Modal
                isOpen={isCreateOpen}
                onClose={resetForm}
                title={editingId ? 'Edit Session' : 'Create New Session'}
            >
                <form onSubmit={handleSubmit}>
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Session Name</label>
                            <input
                                type="text"
                                required
                                className="w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                                placeholder="e.g. 2025/2026"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Start Date</label>
                                <input
                                    type="date"
                                    className="w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                                    value={formData.startDate}
                                    onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">End Date</label>
                                <input
                                    type="date"
                                    className="w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                                    value={formData.endDate}
                                    onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                                />
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <input
                                type="checkbox"
                                id="isActive"
                                checked={formData.isActive}
                                onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                                className="w-4 h-4 text-primary-600 bg-gray-100 border-gray-300 rounded focus:ring-primary-500 dark:bg-gray-700 dark:border-gray-600"
                            />
                            <label htmlFor="isActive" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                Set as currently active session (Note: may auto-disable others depending on backend logic)
                            </label>
                        </div>
                    </div>
                    <div className="mt-6 flex justify-end gap-3">
                        <button
                            type="button"
                            onClick={resetForm}
                            className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-primary-500"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-md hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500"
                        >
                            {editingId ? 'Update Session' : 'Create Session'}
                        </button>
                    </div>
                </form>
            </Modal>

            {/* Delete Confirmation Modal */}
            <Modal
                isOpen={isDeleteOpen}
                onClose={() => setIsDeleteOpen(false)}
                title="Delete Session"
            >
                <div className="space-y-4">
                    <div className="flex items-center gap-3 p-4 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-lg">
                        <AlertTriangle className="w-6 h-6 shrink-0" />
                        <p className="text-sm font-medium">
                            Warning: This action will delete the session. Ensure no terms or student records are using this session.
                        </p>
                    </div>

                    <p className="text-gray-600 dark:text-gray-400 px-1">
                        Are you sure you want to delete <span className="font-bold text-gray-900 dark:text-white">"{deletingSession?.name}"</span>?
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
                            Yes, Delete Session
                        </button>
                    </div>
                </div>
            </Modal>
        </div>
    );
};

export default SessionsPage;
