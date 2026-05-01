import { useState, useEffect, useMemo } from 'react';
import { DataTable } from '../../components/ui/data-table';
import { ColumnDef } from '@tanstack/react-table';
import { Eye, Users, Edit, Trash2, Search, Plus, GraduationCap, MapPin, Briefcase, Linkedin, BadgeCheck, Star, Printer, Mail } from 'lucide-react';
import { Link } from 'react-router-dom';
import api, { getFileUrl } from '../../services/api';
import { useToast } from '../../context/ToastContext';
import { TablePagination } from '../../components/ui/TablePagination';
import { usePermissions } from '../../hooks/usePermissions';
import { clsx } from 'clsx';
import { GraduateStudentModal } from './components/graduate-student-modal';
import { BulkGraduateModal } from './components/bulk-graduate-modal';
import { UpdateAlumniModal } from './components/update-alumni-modal';
import { AlumniIDCardTemplate } from '../../components/alumni/AlumniIDCardTemplate';
import { EmailAlumniModal } from '../../components/alumni/EmailAlumniModal';
import { useRef } from 'react';

type Alumni = {
    id: string;
    studentId?: string;
    student?: {
        firstName: string;
        lastName: string;
        studentPhoto?: string;
        admissionNo: string;
    };
    graduationYear: number;
    currentOccupation?: string;
    currentCompany?: string;
    linkedInUrl?: string;
    location?: string;
    achievements?: string;
    isMentorshipAvailable: boolean;
    isFeatured: boolean;
    email?: string;
    phoneNumber?: string;
};

