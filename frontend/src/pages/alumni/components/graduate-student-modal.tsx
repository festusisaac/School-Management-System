import { useState, useEffect } from 'react';
import { Modal } from '../../../components/ui/modal';
import api from '../../../services/api';
import { useToast } from '../../../context/ToastContext';
import { Search, GraduationCap, Building2, Briefcase, BadgeCheck } from 'lucide-react';
import { clsx } from 'clsx';

interface GraduateStudentModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

export function GraduateStudentModal({ isOpen, onClose, onSuccess }: GraduateStudentModalProps) {
    const [students, setStudents] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedStudent, setSelectedStudent] = useState<any>(null);
    const [formData, setFormData] = useState({
        graduationYear: new Date().getFullYear(),
        currentOccupation: '',
        currentCompany: '',
        isMentorshipAvailable: false,
        adminNotes: '',
    });
    const toast = useToast();

    useEffect(() => {
        if (isOpen) {
            fetchStudents();
        }
    }, [isOpen]);

    const fetchStudents = async () => {
        setLoading(true);
        try {
            // Fetch all active students
            const data = await api.getStudents({});
            setStudents(data);
        } catch (error) {
            console.error("Failed to fetch students", error);
            toast.showError("Failed to load student list");
        } finally {
            setLoading(false);
        }
    };

    const filteredStudents = students.filter(s => 
        (s.firstName + ' ' + (s.lastName || '')).toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.admissionNo.toLowerCase().includes(searchQuery.toLowerCase())
    ).slice(0, 5); // Show only top 5 matches

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedStudent) {
            toast.showWarning("Please select a student first");
            return;
        }

        setSubmitting(true);
        try {
            await api.graduateStudent({
                studentId: selectedStudent.id,
                ...formData
            });
            toast.showSuccess(`${selectedStudent.firstName} has been graduated and added to alumni`);
            onSuccess();
        } catch (error: any) {
            toast.showError("Failed to graduate student: " + (error.response?.data?.message || error.message));
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Graduate Student" size="md">
            <form onSubmit={handleSubmit} className="space-y-6">
                {/* Student Selection */}
                <div className="space-y-2">
                    <label className="text-sm font-bold text-gray-700 dark:text-gray-300 uppercase tracking-tight">Select Student</label>
                    {!selectedStudent ? (
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Search by name or admission no..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 focus:ring-2 focus:ring-primary-500 outline-none"
                            />
                            {searchQuery && filteredStudents.length > 0 && (
                                <div className="absolute z-10 w-full mt-2 bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-xl shadow-xl overflow-hidden animate-in fade-in slide-in-from-top-2">
                                    {filteredStudents.map(student => (
                                        <button
                                            key={student.id}
                                            type="button"
                                            onClick={() => {
                                                setSelectedStudent(student);
                                                setSearchQuery('');
                                            }}
                                            className="w-full px-4 py-3 text-left hover:bg-primary-50 dark:hover:bg-primary-900/20 flex items-center justify-between border-b last:border-0 border-gray-50 dark:border-gray-700"
                                        >
                                            <div>
                                                <p className="font-bold text-gray-900 dark:text-white">{student.firstName} {student.lastName}</p>
                                                <p className="text-xs text-gray-500">{student.admissionNo} • {student.class?.name || 'No Class'}</p>
                                            </div>
                                            <GraduationCap className="w-4 h-4 text-gray-300" />
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="p-4 bg-primary-50 dark:bg-primary-900/20 border border-primary-100 dark:border-primary-800/50 rounded-xl flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-primary-600 text-white flex items-center justify-center font-bold">
                                    {selectedStudent.firstName[0]}
                                </div>
                                <div>
                                    <p className="font-bold text-gray-900 dark:text-white">{selectedStudent.firstName} {selectedStudent.lastName}</p>
                                    <p className="text-xs text-gray-500">{selectedStudent.admissionNo}</p>
                                </div>
                            </div>
                            <button 
                                type="button"
                                onClick={() => setSelectedStudent(null)}
                                className="text-xs font-bold text-primary-600 hover:underline"
                            >
                                Change
                            </button>
                        </div>
                    )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Graduation Year */}
                    <div className="space-y-2">
                        <label className="text-sm font-bold text-gray-700 dark:text-gray-300 uppercase tracking-tight">Graduation Year</label>
                        <input
                            type="number"
                            value={formData.graduationYear}
                            onChange={(e) => setFormData({ ...formData, graduationYear: parseInt(e.target.value) })}
                            className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 focus:ring-2 focus:ring-primary-500 outline-none"
                            required
                        />
                    </div>

                    {/* Occupation */}
                    <div className="space-y-2">
                        <label className="text-sm font-bold text-gray-700 dark:text-gray-300 uppercase tracking-tight">Occupation</label>
                        <div className="relative">
                            <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Software Engineer..."
                                value={formData.currentOccupation}
                                onChange={(e) => setFormData({ ...formData, currentOccupation: e.target.value })}
                                className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 focus:ring-2 focus:ring-primary-500 outline-none"
                            />
                        </div>
                    </div>
                </div>

                {/* Company */}
                <div className="space-y-2">
                    <label className="text-sm font-bold text-gray-700 dark:text-gray-300 uppercase tracking-tight">Current Company / Organization</label>
                    <div className="relative">
                        <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Google, Microsoft, etc..."
                            value={formData.currentCompany}
                            onChange={(e) => setFormData({ ...formData, currentCompany: e.target.value })}
                            className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 focus:ring-2 focus:ring-primary-500 outline-none"
                        />
                    </div>
                </div>

                {/* Admin Notes */}
                <div className="space-y-2">
                    <label className="text-sm font-bold text-gray-700 dark:text-gray-300 uppercase tracking-tight">Administrative Notes (Internal)</label>
                    <textarea
                        rows={3}
                        placeholder="Add internal notes about this alumnus..."
                        value={formData.adminNotes}
                        onChange={(e) => setFormData({ ...formData, adminNotes: e.target.value })}
                        className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 focus:ring-2 focus:ring-primary-500 outline-none"
                    />
                </div>

                {/* Mentorship Toggle */}
                <div className="flex items-center justify-between p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800/50 rounded-xl">
                    <div className="flex items-center gap-3">
                        <BadgeCheck className="w-5 h-5 text-blue-600" />
                        <div>
                            <p className="text-sm font-bold text-gray-900 dark:text-white">Available for Mentorship</p>
                            <p className="text-xs text-gray-500">Willing to help current students</p>
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={() => setFormData({ ...formData, isMentorshipAvailable: !formData.isMentorshipAvailable })}
                        className={clsx(
                            "relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none",
                            formData.isMentorshipAvailable ? "bg-blue-600" : "bg-gray-200 dark:bg-gray-700"
                        )}
                    >
                        <span
                            className={clsx(
                                "inline-block h-4 w-4 transform rounded-full bg-white transition-transform",
                                formData.isMentorshipAvailable ? "translate-x-6" : "translate-x-1"
                            )}
                        />
                    </button>
                </div>

                <div className="pt-6 border-t border-gray-100 dark:border-gray-700 flex justify-end gap-3">
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-6 py-3 rounded-xl text-sm font-bold text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 transition-all"
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        disabled={submitting || !selectedStudent}
                        className="px-8 py-3 bg-primary-600 text-white rounded-xl text-sm font-bold hover:bg-primary-700 transition-all shadow-lg shadow-primary-200 disabled:opacity-50"
                    >
                        {submitting ? 'Processing...' : 'Graduate Student'}
                    </button>
                </div>
            </form>
        </Modal>
    );
}
