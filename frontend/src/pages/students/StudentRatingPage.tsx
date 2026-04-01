import React, { useState, useEffect } from 'react';
import {
    Star,
    Search,
    Award,
    CheckCircle2,
    Users,
    ChevronRight,
    MessageSquare,
    BookOpen,
    Camera
} from 'lucide-react';
import api, { getFileUrl } from '../../services/api';
import RatingModal from '../../components/hr/RatingModal';
import { useToast } from '../../context/ToastContext';
import { cn } from '../../utils/cn';

interface Teacher {
    id: string;
    name: string;
    photo?: string;
    role: string;
    subjects: string[];
}

const StudentRatingPage: React.FC = () => {
    const [teachers, setTeachers] = useState<Teacher[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [selectedTeacher, setSelectedTeacher] = useState<Teacher | null>(null);
    const [successMessage, setSuccessMessage] = useState(false);
    const toast = useToast();

    useEffect(() => {
        fetchMyTeachers();
    }, []);

    const fetchMyTeachers = async () => {
        try {
            setLoading(true);
            const data = await api.getMyTeachers();
            setTeachers(data);
        } catch (error) {
            console.error('Error fetching teachers:', error);
            toast.showError('Unable to load your assigned teachers. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleRate = (teacher: Teacher) => {
        setSelectedTeacher(teacher);
        setShowModal(true);
    };

    const handleSubmitRating = async (data: any) => {
        try {
            await api.createRating({
                ...data,
                teacherId: selectedTeacher?.id
            });
            setShowModal(false);
            setSuccessMessage(true);
            toast.showSuccess(`Thank you! Your feedback for ${selectedTeacher?.name} has been recorded.`);
            setTimeout(() => setSuccessMessage(false), 5000);
        } catch (error: any) {
            toast.showError(error.response?.data?.message || 'Error submitting rating');
        }
    };

    const filteredTeachers = teachers.filter(t =>
        t.name.toLowerCase().includes(search.toLowerCase()) ||
        t.subjects.some(s => s.toLowerCase().includes(search.toLowerCase()))
    );

    return (
        <div className="p-4 md:p-8 animate-in fade-in duration-500">
            {/* Header Section */}
            <div className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div className="max-w-2xl">
                    <div className="inline-flex items-center gap-2 px-3 py-1 bg-yellow-50 dark:bg-yellow-900/20 text-yellow-600 dark:text-yellow-400 rounded-full text-[10px] font-black uppercase tracking-wider mb-3">
                        <Award size={14} className="animate-pulse" />
                        Teacher Excellence Reviews
                    </div>
                    <h1 className="text-4xl font-black text-gray-900 dark:text-white tracking-tight">
                        Rate Your <span className="text-primary-600">Teachers</span>
                    </h1>
                    <p className="text-gray-500 dark:text-gray-400 mt-2 font-medium max-w-lg">
                        Your feedback helps us maintain the highest standards of teaching. All ratings are anonymous and valued by the administration.
                    </p>
                </div>

                <div className="relative w-full md:w-80 group">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-primary-500 transition-colors" size={18} />
                    <input
                        type="text"
                        placeholder="Search instructors or subjects..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full pl-11 pr-4 py-3 bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-2xl outline-none focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500 transition-all shadow-sm font-bold text-sm"
                    />
                </div>
            </div>

            {/* Quick Stats / Info */}
            {successMessage && (
                <div className="mb-8 p-4 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-100 dark:border-emerald-800 text-emerald-700 dark:text-emerald-400 rounded-2xl flex items-center justify-between gap-4 animate-in slide-in-from-top-4 duration-300">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-white dark:bg-emerald-900 rounded-xl shadow-sm">
                            <CheckCircle2 size={24} className="text-emerald-500" />
                        </div>
                        <div>
                            <p className="font-black text-sm">Submission Complete</p>
                            <p className="text-xs opacity-80 font-medium">Your feedback has been delivered securely to the HR department.</p>
                        </div>
                    </div>
                    <button onClick={() => setSuccessMessage(false)} className="text-xs font-black uppercase tracking-widest hover:underline">Dismiss</button>
                </div>
            )}

            {/* Content Grid */}
            {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {[1, 2, 3].map(i => (
                        <div key={i} className="h-64 bg-gray-100 dark:bg-gray-800 rounded-3xl animate-pulse border border-gray-200 dark:border-gray-700" />
                    ))}
                </div>
            ) : filteredTeachers.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {filteredTeachers.map((teacher) => (
                        <div 
                            key={teacher.id} 
                            className="bg-white dark:bg-gray-800 rounded-[2rem] border border-gray-100 dark:border-gray-700 p-6 flex flex-col shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group"
                        >
                            <div className="flex items-start justify-between mb-6">
                                <div className="relative">
                                    <div className="w-20 h-20 rounded-2xl bg-slate-50 dark:bg-slate-900 flex items-center justify-center text-slate-300 overflow-hidden border border-gray-50 dark:border-gray-700 shadow-inner group-hover:scale-105 transition-transform duration-500">
                                        {teacher.photo ? (
                                            <img src={getFileUrl(teacher.photo)} alt={teacher.name} className="w-full h-full object-cover" />
                                        ) : (
                                            <Camera size={32} />
                                        )}
                                    </div>
                                    <div className="absolute -bottom-2 -right-2 p-2 bg-yellow-400 text-white rounded-xl shadow-lg ring-4 ring-white dark:ring-gray-800">
                                        <Star size={16} fill="currentColor" />
                                    </div>
                                </div>
                                <div className={cn(
                                    "px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest",
                                    teacher.role === 'Class Teacher' 
                                        ? "bg-primary-50 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400"
                                        : "bg-slate-50 dark:bg-slate-900/50 text-slate-500 dark:text-slate-400"
                                )}>
                                    {teacher.role}
                                </div>
                            </div>

                            <div className="flex-1">
                                <h3 className="text-xl font-black text-gray-900 dark:text-white leading-tight mb-2 group-hover:text-primary-600 transition-colors capitalize">
                                    {teacher.name}
                                </h3>
                                
                                <div className="flex flex-wrap gap-1.5 mb-6">
                                    {teacher.subjects.length > 0 ? teacher.subjects.map((sub, idx) => (
                                        <span key={idx} className="flex items-center gap-1 text-[10px] bg-gray-50 dark:bg-gray-900 text-gray-500 dark:text-gray-400 px-2 py-0.5 rounded-md font-bold border border-gray-100 dark:border-gray-800 capitalize">
                                            <BookOpen size={10} />
                                            {sub}
                                        </span>
                                    )) : (
                                        <span className="text-[10px] text-gray-400 font-bold italic">Classroom Oversight</span>
                                    )}
                                </div>
                            </div>

                            <button
                                onClick={() => handleRate(teacher)}
                                className="mt-auto w-full group/btn flex items-center justify-between bg-gray-900 dark:bg-white text-white dark:text-gray-900 p-1.5 rounded-2xl font-black shadow-lg hover:shadow-primary-500/20 hover:bg-primary-600 dark:hover:bg-primary-500 transition-all duration-300"
                            >
                                <span className="ml-4 text-xs tracking-widest uppercase">Start Review</span>
                                <div className="w-10 h-10 bg-white/20 dark:bg-black/10 rounded-xl flex items-center justify-center group-hover/btn:translate-x-1 transition-transform">
                                    <ChevronRight size={20} />
                                </div>
                            </button>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="py-24 flex flex-col items-center justify-center bg-white dark:bg-gray-800 rounded-[3rem] border border-dashed border-gray-200 dark:border-gray-700">
                    <div className="w-20 h-20 bg-gray-50 dark:bg-gray-900 rounded-3xl flex items-center justify-center mb-6 text-gray-300">
                        <Users size={40} />
                    </div>
                    <h3 className="text-xl font-black text-gray-900 dark:text-white mb-2">No Active Assignments</h3>
                    <p className="text-gray-500 dark:text-gray-400 font-medium max-w-sm text-center">
                        We couldn't find any teachers linked to your current class and subjects. If you have active courses, please contact the Registrar.
                    </p>
                </div>
            )}

            {selectedTeacher && (
                <RatingModal
                    isOpen={showModal}
                    onClose={() => setShowModal(false)}
                    onSubmit={handleSubmitRating}
                    teachers={[]} 
                    initialData={{ 
                        teacherId: selectedTeacher.id,
                        subject: selectedTeacher.subjects[0] || '' 
                    }}
                />
            )}
        </div>
    );
};

export default StudentRatingPage;
