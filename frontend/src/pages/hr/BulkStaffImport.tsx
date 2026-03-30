import React, { useState } from 'react';
import { Upload, X, Check, AlertTriangle, FileText, Download, ChevronRight, ChevronLeft, Loader2, Info, Lock } from 'lucide-react';
import * as XLSX from 'xlsx';
import { staffService } from '../../services/hrService';
import { useToast } from '../../context/ToastContext';

interface BulkStaffImportProps {
    onClose: () => void;
    onSuccess: () => void;
}

type Step = 'upload' | 'mapping' | 'preview' | 'importing' | 'complete';

const REQUIRED_FIELDS = [
    { key: 'employeeId', label: 'Employee ID' },
    { key: 'firstName', label: 'First Name' },
    { key: 'lastName', label: 'Last Name' },
    { key: 'email', label: 'Email' },
    { key: 'phone', label: 'Phone Number' },
    { key: 'roleName', label: 'Role' },
    { key: 'gender', label: 'Gender' },
    { key: 'basicSalary', label: 'Basic Salary' },
];

const OPTIONAL_FIELDS = [
    { key: 'departmentName', label: 'Department' },
    { key: 'dateOfJoining', label: 'Date of Joining' },
    { key: 'employmentType', label: 'Employment Type' },
    { key: 'biometricId', label: 'Biometric ID' },
];

