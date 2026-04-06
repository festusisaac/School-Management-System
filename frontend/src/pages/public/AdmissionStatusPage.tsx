import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Search, ChevronRight, CheckCircle2, Clock, XCircle, FileText, ArrowLeft, Loader2, Download } from 'lucide-react';
import api from '../../services/api';
import { useToast } from '../../context/ToastContext';
import { twMerge } from 'tailwind-merge';
import AdmissionLetterTemplate from '../../components/students/AdmissionLetterTemplate';
import { downloadPDF } from '../../utils/pdfGenerator';

const AdmissionStatusPage = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const toast = useToast();
    const [ref, setRef] = useState((location.state as any)?.referenceNumber || '');
    const [loading, setLoading] = useState(false);
    const [downloading, setDownloading] = useState(false);
    const [application, setApplication] = useState<any>(null);
    const letterRef = React.useRef<HTMLDivElement>(null);

    const handleCheck = async (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        if (!ref) {
            toast.showWarning("Please enter a reference number.");
            return;
        }

        setLoading(true);
        try {
            const result = await api.getOnlineAdmissionStatus(ref);
            setApplication(result);
        } catch (error) {
            toast.showError("Application not found. Please check the reference number.");
            setApplication(null);
        } finally {
            setLoading(false);
        }
    };

    const handleDownloadLetter = async () => {
        if (!letterRef.current || !application) return;
        setDownloading(true);
        try {
            await downloadPDF(letterRef.current, {
                filename: `admission-letter-${application.referenceNumber.replace(/\//g, '-')}.pdf`
            });
            toast.showSuccess("Admission letter downloaded!");
        } catch (error) {
            toast.showError("Failed to generate PDF. Please try again.");
        } finally {
            setDownloading(false);
        }
    };

    const getStatusInfo = (status: string) => {
        switch (status) {
            case 'approved': return { color: 'text-emerald-500', bg: 'bg-emerald-50 dark:bg-emerald-900/20', icon: CheckCircle2, text: 'Your application has been approved!' };
            case 'rejected': return { color: 'text-rose-500', bg: 'bg-rose-50 dark:bg-rose-900/20', icon: XCircle, text: 'We regret to inform you that your application was rejected.' };
            default: return { color: 'text-amber-500', bg: 'bg-amber-50 dark:bg-amber-900/20', icon: Clock, text: 'Your application is currently under review.' };
        }
    };

    return (
        <div className="flex items-center justify-center p-4 lg:p-8 min-h-[calc(100vh-80px)]">
            <div className="max-w-xl w-full space-y-6">
                <button 
                    onClick={() => navigate('/admission')} 
                    className="flex items-center gap-2 text-slate-400 hover:text-primary-600 dark:text-slate-500 dark:hover:text-primary-400 transition-all font-bold text-[11px] uppercase tracking-wider group"
                >
                    <ArrowLeft className="w-3.5 h-3.5 transition-transform group-hover:-translate-x-1" /> Back to Admission
                </button>

                <div className="bg-white dark:bg-slate-900 rounded-[2rem] border border-slate-100 dark:border-slate-800 shadow-xl shadow-slate-200/50 dark:shadow-none p-8 md:p-10 space-y-8">
                    <div className="text-center space-y-2">
                        <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">Track Your Status</h1>
                        <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">Enter your unique application reference number.</p>
                    </div>

                    <form onSubmit={handleCheck} className="space-y-4">
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest ml-1">Reference Number</label>
                            <input 
                                type="text" 
                                placeholder="e.g. ADM/2026/0001" 
                                value={ref}
                                onChange={(e) => setRef(e.target.value.toUpperCase())}
                                className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-4 py-2.5 text-sm font-medium focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all uppercase placeholder:font-sans placeholder:tracking-normal"
                            />
                        </div>
                        <button 
                            type="submit"
                            disabled={loading || !ref}
                            className="w-full flex items-center justify-center gap-2 px-6 py-2.5 bg-primary-600 hover:bg-primary-700 text-white rounded-lg font-bold text-sm transition-all shadow-md active:scale-[0.98] disabled:opacity-50"
                        >
                            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                            Track Application
                        </button>
                    </form>

                    {application && (
                        <div className="p-6 bg-slate-50/50 dark:bg-slate-950/50 border border-slate-100 dark:border-slate-800 rounded-2xl space-y-6 animate-in slide-in-from-top-4 duration-500">
                            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
                                <h3 className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em]">Application Summary</h3>
                                <div className="px-3 py-1 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-lg text-[10px] font-mono font-bold text-primary-600">
                                    {application.referenceNumber}
                                </div>
                            </div>

                            <div className="flex flex-col items-center text-center space-y-4">
                                <div className={twMerge("p-4 rounded-2xl shadow-sm animate-bounce", getStatusInfo(application.status).bg)}>
                                    {React.createElement(getStatusInfo(application.status).icon, { className: twMerge("w-8 h-8", getStatusInfo(application.status).color) })}
                                </div>
                                <div className="space-y-1">
                                    <h4 className="text-xl font-black text-slate-900 dark:text-white capitalize">{application.firstName} {application.lastName}</h4>
                                    <p className={twMerge("text-xs font-bold tracking-tight uppercase px-4 py-1 rounded-full bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 inline-block", getStatusInfo(application.status).color)}>
                                        {getStatusInfo(application.status).text}
                                    </p>
                                </div>
                            </div>

                            {application.status === 'approved' && (
                                <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-200">
                                    {/* Credentials Box */}
                                    <div className="bg-emerald-50/50 dark:bg-emerald-900/10 border border-emerald-100 dark:border-emerald-800/20 rounded-2xl p-6 text-center space-y-4">
                                        <div className="space-y-1">
                                            <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest">School Admission Number</span>
                                            <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400 font-mono tracking-tighter">
                                                {application.finalAdmissionNo || "Generating..."}
                                            </div>
                                        </div>
                                        
                                        <div className="h-px bg-emerald-100/50 dark:bg-emerald-800/20 mx-4" />

                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-1">
                                                <span className="text-[9px] font-black uppercase text-slate-400 tracking-widest block">Username</span>
                                                <span className="text-xs font-bold text-slate-700 dark:text-slate-300 truncate block px-2">
                                                    {application.finalAdmissionNo}
                                                </span>
                                            </div>
                                            <div className="space-y-1 border-l border-emerald-100 dark:border-emerald-800/20">
                                                <span className="text-[9px] font-black uppercase text-slate-400 tracking-widest block">Password</span>
                                                <span className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
                                                    Student@{application.finalAdmissionNo?.split('/').pop() || '****'}
                                                </span>
                                            </div>
                                        </div>
                                        
                                        <p className="text-[10px] text-emerald-600/70 dark:text-emerald-400/60 font-medium">
                                            * You will be required to change this password on your first login for security.
                                        </p>
                                    </div>

                                    <div className="flex flex-col sm:flex-row gap-3">
                                        <button 
                                            onClick={handleDownloadLetter}
                                            disabled={downloading}
                                            className="flex-1 py-3 bg-white dark:bg-slate-900 border-2 border-emerald-600 dark:border-emerald-500 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 rounded-xl font-bold flex items-center justify-center gap-2 transition-all active:scale-[0.98] disabled:opacity-50 text-sm"
                                        >
                                            {downloading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                                            Admission Letter
                                        </button>
                                        <button 
                                            onClick={() => navigate('/login')}
                                            className="flex-2 sm:flex-[2] py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold flex items-center justify-center gap-2 transition-all shadow-lg shadow-emerald-200 dark:shadow-none active:scale-[0.98] text-sm group"
                                        >
                                            Go to Student Portal
                                            <ChevronRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                                        </button>
                                    </div>
                                </div>
                            )}

                            <div className="pt-2 grid grid-cols-2 gap-6 border-t border-slate-100 dark:border-slate-800">
                                <div className="space-y-1">
                                    <span className="block text-[10px] font-black uppercase text-slate-400 tracking-wider">Applied Date</span>
                                    <span className="text-sm font-bold text-slate-900 dark:text-white">{new Date(application.createdAt).toLocaleDateString()}</span>
                                </div>
                                <div className="space-y-1">
                                    <span className="block text-[10px] font-black uppercase text-slate-400 tracking-wider">Target Class</span>
                                    <span className="text-sm font-bold text-slate-900 dark:text-white">{application.preferredClass?.name || 'N/A'}</span>
                                </div>
                            </div>
                        </div>
                    )}

                    {!application && !loading && (
                        <div className="p-5 bg-blue-50/50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-900/20 rounded-2xl flex gap-3">
                            <div className="p-2 bg-white dark:bg-slate-900 rounded-lg text-blue-500 shadow-sm shrink-0">
                                <FileText className="w-4 h-4" />
                            </div>
                            <p className="text-[12px] text-blue-800 dark:text-blue-300 leading-relaxed font-medium mt-0.5">
                                If you can't find your reference number, please search your email inbox or contact the school's admin office for assistance.
                            </p>
                        </div>
                    )}
                </div>
            </div>

            {/* Hidden template for PDF generation */}
            {application && application.status === 'approved' && (
                <AdmissionLetterTemplate ref={letterRef} application={application} />
            )}
        </div>
    );
};

export default AdmissionStatusPage;
