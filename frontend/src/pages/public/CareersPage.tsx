import { useState, useEffect } from 'react';
import { useSystem } from '../../context/SystemContext';
import { 
    Briefcase, 
    Building2, 
    MapPin, 
    ArrowRight, 
    Search,
    Clock,
    Globe,
    Users,
    Award,
    Target,
    ChevronRight,
    Banknote
} from 'lucide-react';
import api from '../../services/api';
import LoadingScreen from '../../components/common/LoadingScreen';
import { format } from 'date-fns';

const CareersPage = () => {
    const { settings } = useSystem();
    const [jobs, setJobs] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        const fetchData = async () => {
            try {
                const data = await api.getPublicJobPostings();
                setJobs(data);
            } catch (error) {
                console.error('Failed to fetch job postings:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
        window.scrollTo(0, 0);
    }, []);

    const schoolName = settings?.schoolName || 'PHJC School';

    const filteredJobs = jobs.filter(job => 
        job.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        job.company.toLowerCase().includes(searchQuery.toLowerCase())
    );

    if (loading) {
        return <LoadingScreen message="Finding Opportunities..." />;
    }

    return (
        <div className="min-h-screen bg-white dark:bg-slate-950 transition-colors duration-500">
            {/* Hero Section */}
            <section className="relative py-24 md:py-32 overflow-hidden">
                <div className="absolute inset-0 bg-slate-50 dark:bg-slate-900/50 -z-10"></div>
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary-600 via-secondary-500 to-primary-600"></div>

                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
                    <div className="max-w-3xl space-y-8 animate-in fade-in slide-in-from-bottom-5 duration-1000">
                        <div className="inline-flex items-center gap-3 px-4 py-2 bg-primary-50 dark:bg-primary-900/20 rounded-xl border border-primary-100 dark:border-primary-800/20">
                            <Briefcase className="w-4 h-4 text-primary-600" />
                            <span className="text-xs font-bold text-primary-900 dark:text-primary-100 uppercase tracking-widest leading-none">Career Center</span>
                        </div>

                        <h1 className="text-5xl md:text-7xl font-heading font-black text-slate-900 dark:text-white leading-tight tracking-tight">
                            Your Next <br />
                            <span className="text-primary-600">Great Opportunity.</span>
                        </h1>

                        <p className="text-lg md:text-xl text-slate-600 dark:text-slate-400 font-medium leading-relaxed max-w-2xl">
                            Connecting {schoolName} alumni and community members with career opportunities. Find your next role within our network.
                        </p>
                    </div>
                </div>
            </section>

            {/* Values Section */}
            <section className="py-20 border-y border-slate-100 dark:border-slate-800 transition-colors">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="grid md:grid-cols-3 gap-12">
                        <div className="space-y-4">
                            <div className="w-12 h-12 bg-blue-50 dark:bg-blue-900/20 rounded-2xl flex items-center justify-center text-blue-600">
                                <Target size={24} />
                            </div>
                            <h3 className="text-xl font-black text-slate-900 dark:text-white">Curated Roles</h3>
                            <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">Every position is vetted and relevant to our alumni community's diverse skill sets and aspirations.</p>
                        </div>
                        <div className="space-y-4">
                            <div className="w-12 h-12 bg-amber-50 dark:bg-amber-900/20 rounded-2xl flex items-center justify-center text-amber-600">
                                <Users size={24} />
                            </div>
                            <h3 className="text-xl font-black text-slate-900 dark:text-white">Network First</h3>
                            <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">Leverage the strength of our alumni network for referrals, introductions, and insider knowledge.</p>
                        </div>
                        <div className="space-y-4">
                            <div className="w-12 h-12 bg-emerald-50 dark:bg-emerald-900/20 rounded-2xl flex items-center justify-center text-emerald-600">
                                <Award size={24} />
                            </div>
                            <h3 className="text-xl font-black text-slate-900 dark:text-white">Career Growth</h3>
                            <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">From entry-level positions to executive roles, find opportunities that match your career stage.</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Job Listings */}
            <section className="py-24">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    {/* Search & Header */}
                    <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] p-6 lg:p-8 shadow-sm border border-slate-100 dark:border-slate-800 mb-16 flex flex-col lg:flex-row items-center justify-between gap-8">
                        <div className="relative w-full lg:max-w-md group">
                            <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary-600 transition-colors" size={20} />
                            <input 
                                type="text" 
                                placeholder="Search by role or company..." 
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-14 pr-8 py-4 bg-slate-50 dark:bg-slate-950 border-none rounded-2xl focus:ring-2 focus:ring-primary-500 transition-all font-medium text-slate-700 dark:text-slate-300" 
                            />
                        </div>
                        <div className="flex items-center gap-4 text-slate-500 dark:text-slate-400 font-bold text-sm">
                            <Globe size={18} className="text-primary-600" />
                            Showing {filteredJobs.length} {filteredJobs.length === 1 ? 'position' : 'positions'}
                        </div>
                    </div>

                    {/* Job Cards */}
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-10">
                        {filteredJobs.length === 0 ? (
                            <div className="col-span-full text-center py-20 bg-slate-50 dark:bg-slate-900/50 rounded-[3rem] border-2 border-dashed border-slate-100 dark:border-slate-800">
                                <div className="w-20 h-20 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center text-slate-300 dark:text-slate-600 mx-auto mb-6">
                                    <Briefcase size={40} />
                                </div>
                                <h3 className="text-xl font-bold text-slate-900 dark:text-white">No positions found</h3>
                                <p className="text-slate-500 dark:text-slate-400 mt-2">Try a different search term or check back later for new openings.</p>
                            </div>
                        ) : (
                            filteredJobs.map((job) => (
                                <div key={job.id} className="group bg-white dark:bg-slate-900 rounded-[2.5rem] p-5 shadow-sm hover:shadow-2xl transition-all duration-700 border border-slate-100 dark:border-slate-800 flex flex-col h-full">
                                    {/* Card Header */}
                                    <div className="flex items-start justify-between gap-4 px-3 pt-3 mb-6">
                                        <div className="w-12 h-12 rounded-2xl bg-primary-50 dark:bg-primary-900/20 flex items-center justify-center text-primary-600 group-hover:scale-110 transition-transform duration-500">
                                            <Building2 size={24} />
                                        </div>
                                        <span className="px-3 py-1 bg-primary-50 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 rounded-lg text-[10px] font-extrabold uppercase tracking-widest border border-primary-100/50">
                                            {job.type}
                                        </span>
                                    </div>

                                    {/* Card Body */}
                                    <div className="flex flex-col flex-grow px-3 space-y-4">
                                        <h4 className="text-xl font-heading font-black text-slate-900 dark:text-white leading-tight group-hover:text-primary-600 transition-colors">
                                            {job.title}
                                        </h4>

                                        <div className="space-y-2">
                                            <div className="flex items-center gap-2 text-sm font-bold text-slate-600 dark:text-slate-300">
                                                <Building2 size={14} className="text-slate-400" />
                                                {job.company}
                                            </div>
                                            <div className="flex items-center gap-2 text-xs font-medium text-slate-500 dark:text-slate-400">
                                                <MapPin size={14} />
                                                {job.location || 'Remote'}
                                            </div>
                                            {job.salaryRange && (
                                                <div className="flex items-center gap-2 text-xs font-medium text-slate-500 dark:text-slate-400">
                                                    <Banknote size={14} />
                                                    {settings?.currencySymbol || '₦'} {job.salaryRange}
                                                </div>
                                            )}
                                        </div>

                                        {job.description && (
                                            <p className="text-sm text-slate-500 dark:text-slate-400 line-clamp-3 leading-relaxed flex-grow">
                                                {job.description}
                                            </p>
                                        )}
                                    </div>

                                    {/* Card Footer */}
                                    <div className="mt-6 px-3 pt-5 border-t border-slate-50 dark:border-slate-800 flex items-center justify-between">
                                        <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                                            <Clock size={12} />
                                            {format(new Date(job.postedDate), 'MMM d, yyyy')}
                                        </div>
                                        <a 
                                            href={job.applicationUrl?.startsWith('http') ? job.applicationUrl : `mailto:${job.applicationUrl}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-xs font-bold text-primary-600 flex items-center gap-1 group-hover:gap-2 transition-all"
                                        >
                                            Apply <ChevronRight size={14} />
                                        </a>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </section>
        </div>
    );
};

export default CareersPage;
