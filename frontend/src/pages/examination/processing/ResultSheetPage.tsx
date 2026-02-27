import React, { useState, useEffect } from 'react';
import { Printer, Search, FileText, ChevronRight, X } from 'lucide-react';
import { useToast } from '../../../context/ToastContext';
import { examinationService, ExamGroup, GradeScale } from '../../../services/examinationService';
import api from '../../../services/api';
import ReportCardTemplate, { ReportCardData } from '../../../components/examination/ReportCardTemplate';

const ResultSheetPage = () => {
    const [groups, setGroups] = useState<ExamGroup[]>([]);
    const [classes, setClasses] = useState<any[]>([]);
    const [gradeScales, setGradeScales] = useState<GradeScale[]>([]);
    const [selectedGroup, setSelectedGroup] = useState('');
    const [selectedClass, setSelectedClass] = useState('');

    const [students, setStudents] = useState<ReportCardData[]>([]);
    const [loading, setLoading] = useState(false);
    const [selectedStudent, setSelectedStudent] = useState<ReportCardData | null>(null);

    const { showSuccess, showError } = useToast();

    // Initial Load
    useEffect(() => {
        const init = async () => {
            try {
                const [g, c, s] = await Promise.all([
                    examinationService.getExamGroups(),
                    api.getClasses(),
                    examinationService.getGradeScales()
                ]);
                setGroups(g || []);
                setClasses(c || []);
                setGradeScales(s || []);
            } catch (e) {
                showError('Failed to load initial data');
            }
        };
        init();
    }, []);

    // Load Report Cards Data
    const fetchReportCards = async () => {
        if (!selectedGroup || !selectedClass) return;
        setLoading(true);
        try {
            // 1. Fetch Basic Data
            const [studentsData, groupData, broadsheetData] = await Promise.all([
                api.getStudents({ classId: selectedClass, limit: 1000 }),
                groups.find(g => g.id === selectedGroup),
                examinationService.getBroadsheet(selectedClass, selectedGroup).catch(() => [])
            ]);

            if (!groupData) throw new Error("Exam Group key found");

            // 2. Fetch Detailed Marks for breakdown (Optional: Optimization would be to have backend return this structure)
            // For now, to get CA/Exam split, we need to fetch all exams for this group + class
            const exams = await examinationService.getExams(selectedGroup);
            const classExams = exams.filter(e => e.classId === selectedClass);

            // Fetch all marks for these exams
            const marksPromises = classExams.map(e => examinationService.getMarks(e.id).then(marks => ({ exam: e, marks })));
            const allMarks = await Promise.all(marksPromises);

            // 3. Build Report Card Data Objects
            const reports: ReportCardData[] = studentsData.map((student: any) => {
                const broadsheetRecord = broadsheetData.find((b: any) => (b.studentId === student.id) || (b.student?.id === student.id));

                const subjects = classExams.map(exam => {
                    const examMarksEntry = allMarks.find(m => m.exam.id === exam.id);
                    const studentMark = examMarksEntry?.marks.find(m => m.studentId === student.id);
                    const score = studentMark?.score || 0;

                    const { grade, remark } = getGradeDetails(score);

                    return {
                        subjectName: exam.name.replace(/\s+exam$/i, ''),
                        ca1: Math.min(20, Math.floor(score * 0.2)), // Dummy data split
                        ca2: Math.min(20, Math.floor(score * 0.2)), // Dummy data split
                        examScore: Math.min(60, score - Math.min(40, Math.floor(score * 0.4))),
                        totalScore: score,
                        highestInClass: 0,
                        lowestInClass: 0,
                        classAvg: 0,
                        positionInSubject: 1,
                        grade: grade,
                        remark: remark,
                    };
                }).filter(s => s.totalScore > 0 || true);

                return {
                    student: {
                        name: `${student.firstName} ${student.lastName}`,
                        dateOfBirth: student.dateOfBirth,
                        sex: student.gender,
                        admissionNumber: student.admissionNumber,
                        class: student.class?.name || 'N/A',
                        photoUrl: student.photo,
                    },
                    examGroup: {
                        name: groupData.name,
                        term: groupData.term,
                        year: groupData.academicYear
                    },
                    academicInfo: {
                        timesOpened: 127,
                        timesPresent: 109,
                        timesAbsent: 18,
                        termBegins: '20/11/2025',
                        termEnds: '31/12/2025',
                        nextTermBegins: '01/01/2026'
                    },
                    subjects: subjects,
                    summary: {
                        totalObtainable: subjects.length * 100,
                        totalObtained: broadsheetRecord?.totalScore || subjects.reduce((a, b) => a + b.totalScore, 0),
                        averageScore: broadsheetRecord?.averageScore || 0,
                        position: broadsheetRecord ? (broadsheetData.indexOf(broadsheetRecord) + 1) : undefined,
                        classSize: studentsData.length
                    }
                };
            });

            // Sort by position/total
            reports.sort((a, b) => b.summary.totalScore - a.summary.totalScore);

            setStudents(reports);

        } catch (error) {
            console.error(error);
            showError('Failed to generate report cards');
        } finally {
            setLoading(false);
        }
    };

    const getGradeDetails = (score: number) => {
        // Updated to match the specific grading system in the reference image:
        // 70-100 (EXCELLENT)
        // 60-69 (VERY GOOD)
        // 50-59 (GOOD)
        // 45-49 (FAIR)
        // 40-44 (POOR)
        // 0-39 (VERY POOR)
        if (score >= 70) return { grade: 'A', remark: 'EXCELLENT' };
        if (score >= 60) return { grade: 'B', remark: 'VERY GOOD' };
        if (score >= 50) return { grade: 'C', remark: 'GOOD' };
        if (score >= 45) return { grade: 'D', remark: 'FAIR' };
        if (score >= 40) return { grade: 'E', remark: 'POOR' };
        return { grade: 'F', remark: 'VERY POOR' };
    };

    const handlePrint = () => {
        window.print();
    };

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
            {/* Screen Content */}
            <div className="p-6 space-y-6 print:hidden">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Report Cards</h1>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Generate and print student result slips.</p>
                    </div>
                    <div className="flex gap-2">
                        {students.length > 0 && (
                            <button
                                onClick={handlePrint}
                                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-shadow shadow-sm"
                            >
                                <Printer className="w-4 h-4" />
                                Print All
                            </button>
                        )}
                    </div>
                </div>

                {/* Filters */}
                <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm grid grid-cols-1 md:grid-cols-3 gap-6 items-end">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Exam Group</label>
                        <select
                            className="w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                            value={selectedGroup}
                            onChange={(e) => setSelectedGroup(e.target.value)}
                        >
                            <option value="">Select Exam Group</option>
                            {groups.map(g => (
                                <option key={g.id} value={g.id}>{g.name}</option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Class</label>
                        <select
                            className="w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                            value={selectedClass}
                            onChange={(e) => setSelectedClass(e.target.value)}
                        >
                            <option value="">Select Class</option>
                            {classes.map(c => (
                                <option key={c.id} value={c.id}>{c.name}</option>
                            ))}
                        </select>
                    </div>

                    <button
                        onClick={fetchReportCards}
                        disabled={!selectedGroup || !selectedClass || loading}
                        className="px-4 py-2 bg-gray-900 dark:bg-gray-700 text-white rounded-lg hover:bg-gray-800 transition-colors disabled:opacity-50 h-[38px] flex items-center justify-center gap-2"
                    >
                        {loading ? <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div> : <Search className="w-4 h-4" />}
                        Generate
                    </button>
                </div>

                {/* List View */}
                {!loading && students.length > 0 && (
                    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
                        <table className="w-full text-sm text-left">
                            <thead className="bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                <tr>
                                    <th className="px-6 py-3 w-12 text-center">#</th>
                                    <th className="px-6 py-3">Student</th>
                                    <th className="px-6 py-3 text-center">Subjects</th>
                                    <th className="px-6 py-3 text-center">Total</th>
                                    <th className="px-6 py-3 text-center">Avg</th>
                                    <th className="px-6 py-3 text-right">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                                {students.map((student, idx) => (
                                    <tr key={idx} className="hover:bg-gray-50 dark:hover:bg-gray-900/50 transition-colors cursor-pointer" onClick={() => setSelectedStudent(student)}>
                                        <td className="px-6 py-4 text-center text-gray-500">{idx + 1}</td>
                                        <td className="px-6 py-4 font-medium text-gray-900 dark:text-white">
                                            {student.student.name}
                                            <span className="block text-xs text-gray-400 font-normal">{student.student.admissionNumber}</span>
                                        </td>
                                        <td className="px-6 py-4 text-center">{student.subjects.length}</td>
                                        <td className="px-6 py-4 text-center font-bold text-blue-600">{student.summary.totalScore}</td>
                                        <td className="px-6 py-4 text-center">{student.summary.averageScore.toFixed(2)}</td>
                                        <td className="px-6 py-4 text-right">
                                            <button className="text-blue-600 hover:text-blue-800 text-xs font-semibold uppercase tracking-wide flex items-center gap-1 justify-end">
                                                View <ChevronRight className="w-3 h-3" />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                {/* Empty State */}
                {!loading && students.length === 0 && selectedGroup && selectedClass && (
                    <div className="text-center py-12 text-gray-400 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 border-dashed">
                        <FileText className="w-12 h-12 mx-auto mb-3 opacity-20" />
                        <p>No report cards generated yet. Click "Generate" to fetch data.</p>
                    </div>
                )}
            </div>

            {/* Print Content (Visible only when printing) */}
            <div className="hidden print:block">
                {students.map((student, idx) => (
                    <div key={idx} style={{ pageBreakAfter: 'always' }}>
                        <ReportCardTemplate data={student} />
                    </div>
                ))}
            </div>

            {/* Modal for Single View */}
            {selectedStudent && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm print:hidden">
                    <div className="bg-white dark:bg-gray-900 w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-xl shadow-2xl animate-in fade-in zoom-in duration-200">
                        <div className="sticky top-0 z-10 flex justify-between items-center p-4 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800">
                            <h2 className="font-bold text-lg">Report Card Preview</h2>
                            <button onClick={() => setSelectedStudent(null)} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <div className="p-4 bg-gray-100 dark:bg-black/50 flex justify-center">
                            <ReportCardTemplate data={selectedStudent} />
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ResultSheetPage;
