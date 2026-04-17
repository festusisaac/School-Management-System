import { useState, useEffect, useMemo, useCallback } from 'react';
import { Printer, Search, X, Eye, SlidersHorizontal } from 'lucide-react';
import { useToast } from '../../../context/ToastContext';
import { useSystem } from '../../../context/SystemContext';
import { examinationService, ExamGroup } from '../../../services/examinationService';
import api from '../../../services/api';
import { systemService, AcademicTerm } from '../../../services/systemService';
import ReportCardTemplate, { ReportCardData, ReportCardSubject } from '../../../components/examination/ReportCardTemplate';
import { useSearchParams } from 'react-router-dom';
import { groupById, identifyTerm } from '../../../utils/reportingUtils';
import React from 'react';

// Memoized Row Component to prevent full table re-renders
const StudentRow = React.memo(({ student, idx, onSelect, onPrint }: { 
    student: ReportCardData, 
    idx: number, 
    onSelect: (s: ReportCardData) => void, 
    onPrint: (s: ReportCardData) => void 
}) => {
    return (
        <tr className="hover:bg-primary-50/30 dark:hover:bg-primary-900/10 transition-colors cursor-pointer group" onClick={() => onSelect(student)}>
            <td className="px-6 py-4 text-center text-gray-400 font-medium">{idx + 1}</td>
            <td className="px-6 py-4">
                <div className="flex items-center gap-3">
                    {student.student.photoUrl ? (
                        <img src={student.student.photoUrl} className="w-10 h-10 rounded-full object-cover border-2 border-white dark:border-gray-700 shadow-sm" alt="" />
                    ) : (
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-500 to-secondary-600 flex items-center justify-center text-white font-bold text-xs shadow-sm text-center">
                            {student.student.name ? student.student.name.split(' ').filter(Boolean).map((n: string) => n[0]).join('').toUpperCase().slice(0, 2) : '??'}
                        </div>
                    )}
                    <div>
                        <p className="font-bold text-gray-900 dark:text-white group-hover:text-primary-600 transition-colors">{student.student.name}</p>
                        <p className="text-[10px] text-gray-400 font-medium uppercase tracking-wider">{student.student.admissionNumber}</p>
                    </div>
                </div>
            </td>
            <td className="px-6 py-4 text-center font-medium text-gray-600 dark:text-gray-400">{student.subjects.length}</td>
            <td className="px-6 py-4 text-center font-black text-gray-900 dark:text-white">{student.summary.totalObtained}</td>
            <td className="px-6 py-4 text-center font-bold text-primary-600">
                {student.summary.averageScore.toFixed(1)}%
            </td>
            <td className="px-6 py-4 text-right">
                <div className="flex items-center justify-end gap-2">
                    <button
                        onClick={(e) => { e.stopPropagation(); onSelect(student); }}
                        title="View Report Card"
                        className="p-2 bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400 rounded-lg hover:bg-primary-600 hover:text-white transition-all shadow-sm border border-primary-100 dark:border-primary-800"
                    >
                        <Eye className="w-4 h-4" />
                    </button>
                    <button
                        onClick={(e) => { e.stopPropagation(); onPrint(student); }}
                        title="Print Individual Card"
                        className="p-2 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 rounded-lg hover:bg-emerald-600 hover:text-white transition-all shadow-sm border border-emerald-100 dark:border-emerald-800"
                    >
                        <Printer className="w-4 h-4" />
                    </button>
                </div>
            </td>
        </tr>
    );
});

// Memoized Print Section to avoid re-rendering 40+ report cards on every parent state change
const BulkPrintSection = React.memo(({ students, assessments, config }: { 
    students: ReportCardData[], 
    assessments: any[], 
    config: any 
}) => {
    if (students.length === 0) return null;
    return (
        <div className="hidden print:block">
            {students.map((student, idx) => (
                <div key={idx} style={{ pageBreakAfter: idx === students.length - 1 ? 'auto' : 'always' }}>
                    <ReportCardTemplate data={student} assessments={assessments} config={config} />
                </div>
            ))}
        </div>
    );
});

