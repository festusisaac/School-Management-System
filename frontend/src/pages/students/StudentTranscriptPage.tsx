import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
    Download, 
    Printer, 
    ChevronLeft, 
    Loader2, 
    History as HistoryIcon, 
    Award, 
    BookOpen,
    AlertCircle
} from 'lucide-react';
import api from '../../services/api';
import { useToast } from '../../context/ToastContext';
import { useSystem } from '../../context/SystemContext';
import TranscriptTemplate, { TranscriptData } from '../../components/examination/TranscriptTemplate';

const StudentTranscriptPage = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { showError } = useToast();
    const { settings } = useSystem();
    
    const [loading, setLoading] = useState(true);
    const [transcriptData, setTranscriptData] = useState<TranscriptData | null>(null);

    useEffect(() => {
        const fetchTranscript = async () => {
            if (!id) return;
            try {
                const response = await api.getStudentTranscript(id);
                
                // Map backend response to TranscriptData format
                const mappedData: TranscriptData = {
                    student: {
                        name: `${response.student.firstName} ${response.student.lastName}`,
                        admissionNumber: response.student.admissionNo,
                        gender: response.student.gender,
                        dob: response.student.dob,
                        photoUrl: response.student.studentPhoto,
                        class: response.student.class?.name,
                        status: response.student.isActive ? 'Active' : 'Inactive',
                        deactivateReason: response.student.deactivateReason?.reason
                    },
                    sessions: response.transcript || []
                };
                
                setTranscriptData(mappedData);
            } catch (error) {
                console.error("Failed to load transcript", error);
                showError("Could not retrieve student transcript records.");
            } finally {
                setLoading(false);
            }
        };

        fetchTranscript();
    }, [id]);

    const handlePrint = () => {
        window.print();
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
                <Loader2 className="w-10 h-10 text-primary-600 animate-spin" />
                <p className="text-gray-500 font-medium animate-pulse">Compiling Academic History...</p>
            </div>
        );
    }

    if (!transcriptData || transcriptData.sessions.length === 0) {
        return (
            <div className="max-w-2xl mx-auto mt-20 text-center space-y-6">
                <div className="w-20 h-20 bg-gray-100 dark:bg-gray-800 rounded-3xl flex items-center justify-center mx-auto text-gray-400">
                    <HistoryIcon className="w-10 h-10" />
                </div>
                <div className="space-y-2">
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white">No Academic Records Found</h2>
                    <p className="text-gray-500 dark:text-gray-400">
                        This student does not have any processed and published results in the system yet.
                    </p>
                </div>
                <button 
                    onClick={() => navigate(-1)}
                    className="inline-flex items-center gap-2 text-primary-600 font-semibold hover:underline"
                >
                    <ChevronLeft className="w-4 h-4" /> Go Back
                </button>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-950 pb-20">
            {/* Header / Toolbar */}
            <div className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 sticky top-0 z-30 print:hidden">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <button 
                            onClick={() => navigate(-1)}
                            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                        >
                            <ChevronLeft className="w-5 h-5 text-gray-500" />
                        </button>
                        <div>
                            <h1 className="text-lg font-bold text-gray-900 dark:text-white truncate max-w-[200px] sm:max-w-md">
                                Transcript: {transcriptData.student.name}
                            </h1>
                        </div>
                    </div>

                    <div className="flex items-center gap-2 sm:gap-3">
                        <button 
                            onClick={handlePrint}
                            className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg text-sm font-semibold hover:bg-primary-700 transition-all shadow-sm"
                        >
                            <Printer className="w-4 h-4" />
                            <span className="hidden sm:inline">Print Transcript</span>
                        </button>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
                {/* Print Warning */}
                <div className="mb-8 p-4 bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-900/30 rounded-xl flex items-start gap-4 print:hidden">
                    <div className="p-2 bg-white dark:bg-gray-900 rounded-lg shadow-sm">
                        <AlertCircle className="w-5 h-5 text-amber-500" />
                    </div>
                    <div>
                        <h4 className="text-sm font-bold text-amber-850 dark:text-amber-400">Official Document Preview</h4>
                        <p className="text-xs text-amber-700 dark:text-amber-500 mt-1">
                            The preview below shows the official transcript format. For the best result, use a high-quality printer and ensure the background colors/images are enabled in your browser print settings.
                        </p>
                    </div>
                </div>

                <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 items-start">
                    {/* Sidebar: Quick Stats */}
                    <div className="xl:col-span-3 space-y-6 print:hidden">
                        <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 border border-gray-200 dark:border-gray-800 shadow-sm">
                            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">Summary</h3>
                            <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3 text-gray-600 dark:text-gray-400">
                                        <HistoryIcon className="w-4 h-4" />
                                        <span className="text-sm">Sessions</span>
                                    </div>
                                    <span className="text-sm font-bold">{transcriptData.sessions.length}</span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3 text-gray-600 dark:text-gray-400">
                                        <BookOpen className="w-4 h-4" />
                                        <span className="text-sm">Total Terms</span>
                                    </div>
                                    <span className="text-sm font-bold">
                                        {transcriptData.sessions.reduce((acc, s) => acc + s.terms.length, 0)}
                                    </span>
                                </div>
                                <div className="pt-4 border-t border-gray-100 dark:border-gray-800">
                                    <div className="flex items-center gap-3 text-primary-600 mb-1">
                                        <Award className="w-4 h-4" />
                                        <span className="text-xs font-bold uppercase tracking-wider">Overall Average</span>
                                    </div>
                                    <div className="text-2xl font-black text-gray-900 dark:text-white">
                                        {(() => {
                                            const allTerms = transcriptData.sessions.flatMap(s => s.terms);
                                            const validTerms = allTerms.filter(t => (t.summary?.averageScore || 0) > 0);
                                            
                                            if (allTerms.length === 0) return "0.00";
                                            
                                            const totalScore = allTerms.reduce((acc, t) => acc + (t.summary?.averageScore || 0), 0);
                                            const termCount = validTerms.length || allTerms.length || 1;
                                            
                                            return (totalScore / termCount).toFixed(2);
                                        })()}%
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="bg-primary-600 rounded-2xl p-6 text-white shadow-lg shadow-primary-600/20">
                            <h4 className="font-bold text-sm mb-2">Need a Digital Copy?</h4>
                            <p className="text-xs text-primary-100 leading-relaxed mb-4">
                                You can save this transcript as a PDF using your browser's print dialog. Choose 'Save as PDF' in the destination list.
                            </p>
                            <button 
                                onClick={handlePrint}
                                className="w-full py-2 bg-white text-primary-600 rounded-lg text-xs font-bold hover:bg-primary-50 transition-colors"
                            >
                                Open Print Dialog
                            </button>
                        </div>
                    </div>

                    {/* Main Preview Area */}
                    <div className="xl:col-span-9 flex justify-center">
                        <div className="bg-white dark:bg-transparent shadow-2xl dark:shadow-none rounded-sm overflow-hidden ring-1 ring-gray-200 dark:ring-gray-800 print:ring-0">
                            <style>{`
                                @media print {
                                    @page {
                                        size: A4;
                                        margin: 0;
                                    }
                                    body {
                                        margin: 0;
                                        background: white;
                                    }
                                    nav, aside, footer, header, .print\\:hidden {
                                        display: none !important;
                                    }
                                    .print-root {
                                        position: absolute;
                                        left: 0;
                                        top: 0;
                                        width: 100%;
                                        margin: 0 !important;
                                        padding: 0 !important;
                                    }
                                }
                            `}</style>
                            <div className="print-root">
                                <TranscriptTemplate data={transcriptData} settings={settings} />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default StudentTranscriptPage;
