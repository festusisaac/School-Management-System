import { useState, useEffect, useMemo } from 'react';
import { Download, Search, Filter, Printer } from 'lucide-react';
import { useToast } from '../../../context/ToastContext';
import { examinationService, ExamGroup } from '../../../services/examinationService';
import api from '../../../services/api';
import { utils, writeFile } from 'xlsx';
import { TablePagination } from '../../../components/ui/TablePagination';
import { identifyTerm, createIdLookupMap, groupById } from '../../../utils/reportingUtils';
import { useSystem } from '../../../context/SystemContext';
import { systemService, AcademicTerm } from '../../../services/systemService';
import { useSearchParams } from 'react-router-dom';

interface BroadsheetRow {
    studentId: string;
    studentName: string;
    admissionNumber: string;
    totalScore: number;
    averageScore: number;
    position: number;
    subjectScores: Record<string, number>; // subjectName -> score
    cumulative?: {
        term1: number;
        term2: number;
    };
}

const ClassBroadsheetPage = () => {
    const [searchParams] = useSearchParams();

    const [groups, setGroups] = useState<ExamGroup[]>([]);
    const [classes, setClasses] = useState<any[]>([]);

    const [selectedGroup, setSelectedGroup] = useState(searchParams.get('examGroupId') || '');
    const [selectedClass, setSelectedClass] = useState(searchParams.get('classId') || '');

    const { settings } = useSystem();
    const [terms, setTerms] = useState<AcademicTerm[]>([]);
    const [selectedTerm, setSelectedTerm] = useState<string>(searchParams.get('termName') || settings?.activeTermName || '');

    const [loading, setLoading] = useState(false);
    const [rawData, setRawData] = useState<{
        students: any[];
        allSubjects: any[];
        broadsheet: any;
    } | null>(null);

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
                const [g, c] = await Promise.all([
                    examinationService.getExamGroups(),
                    api.getClasses(),
                ]);
                setGroups(g || []);
                setClasses(c || []);

                // Select matching group if possible
                const sessionToUse = settings?.activeSessionName;
                const termToUse = selectedTerm || settings?.activeTermName;

                if (g?.length > 0) {
                    const filtered = g.filter(group =>
                        (!sessionToUse || group.academicYear === sessionToUse) &&
                        (!termToUse || group.term === termToUse)
                    );
                    if (!searchParams.get('examGroupId')) {
                        if (filtered.length > 0) {
                            setSelectedGroup(filtered[0].id);
                        } else {
                            setSelectedGroup(g[0].id);
                        }
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

    // Filtered Groups for Selection
    const filteredGroups = groups.filter(g =>
        (g.academicYear === settings?.activeSessionName) &&
        (!selectedTerm || g.term === selectedTerm)
    );

    useEffect(() => {
        if (selectedGroup && selectedClass) {
            fetchBroadsheetData();
        } else {
            setRawData(null);
        }
        setCurrentPage(1); // Reset page on filter change
    }, [selectedGroup, selectedClass]);

    const fetchBroadsheetData = async () => {
        setLoading(true);
        try {
            const [students, allSubjects, broadsheet] = await Promise.all([
                api.getStudents({ classId: selectedClass, limit: 1000 }),
                api.getSubjects(),
                examinationService.getBroadsheet(selectedClass, selectedGroup)
            ]);

            setRawData({
                students: students || [],
                allSubjects: allSubjects || [],
                broadsheet: broadsheet || {}
            });
        } catch (error) {
            console.error('Broadsheet Fetch Error:', error);
            showError('Failed to fetch broadsheet data');
            setRawData(null);
        } finally {
            setLoading(false);
        }
    };

    // HIGH PERFORMANCE PROCESSING
    const { rows, subjects } = useMemo(() => {
        if (!rawData) return { rows: [], subjects: [] };
        const { students, allSubjects, broadsheet } = rawData;

        // Interface for results returned in the broadsheet
        interface BroadsheetResult {
            studentId: string;
            totalScore: string | number;
            averageScore: string | number;
            position: number;
        }

        const termResults = (broadsheet.results || []) as BroadsheetResult[];
        const subjectScoresRaw = broadsheet.subjectScores || [];
        const cumulativeOverallResults = broadsheet.cumulativeOverallResults || [];

        // 1. Create Lookup Maps (O(1))
        const subjectLookup = createIdLookupMap(allSubjects, 'id');
        const termResultMap = createIdLookupMap<BroadsheetResult>(termResults, 'studentId');
        
        const cumulativeOverallMap = new Map<string, { term1: number; term2: number }>();
        cumulativeOverallResults.forEach((r: any) => {
            const sId = (r.studentId || r.studentid)?.toString();
            if (!sId) return;
            const existing = cumulativeOverallMap.get(sId) || { term1: 0, term2: 0 };
            const term = identifyTerm(r.examGroup?.term);
            if (term === 'first') existing.term1 = parseFloat(r.totalScore || 0);
            else if (term === 'second') existing.term2 = parseFloat(r.totalScore || 0);
            cumulativeOverallMap.set(sId, existing);
        });

        // 2. Identify and Sort Subjects
        const scheduledSubjectIds = Array.from(new Set(subjectScoresRaw.map((s: any) => (s.subjectId || s.subjectid)?.toString()))).filter(Boolean) as string[];
        const subjectNames = scheduledSubjectIds
            .map(id => (subjectLookup.get(id) as any)?.name || 'Unknown')
            .sort();

        // 3. Map subjectId to Name
        const idToNameMap = new Map<string, string>();
        scheduledSubjectIds.forEach(id => idToNameMap.set(id, (subjectLookup.get(id) as any)?.name || 'Unknown'));

        // 4. Pre-group scores by student (O(N))
        const studentSubjectMap = new Map<string, Record<string, number>>();
        subjectScoresRaw.forEach((item: any) => {
            const sId = (item.studentId || item.studentid)?.toString();
            const subjId = (item.subjectId || item.subjectid)?.toString();
            if (!sId || !subjId) return;

            const rawScore = item.totalSubjectScore || item.totalsubjectscore || 0;
            const subjName = idToNameMap.get(subjId) || 'Unknown';
            
            if (!studentSubjectMap.has(sId)) studentSubjectMap.set(sId, {});
            studentSubjectMap.get(sId)![subjName] = parseFloat(rawScore);
        });

        // 5. Merge Data across all students
        const processedRows: BroadsheetRow[] = students.map((student: any) => {
            const sId = student.id?.toString();
            const termResult = termResultMap.get(sId);
            const scores = studentSubjectMap.get(sId) || {};
            const cumulative = cumulativeOverallMap.get(sId) || { term1: 0, term2: 0 };

            let calculatedTotal = 0;
            let subjectCount = 0;
            // Use for...in for performance in hot loop
            for (const key in scores) {
                calculatedTotal += scores[key];
                subjectCount++;
            }

            return {
                studentId: sId,
                studentName: `${student.firstName} ${student.lastName}`,
                admissionNumber: student.admissionNumber || student.admissionNo || 'N/A',
                totalScore: termResult ? parseFloat(termResult.totalScore.toString()) : calculatedTotal,
                averageScore: termResult ? parseFloat(termResult.averageScore.toString()) : (subjectCount > 0 ? calculatedTotal / subjectCount : 0),
                position: termResult?.position || 0, 
                subjectScores: scores,
                cumulative
            };
        });

        // 6. Sort and Rank (O(N log N))
        processedRows.sort((a, b) => b.totalScore - a.totalScore);
        
        // Always ensure positions are correct based on totalScore
        let currentRank = 1;
        processedRows.forEach((row, index) => {
            if (index > 0 && row.totalScore < processedRows[index - 1].totalScore) {
                currentRank = index + 1;
            }
            row.position = currentRank;
        });

        return { rows: processedRows, subjects: subjectNames };
    }, [rawData]);

    const handleExport = () => {
        if (rows.length === 0) return;

        // Flatten for Excel
        const exportData = rows.map(r => {
            const row: any = {
                'POS': getOrdinal(r.position),
                'Student Name': r.studentName,
                'Admission No': r.admissionNumber,
                ...r.subjectScores,
                'Total': r.totalScore,
            };
            
            if (isThirdTerm) {
                row['1st Term'] = r.cumulative?.term1 || 0;
                row['2nd Term'] = r.cumulative?.term2 || 0;
                row['CUM. Total'] = (r.cumulative?.term1 || 0) + (r.cumulative?.term2 || 0) + r.totalScore;
                row['CUM. Avg'] = (((r.cumulative?.term1 || 0) + (r.cumulative?.term2 || 0) + r.totalScore) / 3).toFixed(1);
            }

            row['Average'] = parseFloat(r.averageScore.toString()).toFixed(1);
            return row;
        });

        const ws = utils.json_to_sheet(exportData);
        const wb = utils.book_new();
        utils.book_append_sheet(wb, ws, "Broadsheet");
        writeFile(wb, `Broadsheet_${new Date().toISOString().split('T')[0]}.xlsx`);
        showSuccess('Broadsheet exported');
    };

    const handleBulkPrint = () => {
        // Redirect to a bulk print version of report card page
        window.open(`/examination/reports/report-card/bulk?classId=${selectedClass}&examGroupId=${selectedGroup}`, '_blank');
    };

    const getOrdinal = (n: number) => {
        if (n === 0) return '-';
        const s = ["th", "st", "nd", "rd"],
              v = n % 100;
        return n + (s[(v - 20) % 10] || s[v] || s[0]);
    };

    return (
        <div className="p-6 space-y-6 bg-gray-50 dark:bg-gray-900 min-h-screen">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Broadsheet</h1>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Master accumulation sheet for class performance.</p>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={handleBulkPrint}
                        disabled={rows.length === 0}
                        className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-shadow shadow-sm text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <Printer className="w-4 h-4" />
                        Print All
                    </button>
                    <button
                        onClick={handleExport}
                        disabled={rows.length === 0}
                        className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-shadow shadow-sm text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <Download className="w-4 h-4" />
                        Export Excel
                    </button>
                </div>
            </div>

            {/* Filters */}
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm grid grid-cols-1 md:grid-cols-3 gap-6">


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
            </div>

            {/* Main Content */}
            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden min-h-[400px] grid grid-cols-1 w-full">
                {loading ? (
                    <div className="flex flex-col items-center justify-center h-64 text-gray-400">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mb-3"></div>
                        <p className="text-sm font-medium">Compiling master sheet...</p>
                    </div>
                ) : !selectedGroup || !selectedClass ? (
                    <div className="flex flex-col items-center justify-center h-64 text-center p-8 text-gray-400">
                        <Search className="w-12 h-12 mb-4 opacity-10" />
                        <p className="font-medium text-gray-900 dark:text-white">Ready to Compile</p>
                        <p className="text-sm mt-1">Select an Exam Group and Class to generate the broadsheet.</p>
                    </div>
                ) : rows.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-64 text-center p-8 text-gray-400">
                        <Filter className="w-12 h-12 mb-4 opacity-10" />
                        <p className="font-medium text-gray-900 dark:text-white">No Result Data</p>
                        <p className="text-sm mt-1">No processed results found for this selection. Have you processed the results yet?</p>
                    </div>
                ) : (
                    <div className="w-full overflow-x-auto">
                        <table className="w-full text-sm text-left border-collapse">
                            <thead className="bg-gray-50 dark:bg-gray-900 text-gray-500 dark:text-gray-400 border-b border-gray-200 dark:border-gray-700 whitespace-nowrap">
                                <tr>
                                    <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider sticky left-0 bg-gray-50 dark:bg-gray-900 z-20 w-16 text-center border-r border-gray-200 dark:border-gray-700 shadow-[2px_0_5px_rgba(0,0,0,0.05)]">POS</th>
                                    <th className="px-6 py-3 text-xs font-semibold uppercase tracking-wider min-w-[250px] sticky left-16 bg-gray-50 dark:bg-gray-900 z-20 border-r border-gray-200 dark:border-gray-700 shadow-[2px_0_5px_rgba(0,0,0,0.05)]">Student Information</th>

                                    {subjects.map(subj => (
                                        <th key={subj} className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wider min-w-[100px] border-r border-gray-100 dark:border-gray-700">
                                            {subj}
                                        </th>
                                    ))}

                                    <th className="px-4 py-3 text-center text-xs font-bold uppercase tracking-wider bg-primary-50 dark:bg-primary-900/10 min-w-[80px]">Total</th>
                                    {isThirdTerm && (
                                        <>
                                            <th className="px-4 py-3 text-center text-xs font-bold uppercase tracking-wider bg-primary-50 dark:bg-primary-900/10 min-w-[80px]">1st T</th>
                                            <th className="px-4 py-3 text-center text-xs font-bold uppercase tracking-wider bg-primary-50 dark:bg-primary-900/10 min-w-[80px]">2nd T</th>
                                            <th className="px-4 py-3 text-center text-xs font-bold uppercase tracking-wider bg-primary-600 text-white min-w-[100px]">CUM. Tot</th>
                                            <th className="px-4 py-3 text-center text-xs font-bold uppercase tracking-wider bg-primary-600 text-white min-w-[100px]">CUM. Avg</th>
                                        </>
                                    )}
                                    <th className="px-4 py-3 text-center text-xs font-bold uppercase tracking-wider bg-primary-50 dark:bg-primary-900/10 min-w-[80px]">Avg</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 dark:divide-gray-800 whitespace-nowrap">
                            {rows.slice((currentPage - 1) * pageSize, currentPage * pageSize).map((row) => (
                                <tr key={row.studentId} className="hover:bg-gray-50 dark:hover:bg-gray-900/50 transition-colors">
                                    <td className="px-4 py-3 text-center font-black text-primary-600 dark:text-primary-400 sticky left-0 bg-white dark:bg-gray-800 z-10 border-r border-gray-100 dark:border-gray-700 shadow-[2px_0_5px_rgba(0,0,0,0.02)]">
                                        <span className="bg-primary-50 dark:bg-primary-900/20 px-2 py-1 rounded text-[11px]">
                                            {getOrdinal(row.position)}
                                        </span>
                                    </td>
                                    <td className="px-6 py-3 sticky left-16 bg-white dark:bg-gray-800 z-10 border-r border-gray-100 dark:border-gray-700 shadow-[2px_0_5px_rgba(0,0,0,0.02)]">
                                        <div className="flex flex-col">
                                            <span className="font-semibold text-gray-900 dark:text-white">{row.studentName}</span>
                                            <span className="text-xs text-gray-400 font-medium">ID: {row.admissionNumber}</span>
                                        </div>
                                    </td>

                                    {subjects.map(subj => {
                                        const score = row.subjectScores[subj];
                                        return (
                                            <td key={subj} className="px-4 py-3 text-center text-gray-700 dark:text-gray-300 border-r border-gray-50 dark:border-gray-800">
                                                {score !== undefined ? Math.round(score) : '-'}
                                            </td>
                                        );
                                    })}

                                    <td className="px-4 py-3 text-center font-bold text-primary-600 dark:text-primary-400 bg-primary-50/50 dark:bg-primary-900/5">
                                        {Math.round(row.totalScore)}
                                    </td>
                                    {isThirdTerm && (
                                        <>
                                            <td className="px-4 py-3 text-center font-medium text-gray-400 bg-primary-50/20 dark:bg-primary-900/5">
                                                {Math.round(row.cumulative?.term1 || 0)}
                                            </td>
                                            <td className="px-4 py-3 text-center font-medium text-gray-400 bg-primary-50/20 dark:bg-primary-900/5">
                                                {Math.round(row.cumulative?.term2 || 0)}
                                            </td>
                                            <td className="px-4 py-3 text-center font-black text-primary-700 bg-primary-50/80 dark:bg-primary-900/20">
                                                {Math.round((row.cumulative?.term1 || 0) + (row.cumulative?.term2 || 0) + row.totalScore)}
                                            </td>
                                            <td className="px-4 py-3 text-center font-black text-primary-800 bg-primary-100 dark:bg-primary-900/40">
                                                {(((row.cumulative?.term1 || 0) + (row.cumulative?.term2 || 0) + row.totalScore) / 3).toFixed(1)}
                                            </td>
                                        </>
                                    )}
                                    <td className="px-4 py-3 text-center font-bold text-gray-800 dark:text-gray-200 bg-primary-50/50 dark:bg-primary-900/5">
                                        {Number(row.averageScore).toFixed(1)}
                                    </td>
                                </tr>
                            ))}
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
                    </div>
                )}
            </div>
        </div>
    );
};

export default ClassBroadsheetPage;
