import { useState, useEffect, useMemo } from 'react';
import { Download, Trophy, TrendingUp, Filter } from 'lucide-react';
import { useToast } from '../../../context/ToastContext';
import { examinationService, ExamGroup } from '../../../services/examinationService';
import api from '../../../services/api';
import { utils, writeFile } from 'xlsx';
import { TablePagination } from '../../../components/ui/TablePagination';
import { identifyTerm, groupById } from '../../../utils/reportingUtils';
import { useSystem } from '../../../context/SystemContext';
import { systemService, AcademicTerm } from '../../../services/systemService';

interface SubjectRow {
    studentId: string;
    studentName: string;
    admissionNumber: string;
    scores: Record<string, number>; // assessmentTypeId -> score
    total: number;
    grade: string;
    remark: string;
    position: number;
    cumulative?: {
        term1: number;
        term2: number;
    };
}

const SubjectBroadsheetPage = () => {
    const [groups, setGroups] = useState<ExamGroup[]>([]);
    const [classes, setClasses] = useState<any[]>([]);
    const [subjects, setSubjects] = useState<any[]>([]);

    const [selectedGroup, setSelectedGroup] = useState('');
    const [selectedClass, setSelectedClass] = useState('');
    const [selectedSubject, setSelectedSubject] = useState('');

    const { settings } = useSystem();
    const [terms, setTerms] = useState<AcademicTerm[]>([]);
    const [selectedTerm, setSelectedTerm] = useState<string>(settings?.activeTermName || '');

    const [rows, setRows] = useState<SubjectRow[]>([]);
    const [assessments, setAssessments] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [subjectStats, setSubjectStats] = useState<{ high: number; low: number; avg: number } | null>(null);

    // Pagination State
    const [currentPage, setCurrentPage] = useState(1);
    const pageSize = 50;
    
    const { showError, showSuccess } = useToast();

    const isThirdTerm = useMemo(() => {
        const t = groups.find(g => g.id === selectedGroup)?.term?.toLowerCase() || '';
        return t.includes('third') || t.includes('3rd');
    }, [groups, selectedGroup]);

    useEffect(() => {
        const init = async () => {
            try {
                const [g, c, s] = await Promise.all([
                    examinationService.getExamGroups(),
                    api.getClasses(),
                    api.getSubjects(),
                ]);
                setGroups(g || []);
                setClasses(c || []);
                setSubjects(s || []);

                const sessionToUse = settings?.activeSessionName;
                const termToUse = selectedTerm || settings?.activeTermName;

                if (g?.length > 0) {
                    const filtered = g.filter(group =>
                        (!sessionToUse || group.academicYear === sessionToUse) &&
                        (!termToUse || group.term === termToUse)
                    );
                    if (filtered.length > 0) {
                        setSelectedGroup(filtered[0].id);
                    }
                }
            } catch (e) {
                showError('Failed to load initial data');
            }
        };
        init();
    }, []);

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

    useEffect(() => {
        if (!selectedTerm && settings?.activeTermName) {
            setSelectedTerm(settings.activeTermName);
        }
    }, [settings?.activeTermName, selectedTerm]);

    const filteredGroups = groups.filter(g =>
        (g.academicYear === settings?.activeSessionName) &&
        (!selectedTerm || g.term === selectedTerm)
    );

    useEffect(() => {
        if (selectedGroup && selectedClass && selectedSubject) {
            fetchData();
        } else {
            setRows([]);
        }
        setCurrentPage(1); // Reset page on filter change
    }, [selectedGroup, selectedClass, selectedSubject]);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [allStudents, allMarks, assessmentTypes, broadsheetData] = await Promise.all([
                api.getStudents({ classId: selectedClass, limit: 1000 }),
                examinationService.getClassMarks(selectedClass, selectedGroup),
                examinationService.getAssessmentTypes(selectedGroup),
                examinationService.getBroadsheet(selectedClass, selectedGroup) as any
            ]);

            const subjectEnrichedScores = broadsheetData?.subjectScores || [];
            const cumulativeSubjectScores = broadsheetData?.cumulativeSubjectScores || [];

            // 3.5. Indexing for O(1) lookups
            const rawSubjectMarks = (allMarks as any[]).filter(m => m.subjectId === selectedSubject);
            const marksLookup = groupById(rawSubjectMarks, 'studentId');
            
            const enrichedMap = new Map<string, any>();
            subjectEnrichedScores.forEach((s: any) => {
                if (s.subjectId === selectedSubject) enrichedMap.set(s.studentId || s.studentid, s);
            });

            const cumulativeMap = new Map<string, { term1: number; term2: number }>();
            cumulativeSubjectScores.forEach((c: any) => {
                if (c.subjectId === selectedSubject) {
                    const sId = c.studentId || c.studentid;
                    const existing = cumulativeMap.get(sId) || { term1: 0, term2: 0 };
                    const term = identifyTerm(c.term);
                    if (term === 'first') existing.term1 = parseFloat(c.termTotal || 0);
                    else if (term === 'second') existing.term2 = parseFloat(c.termTotal || 0);
                    cumulativeMap.set(sId, existing);
                }
            });

            const processedRows: SubjectRow[] = allStudents.map((student: any) => {
                const scores: Record<string, number> = {};
                const studentMarks = marksLookup.get(student.id) || [];
                
                assessmentTypes.forEach((ass: any) => {
                    const mark = studentMarks.find((m: any) => m.assessmentTypeId === ass.id);
                    scores[ass.id] = mark ? mark.score : 0;
                });

                // Use backend enriched data for grade/remark/total
                const enriched = enrichedMap.get(student.id);
                const cumulative = cumulativeMap.get(student.id) || { term1: 0, term2: 0 };

                return {
                    studentId: student.id,
                    studentName: `${student.firstName} ${student.lastName}`,
                    admissionNumber: student.admissionNo || student.admissionNumber || 'N/A',
                    scores,
                    total: enriched?.totalSubjectScore || 0,
                    grade: enriched?.grade || 'F',
                    remark: enriched?.remark || 'VERY POOR',
                    position: enriched?.positionInSubject || 0,
                    cumulative
                };
            });

            const rawStats = broadsheetData?.subjectStats || [];
            const currentSubjectStats = rawStats.find((s: any) => s.subjectId === selectedSubject);
            
            if (currentSubjectStats) {
                setSubjectStats({
                    high: parseFloat(currentSubjectStats.highestScore),
                    low: parseFloat(currentSubjectStats.lowestScore),
                    avg: parseFloat(currentSubjectStats.averageScore)
                });
            } else {
                setSubjectStats(null);
            }

            setAssessments(assessmentTypes || []);
            setRows(processedRows);
        } catch (error) {
            showError('Failed to fetch subject performance');
        } finally {
            setLoading(false);
        }
    };

    const getOrdinal = (n: number) => {
        if (n === 0) return '-';
        const s = ["th", "st", "nd", "rd"],
              v = n % 100;
        return n + (s[(v - 20) % 10] || s[v] || s[0]);
    };

    const handleExport = () => {
        if (rows.length === 0) return;
        const subject = subjects.find(s => s.id === selectedSubject)?.name || 'Subject';

        const exportData = rows.map(r => {
            const row: any = {
                'POS': getOrdinal(r.position),
                'Student Name': r.studentName,
                'Admission No': r.admissionNumber,
            };
            assessments.forEach(ass => {
                row[ass.name] = r.scores[ass.id] || 0;
            });
            row['Total'] = r.total;
            
            if (isThirdTerm) {
                row['1st Term'] = r.cumulative?.term1 || 0;
                row['2nd Term'] = r.cumulative?.term2 || 0;
                row['CUM. Total'] = (r.cumulative?.term1 || 0) + (r.cumulative?.term2 || 0) + r.total;
                row['CUM. Avg'] = (((r.cumulative?.term1 || 0) + (r.cumulative?.term2 || 0) + r.total) / 3).toFixed(1);
            }

            row['Subj High'] = subjectStats?.high || 0;
            row['Subj Low'] = subjectStats?.low || 0;
            row['Grade'] = r.grade;
            row['Remark'] = r.remark;
            return row;
        });

        const ws = utils.json_to_sheet(exportData);
        const wb = utils.book_new();
        utils.book_append_sheet(wb, ws, "Sheet1");
        writeFile(wb, `${subject}_Broadsheet.xlsx`);
        showSuccess('Exported successfully');
    };

    return (
        <div className="p-6 space-y-6 bg-gray-50 dark:bg-gray-900 min-h-screen">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Subject Broadsheet</h1>
                    <p className="text-sm text-gray-500 dark:text-gray-400">View student performance in a specific subject.</p>
                </div>
                <button
                    onClick={handleExport}
                    disabled={rows.length === 0}
                    className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-shadow shadow-sm text-sm font-medium disabled:opacity-50"
                >
                    <Download className="w-4 h-4" />
                    Export Excel
                </button>
            </div>

            {/* Filters */}
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm grid grid-cols-1 md:grid-cols-4 gap-6">
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Term</label>
                    <select
                        className="w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                        value={selectedTerm}
                        onChange={(e) => setSelectedTerm(e.target.value)}
                    >
                        <option value="">All Terms</option>
                        {terms.map(t => <option key={t.id} value={t.name}>{t.name}</option>)}
                    </select>
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Exam Group</label>
                    <select
                        className="w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                        value={selectedGroup}
                        onChange={(e) => setSelectedGroup(e.target.value)}
                    >
                        <option value="">Select Group</option>
                        {filteredGroups.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
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
                        {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Subject</label>
                    <select
                        className="w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                        value={selectedSubject}
                        onChange={(e) => setSelectedSubject(e.target.value)}
                    >
                        <option value="">Select Subject</option>
                        {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                    </select>
                </div>
            </div>

            {/* Subject Summary */}
            {subjectStats && rows.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-in fade-in slide-in-from-top-4 duration-500">
                    <div className="bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm flex items-center gap-4">
                        <div className="p-3 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 rounded-lg">
                            <Trophy className="w-6 h-6" />
                        </div>
                        <div>
                            <p className="text-xs text-gray-500 uppercase font-bold tracking-wider">Highest Score</p>
                            <p className="text-2xl font-black text-gray-900 dark:text-white">{subjectStats.high}</p>
                        </div>
                    </div>
                    <div className="bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm flex items-center gap-4">
                        <div className="p-3 bg-rose-50 dark:bg-rose-900/20 text-rose-600 rounded-lg">
                            <TrendingUp className="w-6 h-6 rotate-180" />
                        </div>
                        <div>
                            <p className="text-xs text-gray-500 uppercase font-bold tracking-wider">Lowest Score</p>
                            <p className="text-2xl font-black text-gray-900 dark:text-white">{subjectStats.low}</p>
                        </div>
                    </div>
                    <div className="bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm flex items-center gap-4">
                        <div className="p-3 bg-blue-50 dark:bg-blue-900/20 text-blue-600 rounded-lg">
                            <Filter className="w-6 h-6" />
                        </div>
                        <div>
                            <p className="text-xs text-gray-500 uppercase font-bold tracking-wider">Subject Average</p>
                            <p className="text-2xl font-black text-gray-900 dark:text-white">{subjectStats.avg.toFixed(1)}</p>
                        </div>
                    </div>
                </div>
            )}

            {/* Table */}
            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
                {loading ? (
                    <div className="p-12 text-center text-gray-400">Loading analysis...</div>
                ) : rows.length === 0 ? (
                    <div className="p-12 text-center text-gray-400">Select filters to view subject performance.</div>
                ) : (
                    <>
                        <table className="w-full text-sm text-left">
                            <thead className="bg-gray-50 dark:bg-gray-900 text-gray-500 dark:text-gray-400 uppercase tracking-wider font-bold text-[10px]">
                                <tr>
                                    <th className="px-6 py-3 text-center">POS</th>
                                    <th className="px-6 py-3">Student</th>
                                    {assessments.map(ass => (
                                        <th key={ass.id} className="px-6 py-3 text-center">{ass.name} ({ass.maxMarks})</th>
                                    ))}
                                    <th className="px-6 py-3 text-center text-primary-600">Total</th>
                                    {isThirdTerm && (
                                        <>
                                            <th className="px-6 py-3 text-center border-l border-gray-200 dark:border-gray-700">1st T</th>
                                            <th className="px-6 py-3 text-center">2nd T</th>
                                            <th className="px-6 py-3 text-center bg-primary-50 dark:bg-primary-900/10">CUM. Total</th>
                                            <th className="px-6 py-3 text-center bg-primary-50 dark:bg-primary-900/10">CUM. Avg</th>
                                        </>
                                    )}
                                    <th className="px-6 py-3 text-center text-emerald-600">Subj High</th>
                                    <th className="px-6 py-3 text-center text-rose-600">Subj Low</th>
                                    <th className="px-6 py-3 text-center">Grade</th>
                                    <th className="px-6 py-3">Remark</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                                {rows.slice((currentPage - 1) * pageSize, currentPage * pageSize).map((row) => {
                                    const cumTotal = (row.cumulative?.term1 || 0) + (row.cumulative?.term2 || 0) + row.total;
                                    const cumAvg = cumTotal / 3;

                                    return (
                                    <tr key={row.studentId} className="hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors">
                                        <td className="px-6 py-4 text-center font-bold text-primary-600">{getOrdinal(row.position)}</td>
                                        <td className="px-6 py-4">
                                            <div className="font-semibold text-gray-900 dark:text-white">{row.studentName}</div>
                                            <div className="text-[10px] text-gray-400">{row.admissionNumber}</div>
                                        </td>
                                        {assessments.map(ass => (
                                            <td key={ass.id} className="px-6 py-4 text-center">{row.scores[ass.id] || 0}</td>
                                        ))}
                                        <td className="px-6 py-4 text-center font-black text-primary-700 dark:text-primary-400">{row.total}</td>
                                        {isThirdTerm && (
                                            <>
                                                <td className="px-6 py-4 text-center border-l border-gray-100 dark:border-gray-800 text-gray-400">{row.cumulative?.term1 || 0}</td>
                                                <td className="px-6 py-4 text-center text-gray-400">{row.cumulative?.term2 || 0}</td>
                                                <td className="px-6 py-4 text-center font-bold bg-primary-50/30 dark:bg-primary-900/5">{cumTotal}</td>
                                                <td className="px-6 py-4 text-center font-black text-primary-600 bg-primary-50/50 dark:bg-primary-900/10">{cumAvg.toFixed(1)}</td>
                                            </>
                                        )}
                                        <td className="px-6 py-4 text-center font-bold text-emerald-600 dark:text-emerald-400">
                                            {subjectStats?.high || '-'}
                                        </td>
                                        <td className="px-6 py-4 text-center font-bold text-rose-600 dark:text-rose-400">
                                            {subjectStats?.low || '-'}
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <span className="px-2 py-1 rounded bg-primary-50 dark:bg-primary-900/20 text-primary-700 font-bold">{row.grade}</span>
                                        </td>
                                        <td className="px-6 py-4 text-[11px] font-bold text-gray-500 uppercase">{row.remark}</td>
                                    </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                        
                        <div className="border-t border-gray-100 dark:border-gray-800/50 bg-gray-50/30 dark:bg-gray-800/20">
                            <TablePagination 
                                currentPage={currentPage}
                                totalItems={rows.length}
                                pageSize={pageSize}
                                onPageChange={(page) => {
                                    setCurrentPage(page);
                                    window.scrollTo({ top: 0, behavior: 'smooth' });
                                }}
                            />
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};

export default SubjectBroadsheetPage;
