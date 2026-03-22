import { forwardRef } from 'react';
import { formatCurrency } from '../../../utils/currency';
import { numberToWords } from '../../../utils/numberToWords';

interface FeeNoticeProps {
    student: any;
    statement: any;
    schoolInfo?: {
        name: string;
        address: string;
        phone: string;
        email: string;
        logo?: string;
        currencyName?: string;
        subunitName?: string;
    };
}

export const FeeNoticeTemplate = forwardRef<HTMLDivElement, FeeNoticeProps>(({ student, statement, schoolInfo }, ref) => {
    if (!student || !statement) return null;

    const { balance, assignedHeads } = statement;
    const date = new Date().toLocaleDateString();

    return (
        <div ref={ref} className="bg-white text-black font-sans leading-relaxed relative print:w-full print:p-0 print:m-0">
            <div className="p-8 m-10 max-w-3xl mx-auto min-h-[95vh] border-4 border-double border-primary-600 print:m-4 print:max-w-none print:min-h-[265mm] flex flex-col">
                
                {/* Header */}
                <div className="flex justify-between items-start border-b-2 border-gray-900 pb-6 mb-8">
                    <div className="flex items-center gap-4">
                        <img
                            src={schoolInfo?.logo || "https://placehold.co/150x150?text=LOGO"}
                            alt="Logo"
                            className="w-20 h-20 object-contain"
                        />
                        <div>
                            <h1 className="text-2xl font-black uppercase tracking-tight text-gray-900">{schoolInfo?.name || 'OYSTER CHECKS INT\'L SCHOOL'}</h1>
                            <p className="text-sm font-medium text-gray-600 max-w-xs">{schoolInfo?.address || '123 Education Lane, Knowledge City'}</p>
                            <div className="flex gap-3 text-xs font-bold text-gray-500 mt-1">
                                <span>{schoolInfo?.phone || '+234 800 123 4567'}</span>
                                <span>•</span>
                                <span>{schoolInfo?.email || 'admin@school.com'}</span>
                            </div>
                        </div>
                    </div>
                    <div className="text-right">
                        <h2 className="text-xl font-black uppercase tracking-widest border-2 border-primary-600 px-4 py-1 inline-block mb-2 text-primary-600">
                            FEE DEMAND NOTICE
                        </h2>
                        <p className="text-sm font-bold text-gray-600">Date: <span className="font-bold text-black">{date}</span></p>
                    </div>
                </div>

                {/* Notice Intro */}
                <div className="mb-8">
                    <p className="text-sm font-medium text-gray-800">
                        Dear Parent/Guardian of <span className="font-black underline px-1 text-base">{student.firstName} {student.lastName}</span>,
                    </p>
                    <p className="text-sm text-gray-600 mt-3 leading-relaxed">
                        This is a formal notification regarding the outstanding fees for your ward. 
                        Please find below the breakdown of current dues and total outstanding balance as per our records. 
                        We request you to kindly settle the outstanding amount at your earliest convenience to ensure uninterrupted educational services.
                    </p>
                </div>

                {/* Info Grid */}
                <div className="grid grid-cols-2 gap-12 mb-8">
                    <div>
                        <h3 className="text-xs font-black uppercase text-gray-400 tracking-widest mb-3 border-b border-gray-200 pb-1">Student Particulars</h3>
                        <div className="space-y-1">
                            <p className="text-sm font-medium text-gray-600">Admission No: <span className="font-bold text-black">{student.admissionNo}</span></p>
                            <p className="text-sm font-medium text-gray-600">Class: <span className="font-bold text-black">{student.class?.name || 'N/A'}</span></p>
                        </div>
                    </div>
                    <div className="text-right">
                        <h3 className="text-xs font-black uppercase text-gray-400 tracking-widest mb-3 border-b border-gray-200 pb-1">Urgency Level</h3>
                        <p className="text-lg font-black text-red-600 uppercase tracking-tighter">IMMEDIATE ATTENTION</p>
                    </div>
                </div>

                {/* Fee Breakdown */}
                <div className="mb-8 flex-1">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-gray-100 border-y-2 border-gray-900">
                                <th className="py-3 px-4 text-xs font-black uppercase tracking-widest text-gray-700">Fee Component</th>
                                <th className="py-3 px-4 text-xs font-black uppercase tracking-widest text-right text-gray-700 w-32">Allocated</th>
                                <th className="py-3 px-4 text-xs font-black uppercase tracking-widest text-right text-gray-700 w-32">Already Paid</th>
                                <th className="py-3 px-4 text-xs font-black uppercase tracking-widest text-right text-gray-700 w-32 font-bold bg-primary-50">Outstanding</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                            {assignedHeads?.map((head: any, idx: number) => (
                                <tr key={idx} className="print:break-inside-avoid">
                                    <td className="py-3 px-4">
                                        <div className="flex flex-col">
                                            <span className="text-sm font-bold text-gray-900">{head.name}</span>
                                            <span className="text-[10px] text-gray-400 font-black uppercase tracking-tighter">{head.group}</span>
                                        </div>
                                    </td>
                                    <td className="py-3 px-4 text-sm text-right text-gray-600">{formatCurrency(parseFloat(head.amount))}</td>
                                    <td className="py-3 px-4 text-sm text-right text-emerald-600 font-bold">{formatCurrency(parseFloat(head.amount) - parseFloat(head.balance))}</td>
                                    <td className="py-3 px-4 text-sm text-right font-black text-red-600 bg-primary-50/20">{formatCurrency(parseFloat(head.balance))}</td>
                                </tr>
                            ))}
                        </tbody>
                        <tfoot className="border-t-2 border-gray-900">
                            <tr className="bg-primary-600 text-white font-black">
                                <td className="py-4 px-4 text-sm uppercase tracking-widest">Total Net Payable Balance</td>
                                <td colSpan={2}></td>
                                <td className="py-4 px-4 text-xl text-right">{formatCurrency(parseFloat(balance))}</td>
                            </tr>
                        </tfoot>
                    </table>
                </div>

                {/* Words */}
                <div className="mb-8 border border-gray-200 bg-gray-50 p-4 rounded-lg">
                    <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-1">In Words</p>
                    <p className="text-sm italic font-bold text-gray-900 capitalize">
                        {numberToWords(balance, schoolInfo?.currencyName, schoolInfo?.subunitName)}
                    </p>
                </div>

                {/* Footer */}
                <div className="mt-auto pt-8 border-t border-gray-100 flex justify-between items-end">
                    <div className="max-w-sm">
                        <p className="text-[10px] font-black uppercase text-gray-400 mb-2">Notice Note:</p>
                        <p className="text-[10px] text-gray-500 italic leading-tight">
                            Please ignore this notice if payment has been made in the last 24 hours. 
                            Official bank receipts must be presented to the accounts department for reconciliation.
                        </p>
                    </div>
                    <div className="text-center w-48">
                        <div className="h-12 border-b border-gray-900 mb-1"></div>
                        <p className="text-[10px] font-black uppercase text-gray-900">Accountant / Bursar</p>
                    </div>
                </div>

                <div className="mt-4 text-center">
                    <p className="text-[8px] uppercase font-bold text-gray-300 tracking-[0.5em]">This is a system generated document</p>
                </div>
            </div>
        </div>
    );
});

FeeNoticeTemplate.displayName = 'FeeNoticeTemplate';
