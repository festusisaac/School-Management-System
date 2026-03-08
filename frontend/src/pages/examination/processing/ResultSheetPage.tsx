import React, { useState, useEffect, useMemo } from 'react';
import { Printer, Search, FileText, ChevronRight, X, Users, Trophy, TrendingUp, Filter, AlertCircle, Eye } from 'lucide-react';
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

    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');

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

    const getAbsoluteUrl = (url: string) => {
        if (!url) return '';
        if (url.startsWith('http')) return url;
        const apiBaseUrl = (import.meta as any).env.VITE_API_BASE_URL || 'http://localhost:3000/api/v1';
        const serverUrl = apiBaseUrl.split('/api')[0];
        return `${serverUrl}/${url.startsWith('/') ? url.slice(1) : url}`;
    };

    // Load Report Cards Data
    const fetchReportCards = async () => {
        if (!selectedGroup || !selectedClass) return;
        setLoading(true);
        try {
            // 1. Fetch Basic Data
            const [studentsData, groupData, broadsheetResponse, assessments] = await Promise.all([
                api.getStudents({ classId: selectedClass, limit: 1000 }),
                groups.find(g => g.id === selectedGroup),
                examinationService.getBroadsheet(selectedClass, selectedGroup).catch(() => ({ results: [], subjectScores: [] })),
                examinationService.getAssessmentTypes(selectedGroup)
            ]);

            if (!groupData) throw new Error("Exam Group not found");

            const broadsheetData = broadsheetResponse?.results || [];

            // 2. Fetch Detailed Marks for breakdown (Optimized: Single Batch Call)
            const [exams, allClassMarks] = await Promise.all([
                examinationService.getExams(selectedGroup),
                examinationService.getClassMarks(selectedClass, selectedGroup)
            ]);
            const classExams = exams.filter(e => e.classId === selectedClass);

            // 3. Group marks by student for performance (O(N) vs O(N^2))
            const studentMarksMap = allClassMarks.reduce((acc, mark) => {
                const id = typeof mark.studentId === 'string' ? mark.studentId : (mark.student as any)?.id;
                if (id) {
                    if (!acc[id]) acc[id] = [];
                    acc[id].push(mark);
                }
                return acc;
            }, {} as Record<string, any[]>);

            // 4. Build Report Card Data Objects
            const reports: ReportCardData[] = studentsData.map((student: any) => {
                const broadsheetRecord = broadsheetData.find((b: any) => (b.studentId === student.id) || (b.student?.id === student.id));
                const studentPersonalMarks = studentMarksMap[student.id] || [];

                const subjects = classExams.map(exam => {
                    const studentMarks = studentPersonalMarks.filter(m => m.examId === exam.id);

                    const totalScore = studentMarks.reduce((a, b) => a + b.score, 0);

                    // Map specific scores (CA1, CA2, Exam)
                    let ca1: number | undefined;
                    let ca2: number | undefined;
                    let examScore: number | undefined;

                    studentMarks.forEach(m => {
                        const ass = assessments.find(a => a.id === m.assessmentTypeId);
                        const name = ass?.name.toLowerCase() || '';
                        if (name.includes('ca1') || name.includes('first ca')) ca1 = m.score;
                        else if (name.includes('ca2') || name.includes('second ca')) ca2 = m.score;
                        else if (name.includes('exam') || name.includes('final')) examScore = m.score;
                    });

                    const { grade, remark } = getGradeDetails(totalScore);

                    return {
                        subjectName: exam.name.replace(/\s+exam$/i, ''),
                        ca1: ca1,
                        ca2: ca2,
                        examScore: examScore,
                        totalScore: totalScore,
                        highestInClass: 0,
                        lowestInClass: 0,
                        classAvg: 0,
                        positionInSubject: 1,
                        grade: grade,
                        remark: remark,
                    };
                }).filter(s => s.totalScore > 0);

                const totalObtained = broadsheetRecord?.totalScore || subjects.reduce((a, b) => a + b.totalScore, 0);
                const averageScore = broadsheetRecord?.averageScore || (subjects.length > 0 ? (totalObtained / subjects.length) : 0);

                return {
                    student: {
                        name: `${student.firstName} ${student.lastName}`,
                        dateOfBirth: student.dateOfBirth,
                        sex: student.gender,
                        admissionNumber: student.admissionNumber,
                        class: student.class?.name || 'N/A',
                        photoUrl: getAbsoluteUrl(student.photo || student.studentPhoto),
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
                        totalObtained: totalObtained,
                        averageScore: averageScore,
                        position: broadsheetRecord ? (broadsheetData.indexOf(broadsheetRecord) + 1) : undefined,
                        classSize: studentsData.length
                    }
                };
            });

            // Sort by totalObtained
            reports.sort((a, b) => b.summary.totalObtained - a.summary.totalObtained);

            setStudents(reports);

        } catch (error) {
            console.error(error);
            showError('Failed to generate report cards');
        } finally {
            setLoading(false);
        }
    };

    const filteredStudents = useMemo(() => {
        return students.filter(s => {
            const matchesSearch = s.student.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                s.student.admissionNumber?.toLowerCase().includes(searchQuery.toLowerCase());

            const isPassing = s.summary.averageScore >= 40;
            const matchesStatus = statusFilter === 'all' ||
                (statusFilter === 'passed' && isPassing) ||
                (statusFilter === 'failed' && !isPassing);

            return matchesSearch && matchesStatus;
        });
    }, [students, searchQuery, statusFilter]);

    const stats = useMemo(() => {
        if (students.length === 0) return { avg: 0, high: 0, low: 0 };
        const scores = students.map(s => s.summary.averageScore);
        return {
            avg: scores.reduce((a, b) => a + b, 0) / scores.length,
            high: Math.max(...scores),
            low: Math.min(...scores)
        };
    }, [students]);

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

    const printSingle = (student: ReportCardData) => {
        setSelectedStudent(student);
        setTimeout(() => {
            window.print();
            setSelectedStudent(null);
        }, 300);
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
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 h-[38px] flex items-center justify-center gap-2 font-bold shadow-lg shadow-blue-500/20"
                    >
                        {loading ? <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div> : <Search className="w-4 h-4" />}
                        Generate
                    </button>
                </div>

                {/* Summary Stats */}
                {!loading && students.length > 0 && (
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 animate-in fade-in slide-in-from-top-4 duration-500">
                        <div className="bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm flex items-center gap-4">
                            <div className="w-12 h-12 bg-blue-50 dark:bg-blue-900/20 rounded-xl flex items-center justify-center">
                                <Users className="w-6 h-6 text-blue-600" />
                            </div>
                            <div>
                                <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">Students</p>
                                <p className="text-xl font-black text-gray-900 dark:text-white uppercase">{students.length}</p>
                            </div>
                        </div>

                        <div className="bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm flex items-center gap-4">
                            <div className="w-12 h-12 bg-emerald-50 dark:bg-emerald-900/20 rounded-xl flex items-center justify-center">
                                <TrendingUp className="w-6 h-6 text-emerald-600" />
                            </div>
                            <div>
                                <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">Class Avg</p>
                                <p className="text-xl font-black text-gray-900 dark:text-white uppercase">{stats.avg.toFixed(1)}%</p>
                            </div>
                        </div>

                        <div className="bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm flex items-center gap-4 border-l-4 border-l-amber-500">
                            <div className="w-12 h-12 bg-amber-50 dark:bg-amber-900/20 rounded-xl flex items-center justify-center">
                                <Trophy className="w-6 h-6 text-amber-500" />
                            </div>
                            <div>
                                <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">Top Score</p>
                                <p className="text-xl font-black text-gray-900 dark:text-white uppercase">{stats.high.toFixed(1)}%</p>
                            </div>
                        </div>

                        <div className="bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm flex items-center gap-4 border-l-4 border-l-red-500">
                            <div className="w-12 h-12 bg-red-50 dark:bg-red-900/20 rounded-xl flex items-center justify-center">
                                <AlertCircle className="w-6 h-6 text-red-500" />
                            </div>
                            <div>
                                <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">Low Score</p>
                                <p className="text-xl font-black text-gray-900 dark:text-white uppercase">{stats.low.toFixed(1)}%</p>
                            </div>
                        </div>
                    </div>
                )}

                {/* Search & Filter Bar */}
                {!loading && students.length > 0 && (
                    <div className="flex flex-col md:flex-row gap-4 justify-between items-center bg-gray-50 dark:bg-gray-900/50 p-2 rounded-xl">
                        <div className="relative w-full md:w-96">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Search by name or admission number..."
                                className="w-full pl-10 pr-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
                        <div className="flex items-center gap-2 w-full md:w-auto">
                            <Filter className="w-4 h-4 text-gray-400" />
                            <select
                                className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                value={statusFilter}
                                onChange={(e) => setStatusFilter(e.target.value)}
                            >
                                <option value="all">All Status</option>
                                <option value="passed">Passed (40%+)</option>
                                <option value="failed">Failed (&lt;40%)</option>
                            </select>
                        </div>
                    </div>
                )}

                {/* List View */}
                {!loading && filteredStudents.length > 0 && (
                    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
                        <table className="w-full text-sm text-left">
                            <thead className="bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                <tr>
                                    <th className="px-6 py-3 w-12 text-center">#</th>
                                    <th className="px-6 py-3">Student</th>
                                    <th className="px-6 py-3 text-center">Subjects</th>
                                    <th className="px-6 py-3 text-center">Total</th>
                                    <th className="px-6 py-3 text-center">Avg</th>
                                    <th className="px-6 py-3 text-center">Status</th>
                                    <th className="px-6 py-3 text-right">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                                {filteredStudents.map((student, idx) => {
                                    const isPassing = student.summary.averageScore >= 40;
                                    return (
                                        <tr key={idx} className="hover:bg-blue-50/30 dark:hover:bg-blue-900/10 transition-colors cursor-pointer group" onClick={() => setSelectedStudent(student)}>
                                            <td className="px-6 py-4 text-center text-gray-400 font-medium">{idx + 1}</td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    {student.student.photoUrl ? (
                                                        <img src={student.student.photoUrl} className="w-10 h-10 rounded-full object-cover border-2 border-white dark:border-gray-700 shadow-sm" alt="" />
                                                    ) : (
                                                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-xs shadow-sm text-center">
                                                            {student.student.name ? student.student.name.split(' ').filter(Boolean).map((n: string) => n[0]).join('').toUpperCase().slice(0, 2) : '??'}
                                                        </div>
                                                    )}
                                                    <div>
                                                        <p className="font-bold text-gray-900 dark:text-white group-hover:text-blue-600 transition-colors">{student.student.name}</p>
                                                        <p className="text-[10px] text-gray-400 font-medium uppercase tracking-wider">{student.student.admissionNumber}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-center font-medium text-gray-600 dark:text-gray-400">{student.subjects.length}</td>
                                            <td className="px-6 py-4 text-center font-black text-gray-900 dark:text-white">{student.summary.totalObtained}</td>
                                            <td className="px-6 py-4 text-center">
                                                <span className={`px-2 py-1 rounded-md font-bold text-xs ${isPassing ? 'text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20' : 'text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20'}`}>
                                                    {student.summary.averageScore.toFixed(1)}%
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-widest ${isPassing
                                                    ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800'
                                                    : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400 border border-red-200 dark:border-red-800'
                                                    }`}>
                                                    {isPassing ? 'PASSED' : 'FAILED'}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <div className="flex items-center justify-end gap-2">
                                                    <button
                                                        onClick={(e) => { e.stopPropagation(); setSelectedStudent(student); }}
                                                        title="View Report Card"
                                                        className="p-2 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-lg hover:bg-blue-600 hover:text-white transition-all shadow-sm border border-blue-100 dark:border-blue-800"
                                                    >
                                                        <Eye className="w-4 h-4" />
                                                    </button>
                                                    <button
                                                        onClick={(e) => { e.stopPropagation(); printSingle(student); }}
                                                        title="Print Individual Card"
                                                        className="p-2 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 rounded-lg hover:bg-emerald-600 hover:text-white transition-all shadow-sm border border-emerald-100 dark:border-emerald-800"
                                                    >
                                                        <Printer className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
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
