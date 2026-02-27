import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, AlertTriangle, Scale } from 'lucide-react';
import { useToast } from '../../../context/ToastContext';
import { examinationService, GradeScale } from '../../../services/examinationService';
import { DataTable } from '../../../components/ui/data-table';
import { ColumnDef } from '@tanstack/react-table';
import { Modal } from '../../../components/ui/modal';

interface GradeRow {
    name: string;
    minScore: string;
    maxScore: string;
    remark: string;
}

const GradingSystemPage = () => {
    const [scales, setScales] = useState<GradeScale[]>([]);
    const [loading, setLoading] = useState(false);
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [isDeleteOpen, setIsDeleteOpen] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [deletingScale, setDeletingScale] = useState<GradeScale | null>(null);
    const { showSuccess, showError } = useToast();

    // Form State
    const [scaleName, setScaleName] = useState('');
    const [gradeRows, setGradeRows] = useState<GradeRow[]>([
        { name: 'A', minScore: '70', maxScore: '100', remark: 'Excellent' },
        { name: 'B', minScore: '60', maxScore: '69', remark: 'Very Good' },
        { name: 'C', minScore: '50', maxScore: '59', remark: 'Credit' },
        { name: 'D', minScore: '45', maxScore: '49', remark: 'Pass' },
        { name: 'F', minScore: '0', maxScore: '44', remark: 'Fail' },
    ]);

    useEffect(() => {
        fetchScales();
    }, []);

    const fetchScales = async () => {
        try {
            setLoading(true);
            const data = await examinationService.getGradeScales();
            setScales(data || []);
        } catch (error) {
            showError('Failed to fetch grade scales');
        } finally {
            setLoading(false);
        }
    };

    const handleAddRow = () => {
        setGradeRows([...gradeRows, { name: '', minScore: '', maxScore: '', remark: '' }]);
    };

    const handleRemoveRow = (index: number) => {
        const newRows = [...gradeRows];
        newRows.splice(index, 1);
        setGradeRows(newRows);
    };

    const handleRowChange = (index: number, field: keyof GradeRow, value: string) => {
        const newRows = [...gradeRows];
        newRows[index][field] = value;
        setGradeRows(newRows);
    };

    const resetForm = () => {
        setScaleName('');
        setGradeRows([
            { name: 'A', minScore: '70', maxScore: '100', remark: 'Excellent' },
            { name: 'B', minScore: '60', maxScore: '69', remark: 'Very Good' },
            { name: 'C', minScore: '50', maxScore: '59', remark: 'Credit' },
            { name: 'D', minScore: '45', maxScore: '49', remark: 'Pass' },
            { name: 'F', minScore: '0', maxScore: '44', remark: 'Fail' },
        ]);
        setEditingId(null);
        setIsCreateOpen(false);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const payload = {
                name: scaleName,
                grades: gradeRows.map(r => ({
                    name: r.name,
                    minScore: Number(r.minScore),
                    maxScore: Number(r.maxScore),
                    remark: r.remark
                }))
            };
            if (editingId) {
                await examinationService.updateGradeScale(editingId, payload);
                showSuccess('Grade Scale updated successfully');
            } else {
                await examinationService.createGradeScale(payload);
                showSuccess('Grade Scale created successfully');
            }
            resetForm();
            fetchScales();
        } catch (error) {
            showError('Failed to save grade scale');
        }
    };

    const handleEdit = (scale: GradeScale) => {
        setScaleName(scale.name);
        setGradeRows(scale.grades.map(g => ({
            name: g.name,
            minScore: g.minScore.toString(),
            maxScore: g.maxScore.toString(),
            remark: g.remark || ''
        })));
        setEditingId(scale.id);
        setIsCreateOpen(true);
    };

    const handleDeleteClick = (scale: GradeScale) => {
        setDeletingScale(scale);
        setIsDeleteOpen(true);
    };

    const confirmDelete = async () => {
        if (!deletingScale) return;
        try {
            await examinationService.deleteGradeScale(deletingScale.id);
            showSuccess('Grade Scale deleted successfully');
            setIsDeleteOpen(false);
            setDeletingScale(null);
            fetchScales();
        } catch (error) {
            showError('Failed to delete grade scale');
        }
    };

    const columns: ColumnDef<GradeScale>[] = [
        {
            accessorKey: 'name',
            header: 'Scale Name',
            cell: ({ row }) => (
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                        <Scale className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                    </div>
                    <span className="font-medium text-gray-900 dark:text-white">{row.original.name}</span>
                </div>
            )
        },
        {
            accessorKey: 'grades',
            header: 'Grades Defined',
            cell: ({ row }) => (
                <div className="flex gap-2 flex-wrap">
                    {row.original.grades.map(g => (
                        <span key={g.name} className="px-2.5 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-md text-xs font-semibold">
                            {g.name}: {g.minScore}-{g.maxScore}%
                        </span>
                    ))}
                </div>
            ),
        },
        {
            id: 'actions',
            header: () => <div className="text-right">Action</div>,
            cell: ({ row }) => (
                <div className="flex items-center justify-end gap-2">
                    <button
                        onClick={() => handleEdit(row.original)}
                        className="p-1.5 text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
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
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Grading System</h1>
                    <p className="text-gray-500 dark:text-gray-400">Configure Grade Scales and Remarks</p>
                </div>
                <button
                    onClick={() => { resetForm(); setIsCreateOpen(true); }}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-lg shadow-blue-600/20"
                >
                    <Plus className="w-4 h-4" />
                    Create Grade Scale
                </button>
            </div>

            {/* Main Content */}
            {loading ? (
                <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm p-12 text-center text-gray-500 dark:text-gray-400">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="mt-4">Loading grade scales...</p>
                </div>
            ) : scales.length === 0 ? (
                <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm p-12 text-center text-gray-500 dark:text-gray-400">
                    <Scale className="w-12 h-12 mx-auto text-gray-300 mb-4" />
                    <p>No grading systems defined yet.</p>
                    <p className="text-sm mt-1 text-gray-400">Click "Create Grade Scale" to get started.</p>
                </div>
            ) : (
                <DataTable
                    columns={columns}
                    data={scales}
                    searchKey="name"
                />
            )}

            {/* Create Modal */}
            <Modal
                isOpen={isCreateOpen}
                onClose={resetForm}
                title={editingId ? "Edit Grade Scale" : "Create Grade Scale"}
            >
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Scale Name</label>
                        <input
                            type="text"
                            required
                            className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="e.g. WAEC Standard"
                            value={scaleName}
                            onChange={(e) => setScaleName(e.target.value)}
                        />
                    </div>

                    <div className="border rounded-lg border-gray-200 dark:border-gray-700 overflow-hidden bg-gray-50/50 dark:bg-gray-900/50">
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                                <thead className="bg-gray-100/50 dark:bg-gray-800/50 text-gray-500 dark:text-gray-400">
                                    <tr>
                                        <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wider">Grade</th>
                                        <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wider">Min</th>
                                        <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wider">Max</th>
                                        <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wider">Remark</th>
                                        <th className="px-3 py-2"></th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                                    {gradeRows.map((row, index) => (
                                        <tr key={index} className="group hover:bg-white dark:hover:bg-gray-800 transition-colors">
                                            <td className="px-2 py-2">
                                                <input
                                                    placeholder="A"
                                                    className="w-12 border border-gray-200 dark:border-gray-600 rounded-lg p-1.5 text-sm bg-white dark:bg-gray-700 focus:ring-2 focus:ring-blue-500 outline-none"
                                                    value={row.name}
                                                    onChange={(e) => handleRowChange(index, 'name', e.target.value)}
                                                    required
                                                />
                                            </td>
                                            <td className="px-2 py-2">
                                                <input
                                                    type="number"
                                                    className="w-16 border border-gray-200 dark:border-gray-600 rounded-lg p-1.5 text-sm bg-white dark:bg-gray-700 focus:ring-2 focus:ring-blue-500 outline-none"
                                                    value={row.minScore}
                                                    onChange={(e) => handleRowChange(index, 'minScore', e.target.value)}
                                                    required
                                                />
                                            </td>
                                            <td className="px-2 py-2">
                                                <input
                                                    type="number"
                                                    className="w-16 border border-gray-200 dark:border-gray-600 rounded-lg p-1.5 text-sm bg-white dark:bg-gray-700 focus:ring-2 focus:ring-blue-500 outline-none"
                                                    value={row.maxScore}
                                                    onChange={(e) => handleRowChange(index, 'maxScore', e.target.value)}
                                                    required
                                                />
                                            </td>
                                            <td className="px-2 py-2">
                                                <input
                                                    className="w-full border border-gray-200 dark:border-gray-600 rounded-lg p-1.5 text-sm bg-white dark:bg-gray-700 focus:ring-2 focus:ring-blue-500 outline-none"
                                                    placeholder="Excellent"
                                                    value={row.remark}
                                                    onChange={(e) => handleRowChange(index, 'remark', e.target.value)}
                                                />
                                            </td>
                                            <td className="px-2 py-2 text-center">
                                                <button
                                                    type="button"
                                                    onClick={() => handleRemoveRow(index)}
                                                    className="p-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        <div className="p-3 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700">
                            <button
                                type="button"
                                onClick={handleAddRow}
                                className="text-sm font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400 flex items-center gap-1.5"
                            >
                                <Plus className="w-4 h-4" /> Add Grade Row
                            </button>
                        </div>
                    </div>

                    <div className="flex justify-end gap-3 pt-4">
                        <button
                            type="button"
                            onClick={resetForm}
                            className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-800 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors shadow-lg shadow-blue-600/20"
                        >
                            {editingId ? "Update Scale" : "Save Scale"}
                        </button>
                    </div>
                </form>
            </Modal>

            {/* Delete Confirmation Modal */}
            <Modal
                isOpen={isDeleteOpen}
                onClose={() => setIsDeleteOpen(false)}
                title="Delete Grade Scale"
            >
                <div className="space-y-4">
                    <div className="flex items-center gap-3 p-4 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-lg">
                        <AlertTriangle className="w-6 h-6 shrink-0" />
                        <p className="text-sm font-medium">
                            Warning: Deleting this scale may affect existing examination results.
                        </p>
                    </div>

                    <p className="text-gray-600 dark:text-gray-400 px-1">
                        Are you sure you want to delete <span className="font-bold text-gray-900 dark:text-white">"{deletingScale?.name}"</span>?
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
                            Yes, Delete Scale
                        </button>
                    </div>
                </div>
            </Modal>
        </div>
    );
};

export default GradingSystemPage;
