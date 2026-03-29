import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, AlertTriangle, Calendar, Filter } from 'lucide-react';
import { useToast } from '../../context/ToastContext';
import { systemService, AcademicTerm, AcademicSession } from '../../services/systemService';
import { DataTable } from '../../components/ui/data-table';
import { ColumnDef } from '@tanstack/react-table';
import { Modal } from '../../components/ui/modal';
import { useSystem } from '../../context/SystemContext';

const TermsPage = () => {
    const [terms, setTerms] = useState<AcademicTerm[]>([]);
    const [sessions, setSessions] = useState<AcademicSession[]>([]);
    const [selectedSessionId, setSelectedSessionId] = useState<string>('');
    const [loading, setLoading] = useState(true);
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [isDeleteOpen, setIsDeleteOpen] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [deletingTerm, setDeletingTerm] = useState<AcademicTerm | null>(null);
    const { showSuccess, showError } = useToast();
    const { refreshSettings } = useSystem();

    // Form State
    const [formData, setFormData] = useState({
        name: '',
        sessionId: '',
        startDate: '',
        endDate: '',
        isActive: false,
        daysOpened: '',
        nextTermStartDate: ''
    });

    const loadInitialData = async () => {
        try {
            setLoading(true);
            const sessionsData = await systemService.getSessions();
            setSessions(sessionsData || []);
            
            const activeSession = sessionsData.find(s => s.isActive);
            if (activeSession) {
                setSelectedSessionId(activeSession.id);
            } else if (sessionsData.length > 0) {
                setSelectedSessionId(sessionsData[0].id);
            }
        } catch (error) {
            showError('Failed to fetch sessions');
        } finally {
            setLoading(false);
        }
    };

    const loadTerms = async (sessionId: string) => {
        if (!sessionId) return;
        try {
            setLoading(true);
            const termsData = await systemService.getTermsBySession(sessionId);
            setTerms(termsData || []);
        } catch (error) {
            showError('Failed to fetch terms for the selected session');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadInitialData();
    }, []);

    useEffect(() => {
        if (selectedSessionId) {
            loadTerms(selectedSessionId);
        }
    }, [selectedSessionId]);

    const resetForm = () => {
        setFormData({
            name: '',
            sessionId: selectedSessionId,
            startDate: '',
            endDate: '',
            isActive: false,
            daysOpened: '',
            nextTermStartDate: ''
        });
        setEditingId(null);
        setIsCreateOpen(false);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const payload = {
                ...formData,
                daysOpened: parseInt(formData.daysOpened) || 0,
                startDate: formData.startDate || undefined,
                endDate: formData.endDate || undefined,
                nextTermStartDate: formData.nextTermStartDate || undefined,
            };

            if (editingId) {
                await systemService.updateTerm(editingId, payload);
                showSuccess('Term updated successfully');
            } else {
                await systemService.createTerm(payload);
                showSuccess('Term created successfully');
            }
            resetForm();
            loadTerms(selectedSessionId);
            if (formData.isActive || editingId) {
                refreshSettings();
            }
        } catch (error: any) {
            const message = error.response?.data?.message || 'Failed to save academic term';
            showError(message);
        }
    };

    const handleEdit = (term: AcademicTerm) => {
        setFormData({
            name: term.name,
            sessionId: term.sessionId,
            startDate: term.startDate ? new Date(term.startDate).toISOString().split('T')[0] : '',
            endDate: term.endDate ? new Date(term.endDate).toISOString().split('T')[0] : '',
            isActive: term.isActive,
            daysOpened: term.daysOpened?.toString() || '',
            nextTermStartDate: term.nextTermStartDate ? new Date(term.nextTermStartDate).toISOString().split('T')[0] : ''
        });
        setEditingId(term.id);
        setIsCreateOpen(true);
    };

    const handleDeleteClick = (term: AcademicTerm) => {
        setDeletingTerm(term);
        setIsDeleteOpen(true);
    };

    const confirmDelete = async () => {
        if (!deletingTerm) return;
        try {
            await systemService.deleteTerm(deletingTerm.id);
            showSuccess('Term deleted successfully');
            setIsDeleteOpen(false);
            setDeletingTerm(null);
            loadTerms(selectedSessionId);
            refreshSettings();
        } catch (error: any) {
            showError('Failed to delete term: ' + (error.response?.data?.message || 'Server error'));
        }
    };

    const columns: ColumnDef<AcademicTerm>[] = [
        {
            accessorKey: 'name',
            header: 'Term Name',
            cell: ({ row }) => (
                <div className="font-medium text-gray-900 dark:text-white">
                    {row.original.name}
                </div>
            )
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
            accessorKey: 'daysOpened',
            header: 'Days Opened',
        },
        {
            accessorKey: 'nextTermStartDate',
            header: 'Next Term Starts',
            cell: ({ row }) => row.original.nextTermStartDate ? new Date(row.original.nextTermStartDate).toLocaleDateString() : 'N/A',
        },
        {
            accessorKey: 'isActive',
            header: 'Status',
            cell: ({ row }) => (
                <span className={`px-2 py-1 rounded-full text-xs font-semibold ${row.original.isActive ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'}`}>
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
                        className="p-1.5 text-primary-600 bg-primary-50 hover:bg-primary-100 dark:bg-primary-900/20 dark:hover:bg-primary-900/40 rounded-lg transition-colors"
                        title="Edit"
                    >
                        <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                        onClick={() => handleDeleteClick(row.original)}
                        className="p-1.5 text-red-600 bg-red-50 hover:bg-red-100 dark:bg-red-900/20 dark:hover:bg-red-900/40 rounded-lg transition-colors"
                        title="Delete"
                    >
                        <Trash2 className="w-4 h-4" />
                    </button>
                </div>
            ),
        },
    ];

    const currentSession = sessions.find(s => s.id === selectedSessionId);

    return (
        <div className="p-6 space-y-6 bg-gray-50 dark:bg-gray-950 min-h-screen">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Academic Terms</h1>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Manage the terms for each academic session</p>
                </div>
                <div className="flex items-center gap-3 w-full md:w-auto">
                    <div className="relative flex-1 md:flex-initial">
                        <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                        <select
                            value={selectedSessionId}
                            onChange={(e) => setSelectedSessionId(e.target.value)}
                            className="w-full md:w-64 pl-9 pr-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm text-gray-700 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all appearance-none"
                        >
                            <option value="">Select Session</option>
                            {sessions.map(s => (
                                <option key={s.id} value={s.id}>
                                    {s.name} {s.isActive ? '(Active)' : ''}
                                </option>
                            ))}
                        </select>
                    </div>
                    <button
                        onClick={() => { resetForm(); setIsCreateOpen(true); }}
                        className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors shadow-sm shadow-primary-600/20 whitespace-nowrap"
                        disabled={!selectedSessionId}
                    >
                        <Plus className="w-4 h-4" />
                        New Term
                    </button>
                </div>
            </div>

            {currentSession && (
                <div className="flex items-center gap-3 px-4 py-3 bg-primary-50 dark:bg-primary-900/20 border border-primary-100 dark:border-primary-800 rounded-xl text-primary-700 dark:text-primary-300">
                    <Calendar className="w-5 h-5 flex-shrink-0" />
                    <div className="text-sm">
                        <span className="font-bold">Viewing Session:</span> {currentSession.name} 
                        {currentSession.startDate && currentSession.endDate && (
                            <span className="ml-2 font-medium opacity-80">
                                ({new Date(currentSession.startDate).toLocaleDateString()} - {new Date(currentSession.endDate).toLocaleDateString()})
                            </span>
                        )}
                    </div>
                </div>
            )}

            {/* Main Content */}
            {!selectedSessionId ? (
                <div className="p-12 text-center bg-white dark:bg-gray-800 rounded-xl border-2 border-dashed border-gray-200 dark:border-gray-700">
                    <Filter className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                    <p className="text-gray-500 dark:text-gray-400">Please select an academic session to view and manage its terms.</p>
                </div>
            ) : loading ? (
                <div className="p-12 text-center text-gray-500 dark:text-gray-400 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
                    <p className="mt-4">Loading terms...</p>
                </div>
            ) : (
                <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm overflow-hidden">
                    <DataTable
                        columns={columns}
                        data={terms}
                        searchKey="name"
                    />
                </div>
            )}

            {/* Create/Edit Modal */}
            <Modal
                isOpen={isCreateOpen}
                onClose={resetForm}
                title={editingId ? 'Edit Term' : 'Create New Term'}
            >
                <form onSubmit={handleSubmit} className="p-1">
                    <div className="space-y-5">
                        <div className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl space-y-4">
                            <div>
                                <label className="block text-[13px] font-bold text-gray-700 dark:text-gray-300 mb-1.5 uppercase tracking-wider">Academic Session</label>
                                <select
                                    required
                                    className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/50 transition-all"
                                    value={formData.sessionId}
                                    onChange={(e) => setFormData({ ...formData, sessionId: e.target.value })}
                                >
                                    {sessions.map(s => (
                                        <option key={s.id} value={s.id}>{s.name} {s.isActive ? '(Active)' : ''}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-[13px] font-bold text-gray-700 dark:text-gray-300 mb-1.5 uppercase tracking-wider">Term Name</label>
                                <input
                                    type="text"
                                    required
                                    className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/50 transition-all"
                                    placeholder="e.g. First Term"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-[13px] font-bold text-gray-700 dark:text-gray-300 mb-1.5 uppercase tracking-wider">Start Date</label>
                                <input
                                    type="date"
                                    required
                                    className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/50 transition-all"
                                    value={formData.startDate}
                                    onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-[13px] font-bold text-gray-700 dark:text-gray-300 mb-1.5 uppercase tracking-wider">End Date</label>
                                <input
                                    type="date"
                                    required
                                    className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/50 transition-all"
                                    value={formData.endDate}
                                    onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-[13px] font-bold text-gray-700 dark:text-gray-300 mb-1.5 uppercase tracking-wider">Days Opened</label>
                                <input
                                    type="number"
                                    className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/50 transition-all"
                                    placeholder="e.g. 110"
                                    value={formData.daysOpened}
                                    onChange={(e) => setFormData({ ...formData, daysOpened: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-[13px] font-bold text-gray-700 dark:text-gray-300 mb-1.5 uppercase tracking-wider">Next Term Begins</label>
                                <input
                                    type="date"
                                    className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/50 transition-all"
                                    value={formData.nextTermStartDate}
                                    onChange={(e) => setFormData({ ...formData, nextTermStartDate: e.target.value })}
                                />
                            </div>
                        </div>

                        <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800/50 rounded-xl cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                             onClick={() => setFormData({ ...formData, isActive: !formData.isActive })}>
                            <div className={`w-10 h-6 flex items-center rounded-full p-1 transition-colors duration-200 ${formData.isActive ? 'bg-primary-600' : 'bg-gray-300 dark:bg-gray-600'}`}>
                                <div className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform duration-200 ${formData.isActive ? 'translate-x-4' : 'translate-x-0'}`} />
                            </div>
                            <span className="text-sm font-semibold text-gray-700 dark:text-gray-200">
                                Set as currently active system term
                            </span>
                        </div>
                    </div>

                    <div className="mt-8 flex justify-end gap-3">
                        <button
                            type="button"
                            onClick={resetForm}
                            className="px-5 py-2.5 text-sm font-bold text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="px-6 py-2.5 text-sm font-bold text-white bg-primary-600 rounded-xl hover:bg-primary-700 transition-all shadow-lg shadow-primary-600/20 active:scale-95"
                        >
                            {editingId ? 'Save Changes' : 'Create Term'}
                        </button>
                    </div>
                </form>
            </Modal>

            {/* Delete Confirmation Modal */}
            <Modal
                isOpen={isDeleteOpen}
                onClose={() => setIsDeleteOpen(false)}
                title="Delete Term"
            >
                <div className="space-y-4">
                    <div className="flex items-center gap-3 p-4 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-xl border border-red-100 dark:border-red-900/30">
                        <AlertTriangle className="w-6 h-6 shrink-0" />
                        <p className="text-sm font-medium">
                            Warning: Deleting a term will remove all associated exam records and schedules. This action cannot be undone.
                        </p>
                    </div>

                    <p className="text-gray-600 dark:text-gray-400 px-1">
                        Are you sure you want to delete <span className="font-bold text-gray-900 dark:text-white">"{deletingTerm?.name}"</span>?
                    </p>

                    <div className="flex justify-end gap-3 pt-4">
                        <button
                            onClick={() => setIsDeleteOpen(false)}
                            className="px-5 py-2.5 text-sm font-bold text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={confirmDelete}
                            className="px-6 py-2.5 text-sm font-bold text-white bg-red-600 rounded-xl hover:bg-red-700 transition-all shadow-lg shadow-red-600/20 active:scale-95"
                        >
                            Confirm Delete
                        </button>
                    </div>
                </div>
            </Modal>
        </div>
    );
};

export default TermsPage;
