import React, { useState, useEffect } from 'react';
import {
    Award,
    Search,
    TrendingUp,
    Filter
} from 'lucide-react';
import api from '../../services/api';
import RatingModal from '../../components/hr/RatingModal';
import { format } from 'date-fns';
import { useToast } from '../../context/ToastContext';

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

const TeacherRatingPage: React.FC = () => {
    const [ratings, setRatings] = useState<TeacherRating[]>([]);
    const [teachers, setTeachers] = useState<Staff[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [editingRating, setEditingRating] = useState<TeacherRating | null>(null);
    const toast = useToast();

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            setLoading(true);
            const [ratingsData, staffData] = await Promise.all([
                api.getRatings(),
                api.getStaff()
            ]);
            setRatings(ratingsData);
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

    const filteredRatings = ratings.filter(r =>
        `${r.teacher.firstName} ${r.teacher.lastName}`.toLowerCase().includes(search.toLowerCase()) ||
        r.teacher.employeeId.toLowerCase().includes(search.toLowerCase()) ||
        r.subject?.toLowerCase().includes(search.toLowerCase())
    );

    const averageScore = ratings.length > 0
        ? (ratings.reduce((acc, r) => acc + Number(r.overallRating), 0) / ratings.length).toFixed(1)
        : '0.0';

    return (
        <div className="p-6 bg-gray-50 dark:bg-gray-900 min-h-screen transition-colors duration-300">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                <div>
                    <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white flex items-center gap-3">
                        <Award className="p-2 bg-yellow-500 text-white rounded-lg shadow-lg shadow-yellow-500/30" size={40} />
                        Teacher Performance Dashboard
                    </h1>
                    <p className="text-gray-500 dark:text-gray-400 mt-1">Review student feedback and overall performance analytics</p>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm transition-all">
                    <p className="text-sm font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-2">Average Score</p>
                    <div className="flex items-end gap-2">
                        <h3 className="text-3xl font-black text-gray-900 dark:text-white leading-none">{averageScore}</h3>
                        <span className="text-gray-400 dark:text-gray-600 font-bold mb-1">/ 5.0</span>
                    </div>
                </div>
                <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm transition-all">
                    <p className="text-sm font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-2">Total Ratings</p>
                    <h3 className="text-3xl font-black text-gray-900 dark:text-white leading-none">{ratings.length}</h3>
                </div>
                <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm transition-all">
                    <p className="text-sm font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-2">Rated Teachers</p>
                    <h3 className="text-3xl font-black text-gray-900 dark:text-white leading-none">{new Set(ratings.map(r => r.teacherId)).size}</h3>
                </div>
                <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm transition-all">
                    <p className="text-sm font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-2">Top Performer</p>
                    <h3 className="text-xl font-black text-blue-600 dark:text-blue-400 truncate leading-none">
                        {ratings.length > 0 ? `${ratings.sort((a, b) => b.overallRating - a.overallRating)[0].teacher.firstName}` : 'N/A'}
                    </h3>
                </div>
            </div>

            {/* List Section */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-md transition-all overflow-hidden">
                <div className="p-6 border-b border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800 flex flex-col md:flex-row justify-between items-center gap-4">
                    <div className="relative flex-1 max-w-md w-full">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500" size={18} />
                        <input
                            type="text"
                            placeholder="Search teacher, ID or subject..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full pl-10 pr-4 py-2.5 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-gray-900 dark:text-white rounded-xl outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium"
                        />
                    </div>
                    <div className="flex gap-2 w-full md:w-auto">
                        <button className="flex-1 md:flex-none p-2.5 bg-gray-50 dark:bg-gray-700 text-gray-500 dark:text-gray-400 rounded-xl border border-gray-200 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors">
                            <Filter size={18} className="mx-auto" />
                        </button>
                        <button className="flex-1 md:flex-none p-2.5 bg-gray-50 dark:bg-gray-700 text-gray-500 dark:text-gray-400 rounded-xl border border-gray-200 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors">
                            <TrendingUp size={18} className="mx-auto" />
                        </button>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-gray-50 dark:bg-gray-800/10 border-b border-gray-100 dark:border-gray-700 transition-colors">
                            <tr>
                                <th className="px-6 py-4 text-xs font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest">Teacher</th>
                                <th className="px-6 py-4 text-xs font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest">Year / Term</th>
                                <th className="px-6 py-4 text-xs font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest">Subject</th>
                                <th className="px-6 py-4 text-xs font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest">Score</th>
                                <th className="px-6 py-4 text-xs font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest">Date</th>
                                <th className="px-6 py-4 text-xs font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                            {loading ? (
                                <tr>
                                    <td colSpan={6} className="px-6 py-12 text-center text-gray-400 italic">Loading ratings...</td>
                                </tr>
                            ) : filteredRatings.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="px-6 py-12 text-center text-gray-400">No performance ratings found</td>
                                </tr>
                            ) : filteredRatings.map((rating) => (
                                <tr key={rating.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors group transition-all">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center text-blue-600 dark:text-blue-400 font-bold transition-colors">
                                                {rating.teacher.photo ? (
                                                    <img src={rating.teacher.photo.startsWith('http') ? rating.teacher.photo : `http://localhost:3000${rating.teacher.photo}`} alt="" className="w-full h-full rounded-full object-cover shadow-sm" />
                                                ) : (
                                                    <span className="text-sm">{rating.teacher.firstName[0]}{rating.teacher.lastName[0]}</span>
                                                )}
                                            </div>
                                            <div>
                                                <p className="font-bold text-gray-900 dark:text-white leading-tight">{rating.teacher.firstName} {rating.teacher.lastName}</p>
                                                <p className="text-xs text-gray-500 dark:text-gray-400">{rating.teacher.employeeId} • {rating.teacher.designation?.title}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <p className="text-sm font-bold text-gray-700 dark:text-gray-200">{rating.academicYear}</p>
                                        <p className="text-xs text-gray-500 dark:text-gray-400">{rating.term}</p>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className="text-sm font-medium text-gray-600 dark:text-gray-300">{rating.subject || 'N/A'}</span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className={`px-3 py-1 rounded-full text-sm font-black border transition-all ${getRatingColor(rating.overallRating)}`}>
                                            {Number(rating.overallRating).toFixed(1)} / 5.0
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400 font-medium">
                                        {format(new Date(rating.ratingDate), 'MMM dd, yyyy')}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right">
                                        <span className="text-sm font-medium text-gray-600 dark:text-gray-300">
                                            {rating.rater?.firstName ? `${rating.rater.firstName} ${rating.rater.lastName}` : 'Anonymous'}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
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
};

export default TeacherRatingPage;
