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
import { useSystem } from '../../context/SystemContext';
import { useAuthStore } from '../../stores/authStore';
import { cn } from '../../utils/cn';

interface Teacher {
    id: string;
    name: string;
    photo?: string;
    role: string;
    subjects: string[];
}

const StudentRatingPage: React.FC = () => {
    const { settings } = useSystem();
    const currentSessionId = settings?.currentSessionId;
    const currentTermId = settings?.currentTermId;
    const { user, selectedChildId } = useAuthStore();
    const isParent = (user?.role || user?.roleObject?.name || '').toLowerCase() === 'parent';
    const [teachers, setTeachers] = useState<Teacher[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [selectedTeacher, setSelectedTeacher] = useState<Teacher | null>(null);
    const [successMessage, setSuccessMessage] = useState(false);
    const toast = useToast();

    useEffect(() => {
        if (user) {
            fetchMyTeachers();
        }
    }, [user, selectedChildId, currentSessionId]);

    const fetchMyTeachers = async () => {
        try {
            const targetId = isParent ? selectedChildId : undefined;
            if (isParent && !targetId) {
                setTeachers([]);
                setLoading(false);
                return;
            }

            setLoading(true);
            const data = await api.getMyTeachers({ 
                studentId: targetId,
                sessionId: currentSessionId 
            });
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
                teacherId: selectedTeacher?.id,
                studentId: isParent ? selectedChildId : undefined
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
        <div className="p-6 md:p-8 max-w-7xl mx-auto fade-in">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Rate Teachers</h1>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                        Provide feedback securely for your assigned teachers.
                    </p>
                </div>
                
                <div className="relative w-full md:w-72">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                    <input
                        type="text"
                        placeholder="Search teachers or subjects..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full pl-9 pr-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-colors"
                    />
                </div>
            </div>

            {successMessage && (
                <div className="mb-6 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl flex items-center justify-between">
                    <div className="flex items-center gap-3 text-green-700 dark:text-green-400">
                        <CheckCircle2 size={20} />
                        <span className="text-sm font-medium">Your feedback has been successfully submitted!</span>
                    </div>
                    <button onClick={() => setSuccessMessage(false)} className="text-green-700 dark:text-green-400 hover:opacity-75">
                        <span className="text-xl leading-none">&times;</span>
                    </button>
                </div>
            )}

            {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                    {[1, 2, 3].map(i => (
                        <div key={i} className="h-48 bg-gray-100 dark:bg-gray-800/50 rounded-xl animate-pulse border border-gray-200 dark:border-gray-700" />
                    ))}
                </div>
            ) : filteredTeachers.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                    {filteredTeachers.map((teacher) => (
                        <div 
                            key={teacher.id} 
                            className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5 flex flex-col hover:shadow-md transition-shadow"
                        >
                            <div className="flex items-center gap-4 mb-4">
                                <div className="w-12 h-12 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center text-gray-400 overflow-hidden shrink-0">
                                    {teacher.photo ? (
                                        <img src={getFileUrl(teacher.photo)} alt={teacher.name} className="w-full h-full object-cover" />
                                    ) : (
                                        <Users size={20} />
                                    )}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h3 className="text-base font-semibold text-gray-900 dark:text-white truncate capitalize">
                                        {teacher.name}
                                    </h3>
                                    <span className="inline-block mt-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
                                        {teacher.role}
                                    </span>
                                </div>
                            </div>

                            <div className="flex-1 mb-5">
                                <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2 uppercase tracking-wider">Subjects</p>
                                <div className="flex flex-wrap gap-2">
                                    {teacher.subjects.length > 0 ? teacher.subjects.map((sub, idx) => (
                                        <span key={idx} className="inline-flex items-center text-xs font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700/50 px-2 py-1 rounded">
                                            {sub}
                                        </span>
                                    )) : (
                                        <span className="text-xs text-gray-500 italic">No specific subjects</span>
                                    )}
                                </div>
                            </div>

                            <button
                                onClick={() => handleRate(teacher)}
                                className="w-full flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-primary-600 bg-primary-50 hover:bg-primary-100 dark:text-primary-400 dark:bg-primary-900/30 dark:hover:bg-primary-900/50 rounded-lg transition-colors border border-transparent dark:border-primary-800/30"
                            >
                                <Star size={16} />
                                Rate Teacher
                            </button>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="py-16 flex flex-col items-center justify-center bg-white dark:bg-gray-800 rounded-xl border border-dashed border-gray-200 dark:border-gray-700">
                    <div className="w-16 h-16 bg-gray-50 dark:bg-gray-900/50 rounded-full flex items-center justify-center mb-4 text-gray-400">
                        <Users size={32} />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">No Active Assignments</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400 max-w-sm text-center">
                        We couldn't find any teachers linked to your current class and subjects.
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
