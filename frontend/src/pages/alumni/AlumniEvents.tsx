import { useState, useEffect } from 'react';
import { 
    Calendar, MapPin, Plus, Edit, Trash2, Users, Search, 
    XCircle, ArrowRight, CalendarDays, Map
} from 'lucide-react';
import api from '../../services/api';
import { useToast } from '../../context/ToastContext';
import { Modal } from '../../components/ui/modal';
import { format } from 'date-fns';
import { clsx } from 'clsx';

type AlumniEvent = {
    id: string;
    title: string;
    description?: string;
    eventDate: string;
    location?: string;
    status: string;
    bannerImage?: string;
};

type Attendee = {
    id: string;
    alumni: {
        id: string;
        student: {
            firstName: string;
            lastName: string;
            admissionNo: string;
        }
    };
    status: string;
};

export default function AlumniEvents() {
    const [events, setEvents] = useState<AlumniEvent[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isAttendeeModalOpen, setIsAttendeeModalOpen] = useState(false);
    const [selectedEvent, setSelectedEvent] = useState<AlumniEvent | null>(null);
    const [editingEvent, setEditingEvent] = useState<AlumniEvent | null>(null);
    const [attendees, setAttendees] = useState<Attendee[]>([]);
    const [alumniList, setAlumniList] = useState<any[]>([]);
    const [attendeeSearch, setAttendeeSearch] = useState('');
    const toast = useToast();

    const [formData, setFormData] = useState({
        title: '',
        description: '',
        eventDate: '',
        location: '',
        status: 'upcoming',
        sendNotification: false,
        targetGraduationYear: undefined as number | undefined
    });

    useEffect(() => {
        fetchEvents();
        fetchAlumni();
    }, []);

    const fetchEvents = async () => {
        setLoading(true);
        try {
            const data = await api.getAlumniEvents();
            setEvents(data);
        } catch (error) {
            console.error("Failed to fetch events", error);
        } finally {
            setLoading(false);
        }
    };

    const fetchAlumni = async () => {
        try {
            const data = await api.getAlumni();
            setAlumniList(data);
        } catch (error) {
            console.error("Failed to fetch alumni", error);
        }
    };

    const fetchAttendees = async (eventId: string) => {
        try {
            const data = await api.getEventAttendees(eventId);
            setAttendees(data);
        } catch (error) {
            console.error("Failed to fetch attendees", error);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            if (editingEvent) {
                await api.updateAlumniEvent(editingEvent.id, formData);
                toast.showSuccess("Event updated successfully");
            } else {
                await api.createAlumniEvent(formData);
                toast.showSuccess("Event created successfully");
            }
            setIsModalOpen(false);
            setEditingEvent(null);
            setFormData({ title: '', description: '', eventDate: '', location: '', status: 'upcoming', sendNotification: false, targetGraduationYear: undefined });
            fetchEvents();
        } catch (error) {
            toast.showError("Failed to save event");
        }
    };

    const handleDelete = async (id: string) => {
        if (!window.confirm("Are you sure you want to delete this event?")) return;
        try {
            await api.deleteAlumniEvent(id);
            toast.showSuccess("Event deleted");
            fetchEvents();
        } catch (error) {
            toast.showError("Failed to delete event");
        }
    };

    const handleAddAttendee = async (alumniId: string) => {
        if (!selectedEvent) return;
        try {
            await api.registerEventAttendee(selectedEvent.id, alumniId);
            toast.showSuccess("Attendee added");
            fetchAttendees(selectedEvent.id);
        } catch (error) {
            toast.showError("Failed to add attendee");
        }
    };

    const handleRemoveAttendee = async (attendeeId: string) => {
        try {
            await api.removeEventAttendee(attendeeId);
            toast.showSuccess("Attendee removed");
            if (selectedEvent) fetchAttendees(selectedEvent.id);
        } catch (error) {
            toast.showError("Failed to remove attendee");
        }
    };

    const filteredAlumni = alumniList.filter(alumnus => {
        const fullName = `${alumnus.student?.firstName} ${alumnus.student?.lastName}`.toLowerCase();
        const search = attendeeSearch.toLowerCase();
        return (fullName.includes(search) || alumnus.student?.admissionNo.toLowerCase().includes(search)) &&
               !attendees.some(a => a.alumni.id === alumnus.id);
    }).slice(0, 5);

    const InfoCard = ({ children, className = "" }: { children: React.ReactNode, className?: string }) => (
        <div className={clsx(
            "bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden",
            className
        )}>
            {children}
        </div>
    );

    return (
        <div className="space-y-6 p-4 sm:p-6 lg:p-8 bg-gray-50/50 dark:bg-transparent min-h-screen">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Alumni Events</h1>
                    <p className="text-sm text-gray-500">Manage reunions and alumni gatherings</p>
                </div>
                <button
                    onClick={() => {
                        setEditingEvent(null);
                        setFormData({ title: '', description: '', eventDate: '', location: '', status: 'upcoming', sendNotification: false, targetGraduationYear: undefined });
                        setIsModalOpen(true);
                    }}
                    className="flex items-center gap-2 bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-lg font-medium text-sm transition-all shadow-sm"
                >
                    <Plus size={18} />
                    New Event
                </button>
            </div>

            {loading ? (
                <div className="p-20 flex justify-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {events.map((event) => (
                        <InfoCard key={event.id} className="flex flex-col group">
                            <div className="p-5 flex-1 space-y-4">
                                <div className="flex items-center justify-between">
                                    <span className={clsx(
                                        "px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider",
                                        event.status === 'upcoming' ? "bg-green-50 text-green-700 border border-green-100" : "bg-gray-50 text-gray-500 border border-gray-100"
                                    )}>
                                        {event.status}
                                    </span>
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => {
                                                setEditingEvent(event);
                                                setFormData({
                                                    title: event.title,
                                                    description: event.description || '',
                                                    eventDate: event.eventDate.split('T')[0],
                                                    location: event.location || '',
                                                    status: event.status,
                                                    sendNotification: false,
                                                    targetGraduationYear: (event as any).targetGraduationYear
                                                });
                                                setIsModalOpen(true);
                                            }}
                                            className="p-1.5 text-gray-400 hover:text-primary-600 hover:bg-primary-50 rounded-md transition-all"
                                        >
                                            <Edit size={14} />
                                        </button>
                                        <button
                                            onClick={() => handleDelete(event.id)}
                                            className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-all"
                                        >
                                            <Trash2 size={14} />
                                        </button>
                                    </div>
                                </div>

                                <div>
                                    <h3 className="text-lg font-bold text-gray-900 dark:text-white group-hover:text-primary-600 transition-colors line-clamp-1">
                                        {event.title}
                                    </h3>
                                    <p className="text-xs text-gray-500 mt-1 line-clamp-2 leading-relaxed">
                                        {event.description}
                                    </p>
                                </div>

                                <div className="space-y-2 pt-2">
                                    <div className="flex items-center gap-2 text-xs font-medium text-gray-600 dark:text-gray-400">
                                        <CalendarDays size={14} className="text-gray-400" />
                                        {format(new Date(event.eventDate), 'PPP')}
                                    </div>
                                    <div className="flex items-center gap-2 text-xs font-medium text-gray-600 dark:text-gray-400">
                                        <Map size={14} className="text-gray-400" />
                                        {event.location || 'Main Campus'}
                                    </div>
                                </div>
                            </div>

                            <button
                                onClick={() => {
                                    setSelectedEvent(event);
                                    fetchAttendees(event.id);
                                    setIsAttendeeModalOpen(true);
                                }}
                                className="w-full py-3 bg-gray-50 dark:bg-gray-800/50 border-t border-gray-100 dark:border-gray-700 text-xs font-bold text-gray-600 dark:text-gray-300 hover:bg-primary-600 hover:text-white transition-all flex items-center justify-center gap-2"
                            >
                                <Users size={14} />
                                Attendance Records
                                <ArrowRight size={14} />
                            </button>
                        </InfoCard>
                    ))}
                </div>
            )}

            {/* Standard Modal for Create/Edit */}
            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingEvent ? "Edit Event" : "Create Event"}>
                <form onSubmit={handleSubmit} className="space-y-5 p-1">
                    <InputField label="Event Title" required value={formData.title} onChange={(v: string) => setFormData({...formData, title: v})} />
                    <div className="space-y-1.5">
                        <label className="text-xs font-bold text-gray-500 uppercase tracking-tight">Description</label>
                        <textarea
                            rows={3}
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            className="w-full px-4 py-2.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 focus:ring-2 focus:ring-primary-500 outline-none transition-all text-sm"
                            placeholder="Event details..."
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <InputField label="Event Date" type="date" required value={formData.eventDate} onChange={(v: string) => setFormData({...formData, eventDate: v})} />
                        <div className="space-y-1.5">
                            <label className="text-xs font-bold text-gray-500 uppercase tracking-tight">Status</label>
                            <select
                                value={formData.status}
                                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                                className="w-full px-4 py-2.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 focus:ring-2 focus:ring-primary-500 outline-none transition-all text-sm appearance-none"
                            >
                                <option value="upcoming">Upcoming</option>
                                <option value="past">Past</option>
                                <option value="cancelled">Cancelled</option>
                            </select>
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <InputField label="Location" icon={MapPin} value={formData.location} onChange={(v: string) => setFormData({...formData, location: v})} />
                        <div className="space-y-1.5">
                            <label className="text-xs font-bold text-gray-500 uppercase tracking-tight">Target Cohort</label>
                            <select
                                value={formData.targetGraduationYear || ''}
                                onChange={(e) => setFormData({ ...formData, targetGraduationYear: e.target.value ? parseInt(e.target.value) : undefined })}
                                className="w-full px-4 py-2.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 focus:ring-2 focus:ring-primary-500 outline-none transition-all text-sm appearance-none"
                            >
                                <option value="">All Graduation Years</option>
                                {Array.from({ length: 30 }, (_, i) => new Date().getFullYear() - i).map(year => (
                                    <option key={year} value={year}>{year} Graduates</option>
                                ))}
                            </select>
                        </div>
                    </div>
                    
                    <div className="flex items-center gap-3 p-4 rounded-xl border border-blue-50 dark:border-blue-900/30 bg-blue-50/30 dark:bg-blue-900/10">
                        <input
                            type="checkbox"
                            id="sendNotification"
                            checked={formData.sendNotification}
                            onChange={(e) => setFormData({ ...formData, sendNotification: e.target.checked })}
                            className="w-4 h-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                        />
                        <label htmlFor="sendNotification" className="flex-1 cursor-pointer">
                            <span className="text-sm font-bold text-gray-900 dark:text-white">Send email notification to all alumni</span>
                            <p className="text-[10px] text-gray-500">This will immediately queue emails to everyone in the directory.</p>
                        </label>
                    </div>

                    <div className="pt-4 flex justify-end gap-3">
                        <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-sm font-bold text-gray-500 hover:text-gray-800 transition-all">Cancel</button>
                        <button type="submit" className="px-6 py-2 bg-primary-600 text-white font-bold rounded-lg hover:bg-primary-700 transition-all text-sm shadow-sm">
                            {editingEvent ? "Save Changes" : "Create Event"}
                        </button>
                    </div>
                </form>
            </Modal>

            {/* Attendance Modal */}
            <Modal isOpen={isAttendeeModalOpen} onClose={() => setIsAttendeeModalOpen(false)} title="Event Attendance" size="md">
                <div className="space-y-6 p-1">
                    <div className="space-y-2">
                        <label className="text-xs font-bold text-gray-500 uppercase tracking-tight">Register Attendee</label>
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Search by name or ID..."
                                value={attendeeSearch}
                                onChange={(e) => setAttendeeSearch(e.target.value)}
                                className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 focus:ring-2 focus:ring-primary-500 outline-none transition-all text-sm"
                            />
                            {attendeeSearch && filteredAlumni.length > 0 && (
                                <div className="absolute z-50 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-xl overflow-hidden">
                                    {filteredAlumni.map(alumnus => (
                                        <button
                                            key={alumnus.id}
                                            onClick={() => {
                                                handleAddAttendee(alumnus.id);
                                                setAttendeeSearch('');
                                            }}
                                            className="w-full px-4 py-3 text-left hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center justify-between transition-colors border-b last:border-0 border-gray-50 dark:border-gray-700"
                                        >
                                            <div>
                                                <p className="text-sm font-bold text-gray-900 dark:text-white">{alumnus.student?.firstName} {alumnus.student?.lastName}</p>
                                                <p className="text-[10px] text-gray-500">{alumnus.student?.admissionNo}</p>
                                            </div>
                                            <Plus size={14} className="text-gray-400" />
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="space-y-3">
                        <h4 className="text-xs font-bold text-gray-500 uppercase tracking-tight px-1">Participants ({attendees.length})</h4>
                        <div className="grid grid-cols-1 gap-2 max-h-[300px] overflow-y-auto pr-1">
                            {attendees.length === 0 ? (
                                <div className="py-10 text-center border-2 border-dashed border-gray-100 rounded-xl">
                                    <p className="text-xs text-gray-400 italic">No attendees registered</p>
                                </div>
                            ) : (
                                attendees.map(attendee => (
                                    <div key={attendee.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-900/50 rounded-lg border border-gray-100 dark:border-gray-800">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-[10px] font-bold text-gray-500">
                                                {attendee.alumni.student.firstName[0]}
                                            </div>
                                            <div>
                                                <p className="text-sm font-bold text-gray-900 dark:text-white">{attendee.alumni.student.firstName} {attendee.alumni.student.lastName}</p>
                                                <p className="text-[10px] text-gray-500">{attendee.alumni.student.admissionNo}</p>
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => handleRemoveAttendee(attendee.id)}
                                            className="p-1.5 text-gray-400 hover:text-red-600 transition-colors"
                                        >
                                            <Trash2 size={14} />
                                        </button>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            </Modal>
        </div>
    );
}

function InputField({ label, type = "text", value, onChange, icon: Icon, required }: any) {
    return (
        <div className="space-y-1.5">
            <label className="text-xs font-bold text-gray-500 uppercase tracking-tight px-1">
                {label} {required && <span className="text-red-500">*</span>}
            </label>
            <div className="relative">
                {Icon && <Icon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />}
                <input
                    type={type}
                    required={required}
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    className={clsx(
                        "w-full py-2.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 focus:ring-2 focus:ring-primary-500 outline-none transition-all text-sm",
                        Icon ? "pl-10 pr-4" : "px-4"
                    )}
                />
            </div>
        </div>
    );
}
