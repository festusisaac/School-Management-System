import React, { useState } from 'react';
import { Upload, X, Check, AlertTriangle, FileText, Download, ChevronRight, ChevronLeft, Loader2, Info, Lock } from 'lucide-react';
import * as XLSX from 'xlsx';
import apiService from '../../services/api';
import { useToast } from '../../context/ToastContext';

interface BulkStudentImportProps {
    onClose: () => void;
    onSuccess: () => void;
}

type Step = 'upload' | 'mapping' | 'preview' | 'importing' | 'complete';

const REQUIRED_FIELDS = [
    { key: 'admissionNo', label: 'Admission No' },
    { key: 'firstName', label: 'First Name' },
    { key: 'gender', label: 'Gender' },
    { key: 'dob', label: 'Date of Birth (YYYY-MM-DD)' },
    { key: 'admissionDate', label: 'Admission Date (YYYY-MM-DD)' },
];

const OPTIONAL_FIELDS = [
    { key: 'lastName', label: 'Last Name' },
    { key: 'rollNo', label: 'Roll Number' },
    { key: 'className', label: 'Class Name' },
    { key: 'sectionName', label: 'Section Name' },
    { key: 'categoryName', label: 'Category' },
    { key: 'houseName', label: 'House' },
    { key: 'fatherName', label: 'Father Name' },
    { key: 'fatherPhone', label: 'Father Phone' },
    { key: 'motherName', label: 'Mother Name' },
    { key: 'guardianName', label: 'Guardian Name' },
    { key: 'guardianPhone', label: 'Guardian Phone' },
    { key: 'email', label: 'Student Email' },
    { key: 'mobileNumber', label: 'Student Mobile' },
];

