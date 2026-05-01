import { useState, useEffect } from 'react';
import { Modal } from '../../../components/ui/modal';
import api from '../../../services/api';
import { useToast } from '../../../context/ToastContext';
import { Loader2, Briefcase, MapPin, Linkedin, Info } from 'lucide-react';

interface UpdateAlumniModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    alumni: any;
}

export function UpdateAlumniModal({ isOpen, onClose, onSuccess, alumni }: UpdateAlumniModalProps) {
    const [formData, setFormData] = useState({
        graduationYear: new Date().getFullYear(),
        currentOccupation: '',
        currentCompany: '',
        linkedInUrl: '',
        location: '',
        achievements: '',
        isMentorshipAvailable: false,
        email: '',
        phoneNumber: '',
        address: ''
    });
    const [submitting, setSubmitting] = useState(false);
    const toast = useToast();

    useEffect(() => {
        if (alumni) {
            setFormData({
                graduationYear: alumni.graduationYear || new Date().getFullYear(),
                currentOccupation: alumni.currentOccupation || '',
                currentCompany: alumni.currentCompany || '',
                linkedInUrl: alumni.linkedInUrl || '',
                location: alumni.location || '',
                achievements: alumni.achievements || '',
                isMentorshipAvailable: alumni.isMentorshipAvailable || false,
                email: alumni.email || '',
                phoneNumber: alumni.phoneNumber || '',
                address: alumni.address || ''
            });
        }
    }, [alumni]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            await api.patch(`/alumni/${alumni.id}`, formData);
            toast.showSuccess("Alumni details updated successfully");
            onSuccess();
        } catch (error: any) {
            toast.showError("Failed to update alumni: " + (error.response?.data?.message || error.message));
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Edit Alumni Details" size="lg">
            <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <label className="text-sm font-bold text-gray-700 dark:text-gray-300">Graduation Year</label>
                        <input
                            type="number"
                            value={formData.graduationYear}
                            onChange={(e) => setFormData({ ...formData, graduationYear: parseInt(e.target.value) })}
                            className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 focus:ring-2 focus:ring-primary-500 outline-none"
                            required
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-bold text-gray-700 dark:text-gray-300">Location</label>
                        <div className="relative">
                            <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <input
                                type="text"
                                placeholder="e.g. Lagos, Nigeria"
                                value={formData.location}
                                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 focus:ring-2 focus:ring-primary-500 outline-none"
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-bold text-gray-700 dark:text-gray-300">Current Occupation</label>
                        <div className="relative">
                            <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <input
                                type="text"
                                placeholder="e.g. Software Engineer"
                                value={formData.currentOccupation}
                                onChange={(e) => setFormData({ ...formData, currentOccupation: e.target.value })}
                                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 focus:ring-2 focus:ring-primary-500 outline-none"
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-bold text-gray-700 dark:text-gray-300">Current Company</label>
                        <input
                            type="text"
                            placeholder="e.g. Google"
                            value={formData.currentCompany}
                            onChange={(e) => setFormData({ ...formData, currentCompany: e.target.value })}
                            className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 focus:ring-2 focus:ring-primary-500 outline-none"
                        />
                    </div>
                </div>

                <div className="space-y-2">
                    <label className="text-sm font-bold text-gray-700 dark:text-gray-300">LinkedIn Profile URL</label>
                    <div className="relative">
                        <Linkedin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                            type="text"
                            placeholder="https://linkedin.com/in/username"
                            value={formData.linkedInUrl}
                            onChange={(e) => setFormData({ ...formData, linkedInUrl: e.target.value })}
                            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 focus:ring-2 focus:ring-primary-500 outline-none"
                        />
                    </div>
                </div>

                <div className="space-y-2">
                    <label className="text-sm font-bold text-gray-700 dark:text-gray-300">Key Achievements</label>
                    <textarea
                        rows={3}
                        placeholder="Highlight any awards or special recognitions..."
                        value={formData.achievements}
                        onChange={(e) => setFormData({ ...formData, achievements: e.target.value })}
                        className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 focus:ring-2 focus:ring-primary-500 outline-none"
                    />
                </div>

                <label className="flex items-center gap-3 p-4 rounded-xl border border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-900/50 cursor-pointer hover:bg-gray-100 transition-colors">
                    <input
                        type="checkbox"
                        checked={formData.isMentorshipAvailable}
                        onChange={(e) => setFormData({ ...formData, isMentorshipAvailable: e.target.checked })}
                        className="w-5 h-5 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                    />
                    <div className="flex-1">
                        <p className="text-sm font-bold text-gray-900 dark:text-white">Available for Mentorship</p>
                        <p className="text-xs text-gray-500">Show a mentor badge and allow students to reach out for guidance.</p>
                    </div>
                </label>

                <div className="pt-4 border-t border-gray-100 dark:border-gray-700 flex justify-end gap-3">
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-6 py-2.5 rounded-xl text-sm font-bold text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 transition-all"
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        disabled={submitting}
                        className="px-8 py-2.5 bg-primary-600 text-white rounded-xl text-sm font-bold hover:bg-primary-700 transition-all shadow-lg shadow-primary-200 disabled:opacity-50 flex items-center gap-2"
                    >
                        {submitting ? (
                            <>
                                <Loader2 className="w-4 h-4 animate-spin" />
                                Updating...
                            </>
                        ) : (
                            "Save Changes"
                        )}
                    </button>
                </div>
            </form>
        </Modal>
    );
}
