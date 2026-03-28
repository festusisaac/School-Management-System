import { useState, useEffect } from 'react';
import { DataTable } from '../../components/ui/data-table';
import { ColumnDef } from '@tanstack/react-table';
import { Trash2, Plus } from 'lucide-react';
import { Modal } from '../../components/ui/modal';
import api from '../../services/api';
import { useToast } from '../../context/ToastContext';
import { usePermissions } from '../../hooks/usePermissions';

type Category = {
    id: string;
    category: string;
};

export default function StudentCategories() {
    const [data, setData] = useState<Category[]>([]);
    const [loading, setLoading] = useState(true);
    const { hasPermission } = usePermissions();
    const toast = useToast();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [newCategoryName, setNewCategoryName] = useState('');
    const [saving, setSaving] = useState(false);

    const fetchCategories = async () => {
        setLoading(true);
        try {
            const result = await api.getStudentCategories();
            setData(result);
        } catch (error) {
            console.error("Failed to fetch categories", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchCategories();
    }, []);

    const handleCreate = async () => {
        if (!newCategoryName.trim()) return;

        setSaving(true);
        try {
            await api.createStudentCategory({ category: newCategoryName });
            toast.showSuccess('Category created successfully');
            setNewCategoryName('');
            setIsModalOpen(false);
            fetchCategories();
        } catch (error: any) {
            console.error("Failed to create category", error);
            toast.showError("Failed to create category: " + (error.response?.data?.message || error.message));
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this category?')) return;

        try {
            await api.deleteStudentCategory(id);
            toast.showSuccess('Category deleted successfully');
            fetchCategories();
        } catch (error) {
            console.error("Failed to delete category", error);
            toast.showError("Failed to delete category");
        }
    };

    const columns: ColumnDef<Category>[] = [
        {
            accessorKey: 'category',
            header: 'Category',
            cell: ({ row }) => <div className="font-medium">{row.original.category}</div>
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
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Student Categories</h1>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Manage student categories</p>
                </div>
                {hasPermission('students:manage_categories') && (
                    <div className="flex gap-2">
                        <button onClick={() => setIsModalOpen(true)} className="btn btn-primary bg-primary-600 text-white px-4 py-2 rounded-xl flex items-center gap-2">
                            <Plus className="w-4 h-4" /> Add Category
                        </button>
                    </div>
                )}
            </div>

            {loading && data.length === 0 ? (
                <div className="flex justify-center py-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
                </div>
            ) : (
                <DataTable columns={columns} data={data} searchKey="category" placeholder="Search categories..." />
            )}

            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Add Student Category">
                <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); handleCreate(); }}>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Category Name</label>
                        <input
                            type="text"
                            value={newCategoryName}
                            onChange={(e) => setNewCategoryName(e.target.value)}
                            className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-800/50 dark:bg-gray-800"
                            placeholder="Enter category name"
                            autoFocus
                        />
                    </div>
                    <div className="flex justify-end gap-2 pt-2">
                        <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200">Cancel</button>
                        <button
                            type="submit"
                            disabled={saving || !newCategoryName.trim()}
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
