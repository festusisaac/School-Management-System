import { useState, useEffect, useMemo } from 'react';
import { Printer, Search, FileText, X, Filter, Eye, SlidersHorizontal } from 'lucide-react';
import { useToast } from '../../../context/ToastContext';
import { useSystem } from '../../../context/SystemContext';
import { examinationService, ExamGroup, GradeScale } from '../../../services/examinationService';
import api from '../../../services/api';
import { systemService, AcademicTerm } from '../../../services/systemService';
import ReportCardTemplate, { ReportCardData, ReportCardSubject } from '../../../components/examination/ReportCardTemplate';
import { useSearchParams } from 'react-router-dom';


const ReportCardPage = () => {
    const [searchParams] = useSearchParams();

    const [groups, setGroups] = useState<ExamGroup[]>([]);
    const [classes, setClasses] = useState<any[]>([]);
    const [selectedGroup, setSelectedGroup] = useState(searchParams.get('examGroupId') || '');
    const [selectedClass, setSelectedClass] = useState(searchParams.get('classId') || '');
    const [gradeScales, setGradeScales] = useState<GradeScale[]>([]);
    const [assessments, setAssessments] = useState<any[]>([]);

    const { settings, getFullUrl } = useSystem();
    const [terms, setTerms] = useState<AcademicTerm[]>([]);
    const [selectedTerm, setSelectedTerm] = useState<string>(searchParams.get('termName') || settings?.activeTermName || '');

    const [students, setStudents] = useState<ReportCardData[]>([]);
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

    const { showError } = useToast();

    // Initial Load
    useEffect(() => {
        const init = async () => {
            try {
                const [g, c, s] = await Promise.all([
                    examinationService.getExamGroups(),
                    api.getClasses(),
                    examinationService.getGradeScales(),
                ]);
                
                const loadedGroups = g || [];
                setGroups(loadedGroups);
                setClasses(c || []);
                setGradeScales(s || []);

                // Set initial session/term from settings if available
                const initialSession = settings?.activeSessionName || '';
                const initialTerm = selectedTerm || settings?.activeTermName || '';
                if (!selectedTerm && settings?.activeTermName) {
                    setSelectedTerm(settings.activeTermName);
                }

                // Auto-select group matching global session and term
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

    // 2. Load Terms for the Active Session
    useEffect(() => {
        const fetchSessionTerms = async () => {
            if (!settings?.currentSessionId) return;
            try {
                const sessionTerms = await systemService.getTermsBySession(settings.currentSessionId);
                setTerms(sessionTerms || []);
            } catch (e) {
                showError('Failed to load terms for the active session');
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

    // Filtered Groups for Selection
    const filteredGroups = groups.filter(g =>
        (g.academicYear === settings?.activeSessionName) &&
        (!selectedTerm || g.term === selectedTerm)
    );

    useEffect(() => {
        if (selectedGroup && selectedClass) {
            fetchReportCards();
        } else {
            setStudents([]);
        }
    }, [selectedGroup, selectedClass]);

    // Load Report Cards Data
    const fetchReportCards = async () => {
        if (!selectedGroup || !selectedClass) return;
        setLoading(true);
        try {
            // 1. Fetch all necessary data in parallel
            const [
                assessmentTypes, 
                allMarks, 
                allExams, 
                broadsheetResponse,
                affDomains,
                psycDomains,
                allSkills,
                allPsyc,
                classInfo
            ] = await Promise.all([
                examinationService.getAssessmentTypes(selectedGroup),
                examinationService.getClassMarks(selectedClass, selectedGroup),
                examinationService.getExams(selectedGroup),
                examinationService.getBroadsheet(selectedClass, selectedGroup).catch(() => ({ results: [], subjectScores: [], subjectStats: [], cumulativeSubjectScores: [], cumulativeOverallResults: [] })) as any,
                examinationService.getAffectiveDomains(),
                examinationService.getPsychomotorDomains(),
                examinationService.getSkills(selectedGroup),
                examinationService.getPsychomotor(selectedGroup),
                api.getClassById(selectedClass).catch(() => null)
            ]);

            setAssessments(assessmentTypes || []);

            const teacher = (classInfo as any)?.classTeacher;
            const teacherName = teacher ? `${teacher.firstName} ${teacher.lastName}` : 'N/A';
            const teacherSign = teacher?.signature ? getFullUrl(teacher.signature) : '';

            const termResults = (broadsheetResponse as any)?.results || [];
            const subjectStats = (broadsheetResponse as any)?.subjectStats || [];
            const subjectEnrichedScores = (broadsheetResponse as any)?.subjectScores || [];
            const cumulativeSubjectScores = (broadsheetResponse as any)?.cumulativeSubjectScores || [];
            const cumulativeOverallResults = (broadsheetResponse as any)?.cumulativeOverallResults || [];

            // 2. Group individual marks (CA1, CA2, etc) by studentId for O(1) lookup
            const marksByStudent = (allMarks as any[]).reduce((acc: Record<string, any[]>, mark: any) => {
                const sId = mark.studentId;
                if (!acc[sId]) acc[sId] = [];
                acc[sId].push(mark);
                return acc;
            }, {});

            // 3. Map the processed results into ReportCardData format
            const reports: ReportCardData[] = termResults.map((result: any) => {
                const student = result.student;
                const studentMarks = marksByStudent[student.id] || [];
                
                // Get all subjects this student took based on their marks
                const studentSubjects = Array.from(new Set(studentMarks.map((m: any) => m.subjectId)));

                const processedSubjects: ReportCardSubject[] = studentSubjects.map((subId: any) => {
                    const exam = allExams.find((e: any) => e.subjectId === subId && e.classId === selectedClass);
                    const subjectName = exam?.subject?.name || 'Unknown';
                    
                    // Individual assessment scores (CA1, CA2, Exam)
                    const scores: Record<string, number | undefined> = {};
                    assessmentTypes.forEach(ass => {
                        const m = studentMarks.find((mark: any) => mark.assessmentTypeId === ass.id && mark.subjectId === subId);
                        scores[ass.id] = m ? m.score : undefined;
                    });

                    // Pre-calculated subject metrics from backend
                    const enriched = subjectEnrichedScores.find((s: any) => s.studentId === student.id && s.subjectId === subId);
                    const stats = subjectStats.find((s: any) => s.subjectId === subId);

                    return {
                        subjectName,
                        scores,
                        totalScore: enriched?.totalSubjectScore || 0,
                        grade: enriched?.grade || 'F',
                        remark: enriched?.remark || 'VERY POOR',
                        highestInClass: stats ? parseFloat(stats.highestScore) : undefined,
                        lowestInClass: stats ? parseFloat(stats.lowestScore) : undefined,
                        classAvg: stats ? parseFloat(stats.averageScore) : undefined,
                        positionInSubject: enriched?.positionInSubject,
                        cumulative: {
                            term1: parseFloat(cumulativeSubjectScores.find((c: any) => 
                                (c.studentId || c.studentid) === student.id && 
                                (c.subjectId || c.subjectid) === subId && 
                                (c.term?.toLowerCase().includes('first') || c.term?.toLowerCase().includes('1st'))
                            )?.termTotal || 0),
                            term2: parseFloat(cumulativeSubjectScores.find((c: any) => 
                                (c.studentId || c.studentid) === student.id && 
                                (c.subjectId || c.subjectid) === subId && 
                                (c.term?.toLowerCase().includes('second') || c.term?.toLowerCase().includes('2nd'))
                            )?.termTotal || 0),
                        }
                    };
                });

                // Map skills and psychomotor for this student
                const studentSkills = allSkills
                    .filter((s: any) => s.studentId === student.id)
                    .map((s: any) => ({
                        name: affDomains.find(d => d.id === s.domainId)?.name || 'Unknown',
                        rating: parseInt(s.rating) || 1
                    }));

                const studentPsyc = allPsyc
                    .filter((p: any) => p.studentId === student.id)
                    .map((p: any) => ({
                        name: psycDomains.find(d => d.id === p.domainId)?.name || 'Unknown',
                        rating: parseInt(p.rating) || 1
                    }));

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
                        timesOpened: result.daysOpened || (broadsheetResponse as any).termDetails?.daysOpened || 0,
                        timesPresent: result.daysPresent || 0,
                        timesAbsent: (result.daysOpened || (broadsheetResponse as any).termDetails?.daysOpened || 0) - (result.daysPresent || 0),
                        termBegins: (broadsheetResponse as any).termDetails?.startDate 
                            ? new Date((broadsheetResponse as any).termDetails.startDate).toLocaleDateString()
                            : (settings?.sessionStartDate ? new Date(settings.sessionStartDate).toLocaleDateString() : ''),
                        termEnds: (broadsheetResponse as any).termDetails?.endDate 
                            ? new Date((broadsheetResponse as any).termDetails.endDate).toLocaleDateString()
                            : (settings?.sessionEndDate ? new Date(settings.sessionEndDate).toLocaleDateString() : ''),
                        nextTermBegins: (broadsheetResponse as any).termDetails?.nextTermStartDate 
                            ? new Date((broadsheetResponse as any).termDetails.nextTermStartDate).toLocaleDateString()
                            : (settings?.nextTermStartDate ? new Date(settings.nextTermStartDate).toLocaleDateString() : 'To be announced'),
                        classTeacherName: teacherName,
                        classTeacherSignature: teacherSign,
                        principalSignature: settings?.invoiceLogo ? getFullUrl(settings.invoiceLogo) : ''
                    },
                    subjects: processedSubjects,
                    affectiveTraits: studentSkills,
                    psychomotorSkills: studentPsyc,
                    summary: {
                        totalObtainable: processedSubjects.length * 100,
                        totalObtained: result.totalScore || 0,
                        averageScore: result.averageScore || 0,
                        position: result.position || 0,
                        classSize: termResults.length,
                        cumulativeAvg: (() => {
                            const t1Avg = cumulativeOverallResults.find((r: any) => 
                                r.studentId === student.id && 
                                (r.examGroup?.term?.toLowerCase().includes('first') || r.examGroup?.term?.toLowerCase().includes('1st'))
                            )?.averageScore || 0;
                            const t2Avg = cumulativeOverallResults.find((r: any) => 
                                r.studentId === student.id && 
                                (r.examGroup?.term?.toLowerCase().includes('second') || r.examGroup?.term?.toLowerCase().includes('2nd'))
                            )?.averageScore || 0;
                            if (t1Avg > 0 || t2Avg > 0) {
                                return (parseFloat(t1Avg) + parseFloat(t2Avg) + (result.averageScore || 0)) / 3;
                            }
                            return undefined;
                        })()
                    }
                };
            });

            // Keep official sorted order from backend (results are already DESC by totalScore)
            setStudents(reports);

        } catch (error) {
            console.error('Error generating reports:', error);
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


    const getGradeDetails = (score: number, scales: GradeScale[]) => {
        // Use the first scale's grades for now, or match by some criteria if needed
        if (scales && scales.length > 0) {
            const grades = scales[0].grades;
            const match = grades.find(g => score >= g.minScore && score <= g.maxScore);
            if (match) {
                return { grade: match.name, remark: match.remark || '' };
            }
        }
        // Fallback
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
                        <button
                            onClick={() => setShowSettings(!showSettings)}
                            className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-all shadow-sm"
                        >
                            <SlidersHorizontal className={`w-4 h-4`} />
                            Layout
                        </button>
                        {students.length > 0 && (
                            <button
                                onClick={handlePrint}
                                className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-shadow shadow-sm"
                            >
                                <Printer className="w-4 h-4" />
                                Print All
                            </button>
                        )}
                    </div>
                </div>

                {/* Filters */}
                <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm grid grid-cols-1 md:grid-cols-4 gap-6 items-end">


                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Term</label>
                        <select
                            className="w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                            value={selectedTerm}
                            onChange={(e) => {
                                setSelectedTerm(e.target.value);
                                setSelectedGroup('');
                            }}
                        >
                            <option value="">All Terms</option>
                            {terms.map(t => (
                                <option key={t.id} value={t.name}>{t.name}</option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Exam Group</label>
                        <select
                            className="w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                            value={selectedGroup}
                            onChange={(e) => setSelectedGroup(e.target.value)}
                        >
                            <option value="">Select Exam Group</option>
                            {filteredGroups.map(g => (
                                <option key={g.id} value={g.id}>{g.name}</option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Class</label>
                        <select
                            className="w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                            value={selectedClass}
                            onChange={(e) => setSelectedClass(e.target.value)}
                        >
                            <option value="">Select Class</option>
                            {classes.map(c => (
                                <option key={c.id} value={c.id}>{c.name}</option>
                            ))}
                        </select>
                    </div>

                    {loading && (
                        <div className="flex items-center gap-2 h-[38px] text-primary-600 font-medium">
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary-600"></div>
                            <span className="text-sm">Generating...</span>
                        </div>
                    )}
                </div>

                {/* Report Layout Options — Modal */}
                {showSettings && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                        <div 
                            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
                            onClick={() => setShowSettings(false)}
                        />
                        <div className="bg-white dark:bg-gray-800 w-full max-w-md rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden relative animate-in zoom-in-95 fade-in duration-200">
                            <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between">
                                <div>
                                    <h3 className="text-sm font-bold text-gray-900 dark:text-white">Layout Options</h3>
                                    <p className="text-xs text-gray-500 mt-0.5">Toggle what appears on the report card</p>
                                </div>
                                <button 
                                    onClick={() => setShowSettings(false)}
                                    className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors text-gray-400"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            </div>
                            <div className="p-5 space-y-3">
                                {[
                                    { key: 'showPhoto', label: 'Student Photo' },
                                    { key: 'showHighest', label: 'Highest Score' },
                                    { key: 'showLowest', label: 'Lowest Score' },
                                    { key: 'showAverage', label: 'Class Average' },
                                    { key: 'showSubjectPosition', label: 'Subject Position' },
                                    { key: 'showClassPosition', label: 'Class Position' },
                                    { key: 'showAttendance', label: 'Attendance' },
                                    { key: 'showCumulative', label: 'Cumulative' },
                                ].map((item) => (
                                    <label key={item.key} className="flex items-center justify-between cursor-pointer select-none group py-1 px-1 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                                        <span className="text-sm text-gray-700 dark:text-gray-300 group-hover:text-gray-900 dark:group-hover:text-white transition-colors font-medium">
                                            {item.label}
                                        </span>
                                        <button
                                            onClick={() => setConfig({ ...config, [item.key]: !config[item.key] })}
                                            className={`w-9 h-5 rounded-full relative transition-colors duration-200 flex-shrink-0 ${
                                                config[item.key] ? 'bg-primary-500' : 'bg-gray-300 dark:bg-gray-600'
                                            }`}
                                        >
                                            <span className={`absolute top-[3px] w-[14px] h-[14px] rounded-full bg-white shadow-sm transition-transform duration-200 ${
                                                config[item.key] ? 'translate-x-[18px]' : 'translate-x-[3px]'
                                            }`} />
                                        </button>
                                    </label>
                                ))}
                            </div>
                            <div className="px-5 py-3 border-t border-gray-100 dark:border-gray-700 flex justify-end">
                                <button
                                    onClick={() => setShowSettings(false)}
                                    className="px-4 py-2 bg-primary-600 text-white text-xs font-bold rounded-lg hover:bg-primary-700 transition-all shadow-sm"
                                >
                                    Done
                                </button>
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
                                className="w-full pl-10 pr-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
                        <div className="flex items-center gap-2 w-full md:w-auto">
                            <Filter className="w-4 h-4 text-gray-400" />
                            <select
                                className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
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
                                    <th className="px-6 py-3 text-right">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                                {filteredStudents.map((student, idx) => {
                                    return (
                                        <tr key={idx} className="hover:bg-primary-50/30 dark:hover:bg-primary-900/10 transition-colors cursor-pointer group" onClick={() => setSelectedStudent(student)}>
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
                                                        onClick={(e) => { e.stopPropagation(); setSelectedStudent(student); }}
                                                        title="View Report Card"
                                                        className="p-2 bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400 rounded-lg hover:bg-primary-600 hover:text-white transition-all shadow-sm border border-primary-100 dark:border-primary-800"
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
                    <div className="text-center py-12 text-gray-400 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 border-dashed shadow-sm">
                        <div className="w-16 h-16 bg-gray-50 dark:bg-gray-900/50 rounded-full flex items-center justify-center mx-auto mb-4">
                            <FileText className="w-8 h-8 opacity-20" />
                        </div>
                        <h3 className="text-gray-900 dark:text-white font-bold text-lg mb-1">No Results Found</h3>
                        <p className="max-w-xs mx-auto text-sm">We couldn't find any processed marks for this selection. Please ensure scores have been entered for this class and exam group.</p>
                    </div>
                )}
            </div>

            {/* Print Content (Visible only when printing) */}
            <div className="hidden print:block">
                {students.map((student, idx) => (
                    <div key={idx} style={{ pageBreakAfter: 'always' }}>
                        <ReportCardTemplate data={student} assessments={assessments} config={config} />
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
                            <ReportCardTemplate data={selectedStudent} assessments={assessments} config={config} />
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ReportCardPage;
