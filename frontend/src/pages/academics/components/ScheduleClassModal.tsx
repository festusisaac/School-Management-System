import React, { useState, useEffect } from 'react';
import { X, Video, Calendar as CalendarIcon, Clock, Link as LinkIcon, Save, Info } from 'lucide-react';
import api from '../../../services/api';
import { useToast } from '../../../context/ToastContext';

enum OnlineClassPlatform {
    ZOOM = 'ZOOM',
    GOOGLE_MEET = 'GOOGLE_MEET'
}

interface ScheduleClassModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    initialData?: any;
}

export default function ScheduleClassModal({ isOpen, onClose, onSuccess, initialData }: ScheduleClassModalProps) {
    const toast = useToast();
    const [loading, setLoading] = useState(false);
    const [classes, setClasses] = useState<any[]>([]);
    const [subjects, setSubjects] = useState<any[]>([]);
    const [teachers, setTeachers] = useState<any[]>([]);

    const [formData, setFormData] = useState({
        title: '',
        description: '',
        startTime: '',
        endTime: '',
        platform: OnlineClassPlatform.GOOGLE_MEET,
        meetingUrl: '',
        meetingId: '',
        meetingPassword: '',
        classId: '',
        subjectId: '',
        teacherId: '',
    });

    useEffect(() => {
        if (isOpen) {
            fetchInitialData();
            if (initialData) {
                setFormData({
                    ...initialData,
                    startTime: initialData.startTime ? new Date(initialData.startTime).toISOString().slice(0, 16) : '',
                    endTime: initialData.endTime ? new Date(initialData.endTime).toISOString().slice(0, 16) : '',
                });
            }
        }
    }, [isOpen, initialData]);

    const fetchInitialData = async () => {
        try {
            const [classesRes, subjectsRes, teachersRes] = await Promise.all([
                api.get('/academics/classes'),
                api.get('/academics/subjects'),
                api.get('/hr/staff?isTeachingStaff=true'),
            ]);
            setClasses(Array.isArray(classesRes) ? classesRes : []);
            setSubjects(Array.isArray(subjectsRes) ? subjectsRes : []);
            setTeachers(Array.isArray(teachersRes) ? teachersRes : []);
        } catch (error) {
            console.error('Error fetching modal data:', error);
            toast.showError('Failed to load form data');
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            setLoading(true);
            if (initialData?.id) {
                await api.patch(`/online-classes/${initialData.id}`, formData);
                toast.showSuccess('Class updated successfully');
            } else {
                await api.post('/online-classes', formData);
                toast.showSuccess('Class scheduled successfully');
            }
            onSuccess();
            onClose();
        } catch (error: any) {
            console.error('Error scheduling class:', error);
            const message = error.response?.data?.message || 'Failed to schedule class';
            toast.showError(Array.isArray(message) ? message[0] : message);
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white rounded-3xl w-full max-w-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
                <div className="flex items-center justify-between p-6 border-b border-gray-100">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-primary-50 flex items-center justify-center text-primary-600">
                            <Video className="w-6 h-6" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-gray-900">{initialData ? 'Edit Online Class' : 'Schedule Online Class'}</h2>
                            <p className="text-sm text-gray-500">Provide meeting details for the virtual session</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                        <X className="w-6 h-6 text-gray-400" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
                    {/* Basic Info */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="md:col-span-2">
                            <label className="block text-sm font-semibold text-gray-700 mb-1">Class Title *</label>
                            <input
                                required
                                type="text"
                                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-primary-500 outline-none transition-all"
                                placeholder="e.g. Mathematics Week 4: Algebra"
                                value={formData.title}
                                onChange={e => setFormData({ ...formData, title: e.target.value })}
                            />
                        </div>
                        <div className="md:col-span-2">
                            <label className="block text-sm font-semibold text-gray-700 mb-1">Description (Optional)</label>
                            <textarea
                                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-primary-500 outline-none transition-all"
                                placeholder="Brief summary of what will be covered..."
                                rows={2}
                                value={formData.description}
                                onChange={e => setFormData({ ...formData, description: e.target.value })}
                            />
                        </div>
                    </div>

                    {/* Academic Mapping */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-1">Assign to Class *</label>
                            <select
                                required
                                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-primary-500 outline-none transition-all"
                                value={formData.classId}
                                onChange={e => setFormData({ ...formData, classId: e.target.value })}
                            >
                                <option value="">Select Class</option>
                                {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-1">Subject *</label>
                            <select
                                required
                                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-primary-500 outline-none transition-all"
                                value={formData.subjectId}
                                onChange={e => setFormData({ ...formData, subjectId: e.target.value })}
                            >
                                <option value="">Select Subject</option>
                                {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-1">Teacher *</label>
                            <select
                                required
                                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-primary-500 outline-none transition-all"
                                value={formData.teacherId}
                                onChange={e => setFormData({ ...formData, teacherId: e.target.value })}
                            >
                                <option value="">Select Teacher</option>
                                {teachers.map(t => <option key={t.id} value={t.id}>{t.firstName} {t.lastName}</option>)}
                            </select>
                        </div>
                    </div>

                    {/* Timing */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-gray-50 p-4 rounded-2xl border border-gray-100">
                        <div>
                            <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-1">
                                <CalendarIcon className="w-4 h-4 text-primary-500" /> Start Time *
                            </label>
                            <input
                                required
                                type="datetime-local"
                                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-primary-500 outline-none transition-all"
                                value={formData.startTime}
                                onChange={e => setFormData({ ...formData, startTime: e.target.value })}
                            />
                        </div>
                        <div>
                            <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-1">
                                <Clock className="w-4 h-4 text-orange-500" /> End Time *
                            </label>
                            <input
                                required
                                type="datetime-local"
                                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-primary-500 outline-none transition-all"
                                value={formData.endTime}
                                onChange={e => setFormData({ ...formData, endTime: e.target.value })}
                            />
                        </div>
                    </div>

                    {/* Meeting Details */}
                    <div className="space-y-4">
                        <div className="flex items-center gap-4">
                            <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">Platform:</label>
                            <div className="flex gap-2">
                                <button
                                    type="button"
                                    onClick={() => setFormData({ ...formData, platform: OnlineClassPlatform.ZOOM })}
                                    className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all ${formData.platform === OnlineClassPlatform.ZOOM ? 'bg-blue-600 text-white shadow-md' : 'bg-gray-100 text-gray-500'}`}
                                >
                                    ZOOM
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setFormData({ ...formData, platform: OnlineClassPlatform.GOOGLE_MEET })}
                                    className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all ${formData.platform === OnlineClassPlatform.GOOGLE_MEET ? 'bg-green-600 text-white shadow-md' : 'bg-gray-100 text-gray-500'}`}
                                >
                                    GOOGLE MEET
                                </button>
                            </div>
                        </div>

                        <div>
                            <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-1">
                                <LinkIcon className="w-4 h-4 text-primary-500" /> Meeting URL *
                            </label>
                            <input
                                required
                                type="url"
                                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-primary-500 outline-none transition-all"
                                placeholder="Paste the Zoom/Meet link here..."
                                value={formData.meetingUrl}
                                onChange={e => setFormData({ ...formData, meetingUrl: e.target.value })}
                            />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-1">Meeting ID (Optional)</label>
                                <input
                                    type="text"
                                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-primary-500 outline-none transition-all"
                                    value={formData.meetingId}
                                    onChange={e => setFormData({ ...formData, meetingId: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-1">Passcode (Optional)</label>
                                <input
                                    type="text"
                                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-primary-500 outline-none transition-all"
                                    value={formData.meetingPassword}
                                    onChange={e => setFormData({ ...formData, meetingPassword: e.target.value })}
                                />
                            </div>
                        </div>
                    </div>

                    <div className="bg-blue-50 p-4 rounded-2xl flex gap-3 text-blue-700 text-sm italic">
                        <Info className="w-5 h-5 flex-shrink-0" />
                        <p>Tip: Generate the link from your Zoom or Google Meet app first, then paste it here for students to access.</p>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-6 py-2.5 rounded-xl font-semibold text-gray-600 hover:bg-gray-50 transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            disabled={loading}
                            type="submit"
                            className="flex items-center gap-2 bg-primary-600 hover:bg-primary-700 disabled:bg-primary-300 text-white px-8 py-2.5 rounded-xl font-bold shadow-lg shadow-primary-500/30 transition-all active:scale-95"
                        >
                            {loading ? 'Saving...' : (
                                <>
                                    <Save className="w-5 h-5" />
                                    {initialData ? 'Update Class' : 'Schedule Class'}
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
