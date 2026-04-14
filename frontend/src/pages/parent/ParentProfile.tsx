import React, { useEffect, useState } from 'react';
import {
    User, Mail, Phone, MapPin, Briefcase,
    ShieldCheck, Users, AlertCircle, Loader2,
    Heart, ChevronRight
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api, { getFileUrl } from '../../services/api';
import { useAuthStore } from '../../stores/authStore';

export default function ParentProfile() {
    const { setSelectedChildId } = useAuthStore();
    const navigate = useNavigate();

    const [profile, setProfile] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchProfile = async () => {
            try {
                const response = await api.getParentProfile();
                const data = response?.data || response;
                setProfile(data);
            } catch (error) {
                console.error('Failed to fetch parent profile:', error);
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
                <Loader2 className="h-8 w-8 text-primary-600 animate-spin" />
                <p className="text-sm text-gray-500 dark:text-gray-400">Loading your profile...</p>
            </div>
        );
    }

    // Name Cleanup Utility
    const cleanName = (name: string) => {
        if (!name) return '';
        return name.replace(/\s*Member\s*$/gi, '').trim();
    };

    const parentDisplayName =
        cleanName(profile?.fatherName || profile?.motherName || profile?.guardianName || 'Parent');
    const initials = parentDisplayName.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase();

    return (
        <div className="max-w-5xl mx-auto space-y-6 pb-12">

            {/* Page Header */}
            <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">My Profile</h1>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                    Your personal information and linked family members.
                </p>
            </div>

            {/* Identity Hero Card */}
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm p-6">
                <div className="flex items-center gap-5">
                    {/* Avatar — show guardian photo if exists, else initials */}
                    {profile?.guardianPhoto ? (
                        <img
                            src={getFileUrl(profile.guardianPhoto)}
                            alt={parentDisplayName}
                            className="w-16 h-16 rounded-full object-cover border-2 border-gray-200 dark:border-gray-600 flex-shrink-0"
                        />
                    ) : (
                        <div className="w-16 h-16 rounded-full bg-primary-600 flex items-center justify-center text-xl font-bold text-white flex-shrink-0">
                            {initials}
                        </div>
                    )}
                    <div className="flex-1 min-w-0">
                        <h2 className="text-xl font-bold text-gray-900 dark:text-white truncate">{parentDisplayName}</h2>
                        <div className="flex flex-wrap items-center gap-2 mt-1.5">
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-md text-xs font-semibold">
                                <User className="w-3 h-3" />
                                Parent Account
                            </span>
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-md text-xs font-semibold">
                                <ShieldCheck className="w-3 h-3" />
                                Verified
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left Column: Family Info */}
                <div className="lg:col-span-2 space-y-6">

                    {/* Parents Section */}
                    {(profile?.fatherName || profile?.motherName) && (
                        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
                            <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-700">
                                <h3 className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-2">
                                    <Users className="w-4 h-4 text-gray-400" />
                                    Parents
                                </h3>
                            </div>
                            <div className="divide-y divide-gray-100 dark:divide-gray-700">
                                {profile?.fatherName && (
                                    <div className="px-6 py-5">
                                        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Father</p>
                                        <div className="grid grid-cols-2 gap-x-8 gap-y-4">
                                            <InfoItem label="Full Name" value={cleanName(profile.fatherName)} icon={<User className="w-3.5 h-3.5" />} />
                                            <InfoItem label="Phone" value={profile.fatherPhone} icon={<Phone className="w-3.5 h-3.5" />} />
                                            <InfoItem label="Email" value={profile.fatherEmail} icon={<Mail className="w-3.5 h-3.5" />} />
                                            <InfoItem label="Occupation" value={profile.fatherOccupation} icon={<Briefcase className="w-3.5 h-3.5" />} />
                                        </div>
                                    </div>
                                )}
                                {profile?.motherName && (
                                    <div className="px-6 py-5">
                                        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Mother</p>
                                        <div className="grid grid-cols-2 gap-x-8 gap-y-4">
                                            <InfoItem label="Full Name" value={cleanName(profile.motherName)} icon={<User className="w-3.5 h-3.5" />} />
                                            <InfoItem label="Phone" value={profile.motherPhone} icon={<Phone className="w-3.5 h-3.5" />} />
                                            <InfoItem label="Email" value={profile.motherEmail} icon={<Mail className="w-3.5 h-3.5" />} />
                                            <InfoItem label="Occupation" value={profile.motherOccupation} icon={<Briefcase className="w-3.5 h-3.5" />} />
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Guardian Section */}
                    {(profile?.guardianName || profile?.guardianEmail) && (
                        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
                            <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-700">
                                <h3 className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-2">
                                    <Heart className="w-4 h-4 text-gray-400" />
                                    Guardian Details
                                </h3>
                            </div>
                            <div className="px-6 py-5">
                                <div className="grid grid-cols-2 gap-x-8 gap-y-4">
                                    <InfoItem label="Guardian Name" value={cleanName(profile.guardianName)} icon={<User className="w-3.5 h-3.5" />} />
                                    <InfoItem label="Relationship" value={profile.guardianRelation} />
                                    <InfoItem label="Phone" value={profile.guardianPhone} icon={<Phone className="w-3.5 h-3.5" />} />
                                    <InfoItem label="Email" value={profile.guardianEmail} icon={<Mail className="w-3.5 h-3.5" />} />
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Address & Emergency Contact */}
                    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
                        <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-700">
                            <h3 className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-2">
                                <MapPin className="w-4 h-4 text-gray-400" />
                                Address & Contact
                            </h3>
                        </div>
                        <div className="px-6 py-5 space-y-4">
                            {profile?.guardianAddress && (
                                <div>
                                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Guardian Address</p>
                                    <p className="text-sm text-gray-700 dark:text-gray-300 font-medium">
                                        {profile.guardianAddress}
                                    </p>
                                </div>
                            )}
                            {profile?.permanentAddress && (
                                <div>
                                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Permanent Address</p>
                                    <p className="text-sm text-gray-700 dark:text-gray-300 font-medium">
                                        {profile.permanentAddress}
                                    </p>
                                </div>
                            )}
                            {profile?.currentAddress && (
                                <div>
                                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Current Address</p>
                                    <p className="text-sm text-gray-700 dark:text-gray-300 font-medium">
                                        {profile.currentAddress}
                                    </p>
                                </div>
                            )}
                            {!profile?.guardianAddress && !profile?.permanentAddress && !profile?.currentAddress && (
                                <p className="text-sm text-gray-400">—</p>
                            )}
                            <div>
                                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Emergency Contact</p>
                                <p className="text-sm text-gray-700 dark:text-gray-300 font-medium flex items-center gap-1.5">
                                    <AlertCircle className="w-3.5 h-3.5 text-yellow-500" />
                                    {profile?.emergencyContact || '—'}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Column: Children */}
                <div className="space-y-6">
                    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
                        <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-700">
                            <h3 className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-2">
                                <Users className="w-4 h-4 text-gray-400" />
                                My Children
                                {profile?.students?.length > 0 && (
                                    <span className="ml-auto bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 text-xs font-bold px-2 py-0.5 rounded-full">
                                        {profile.students.length}
                                    </span>
                                )}
                            </h3>
                        </div>
                        <div className="divide-y divide-gray-100 dark:divide-gray-700">
                            {profile?.students?.length > 0 ? profile.students.map((child: any) => (
                                <button
                                    key={child.id}
                                    onClick={() => handleSelectChild(child.id)}
                                    className="w-full px-5 py-4 flex items-center gap-3 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors text-left group"
                                >
                                    <div className="w-9 h-9 rounded-full bg-primary-50 dark:bg-primary-900/30 flex items-center justify-center text-xs font-bold text-primary-700 dark:text-primary-400 flex-shrink-0">
                                        {child.firstName?.charAt(0)}{child.lastName?.charAt(0)}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                                            {child.firstName} {child.lastName}
                                        </p>
                                        <p className="text-xs text-gray-400 dark:text-gray-500 truncate">
                                            {child.class?.name || child.className || 'No class assigned'}
                                        </p>
                                    </div>
                                    <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-primary-500 group-hover:translate-x-0.5 transition-all flex-shrink-0" />
                                </button>
                            )) : (
                                <div className="px-6 py-8 text-center">
                                    <Users className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                                    <p className="text-sm text-gray-400">No children linked to this account.</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

function InfoItem({ label, value, icon }: { label: string; value?: string; icon?: React.ReactNode }) {
    if (!value) return null;
    return (
        <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">{label}</p>
            <p className="text-sm font-semibold text-gray-800 dark:text-gray-200 flex items-center gap-1.5">
                {icon && <span className="text-gray-400">{icon}</span>}
                {value}
            </p>
        </div>
    );
}
