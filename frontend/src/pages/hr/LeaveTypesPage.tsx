import { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, ShieldCheck, FileText, DollarSign } from 'lucide-react';
import api from '../../services/api';
import { useToast } from '../../context/ToastContext';

interface LeaveType {
    id: string;
    name: string;
    code: string;
    maxDaysPerYear: number;
    isPaid: boolean;
    requiresApproval: boolean;
    requiresDocument: boolean;
    description: string;
    isActive: boolean;
}

const LeaveTypesPage = () => {
    const [leaveTypes, setLeaveTypes] = useState<LeaveType[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingType, setEditingType] = useState<LeaveType | null>(null);
    const toast = useToast();

    useEffect(() => {
        fetchLeaveTypes();
    }, []);

    const fetchLeaveTypes = async () => {
        try {
            setLoading(true);
            const data = await api.getLeaveTypes();
            setLeaveTypes(data);
        } catch (error) {
            console.error('Error fetching leave types:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this leave type?')) return;
        try {
            await api.deleteLeaveType(id);
            toast.showSuccess('Leave type deleted successfully!');
            fetchLeaveTypes();
        } catch (error) {
            console.error('Error deleting leave type:', error);
        }
    };

    return (
        <div className="p-6 min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-300">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Leave Types</h1>
                    <p className="text-gray-600 dark:text-gray-400">Configure different types of leaves available for staff</p>
                </div>
                <button
                    onClick={() => { setEditingType(null); setShowModal(true); }}
                    className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition"
                >
                    <Plus size={20} />
                    Add Leave Type
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {loading ? (
                    <div className="col-span-full text-center py-12 text-gray-400">Loading leave types...</div>
                ) : leaveTypes.length === 0 ? (
                    <div className="col-span-full text-center py-12 text-gray-400">No leave types configured</div>
                ) : (
                    leaveTypes.map((type) => (
                        <div key={type.id} className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md transition">
                            <div className="flex justify-between items-start mb-4">
                                <div>
                                    <h3 className="text-lg font-bold text-gray-900 dark:text-white">{type.name}</h3>
                                    <p className="text-sm font-mono text-gray-500 dark:text-gray-400 uppercase">{type.code}</p>
                                </div>
                                <div className="flex gap-2">
                                    <button onClick={() => { setEditingType(type); setShowModal(true); }} className="p-2 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 rounded-lg transition-colors"><Edit2 size={18} /></button>
                                    <button onClick={() => handleDelete(type.id)} className="p-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors"><Trash2 size={18} /></button>
                                </div>
                            </div>

                            <p className="text-sm text-gray-600 dark:text-gray-400 mb-6 line-clamp-2 h-10">{type.description || 'No description provided.'}</p>

                            <div className="grid grid-cols-2 gap-4 border-t dark:border-gray-700 pt-4 mt-auto">
                                <div className="space-y-3">
                                    <div className="flex items-center gap-2 text-xs font-semibold text-gray-500 dark:text-gray-400">
                                        <Plus size={14} className="text-primary-500" />
                                        Max Days: <span className="text-gray-900 dark:text-white ml-1">{type.maxDaysPerYear}</span>
                                    </div>
                                    <div className="flex items-center gap-2 text-xs font-semibold text-gray-500 dark:text-gray-400">
                                        <DollarSign size={14} className={type.isPaid ? 'text-green-500' : 'text-red-500'} />
                                        {type.isPaid ? 'Paid Leave' : 'Unpaid Leave'}
                                    </div>
                                </div>
                                <div className="space-y-3">
                                    <div className="flex items-center gap-2 text-xs font-semibold text-gray-500 dark:text-gray-400">
                                        <ShieldCheck size={14} className={type.requiresApproval ? 'text-green-500' : 'text-gray-400 dark:text-gray-600'} />
                                        {type.requiresApproval ? 'Needs Approval' : 'Auto Approved'}
                                    </div>
                                    <div className="flex items-center gap-2 text-xs font-semibold text-gray-500 dark:text-gray-400">
                                        <FileText size={14} className={type.requiresDocument ? 'text-orange-500' : 'text-gray-400 dark:text-gray-600'} />
                                        {type.requiresDocument ? 'Docs Required' : 'No Docs Needed'}
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Modal */}
            {showModal && (
                <div className="fixed inset-0 z-50 overflow-y-auto">
                    <div className="flex items-center justify-center min-h-screen p-4">
                        <div className="fixed inset-0 bg-black/50 dark:bg-black/80 backdrop-blur-sm" onClick={() => setShowModal(false)}></div>
                        <div className="relative bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden transform transition-all border dark:border-gray-700">
                            <form key={editingType?.id || 'new'} onSubmit={async (e) => {
                                e.preventDefault();
                                const formData = new FormData(e.currentTarget);
                                const data = {
                                    name: formData.get('name'),
                                    code: formData.get('code'),
                                    maxDays: Number(formData.get('maxDays')),
                                    isPaid: !!formData.get('isPaid'),
                                    requiresApproval: !!formData.get('requiresApproval'),
                                    requiresDocument: !!formData.get('requiresDocument'),
                                    description: formData.get('description'),
                                };

                                console.log('Saving Leave Type Data:', data);
                                try {
                                    if (editingType) {
                                        await api.updateLeaveType(editingType.id, data);
                                        toast.showSuccess('Leave type updated successfully!');
                                    } else {
                                        await api.createLeaveType(data);
                                        toast.showSuccess('Leave type created successfully!');
                                    }
                                    setShowModal(false);
                                    fetchLeaveTypes();
                                } catch (error: any) {
                                    console.error('Error saving leave type:', error);
                                    const message = error.response?.data?.message || 'Failed to save leave type';
                                    toast.showError(Array.isArray(message) ? message.join(', ') : message);
                                }
                            }}>
                                <div className="p-6 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center bg-gray-50/50 dark:bg-gray-800/50">
                                    <h3 className="text-xl font-bold text-gray-900 dark:text-white">{editingType ? 'Edit Leave Type' : 'New Leave Type'}</h3>
                                    <button type="button" onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition"><Plus className="rotate-45" size={24} /></button>
                                </div>

                                <div className="p-6 space-y-4">
                                    <div>
                                        <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-1">Type Name *</label>
                                        <input name="name" defaultValue={editingType?.name} required className="w-full bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white rounded-lg p-2.5 outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition shadow-sm" placeholder="e.g. Sick Leave" />
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-1">Short Code *</label>
                                            <input name="code" defaultValue={editingType?.code} required className="w-full bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white rounded-lg p-2.5 outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition shadow-sm" placeholder="e.g. SL" />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-1">Max Days *</label>
                                            <input name="maxDays" type="number" defaultValue={editingType?.maxDaysPerYear} required className="w-full bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white rounded-lg p-2.5 outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition shadow-sm" placeholder="e.g. 15" />
                                        </div>
                                    </div>
                                    <div className="space-y-3 pt-2">
                                        <label className="flex items-center gap-3 cursor-pointer group">
                                            <input type="checkbox" name="isPaid" defaultChecked={editingType ? editingType.isPaid : true} className="w-5 h-5 rounded border-gray-300 dark:border-gray-600 text-primary-600 focus:ring-primary-500 accent-blue-600" />
                                            <span className="text-sm text-gray-700 dark:text-gray-300 font-medium group-hover:text-primary-600 dark:group-hover:text-primary-500 transition">Is Paid Leave</span>
                                        </label>
                                        <label className="flex items-center gap-3 cursor-pointer group">
                                            <input type="checkbox" name="requiresApproval" defaultChecked={editingType ? editingType.requiresApproval : true} className="w-5 h-5 rounded border-gray-300 dark:border-gray-600 text-primary-600 focus:ring-primary-500 accent-blue-600" />
                                            <span className="text-sm text-gray-700 dark:text-gray-300 font-medium group-hover:text-primary-600 dark:group-hover:text-primary-500 transition">Requires Approval</span>
                                        </label>
                                        <label className="flex items-center gap-3 cursor-pointer group">
                                            <input type="checkbox" name="requiresDocument" defaultChecked={editingType ? editingType.requiresDocument : false} className="w-5 h-5 rounded border-gray-300 dark:border-gray-600 text-primary-600 focus:ring-primary-500 accent-blue-600" />
                                            <span className="text-sm text-gray-700 dark:text-gray-300 font-medium group-hover:text-primary-600 dark:group-hover:text-primary-500 transition">Supporting Document Required</span>
                                        </label>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-1">Description</label>
                                        <textarea name="description" defaultValue={editingType?.description} rows={3} className="w-full bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white rounded-lg p-2.5 outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition resize-none shadow-sm" placeholder="Details about this leave type..."></textarea>
                                    </div>
                                </div>

                                <div className="p-6 bg-gray-50 dark:bg-gray-800/50 border-t dark:border-gray-700 flex gap-3">
                                    <button type="submit" className="flex-1 py-3 px-4 bg-primary-600 text-white font-bold rounded-xl hover:bg-primary-700 shadow-lg shadow-primary-500/25 transition-all">
                                        {editingType ? 'Update Leave Type' : 'Create Leave Type'}
                                    </button>
                                    <button type="button" onClick={() => setShowModal(false)} className="px-6 py-3 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-300 font-bold rounded-xl hover:bg-gray-50 dark:hover:bg-gray-600 transition-all">Cancel</button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )
            }
        </div >
    );
};

export default LeaveTypesPage;
