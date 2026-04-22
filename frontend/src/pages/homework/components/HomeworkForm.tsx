import React, { useState, useEffect } from 'react';
import { X, BookOpen, Calendar as CalendarIcon, Save, Info, Paperclip, AlertCircle } from 'lucide-react';
import api from '../../../services/api';
import homeworkService from '../../../services/homework.service';
import { useToast } from '../../../context/ToastContext';
import { useAuthStore } from '@stores/authStore';
import { useSystem } from '../../../context/SystemContext';

interface HomeworkFormProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    initialData?: any;
}

export default function HomeworkForm({ isOpen, onClose, onSuccess, initialData }: HomeworkFormProps) {
    const { user } = useAuthStore();
    const { settings } = useSystem();
    const toast = useToast();
    const [loading, setLoading] = useState(false);
    const [classes, setClasses] = useState<any[]>([]);
    const [subjects, setSubjects] = useState<any[]>([]);
    const [teachers, setTeachers] = useState<any[]>([]);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);

    const [formData, setFormData] = useState({
        title: '',
        description: '',
        dueDate: '',
        classId: '',
        subjectId: '',
        teacherId: '',
    });

    useEffect(() => {
        if (isOpen) {
            fetchInitialData();
            if (initialData) {
                setFormData({
                    title: initialData.title || '',
                    description: initialData.description || '',
                    dueDate: initialData.dueDate ? new Date(initialData.dueDate).toISOString().slice(0, 16) : '',
                    classId: initialData.classId || '',
                    subjectId: initialData.subjectId || '',
                    teacherId: initialData.teacherId || '',
                });
            } else {
                // Default teacher to current user if they are a teacher
                const userRole = (user?.role || user?.roleObject?.name || 'student').toLowerCase();
                if (['teacher'].includes(userRole)) {
                    setFormData(prev => ({ ...prev, teacherId: user?.id || '' }));
                }
            }
            setSelectedFile(null);
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
            console.error('Error fetching form data:', error);
            toast.showError('Failed to load form data');
        }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (file.size > (settings?.maxFileUploadSizeMb || 5) * 1024 * 1024) {
            toast.showError(`File is too large. Maximum allowed size is ${settings?.maxFileUploadSizeMb || 5}MB`);
            return;
        }

        setSelectedFile(file);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            setLoading(true);
            
            const data = new FormData();
            data.append('title', formData.title);
            data.append('description', formData.description);
            data.append('dueDate', formData.dueDate);
            data.append('classId', formData.classId);
            data.append('subjectId', formData.subjectId);
            data.append('teacherId', formData.teacherId);
            
            if (selectedFile) {
                data.append('attachment', selectedFile);
            }

            if (initialData?.id) {
                await homeworkService.updateHomework(initialData.id, data);
                toast.showSuccess('Homework updated successfully');
            } else {
                await homeworkService.createHomework(data);
                toast.showSuccess('Homework assigned successfully');
            }
            onSuccess();
            onClose();
        } catch (error: any) {
            console.error('Error saving homework:', error);
            const message = error.response?.data?.message || 'Failed to save homework';
            toast.showError(Array.isArray(message) ? message[0] : message);
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 border border-gray-100 dark:border-gray-700">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-900/50">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-primary-600 flex items-center justify-center text-white shadow-lg shadow-primary-500/20">
                            <BookOpen className="w-5 h-5" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                                {initialData ? 'Edit Homework' : 'New Assignment'}
                            </h2>
                            <p className="text-sm text-gray-500 dark:text-gray-400">Assign tasks and materials to your students</p>
                        </div>
                    </div>
                    <button 
                        onClick={onClose} 
                        className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl transition-colors text-gray-400"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-6 max-h-[80vh] overflow-y-auto custom-scrollbar">
                    {/* Basic Info Section */}
                    <div className="space-y-4">
                        <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Assignment Title *</label>
                            <input
                                required
                                type="text"
                                className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-900 focus:ring-2 focus:ring-primary-500 outline-none transition-all text-sm font-medium"
                                placeholder="e.g. Weekly Math Quiz: Fractions & Decimals"
                                value={formData.title}
                                onChange={e => setFormData({ ...formData, title: e.target.value })}
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Instructions / Description</label>
                            <textarea
                                className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-900 focus:ring-2 focus:ring-primary-500 outline-none transition-all text-sm min-h-[100px]"
                                placeholder="Provide detailed instructions for the students..."
                                value={formData.description}
                                onChange={e => setFormData({ ...formData, description: e.target.value })}
                            />
                        </div>
                    </div>

                    {/* Context Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Due Date *</label>
                            <div className="relative">
                                <CalendarIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                                <input
                                    required
                                    type="datetime-local"
                                    className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-900 focus:ring-2 focus:ring-primary-500 outline-none transition-all text-sm font-medium"
                                    value={formData.dueDate}
                                    onChange={e => setFormData({ ...formData, dueDate: e.target.value })}
                                />
                            </div>
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Assigning Teacher *</label>
                            <select
                                required
                                className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-900 focus:ring-2 focus:ring-primary-500 outline-none transition-all text-sm font-medium"
                                value={formData.teacherId}
                                onChange={e => setFormData({ ...formData, teacherId: e.target.value })}
                            >
                                <option value="">Select Teacher</option>
                                {teachers.map(t => <option key={t.id} value={t.id}>{t.firstName} {t.lastName}</option>)}
                            </select>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Class *</label>
                            <select
                                required
                                className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-900 focus:ring-2 focus:ring-primary-500 outline-none transition-all text-sm font-medium"
                                value={formData.classId}
                                onChange={e => setFormData({ ...formData, classId: e.target.value })}
                            >
                                <option value="">Select Class</option>
                                {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Subject *</label>
                            <select
                                required
                                className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-900 focus:ring-2 focus:ring-primary-500 outline-none transition-all text-sm font-medium"
                                value={formData.subjectId}
                                onChange={e => setFormData({ ...formData, subjectId: e.target.value })}
                            >
                                <option value="">Select Subject</option>
                                {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                            </select>
                        </div>
                    </div>

                    {/* File Attachment Section */}
                    <div className="space-y-3">
                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Study Materials / Attachments</label>
                        <div className="flex items-center justify-center w-full">
                            <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-2xl cursor-pointer bg-gray-50/50 dark:bg-gray-900/50 hover:bg-gray-100 dark:hover:bg-gray-900 transition-all group">
                                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                    <Paperclip className="w-8 h-8 text-gray-400 group-hover:text-primary-500 transition-colors mb-2" />
                                    <p className="text-sm text-gray-500 dark:text-gray-400">
                                        <span className="font-bold text-primary-600">Click to upload</span> or drag and drop
                                    </p>
                                    <p className="text-xs text-gray-400">PDF, DOC, JPG, PNG (Max {settings?.maxFileUploadSizeMb || 5}MB)</p>
                                </div>
                                <input type="file" className="hidden" onChange={handleFileChange} />
                            </label>
                        </div>
                        {selectedFile && (
                            <div className="flex items-center gap-3 p-3 bg-primary-50 dark:bg-primary-900/20 rounded-xl border border-primary-100 dark:border-primary-900/10">
                                <FileIcon className="w-5 h-5 text-primary-600" />
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-bold text-gray-900 dark:text-white truncate">{selectedFile.name}</p>
                                    <p className="text-xs text-gray-500">{(selectedFile.size / 1024 / 1024).toFixed(2)} MB</p>
                                </div>
                                <button 
                                    type="button" 
                                    onClick={() => setSelectedFile(null)}
                                    className="p-1 text-gray-400 hover:text-red-500 transition-colors"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>
                        )}
                        {initialData?.attachmentUrl && !selectedFile && (
                            <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-900/50 rounded-xl border border-gray-200 dark:border-gray-700">
                                <FileIcon className="w-5 h-5 text-gray-400" />
                                <div className="flex-1 min-w-0">
                                    <p className="text-xs font-bold text-gray-500 italic">Current attachment preserved</p>
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="flex items-start gap-3 p-4 bg-yellow-50 dark:bg-yellow-900/10 rounded-xl border border-yellow-100 dark:border-yellow-900/20">
                        <AlertCircle className="w-5 h-5 text-yellow-600 shrink-0 mt-0.5" />
                        <p className="text-xs text-yellow-800 dark:text-yellow-300 leading-relaxed">
                            Submitting this form will automatically notify all students in the selected class via email and portal notifications. Please ensure all details are correct.
                        </p>
                    </div>

                    {/* Actions */}
                    <div className="flex flex-col md:flex-row gap-3 pt-6 border-t border-gray-100 dark:border-gray-700">
                        <button
                            type="button"
                            onClick={onClose}
                            className="order-2 md:order-1 flex-1 px-6 py-4 rounded-xl font-bold border border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 transition-all text-sm"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="order-1 md:order-2 flex-1 flex items-center justify-center gap-2 bg-primary-600 hover:bg-primary-700 text-white px-6 py-4 rounded-xl font-bold transition-all shadow-lg shadow-primary-500/20 disabled:opacity-50 text-sm font-premium"
                        >
                            {loading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Save className="w-5 h-5" />}
                            {initialData ? 'Update Assignment' : 'Assign Homework'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

const FileIcon = ({ className }: { className?: string }) => (
    <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M13 2H6C5.46957 2 4.96086 2.21071 4.58579 2.58579C4.21071 2.96086 4 3.46957 4 4V20C4 20.5304 4.21071 21.0391 4.58579 21.4142C4.96086 21.7893 5.46957 22 6 22H18C18.5304 22 19.0391 21.7893 19.4142 21.4142C19.7893 21.0391 20 20.5304 20 20V9L13 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M13 2V9H20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
);
