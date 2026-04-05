import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useSystem } from '../../context/SystemContext';
import { AlertCircle, ArrowRight, ClipboardList, Phone, Mail, Loader2, CheckCircle2 } from 'lucide-react';
import { usePaystackPayment } from 'react-paystack';
import api from '../../services/api';
import { useToast } from '../../context/ToastContext';

const AdmissionIntroPage = () => {
    const navigate = useNavigate();
    const { settings, loading, formatCurrency } = useSystem();
    const { showError, showSuccess } = useToast();
    const [isChecked, setIsChecked] = React.useState(false);
    const [showPaymentForm, setShowPaymentForm] = React.useState(false);
    const [applicantName, setApplicantName] = React.useState('');
    const [applicantEmail, setApplicantEmail] = React.useState('');
    const [isVerifying, setIsVerifying] = React.useState(false);
    const [hasExistingPayment, setHasExistingPayment] = React.useState(false);
    const [showRecoveryForm, setShowRecoveryForm] = React.useState(false);
    const [recoveryRef, setRecoveryRef] = React.useState('');
    const [recoveryEmail, setRecoveryEmail] = React.useState('');
    const instructionsRef = React.useRef<HTMLDivElement>(null);

    React.useEffect(() => {
        const payRef = localStorage.getItem('admission_payment_ref');
        const payEmail = localStorage.getItem('admission_applicant_email');
        if (payRef && payEmail) {
            setHasExistingPayment(true);
        }
    }, []);

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
            </div>
        );
    }

    const isEnabled = settings?.onlineAdmissionEnabled;
    const fee = settings?.admissionFee || 0;
    const instructions = settings?.admissionInstructions || 'Welcome to our online admission portal. Please follow the steps to complete your application.';

    const scrollToInstructions = () => {
        instructionsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    };

    const handleStart = () => {
        if (!isChecked) return;
        if (fee > 0) {
            setShowPaymentForm(true);
        } else {
            navigate('/admission/apply');
        }
    };

    // Paystack configuration
    const config = {
        reference: `ADM_${Math.random().toString(36).substring(2, 9).toUpperCase()}_${Date.now()}`,
        email: applicantEmail,
        amount: Math.round(fee * 100), // convert to kobo
        publicKey: (import.meta as any).env.VITE_PAYSTACK_PUBLIC_KEY || settings?.paystackPublicKey,
        metadata: {
            name: applicantName,
            custom_fields: [
                {
                    display_name: "Applicant Name",
                    variable_name: "applicant_name",
                    value: applicantName
                }
            ]
        }
    };

    const initializePayment = usePaystackPayment(config);

    const onSuccess = async (reference: any) => {
        setIsVerifying(true);
        try {
            const resp = await api.verifyAdmissionPayment(reference.reference, applicantEmail);
            if (resp.success) {
                showSuccess('Payment verified! You can now proceed to the application form.');
                // Store reference and email for the form page
                localStorage.setItem('admission_payment_ref', reference.reference);
                localStorage.setItem('admission_applicant_email', applicantEmail);
                localStorage.setItem('admission_applicant_name', applicantName);
                
                navigate('/admission/apply');
            }
        } catch (err: any) {
            showError(err.response?.data?.message || 'Failed to verify payment reference');
        } finally {
            setIsVerifying(false);
        }
    };

    const onClose = () => {
        showError('Payment process cancelled.');
    };

    const handlePayment = (e: React.FormEvent) => {
        e.preventDefault();
        if (!applicantName || !applicantEmail) {
            showError('Please provide your name and email');
            return;
        }
        initializePayment({ onSuccess: (ref: any) => onSuccess(ref), onClose });
    };

    const handleRecovery = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!recoveryRef || !recoveryEmail) {
            showError('Please provide both reference and email');
            return;
        }
        setIsVerifying(true);
        try {
            const resp = await api.verifyAdmissionPayment(recoveryRef, recoveryEmail);
            if (resp.success) {
                showSuccess('Payment re-verified successfully!');
                localStorage.setItem('admission_payment_ref', recoveryRef);
                localStorage.setItem('admission_applicant_email', recoveryEmail);
                // We might not have the name from Paystack verification if it wasn't returned, 
                // but we can proceed
                navigate('/admission/apply');
            }
        } catch (err: any) {
            showError(err.response?.data?.message || 'Verification failed. Please check your details.');
        } finally {
            setIsVerifying(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-50/50 dark:bg-slate-950 font-sans">
            {/* Simple Header */}
            <div className="bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800">
                <div className="max-w-6xl mx-auto px-4 py-10 sm:px-6 lg:px-8">
                    <div className="space-y-1">
                        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
                            Online Admission Portal
                        </h1>
                        <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">
                            Join our community. Please review the instructions carefully before starting.
                        </p>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="max-w-6xl mx-auto px-4 py-12 sm:px-6 lg:px-8">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
                    
                    {/* Left Column: Instructions */}
                    <div className="lg:col-span-2 space-y-8">
                        <section className="space-y-4">
                            <h2 className="text-sm font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest flex items-center gap-2">
                                <ClipboardList className="w-4 h-4" />
                                Instructions & Requirements
                            </h2>
                            <div className="bg-white dark:bg-slate-900 p-6 rounded-lg border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 leading-relaxed whitespace-pre-wrap text-[15px] font-medium">
                                {instructions}
                            </div>
                        </section>

                        {/* Acceptance & Action */}
                        <section className="pt-8 border-t border-slate-100 dark:border-slate-800">
                            {!isEnabled ? (
                                <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-900/20 rounded text-amber-700 dark:text-amber-500 text-xs font-bold uppercase">
                                    <AlertCircle className="w-4 h-4" />
                                    Admission Closed
                                </div>
                            ) : (
                                <div className="space-y-6">
                                    {showPaymentForm ? (
                                        <div className="bg-slate-50 dark:bg-slate-900/50 p-6 rounded-xl border border-slate-200 dark:border-slate-800 space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
                                            <div className="space-y-4">
                                                <div className="space-y-2">
                                                    <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Applicant Full Name</label>
                                                    <input 
                                                        type="text"
                                                        value={applicantName}
                                                        onChange={(e) => setApplicantName(e.target.value)}
                                                        className="w-full px-4 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all font-medium text-sm"
                                                        placeholder="Enter your full name"
                                                        disabled={isVerifying}
                                                    />
                                                </div>
                                                <div className="space-y-2">
                                                    <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Email Address</label>
                                                    <input 
                                                        type="email"
                                                        value={applicantEmail}
                                                        onChange={(e) => setApplicantEmail(e.target.value)}
                                                        className="w-full px-4 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all font-medium text-sm"
                                                        placeholder="Enter your email address"
                                                        disabled={isVerifying}
                                                    />
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-3 pt-2">
                                                <button 
                                                    onClick={handlePayment}
                                                    disabled={isVerifying || !applicantName || !applicantEmail}
                                                    className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-primary-600 hover:bg-primary-700 text-white rounded-lg font-bold text-sm transition-all shadow-md active:scale-[0.98] disabled:opacity-50"
                                                >
                                                    {isVerifying ? (
                                                        <>
                                                            <Loader2 className="w-4 h-4 animate-spin" />
                                                            Verifying Payment...
                                                        </>
                                                    ) : (
                                                        <>
                                                            Pay {formatCurrency(fee)} & Start
                                                            <ArrowRight className="w-4 h-4" />
                                                        </>
                                                    )}
                                                </button>
                                                <button 
                                                    onClick={() => setShowPaymentForm(false)}
                                                    className="px-6 py-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 rounded-lg font-bold text-sm hover:bg-slate-50 transition-all"
                                                >
                                                    Cancel
                                                </button>
                                            </div>
                                            <p className="text-[10px] text-slate-400 font-medium text-center italic">
                                                * You'll be redirected to pay via Paystack secure gateway
                                            </p>
                                        </div>
                                    ) : (
                                        <>
                                            <label className="flex items-start gap-2.5 cursor-pointer group w-fit">
                                                <input 
                                                    type="checkbox" 
                                                    checked={isChecked}
                                                    onChange={(e) => setIsChecked(e.target.checked)}
                                                    className="mt-0.5 w-4 h-4 rounded border-slate-300 dark:border-slate-700 text-primary-600 focus:ring-primary-500 transition-all cursor-pointer"
                                                />
                                                <span className="text-slate-600 dark:text-slate-400 font-medium select-none text-sm">
                                                    I have read and fully understood the instructions.
                                                </span>
                                            </label>

                                            <div className="flex flex-col sm:flex-row items-center gap-3">
                                                {hasExistingPayment ? (
                                                    <button 
                                                        onClick={() => navigate('/admission/apply')}
                                                        className="flex-1 flex items-center justify-center gap-2 px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold text-sm transition-all shadow-md active:scale-[0.98]"
                                                    >
                                                        Resume Application
                                                        <CheckCircle2 className="w-4 h-4" />
                                                    </button>
                                                ) : (
                                                    <button 
                                                        onClick={handleStart}
                                                        disabled={!isChecked}
                                                        className="flex-1 flex items-center justify-center gap-2 px-6 py-2.5 bg-primary-600 hover:bg-primary-700 text-white rounded-lg font-bold text-sm transition-all shadow-md active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
                                                    >
                                                        Start Application
                                                        <ArrowRight className="w-4 h-4" />
                                                    </button>
                                                )}
                                                <button 
                                                    onClick={() => navigate('/admission/status')}
                                                    className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 rounded-lg font-bold text-sm transition-all hover:bg-slate-50 dark:hover:bg-slate-700 shadow-sm"
                                                >
                                                    Check Status
                                                </button>
                                            </div>

                                            {/* Recovery Toggle */}
                                            {!showPaymentForm && !showRecoveryForm && (
                                                <button 
                                                    onClick={() => setShowRecoveryForm(true)}
                                                    className="text-[11px] font-bold text-slate-400 hover:text-primary-500 transition-colors uppercase tracking-wider block mx-auto pt-2"
                                                >
                                                    Already Paid? Click here to re-verify
                                                </button>
                                            )}

                                            {showRecoveryForm && (
                                                <div className="bg-slate-50 dark:bg-slate-900/50 p-6 rounded-xl border border-slate-200 dark:border-slate-800 space-y-4 animate-in zoom-in-95 duration-200">
                                                    <h3 className="text-xs font-black text-slate-600 dark:text-slate-400 uppercase tracking-widest border-b border-slate-100 dark:border-slate-800 pb-3">Retrieve Application</h3>
                                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                                        <div className="space-y-1.5">
                                                            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Payment Ref</label>
                                                            <input 
                                                                type="text"
                                                                value={recoveryRef}
                                                                onChange={(e) => setRecoveryRef(e.target.value)}
                                                                className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded text-sm font-medium focus:ring-2 focus:ring-primary-500/20"
                                                                placeholder="ADM_..."
                                                            />
                                                        </div>
                                                        <div className="space-y-1.5">
                                                            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Email Used</label>
                                                            <input 
                                                                type="email"
                                                                value={recoveryEmail}
                                                                onChange={(e) => setRecoveryEmail(e.target.value)}
                                                                className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded text-sm font-medium focus:ring-2 focus:ring-primary-500/20"
                                                                placeholder="Email address"
                                                            />
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-3 pt-2">
                                                        <button 
                                                            onClick={handleRecovery}
                                                            disabled={isVerifying || !recoveryRef || !recoveryEmail}
                                                            className="flex-1 py-2 bg-primary-600 text-white rounded font-bold text-xs uppercase tracking-widest hover:bg-primary-700 transition-all disabled:opacity-50"
                                                        >
                                                            {isVerifying ? 'Verifying...' : 'Verify & Continue'}
                                                        </button>
                                                        <button 
                                                            onClick={() => setShowRecoveryForm(false)}
                                                            className="px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-400 rounded font-bold text-xs uppercase tracking-widest"
                                                        >
                                                            Cancel
                                                        </button>
                                                    </div>
                                                </div>
                                            )}
                                        </>
                                    )}
                                </div>
                            )}
                        </section>
                    </div>

                    {/* Right Column: Sidebar */}
                    <div className="space-y-6 lg:sticky lg:top-24">
                        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-6">
                            <h3 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] mb-6 border-b border-slate-50 dark:border-slate-800 pb-4">
                                Summary
                            </h3>
                            <div className="space-y-4">
                                <div className="flex justify-between items-center">
                                    <span className="text-slate-500 dark:text-slate-500 text-sm">Form Fee</span>
                                    <span className="font-bold text-slate-900 dark:text-white">
                                        {fee > 0 ? (
                                            <>
                                                <span className="text-primary-600 mr-1 text-sm font-black">{settings?.currencySymbol || '₦'}</span>
                                                {fee.toLocaleString()}
                                            </>
                                        ) : 'FREE'}
                                    </span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-slate-500 dark:text-slate-500 text-sm">Session</span>
                                    <span className="font-bold text-slate-900 dark:text-white text-sm">{settings?.activeSessionName || '2024/2025'}</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-slate-500 dark:text-slate-500 text-sm">Portal</span>
                                    <span className="font-bold text-slate-900 dark:text-white text-sm">Online</span>
                                </div>
                            </div>

                            {/* Help Section */}
                            <div className="mt-8 pt-6 border-t border-slate-50 dark:border-slate-800">
                                <div className="space-y-3">
                                    <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400 font-medium">
                                        <Phone className="w-3.5 h-3.5" />
                                        {settings?.schoolPhone}
                                    </div>
                                    <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400 font-medium truncate">
                                        <Mail className="w-3.5 h-3.5" />
                                        {settings?.schoolEmail}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdmissionIntroPage;
