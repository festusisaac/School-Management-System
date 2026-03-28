import { useState, useEffect } from 'react';
import { DataTable } from '../../components/ui/data-table';
import { ColumnDef } from '@tanstack/react-table';
import { Trash2, Plus } from 'lucide-react';
import { Modal } from '../../components/ui/modal';
import api from '../../services/api';
import { useToast } from '../../context/ToastContext';
import { usePermissions } from '../../hooks/usePermissions';

type DeactivateReason = {
    id: string;
    reason: string;
};

export default function DeactivateReasons() {
    const [data, setData] = useState<DeactivateReason[]>([]);
    const [loading, setLoading] = useState(true);
    const { hasPermission } = usePermissions();
    const toast = useToast();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [formData, setFormData] = useState({ reason: '' });
    const [saving, setSaving] = useState(false);

    const fetchReasons = async () => {
        setLoading(true);
        try {
            const result = await api.getDeactivateReasons();
            setData(result);
        } catch (error) {
            console.error("Failed to fetch deactivate reasons", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchReasons();
    }, []);

    const handleCreate = async () => {
        if (!formData.reason.trim()) return;

        setSaving(true);
        try {
            await api.createDeactivateReason(formData);
            toast.showSuccess('Reason created successfully');
            setFormData({ reason: '' });
            setIsModalOpen(false);
            fetchReasons();
        } catch (error: any) {
            console.error("Failed to create reason", error);
            toast.showError("Failed to create reason: " + (error.response?.data?.message || error.message));
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this reason?')) return;

        try {
            await api.deleteDeactivateReason(id);
            toast.showSuccess('Reason deleted successfully');
            fetchReasons();
        } catch (error) {
            console.error("Failed to delete reason", error);
            toast.showError("Failed to delete reason");
        }
    };

    const columns: ColumnDef<DeactivateReason>[] = [
        {
            accessorKey: 'reason',
            header: 'Reason',
            cell: ({ row }) => <div className="font-medium">{row.original.reason}</div>
        },
    ];

    if (hasPermission('students:manage_categories')) {
        columns.push({
            id: 'actions',
            header: () => <div className="text-right">Action</div>,
            cell: ({ row }) => (
                <div className="flex items-center justify-end gap-2">
                    <button onClick={() => handleDelete(row.original.id)} className="p-1.5 rounded-lg bg-red-50 text-red-600 hover:bg-red-100"><Trash2 className="w-4 h-4" /></button>
                </div>
            )
        });
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Deactivate Reasons</h1>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Manage reasons for student deactivation</p>
                </div>
                {hasPermission('students:manage_categories') && (
                    <button onClick={() => setIsModalOpen(true)} className="btn btn-primary bg-primary-600 text-white px-4 py-2 rounded-xl flex items-center gap-2">
                        <Plus className="w-4 h-4" /> Add Reason
                    </button>
                )}
            </div>

            {loading && data.length === 0 ? (
                <div className="flex justify-center py-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
                </div>
            ) : (
                <DataTable columns={columns} data={data} searchKey="reason" />
            )}

            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Add Deactivate Reason">
                <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); handleCreate(); }}>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Reason</label>
                        <input
                            type="text"
                            value={formData.reason}
                            onChange={(e) => setFormData({ reason: e.target.value })}
                            className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-gray-700"
                            placeholder="Enter reason"
                            autoFocus
                        />
                    </div>
                    <div className="flex justify-end gap-2 pt-2">
                        <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200">Cancel</button>
                        <button
                            type="submit"
                            disabled={saving || !formData.reason.trim()}
                            className="px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700 disabled:opacity-50"
                        >
                            {saving ? 'Saving...' : 'Save'}
                        </button>
                    </div>
                </form>
            </Modal>
        </div>
    );
}
