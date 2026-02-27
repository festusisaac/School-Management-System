import { useState, useEffect } from 'react';
import { DataTable } from '../../components/ui/data-table';
import { ColumnDef } from '@tanstack/react-table';
import { Trash2, Plus } from 'lucide-react';
import { Modal } from '../../components/ui/modal';
import api from '../../services/api';
import { useToast } from '../../context/ToastContext';

type House = {
    id: string;
    houseName: string;
    description: string;
};

export default function StudentHouses() {
    const [data, setData] = useState<House[]>([]);
    const [loading, setLoading] = useState(true);
    const toast = useToast();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [formData, setFormData] = useState({ houseName: '', description: '' });
    const [saving, setSaving] = useState(false);

    const fetchHouses = async () => {
        setLoading(true);
        try {
            const result = await api.getStudentHouses();
            setData(result);
        } catch (error) {
            console.error("Failed to fetch houses", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchHouses();
    }, []);

    const handleCreate = async () => {
        if (!formData.houseName.trim()) return;

        setSaving(true);
        try {
            await api.createStudentHouse(formData);
            toast.showSuccess('House created successfully');
            setFormData({ houseName: '', description: '' });
            setIsModalOpen(false);
            fetchHouses();
        } catch (error: any) {
            console.error("Failed to create house", error);
            toast.showError("Failed to create house: " + (error.response?.data?.message || error.message));
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this house?')) return;

        try {
            await api.deleteStudentHouse(id);
            toast.showSuccess('House deleted successfully');
            fetchHouses();
        } catch (error) {
            console.error("Failed to delete house", error);
            toast.showError("Failed to delete house");
        }
    };

    const columns: ColumnDef<House>[] = [
        {
            accessorKey: 'houseName',
            header: 'House Name',
            cell: ({ row }) => <div className="font-medium">{row.original.houseName}</div>
        },
        {
            accessorKey: 'description',
            header: 'Description',
            cell: ({ row }) => <div className="text-gray-500">{row.original.description || '-'}</div>
        },
        {
            id: 'actions',
            header: () => <div className="text-right">Action</div>,
            cell: ({ row }) => (
                <div className="flex items-center justify-end gap-2">
                    <button onClick={() => handleDelete(row.original.id)} className="p-1.5 rounded-lg bg-red-50 text-red-600 hover:bg-red-100"><Trash2 className="w-4 h-4" /></button>
                </div>
            )
        }
    ];

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Student Houses</h1>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Manage student houses</p>
                </div>
                <button onClick={() => setIsModalOpen(true)} className="btn btn-primary bg-blue-600 text-white px-4 py-2 rounded-xl flex items-center gap-2">
                    <Plus className="w-4 h-4" /> Add House
                </button>
            </div>

            {loading && data.length === 0 ? (
                <div className="flex justify-center py-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                </div>
            ) : (
                <DataTable columns={columns} data={data} searchKey="houseName" />
            )}

            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Add Student House">
                <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); handleCreate(); }}>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">House Name</label>
                        <input
                            type="text"
                            value={formData.houseName}
                            onChange={(e) => setFormData(prev => ({ ...prev, houseName: e.target.value }))}
                            className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-800/50 dark:bg-gray-800"
                            placeholder="Enter house name"
                            autoFocus
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Description</label>
                        <textarea
                            value={formData.description}
                            onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                            className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-800/50 dark:bg-gray-800"
                            placeholder="Enter description"
                            rows={3}
                        />
                    </div>
                    <div className="flex justify-end gap-2 pt-2">
                        <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200">Cancel</button>
                        <button
                            type="submit"
                            disabled={saving || !formData.houseName.trim()}
                            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50"
                        >
                            {saving ? 'Saving...' : 'Save'}
                        </button>
                    </div>
                </form>
            </Modal>
        </div>
    );
}
