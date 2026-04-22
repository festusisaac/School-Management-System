import React, { useState, useRef } from 'react';
import { Upload, X, FileSpreadsheet, AlertTriangle, Check, Loader2, Download } from 'lucide-react';
import * as XLSX from 'xlsx';
import { useToast } from '../../../context/ToastContext';
import { AssessmentType } from '../../../services/examinationService';
import { useSystem } from '../../../context/SystemContext';

interface BulkScoreImportProps {
    isOpen: boolean;
    onClose: () => void;
    onImport: (data: any[]) => Promise<void>;
    assessments: AssessmentType[];
}

const BulkScoreImport: React.FC<BulkScoreImportProps> = ({ isOpen, onClose, onImport, assessments }) => {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [previewData, setPreviewData] = useState<any[]>([]);
    const [headers, setHeaders] = useState<string[]>([]);
    const [mapping, setMapping] = useState<{ [key: string]: string }>({}); // assessmentId -> headerName
    const [admissionNoHeader, setAdmissionNoHeader] = useState('');
    const [loading, setLoading] = useState(false);
    const [step, setStep] = useState<'upload' | 'map' | 'preview'>('upload');

    const { showError, showWarning } = useToast();
    const { settings } = useSystem();

    if (!isOpen) return null;

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const maxMB = settings?.maxFileUploadSizeMb || 2;
        if (file.size > maxMB * 1024 * 1024) {
            showWarning(`File size exceeds ${maxMB}MB limit. Please choose a smaller file.`);
            e.target.value = '';
            return;
        }

        const reader = new FileReader();
        reader.onload = (evt) => {
            try {
                const bstr = evt.target?.result;
                const wb = XLSX.read(bstr, { type: 'binary' });
                const wsname = wb.SheetNames[0];
                const ws = wb.Sheets[wsname];
                const data = XLSX.utils.sheet_to_json(ws, { header: 1 });

                if (data.length < 2) {
                    showError('File is empty or invalid format');
                    return;
                }

                const fileHeaders = data[0] as string[];
                const rows = data.slice(1);

                setHeaders(fileHeaders);
                setPreviewData(rows);

                // Auto-detection
                const lowerHeaders = fileHeaders.map(h => h.toLowerCase());
                const admIndex = lowerHeaders.findIndex(h => h.includes('admission') || h.includes('reg') || h.includes('roll'));
                if (admIndex >= 0) setAdmissionNoHeader(fileHeaders[admIndex]);

                const newMapping: any = {};
                assessments.forEach(ass => {
                    const idx = lowerHeaders.findIndex(h => h.includes(ass.name.toLowerCase()));
                    if (idx >= 0) newMapping[ass.id] = fileHeaders[idx];
                });
                setMapping(newMapping);

                setStep('map');
            } catch (error) {
                console.error(error);
                showError('Failed to parse file');
            }
        };
        reader.readAsBinaryString(file);
    };

    const handleDownloadSample = () => {
        const headers = ['Admission Number', ...assessments.map(a => a.name)];
        const sampleRow = ['STU/2024/001', ...assessments.map(() => '0')];

        const ws = XLSX.utils.aoa_to_sheet([headers, sampleRow]);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Template");

        XLSX.writeFile(wb, "score_import_template.xlsx");
    };

    const handleProcess = async () => {
        if (!admissionNoHeader) {
            showError('Please select the Admission Number column');
            return;
        }

        setLoading(true);
        try {
            const formattedData = previewData.map((row: any) => {
                const headerIndex = headers.indexOf(admissionNoHeader);
                const admissionNo = row[headerIndex];

                if (!admissionNo) return null;

                const studentScores: any = {
                    admissionNumber: admissionNo.toString(),
                    scores: {}
                };

                let hasLimitError = false;
                Object.keys(mapping).forEach(assId => {
                    const hIndex = headers.indexOf(mapping[assId]);
                    if (hIndex >= 0) {
                        const score = parseFloat(row[hIndex]);
                        const assessment = assessments.find(a => a.id === assId);

                        if (assessment && score > assessment.maxMarks) {
                            hasLimitError = true;
                        }

                        studentScores.scores[assId] = row[hIndex];
                    }
                });

                if (hasLimitError) {
                    throw new Error('Some scores in the file exceed the maximum allowed marks.');
                }

                return studentScores;
            }).filter(Boolean);

            await onImport(formattedData);
            onClose();
            setStep('upload');
            setPreviewData([]);
        } catch (error) {
            showError('Import failed');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-2xl shadow-2xl flex flex-col max-h-[90vh]">
                <div className="p-6 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center">
                    <h2 className="text-xl font-black text-gray-900 dark:text-white uppercase tracking-tight flex items-center gap-2">
                        <FileSpreadsheet className="w-5 h-5 text-green-600" />
                        Bulk Score Import
                    </h2>
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors text-gray-400">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="p-6 overflow-y-auto flex-1">
                    {step === 'upload' && (
                        <div className="space-y-4">
                            <div className="flex flex-col items-center justify-center h-48 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-2xl bg-gray-50 dark:bg-gray-900/50 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors cursor-pointer group"
                                onClick={() => fileInputRef.current?.click()}>
                                <input type="file" ref={fileInputRef} className="hidden" accept=".xlsx,.xls,.csv" onChange={handleFileUpload} />
                                <div className="w-12 h-12 bg-primary-50 dark:bg-primary-900/30 rounded-full flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                                    <Upload className="w-6 h-6 text-primary-600 dark:text-primary-400" />
                                </div>
                                <p className="font-bold text-gray-900 dark:text-white">Click to Upload Excel File</p>
                                <p className="text-xs text-gray-500 mt-1">Supports .xlsx, .xls, .csv</p>
                            </div>

                            <div className="flex justify-center">
                                <button
                                    onClick={handleDownloadSample}
                                    className="flex items-center gap-2 text-sm text-primary-600 dark:text-primary-400 hover:underline font-medium"
                                >
                                    <Download className="w-4 h-4" />
                                    Download Sample Template
                                </button>
                            </div>
                        </div>
                    )}

                    {step === 'map' && (
                        <div className="space-y-6">
                            <div className="bg-primary-50 dark:bg-primary-900/20 p-4 rounded-xl flex gap-3 text-primary-800 dark:text-primary-200 text-sm">
                                <AlertTriangle className="w-5 h-5 shrink-0" />
                                <p>Please map the Excel columns to the system fields. We attempted to auto-detect them for you.</p>
                            </div>

                            <div className="space-y-4">
                                <div>
                                    <label className="block text-xs font-bold uppercase text-gray-500 mb-1.5">Admission Number Column</label>
                                    <select
                                        className="w-full p-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm font-medium"
                                        value={admissionNoHeader}
                                        onChange={(e) => setAdmissionNoHeader(e.target.value)}
                                    >
                                        <option value="">-- Select Column --</option>
                                        {headers.map(h => <option key={h} value={h}>{h}</option>)}
                                    </select>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {assessments.map(ass => (
                                        <div key={ass.id}>
                                            <label className="block text-xs font-bold uppercase text-gray-500 mb-1.5">{ass.name} (Max: {ass.maxMarks})</label>
                                            <select
                                                className="w-full p-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm font-medium"
                                                value={mapping[ass.id] || ''}
                                                onChange={(e) => setMapping({ ...mapping, [ass.id]: e.target.value })}
                                            >
                                                <option value="">-- Ignore --</option>
                                                {headers.map(h => <option key={h} value={h}>{h}</option>)}
                                            </select>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                <div className="p-6 border-t border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50 flex justify-end gap-3 rounded-b-2xl">
                    <button onClick={onClose} className="px-5 py-2.5 rounded-xl text-gray-600 font-bold hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors">
                        Cancel
                    </button>
                    {step === 'map' && (
                        <button
                            onClick={handleProcess}
                            disabled={loading}
                            className="px-6 py-2.5 rounded-xl bg-primary-600 text-white font-bold hover:bg-primary-700 transition-colors shadow-lg shadow-primary-600/20 disabled:opacity-50 flex items-center gap-2"
                        >
                            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                            Import Scores
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

export default BulkScoreImport;
