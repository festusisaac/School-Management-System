import { useState, useEffect } from 'react';
import { Plus, Search, Edit2, Trash2, ShieldCheck, ChevronRight, Hash } from 'lucide-react';
import api from '../../services/api';
import { useToast } from '../../context/ToastContext';

interface Designation {
    id: string;
    title: string;
    code: string;
    description: string;
    level: number;
    isActive: boolean;
}

const DesignationsPage = () => {
    const [designations, setDesignations] = useState<Designation[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [editingDesig, setEditingDesig] = useState<Designation | null>(null);
    const [formData, setFormData] = useState({
        title: '',
        code: '',
        description: '',
        level: 1,
        isActive: true
    });
    const toast = useToast();

    useEffect(() => {
        fetchDesignations();
    }, []);

    const fetchDesignations = async () => {
        try {
            setLoading(true);
            const data = await api.getDesignations();
            setDesignations(data);
        } catch (error) {
            console.error('Failed to fetch designations:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleEdit = (desig: Designation) => {
        setEditingDesig(desig);
        setFormData({
            title: desig.title,
            code: desig.code,
            description: desig.description,
            level: desig.level,
            isActive: desig.isActive
        });
        setShowModal(true);
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this designation?')) return;
        try {
            await api.deleteDesignation(id);
            toast.showSuccess('Designation deleted successfully!');
            fetchDesignations();
        } catch (error) {
            console.error('Failed to delete designation:', error);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            if (editingDesig) {
                await api.updateDesignation(editingDesig.id, formData);
                toast.showSuccess('Designation updated successfully!');
            } else {
                await api.createDesignation(formData);
                toast.showSuccess('Designation created successfully!');
            }
            setShowModal(false);
            setEditingDesig(null);
            setFormData({ title: '', code: '', description: '', level: 1, isActive: true });
            fetchDesignations();
        } catch (error: any) {
            console.error('Failed to save designation:', error);
            const message = error.response?.data?.message || 'Failed to save designation';
            toast.showError(Array.isArray(message) ? message.join(', ') : message);
        }
    };

    const filteredDesignations = designations.filter(desig =>
        desig.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        desig.code.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="p-6 min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-300">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Designations</h1>
                    <p className="text-gray-600 dark:text-gray-400">Define staff roles and hierarchy levels</p>
                </div>
                <button
                    onClick={() => {
                        setEditingDesig(null);
                        setFormData({ title: '', code: '', description: '', level: 1, isActive: true });
                        setShowModal(true);
                    }}
                    className="flex items-center gap-2 bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 transition"
                >
                    <Plus size={20} />
                    Add Designation
                </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
                <div className="lg:col-span-2 space-y-4">
                    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
                        <div className="p-4 border-b border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/50">
                            <div className="relative max-w-sm">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500" size={18} />
                                <input
                                    type="text"
                                    placeholder="Search designations..."
                                    className="w-full pl-10 pr-4 py-2 border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500/20 shadow-sm"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                            </div>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead className="bg-gray-50 dark:bg-gray-800/50 text-gray-500 dark:text-gray-400 text-xs font-bold uppercase tracking-widest">
                                    <tr>
                                        <th className="px-6 py-4 border-b dark:border-gray-700">Title</th>
                                        <th className="px-6 py-4 border-b dark:border-gray-700">Level</th>
                                        <th className="px-6 py-4 border-b dark:border-gray-700">Status</th>
                                        <th className="px-6 py-4 border-b dark:border-gray-700 text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                                    {loading ? (
                                        <tr>
                                            <td colSpan={4} className="px-6 py-8 text-center text-gray-400">Loading...</td>
                                        </tr>
                                    ) : filteredDesignations.length === 0 ? (
                                        <tr>
                                            <td colSpan={4} className="px-6 py-8 text-center text-gray-400 font-medium">No designations added yet</td>
                                        </tr>
                                    ) : (
                                        filteredDesignations
                                            .sort((a, b) => a.level - b.level)
                                            .map((desig) => (
                                                <tr key={desig.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-700/50 transition-colors duration-150">
                                                    <td className="px-6 py-4">
                                                        <div className="flex items-center gap-3">
                                                            <div className="p-2 bg-primary-50 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 rounded-lg">
                                                                <ShieldCheck size={18} />
                                                            </div>
                                                            <div>
                                                                <div className="font-bold text-gray-900 dark:text-white">{desig.title}</div>
                                                                <div className="text-xs text-gray-500 dark:text-gray-400 font-mono">{desig.code}</div>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <div className="flex items-center gap-1.5 px-2 py-1 bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 rounded text-xs font-bold w-fit border border-amber-100 dark:border-amber-800">
                                                            <Hash size={12} />
                                                            Level {desig.level}
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase tracking-widest ${desig.isActive ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400' : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'
                                                            }`}>
                                                            {desig.isActive ? 'Active' : 'Inactive'}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4 text-right">
                                                        <div className="flex justify-end gap-1">
                                                            <button
                                                                onClick={() => handleEdit(desig)}
                                                                className="p-1.5 text-gray-400 dark:text-gray-500 hover:text-primary-600 dark:hover:text-primary-500 hover:bg-primary-50 dark:hover:bg-primary-900/30 rounded transition-colors"
                                                            >
                                                                <Edit2 size={16} />
                                                            </button>
                                                            <button
                                                                onClick={() => handleDelete(desig.id)}
                                                                className="p-1.5 text-gray-400 dark:text-gray-500 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 rounded transition-colors"
                                                            >
                                                                <Trash2 size={16} />
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

                <div className="space-y-4">
                    <div className="bg-gradient-to-br from-primary-600 to-primary-700 rounded-2xl p-6 text-white shadow-lg relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-4 opacity-10">
                            <ShieldCheck size={120} />
                        </div>
                        <h4 className="text-lg font-bold mb-2 relative z-10">Role Hierarchy</h4>
                        <p className="text-primary-100 text-sm mb-4 relative z-10">Levels define authority. Level 1 usually represents top management (Principal), while higher numbers designate subordinate roles.</p>
                        <div className="space-y-3 relative z-10">
                            {designations
                                .sort((a, b) => a.level - b.level)
                                .slice(0, 3)
                                .map((d, i) => (
                                    <div key={d.id} className="flex items-center gap-3 bg-white/10 p-2 rounded-lg backdrop-blur-sm border border-white/10">
                                        <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center text-[10px] font-bold">
                                            {d.level}
                                        </div>
                                        <span className="text-sm font-semibold">{d.title}</span>
                                        {i < designations.slice(0, 3).length - 1 && <ChevronRight size={14} className="ml-auto opacity-50" />}
                                    </div>
                                ))}
                            {designations.length > 3 && (
                                <div className="text-xs text-primary-200 text-center italic">... and {designations.length - 3} more</div>
                            )}
                        </div>
                    </div>

                    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-5">
                        <h4 className="font-bold text-gray-800 dark:text-white mb-4 flex items-center gap-2">
                            <div className="w-1.5 h-1.5 bg-primary-600 dark:bg-primary-500 rounded-full"></div>
                            Quick Tips
                        </h4>
                        <ul className="space-y-3 text-sm text-gray-500 dark:text-gray-400 font-medium">
                            <li className="flex gap-2"><span>•</span> Use unique codes for better indexing</li>
                            <li className="flex gap-2"><span>•</span> Level 1 is the highest authority</li>
                            <li className="flex gap-2"><span>•</span> Reordering levels will affect reports</li>
                        </ul>
                    </div>
                </div>
            </div>

            {/* Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-gray-900/60 dark:bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden transform transition-all duration-300 border dark:border-gray-700">
                        <div className="p-6 bg-gray-50/80 dark:bg-gray-800 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center">
                            <h3 className="text-lg font-extrabold text-gray-800 dark:text-white uppercase tracking-tight">{editingDesig ? 'Update Role' : 'New Designation'}</h3>
                            <div className="px-2 py-1 bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-400 rounded text-[10px] font-bold">HR/PR</div>
                        </div>
                        <form onSubmit={handleSubmit} className="p-6 space-y-5">
                            <div>
                                <label className="block text-[11px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1.5">Designation Title</label>
                                <input
                                    required
                                    type="text"
                                    className="w-full px-4 py-2.5 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-gray-900 dark:text-white rounded-xl focus:outline-none focus:border-primary-500 dark:focus:border-primary-500 focus:ring-4 focus:ring-primary-500/5 transition font-medium"
                                    value={formData.title}
                                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                    placeholder="e.g. Senior Teacher"
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-[11px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1.5">Code</label>
                                    <input
                                        required
                                        type="text"
                                        className="w-full px-4 py-2.5 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-gray-900 dark:text-white rounded-xl focus:outline-none focus:border-primary-500 dark:focus:border-primary-500 transition font-mono uppercase text-sm"
                                        value={formData.code}
                                        onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                                        placeholder="ST-01"
                                    />
                                </div>
                                <div>
                                    <label className="block text-[11px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1.5">Hierarchy Level</label>
                                    <input
                                        required
                                        type="number"
                                        min="1"
                                        className="w-full px-4 py-2.5 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-gray-900 dark:text-white rounded-xl focus:outline-none focus:border-primary-500 dark:focus:border-primary-500 transition font-bold"
                                        value={formData.level}
                                        onChange={(e) => setFormData({ ...formData, level: parseInt(e.target.value) })}
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-[11px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1.5">Description (Optional)</label>
                                <textarea
                                    className="w-full px-4 py-2.5 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-gray-900 dark:text-white rounded-xl focus:outline-none focus:border-primary-500 dark:focus:border-primary-500 transition h-20 text-sm"
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                />
                            </div>
                            <div className="flex items-center gap-3 bg-gray-50 dark:bg-gray-700/50 p-3 rounded-xl border border-gray-100 dark:border-gray-600">
                                <input
                                    type="checkbox"
                                    id="isDesigActive"
                                    className="w-5 h-5 text-primary-600 rounded-lg cursor-pointer accent-primary-600"
                                    checked={formData.isActive}
                                    onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                                />
                                <label htmlFor="isDesigActive" className="text-sm font-bold text-gray-700 dark:text-gray-200 cursor-pointer">Active Position</label>
                            </div>
                            <div className="flex gap-3 pt-4">
                                <button
                                    type="button"
                                    onClick={() => setShowModal(false)}
                                    className="flex-1 px-4 py-3 text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl transition font-bold text-sm"
                                >
                                    BACK
                                </button>
                                <button
                                    type="submit"
                                    className="flex-[2] bg-primary-600 text-white rounded-xl shadow-lg shadow-primary-500/30 font-extrabold text-sm tracking-wide"
                                >
                                    {editingDesig ? 'SAVE CHANGES' : 'CREATE ROLE'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default DesignationsPage;
