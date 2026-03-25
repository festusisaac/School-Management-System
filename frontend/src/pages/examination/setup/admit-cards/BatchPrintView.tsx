import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import AdmitCardRenderer, { Section } from './AdmitCardRenderer';

interface Props {
    template: {
        sections: Section[];
        config: any;
    };
    students: any[];
    schedules: any[];
    onClose: () => void;
}

const BatchPrintView: React.FC<Props> = ({ template, students, schedules, onClose }) => {
    useEffect(() => {
        // Prevent body scroll when preview is open
        document.body.style.overflow = 'hidden';

        // Automatically trigger print after a short delay to allow images to load
        const timer = setTimeout(() => {
            window.print();
        }, 2000); // Slightly longer delay for stability

        return () => {
            document.body.style.overflow = 'auto';
            clearTimeout(timer);
        };
    }, []);

    return createPortal(
        <div id="admit-card-print-portal" className="fixed inset-0 z-[10000] bg-white overflow-y-auto print:static print:inset-auto print:bg-transparent">
            {/* Action Bar - Hidden during print */}
            <div className="sticky top-0 p-4 bg-gray-900 text-white flex justify-between items-center print:hidden border-b border-gray-800 z-50">
                <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-primary-600 rounded-xl flex items-center justify-center font-black text-xl shadow-lg shadow-primary-600/20">P</div>
                    <div>
                        <h2 className="text-sm font-black uppercase tracking-widest leading-tight">Batch Print Preview</h2>
                        <p className="text-[10px] text-gray-400 uppercase tracking-tighter font-bold">Total: {students.length} Admit Cards</p>
                    </div>
                </div>
                <div className="flex gap-3">
                    <button
                        onClick={() => window.print()}
                        className="px-6 py-2.5 bg-primary-600 text-white rounded-xl text-xs font-black uppercase tracking-widest hover:bg-primary-700 transition-all shadow-lg shadow-primary-600/20 active:scale-95"
                    >
                        Print Now
                    </button>
                    <button
                        onClick={onClose}
                        className="px-6 py-2.5 bg-gray-800 text-white rounded-xl text-xs font-black uppercase tracking-widest hover:bg-gray-700 transition-all border border-gray-700 active:scale-95"
                    >
                        Close
                    </button>
                </div>
            </div>

            {/* Print Container */}
            <div className="bg-gray-50 dark:bg-gray-950 min-h-screen py-12 print:p-0 print:bg-white print:min-h-0 print:block">
                <div className="max-w-[1000px] mx-auto space-y-12 print:space-y-0 print:max-w-none print:w-full print:block">
                    {students.map((student, index) => (
                        <div
                            key={student.id}
                            className={`flex justify-center flex-col items-center w-full print:block print:w-full ${index !== students.length - 1 ? 'print:break-after-page' : ''}`}
                        >
                            <div className="bg-white shadow-[0_20px_50px_rgba(0,0,0,0.1)] dark:shadow-none print:shadow-none mb-12 print:mb-0 print:w-full">
                                <AdmitCardRenderer
                                    sections={template.sections}
                                    config={template.config}
                                    student={student}
                                    schedules={schedules}
                                />
                            </div>
                            {/* Visual indicator of page break in preview */}
                            {index !== students.length - 1 && (
                                <div className="w-full h-px border-t-2 border-dashed border-gray-200 dark:border-gray-800 my-8 print:hidden" />
                            )}
                        </div>
                    ))}
                </div>
            </div>

            <style>{`
                @media print {
                    /* Hide EVERYTHING except our portal */
                    body > *:not(#admit-card-print-portal) {
                        display: none !important;
                    }

                    header, footer, nav, aside {
                        display: none !important;
                    }
                    
                    body {
                        margin: 0 !important;
                        padding: 0 !important;
                        background: white !important;
                    }

                    body > #admit-card-print-portal {
                        display: block !important;
                        position: static !important;
                        width: 100% !important;
                        height: auto !important;
                        overflow: visible !important;
                        background: white !important;
                        margin: 0 !important;
                        padding: 0 !important;
                    }

                    .print\\:break-after-page {
                        break-after: page !important;
                        page-break-after: always !important;
                        display: block !important;
                    }
                }

                @page {
                    size: ${template?.config?.layout === 'landscape' ? 'landscape' : 'portrait'};
                    margin: 0mm;
                }
            `}</style>
        </div>,
        document.body
    );
};

export default BatchPrintView;
