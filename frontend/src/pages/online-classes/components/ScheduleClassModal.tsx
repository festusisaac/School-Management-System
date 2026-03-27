import React, { useState, useEffect } from 'react';
import { X, Video, Calendar as CalendarIcon, Link as LinkIcon, Save, Info } from 'lucide-react';
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
            const payload = { ...formData };
            if (initialData?.id) {
                await api.patch(`/online-classes/${initialData.id}`, payload);
                toast.showSuccess('Class updated successfully');
            } else {
                await api.post('/online-classes', payload);
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
            <div className="bg-white dark:bg-gray-800 rounded-xl w-full max-w-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 border border-gray-100 dark:border-gray-700">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-gray-100 dark:border-gray-700">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-primary-50 dark:bg-primary-900/20 flex items-center justify-center text-primary-600 dark:text-primary-400">
                            <Video className="w-5 h-5" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                                {initialData ? 'Edit Online Class' : 'Schedule New Class'}
                            </h2>
                            <p className="text-sm text-gray-500 dark:text-gray-400">Configure virtual classroom settings</p>
                        </div>
                    </div>
                    <button 
                        onClick={onClose} 
                        className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors text-gray-400"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-6 max-h-[75vh] overflow-y-auto custom-scrollbar">
                    {/* Basic Info Section */}
                    <div className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="md:col-span-2">
                                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Class Title *</label>
                                <input
                                    required
                                    type="text"
                                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-900 focus:ring-2 focus:ring-primary-500 outline-none transition-all text-sm"
                                    placeholder="e.g. Mathematics Week 4: Algebra Fundamentals"
                                    value={formData.title}
                                    onChange={e => setFormData({ ...formData, title: e.target.value })}
                                />
                            </div>
                            <div className="md:col-span-2">
                                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Description (Optional)</label>
                                <textarea
                                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-900 focus:ring-2 focus:ring-primary-500 outline-none transition-all text-sm"
                                    placeholder="Brief summary of what will be covered in this session..."
                                    rows={2}
                                    value={formData.description}
                                    onChange={e => setFormData({ ...formData, description: e.target.value })}
                                />
                            </div>
                        </div>

                        {/* Dropdowns */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Target Class *</label>
                                <select
                                    required
                                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-900 focus:ring-2 focus:ring-primary-500 outline-none transition-all text-sm"
                                    value={formData.classId}
                                    onChange={e => setFormData({ ...formData, classId: e.target.value })}
                                >
                                    <option value="">Select Class</option>
                                    {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Subject *</label>
                                <select
                                    required
                                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-900 focus:ring-2 focus:ring-primary-500 outline-none transition-all text-sm"
                                    value={formData.subjectId}
                                    onChange={e => setFormData({ ...formData, subjectId: e.target.value })}
                                >
                                    <option value="">Select Subject</option>
                                    {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Teacher *</label>
                                <select
                                    required
                                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-900 focus:ring-2 focus:ring-primary-500 outline-none transition-all text-sm"
                                    value={formData.teacherId}
                                    onChange={e => setFormData({ ...formData, teacherId: e.target.value })}
                                >
                                    <option value="">Select Teacher</option>
                                    {teachers.map(t => <option key={t.id} value={t.id}>{t.firstName} {t.lastName}</option>)}
                                </select>
                            </div>
                        </div>
                    </div>

                    {/* Platform Selection - Segmented Style */}
                    <div className="space-y-4">
                        <div className="p-4 bg-primary-50 dark:bg-primary-900/10 rounded-xl border border-primary-100 dark:border-primary-900/20 flex gap-3">
                            <Info className="w-5 h-5 text-primary-600 dark:text-primary-400 shrink-0 mt-0.5" />
                            <div className="text-xs text-primary-800 dark:text-primary-300 leading-relaxed">
                                Choose your preferred platform and paste the meeting link generated from your account.
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Platform *</label>
                                <div className="flex p-1 bg-gray-100 dark:bg-gray-900 rounded-xl gap-1">
                                    <button
                                        type="button"
                                        onClick={() => setFormData({ ...formData, platform: OnlineClassPlatform.ZOOM })}
                                        className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-bold transition-all ${formData.platform === OnlineClassPlatform.ZOOM ? 'bg-white dark:bg-gray-700 text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'}`}
                                    >
                                        Zoom
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setFormData({ ...formData, platform: OnlineClassPlatform.GOOGLE_MEET })}
                                        className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-bold transition-all ${formData.platform === OnlineClassPlatform.GOOGLE_MEET ? 'bg-white dark:bg-gray-700 text-green-600 shadow-sm' : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'}`}
                                    >
                                        Google Meet
                                    </button>
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Meeting URL *</label>
                                <div className="relative">
                                    <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                                    <input
                                        required
                                        type="url"
                                        className="w-full pl-10 pr-4 py-2 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-900 focus:ring-2 focus:ring-primary-500 outline-none transition-all text-sm"
                                        placeholder="https://zoom.us/j/... or meet.google.com/..."
                                        value={formData.meetingUrl}
                                        onChange={e => setFormData({ ...formData, meetingUrl: e.target.value })}
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Meeting ID (Optional)</label>
                                <input
                                    type="text"
                                    className="w-full px-4 py-2 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-900 focus:ring-2 focus:ring-primary-500 outline-none transition-all text-sm"
                                    placeholder="Enter Meeting ID"
                                    value={formData.meetingId}
                                    onChange={e => setFormData({ ...formData, meetingId: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Password (Optional)</label>
                                <input
                                    type="text"
                                    className="w-full px-4 py-2 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-900 focus:ring-2 focus:ring-primary-500 outline-none transition-all text-sm"
                                    placeholder="Enter Meeting Password"
                                    value={formData.meetingPassword}
                                    onChange={e => setFormData({ ...formData, meetingPassword: e.target.value })}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Timing Section */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Start Date & Time *</label>
                            <div className="relative">
                                <CalendarIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                                <input
                                    required
                                    type="datetime-local"
                                    className="w-full pl-10 pr-4 py-2 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-900 focus:ring-2 focus:ring-primary-500 outline-none transition-all text-sm"
                                    value={formData.startTime}
                                    onChange={e => setFormData({ ...formData, startTime: e.target.value })}
                                />
                            </div>
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">End Date & Time *</label>
                            <div className="relative">
                                <CalendarIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                                <input
                                    required
                                    type="datetime-local"
                                    className="w-full pl-10 pr-4 py-2 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-900 focus:ring-2 focus:ring-primary-500 outline-none transition-all text-sm"
                                    value={formData.endTime}
                                    onChange={e => setFormData({ ...formData, endTime: e.target.value })}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="flex flex-col md:flex-row gap-3 pt-6 border-t border-gray-100 dark:border-gray-700">
                        <button
                            type="button"
                            onClick={onClose}
                            className="order-2 md:order-1 flex-1 px-6 py-3 rounded-xl font-bold border border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 transition-all text-sm active:scale-[0.98]"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="order-1 md:order-2 flex-1 flex items-center justify-center gap-2 bg-primary-600 hover:bg-primary-700 text-white px-6 py-3 rounded-xl font-bold transition-all shadow-lg shadow-primary-500/20 disabled:opacity-50 text-sm active:scale-[0.98] font-premium"
                        >
                            {loading ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Save className="w-4 h-4" />}
                            {initialData ? 'Save Changes' : 'Confirm Schedule'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
