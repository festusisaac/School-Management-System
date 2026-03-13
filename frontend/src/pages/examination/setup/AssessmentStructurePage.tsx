import { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, AlertTriangle, Layers } from 'lucide-react';
import { useToast } from '../../../context/ToastContext';
import { examinationService, ExamGroup, AssessmentType } from '../../../services/examinationService';
import { DataTable } from '../../../components/ui/data-table';
import { ColumnDef } from '@tanstack/react-table';
import { Modal } from '../../../components/ui/modal';
import { useSystem } from '../../../context/SystemContext';
import { systemService, AcademicSession, AcademicTerm } from '../../../services/systemService';

const AssessmentStructurePage = () => {
    const [groups, setGroups] = useState<ExamGroup[]>([]);
    const [selectedGroup, setSelectedGroup] = useState<string>('');
    const [assessments, setAssessments] = useState<AssessmentType[]>([]);
    const [loading, setLoading] = useState(false);
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [isDeleteOpen, setIsDeleteOpen] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [deletingAssessment, setDeletingAssessment] = useState<AssessmentType | null>(null);
    const { showSuccess, showError } = useToast();
    const { settings } = useSystem();
    const [sessions, setSessions] = useState<AcademicSession[]>([]);
    const [terms, setTerms] = useState<AcademicTerm[]>([]);
    const [selectedSession, setSelectedSession] = useState<string>(settings?.activeSessionName || '');
    const [selectedTerm, setSelectedTerm] = useState<string>(settings?.activeTermName || '');

    // Form State
    const [formData, setFormData] = useState({
        name: '',
        maxMarks: 100,
        examGroupId: ''
    });

    useEffect(() => {
        const init = async () => {
            try {
                const [g, s, t] = await Promise.all([
                    examinationService.getExamGroups(),
                    systemService.getSessions(),
                    systemService.getTerms()
                ]);
                setGroups(g || []);
                setSessions(s || []);
                setTerms(t || []);

                const sessionToUse = selectedSession || settings?.activeSessionName;
                const termToUse = selectedTerm || settings?.activeTermName;

                if (g?.length > 0) {
                    const filtered = g.filter(group =>
                        (!sessionToUse || group.academicYear === sessionToUse) &&
                        (!termToUse || group.term === termToUse)
                    );
                    if (filtered.length > 0) {
                        setSelectedGroup(filtered[0].id);
                    } else if (!selectedGroup) {
                        setSelectedGroup(g[0].id);
                    }
                }
            } catch (error) {
                showError('Failed to load initial data');
            }
        };
        init();
    }, []);

    useEffect(() => {
        if (selectedGroup) {
            fetchAssessments(selectedGroup);
            setFormData(prev => ({ ...prev, examGroupId: selectedGroup }));
        } else {
            setAssessments([]);
        }
    }, [selectedGroup]);

    // Filtered Groups for Selection
    const filteredGroups = groups.filter(g =>
        (!selectedSession || g.academicYear === selectedSession) &&
        (!selectedTerm || g.term === selectedTerm)
    );

    const fetchAssessments = async (groupId: string) => {
        try {
            setLoading(true);
            const data = await examinationService.getAssessmentTypes(groupId);
            setAssessments(data || []);
        } catch (error) {
            showError('Failed to fetch assessment types');
        } finally {
            setLoading(false);
        }
    };

    const resetForm = () => {
        setFormData({ name: '', maxMarks: 100, examGroupId: selectedGroup });
        setEditingId(null);
        setIsCreateOpen(false);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            if (editingId) {
                await examinationService.updateAssessmentType(editingId, formData);
                showSuccess('Assessment Type updated successfully');
            } else {
                await examinationService.createAssessmentType(formData);
                showSuccess('Assessment Type created successfully');
            }
            resetForm();
            if (selectedGroup) fetchAssessments(selectedGroup);
        } catch (error) {
            showError('Failed to save assessment type');
        }
    };

    const handleEdit = (assessment: AssessmentType) => {
        setFormData({
            name: assessment.name,
            maxMarks: assessment.maxMarks,
            examGroupId: assessment.examGroupId
        });
        setEditingId(assessment.id);
        setIsCreateOpen(true);
    };

    const handleDeleteClick = (assessment: AssessmentType) => {
        setDeletingAssessment(assessment);
        setIsDeleteOpen(true);
    };

    const confirmDelete = async () => {
        if (!deletingAssessment) return;
        try {
            await examinationService.deleteAssessmentType(deletingAssessment.id);
            showSuccess('Assessment Type deleted successfully');
            setIsDeleteOpen(false);
            setDeletingAssessment(null);
            if (selectedGroup) fetchAssessments(selectedGroup);
        } catch (error) {
            showError('Failed to delete assessment type');
        }
    };

    const columns: ColumnDef<AssessmentType>[] = [
        {
            accessorKey: 'name',
            header: 'Assessment Name',
            cell: ({ row }) => (
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-primary-50 dark:bg-primary-900/20 rounded-lg">
                        <Layers className="w-4 h-4 text-primary-600 dark:text-primary-400" />
                    </div>
                    <span className="font-medium text-gray-900 dark:text-white">{row.original.name}</span>
                </div>
            )
        },
        {
            accessorKey: 'maxMarks',
            header: 'Max Marks',
            cell: ({ row }) => (
                <div className="flex items-center gap-2">
                    <span className="px-2.5 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-md text-sm font-bold">
                        {row.original.maxMarks}
                    </span>
                    <span className="text-xs text-gray-400">marks</span>
                </div>
            )
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
        }
    ];

    return (
        <div className="p-6 space-y-6 bg-gray-50 dark:bg-gray-900 min-h-screen">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Assessment Structure</h1>
                    <p className="text-gray-500 dark:text-gray-400">Define CA and Exam weightage for each term</p>
                </div>
                <div className="flex flex-wrap gap-4 items-center">
                    <select
                        className="rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 shadow-sm"
                        value={selectedSession}
                        onChange={(e) => {
                            setSelectedSession(e.target.value);
                            setSelectedGroup('');
                        }}
                    >
                        <option value="">All Sessions</option>
                        {sessions.map(s => (
                            <option key={s.id} value={s.name}>{s.name}</option>
                        ))}
                    </select>

                    <select
                        className="rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 shadow-sm"
                        value={selectedTerm}
                        onChange={(e) => {
                            setSelectedTerm(e.target.value);
                            setSelectedGroup('');
                        }}
                    >
                        <option value="">All Terms</option>
                        {terms.map(t => (
                            <option key={t.id} value={t.name}>{t.name}</option>
                        ))}
                    </select>

                    <select
                        className="rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 shadow-sm"
                        value={selectedGroup}
                        onChange={(e) => setSelectedGroup(e.target.value)}
                    >
                        <option value="">Select Exam Group</option>
                        {filteredGroups.map(g => (
                            <option key={g.id} value={g.id}>{g.name}</option>
                        ))}
                    </select>
                    <button
                        onClick={() => { resetForm(); setIsCreateOpen(true); }}
                        disabled={!selectedGroup}
                        className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-primary-600/20"
                    >
                        <Plus className="w-4 h-4" />
                        Add Assessment
                    </button>
                </div>
            </div>

            {/* Main Content */}
            {loading ? (
                <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm p-12 text-center text-gray-500 dark:text-gray-400">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
                    <p className="mt-4">Loading assessments...</p>
                </div>
            ) : assessments.length === 0 ? (
                <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm p-12 text-center text-gray-500 dark:text-gray-400">
                    <Layers className="w-12 h-12 mx-auto text-gray-300 mb-4" />
                    <p>No assessment types defined for this group yet.</p>
                    <p className="text-sm mt-1 text-gray-400">Click "Add Assessment" to get started.</p>
                </div>
            ) : (
                <DataTable
                    columns={columns}
                    data={assessments}
                    searchKey="name"
                />
            )}

            {/* Create/Edit Modal */}
            <Modal
                isOpen={isCreateOpen}
                onClose={resetForm}
                title={editingId ? "Edit Assessment Type" : "Add Assessment Type"}
            >
                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                    <div className="space-y-5">
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                                Assessment Name
                            </label>
                            <input
                                type="text"
                                required
                                className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-4 py-2.5 text-sm font-medium text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all shadow-sm"
                                placeholder="e.g. First CA, Final Exam"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            />
                            <p className="mt-1.5 text-xs text-gray-500">
                                Descriptive name for this evaluation component.
                            </p>
                        </div>

                        <div>
                            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                                Max Marks
                            </label>
                            <div className="relative">
                                <input
                                    type="number"
                                    required
                                    min="0"
                                    className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-4 py-2.5 text-sm font-medium text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all shadow-sm [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                    value={formData.maxMarks}
                                    onChange={(e) => setFormData({ ...formData, maxMarks: parseInt(e.target.value) })}
                                />
                            </div>
                            <p className="mt-1.5 text-xs text-gray-500">
                                The maximum score attainable for this assessment.
                            </p>
                        </div>
                    </div>

                    <div className="flex justify-end gap-3 pt-6 border-t border-gray-100 dark:border-gray-700 mt-2">
                        <button
                            type="button"
                            onClick={resetForm}
                            className="px-5 py-2.5 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg transition-all shadow-sm"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="px-5 py-2.5 text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 rounded-lg transition-all shadow-md shadow-primary-600/10"
                        >
                            {editingId ? "Update Structure" : "Create Structure"}
                        </button>
                    </div>
                </form>
            </Modal>

            {/* Delete Confirmation Modal */}
            <Modal
                isOpen={isDeleteOpen}
                onClose={() => setIsDeleteOpen(false)}
                title="Delete Assessment Type"
            >
                <div className="space-y-4">
                    <div className="flex items-center gap-3 p-4 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-lg">
                        <AlertTriangle className="w-6 h-6 shrink-0" />
                        <p className="text-sm font-medium">
                            Warning: This will delete this assessment type and all associated scores.
                        </p>
                    </div>

                    <p className="text-gray-600 dark:text-gray-400 px-1">
                        Are you sure you want to delete <span className="font-bold text-gray-900 dark:text-white">"{deletingAssessment?.name}"</span>?
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
                            Yes, Delete Assessment
                        </button>
                    </div>
                </div>
            </Modal>
        </div>
    );
};

export default AssessmentStructurePage;
