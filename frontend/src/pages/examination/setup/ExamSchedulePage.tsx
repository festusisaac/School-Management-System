import React, { useState, useEffect } from 'react';
import { Calendar, Clock, MapPin, Edit2, Trash2, AlertTriangle, User, Info } from 'lucide-react';
import { useToast } from '../../../context/ToastContext';
import { examinationService, ExamGroup, Exam, ExamSchedule } from '../../../services/examinationService';
import api from '../../../services/api';
import { DataTable } from '../../../components/ui/data-table';
import { ColumnDef } from '@tanstack/react-table';
import { Modal } from '../../../components/ui/modal';

interface SubjectRow {
    subjectId: string;
    subjectName: string;
    examId?: string;
    scheduleId?: string;
    status: 'Not Scheduled' | 'Scheduled' | 'Exam Created';
    details?: ExamSchedule;
    totalMarks?: number;
}

const ExamSchedulePage = () => {
    const [groups, setGroups] = useState<ExamGroup[]>([]);
    const [classes, setClasses] = useState<any[]>([]);
    const [assessments, setAssessments] = useState<AssessmentType[]>([]);

    const [selectedGroup, setSelectedGroup] = useState<string>('');
    const [selectedClass, setSelectedClass] = useState<string>('');
    const [loading, setLoading] = useState(false);
    const [scheduleRows, setScheduleRows] = useState<SubjectRow[]>([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isDeleteOpen, setIsDeleteOpen] = useState(false);
    const [currentSubject, setCurrentSubject] = useState<SubjectRow | null>(null);
    const [editingId, setEditingId] = useState<string | null>(null);

    const { showSuccess, showError } = useToast();

    // Modal Form State
    const [formData, setFormData] = useState({
        totalMarks: 100,
        date: '',
        startTime: '',
        endTime: '',
        venue: '',
        invigilatorName: ''
    });

    useEffect(() => {
        const init = async () => {
            try {
                const [groupsData, classesData] = await Promise.all([
                    examinationService.getExamGroups(),
                    api.getClasses()
                ]);
                setGroups(groupsData || []);
                setClasses(classesData || []);
                if (groupsData?.length > 0) setSelectedGroup(groupsData[0].id);
                if (classesData?.length > 0) setSelectedClass(classesData[0].id);
            } catch (err) {
                showError('Failed to load initial data');
            }
        };
        init();
    }, []);

    useEffect(() => {
        if (selectedGroup) {
            examinationService.getAssessmentTypes(selectedGroup)
                .then(setAssessments)
                .catch(() => setAssessments([]));
        } else {
            setAssessments([]);
        }
    }, [selectedGroup]);

    useEffect(() => {
        if (selectedGroup && selectedClass) {
            fetchScheduleData();
        }
    }, [selectedGroup, selectedClass]);

    const fetchScheduleData = async () => {
        setLoading(true);
        try {
            const classSubjects = await api.getClassSubjects(selectedClass);
            const exams = await examinationService.getExams(selectedGroup);
            const schedules = await examinationService.getSchedules(selectedGroup);

            const rows: SubjectRow[] = classSubjects.map((cs: any) => {
                const subjectId = cs.subject.id;
                const subjectName = cs.subject.name;

                const exam = exams.find((e: Exam) => e.subjectId === subjectId && e.classId === selectedClass);

                let status: SubjectRow['status'] = 'Not Scheduled';
                let details: ExamSchedule | undefined;
                let scheduleId: string | undefined;

                if (exam) {
                    status = 'Exam Created';
                    const schedule = schedules.find((s: ExamSchedule) => s.examId === exam.id);
                    if (schedule) {
                        status = 'Scheduled';
                        details = schedule;
                        scheduleId = schedule.id;
                    }
                }

                return {
                    subjectId,
                    subjectName,
                    examId: exam?.id,
                    scheduleId,
                    status,
                    details,
                    totalMarks: exam?.totalMarks || 100
                };
            });

            setScheduleRows(rows);
        } catch (error) {
            showError('Failed to fetch schedule data');
        } finally {
            setLoading(false);
        }
    };

    const handleScheduleClick = (row: SubjectRow) => {
        setCurrentSubject(row);

        // Suggest marks from Assessment Structure if not already scheduled
        let suggestedMarks = row.totalMarks || 100;
        if (row.status === 'Not Scheduled' && assessments.length > 0) {
            const examAssessment = assessments.find(a =>
                a.name.toLowerCase().includes('exam') ||
                a.name.toLowerCase().includes('final')
            );
            if (examAssessment) {
                suggestedMarks = examAssessment.maxMarks;
            }
        }

        setFormData({
            totalMarks: suggestedMarks,
            date: row.details?.date ? new Date(row.details.date).toISOString().split('T')[0] : '',
            startTime: row.details?.startTime || '',
            endTime: row.details?.endTime || '',
            venue: row.details?.venue || '',
            invigilatorName: row.details?.invigilatorName || ''
        });
        setIsModalOpen(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!currentSubject) return;

        try {
            let examId = currentSubject.examId;

            // 1. Create/Update Exam
            if (!examId) {
                const newExam = await examinationService.createExam({
                    name: `${currentSubject.subjectName} Exam`,
                    totalMarks: formData.totalMarks,
                    subjectId: currentSubject.subjectId,
                    classId: selectedClass,
                    examGroupId: selectedGroup
                });
                examId = newExam.id;
            }

            // 2. Create or Update Schedule
            if (currentSubject.scheduleId) {
                await examinationService.updateSchedule(currentSubject.scheduleId, {
                    date: formData.date,
                    startTime: formData.startTime,
                    endTime: formData.endTime,
                    venue: formData.venue,
                    invigilatorName: formData.invigilatorName
                });
                showSuccess('Exam schedule updated');
            } else {
                await examinationService.scheduleExam({
                    examId: examId!,
                    date: formData.date,
                    startTime: formData.startTime,
                    endTime: formData.endTime,
                    venue: formData.venue,
                    invigilatorName: formData.invigilatorName
                });
                showSuccess('Exam scheduled successfully');
            }

            setIsModalOpen(false);
            fetchScheduleData();
        } catch (error) {
            showError('Failed to save schedule');
        }
    };

    const handleDeleteClick = (row: SubjectRow) => {
        setCurrentSubject(row);
        setIsDeleteOpen(true);
    };

    const confirmDelete = async () => {
        if (!currentSubject) return;
        try {
            if (currentSubject.scheduleId) {
                await examinationService.deleteSchedule(currentSubject.scheduleId);
            }
            if (currentSubject.examId) {
                await examinationService.deleteExam(currentSubject.examId);
            }
            showSuccess('Schedule and Exam deleted');
            setIsDeleteOpen(false);
            fetchScheduleData();
        } catch (error) {
            showError('Failed to delete schedule');
        }
    };

    const columns: ColumnDef<SubjectRow>[] = [
        {
            accessorKey: 'subjectName',
            header: 'Subject',
            cell: ({ row }) => (
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                        <Info className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div>
                        <div className="font-bold text-gray-900 dark:text-white">{row.original.subjectName}</div>
                        <div className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Marks: {row.original.totalMarks}</div>
                    </div>
                </div>
            ),
        },
        {
            accessorKey: 'status',
            header: 'Status',
            cell: ({ row }) => {
                const status = row.original.status;
                const config = {
                    'Scheduled': 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
                    'Exam Created': 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
                    'Not Scheduled': 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400'
                }[status];
                return (
                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${config}`}>
                        {status}
                    </span>
                );
            },
        },
        {
            id: 'schedule_details',
            header: 'Time & Venue',
            cell: ({ row }) => {
                if (row.original.status !== 'Scheduled' || !row.original.details) return <span className="text-gray-300 italic text-xs">No schedule set</span>;
                const { date, startTime, endTime, venue, invigilatorName } = row.original.details;
                return (
                    <div className="text-xs space-y-1 py-1">
                        <div className="flex items-center gap-2 text-gray-600 dark:text-gray-300">
                            <Calendar className="w-3.5 h-3.5 text-blue-500" />
                            <span className="font-semibold">{new Date(date).toLocaleDateString(undefined, { dateStyle: 'medium' })}</span>
                        </div>
                        <div className="flex items-center gap-2 text-gray-500">
                            <Clock className="w-3.5 h-3.5 text-purple-500" />
                            <span>{startTime} - {endTime}</span>
                        </div>
                        <div className="flex items-center gap-2 text-gray-500">
                            <MapPin className="w-3.5 h-3.5 text-red-500" />
                            <span className="truncate max-w-[150px]">{venue || 'No venue'}</span>
                        </div>
                    </div>
                );
            }
        },
        {
            id: 'actions',
            header: () => <div className="text-right">Manage</div>,
            cell: ({ row }) => (
                <div className="flex items-center justify-end gap-2">
                    <button
                        onClick={() => handleScheduleClick(row.original)}
                        className="p-1.5 text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
                        title={row.original.status === 'Scheduled' ? 'Edit Schedule' : 'Schedule Exam'}
                    >
                        <Edit2 className="w-4 h-4" />
                    </button>
                    {row.original.status !== 'Not Scheduled' && (
                        <button
                            onClick={() => handleDeleteClick(row.original)}
                            className="p-1.5 text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors"
                            title="Delete Schedule"
                        >
                            <Trash2 className="w-4 h-4" />
                        </button>
                    )}
                </div>
            )
        }
    ];

    return (
        <div className="p-6 space-y-6 bg-gray-50 dark:bg-gray-900 min-h-screen">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Exam Schedules</h1>
                    <p className="text-gray-500 dark:text-gray-400">Manage time table for examinations</p>
                </div>
                <div className="flex flex-wrap gap-4 w-full md:w-auto">
                    <select
                        className="flex-1 md:flex-none rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-4 py-2 text-sm focus:ring-2 focus:ring-blue-500 shadow-sm"
                        value={selectedGroup}
                        onChange={(e) => setSelectedGroup(e.target.value)}
                    >
                        <option value="">Select Exam Group</option>
                        {groups.map(g => (
                            <option key={g.id} value={g.id}>{g.name}</option>
                        ))}
                    </select>

                    <select
                        className="flex-1 md:flex-none rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-4 py-2 text-sm focus:ring-2 focus:ring-blue-500 shadow-sm"
                        value={selectedClass}
                        onChange={(e) => setSelectedClass(e.target.value)}
                    >
                        <option value="">Select Class</option>
                        {classes.map(c => (
                            <option key={c.id} value={c.id}>{c.name}</option>
                        ))}
                    </select>
                </div>
            </div>

            {/* Main Content */}
            {loading ? (
                <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm p-12 text-center text-gray-500 dark:text-gray-400">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="mt-4">Loading schedule...</p>
                </div>
            ) : !selectedClass ? (
                <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm p-12 text-center text-gray-500 dark:text-gray-400">
                    <Calendar className="w-12 h-12 mx-auto text-gray-300 mb-4" />
                    <p>Select an exam group and class to view or manage the schedule.</p>
                </div>
            ) : (
                <DataTable
                    columns={columns}
                    data={scheduleRows}
                    searchKey="subjectName"
                />
            )}

            {/* Schedule Modal */}
            <Modal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title={`Schedule: ${currentSubject?.subjectName}`}
            >
                <form onSubmit={handleSubmit} className="space-y-5">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="md:col-span-2">
                            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5 flex items-center gap-2">
                                Max Marks
                                <span className="text-[10px] bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded border border-blue-100 uppercase tracking-tighter">Locked to Assessment Structure</span>
                            </label>
                            <input
                                type="number"
                                required
                                readOnly
                                className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 px-4 py-2.5 text-sm text-gray-500 cursor-not-allowed outline-none font-medium"
                                value={formData.totalMarks}
                                tabIndex={-1}
                            />
                            {assessments.find(a => a.name.toLowerCase().includes('exam') || a.name.toLowerCase().includes('final')) && (
                                <p className="mt-1.5 text-[10px] text-gray-400 flex items-center gap-1 italic">
                                    <Info className="w-2.5 h-2.5" />
                                    Pulled from "{assessments.find(a => a.name.toLowerCase().includes('exam') || a.name.toLowerCase().includes('final'))?.name}" in Assessment Structure.
                                </p>
                            )}
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">Exam Date</label>
                            <input
                                type="date"
                                required
                                className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                                value={formData.date}
                                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">Venue / Hall</label>
                            <input
                                type="text"
                                placeholder="e.g., Examination Hall A"
                                className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                                value={formData.venue}
                                onChange={(e) => setFormData({ ...formData, venue: e.target.value })}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">Start Time</label>
                            <div className="relative">
                                <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                <input
                                    type="time"
                                    required
                                    className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 pl-10 pr-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                                    value={formData.startTime}
                                    onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                                />
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">End Time</label>
                            <div className="relative">
                                <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                <input
                                    type="time"
                                    required
                                    className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 pl-10 pr-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                                    value={formData.endTime}
                                    onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                                />
                            </div>
                        </div>
                        <div className="md:col-span-2">
                            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">Invigilator / Supervisor</label>
                            <div className="relative">
                                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                <input
                                    type="text"
                                    placeholder="Enter invigilator's name"
                                    className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 pl-10 pr-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                                    value={formData.invigilatorName}
                                    onChange={(e) => setFormData({ ...formData, invigilatorName: e.target.value })}
                                />
                            </div>
                        </div>
                    </div>

                    <div className="flex justify-end gap-3 pt-4 border-t border-gray-100 dark:border-gray-800">
                        <button
                            type="button"
                            onClick={() => setIsModalOpen(false)}
                            className="px-5 py-2.5 text-sm font-bold text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-800 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-all"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="px-5 py-2.5 text-sm font-bold text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-all shadow-lg shadow-blue-600/20"
                        >
                            {currentSubject?.scheduleId ? "Update Schedule" : "Save Schedule"}
                        </button>
                    </div>
                </form>
            </Modal>

            {/* Delete Confirmation Modal */}
            <Modal
                isOpen={isDeleteOpen}
                onClose={() => setIsDeleteOpen(false)}
                title="Delete Schedule"
            >
                <div className="space-y-4">
                    <div className="flex items-center gap-3 p-4 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-lg">
                        <AlertTriangle className="w-6 h-6 shrink-0" />
                        <p className="text-sm font-bold">This will remove the schedule and the exam record.</p>
                    </div>
                    <p className="text-gray-600 dark:text-gray-400 px-1 text-sm">
                        Are you sure you want to delete the schedule for <span className="font-extrabold text-gray-900 dark:text-white">{currentSubject?.subjectName}</span>? Student scores for this exam will be lost if already recorded.
                    </p>
                    <div className="flex justify-end gap-3 pt-2">
                        <button
                            onClick={() => setIsDeleteOpen(false)}
                            className="px-5 py-2.5 text-sm font-bold text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-800 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-all"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={confirmDelete}
                            className="px-5 py-2.5 text-sm font-bold text-white bg-red-600 rounded-lg hover:bg-red-700 transition-all shadow-lg shadow-red-600/20"
                        >
                            Yes, Delete Everything
                        </button>
                    </div>
                </div>
            </Modal>
        </div>
    );
};

export default ExamSchedulePage;
