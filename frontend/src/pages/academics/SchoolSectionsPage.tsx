import { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Layers } from 'lucide-react';
import api from '../../services/api';
import { useToast } from '../../context/ToastContext';

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

    return (
        <div className="p-6 bg-gray-50 dark:bg-gray-900 min-h-screen transition-colors duration-300">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="flex justify-between items-center mb-8">
                    <div>
                        <h1 className="text-3xl font-black text-gray-900 dark:text-white flex items-center gap-3">
                            <Layers className="p-2 bg-indigo-600 text-white rounded-xl shadow-lg shadow-indigo-500/30" size={40} />
                            School Sections
                        </h1>
                        <p className="text-gray-500 dark:text-gray-400 mt-1 font-medium">
                            Manage major divisions like Nursery, Primary, and Secondary
                        </p>
                    </div>
                    <button
                        onClick={() => handleOpenModal()}
                        className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-500/25 active:scale-95"
                    >
                        <Plus className="w-5 h-5" />
                        Add Section
                    </button>
                </div>

                {/* Table Section */}
                <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-xl shadow-gray-200/50 dark:shadow-none border border-gray-100 dark:border-gray-700 overflow-hidden transition-all">
                    {loading ? (
                        <div className="p-20 text-center text-gray-400 font-bold italic">Loading sections...</div>
                    ) : sections.length === 0 ? (
                        <div className="p-20 text-center">
                            <Layers className="w-16 h-16 text-gray-200 dark:text-gray-700 mx-auto mb-4" />
                            <p className="text-gray-400 font-bold">No school sections found</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead className="bg-gray-50/50 dark:bg-gray-700/50 border-b border-gray-100 dark:border-gray-700">
                                    <tr>
                                        <th className="px-6 py-4 text-xs font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest">Section Name</th>
                                        <th className="px-6 py-4 text-xs font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest">Code</th>
                                        <th className="px-6 py-4 text-xs font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest">Classes</th>
                                        <th className="px-6 py-4 text-xs font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest">Status</th>
                                        <th className="px-6 py-4 text-xs font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                                    {sections.map((section) => (
                                        <tr key={section.id} className="hover:bg-indigo-50/30 dark:hover:bg-indigo-900/10 transition-colors group">
                                            <td className="px-6 py-4">
                                                <div className="font-bold text-gray-900 dark:text-white">{section.name}</div>
                                                <div className="text-xs text-gray-400 line-clamp-1">{section.description || 'No description'}</div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded text-xs font-black uppercase">
                                                    {section.code || 'N/A'}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex -space-x-2">
                                                    {section.classes && section.classes.length > 0 ? (
                                                        <span className="text-sm font-bold text-gray-500 dark:text-gray-400">
                                                            {section.classes.length} Classes assigned
                                                        </span>
                                                    ) : (
                                                        <span className="text-sm font-bold text-red-400/60 italic">No classes</span>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <button
                                                    onClick={() => handleToggleStatus(section.id)}
                                                    className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-tighter transition-all ${section.isActive
                                                        ? 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400'
                                                        : 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400'
                                                        }`}
                                                >
                                                    {section.isActive ? 'Active' : 'Inactive'}
                                                </button>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <div className="flex justify-end gap-2">
                                                    <button
                                                        onClick={() => handleOpenModal(section)}
                                                        className="p-2 text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-xl transition-all"
                                                    >
                                                        <Edit2 size={18} />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDelete(section.id)}
                                                        className="p-2 text-gray-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-all"
                                                    >
                                                        <Trash2 size={18} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>

                {/* Modal */}
                {showModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                        <div className="fixed inset-0 bg-gray-900/60 dark:bg-black/80 backdrop-blur-sm" onClick={() => setShowModal(false)}></div>
                        <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-2xl w-full max-w-lg relative overflow-hidden border dark:border-gray-700 animate-in fade-in zoom-in duration-200">
                            <div className="p-6 border-b dark:border-gray-700 flex justify-between items-center bg-white dark:bg-gray-800 transition-colors">
                                <h2 className="text-xl font-black text-gray-900 dark:text-white uppercase tracking-tight">
                                    {editingSection ? 'Edit Section' : 'Add New Section'}
                                </h2>
                            </div>
                            <form onSubmit={handleSubmit} className="p-8 space-y-6">
                                <div>
                                    <label className="block text-xs font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-2">Section Name *</label>
                                    <input
                                        type="text"
                                        required
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-gray-900 dark:text-white rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all font-bold"
                                        placeholder="e.g., Primary Section"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-2">Section Code</label>
                                    <input
                                        type="text"
                                        value={formData.code}
                                        onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                                        className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-gray-900 dark:text-white rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all font-bold"
                                        placeholder="e.g., PRI"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-2">Description</label>
                                    <textarea
                                        value={formData.description}
                                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                        className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-gray-900 dark:text-white rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all font-bold min-h-[100px] resize-none"
                                        placeholder="Enter section description..."
                                    />
                                </div>
                                <div className="flex gap-4 pt-4">
                                    <button
                                        type="button"
                                        onClick={() => setShowModal(false)}
                                        className="flex-1 px-6 py-3 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-xl font-black hover:bg-gray-200 dark:hover:bg-gray-600 transition-all active:scale-95"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={submitting}
                                        className="flex-1 px-6 py-3 bg-indigo-600 text-white rounded-xl font-black shadow-lg shadow-indigo-500/30 hover:bg-indigo-700 transition-all active:scale-95 disabled:opacity-50"
                                    >
                                        {submitting ? 'Saving...' : editingSection ? 'Update Section' : 'Create Section'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default SchoolSectionsPage;
