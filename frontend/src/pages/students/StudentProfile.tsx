import { useParams, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { useToast } from '../../context/ToastContext';
import {
    ArrowLeft, MapPin, BookOpen, User, Building2,
    Users, Printer, Edit, DollarSign,
    FileText, GraduationCap, ClipboardList, Clock,
    QrCode as QrCodeIcon, Barcode as BarcodeIcon, ShieldAlert, ShieldCheck,
    Phone, Mail, Calendar, Hash, Award, Shield, CheckCircle2, AlertCircle, CreditCard
} from 'lucide-react';
import api, { getFileUrl } from '../../services/api';
import { formatCurrency } from '../../utils/currency';
import { clsx } from 'clsx';
import { FeeNoticeTemplate } from '../finance/components/FeeNoticeTemplate';
import { createRoot } from 'react-dom/client';
import { useSystem } from '../../context/SystemContext';

export default function StudentProfile() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { showSuccess } = useToast();
    const { getSchoolInfo } = useSystem();
    const [student, setStudent] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('Profile');
    const [statement, setStatement] = useState<any>(null);
    const [loadingStatement, setLoadingStatement] = useState(false);
    const [txPage, setTxPage] = useState(1);
    const txItemsPerPage = 5;

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

    useEffect(() => {
        if (activeTab === 'Fees' && id && !statement) {
            fetchStatement();
        }
    }, [activeTab, id]);

    const fetchStatement = async () => {
        if (!id) return;
        setLoadingStatement(true);
        try {
            const data = await api.getStudentStatement(id);
            setStatement(data);
        } catch (error) {
            console.error("Failed to fetch statement", error);
        } finally {
            setLoadingStatement(false);
        }
    };

    const handlePrintNotice = () => {
        if (!student || !statement) return;
        
        const schoolInfo = getSchoolInfo();
        const printDiv = document.createElement('div');
        printDiv.style.display = 'none';
        document.body.appendChild(printDiv);

        const root = createRoot(printDiv);
        root.render(<FeeNoticeTemplate student={student} statement={statement} schoolInfo={schoolInfo} />);

        setTimeout(() => {
            const html = printDiv.innerHTML;
            root.unmount();
            document.body.removeChild(printDiv);

            const printWindow = window.open('', '', 'width=800,height=600');
            if (printWindow) {
                printWindow.document.write(`
                    <html>
                        <head>
                            <title>Fee Notice - ${student.firstName} ${student.lastName}</title>
                            <script src="https://cdn.tailwindcss.com"></script>
                        </head>
                        <body>
                            ${html}
                            <script>
                                window.onload = () => {
                                    window.print();
                                    window.close();
                                };
                            </script>
                        </body>
                    </html>
                `);
                printWindow.document.close();
            }
        }, 500);
    };

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
        <div className="px-6 py-5 border-b border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/80">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center">
                {Icon && <Icon className="w-5 h-5 mr-2 text-primary-600" />}
                {title}
            </h2>
        </div>
    );

    const DataRow = ({ label, value, isLast = false }: { label: string, value: any, isLast?: boolean }) => (
        <div className={`grid grid-cols-[160px_1fr] items-center gap-6 py-4 px-6 border-b border-gray-50 dark:border-gray-700/50 last:border-0 ${isLast ? 'border-b-0' : ''}`}>
            <span className="text-sm font-medium text-gray-500 dark:text-gray-400">{label}</span>
            <span className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">{value || '-'}</span>
        </div>
    );

    const InfoCard = ({ children, className = "", noBg = false }: { children: React.ReactNode, className?: string, noBg?: boolean }) => (
        <div className={clsx(
            "rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden",
            !noBg && "bg-white dark:bg-gray-800",
            className
        )}>
            {children}
        </div>
    );

    return (
        <div className="space-y-6">
            {/* Professional Sticky Navigation Header */}
            <div className="sticky top-4 z-50 flex items-center justify-between bg-white/80 dark:bg-gray-800/90 p-2 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 backdrop-blur-xl no-print transition-all">
                <div className="flex items-center gap-2 w-full overflow-x-auto scrollbar-hide">
                    <button
                        onClick={() => navigate(-1)}
                        className="p-2.5 bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 rounded-xl transition-all text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 flex-shrink-0"
                    >
                        <ArrowLeft className="w-5 h-5" />
                    </button>
                    <div className="h-8 w-px bg-gray-200 dark:bg-gray-700 mx-1 flex-shrink-0" />
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

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 outline-none no-print">
                {/* Left Column: Identity Sidebar (Fixed Width) */}
                <div className="lg:col-span-4 flex flex-col gap-6">
                    {/* Primary Avatar & ID Card */}
                    <InfoCard className="p-8 flex flex-col items-center text-center">
                        <div className="relative mb-6 flex justify-center">
                            <div className="w-32 h-32 rounded-full bg-gray-100 dark:bg-gray-700 overflow-hidden ring-4 ring-white dark:ring-gray-800 shadow-lg">
                                {student.studentPhoto ? (
                                    <img src={getFileUrl(student.studentPhoto)} alt={student.firstName} className="w-full h-full object-cover" />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-4xl font-bold text-gray-300 dark:text-gray-600">
                                        {student.firstName[0]}{student.lastName?.[0]}
                                    </div>
                                )}
                            </div>
                            <div className="absolute bottom-0 right-1/2 translate-x-[3.5rem] bg-white dark:bg-gray-800 p-2 rounded-full shadow-md border border-gray-100 dark:border-gray-700">
                                <QrCodeIcon className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                            </div>
                        </div>

                        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">{student.firstName} {student.lastName}</h2>

                        <div className="flex flex-wrap justify-center gap-2 mb-6">
                            <span className="px-3 py-1.5 bg-primary-50 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 text-xs font-semibold rounded-full border border-primary-100 dark:border-primary-800/30">
                                {student.class?.name || 'Academic'}
                            </span>
                            <span className="px-3 py-1.5 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 text-xs font-semibold rounded-full border border-gray-200 dark:border-gray-600">
                                {student.gender}
                            </span>
                        </div>

                        <div className="w-full space-y-4 pt-6 border-t border-gray-100 dark:border-gray-700">
                            {[
                                { label: 'Admission No', value: student.admissionNo, icon: ShieldCheck },
                                { label: 'Roll Number', value: student.rollNo, icon: GraduationCap },
                                { label: 'Category', value: student.category?.category, icon: BookOpen }
                            ].map((item, i) => (
                                <div key={i} className="flex justify-between items-center text-sm">
                                    <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400">
                                        <item.icon className="w-4 h-4" />
                                        <span className="font-medium">{item.label}</span>
                                    </div>
                                    <span className="font-semibold text-gray-900 dark:text-gray-100">{item.value || '-'}</span>
                                </div>
                            ))}
                        </div>

                        <div className="w-full pt-8 grid grid-cols-2 gap-3 mt-auto">
                            <button
                                onClick={() => navigate(`/students/admission?id=${student.id}&edit=true`)}
                                className="flex items-center justify-center gap-2 py-2.5 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 border border-gray-200 dark:border-gray-600 font-medium rounded-xl hover:bg-gray-50 dark:hover:bg-gray-600 transition shadow-sm"
                            >
                                <Edit className="w-4 h-4" />
                                <span>Edit</span>
                            </button>
                            <button
                                onClick={handlePrint}
                                className="flex items-center justify-center gap-2 py-2.5 bg-primary-600 text-white font-medium rounded-xl hover:bg-primary-700 transition shadow-sm"
                            >
                                <Printer className="w-4 h-4" />
                                <span>Print</span>
                            </button>
                        </div>
                    </InfoCard>

                    {/* Siblings: Structured Header & List */}
                    <InfoCard>
                        <SectionHeader title="Sibling Connection" icon={Users} />
                        <div className="p-4 space-y-2">
                            {((student.parent?.students || []).filter((s: any) => s.id !== student.id)).length > 0 ? (
                                student.parent.students.filter((s: any) => s.id !== student.id).map((sibling: any) => (
                                    <div
                                        key={sibling.id}
                                        onClick={() => {
                                            navigate(`/students/profile/${sibling.id}`);
                                            showSuccess(`Switched to ${sibling.firstName}'s Profile`);
                                        }}
                                        className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700/50 cursor-pointer transition-colors border border-transparent hover:border-gray-100 dark:hover:border-gray-700 group"
                                    >
                                        <div className="w-10 h-10 rounded-full bg-gray-100 dark:bg-gray-700 overflow-hidden ring-2 ring-white dark:ring-gray-800">
                                            {sibling.studentPhoto ? (
                                                <img src={getFileUrl(sibling.studentPhoto)} alt={sibling.firstName} className="w-full h-full object-cover" />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center text-sm font-bold text-gray-400">
                                                    {sibling.firstName[0]}
                                                </div>
                                            )}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">{sibling.firstName} {sibling.lastName}</p>
                                            <p className="text-xs text-gray-500 dark:text-gray-400">{sibling.class?.name || 'Class N/A'}</p>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="text-center py-6">
                                    <p className="text-sm text-gray-500 dark:text-gray-400 italic">No Siblings Registered</p>
                                </div>
                            )}
                        </div>
                    </InfoCard>

                    {/* Barcode Identity */}
                    <InfoCard className="p-6 flex flex-col items-center gap-3">
                        <BarcodeIcon className="w-full h-12 text-gray-400 dark:text-gray-500" />
                        <p className="text-xs font-medium text-gray-500 dark:text-gray-400">Access Identity {student.admissionNo}</p>
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
                                <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-8">
                                    <div className="space-y-6">
                                        <h4 className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-2 border-b border-gray-100 dark:border-gray-700 pb-2">Paternal Details</h4>
                                        <div className="space-y-4">
                                            <div>
                                                <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Father's Name</p>
                                                <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{student.fatherName || '-'}</p>
                                            </div>
                                            <div className="grid grid-cols-2 gap-4">
                                                <div>
                                                    <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Phone</p>
                                                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{student.fatherPhone || '-'}</p>
                                                </div>
                                                <div>
                                                    <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Occupation</p>
                                                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{student.fatherOccupation || '-'}</p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="space-y-6">
                                        <h4 className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-2 border-b border-gray-100 dark:border-gray-700 pb-2">Maternal Details</h4>
                                        <div className="space-y-4">
                                            <div>
                                                <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Mother's Name</p>
                                                <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{student.motherName || '-'}</p>
                                            </div>
                                            <div className="grid grid-cols-2 gap-4">
                                                <div>
                                                    <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Phone</p>
                                                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{student.motherPhone || '-'}</p>
                                                </div>
                                                <div>
                                                    <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Occupation</p>
                                                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{student.motherOccupation || '-'}</p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div className="p-6 bg-gray-50/50 dark:bg-gray-800/50 border-t border-gray-100 dark:border-gray-700">
                                    <h4 className="text-sm font-bold text-gray-900 dark:text-white mb-4">Secondary Guardian Info</h4>
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                        {[
                                            { label: 'Guardian', value: student.guardianName },
                                            { label: 'Relation', value: student.guardianRelation },
                                            { label: 'Contact', value: student.guardianPhone }
                                        ].map((item, i) => (
                                            <div key={i}>
                                                <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">{item.label}</p>
                                                <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{item.value || '-'}</p>
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
                                            <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Current Address</p>
                                            <p className="text-sm font-medium text-gray-900 dark:text-gray-200 leading-relaxed">{student.currentAddress || 'N/A'}</p>
                                        </div>
                                        <div className="pt-6 border-t border-gray-100 dark:border-gray-700">
                                            <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Permanent Address</p>
                                            <p className="text-sm font-medium text-gray-900 dark:text-gray-200 leading-relaxed">{student.permanentAddress || student.currentAddress || 'N/A'}</p>
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
                                                    <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">{item.label}</p>
                                                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{item.value || 'N/A'}</p>
                                                </div>
                                            ))}
                                        </div>
                                        <div className="pt-6 border-t border-gray-100 dark:border-gray-700">
                                            <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Room Assignment</p>
                                            <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                                                {student.roomNumber ? `Room ${student.roomNumber} (${student.roomType || 'Standard'})` : 'No Hostel Room Assigned'}
                                            </p>
                                        </div>
                                    </div>
                                </InfoCard>
                            </div>
                        </>
                    ) : activeTab === 'Fees' ? (
                        <div className="space-y-6">
                            {/* Financial Summary Cards */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <InfoCard className="p-6 bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-900 border-l-4 border-l-primary-500">
                                    <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Total Due</p>
                                    <h3 className="text-2xl font-black text-gray-900 dark:text-white">
                                        {loadingStatement ? '...' : formatCurrency(parseFloat(statement?.totalDue || '0'))}
                                    </h3>
                                </InfoCard>
                                <InfoCard className="p-6 bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-900 border-l-4 border-l-emerald-500">
                                    <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Total Paid</p>
                                    <h3 className="text-2xl font-black text-emerald-600">
                                        {loadingStatement ? '...' : formatCurrency(parseFloat(statement?.totalPaid || '0'))}
                                    </h3>
                                </InfoCard>
                                <InfoCard noBg className="p-6 bg-primary-600 border-none shadow-lg shadow-primary-500/20">
                                    <p className="text-xs font-bold text-primary-100 uppercase tracking-widest mb-1">Net Balance</p>
                                    <h3 className="text-2xl font-black text-white">
                                        {loadingStatement ? '...' : formatCurrency(parseFloat(statement?.balance || '0'))}
                                    </h3>
                                </InfoCard>
                            </div>

                            {/* Assigned Fee Groups */}
                            <InfoCard>
                                <div className="flex items-center justify-between p-6 border-b border-gray-100 dark:border-gray-700">
                                    <div className="flex items-center gap-2">
                                        <div className="p-2 bg-primary-50 dark:bg-primary-900/30 rounded-lg">
                                            <DollarSign className="w-5 h-5 text-primary-600" />
                                        </div>
                                        <h3 className="text-base font-bold text-gray-900 dark:text-white">Assigned Fee Components</h3>
                                    </div>
                                    <button 
                                        onClick={handlePrintNotice}
                                        className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-xl text-xs font-black uppercase tracking-widest flex items-center gap-2 shadow-lg shadow-primary-500/20 transition-all active:scale-95"
                                    >
                                        <Printer className="w-4 h-4" />
                                        Print Fee Notice
                                    </button>
                                </div>
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left">
                                        <thead className="bg-gray-50 dark:bg-gray-900/50 border-b border-gray-100 dark:border-gray-700">
                                            <tr>
                                                <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Fee Head</th>
                                                <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">Amount</th>
                                                <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">Balance</th>
                                                <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest text-center">Status</th>
                                                <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">Action</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-50 dark:divide-gray-800">
                                            {loadingStatement ? (
                                                <tr><td colSpan={5} className="p-10 text-center text-gray-400">Loading components...</td></tr>
                                            ) : statement?.assignedHeads?.length > 0 ? (
                                                statement.assignedHeads.map((head: any) => (
                                                    <tr key={head.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-900/30 transition-colors">
                                                        <td className="px-6 py-4">
                                                            <div className="flex flex-col">
                                                                <span className="text-sm font-bold text-gray-900 dark:text-white">{head.name}</span>
                                                                <span className="text-[10px] text-gray-400 font-black uppercase tracking-tighter">{head.group}</span>
                                                            </div>
                                                        </td>
                                                        <td className="px-6 py-4 text-right text-sm font-medium text-gray-500">{formatCurrency(parseFloat(head.amount))}</td>
                                                        <td className="px-6 py-4 text-right text-sm font-black text-primary-600">{formatCurrency(parseFloat(head.balance))}</td>
                                                        <td className="px-6 py-4 text-center">
                                                            <span className={clsx(
                                                                "px-2 py-1 rounded text-[10px] font-black uppercase tracking-tighter",
                                                                parseFloat(head.balance) === 0 ? "bg-emerald-100 text-emerald-700" :
                                                                parseFloat(head.balance) < parseFloat(head.amount) ? "bg-amber-100 text-amber-700" :
                                                                "bg-red-100 text-red-700"
                                                            )}>
                                                                {parseFloat(head.balance) === 0 ? 'PAID' : parseFloat(head.balance) < parseFloat(head.amount) ? 'PARTIAL' : 'DUE'}
                                                            </span>
                                                        </td>
                                                        <td className="px-6 py-4 text-right">
                                                            <button 
                                                                className="text-xs font-bold text-primary-600 hover:text-primary-700 flex items-center gap-1 ml-auto"
                                                                onClick={() => {
                                                                    // We'll implement individual notice printing if needed
                                                                    window.alert("Generate individual fee notice feature coming soon!");
                                                                }}
                                                            >
                                                                <Printer className="w-3.5 h-3.5" />
                                                                Notice
                                                            </button>
                                                        </td>
                                                    </tr>
                                                ))
                                            ) : (
                                                <tr><td colSpan={5} className="p-10 text-center text-gray-400 italic">No fees assigned.</td></tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </InfoCard>

                            {/* Recent Payments */}
                            <InfoCard>
                                <SectionHeader title="Recent Transactions" icon={ClipboardList} />
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left">
                                        <thead className="bg-gray-50 dark:bg-gray-900/50 border-b border-gray-100 dark:border-gray-700">
                                            <tr>
                                                <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Date</th>
                                                <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Reference</th>
                                                <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Method</th>
                                                <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">Amount</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-50 dark:divide-gray-800">
                                            {statement?.transactions?.length > 0 ? (
                                                (() => {
                                                    const start = (txPage - 1) * txItemsPerPage;
                                                    const paginatedTxs = statement.transactions.slice(start, start + txItemsPerPage);
                                                    return paginatedTxs.map((tx: any) => (
                                                        <tr key={tx.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-900/30 transition-colors">
                                                            <td className="px-6 py-4 text-sm font-medium text-gray-500">{new Date(tx.createdAt).toLocaleDateString()}</td>
                                                            <td className="px-6 py-4 text-sm font-bold text-gray-900 dark:text-white uppercase">{tx.reference || 'N/A'}</td>
                                                            <td className="px-6 py-4">
                                                                <span className="text-[10px] font-black text-gray-400 px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded uppercase">{tx.paymentMethod || 'CASH'}</span>
                                                            </td>
                                                            <td className="px-6 py-4 text-right text-sm font-black text-emerald-600">{formatCurrency(Math.abs(parseFloat(tx.amount)))}</td>
                                                        </tr>
                                                    ));
                                                })()
                                            ) : (
                                                <tr><td colSpan={4} className="p-10 text-center text-gray-400 italic">No transactions found.</td></tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                                {statement?.transactions?.length > txItemsPerPage && (
                                    <div className="p-6 border-t border-gray-50 dark:border-gray-800 flex items-center justify-between">
                                        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">
                                            Showing {Math.min(statement.transactions.length, (txPage - 1) * txItemsPerPage + 1)} to {Math.min(statement.transactions.length, txPage * txItemsPerPage)} of {statement.transactions.length}
                                        </p>
                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => setTxPage(p => Math.max(1, p - 1))}
                                                disabled={txPage === 1}
                                                className="px-4 py-2 bg-gray-50 dark:bg-gray-900 text-gray-500 rounded-xl text-xs font-black uppercase tracking-widest disabled:opacity-50 transition-all border border-gray-100 dark:border-gray-800"
                                            >
                                                Prev
                                            </button>
                                            <button
                                                onClick={() => setTxPage(p => Math.min(Math.ceil(statement.transactions.length / txItemsPerPage), p + 1))}
                                                disabled={txPage === Math.ceil(statement.transactions.length / txItemsPerPage)}
                                                className="px-4 py-2 bg-gray-50 dark:bg-gray-900 text-gray-500 rounded-xl text-xs font-black uppercase tracking-widest disabled:opacity-50 transition-all border border-gray-100 dark:border-gray-800"
                                            >
                                                Next
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </InfoCard>
                        </div>
                    ) : (
                        <InfoCard className="flex flex-col items-center justify-center py-20 min-h-[400px]">
                            <div className="w-16 h-16 bg-gray-50 dark:bg-gray-800/50 rounded-2xl flex items-center justify-center mb-4">
                                <ClipboardList className="w-8 h-8 text-gray-400" />
                            </div>
                            <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">{activeTab} Record</h4>
                            <p className="text-sm text-gray-500 dark:text-gray-400 text-center max-w-[280px]">System is currently synchronizing historical data for this module. Please check back shortly.</p>
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
                                <img src={getFileUrl(student.studentPhoto)} alt={student.firstName} className="w-full h-full object-cover" />
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
