import { useState, useEffect, useMemo } from 'react';
import { DataTable } from '../../components/ui/data-table';
import { ColumnDef } from '@tanstack/react-table';
import { Eye, Edit, Trash2, LayoutGrid, List as ListIcon, Search, MoreVertical, Phone, Upload, Download, Plus } from 'lucide-react';
import { Link } from 'react-router-dom';
import api, { getFileUrl } from '../../services/api';
import { TablePagination } from '../../components/ui/TablePagination';
import { usePermissions } from '../../hooks/usePermissions';
import { clsx } from 'clsx';
import BulkStudentImport from './BulkStudentImport';
import { exportStudents } from '../../utils/excelExport';

// Type definition matching the backend entity
type Student = {
    id: string;
    admissionNo: string;
    rollNo?: string;
    firstName: string;
    lastName?: string;
    class?: { name: string };
    section?: { name: string };
    fatherName?: string;
    dob: string;
    category?: { category: string };
    gender: string;
    mobileNumber?: string;
    email?: string;
    studentPhoto?: string;
    isActive: boolean;
};

export default function StudentDirectory() {
    const [students, setStudents] = useState<Student[]>([]);
    const [loading, setLoading] = useState(true);
    const { hasPermission, hasAnyPermission } = usePermissions();
    const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
    const [openMenuId, setOpenMenuId] = useState<string | null>(null);
    const [filters, setFilters] = useState({
        classId: '',
        sectionId: '',
        keyword: ''
    });
    const [showImportModal, setShowImportModal] = useState(false);

    // Pagination State
    const [currentPage, setCurrentPage] = useState(1);
    const pageSize = 24; // Multi-row friendly for grid view

    const [classes, setClasses] = useState<any[]>([]);
    const [sections, setSections] = useState<any[]>([]);

    useEffect(() => {
        fetchInitialData();
    }, []);

    useEffect(() => {
        fetchStudents();
        setCurrentPage(1); // Reset page on filter change
    }, [filters.classId, filters.sectionId]); // Keyword handled by local filter or debounce in future

    const fetchInitialData = async () => {
        try {
            const [classesRes, sectionsRes] = await Promise.all([
                api.getClasses(),
                api.getSections()
            ]);
            setClasses(classesRes || []);
            setSections(sectionsRes || []);
        } catch (error) {
            console.error("Failed to fetch metadata", error);
        }
    };

    const fetchStudents = async () => {
        setLoading(true);
        try {
            const data = await api.getStudents({
                classId: filters.classId || undefined,
                sectionId: filters.sectionId || undefined,
                keyword: filters.keyword || undefined // Backend supports keyword (search)
            });
            setStudents(data);
        } catch (error) {
            console.error("Failed to fetch students", error);
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = () => {
        fetchStudents();
        setCurrentPage(1);
    };

    // Calculate stats client-side for now
    const stats = useMemo(() => {
        return {
            total: students.length,
            active: students.filter(s => s.isActive).length,
            boys: students.filter(s => s.gender === 'Male').length,
            girls: students.filter(s => s.gender === 'Female').length
        };
    }, [students]);

    const columns = useMemo<ColumnDef<Student>[]>(() => {
        const baseColumns: ColumnDef<Student>[] = [
            { accessorKey: 'admissionNo', header: 'Admission No' },
            {
                accessorKey: 'firstName',
                header: 'Student Name',
                cell: ({ row }) => (
                    <div className="flex items-center gap-3">
                        {row.original.studentPhoto ? (
                            <img
                                src={getFileUrl(row.original.studentPhoto)}
                                alt={row.original.firstName}
                                className="w-9 h-9 rounded-full object-cover shadow-sm border border-gray-200"
                            />
                        ) : (
                            <div className={clsx(
                                "w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold shadow-sm transition-transform group-hover:scale-110",
                                row.original.gender === 'Male' ? "bg-primary-500/10 text-primary-600 dark:text-primary-400" : "bg-pink-500/10 text-pink-600 dark:text-pink-400"
                            )}>
                                {row.original.firstName[0]}
                            </div>
                        )}
                        <div>
                            <div className="font-medium text-gray-900 dark:text-white">
                                {row.original.firstName} {row.original.lastName}
                            </div>
                            <div className="text-xs text-gray-500 dark:text-gray-400">{row.original.email}</div>
                        </div>
                    </div>
                )
            },
            { accessorKey: 'rollNo', header: 'Roll No.' },
            {
                accessorKey: 'class',
                header: 'Class',
                cell: ({ row }) => <span className="px-2 py-1 bg-gray-100 dark:bg-gray-800/50 dark:text-gray-300 border border-transparent dark:border-gray-700/50 rounded-md text-xs font-medium">{row.original.class?.name || '-'} {row.original.section?.name ? `(${row.original.section.name})` : ''}</span>
            },
            {
                accessorKey: 'dob',
                header: 'DOB',
                cell: ({ row }) => row.original.dob ? new Date(row.original.dob).toLocaleDateString() : '-'
            },
            {
                accessorKey: 'gender',
                header: 'Gender',
                cell: ({ row }) => (
                    <span className={clsx(
                        "px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border transition-all",
                        row.original.gender === 'Male'
                            ? "bg-primary-50 text-primary-700 border-primary-200 dark:bg-primary-500/10 dark:text-primary-400 dark:border-primary-500/20 shadow-sm shadow-primary-500/5"
                            : "bg-pink-50 text-pink-700 border-pink-200 dark:bg-pink-500/10 dark:text-pink-400 dark:border-pink-500/20 shadow-sm shadow-pink-500/5"
                    )}>
                        {row.original.gender}
                    </span>
                )
            },
            {
                accessorKey: 'category',
                header: 'Category',
                cell: ({ row }) => row.original.category?.category || '-'
            },
            { accessorKey: 'mobileNumber', header: 'Mobile' },
        ];

        // Only add action column if user has at least one relevant permission
        if (hasAnyPermission(['students:view_profile', 'students:edit', 'students:delete'])) {
            baseColumns.push({
                id: 'actions',
                header: 'Action',
                cell: ({ row }) => (
                    <div className="flex items-center gap-2">
                        {hasPermission('students:view_profile') && (
                            <Link to={`/students/profile/${row.original.id}`} className="p-1.5 rounded-lg text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-primary-600 dark:hover:text-primary-500 transition-colors" title="View">
                                <Eye className="w-4 h-4" />
                            </Link>
                        )}
                        {hasPermission('students:edit') && (
                            <Link to={`/students/edit/${row.original.id}`} className="p-1.5 rounded-lg text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-amber-600 dark:hover:text-amber-400 transition-colors" title="Edit">
                                <Edit className="w-4 h-4" />
                            </Link>
                        )}
                        {hasPermission('students:delete') && (
                            <button className="p-1.5 rounded-lg text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-red-600 dark:hover:text-red-400 transition-colors" title="Delete" onClick={() => { if (window.confirm('Delete student?')) api.deleteStudent(row.original.id).then(fetchStudents) }}>
                                <Trash2 className="w-4 h-4" />
                            </button>
                        )}
                    </div>
                )
            });
        }

        return baseColumns;
    }, [students, hasPermission, hasAnyPermission]);

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Student Directory</h1>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Manage and view all student records</p>
                </div>
                <div className="flex items-center gap-3">
                    <div className="flex bg-gray-100 dark:bg-gray-800 p-1 rounded-xl">
                        <button
                            onClick={() => setViewMode('list')}
                            className={clsx("p-2 rounded-lg transition-all", viewMode === 'list' ? "bg-white dark:bg-gray-700 shadow-sm text-gray-900 dark:text-white" : "text-gray-500 hover:text-gray-700")}
                        >
                            <ListIcon className="w-4 h-4" />
                        </button>
                        <button
                            onClick={() => setViewMode('grid')}
                            className={clsx("p-2 rounded-lg transition-all", viewMode === 'grid' ? "bg-white dark:bg-gray-700 shadow-sm text-gray-900 dark:text-white" : "text-gray-500 hover:text-gray-700")}
                        >
                            <LayoutGrid className="w-4 h-4" />
                        </button>
                    </div>

                    {hasPermission('students:create') && (
                        <button 
                            onClick={() => setShowImportModal(true)}
                            className="flex items-center gap-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 px-4 py-2 rounded-xl text-sm font-bold text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 transition-all shadow-sm"
                        >
                            <Upload size={18} className="text-primary-600" />
                            Import
                        </button>
                    )}

                    <button 
                        onClick={() => exportStudents(students)}
                        className="flex items-center gap-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 px-4 py-2 rounded-xl text-sm font-bold text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 transition-all shadow-sm"
                    >
                        <Download size={18} className="text-green-600" />
                        Export
                    </button>

                    {hasPermission('students:create') && (
                        <Link 
                            to="/students/admission" 
                            className="flex items-center gap-2 bg-primary-600 px-4 py-2 rounded-xl text-sm font-bold text-white hover:bg-primary-700 transition-all shadow-md shadow-primary-200 dark:shadow-none"
                        >
                            <Plus size={18} />
                            Add Student
                        </Link>
                    )}
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-white dark:bg-gray-900 p-4 rounded-xl border border-gray-200 dark:border-gray-800/50 shadow-sm">
                    <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">Total Students</div>
                    <div className="text-2xl font-bold text-gray-900 dark:text-white">{stats.total}</div>
                </div>
                <div className="bg-white dark:bg-gray-900 p-4 rounded-xl border border-gray-200 dark:border-gray-800/50 shadow-sm">
                    <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">Active Students</div>
                    <div className="text-2xl font-bold text-green-600">{stats.active}</div>
                </div>
                <div className="bg-white dark:bg-gray-900 p-4 rounded-xl border border-gray-200 dark:border-gray-800/50 shadow-sm">
                    <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">Boys</div>
                    <div className="text-2xl font-bold text-primary-600">{stats.boys}</div>
                </div>
                <div className="bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
                    <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">Girls</div>
                    <div className="text-2xl font-bold text-pink-600">{stats.girls}</div>
                </div>
            </div>

            {/* Filters */}
            <div className="bg-white dark:bg-gray-900 p-4 rounded-xl border border-gray-200 dark:border-gray-800/50 shadow-sm flex flex-col md:flex-row gap-4 items-end md:items-center justify-between">
                <div className="flex flex-wrap gap-4 w-full md:w-auto">
                    <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Class</label>
                        <select
                            value={filters.classId}
                            onChange={(e) => setFilters({ ...filters, classId: e.target.value })}
                            className="w-full md:w-40 px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-sm focus:ring-2 focus:ring-primary-500 outline-none transition-all"
                        >
                            <option value="">All Classes</option>
                            {classes.map((cls: any) => (
                                <option key={cls.id} value={cls.id}>{cls.name}</option>
                            ))}
                        </select>
                    </div>
                    <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Section</label>
                        <select
                            value={filters.sectionId}
                            onChange={(e) => setFilters({ ...filters, sectionId: e.target.value })}
                            className="w-full md:w-40 px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-sm focus:ring-2 focus:ring-primary-500 outline-none transition-all"
                        >
                            {(() => {
                                const classArms = sections.filter((s: any) => s.classId === filters.classId);
                                if (filters.classId && classArms.length === 0) {
                                    return <option value="">General / No Sections</option>;
                                }
                                return (
                                    <>
                                        <option value="">All Sections</option>
                                        {classArms.map((sec: any) => (
                                            <option key={sec.id} value={sec.id}>{sec.name}</option>
                                        ))}
                                    </>
                                );
                            })()}
                        </select>
                    </div>
                </div>

                <div className="relative w-full md:w-64">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Search by name, ID..."
                        value={filters.keyword}
                        onChange={(e) => setFilters({ ...filters, keyword: e.target.value })}
                        onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                        className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-sm focus:ring-2 focus:ring-primary-500 outline-none transition-all"
                    />
                </div>
            </div>

            {/* Content */}
            {loading ? (
                <div className="flex flex-col items-center justify-center min-h-[400px] gap-3">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
                    <p className="text-gray-500 font-medium animate-pulse">Loading students...</p>
                </div>
            ) : viewMode === 'list' ? (
                <div className="space-y-4">
                    <DataTable columns={columns} data={students.slice((currentPage - 1) * pageSize, currentPage * pageSize)} />
                    <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800/50 rounded-xl overflow-hidden shadow-sm">
                        <TablePagination
                            currentPage={currentPage}
                            totalItems={students.length}
                            pageSize={pageSize}
                            onPageChange={(page) => {
                                setCurrentPage(page);
                                window.scrollTo({ top: 0, behavior: 'smooth' });
                            }}
                        />
                    </div>
                </div>
            ) : (
                <div className="space-y-6">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {students.slice((currentPage - 1) * pageSize, currentPage * pageSize).map((student) => (
                            <div key={student.id} className="group bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800/50 p-6 shadow-sm hover:shadow-md transition-all relative">
                             {hasAnyPermission(['students:view_profile', 'students:edit', 'students:delete']) && (
                                <div className="absolute top-4 right-4 z-10">
                                    <button
                                        onClick={() => setOpenMenuId(openMenuId === student.id ? null : student.id)}
                                        className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
                                    >
                                        <MoreVertical className="w-4 h-4" />
                                    </button>

                                    {openMenuId === student.id && (
                                        <>
                                            <div
                                                className="fixed inset-0 z-10 cursor-default"
                                                onClick={() => setOpenMenuId(null)}
                                            ></div>
                                            <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-900 rounded-xl shadow-xl border border-gray-100 dark:border-gray-800/50 py-1 z-20 animate-in fade-in zoom-in-95 duration-200">
                                                {hasPermission('students:view_profile') && (
                                                    <Link
                                                        to={`/students/profile/${student.id}`}
                                                        className="flex items-center gap-2 px-4 py-2.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700/50 hover:text-primary-600 dark:hover:text-primary-500 transition-colors"
                                                    >
                                                        <Eye className="w-4 h-4" />
                                                        View Profile
                                                    </Link>
                                                )}
                                                {hasPermission('students:edit') && (
                                                    <Link
                                                        to={`/students/edit/${student.id}`}
                                                        className="flex items-center gap-2 px-4 py-2.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700/50 hover:text-amber-600 dark:hover:text-amber-400 transition-colors"
                                                    >
                                                        <Edit className="w-4 h-4" />
                                                        Edit Details
                                                    </Link>
                                                )}
                                                {hasPermission('students:delete') && (
                                                    <button
                                                        onClick={() => {
                                                            setOpenMenuId(null);
                                                            if (window.confirm('Delete student?')) {
                                                                api.deleteStudent(student.id).then(fetchStudents);
                                                            }
                                                        }}
                                                        className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/10 transition-colors text-left"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                        Delete Student
                                                    </button>
                                                )}
                                            </div>
                                        </>
                                    )}
                                </div>
                            )}
                            <div className="flex flex-col items-center">
                                {student.studentPhoto ? (
                                    <img
                                        src={getFileUrl(student.studentPhoto)}
                                        alt={student.firstName}
                                        className="w-20 h-20 rounded-full object-cover mb-4 shadow-sm border-2 border-white dark:border-gray-800"
                                    />
                                ) : (
                                    <div className={clsx(
                                        "w-20 h-20 rounded-full flex items-center justify-center text-3xl font-bold mb-4 shadow-sm",
                                        student.gender === 'Male' ? "bg-primary-50 text-primary-600" : "bg-pink-50 text-pink-600"
                                    )}>
                                        {student.firstName[0]}
                                    </div>
                                )}
                                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1 group-hover:text-primary-600 transition-colors">{student.firstName} {student.lastName}</h3>
                                <span className="bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 px-3 py-1 rounded-full text-xs font-medium mb-4">
                                    {student.class?.name || 'No Class'} {student.section?.name ? `- ${student.section.name}` : ''}
                                </span>

                                <div className="w-full space-y-3 pt-4 border-t border-gray-100 dark:border-gray-700">
                                    <div className="flex items-center gap-3 text-sm text-gray-500 dark:text-gray-400">
                                        <div className="w-8 h-8 rounded-lg bg-gray-50 dark:bg-gray-700 flex items-center justify-center shrink-0">
                                            <span className="font-semibold text-gray-700 dark:text-gray-300 text-xs">ID</span>
                                        </div>
                                        <span className="truncate font-medium text-gray-700 dark:text-gray-300">{student.admissionNo}</span>
                                    </div>
                                    {student.mobileNumber && (
                                        <div className="flex items-center gap-3 text-sm text-gray-500 dark:text-gray-400">
                                            <div className="w-8 h-8 rounded-lg bg-primary-50 dark:bg-primary-900/20 flex items-center justify-center shrink-0 text-primary-600">
                                                <Phone className="w-4 h-4" />
                                            </div>
                                            <span className="truncate">{student.mobileNumber}</span>
                                        </div>
                                    )}
                                </div>

                                {hasPermission('students:view_profile') && (
                                    <div className="mt-6 flex items-center gap-2 w-full">
                                        <Link to={`/students/profile/${student.id}`} className="flex-1 btn bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 py-2 rounded-lg text-sm font-medium transition-colors text-center">
                                            View Profile
                                        </Link>
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                    </div>
                    <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800/50 rounded-xl overflow-hidden shadow-sm">
                        <TablePagination
                            currentPage={currentPage}
                            totalItems={students.length}
                            pageSize={pageSize}
                            onPageChange={(page) => {
                                setCurrentPage(page);
                                window.scrollTo({ top: 0, behavior: 'smooth' });
                            }}
                        />
                    </div>
                </div>
            )}

            {showImportModal && (
                <BulkStudentImport 
                    onClose={() => setShowImportModal(false)} 
                    onSuccess={() => {
                        setShowImportModal(false);
                        fetchStudents();
                    }} 
                />
            )}
        </div>
    );
}
