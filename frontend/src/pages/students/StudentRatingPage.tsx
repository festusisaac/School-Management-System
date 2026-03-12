import React, { useState, useEffect } from 'react';
import {
    Star,
    Search,
    Plus,
    User,
    Award,
    CheckCircle2
} from 'lucide-react';
import api from '../../services/api';
import RatingModal from '../../components/hr/RatingModal';
import { useToast } from '../../context/ToastContext';

interface Staff {
    id: string;
    firstName: string;
    lastName: string;
    employeeId: string;
    designation?: { title: string };
    photo?: string;
}

const StudentRatingPage: React.FC = () => {
    const [teachers, setTeachers] = useState<Staff[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [selectedTeacher, setSelectedTeacher] = useState<Staff | null>(null);
    const [successMessage, setSuccessMessage] = useState(false);
    const toast = useToast();

    useEffect(() => {
        fetchTeachers();
    }, []);

    const fetchTeachers = async () => {
        try {
            setLoading(true);
            const staffData = await api.getStaff();
            // Filter to only show teachers
            setTeachers(staffData.filter((s: any) => s.role === 'teacher' || s.designation?.title?.toLowerCase().includes('teacher')));
        } catch (error) {
            console.error('Error fetching teachers:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleRate = (teacher: Staff) => {
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
            setTimeout(() => setSuccessMessage(false), 5000);
        } catch (error: any) {
            toast.showError(error.response?.data?.message || 'Error submitting rating');
        }
    };

    const filteredTeachers = teachers.filter(t =>
        `${t.firstName} ${t.lastName}`.toLowerCase().includes(search.toLowerCase()) ||
        t.employeeId.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div className="p-6 bg-gray-50 min-h-screen">
            {/* Header */}
            <div className="mb-8">
                <h1 className="text-3xl font-extrabold text-gray-900 flex items-center gap-3">
                    <Star className="p-2 bg-yellow-500 text-white rounded-lg shadow-lg shadow-yellow-500/30" size={40} fill="currentColor" />
                    Rate Your Teachers
                </h1>
                <p className="text-gray-500 mt-1">Help us improve by providing honest feedback about your teachers' performance.</p>
            </div>

            {successMessage && (
                <div className="mb-6 p-4 bg-green-100 border border-green-200 text-green-700 rounded-xl flex items-center gap-2 animate-in fade-in slide-in-from-top-2">
                    <CheckCircle2 size={24} />
                    <span className="font-bold">Thank you! Your rating has been submitted successfully.</span>
                </div>
            )}

            {/* Search */}
            <div className="mb-8 max-w-md">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input
                        type="text"
                        placeholder="Search for a teacher..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full pl-10 pr-4 py-3 bg-white border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all shadow-sm font-medium"
                    />
                </div>
            </div>

            {/* Teachers Grid */}
            {loading ? (
                <div className="flex justify-center items-center h-64">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {filteredTeachers.map((teacher) => (
                        <div key={teacher.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all p-6 flex flex-col items-center">
                            <div className="w-24 h-24 rounded-full bg-blue-100 flex items-center justify-center text-primary-600 mb-4 overflow-hidden border-2 border-white shadow-inner">
                                {teacher.photo ? (
                                    <img src={teacher.photo.startsWith('http') ? teacher.photo : `http://localhost:3000${teacher.photo}`} alt="" className="w-full h-full object-cover" />
                                ) : (
                                    <span className="text-2xl font-bold">{teacher.firstName[0]}{teacher.lastName[0]}</span>
                                )}
                            </div>
                            <h3 className="text-lg font-black text-gray-900 text-center mb-1">{teacher.firstName} {teacher.lastName}</h3>
                            <p className="text-sm text-gray-500 font-medium mb-4">{teacher.designation?.title || 'Teacher'}</p>

                            <button
                                onClick={() => handleRate(teacher)}
                                className="w-full flex items-center justify-center gap-2 bg-primary-600 hover:bg-primary-700 text-white py-2.5 rounded-xl font-bold transition-all"
                            >
                                <Award size={18} />
                                Rate Teacher
                            </button>
                        </div>
                    ))}
                    {filteredTeachers.length === 0 && (
                        <div className="col-span-full py-12 text-center text-gray-400 italic bg-white rounded-2xl border border-dashed border-gray-300">
                            No teachers found matching your search.
                        </div>
                    )}
                </div>
            )}

            {selectedTeacher && (
                <RatingModal
                    isOpen={showModal}
                    onClose={() => setShowModal(false)}
                    onSubmit={handleSubmitRating}
                    teachers={[]} // Not needed as we pre-select
                    initialData={{ teacherId: selectedTeacher.id }}
                />
            )}
        </div>
    );
};

export default StudentRatingPage;
