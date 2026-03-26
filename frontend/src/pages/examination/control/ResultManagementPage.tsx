import { useState, useEffect } from 'react';
import { 
    CheckCircle, 
    Globe, 
    Lock, 
    AlertTriangle, 
    ShieldCheck, 
    FileCheck, 
    LayoutDashboard,
    ArrowRight,
    Info,
    Settings
} from 'lucide-react';
import { useToast } from '../../../context/ToastContext';
import { examinationService, ExamGroup } from '../../../services/examinationService';
import api from '../../../services/api';
import { useSystem } from '../../../context/SystemContext';
import { systemService, AcademicTerm } from '../../../services/systemService';
import { twMerge } from 'tailwind-merge';

const ResultManagementPage = () => {
    const [activeTab, setActiveTab] = useState<'overview' | 'approval' | 'publishing'>('overview');
    const [groups, setGroups] = useState<ExamGroup[]>([]);
    const [classes, setClasses] = useState<any[]>([]);

    const [selectedGroup, setSelectedGroup] = useState('');
    const [selectedClass, setSelectedClass] = useState('');

    const { settings } = useSystem();
    const [terms, setTerms] = useState<AcademicTerm[]>([]);
    const [selectedTerm, setSelectedTerm] = useState<string>(settings?.activeTermName || '');

    const [summary, setSummary] = useState<any>(null);
    const [loading, setLoading] = useState(false);
    const [processing, setProcessing] = useState(false);
    
    const { showSuccess, showError } = useToast();

    useEffect(() => {
        const init = async () => {
            try {
                const [g, c, t] = await Promise.all([
                    examinationService.getExamGroups(),
                    api.getClasses(),
                    systemService.getTerms()
                ]);
                setGroups(g || []);
                setClasses(c || []);
                setTerms(t || []);

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
        if (selectedGroup && selectedClass) {
            fetchSummary();
        } else {
            setSummary(null);
        }
    }, [selectedGroup, selectedClass]);

    const fetchSummary = async () => {
        setLoading(true);
        console.log('Fetching summary for:', { selectedClass, selectedGroup });
        try {
            const res = await examinationService.getResultSummary(selectedClass, selectedGroup);
            console.log('Summary response:', res);
            setSummary(res);
        } catch (error) {
            console.error('Summary fetch error:', error);
            // Silently handle
        } finally {
            setLoading(false);
        }
    };

    const handleProcess = async () => {
        setProcessing(true);
        try {
            await examinationService.processResults(selectedClass, selectedGroup);
            showSuccess('Results processed successfully');
            fetchSummary();
        } catch (error) {
            console.error('Processing error:', error);
            showError('Failed to process results');
        } finally {
            setProcessing(false);
        }
    };

    const handleApprove = async () => {
        if (!confirm('Are you sure you want to approve these results? This will lock them for further editing.')) return;
        setProcessing(true);
        try {
            await examinationService.approveResults(selectedClass, selectedGroup);
            showSuccess('Results approved successfully');
            fetchSummary();
        } catch (error) {
            showError('Failed to approve results');
        } finally {
            setProcessing(false);
        }
    };

    const handlePublish = async () => {
        if (!confirm('Are you sure you want to PUBLISH these results? They will be visible to students/parents immediately.')) return;
        setProcessing(true);
        try {
            await examinationService.publishResults(selectedClass, selectedGroup);
            showSuccess('Results published successfully');
            fetchSummary();
        } catch (error) {
            showError('Failed to publish results');
        } finally {
            setProcessing(false);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Result Management</h1>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Control the lifecycle of examination results</p>
                </div>
            </div>

            {/* Filters */}
            <div className="bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm grid grid-cols-1 md:grid-cols-3 gap-4">
                <select
                    className="rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                    value={selectedTerm}
                    onChange={(e) => {
                        const term = e.target.value;
                        setSelectedTerm(term);
                        
                        // Auto-select the first group of the new term
                        const termGroups = groups.filter(g => 
                            (g.academicYear === settings?.activeSessionName) && 
                            (!term || g.term === term)
                        );
                        if (termGroups.length > 0) {
                            setSelectedGroup(termGroups[0].id);
                        } else {
                            setSelectedGroup('');
                        }
                    }}
                >
                    <option value="">All Terms</option>
                    {terms.map(t => (
                        <option key={t.id} value={t.name}>{t.name}</option>
                    ))}
                </select>

                <select
                    className="rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                    value={selectedGroup}
                    onChange={(e) => setSelectedGroup(e.target.value)}
                >
                    <option value="">Select Exam Group</option>
                    {filteredGroups.map(g => (
                        <option key={g.id} value={g.id}>{g.name}</option>
                    ))}
                </select>

                <select
                    className="rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                    value={selectedClass}
                    onChange={(e) => setSelectedClass(e.target.value)}
                >
                    <option value="">Select Class</option>
                    {classes.map(c => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                </select>
            </div>

            {/* Tabs */}
            <div className="border-b border-gray-200 dark:border-gray-800">
                <nav className="-mb-px flex space-x-8">
                    {[
                        { id: 'overview', label: 'Overview', icon: LayoutDashboard },
                        { id: 'approval', label: 'Review & Approval', icon: ShieldCheck },
                        { id: 'publishing', label: 'Release & Publish', icon: Globe }
                    ].map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id as any)}
                            className={twMerge(
                                "whitespace-nowrap pb-4 px-1 border-b-2 font-medium text-sm transition-colors",
                                activeTab === tab.id
                                    ? "border-primary-500 text-primary-600 dark:text-primary-400"
                                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300"
                            )}
                        >
                            <tab.icon className="w-4 h-4 inline-block mr-2" />
                            {tab.label}
                        </button>
                    ))}
                </nav>
            </div>

            {selectedGroup && selectedClass ? (
                <div className="space-y-6">
                    {/* Stats Grid */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {[
                            { label: 'Total Students', value: summary?.total || 0, icon: FileCheck },
                            { label: 'Drafted', value: summary?.drafted || 0, icon: AlertTriangle, color: 'text-amber-500' },
                            { label: 'Approved', value: summary?.approved || 0, icon: ShieldCheck, color: 'text-green-500' },
                            { label: 'Published', value: summary?.published || 0, icon: Globe, color: 'text-primary-500' }
                        ].map((stat, i) => (
                            <div key={i} className="bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm">
                                <div className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1">{stat.label}</div>
                                <div className="flex items-center justify-between">
                                    <div className="text-xl font-bold text-gray-900 dark:text-white">{loading ? '...' : stat.value}</div>
                                    <stat.icon className={twMerge("w-4 h-4 opacity-50", stat.color)} />
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Tab Content */}
                    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm overflow-hidden">
                        {loading && (
                            <div className="p-12 text-center text-gray-500">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto mb-4"></div>
                                Updating data...
                            </div>
                        )}

                        {!loading && activeTab === 'overview' && (
                            <div className="p-6 md:p-8">
                                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-6 border-b border-gray-100 dark:border-gray-700 pb-3">Lifecycle Progress</h3>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                    <div className={twMerge(
                                        "p-4 rounded-lg border flex flex-col justify-between",
                                        summary ? "bg-green-50/50 border-green-100 dark:bg-green-900/5 dark:border-green-800" : "bg-gray-50 dark:bg-gray-900/30 border-gray-100 dark:border-gray-800"
                                    )}>
                                        <div>
                                            <div className="font-bold text-sm mb-1">1. Processing</div>
                                            <div className="text-xs text-gray-500 mb-3 font-medium">Automatic score calculation</div>
                                        </div>
                                        
                                        <div className="mt-2">
                                            {summary ? (
                                                <div className="flex items-center justify-between gap-2">
                                                    <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300 text-[10px] font-bold uppercase transition-colors">
                                                        <CheckCircle className="w-3 h-3" /> Completed
                                                    </span>
                                                    <button 
                                                        onClick={handleProcess}
                                                        disabled={processing}
                                                        className="text-[10px] font-bold text-primary-600 hover:underline disabled:opacity-50"
                                                    >
                                                        {processing ? '...' : 'Re-process'}
                                                    </button>
                                                </div>
                                            ) : (
                                                <button
                                                    onClick={handleProcess}
                                                    disabled={processing}
                                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary-600 text-white text-[10px] font-bold uppercase hover:bg-primary-700 transition-colors disabled:opacity-50"
                                                >
                                                    {processing ? (
                                                        <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white"></div>
                                                    ) : (
                                                        <><ArrowRight className="w-3 h-3" /> Process Now</>
                                                    )}
                                                </button>
                                            )}
                                        </div>
                                    </div>

                                    <div className={twMerge(
                                        "p-4 rounded-lg border",
                                        summary?.approved > 0 ? "bg-green-50/50 border-green-100 dark:bg-green-900/5 dark:border-green-800" : summary?.drafted > 0 ? "bg-amber-50/50 border-amber-100 dark:bg-amber-900/5 dark:border-amber-800" : "bg-gray-50 dark:bg-gray-900/30 border-gray-100 dark:border-gray-800"
                                    )}>
                                        <div className="font-bold text-sm mb-1">2. Approval</div>
                                        <div className="text-xs text-gray-500 mb-3 font-medium">Verify & lock results</div>
                                        {summary?.approved > 0 ? (
                                            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300 text-[10px] font-bold uppercase transition-colors">
                                                <CheckCircle className="w-3 h-3" /> Approved
                                            </span>
                                        ) : (
                                            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300 text-[10px] font-bold uppercase transition-colors">
                                                <Lock className="w-3 h-3" /> Pending
                                            </span>
                                        )}
                                    </div>

                                    <div className={twMerge(
                                        "p-4 rounded-lg border",
                                        summary?.published > 0 ? "bg-primary-50/50 border-primary-100 dark:bg-primary-900/5 dark:border-primary-800" : "bg-gray-50 dark:bg-gray-900/30 border-gray-100 dark:border-gray-800"
                                    )}>
                                        <div className="font-bold text-sm mb-1">3. Publishing</div>
                                        <div className="text-xs text-gray-500 mb-3 font-medium">Release to portal</div>
                                        {summary?.published > 0 ? (
                                            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-primary-100 dark:bg-primary-900/40 text-primary-700 dark:text-primary-300 text-[10px] font-bold uppercase transition-colors">
                                                <Globe className="w-3 h-3" /> Published
                                            </span>
                                        ) : (
                                            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-500 text-[10px] font-bold uppercase transition-colors">
                                                <Lock className="w-3 h-3" /> Hidden
                                            </span>
                                        )}
                                    </div>
                                </div>
                                <div className="mt-8 p-4 bg-gray-50 dark:bg-gray-900/50 rounded-lg border border-gray-100 dark:border-gray-800 flex gap-4">
                                    <Info className="w-5 h-5 text-primary-500 shrink-0 mt-0.5" />
                                    <p className="text-sm text-gray-600 dark:text-gray-400 font-medium leading-relaxed">
                                        Selecting an exam group and class loads the result summary. Use the tabs above to review and release results.
                                    </p>
                                </div>
                            </div>
                        )}

                        {!loading && activeTab === 'approval' && (
                            <div className="p-6 md:p-8 space-y-6">
                                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-6 border-b border-gray-100 dark:border-gray-700 pb-3">Review & Lock</h3>
                                {summary?.drafted > 0 ? (
                                    <div className="flex flex-col items-center justify-center p-8 border border-amber-100 dark:border-amber-900/20 bg-amber-50/30 dark:bg-amber-900/5 rounded-xl">
                                        <AlertTriangle className="w-10 h-10 text-amber-500 mb-4" />
                                        <h4 className="text-lg font-bold text-gray-900 dark:text-white">Ready for Approval</h4>
                                        <p className="mt-2 text-sm text-gray-500 dark:text-gray-400 font-medium">{summary.drafted} students are awaiting review.</p>
                                        <button
                                            onClick={handleApprove}
                                            disabled={processing}
                                            className="mt-6 px-6 py-2.5 bg-green-600 text-white rounded-lg font-bold hover:bg-green-700 transition-colors shadow-sm disabled:opacity-50 flex items-center gap-2"
                                        >
                                            {processing ? 'Processing...' : <><ShieldCheck className="w-4 h-4" /> Approve All Results</>}
                                        </button>
                                    </div>
                                ) : (
                                    <div className="flex flex-col items-center justify-center p-8">
                                        <CheckCircle className="w-10 h-10 text-green-500 mb-4" />
                                        <p className="text-sm text-gray-500 dark:text-gray-400 font-bold uppercase tracking-wider">All Results Approved</p>
                                    </div>
                                )}
                            </div>
                        )}

                        {!loading && activeTab === 'publishing' && (
                            <div className="p-6 md:p-8 space-y-6">
                                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-6 border-b border-gray-100 dark:border-gray-700 pb-3">Release to Portal</h3>
                                {summary?.approved > 0 ? (
                                    <div className="flex flex-col items-center justify-center p-8 border border-primary-100 dark:border-primary-900/20 bg-primary-50/30 dark:bg-primary-900/5 rounded-xl">
                                        <Globe className="w-10 h-10 text-primary-500 mb-4" />
                                        <h4 className="text-lg font-bold text-gray-900 dark:text-white">Ready to Publish</h4>
                                        <p className="mt-2 text-sm text-gray-500 dark:text-gray-400 font-medium">{summary.approved} results can be released.</p>
                                        <button
                                            onClick={handlePublish}
                                            disabled={processing}
                                            className="mt-6 px-6 py-2.5 bg-primary-600 text-white rounded-lg font-bold hover:bg-primary-700 transition-colors shadow-sm disabled:opacity-50 flex items-center gap-2"
                                        >
                                            {processing ? 'Processing...' : <><Globe className="w-4 h-4" /> Publish All Results</>}
                                        </button>
                                    </div>
                                ) : summary?.published > 0 ? (
                                    <div className="flex flex-col items-center justify-center p-8">
                                        <CheckCircle className="w-10 h-10 text-green-500 mb-4" />
                                        <p className="text-sm text-gray-500 dark:text-gray-400 font-bold uppercase tracking-wider">Results are Live</p>
                                    </div>
                                ) : (
                                    <div className="flex flex-col items-center justify-center p-8 text-center">
                                        <Lock className="w-10 h-10 text-gray-300 mb-4" />
                                        <p className="text-sm text-gray-500 dark:text-gray-400 font-medium max-w-xs">Results must be approved before they can be published to portals.</p>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            ) : (
                <div className="bg-white dark:bg-gray-800 p-12 text-center rounded-xl border border-dashed border-gray-300 dark:border-gray-700">
                    <Settings className="w-10 h-10 text-gray-300 mx-auto mb-4" />
                    <p className="text-sm text-gray-500 dark:text-gray-400">Please select an Exam Group and Class above</p>
                </div>
            )}
        </div>
    );
};

export default ResultManagementPage;
