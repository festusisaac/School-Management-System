import { useState, useEffect } from 'react';
import { Modal } from '../../../components/ui/modal';
import api from '../../../services/api';
import { useToast } from '../../../context/ToastContext';
import { Briefcase, Building2, MapPin, Link as LinkIcon, DollarSign, AlignLeft } from 'lucide-react';

interface JobPostingModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    editingJob?: any;
}

export function JobPostingModal({ isOpen, onClose, onSuccess, editingJob }: JobPostingModalProps) {
    const [submitting, setSubmitting] = useState(false);
    const [formData, setFormData] = useState({
        title: '',
        company: '',
        location: '',
        type: 'Full-time',
        description: '',
        requirements: '',
        salaryRange: '',
        applicationUrl: '',
        status: 'Open'
    });
    const toast = useToast();

    useEffect(() => {
        if (editingJob) {
            setFormData({
                title: editingJob.title || '',
                company: editingJob.company || '',
                location: editingJob.location || '',
                type: editingJob.type || 'Full-time',
                description: editingJob.description || '',
                requirements: editingJob.requirements || '',
                salaryRange: editingJob.salaryRange || '',
                applicationUrl: editingJob.applicationUrl || '',
                status: editingJob.status || 'Open'
            });
        } else {
            setFormData({
                title: '',
                company: '',
                location: '',
                type: 'Full-time',
                description: '',
                requirements: '',
                salaryRange: '',
                applicationUrl: '',
                status: 'Open'
            });
        }
    }, [editingJob, isOpen]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            if (editingJob) {
                await api.updateJobPosting(editingJob.id, formData);
                toast.showSuccess("Job posting updated");
            } else {
                await api.createJobPosting(formData);
                toast.showSuccess("Job posting created");
            }
            onSuccess();
        } catch (error: any) {
            toast.showError("Failed to save job: " + (error.response?.data?.message || error.message));
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={editingJob ? "Edit Job Posting" : "Create Job Posting"} size="lg">
            <form onSubmit={handleSubmit} className="space-y-6 p-1">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <InputField 
                        label="Job Title" 
                        required 
                        icon={Briefcase}
                        value={formData.title} 
                        onChange={(v) => setFormData({...formData, title: v})} 
                    />
                    <InputField 
                        label="Company" 
                        required 
                        icon={Building2}
                        value={formData.company} 
                        onChange={(v) => setFormData({...formData, company: v})} 
                    />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <InputField 
                        label="Location" 
                        icon={MapPin}
                        value={formData.location} 
                        onChange={(v) => setFormData({...formData, location: v})} 
                    />
                    <div className="space-y-1.5">
                        <label className="text-xs font-bold text-gray-500 uppercase tracking-tight px-1">Job Type</label>
                        <select
                            value={formData.type}
                            onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                            className="w-full px-4 py-2.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 focus:ring-2 focus:ring-primary-500 outline-none transition-all text-sm appearance-none"
                        >
                            <option value="Full-time">Full-time</option>
                            <option value="Part-time">Part-time</option>
                            <option value="Internship">Internship</option>
                            <option value="Contract">Contract</option>
                            <option value="Freelance">Freelance</option>
                        </select>
                    </div>
                    <div className="space-y-1.5">
                        <label className="text-xs font-bold text-gray-500 uppercase tracking-tight px-1">Status</label>
                        <select
                            value={formData.status}
                            onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                            className="w-full px-4 py-2.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 focus:ring-2 focus:ring-primary-500 outline-none transition-all text-sm appearance-none"
                        >
                            <option value="Open">Open</option>
                            <option value="Closed">Closed</option>
                            <option value="Filled">Filled</option>
                        </select>
                    </div>
                </div>

                <div className="space-y-1.5">
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-tight px-1 flex items-center gap-2">
                        <AlignLeft size={14} /> Description
                    </label>
                    <textarea
                        rows={4}
                        required
                        value={formData.description}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        className="w-full px-4 py-2.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 focus:ring-2 focus:ring-primary-500 outline-none transition-all text-sm"
                        placeholder="Detailed job description..."
                    />
                </div>

                <div className="space-y-1.5">
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-tight px-1 flex items-center gap-2">
                        Requirements
                    </label>
                    <textarea
                        rows={3}
                        value={formData.requirements}
                        onChange={(e) => setFormData({ ...formData, requirements: e.target.value })}
                        className="w-full px-4 py-2.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 focus:ring-2 focus:ring-primary-500 outline-none transition-all text-sm"
                        placeholder="Skills, experience, etc..."
                    />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <InputField 
                        label="Salary Range" 
                        icon={DollarSign}
                        placeholder="e.g. $50k - $70k"
                        value={formData.salaryRange} 
                        onChange={(v) => setFormData({...formData, salaryRange: v})} 
                    />
                    <InputField 
                        label="Application URL / Email" 
                        icon={LinkIcon}
                        placeholder="https://company.com/apply"
                        value={formData.applicationUrl} 
                        onChange={(v) => setFormData({...formData, applicationUrl: v})} 
                    />
                </div>

                <div className="pt-6 border-t border-gray-100 dark:border-gray-700 flex justify-end gap-3">
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-6 py-2.5 rounded-lg text-sm font-bold text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 transition-all"
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        disabled={submitting}
                        className="px-8 py-2.5 bg-primary-600 text-white rounded-lg text-sm font-bold hover:bg-primary-700 transition-all shadow-sm disabled:opacity-50"
                    >
                        {submitting ? 'Saving...' : (editingJob ? 'Update Posting' : 'Create Posting')}
                    </button>
                </div>
            </form>
        </Modal>
    );
}

function InputField({ label, type = "text", value, onChange, icon: Icon, required, placeholder }: any) {
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
                    placeholder={placeholder}
                    onChange={(e) => onChange(e.target.value)}
                    className={`w-full py-2.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 focus:ring-2 focus:ring-primary-500 outline-none transition-all text-sm ${Icon ? 'pl-10 pr-4' : 'px-4'}`}
                />
            </div>
        </div>
    );
}
