import { useState, useEffect } from 'react';
import { 
    Plus, Search, Briefcase, Building2, MapPin, 
    Edit, Trash2, ExternalLink, Filter, 
    Clock, CheckCircle2, XCircle
} from 'lucide-react';
import api from '../../../services/api';
import { useToast } from '../../../context/ToastContext';
import { JobPostingModal } from './JobPostingModal';
import { format } from 'date-fns';
import { clsx } from 'clsx';

export default function JobManagement() {
    const [jobs, setJobs] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingJob, setEditingJob] = useState<any>(null);
    const toast = useToast();

    useEffect(() => {
        fetchJobs();
    }, []);

    const fetchJobs = async () => {
        setLoading(true);
        try {
            const data = await api.getJobPostings();
            setJobs(data);
        } catch (error) {
            console.error("Failed to fetch jobs", error);
            toast.showError("Failed to load job postings");
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!window.confirm("Are you sure you want to delete this job posting?")) return;
        try {
            await api.deleteJobPosting(id);
            toast.showSuccess("Job posting deleted");
            fetchJobs();
        } catch (error) {
            toast.showError("Failed to delete job posting");
        }
    };

    const filteredJobs = jobs.filter(job => 
        job.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        job.company.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="space-y-6 p-4 sm:p-6 lg:p-8 bg-gray-50/50 dark:bg-transparent min-h-screen">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
                        <Briefcase className="w-8 h-8 text-primary-600" />
                        Job Management
                    </h1>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Post and manage career opportunities for alumni</p>
                </div>
                <button 
                    onClick={() => {
                        setEditingJob(null);
                        setIsModalOpen(true);
                    }}
                    className="bg-primary-600 text-white px-6 py-2.5 rounded-xl font-bold text-sm shadow-lg shadow-primary-200 hover:bg-primary-700 transition-all flex items-center gap-2"
                >
                    <Plus size={18} />
                    Post New Job
                </button>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
                <div className="p-5 border-b border-gray-50 dark:border-gray-700 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="relative max-w-md w-full">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search by title or company..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 focus:ring-2 focus:ring-primary-500 outline-none transition-all"
                        />
                    </div>
                </div>

                {loading ? (
                    <div className="p-20 flex flex-col items-center justify-center gap-4">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
                        <p className="text-gray-500">Loading postings...</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-gray-50 dark:bg-gray-900/50 border-b border-gray-100 dark:border-gray-700">
                                <tr>
                                    <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Job Information</th>
                                    <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Details</th>
                                    <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest text-center">Status</th>
                                    <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50 dark:divide-gray-800">
                                {filteredJobs.length === 0 ? (
                                    <tr>
                                        <td colSpan={4} className="p-10 text-center text-gray-400 italic">No job postings found.</td>
                                    </tr>
                                ) : (
                                    filteredJobs.map((job) => (
                                        <tr key={job.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-900/30 transition-colors">
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 rounded-xl bg-primary-50 dark:bg-primary-900/20 text-primary-600 flex items-center justify-center font-bold">
                                                        <Briefcase size={20} />
                                                    </div>
                                                    <div>
                                                        <p className="font-bold text-gray-900 dark:text-white uppercase tracking-tight">{job.title}</p>
                                                        <p className="text-xs text-gray-500 flex items-center gap-1">
                                                            <Building2 size={12} /> {job.company}
                                                        </p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="space-y-1">
                                                    <div className="text-xs font-medium text-gray-900 dark:text-gray-100 flex items-center gap-1.5">
                                                        <MapPin className="w-3 h-3 text-gray-400" />
                                                        {job.location || 'Remote'}
                                                    </div>
                                                    <div className="text-[10px] text-gray-500 flex items-center gap-1.5 font-bold uppercase tracking-wider">
                                                        <Clock className="w-3 h-3" />
                                                        {job.type}
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                <span className={clsx(
                                                    "inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider",
                                                    job.status === 'Open' ? "bg-green-100 text-green-700" :
                                                    job.status === 'Filled' ? "bg-blue-100 text-blue-700" :
                                                    "bg-gray-100 text-gray-400"
                                                )}>
                                                    {job.status}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <div className="flex items-center justify-end gap-2">
                                                    <button 
                                                        onClick={() => {
                                                            setEditingJob(job);
                                                            setIsModalOpen(true);
                                                        }}
                                                        className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 transition-colors"
                                                    >
                                                        <Edit className="w-4 h-4" />
                                                    </button>
                                                    <button 
                                                        onClick={() => handleDelete(job.id)}
                                                        className="p-2 rounded-lg text-red-500 hover:bg-red-50 transition-colors"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            <JobPostingModal 
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSuccess={() => {
                    setIsModalOpen(false);
                    fetchJobs();
                }}
                editingJob={editingJob}
            />
        </div>
    );
}
