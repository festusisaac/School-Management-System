import { useState, useEffect } from 'react';
import { 
    CheckCircle, 
    Globe, 
    ShieldCheck, 
    ArrowRight,
    Info,
    FileText,
    RefreshCw,
    Search,
    Printer
} from 'lucide-react';
import { useToast } from '../../../context/ToastContext';
import { examinationService, ExamGroup } from '../../../services/examinationService';
import { useSystem } from '../../../context/SystemContext';
import { systemService, AcademicTerm } from '../../../services/systemService';
import { twMerge } from 'tailwind-merge';
import { Link } from 'react-router-dom';
import { Modal } from '../../../components/ui/modal';
import { AlertTriangle } from 'lucide-react';

const ResultManagementPage = () => {
    const [groups, setGroups] = useState<ExamGroup[]>([]);
    const [selectedGroup, setSelectedGroup] = useState('');
    const [searchTerm, setSearchTerm] = useState('');

    const { settings } = useSystem();
    const [terms, setTerms] = useState<AcademicTerm[]>([]);
    const [selectedTerm, setSelectedTerm] = useState<string>(settings?.activeTermName || '');

    const [globalSummary, setGlobalSummary] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [processingId, setProcessingId] = useState<string | null>(null);
    
    const [confirmAction, setConfirmAction] = useState<{
        isOpen: boolean;
        type: 'approve' | 'publish' | 'withhold' | null;
        classId: string | null;
        title: string;
        message: string;
    }>({ isOpen: false, type: null, classId: null, title: '', message: '' });

    const { showSuccess, showError } = useToast();

    useEffect(() => {
        const init = async () => {
            setLoading(true);
            try {
                const [g, t] = await Promise.all([
                    examinationService.getExamGroups(),
                    systemService.getTerms()
                ]);
                setGroups(g || []);
                setTerms(t || []);
            } catch (e) {
                showError('Failed to load initial data');
            } finally {
                setLoading(false);
            }
        };
        init();
    }, []);

    // Sync selectedTerm with settings
    useEffect(() => {
        if (!selectedTerm && settings?.activeTermName) {
            setSelectedTerm(settings.activeTermName);
        }
    }, [settings?.activeTermName, selectedTerm]);

    // Auto-select exam group based on session and term
    useEffect(() => {
        if (groups.length > 0) {
            const termToUse = selectedTerm || settings?.activeTermName;
            const sessionToUse = settings?.activeSessionName;

            const filtered = groups.filter(group =>
                (!sessionToUse || group.academicYear === sessionToUse) &&
                (!termToUse || group.term === termToUse)
            );

            if (filtered.length > 0) {
                // Only change if current selectedGroup is not valid for this filter
                const isValid = filtered.some(f => f.id === selectedGroup);
                if (!isValid) {
                    setSelectedGroup(filtered[0].id);
                }
            } else if (selectedGroup) {
                setSelectedGroup('');
            }
        }
    }, [groups, selectedTerm, settings?.activeSessionName, settings?.activeTermName]);

    useEffect(() => {
        if (selectedGroup) {
            fetchGlobalSummary();
        } else {
            setGlobalSummary([]);
        }
    }, [selectedGroup]);

    const fetchGlobalSummary = async () => {
        setLoading(true);
        try {
            const res = await examinationService.getGlobalSummary(selectedGroup);
            setGlobalSummary(res || []);
        } catch (error) {
            console.error('Global summary fetch error:', error);
            showError('Failed to fetch school results status');
        } finally {
            setLoading(false);
        }
    };

    const handleProcess = async (classId: string) => {
        const item = globalSummary.find(s => s.id === classId);
        if (item && item.markedExams === 0) {
            showError(`Cannot process ${item.name}: No marks have been entered for this class yet.`);
            return;
        }

        setProcessingId(`process-${classId}`);
        try {
            await examinationService.processResults(classId, selectedGroup);
            showSuccess('Results processed successfully');
            fetchGlobalSummary();
        } catch (error) {
            showError('Failed to process results');
        } finally {
            setProcessingId(null);
        }
    };

    const handleWithhold = async (classId: string) => {
        setProcessingId(`withhold-${classId}`);
        try {
            await examinationService.withholdResults(classId, selectedGroup);
            showSuccess('Results withheld successfully');
            fetchGlobalSummary();
        } catch (error) {
            showError('Failed to withhold results');
        } finally {
            setProcessingId(null);
        }
    };

    const handleApprove = async (classId: string) => {
        setProcessingId(`approve-${classId}`);
        try {
            await examinationService.approveResults(classId, selectedGroup);
            showSuccess('Results approved successfully');
            fetchGlobalSummary();
        } catch (error) {
            showError('Failed to approve results');
        } finally {
            setProcessingId(null);
        }
    };

    const handlePublish = async (classId: string) => {
        setProcessingId(`publish-${classId}`);
        try {
            await examinationService.publishResults(classId, selectedGroup);
            showSuccess('Results published successfully');
            fetchGlobalSummary();
        } catch (error) {
            showError('Failed to publish results');
        } finally {
            setProcessingId(null);
        }
    };

    const executeConfirm = async () => {
        const { type, classId } = confirmAction;
        if (!classId || !type) return;
        
        setConfirmAction(prev => ({ ...prev, isOpen: false }));
        
        if (type === 'approve') await handleApprove(classId);
        else if (type === 'publish') await handlePublish(classId);
        else if (type === 'withhold') await handleWithhold(classId);
    };

    const openConfirmModal = (type: 'approve' | 'publish' | 'withhold', classId: string, title: string, message: string) => {
        setConfirmAction({ isOpen: true, type, classId, title, message });
    };

    const filteredGroups = groups.filter(g =>
        (g.academicYear === settings?.activeSessionName) &&
        (!selectedTerm || g.term === selectedTerm)
    );

    const filteredSummary = globalSummary.filter(item => 
        item.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const stats = {
        totalClasses: globalSummary.length,
        processed: globalSummary.filter(c => c.total > 0).length,
        fullyPublished: globalSummary.filter(c => c.published > 0 && c.drafted === 0 && c.approved === 0).length,
        avgProgress: globalSummary.length > 0 
            ? globalSummary.reduce((acc, curr) => acc + curr.scoreProgress, 0) / globalSummary.length 
            : 0
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Result Management Dashboard</h1>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Monitor and control result processing across the entire school</p>
                </div>
                <div className="flex gap-2">
                    <button 
                        onClick={fetchGlobalSummary}
                        className="p-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                        title="Refresh Dashboard"
                    >
                        <RefreshCw className={twMerge("w-5 h-5", loading && "animate-spin")} />
                    </button>
                </div>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm">
                    <div className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1">Total Classes</div>
                    <div className="text-2xl font-bold text-gray-900 dark:text-white">{stats.totalClasses}</div>
                </div>
                <div className="bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm">
                    <div className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1">Processed</div>
                    <div className="text-2xl font-bold text-green-600 dark:text-green-400">{stats.processed}</div>
                </div>
                <div className="bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm">
                    <div className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1">Score Entry Progress</div>
                    <div className="text-2xl font-bold text-primary-600 dark:text-primary-400">{Math.round(stats.avgProgress)}%</div>
                </div>
                <div className="bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm">
                    <div className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1">Published Classes</div>
                    <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">{stats.fullyPublished}</div>
                </div>
            </div>

            {/* Filters */}
            <div className="bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm flex flex-col md:flex-row gap-4">
                <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4">
                    <select
                        className="rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                        value={selectedTerm}
                        onChange={(e) => {
                            const term = e.target.value;
                            setSelectedTerm(term);
                            const termGroups = groups.filter(g => 
                                (g.academicYear === settings?.activeSessionName) && 
                                (!term || g.term === term)
                            );
                            if (termGroups.length > 0) setSelectedGroup(termGroups[0].id);
                            else setSelectedGroup('');
                        }}
                    >
                        <option value="">All Terms</option>
                        {terms.map(t => <option key={t.id} value={t.name}>{t.name}</option>)}
                    </select>

                    <select
                        className="rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                        value={selectedGroup}
                        onChange={(e) => setSelectedGroup(e.target.value)}
                    >
                        <option value="">Select Exam Group</option>
                        {filteredGroups.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
                    </select>
                </div>
                <div className="relative md:w-64">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input 
                        type="text"
                        placeholder="Search class..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                </div>
            </div>

            {/* Dashboard Table */}
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm border-collapse">
                        <thead>
                            <tr className="bg-gray-50 dark:bg-gray-900/50 border-b border-gray-100 dark:border-gray-700">
                                <th className="px-6 py-4 font-semibold text-gray-700 dark:text-gray-200">Class Name</th>
                                <th className="px-6 py-4 font-semibold text-gray-700 dark:text-gray-200 text-center">Score Entry</th>
                                <th className="px-6 py-4 font-semibold text-gray-700 dark:text-gray-200 text-center">Students</th>
                                <th className="px-6 py-4 font-semibold text-gray-700 dark:text-gray-200">Status & Actions</th>
                                <th className="px-6 py-4 font-semibold text-gray-700 dark:text-gray-200 text-right">Documents</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                            {loading ? (
                                Array(5).fill(0).map((_, i) => (
                                    <tr key={i} className="animate-pulse">
                                        <td colSpan={5} className="px-6 py-4"><div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full"></div></td>
                                    </tr>
                                ))
                            ) : filteredSummary.length > 0 ? (
                                filteredSummary.map((item) => (
                                    <tr key={item.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-900/30 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="font-bold text-gray-900 dark:text-white">{item.name}</div>
                                            <div className="text-[10px] text-gray-500 uppercase mt-0.5">{item.totalExams} Subjects Scheduled</div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex flex-col items-center gap-1.5 min-w-[120px]">
                                                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5 overflow-hidden">
                                                    <div 
                                                        className={twMerge(
                                                            "h-full transition-all duration-500",
                                                            item.scoreProgress === 100 ? "bg-green-500" : "bg-primary-500"
                                                        )}
                                                        style={{ width: `${item.scoreProgress}%` }}
                                                    ></div>
                                                </div>
                                                <span className="text-[10px] font-bold text-gray-600 dark:text-gray-400">
                                                    {item.markedExams}/{item.totalExams} Marks Entered ({Math.round(item.scoreProgress)}%)
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <span className="font-bold text-gray-900 dark:text-white">{item.total}</span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                {/* Process Action */}
                                                <div className="flex flex-col gap-1">
                                                    {item.total > 0 ? (
                                                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 text-[10px] font-bold">
                                                            <CheckCircle className="w-3 h-3" /> Processed
                                                        </span>
                                                    ) : (
                                                        <button 
                                                            onClick={() => handleProcess(item.id)}
                                                            disabled={processingId !== null}
                                                            className="px-3 py-1 bg-primary-600 hover:bg-primary-700 text-white rounded text-[10px] font-bold uppercase transition-colors disabled:opacity-50"
                                                        >
                                                            {processingId === `process-${item.id}` ? '...' : 'Process'}
                                                        </button>
                                                    )}
                                                </div>

                                                <ArrowRight className="w-3 h-3 text-gray-300" />

                                                {/* Approve Action */}
                                                <div className="flex flex-col gap-1">
                                                    {item.total > 0 && item.drafted === 0 ? (
                                                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 text-[10px] font-bold">
                                                            <ShieldCheck className="w-3 h-3" /> Approved
                                                        </span>
                                                    ) : (
                                                        <button 
                                                            onClick={() => openConfirmModal('approve', item.id, 'Approve Results', 'Are you sure you want to approve these results? This will lock them for further editing.')}
                                                            disabled={processingId !== null || item.total === 0}
                                                            className="px-3 py-1 border border-amber-500 text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-900/20 rounded text-[10px] font-bold uppercase transition-colors disabled:opacity-30"
                                                        >
                                                            {processingId === `approve-${item.id}` ? '...' : 'Approve'}
                                                        </button>
                                                    )}
                                                </div>

                                                <ArrowRight className="w-3 h-3 text-gray-300" />

                                                {/* Publish Action */}
                                                <div className="flex flex-col gap-1">
                                                    {item.published > 0 && item.approved === 0 && item.drafted === 0 ? (
                                                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-[10px] font-bold">
                                                            <Globe className="w-3 h-3" /> Published
                                                        </span>
                                                    ) : (
                                                        <button 
                                                            onClick={() => openConfirmModal('publish', item.id, 'Publish Results', 'Are you sure you want to PUBLISH these results? They will be visible to students/parents immediately.')}
                                                            disabled={processingId !== null || (item.total > 0 && item.approved === 0 && item.drafted === 0) || item.total === 0}
                                                            className="px-3 py-1 border border-blue-500 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded text-[10px] font-bold uppercase transition-colors disabled:opacity-30"
                                                        >
                                                            {processingId === `publish-${item.id}` ? '...' : 'Publish'}
                                                        </button>
                                                    )}
                                                </div>
                                                
                                                {/* Re-process / Withhold mini button */}
                                                {item.total > 0 && (
                                                     <button 
                                                        onClick={() => item.published > 0 ? openConfirmModal('withhold', item.id, 'Withhold Results', 'Are you sure you want to WITHHOLD these results? They will be hidden from students/parents.') : handleProcess(item.id)}
                                                        disabled={processingId !== null}
                                                        className={twMerge(
                                                            "p-1 transition-colors",
                                                            item.published > 0 
                                                                ? "text-amber-500 hover:text-amber-600" 
                                                                : "text-gray-400 hover:text-primary-600"
                                                        )}
                                                        title={item.published > 0 ? "Withhold Results (Move to Approved)" : "Re-calculate/Re-process"}
                                                     >
                                                         <RefreshCw className={twMerge(
                                                             "w-3.5 h-3.5", 
                                                             (processingId === `process-${item.id}` || processingId === `withhold-${item.id}`) && "animate-spin"
                                                         )} />
                                                     </button>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <Link 
                                                    to={`/examination/reports/class-broadsheet?classId=${item.id}&examGroupId=${selectedGroup}&termName=${encodeURIComponent(selectedTerm)}`}
                                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-900/50 hover:text-primary-600 transition-all group"
                                                >
                                                    <FileText className="w-4 h-4" />
                                                    <span className="text-xs font-bold">Broadsheet</span>
                                                </Link>
                                                <Link 
                                                    to={`/examination/reports/report-card?classId=${item.id}&examGroupId=${selectedGroup}&termName=${encodeURIComponent(selectedTerm)}`}
                                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-900/50 hover:text-indigo-600 transition-all group"
                                                >
                                                    <Printer className="w-4 h-4" />
                                                    <span className="text-xs font-bold">Cards</span>
                                                </Link>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                                        <Info className="w-8 h-8 mx-auto mb-2 opacity-20" />
                                        <div className="font-medium text-sm">No classes found matching your criteria.</div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Guide */}
            <div className="bg-primary-50/50 dark:bg-primary-900/5 p-4 rounded-xl border border-primary-100 dark:border-primary-900/20 flex gap-4">
                <Info className="w-5 h-5 text-primary-500 shrink-0 mt-0.5" />
                <div className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                    <p className="font-bold text-gray-900 dark:text-white mb-1">Workflow Guide:</p>
                    <ol className="list-decimal list-inside space-y-1 ml-1">
                        <li>Ensure all <b>Score Entries</b> are green (100%).</li>
                        <li>Click <b>Process</b> to aggregate marks and calculate positions.</li>
                        <li>Click <b>Approve</b> after reviewing the broadsheet.</li>
                        <li>Finally, <b>Publish</b> to make results visible in the portal.</li>
                    </ol>
                </div>
            </div>

            {/* Confirmation Modal */}
            <Modal
                isOpen={confirmAction.isOpen}
                onClose={() => setConfirmAction(prev => ({ ...prev, isOpen: false }))}
                title={confirmAction.title}
            >
                <div className="space-y-4">
                    <div className={twMerge(
                        "flex items-center gap-3 p-4 rounded-lg",
                        confirmAction.type === 'publish' ? "bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400" :
                        confirmAction.type === 'withhold' ? "bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400" :
                        "bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400"
                    )}>
                        <AlertTriangle className="w-6 h-6 shrink-0" />
                        <p className="text-sm font-medium">{confirmAction.message}</p>
                    </div>

                    <div className="flex justify-end gap-3 pt-2">
                        <button
                            onClick={() => setConfirmAction(prev => ({ ...prev, isOpen: false }))}
                            className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-800 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={executeConfirm}
                            className={twMerge(
                                "px-4 py-2 text-sm font-medium text-white rounded-lg transition-colors shadow-lg",
                                confirmAction.type === 'publish' ? "bg-blue-600 hover:bg-blue-700 shadow-blue-600/20" :
                                confirmAction.type === 'withhold' ? "bg-red-600 hover:bg-red-700 shadow-red-600/20" :
                                "bg-amber-600 hover:bg-amber-700 shadow-amber-600/20"
                            )}
                        >
                            Confirm Action
                        </button>
                    </div>
                </div>
            </Modal>
        </div>
    );
};

export default ResultManagementPage;
