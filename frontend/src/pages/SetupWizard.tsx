import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  School, 
  UserPlus, 
  Calendar, 
  CheckCircle2, 
  ChevronRight, 
  ChevronLeft,
  Loader2,
  Building2,
  Mail,
  Phone,
  MapPin,
  Lock,
  User,
  ShieldCheck,
  Upload,
  X,
  Globe,
  Settings,
  Hash,
  MessageSquare,
  Globe2,
  Type
} from 'lucide-react';
import { systemService } from '../services/systemService';
import { toast } from 'react-hot-toast';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Common timezones
const TIMEZONES = [
  'UTC', 'Africa/Lagos', 'Africa/Nairobi', 'Africa/Johannesburg', 'Africa/Accra',
  'Europe/London', 'Europe/Paris', 'America/New_York', 'America/Los_Angeles', 'Asia/Dubai'
];

// Common date formats
const DATE_FORMATS = ['DD/MM/YYYY', 'MM/DD/YYYY', 'YYYY-MM-DD', 'DD-MM-YYYY'];

export default function SetupWizard() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [logoFile, setLogoFile] = useState<File | null>(null);

  const [formData, setFormData] = useState({
    schoolName: '',
    schoolMotto: '',
    schoolAddress: '',
    schoolEmail: '',
    schoolPhone: '',
    officialWebsite: '',
    whatsappNumber: '',
    adminFirstName: '',
    adminLastName: '',
    adminEmail: '',
    adminPassword: '',
    confirmPassword: '',
    sessionName: new Date().getFullYear() + '/' + (new Date().getFullYear() + 1),
    sessionStartDate: new Date().toISOString().split('T')[0],
    sessionEndDate: new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString().split('T')[0],
    termName: 'First Term',
    termStartDate: new Date().toISOString().split('T')[0],
    termEndDate: new Date(new Date().setMonth(new Date().getMonth() + 4)).toISOString().split('T')[0],
    timezone: 'Africa/Lagos',
    dateFormat: 'DD/MM/YYYY',
    admissionNumberPrefix: 'SCH/STU/',
    staffIdPrefix: 'SCH/STF/',
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        toast.error('Logo size must be less than 2MB');
        return;
      }
      setLogoFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setLogoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeLogo = () => {
    setLogoFile(null);
    setLogoPreview(null);
  };

  const nextStep = () => {
    if (step === 1) {
      if (!formData.schoolName || !formData.schoolAddress || !formData.schoolEmail || !formData.schoolPhone) {
        toast.error('Please fill in essential school details');
        return;
      }
    } else if (step === 2) {
      if (!formData.adminFirstName || !formData.adminLastName || !formData.adminEmail || !formData.adminPassword) {
        toast.error('Please fill in administrator details');
        return;
      }
      if (formData.adminPassword !== formData.confirmPassword) {
        toast.error('Passwords do not match');
        return;
      }
      if (formData.adminPassword.length < 8) {
        toast.error('Password must be at least 8 characters');
        return;
      }
    } else if (step === 3) {
      if (!formData.sessionName || !formData.termName || !formData.sessionStartDate || !formData.sessionEndDate || !formData.termStartDate || !formData.termEndDate) {
        toast.error('Please fill in all academic dates');
        return;
      }
    } else if (step === 4) {
      if (!formData.timezone || !formData.dateFormat || !formData.admissionNumberPrefix || !formData.staffIdPrefix) {
        toast.error('Please fill in regional and ID settings');
        return;
      }
    }
    setStep(prev => prev + 1);
  };

  const prevStep = () => setStep(prev => prev - 1);

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const data = new FormData();
      Object.entries(formData).forEach(([key, value]) => {
        data.append(key, value);
      });
      if (logoFile) {
        data.append('logo', logoFile);
      }

      await systemService.initializeSystem(data);
      toast.success('System initialized successfully!');
      setStep(5);
      setTimeout(() => navigate('/login'), 3000);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to initialize system');
    } finally {
      setLoading(false);
    }
  };

  const steps = [
    { id: 1, title: 'Institution', icon: School },
    { id: 2, title: 'Super Admin', icon: UserPlus },
    { id: 3, title: 'Academic', icon: Calendar },
    { id: 4, title: 'Regional', icon: Globe },
    { id: 5, title: 'Done', icon: CheckCircle2 },
  ];

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4 py-12">
      <div className="max-w-4xl w-full mb-8 flex flex-col items-center">
        <div className="w-16 h-16 bg-primary-600 rounded-2xl flex items-center justify-center mb-4 shadow-lg shadow-primary-500/30">
          <ShieldCheck className="w-8 h-8 text-white" />
        </div>
        <h1 className="text-3xl font-black text-gray-900 tracking-tight font-heading text-center">
          School System Initialization
        </h1>
        <p className="text-gray-500 mt-2 text-center text-sm font-medium max-w-md">
          Finalizing the platform configuration for your school. 
        </p>
      </div>

      <div className="max-w-4xl w-full bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden">
        {/* Step Indicator */}
        <div className="bg-gray-50/50 border-b border-gray-100 px-8 py-8">
          <div className="flex items-center justify-between relative px-6">
            <div className="absolute top-1/2 left-0 w-full h-0.5 bg-gray-200 -translate-y-1/2 z-0" />
            {steps.map((s) => (
              <div key={s.id} className="relative z-10 flex flex-col items-center group">
                <div className={cn(
                  "w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-300",
                  step === s.id ? "bg-primary-600 text-white ring-8 ring-primary-50 shadow-lg shadow-primary-500/20" :
                  step > s.id ? "bg-green-500 text-white" : "bg-white border-2 border-gray-200 text-gray-400"
                )}>
                  {step > s.id ? <CheckCircle2 size={24} /> : <s.icon size={22} />}
                </div>
                <span className={cn(
                  "absolute -bottom-8 text-[11px] font-bold uppercase tracking-widest whitespace-nowrap transition-colors",
                  step >= s.id ? "text-primary-600" : "text-gray-400"
                )}>
                  {s.title}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="p-8 md:p-12">
          {step === 1 && (
            <div className="space-y-8 animate-fadeIn">
              <div className="flex flex-col md:flex-row gap-12 items-start">
                <div className="flex flex-col items-center space-y-4">
                   <label className="text-xs font-black text-gray-500 uppercase tracking-widest">Logo</label>
                   {logoPreview ? (
                    <div className="relative group">
                      <img src={logoPreview} alt="Logo Preview" className="w-40 h-40 object-contain rounded-3xl border-2 border-primary-100 bg-gray-50 p-4" />
                      <button onClick={removeLogo} className="absolute -top-3 -right-3 w-10 h-10 bg-white border border-gray-100 rounded-full flex items-center justify-center text-red-500 shadow-md hover:bg-red-50 transition-all">
                        <X size={20} />
                      </button>
                    </div>
                  ) : (
                    <label className="w-40 h-40 rounded-3xl border-2 border-dashed border-gray-200 flex flex-col items-center justify-center cursor-pointer hover:border-primary-400 hover:bg-primary-50 transition-all text-gray-400 group">
                      <Upload size={40} className="group-hover:text-primary-600 transition-colors mb-3" />
                      <span className="text-[11px] font-black uppercase tracking-widest text-gray-400 group-hover:text-primary-600 transition-colors">Choose Logo</span>
                      <input type="file" className="hidden" accept="image/*" onChange={handleLogoChange} />
                    </label>
                  )}
                </div>

                <div className="flex-1 grid gap-6">
                  <div className="space-y-1.5">
                    <label className="text-sm font-bold text-gray-700">Official Institution Name</label>
                    <div className="relative group">
                      <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-primary-600 transition-colors" size={20} />
                      <input name="schoolName" value={formData.schoolName} onChange={handleInputChange} placeholder="e.g. St. Peters International Academy" className="w-full bg-gray-50 border border-gray-200 rounded-2xl py-4 pl-12 pr-4 text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-600 transition-all" />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-sm font-bold text-gray-700">School Motto / Tagline</label>
                    <div className="relative group">
                      <Type className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-primary-600 transition-colors" size={20} />
                      <input name="schoolMotto" value={formData.schoolMotto} onChange={handleInputChange} placeholder="e.g. Knowledge is Light" className="w-full bg-gray-50 border border-gray-200 rounded-2xl py-4 pl-12 pr-4 text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-600 transition-all" />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-sm font-bold text-gray-700">Physical Address</label>
                    <div className="relative group">
                      <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-primary-600 transition-colors" size={20} />
                      <input name="schoolAddress" value={formData.schoolAddress} onChange={handleInputChange} placeholder="123 Education Boulevard, Lagos" className="w-full bg-gray-50 border border-gray-200 rounded-2xl py-4 pl-12 pr-4 text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-600 transition-all" />
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 pt-4">
                <div className="space-y-1.5">
                  <label className="text-sm font-bold text-gray-700">Email</label>
                  <div className="relative group">
                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-primary-600 transition-colors" size={18} />
                    <input name="schoolEmail" type="email" value={formData.schoolEmail} onChange={handleInputChange} placeholder="school@mail.com" className="w-full bg-gray-50 border border-gray-200 rounded-xl py-3 pl-11 pr-4 text-sm font-medium" />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-bold text-gray-700">Phone</label>
                  <div className="relative group">
                    <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-primary-600 transition-colors" size={18} />
                    <input name="schoolPhone" value={formData.schoolPhone} onChange={handleInputChange} placeholder="+234..." className="w-full bg-gray-50 border border-gray-200 rounded-xl py-3 pl-11 pr-4 text-sm font-medium" />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-bold text-gray-700">Website</label>
                  <div className="relative group">
                    <Globe2 className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-primary-600 transition-colors" size={18} />
                    <input name="officialWebsite" value={formData.officialWebsite} onChange={handleInputChange} placeholder="www.school.com" className="w-full bg-gray-50 border border-gray-200 rounded-xl py-3 pl-11 pr-4 text-sm font-medium" />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-bold text-gray-700">WhatsApp</label>
                  <div className="relative group">
                    <MessageSquare className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-primary-600 transition-colors" size={18} />
                    <input name="whatsappNumber" value={formData.whatsappNumber} onChange={handleInputChange} placeholder="+234..." className="w-full bg-gray-50 border border-gray-200 rounded-xl py-3 pl-11 pr-4 text-sm font-medium" />
                  </div>
                </div>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-8 animate-fadeIn">
              <div className="grid md:grid-cols-2 gap-8">
                <div className="space-y-1.5">
                  <label className="text-sm font-bold text-gray-700 text-center">First Name</label>
                  <div className="relative group">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-primary-600 transition-colors" size={18} />
                    <input name="adminFirstName" value={formData.adminFirstName} onChange={handleInputChange} placeholder="e.g. John" className="w-full bg-gray-50 border border-gray-200 rounded-2xl py-4 pl-12 pr-4 text-gray-900 font-medium" />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-bold text-gray-700">Last Name</label>
                  <div className="relative group">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-primary-600 transition-colors" size={18} />
                    <input name="adminLastName" value={formData.adminLastName} onChange={handleInputChange} placeholder="e.g. Doe" className="w-full bg-gray-50 border border-gray-200 rounded-2xl py-4 pl-12 pr-4 text-gray-900 font-medium" />
                  </div>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-bold text-gray-700">Admin Login Email (Username)</label>
                <div className="relative group">
                   <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-primary-600 transition-colors" size={18} />
                   <input name="adminEmail" type="email" value={formData.adminEmail} onChange={handleInputChange} placeholder="admin@domain.com" className="w-full bg-gray-50 border border-gray-200 rounded-2xl py-4 pl-12 pr-4 text-gray-900 font-medium" />
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-8">
                <div className="space-y-1.5">
                  <label className="text-sm font-bold text-gray-700">Access Password</label>
                  <div className="relative group">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-primary-600 transition-colors" size={18} />
                    <input name="adminPassword" type="password" value={formData.adminPassword} onChange={handleInputChange} placeholder="••••••••" className="w-full bg-gray-50 border border-gray-200 rounded-2xl py-4 pl-12 pr-4 text-gray-900 font-medium" />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-bold text-gray-700">Confirm Password</label>
                  <div className="relative group">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-primary-600 transition-colors" size={18} />
                    <input name="confirmPassword" type="password" value={formData.confirmPassword} onChange={handleInputChange} placeholder="••••••••" className="w-full bg-gray-50 border border-gray-200 rounded-2xl py-4 pl-12 pr-4 text-gray-900 font-medium" />
                  </div>
                </div>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-8 animate-fadeIn">
              <div className="grid md:grid-cols-2 gap-10">
                {/* Session Card */}
                <div className="bg-gray-50 p-8 rounded-[2rem] border border-gray-100 flex flex-col h-full">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="p-3 bg-primary-100 text-primary-600 rounded-2xl"><Calendar size={24} /></div>
                    <h3 className="font-black text-gray-900 uppercase tracking-widest text-sm">Session Details</h3>
                  </div>
                  <div className="space-y-6 flex-1">
                    <div className="space-y-1.5">
                       <label className="text-xs font-bold text-gray-500 uppercase tracking-widest px-1">Session Name</label>
                       <input name="sessionName" value={formData.sessionName} onChange={handleInputChange} placeholder="2023/2024" className="w-full bg-white border border-gray-200 rounded-2xl py-3.5 px-5 text-gray-900 font-bold focus:ring-4 focus:ring-primary-100 outline-none transition-all" />
                    </div>
                    <div className="grid gap-4">
                       <div className="space-y-1.5">
                          <label className="text-xs font-bold text-gray-500 uppercase tracking-widest px-1">Academic Year Start</label>
                          <input type="date" name="sessionStartDate" value={formData.sessionStartDate} onChange={handleInputChange} className="w-full bg-white border border-gray-200 rounded-2xl py-3.5 px-5 text-sm font-bold outline-none" />
                       </div>
                       <div className="space-y-1.5">
                          <label className="text-xs font-bold text-gray-500 uppercase tracking-widest px-1">Academic Year End</label>
                          <input type="date" name="sessionEndDate" value={formData.sessionEndDate} onChange={handleInputChange} className="w-full bg-white border border-gray-200 rounded-2xl py-3.5 px-5 text-sm font-bold outline-none" />
                       </div>
                    </div>
                  </div>
                </div>

                {/* Term Card */}
                <div className="bg-gray-50 p-8 rounded-[2rem] border border-gray-100 flex flex-col h-full">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="p-3 bg-indigo-100 text-indigo-600 rounded-2xl"><Calendar size={24} /></div>
                    <h3 className="font-black text-gray-900 uppercase tracking-widest text-sm">Active Term</h3>
                  </div>
                  <div className="space-y-6 flex-1">
                    <div className="space-y-1.5">
                       <label className="text-xs font-bold text-gray-500 uppercase tracking-widest px-1">Term Name</label>
                       <input name="termName" value={formData.termName} onChange={handleInputChange} placeholder="Freshers Term" className="w-full bg-white border border-gray-200 rounded-2xl py-3.5 px-5 text-gray-900 font-bold focus:ring-4 focus:ring-indigo-100 outline-none transition-all" />
                    </div>
                    <div className="grid gap-4">
                       <div className="space-y-1.5">
                          <label className="text-xs font-bold text-gray-500 uppercase tracking-widest px-1">Term Start</label>
                          <input type="date" name="termStartDate" value={formData.termStartDate} onChange={handleInputChange} className="w-full bg-white border border-gray-200 rounded-2xl py-3.5 px-5 text-sm font-bold outline-none" />
                       </div>
                       <div className="space-y-1.5">
                          <label className="text-xs font-bold text-gray-500 uppercase tracking-widest px-1">Term End</label>
                          <input type="date" name="termEndDate" value={formData.termEndDate} onChange={handleInputChange} className="w-full bg-white border border-gray-200 rounded-2xl py-3.5 px-5 text-sm font-bold outline-none" />
                       </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="space-y-10 animate-fadeIn">
               <div className="grid md:grid-cols-2 gap-12">
                  {/* Regional Config */}
                  <div className="space-y-6">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="p-2.5 bg-primary-100 text-primary-600 rounded-xl"><Globe size={20} /></div>
                      <h3 className="font-black text-xs uppercase tracking-[0.2em] text-gray-400">Regional Config</h3>
                    </div>
                    
                    <div className="space-y-2">
                       <label className="text-sm font-bold text-gray-700 px-1">System Timezone</label>
                       <select name="timezone" value={formData.timezone} onChange={handleInputChange} className="w-full bg-gray-50 border border-gray-200 rounded-2xl py-3.5 px-4 text-sm font-bold outline-none ring-primary-500/10 focus:ring-4 transition-all">
                          {TIMEZONES.map(tz => <option key={tz} value={tz}>{tz}</option>)}
                       </select>
                    </div>

                    <div className="space-y-2">
                       <label className="text-sm font-bold text-gray-700 px-1">Global Date Format</label>
                       <select name="dateFormat" value={formData.dateFormat} onChange={handleInputChange} className="w-full bg-gray-50 border border-gray-200 rounded-2xl py-3.5 px-4 text-sm font-bold outline-none ring-primary-500/10 focus:ring-4 transition-all">
                          {DATE_FORMATS.map(df => <option key={df} value={df}>{df}</option>)}
                       </select>
                    </div>
                  </div>

                  {/* ID Formats */}
                  <div className="space-y-6">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="p-2.5 bg-amber-100 text-amber-600 rounded-xl"><Hash size={20} /></div>
                      <h3 className="font-black text-xs uppercase tracking-[0.2em] text-gray-400">Identification Formats</h3>
                    </div>

                    <div className="space-y-2">
                       <label className="text-sm font-bold text-gray-700 px-1">Student ID/Admission Number Prefix</label>
                       <div className="relative group">
                          <Settings className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                          <input name="admissionNumberPrefix" value={formData.admissionNumberPrefix} onChange={handleInputChange} placeholder="e.g. SCH/STU/" className="w-full bg-gray-50 border border-gray-200 rounded-2xl py-3.5 pl-12 pr-4 text-sm font-bold tracking-tight" />
                       </div>
                       <p className="text-[10px] text-gray-400 px-4">Result: {formData.admissionNumberPrefix}001</p>
                    </div>

                    <div className="space-y-2">
                       <label className="text-sm font-bold text-gray-700 px-1">Staff ID/Employee Prefix</label>
                       <div className="relative group">
                          <Settings className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                          <input name="staffIdPrefix" value={formData.staffIdPrefix} onChange={handleInputChange} placeholder="e.g. SCH/STF/" className="w-full bg-gray-50 border border-gray-200 rounded-2xl py-3.5 pl-12 pr-4 text-sm font-bold tracking-tight" />
                       </div>
                       <p className="text-[10px] text-gray-400 px-4">Result: {formData.staffIdPrefix}001</p>
                    </div>
                  </div>
               </div>

               <div className="bg-amber-50 border border-amber-100/50 rounded-3xl p-6 flex gap-5 items-start">
                  <div className="w-12 h-12 bg-amber-100 text-amber-600 rounded-2xl flex items-center justify-center shrink-0"><ShieldCheck size={28} /></div>
                  <div className="space-y-1">
                     <h4 className="font-black text-sm text-amber-900 tracking-tight">Final Confirmation Required</h4>
                     <p className="text-amber-700/80 text-xs font-medium leading-relaxed">
                        Initializing the system will create the database structure for your institution. This action can take a few seconds as we configure your admin account and academic defaults.
                     </p>
                  </div>
               </div>
            </div>
          )}

          {step === 5 && (
            <div className="flex flex-col items-center justify-center py-16 text-center space-y-6">
              <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center text-green-600 mb-2 animate-bounce">
                <CheckCircle2 size={56} />
              </div>
              <div className="space-y-2">
                <h2 className="text-4xl font-black text-gray-900">Setup Successful!</h2>
                <p className="text-gray-500 max-w-sm mx-auto font-bold text-lg">
                   Welcome to the future of school management.
                </p>
              </div>
              <div className="flex items-center gap-3 bg-white px-8 py-4 rounded-3xl border border-gray-100 shadow-sm text-primary-600 font-bold">
                <Loader2 className="animate-spin" size={24} />
                <span>Synchronizing Environment...</span>
              </div>
            </div>
          )}

          {step < 5 && (
            <div className="mt-16 pt-10 border-t border-gray-100 flex items-center justify-between">
              <button onClick={prevStep} disabled={step === 1 || loading} className="flex items-center gap-2.5 px-8 py-3.5 text-gray-400 hover:text-gray-900 font-black text-xs uppercase tracking-widest transition-all disabled:opacity-0 active:scale-95">
                <ChevronLeft size={20} />
                Back
              </button>

              <button onClick={step === 4 ? handleSubmit : nextStep} disabled={loading} className="group flex items-center gap-3 px-10 py-4.5 bg-primary-600 hover:bg-primary-700 disabled:opacity-50 text-white rounded-2xl font-black uppercase tracking-[0.15em] text-xs transition-all shadow-2xl shadow-primary-500/30 active:scale-95">
                {loading ? (
                  <>
                    <Loader2 size={20} className="animate-spin" />
                    Initializing...
                  </>
                ) : (
                  <>
                    {step === 4 ? 'Finalize & Initialize' : 'Next Step'}
                    <ChevronRight size={20} className="group-hover:translate-x-1.5 transition-transform" />
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
