import { useState, useEffect } from 'react';
import { 
    Search, Briefcase, Building2, MapPin, 
    ExternalLink, Filter, Clock, DollarSign,
    ChevronRight, ArrowRight
} from 'lucide-react';
import api from '../../../services/api';
import { useToast } from '../../../context/ToastContext';
import { format } from 'date-fns';
import { clsx } from 'clsx';

export default function JobBoard() {
    const [jobs, setJobs] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedType, setSelectedType] = useState('All Types');
    const toast = useToast();

    useEffect(() => {
        fetchJobs();
    }, []);

    const fetchJobs = async () => {
        setLoading(true);
        try {
            const data = await api.getPublicJobPostings();
            setJobs(data);
        } catch (error) {
            console.error("Failed to fetch jobs", error);
            toast.showError("Failed to load job listings");
        } finally {
            setLoading(false);
        }
    };

    const filteredJobs = jobs.filter(job => {
        const matchesSearch = job.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            job.company.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesType = selectedType === 'All Types' || job.type === selectedType;
        return matchesSearch && matchesType;
    });

    const jobTypes = ['All Types', 'Full-time', 'Part-time', 'Internship', 'Contract', 'Freelance'];

    return (
        <div className="space-y-8 p-4 sm:p-6 lg:p-8 bg-gray-50/50 dark:bg-transparent min-h-screen">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
                        Career Center
                    </h1>
                    <p className="text-gray-500 dark:text-gray-400 mt-2">Discover opportunities tailored for our alumni network</p>
                </div>
                
                <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
                    <div className="relative flex-1 sm:w-80">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search jobs..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-900 focus:ring-2 focus:ring-primary-500 outline-none transition-all shadow-sm"
                        />
                    </div>
                    <select
                        value={selectedType}
                        onChange={(e) => setSelectedType(e.target.value)}
                        className="px-4 py-2.5 rounded-xl border border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-900 focus:ring-2 focus:ring-primary-500 outline-none transition-all shadow-sm text-sm font-medium"
                    >
                        {jobTypes.map(type => <option key={type} value={type}>{type}</option>)}
                    </select>
                </div>
            </div>

            {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {[1, 2, 3, 4].map(i => (
                        <div key={i} className="h-48 bg-gray-200/50 dark:bg-gray-800 animate-pulse rounded-2xl"></div>
                    ))}
                </div>
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {filteredJobs.length === 0 ? (
                        <div className="lg:col-span-2 py-20 text-center bg-white dark:bg-gray-800 rounded-3xl border-2 border-dashed border-gray-100 dark:border-gray-700">
                            <Briefcase className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                            <h3 className="text-lg font-bold text-gray-900 dark:text-white">No opportunities found</h3>
                            <p className="text-gray-500">Try adjusting your search or filters</p>
                        </div>
                    ) : (
                        filteredJobs.map((job) => (
                            <div key={job.id} className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 hover:shadow-md transition-all group flex flex-col justify-between">
                                <div className="space-y-4">
                                    <div className="flex items-start justify-between">
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 rounded-2xl bg-primary-50 dark:bg-primary-900/20 text-primary-600 flex items-center justify-center">
                                                <Building2 size={24} />
                                            </div>
                                            <div>
                                                <h3 className="text-lg font-bold text-gray-900 dark:text-white group-hover:text-primary-600 transition-colors uppercase tracking-tight">
                                                    {job.title}
                                                </h3>
                                                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">{job.company}</p>
                                            </div>
                                        </div>
                                        <span className="px-3 py-1 bg-gray-50 dark:bg-gray-700 rounded-lg text-[10px] font-black uppercase tracking-widest text-gray-500">
                                            {job.type}
                                        </span>
                                    </div>

                                    <div className="flex flex-wrap gap-4 text-xs font-medium text-gray-500">
                                        <div className="flex items-center gap-1.5">
                                            <MapPin size={14} className="text-gray-400" />
                                            {job.location || 'Remote'}
                                        </div>
                                        {job.salaryRange && (
                                            <div className="flex items-center gap-1.5">
                                                <DollarSign size={14} className="text-gray-400" />
                                                {job.salaryRange}
                                            </div>
                                        )}
                                        <div className="flex items-center gap-1.5 ml-auto">
                                            <Clock size={14} className="text-gray-400" />
                                            Posted {format(new Date(job.postedDate), 'MMM d, yyyy')}
                                        </div>
                                    </div>

                                    <div className="pt-2">
                                        <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-3 leading-relaxed">
                                            {job.description}
                                        </p>
                                    </div>
                                </div>

                                <div className="mt-6 pt-4 border-t border-gray-50 dark:border-gray-700 flex items-center justify-between">
                                    <div className="flex -space-x-2">
                                        {[1, 2, 3].map(i => (
                                            <div key={i} className="w-6 h-6 rounded-full border-2 border-white dark:border-gray-800 bg-gray-200"></div>
                                        ))}
                                        <span className="text-[10px] font-bold text-gray-400 ml-4 self-center uppercase tracking-tighter">Matched for you</span>
                                    </div>
                                    <a 
                                        href={job.applicationUrl?.startsWith('http') ? job.applicationUrl : `mailto:${job.applicationUrl}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex items-center gap-2 text-primary-600 font-bold text-xs uppercase tracking-wider hover:gap-3 transition-all"
                                    >
                                        Apply Now
                                        <ArrowRight size={14} />
                                    </a>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            )}
        </div>
    );
}
