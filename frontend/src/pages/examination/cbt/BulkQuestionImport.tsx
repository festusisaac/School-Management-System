import React, { useState } from 'react';
import { Upload, FileSpreadsheet, X, Check, AlertCircle, Download, FileText, LayoutList } from 'lucide-react';
import * as XLSX from 'xlsx';
import { useToast } from '../../../context/ToastContext';

interface BulkQuestionImportProps {
    isOpen: boolean;
    onImport: (data: any[]) => void;
    onClose: () => void;
}

export default function BulkQuestionImport({ isOpen, onImport, onClose }: BulkQuestionImportProps) {
    const { showError } = useToast();
    const [previewData, setPreviewData] = useState<any[]>([]);
    const [fileName, setFileName] = useState('');
    const [isDragging, setIsDragging] = useState(false);

    if (!isOpen) return null;

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) processFile(file);
    };

    const processFile = (file: File) => {
        setFileName(file.name);
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const data = new Uint8Array(e.target?.result as ArrayBuffer);
                const workbook = XLSX.read(data, { type: 'array' });
                const sheetName = workbook.SheetNames[0];
                const worksheet = workbook.Sheets[sheetName];
                const json = XLSX.utils.sheet_to_json(worksheet);
                setPreviewData(json);
            } catch (err) {
                showError('Failed to parse file. Ensure it is a valid Excel or CSV.');
            }
        };
        reader.readAsArrayBuffer(file);
    };

    const downloadTemplate = () => {
        const template = [
            {
                'Question': 'What is the capital of France?',
                'Option A': 'Berlin',
                'Option B': 'Madrid',
                'Option C': 'Paris',
                'Option D': 'Rome',
                'Correct Answer': 'C',
                'Marks': 2
            },
            {
                'Question': 'Which planet is known as the Red Planet?',
                'Option A': 'Venus',
                'Option B': 'Mars',
                'Option C': 'Jupiter',
                'Option D': 'Saturn',
                'Correct Answer': 'B',
                'Marks': 1
            }
        ];
        
        const worksheet = XLSX.utils.json_to_sheet(template);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Questions_Template');
        XLSX.writeFile(workbook, 'CBT_Question_Import_Template.xlsx');
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-gray-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-300">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden animate-in zoom-in duration-200 border border-gray-100 dark:border-gray-700">
                {/* Modal Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/50">
                    <div className="flex items-center gap-2">
                        <div className="p-1.5 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg">
                            <FileSpreadsheet className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                        </div>
                        <div>
                            <h3 className="text-lg font-bold text-gray-900 dark:text-white">Bulk Question Import</h3>
                            <p className="text-[11px] text-gray-400 dark:text-gray-500 font-medium">Add multiple questions via Excel/CSV</p>
                        </div>
                    </div>
                    <button 
                        onClick={onClose} 
                        className="p-1.5 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors group"
                    >
                        <X className="w-5 h-5 text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-300" />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-8 space-y-8">
                    {previewData.length === 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
                            {/* Step 1: Template */}
                            <div className="space-y-4">
                                <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-widest">Step 1: Get Template</label>
                                <div className="p-6 rounded-2xl border border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/20 space-y-4 text-center md:text-left">
                                    <div className="w-10 h-10 bg-primary-50 dark:bg-primary-900/20 rounded-xl flex items-center justify-center mx-auto md:mx-0">
                                        <Download className="w-5 h-5 text-primary-600 dark:text-primary-400" />
                                    </div>
                                    <h4 className="font-bold text-gray-900 dark:text-white">Download CSV Template</h4>
                                    <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">
                                        Download our optimized Excel template to ensure your questions are formatted correctly for the system.
                                    </p>
                                    <button
                                        onClick={downloadTemplate}
                                        className="inline-flex items-center gap-2 px-4 py-2.5 bg-primary-600 text-white text-xs font-bold rounded-xl shadow-lg shadow-primary-500/20 hover:bg-primary-700 transition-all active:scale-95"
                                    >
                                        <Download className="w-3.5 h-3.5" />
                                        Download (.xlsx)
                                    </button>
                                </div>
                            </div>

                            {/* Step 2: Upload */}
                            <div className="space-y-4">
                                <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-widest">Step 2: Upload File</label>
                                <div
                                    onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                                    onDragLeave={() => setIsDragging(false)}
                                    onDrop={(e) => {
                                        e.preventDefault();
                                        setIsDragging(false);
                                        if (e.dataTransfer.files?.[0]) processFile(e.dataTransfer.files[0]);
                                    }}
                                    className={`h-[210px] border-2 border-dashed rounded-3xl flex flex-col items-center justify-center gap-4 transition-all ${
                                        isDragging 
                                            ? 'border-primary-500 bg-primary-50/20 scale-[1.01]' 
                                            : 'border-gray-200 dark:border-gray-700 hover:border-primary-400 bg-gray-50/30'
                                    }`}
                                >
                                    <div className="w-12 h-12 bg-white dark:bg-gray-800 rounded-full flex items-center justify-center shadow-sm border border-gray-100 dark:border-gray-700">
                                        <Upload className={`w-6 h-6 ${isDragging ? 'text-primary-500' : 'text-gray-300'}`} />
                                    </div>
                                    <div className="text-center">
                                        <p className="text-sm font-bold text-gray-700 dark:text-gray-300">Drop your file here</p>
                                        <p className="text-[11px] text-gray-400 mt-1">.xlsx, .xls, .csv</p>
                                    </div>
                                    <label className="inline-flex items-center px-4 py-2 bg-gray-900 dark:bg-gray-700 text-white text-xs font-bold rounded-xl cursor-pointer hover:bg-black transition-colors">
                                        Choose File
                                        <input type="file" className="hidden" accept=".xlsx,.xls,.csv" onChange={handleFileUpload} />
                                    </label>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-6">
                            <div className="flex items-center justify-between border-b dark:border-gray-700 pb-4">
                                <div>
                                    <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-1">File Preview</label>
                                    <div className="flex items-center gap-2">
                                        <FileText className="w-4 h-4 text-emerald-500" />
                                        <h4 className="font-bold text-gray-900 dark:text-white text-sm">
                                            {fileName} <span className="text-gray-400 font-normal">({previewData.length} records detected)</span>
                                        </h4>
                                    </div>
                                </div>
                                <button 
                                    onClick={() => setPreviewData([])} 
                                    className="text-xs font-bold text-red-500 hover:text-red-600 transition-colors"
                                >
                                    Reset Selection
                                </button>
                            </div>

                            <div className="overflow-hidden rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
                                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                                    <thead className="bg-gray-50 dark:bg-gray-900/50">
                                        <tr>
                                            <th className="px-5 py-4 text-left text-[11px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest">Question Text</th>
                                            <th className="px-5 py-4 text-left text-[11px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest">Answer Key</th>
                                            <th className="px-5 py-4 text-left text-[11px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest">Weight</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                                        {previewData.slice(0, 50).map((row, i) => (
                                            <tr key={i} className="hover:bg-gray-50/50 dark:hover:bg-gray-700/50 transition-colors">
                                                <td className="px-5 py-3.5 text-xs text-gray-900 dark:text-gray-300 font-medium truncate max-w-sm">
                                                    {row.Question || row.question}
                                                </td>
                                                <td className="px-5 py-3.5">
                                                    <span className="px-2 py-0.5 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-800/50 rounded text-[10px] font-bold">
                                                        Option {row['Correct Answer'] || row.correctAnswer}
                                                    </span>
                                                </td>
                                                <td className="px-5 py-3.5 text-xs text-gray-500 dark:text-gray-400 font-bold">
                                                    {row.Marks || row.marks || 1}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                            {previewData.length > 50 && (
                                <p className="text-[11px] text-gray-400 text-center italic">... Showing first 50 entries ...</p>
                            )}
                        </div>
                    )}
                </div>

                {/* Modal Footer */}
                <div className="px-6 py-4 border-t border-gray-100 dark:border-gray-700 bg-gray-50/30 dark:bg-gray-800/20 flex justify-end gap-3">
                    <button
                        onClick={onClose}
                        className="px-5 py-2 text-sm font-semibold text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        disabled={previewData.length === 0}
                        onClick={() => onImport(previewData)}
                        className="px-6 py-2 text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-lg shadow-emerald-500/20 transition-all active:scale-95 disabled:opacity-50"
                    >
                        Import {previewData.length} Questions
                    </button>
                </div>
            </div>
        </div>
    );
}
