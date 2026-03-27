import { useState, useEffect } from 'react';
import { 
    Video, 
    Plus, 
    Search, 
    Clock, 
    Play, 
    Edit2, 
    Trash2
} from 'lucide-react';
import { format, isAfter, isBefore } from 'date-fns';
import { useAuthStore } from '@stores/authStore';
import { useToast } from '../../context/ToastContext';
import api from '../../services/api';
import ScheduleClassModal from './components/ScheduleClassModal';

export enum OnlineClassPlatform {
    ZOOM = 'ZOOM',
    GOOGLE_MEET = 'GOOGLE_MEET'
}

export enum OnlineClassStatus {
    SCHEDULED = 'SCHEDULED',
    IN_PROGRESS = 'IN_PROGRESS',
    COMPLETED = 'COMPLETED',
    CANCELLED = 'CANCELLED'
}

export interface OnlineClass {
    id: string;
    title: string;
    description?: string;
    startTime: string;
    endTime: string;
    platform: OnlineClassPlatform;
    meetingUrl: string;
    meetingId?: string;
    meetingPassword?: string;
    status: OnlineClassStatus;
    classId: string;
    subjectId: string;
    teacherId: string;
    class: { name: string };
    subject: { name: string };
    teacher: { firstName: string, lastName: string };
}

interface OnlineClassesPageProps {
    view?: 'active' | 'completed' | 'all';
}

