import React, { useEffect, useState } from 'react';
import { 
    User, Mail, Phone, MapPin, Briefcase, 
    ShieldCheck, GraduationCap, ChevronRight, Loader2,
    Heart, Users, Info
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { useAuthStore } from '../../stores/authStore';
import { useSystem } from '../../context/SystemContext';

export default function ParentProfile() {
    const { setSelectedChildId } = useAuthStore();
    const { formatCurrency } = useSystem();
    const navigate = useNavigate();
    
    const [profile, setProfile] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchProfile = async () => {
            try {
                const response = await api.getParentProfile();
                setProfile(response?.data || response);
            } catch (error) {
                console.error("Failed to fetch parent profile:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchProfile();
    }, []);

    const handleSelectChild = (childId: string) => {
        setSelectedChildId(childId);
        navigate('/dashboard');
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[400px] gap-3">
                <Loader2 className="h-10 w-10 text-slate-400 animate-spin" />
                <p className="text-slate-500 font-medium tracking-wide">Securely loading your profile...</p>
            </div>
        );
    }

    const parentDisplayName = profile?.fatherName || profile?.motherName || profile?.guardianName || 'Parent User';

    return (
        <div className="max-w-6xl mx-auto space-y-8 pb-20 fade-in">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row items-center gap-8 border-b border-slate-200 pb-10">
                <div className="w-28 h-28 rounded-2xl bg-slate-900 flex items-center justify-center text-4xl font-bold text-white shadow-xl rotate-3 group hover:rotate-0 transition-transform duration-300">
                    {parentDisplayName.charAt(0)}
                </div>
                <div className="text-center md:text-left">
                    <h1 className="text-4xl font-black text-slate-900 tracking-tight mb-2">{parentDisplayName}</h1>
                    <div className="flex flex-wrap justify-center md:justify-start gap-4">
                        <span className="px-3 py-1 bg-slate-100 border border-slate-200 rounded-full text-xs font-bold text-slate-600 uppercase tracking-widest">
                            Parent Account
                        </span>
                        <span className="px-3 py-1 bg-emerald-50 border border-emerald-100 rounded-full text-xs font-bold text-emerald-600 uppercase tracking-widest flex items-center gap-2">
                            <ShieldCheck size={12} /> Verified
                        </span>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                {/* Information Columns */}
                <div className="lg:col-span-2 space-y-10">
                    {/* Family Members Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {profile?.fatherName && (
                            <div className="p-6 border border-slate-200 rounded-2xl bg-white hover:border-slate-900 transition-colors group">
                                <div className="flex items-center gap-4 mb-6">
                                    <div className="p-3 bg-slate-50 rounded-xl text-slate-900 group-hover:bg-slate-900 group-hover:text-white transition-colors">
                                        <User size={20} />
                                    </div>
                                    <h3 className="font-black text-lg text-slate-900 uppercase tracking-tighter">Father</h3>
                                </div>
                                <div className="space-y-4">
                                    <ProfileItem label="Full Name" value={profile.fatherName} />
                                    <ProfileItem label="Phone" value={profile.fatherPhone} icon={<Phone size={14}/>} />
                                    <ProfileItem label="Occupation" value={profile.fatherOccupation} icon={<Briefcase size={14}/>} />
                                </div>
                            </div>
                        )}

                        {profile?.motherName && (
                            <div className="p-6 border border-slate-200 rounded-2xl bg-white hover:border-slate-900 transition-colors group">
                                <div className="flex items-center gap-4 mb-6">
                                    <div className="p-3 bg-slate-50 rounded-xl text-slate-900 group-hover:bg-slate-900 group-hover:text-white transition-colors">
                                        <User size={20} />
                                    </div>
                                    <h3 className="font-black text-lg text-slate-900 uppercase tracking-tighter">Mother</h3>
                                </div>
                                <div className="space-y-4">
                                    <ProfileItem label="Full Name" value={profile.motherName} />
                                    <ProfileItem label="Phone" value={profile.motherPhone} icon={<Phone size={14}/>} />
                                    <ProfileItem label="Occupation" value={profile.motherOccupation} icon={<Briefcase size={14}/>} />
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Guardian Info */}
                    {(profile?.guardianName || profile?.guardianEmail) && (
                        <div className="p-8 border border-slate-900 bg-slate-50 rounded-3xl relative overflow-hidden">
                            <div className="absolute top-0 right-0 p-8 text-slate-100">
                                <ShieldCheck size={120} />
                            </div>
                            <div className="relative z-10">
                                <div className="flex items-center gap-4 mb-8">
                                    <div className="p-3 bg-slate-900 rounded-xl text-white">
                                        <Heart size={20} />
                                    </div>
                                    <h3 className="font-black text-2xl text-slate-900 uppercase tracking-tighter">Guardian Details</h3>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    <div className="space-y-6">
                                        <ProfileItem label="Guardian Name" value={profile.guardianName} large />
                                        <ProfileItem label="Relationship" value={profile.guardianRelation} large />
                                    </div>
                                    <div className="space-y-6">
                                        <ProfileItem label="Phone" value={profile.guardianPhone} icon={<Phone size={16}/>} large />
                                        <ProfileItem label="Email" value={profile.guardianEmail} icon={<Mail size={16}/>} large />
                                    </div>
                                    <div className="md:col-span-2 pt-4">
                                        <ProfileItem label="Guardian Residence" value={profile.guardianAddress} icon={<MapPin size={16}/>} large />
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Permanent Address */}
                    <div className="p-6 border border-slate-200 rounded-2xl bg-white">
                         <div className="flex items-center gap-4 mb-4">
                            <MapPin className="text-slate-400" size={20} />
                            <h3 className="font-bold text-slate-900 tracking-tight">Permanent Address</h3>
                        </div>
                        <p className="text-slate-600 leading-relaxed font-medium pl-9">
                            {profile?.permanentAddress || 'No permanent address recorded.'}
                        </p>
                    </div>
                </div>

                {/* Sidebar Column */}
                <div className="space-y-6">
                    <div className="p-6 border-2 border-slate-900 rounded-3xl bg-white shadow-[8px_8px_0px_0px_rgba(15,23,42,1)]">
                        <div className="flex items-center gap-3 mb-6">
                            <Users className="text-slate-900" size={20} />
                            <h3 className="font-black text-xl text-slate-900 uppercase tracking-tight">Family Members</h3>
                        </div>
                        <div className="space-y-4">
                            {profile?.students?.map((child: any) => (
                                <div 
                                    key={child.id}
                                    className="p-4 border border-slate-200 rounded-2xl hover:bg-slate-50 transition-all cursor-pointer group"
                                    onClick={() => handleSelectChild(child.id)}
                                >
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center font-bold text-slate-500 text-xs">
                                                {child.firstName?.charAt(0) || ''}{child.lastName?.charAt(0) || ''}
                                            </div>
                                            <div>
                                                <p className="text-sm font-bold text-slate-900 group-hover:text-slate-600 transition-colors">
                                                    {child.firstName} {child.lastName}
                                                </p>
                                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                                    {child.class?.name || 'Assigned'}
                                                </p>
                                            </div>
                                        </div>
                                        <ChevronRight size={16} className="text-slate-300 group-hover:text-slate-900 transform group-hover:translate-x-1 transition-all" />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="p-6 bg-slate-900 rounded-3xl text-white">
                        <div className="flex items-center gap-3 mb-4">
                            <Info size={20} className="text-slate-400" />
                            <h4 className="font-bold uppercase tracking-widest text-xs">Emergency Contact</h4>
                        </div>
                        <p className="text-2xl font-black mb-1">{profile?.emergencyContact || 'Not Set'}</p>
                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-tighter">Primary point of contact for school alerts.</p>
                    </div>
                </div>
            </div>
        </div>
    );
}

function ProfileItem({ label, value, icon, large = false }: { label: string; value?: string; icon?: React.ReactNode; large?: boolean }) {
    if (!value) return null;
    return (
        <div className="flex flex-col">
            <span className={`font-bold text-slate-400 uppercase tracking-widest mb-1 ${large ? 'text-[11px]' : 'text-[10px]'}`}>
                {label}
            </span>
            <div className="flex items-center gap-2">
                {icon && <span className="text-slate-400">{icon}</span>}
                <span className={`font-bold text-slate-900 tracking-tight ${large ? 'text-lg' : 'text-sm'}`}>
                    {value}
                </span>
            </div>
        </div>
    );
}
