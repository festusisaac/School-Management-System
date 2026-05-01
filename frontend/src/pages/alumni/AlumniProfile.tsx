import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
    ArrowLeft, MapPin, Briefcase, Linkedin, GraduationCap, Mail, 
    Phone, Award, BadgeCheck, MessageSquareText, Calendar, Star, 
    History, User
} from 'lucide-react';
import api, { getFileUrl } from '../../services/api';
import { useToast } from '../../context/ToastContext';
import { clsx } from 'clsx';
import { format } from 'date-fns';

export default function AlumniProfile() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [alumni, setAlumni] = useState<any>(null);
    const [attendance, setAttendance] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('Profile');
    const toast = useToast();

    useEffect(() => {
        if (id) {
            fetchData();
        }
    }, [id]);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [profileData, attendanceData] = await Promise.all([
                api.getAlumniById(id!),
                api.getAlumniAttendance(id!)
            ]);
            setAlumni(profileData);
            setAttendance(attendanceData);
        } catch (error) {
            console.error("Failed to fetch alumni profile", error);
            toast.showError("Alumni record not found");
            navigate('/alumni');
        } finally {
            setLoading(false);
        }
    };

    if (loading) return (
        <div className="flex flex-col items-center justify-center min-h-[400px] gap-3">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
            <p className="text-gray-500 font-medium animate-pulse">Loading profile...</p>
        </div>
    );

    if (!alumni) return null;

    const tabs = [
        { id: 'Profile', label: 'Profile', icon: User },
        { id: 'Engagement', label: 'Engagement', icon: History },
    ];

    const SectionHeader = ({ title, icon: Icon }: { title: string, icon?: any }) => (
        <div className="px-4 sm:px-6 py-4 sm:py-5 border-b border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/80">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center">
                {Icon && <Icon className="w-5 h-5 mr-2 text-primary-600" />}
                {title}
            </h2>
        </div>
    );

    const DataRow = ({ label, value }: { label: string, value: any }) => (
        <div className="flex flex-col sm:grid sm:grid-cols-[200px_1fr] sm:items-center gap-1 sm:gap-6 py-4 px-4 sm:px-6 border-b border-gray-50 dark:border-gray-700/50 last:border-0">
            <span className="text-xs sm:text-sm font-medium text-gray-500 dark:text-gray-400">{label}</span>
            <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">{value || '-'}</span>
        </div>
    );

    const InfoCard = ({ children, className = "" }: { children: React.ReactNode, className?: string }) => (
        <div className={clsx(
            "bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden",
            className
        )}>
            {children}
        </div>
    );

    return (
        <div className="max-w-7xl mx-auto space-y-6 p-4 sm:p-6 lg:p-8 pb-20 bg-gray-50/50 dark:bg-transparent min-h-screen">
            {/* Sticky Navigation Header */}
            <div className="sticky top-4 z-40 flex items-center justify-between bg-white/90 dark:bg-gray-800/90 p-1.5 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 backdrop-blur-xl transition-all">
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => navigate('/alumni')}
                        className="p-2.5 bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 rounded-xl transition-all text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100"
                    >
                        <ArrowLeft className="w-5 h-5" />
                    </button>
                    <div className="h-8 w-px bg-gray-200 dark:bg-gray-700 mx-1" />
                    <div className="flex items-center gap-1">
                        {tabs.map((tab) => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`flex items-center gap-2 px-4 py-2 text-sm font-medium transition-all rounded-xl whitespace-nowrap ${activeTab === tab.id
                                    ? 'text-primary-600 dark:text-primary-400 bg-primary-50 dark:bg-primary-500/10'
                                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700/50'
                                    }`}
                            >
                                <tab.icon className={`w-4 h-4 ${activeTab === tab.id ? 'text-primary-600 dark:text-primary-400' : 'text-gray-400'}`} />
                                <span>{tab.label}</span>
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 mt-6">
                {/* Left Side: Identity Card */}
                <div className="lg:col-span-4 flex flex-col gap-6">
                    <InfoCard className="p-8 flex flex-col items-center text-center">
                        <div className="relative mb-6">
                            <div className="w-32 h-32 rounded-full bg-gray-100 dark:bg-gray-700 overflow-hidden ring-4 ring-white dark:ring-gray-800 shadow-md">
                                {alumni.student?.studentPhoto ? (
                                    <img src={getFileUrl(alumni.student.studentPhoto)} alt={alumni.student.firstName} className="w-full h-full object-cover" />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-4xl font-bold text-gray-300 dark:text-gray-600 uppercase">
                                        {alumni.student?.firstName?.[0]}
                                    </div>
                                )}
                            </div>
                            {alumni.isMentorshipAvailable && (
                                <div className="absolute bottom-1 right-1 p-1.5 bg-blue-600 rounded-full text-white border-4 border-white dark:border-gray-800 shadow-sm" title="Available for Mentorship">
                                    <BadgeCheck size={16} />
                                </div>
                            )}
                        </div>

                        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                            {alumni.student?.firstName} {alumni.student?.lastName}
                        </h2>
                        
                        <div className="flex flex-wrap justify-center gap-2 mb-6">
                            <span className="px-3 py-1 bg-primary-50 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 text-xs font-semibold rounded-full border border-primary-100 dark:border-primary-800/30">
                                Class of {alumni.graduationYear}
                            </span>
                            {alumni.isFeatured && (
                                <span className="px-3 py-1 bg-amber-50 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 text-xs font-semibold rounded-full border border-amber-100 dark:border-amber-800/30 flex items-center gap-1">
                                    <Star size={12} fill="currentColor" />
                                    Featured Alumni
                                </span>
                            )}
                        </div>

                        <div className="w-full space-y-4 pt-6 border-t border-gray-100 dark:border-gray-700">
                            <ContactItem icon={Mail} value={alumni.email} />
                            <ContactItem icon={Phone} value={alumni.phoneNumber} />
                            <ContactItem icon={MapPin} value={alumni.location} />
                        </div>

                        {alumni.linkedInUrl && (
                            <a 
                                href={alumni.linkedInUrl} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="mt-6 w-full flex items-center justify-center gap-2 py-2.5 bg-[#0077b5] text-white rounded-xl font-medium text-sm transition-all hover:opacity-90 active:scale-[0.98]"
                            >
                                <Linkedin className="w-4 h-4" />
                                LinkedIn Profile
                            </a>
                        )}
                    </InfoCard>
                </div>

                {/* Right Side: Main Data */}
                <div className="lg:col-span-8 flex flex-col gap-6">
                    {activeTab === 'Profile' ? (
                        <>
                            <InfoCard>
                                <SectionHeader title="Professional Information" icon={Briefcase} />
                                <div className="divide-y divide-gray-50 dark:divide-gray-800/10">
                                    <DataRow label="Current Occupation" value={alumni.currentOccupation} />
                                    <DataRow label="Company / Organization" value={alumni.currentCompany} />
                                    <DataRow label="Work Address" value={alumni.address} />
                                    <DataRow label="Mentorship Availability" value={alumni.isMentorshipAvailable ? 'Available for Mentorship' : 'Not Currently Available'} />
                                </div>
                            </InfoCard>

                            <InfoCard>
                                <SectionHeader title="Milestones & Achievements" icon={Award} />
                                <div className="p-6">
                                    <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed whitespace-pre-wrap">
                                        {alumni.achievements || 'No specific achievements recorded.'}
                                    </p>
                                </div>
                            </InfoCard>

                            {alumni.adminNotes && (
                                <InfoCard className="border-amber-100 dark:border-amber-900/30">
                                    <SectionHeader title="Administrative Notes" icon={MessageSquareText} />
                                    <div className="p-6 bg-amber-50/30 dark:bg-amber-900/10">
                                        <p className="text-sm text-amber-800 dark:text-amber-300 leading-relaxed">
                                            {alumni.adminNotes}
                                        </p>
                                    </div>
                                </InfoCard>
                            )}

                            <InfoCard>
                                <SectionHeader title="Academic Background" icon={GraduationCap} />
                                <div className="divide-y divide-gray-50 dark:divide-gray-800/10">
                                    <DataRow label="Admission Number" value={alumni.student?.admissionNo} />
                                    <DataRow label="Graduation Year" value={alumni.graduationYear} />
                                    <DataRow label="Student House" value={alumni.student?.house?.name} />
                                </div>
                            </InfoCard>
                        </>
                    ) : (
                        <InfoCard>
                            <SectionHeader title="Engagement History" icon={History} />
                            <div className="p-6">
                                {attendance.length === 0 ? (
                                    <div className="text-center py-12">
                                        <Calendar className="w-12 h-12 text-gray-200 dark:text-gray-700 mx-auto mb-4" />
                                        <p className="text-sm text-gray-500 dark:text-gray-400 italic">No event participation recorded</p>
                                    </div>
                                ) : (
                                    <div className="space-y-4">
                                        {attendance.map((record: any) => (
                                            <div key={record.id} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-900/50 rounded-xl border border-gray-100 dark:border-gray-700 group hover:border-primary-200 transition-colors">
                                                <div className="flex items-center gap-4">
                                                    <div className="p-2 bg-white dark:bg-gray-800 rounded-lg shadow-sm text-primary-600">
                                                        <Calendar size={18} />
                                                    </div>
                                                    <div>
                                                        <h4 className="text-sm font-bold text-gray-900 dark:text-white">
                                                            {record.event?.title}
                                                        </h4>
                                                        <p className="text-[10px] text-gray-500 uppercase font-bold tracking-tight mt-0.5">
                                                            {record.event?.eventDate && format(new Date(record.event.eventDate), 'MMM dd, yyyy')} • {record.event?.location || 'Main Campus'}
                                                        </p>
                                                    </div>
                                                </div>
                                                <div className="px-2 py-1 bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 rounded-md text-[10px] font-bold uppercase tracking-tighter border border-green-100 dark:border-green-900/30">
                                                    Attended
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </InfoCard>
                    )}
                </div>
            </div>
        </div>
    );
}

function ContactItem({ icon: Icon, value }: any) {
    return (
        <div className="flex items-center gap-3 text-sm text-gray-600 dark:text-gray-400">
            <Icon size={16} className="text-gray-400 flex-shrink-0" />
            <span className="truncate">{value || 'Not provided'}</span>
        </div>
    );
}
