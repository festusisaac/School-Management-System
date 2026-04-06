import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { DataTable } from '../../components/ui/data-table';
import { ColumnDef } from '@tanstack/react-table';
import { CheckCircle, XCircle, Eye, RefreshCw, Users, GraduationCap, FileText, Download, Settings, Wallet } from 'lucide-react';
import api, { getFileUrl } from '../../services/api';
import { useToast } from '../../context/ToastContext';
import { Modal } from '../../components/ui/modal';
import { usePermissions } from '../../hooks/usePermissions';
import AdmissionLetterTemplate from '../../components/students/AdmissionLetterTemplate';
import { downloadPDF } from '../../utils/pdfGenerator';

type OnlineApplication = {
    id: string;
    referenceNumber: string;
    firstName: string;
    middleName?: string;
    lastName: string;
    gender: string;
    dob: string;
    religion?: string;
    bloodGroup?: string;
    genotype?: string;
    stateOfOrigin?: string;
    nationality?: string;
    mobileNumber?: string;
    email?: string;
    guardianName: string;
    guardianPhone: string;
    guardianRelation: string;
    fatherName?: string;
    fatherPhone?: string;
    fatherOccupation?: string;
    motherName?: string;
    motherPhone?: string;
    motherOccupation?: string;
    emergencyContact?: string;
    currentAddress: string;
    permanentAddress?: string;
    previousSchoolName?: string;
    lastClassPassed?: string;
    medicalConditions?: string;
    passportPhoto?: string;
    birthCertificate?: string;
    paymentStatus: string;
    transactionReference?: string;
    amountPaid?: number;
    status: 'pending' | 'approved' | 'rejected';
    createdAt: string;
    preferredClassId?: string;
    preferredClass?: { name: string };
};

