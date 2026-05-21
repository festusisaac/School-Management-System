import React, { useState, useEffect, useMemo } from 'react';
import { Heart, Target, Users, TrendingUp, ArrowRight, ShieldCheck, Zap, Globe, Award, DollarSign, Clock, X, Image as ImageIcon } from 'lucide-react';
import { useToast } from '../../context/ToastContext';
import { useSystem } from '../../context/SystemContext';
import api, { getFileUrl } from '../../services/api';
import LoadingScreen from '../../components/common/LoadingScreen';
import { usePaystackPayment } from 'react-paystack';
import { useFlutterwave, closePaymentModal } from 'flutterwave-react-v3';

interface Project {
    id: string;
    title: string;
    description: string;
    goalAmount: number;
    currentAmount: number;
    endDate?: string;
    bannerImage?: string;
}

const PublicDonations = () => {
    const { settings } = useSystem();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [projects, setProjects] = useState<Project[]>([]);
    const [stats, setStats] = useState({ totalRaised: 0, donorCount: 0 });
    const [loading, setLoading] = useState(true);
    const [isDonating, setIsDonating] = useState(false);
    const [selectedProject, setSelectedProject] = useState<Project | null>(null);
    const { showSuccess, showError } = useToast();

    // Form state
    const [formData, setFormData] = useState({
        donorName: '',
        donorEmail: '',
        amount: '',
        gateway: 'paystack' as 'paystack' | 'flutterwave'
    });

    useEffect(() => {
        fetchData();
        window.scrollTo(0, 0);
    }, []);

    const fetchData = async () => {
        try {
            setLoading(true);
            const [projectsData, statsData] = await Promise.all([
                api.getPublicDonationProjects(),
                api.getPublicDonationStats()
            ]);
            setProjects(projectsData);
            setStats(statsData);
        } catch (error) {
            console.error("Failed to fetch donation data", error);
        } finally {
            setLoading(false);
        }
    };

    const [initiationResult, setInitiationResult] = useState<any>(null);

    const paystackConfig = useMemo(() => ({
        reference: initiationResult?.reference || `don_${Date.now()}`,
        email: initiationResult?.email || '',
        amount: Math.round((initiationResult?.amount || 0) * 100),
        publicKey: (import.meta.env.VITE_PAYSTACK_PUBLIC_KEY || settings?.paystackPublicKey) as string,
        currency: (settings?.currencyCode || 'NGN') as any,
        metadata: {
            ...initiationResult?.metadata,
            tenantId: initiationResult?.metadata?.tenantId,
        }
    }), [initiationResult, settings]);

    const flutterwaveConfig = useMemo(() => ({
        public_key: (import.meta.env.VITE_FLUTTERWAVE_PUBLIC_KEY || settings?.flutterwavePublicKey) as string,
        tx_ref: initiationResult?.reference || `don_${Date.now()}`,
        amount: initiationResult?.amount || 0,
        currency: (settings?.currencyCode || 'NGN') as any,
        payment_options: "card, banktransfer, ussd",
        customer: {
            email: initiationResult?.email || '',
            name: initiationResult?.metadata?.donorName || '',
            phone_number: '',
        },
        meta: initiationResult?.metadata || {},
        customizations: {
            title: settings?.schoolName || "School Donation",
            description: selectedProject ? `Donation for ${selectedProject.title}` : "General School Donation",
            logo: getFileUrl(settings?.primaryLogo || ""),
        },
    }), [initiationResult, settings, selectedProject]);

    const initializePaystack = usePaystackPayment(paystackConfig);
    const handleFlutterwavePayment = useFlutterwave(flutterwaveConfig);

    const handlePaymentSuccess = async (response: any, gateway: 'paystack' | 'flutterwave') => {
        try {
            await api.verifyDonation({
                reference: gateway === 'paystack' ? response.reference : response.transaction_id.toString(),
                gateway
            });
            showSuccess("Thank you for your generous donation!");
            setIsDonating(false);
            setFormData({ donorName: '', donorEmail: '', amount: '', gateway: 'paystack' });
            fetchData();
        } catch (error: any) {
            console.error("Verification error:", error);
            const message = error.response?.data?.message || "Failed to verify donation";
            showError(Array.isArray(message) ? message[0] : message);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handlePaymentClose = () => {
        showError("Transaction cancelled");
        setIsSubmitting(false);
    };

    useEffect(() => {
        if (initiationResult) {
            if (formData.gateway === 'paystack') {
                initializePaystack({ 
                    onSuccess: (res: any) => handlePaymentSuccess(res, 'paystack'), 
                    onClose: handlePaymentClose 
                });
            } else if (formData.gateway === 'flutterwave') {
                handleFlutterwavePayment({
                    callback: (data: any) => {
                        closePaymentModal();
                        handlePaymentSuccess(data, 'flutterwave');
                    },
                    onClose: handlePaymentClose,
                });
            }
            // Clear initiation result after triggering to prevent double popups
            setInitiationResult(null);
        }
    }, [initiationResult, formData.gateway, initializePaystack, handleFlutterwavePayment]);

    const handleInitiateDonation = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            const res = await api.initiateDonation({
                ...formData,
                amount: parseFloat(formData.amount),
                projectId: selectedProject?.id
            });

            const resultWithRef = {
                ...res,
                reference: res.reference || `don_${Date.now()}_${Math.floor(Math.random() * 1000)}`
            };
            
            setInitiationResult(resultWithRef);
        } catch (error: any) {
            console.error("Initiation error:", error);
            const message = error.response?.data?.message || "Failed to initiate donation";
            showError(Array.isArray(message) ? message[0] : message);
            setIsSubmitting(false);
        }
    };

    if (loading) {
        return <LoadingScreen message="Loading Impact Projects..." />;
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
                            <Heart className="w-4 h-4 text-primary-600" />
                            <span className="text-xs font-bold text-primary-900 dark:text-primary-100 uppercase tracking-widest leading-none">Support & Giving</span>
                        </div>

                        <h1 className="text-5xl md:text-7xl font-heading font-black text-slate-900 dark:text-white leading-tight tracking-tight">
                            Small Acts. <br />
                            <span className="text-primary-600">Big Impact.</span>
                        </h1>

                        <p className="text-lg md:text-xl text-slate-600 dark:text-slate-400 font-medium leading-relaxed max-w-2xl">
                            Join us in building a legacy of excellence. Your contributions directly fund critical school infrastructure, scholarships, and innovative learning programs.
                        </p>

                        <div className="flex flex-wrap gap-4 pt-4">
                            <button 
                                onClick={() => { setSelectedProject(null); setIsDonating(true); }}
                                className="px-8 py-4 bg-primary-600 text-white font-black rounded-2xl hover:bg-primary-700 transition-all shadow-xl shadow-primary-500/20 active:scale-95 flex items-center gap-2"
                            >
                                General Donation <ArrowRight size={20} />
                            </button>
                        </div>
                    </div>
                </div>
            </section>

            {/* Impact Counters */}
            <section className="py-20 border-y border-slate-100 dark:border-slate-800 transition-colors">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="grid md:grid-cols-3 gap-12 text-center md:text-left">
                        <div className="space-y-4">
                            <div className="w-12 h-12 bg-blue-50 dark:bg-blue-900/20 rounded-2xl flex items-center justify-center text-blue-600 mx-auto md:mx-0">
                                <DollarSign size={24} />
                            </div>
                            <h3 className="text-3xl font-black text-slate-900 dark:text-white">₦{(stats.totalRaised / 1000000).toFixed(1)}M+</h3>
                            <p className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">Total Community Giving</p>
                        </div>
                        <div className="space-y-4">
                            <div className="w-12 h-12 bg-amber-50 dark:bg-amber-900/20 rounded-2xl flex items-center justify-center text-amber-600 mx-auto md:mx-0">
                                <Users size={24} />
                            </div>
                            <h3 className="text-3xl font-black text-slate-900 dark:text-white">{stats.donorCount}+</h3>
                            <p className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">Global Donors</p>
                        </div>
                        <div className="space-y-4">
                            <div className="w-12 h-12 bg-emerald-50 dark:bg-emerald-900/20 rounded-2xl flex items-center justify-center text-emerald-600 mx-auto md:mx-0">
                                <ShieldCheck size={24} />
                            </div>
                            <h3 className="text-3xl font-black text-slate-900 dark:text-white">100%</h3>
                            <p className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">Transparency & Impact</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Project Listing */}
            <section className="py-24">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-16">
                        <div className="space-y-4">
                            <h2 className="text-3xl md:text-5xl font-heading font-black text-slate-900 dark:text-white leading-tight">Active Projects</h2>
                            <div className="h-1.5 w-20 bg-primary-600 rounded-full"></div>
                        </div>
                        <p className="text-slate-500 dark:text-slate-400 max-w-md text-sm leading-relaxed font-medium">
                            Support specific school initiatives. Choose a project that resonates with you and track its progress in real-time.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
                        {projects.length === 0 ? (
                            <div className="col-span-full text-center py-20 bg-slate-50 dark:bg-slate-900/50 rounded-[3rem] border-2 border-dashed border-slate-100 dark:border-slate-800">
                                <div className="w-20 h-20 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center text-slate-300 dark:text-slate-600 mx-auto mb-6">
                                    <Target size={40} />
                                </div>
                                <h3 className="text-xl font-bold text-slate-900 dark:text-white">No active projects</h3>
                                <p className="text-slate-500 dark:text-slate-400 mt-2">You can still support our general endowment fund.</p>
                            </div>
                        ) : (
                            projects.map((project) => {
                                const progress = Math.min((project.currentAmount / project.goalAmount) * 100, 100);
                                return (
                                    <div key={project.id} className="group bg-white dark:bg-slate-900 rounded-[2.5rem] p-5 shadow-sm hover:shadow-2xl transition-all duration-700 border border-slate-100 dark:border-slate-800 flex flex-col h-full">
                                        <div className="relative h-56 mb-6 overflow-hidden rounded-[1.5rem]">
                                            {project.bannerImage ? (
                                                <img 
                                                    src={getFileUrl(project.bannerImage)} 
                                                    alt={project.title}
                                                    className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110"
                                                />
                                            ) : (
                                                <div className="w-full h-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                                                    <ImageIcon className="w-12 h-12 text-slate-300 dark:text-slate-600" />
                                                </div>
                                            )}
                                            <div className="absolute top-4 left-4">
                                                <span className="bg-primary-600/90 backdrop-blur-md px-3 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-widest text-white shadow-sm">
                                                    Targeted Goal
                                                </span>
                                            </div>
                                        </div>

                                        <div className="flex flex-col flex-grow px-2 space-y-6">
                                            <h4 className="text-xl font-heading font-black text-slate-900 dark:text-white leading-tight group-hover:text-primary-600 transition-colors">
                                                {project.title}
                                            </h4>
                                            
                                            <p className="text-sm text-slate-500 dark:text-slate-400 line-clamp-3 leading-relaxed flex-grow font-medium">
                                                {project.description}
                                            </p>

                                            <div className="space-y-4 pt-4 border-t border-slate-50 dark:border-slate-800">
                                                <div className="space-y-2">
                                                    <div className="flex justify-between items-end">
                                                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Progress</span>
                                                        <span className="text-xs font-black text-slate-900 dark:text-white">{progress.toFixed(0)}%</span>
                                                    </div>
                                                    <div className="h-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                                                        <div 
                                                            className="h-full bg-primary-600 transition-all duration-1000 ease-out rounded-full shadow-[0_0_10px_rgba(37,99,235,0.3)]" 
                                                            style={{ width: `${progress}%` }}
                                                        ></div>
                                                    </div>
                                                </div>

                                                <div className="flex justify-between items-center text-xs">
                                                    <div>
                                                        <p className="font-bold text-slate-400 uppercase tracking-tighter mb-0.5 text-[9px]">Raised</p>
                                                        <p className="font-black text-slate-900 dark:text-white text-base">₦{Number(project.currentAmount).toLocaleString()}</p>
                                                    </div>
                                                    <div className="text-right">
                                                        <p className="font-bold text-slate-400 uppercase tracking-tighter mb-0.5 text-[9px]">Goal</p>
                                                        <p className="font-bold text-slate-500 text-sm">₦{Number(project.goalAmount).toLocaleString()}</p>
                                                    </div>
                                                </div>

                                                <button 
                                                    onClick={() => { setSelectedProject(project); setIsDonating(true); }}
                                                    className="w-full py-4 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-black text-sm rounded-2xl hover:bg-primary-600 hover:text-white transition-all active:scale-[0.98] flex items-center justify-center gap-2"
                                                >
                                                    Donate Now <Zap className="w-4 h-4 fill-current" />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>
                </div>
            </section>

            {/* Donation Modal */}
            {isDonating && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="absolute inset-0" onClick={() => setIsDonating(false)}></div>
                    <div className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-2xl shadow-2xl border border-slate-100 dark:border-slate-800 overflow-hidden animate-in zoom-in-95 duration-200 relative">
                        {/* Modal Header */}
                        <div className="flex items-center justify-between p-6 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50">
                            <div className="flex items-center gap-4">
                                <div className="p-2.5 bg-primary-50 dark:bg-primary-900/30 rounded-xl">
                                    <Heart className="w-5 h-5 text-primary-600" />
                                </div>
                                <div>
                                    <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                                        {selectedProject ? 'Support Project' : 'Make a Donation'}
                                    </h3>
                                    <p className="text-xs text-slate-500 dark:text-slate-400 font-medium truncate max-w-[200px]">
                                        {selectedProject ? selectedProject.title : 'Support our general fund'}
                                    </p>
                                </div>
                            </div>
                            <button 
                                onClick={() => setIsDonating(false)} 
                                className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-400 transition-colors"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Modal Body */}
                        <form onSubmit={handleInitiateDonation} className="p-6 space-y-5">
                            <div className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">Full Name</label>
                                        <input 
                                            required
                                            type="text" 
                                            placeholder="Your Name"
                                            value={formData.donorName}
                                            onChange={e => setFormData({...formData, donorName: e.target.value})}
                                            className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 rounded-xl focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 outline-none transition-all text-sm font-medium text-slate-900 dark:text-white"
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">Email Address</label>
                                        <input 
                                            required
                                            type="email" 
                                            placeholder="you@email.com"
                                            value={formData.donorEmail}
                                            onChange={e => setFormData({...formData, donorEmail: e.target.value})}
                                            className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 rounded-xl focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 outline-none transition-all text-sm font-medium text-slate-900 dark:text-white"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">Amount (₦)</label>
                                    <div className="relative">
                                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm font-bold text-slate-400">₦</span>
                                        <input 
                                            required
                                            type="number" 
                                            placeholder="Enter amount"
                                            value={formData.amount}
                                            onChange={e => setFormData({...formData, amount: e.target.value})}
                                            className="w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 rounded-xl focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 outline-none transition-all text-sm font-bold text-slate-900 dark:text-white"
                                        />
                                    </div>
                                    <div className="flex flex-wrap gap-2 pt-1">
                                        {[1000, 5000, 10000, 20000].map(val => (
                                            <button 
                                                key={val}
                                                type="button"
                                                onClick={() => setFormData({...formData, amount: val.toString()})}
                                                className="px-3 py-1.5 rounded-lg border border-slate-100 dark:border-slate-800 text-[10px] font-bold text-slate-500 hover:border-primary-500 hover:text-primary-600 transition-all"
                                            >
                                                ₦{val.toLocaleString()}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            <div className="p-4 bg-blue-50/50 dark:bg-blue-900/10 border border-blue-100/50 dark:border-blue-800/50 rounded-xl flex items-center gap-3">
                                <ShieldCheck className="w-5 h-5 text-primary-600 shrink-0" />
                                <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 leading-relaxed uppercase tracking-wider">
                                    Secure payment powered by encrypted gateway technology.
                                </p>
                            </div>

                            <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800/30 rounded-xl p-4 text-center mb-2">
                                <p className="text-[10px] font-bold text-amber-800 dark:text-amber-500 uppercase tracking-widest">
                                    Online donations are temporarily disabled pending payment gateway verification.
                                </p>
                            </div>

                            <button 
                                type="button"
                                disabled={true}
                                className="w-full py-4 bg-gray-300 dark:bg-gray-700 text-gray-500 font-bold text-xs uppercase tracking-widest rounded-xl flex items-center justify-center gap-2 cursor-not-allowed"
                            >
                                Temporarily Disabled
                                <ShieldCheck className="w-4 h-4" />
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default PublicDonations;
