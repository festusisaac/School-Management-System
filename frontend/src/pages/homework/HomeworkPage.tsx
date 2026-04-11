import { useState, useEffect } from 'react';
import { 
    BookOpen, 
    Plus, 
    Search, 
    Calendar, 
    Download, 
    Edit2, 
    Trash2,
    FileText,
    ChevronRight,
    Filter,
    CheckCircle
} from 'lucide-react';
import { format, isBefore } from 'date-fns';
import { useAuthStore } from '@stores/authStore';
import { useToast } from '../../context/ToastContext';
import homeworkService, { Homework, HomeworkSubmission } from '../../services/homework.service';
import { getFileUrl } from '../../services/api';
import HomeworkForm from './components/HomeworkForm';
import HomeworkDetailsModal from './components/HomeworkDetailsModal';
import SubmissionModal from './components/SubmissionModal';

export default function HomeworkPage() {
    const { user, selectedChildId } = useAuthStore();
    const isParent = (user?.role || user?.roleObject?.name || '').toLowerCase() === 'parent';
    const toast = useToast();
    const [homeworkList, setHomeworkList] = useState<Homework[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isDetailsOpen, setIsDetailsOpen] = useState(false);
    const [isSubmissionOpen, setIsSubmissionOpen] = useState(false);
    const [selectedHomework, setSelectedHomework] = useState<Homework | null>(null);
    const [editingHomework, setEditingHomework] = useState<Homework | null>(null);
    
    // Check if user is staff (Admin/Teacher)
    const userRole = (user?.role || user?.roleObject?.name || 'student').toLowerCase();
    const isStaff = ['admin', 'teacher', 'super admin', 'super administrator'].includes(userRole) || userRole.includes('admin');
    const isOverdue = (dueDate: string) => isBefore(new Date(dueDate), new Date()) && format(new Date(dueDate), 'yyyy-MM-dd') !== format(new Date(), 'yyyy-MM-dd');

    useEffect(() => {
        fetchHomework();
    }, [selectedChildId]);

    const fetchHomework = async () => {
        try {
            setLoading(true);
            const params: any = {};
            if (isParent) {
                if (!selectedChildId) return;
                params.studentId = selectedChildId;
            }
            const response = await homeworkService.getHomework(params);
            setHomeworkList(response || []);
        } catch (error) {
            console.error('Error fetching homework:', error);
            toast.showError('Failed to load homework assignments');
        } finally {
            setLoading(false);
        }
    };

    const handleEdit = (item: Homework) => {
        setEditingHomework(item);
        setIsModalOpen(true);
    };

    const handleViewDetails = (item: Homework) => {
        setSelectedHomework(item);
        setIsDetailsOpen(true);
    };

    const handleOpenSubmission = (item: Homework) => {
        setSelectedHomework(item);
        setIsDetailsOpen(false);
        setIsSubmissionOpen(true);
    };

    const handleDelete = async (id: string) => {
        if (!window.confirm('Are you sure you want to delete this homework?')) return;
        try {
            await homeworkService.deleteHomework(id);
            toast.showSuccess('Homework deleted');
            fetchHomework();
        } catch (error) {
            toast.showError('Failed to delete homework');
        }
    };

    const getStatusBadge = (item: Homework) => {
        if (item.submission) {
            return <span className="px-2 py-0.5 text-[10px] font-bold bg-green-50 text-green-600 rounded-lg flex items-center gap-1 uppercase tracking-wider border border-green-100"><CheckCircle className="w-3 h-3" /> Submitted</span>;
        }

        const now = new Date();
        const due = new Date(item.dueDate);

        if (isBefore(due, now)) {
            return <span className="px-2 py-0.5 text-[10px] font-bold bg-red-50 text-red-600 rounded-lg flex items-center gap-1 uppercase tracking-wider border border-red-100">Overdue</span>;
        }

        return <span className="px-2 py-0.5 text-[10px] font-bold bg-blue-50 text-blue-600 rounded-lg flex items-center gap-1 uppercase tracking-wider border border-blue-100">Active</span>;
    };

    const filteredHomework = homeworkList.filter(h => 
        h.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        h.subject?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        h.class?.name?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                        <BookOpen className="w-6 h-6 text-primary-600" />
                        Homework Assignments
                    </h1>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                        {isStaff 
                            ? 'Create and manage assignments for your classes' 
                            : 'View and submit your homework assignments'}
                    </p>
                </div>
                {isStaff && (
                    <button 
                        onClick={() => { setEditingHomework(null); setIsModalOpen(true); }}
                        className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors shadow-sm font-medium text-sm"
                    >
                        <Plus className="w-4 h-4" />
                        Assign Homework
                    </button>
                )}
            </div>

            {/* Filters & Search */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="md:col-span-2 relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input 
                        type="text"
                        placeholder="Search by title, subject or class..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all shadow-sm"
                    />
                </div>
                <div className="flex gap-2">
                    <button className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-50 transition-colors shadow-sm">
                        <Filter className="w-4 h-4" />
                        Filter
                    </button>
                </div>
            </div>

            {/* List View */}
            <div className="grid grid-cols-1 gap-4">
                {loading ? (
                    Array(3).fill(0).map((_, i) => (
                        <div key={i} className="bg-white dark:bg-gray-800 p-6 rounded-2xl border border-gray-100 dark:border-gray-700 animate-pulse h-32"></div>
                    ))
                ) : filteredHomework.length > 0 ? (
                    filteredHomework.map((item) => (
                        <div key={item.id} className="group bg-white dark:bg-gray-800 p-5 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm hover:shadow-md transition-all duration-300 relative overflow-hidden">
                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                <div className="flex gap-4">
                                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 shadow-sm transition-colors ${
                                        item.submission ? 'bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400' : 
                                        isOverdue(item.dueDate) ? 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400' :
                                        'bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400'
                                    }`}>
                                        {item.submission ? <CheckCircle className="w-6 h-6" /> : <BookOpen className="w-6 h-6" />}
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-3 mb-1">
                                            <h3 className="font-bold text-gray-900 dark:text-white group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">{item.title}</h3>
                                            {getStatusBadge(item)}
                                        </div>
                                        <div className="flex flex-wrap items-center gap-y-1 gap-x-4 text-xs text-gray-500 dark:text-gray-400">
                                            <span className="flex items-center gap-1.5 font-bold text-primary-600 dark:text-primary-400">
                                                <BookOpen className="w-3.5 h-3.5" />
                                                {item.subject?.name} • {item.class?.name}
                                            </span>
                                            <span className="flex items-center gap-1.5">
                                                <Calendar className="w-3.5 h-3.5" />
                                                Due: {format(new Date(item.dueDate), 'MMM dd, yyyy')}
                                            </span>
                                            {isStaff && (
                                                <span className="text-gray-400 italic">Assignee: {item.teacher?.firstName} {item.teacher?.lastName}</span>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                <div className="flex items-center gap-3 ml-auto md:ml-0">
                                    {item.attachmentUrl && (
                                        <a 
                                            href={getFileUrl(item.attachmentUrl)} 
                                            target="_blank" 
                                            rel="noopener noreferrer"
                                            className="p-2 rounded-lg bg-gray-50 dark:bg-gray-900/50 text-gray-500 hover:text-primary-600 transition-colors"
                                            title="Download Attachment"
                                        >
                                            <Download className="w-5 h-5" />
                                        </a>
                                    )}
                                    {isStaff && (
                                        <>
                                            <button 
                                                onClick={() => handleEdit(item)}
                                                className="p-2 rounded-lg bg-gray-50 dark:bg-gray-900/50 text-gray-500 hover:text-blue-600 transition-colors"
                                                title="Edit"
                                            >
                                                <Edit2 className="w-5 h-5" />
                                            </button>
                                            <button 
                                                onClick={() => handleDelete(item.id)}
                                                className="p-2 rounded-lg bg-gray-50 dark:bg-gray-900/50 text-gray-500 hover:text-red-600 transition-colors"
                                                title="Delete"
                                            >
                                                <Trash2 className="w-5 h-5" />
                                            </button>
                                        </>
                                    )}
                                    <button 
                                        onClick={() => handleViewDetails(item)}
                                        className="p-2 rounded-lg bg-primary-50 dark:bg-primary-900/20 text-primary-600 hover:bg-primary-100 transition-colors ml-2"
                                        title="View Details"
                                    >
                                        <ChevronRight className="w-5 h-5" />
                                    </button>
                                </div>
                            </div>
                            
                            {/* Description preview */}
                            {item.description && (
                                <div className="mt-4 pt-4 border-t border-gray-50 dark:border-gray-700/50">
                                    <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2 leading-relaxed">
                                        {item.description}
                                    </p>
                                </div>
                            )}
                        </div>
                    ))
                ) : (
                    <div className="bg-white dark:bg-gray-800 p-12 rounded-2xl border border-gray-100 dark:border-gray-700 text-center shadow-sm">
                        <div className="w-16 h-16 bg-gray-50 dark:bg-gray-900/50 rounded-full flex items-center justify-center mx-auto mb-4">
                            <BookOpen className="w-8 h-8 text-gray-300" />
                        </div>
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1">No homework found</h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Assignments will appear here once they are posted.</p>
                        {isStaff && (
                            <button 
                                onClick={() => setIsModalOpen(true)}
                                className="mt-6 inline-flex items-center gap-2 px-6 py-2 bg-primary-600 text-white rounded-xl hover:bg-primary-700 transition-colors font-bold text-sm"
                            >
                                <Plus className="w-4 h-4" />
                                Create First Assignment
                            </button>
                        )}
                    </div>
                )}
            </div>

            {/* Guide */}
            <div className="bg-primary-50/50 dark:bg-primary-900/5 p-5 rounded-2xl border border-primary-100 dark:border-primary-900/20 flex gap-4">
                <div className="p-2 bg-primary-100 dark:bg-primary-800 rounded-lg shrink-0 h-fit">
                    <FileText className="w-5 h-5 text-primary-600 dark:text-primary-300" />
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                    <p className="font-bold text-gray-900 dark:text-white mb-1">Homework Guidelines:</p>
                    <ul className="list-disc list-inside space-y-1 ml-1 group">
                        <li>Assignments are automatically visible to all students in the selected class.</li>
                        <li>Students can download attached materials and view instructions.</li>
                        <li>Due dates are highlighted to help students prioritize their work.</li>
                        <li>Teachers can update or remove assignments at any time.</li>
                    </ul>
                </div>
            </div>

            <HomeworkForm 
                isOpen={isModalOpen}
                onClose={() => { setIsModalOpen(false); setEditingHomework(null); }}
                onSuccess={fetchHomework}
                initialData={editingHomework}
            />

            <HomeworkDetailsModal 
                isOpen={isDetailsOpen}
                onClose={() => { setIsDetailsOpen(false); setSelectedHomework(null); }}
                homework={selectedHomework}
                isStaff={isStaff}
                onStatusClick={() => selectedHomework && handleOpenSubmission(selectedHomework)}
            />

            <SubmissionModal 
                isOpen={isSubmissionOpen}
                onClose={() => { setIsSubmissionOpen(false); setSelectedHomework(null); }}
                onSuccess={fetchHomework}
                homework={selectedHomework}
            />
        </div>
    );
}
