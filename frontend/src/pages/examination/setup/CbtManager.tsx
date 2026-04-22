import React, { useState, useEffect } from 'react';
import { 
    Settings, 
    ShieldCheck, 
    KeyRound, 
    Copy,
    Check,
    Plus, 
    FileSpreadsheet, 
    ChevronRight,
    Search,
    Filter,
    AlertTriangle,
    CheckCircle2
} from 'lucide-react';
import { useToast } from '../../../context/ToastContext';
import { useSystem } from '../../../context/SystemContext';
import { systemService, AcademicTerm } from '../../../services/systemService';
import api from '../../../services/api'; // Use the established api service
import { examinationService } from '../../../services/examinationService';

// Components
import QuestionBankTable from '../cbt/QuestionBankTable';
import QuestionEditorModal from '../cbt/QuestionEditorModal';
import BulkQuestionImport from '../cbt/BulkQuestionImport';
import { Modal } from '../../../components/ui/modal';

export default function CbtManager() {
    const { showSuccess, showError, showLoading, hideLoading } = useToast();
    const { settings } = useSystem();
    const [exams, setExams] = useState<any[]>([]);
    const [terms, setTerms] = useState<AcademicTerm[]>([]);
    const [classes, setClasses] = useState<any[]>([]);
    const [selectedTerm, setSelectedTerm] = useState<string>('');
    const [selectedClass, setSelectedClass] = useState<string>('');
    const [selectedExamId, setSelectedExamId] = useState('');
    const [assessmentTypes, setAssessmentTypes] = useState<any[]>([]);
    const [selectedAssessmentTypeId, setSelectedAssessmentTypeId] = useState('');
    const [syncKey, setSyncKey] = useState<string | null>(null);
    const [isSyncKeyModalOpen, setIsSyncKeyModalOpen] = useState(false);
    const [copied, setCopied] = useState(false);
    const [loading, setLoading] = useState(false);
    
    // Question Bank State
    const [questions, setQuestions] = useState<any[]>([]);
    const [isEditorOpen, setIsEditorOpen] = useState(false);
    const [isBulkOpen, setIsBulkOpen] = useState(false);
    const [editingQuestion, setEditingQuestion] = useState<any>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [marksValidation, setMarksValidation] = useState<any | null>(null);
    const [validationLoading, setValidationLoading] = useState(false);

    // Initialize selectedTerm when settings load
    useEffect(() => {
        if (!selectedTerm && settings?.activeTermName) {
            setSelectedTerm(settings.activeTermName);
        }
    }, [settings?.activeTermName]);

    useEffect(() => {
        const fetchData = async () => {
            try {
                // Fetch Schedules, Terms, and Classes in parallel
                const [schedulesData, termsRes, classesData] = await Promise.all([
                    examinationService.getSchedules(''),
                    settings?.currentSessionId ? systemService.getTermsBySession(settings.currentSessionId) : Promise.resolve([]),
                    api.getClasses()
                ]);
                
                // Extract unique exams from the schedules
                const scheduledExams = schedulesData?.map(s => s.exam).filter(Boolean) || [];
                setExams(scheduledExams);
                setTerms(termsRes || []);
                setClasses(classesData || []);
            } catch (err) {
                console.error("Failed to load CBT data", err);
                showError('Failed to load initial data');
            }
        };
        fetchData();
    }, [settings?.currentSessionId]);

    useEffect(() => {
        if (selectedExamId) {
            fetchQuestions();
            fetchAssessmentTypes();
            setSyncKey(null); // Clear sync key when exam changes
            setIsSyncKeyModalOpen(false);
            setCopied(false);
        } else {
            setQuestions([]);
            setAssessmentTypes([]);
            setSelectedAssessmentTypeId('');
        }
    }, [selectedExamId]);

    useEffect(() => {
        const fetchValidation = async () => {
            if (!selectedExamId) {
                setMarksValidation(null);
                return;
            }
            setValidationLoading(true);
            try {
                const res = await api.post('/examination/cbt/sync/validate-totals', {
                    examId: selectedExamId,
                    assessmentTypeId: selectedAssessmentTypeId || undefined
                });
                setMarksValidation(res);
            } catch {
                setMarksValidation(null);
            } finally {
                setValidationLoading(false);
            }
        };
        fetchValidation();
    }, [selectedExamId, selectedAssessmentTypeId, questions.length]);

    const fetchAssessmentTypes = async () => {
        const exam = exams.find(e => e.id === selectedExamId);
        if (exam?.examGroupId) {
            try {
                const types = await examinationService.getAssessmentTypes(exam.examGroupId);
                setAssessmentTypes(types || []);
                // Default to "Exam" if found, else first one
                const examType = types.find(t => t.name.toLowerCase().includes('exam'));
                if (examType) setSelectedAssessmentTypeId(examType.id);
                else if (types.length > 0) setSelectedAssessmentTypeId(types[0].id);
            } catch (err) {
                console.error("Failed to load assessment types", err);
            }
        }
    };

    const fetchQuestions = async () => {
        try {
            const res = await api.get<any[]>(`/examination/cbt/questions?examId=${selectedExamId}`);
            setQuestions(res || []);
        } catch (err) {
            showError('Failed to load questions');
        }
    };

    const handleGenerateKey = async () => {
        if (!selectedExamId || !selectedAssessmentTypeId) {
            showError('Please select both an exam and a target assessment type');
            return;
        }

        setLoading(true);
        try {
            const res = await api.post<{ syncKey: string }>('/examination/cbt/sync/generate-key', { 
                examId: selectedExamId,
                assessmentTypeId: selectedAssessmentTypeId
            });
            setSyncKey(res.syncKey);
            setCopied(false);
            setIsSyncKeyModalOpen(true);
            showSuccess('Sync Key generated successfully!');
        } catch (error: any) {
            showError(error.response?.data?.message || 'Failed to generate sync key');
        } finally {
            setLoading(false);
        }
    };

    const handleCopySyncKey = async () => {
        if (!syncKey) return;
        try {
            await navigator.clipboard.writeText(syncKey);
            setCopied(true);
            showSuccess('Sync key copied');
            setTimeout(() => setCopied(false), 1800);
        } catch {
            showError('Failed to copy sync key. Please copy manually.');
        }
    };

    const handleSaveQuestion = async (data: any) => {
        const loadingId = showLoading(editingQuestion ? 'Updating question...' : 'Adding question...');
        try {
            if (editingQuestion) {
                await api.patch(`/examination/cbt/questions/${editingQuestion.id}`, data);
                showSuccess('Question updated successfully');
            } else {
                await api.post(`/examination/cbt/questions`, { ...data, examId: selectedExamId });
                showSuccess('Question added to bank');
            }
            setIsEditorOpen(false);
            fetchQuestions();
        } catch (err) {
            showError('Failed to save question. Please check your inputs.');
        } finally {
            hideLoading(loadingId);
        }
    };

    const handleDeleteQuestion = async (id: string) => {
        if (!window.confirm('Are you sure you want to delete this question?')) return;
        try {
            await api.delete(`/examination/cbt/questions/${id}`);
            showSuccess('Question removed from bank');
            fetchQuestions();
        } catch (err) {
            showError('Failed to delete question');
        }
    };

    const handleBulkImport = async (data: any[]) => {
        if (!selectedExamId) {
            showError('Please select an exam first');
            return;
        }

        const loadingId = showLoading(`Processing ${data.length} questions...`);
        try {
            const res = await api.post<{ success: number; failed: number }>(`/examination/cbt/questions/bulk-import`, {
                examId: selectedExamId,
                data
            });
            
            showSuccess(`Import complete! ${res.success} questions added.`);
            if (res.failed > 0) {
                showError(`${res.failed} rows failed validation. Check your Excel format.`);
            }
            setIsBulkOpen(false);
            fetchQuestions();
        } catch (err) {
            showError('Failed to process bulk import. Ensure the Excel columns match the template.');
        } finally {
            hideLoading(loadingId);
        }
    };

    // Filter exams by selected term and class
    const filteredExams = exams.filter(exam => {
        const matchesTerm = !selectedTerm || (exam.examGroup?.term || exam.term) === selectedTerm;
        const matchesClass = !selectedClass || exam.classId === selectedClass;
        return matchesTerm && matchesClass;
    });

    // Reset selected exam if it's no longer in the filtered list
    useEffect(() => {
        if (selectedExamId && !filteredExams.some(e => e.id === selectedExamId)) {
            setSelectedExamId('');
        }
    }, [selectedTerm, selectedClass, exams]);

    const filteredQuestions = questions.filter(q => 
        q.content.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="p-6 space-y-6 bg-gray-50 dark:bg-gray-900 min-h-screen">
            {/* Header Area */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                        CBT Command Center
                    </h1>
                    <p className="text-gray-600 dark:text-gray-400 mt-1">Manage offline question banks and exam synchronization</p>
                </div>
                
                {/* Filter Controls */}
                <div className="flex items-center gap-3 bg-white dark:bg-gray-800 p-2 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
                    <div className="flex items-center gap-2 px-3 py-1.5 border-r border-gray-100 dark:border-gray-700">
                        <Filter className="w-3.5 h-3.5 text-gray-400" />
                        <select
                            className="text-sm font-semibold text-gray-700 dark:text-gray-200 bg-transparent border-none focus:ring-0 p-0 pr-6"
                            value={selectedTerm}
                            onChange={(e) => setSelectedTerm(e.target.value)}
                        >
                            <option value="">All Terms</option>
                            {terms.map(t => (
                                <option key={t.id} value={t.name}>{t.name}</option>
                            ))}
                        </select>
                    </div>

                    <div className="flex items-center gap-2 px-3 py-1.5">
                        <select
                            className="text-sm font-semibold text-gray-700 dark:text-gray-200 bg-transparent border-none focus:ring-0 p-0 pr-6"
                            value={selectedClass}
                            onChange={(e) => setSelectedClass(e.target.value)}
                        >
                            <option value="">All Classes</option>
                            {classes.map(c => (
                                <option key={c.id} value={c.id}>{c.name}</option>
                            ))}
                        </select>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                {/* Left Panel: Exam Selection & Sync */}
                <div className="lg:col-span-1 space-y-6">
                    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm p-5">
                        <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-4">Select Examination</label>
                        <select
                            value={selectedExamId}
                            onChange={(e) => setSelectedExamId(e.target.value)}
                            className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 transition-all mb-4"
                        >
                            <option value="">-- Choose Exam ({filteredExams.length}) --</option>
                            {filteredExams.map(exam => (
                                <option key={exam.id} value={exam.id}>
                                    {exam.name || exam.examName} {exam.class?.name ? `(${exam.class.name})` : ''}
                                </option>
                            ))}
                        </select>

                        {selectedExamId && (
                            <div className="pt-4 border-t border-gray-100 dark:border-gray-700 mt-2 space-y-4">
                                <h4 className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-2">
                                    <ShieldCheck className="w-4 h-4 text-primary-600" />
                                    Offline Sync
                                </h4>
                                <p className="text-xs text-gray-500 leading-relaxed">
                                    Generate a Sync Key to securely push this exam to a local node laptop.
                                </p>

                                <div className="space-y-1">
                                    <label className="text-[10px] font-bold text-gray-400 uppercase">Target Result Column</label>
                                    <select
                                        value={selectedAssessmentTypeId}
                                        onChange={(e) => setSelectedAssessmentTypeId(e.target.value)}
                                        className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded text-xs focus:ring-1 focus:ring-primary-500"
                                    >
                                        <option value="">-- Select Type --</option>
                                        {assessmentTypes.map(type => (
                                            <option key={type.id} value={type.id}>{type.name} ({type.maxMarks} Marks)</option>
                                        ))}
                                    </select>
                                </div>
                                
                                <button
                                    onClick={handleGenerateKey}
                                    disabled={loading || !selectedAssessmentTypeId || !marksValidation?.isValid}
                                    className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-primary-600 text-white text-xs font-bold rounded-lg hover:bg-primary-700 transition-all disabled:opacity-50 shadow-lg shadow-primary-600/20"
                                >
                                    <KeyRound className="w-4 h-4" />
                                    {syncKey ? 'Regenerate Sync Key' : 'Generate Sync Key'}
                                </button>

                                <div className="p-3 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50/50 dark:bg-gray-800/30">
                                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Marks Validation</p>
                                    {validationLoading ? (
                                        <p className="text-xs text-gray-500">Checking...</p>
                                    ) : marksValidation ? (
                                        <div className="space-y-1.5">
                                            <p className="text-xs text-gray-600 dark:text-gray-300">
                                                Required: <span className="font-bold">{marksValidation.requiredMarks}</span>
                                            </p>
                                            <p className="text-xs text-gray-600 dark:text-gray-300">
                                                Current: <span className="font-bold">{marksValidation.currentMarks}</span>
                                            </p>
                                            <p className={`text-xs font-semibold ${marksValidation.isValid ? 'text-emerald-600' : 'text-rose-600'}`}>
                                                Difference: {marksValidation.difference > 0 ? '+' : ''}{marksValidation.difference}
                                            </p>
                                            <div className={`flex items-center gap-1 text-xs font-semibold ${marksValidation.isValid ? 'text-emerald-700' : 'text-rose-700'}`}>
                                                {marksValidation.isValid ? <CheckCircle2 className="w-3.5 h-3.5" /> : <AlertTriangle className="w-3.5 h-3.5" />}
                                                {marksValidation.isValid ? 'Exact match - ready for sync key' : 'Mismatch - adjust question marks'}
                                            </div>
                                        </div>
                                    ) : (
                                        <p className="text-xs text-gray-500">Unable to validate marks.</p>
                                    )}
                                </div>

                            </div>
                        )}
                    </div>

                    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm p-5">
                        <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">Question Stats</h4>
                        <div className="flex justify-between items-center text-sm">
                            <span className="text-gray-500 font-medium">Bank Size</span>
                            <span className="font-bold text-gray-900 dark:text-white bg-primary-50 dark:bg-primary-900/20 px-2 py-0.5 rounded-lg text-primary-600">{questions.length} Questions</span>
                        </div>
                    </div>
                </div>

                {/* Right Panel: Question Bank */}
                <div className="lg:col-span-3">
                    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm flex flex-col h-full overflow-hidden">
                        <div className="p-5 border-b border-gray-200 dark:border-gray-700 flex flex-col md:flex-row justify-between items-center gap-4 bg-gray-50/30">
                            <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                                <Settings className="w-5 h-5 text-gray-400" />
                                Question Bank
                            </h3>
                            <div className="flex gap-2 w-full md:w-auto">
                                <button
                                    onClick={() => { setEditingQuestion(null); setIsEditorOpen(true); }}
                                    disabled={!selectedExamId}
                                    className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2 bg-primary-600 text-white text-xs font-bold rounded-lg hover:bg-primary-700 transition-all disabled:opacity-50 shadow-md shadow-primary-600/10"
                                >
                                    <Plus className="w-4 h-4" /> Add Question
                                </button>
                                <button
                                    onClick={() => setIsBulkOpen(true)}
                                    disabled={!selectedExamId}
                                    className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 text-xs font-bold rounded-lg disabled:opacity-50 transition-all"
                                >
                                    <FileSpreadsheet className="w-4 h-4" /> Bulk Import
                                </button>
                            </div>
                        </div>

                        <div className="p-6 flex-1 flex flex-col min-h-[500px]">
                            {!selectedExamId ? (
                                <div className="flex-1 flex flex-col items-center justify-center text-center py-20 bg-gray-50/30 dark:bg-gray-900/10 rounded-xl border border-dashed border-gray-200 dark:border-gray-700">
                                    <Search className="w-12 h-12 text-gray-200 mb-4" />
                                    <p className="text-gray-500 font-bold">Select an Exam</p>
                                    <p className="text-xs text-gray-400 mt-1 max-w-[250px] mx-auto">Choose an examination from the left panel (within the {selectedTerm || 'active'} term) to manage its content.</p>
                                </div>
                            ) : (
                                <>
                                    <div className="mb-6 relative">
                                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                                        <input
                                            type="text"
                                            placeholder="Quick search questions..."
                                            value={searchTerm}
                                            onChange={(e) => setSearchTerm(e.target.value)}
                                            className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm focus:ring-2 focus:ring-primary-500 transition-all shadow-sm"
                                        />
                                    </div>
                                    <QuestionBankTable 
                                        questions={filteredQuestions} 
                                        onEdit={(q) => { setEditingQuestion(q); setIsEditorOpen(true); }}
                                        onDelete={handleDeleteQuestion}
                                    />
                                </>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Modals */}
            <QuestionEditorModal 
                isOpen={isEditorOpen} 
                onClose={() => setIsEditorOpen(false)}
                onSave={handleSaveQuestion}
                editingQuestion={editingQuestion}
            />
            
            <BulkQuestionImport 
                isOpen={isBulkOpen}
                onClose={() => setIsBulkOpen(false)}
                onImport={handleBulkImport}
            />

            <Modal
                isOpen={isSyncKeyModalOpen}
                onClose={() => setIsSyncKeyModalOpen(false)}
                title="Generated Sync Key"
                size="sm"
            >
                <div className="space-y-4">
                    <p className="text-sm text-gray-600 dark:text-gray-300">
                        Share this key with the offline CBT node and keep it private.
                    </p>
                    <div className="rounded-xl border border-primary-200 dark:border-primary-900/40 bg-gray-900 px-4 py-3">
                        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-primary-300 mb-2">Sync Key</p>
                        <p className="font-mono text-lg tracking-widest text-white break-all select-all">
                            {syncKey || '-'}
                        </p>
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            type="button"
                            onClick={handleCopySyncKey}
                            className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-primary-700 transition"
                        >
                            {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                            {copied ? 'Copied' : 'Copy Key'}
                        </button>
                        <button
                            type="button"
                            onClick={() => setIsSyncKeyModalOpen(false)}
                            className="inline-flex items-center justify-center rounded-xl border border-gray-300 dark:border-gray-600 px-4 py-2.5 text-sm font-semibold text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 transition"
                        >
                            Close
                        </button>
                    </div>
                </div>
            </Modal>
        </div>
    );
}
