import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSystem } from '../../context/SystemContext';
import { useToast } from '../../context/ToastContext';
import api from '../../services/api';
import { 
    User, 
    Users, 
    GraduationCap, 
    FileText, 
    CheckCircle2, 
    ChevronRight, 
    ChevronLeft, 
    Upload,
    Stethoscope,
    AlertCircle,
    Info,
    ArrowRight
} from 'lucide-react';
import { twMerge } from 'tailwind-merge';

const STEPS = [
    { title: 'Student Biodata', icon: User, color: 'text-blue-500', bg: 'bg-blue-50 dark:bg-blue-900/20' },
    { title: 'Parent & Medical', icon: Users, color: 'text-purple-500', bg: 'bg-purple-50 dark:bg-purple-900/20' },
    { title: 'Academic Info', icon: GraduationCap, color: 'text-amber-500', bg: 'bg-amber-50 dark:bg-amber-900/20' },
    { title: 'Documents', icon: FileText, color: 'text-emerald-500', bg: 'bg-emerald-50 dark:bg-emerald-900/20' },
    { title: 'Submit', icon: CheckCircle2, color: 'text-indigo-500', bg: 'bg-indigo-50 dark:bg-indigo-900/20' }
];

const AdmissionFormPage = () => {
    const navigate = useNavigate();
    const { settings, loading: settingsLoading } = useSystem();
    const toast = useToast();
    const [currentStep, setCurrentStep] = useState(0);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [classes, setClasses] = useState<any[]>([]);

    // Form State
    const [formData, setFormData] = useState({
        firstName: '',
        middleName: '',
        lastName: '',
        gender: '',
        dob: '',
        religion: '',
        bloodGroup: '',
        genotype: '',
        stateOfOrigin: '',
        nationality: 'Nigerian',
        mobileNumber: '',
        email: '',
        guardianName: '',
        guardianPhone: '',
        guardianRelation: '',
        currentAddress: '',
        previousSchoolName: '',
        lastClassPassed: '',
        medicalConditions: '',
        preferredClassId: '',
    });

    // File State
    const [files, setFiles] = useState<{ passportPhoto: File | null; birthCertificate: File | null }>({
        passportPhoto: null,
        birthCertificate: null
    });

    useEffect(() => {
        // Payment Guard
        const fee = settings?.admissionFee || 0;
        if (!settingsLoading && fee > 0) {
            const payRef = localStorage.getItem('admission_payment_ref');
            const payEmail = localStorage.getItem('admission_applicant_email');
            const payName = localStorage.getItem('admission_applicant_name');
            
            if (!payRef || !payEmail) {
                toast.showWarning("Please complete the admission fee payment first.");
                navigate('/admission');
                return;
            }

            // Pre-fill if empty
            setFormData(prev => ({
                ...prev,
                email: prev.email || payEmail,
                guardianName: prev.guardianName || payName || ''
            }));
        }

        const fetchClasses = async () => {
            try {
                const result = await api.getPublicClasses();
                setClasses(result.filter((c: any) => c.isActive));
            } catch (error) {
                console.error("Failed to fetch classes");
            }
        };
        if (!settingsLoading) {
            fetchClasses();
        }
    }, [settingsLoading, settings, navigate]);

    if (settingsLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
            </div>
        );
    }

    if (!settings?.onlineAdmissionEnabled) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 p-4">
                <div className="max-w-md w-full bg-white dark:bg-gray-800 p-8 rounded-3xl border border-gray-100 dark:border-gray-700 text-center space-y-4 shadow-xl">
                    <AlertCircle className="w-16 h-16 text-amber-500 mx-auto" />
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Admission is Closed</h2>
                    <p className="text-gray-500 dark:text-gray-400">The online application portal is currently unavailable. Please contact the school office.</p>
                    <button onClick={() => navigate('/')} className="w-full py-3 bg-primary-600 text-white rounded-xl font-bold">Return Home</button>
                </div>
            </div>
        );
    }

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, field: 'passportPhoto' | 'birthCertificate') => {
        if (e.target.files && e.target.files[0]) {
            setFiles(prev => ({ ...prev, [field]: e.target.files![0] }));
        }
    };

    const validateStep = (step: number) => {
        switch (step) {
            case 0:
                return formData.firstName && formData.lastName && formData.gender && formData.dob;
            case 1:
                return formData.guardianName && formData.guardianPhone && formData.guardianRelation;
            case 2:
                return formData.preferredClassId;
            default:
                return true;
        }
    };

    const handleNext = () => {
        if (!validateStep(currentStep)) {
            toast.showWarning("Please fill in all required fields.");
            return;
        }
        setCurrentStep(prev => Math.min(prev + 1, STEPS.length - 1));
        window.scrollTo(0, 0);
    };

    const handleBack = () => {
        setCurrentStep(prev => Math.max(prev - 1, 0));
        window.scrollTo(0, 0);
    };

    const handleSubmit = async () => {
        setIsSubmitting(true);
        try {
            const finalData = new FormData();
            Object.entries(formData).forEach(([key, value]) => {
                finalData.append(key, value);
            });
            if (files.passportPhoto) finalData.append('passportPhoto', files.passportPhoto);
            if (files.birthCertificate) finalData.append('birthCertificate', files.birthCertificate);

            const paymentRef = localStorage.getItem('admission_payment_ref');
            if (paymentRef) {
                finalData.append('transactionReference', paymentRef);
            }

            const response = await api.createOnlineAdmission(finalData);
            toast.showSuccess("Application submitted successfully!");
            
            // Clear payment data after successful submission
            localStorage.removeItem('admission_payment_ref');
            localStorage.removeItem('admission_applicant_email');
            localStorage.removeItem('admission_applicant_name');
            
            navigate('/admission/success', { state: { referenceNumber: response.referenceNumber } });
        } catch (error) {
            toast.showError("Failed to submit application. Please try again.");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="pb-20">
            {/* Header / Progress Card */}
            <div className="bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800 shadow-sm sticky top-20 z-40 px-4 pt-4 pb-8">
                <div className="max-w-4xl mx-auto flex items-center">
                    {/* Compact Back Button */}
                    <button onClick={() => navigate('/admission')} className="text-slate-400 hover:text-primary-600 dark:text-slate-500 dark:hover:text-primary-400 transition-all flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider shrink-0 h-7">
                        <ChevronLeft className="w-4 h-4" /> 
                        <span className="hidden sm:inline">Back</span>
                    </button>

                    {/* Centered Minimalist Stepper */}
                    <div className="relative flex justify-between items-center flex-1 max-w-3xl ml-6 mr-6">
                        <div className="absolute top-1/2 -translate-y-1/2 left-0 right-0 h-0.5 bg-slate-100 dark:bg-slate-800 -z-0"></div>
                        <div 
                            className="absolute top-1/2 -translate-y-1/2 left-0 h-0.5 bg-primary-600 transition-all duration-500 -z-0" 
                            style={{ width: `${(currentStep / (STEPS.length - 1)) * 100}%` }}
                        ></div>

                        {STEPS.map((step, idx) => (
                            <div key={idx} className="relative z-10 flex flex-col items-center group" onClick={() => idx < currentStep && setCurrentStep(idx)}>
                                <div className={twMerge(
                                    "w-7 h-7 rounded-full flex items-center justify-center transition-all duration-300 border-2 font-bold text-[10px] shadow-sm bg-white dark:bg-slate-900",
                                    currentStep === idx 
                                        ? "border-primary-600 text-primary-600 ring-4 ring-primary-50 dark:ring-primary-900/20" 
                                        : currentStep > idx 
                                            ? "bg-primary-600 border-primary-600 text-white" 
                                            : "border-slate-200 dark:border-slate-700 text-slate-400"
                                )}>
                                    {currentStep > idx ? <CheckCircle2 className="w-3 h-3" /> : <span>{idx + 1}</span>}
                                </div>
                                <span className={twMerge(
                                    "absolute top-full pt-2 whitespace-nowrap text-[9px] font-bold uppercase tracking-tight transition-colors duration-300",
                                    currentStep === idx ? "text-primary-600 dark:text-primary-400" : "text-slate-400"
                                )}>
                                    {step.title}
                                </span>
                            </div>
                        ))}
                    </div>

                    {/* Right Spacer for Balance */}
                    <div className="w-[52px] hidden sm:block"></div>
                </div>
            </div>

            <div className="max-w-4xl mx-auto px-4 mt-8">
                {/* Form Content */}
                <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl shadow-xl shadow-slate-200/40 dark:shadow-none p-8 md:p-10">
                    {currentStep === 0 && (
                        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                            <StepHeader title="Student Information" desc="Enter basic biodata of the prospective student." icon={User} color="bg-blue-50 text-blue-500" />
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <FormInput label="First Name" name="firstName" value={formData.firstName} onChange={handleChange} required />
                                <FormInput label="Middle Name" name="middleName" value={formData.middleName || ''} onChange={handleChange} />
                                <FormInput label="Last Name" name="lastName" value={formData.lastName} onChange={handleChange} required />
                                <FormSelect label="Gender" name="gender" value={formData.gender} onChange={handleChange} options={['Male', 'Female']} required />
                                <FormInput label="Date of Birth" name="dob" type="date" value={formData.dob} onChange={handleChange} required />
                                <FormSelect label="Religion" name="religion" value={formData.religion || ''} onChange={handleChange} options={['Christianity', 'Islam', 'Other']} />
                                <FormSelect label="Blood Group" name="bloodGroup" value={formData.bloodGroup || ''} onChange={handleChange} options={['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']} />
                                <FormSelect label="Genotype" name="genotype" value={formData.genotype || ''} onChange={handleChange} options={['AA', 'AS', 'SS', 'AC']} />
                                <FormInput label="State of Origin" name="stateOfOrigin" value={formData.stateOfOrigin || ''} onChange={handleChange} />
                                <FormInput label="Nationality" name="nationality" value={formData.nationality} onChange={handleChange} />
                            </div>
                        </div>
                    )}

                    {currentStep === 1 && (
                        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                            <StepHeader title="Parent/Guardian & Medical" desc="Details of the person to contact concerning the student." icon={Users} color="bg-purple-50 text-purple-500" />
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <FormInput label="Guardian Name" name="guardianName" value={formData.guardianName} onChange={handleChange} required />
                                <FormInput label="Guardian Phone" name="guardianPhone" value={formData.guardianPhone} onChange={handleChange} required />
                                <FormSelect label="Relation" name="guardianRelation" value={formData.guardianRelation} onChange={handleChange} options={['Father', 'Mother', 'Uncle', 'Aunt', 'Other']} required />
                                <FormInput label="Email Address" name="email" type="email" value={formData.email || ''} onChange={handleChange} />
                                <div className="md:col-span-2">
                                    <FormTextarea label="Resident Address" name="currentAddress" value={formData.currentAddress || ''} onChange={handleChange} rows={2} />
                                </div>
                                <div className="md:col-span-2 mt-4 space-y-4">
                                    <div className="flex items-center gap-2 text-sm font-bold text-gray-900 dark:text-white uppercase tracking-wider">
                                        <Stethoscope className="w-4 h-4 text-rose-500" /> Medical History
                                    </div>
                                    <FormTextarea label="Describe any medical conditions or allergies" name="medicalConditions" value={formData.medicalConditions || ''} onChange={handleChange} rows={3} placeholder="Enter N/A if none" />
                                </div>
                            </div>
                        </div>
                    )}

                    {currentStep === 2 && (
                        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                            <StepHeader title="Academic Information" desc="Previous schooling and target class." icon={GraduationCap} color="bg-amber-50 text-amber-500" />
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="md:col-span-2">
                                    <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-3">Target Class <span className="text-red-500">*</span></label>
                                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                                        {classes.map(cls => (
                                            <button 
                                                key={cls.id}
                                                onClick={() => setFormData(prev => ({ ...prev, preferredClassId: cls.id }))}
                                                className={twMerge(
                                                    "p-3 rounded-lg border text-left transition-all",
                                                    formData.preferredClassId === cls.id ? "border-primary-600 bg-primary-50 dark:bg-primary-900/10 text-primary-600 dark:text-primary-400 shadow-sm" : "border-slate-200 dark:border-slate-800 hover:border-slate-300"
                                                )}
                                            >
                                                <div className="font-bold text-sm">{cls.name}</div>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                                <FormInput label="Previous School Name" name="previousSchoolName" value={formData.previousSchoolName || ''} onChange={handleChange} />
                                <FormInput label="Last Class Passed" name="lastClassPassed" value={formData.lastClassPassed || ''} onChange={handleChange} />
                            </div>
                        </div>
                    )}

                    {currentStep === 3 && (
                        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                            <StepHeader title="Document Upload" desc="Attach mandatory identification files." icon={FileText} color="bg-emerald-50 text-emerald-500" />
                            <div className="space-y-6">
                                <FileUpload 
                                    label="Passport Photograph" 
                                    desc="A clear colored passport with clean background. Max 2MB." 
                                    file={files.passportPhoto} 
                                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleFileChange(e, 'passportPhoto')} 
                                    id="passport"
                                />
                                <FileUpload 
                                    label="Birth Certificate" 
                                    desc="Government issued or hospital record. Max 2MB." 
                                    file={files.birthCertificate} 
                                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleFileChange(e, 'birthCertificate')} 
                                    id="birthcert"
                                />
                                <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-900/30 rounded-2xl flex gap-3 text-sm text-blue-800 dark:text-blue-300">
                                    <Info className="w-5 h-5 shrink-0" />
                                    <p>Ensure documents are clear and legible. Only PDF or Image formats are accepted.</p>
                                </div>
                            </div>
                        </div>
                    )}

                    {currentStep === 4 && (
                        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                            <StepHeader title="Final Review" desc="Check your details before final submission." icon={CheckCircle2} color="bg-indigo-50 text-indigo-500" />
                            <div className="space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <ReviewItem label="Student Name" value={`${formData.firstName} ${formData.middleName ? formData.middleName + ' ' : ''}${formData.lastName}`} />
                                    <ReviewItem label="Target Class" value={classes.find(c => c.id === formData.preferredClassId)?.name || 'Not selected'} />
                                    <ReviewItem label="Guardian" value={`${formData.guardianName} (${formData.guardianRelation})`} />
                                    <ReviewItem label="Phone" value={formData.guardianPhone} />
                                    <ReviewItem label="Address" value={formData.currentAddress} />
                                </div>
                                <div className="p-6 border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-3xl space-y-4">
                                    <p className="text-sm text-center text-gray-500 dark:text-gray-400">By submitting this form, you certify that all information provided is accurate and you agree to the school's online admission policy.</p>
                                    <button 
                                        onClick={handleSubmit} 
                                        disabled={isSubmitting}
                                        className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold transition-all flex items-center justify-center gap-2 active:scale-[0.98] disabled:opacity-50 shadow-sm"
                                    >
                                        {isSubmitting ? (
                                            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                                        ) : (
                                            <>
                                                Submit Application <ArrowRight className="w-4 h-4" />
                                            </>
                                        )}
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Navigation Buttons */}
                    <div className="mt-12 flex justify-between items-center pt-8 border-t border-gray-100 dark:border-gray-700">
                        <button 
                            onClick={handleBack} 
                            disabled={currentStep === 0 || isSubmitting}
                            className={twMerge("px-5 py-2.5 rounded-lg font-bold flex items-center gap-2 transition-all", currentStep === 0 ? "opacity-0 invisible" : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200")}
                        >
                            <ChevronLeft className="w-4 h-4" /> Back
                        </button>
                        {currentStep < STEPS.length - 1 && (
                            <button 
                                onClick={handleNext} 
                                className="px-6 py-2.5 bg-primary-600 hover:bg-primary-700 text-white rounded-lg font-bold flex items-center gap-2 transition-all shadow-sm active:scale-[0.98]"
                            >
                                Continue <ChevronRight className="w-4 h-4" />
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

// Sub-components for cleaner code
const StepHeader = ({ title, desc, icon: Icon }: { title: string, desc: string, icon: any, color?: string }) => (
    <div className="border-b border-slate-100 dark:border-slate-800 pb-6 mb-8">
        <div className="flex items-center gap-3">
            <div className="p-2 bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400 rounded-lg">
                <Icon className="w-5 h-5" />
            </div>
            <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white tracking-tight leading-none">{title}</h3>
                <p className="text-slate-500 dark:text-slate-400 text-xs mt-1.5">{desc}</p>
            </div>
        </div>
    </div>
);

const FormInput = ({ label, required, ...props }: any) => (
    <div>
        <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1.5">{label} {required && <span className="text-red-500">*</span>}</label>
        <input {...props} className="w-full rounded-2xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50 px-4 py-3 text-sm focus:outline-none focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500 transition-all font-medium" />
    </div>
);

const FormSelect = ({ label, options, required, ...props }: any) => (
    <div>
        <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1.5">{label} {required && <span className="text-red-500">*</span>}</label>
        <select {...props} className="w-full rounded-2xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50 px-4 py-3 text-sm focus:outline-none focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500 transition-all font-medium">
            <option value="">Select {label}</option>
            {options.map((opt: string) => <option key={opt} value={opt}>{opt}</option>)}
        </select>
    </div>
);

const FormTextarea = ({ label, ...props }: any) => (
    <div>
        <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1.5">{label}</label>
        <textarea {...props} className="w-full rounded-2xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50 px-4 py-3 text-sm focus:outline-none focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500 transition-all font-medium" />
    </div>
);

const FileUpload = ({ label, desc, file, onChange, id }: any) => (
    <div className="group relative">
        <label className="block text-sm font-bold text-gray-900 dark:text-white mb-3">{label}</label>
        <label htmlFor={id} className={twMerge(
            "flex flex-col items-center justify-center w-full min-h-[160px] border-2 border-dashed rounded-3xl cursor-pointer transition-all",
            file ? "border-emerald-500 bg-emerald-50/50 dark:bg-emerald-900/10" : "border-gray-200 dark:border-gray-700 hover:border-primary-500 bg-gray-50/50 dark:bg-gray-900/30"
        )}>
            {file ? (
                <div className="flex flex-col items-center gap-2 p-6">
                    <div className="p-3 bg-emerald-100 dark:bg-emerald-900/30 rounded-full text-emerald-600">
                        <CheckCircle2 className="w-8 h-8" />
                    </div>
                    <span className="font-bold text-emerald-800 dark:text-emerald-400">{file.name}</span>
                    <span className="text-xs text-emerald-600/70">Click to change file</span>
                </div>
            ) : (
                <div className="flex flex-col items-center gap-3 p-6">
                    <div className="p-3 bg-gray-100 dark:bg-gray-700 group-hover:bg-primary-100 dark:group-hover:bg-primary-900/30 rounded-2xl text-gray-400 group-hover:text-primary-600 transition-all">
                        <Upload className="w-8 h-8" />
                    </div>
                    <div className="text-center">
                        <span className="font-bold text-gray-900 dark:text-white">Upload File</span>
                        <p className="text-xs text-gray-500 mt-1">{desc}</p>
                    </div>
                </div>
            )}
            <input type="file" id={id} className="hidden" onChange={onChange} accept="image/*,application/pdf" />
        </label>
    </div>
);

const ReviewItem = ({ label, value }: { label: string, value: any }) => (
    <div className="p-3 bg-slate-50 dark:bg-slate-900/50 rounded-lg border border-slate-100 dark:border-slate-800">
        <label className="block text-[10px] font-bold uppercase text-slate-400 tracking-wider mb-1">{label}</label>
        <div className="text-sm font-semibold text-slate-900 dark:text-white">{value || 'N/A'}</div>
    </div>
);

export default AdmissionFormPage;