export default function OnlineAdmission() {
    const navigate = useNavigate();
    const [data, setData] = useState<OnlineApplication[]>([]);
    const toast = useToast();
    const [loading, setLoading] = useState(true);
    const [selectedApplication, setSelectedApplication] = useState<OnlineApplication | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const { hasPermission } = usePermissions();
    const [actionLoading, setActionLoading] = useState(false);
    const [downloading, setDownloading] = useState(false);
    const letterRef = React.useRef<HTMLDivElement>(null);
    const [feeGroups, setFeeGroups] = useState<any[]>([]);
    const [selectedFeeGroupIds, setSelectedFeeGroupIds] = useState<string[]>([]);
    const [feeExclusions, setFeeExclusions] = useState<Record<string, string[]>>({});
    const [showFeeSelection, setShowFeeSelection] = useState(false);

    const fetchAdmissions = async () => {
        setLoading(true);
        try {
            const result = await api.getOnlineAdmissions();
            setData(result);
        } catch (error) {
            console.error("Failed to fetch online admissions", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAdmissions();
        fetchFeeGroups();
    }, []);

    const fetchFeeGroups = async () => {
        try {
            const groups = await api.getFeeGroups();
            setFeeGroups(groups || []);
        } catch (error) {
            console.error("Failed to fetch fee groups", error);
        }
    };

    const handleView = (app: OnlineApplication) => {
        setSelectedApplication(app);
        setSelectedFeeGroupIds([]);
        setFeeExclusions({});
        setShowFeeSelection(false);
        setIsModalOpen(true);
    };

    const handleApprove = async (id: string) => {
        if (!showFeeSelection) {
            setShowFeeSelection(true);
            return;
        }

        if (!confirm('Are you sure you want to approve this application? This will create a new student record and assign selected fees.')) return;

        setActionLoading(true);
        try {
            await api.approveOnlineAdmission(id, selectedFeeGroupIds, feeExclusions);
            toast.showSuccess('Application approved successfully! Student record created.');
            fetchAdmissions();
            setIsModalOpen(false);
            setShowFeeSelection(false);
        } catch (error: any) {
            console.error("Failed to approve application", error);
            toast.showError('Failed to approve application: ' + (error.response?.data?.message || error.message));
        } finally {
            setActionLoading(false);
        }
    };

    const handleToggleFeeGroup = (groupId: string) => {
        setSelectedFeeGroupIds(prev => {
            const isSelected = prev.includes(groupId);
            if (isSelected) {
                // If unselecting group, clear its exclusions
                const newExclusions = { ...feeExclusions };
                delete newExclusions[groupId];
                setFeeExclusions(newExclusions);
                return prev.filter(id => id !== groupId);
            } else {
                return [...prev, groupId];
            }
        });
    };

    const handleToggleFeeHead = (groupId: string, headId: string) => {
        setFeeExclusions(prev => {
            const groupExclusions = prev[groupId] || [];
            if (groupExclusions.includes(headId)) {
                return {
                    ...prev,
                    [groupId]: groupExclusions.filter(id => id !== headId)
                };
            } else {
                return {
                    ...prev,
                    [groupId]: [...groupExclusions, headId]
                };
            }
        });
    };

    const handleReject = async (id: string) => {
        if (!confirm('Are you sure you want to reject this application?')) return;

        setActionLoading(true);
        try {
            await api.updateOnlineAdmissionStatus(id, 'rejected');
            toast.showSuccess('Application rejected.');
            fetchAdmissions();
            setIsModalOpen(false);
        } catch (error: any) {
            console.error("Failed to reject application", error);
            toast.showError('Failed to reject application: ' + (error.response?.data?.message || error.message));
        } finally {
            setActionLoading(false);
        }
    };

    const handleDownloadLetter = async () => {
        if (!letterRef.current || !selectedApplication) return;
        setDownloading(true);
        try {
            await downloadPDF(letterRef.current, {
                filename: `admission-letter-${selectedApplication.referenceNumber.replace(/\//g, '-')}.pdf`
            });
            toast.showSuccess("Admission letter downloaded!");
        } catch (error) {
            toast.showError("Failed to generate PDF. Please try again.");
        } finally {
            setDownloading(false);
        }
    };

    const columns: ColumnDef<OnlineApplication>[] = [
        { accessorKey: 'referenceNumber', header: 'Ref Number', cell: ({ row }) => <span className="font-mono font-bold text-primary-600">{row.original.referenceNumber}</span> },
        { accessorKey: 'firstName', header: 'Student Name', cell: ({ row }) => `${row.original.firstName} ${row.original.middleName ? row.original.middleName + ' ' : ''}${row.original.lastName || ''}` },
        { accessorKey: 'guardianName', header: 'Guardian Name' },
        { 
            accessorKey: 'preferredClass', 
            header: 'Applied For',
            cell: ({ row }) => row.original.preferredClass?.name || <span className="text-gray-400">N/A</span>
        },
        {
            accessorKey: 'paymentStatus',
            header: 'Payment',
            cell: ({ row }) => (
                <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase ${row.original.paymentStatus === 'paid' ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-600'}`}>
                    {row.original.paymentStatus}
                </span>
            )
        },
        { accessorKey: 'createdAt', header: 'Date', cell: ({ row }) => new Date(row.original.createdAt).toLocaleDateString() },
        {
            accessorKey: 'status',
            header: 'Status',
            cell: ({ row }) => (
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${row.original.status === 'approved' ? 'bg-green-100 text-green-800' :
                    row.original.status === 'rejected' ? 'bg-red-100 text-red-800' :
                        'bg-yellow-100 text-yellow-800'
                    }`}>
                    {row.original.status.toUpperCase()}
                </span>
            )
        },
        {
            id: 'actions',
            cell: ({ row }) => (
                <div className="flex items-center gap-2">
                    <button onClick={() => handleView(row.original)} className="p-1.5 rounded-lg bg-primary-50 text-primary-600 hover:bg-primary-100" title="View">
                        <Eye className="w-4 h-4" />
                    </button>
                    {row.original.status === 'pending' && hasPermission('students:create') && (
                        <>
                            <button onClick={() => handleApprove(row.original.id)} className="p-1.5 rounded-lg bg-green-50 text-green-600 hover:bg-green-100" title="Approve">
                                <CheckCircle className="w-4 h-4" />
                            </button>
                            <button onClick={() => handleReject(row.original.id)} className="p-1.5 rounded-lg bg-red-50 text-red-600 hover:bg-red-100" title="Reject">
                                <XCircle className="w-4 h-4" />
                            </button>
                        </>
                    )}
                </div>
            )
        }
    ];

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Online Admissions</h1>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Review pending admission applications</p>
                </div>
                <div className="flex items-center gap-2">
                    <button onClick={() => navigate('/settings/general?tab=admission')} className="flex items-center gap-2 px-3 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm font-semibold text-gray-700 dark:text-gray-200 hover:bg-gray-50 transition-colors shadow-sm">
                        <Settings className="w-4 h-4" /> Admission Settings
                    </button>
                    <button onClick={fetchAdmissions} className="p-2 bg-gray-100 dark:bg-gray-800 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors">
                        <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
                    </button>
                </div>
            </div>

            {loading && data.length === 0 ? (
                <div className="flex justify-center py-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
                </div>
            ) : (
                <DataTable columns={columns} data={data} searchKey="firstName" placeholder="Search applicants..." />
            )}

            <Modal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title="Application Details"
                size="4xl"
            >
                {selectedApplication && (
                    <div className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            {/* Passport Photo */}
                            <div className="flex flex-col items-center gap-2">
                                <div className="w-32 h-32 rounded-2xl bg-gray-100 dark:bg-gray-900 border-2 border-gray-200 dark:border-gray-700 overflow-hidden">
                                    {selectedApplication.passportPhoto ? (
                                        <img src={getFileUrl(selectedApplication.passportPhoto)} alt="Passport" className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-gray-400"><FileText className="w-8 h-8" /></div>
                                    )}
                                </div>
                                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Passport Photo</span>
                            </div>

                            <div className="md:col-span-2 grid grid-cols-2 gap-4">
                                <div>
                                    <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Full Name</h4>
                                    <p className="font-bold text-gray-900 dark:text-white capitalize">{selectedApplication.firstName} {selectedApplication.middleName} {selectedApplication.lastName}</p>
                                </div>
                                <div>
                                    <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Reference</h4>
                                    <p className="font-mono font-bold text-primary-600">{selectedApplication.referenceNumber}</p>
                                </div>
                                <div>
                                    <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Gender / DOB</h4>
                                    <p className="font-bold text-gray-900 dark:text-white uppercase">{selectedApplication.gender} | {new Date(selectedApplication.dob).toLocaleDateString()}</p>
                                </div>
                                <div>
                                    <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Applied For</h4>
                                    <p className="font-bold text-gray-900 dark:text-white">{selectedApplication.preferredClass?.name || 'N/A'}</p>
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-gray-50 dark:bg-gray-900/50 rounded-2xl border border-gray-100 dark:border-gray-800">
                            <div>
                                <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Religion</h4>
                                <p className="text-sm font-bold text-gray-800 dark:text-gray-200">{selectedApplication.religion || 'N/A'}</p>
                            </div>
                            <div>
                                <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Blood / Genotype</h4>
                                <p className="text-sm font-bold text-gray-800 dark:text-gray-200">{selectedApplication.bloodGroup || '-'}/{selectedApplication.genotype || '-'}</p>
                            </div>
                            <div>
                                <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">State / Nationality</h4>
                                <p className="text-sm font-bold text-gray-800 dark:text-gray-200">{selectedApplication.stateOfOrigin || 'N/A'}, {selectedApplication.nationality || 'N/A'}</p>
                            </div>
                            <div>
                                <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Payment Status</h4>
                                <p className={`text-sm font-bold uppercase ${selectedApplication.paymentStatus === 'paid' ? 'text-emerald-500' : 'text-amber-500'}`}>{selectedApplication.paymentStatus}</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-4">
                                <h4 className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-2">
                                    <Users className="w-4 h-4 text-purple-500" /> Guardian Information
                                </h4>
                                <div className="space-y-2 text-sm text-gray-800 dark:text-gray-200">
                                    <div className="flex justify-between border-b dark:border-gray-800 pb-1.5">
                                        <span className="text-gray-500 dark:text-gray-400 font-medium">Primary Guardian</span>
                                        <span className="font-bold">{selectedApplication.guardianName} ({selectedApplication.guardianRelation})</span>
                                    </div>
                                    <div className="flex justify-between border-b dark:border-gray-800 pb-1.5">
                                        <span className="text-gray-500 dark:text-gray-400 font-medium">Contact Phone</span>
                                        <span className="font-bold text-primary-600 dark:text-primary-400">{selectedApplication.guardianPhone}</span>
                                    </div>
                                    <div className="flex justify-between border-b dark:border-gray-800 pb-1.5">
                                        <span className="text-gray-500 dark:text-gray-400 font-medium">Email Address</span>
                                        <span className="font-bold">{selectedApplication.email || 'N/A'}</span>
                                    </div>
                                    <div className="flex justify-between border-b dark:border-gray-800 pb-1.5">
                                        <span className="text-gray-500 dark:text-gray-400 font-medium">Emergency Contact</span>
                                        <span className="font-bold text-rose-600 dark:text-rose-400">{selectedApplication.emergencyContact || 'N/A'}</span>
                                    </div>
                                </div>
                            </div>
                            <div className="space-y-4">
                                <h4 className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-2">
                                    <GraduationCap className="w-4 h-4 text-amber-500" /> Academic & Medical
                                </h4>
                                <div className="space-y-2 text-sm text-gray-800 dark:text-gray-200">
                                    <div className="flex justify-between border-b dark:border-gray-800 pb-1.5">
                                        <span className="text-gray-500 dark:text-gray-400 font-medium">Previous School</span>
                                        <span className="font-bold">{selectedApplication.previousSchoolName || 'N/A'}</span>
                                    </div>
                                    <div className="flex justify-between border-b dark:border-gray-800 pb-1.5">
                                        <span className="text-gray-500 dark:text-gray-400 font-medium">Last Class Passed</span>
                                        <span className="font-bold">{selectedApplication.lastClassPassed || 'N/A'}</span>
                                    </div>
                                    <div className="flex flex-col pt-1">
                                        <span className="text-gray-500 dark:text-gray-400 font-medium text-[10px] uppercase tracking-wider mb-1">Medical Conditions / Allergies</span>
                                        <span className="font-semibold text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-900/20 px-3 py-2 rounded-xl border border-rose-100 dark:border-rose-900/30">
                                            {selectedApplication.medicalConditions || 'NONE RECORDED'}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Parental Details Section */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-slate-50 dark:bg-slate-900/50 p-6 rounded-3xl border border-slate-100 dark:border-slate-800">
                            <div className="space-y-3">
                                <h4 className="text-[11px] font-bold text-blue-500 uppercase tracking-[0.2em] mb-4">Father's Details</h4>
                                <div className="space-y-2 text-sm">
                                    <div className="flex flex-col">
                                        <span className="text-gray-400 text-[10px] font-bold uppercase">Full Name</span>
                                        <span className="font-bold text-gray-900 dark:text-white">{selectedApplication.fatherName || 'N/A'}</span>
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="text-gray-400 text-[10px] font-bold uppercase">Phone</span>
                                        <span className="font-bold text-gray-900 dark:text-white">{selectedApplication.fatherPhone || 'N/A'}</span>
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="text-gray-400 text-[10px] font-bold uppercase">Occupation</span>
                                        <span className="font-bold text-gray-900 dark:text-white">{selectedApplication.fatherOccupation || 'N/A'}</span>
                                    </div>
                                </div>
                            </div>
                            <div className="space-y-3">
                                <h4 className="text-[11px] font-bold text-purple-500 uppercase tracking-[0.2em] mb-4">Mother's Details</h4>
                                <div className="space-y-2 text-sm">
                                    <div className="flex flex-col">
                                        <span className="text-gray-400 text-[10px] font-bold uppercase">Full Name</span>
                                        <span className="font-bold text-gray-900 dark:text-white">{selectedApplication.motherName || 'N/A'}</span>
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="text-gray-400 text-[10px] font-bold uppercase">Phone</span>
                                        <span className="font-bold text-gray-900 dark:text-white">{selectedApplication.motherPhone || 'N/A'}</span>
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="text-gray-400 text-[10px] font-bold uppercase">Occupation</span>
                                        <span className="font-bold text-gray-900 dark:text-white">{selectedApplication.motherOccupation || 'N/A'}</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Addresses Section */}
                        <div className="space-y-4">
                            <h4 className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-2">
                                <XCircle className="w-4 h-4 text-indigo-500 rotate-45" /> Address Information
                            </h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                                <div className="p-4 bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-2xl">
                                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-2">Current Residence</span>
                                    <p className="font-semibold text-gray-800 dark:text-gray-200">{selectedApplication.currentAddress || 'N/A'}</p>
                                </div>
                                <div className="p-4 bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-2xl">
                                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-2">Permanent Home Address</span>
                                    <p className="font-semibold text-gray-800 dark:text-gray-200">{selectedApplication.permanentAddress || 'N/A'}</p>
                                </div>
                            </div>
                        </div>

                        <div className="pt-4 border-t border-gray-100 dark:border-gray-700">
                            <h4 className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-2 mb-4">
                                <FileText className="w-4 h-4 text-emerald-500" /> Attached Documents
                            </h4>
                            <div className="flex flex-wrap gap-4">
                                {selectedApplication.birthCertificate && (
                                    <a 
                                        href={getFileUrl(selectedApplication.birthCertificate)} 
                                        target="_blank" 
                                        rel="noreferrer"
                                        className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm font-bold hover:bg-gray-50 transition-colors"
                                    >
                                        <FileText className="w-4 h-4" /> Birth Certificate
                                    </a>
                                )}
                                {selectedApplication.status === 'approved' && (
                                    <button 
                                        onClick={handleDownloadLetter}
                                        disabled={downloading}
                                        className="flex items-center gap-2 px-4 py-2 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-900/30 rounded-xl text-sm font-bold text-emerald-700 dark:text-emerald-400 hover:bg-emerald-100 transition-colors disabled:opacity-50"
                                    >
                                        <Download className="w-4 h-4" /> 
                                        {downloading ? 'Generating...' : 'Download Admission Letter'}
                                    </button>
                                )}
                            </div>
                        </div>

                        {selectedApplication.status === 'pending' && hasPermission('students:create') && (
                            <div className="pt-6 border-t border-primary-100 dark:border-gray-700 space-y-6">
                                {/* Fee Selection Section */}
                                {showFeeSelection && (
                                    <div className="bg-primary-50/50 dark:bg-primary-900/10 border border-primary-100 dark:border-primary-900/30 rounded-2xl p-6 animate-in fade-in slide-in-from-top-4 duration-300">
                                        <div className="flex items-center justify-between mb-4">
                                            <h4 className="text-sm font-bold text-primary-900 dark:text-primary-100 flex items-center gap-2">
                                                <Wallet className="w-4 h-4" /> 
                                                Step 2: Assign Fee Groups
                                            </h4>
                                            <button 
                                                onClick={() => setShowFeeSelection(false)}
                                                className="text-[10px] font-bold text-primary-600 uppercase hover:underline"
                                            >
                                                Back to Details
                                            </button>
                                        </div>
                                        
                                        {feeGroups.length > 0 ? (
                                            <div className="grid grid-cols-1 gap-4 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                                                {feeGroups.map((group) => {
                                                    const isGroupSelected = selectedFeeGroupIds.includes(group.id);
                                                    const groupExclusions = feeExclusions[group.id] || [];

                                                    return (
                                                        <div 
                                                            key={group.id}
                                                            className={`flex flex-col rounded-2xl border transition-all overflow-hidden ${
                                                                isGroupSelected
                                                                ? 'bg-white dark:bg-gray-800 border-primary-500 shadow-sm'
                                                                : 'bg-gray-50/50 dark:bg-gray-900/50 border-gray-200 dark:border-gray-700 opacity-70 grayscale-[0.5]'
                                                            }`}
                                                        >
                                                            <label className={`flex items-start gap-4 p-4 cursor-pointer transition-colors ${isGroupSelected ? 'bg-primary-50/20 dark:bg-primary-900/10' : 'hover:bg-gray-100/50 dark:hover:bg-gray-800/50'}`}>
                                                                <div className="relative flex items-center mt-1">
                                                                    <input 
                                                                        type="checkbox"
                                                                        className="w-5 h-5 rounded-lg border-gray-300 text-primary-600 focus:ring-primary-500"
                                                                        checked={isGroupSelected}
                                                                        onChange={() => handleToggleFeeGroup(group.id)}
                                                                    />
                                                                </div>
                                                                <div className="flex-1 min-w-0">
                                                                    <div className="flex items-center justify-between mb-1">
                                                                        <p className="text-sm font-bold text-gray-900 dark:text-white truncate">{group.name}</p>
                                                                        <span className="text-[10px] font-mono bg-white dark:bg-gray-900 px-2 py-0.5 rounded text-gray-500 border border-gray-100 dark:border-gray-700">
                                                                            {group.heads?.length || 0} Heads
                                                                        </span>
                                                                    </div>
                                                                    <p className="text-[10px] text-gray-500 line-clamp-1">{group.description || 'No description provided'}</p>
                                                                </div>
                                                            </label>

                                                            {isGroupSelected && group.heads && group.heads.length > 0 && (
                                                                <div className="px-4 pb-4 space-y-2 border-t border-primary-100 dark:border-primary-900/30 pt-3 bg-primary-50/10 dark:bg-primary-900/5">
                                                                    <p className="text-[9px] font-bold text-primary-600 uppercase tracking-widest mb-2">Optional Fee Heads</p>
                                                                    <div className="grid grid-cols-1 gap-1.5">
                                                                        {group.heads.map((head: any) => {
                                                                            const isExcluded = groupExclusions.includes(head.id);
                                                                            const isMandatory = !head.isOptional;

                                                                            return (
                                                                                <label
                                                                                    key={head.id}
                                                                                    className={`flex items-center justify-between p-2 rounded-lg border transition-all ${
                                                                                        isExcluded
                                                                                        ? 'bg-gray-50/50 dark:bg-gray-900/30 border-gray-100 dark:border-gray-800 opacity-60'
                                                                                        : 'bg-white dark:bg-gray-900 border-primary-100/50 dark:border-primary-900/20'
                                                                                    }`}
                                                                                >
                                                                                    <div className="flex items-center gap-2">
                                                                                        <input
                                                                                            type="checkbox"
                                                                                            className="w-3.5 h-3.5 rounded border-gray-300 text-primary-600 focus:ring-primary-500 disabled:opacity-50"
                                                                                            checked={!isExcluded}
                                                                                            disabled={isMandatory}
                                                                                            onChange={() => handleToggleFeeHead(group.id, head.id)}
                                                                                        />
                                                                                        <div className="flex flex-col">
                                                                                            <span className={`text-[11px] font-medium ${isExcluded ? 'text-gray-400 line-through' : 'text-gray-700 dark:text-gray-200'}`}>
                                                                                                {head.name}
                                                                                            </span>
                                                                                            {isMandatory && (
                                                                                                <span className="text-[7px] text-primary-500 font-bold uppercase tracking-tighter">Mandatory</span>
                                                                                            )}
                                                                                        </div>
                                                                                    </div>
                                                                                    <span className="text-[10px] font-bold text-gray-500">
                                                                                        {new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN', maximumFractionDigits: 0 }).format(head.defaultAmount || 0)}
                                                                                    </span>
                                                                                </label>
                                                                            );
                                                                        })}
                                                                    </div>
                                                                </div>
                                                            )}
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        ) : (
                                            <div className="text-center py-6 bg-gray-50/50 dark:bg-gray-900/50 rounded-xl border border-dashed border-gray-300 dark:border-gray-700">
                                                <p className="text-xs text-gray-500 italic">No fee groups configured. Please configure them in Finance Settings.</p>
                                            </div>
                                        )}
                                        
                                        <p className="text-[10px] text-primary-600 font-medium mt-4 bg-primary-100/50 dark:bg-primary-900/20 p-2 rounded-lg">
                                            Tip: Selected fee groups will be automatically allocated to the student once approved.
                                        </p>
                                    </div>
                                )}

                                <div className="flex gap-3">
                                    {!showFeeSelection ? (
                                        <>
                                            <button
                                                onClick={() => handleApprove(selectedApplication.id)}
                                                disabled={actionLoading}
                                                className="flex-1 bg-emerald-600 text-white font-bold py-4 rounded-2xl hover:bg-emerald-700 shadow-lg shadow-emerald-600/20 transition-all active:scale-95 flex items-center justify-center gap-2"
                                            >
                                                <CheckCircle className="w-5 h-5" /> Proceed to Approval
                                            </button>
                                            <button
                                                onClick={() => handleReject(selectedApplication.id)}
                                                disabled={actionLoading}
                                                className="flex-1 bg-rose-50 text-rose-600 font-bold py-4 rounded-2xl hover:bg-rose-100 disabled:opacity-50 transition-all flex items-center justify-center gap-2"
                                            >
                                                <XCircle className="w-5 h-5" /> Reject
                                            </button>
                                        </>
                                    ) : (
                                        <button
                                            onClick={() => handleApprove(selectedApplication.id)}
                                            disabled={actionLoading}
                                            className="w-full bg-primary-600 text-white font-bold py-4 rounded-2xl hover:bg-primary-700 shadow-xl shadow-primary-600/30 transition-all active:scale-95 flex items-center justify-center gap-2"
                                        >
                                            <CheckCircle className="w-5 h-5" /> Finalize & Create Student Record
                                        </button>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </Modal>

            {/* Hidden template for PDF generation */}
            {selectedApplication && selectedApplication.status === 'approved' && (
                <AdmissionLetterTemplate ref={letterRef} application={selectedApplication} />
            )}
        </div>
    );
}