export default function OnlineClassesPage({ view = 'active' }: OnlineClassesPageProps) {
    const { user } = useAuthStore();
    const toast = useToast();
    const [classes, setClasses] = useState<OnlineClass[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingClass, setEditingClass] = useState<OnlineClass | null>(null);
    
    // Check if user is staff (Admin/Teacher)
    const userRole = (user?.role || user?.roleObject?.name || 'student').toLowerCase();
    const isStaff = ['admin', 'teacher', 'super admin', 'super administrator'].includes(userRole) || userRole.includes('admin');

    useEffect(() => {
        fetchClasses();
    }, [view]);

    const fetchClasses = async () => {
        try {
            setLoading(true);
            // Students see everything together, staff see based on view
            const endpoint = (!isStaff || view === 'all') ? '/online-classes' : 
                            (view === 'completed' ? '/online-classes?status=COMPLETED' : '/online-classes');
            
            const response = await api.get(endpoint);
            if (Array.isArray(response)) {
                let filtered = response;
                const now = new Date();

                if (isStaff) {
                    if (view === 'active') {
                        filtered = response.filter(c => 
                            c.status !== OnlineClassStatus.CANCELLED && 
                            c.status !== OnlineClassStatus.COMPLETED &&
                            isAfter(new Date(c.endTime), now)
                        );
                    } else if (view === 'completed') {
                        filtered = response.filter(c => 
                            c.status === OnlineClassStatus.COMPLETED || 
                            isBefore(new Date(c.endTime), now)
                        );
                    }
                } else {
                    // Student view: Show everything, but maybe filter out cancelled if desired
                    filtered = response.filter(c => c.status !== OnlineClassStatus.CANCELLED);
                    // Sort: Active/Upcoming first, then by date
                    filtered.sort((a, b) => {
                        const aActive = isAfter(new Date(a.endTime), now);
                        const bActive = isAfter(new Date(b.endTime), now);
                        if (aActive && !bActive) return -1;
                        if (!aActive && bActive) return 1;
                        return new Date(b.startTime).getTime() - new Date(a.startTime).getTime();
                    });
                }
                setClasses(filtered);
            } else {
                setClasses([]);
            }
        } catch (error) {
            console.error('Error fetching online classes:', error);
            toast.showError('Failed to load online classes');
        } finally {
            setLoading(false);
        }
    };

    const handleEdit = (item: OnlineClass) => {
        setEditingClass(item);
        setIsModalOpen(true);
    };

    const handleDelete = async (id: string) => {
        if (!window.confirm('Are you sure you want to delete this class?')) return;
        try {
            await api.delete(`/online-classes/${id}`);
            toast.showSuccess('Class deleted');
            fetchClasses();
        } catch (error) {
            toast.showError('Failed to delete class');
        }
    };

    const getStatusBadge = (status: OnlineClassStatus, start: string, end: string) => {
        const now = new Date();
        const startTime = new Date(start);
        const endTime = new Date(end);

        if (status === OnlineClassStatus.CANCELLED) {
            return <span className="px-2 py-0.5 text-[10px] font-bold bg-red-50 text-red-600 rounded-lg flex items-center gap-1 uppercase tracking-wider border border-red-100">Cancelled</span>;
        }

        if (isBefore(now, startTime)) {
            return <span className="px-2 py-0.5 text-[10px] font-bold bg-blue-50 text-blue-600 rounded-lg flex items-center gap-1 uppercase tracking-wider border border-blue-100">Upcoming</span>;
        }

        if (isAfter(now, startTime) && isBefore(now, endTime)) {
            return <span className="px-2 py-0.5 text-[10px] font-bold bg-green-50 text-green-600 rounded-lg flex items-center gap-1 uppercase tracking-wider border border-green-100 animate-pulse">Live Now</span>;
        }

        return <span className="px-2 py-0.5 text-[10px] font-bold bg-gray-50 text-gray-600 rounded-lg flex items-center gap-1 uppercase tracking-wider border border-gray-100">Finished</span>;
    };

    const filteredClasses = Array.isArray(classes) ? classes.filter(c => 
        c.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.subject?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.class?.name?.toLowerCase().includes(searchTerm.toLowerCase())
    ) : [];

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                        {isStaff ? (view === 'active' ? 'Online Classes Schedule' : 'Meeting History') : 'Virtual Classrooms'}
                    </h1>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                        {isStaff 
                            ? (view === 'active' ? 'Monitor and manage upcoming virtual classrooms' : 'View records and logs of past online sessions') 
                            : 'Join your active lessons and view records of past sessions'}
                    </p>
                </div>
                {isStaff && view === 'active' && (
                    <button 
                        onClick={() => { setEditingClass(null); setIsModalOpen(true); }}
                        className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50 shadow-sm font-medium text-sm"
                    >
                        <Plus className="w-4 h-4" />
                        Schedule Class
                    </button>
                )}
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm">
                    <div className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1">Total Classes</div>
                    <div className="text-2xl font-bold text-gray-900 dark:text-white">{filteredClasses.length}</div>
                </div>
                <div className="bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm">
                    <div className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1">Live Now</div>
                    <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                        {classes.filter(c => {
                            const now = new Date();
                            return isAfter(now, new Date(c.startTime)) && isBefore(now, new Date(c.endTime)) && c.status !== OnlineClassStatus.CANCELLED;
                        }).length}
                    </div>
                </div>
                <div className="bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm">
                    <div className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1">Upcoming</div>
                    <div className="text-2xl font-bold text-primary-600 dark:text-primary-400">
                        {classes.filter(c => isBefore(new Date(), new Date(c.startTime)) && c.status !== OnlineClassStatus.CANCELLED).length}
                    </div>
                </div>
                <div className="bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm">
                    <div className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1">Finished</div>
                    <div className="text-2xl font-bold text-gray-400 dark:text-gray-500">
                        {classes.filter(c => c.status === OnlineClassStatus.COMPLETED || isAfter(new Date(), new Date(c.endTime))).length}
                    </div>
                </div>
            </div>

            {/* Filters */}
            <div className="bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm flex flex-col md:flex-row gap-4">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input 
                        type="text"
                        placeholder="Search by title, subject or class..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                </div>
            </div>

            {/* Desktop Table View */}
            <div className="hidden md:block bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm border-collapse">
                        <thead>
                            <tr className="bg-gray-50 dark:bg-gray-900/50 border-b border-gray-100 dark:border-gray-700">
                                <th className="px-6 py-4 font-semibold text-gray-700 dark:text-gray-200">Class Details</th>
                                <th className="px-6 py-4 font-semibold text-gray-700 dark:text-gray-200">Subject & Class</th>
                                <th className="px-6 py-4 font-semibold text-gray-700 dark:text-gray-200 text-center">Timing</th>
                                <th className="px-6 py-4 font-semibold text-gray-700 dark:text-gray-200 text-center">Status</th>
                                <th className="px-6 py-4 font-semibold text-gray-700 dark:text-gray-200 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                            {loading ? (
                                Array(5).fill(0).map((_, i) => (
                                    <tr key={i} className="animate-pulse">
                                        <td colSpan={5} className="px-6 py-8"><div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full"></div></td>
                                    </tr>
                                ))
                            ) : filteredClasses.length > 0 ? (
                                filteredClasses.map((item) => (
                                    <tr key={item.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-900/30 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="font-bold text-gray-900 dark:text-white">{item.title}</div>
                                            <div className="text-[10px] text-gray-500 uppercase mt-0.5 line-clamp-1">{item.description || 'No description provided'}</div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex flex-col">
                                                <span className="font-semibold text-gray-700 dark:text-gray-300">{item.class?.name || 'All Classes'}</span>
                                                <span className="text-[10px] font-bold text-primary-500 uppercase tracking-widest">{item.subject?.name || 'General'}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex flex-col items-center">
                                                <span className="font-bold text-gray-900 dark:text-white">{format(new Date(item.startTime), 'MMM dd, yyyy')}</span>
                                                <div className="flex items-center gap-1.5 text-[10px] font-semibold text-gray-500 mt-0.5">
                                                    <Clock className="w-3 h-3" />
                                                    {format(new Date(item.startTime), 'hh:mm a')} - {format(new Date(item.endTime), 'hh:mm a')}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex justify-center">
                                                {getStatusBadge(item.status, item.startTime, item.endTime)}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center justify-end gap-2">
                                                {isAfter(new Date(), new Date(item.endTime)) ? (
                                                    <span 
                                                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-100 dark:border-gray-800 text-gray-400 cursor-not-allowed font-bold text-xs bg-gray-50 dark:bg-gray-900/20"
                                                        title="Class has ended"
                                                    >
                                                        <Clock className="w-3.5 h-3.5" />
                                                        Ended
                                                    </span>
                                                ) : (
                                                    <a 
                                                        href={item.meetingUrl} 
                                                        target="_blank" 
                                                        rel="noopener noreferrer"
                                                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-900/50 hover:text-primary-600 transition-all font-bold text-xs"
                                                        title="Join Meeting"
                                                    >
                                                        <Play className="w-3.5 h-3.5 fill-current" />
                                                        Join
                                                    </a>
                                                )}
                                                {isStaff && (
                                                    <>
                                                        <button 
                                                            onClick={() => handleEdit(item)}
                                                            className="p-1.5 text-gray-400 hover:text-primary-600 transition-colors"
                                                            title="Edit"
                                                        >
                                                            <Edit2 className="w-4 h-4" />
                                                        </button>
                                                        <button 
                                                            onClick={() => handleDelete(item.id)}
                                                            className="p-1.5 text-gray-400 hover:text-red-500 transition-colors"
                                                            title="Delete"
                                                        >
                                                            <Trash2 className="w-4 h-4" />
                                                        </button>
                                                    </>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                                        <Video className="w-8 h-8 mx-auto mb-2 opacity-20" />
                                        <div className="font-medium text-sm">No classes found matching your criteria.</div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Mobile Card View */}
            <div className="md:hidden space-y-4">
                {loading ? (
                    Array(3).fill(0).map((_, i) => (
                        <div key={i} className="bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-100 dark:border-gray-700 animate-pulse">
                            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-4"></div>
                            <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
                        </div>
                    ))
                ) : filteredClasses.length > 0 ? (
                    filteredClasses.map((item) => (
                        <div key={item.id} className="bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm relative overflow-hidden group active:scale-[0.98] transition-all">
                            <div className="flex justify-between items-start mb-3">
                                <div>
                                    <div className="font-bold text-gray-900 dark:text-white line-clamp-1">{item.title}</div>
                                    <div className="text-[10px] font-bold text-primary-500 uppercase tracking-widest mt-0.5">
                                        {item.class?.name || 'All Classes'} • {item.subject?.name || 'General'}
                                    </div>
                                </div>
                                {getStatusBadge(item.status, item.startTime, item.endTime)}
                            </div>

                            <div className="flex items-center gap-4 py-3 border-y border-gray-50 dark:border-gray-700/50 mb-4">
                                <div className="flex flex-col items-center px-3 border-r border-gray-100 dark:border-gray-700">
                                    <span className="text-[10px] font-bold text-gray-400 uppercase">Date</span>
                                    <span className="text-sm font-bold text-gray-900 dark:text-white">{format(new Date(item.startTime), 'MMM dd')}</span>
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-[10px] font-bold text-gray-400 uppercase">Time</span>
                                    <span className="text-sm font-bold text-gray-700 dark:text-gray-300">
                                        {format(new Date(item.startTime), 'hh:mm a')} - {format(new Date(item.endTime), 'hh:mm a')}
                                    </span>
                                </div>
                            </div>

                            <div className="flex items-center gap-2">
                                {isAfter(new Date(), new Date(item.endTime)) ? (
                                    <button 
                                        disabled
                                        className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-gray-50 dark:bg-gray-900 text-gray-400 font-bold text-xs cursor-not-allowed"
                                    >
                                        <Clock className="w-3.5 h-3.5" />
                                        Class Ended
                                    </button>
                                ) : (
                                    <a 
                                        href={item.meetingUrl} 
                                        target="_blank" 
                                        rel="noopener noreferrer"
                                        className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-primary-600 text-white font-bold text-xs shadow-lg shadow-primary-500/20 active:bg-primary-700 transition-all font-premium"
                                    >
                                        <Play className="w-3.5 h-3.5 fill-current" />
                                        Join Meeting
                                    </a>
                                )}
                                {isStaff && (
                                    <div className="flex gap-2">
                                        <button 
                                            onClick={() => handleEdit(item)}
                                            className="p-2.5 rounded-xl bg-gray-50 dark:bg-gray-900 text-gray-500 active:bg-gray-100 dark:active:bg-gray-800"
                                        >
                                            <Edit2 className="w-4 h-4" />
                                        </button>
                                        <button 
                                            onClick={() => handleDelete(item.id)}
                                            className="p-2.5 rounded-xl bg-red-50 dark:bg-red-900/10 text-red-500 active:bg-red-100"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="bg-white dark:bg-gray-800 p-8 rounded-xl border border-gray-100 dark:border-gray-700 text-center">
                        <Video className="w-8 h-8 mx-auto mb-2 opacity-20 text-gray-400" />
                        <div className="font-medium text-sm text-gray-500">No classes found</div>
                    </div>
                )}
            </div>

            {/* Workflow Guide */}
            <div className="bg-primary-50/50 dark:bg-primary-900/5 p-4 rounded-xl border border-primary-100 dark:border-primary-900/20 flex gap-4">
                <Video className="w-5 h-5 text-primary-500 shrink-0 mt-0.5" />
                <div className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                    <p className="font-bold text-gray-900 dark:text-white mb-1">Online Classes Workflow Guide:</p>
                    <ol className="list-decimal list-inside space-y-1 ml-1 group">
                        <li>Schedule classes ahead of time for students to see in their portal.</li>
                        <li>Click <b>Join</b> to launch the meeting on the scheduled platform.</li>
                        <li>Finished classes are automatically moved to the <b>Meeting History</b>.</li>
                        <li>You can edit or cancel any upcoming class before it starts.</li>
                    </ol>
                </div>
            </div>

            {view === 'active' && (
                <ScheduleClassModal 
                    isOpen={isModalOpen}
                    onClose={() => { setIsModalOpen(false); setEditingClass(null); }}
                    onSuccess={fetchClasses}
                    initialData={editingClass}
                />
            )}
        </div>
    );
}
