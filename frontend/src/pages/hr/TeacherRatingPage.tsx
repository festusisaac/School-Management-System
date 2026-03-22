import { useState, useEffect } from 'react';
import {
    Award,
    Star,
    Calendar,
} from 'lucide-react';
import api, { getFileUrl } from '../../services/api';
import RatingModal from '../../components/hr/RatingModal';
import { format } from 'date-fns';
import { useToast } from '../../context/ToastContext';
import { useSystem } from '../../context/SystemContext';
import { DataTable } from '../../components/ui/data-table';
import { ColumnDef } from '@tanstack/react-table';

interface Staff {
    id: string;
    firstName: string;
    lastName: string;
    employeeId: string;
    designation?: { title: string };
    photo?: string;
}

interface TeacherRating {
    id: string;
    teacherId: string;
    academicYear: string;
    term: string;
    subject: string;
    overallRating: number;
    ratingDate: string;
    teacher: Staff;
    rater: Staff;
}

export default function TeacherRatingPage() {
    const [ratings, setRatings] = useState<TeacherRating[]>([]);
    const [teachers, setTeachers] = useState<Staff[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingRating, setEditingRating] = useState<TeacherRating | null>(null);
    const toast = useToast();
    const { settings } = useSystem();

    const [selectedTerm, setSelectedTerm] = useState('');

    // Removed session loader


    useEffect(() => {
        if (settings) {
            setSelectedTerm(settings.activeTermName || '');
        }
    }, [settings]);

    useEffect(() => {
        fetchData();
    }, [selectedTerm]);

    const fetchData = async () => {
        try {
            setLoading(true);
            const [ratingsData, staffData] = await Promise.all([
                api.getRatings({
                    academicYear: settings?.activeSessionName || undefined,
                    term: selectedTerm || undefined
                }),
                api.getStaff()
            ]);
            setRatings(ratingsData || []);
            setTeachers(staffData.filter((s: any) => s.role === 'Teacher'));
        } catch (error) {
            console.error('Error fetching data:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleCreateOrUpdate = async (data: any) => {
        try {
            if (editingRating) {
                await api.updateRating(editingRating.id, data);
            } else {
                await api.createRating(data);
            }
            setShowModal(false);
            setEditingRating(null);
            fetchData();
        } catch (error: any) {
            toast.showError(error.response?.data?.message || 'Error saving rating');
        }
    };

    const getRatingColor = (rating: number) => {
        if (rating >= 4) return 'text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20 border-green-100 dark:border-green-800';
        if (rating >= 3) return 'text-yellow-600 dark:text-yellow-400 bg-yellow-50 dark:bg-yellow-900/20 border-yellow-100 dark:border-yellow-800';
        return 'text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 border-red-100 dark:border-red-800';
    };

    const averageScore = ratings.length > 0
        ? (ratings.reduce((acc, r) => acc + Number(r.overallRating), 0) / ratings.length).toFixed(1)
        : '0.0';

    const columns: ColumnDef<TeacherRating>[] = [
        {
            id: 'teacher',
            header: 'Teacher',
            accessorFn: (row) => `${row.teacher.firstName} ${row.teacher.lastName}`,
            cell: ({ row }) => (
                <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-primary-50 dark:bg-primary-900/40 flex items-center justify-center text-primary-600 dark:text-primary-400 font-bold border-2 border-white dark:border-gray-800 shadow-sm overflow-hidden">
                        {row.original.teacher.photo ? (
                            <img src={getFileUrl(row.original.teacher.photo)} alt="" className="w-full h-full object-cover" />
                        ) : (
                            <span className="text-sm">{row.original.teacher.firstName[0]}{row.original.teacher.lastName[0]}</span>
                        )}
                    </div>
                    <div>
                        <p className="font-bold text-gray-900 dark:text-white leading-tight">{row.original.teacher.firstName} {row.original.teacher.lastName}</p>
                        <p className="text-[10px] text-gray-400 dark:text-gray-500 font-bold uppercase tracking-tight">{row.original.teacher.employeeId}</p>
                    </div>
                </div>
            ),
        },
        {
            id: 'session_term',
            header: 'Year / Term',
            accessorFn: (row) => `${row.academicYear} ${row.term}`,
            cell: ({ row }) => (
                <div className="flex flex-col">
                    <span className="text-xs font-bold text-gray-700 dark:text-gray-200">{row.original.academicYear}</span>
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-tight">{row.original.term}</span>
                </div>
            ),
        },
        {
            id: 'subject',
            header: 'Subject',
            accessorKey: 'subject',
            cell: ({ row }) => (
                <span className="text-xs font-medium text-gray-600 dark:text-gray-300">{row.original.subject || 'N/A'}</span>
            ),
        },
        {
            id: 'score',
            header: 'Score',
            accessorKey: 'overallRating',
            cell: ({ row }) => (
                <span className={`px-2.5 py-1 rounded-lg text-xs font-black border ${getRatingColor(row.original.overallRating)}`}>
                    {Number(row.original.overallRating).toFixed(1)} / 5.0
                </span>
            ),
        },
        {
            id: 'date',
            header: 'Date',
            accessorKey: 'ratingDate',
            cell: ({ row }) => (
                <span className="text-xs text-gray-500 font-medium">
                    {format(new Date(row.original.ratingDate), 'MMM dd, yyyy')}
                </span>
            ),
        },
        {
            id: 'rater',
            header: () => <div className="text-right">Rater</div>,
            cell: ({ row }) => (
                <div className="text-right">
                    <span className="text-xs font-bold text-gray-600 dark:text-gray-300">
                        {row.original.rater?.firstName ? `${row.original.rater.firstName} ${row.original.rater.lastName}` : 'Anonymous'}
                    </span>
                </div>
            ),
        },
    ];

    return (
        <div className="space-y-6 animate-in fade-in duration-500 pb-20">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-gray-800 p-6 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm transition-all">
                <div className="flex items-center gap-4">
                    <div className="p-3 bg-yellow-50 dark:bg-yellow-900/20 text-yellow-600 dark:text-yellow-400 rounded-xl">
                        <Award className="w-6 h-6" />
                    </div>
                    <div>
                        <h1 className="text-xl font-bold text-gray-900 dark:text-white">Performance Dashboard</h1>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Track and manage teacher performance ratings</p>
                    </div>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                {[
                    { label: 'Average Score', value: averageScore, sub: '/ 5.0', color: 'text-gray-900' },
                    { label: 'Total Ratings', value: ratings.length, color: 'text-gray-900' },
                    { label: 'Rated Teachers', value: new Set(ratings.map(r => r.teacherId)).size, color: 'text-gray-900' },
                    { label: 'Top Performer', value: ratings.length > 0 ? ratings.sort((a, b) => b.overallRating - a.overallRating)[0].teacher.firstName : 'N/A', color: 'text-primary-600' }
                ].map((stat, i) => (
                    <div key={i} className="bg-white dark:bg-gray-800 p-6 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm">
                        <p className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-2">{stat.label}</p>
                        <div className="flex items-end gap-1">
                            <h3 className={`text-2xl font-black ${stat.color} dark:text-white leading-none`}>{stat.value}</h3>
                            {stat.sub && <span className="text-xs font-bold text-gray-400 mb-0.5">{stat.sub}</span>}
                        </div>
                    </div>
                ))}
            </div>

            {/* List Section */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm overflow-hidden">
                <div className="p-4 border-b border-gray-50 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/50 flex flex-col md:flex-row justify-between items-center gap-4">
                    <div className="flex items-center gap-2">
                         <Star size={16} className="text-yellow-500" />
                         <h2 className="text-sm font-bold text-gray-700 dark:text-gray-200">Performance Records</h2>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        {/* Redundant Session Selector removed */}

                        <select
                            className="px-3 py-1.5 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-[11px] font-bold outline-none focus:ring-2 focus:ring-primary-500 transition-all cursor-pointer"
                            value={selectedTerm}
                            onChange={e => setSelectedTerm(e.target.value)}
                        >
                            <option value="">All Terms</option>
                            <option value="First Term">First Term</option>
                            <option value="Second Term">Second Term</option>
                            <option value="Third Term">Third Term</option>
                        </select>
                    </div>
                </div>

                <div className="p-0">
                    <DataTable 
                        columns={columns} 
                        data={ratings}
                        loading={loading}
                        searchKey="teacher"
                        placeholder="Search by teacher name or ID..."
                    />
                </div>
            </div>

            <RatingModal
                isOpen={showModal}
                onClose={() => { setShowModal(false); setEditingRating(null); }}
                onSubmit={handleCreateOrUpdate}
                teachers={teachers}
                initialData={editingRating}
            />
        </div>
    );
}
