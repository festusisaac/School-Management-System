import { useState, useEffect } from 'react';
import { useSystem } from '../../context/SystemContext';
import { 
    GraduationCap, 
    MapPin, 
    Briefcase, 
    ArrowRight, 
    Users,
    Award,
    Heart,
    Globe,
    BookOpen
} from 'lucide-react';
import api, { getFileUrl } from '../../services/api';
import LoadingScreen from '../../components/common/LoadingScreen';

const AlumniPage = () => {
    const { settings } = useSystem();
    const [featuredAlumni, setFeaturedAlumni] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const data = await api.getPublicFeaturedAlumni();
                setFeaturedAlumni(data);
            } catch (error) {
                console.error('Failed to fetch featured alumni:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
        window.scrollTo(0, 0);
    }, []);

    const schoolName = settings?.schoolName || 'PHJC School';

    if (loading) {
        return <LoadingScreen message="Loading Alumni Stories..." />;
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
                            <GraduationCap className="w-4 h-4 text-primary-600" />
                            <span className="text-xs font-bold text-primary-900 dark:text-primary-100 uppercase tracking-widest leading-none">Alumni Network</span>
                        </div>

                        <h1 className="text-5xl md:text-7xl font-heading font-black text-slate-900 dark:text-white leading-tight tracking-tight">
                            Beyond the <br />
                            <span className="text-primary-600">Classroom Walls.</span>
                        </h1>

                        <p className="text-lg md:text-xl text-slate-600 dark:text-slate-400 font-medium leading-relaxed max-w-2xl">
                            Our alumni are a testament to the excellence nurtured at {schoolName}. From leading corporations to transforming communities, they carry our values into the world.
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
                                <Globe size={24} />
                            </div>
                            <h3 className="text-xl font-black text-slate-900 dark:text-white">Global Presence</h3>
                            <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">Our graduates are making impact across multiple countries and industries worldwide.</p>
                        </div>
                        <div className="space-y-4">
                            <div className="w-12 h-12 bg-amber-50 dark:bg-amber-900/20 rounded-2xl flex items-center justify-center text-amber-600">
                                <Heart size={24} />
                            </div>
                            <h3 className="text-xl font-black text-slate-900 dark:text-white">Mentorship</h3>
                            <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">Active alumni mentors guide current students through career choices and personal growth.</p>
                        </div>
                        <div className="space-y-4">
                            <div className="w-12 h-12 bg-emerald-50 dark:bg-emerald-900/20 rounded-2xl flex items-center justify-center text-emerald-600">
                                <BookOpen size={24} />
                            </div>
                            <h3 className="text-xl font-black text-slate-900 dark:text-white">Lifelong Learning</h3>
                            <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">Our network encourages continuous growth through workshops, reunions, and knowledge sharing.</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Featured Alumni */}
            <section className="py-24">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-16">
                        <div className="space-y-4">
                            <h2 className="text-3xl md:text-5xl font-heading font-black text-slate-900 dark:text-white leading-tight">Distinguished Alumni</h2>
                            <div className="h-1.5 w-20 bg-primary-600 rounded-full"></div>
                        </div>
                        <p className="text-slate-500 dark:text-slate-400 max-w-md text-sm leading-relaxed">
                            Spotlighting exceptional individuals who have passed through our halls and are making significant strides in their fields.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
                        {featuredAlumni.length === 0 ? (
                            <div className="col-span-full text-center py-20 bg-slate-50 dark:bg-slate-900/50 rounded-[3rem] border-2 border-dashed border-slate-100 dark:border-slate-800">
                                <div className="w-20 h-20 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center text-slate-300 dark:text-slate-600 mx-auto mb-6">
                                    <GraduationCap size={40} />
                                </div>
                                <h3 className="text-xl font-bold text-slate-900 dark:text-white">Coming Soon</h3>
                                <p className="text-slate-500 dark:text-slate-400 mt-2">Check back soon for our latest alumni spotlights.</p>
                            </div>
                        ) : (
                            featuredAlumni.map((alumnus) => (
                                <div key={alumnus.id} className="group bg-white dark:bg-slate-900 rounded-[2.5rem] p-5 shadow-sm hover:shadow-2xl transition-all duration-700 border border-slate-100 dark:border-slate-800 flex flex-col h-full">
                                    <div className="relative h-64 mb-6 overflow-hidden rounded-[1.5rem]">
                                        <img 
                                            src={alumnus.student?.studentPhoto ? getFileUrl(alumnus.student.studentPhoto) : `https://ui-avatars.com/api/?name=${alumnus.student?.firstName}+${alumnus.student?.lastName}&size=400&background=e2e8f0&color=64748b&font-size=0.4&bold=true`} 
                                            alt={alumnus.student?.firstName}
                                            className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110"
                                        />
                                        <div className="absolute top-4 left-4">
                                            <span className="bg-primary-600/90 backdrop-blur-md px-3 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-widest text-white shadow-sm">
                                                Class of {alumnus.graduationYear}
                                            </span>
                                        </div>
                                        {alumnus.isMentorshipAvailable && (
                                            <div className="absolute top-4 right-4 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md p-2 rounded-xl text-amber-500 shadow-sm">
                                                <Heart size={16} fill="currentColor" />
                                            </div>
                                        )}
                                    </div>

                                    <div className="flex flex-col flex-grow px-2 space-y-4">
                                        <h4 className="text-xl font-heading font-black text-slate-900 dark:text-white leading-tight group-hover:text-primary-600 transition-colors">
                                            {alumnus.student?.firstName} {alumnus.student?.lastName}
                                        </h4>

                                        <div className="space-y-2">
                                            <div className="flex items-center gap-2 text-sm font-bold text-slate-700 dark:text-slate-300">
                                                <Briefcase size={14} className="text-primary-600" />
                                                {alumnus.currentOccupation || 'Professional'}
                                            </div>
                                            <div className="flex items-center gap-2 text-xs font-medium text-slate-500 dark:text-slate-400">
                                                <MapPin size={14} />
                                                {alumnus.location || 'Global'}
                                            </div>
                                        </div>
                                        
                                        <p className="text-sm text-slate-500 dark:text-slate-400 line-clamp-3 leading-relaxed flex-grow">
                                            {alumnus.achievements || `${alumnus.student?.firstName} is a dedicated professional carrying forward the values of excellence and service.`}
                                        </p>

                                        {alumnus.isMentorshipAvailable && (
                                            <div className="mt-auto pt-4 border-t border-slate-50 dark:border-slate-800">
                                                <span className="text-[10px] font-bold text-amber-600 uppercase tracking-widest flex items-center gap-2">
                                                    <Award size={14} /> Available for Mentorship
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section className="py-24 bg-slate-900 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary-600/10 rounded-full blur-[120px] -translate-y-1/2 translate-x-1/2"></div>
                <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-indigo-600/10 rounded-full blur-[120px] translate-y-1/2 -translate-x-1/2"></div>

                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
                    <div className="flex flex-col lg:flex-row gap-16 items-center">
                        <div className="lg:w-1/2 space-y-10">
                            <div className="space-y-4">
                                <h2 className="text-primary-400 font-bold text-xs uppercase tracking-widest leading-none">Join Our Network</h2>
                                <h3 className="text-4xl md:text-5xl font-heading font-black text-white leading-tight">The Alumni Mentorship Circle</h3>
                            </div>

                            <div className="space-y-6">
                                {[
                                    { icon: Users, title: 'Connect & Grow', text: 'Build meaningful relationships with fellow alumni who share your values and vision.' },
                                    { icon: Award, title: 'Give Back', text: 'Mentor current students and help shape the next generation of leaders from our institution.' },
                                    { icon: Globe, title: 'Stay Connected', text: 'Attend reunions, networking events, and workshops organized exclusively for our alumni community.' }
                                ].map((item, idx) => (
                                    <div key={idx} className="flex gap-6 p-6 bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl hover:bg-white/10 transition-all group">
                                        <div className="shrink-0 w-12 h-12 bg-primary-600 rounded-xl flex items-center justify-center text-white shadow-lg group-hover:scale-110 transition-transform">
                                            <item.icon size={24} />
                                        </div>
                                        <div>
                                            <h4 className="text-lg font-bold text-white mb-1 leading-none">{item.title}</h4>
                                            <p className="text-sm text-slate-400 group-hover:text-slate-300 transition-colors leading-relaxed">{item.text}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="lg:w-1/2 bg-white/5 backdrop-blur-xl border border-white/10 rounded-[3rem] p-10 md:p-16 space-y-10 text-center relative overflow-hidden group">
                            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-primary-500 to-transparent opacity-50"></div>
                            <div className="w-20 h-20 bg-primary-600 rounded-3xl flex items-center justify-center text-white mx-auto shadow-2xl shadow-primary-500/30 group-hover:scale-110 transition-transform duration-500">
                                <GraduationCap size={40} />
                            </div>
                            <div className="space-y-4">
                                <h4 className="text-2xl font-black text-white uppercase tracking-tight">Are You An Alumnus?</h4>
                                <p className="text-slate-400 text-lg leading-relaxed">Whether you graduated recently or decades ago, you are always a part of our family. Reconnect and help us build a stronger community.</p>
                            </div>
                            <div className="pt-6">
                                <a
                                    href="/admission"
                                    className="inline-flex items-center gap-2 bg-white text-slate-900 px-10 py-4 rounded-2xl font-black text-base hover:bg-primary-50 transition-all active:scale-95 shadow-xl shadow-white/10"
                                >
                                    Get In Touch <ArrowRight size={20} />
                                </a>
                            </div>
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
};

export default AlumniPage;