const BulkStaffImport: React.FC<BulkStaffImportProps> = ({ onClose, onSuccess }) => {
    const [step, setStep] = useState<Step>('upload');
    const [fileData, setFileData] = useState<any[]>([]);
    const [headers, setHeaders] = useState<string[]>([]);
    const [mapping, setMapping] = useState<Record<string, string>>({});
    const [validationResults, setValidationResults] = useState<any[]>([]);
    const [importResults, setImportResults] = useState<{ success: number, failed: number, records: any[], errors: any[] } | null>(null);
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
                        h.toLowerCase() === field.key.toLowerCase()
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

            const results = await staffService.validateBulkStaff(mappedData);
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
        try {
            // Only import valid records (or let backend decide, but here we can filter)
            const validRecords = validationResults.filter(r => r.validationStatus === 'Valid');
            if (validRecords.length === 0) {
                toast.showWarning('No valid records to import.');
                setStep('preview');
                return;
            }

            const results = await staffService.importBulkStaff(validRecords);
            setImportResults(results);
            console.log('[BulkStaffImport] Results:', results);
            setStep('complete');
            if (results.success > 0) {
                onSuccess();
            }
        } catch (error) {
            toast.showError('Import failed. Please try again.');
            setStep('preview');
        } finally {
            setLoading(false);
        }
    };

    const downloadTemplate = () => {
        // Group fields into the order they appear in the UI
        const allFields = [...REQUIRED_FIELDS, ...OPTIONAL_FIELDS];
        const templateHeaders = allFields.map(f => f.label);
        
        const sampleData = [
            // Sample Row 1: A complete teacher profile
            allFields.map(f => {
                switch(f.key) {
                    case 'employeeId': return 'STF001';
                    case 'firstName': return 'John';
                    case 'lastName': return 'Doe';
                    case 'email': return 'john.doe@school.com';
                    case 'phone': return '+1234567890';
                    case 'roleName': return 'Teacher';
                    case 'gender': return 'Male';
                    case 'dateOfJoining': return '2024-01-01';
                    case 'basicSalary': return '50000';
                    case 'employmentType': return 'Full-Time';
                    case 'biometricId': return 'BIO001';
                    default: return '';
                }
            }),
            // Sample Row 2: An admin profile
            allFields.map(f => {
                switch(f.key) {
                    case 'employeeId': return 'ADM002';
                    case 'firstName': return 'Jane';
                    case 'lastName': return 'Smith';
                    case 'email': return 'jane.admin@school.com';
                    case 'phone': return '+1234567891';
                    case 'roleName': return 'Admin';
                    case 'gender': return 'Female';
                    case 'dateOfJoining': return '2024-01-05';
                    case 'basicSalary': return '45000';
                    case 'employmentType': return 'Full-Time';
                    case 'biometricId': return 'BIO002';
                    default: return '';
                }
            })
        ];
        
        const wb = XLSX.utils.book_new();
        const ws = XLSX.utils.aoa_to_sheet([templateHeaders, ...sampleData]);
        XLSX.utils.book_append_sheet(wb, ws, 'Staff Template');
        XLSX.writeFile(wb, 'Staff_Import_Template.xlsx');
    };

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-5xl max-h-[90vh] flex flex-col overflow-hidden border border-gray-200 dark:border-gray-700">
                {/* Header */}
                <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center bg-gray-50/50 dark:bg-gray-800/50">
                    <div>
                        <h3 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                            <Upload className="text-primary-600" size={24} />
                            Bulk Staff Import
                        </h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Import hundreds of staff members in seconds</p>
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
                                <h4 className="text-lg font-bold text-gray-900 dark:text-white mb-2">Select your Staff File</h4>
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
                                Download Excel Template
                            </button>
                        </div>
                    )}

                    {step === 'mapping' && (
                        <div className="space-y-6">
                            <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-xl border border-blue-100 dark:border-blue-800 flex items-start gap-3">
                                <div className="p-1 bg-blue-100 dark:bg-blue-800 text-blue-600 dark:text-blue-400 rounded-lg"><Info size={20} /></div>
                                <p className="text-sm text-blue-800 dark:text-blue-300">Match the columns from your Excel file to the system fields below. The system has automatically mapped fields it recognized.</p>
                            </div>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div className="space-y-4">
                                    <h4 className="font-bold text-gray-900 dark:text-white flex items-center gap-2">
                                        <div className="w-2 h-6 bg-primary-600 rounded-full" />
                                        Required Fields
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
                                        Optional Fields
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
                                <h4 className="font-bold text-gray-900 dark:text-white text-lg">Smart Import Preview</h4>
                                <div className="flex gap-4">
                                    <div className="flex items-center gap-2 text-sm text-green-600 font-bold bg-green-50 dark:bg-green-900/20 px-3 py-1 rounded-full">
                                        <Check size={16} /> {validationResults.filter(r => r.validationStatus === 'Valid').length} Ready
                                    </div>
                                    <div className="flex items-center gap-2 text-sm text-red-600 font-bold bg-red-50 dark:bg-red-900/20 px-3 py-1 rounded-full">
                                        <X size={16} /> {validationResults.filter(r => r.validationStatus === 'Invalid').length} Errors
                                    </div>
                                </div>
                            </div>

                            <div className="border border-gray-200 dark:border-gray-700 rounded-2xl overflow-hidden shadow-sm">
                                <div className="overflow-x-auto max-h-[400px]">
                                    <table className="w-full text-left text-sm">
                                        <thead className="bg-gray-50 dark:bg-gray-700 sticky top-0 z-10">
                                            <tr>
                                                <th className="px-4 py-3 font-bold border-b dark:border-gray-600">Status</th>
                                                <th className="px-4 py-3 font-bold border-b dark:border-gray-600">ID</th>
                                                <th className="px-4 py-3 font-bold border-b dark:border-gray-600">Name</th>
                                                <th className="px-4 py-3 font-bold border-b dark:border-gray-600">Email</th>
                                                <th className="px-4 py-3 font-bold border-b dark:border-gray-600">Dept</th>
                                                <th className="px-4 py-3 font-bold border-b dark:border-gray-600">Errors</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                                            {validationResults.map((result, idx) => (
                                                <tr key={idx} className={`${result.validationStatus === 'Invalid' ? 'bg-red-50/30 dark:bg-red-900/10' : 'hover:bg-gray-50 dark:hover:bg-gray-700'}`}>
                                                    <td className="px-4 py-3">
                                                        {result.validationStatus === 'Valid' ? (
                                                            <div className="w-6 h-6 bg-green-500 text-white rounded-full flex items-center justify-center"><Check size={14} /></div>
                                                        ) : (
                                                            <div className="w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center"><AlertTriangle size={14} /></div>
                                                        )}
                                                    </td>
                                                    <td className="px-4 py-3 font-medium">{result.employeeId || '-'}</td>
                                                    <td className="px-4 py-3 whitespace-nowrap">{result.firstName} {result.lastName}</td>
                                                    <td className="px-4 py-3">{result.email}</td>
                                                    <td className="px-4 py-3 whitespace-nowrap">{result.departmentName}</td>
                                                    <td className="px-4 py-3">
                                                        {result.errors.map((err: string, i: number) => (
                                                            <div key={i} className="text-red-600 text-[11px] leading-tight font-medium">• {err}</div>
                                                        ))}
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
                            <div className="relative">
                                <Loader2 className="w-24 h-24 text-primary-600 animate-spin" strokeWidth={1} />
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <Upload className="text-primary-600" size={32} />
                                </div>
                            </div>
                            <h4 className="text-2xl font-bold text-gray-900 dark:text-white mt-8">Registering Staff...</h4>
                            <p className="text-gray-500 dark:text-gray-400 mt-2">Connecting to secure server and creating accounts</p>
                        </div>
                    )}

                    {step === 'complete' && importResults && (
                        <div className="text-center py-6 animate-in fade-in zoom-in duration-500 max-w-4xl mx-auto">
                            <div className="w-20 h-20 bg-green-100 dark:bg-green-900/30 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4 scale-110">
                                <Check size={40} />
                            </div>
                            <h4 className="text-3xl font-extrabold text-gray-900 dark:text-white mb-1">Import Complete!</h4>
                            <p className="text-gray-600 dark:text-gray-400 mb-6">
                                We've successfully imported <span className="text-green-600 font-black">{importResults.success}</span> staff members.
                            </p>
                            
                            {/* Credential Summary Table */}
                            {importResults.records && importResults.records.length > 0 && (
                                <div className="mb-6 text-left bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
                                    <div className="bg-gray-50 dark:bg-gray-700/50 px-4 py-3 border-b border-gray-200 dark:border-gray-700">
                                        <h4 className="text-sm font-bold text-gray-700 dark:text-gray-300 uppercase tracking-widest flex items-center gap-2">
                                            <Lock size={14} className="text-primary-500" />
                                            Generated Credentials
                                        </h4>
                                    </div>
                                    <div className="max-h-60 overflow-y-auto">
                                        <table className="w-full text-xs">
                                            <thead className="sticky top-0 bg-white dark:bg-gray-800 border-b dark:border-gray-700 z-10">
                                                <tr>
                                                    <th className="px-4 py-2 text-left font-bold text-gray-500 uppercase">Staff Member</th>
                                                    <th className="px-4 py-2 text-left font-bold text-gray-500 uppercase">Email</th>
                                                    <th className="px-4 py-2 text-left font-bold text-gray-500 uppercase">Initial Password</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                                                {importResults.records.map((record: any, idx: number) => (
                                                    <tr key={idx} className="hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors">
                                                        <td className="px-4 py-3 font-bold text-gray-900 dark:text-white">
                                                            {record.firstName} {record.lastName}
                                                        </td>
                                                        <td className="px-4 py-3 text-gray-600 dark:text-gray-400">
                                                            {record.email}
                                                        </td>
                                                        <td className="px-4 py-3">
                                                            <code className="bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-400 px-2 py-1 rounded font-bold border border-primary-100 dark:border-primary-900/30">
                                                                {record.initialPassword}
                                                            </code>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                    <div className="bg-primary-50 dark:bg-primary-900/10 px-4 py-2 text-[10px] text-primary-600 dark:text-primary-400 italic">
                                        * Please securely share these passwords with the staff.
                                    </div>
                                </div>
                            )}

                            {importResults.failed > 0 && (
                                <div className="max-w-md mx-auto bg-red-50 dark:bg-red-900/20 p-4 rounded-xl border border-red-100 dark:border-red-900/30 mb-6">
                                    <h5 className="text-red-800 dark:text-red-400 font-bold mb-2 flex items-center gap-2 justify-center text-sm">
                                        <AlertTriangle size={16} /> {importResults.failed} Records Failed
                                    </h5>
                                    <div className="text-[11px] text-red-600 text-left space-y-1">
                                        {importResults.errors.slice(0, 3).map((e: any, i: number) => (
                                            <div key={i} className="flex justify-between">
                                                <span>{e.employeeId}</span>
                                                <span className="font-medium">{e.error}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            <div className="flex flex-col items-center gap-4">
                                <button 
                                    onClick={onClose}
                                    className="bg-primary-600 text-white px-10 py-3.5 rounded-2xl font-bold hover:bg-primary-700 transition-all shadow-lg hover:-translate-y-1 w-full max-w-xs"
                                >
                                    Finish & View Directory
                                </button>
                                <p className="text-[10px] text-gray-400 font-mono">
                                    Record sync complete. ID: {importResults.records?.[0]?.tenantId?.slice(0,8)}...
                                </p>
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer Actions */}
                {step !== 'importing' && step !== 'complete' && (
                    <div className="px-6 py-4 border-t border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/80 flex justify-between items-center">
                        <div>
                            {step === 'mapping' && (
                                <button
                                    onClick={() => setStep('upload')}
                                    className="px-5 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-200 hover:bg-white dark:hover:bg-gray-700 transition-all font-semibold flex items-center gap-2"
                                >
                                    <ChevronLeft size={20} /> Back
                                </button>
                            )}
                            {step === 'preview' && (
                                <button
                                    onClick={() => setStep('mapping')}
                                    className="px-5 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-200 hover:bg-white dark:hover:bg-gray-700 transition-all font-semibold flex items-center gap-2"
                                >
                                    <ChevronLeft size={20} /> Back to Mapping
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
                                    {loading ? <Loader2 className="animate-spin" size={20} /> : 'Validate Data'}
                                    {!loading && <ChevronRight size={20} />}
                                </button>
                            )}
                            {step === 'preview' && (
                                <button
                                    onClick={handleImport}
                                    disabled={loading || validationResults.filter(r => r.validationStatus === 'Valid').length === 0}
                                    className="bg-primary-600 text-white px-8 py-2.5 rounded-xl font-bold hover:bg-primary-700 transition-all shadow-lg hover:shadow-primary-100 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                                >
                                    {loading ? <Loader2 className="animate-spin" size={20} /> : `Import ${validationResults.filter(r => r.validationStatus === 'Valid').length} Staff`}
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

export default BulkStaffImport;
