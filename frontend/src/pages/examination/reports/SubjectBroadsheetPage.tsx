import { useState, useEffect } from 'react';
import { Download, Trophy, TrendingUp, Filter } from 'lucide-react';
import { useToast } from '../../../context/ToastContext';
import { examinationService, ExamGroup } from '../../../services/examinationService';
import api from '../../../services/api';
import { utils, writeFile } from 'xlsx';
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
    
    const { showError, showSuccess } = useToast();

    useEffect(() => {
        const init = async () => {
            try {
                const [g, c, t, s] = await Promise.all([
                    examinationService.getExamGroups(),
                    api.getClasses(),
                    systemService.getTerms(),
                    api.getSubjects()
                ]);
                setGroups(g || []);
                setClasses(c || []);
                setTerms(t || []);
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

            setAssessments(assessmentTypes || []);
            const subjectEnrichedScores = broadsheetData?.subjectScores || [];

            // Filter marks for this specific subject
            const subjectMarks = (allMarks as any[]).filter(m => m.subjectId === selectedSubject);

            const processedRows: SubjectRow[] = allStudents.map((student: any) => {
                const studentSubjectMarks = subjectMarks.filter(m => m.studentId === student.id);
                const scores: Record<string, number> = {};
                assessmentTypes.forEach(ass => {
                    const m = studentSubjectMarks.find(mark => mark.assessmentTypeId === ass.id);
                    scores[ass.id] = m ? m.score : 0;
                });

                // Use backend enriched data for grade/remark/total
                const enriched = subjectEnrichedScores.find((s: any) => s.studentId === student.id && s.subjectId === selectedSubject);

                return {
                    studentId: student.id,
                    studentName: `${student.firstName} ${student.lastName}`,
                    admissionNumber: student.admissionNo || student.admissionNumber || 'N/A',
                    scores,
                    total: enriched?.totalSubjectScore || 0,
                    grade: enriched?.grade || 'F',
                    remark: enriched?.remark || 'VERY POOR',
                    position: enriched?.positionInSubject || 0
                };
            });

            const subjectStats = broadsheetData?.subjectStats || [];
            const currentSubjectStats = subjectStats.find((s: any) => s.subjectId === selectedSubject);
            
            if (currentSubjectStats) {
                setSubjectStats({
                    high: parseFloat(currentSubjectStats.highestScore),
                    low: parseFloat(currentSubjectStats.lowestScore),
                    avg: parseFloat(currentSubjectStats.averageScore)
                });
            } else {
                setSubjectStats(null);
            }

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
                    <table className="w-full text-sm text-left">
                        <thead className="bg-gray-50 dark:bg-gray-900 text-gray-500 dark:text-gray-400 uppercase tracking-wider font-bold text-[10px]">
                            <tr>
                                <th className="px-6 py-3 text-center">POS</th>
                                <th className="px-6 py-3">Student</th>
                                {assessments.map(ass => (
                                    <th key={ass.id} className="px-6 py-3 text-center">{ass.name} ({ass.maxMarks})</th>
                                ))}
                                <th className="px-6 py-3 text-center text-primary-600">Total</th>
                                <th className="px-6 py-3 text-center text-emerald-600">Subj High</th>
                                <th className="px-6 py-3 text-center text-rose-600">Subj Low</th>
                                <th className="px-6 py-3 text-center">Grade</th>
                                <th className="px-6 py-3">Remark</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                            {rows.map((row) => (
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
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
};

export default SubjectBroadsheetPage;