export default function AlumniDirectory() {
    const [alumni, setAlumni] = useState<Alumni[]>([]);
    const [loading, setLoading] = useState(true);
    const { hasPermission } = usePermissions();
    const [searchQuery, setSearchQuery] = useState('');
    const [isGraduateModalOpen, setIsGraduateModalOpen] = useState(false);
    const [isBulkGraduateOpen, setIsBulkGraduateOpen] = useState(false);
    const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false);
    const [selectedAlumni, setSelectedAlumni] = useState<Alumni | null>(null);
    const [isEmailModalOpen, setIsEmailModalOpen] = useState(false);
    const [selectedAlumniForPrint, setSelectedAlumniForPrint] = useState<Alumni | null>(null);
    const [selectedAlumniForEmail, setSelectedAlumniForEmail] = useState<Alumni | null>(null);
    const [mentorshipFilter, setMentorshipFilter] = useState<'all' | 'available'>('all');
    const printRef = useRef<HTMLDivElement>(null);
    const toast = useToast();

    // Pagination State
    const [currentPage, setCurrentPage] = useState(1);
    const pageSize = 10;

    useEffect(() => {
        fetchAlumni();
    }, []);

    const fetchAlumni = async () => {
        setLoading(true);
        try {
            const data = await api.getAlumni();
            setAlumni(data);
        } catch (error) {
            console.error("Failed to fetch alumni", error);
            toast.showError("Failed to load alumni directory");
        } finally {
            setLoading(false);
        }
    };

    const filteredAlumni = useMemo(() => {
        return alumni.filter(item => {
            const matchesSearch = (
                (item.student?.firstName + ' ' + (item.student?.lastName || '')).toLowerCase().includes(searchQuery.toLowerCase()) ||
                item.student?.admissionNo.toLowerCase().includes(searchQuery.toLowerCase()) ||
                item.currentOccupation?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                item.currentCompany?.toLowerCase().includes(searchQuery.toLowerCase())
            );
            const matchesMentorship = mentorshipFilter === 'all' || item.isMentorshipAvailable;
            return matchesSearch && matchesMentorship;
        });
    }, [alumni, searchQuery, mentorshipFilter]);

    const handlePrintIDCard = (alumni: Alumni) => {
        setSelectedAlumniForPrint(alumni);
        // Wait for state update and render, then print
        setTimeout(() => {
            window.print();
            // Reset after print dialog is closed or opened
            setTimeout(() => setSelectedAlumniForPrint(null), 1000);
        }, 800);
    };

    const columns = useMemo<ColumnDef<Alumni>[]>(() => [
        {
            accessorKey: 'student',
            header: 'Alumnus',
            cell: ({ row }) => {
                const item = row.original;
                return (
                    <div className="flex items-center gap-3">
                        {item.student?.studentPhoto ? (
                            <img
                                src={getFileUrl(item.student.studentPhoto)}
                                alt={item.student.firstName}
                                className="w-10 h-10 rounded-full object-cover shadow-sm border border-gray-200"
                            />
                        ) : (
                            <div className="w-10 h-10 rounded-full bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-400 flex items-center justify-center text-sm font-bold">
                                {item.student?.firstName[0] || 'A'}
                            </div>
                        )}
                        <div>
                            <div className="flex items-center gap-1.5">
                                <p className="font-bold text-gray-900 dark:text-white uppercase tracking-tight">
                                    {item.student?.firstName} {item.student?.lastName}
                                </p>
                                {item.isMentorshipAvailable && (
                                    <span title="Available for Mentorship">
                                        <BadgeCheck size={14} className="text-blue-500" />
                                    </span>
                                )}
                            </div>
                            <p className="text-xs text-gray-500">ID: {item.student?.admissionNo}</p>
                        </div>
                    </div>
                );
            }
        },
        {
            accessorKey: 'graduationYear',
            header: 'Class Of',
            cell: ({ row }) => (
                <span className="px-2 py-1 bg-gray-100 dark:bg-gray-800 rounded-md text-xs font-bold text-gray-600 dark:text-gray-400">
                    {row.original.graduationYear}
                </span>
            )
        },
        {
            accessorKey: 'currentOccupation',
            header: 'Professional Info',
            cell: ({ row }) => (
                <div className="space-y-1">
                    <div className="text-sm font-medium text-gray-900 dark:text-gray-100 flex items-center gap-1.5">
                        <Briefcase className="w-3.5 h-3.5 text-gray-400" />
                        {row.original.currentOccupation || 'N/A'}
                    </div>
                    <div className="text-xs text-gray-500 flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-gray-400" />
                        {row.original.location || 'Unknown'}
                    </div>
                </div>
            )
        },
        {
            accessorKey: 'isMentorshipAvailable',
            header: 'Mentorship',
            cell: ({ row }) => (
                <span className={clsx(
                    "inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider",
                    row.original.isMentorshipAvailable 
                        ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400" 
                        : "bg-gray-100 text-gray-400 dark:bg-gray-800 dark:text-gray-600"
                )}>
                    {row.original.isMentorshipAvailable ? 'Available' : 'No'}
                </span>
            )
        },
        {
            id: 'featured',
            header: 'Featured',
            cell: ({ row }) => (
                <button
                    onClick={async () => {
                        try {
                            await api.toggleAlumniFeatured(row.original.id);
                            toast.showSuccess(row.original.isFeatured ? "Removed from featured" : "Added to featured");
                            fetchAlumni();
                        } catch (e) {
                            toast.showError("Failed to update featured status");
                        }
                    }}
                    className={clsx(
                        "p-2 rounded-lg transition-colors",
                        row.original.isFeatured ? "text-amber-500 bg-amber-50" : "text-gray-300 hover:bg-gray-50"
                    )}
                    title={row.original.isFeatured ? "Unfeature" : "Feature on Public Page"}
                >
                    <Star size={18} fill={row.original.isFeatured ? "currentColor" : "none"} />
                </button>
            )
        },
        {
            id: 'actions',
            header: 'Actions',
            cell: ({ row }) => (
                <div className="flex items-center gap-2">
                    {row.original.linkedInUrl && (
                        <a href={row.original.linkedInUrl} target="_blank" rel="noopener noreferrer" className="p-2 rounded-lg text-blue-600 hover:bg-blue-50 transition-colors">
                            <Linkedin className="w-4 h-4" />
                        </a>
                    )}
                    <Link to={`/alumni/profile/${row.original.id}`} className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 transition-colors">
                        <Eye className="w-4 h-4" />
                    </Link>
                        <button 
                            className="p-2 text-gray-400 hover:text-primary-600 transition-colors"
                            title="Print ID Card"
                            onClick={() => handlePrintIDCard(row.original)}
                        >
                            <Printer className="w-4 h-4" /> 
                        </button>
                    <button 
                        className="p-2 text-gray-400 hover:text-blue-600 transition-colors"
                        title="Send Email"
                        onClick={() => {
                            setSelectedAlumniForEmail(row.original);
                            setIsEmailModalOpen(true);
                        }}
                    >
                        <Mail className="w-4 h-4" />
                    </button>
                    <button 
                        className="p-2 text-gray-400 hover:text-primary-600 transition-colors"
                        onClick={() => {
                            setSelectedAlumni(row.original);
                            setIsUpdateModalOpen(true);
                        }}
                        title="Edit Alumni"
                    >
                        <Edit className="w-4 h-4" />
                    </button>
                    {hasPermission('alumni:delete') && (
                        <button 
                            className="p-2 text-gray-400 hover:text-red-600 transition-colors"
                            onClick={async () => {
                                if (window.confirm('Are you sure you want to remove this alumnus?')) {
                                    try {
                                        await api.deleteAlumni(row.original.id);
                                        toast.showSuccess('Alumnus removed successfully');
                                        fetchAlumni();
                                    } catch (error) {
                                        toast.showError('Failed to remove alumnus');
                                    }
                                }
                            }}
                        >
                            <Trash2 className="w-4 h-4" />
                        </button>
                    )}
                </div>
            )
        }
    ], [hasPermission]);

    return (
        <div className="space-y-6 p-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
                        <GraduationCap className="w-8 h-8 text-primary-600" />
                        Alumni Directory
                    </h1>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Track and engage with our former students</p>
                </div>
                {hasPermission('alumni:create') && (
                    <div className="flex items-center gap-3">
                        <button 
                            onClick={() => {
                                setSelectedAlumniForEmail(null);
                                setIsEmailModalOpen(true);
                            }}
                            className="bg-white dark:bg-gray-800 text-blue-600 px-5 py-2.5 rounded-xl font-bold text-sm border-2 border-blue-100 dark:border-blue-900 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all flex items-center gap-2"
                        >
                            <Mail size={18} />
                            Send Newsletter
                        </button>
                        <button 
                            onClick={() => setIsBulkGraduateOpen(true)}
                            className="bg-white dark:bg-gray-800 text-primary-600 px-5 py-2.5 rounded-xl font-bold text-sm border-2 border-primary-200 dark:border-primary-800 hover:bg-primary-50 dark:hover:bg-primary-900/20 transition-all flex items-center gap-2"
                        >
                            <Users size={18} />
                            Bulk Graduate
                        </button>
                        <button 
                            onClick={() => setIsGraduateModalOpen(true)}
                            className="bg-primary-600 text-white px-6 py-2.5 rounded-xl font-bold text-sm shadow-lg shadow-primary-200 hover:bg-primary-700 transition-all flex items-center gap-2"
                        >
                            <Plus size={18} />
                            Graduate Student
                        </button>
                    </div>
                )}
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
                <div className="p-5 border-b border-gray-50 dark:border-gray-700 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="relative max-w-md w-full">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search by name, ID, or company..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 focus:ring-2 focus:ring-primary-500 outline-none transition-all"
                        />
                    </div>
                    
                    <div className="flex items-center gap-2 bg-gray-50 dark:bg-gray-900 p-1 rounded-xl">
                        <button
                            onClick={() => setMentorshipFilter('all')}
                            className={clsx(
                                "px-4 py-1.5 rounded-lg text-xs font-bold transition-all",
                                mentorshipFilter === 'all' ? "bg-white dark:bg-gray-800 shadow-sm text-primary-600" : "text-gray-500 hover:text-gray-700"
                            )}
                        >
                            All Alumni
                        </button>
                        <button
                            onClick={() => setMentorshipFilter('available')}
                            className={clsx(
                                "px-4 py-1.5 rounded-lg text-xs font-bold transition-all",
                                mentorshipFilter === 'available' ? "bg-white dark:bg-gray-800 shadow-sm text-blue-600" : "text-gray-500 hover:text-gray-700"
                            )}
                        >
                            Mentors Only
                        </button>
                    </div>
                </div>

                {loading ? (
                    <div className="p-20 flex flex-col items-center justify-center gap-4">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
                        <p className="text-gray-500">Loading directory...</p>
                    </div>
                ) : (
                    <>
                        <DataTable columns={columns} data={filteredAlumni.slice((currentPage - 1) * pageSize, currentPage * pageSize)} />
                        <TablePagination
                            currentPage={currentPage}
                            totalItems={filteredAlumni.length}
                            pageSize={pageSize}
                            onPageChange={setCurrentPage}
                        />
                    </>
                )}
            </div>

            <GraduateStudentModal 
                isOpen={isGraduateModalOpen}
                onClose={() => setIsGraduateModalOpen(false)}
                onSuccess={() => {
                    setIsGraduateModalOpen(false);
                    fetchAlumni();
                }}
            />

            <BulkGraduateModal
                isOpen={isBulkGraduateOpen}
                onClose={() => setIsBulkGraduateOpen(false)}
                onSuccess={() => {
                    setIsBulkGraduateOpen(false);
                    fetchAlumni();
                }}
            />

            <UpdateAlumniModal
                isOpen={isUpdateModalOpen}
                onClose={() => {
                    setIsUpdateModalOpen(false);
                    setSelectedAlumni(null);
                }}
                onSuccess={() => {
                    setIsUpdateModalOpen(false);
                    setSelectedAlumni(null);
                    fetchAlumni();
                }}
                alumni={selectedAlumni}
            />

            <EmailAlumniModal
                isOpen={isEmailModalOpen}
                onClose={() => {
                    setIsEmailModalOpen(false);
                    setSelectedAlumniForEmail(null);
                }}
                targetIds={selectedAlumniForEmail ? [selectedAlumniForEmail.id] : []}
                targetName={selectedAlumniForEmail ? `${selectedAlumniForEmail.student?.firstName} ${selectedAlumniForEmail.student?.lastName}` : undefined}
            />

            {/* Hidden Print Content */}
            <div className="print-container">
                {selectedAlumniForPrint && (
                    <AlumniIDCardTemplate 
                        ref={printRef}
                        alumni={selectedAlumniForPrint} 
                    />
                )}
            </div>
        </div>
    );
}
