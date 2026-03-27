import React, { useState, useEffect } from 'react';
import { X, Send, Paperclip, FileText, AlertCircle, Loader2, Plus, Trash2 } from 'lucide-react';
import { Homework, homeworkService } from '../../../services/homework.service';
import { useToast } from '../../../context/ToastContext';
import api from '../../../services/api';

interface SubmissionModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    homework: Homework | null;
}

export default function SubmissionModal({ isOpen, onClose, onSuccess, homework }: SubmissionModalProps) {
    const toast = useToast();
    const [loading, setLoading] = useState(false);
    const [content, setContent] = useState('');
    const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
    const [maxSizeMb, setMaxSizeMb] = useState(2); // Default 2MB

    useEffect(() => {
        if (isOpen) {
            fetchSettings();
            if (homework?.submission) {
                setContent(homework.submission.content || '');
            } else {
                setContent('');
                setSelectedFiles([]);
            }
        }
    }, [isOpen, homework]);

    const fetchSettings = async () => {
        try {
            const settings = await api.get<any>('/system/settings');
            if (settings?.maxFileUploadSizeMb) {
                setMaxSizeMb(settings.maxFileUploadSizeMb);
            }
        } catch (error) {
            console.error('Error fetching system settings:', error);
        }
    };

    if (!isOpen || !homework) return null;

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            const files = Array.from(e.target.files);
            const validFiles: File[] = [];
            const invalidFiles: string[] = [];

            files.forEach(file => {
                if (file.size > maxSizeMb * 1024 * 1024) {
                    invalidFiles.push(file.name);
                } else {
                    validFiles.push(file);
                }
            });

            if (invalidFiles.length > 0) {
                toast.showError(`Following files exceed ${maxSizeMb}MB limit: ${invalidFiles.join(', ')}`);
            }

            setSelectedFiles(prev => [...prev, ...validFiles]);
        }
        // Reset input value so same file can be selected again if removed
        e.target.value = '';
    };

    const removeFile = (index: number) => {
        setSelectedFiles(prev => prev.filter((_, i) => i !== index));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            setLoading(true);
            const formData = new FormData();
            formData.append('homeworkId', homework.id);
            formData.append('content', content);
            
            selectedFiles.forEach(file => {
                formData.append('attachments', file);
            });

            await homeworkService.submitHomework(formData);
            toast.showSuccess('Assignment submitted successfully!');
            onSuccess();
            onClose();
            // Reset state
            setContent('');
            setSelectedFiles([]);
        } catch (error: any) {
            console.error('Submission error:', error);
            const message = error.response?.data?.message || 'Failed to submit assignment';
            toast.showError(Array.isArray(message) ? message[0] : message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-in fade-in duration-200">
            <div className="bg-white dark:bg-gray-800 rounded-3xl w-full max-w-xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 border border-gray-100 dark:border-gray-700 flex flex-col max-h-[90vh]">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-gray-100 dark:border-gray-700 bg-primary-50/30 dark:bg-primary-900/10 shrink-0">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-2xl bg-primary-600 flex items-center justify-center text-white shadow-lg shadow-primary-500/20">
                            <Send className="w-5 h-5" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-gray-900 dark:text-white">Submit Assignment</h2>
                            <p className="text-sm text-gray-500 dark:text-gray-400">Assignment: {homework.title}</p>
                        </div>
                    </div>
                    <button 
                        onClick={onClose} 
                        className="p-2 hover:bg-white/50 dark:hover:bg-gray-700 rounded-xl transition-colors text-gray-400"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
                    {/* Content Section */}
                    <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-3">Submission Notes / Content</label>
                        <textarea
                            className="w-full px-5 py-4 rounded-2xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-900 focus:ring-2 focus:ring-primary-500 outline-none transition-all text-sm min-h-[120px] shadow-sm"
                            placeholder="Type your submission notes here (optional)..."
                            value={content}
                            onChange={(e) => setContent(e.target.value)}
                        />
                    </div>

                    {/* File Upload */}
                    <div className="space-y-4">
                        <div className="flex items-center justify-between mb-2">
                            <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest">Upload Work (Max {maxSizeMb}MB per file)</label>
                            <span className="text-xs font-bold text-primary-600">{selectedFiles.length} files selected</span>
                        </div>
                        
                        <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-2xl cursor-pointer bg-gray-50/50 dark:bg-gray-900/50 hover:bg-gray-100 dark:hover:bg-gray-900 transition-all group shrink-0">
                            <div className="flex flex-col items-center justify-center pt-5 pb-6 text-center px-4">
                                <Paperclip className="w-6 h-6 mb-2 text-gray-400 group-hover:text-primary-500 transition-colors" />
                                <p className="text-sm text-gray-600 dark:text-gray-300">
                                    <span className="font-bold text-primary-600">Click to add</span> files
                                </p>
                            </div>
                            <input 
                                type="file" 
                                className="hidden" 
                                multiple
                                onChange={handleFileChange} 
                            />
                        </label>

                        {selectedFiles.length > 0 && (
                            <div className="space-y-2 max-h-[200px] overflow-y-auto pr-2 custom-scrollbar">
                                {selectedFiles.map((file, index) => (
                                    <div key={`${file.name}-${index}`} className="flex items-center gap-3 p-3 bg-primary-50 dark:bg-primary-900/20 rounded-2xl border border-primary-100 dark:border-primary-900/10 animate-in slide-in-from-top-2">
                                        <div className="w-8 h-8 rounded-lg bg-primary-100 dark:bg-primary-800 flex items-center justify-center text-primary-600 dark:text-primary-300">
                                            <FileText className="w-4 h-4" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-xs font-bold text-gray-900 dark:text-white truncate">{file.name}</p>
                                            <p className="text-[10px] text-gray-500 font-medium">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                                        </div>
                                        <button 
                                            type="button" 
                                            onClick={() => removeFile(index)}
                                            className="p-1.5 text-gray-400 hover:text-red-500 transition-colors hover:bg-white dark:hover:bg-gray-800 rounded-lg"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    <div className="flex items-start gap-3 p-4 bg-blue-50/50 dark:bg-blue-900/10 rounded-2xl border border-blue-100 dark:border-blue-900/20 shrink-0">
                        <AlertCircle className="w-5 h-5 text-blue-500 shrink-0 mt-0.5" />
                        <p className="text-xs text-blue-700 dark:text-blue-300 leading-relaxed">
                            Ensure you have uploaded all required files before submitting. Your teacher will be notified.
                        </p>
                    </div>
                </form>

                {/* Actions */}
                <div className="p-6 border-t border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-900/50 shrink-0">
                    <div className="flex flex-col md:flex-row gap-3">
                        <button
                            type="button"
                            onClick={onClose}
                            className="order-2 md:order-1 flex-1 px-6 py-3.5 rounded-2xl font-bold border border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 transition-all text-sm"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            onClick={handleSubmit}
                            disabled={loading}
                            className="order-1 md:order-2 flex-1 flex items-center justify-center gap-2 bg-primary-600 hover:bg-primary-700 text-white px-6 py-3.5 rounded-2xl font-bold transition-all shadow-lg shadow-primary-500/25 disabled:opacity-50 text-sm font-premium"
                        >
                            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                            Turn In Assignment
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
