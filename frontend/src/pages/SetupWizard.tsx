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
  Upload,
  X,
  Globe,
  Hash,
  AlertCircle
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
    <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-center p-4 py-12">
      <div className="max-w-4xl w-full mb-8 flex flex-col items-center">
        <h1 className="text-3xl font-bold text-gray-900 tracking-tight text-center">
          System Initialization
        </h1>
        <p className="text-gray-500 mt-2 text-center text-sm max-w-md">
          Complete these steps to configure your school management platform.
        </p>
      </div>

      <div className="max-w-4xl w-full bg-white rounded-lg shadow-md border border-gray-200 overflow-hidden">
        {/* Step Indicator */}
        <div className="bg-gray-50 border-b border-gray-200 px-8 py-6">
          <div className="flex items-center justify-between relative max-w-2xl mx-auto">
            <div className="absolute top-5 left-0 w-full h-0.5 bg-gray-200 -z-0" />
            {steps.map((s) => (
              <div key={s.id} className="relative z-10 flex flex-col items-center">
                <div className={cn(
                  "w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 border-2",
                  step === s.id ? "bg-primary-600 text-white border-primary-600 shadow-sm" :
                  step > s.id ? "bg-green-500 text-white border-green-500" : "bg-white border-gray-300 text-gray-400"
                )}>
                  {step > s.id ? <CheckCircle2 size={20} /> : <s.icon size={18} />}
                </div>
                <span className={cn(
                  "mt-2 text-[10px] font-bold uppercase tracking-wider",
                  step >= s.id ? "text-primary-600" : "text-gray-400"
                )}>
                  {s.title}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="p-8 md:p-10">
          {step === 1 && (
            <div className="space-y-8 animate-fadeIn">
              <div className="grid md:grid-cols-3 gap-10">
                <div className="md:col-span-1 flex flex-col items-center space-y-4">
                  <div className="text-sm font-bold text-gray-700">School Logo</div>
                  {logoPreview ? (
                    <div className="relative group">
                      <img src={logoPreview} alt="Logo" className="w-40 h-40 object-contain rounded-md border border-gray-200 p-4 bg-white" />
                      <button onClick={removeLogo} className="absolute -top-2 -right-2 w-8 h-8 bg-red-500 text-white rounded-full flex items-center justify-center shadow-lg hover:bg-red-600">
                        <X size={16} />
                      </button>
                    </div>
                  ) : (
                    <label className="w-40 h-40 rounded-md border-2 border-dashed border-gray-300 flex flex-col items-center justify-center cursor-pointer hover:border-primary-500 hover:bg-primary-50 transition-all text-gray-400">
                      <Upload size={32} className="mb-2 text-gray-300" />
                      <span className="text-xs font-semibold">Choose Image</span>
                      <input type="file" className="hidden" accept="image/*" onChange={handleLogoChange} />
                    </label>
                  )}
                </div>

                <div className="md:col-span-2 space-y-6">
                  <div>
                    <label className="block text-gray-700 text-sm font-bold mb-2">Official Institution Name</label>
                    <input name="schoolName" value={formData.schoolName} onChange={handleInputChange} placeholder="e.g. St. Peters International Academy" className="w-full px-4 py-2.5 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500/10 focus:border-primary-600 outline-none transition-all" />
                  </div>
                  <div>
                    <label className="block text-gray-700 text-sm font-bold mb-2">School Motto / Tagline</label>
                    <input name="schoolMotto" value={formData.schoolMotto} onChange={handleInputChange} placeholder="e.g. Knowledge is Light" className="w-full px-4 py-2.5 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500/10 focus:border-primary-600 outline-none transition-all" />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="md:col-span-2">
                  <label className="block text-gray-700 text-sm font-bold mb-2">Physical Address</label>
                  <input name="schoolAddress" value={formData.schoolAddress} onChange={handleInputChange} placeholder="123 Education Boulevard, Lagos" className="w-full px-4 py-2.5 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500/10 focus:border-primary-600 outline-none transition-all" />
                </div>
                <div>
                  <label className="block text-gray-700 text-sm font-bold mb-2">Official Email</label>
                  <input name="schoolEmail" type="email" value={formData.schoolEmail} onChange={handleInputChange} placeholder="school@mail.com" className="w-full px-4 py-2.5 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500/10 focus:border-primary-600 outline-none transition-all" />
                </div>
                <div>
                  <label className="block text-gray-700 text-sm font-bold mb-2">Primary Phone</label>
                  <input name="schoolPhone" value={formData.schoolPhone} onChange={handleInputChange} placeholder="+234..." className="w-full px-4 py-2.5 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500/10 focus:border-primary-600 outline-none transition-all" />
                </div>
                <div>
                  <label className="block text-gray-700 text-sm font-bold mb-2">Official Website (Optional)</label>
                  <input name="officialWebsite" value={formData.officialWebsite} onChange={handleInputChange} placeholder="www.school.com" className="w-full px-4 py-2.5 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500/10 focus:border-primary-600 outline-none transition-all" />
                </div>
                <div>
                  <label className="block text-gray-700 text-sm font-bold mb-2">WhatsApp Business (Optional)</label>
                  <input name="whatsappNumber" value={formData.whatsappNumber} onChange={handleInputChange} placeholder="+234..." className="w-full px-4 py-2.5 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500/10 focus:border-primary-600 outline-none transition-all" />
                </div>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-6 animate-fadeIn">
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg flex items-center gap-3">
                <AlertCircle className="text-blue-600 shrink-0" size={20} />
                <p className="text-sm text-blue-700 font-medium">This account will have Global Super Admin privileges.</p>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-gray-700 text-sm font-bold mb-2">First Name</label>
                  <input name="adminFirstName" value={formData.adminFirstName} onChange={handleInputChange} placeholder="John" className="w-full px-4 py-2.5 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500/10 focus:border-primary-600 outline-none transition-all" />
                </div>
                <div>
                  <label className="block text-gray-700 text-sm font-bold mb-2">Last Name</label>
                  <input name="adminLastName" value={formData.adminLastName} onChange={handleInputChange} placeholder="Doe" className="w-full px-4 py-2.5 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500/10 focus:border-primary-600 outline-none transition-all" />
                </div>
              </div>

              <div>
                <label className="block text-gray-700 text-sm font-bold mb-2">Administrator Email</label>
                <input name="adminEmail" type="email" value={formData.adminEmail} onChange={handleInputChange} placeholder="admin@domain.com" className="w-full px-4 py-2.5 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500/10 focus:border-primary-600 outline-none transition-all" />
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-gray-700 text-sm font-bold mb-2">Password</label>
                  <input name="adminPassword" type="password" value={formData.adminPassword} onChange={handleInputChange} placeholder="••••••••" className="w-full px-4 py-2.5 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500/10 focus:border-primary-600 outline-none transition-all" />
                </div>
                <div>
                  <label className="block text-gray-700 text-sm font-bold mb-2">Confirm Password</label>
                  <input name="confirmPassword" type="password" value={formData.confirmPassword} onChange={handleInputChange} placeholder="••••••••" className="w-full px-4 py-2.5 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500/10 focus:border-primary-600 outline-none transition-all" />
                </div>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-8 animate-fadeIn">
              <div className="grid md:grid-cols-2 gap-10">
                <div className="space-y-6">
                  <div className="flex items-center gap-2 text-primary-600 font-bold border-b border-gray-100 pb-2">
                    <Calendar size={18} />
                    <span>Academic Session Details</span>
                  </div>
                  <div>
                    <label className="block text-gray-700 text-xs font-bold mb-2 uppercase tracking-wider">Session Name</label>
                    <input name="sessionName" value={formData.sessionName} onChange={handleInputChange} placeholder="2023/2024" className="w-full px-4 py-2.5 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500/10 focus:border-primary-600 outline-none transition-all font-bold" />
                  </div>
                  <div className="grid grid-cols-1 gap-4">
                    <div>
                      <label className="block text-gray-700 text-xs font-bold mb-2">START DATE</label>
                      <input type="date" name="sessionStartDate" value={formData.sessionStartDate} onChange={handleInputChange} className="w-full px-4 py-2.5 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500/10 outline-none" />
                    </div>
                    <div>
                      <label className="block text-gray-700 text-xs font-bold mb-2">END DATE</label>
                      <input type="date" name="sessionEndDate" value={formData.sessionEndDate} onChange={handleInputChange} className="w-full px-4 py-2.5 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500/10 outline-none" />
                    </div>
                  </div>
                </div>

                <div className="space-y-6">
                  <div className="flex items-center gap-2 text-indigo-600 font-bold border-b border-gray-100 pb-2">
                    <Calendar size={18} />
                    <span>First Academic Term</span>
                  </div>
                  <div>
                    <label className="block text-gray-700 text-xs font-bold mb-2 uppercase tracking-wider">Term Name</label>
                    <input name="termName" value={formData.termName} onChange={handleInputChange} placeholder="First Term" className="w-full px-4 py-2.5 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-600 outline-none transition-all font-bold" />
                  </div>
                  <div className="grid grid-cols-1 gap-4">
                    <div>
                      <label className="block text-gray-700 text-xs font-bold mb-2">TERM START</label>
                      <input type="date" name="termStartDate" value={formData.termStartDate} onChange={handleInputChange} className="w-full px-4 py-2.5 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500/10 outline-none" />
                    </div>
                    <div>
                      <label className="block text-gray-700 text-xs font-bold mb-2">TERM END</label>
                      <input type="date" name="termEndDate" value={formData.termEndDate} onChange={handleInputChange} className="w-full px-4 py-2.5 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500/10 outline-none" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="space-y-8 animate-fadeIn">
               <div className="grid md:grid-cols-2 gap-10">
                  <div className="space-y-6">
                    <div className="flex items-center gap-2 text-primary-600 font-bold border-b border-gray-100 pb-2">
                      <Globe size={18} />
                      <span>Regional Settings</span>
                    </div>
                    <div>
                       <label className="block text-gray-700 text-sm font-bold mb-2">Timezone</label>
                       <select name="timezone" value={formData.timezone} onChange={handleInputChange} className="w-full px-4 py-2.5 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500/10 outline-none transition-all">
                          {TIMEZONES.map(tz => <option key={tz} value={tz}>{tz}</option>)}
                       </select>
                    </div>
                    <div>
                       <label className="block text-gray-700 text-sm font-bold mb-2">Preferred Date Format</label>
                       <select name="dateFormat" value={formData.dateFormat} onChange={handleInputChange} className="w-full px-4 py-2.5 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500/10 outline-none transition-all">
                          {DATE_FORMATS.map(df => <option key={df} value={df}>{df}</option>)}
                       </select>
                    </div>
                  </div>

                  <div className="space-y-6">
                    <div className="flex items-center gap-2 text-amber-600 font-bold border-b border-gray-100 pb-2">
                      <Hash size={18} />
                      <span>Identification Formats</span>
                    </div>
                    <div>
                       <label className="block text-gray-700 text-sm font-bold mb-2">Admission No. Prefix</label>
                       <input name="admissionNumberPrefix" value={formData.admissionNumberPrefix} onChange={handleInputChange} placeholder="SCH/STU/" className="w-full px-4 py-2.5 border border-gray-300 rounded-md focus:ring-2 focus:ring-amber-500/10 focus:border-amber-600 outline-none transition-all font-bold" />
                       <p className="text-[10px] text-gray-500 mt-1">Preview: {formData.admissionNumberPrefix}001</p>
                    </div>
                    <div>
                       <label className="block text-gray-700 text-sm font-bold mb-2">Staff ID Prefix</label>
                       <input name="staffIdPrefix" value={formData.staffIdPrefix} onChange={handleInputChange} placeholder="SCH/STF/" className="w-full px-4 py-2.5 border border-gray-300 rounded-md focus:ring-2 focus:ring-amber-500/10 focus:border-amber-600 outline-none transition-all font-bold" />
                       <p className="text-[10px] text-gray-500 mt-1">Preview: {formData.staffIdPrefix}001</p>
                    </div>
                  </div>
               </div>

               <div className="bg-amber-50 border border-amber-200 rounded-lg p-5 flex gap-4">
                  <AlertCircle className="text-amber-600 shrink-0" size={24} />
                  <div>
                     <h4 className="font-bold text-amber-900 text-sm uppercase">Confirmation Required</h4>
                     <p className="text-amber-700 text-xs mt-1 leading-relaxed">
                        By clicking initialize, the system will finalize all database schemas and institutional settings. This process cannot be undone without a full reset.
                     </p>
                  </div>
               </div>
            </div>
          )}

          {step === 5 && (
            <div className="flex flex-col items-center justify-center py-12 text-center space-y-6">
              <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center animate-bounce">
                <CheckCircle2 size={48} />
              </div>
              <div className="space-y-2">
                <h2 className="text-3xl font-bold text-gray-900">System Ready!</h2>
                <p className="text-gray-500 max-w-xs mx-auto text-sm">
                   Your institutional environment has been successfully configured. redirecting to login...
                </p>
              </div>
              <div className="flex items-center gap-3 text-primary-600 font-semibold px-6 py-3 bg-primary-50 rounded-lg">
                <Loader2 className="animate-spin" size={20} />
                <span>Launching Application...</span>
              </div>
            </div>
          )}

          {step < 5 && (
            <div className="mt-10 pt-6 border-t border-gray-200 flex items-center justify-between">
              <button onClick={prevStep} disabled={step === 1 || loading} className="flex items-center gap-2 px-4 py-2 text-gray-500 hover:text-gray-800 disabled:opacity-0 transition-all font-semibold">
                <ChevronLeft size={20} />
                Go Back
              </button>

              <button onClick={step === 4 ? handleSubmit : nextStep} disabled={loading} className="flex items-center gap-2 px-8 py-2.5 bg-primary-600 text-white rounded-md hover:bg-primary-700 disabled:opacity-50 transition-all font-bold shadow-sm">
                {loading ? (
                  <>
                    <Loader2 size={20} className="animate-spin" />
                    Initializing System...
                  </>
                ) : (
                  <>
                    {step === 4 ? 'Complete Initialization' : 'Continue'}
                    <ChevronRight size={20} />
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
