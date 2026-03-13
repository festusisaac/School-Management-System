
import { useParams, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { useToast } from '../../context/ToastContext';
import {
    ArrowLeft, MapPin, BookOpen, User, Building2,
    Users, Printer, Edit, DollarSign,
    FileText, GraduationCap, ClipboardList, Clock,
    QrCode as QrCodeIcon, Barcode as BarcodeIcon, ShieldAlert, ShieldCheck
} from 'lucide-react';
import api from '../../services/api';

export default function StudentProfile() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { showSuccess } = useToast();
    const [student, setStudent] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('Profile');

    const handlePrint = () => {
        window.print();
    };

    useEffect(() => {
        const fetchStudent = async () => {
            if (!id) return;
            try {
                const data = await api.getStudentById(id);
                setStudent(data);
            } catch (error) {
                console.error("Failed to fetch student profile", error);
            } finally {
                setLoading(false);
            }
        };
        fetchStudent();
    }, [id]);

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[400px] gap-3">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
                <p className="text-gray-500 font-medium animate-pulse">Loading profile...</p>
            </div>
        );
    }

    if (!student) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
                <ShieldAlert className="w-16 h-16 text-red-500" />
                <h2 className="text-xl font-bold text-gray-800">Student Not Found</h2>
                <button
                    onClick={() => navigate(-1)}
                    className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors"
                >
                    <ArrowLeft className="w-4 h-4" /> Go Back
                </button>
            </div>
        );
    }

    const tabs = [
        { id: 'Profile', label: 'Profile', icon: User },
        { id: 'Fees', label: 'Fees', icon: DollarSign },
        { id: 'Exam', label: 'Exam', icon: GraduationCap },
        { id: 'CBSE Examination', label: 'CBSE Examination', icon: BookOpen },
        { id: 'Attendance', label: 'Attendance', icon: Clock },
        { id: 'Documents', label: 'Documents', icon: FileText }
    ];


    const SectionHeader = ({ title, icon: Icon }: { title: string, icon?: any }) => (
        <div className="flex items-center gap-3 px-6 py-4 bg-gray-50/50 dark:bg-gray-800/30 border-b border-gray-100 dark:border-gray-800/50">
            {Icon && <Icon className="w-4 h-4 text-orange-600 dark:text-orange-500" />}
            <h3 className="text-xs font-black text-gray-500 dark:text-gray-400 uppercase tracking-[0.2em] font-heading">{title}</h3>
        </div>
    );

    const DataRow = ({ label, value, isLast = false }: { label: string, value: any, isLast?: boolean }) => (
        <div className={`grid grid-cols-[160px_1fr] items-center gap-6 py-3.5 px-6 border-b border-gray-50 dark:border-gray-800/50 last:border-0 ${isLast ? 'border-b-0' : ''}`}>
            <span className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-tight">{label}</span>
            <span className="text-sm font-black text-gray-900 dark:text-gray-100 truncate">{value || '-'}</span>
        </div>
    );

    const InfoCard = ({ children, className = "" }: { children: React.ReactNode, className?: string }) => (
        <div className={`bg-white dark:bg-gray-900 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-800/50 overflow-hidden ${className}`}>
            {children}
        </div>
    );

    return (
        <div className="w-full px-4 md:px-10 pb-16 space-y-6 bg-[#F9FAFB] dark:bg-gray-950 min-h-screen font-sans">
            {/* Professional Sticky Navigation Header */}
            <div className="sticky top-4 z-50 flex items-center justify-between bg-white/80 dark:bg-gray-900/80 p-2 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-800 backdrop-blur-xl no-print transition-all">
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => navigate(-1)}
                        className="p-3 bg-gray-50 dark:bg-gray-800 hover:bg-white dark:hover:bg-gray-700 hover:shadow-sm rounded-xl border border-transparent hover:border-gray-200 dark:hover:border-gray-600 transition-all text-gray-400 dark:text-gray-500 hover:text-gray-900 dark:hover:text-gray-100 group"
                    >
                        <ArrowLeft className="w-5 h-5 transition-transform group-hover:-translate-x-1" />
                    </button>
                    <div className="h-10 w-px bg-gray-100 dark:bg-gray-800 mx-1" />
                    <div className="flex items-center gap-1 overflow-x-auto scrollbar-hide">
                        {tabs.map((tab) => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`flex items-center gap-2 px-4 py-2.5 text-xs font-black transition-all rounded-xl whitespace-nowrap ${activeTab === tab.id
                                    ? 'text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-500/10'
                                    : 'text-gray-500 dark:text-gray-500 hover:text-gray-900 dark:hover:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800/50'
                                    }`}
                            >
                                <tab.icon className={`w-3.5 h-3.5 ${activeTab === tab.id ? 'text-orange-600' : 'text-gray-400'}`} />
                                <span className="uppercase tracking-wider">{tab.label}</span>
                            </button>
                        ))}
                    </div>
                </div>

            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 outline-none no-print">
                {/* Left Column: Identity Sidebar (Fixed Width) */}
                <div className="lg:col-span-4 flex flex-col gap-6">
                    {/* Primary Avatar & ID Card */}
                    <InfoCard className="p-8 flex flex-col items-center text-center">
                        <div className="relative mb-6">
                            <div className="w-40 h-40 rounded-[2.5rem] bg-gray-50 dark:bg-gray-800 overflow-hidden ring-4 ring-gray-100 dark:ring-gray-800 shadow-xl">
                                {student.studentPhoto ? (
                                    <img src={`http://localhost:3000/${student.studentPhoto}`} alt={student.firstName} className="w-full h-full object-cover" />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-5xl font-black text-gray-200 dark:text-gray-700">
                                        {student.firstName[0]}{student.lastName?.[0]}
                                    </div>
                                )}
                            </div>
                            <div className="absolute -bottom-2 -right-2 bg-white dark:bg-gray-900 p-2.5 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-800">
                                <QrCodeIcon className="w-6 h-6 text-gray-400 dark:text-gray-500" />
                            </div>
                        </div>

                        <h2 className="text-2xl font-black text-gray-900 dark:text-white font-heading mb-2">{student.firstName} {student.lastName}</h2>

                        <div className="flex flex-wrap justify-center gap-2 mb-6">
                            <span className="px-3 py-1 bg-primary-50 dark:bg-primary-500/10 border border-primary-100 dark:border-primary-500/20 text-primary-600 dark:text-primary-400 text-[10px] font-black uppercase tracking-widest rounded-lg">
                                {student.class?.name || 'Academic'}
                            </span>
                            <span className="px-3 py-1 bg-orange-50 dark:bg-orange-500/10 border border-orange-100 dark:border-orange-500/20 text-orange-600 dark:text-orange-400 text-[10px] font-black uppercase tracking-widest rounded-lg">
                                {student.gender}
                            </span>
                        </div>

                        <div className="w-full space-y-4 pt-6 border-t border-gray-50 dark:border-gray-800">
                            {[
                                { label: 'Admission No', value: student.admissionNo, icon: ShieldCheck },
                                { label: 'Roll Number', value: student.rollNo, icon: GraduationCap },
                                { label: 'Category', value: student.category?.category, icon: BookOpen }
                            ].map((item, i) => (
                                <div key={i} className="flex justify-between items-center text-sm">
                                    <div className="flex items-center gap-3 text-gray-400 dark:text-gray-500">
                                        <item.icon className="w-4 h-4" />
                                        <span className="font-bold uppercase text-[10px] tracking-widest">{item.label}</span>
                                    </div>
                                    <span className="font-black text-gray-900 dark:text-gray-100">{item.value || '-'}</span>
                                </div>
                            ))}
                        </div>

                        <div className="w-full pt-8 grid grid-cols-2 gap-3">
                            <button
                                onClick={() => navigate(`/students/admission?id=${student.id}&edit=true`)}
                                className="flex items-center justify-center gap-2 py-3.5 bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-900 dark:text-white rounded-2xl text-[10px] font-black transition-all border border-gray-100 dark:border-gray-700 group"
                            >
                                <Edit className="w-3.5 h-3.5 text-gray-400 group-hover:text-primary-500 transition-colors" />
                                <span className="uppercase tracking-widest">Edit</span>
                            </button>
                            <button
                                onClick={handlePrint}
                                className="flex items-center justify-center gap-2 py-3.5 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-2xl text-[10px] font-black transition-all shadow-lg hover:scale-[1.02] active:scale-95 group"
                            >
                                <Printer className="w-3.5 h-3.5 text-gray-400 dark:text-gray-500" />
                                <span className="uppercase tracking-widest">Print</span>
                            </button>
                        </div>
                    </InfoCard>

                    {/* Siblings: Structured Header & List */}
                    <InfoCard>
                        <SectionHeader title="Sibling Connection" icon={Users} />
                        <div className="p-4 space-y-3">
                            {((student.parent?.students || []).filter((s: any) => s.id !== student.id)).length > 0 ? (
                                student.parent.students.filter((s: any) => s.id !== student.id).map((sibling: any) => (
                                    <div
                                        key={sibling.id}
                                        onClick={() => {
                                            navigate(`/students/profile/${sibling.id}`);
                                            showSuccess(`Switched to ${sibling.firstName}'s Profile`);
                                        }}
                                        className="flex items-center gap-4 p-3 rounded-2xl hover:bg-gray-50 dark:hover:bg-gray-800/50 cursor-pointer transition-all border border-transparent hover:border-gray-100 dark:hover:border-gray-800 group"
                                    >
                                        <div className="w-12 h-12 rounded-xl bg-gray-50 dark:bg-gray-800 overflow-hidden ring-1 ring-gray-100 dark:ring-gray-700">
                                            {sibling.studentPhoto ? (
                                                <img src={`http://localhost:3000/${sibling.studentPhoto}`} alt={sibling.firstName} className="w-full h-full object-cover" />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center text-xs font-black text-gray-400 uppercase">
                                                    {sibling.firstName[0]}
                                                </div>
                                            )}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-black text-gray-900 dark:text-white truncate group-hover:text-primary-500 transition-colors uppercase font-heading">{sibling.firstName} {sibling.lastName}</p>
                                            <p className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest">{sibling.class?.name || 'Class N/A'}</p>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="text-center py-8">
                                    <p className="text-[10px] font-black text-gray-400 dark:text-gray-600 uppercase tracking-widest italic">No Siblings Registered</p>
                                </div>
                            )}
                        </div>
                    </InfoCard>

                    {/* Barcode Identity */}
                    <InfoCard className="p-6 flex flex-col items-center gap-3">
                        <BarcodeIcon className="w-full h-12 text-gray-800 dark:text-gray-300 opacity-60" />
                        <p className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest">Access Identity {student.admissionNo}</p>
                    </InfoCard>
                </div>

                {/* Right Column: Main Data Sections (Dense & Structured) */}
                <div className="lg:col-span-8 flex flex-col gap-6">
                    {activeTab === 'Profile' ? (
                        <>
                            {/* General Information */}
                            <InfoCard>
                                <SectionHeader title="Core Student Profile" icon={User} />
                                <div className="divide-y divide-gray-50 dark:divide-gray-800/10">
                                    <div className="grid grid-cols-1">
                                        {[
                                            { label: 'Full Legal Name', value: `${student.firstName} ${student.lastName}` },
                                            { label: 'Date Of Admission', value: new Date(student.admissionDate).toLocaleDateString(undefined, { dateStyle: 'long' }) },
                                            { label: 'Date Of Birth', value: new Date(student.dob).toLocaleDateString(undefined, { dateStyle: 'long' }) },
                                            { label: 'Mobile Number', value: student.mobileNumber },
                                            { label: 'Personal Email', value: student.email },
                                            { label: 'Blood Group', value: student.bloodGroup },
                                            { label: 'Religion / Caste', value: `${student.religion || '-'} / ${student.caste || '-'}` },
                                            { label: 'Student House', value: student.house?.houseName },
                                            { label: 'Medical Records', value: student.medicalHistory || 'No medical history reported' },
                                            { label: 'Administrative Note', value: student.note }
                                        ].map((item, i) => (
                                            <DataRow key={i} label={item.label} value={item.value} />
                                        ))}
                                    </div>
                                </div>
                            </InfoCard>

                            {/* Parent & Guardian Info */}
                            <InfoCard>
                                <SectionHeader title="Family & Guardianship" icon={Users} />
                                <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-10">
                                    <div className="space-y-6">
                                        <h4 className="text-[10px] font-black text-orange-600 dark:text-orange-500 uppercase tracking-[0.2em] mb-4">Paternal Details</h4>
                                        <div className="space-y-4">
                                            <div>
                                                <p className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase mb-1">Father's Name</p>
                                                <p className="text-sm font-black text-gray-900 dark:text-gray-100">{student.fatherName || '-'}</p>
                                            </div>
                                            <div className="grid grid-cols-2 gap-4">
                                                <div>
                                                    <p className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase mb-1">Phone</p>
                                                    <p className="text-sm font-black text-gray-900 dark:text-gray-100">{student.fatherPhone || '-'}</p>
                                                </div>
                                                <div>
                                                    <p className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase mb-1">Occupation</p>
                                                    <p className="text-sm font-black text-gray-900 dark:text-gray-100">{student.fatherOccupation || '-'}</p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="space-y-6">
                                        <h4 className="text-[10px] font-black text-primary-600 dark:text-primary-500 uppercase tracking-[0.2em] mb-4">Maternal Details</h4>
                                        <div className="space-y-4">
                                            <div>
                                                <p className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase mb-1">Mother's Name</p>
                                                <p className="text-sm font-black text-gray-900 dark:text-gray-100">{student.motherName || '-'}</p>
                                            </div>
                                            <div className="grid grid-cols-2 gap-4">
                                                <div>
                                                    <p className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase mb-1">Phone</p>
                                                    <p className="text-sm font-black text-gray-900 dark:text-gray-100">{student.motherPhone || '-'}</p>
                                                </div>
                                                <div>
                                                    <p className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase mb-1">Occupation</p>
                                                    <p className="text-sm font-black text-gray-900 dark:text-gray-100">{student.motherOccupation || '-'}</p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div className="p-8 bg-gray-50/30 dark:bg-gray-800/20 border-t border-gray-50 dark:border-gray-800">
                                    <h4 className="text-[10px] font-black text-secondary-600 dark:text-secondary-400 uppercase tracking-[0.2em] mb-6">Secondary Guardian Info</h4>
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                                        {[
                                            { label: 'Guardian', value: student.guardianName },
                                            { label: 'Relation', value: student.guardianRelation },
                                            { label: 'Contact', value: student.guardianPhone }
                                        ].map((item, i) => (
                                            <div key={i}>
                                                <p className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase mb-1">{item.label}</p>
                                                <p className="text-sm font-black text-gray-900 dark:text-gray-100">{item.value || '-'}</p>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </InfoCard>

                            {/* Address & Logistics Grid */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <InfoCard>
                                    <SectionHeader title="Residential Info" icon={MapPin} />
                                    <div className="p-6 space-y-6">
                                        <div>
                                            <p className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase mb-2">Current Address</p>
                                            <p className="text-sm font-black text-gray-900 dark:text-gray-200 leading-relaxed">{student.currentAddress || 'N/A'}</p>
                                        </div>
                                        <div className="pt-6 border-t border-gray-50 dark:border-gray-800">
                                            <p className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase mb-2">Permanent Address</p>
                                            <p className="text-sm font-black text-gray-900 dark:text-gray-200 leading-relaxed">{student.permanentAddress || student.currentAddress || 'N/A'}</p>
                                        </div>
                                    </div>
                                </InfoCard>
                                <InfoCard>
                                    <SectionHeader title="School Logistics" icon={Building2} />
                                    <div className="p-6 space-y-6">
                                        <div className="grid grid-cols-2 gap-6">
                                            {[
                                                { label: 'Route', value: student.transportRoute },
                                                { label: 'Pickup', value: student.pickupPoint },
                                                { label: 'Vehicle', value: student.vehicleNumber },
                                                { label: 'Hostel', value: student.hostelName }
                                            ].map((item, i) => (
                                                <div key={i}>
                                                    <p className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase mb-1">{item.label}</p>
                                                    <p className="text-sm font-black text-gray-900 dark:text-gray-100">{item.value || 'N/A'}</p>
                                                </div>
                                            ))}
                                        </div>
                                        <div className="pt-6 border-t border-gray-50 dark:border-gray-800">
                                            <p className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase mb-1">Room Assignment</p>
                                            <p className="text-sm font-black text-gray-900 dark:text-gray-100">
                                                {student.roomNumber ? `Room ${student.roomNumber} (${student.roomType || 'Standard'})` : 'No Hostel Room Assigned'}
                                            </p>
                                        </div>
                                    </div>
                                </InfoCard>
                            </div>
                        </>
                    ) : (
                        <InfoCard className="flex flex-col items-center justify-center py-40 min-h-[600px]">
                            <div className="w-24 h-24 bg-gray-50 dark:bg-gray-800 rounded-3xl flex items-center justify-center border border-gray-100 dark:border-gray-800 mb-6">
                                <ClipboardList className="w-10 h-10 text-orange-200/50 dark:text-orange-500/10" />
                            </div>
                            <h4 className="text-xl font-black text-gray-900 dark:text-white tracking-widest">{activeTab} Record</h4>
                            <p className="text-xs text-gray-500 dark:text-gray-400 font-bold max-w-xs text-center leading-relaxed">System is currently synchronizing historical data for this module. Please check back shortly.</p>
                        </InfoCard>
                    )}
                </div>
            </div>

            {/* Simple Print Template */}
            <div className="hidden print:block print:relative print:bg-white p-4 font-serif w-full print:m-0">
                {/* School Header */}
                <div className="text-center pb-2 mb-4">
                    <h1 className="text-3xl font-bold text-black uppercase">SMS ACADEMY</h1>
                    <p className="text-sm font-bold text-gray-800 tracking-widest uppercase mt-1">Student Profile Information Sheet</p>
                </div>

                <div className="flex gap-6 mb-4 pb-2 justify-between">
                    <div className="flex gap-6">
                        {/* Photo */}
                        <div className="w-24 h-24 border-2 border-black flex-shrink-0 p-1">
                            {student.studentPhoto ? (
                                <img src={`http://localhost:3000/${student.studentPhoto}`} alt={student.firstName} className="w-full h-full object-cover" />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center text-gray-400 font-bold uppercase text-[8px] text-center font-serif">Passport Photo</div>
                            )}
                        </div>

                        {/* Top Stats */}
                        <div className="flex-1 grid grid-cols-2 gap-x-8 gap-y-2">
                            <div>
                                <p className="text-[9px] font-bold text-gray-600 uppercase mb-0.5">Student Name</p>
                                <p className="text-xs font-bold text-black">{student.firstName} {student.lastName}</p>
                            </div>
                            <div>
                                <p className="text-[9px] font-bold text-gray-600 uppercase mb-0.5">Admission Number</p>
                                <p className="text-xs font-bold text-black break-all">{student.admissionNo}</p>
                            </div>
                            <div>
                                <p className="text-[9px] font-bold text-gray-600 uppercase mb-0.5">Class & Section</p>
                                <p className="text-xs font-bold text-black">{student.class?.name || 'N/A'} - {student.section?.name || 'A'}</p>
                            </div>
                            <div>
                                <p className="text-[9px] font-bold text-gray-600 uppercase mb-0.5">Roll Number</p>
                                <p className="text-xs font-bold text-black">{student.rollNo || 'N/A'}</p>
                            </div>
                        </div>
                    </div>

                    {/* Barcode and QR Code */}
                    <div className="flex flex-col items-end gap-2 flex-shrink-0">
                        <div className="flex flex-col items-center">
                            <svg className="w-32 h-12" viewBox="0 0 128 48">
                                {/* Simple barcode representation */}
                                <rect x="2" y="4" width="2" height="36" fill="black" />
                                <rect x="6" y="4" width="1" height="36" fill="black" />
                                <rect x="9" y="4" width="3" height="36" fill="black" />
                                <rect x="14" y="4" width="1" height="36" fill="black" />
                                <rect x="17" y="4" width="2" height="36" fill="black" />
                                <rect x="21" y="4" width="1" height="36" fill="black" />
                                <rect x="24" y="4" width="3" height="36" fill="black" />
                                <rect x="29" y="4" width="2" height="36" fill="black" />
                                <rect x="33" y="4" width="1" height="36" fill="black" />
                                <rect x="36" y="4" width="2" height="36" fill="black" />
                                <rect x="40" y="4" width="3" height="36" fill="black" />
                                <rect x="45" y="4" width="1" height="36" fill="black" />
                                <rect x="48" y="4" width="2" height="36" fill="black" />
                                <rect x="52" y="4" width="1" height="36" fill="black" />
                                <rect x="55" y="4" width="3" height="36" fill="black" />
                                <rect x="60" y="4" width="2" height="36" fill="black" />
                                <rect x="64" y="4" width="1" height="36" fill="black" />
                                <rect x="67" y="4" width="2" height="36" fill="black" />
                                <rect x="71" y="4" width="3" height="36" fill="black" />
                                <rect x="76" y="4" width="1" height="36" fill="black" />
                                <rect x="79" y="4" width="2" height="36" fill="black" />
                                <rect x="83" y="4" width="1" height="36" fill="black" />
                                <rect x="86" y="4" width="3" height="36" fill="black" />
                                <rect x="91" y="4" width="2" height="36" fill="black" />
                                <rect x="95" y="4" width="1" height="36" fill="black" />
                                <rect x="98" y="4" width="2" height="36" fill="black" />
                                <rect x="102" y="4" width="3" height="36" fill="black" />
                                <rect x="107" y="4" width="1" height="36" fill="black" />
                                <rect x="110" y="4" width="2" height="36" fill="black" />
                                <rect x="114" y="4" width="1" height="36" fill="black" />
                                <rect x="117" y="4" width="3" height="36" fill="black" />
                                <rect x="122" y="4" width="2" height="36" fill="black" />
                            </svg>
                        </div>
                        <div className="w-16 h-16 border border-black p-0.5">
                            <svg className="w-full h-full" viewBox="0 0 21 21">
                                {/* Simple QR code pattern */}
                                <rect width="21" height="21" fill="white" />
                                <rect x="0" y="0" width="7" height="7" fill="none" stroke="black" strokeWidth="0.5" />
                                <rect x="14" y="0" width="7" height="7" fill="none" stroke="black" strokeWidth="0.5" />
                                <rect x="0" y="14" width="7" height="7" fill="none" stroke="black" strokeWidth="0.5" />
                                <rect x="2" y="2" width="3" height="3" fill="black" />
                                <rect x="16" y="2" width="3" height="3" fill="black" />
                                <rect x="2" y="16" width="3" height="3" fill="black" />
                                <rect x="8" y="1" width="1" height="1" fill="black" />
                                <rect x="10" y="1" width="1" height="1" fill="black" />
                                <rect x="12" y="1" width="1" height="1" fill="black" />
                                <rect x="9" y="3" width="1" height="1" fill="black" />
                                <rect x="11" y="3" width="1" height="1" fill="black" />
                                <rect x="8" y="5" width="1" height="1" fill="black" />
                                <rect x="10" y="5" width="1" height="1" fill="black" />
                                <rect x="12" y="5" width="1" height="1" fill="black" />
                                <rect x="1" y="8" width="1" height="1" fill="black" />
                                <rect x="3" y="8" width="1" height="1" fill="black" />
                                <rect x="5" y="8" width="1" height="1" fill="black" />
                                <rect x="9" y="9" width="1" height="1" fill="black" />
                                <rect x="11" y="9" width="1" height="1" fill="black" />
                                <rect x="15" y="8" width="1" height="1" fill="black" />
                                <rect x="17" y="8" width="1" height="1" fill="black" />
                                <rect x="19" y="8" width="1" height="1" fill="black" />
                                <rect x="8" y="11" width="1" height="1" fill="black" />
                                <rect x="10" y="11" width="1" height="1" fill="black" />
                                <rect x="12" y="11" width="1" height="1" fill="black" />
                                <rect x="14" y="10" width="1" height="1" fill="black" />
                                <rect x="16" y="10" width="1" height="1" fill="black" />
                                <rect x="18" y="10" width="1" height="1" fill="black" />
                                <rect x="9" y="13" width="1" height="1" fill="black" />
                                <rect x="11" y="13" width="1" height="1" fill="black" />
                                <rect x="15" y="15" width="1" height="1" fill="black" />
                                <rect x="17" y="15" width="1" height="1" fill="black" />
                                <rect x="19" y="15" width="1" height="1" fill="black" />
                                <rect x="14" y="17" width="1" height="1" fill="black" />
                                <rect x="16" y="17" width="1" height="1" fill="black" />
                                <rect x="18" y="17" width="1" height="1" fill="black" />
                                <rect x="15" y="19" width="1" height="1" fill="black" />
                                <rect x="17" y="19" width="1" height="1" fill="black" />
                                <rect x="19" y="19" width="1" height="1" fill="black" />
                            </svg>
                        </div>
                    </div>
                </div>

                {/* Data Grid: Optimized Two-Column Layout */}
                <div className="grid grid-cols-2 gap-x-12 items-start">
                    {/* Left Column */}
                    <div className="space-y-6">
                        {/* General Information */}
                        <div>
                            <h3 className="text-[11px] font-bold mb-2 uppercase font-serif tracking-wider">01. General Information</h3>
                            <div className="space-y-2">
                                <PrintInfoRow label="Date of Birth" value={student.dob ? new Date(student.dob).toLocaleDateString() : 'N/A'} />
                                <PrintInfoRow label="Gender" value={student.gender} />
                                <PrintInfoRow label="Blood Group" value={student.bloodGroup || 'N/A'} />
                                <PrintInfoRow label="Religion" value={student.religion || 'N/A'} />
                                <PrintInfoRow label="Caste" value={student.caste || 'N/A'} />
                                <PrintInfoRow label="Mobile" value={student.mobileNumber || 'N/A'} />
                                <PrintInfoRow label="Email" value={student.email || 'N/A'} />
                            </div>
                        </div>

                        {/* Family Details */}
                        <div>
                            <h3 className="text-[11px] font-bold mb-2 uppercase font-serif tracking-wider">02. Family Details</h3>
                            <div className="space-y-2">
                                <PrintInfoRow label="Father Name" value={student.fatherName || 'N/A'} />
                                <PrintInfoRow label="Father Contact" value={student.fatherPhone || 'N/A'} />
                                <PrintInfoRow label="Father Occupation" value={student.fatherOccupation || 'N/A'} />
                                <PrintInfoRow label="Mother Name" value={student.motherName || 'N/A'} />
                                <PrintInfoRow label="Mother Contact" value={student.motherPhone || 'N/A'} />
                                <PrintInfoRow label="Guardian Name" value={student.guardianName || 'N/A'} />
                                <PrintInfoRow label="Guardian Relation" value={student.guardianRelation || 'N/A'} />
                                <PrintInfoRow label="Guardian Phone" value={student.guardianPhone || 'N/A'} />
                            </div>
                        </div>

                        {/* Miscellaneous */}
                        <div>
                            <h3 className="text-[11px] font-bold mb-2 uppercase font-serif tracking-wider">03. Miscellaneous</h3>
                            <div className="space-y-2">
                                <PrintInfoRow label="Student House" value={student.house?.houseName || 'N/A'} />
                                <PrintInfoRow label="Height" value={student.height ? `${student.height} cm` : 'N/A'} />
                                <PrintInfoRow label="Weight" value={student.weight ? `${student.weight} kg` : 'N/A'} />
                                <PrintInfoRow label="Last Measured" value={student.asOnDate ? new Date(student.asOnDate).toLocaleDateString() : 'N/A'} />
                            </div>
                        </div>
                    </div>

                    {/* Right Column */}
                    <div className="space-y-6">
                        {/* Address Details */}
                        <div>
                            <h3 className="text-[11px] font-bold mb-2 uppercase font-serif tracking-wider">04. Address Details</h3>
                            <div className="space-y-4">
                                <PrintInfoRow label="Current Address" value={student.currentAddress || 'N/A'} isMulti />
                                <PrintInfoRow label="Permanent Address" value={student.permanentAddress || 'N/A'} isMulti />
                            </div>
                        </div>

                        {/* Academic Background */}
                        <div>
                            <h3 className="text-[11px] font-bold mb-2 uppercase font-serif tracking-wider">05. Academic Background</h3>
                            <div className="space-y-2">
                                <PrintInfoRow label="Admission Date" value={student.admissionDate ? new Date(student.admissionDate).toLocaleDateString() : 'N/A'} />
                                <PrintInfoRow label="Previous School" value={student.previousSchool || 'N/A'} />
                                <PrintInfoRow label="Category" value={student.category?.category || 'N/A'} />
                            </div>
                        </div>

                        {/* Transport & Hostel */}
                        <div>
                            <h3 className="text-[11px] font-bold mb-2 uppercase font-serif tracking-wider">06. Transport & Hostel</h3>
                            <div className="space-y-2">
                                <PrintInfoRow label="Route / Vehicle" value={`${student.transportRoute || 'N/A'} / ${student.vehicleNumber || 'N/A'}`} />
                                <PrintInfoRow label="Pickup Point" value={student.pickupPoint || 'N/A'} />
                                <PrintInfoRow label="Hostel / Room" value={`${student.hostelName || 'N/A'} / ${student.roomNumber || 'N/A'}`} />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Note - Full Width Remaining */}
                {student.note && (
                    <div className="mt-4 pt-2">
                        <p className="text-[9px] font-bold text-gray-500 uppercase mb-1 font-serif">Internal Remarks / Notes</p>
                        <p className="text-xs italic text-gray-800 leading-relaxed font-serif max-w-4xl">{student.note}</p>
                    </div>
                )}

                {/* Signatures */}
                <div className="mt-10 flex justify-between px-10">
                    <div className="border-t-2 border-black w-56 pt-2 text-center">
                        <p className="text-xs font-bold uppercase font-serif">Office Registrar</p>
                    </div>
                    <div className="border-t-2 border-black w-56 pt-2 text-center">
                        <p className="text-xs font-bold uppercase font-serif">Authorized Signatory</p>
                    </div>
                </div>

                <div className="mt-6 text-center opacity-30">
                    <p className="text-[8px] uppercase font-bold tracking-[0.5em] font-serif">System Generated Document - Authenticity Required</p>
                    <p className="text-[8px] mt-1 italic font-serif">Printed on {new Date().toLocaleString()}</p>
                </div>
            </div>

            <style>{`
                @media print {
                    @page { margin: 0.5cm; size: A4; }
                    body { -webkit-print-color-adjust: exact; background: white !important; color: black !important; font-family: ui-serif, Georgia, Cambria, "Times New Roman", Times, serif !important; overflow: hidden !important; }
                    .no-print, header, nav, aside, footer { display: none !important; }
                    #root > div > div:first-child { display: none !important; }
                    main { margin: 0 !important; padding: 0 !important; width: 100% !important; overflow: hidden !important; }
                    .bg-white { background-color: white !important; }
                    * { border-color: black !important; page-break-inside: avoid !important; }
                    .print-container { width: 100% !important; page-break-inside: avoid !important; }
                    html, body { height: 100% !important; overflow: hidden !important; }
                }
            `}</style>
        </div >
    );
}

const PrintInfoRow = ({ label, value, isMulti, isHeader }: { label: string, value: string, isMulti?: boolean, isHeader?: boolean }) => (
    <div className={`flex justify-between items-start pb-1 ${isHeader ? 'py-1' : ''}`}>
        <span className={`${isHeader ? 'text-xs' : 'text-[10px]'} font-bold text-gray-600 uppercase w-40 flex-shrink-0 font-serif`}>{label}</span>
        <span className={`${isHeader ? 'text-base font-black' : 'text-xs font-bold'} text-black text-right flex-1 ${isMulti ? 'max-w-[300px]' : ''} font-serif`}>{value || 'N/A'}</span>
    </div>
);
