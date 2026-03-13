import { useState, useEffect } from 'react';
import { CheckCircle, Globe, Lock, AlertTriangle, ShieldCheck, FileCheck } from 'lucide-react';
import { useToast } from '../../../context/ToastContext';
import { examinationService, ExamGroup, ResultSummary } from '../../../services/examinationService';
import api from '../../../services/api';
import { useSystem } from '../../../context/SystemContext';
import { systemService, AcademicSession, AcademicTerm } from '../../../services/systemService';

const ResultManagementPage = () => {
    const [groups, setGroups] = useState<ExamGroup[]>([]);
    const [classes, setClasses] = useState<any[]>([]);

    const [selectedGroup, setSelectedGroup] = useState('');
    const [selectedClass, setSelectedClass] = useState('');

    const { settings } = useSystem();
    const [sessions, setSessions] = useState<AcademicSession[]>([]);
    const [terms, setTerms] = useState<AcademicTerm[]>([]);
    const [selectedSession, setSelectedSession] = useState<string>(settings?.activeSessionName || '');
    const [selectedTerm, setSelectedTerm] = useState<string>(settings?.activeTermName || '');

    // Status State (Mocked for now as we might not have a dedicated status endpoint yet)
    const [status, setStatus] = useState({
        calculated: false,
        approved: false,
        published: false,
        totalStudents: 0
    });

    const [loading, setLoading] = useState(false);
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
                    } else {
                        setSelectedGroup(g[0].id);
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
            checkStatus();
        }
    }, [selectedGroup, selectedClass]);

    const checkStatus = async () => {
        setLoading(true);
        try {
            // In a real app, we'd fetch the actual status from backend.
            // For now, we'll try to deduce it or just fetch summary to see if data exists.
            const summary = await examinationService.getResultSummary(selectedClass, selectedGroup).catch(() => null) as ResultSummary | null;

            // Mocking logic based on summary existence
            // If summary exists, it's calculated. 
            // We need backend fields for 'isApproved' and 'isPublished', assuming they might exist or we default to false.
            setStatus({
                calculated: !!summary,
                approved: summary?.isApproved || false,
                published: summary?.isPublished || false,
                totalStudents: summary?.totalStudents || 0
            });
        } catch (error) {
            // Silent fail or default status
        } finally {
            setLoading(false);
        }
    };

    const handleApprove = async () => {
        if (!confirm('Are you sure you want to approve these results? This locks the scores.')) return;
        try {
            await examinationService.approveResults(selectedClass, selectedGroup);
            showSuccess('Results approved successfully');
            checkStatus();
        } catch (error) {
            showError('Failed to approve results');
        }
    };

    const handlePublish = async () => {
        if (!confirm('Are you sure you want to publish these results? They will be visible to students/parents.')) return;
        try {
            await examinationService.publishResults(selectedClass, selectedGroup);
            showSuccess('Results published successfully');
            checkStatus();
        } catch (error) {
            showError('Failed to publish results');
        }
    };

    return (
        <div className="p-6 space-y-6 bg-gray-50 dark:bg-gray-900 min-h-screen">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Result Management</h1>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Control the lifecycle of examination results.</p>
                </div>
            </div>

            {/* Filters */}
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm grid grid-cols-1 md:grid-cols-4 gap-6">
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Session</label>
                    <select
                        className="w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
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
                </div>

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
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Step 1: Calculation */}
                <div className={`p-6 rounded-lg border shadow-sm transition-all ${status.calculated
                        ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
                        : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700'
                    }`}>
                    <div className="flex items-center justify-between mb-4">
                        <div className="p-3 bg-white dark:bg-gray-800 rounded-full shadow-sm">
                            <FileCheck className={`w-6 h-6 ${status.calculated ? 'text-green-600' : 'text-gray-400'}`} />
                        </div>
                        <span className="text-xs font-bold uppercase tracking-wider text-gray-500">Step 1</span>
                    </div>
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">Processing</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                        {status.calculated
                            ? `Results processed for ${status.totalStudents} students.`
                            : 'Results have not been processed yet.'}
                    </p>
                    <div className="flex items-center gap-2 text-sm font-medium">
                        {status.calculated ? (
                            <span className="flex items-center gap-2 text-green-700 dark:text-green-400">
                                <CheckCircle className="w-4 h-4" /> Ready
                            </span>
                        ) : (
                            <span className="flex items-center gap-2 text-amber-600 dark:text-amber-400">
                                <AlertTriangle className="w-4 h-4" /> Pending
                            </span>
                        )}
                    </div>
                </div>

                {/* Step 2: Approval */}
                <div className={`p-6 rounded-lg border shadow-sm transition-all ${status.approved
                        ? 'bg-primary-50 dark:bg-primary-900/20 border-primary-200 dark:border-primary-800'
                        : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700'
                    }`}>
                    <div className="flex items-center justify-between mb-4">
                        <div className="p-3 bg-white dark:bg-gray-800 rounded-full shadow-sm">
                            <ShieldCheck className={`w-6 h-6 ${status.approved ? 'text-primary-600' : 'text-gray-400'}`} />
                        </div>
                        <span className="text-xs font-bold uppercase tracking-wider text-gray-500">Step 2</span>
                    </div>
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">Approval</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                        Lock results to prevent further modifications.
                    </p>
                    <button
                        onClick={handleApprove}
                        disabled={!status.calculated || status.approved || loading}
                        className={`w-full py-2 px-4 rounded-lg text-sm font-medium transition-all ${status.approved
                                ? 'bg-primary-100 text-primary-700 cursor-default'
                                : 'bg-primary-600 text-white hover:bg-primary-700 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed'
                            }`}
                    >
                        {status.approved ? 'Approved' : 'Approve Results'}
                    </button>
                </div>

                {/* Step 3: Publishing */}
                <div className={`p-6 rounded-lg border shadow-sm transition-all ${status.published
                        ? 'bg-secondary-50 dark:bg-secondary-900/20 border-secondary-200 dark:border-secondary-800'
                        : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700'
                    }`}>
                    <div className="flex items-center justify-between mb-4">
                        <div className="p-3 bg-white dark:bg-gray-800 rounded-full shadow-sm">
                            <Globe className={`w-6 h-6 ${status.published ? 'text-secondary-600' : 'text-gray-400'}`} />
                        </div>
                        <span className="text-xs font-bold uppercase tracking-wider text-gray-500">Step 3</span>
                    </div>
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">Publishing</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                        Make results visible to students and guardians.
                    </p>
                    <button
                        onClick={handlePublish}
                        disabled={!status.approved || status.published || loading}
                        className={`w-full py-2 px-4 rounded-lg text-sm font-medium transition-all ${status.published
                                ? 'bg-secondary-100 text-secondary-700 cursor-default'
                                : 'bg-secondary-600 text-white hover:bg-secondary-700 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed'
                            }`}
                    >
                        {status.published ? 'Published' : 'Publish Results'}
                    </button>
                </div>
            </div>

            {/* Disclaimer */}
            {(!selectedGroup || !selectedClass) && (
                <div className="flex flex-col items-center justify-center p-8 text-gray-400 border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-lg">
                    <Lock className="w-8 h-8 mb-2" />
                    <p className="text-sm">Select an Exam Group and Class to manage results.</p>
                </div>
            )}
        </div>
    );
};

export default ResultManagementPage;
