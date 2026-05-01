import { useState } from 'react';
import { Modal } from '../ui/modal';
import api from '../../services/api';
import { useToast } from '../../context/ToastContext';
import { Mail, Send, Loader2, AlertCircle } from 'lucide-react';

interface EmailAlumniModalProps {
    isOpen: boolean;
    onClose: () => void;
    targetIds?: string[]; // If empty, send to all
    targetName?: string;
}

export function EmailAlumniModal({ isOpen, onClose, targetIds, targetName }: EmailAlumniModalProps) {
    const [subject, setSubject] = useState('');
    const [body, setBody] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const toast = useToast();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!subject || !body) {
            toast.showWarning("Please fill in all fields");
            return;
        }

        setSubmitting(true);
        try {
            const payload = {
                channel: 'EMAIL' as const,
                target: targetIds && targetIds.length > 0 ? 'INDIVIDUAL_ALUMNI' as any : 'ALUMNI' as any,
                targetIds: targetIds,
                subject,
                body: body.replace(/\n/g, '<br/>'),
            };

            const res = await api.post<any>('/communication/broadcast', payload);
            toast.showSuccess(`Newsletter queued for ${res.data?.queued || 'all'} alumni`);
            onClose();
        } catch (error: any) {
            toast.showError("Failed to send newsletter: " + (error.response?.data?.message || error.message));
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={targetName ? `Email ${targetName}` : "Send Alumni Newsletter"} size="lg">
            <form onSubmit={handleSubmit} className="space-y-6">
                <div className="p-4 bg-primary-50 dark:bg-primary-900/20 border border-primary-100 dark:border-primary-800/50 rounded-xl flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-primary-600 mt-0.5" />
                    <div>
                        <p className="text-sm font-bold text-primary-900 dark:text-white">
                            {targetName ? `Sending email to ${targetName}` : "Broadcasting to all registered Alumni"}
                        </p>
                        <p className="text-xs text-primary-700 dark:text-primary-300 mt-1">
                            Use placeholders like <span className="font-mono">{'{name}'}</span> or <span className="font-mono">{'{graduation_year}'}</span> for personalization.
                        </p>
                    </div>
                </div>

                <div className="space-y-2">
                    <label className="text-sm font-bold text-gray-700 dark:text-gray-300 uppercase tracking-tight">Subject</label>
                    <input
                        type="text"
                        placeholder="e.g., Annual Alumni Homecoming 2026"
                        value={subject}
                        onChange={(e) => setSubject(e.target.value)}
                        className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 focus:ring-2 focus:ring-primary-500 outline-none"
                        required
                    />
                </div>

                <div className="space-y-2">
                    <label className="text-sm font-bold text-gray-700 dark:text-gray-300 uppercase tracking-tight">Message Body (HTML Supported)</label>
                    <textarea
                        rows={10}
                        placeholder="Type your newsletter content here..."
                        value={body}
                        onChange={(e) => setBody(e.target.value)}
                        className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 focus:ring-2 focus:ring-primary-500 outline-none font-sans"
                        required
                    />
                </div>

                <div className="pt-6 border-t border-gray-100 dark:border-gray-700 flex justify-end gap-3">
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-6 py-3 rounded-xl text-sm font-bold text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 transition-all"
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        disabled={submitting}
                        className="px-8 py-3 bg-primary-600 text-white rounded-xl text-sm font-bold hover:bg-primary-700 transition-all shadow-lg shadow-primary-200 disabled:opacity-50 flex items-center gap-2"
                    >
                        {submitting ? (
                            <>
                                <Loader2 className="w-4 h-4 animate-spin" />
                                Sending...
                            </>
                        ) : (
                            <>
                                <Send className="w-4 h-4" />
                                {targetName ? 'Send Email' : 'Send Newsletter'}
                            </>
                        )}
                    </button>
                </div>
            </form>
        </Modal>
    );
}
