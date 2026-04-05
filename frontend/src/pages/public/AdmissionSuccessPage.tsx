import { useLocation, useNavigate } from 'react-router-dom';
import { CheckCircle2, Copy, ArrowRight, Home, FileText } from 'lucide-react';
import { useToast } from '../../context/ToastContext';
import { useSystem } from '../../context/SystemContext';

const AdmissionSuccessPage = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const toast = useToast();
    const { settings } = useSystem();
    const { referenceNumber } = (location.state as { referenceNumber: string }) || { referenceNumber: 'ADM/2026/0000' };

    const copyToClipboard = () => {
        navigator.clipboard.writeText(referenceNumber);
        toast.showSuccess("Reference number copied!");
    };

    return (
        <div className="flex items-center justify-center p-6 sm:p-12 min-h-[calc(100vh-80px)]">
            <div className="max-w-xl w-full">
                <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-xl shadow-slate-200/40 dark:shadow-none overflow-hidden p-8 sm:p-12">
                    <div className="space-y-10 text-center">
                        {/* Elegant Success Indicator */}
                        <div className="flex flex-col items-center gap-4">
                            <div className="w-20 h-20 bg-emerald-50 dark:bg-emerald-500/10 rounded-full flex items-center justify-center text-emerald-500 ring-8 ring-emerald-50/50 dark:ring-emerald-500/5">
                                <CheckCircle2 className="w-10 h-10" />
                            </div>
                            <div className="space-y-2">
                                <h1 className="text-3xl font-black text-slate-900 dark:text-white font-heading tracking-tight">Application Submitted!</h1>
                                <p className="text-slate-500 dark:text-slate-400 max-w-sm mx-auto leading-relaxed text-sm">
                                    Your admission application for <span className="font-bold text-slate-700 dark:text-slate-200">{settings?.schoolName || 'the school'}</span> has been successfully received.
                                </p>
                            </div>
                        </div>

                        {/* Minimalist Reference Card */}
                        <div className="bg-slate-50 dark:bg-slate-800/50 rounded-3xl p-6 space-y-4 border border-slate-100 dark:border-slate-800">
                            <span className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em]">Application Reference</span>
                            <div className="flex items-center justify-center gap-3">
                                <span className="text-2xl sm:text-3xl font-black text-primary-600 dark:text-primary-400 font-mono tracking-wider">{referenceNumber}</span>
                                <button 
                                    onClick={copyToClipboard}
                                    className="p-2 hover:bg-white dark:hover:bg-slate-700 rounded-xl text-slate-400 hover:text-primary-600 transition-all active:scale-95 shadow-sm hover:shadow-md"
                                    title="Copy Reference"
                                >
                                    <Copy className="w-4 h-4" />
                                </button>
                            </div>
                        </div>

                        {/* Standardized Action Grid */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pb-6 border-b border-slate-100 dark:border-slate-800">
                            <button 
                                onClick={() => navigate('/')}
                                className="px-6 py-2.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-lg font-bold text-sm flex items-center justify-center gap-2 hover:bg-slate-200 dark:hover:bg-slate-700 transition-all active:scale-[0.98]"
                            >
                                <Home className="w-4 h-4" /> Go Back Home
                            </button>
                            <button 
                                onClick={() => navigate('/admission/status', { state: { referenceNumber } })}
                                className="px-6 py-2.5 bg-primary-600 text-white rounded-lg font-bold text-sm flex items-center justify-center gap-2 hover:bg-primary-700 transition-all shadow-md shadow-primary-600/10 active:scale-[0.98]"
                            >
                                Track Application <ArrowRight className="w-4 h-4" />
                            </button>
                        </div>

                        {/* Minimal Next Steps */}
                        <div className="text-left space-y-4">
                            <h4 className="text-[10px] font-black uppercase text-slate-400 tracking-widest flex items-center gap-2">
                                <FileText className="w-3 h-3 text-primary-500" /> Next Steps
                            </h4>
                            <div className="space-y-4">
                                {[
                                    { text: 'Admission office will review your documents.' },
                                    { text: 'Check your email for interview instructions.' },
                                    { text: 'Keep your reference number safe for status tracking.' }
                                ].map((item, idx) => (
                                    <div key={idx} className="flex gap-4 items-center">
                                        <div className="w-1.5 h-1.5 rounded-full bg-primary-500 shrink-0" />
                                        <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed font-medium">{item.text}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdmissionSuccessPage;
