import { useState, useEffect } from 'react';
import { 
    Users, 
    Facebook, 
    Twitter, 
    Linkedin, 
    Instagram, 
    FileText, 
    History as HistoryIcon, 
    TrendingUp, 
    Eye,
    Shield
} from 'lucide-react';
import { 
    AreaChart, 
    Area, 
    XAxis, 
    YAxis, 
    CartesianGrid, 
    Tooltip, 
    ResponsiveContainer 
} from 'recharts';
import { staffService } from '../../services/hrService';
import { getFileUrl } from '../../services/api';
import { useToast } from '../../context/ToastContext';
import { formatCurrency, CURRENCY_SYMBOL } from '../../utils/currency';

const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

const StaffProfilePage = () => {
    const [profile, setProfile] = useState<any>(null);
    const [salaryHistory, setSalaryHistory] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [viewTab, setViewTab] = useState<'info' | 'history'>('info');
    const toast = useToast();

    useEffect(() => {
        fetchProfile();
    }, []);

    const fetchProfile = async () => {
        try {
            setLoading(true);
            const data = await staffService.getMyProfile();
            setProfile(data);
            
            if (data?.id) {
                const payrolls = await staffService.getPayrolls({ staffId: data.id });
                setSalaryHistory(payrolls || []);
            }
        } catch (error) {
            console.error('Error fetching profile:', error);
            toast.showError('Failed to load your profile details');
        } finally {
            setLoading(false);
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'Active': return 'bg-green-100 text-green-800';
            case 'On Leave': return 'bg-yellow-100 text-yellow-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[400px]">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
                <p className="mt-4 text-gray-500 dark:text-gray-400">Loading your profile...</p>
            </div>
        );
    }

    if (!profile) {
        return (
            <div className="text-center py-20">
                <Users size={48} className="mx-auto text-gray-300 mb-4" />
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Profile Not Found</h2>
                <p className="text-gray-500 dark:text-gray-400">We couldn't find a staff record associated with your account.</p>
            </div>
        );
    }

    return (
        <div className="space-y-4 sm:space-y-6 animate-in fade-in duration-500 pb-8">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                    <Users className="text-primary-600 dark:text-primary-400 shrink-0" /> <span className="truncate">My Professional Profile</span>
                </h1>
            </div>

            {/* Tabs - horizontal scroll on mobile if needed */}
            <div className="overflow-x-auto no-scrollbar -mx-4 px-4 sm:mx-0 sm:px-0">
                <div className="flex bg-white dark:bg-gray-800 rounded-xl p-1 border border-gray-200 dark:border-gray-700 w-max sm:w-fit shadow-sm">
                    <button
                        onClick={() => setViewTab('info')}
                        className={`px-4 sm:px-8 py-2 text-xs sm:text-sm font-bold rounded-lg transition-all ${viewTab === 'info' ? 'bg-primary-600 text-white shadow-md' : 'text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700'}`}
                    >
                        <div className="flex items-center gap-2">
                            <Users size={14} /> Full Details
                        </div>
                    </button>
                    <button
                        onClick={() => setViewTab('history')}
                        className={`px-4 sm:px-8 py-2 text-xs sm:text-sm font-bold rounded-lg transition-all ${viewTab === 'history' ? 'bg-primary-600 text-white shadow-md' : 'text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700'}`}
                    >
                        <div className="flex items-center gap-2">
                            <HistoryIcon size={14} /> Salary History
                        </div>
                    </button>
                </div>
            </div>

            {viewTab === 'info' ? (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
                    {/* Left Column: Basic Info & Photo */}
                    <div className="lg:col-span-1 space-y-4 sm:space-y-6">
                        <div className="bg-white dark:bg-gray-800 p-6 sm:p-8 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm text-center">
                            {profile.photo ? (
                                <div className="relative inline-block mb-6">
                                    <img
                                        src={getFileUrl(profile.photo)}
                                        alt="Profile"
                                        className="w-32 h-32 sm:w-40 sm:h-40 rounded-full object-cover mx-auto border-4 border-primary-50 dark:border-gray-700 shadow-xl"
                                    />
                                    <div className="absolute bottom-1 right-1 p-1.5 bg-green-500 rounded-full border-4 border-white dark:border-gray-800" />
                                </div>
                            ) : (
                                <div className="w-32 h-32 sm:w-40 sm:h-40 bg-primary-100 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 rounded-full flex items-center justify-center font-bold text-4xl sm:text-5xl mx-auto mb-6">
                                    {profile.firstName[0]}{profile.lastName[0]}
                                </div>
                            )}
                            <h4 className="text-xl sm:text-2xl font-black text-gray-900 dark:text-white uppercase tracking-tight">{profile.firstName} {profile.lastName}</h4>
                            <div className="mt-2">
                                <span className={`px-4 py-1.5 text-[10px] font-black rounded-full uppercase tracking-widest ${getStatusColor(profile.status)}`}>
                                    {profile.status}
                                </span>
                            </div>

                            <div className="mt-8 pt-6 border-t border-gray-100 dark:border-gray-700 grid grid-cols-2 gap-4 text-left">
                                <div>
                                    <p className="text-[10px] text-gray-400 dark:text-gray-500 uppercase font-black tracking-widest mb-1">Staff ID</p>
                                    <p className="text-xs sm:text-sm font-bold dark:text-gray-200 truncate">{profile.employeeId}</p>
                                </div>
                                <div>
                                    <p className="text-[10px] text-gray-400 dark:text-gray-500 uppercase font-black tracking-widest mb-1">Department</p>
                                    <p className="text-xs sm:text-sm font-bold dark:text-gray-200 truncate">{profile.department?.name || 'N/A'}</p>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white dark:bg-gray-800 p-5 sm:p-6 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm">
                            <h5 className="font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
                                <div className="p-2 bg-primary-50 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 rounded-lg">
                                    <Users size={16} />
                                </div>
                                Social Presence
                            </h5>
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-3">
                                {profile.facebookUrl && (
                                    <a href={profile.facebookUrl} target="_blank" rel="noreferrer" className="flex items-center gap-3 text-sm text-gray-600 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-500 transition-colors bg-gray-50 dark:bg-gray-700/50 p-3 rounded-xl border border-transparent hover:border-primary-100">
                                        <Facebook size={18} className="text-[#1877F2] shrink-0" /> <span className="truncate">Facebook Profile</span>
                                    </a>
                                )}
                                {profile.twitterUrl && (
                                    <a href={profile.twitterUrl} target="_blank" rel="noreferrer" className="flex items-center gap-3 text-sm text-gray-600 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-500 transition-colors bg-gray-50 dark:bg-gray-700/50 p-3 rounded-xl border border-transparent hover:border-primary-100">
                                        <Twitter size={18} className="text-[#1DA1F2] shrink-0" /> <span className="truncate">Twitter Handle</span>
                                    </a>
                                )}
                                {profile.linkedinUrl && (
                                    <a href={profile.linkedinUrl} target="_blank" rel="noreferrer" className="flex items-center gap-3 text-sm text-gray-600 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-500 transition-colors bg-gray-50 dark:bg-gray-700/50 p-3 rounded-xl border border-transparent hover:border-primary-100">
                                        <Linkedin size={18} className="text-[#0A66C2] shrink-0" /> <span className="truncate">LinkedIn Profile</span>
                                    </a>
                                )}
                                {profile.instagramUrl && (
                                    <a href={profile.instagramUrl} target="_blank" rel="noreferrer" className="flex items-center gap-3 text-sm text-gray-600 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-500 transition-colors bg-gray-50 dark:bg-gray-700/50 p-3 rounded-xl border border-transparent hover:border-primary-100">
                                        <Instagram size={18} className="text-[#E4405F] shrink-0" /> <span className="truncate">Instagram Profile</span>
                                    </a>
                                )}
                                {!profile.facebookUrl && !profile.twitterUrl && !profile.linkedinUrl && !profile.instagramUrl && (
                                    <p className="text-sm text-gray-400 dark:text-gray-500 italic text-center py-4 w-full sm:col-span-2 lg:col-span-1">No social links provided</p>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Right Column: Detailed Sections */}
                    <div className="lg:col-span-2 space-y-4 sm:space-y-6">
                        {/* Personal & Family Info */}
                        <div className="bg-white dark:bg-gray-800 p-6 sm:p-8 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm relative overflow-hidden">
                            <div className="absolute top-0 left-0 w-1 sm:w-1.5 h-full bg-primary-500"></div>
                            <h5 className="font-black text-gray-900 dark:text-white mb-6 uppercase tracking-widest text-[10px] opacity-60">Personal & Family Information</h5>
                            <div className="grid grid-cols-2 lg:grid-cols-3 gap-y-6 sm:gap-y-8 gap-x-4">
                                <div>
                                    <p className="text-[10px] text-gray-400 dark:text-gray-500 uppercase font-black tracking-widest mb-1">Father Name</p>
                                    <p className="text-xs sm:text-sm font-bold dark:text-gray-200">{profile.fatherName || 'N/A'}</p>
                                </div>
                                <div>
                                    <p className="text-[10px] text-gray-400 dark:text-gray-500 uppercase font-black tracking-widest mb-1">Mother Name</p>
                                    <p className="text-xs sm:text-sm font-bold dark:text-gray-200">{profile.motherName || 'N/A'}</p>
                                </div>
                                <div>
                                    <p className="text-[10px] text-gray-400 dark:text-gray-500 uppercase font-black tracking-widest mb-1">Date of Birth</p>
                                    <p className="text-xs sm:text-sm font-bold dark:text-gray-200">{profile.dateOfBirth ? new Date(profile.dateOfBirth).toLocaleDateString() : 'N/A'}</p>
                                </div>
                                <div>
                                    <p className="text-[10px] text-gray-400 dark:text-gray-500 uppercase font-black tracking-widest mb-1">Gender</p>
                                    <p className="text-xs sm:text-sm font-bold dark:text-gray-200">{profile.gender || 'N/A'}</p>
                                </div>
                                <div>
                                    <p className="text-[10px] text-gray-400 dark:text-gray-500 uppercase font-black tracking-widest mb-1">Marital Status</p>
                                    <p className="text-xs sm:text-sm font-bold dark:text-gray-200">{profile.maritalStatus || 'N/A'}</p>
                                </div>
                                <div>
                                    <p className="text-[10px] text-gray-400 dark:text-gray-500 uppercase font-black tracking-widest mb-1">Teaching Staff</p>
                                    <p className="text-xs sm:text-sm font-bold dark:text-gray-200">{profile.isTeachingStaff ? 'Yes' : 'No'}</p>
                                </div>
                            </div>
                        </div>

                        {/* Contact Info */}
                        <div className="bg-white dark:bg-gray-800 p-6 sm:p-8 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm relative overflow-hidden">
                            <div className="absolute top-0 left-0 w-1 sm:w-1.5 h-full bg-blue-500"></div>
                            <h5 className="font-black text-gray-900 dark:text-white mb-6 uppercase tracking-widest text-[10px] opacity-60">Contact Information</h5>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8">
                                <div className="space-y-4 sm:space-y-6">
                                    <div className="bg-gray-50 dark:bg-gray-700/30 p-4 rounded-xl">
                                        <p className="text-[10px] text-gray-400 dark:text-gray-500 uppercase font-black tracking-widest mb-1">Email Address</p>
                                        <p className="text-xs sm:text-sm font-black text-primary-600 dark:text-primary-400 select-all break-all">{profile.email}</p>
                                    </div>
                                    <div className="bg-gray-50 dark:bg-gray-700/30 p-4 rounded-xl">
                                        <p className="text-[10px] text-gray-400 dark:text-gray-500 uppercase font-black tracking-widest mb-1">Phone Number</p>
                                        <p className="text-xs sm:text-sm font-bold dark:text-gray-200">{profile.phone}</p>
                                    </div>
                                </div>
                                <div className="space-y-6">
                                    <div>
                                        <p className="text-[10px] text-gray-400 dark:text-gray-500 uppercase font-black tracking-widest mb-1">Address</p>
                                        <p className="text-xs sm:text-sm text-gray-700 dark:text-gray-300 leading-relaxed font-bold">{profile.address || 'N/A'}</p>
                                    </div>
                                    <div className="border-t dark:border-gray-700 pt-4">
                                        <p className="text-[10px] text-gray-400 dark:text-gray-500 uppercase font-black tracking-widest mb-1">Emergency Contact</p>
                                        <p className="text-xs sm:text-sm font-bold dark:text-gray-200">{profile.emergencyContactPhone || 'N/A'}</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Financial & Professional - stack on small mobile, row on tablet/desktop */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                            <div className="bg-white dark:bg-gray-800 p-5 sm:p-6 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm relative overflow-hidden">
                                <div className="absolute top-0 right-0 p-3 opacity-10">
                                    <Shield size={40} className="text-primary-600" />
                                </div>
                                <h5 className="font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
                                    <Shield size={16} className="text-primary-600 dark:text-primary-400" />
                                    Bank Account
                                </h5>
                                <div className="space-y-4">
                                    <div className="bg-gray-50 dark:bg-gray-700/30 p-3 rounded-xl border border-transparent">
                                        <p className="text-[10px] text-gray-400 dark:text-gray-500 uppercase font-black tracking-widest mb-1">Bank Name</p>
                                        <p className="text-xs sm:text-sm font-bold dark:text-gray-200">{profile.bankName || 'N/A'}</p>
                                    </div>
                                    <div className="bg-gray-50 dark:bg-gray-700/30 p-3 rounded-xl border border-transparent">
                                        <p className="text-[10px] text-gray-400 dark:text-gray-500 uppercase font-black tracking-widest mb-1">Account Number</p>
                                        <p className="text-xs sm:text-sm font-bold tracking-widest dark:text-gray-200">{profile.accountNumber || 'N/A'}</p>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-white dark:bg-gray-800 p-5 sm:p-6 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm border-b-4 border-b-green-500">
                                <h5 className="font-bold text-gray-900 dark:text-white mb-6">Employment Info</h5>
                                <div className="space-y-4">
                                    <div className="flex justify-between items-end border-b pb-3 dark:border-gray-700">
                                        <div>
                                            <p className="text-[10px] text-gray-400 dark:text-gray-500 uppercase font-black tracking-widest mb-1">Monthly Basic</p>
                                            <p className="text-xl sm:text-2xl font-black text-gray-900 dark:text-white">{formatCurrency(profile.basicSalary || 0)}</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-[10px] text-gray-400 dark:text-gray-500 uppercase font-black tracking-widest mb-1">Type</p>
                                            <p className="text-[10px] sm:text-xs font-bold text-primary-600 dark:text-primary-400 uppercase tracking-tighter bg-primary-50 dark:bg-primary-900/20 px-2 py-0.5 rounded">{profile.employmentType}</p>
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-2">
                                        <div>
                                            <p className="text-[10px] text-gray-400 dark:text-gray-500 uppercase font-black tracking-widest mb-1">Joined</p>
                                            <p className="text-xs sm:text-sm font-bold dark:text-gray-200">{new Date(profile.dateOfJoining).toLocaleDateString()}</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-[10px] text-gray-400 dark:text-gray-500 uppercase font-black tracking-widest mb-1">Designation</p>
                                            <p className="text-xs sm:text-sm font-bold dark:text-gray-200">{profile.designation?.name || 'N/A'}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Uploaded Documents List */}
                        <div className="bg-white dark:bg-gray-800 p-6 sm:p-8 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm relative overflow-hidden">
                             <div className="absolute top-0 right-0 p-6 opacity-5 pointer-events-none">
                                <FileText size={80} />
                            </div>
                            <h5 className="font-black text-gray-900 dark:text-white mb-6 uppercase tracking-widest text-[10px] opacity-60 flex justify-between items-center">
                                Professional Documents
                                <FileText size={16} />
                            </h5>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                                {profile.resume && (
                                    <a href={getFileUrl(profile.resume)} target="_blank" rel="noreferrer" className="flex items-center justify-between p-3 sm:p-4 border dark:border-gray-700 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 group transition-all">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-red-100 dark:bg-red-900/30 flex items-center justify-center text-red-600 dark:text-red-400 font-black text-[10px]">PDF</div>
                                            <span className="text-xs sm:text-sm font-bold text-gray-900 dark:text-gray-200">Staff Resume</span>
                                        </div>
                                        <Eye size={18} className="text-gray-300 group-hover:text-primary-600 dark:group-hover:text-primary-500 shrink-0" />
                                    </a>
                                )}
                                {profile.idProof && (
                                    <a href={getFileUrl(profile.idProof)} target="_blank" rel="noreferrer" className="flex items-center justify-between p-3 sm:p-4 border dark:border-gray-700 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 group transition-all">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-green-100 dark:bg-green-900/30 flex items-center justify-center text-green-600 dark:text-green-400 font-black text-[10px]">ID</div>
                                            <span className="text-xs sm:text-sm font-bold text-gray-900 dark:text-gray-200">Identity Proof</span>
                                        </div>
                                        <Eye size={18} className="text-gray-300 group-hover:text-primary-600 dark:group-hover:text-primary-500 shrink-0" />
                                    </a>
                                )}
                                {profile.certificates?.map((cert: string, idx: number) => (
                                    <a key={idx} href={getFileUrl(cert)} target="_blank" rel="noreferrer" className="flex items-center justify-between p-3 sm:p-4 border dark:border-gray-700 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 group transition-all">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center text-amber-600 dark:text-amber-400 font-black text-[10px]">CERT</div>
                                            <span className="text-xs sm:text-sm font-bold text-gray-900 dark:text-gray-200">Cert {idx + 1}</span>
                                        </div>
                                        <Eye size={18} className="text-gray-300 group-hover:text-primary-600 dark:group-hover:text-primary-500 shrink-0" />
                                    </a>
                                ))}
                                {(!profile.resume && !profile.idProof && (!profile.certificates || profile.certificates.length === 0)) && (
                                    <div className="col-span-1 sm:col-span-2 py-8 text-center bg-gray-50 dark:bg-gray-900/20 rounded-xl border border-dashed dark:border-gray-700">
                                        <p className="text-sm text-gray-400 dark:text-gray-500 italic">No professional documents available</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            ) : (
                <div className="space-y-4 sm:space-y-6">
                    {/* Trends Chart */}
                    <div className="bg-white dark:bg-gray-800 p-5 sm:p-8 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
                        <h5 className="font-bold text-gray-900 dark:text-white mb-8 flex items-center gap-2">
                            <TrendingUp size={20} className="text-primary-600 dark:text-primary-400" />
                            Earnings Trend (Last 6 Months)
                        </h5>
                        <div className="h-64 sm:h-80 -ml-4 sm:ml-0">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={[...salaryHistory].reverse().slice(-6).map(p => ({
                                    month: months[(p.month || 1) - 1] ? `${months[(p.month || 1) - 1].substring(0, 3)} ${p.year || ''}` : `P${p.month}`,
                                    total: Number(p.netSalary || 0)
                                }))}>
                                    <defs>
                                        <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="rgb(var(--color-primary-rgb))" stopOpacity={0.3}/>
                                            <stop offset="95%" stopColor="rgb(var(--color-primary-rgb))" stopOpacity={0}/>
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" className="dark:stroke-gray-700" opacity={0.5} />
                                    <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 9, fill: '#6B7280', fontWeight: 'bold' }} />
                                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 9, fill: '#6B7280', fontWeight: 'bold' }} tickFormatter={(v) => `${v / 1000}k`} />
                                    <Tooltip 
                                        contentStyle={{ backgroundColor: 'rgba(255, 255, 255, 0.95)', borderRadius: '12px', border: '1px solid #E5E7EB', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)', fontSize: '11px' }}
                                        itemStyle={{ color: 'rgb(var(--color-primary-rgb))', fontWeight: 'bold' }}
                                    />
                                    <Area type="monotone" dataKey="total" stroke="rgb(var(--color-primary-rgb))" strokeWidth={3} fillOpacity={1} fill="url(#colorTotal)" />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* History Table - scrollable on mobile */}
                    <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse min-w-[600px] sm:min-w-0">
                                <thead className="bg-gray-50 dark:bg-gray-700/50 border-b dark:border-gray-700">
                                    <tr>
                                        <th className="px-6 py-5 text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest">Period</th>
                                        <th className="px-6 py-5 text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest">Base</th>
                                        <th className="px-6 py-5 text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest text-center">Allowances</th>
                                        <th className="px-6 py-5 text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest text-center">Deductions</th>
                                        <th className="px-6 py-5 text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest">Net Total</th>
                                        <th className="px-6 py-5 text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest text-center">Status</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y dark:divide-gray-700">
                                    {salaryHistory.length === 0 ? (
                                        <tr><td colSpan={6} className="px-6 py-20 text-center text-gray-400 dark:text-gray-500 italic">No payroll history found in your record.</td></tr>
                                    ) : salaryHistory.map((p) => (
                                        <tr key={p.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                                            <td className="px-6 py-5">
                                                <div className="text-sm font-black dark:text-white uppercase tracking-tight">{months[(p.month || 1) - 1] || 'UNK'} {p.year || ''}</div>
                                                {p.paymentDate && <div className="text-[9px] text-gray-400 dark:text-gray-500 font-bold uppercase tracking-tighter mt-0.5">{new Date(p.paymentDate).toLocaleDateString()}</div>}
                                            </td>
                                            <td className="px-6 py-5 text-xs font-semibold text-gray-600 dark:text-gray-400">{formatCurrency(p.basicSalary || 0)}</td>
                                            <td className="px-6 py-5 text-xs font-black text-green-600 dark:text-green-500 text-center">+{formatCurrency((p.allowances || []).reduce((s: any, a: any) => s + Number(a.amount || 0), 0))}</td>
                                            <td className="px-6 py-5 text-xs font-black text-red-500 dark:text-red-400 text-center">-{formatCurrency((p.deductions || []).reduce((s: any, d: any) => s + Number(d.amount || 0), 0))}</td>
                                            <td className="px-6 py-5">
                                                <div className="text-sm font-black text-gray-900 dark:text-white">{formatCurrency(p.netSalary || 0)}</div>
                                            </td>
                                            <td className="px-6 py-5 text-center">
                                                <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border ${p.status === 'Paid' ? 'bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 border-green-100 dark:border-green-800' : 'bg-yellow-50 dark:bg-yellow-900/20 text-yellow-600 dark:text-yellow-400 border-yellow-100 dark:border-yellow-800'}`}>
                                                    {p.status}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default StaffProfilePage;
