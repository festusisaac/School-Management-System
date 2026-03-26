import React, { useState, useEffect } from 'react';
import { 
    Video, 
    Plus, 
    Search, 
    Calendar as CalendarIcon, 
    Clock, 
    ExternalLink, 
    Edit2, 
    Trash2,
    CheckCircle2,
    XCircle,
    Play
} from 'lucide-react';
import { format, isAfter, isBefore } from 'date-fns';
import { useAuthStore } from '@stores/authStore';
import { toast as hotToast } from 'react-hot-toast';
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

export default function OnlineClassesPage() {
    const { user } = useAuthStore();
    const toast = useToast();
    const [classes, setClasses] = useState<OnlineClass[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingClass, setEditingClass] = useState<OnlineClass | null>(null);
    
    // Check if user is staff (Admin/Teacher)
    const userRole = (user?.role || user?.roleObject?.name || 'student').toLowerCase();
    const isStaff = ['admin', 'teacher', 'super admin'].includes(userRole);

    useEffect(() => {
        fetchClasses();
    }, []);

    const fetchClasses = async () => {
        try {
            setLoading(true);
            const response = await api.get('/online-classes');
            // api service automatically unwraps 'data' envelope
            if (Array.isArray(response)) {
                setClasses(response);
            } else if (response && typeof response === 'object' && Array.isArray((response as any).data)) {
                setClasses((response as any).data);
            } else {
                console.error('Expected array from /online-classes, got:', response);
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

    const handleCancel = async (id: string) => {
        if (!window.confirm('Are you sure you want to cancel this class?')) return;
        try {
            await api.patch(`/online-classes/${id}`, { status: OnlineClassStatus.CANCELLED });
            toast.showSuccess('Class cancelled');
            fetchClasses();
        } catch (error) {
            toast.showError('Failed to cancel class');
        }
    };

    const getStatusBadge = (status: OnlineClassStatus, start: string, end: string) => {
        const now = new Date();
        const startTime = new Date(start);
        const endTime = new Date(end);

        if (status === OnlineClassStatus.CANCELLED) {
            return <span className="px-2 py-1 text-xs font-medium bg-red-100 text-red-700 rounded-full flex items-center gap-1"><XCircle className="w-3 h-3" /> Cancelled</span>;
        }

        if (isBefore(now, startTime)) {
            return <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-700 rounded-full flex items-center gap-1"><CalendarIcon className="w-3 h-3" /> Upcoming</span>;
        }

        if (isAfter(now, startTime) && isBefore(now, endTime)) {
            return <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-700 rounded-full flex items-center gap-1 animate-pulse"><Play className="w-3 h-3" /> In Progress</span>;
        }

        return <span className="px-2 py-1 text-xs font-medium bg-gray-100 text-gray-700 rounded-full flex items-center gap-1"><CheckCircle2 className="w-3 h-3" /> Completed</span>;
    };

    const filteredClasses = Array.isArray(classes) ? classes.filter(c => 
        c.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.subject?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.class?.name?.toLowerCase().includes(searchTerm.toLowerCase())
    ) : [];

    return (
        <div className="p-6 space-y-6 max-w-7xl mx-auto">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                        <Video className="w-8 h-8 text-primary-600" />
                        Online Classes
                    </h1>
                    <p className="text-gray-500 mt-1">Schedule and join virtual classes via Zoom or Google Meet</p>
                </div>
                {isStaff && (
                    <button 
                        onClick={() => { setEditingClass(null); setIsModalOpen(true); }}
                        className="flex items-center gap-2 bg-primary-600 hover:bg-primary-700 text-white px-4 py-2.5 rounded-xl font-semibold shadow-sm transition-all duration-200"
                    >
                        <Plus className="w-5 h-5" />
                        Schedule Class
                    </button>
                )}
            </div>

            {/* Filters & Search */}
            <div className="flex flex-col md:flex-row gap-4 bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input 
                        type="text" 
                        placeholder="Search by title, subject or class..." 
                        className="w-full pl-10 pr-4 py-2 rounded-xl border border-gray-200 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-all"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            {/* Grid */}
            {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {[1, 2, 3].map(i => (
                        <div key={i} className="h-64 bg-gray-50 animate-pulse rounded-2xl border border-gray-100"></div>
                    ))}
                </div>
            ) : filteredClasses.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredClasses.map((item) => (
                        <div key={item.id} className="group bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-xl hover:border-primary-100 transition-all duration-300 relative overflow-hidden">
                            {/* Platform Badge Overlay */}
                            <div className="absolute top-0 right-0 p-3">
                                {item.platform === OnlineClassPlatform.ZOOM ? (
                                    <div className="bg-blue-600 text-white px-3 py-1 rounded-bl-xl font-bold text-[10px] shadow-sm">ZOOM</div>
                                ) : (
                                    <div className="bg-green-600 text-white px-3 py-1 rounded-bl-xl font-bold text-[10px] shadow-sm">GOOGLE MEET</div>
                                )}
                            </div>

                            <div className="p-5">
                                <div className="space-y-1 mb-4">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            {getStatusBadge(item.status, item.startTime, item.endTime)}
                                        </div>
                                        {isStaff && (
                                            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button onClick={() => handleEdit(item)} className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-400 hover:text-primary-600 transition-colors" title="Edit">
                                                    <Edit2 className="w-4 h-4" />
                                                </button>
                                                <button onClick={() => handleCancel(item.id)} className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-400 hover:text-orange-600 transition-colors" title="Cancel Class">
                                                    <XCircle className="w-4 h-4" />
                                                </button>
                                                <button onClick={() => handleDelete(item.id)} className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-400 hover:text-red-600 transition-colors" title="Delete">
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                    <h3 className="text-lg font-bold text-gray-900 group-hover:text-primary-600 transition-colors line-clamp-1">{item.title}</h3>
                                    <div className="flex items-center gap-2 text-sm text-gray-500 font-medium">
                                        <span className="bg-gray-100 px-2 py-0.5 rounded-md">{item.class?.name || 'No Class'}</span>
                                        <span>•</span>
                                        <span className="text-primary-600">{item.subject?.name || 'No Subject'}</span>
                                    </div>
                                </div>

                                <div className="space-y-3 pt-4 border-t border-gray-50 text-sm">
                                    <div className="flex items-center gap-3 text-gray-600">
                                        <div className="w-8 h-8 rounded-lg bg-primary-50 flex items-center justify-center text-primary-600">
                                            <CalendarIcon className="w-4 h-4" />
                                        </div>
                                        <span>{format(new Date(item.startTime), 'EEEE, MMM d')}</span>
                                    </div>
                                    <div className="flex items-center gap-3 text-gray-600">
                                        <div className="w-8 h-8 rounded-lg bg-orange-50 flex items-center justify-center text-orange-600">
                                            <Clock className="w-4 h-4" />
                                        </div>
                                        <span>{format(new Date(item.startTime), 'hh:mm a')} - {format(new Date(item.endTime), 'hh:mm a')}</span>
                                    </div>
                                    <div className="flex items-center gap-3 text-gray-600">
                                        <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-700 text-[10px] font-bold uppercase">
                                            {item.teacher?.firstName?.charAt(0)}{item.teacher?.lastName?.charAt(0)}
                                        </div>
                                        <span>{item.teacher?.firstName || 'Unknown'} {item.teacher?.lastName || 'Teacher'}</span>
                                    </div>
                                </div>

                                <div className="mt-6 flex gap-2">
                                    <a 
                                        href={item.meetingUrl} 
                                        target="_blank" 
                                        rel="noopener noreferrer"
                                        className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl font-bold transition-all shadow-md active:scale-95 ${item.status === OnlineClassStatus.CANCELLED ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-gray-900 hover:bg-black text-white'}`}
                                        onClick={(e) => item.status === OnlineClassStatus.CANCELLED && e.preventDefault()}
                                    >
                                        <ExternalLink className="w-4 h-4" />
                                        {item.status === OnlineClassStatus.CANCELLED ? 'Cancelled' : 'Join Meeting'}
                                    </a>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="bg-white rounded-3xl p-12 text-center border border-dashed border-gray-200">
                    <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Video className="w-10 h-10 text-gray-300" />
                    </div>
                    <h3 className="text-xl font-bold text-gray-900">No online classes found</h3>
                    <p className="text-gray-500 mt-2 max-w-sm mx-auto">
                        {searchTerm ? 'No results match your search criteria.' : 'There are no online classes scheduled at the moment.'}
                    </p>
                </div>
            )}

            <ScheduleClassModal 
                isOpen={isModalOpen}
                onClose={() => { setIsModalOpen(false); setEditingClass(null); }}
                onSuccess={fetchClasses}
                initialData={editingClass}
            />
        </div>
    );
}