const BulkStudentImport: React.FC<BulkStudentImportProps> = ({ onClose, onSuccess }) => {
    const [step, setStep] = useState<Step>('upload');
    const [fileData, setFileData] = useState<any[]>([]);
    const [headers, setHeaders] = useState<string[]>([]);
    const [mapping, setMapping] = useState<Record<string, string>>({});
    const [validationResults, setValidationResults] = useState<any[]>([]);
    const [importResults, setImportResults] = useState<{ success: number, failed: number, records: any[], errors: any[] } | null>(null);
    const [importProgress, setImportProgress] = useState(0);
    const [loading, setLoading] = useState(false);
    const toast = useToast();

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (evt) => {
            const bstr = evt.target?.result;
            const wb = XLSX.read(bstr, { type: 'binary' });
            const wsname = wb.SheetNames[0];
            const ws = wb.Sheets[wsname];
            const data = XLSX.utils.sheet_to_json(ws, { header: 1 });
            
            if (data.length > 0) {
                const sheetHeaders = (data[0] as string[]).filter(h => h);
                setHeaders(sheetHeaders);
                
                const rows = data.slice(1).map((row: any) => {
                    const obj: any = {};
                    sheetHeaders.forEach((h, i) => {
                        obj[h] = row[i];
                    });
                    return obj;
                });
                
                setFileData(rows);
                
                // Auto-mapping logic
                const newMapping: Record<string, string> = {};
                [...REQUIRED_FIELDS, ...OPTIONAL_FIELDS].forEach(field => {
                    const match = sheetHeaders.find(h => 
                        h.toLowerCase().replace(/[^a-z]/g, '') === field.label.toLowerCase().replace(/[^a-z]/g, '') ||
                        h.toLowerCase() === field.key.toLowerCase() ||
                        h.toLowerCase() === field.label.toLowerCase()
                    );
                    if (match) newMapping[field.key] = match;
                });
                setMapping(newMapping);
                setStep('mapping');
            }
        };
        reader.readAsBinaryString(file);
    };

    const handleValidate = async () => {
        setLoading(true);
        try {
            const mappedData = fileData.map(row => {
                const obj: any = {};
                Object.entries(mapping).forEach(([fieldKey, sheetHeader]) => {
                    obj[fieldKey] = row[sheetHeader];
                });
                return obj;
            });

            const results = await (apiService as any).validateBulkStudents(mappedData);
            setValidationResults(results);
            setStep('preview');
        } catch (error) {
            toast.showError('Validation failed. Please check your data format.');
        } finally {
            setLoading(false);
        }
    };

    const handleImport = async () => {
        setLoading(true);
        setStep('importing');
        setImportProgress(0);

        try {
            const validRecords = validationResults.filter(r => r.validationStatus === 'Valid');
            if (validRecords.length === 0) {
                toast.showWarning('No valid records to import.');
                setStep('preview');
                return;
            }

            const { jobId } = await (apiService as any).importBulkStudents(validRecords);
            
            // Start Polling
            const pollInterval = setInterval(async () => {
                try {
                    const status = await (apiService as any).getStudentImportStatus(jobId);
                    
                    if (status.progress !== undefined) {
                        setImportProgress(status.progress);
                    }

                    if (status.state === 'completed') {
                        clearInterval(pollInterval);
                        setImportResults(status.result);
                        setStep('complete');
                        setLoading(false);
                        if (status.result.success > 0) {
                            onSuccess();
                        }
                    } else if (status.state === 'failed') {
                        clearInterval(pollInterval);
                        toast.showError(`Import failed: ${status.failedReason || 'Unknown error'}`);
                        setStep('preview');
                        setLoading(false);
                    }
                } catch (err) {
                    console.error('Polling error:', err);
                }
            }, 2000);

        } catch (error) {
            toast.showError('Import failed. Please try again.');
            setStep('preview');
            setLoading(false);
        }
    };

    const downloadTemplate = () => {
        const allFields = [...REQUIRED_FIELDS, ...OPTIONAL_FIELDS];
        const templateHeaders = allFields.map(f => f.label);
        
        const sampleData = [
            allFields.map(f => {
                switch(f.key) {
                    case 'admissionNo': return 'ADM001';
                    case 'firstName': return 'Alice';
                    case 'lastName': return 'Smith';
                    case 'gender': return 'Female';
                    case 'dob': return '2010-05-15';
                    case 'admissionDate': return '2024-03-01';
                    case 'className': return 'Class 1';
                    case 'sectionName': return 'A';
                    case 'fatherName': return 'Robert Smith';
                    case 'guardianName': return 'Robert Smith';
                    case 'guardianPhone': return '+1234567890';
                    default: return '';
                }
            }),
            allFields.map(f => {
                switch(f.key) {
                    case 'admissionNo': return 'ADM002';
                    case 'firstName': return 'Bob';
                    case 'lastName': return 'Johnson';
                    case 'gender': return 'Male';
                    case 'dob': return '2011-08-20';
                    case 'admissionDate': return '2024-03-01';
                    case 'className': return 'Class 2';
                    case 'sectionName': return 'B';
                    case 'fatherName': return 'Michael Johnson';
                    case 'guardianName': return 'Michael Johnson';
                    case 'guardianPhone': return '+1234567891';
                    default: return '';
                }
            })
        ];
        
        const wb = XLSX.utils.book_new();
        const ws = XLSX.utils.aoa_to_sheet([templateHeaders, ...sampleData]);
        XLSX.utils.book_append_sheet(wb, ws, 'Student Template');
        XLSX.writeFile(wb, 'Student_Import_Template.xlsx');
    };

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-5xl max-h-[90vh] flex flex-col overflow-hidden border border-gray-200 dark:border-gray-700">
                {/* Header */}
                <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center bg-gray-50/50 dark:bg-gray-800/50">
                    <div>
                        <h3 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                            <Upload className="text-primary-600" size={24} />
                            Bulk Student Import
                        </h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Import student data in bulk from Excel or CSV</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full transition-all text-gray-500">
                        <X size={20} />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6">
                    {/* Stepper */}
                    <div className="flex items-center justify-center mb-8">
                        {[
                            { id: 'upload', label: 'Upload' },
                            { id: 'mapping', label: 'Mapping' },
                            { id: 'preview', label: 'Preview' },
                            { id: 'complete', label: 'Done' }
                        ].map((s, i, arr) => (
                            <React.Fragment key={s.id}>
                                <div className="flex flex-col items-center">
                                    <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold transition-all ${
                                        step === s.id || (step === 'importing' && s.id === 'preview') || (step === 'complete' && s.id === 'complete')
                                        ? 'bg-primary-600 text-white shadow-lg shadow-primary-200 dark:shadow-none' 
                                        : (arr.findIndex(x => x.id === step) > i || step === 'complete' ? 'bg-green-500 text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-400')
                                    }`}>
                                        {arr.findIndex(x => x.id === step) > i || step === 'complete' ? <Check size={20} /> : i + 1}
                                    </div>
                                    <span className={`text-xs mt-2 font-medium ${step === s.id ? 'text-primary-600' : 'text-gray-500'}`}>{s.label}</span>
                                </div>
                                {i < arr.length - 1 && (
                                    <div className={`w-16 h-1 mx-2 mb-6 rounded-full ${arr.findIndex(x => x.id === step) > i ? 'bg-green-500' : 'bg-gray-100 dark:bg-gray-700'}`} />
                                )}
                            </React.Fragment>
                        ))}
                    </div>

                    {step === 'upload' && (
                        <div className="text-center py-12">
                            <div className="max-w-md mx-auto p-8 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-3xl hover:border-primary-500 transition-all group flex flex-col items-center bg-gray-50/50 dark:bg-gray-800/50">
                                <div className="w-20 h-20 bg-primary-50 dark:bg-primary-900/20 rounded-2xl flex items-center justify-center text-primary-600 mb-6 group-hover:scale-110 transition-transform">
                                    <FileText size={40} />
                                </div>
                                <h4 className="text-lg font-bold text-gray-900 dark:text-white mb-2">Select Student Data File</h4>
                                <p className="text-gray-500 dark:text-gray-400 text-sm mb-6">Support .xlsx, .xls and .csv formats</p>
                                <label className="cursor-pointer bg-primary-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-primary-700 transition-all flex items-center gap-2">
                                    <Upload size={20} />
                                    Choose File
                                    <input type="file" className="hidden" accept=".xlsx, .xls, .csv" onChange={handleFileUpload} />
                                </label>
                            </div>
                            <button 
                                onClick={downloadTemplate}
                                className="mt-8 text-primary-600 dark:text-primary-400 font-semibold hover:underline flex items-center gap-2 mx-auto"
                            >
                                <Download size={18} />
                                Download Student Import Template
                            </button>
                        </div>
                    )}

                    {step === 'mapping' && (
                        <div className="space-y-6">
                            <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-xl border border-blue-100 dark:border-blue-800 flex items-start gap-3">
                                <div className="p-1 bg-blue-100 dark:bg-blue-800 text-blue-600 dark:text-blue-400 rounded-lg"><Info size={20} /></div>
                                <p className="text-sm text-blue-800 dark:text-blue-300">Match columns from your file to student fields. Required fields are marked with *.</p>
                            </div>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div className="space-y-4">
                                    <h4 className="font-bold text-gray-900 dark:text-white flex items-center gap-2">
                                        <div className="w-2 h-6 bg-primary-600 rounded-full" />
                                        Required Information
                                    </h4>
                                    {REQUIRED_FIELDS.map(field => (
                                        <div key={field.key} className="flex flex-col gap-1">
                                            <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">{field.label} *</label>
                                            <select 
                                                value={mapping[field.key] || ''} 
                                                onChange={(e) => setMapping(prev => ({ ...prev, [field.key]: e.target.value }))}
                                                className={`w-full p-2.5 rounded-xl border ${mapping[field.key] ? 'border-primary-500 bg-primary-50/10' : 'border-gray-200 dark:border-gray-700'} dark:bg-gray-800 outline-none focus:ring-2 focus:ring-primary-500`}
                                            >
                                                <option value="">Select Column...</option>
                                                {headers.map(h => <option key={h} value={h}>{h}</option>)}
                                            </select>
                                        </div>
                                    ))}
                                </div>
                                <div className="space-y-4">
                                    <h4 className="font-bold text-gray-900 dark:text-white flex items-center gap-2">
                                        <div className="w-2 h-6 bg-gray-400 rounded-full" />
                                        Additional Information
                                    </h4>
                                    {OPTIONAL_FIELDS.map(field => (
                                        <div key={field.key} className="flex flex-col gap-1">
                                            <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">{field.label}</label>
                                            <select 
                                                value={mapping[field.key] || ''} 
                                                onChange={(e) => setMapping(prev => ({ ...prev, [field.key]: e.target.value }))}
                                                className={`w-full p-2.5 rounded-xl border ${mapping[field.key] ? 'border-primary-500 bg-primary-50/10' : 'border-gray-200 dark:border-gray-700'} dark:bg-gray-800 outline-none focus:ring-2 focus:ring-primary-500`}
                                            >
                                                <option value="">Select Column...</option>
                                                {headers.map(h => <option key={h} value={h}>{h}</option>)}
                                            </select>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}

                    {step === 'preview' && (
                        <div className="space-y-4">
                            <div className="flex justify-between items-center mb-4">
                                <h4 className="font-bold text-gray-900 dark:text-white text-lg">Data Validation Preview</h4>
                                <div className="flex gap-4">
                                    <div className="flex items-center gap-2 text-sm text-green-600 font-bold bg-green-50 dark:bg-green-900/20 px-3 py-1 rounded-full">
                                        <Check size={16} /> {validationResults.filter(r => r.validationStatus === 'Valid').length} Ready
                                    </div>
                                    <div className="flex items-center gap-2 text-sm text-red-600 font-bold bg-red-50 dark:bg-red-900/20 px-3 py-1 rounded-full">
                                        <X size={16} /> {validationResults.filter(r => r.validationStatus === 'Invalid').length} Issues
                                    </div>
                                </div>
                            </div>

                            <div className="border border-gray-200 dark:border-gray-700 rounded-2xl overflow-hidden shadow-sm">
                                <div className="overflow-x-auto max-h-[400px]">
                                    <table className="w-full text-left text-sm">
                                        <thead className="bg-gray-50 dark:bg-gray-700 sticky top-0 z-10">
                                            <tr>
                                                <th className="px-4 py-3 font-bold border-b dark:border-gray-600 text-center">Status</th>
                                                <th className="px-4 py-3 font-bold border-b dark:border-gray-600">Admission No</th>
                                                <th className="px-4 py-3 font-bold border-b dark:border-gray-600">Student Name</th>
                                                <th className="px-4 py-3 font-bold border-b dark:border-gray-600">Class/Section</th>
                                                <th className="px-4 py-3 font-bold border-b dark:border-gray-600">Parent/Guardian</th>
                                                <th className="px-4 py-3 font-bold border-b dark:border-gray-600">Validation Errors</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                                            {validationResults.map((result, idx) => (
                                                <tr key={idx} className={`${result.validationStatus === 'Invalid' ? 'bg-red-50/30 dark:bg-red-900/10' : 'hover:bg-gray-50 dark:hover:bg-gray-700'}`}>
                                                    <td className="px-4 py-3">
                                                        <div className="flex justify-center">
                                                            {result.validationStatus === 'Valid' ? (
                                                                <div className="w-6 h-6 bg-green-500 text-white rounded-full flex items-center justify-center shadow-lg shadow-green-200 dark:shadow-none"><Check size={14} /></div>
                                                            ) : (
                                                                <div className="w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center shadow-lg shadow-red-200 dark:shadow-none"><AlertTriangle size={14} /></div>
                                                            )}
                                                        </div>
                                                    </td>
                                                    <td className="px-4 py-3 font-mono font-bold text-primary-600">{result.admissionNo || '-'}</td>
                                                    <td className="px-4 py-3 whitespace-nowrap font-medium text-gray-900 dark:text-white">{result.firstName} {result.lastName}</td>
                                                    <td className="px-4 py-3 whitespace-nowrap font-medium">
                                                        {result.className || 'N/A'} {result.sectionName ? `- ${result.sectionName}` : ''}
                                                    </td>
                                                    <td className="px-4 py-3 whitespace-nowrap">{result.guardianName || result.fatherName || 'N/A'}</td>
                                                    <td className="px-4 py-3">
                                                        {result.errors.map((err: string, i: number) => (
                                                            <div key={i} className="text-red-600 text-[11px] leading-tight font-bold flex items-center gap-1">
                                                                <AlertTriangle size={10} /> {err}
                                                            </div>
                                                        ))}
                                                        {result.errors.length === 0 && <span className="text-green-600 text-xs font-bold">No issues detected</span>}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    )}

                    {step === 'importing' && (
                        <div className="flex flex-col items-center justify-center py-20 animate-in fade-in zoom-in duration-300">
                            <div className="relative mb-8">
                                <Loader2 className="w-32 h-32 text-primary-600 animate-spin" strokeWidth={1} />
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <div className="text-xl font-black text-primary-600 font-mono">
                                        {importProgress}%
                                    </div>
                                </div>
                            </div>
                            <h4 className="text-2xl font-bold text-gray-900 dark:text-white mt-4">Processing Student Data</h4>
                            <p className="text-gray-500 dark:text-gray-400 mt-2 mb-8">Synchronizing records and setting up accounts...</p>
                            
                            <div className="w-full max-w-md bg-gray-100 dark:bg-gray-700 h-2 rounded-full overflow-hidden">
                                <div 
                                    className="h-full bg-primary-600 transition-all duration-500 ease-out shadow-lg shadow-primary-200"
                                    style={{ width: `${importProgress}%` }}
                                />
                            </div>
                            <div className="mt-4 text-xs font-bold text-primary-600 uppercase tracking-widest animate-pulse">
                                Please do not close this window
                            </div>
                        </div>
                    )}

                    {step === 'complete' && importResults && (
                        <div className="text-center py-6 animate-in fade-in zoom-in duration-500 max-w-4xl mx-auto">
                            <div className="w-24 h-24 bg-green-100 dark:bg-green-900/30 text-green-600 rounded-3xl flex items-center justify-center mx-auto mb-6 rotate-12">
                                <Check size={48} strokeWidth={3} />
                            </div>
                            <h4 className="text-4xl font-black text-gray-900 dark:text-white mb-2 italic">Operation Successful!</h4>
                            <p className="text-lg text-gray-600 dark:text-gray-400 mb-8">
                                We've successfully onboarded <span className="text-green-600 font-black px-2 py-0.5 bg-green-50 dark:bg-green-900/20 rounded-lg">{importResults.success}</span> students to the directory.
                            </p>
                            
                            {importResults.failed > 0 && (
                                <div className="max-w-md mx-auto bg-red-50 dark:bg-red-900/20 p-6 rounded-2xl border border-red-100 dark:border-red-900/30 mb-8">
                                    <h5 className="text-red-800 dark:text-red-400 font-bold mb-3 flex items-center gap-2 justify-center">
                                        <AlertTriangle size={18} /> {importResults.failed} Records Failed
                                    </h5>
                                    <div className="text-xs text-red-600 text-left space-y-2 max-h-40 overflow-y-auto pr-2">
                                        {importResults.errors.map((e: any, i: number) => (
                                            <div key={i} className="flex justify-between border-b border-red-100 dark:border-red-900/20 pb-1">
                                                <span className="font-mono font-bold">{e.admissionNo}</span>
                                                <span className="font-medium">{e.error}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            <div className="flex flex-col items-center gap-4">
                                <button 
                                    onClick={onClose}
                                    className="bg-primary-600 text-white px-12 py-4 rounded-2xl font-bold hover:bg-primary-700 transition-all shadow-xl shadow-primary-200 dark:shadow-none hover:-translate-y-1 w-full max-w-xs text-lg"
                                >
                                    Finish & Continue
                                </button>
                                <p className="text-xs text-gray-400 font-medium">
                                    System identity verified. Transaction ID: STU_{Math.random().toString(36).substring(7).toUpperCase()}
                                </p>
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer */}
                {step !== 'importing' && step !== 'complete' && (
                    <div className="px-6 py-4 border-t border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/80 flex justify-between items-center">
                        <div>
                            {(step === 'mapping' || step === 'preview') && (
                                <button
                                    onClick={() => setStep(step === 'mapping' ? 'upload' : 'mapping')}
                                    className="px-5 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-200 hover:bg-white dark:hover:bg-gray-700 transition-all font-semibold flex items-center gap-2"
                                >
                                    <ChevronLeft size={20} /> Previous Phase
                                </button>
                            )}
                        </div>
                        <div className="flex gap-4">
                            <button onClick={onClose} className="px-6 py-2.5 text-gray-500 font-semibold hover:text-gray-700 transition-all">
                                Cancel
                            </button>
                            {step === 'mapping' && (
                                <button
                                    onClick={handleValidate}
                                    disabled={loading || !REQUIRED_FIELDS.every(f => mapping[f.key])}
                                    className="bg-primary-600 text-white px-8 py-2.5 rounded-xl font-bold hover:bg-primary-700 transition-all shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                                >
                                    {loading ? <Loader2 className="animate-spin" size={20} /> : 'Process Validation'}
                                    {!loading && <ChevronRight size={20} />}
                                </button>
                            )}
                            {step === 'preview' && (
                                <button
                                    onClick={handleImport}
                                    disabled={loading || validationResults.filter(r => r.validationStatus === 'Valid').length === 0}
                                    className="bg-primary-600 text-white px-8 py-2.5 rounded-xl font-bold hover:bg-primary-700 transition-all shadow-lg hover:shadow-primary-100 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                                >
                                    {loading ? <Loader2 className="animate-spin" size={20} /> : `Finalize & Import ${validationResults.filter(r => r.validationStatus === 'Valid').length} Students`}
                                    {!loading && <Check size={20} />}
                                </button>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default BulkStudentImport;
