import React, { useState, useEffect } from 'react';
import { X, Star, MessageSquare, Calendar, User, Save } from 'lucide-react';

interface Staff {
    id: string;
    firstName: string;
    lastName: string;
    employeeId: string;
}

interface RatingModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (data: any) => void;
    teachers: Staff[];
    initialData?: any;
}

const RatingModal: React.FC<RatingModalProps> = ({ isOpen, onClose, onSubmit, teachers, initialData }) => {
    const [formData, setFormData] = useState({
        teacherId: '',
        academicYear: new Date().getFullYear().toString() + '-' + (new Date().getFullYear() + 1).toString(),
        term: 'First Term',
        subject: '',
        teachingSkills: 5,
        classroomManagement: 5,
        studentEngagement: 5,
        punctuality: 5,
        subjectKnowledge: 5,
        communication: 5,
        comments: '',
        ratingDate: new Date().toISOString().split('T')[0]
    });

    useEffect(() => {
        if (initialData) {
            setFormData({
                ...formData,
                ...initialData,
                ratingDate: initialData.ratingDate ? new Date(initialData.ratingDate).toISOString().split('T')[0] : formData.ratingDate
            });
        }
    }, [initialData]);

    if (!isOpen) return null;

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: ['teachingSkills', 'classroomManagement', 'studentEngagement', 'punctuality', 'subjectKnowledge', 'communication'].includes(name)
                ? Number(value)
                : value
        }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSubmit(formData);
    };

    const renderStarRating = (name: string, label: string) => (
        <div className="flex flex-col gap-2">
            <label className="text-sm font-bold text-gray-700 dark:text-gray-300">{label}</label>
            <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map((star) => (
                    <button
                        key={star}
                        type="button"
                        onClick={() => setFormData(prev => ({ ...prev, [name]: star }))}
                        className={`p-1 rounded-md transition-colors ${(formData as any)[name] >= star ? 'text-yellow-500 hover:text-yellow-600' : 'text-gray-300 dark:text-gray-600 hover:text-gray-400 dark:hover:text-gray-500'
                            }`}
                    >
                        <Star size={24} fill={(formData as any)[name] >= star ? 'currentColor' : 'none'} />
                    </button>
                ))}
                <span className="ml-2 text-sm font-bold text-gray-500 dark:text-gray-400">{(formData as any)[name]}/5</span>
            </div>
        </div>
    );

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="fixed inset-0 bg-gray-900/60 dark:bg-black/80 backdrop-blur-sm" onClick={onClose}></div>
            <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto relative animate-in fade-in zoom-in duration-200 border dark:border-gray-700">
                <div className="p-6 border-b dark:border-gray-700 flex justify-between items-center sticky top-0 bg-white dark:bg-gray-800 z-10 transition-colors">
                    <div>
                        <h3 className="text-2xl font-black text-gray-900 dark:text-white flex items-center gap-2">
                            <Star className="text-yellow-500" fill="currentColor" />
                            {initialData ? 'Edit Teacher Rating' : 'Add Teacher Rating'}
                        </h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Evaluate teacher performance across key criteria</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors">
                        <X size={24} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-8 space-y-8">
                    {/* Basic Info */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {teachers.length > 0 && (
                            <div>
                                <label className="block text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-2 flex items-center gap-1">
                                    <User size={14} /> Teacher *
                                </label>
                                <select
                                    name="teacherId"
                                    value={formData.teacherId}
                                    onChange={handleChange}
                                    required
                                    className="w-full border border-gray-200 dark:border-gray-700 rounded-xl p-3 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium"
                                    disabled={!!initialData}
                                >
                                    <option value="" className="dark:bg-gray-800">Select Teacher</option>
                                    {teachers.map(t => (
                                        <option key={t.id} value={t.id} className="dark:bg-gray-800">{t.firstName} {t.lastName} ({t.employeeId})</option>
                                    ))}
                                </select>
                            </div>
                        )}
                        <div>
                            <label className="block text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-2 flex items-center gap-1">
                                <Calendar size={14} /> Academic Year *
                            </label>
                            <input
                                name="academicYear"
                                value={formData.academicYear}
                                onChange={handleChange}
                                required
                                placeholder="e.g. 2023-2024"
                                className="w-full border border-gray-200 dark:border-gray-700 rounded-xl p-3 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-2">Term</label>
                            <select
                                name="term"
                                value={formData.term}
                                onChange={handleChange}
                                className="w-full border border-gray-200 dark:border-gray-700 rounded-xl p-3 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium"
                            >
                                <option value="First Term" className="dark:bg-gray-800">First Term</option>
                                <option value="Second Term" className="dark:bg-gray-800">Second Term</option>
                                <option value="Third Term" className="dark:bg-gray-800">Third Term</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-2">Subject (Optional)</label>
                            <input
                                name="subject"
                                value={formData.subject}
                                onChange={handleChange}
                                placeholder="e.g. Mathematics"
                                className="w-full border border-gray-200 dark:border-gray-700 rounded-xl p-3 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-2 flex items-center gap-1">
                                <Calendar size={14} /> Rating Date *
                            </label>
                            <input
                                type="date"
                                name="ratingDate"
                                value={formData.ratingDate}
                                onChange={handleChange}
                                required
                                className="w-full border border-gray-200 dark:border-gray-700 rounded-xl p-3 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium"
                            />
                        </div>
                    </div>

                    <hr className="border-gray-100" />

                    {/* Evaluation Criteria */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-8">
                        {renderStarRating('teachingSkills', 'Teaching Skills')}
                        {renderStarRating('classroomManagement', 'Classroom Management')}
                        {renderStarRating('studentEngagement', 'Student Engagement')}
                        {renderStarRating('punctuality', 'Punctuality')}
                        {renderStarRating('subjectKnowledge', 'Subject Knowledge')}
                        {renderStarRating('communication', 'Communication')}
                    </div>

                    <hr className="border-gray-100" />

                    {/* Comments */}
                    <div>
                        <label className="block text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-2 flex items-center gap-1">
                            <MessageSquare size={14} /> Comments & Feedback
                        </label>
                        <textarea
                            name="comments"
                            value={formData.comments}
                            onChange={handleChange}
                            rows={4}
                            placeholder="Provide detailed feedback on the teacher's performance..."
                            className="w-full border border-gray-200 dark:border-gray-700 rounded-2xl p-4 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium resize-none shadow-sm"
                        ></textarea>
                    </div>

                    {/* Footer Actions */}
                    <div className="flex justify-end gap-4 pt-4">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-8 py-3 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-xl font-black hover:bg-gray-200 dark:hover:bg-gray-600 transition-all"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="px-10 py-3 bg-blue-600 text-white rounded-xl font-black shadow-lg shadow-blue-500/30 hover:bg-blue-700 transition-all flex items-center gap-2"
                        >
                            <Save size={20} />
                            {initialData ? 'Update Rating' : 'Save Rating'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default RatingModal;
