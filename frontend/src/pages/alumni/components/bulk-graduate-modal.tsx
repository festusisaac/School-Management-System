import { useState, useEffect, useMemo } from 'react';
import { Modal } from '../../../components/ui/modal';
import api from '../../../services/api';
import { useToast } from '../../../context/ToastContext';
import { Search, GraduationCap, Users, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import { clsx } from 'clsx';

interface BulkGraduateModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

export function BulkGraduateModal({ isOpen, onClose, onSuccess }: BulkGraduateModalProps) {
    const [students, setStudents] = useState<any[]>([]);
    const [classes, setClasses] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedClassId, setSelectedClassId] = useState('');
    const [graduationYear, setGraduationYear] = useState(new Date().getFullYear());
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
    const [result, setResult] = useState<{ graduated: number; skipped: number } | null>(null);
    const toast = useToast();

    useEffect(() => {
        if (isOpen) {
            fetchClasses();
            setResult(null);
            setSelectedIds(new Set());
            setSelectedClassId('');
            setSearchQuery('');
        }
    }, [isOpen]);

    useEffect(() => {
        if (selectedClassId) {
            fetchStudents();
        } else {
            setStudents([]);
            setSelectedIds(new Set());
        }
    }, [selectedClassId]);

    const fetchClasses = async () => {
        try {
            const data = await api.getClasses();
            setClasses(data);
        } catch (error) {
            console.error("Failed to fetch classes", error);
        }
    };

    const fetchStudents = async () => {
        setLoading(true);
        try {
            const data = await api.getStudents({ classId: selectedClassId });
            setStudents(data);
        } catch (error) {
            console.error("Failed to fetch students", error);
            toast.showError("Failed to load students");
        } finally {
            setLoading(false);
        }
    };

    const filteredStudents = useMemo(() => {
        if (!searchQuery) return students;
        const q = searchQuery.toLowerCase();
        return students.filter(s =>
            (s.firstName + ' ' + (s.lastName || '')).toLowerCase().includes(q) ||
            s.admissionNo?.toLowerCase().includes(q)
        );
    }, [students, searchQuery]);

    const toggleStudent = (id: string) => {
        setSelectedIds(prev => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });
    };

    const toggleAll = () => {
        if (selectedIds.size === filteredStudents.length) {
            setSelectedIds(new Set());
        } else {
            setSelectedIds(new Set(filteredStudents.map(s => s.id)));
        }
    };

    const handleSubmit = async () => {
        if (selectedIds.size === 0) {
            toast.showWarning("Please select at least one student");
            return;
        }

        setSubmitting(true);
        try {
            const res = await api.bulkGraduateStudents({
                studentIds: Array.from(selectedIds),
                graduationYear,
            });
            setResult(res);
            toast.showSuccess(`${res.graduated} student(s) graduated successfully${res.skipped > 0 ? `, ${res.skipped} skipped (already alumni)` : ''}`);
            onSuccess();
        } catch (error: any) {
            toast.showError("Bulk graduation failed: " + (error.response?.data?.message || error.message));
        } finally {
            setSubmitting(false);
        }
    };

    const allSelected = filteredStudents.length > 0 && selectedIds.size === filteredStudents.length;

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Bulk Graduate Students" size="lg">
            <div className="space-y-6">
                {/* Result Summary */}
                {result && (
                    <div className="p-4 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800/50 rounded-xl flex items-start gap-3">
                        <CheckCircle2 className="w-5 h-5 text-emerald-600 mt-0.5 shrink-0" />
                        <div>
                            <p className="text-sm font-bold text-emerald-900 dark:text-emerald-100">Graduation Complete</p>
                            <p className="text-xs text-emerald-700 dark:text-emerald-300 mt-1">
                                {result.graduated} student(s) graduated successfully.
                                {result.skipped > 0 && ` ${result.skipped} student(s) were skipped (already alumni).`}
                            </p>
                        </div>
                    </div>
                )}

                {/* Controls Row */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <label className="text-sm font-bold text-gray-700 dark:text-gray-300 uppercase tracking-tight">Filter by Class</label>
                        <select
                            value={selectedClassId}
                            onChange={(e) => setSelectedClassId(e.target.value)}
                            className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 focus:ring-2 focus:ring-primary-500 outline-none"
                        >
                            <option value="">Select a class...</option>
                            {classes.map((cls: any) => (
                                <option key={cls.id} value={cls.id}>{cls.name}</option>
                            ))}
                        </select>
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-bold text-gray-700 dark:text-gray-300 uppercase tracking-tight">Graduation Year</label>
                        <input
                            type="number"
                            value={graduationYear}
                            onChange={(e) => setGraduationYear(parseInt(e.target.value))}
                            className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 focus:ring-2 focus:ring-primary-500 outline-none"
                            required
                        />
                    </div>
                </div>

                {/* Search */}
                {selectedClassId && (
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search students in this class..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 focus:ring-2 focus:ring-primary-500 outline-none"
                        />
                    </div>
                )}

                {/* Student List */}
                {loading ? (
                    <div className="flex items-center justify-center py-12 gap-3 text-gray-400">
                        <Loader2 className="w-5 h-5 animate-spin" />
                        <span className="text-sm font-medium">Loading students...</span>
                    </div>
                ) : selectedClassId && filteredStudents.length > 0 ? (
                    <div className="border border-gray-100 dark:border-gray-700 rounded-xl overflow-hidden">
                        {/* Select All Header */}
                        <div className="px-4 py-3 bg-gray-50 dark:bg-gray-800 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between">
                            <label className="flex items-center gap-3 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={allSelected}
                                    onChange={toggleAll}
                                    className="w-4 h-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                                />
                                <span className="text-sm font-bold text-gray-700 dark:text-gray-300">
                                    Select All ({filteredStudents.length})
                                </span>
                            </label>
                            <div className="flex items-center gap-2 text-xs font-bold text-primary-600">
                                <Users className="w-4 h-4" />
                                {selectedIds.size} selected
                            </div>
                        </div>

                        {/* Student Rows */}
                        <div className="max-h-[300px] overflow-y-auto divide-y divide-gray-50 dark:divide-gray-800">
                            {filteredStudents.map((student) => (
                                <label
                                    key={student.id}
                                    className={clsx(
                                        "flex items-center gap-4 px-4 py-3 cursor-pointer transition-all hover:bg-gray-50 dark:hover:bg-gray-800",
                                        selectedIds.has(student.id) && "bg-primary-50/50 dark:bg-primary-900/10"
                                    )}
                                >
                                    <input
                                        type="checkbox"
                                        checked={selectedIds.has(student.id)}
                                        onChange={() => toggleStudent(student.id)}
                                        className="w-4 h-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                                    />
                                    <div className="w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center text-xs font-bold text-gray-500 dark:text-gray-400">
                                        {student.firstName?.[0]}{student.lastName?.[0]}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-bold text-gray-900 dark:text-white truncate">
                                            {student.firstName} {student.lastName}
                                        </p>
                                        <p className="text-xs text-gray-500 truncate">
                                            {student.admissionNo} {student.section?.name ? `• ${student.section.name}` : ''}
                                        </p>
                                    </div>
                                </label>
                            ))}
                        </div>
                    </div>
                ) : selectedClassId ? (
                    <div className="text-center py-12 text-gray-400">
                        <AlertCircle className="w-8 h-8 mx-auto mb-3 opacity-50" />
                        <p className="text-sm font-medium">No students found in this class</p>
                    </div>
                ) : (
                    <div className="text-center py-12 text-gray-400">
                        <GraduationCap className="w-8 h-8 mx-auto mb-3 opacity-50" />
                        <p className="text-sm font-medium">Select a class to view students</p>
                    </div>
                )}

                {/* Actions */}
                <div className="pt-4 border-t border-gray-100 dark:border-gray-700 flex items-center justify-between">
                    <p className="text-xs text-gray-400">
                        {selectedIds.size > 0 && `${selectedIds.size} student(s) will be graduated and deactivated`}
                    </p>
                    <div className="flex gap-3">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-6 py-3 rounded-xl text-sm font-bold text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 transition-all"
                        >
                            {result ? 'Close' : 'Cancel'}
                        </button>
                        {!result && (
                            <button
                                type="button"
                                onClick={handleSubmit}
                                disabled={submitting || selectedIds.size === 0}
                                className="px-8 py-3 bg-primary-600 text-white rounded-xl text-sm font-bold hover:bg-primary-700 transition-all shadow-lg shadow-primary-200 disabled:opacity-50 flex items-center gap-2"
                            >
                                {submitting ? (
                                    <>
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                        Processing...
                                    </>
                                ) : (
                                    <>
                                        <GraduationCap className="w-4 h-4" />
                                        Graduate {selectedIds.size} Student{selectedIds.size !== 1 ? 's' : ''}
                                    </>
                                )}
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </Modal>
    );
}