const ReportCardPage = () => {
    const [searchParams] = useSearchParams();

    const { settings, getFullUrl } = useSystem();
    const { showError } = useToast();

    const [groups, setGroups] = useState<ExamGroup[]>([]);
    const [classes, setClasses] = useState<any[]>([]);
    const [selectedGroup, setSelectedGroup] = useState(searchParams.get('examGroupId') || '');
    const [selectedClass, setSelectedClass] = useState(searchParams.get('classId') || '');
    const [assessments, setAssessments] = useState<any[]>([]);
    const [terms, setTerms] = useState<AcademicTerm[]>([]);
    const [selectedTerm, setSelectedTerm] = useState<string>(searchParams.get('termName') || settings?.activeTermName || '');

    const [students, setStudents] = useState<ReportCardData[]>([]);
    const [printData, setPrintData] = useState<ReportCardData[]>([]);
    const [loading, setLoading] = useState(false);
    const [selectedStudent, setSelectedStudent] = useState<ReportCardData | null>(null);

    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [showSettings, setShowSettings] = useState(false);

    const [config, setConfig] = useState<any>({
        showPhoto: true,
        showHighest: true,
        showLowest: true,
        showAverage: true,
        showSubjectPosition: true,
        showClassPosition: true,
        showAttendance: true,
        showCumulative: true
    });

    // Initial Load
    useEffect(() => {
        const init = async () => {
            try {
                const [g, c] = await Promise.all([
                    examinationService.getExamGroups(),
                    api.getClasses(),
                    examinationService.getGradeScales(),
                ]);
                
                const loadedGroups = g || [];
                setGroups(loadedGroups);
                setClasses(c || []);

                const initialSession = settings?.activeSessionName || '';
                const initialTerm = selectedTerm || settings?.activeTermName || '';
                
                if (!selectedTerm && settings?.activeTermName) {
                    setSelectedTerm(settings.activeTermName);
                }

                if (!searchParams.get('examGroupId') && initialSession && initialTerm && loadedGroups.length > 0) {
                    const matchedGroup = loadedGroups.find(group => 
                        group.academicYear === initialSession && 
                        group.term === initialTerm
                    );
                    if (matchedGroup) {
                        setSelectedGroup(matchedGroup.id);
                    }
                }
            } catch (e) {
                showError('Failed to load initial data');
            }
        };
        init();
    }, [settings?.activeSessionName, settings?.activeTermName]);

    // Load Session Terms
    useEffect(() => {
        const fetchSessionTerms = async () => {
            if (!settings?.currentSessionId) return;
            try {
                const sessionTerms = await systemService.getTermsBySession(settings.currentSessionId);
                setTerms(sessionTerms || []);
            } catch (e) {
                showError('Failed to load terms');
            }
        };
        fetchSessionTerms();
    }, [settings?.currentSessionId]);

    // Update selected term if settings load later
    useEffect(() => {
        if (!selectedTerm && settings?.activeTermName) {
            setSelectedTerm(settings.activeTermName);
        }
    }, [settings?.activeTermName, selectedTerm]);

    const filteredGroups = useMemo(() => groups.filter(g =>
        (g.academicYear === settings?.activeSessionName) &&
        (!selectedTerm || g.term === selectedTerm)
    ), [groups, settings?.activeSessionName, selectedTerm]);

    const fetchReportCards = async () => {
        if (!selectedGroup || !selectedClass) return;
        setLoading(true);
        try {
            const [
                assessmentTypes, 
                allMarks, 
                allExams, 
                broadsheetData,
                affDomains,
                psycDomains,
                allSkills,
                allPsyc,
                classInfo
            ] = await Promise.all([
                examinationService.getAssessmentTypes(selectedGroup),
                examinationService.getClassMarks(selectedClass, selectedGroup),
                examinationService.getExams(selectedGroup),
                examinationService.getBroadsheet(selectedClass, selectedGroup).catch(() => ({ results: [], subjectScores: [], subjectStats: [], cumulativeSubjectScores: [], cumulativeOverallResults: [] })),
                examinationService.getAffectiveDomains(),
                examinationService.getPsychomotorDomains(),
                examinationService.getSkills(selectedGroup),
                examinationService.getPsychomotor(selectedGroup),
                api.getClassById(selectedClass).catch(() => null)
            ]);

            const broadsheetResponse = broadsheetData as any;
            setAssessments(assessmentTypes || []);

            const teacher = (classInfo as any)?.classTeacher;
            const termResults = broadsheetResponse?.results || [];

            const marksByStudent = groupById(allMarks as any[], 'studentId');
            const marksByStudentSubjAss = new Map<string, number>();
            allMarks.forEach((m: any) => markersMap(marksByStudentSubjAss, m));

            const subjectEnrichedLookup = new Map<string, any>();
            broadsheetResponse.subjectScores.forEach((s: any) => subjectEnrichedLookup.set(`${s.studentId}_${s.subjectId}`, s));

            const subjectStatsLookup = new Map<string, any>();
            broadsheetResponse.subjectStats.forEach((s: any) => subjectStatsLookup.set(s.subjectId, s));

            const cumulativeSubjLookup = new Map<string, { term1: number; term2: number }>();
            broadsheetResponse.cumulativeSubjectScores.forEach((c: any) => {
                const sId = c.studentId || c.studentid;
                const subId = c.subjectId || c.subjectid;
                const key = `${sId}_${subId}`;
                const existing = cumulativeSubjLookup.get(key) || { term1: 0, term2: 0 };
                const term = identifyTerm(c.term);
                if (term === 'first') existing.term1 = parseFloat(c.termTotal || 0);
                else if (term === 'second') existing.term2 = parseFloat(c.termTotal || 0);
                cumulativeSubjLookup.set(key, existing);
            });

            const cumulativeOverallLookup = new Map<string, { term1: number; term2: number }>();
            broadsheetResponse.cumulativeOverallResults.forEach((r: any) => {
                const sId = r.studentId || r.studentid;
                const existing = cumulativeOverallLookup.get(sId) || { term1: 0, term2: 0 };
                const term = identifyTerm(r.examGroup?.term);
                if (term === 'first') existing.term1 = parseFloat(r.averageScore || 0);
                else if (term === 'second') existing.term2 = parseFloat(r.averageScore || 0);
                cumulativeOverallLookup.set(sId, existing);
            });

            const examsBySubject = new Map<string, any>();
            allExams.forEach((e: any) => { if (e.classId === selectedClass) examsBySubject.set(e.subjectId, e); });

            const affDomainLookup = new Map<string, string>();
            affDomains.forEach((d: any) => affDomainLookup.set(d.id, d.name));
            const psycDomainLookup = new Map<string, string>();
            psycDomains.forEach((d: any) => psycDomainLookup.set(d.id, d.name));

            const skillsByStudent = groupById(allSkills, 'studentId');
            const psycByStudent = groupById(allPsyc, 'studentId');

            const reports: ReportCardData[] = termResults.map((result: any) => {
                const student = result.student;
                const studentId = student.id;
                const studentMarks = marksByStudent.get(studentId) || [];
                const studentSubjectsIds = Array.from(new Set(studentMarks.map((m: any) => m.subjectId)));

                const processedSubjects: ReportCardSubject[] = studentSubjectsIds.map((subId: any) => {
                    const exam = examsBySubject.get(subId);
                    const scores: Record<string, number | undefined> = {};
                    assessmentTypes.forEach((ass: any) => { scores[ass.id] = marksByStudentSubjAss.get(`${studentId}_${subId}_${ass.id}`); });
                    const enriched = subjectEnrichedLookup.get(`${studentId}_${subId}`);
                    const stats = subjectStatsLookup.get(subId);
                    const cumulative = cumulativeSubjLookup.get(`${studentId}_${subId}`) || { term1: 0, term2: 0 };

                    return {
                        subjectName: exam?.subject?.name || 'Unknown',
                        scores,
                        totalScore: enriched?.totalSubjectScore || 0,
                        grade: enriched?.grade || 'F',
                        remark: enriched?.remark || 'VERY POOR',
                        highestInClass: stats ? parseFloat(stats.highestScore || 0) : undefined,
                        lowestInClass: stats ? parseFloat(stats.lowestScore || 0) : undefined,
                        classAvg: stats ? parseFloat(stats.averageScore || 0) : undefined,
                        positionInSubject: enriched?.positionInSubject,
                        cumulative
                    };
                });

                const totalObtained = processedSubjects.reduce((acc, s) => acc + (s.totalScore || 0), 0);
                const averageScore = processedSubjects.length > 0 ? totalObtained / processedSubjects.length : 0;
                const cumOverall = cumulativeOverallLookup.get(studentId) || { term1: 0, term2: 0 };

                return {
                    student: {
                        name: `${student.firstName} ${student.lastName}`,
                        dateOfBirth: student.dob ? new Date(student.dob).toLocaleDateString() : 'N/A',
                        sex: student.gender || 'N/A',
                        admissionNumber: student.admissionNo || student.admissionNumber || 'N/A',
                        class: student.class?.name || 'N/A',
                        photoUrl: student.studentPhoto ? getFullUrl(student.studentPhoto) : undefined,
                    },
                    examGroup: {
                        name: result.examGroup?.name || settings?.activeSessionName || 'N/A',
                        term: result.examGroup?.term || settings?.activeTermName || 'N/A',
                        year: result.examGroup?.academicYear || new Date().getFullYear().toString()
                    },
                    academicInfo: {
                        timesOpened: result.daysOpened || broadsheetResponse.termDetails?.daysOpened || 0,
                        timesPresent: result.daysPresent || 0,
                        timesAbsent: (result.daysOpened || broadsheetResponse.termDetails?.daysOpened || 0) - (result.daysPresent || 0),
                        termBegins: broadsheetResponse.termDetails?.startDate ? new Date(broadsheetResponse.termDetails.startDate).toLocaleDateString() : '',
                        termEnds: broadsheetResponse.termDetails?.endDate ? new Date(broadsheetResponse.termDetails.endDate).toLocaleDateString() : '',
                        nextTermBegins: broadsheetResponse.termDetails?.nextTermStartDate ? new Date(broadsheetResponse.termDetails.nextTermStartDate).toLocaleDateString() : '',
                        classTeacherName: teacher ? `${teacher.firstName} ${teacher.lastName}` : 'N/A',
                        classTeacherSignature: teacher?.signature ? getFullUrl(teacher.signature) : '',
                        principalSignature: settings?.principalSignature ? getFullUrl(settings.principalSignature) : '',
                        teacherComment: result.teacherComment,
                        principalComment: result.principalComment,
                        promotionStatus: result.promotionStatus
                    },
                    subjects: processedSubjects,
                    affectiveTraits: (skillsByStudent.get(studentId) || []).map((s: any) => ({ name: affDomainLookup.get(s.domainId) || 'Unknown', rating: parseInt(s.rating) || 1 })),
                    psychomotorSkills: (psycByStudent.get(studentId) || []).map((p: any) => ({ name: psycDomainLookup.get(p.domainId) || 'Unknown', rating: parseInt(p.rating) || 1 })),
                    summary: {
                        totalObtainable: processedSubjects.length * 100,
                        totalObtained: totalObtained,
                        averageScore: averageScore,
                        position: result.position || 0,
                        classSize: termResults.length,
                        cumulativeAvg: (cumOverall.term1 > 0 || cumOverall.term2 > 0) ? (cumOverall.term1 + cumOverall.term2 + averageScore) / 3 : undefined
                    }
                };
            });
            setStudents(reports);
        } catch (error) {
            showError('Failed to generate report cards');
        } finally {
            setLoading(false);
        }
    };

    const markersMap = (map: Map<string, number>, m: any) => {
        map.set(`${m.studentId}_${m.subjectId}_${m.assessmentTypeId}`, m.score);
    };

    useEffect(() => {
        if (selectedGroup && selectedClass) fetchReportCards();
        else setStudents([]);
    }, [selectedGroup, selectedClass]);

    const filteredStudents = useMemo(() => students.filter(s => {
        const matchesSearch = s.student.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            s.student.admissionNumber?.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesStatus = statusFilter === 'all' || (statusFilter === 'passed' && s.summary.averageScore >= 40) || (statusFilter === 'failed' && s.summary.averageScore < 40);
        return matchesSearch && matchesStatus;
    }), [students, searchQuery, statusFilter]);

    const handlePrint = useCallback(() => {
        setPrintData(students);
        setTimeout(() => { window.print(); setPrintData([]); }, 150);
    }, [students]);

    const printSingle = useCallback((student: ReportCardData) => {
        setPrintData([student]);
        setTimeout(() => { window.print(); setPrintData([]); }, 400);
    }, []);

    const handleSelectStudent = useCallback((student: ReportCardData) => {
        setSelectedStudent(student);
    }, []);

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 print:min-h-0 print:bg-white text-gray-900 dark:text-white">
            <div className="p-6 space-y-6 print:hidden">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                        <h1 className="text-2xl font-bold">Report Cards</h1>
                        <p className="text-sm text-gray-500">Generate and print student result slips.</p>
                    </div>
                    <div className="flex gap-2">
                        <button onClick={() => setShowSettings(!showSettings)} className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 transition-all shadow-sm">
                            <SlidersHorizontal className="w-4 h-4" /> Layout
                        </button>
                        {students.length > 0 && (
                            <button onClick={handlePrint} className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 shadow-sm">
                                <Printer className="w-4 h-4" /> Print All
                            </button>
                        )}
            </div>
            
            <BulkPrintSection students={printData} assessments={assessments} config={config} />
                    <div className="space-y-1">
                        <label className="text-sm font-medium">Term</label>
                        <select className="w-full rounded-md border border-gray-300 dark:border-gray-600 bg-transparent px-3 py-2 text-sm" value={selectedTerm} onChange={(e) => { setSelectedTerm(e.target.value); setSelectedGroup(''); }}>
                            <option value="">All Terms</option>
                            {terms.map(t => <option key={t.id} value={t.name}>{t.name}</option>)}
                        </select>
                    </div>
                    <div className="space-y-1">
                        <label className="text-sm font-medium">Exam Group</label>
                        <select className="w-full rounded-md border border-gray-300 dark:border-gray-600 bg-transparent px-3 py-2 text-sm" value={selectedGroup} onChange={(e) => setSelectedGroup(e.target.value)}>
                            <option value="">Select Exam Group</option>
                            {filteredGroups.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
                        </select>
                    </div>
                    <div className="space-y-1">
                        <label className="text-sm font-medium">Class</label>
                        <select className="w-full rounded-md border border-gray-300 dark:border-gray-600 bg-transparent px-3 py-2 text-sm" value={selectedClass} onChange={(e) => setSelectedClass(e.target.value)}>
                            <option value="">Select Class</option>
                            {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                        </select>
                    </div>
                    <div className="flex items-end">
                        {loading && <div className="flex items-center gap-2 py-2 text-primary-600 font-medium"><div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary-600"></div><span className="text-sm">Loading...</span></div>}
                    </div>
                </div>

                {showSettings && (
                     <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                        <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowSettings(false)} />
                        <div className="bg-white dark:bg-gray-800 w-full max-w-md rounded-xl shadow-2xl relative animate-in zoom-in-95 duration-200 overflow-hidden">
                            <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center">
                                <h3 className="font-bold">Layout Options</h3>
                                <X className="w-4 h-4 cursor-pointer" onClick={() => setShowSettings(false)} />
                            </div>
                            <div className="p-5 space-y-3">
                                {['showPhoto', 'showHighest', 'showLowest', 'showAverage', 'showSubjectPosition', 'showClassPosition', 'showAttendance', 'showCumulative'].map(key => (
                                    <label key={key} className="flex items-center justify-between py-1 cursor-pointer">
                                        <span className="text-sm capitalize">{key.replace(/([A-Z])/g, ' $1')}</span>
                                        <input type="checkbox" checked={config[key]} onChange={() => setConfig({ ...config, [key]: !config[key] })} className="w-4 h-4" />
                                    </label>
                                ))}
                            </div>
                        </div>
                     </div>
                )}

                {!loading && students.length > 0 && (
                    <div className="flex flex-col md:flex-row gap-4 justify-between items-center bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm">
                        <div className="relative w-full md:w-96">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <input type="text" placeholder="Search students..." className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-transparent text-sm" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
                        </div>
                        <select className="rounded-lg border border-gray-200 dark:border-gray-700 bg-transparent text-sm px-3 py-2" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                            <option value="all">All Status</option>
                            <option value="passed">Passed</option>
                            <option value="failed">Failed</option>
                        </select>
                    </div>
                )}

                {filteredStudents.length > 0 && (
                    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
                        <table className="w-full text-sm text-left">
                            <thead className="bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 text-gray-500 font-medium">
                                <tr>
                                    <th className="px-6 py-4 w-12 text-center">#</th>
                                    <th className="px-6 py-4">Student</th>
                                    <th className="px-6 py-4 text-center">Subjects</th>
                                    <th className="px-6 py-4 text-center">Total</th>
                                    <th className="px-6 py-4 text-center">Avg</th>
                                    <th className="px-6 py-4 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                                {filteredStudents.map((s, idx) => <StudentRow key={idx} student={s} idx={idx} onSelect={handleSelectStudent} onPrint={printSingle} />)}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            <BulkPrintSection students={printData} assessments={assessments} config={config} />

            {selectedStudent && (
                <div className="fixed inset-0 z-[60] flex flex-col bg-white print:hidden transition-all duration-300">
                    <div className="flex justify-between items-center px-6 py-4 border-b bg-white sticky top-0 z-10 w-full shadow-sm">
                        <div className="flex items-center gap-3">
                            <X className="w-6 h-6 cursor-pointer hover:text-red-500 transition-colors" onClick={() => setSelectedStudent(null)} />
                            <h2 className="font-bold text-lg">Previewing Report Card: <span className="text-primary-600 uppercase">{selectedStudent.student.name}</span></h2>
                        </div>
                        <div className="flex gap-2">
                             <button className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm font-medium transition-colors" onClick={() => setSelectedStudent(null)}>Close Preview</button>
                             <button className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg text-sm font-medium transition-colors" onClick={() => printSingle(selectedStudent)}>Print Report Card</button>
                        </div>
                    </div>
                    <div className="flex-1 overflow-y-auto p-0 md:p-2 lg:p-4 flex justify-center items-start">
                        <div className="w-full bg-white border border-gray-200/50">
                           <ReportCardTemplate data={selectedStudent} assessments={assessments} config={config} />
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ReportCardPage;
