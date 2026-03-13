import { useState, useEffect } from 'react';
import { CheckCircle, AlertTriangle } from 'lucide-react';
import { useToast } from '../../../context/ToastContext';
import { examinationService, ExamGroup } from '../../../services/examinationService';
import api from '../../../services/api';
import { useSystem } from '../../../context/SystemContext';
import { systemService, AcademicSession, AcademicTerm } from '../../../services/systemService';

const ApprovalPage = () => {
    const [groups, setGroups] = useState<ExamGroup[]>([]);
    const [classes, setClasses] = useState<any[]>([]);
    const [selectedGroup, setSelectedGroup] = useState('');
    const [selectedClass, setSelectedClass] = useState('');

    const { settings } = useSystem();
    const [sessions, setSessions] = useState<AcademicSession[]>([]);
    const [terms, setTerms] = useState<AcademicTerm[]>([]);
    const [selectedSession, setSelectedSession] = useState<string>(settings?.activeSessionName || '');
    const [selectedTerm, setSelectedTerm] = useState<string>(settings?.activeTermName || '');
    const [summary, setSummary] = useState<any>(null);
    const [loading, setLoading] = useState(false);
    const [processing, setProcessing] = useState(false);

    const { showSuccess, showError } = useToast();

    useEffect(() => {
        const init = async () => {
            try {
                const [g, c, s, t] = await Promise.all([
                    examinationService.getExamGroups(),
                    api.getClasses(),
                    systemService.getSessions(),
                    systemService.getTerms()
                ]);
                setGroups(g || []);
                setClasses(c || []);
                setSessions(s || []);
                setTerms(t || []);

                // Select matching group if possible
                const sessionToUse = selectedSession || settings?.activeSessionName;
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

    // Filtered Groups for Selection
    const filteredGroups = groups.filter(g =>
        (!selectedSession || g.academicYear === selectedSession) &&
        (!selectedTerm || g.term === selectedTerm)
    );

    useEffect(() => {
        if (selectedGroup && selectedClass) {
            fetchSummary();
        } else {
            setSummary(null);
        }
    }, [selectedGroup, selectedClass]);

    const fetchSummary = async () => {
        setLoading(true);
        try {
            const res = await examinationService.getResultSummary(selectedClass, selectedGroup);
            setSummary(res);
        } catch (error) {
            showError('Failed to fetch summary');
        } finally {
            setLoading(false);
        }
    };

    const handleApprove = async () => {
        if (!confirm('Are you sure you want to approve these results? This will lock them for further editing.')) return;

        setProcessing(true);
        try {
            await examinationService.approveResults(selectedClass, selectedGroup);
            showSuccess('Results approved successfully');
            fetchSummary(); // Refresh
        } catch (error) {
            showError('Failed to approve results');
        } finally {
            setProcessing(false);
        }
    };

    return (
        <div className="p-6 space-y-6 bg-gray-50 dark:bg-gray-900 min-h-screen">
            <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Result Approval</h1>
                <p className="text-gray-500 dark:text-gray-400">Review and approve processed results.</p>
            </div>

            <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm grid grid-cols-1 md:grid-cols-4 gap-4">
                <select
                    className="rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                    value={selectedSession}
                    onChange={(e) => {
                        setSelectedSession(e.target.value);
                        setSelectedGroup('');
                    }}
                >
                    <option value="">All Sessions</option>
                    {sessions.map(s => (
                        <option key={s.id} value={s.name}>{s.name}</option>
                    ))}
                </select>

                <select
                    className="rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
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

                <select
                    className="rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                    value={selectedGroup}
                    onChange={(e) => setSelectedGroup(e.target.value)}
                >
                    <option value="">Select Exam Group</option>
                    {filteredGroups.map(g => (
                        <option key={g.id} value={g.id}>{g.name}</option>
                    ))}
                </select>

                <select
                    className="rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                    value={selectedClass}
                    onChange={(e) => setSelectedClass(e.target.value)}
                >
                    <option value="">Select Class</option>
                    {classes.map(c => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                </select>
            </div>

            {selectedGroup && selectedClass && (
                <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
                    {loading ? (
                        <div className="flex justify-center p-8">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
                        </div>
                    ) : summary ? (
                        <div className="space-y-6">
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                                    <div className="text-sm text-gray-500 dark:text-gray-400">Total Students</div>
                                    <div className="text-2xl font-bold text-gray-900 dark:text-white">{summary.total}</div>
                                </div>
                                <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                                    <div className="text-sm text-yellow-600 dark:text-yellow-400">Draft Status</div>
                                    <div className="text-2xl font-bold text-yellow-700 dark:text-yellow-300">{summary.drafted}</div>
                                </div>
                                <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                                    <div className="text-sm text-green-600 dark:text-green-400">Approved</div>
                                    <div className="text-2xl font-bold text-green-700 dark:text-green-300">{summary.approved}</div>
                                </div>
                                <div className="p-4 bg-primary-50 dark:bg-primary-900/20 rounded-lg">
                                    <div className="text-sm text-primary-600 dark:text-primary-400">Published</div>
                                    <div className="text-2xl font-bold text-primary-700 dark:text-primary-300">{summary.published}</div>
                                </div>
                            </div>

                            {summary.drafted > 0 ? (
                                <div className="flex flex-col gap-4 items-center justify-center p-8 border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-lg">
                                    <AlertTriangle className="w-12 h-12 text-yellow-500" />
                                    <div className="text-center">
                                        <h3 className="text-lg font-medium text-gray-900 dark:text-white">Ready for Approval</h3>
                                        <p className="text-gray-500 dark:text-gray-400 max-w-md">
                                            There are {summary.drafted} students with draft results. Review the broadsheet before approving.
                                        </p>
                                    </div>
                                    <button
                                        onClick={handleApprove}
                                        disabled={processing}
                                        className="px-6 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors flex items-center gap-2"
                                    >
                                        {processing ? 'Approving...' : (
                                            <>
                                                <CheckCircle className="w-4 h-4" />
                                                Approve All Results
                                            </>
                                        )}
                                    </button>
                                </div>
                            ) : (
                                <div className="flex flex-col items-center justify-center p-8">
                                    <CheckCircle className="w-12 h-12 text-green-500 mb-4" />
                                    <h3 className="text-lg font-medium text-gray-900 dark:text-white">All Results Approved</h3>
                                    <p className="text-gray-500 dark:text-gray-400">No pending drafts for this class.</p>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="text-center text-gray-500">No data found.</div>
                    )}
                </div>
            )}
        </div>
    );
};

export default ApprovalPage;
