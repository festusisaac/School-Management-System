import { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Layers } from 'lucide-react';
import api from '../../services/api';
import { useToast } from '../../context/ToastContext';
import { DataTable } from '../../components/ui/data-table';
import { ColumnDef } from '@tanstack/react-table';

interface SchoolSection {
    id: string;
    name: string;
    code?: string;
    description?: string;
    isActive: boolean;
    classes?: any[];
}

const SchoolSectionsPage = () => {
    const [sections, setSections] = useState<SchoolSection[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingSection, setEditingSection] = useState<SchoolSection | null>(null);
    const [formData, setFormData] = useState({ name: '', code: '', description: '', isActive: true });
    const [submitting, setSubmitting] = useState(false);
    const toast = useToast();

    useEffect(() => {
        fetchSections();
    }, []);

    const fetchSections = async () => {
        try {
            setLoading(true);
            const data = await api.getSchoolSections();
            setSections(data);
        } catch (err: any) {
            toast.showError(err.response?.data?.message || 'Failed to fetch sections');
        } finally {
            setLoading(false);
        }
    };

    const handleOpenModal = (section?: SchoolSection) => {
        if (section) {
            setEditingSection(section);
            setFormData({
                name: section.name,
                code: section.code || '',
                description: section.description || '',
                isActive: section.isActive
            });
        } else {
            setEditingSection(null);
            setFormData({ name: '', code: '', description: '', isActive: true });
        }
        setShowModal(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            setSubmitting(true);
            if (editingSection) {
                await api.updateSchoolSection(editingSection.id, formData);
                toast.showSuccess('Section updated successfully');
            } else {
                await api.createSchoolSection(formData);
                toast.showSuccess('Section created successfully');
            }
            fetchSections();
            setShowModal(false);
        } catch (err: any) {
            toast.showError(err.response?.data?.message || 'Failed to save section');
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!window.confirm('Are you sure you want to delete this section?')) return;
        try {
            await api.deleteSchoolSection(id);
            toast.showSuccess('Section deleted successfully');
            fetchSections();
        } catch (err: any) {
            toast.showError(err.response?.data?.message || 'Failed to delete section. Make sure no classes are assigned to it.');
        }
    };

    const handleToggleStatus = async (id: string) => {
        try {
            await api.toggleSchoolSectionStatus(id);
            toast.showSuccess('Status updated successfully');
            fetchSections();
        } catch (err: any) {
            toast.showError(err.response?.data?.message || 'Failed to update status');
        }
    };

    const columns: ColumnDef<SchoolSection>[] = [
        {
            accessorKey: 'name',
            header: 'Section Name',
            cell: ({ row }) => (
                <div>
                    <div className="font-bold text-gray-900 dark:text-white text-base">{row.original.name}</div>
                    <div className="text-xs text-gray-400 dark:text-gray-500 font-medium line-clamp-1">{row.original.description || 'No description'}</div>
                </div>
            )
        },
        {
            accessorKey: 'code',
            header: 'Code',
            cell: ({ row }) => (
                <span className="px-2.5 py-1 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 rounded text-xs font-black uppercase tracking-tight">
                    {row.original.code || 'N/A'}
                </span>
            )
        },
        {
            id: 'classes',
            header: 'Classes',
            accessorFn: (row) => row.classes?.length || 0,
            cell: ({ row }) => (
                <span className={`text-sm font-bold ${row.original.classes?.length ? 'text-gray-500 dark:text-gray-400' : 'text-red-400 italic'}`}>
                    {row.original.classes?.length ? `${row.original.classes.length} Classes assigned` : 'No classes'}
                </span>
            )
        },
        {
            accessorKey: 'isActive',
            header: 'Status',
            cell: ({ row }) => (
                <button
                    onClick={() => handleToggleStatus(row.original.id)}
                    className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider transition-all border ${
                        row.original.isActive
                            ? 'bg-green-50 text-green-600 border-green-100 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800'
                            : 'bg-red-50 text-red-600 border-red-100 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800'
                    }`}
                >
                    {row.original.isActive ? 'Active' : 'Inactive'}
                </button>
            )
        },
        {
            id: 'actions',
            header: () => <div className="text-right">Actions</div>,
            cell: ({ row }) => (
                <div className="flex justify-end gap-1">
                    <button
                        onClick={() => handleOpenModal(row.original)}
                        className="p-1.5 text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900/20 rounded-lg transition-all"
                    >
                        <Edit2 size={14} />
                    </button>
                    <button
                        onClick={() => handleDelete(row.original.id)}
                        className="p-1.5 text-gray-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-all"
                    >
                        <Trash2 size={14} />
                    </button>
                </div>
            )
        }
    ];

    return (
        <div className="space-y-6 animate-in fade-in duration-500 pb-20">
            {/* Unified Content Card */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm overflow-hidden transition-all">
                {/* Header Section within Card */}
                <div className="p-8 border-b border-gray-50 dark:border-gray-700 flex flex-col md:flex-row md:items-center justify-between gap-6 bg-gray-50/30 dark:bg-gray-800/50">
                    <div className="flex items-center gap-5">
                        <div className="p-3.5 bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400 rounded-2xl">
                            <Layers className="w-7 h-7" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-black text-gray-900 dark:text-white leading-tight">School Sections</h1>
                            <p className="text-base text-gray-500 dark:text-gray-400 font-medium mt-0.5">Manage major divisions like Nursery, Primary, and Secondary</p>
                        </div>
                    </div>
                    <button
                        onClick={() => handleOpenModal()}
                        className="flex items-center justify-center gap-2.5 px-6 py-3 bg-primary-600 text-white rounded-xl text-base font-bold hover:bg-primary-700 transition-all shadow-md shadow-primary-500/20 active:scale-95 whitespace-nowrap"
                    >
                        <Plus className="w-5 h-5" />
                        <span>Add Section</span>
                    </button>
                </div>

                {/* Table Section */}
                <div className="p-0">
                    <DataTable 
                        columns={columns} 
                        data={sections} 
                        loading={loading}
                        searchKey="name"
                        placeholder="Search by section name or code..."
                    />
                </div>
            </div>

            {/* Modal */}
            {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="fixed inset-0 bg-gray-900/40 dark:bg-black/60 backdrop-blur-[2px]" onClick={() => setShowModal(false)}></div>
                    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-md relative overflow-hidden border border-gray-100 dark:border-gray-700 animate-in fade-in zoom-in duration-200">
                        <div className="p-5 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center">
                            <h2 className="text-base font-bold text-gray-900 dark:text-white">
                                {editingSection ? 'Update Section' : 'Create New Section'}
                            </h2>
                        </div>
                        <form onSubmit={handleSubmit} className="p-6 space-y-5">
                            <div>
                                <label className="block text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-1.5 ml-1">Section Name *</label>
                                <input
                                    type="text"
                                    required
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg px-4 py-2.5 text-sm font-medium text-gray-700 dark:text-gray-300 focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 outline-none transition-all placeholder:text-gray-400"
                                    placeholder="e.g., Primary Section"
                                />
                            </div>
                            <div>
                                <label className="block text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-1.5 ml-1">Section Code</label>
                                <input
                                    type="text"
                                    value={formData.code}
                                    onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                                    className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg px-4 py-2.5 text-sm font-medium text-gray-700 dark:text-gray-300 focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 outline-none transition-all placeholder:text-gray-400"
                                    placeholder="e.g., PRI"
                                />
                            </div>
                            <div>
                                <label className="block text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-1.5 ml-1">Description</label>
                                <textarea
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg px-4 py-2.5 text-sm font-medium text-gray-700 dark:text-gray-300 focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 outline-none transition-all placeholder:text-gray-400 min-h-[100px] resize-none"
                                    placeholder="Brief description of the section..."
                                />
                            </div>
                            <div className="flex gap-3 pt-2">
                                <button
                                    type="button"
                                    onClick={() => setShowModal(false)}
                                    className="flex-1 px-4 py-2.5 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg text-sm font-bold hover:bg-gray-200 dark:hover:bg-gray-600 transition-all active:scale-95"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={submitting}
                                    className="flex-1 px-4 py-2.5 bg-primary-600 text-white rounded-lg text-sm font-bold shadow-sm hover:bg-primary-700 transition-all active:scale-95 disabled:opacity-50"
                                >
                                    {submitting ? 'Saving...' : editingSection ? 'Update Section' : 'Save Section'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default SchoolSectionsPage;
