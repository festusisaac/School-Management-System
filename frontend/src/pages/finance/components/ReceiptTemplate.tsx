import { forwardRef } from 'react';
import { formatCurrency } from '../../../utils/currency';
import { numberToWords } from '../../../utils/numberToWords';
import { getDetailedPaymentMethod } from '../../../utils/transactionUtils';
import { clsx } from 'clsx';

interface ReceiptProps {
    transaction: any;
    schoolInfo?: {
        name: string;
        address: string;
        phone: string;
        email: string;
        logo?: string;
        currencyName?: string;
        subunitName?: string;
        invoicePrefix?: string;
    };
}

export const ReceiptTemplate = forwardRef<HTMLDivElement, ReceiptProps>(({ transaction, schoolInfo }, ref) => {
    if (!transaction) return null;

    const { student, amount, type, reference, createdAt, meta } = transaction;
    const allocations = meta?.allocations || [];

    // Determine Watermark Text
    let watermarkText = "PAID";
    let watermarkColor = "text-green-500/10";
    let borderColor = "border-green-500";

    if (type === 'REFUND') {
        watermarkText = "REVERSED";
        watermarkColor = "text-red-500/10";
        borderColor = "border-red-500";
    } else if (type === 'WAIVER') {
        watermarkText = "WAIVED";
        watermarkColor = "text-amber-500/10";
        borderColor = "border-amber-500";
    } else if (allocations.some((a: any) => a.status === 'PARTIAL')) {
        watermarkText = "PARTIAL";
        watermarkColor = "text-yellow-500/10";
        borderColor = "border-yellow-500";
    }

    // Map borderColor class to hex for safety in print window
    const borderHex = borderColor === "border-green-500" ? "#22c55e" :
        borderColor === "border-red-500" ? "#ef4444" :
            borderColor === "border-amber-500" ? "#f59e0b" : "#4ade80";

    const verificationUrl = `https://school.com/verify/${transaction.id}`;

    return (
        <div ref={ref} className="bg-white text-black font-sans leading-relaxed relative print:w-full print:p-0 print:m-0">
            {/* Watermark moved to top layer */}
            <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 -rotate-45 text-9xl font-black uppercase pointer-events-none select-none z-50 ${watermarkColor}`}>
                {watermarkText}
            </div>

            <div
                className={clsx(
                    "relative z-10 p-8 m-10 max-w-3xl mx-auto min-h-[95vh] border-4 border-double print:m-4 print:max-w-none print:min-h-[265mm] flex flex-col",
                    borderColor
                )}
                style={{ borderColor: borderHex }}
            >

                {/* 1. Header: Institutional Identity */}
                <div className="flex justify-between items-start border-b-2 border-gray-900 pb-6 mb-8 print:break-inside-avoid">
                    <div className="flex items-center gap-4">
                        <img
                            src={schoolInfo?.logo || "https://placehold.co/150x150?text=LOGO"}
                            alt="Logo"
                            className="w-20 h-20 object-contain" // Scaled down
                        />
                        <div>
                            <h1 className="text-2xl font-black uppercase tracking-tight text-gray-900">{schoolInfo?.name || 'OYSTER CHECKS INT\'L SCHOOL'}</h1>
                            <p className="text-sm font-medium text-gray-600 max-w-xs">{schoolInfo?.address || '123 Education Lane, Knowledge City'}</p>
                            <div className="flex gap-3 text-xs font-bold text-gray-500 mt-1">
                                <span>{schoolInfo?.phone || '+234 800 123 4567'}</span>
                                <span>•</span>
                                <span>{schoolInfo?.email || 'bursar@oysterchecks.com'}</span>
                            </div>
                        </div>
                    </div>
                    <div className="text-right">
                        <h2 className={clsx(
                            "text-xl font-black uppercase tracking-widest border-2 px-4 py-1 inline-block mb-2",
                            type === 'WAIVER' ? "text-amber-600 border-amber-600" : "text-gray-900 border-gray-900"
                        )}>
                            {type === 'WAIVER' ? 'FEE WAIVER / ADJUSTMENT' : 'OFFICIAL RECEIPT'}
                        </h2>
                        <p className="text-sm font-bold text-gray-600">No: <span className="font-bold text-black">{(schoolInfo?.invoicePrefix || '') + transaction.id.slice(0, 8).toUpperCase()}</span></p>
                    </div>
                </div>

                {/* 2. Information Grid: Who & When */}
                <div className="grid grid-cols-2 gap-12 mb-8 print:break-inside-avoid">
                    {/* Left: Student Details */}
                    <div>
                        <h3 className="text-xs font-black uppercase text-gray-400 tracking-widest mb-3 border-b border-gray-200 pb-1">Received From</h3>
                        <div className="space-y-1">
                            <p className="text-lg font-bold text-gray-900">{student?.firstName} {student?.lastName}</p>
                            <p className="text-sm font-medium text-gray-600">Admission No: <span className="font-bold text-black">{student?.admissionNo}</span></p>
                            <p className="text-sm font-medium text-gray-600">Class: <span className="font-bold text-black">{student?.class?.name || 'N/A'}{student?.section?.name ? ` (${student.section.name})` : ''}</span></p>
                        </div>
                    </div>

                    {/* Right: Payment Details */}
                    <div className="text-right">
                        <h3 className="text-xs font-black uppercase text-gray-400 tracking-widest mb-3 border-b border-gray-200 pb-1">Payment Details</h3>
                        <div className="space-y-1">
                            <p className="text-sm font-medium text-gray-600">Date: <span className="font-bold text-black">{new Date(createdAt).toLocaleDateString()}</span></p>
                            <p className="text-sm font-medium text-gray-600">Time: <span className="font-bold text-black">{new Date(createdAt).toLocaleTimeString()}</span></p>
                            {type !== 'WAIVER' && (
                                <>
                                    <p className="text-sm font-medium text-gray-600">Method: <span className="font-bold text-black uppercase">{getDetailedPaymentMethod(transaction)}</span></p>
                                    <p className="text-sm font-medium text-gray-600">Ref ID: <span className="font-bold text-black">{reference || 'N/A'}</span></p>
                                </>
                            )}
                            {type === 'WAIVER' && (
                                <p className="text-sm font-medium text-amber-600 font-bold uppercase">Non-Cash Adjustment</p>
                            )}
                        </div>
                    </div>
                </div>

                {/* 3. Itemized Table */}
                <div className="mb-8">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-gray-100 border-y-2 border-gray-900">
                                <th className="py-3 px-4 text-xs font-black uppercase tracking-widest text-gray-700">Item Description</th>
                                <th className="py-3 px-4 text-xs font-black uppercase tracking-widest text-right text-gray-700 w-32">Amount Due</th>
                                <th className="py-3 px-4 text-xs font-black uppercase tracking-widest text-right text-gray-700 w-32">Amount Paid</th>
                                <th className="py-3 px-4 text-xs font-black uppercase tracking-widest text-right text-gray-700 w-32">Balance</th>
                            </tr>
                        </thead>
                        <tbody>
                            {allocations.length > 0 ? (
                                allocations.map((alloc: any, idx: number) => (
                                    <tr key={idx} className="border-b border-gray-200 print:break-inside-avoid">
                                        <td className="py-3 px-4 text-sm font-bold text-gray-900">
                                            {alloc.name || 'Fee Payment'}
                                            {alloc.status && <span className="text-[10px] ml-2 font-normal text-gray-500 uppercase">({alloc.status})</span>}
                                        </td>
                                        <td className="py-3 px-4 text-sm text-right text-gray-600 w-32">
                                            {alloc.totalDue ? formatCurrency(parseFloat(alloc.totalDue)) : '-'}
                                        </td>
                                        <td className="py-3 px-4 text-sm font-bold text-right text-black w-32">
                                            {formatCurrency(parseFloat(alloc.amount))}
                                        </td>
                                        <td className="py-3 px-4 text-sm text-right text-gray-600 w-32">
                                            {alloc.balance ? formatCurrency(parseFloat(alloc.balance)) : '-'}
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr className="border-b border-gray-200">
                                    <td className="py-3 px-4 text-sm font-bold text-gray-900">{type === 'REFUND' ? 'Refund Processed' : 'Payment'}</td>
                                    <td className="py-3 px-4 text-right w-32">-</td>
                                    <td className="py-3 px-4 text-sm font-bold text-right text-black w-32">{formatCurrency(amount)}</td>
                                    <td className="py-3 px-4 text-right w-32">-</td>
                                </tr>
                            )}
                        </tbody>
                    </table>

                    {/* Grand Totals - Moved outside table to prevent browser-level footer repetition */}
                    <div className="border-t-2 border-gray-900 bg-gray-50 flex items-stretch print:break-inside-avoid shadow-sm">
                        <div className="flex-1 py-4 px-4 text-sm font-black uppercase text-left">
                            Grand Totals
                        </div>
                        <div className="w-32 py-4 px-4 text-sm text-right text-gray-600 border-l border-gray-200">
                            {allocations.length > 0 ? formatCurrency(allocations.reduce((acc: number, a: any) => acc + parseFloat(a.totalDue || '0'), 0)) : '-'}
                        </div>
                        <div className={clsx(
                            "w-32 py-4 px-4 text-right text-xl font-black border-l border-r border-gray-300",
                            type === 'WAIVER' ? "text-amber-600" : "text-black"
                        )}>
                            {formatCurrency(amount)}
                        </div>
                        <div className="w-32 py-4 px-4 text-sm text-right font-black text-red-600 border-r border-gray-200">
                            {allocations.length > 0 ? formatCurrency(allocations.reduce((acc: number, a: any) => acc + parseFloat(a.balance || '0'), 0)) : '-'}
                        </div>
                    </div>
                </div>

                {/* Spacer to push footer to bottom for short receipts */}
                <div className="flex-grow"></div>

                {/* 4. Words Total */}
                <div className="mb-8 border border-gray-200 bg-gray-50 p-4 rounded-lg">
                    <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-1">Amount in Words</p>
                    <p className="text-sm italic font-bold text-gray-900 capitalize">
                        {numberToWords(amount, schoolInfo?.currencyName, schoolInfo?.subunitName)}
                    </p>
                </div>

                {/* 5. Footer: Security & Legal */}
                <div className="flex items-end justify-between mt-12 pt-4 print:break-inside-avoid">
                    {/* QR Code */}
                    <div className="flex flex-col gap-2">
                        <div className="bg-white p-1 border border-gray-200 inline-block">
                            <img
                                src={`https://api.qrserver.com/v1/create-qr-code/?size=80x80&data=${encodeURIComponent(verificationUrl)}`}
                                alt="QR Verification"
                                className="w-20 h-20"
                            />
                        </div>
                        <p className="text-[10px] text-gray-400">Scan to verify</p>
                    </div>

                    {/* Terms & CTA */}
                    <div className="text-center flex-1 px-8">
                        <p className="text-[10px] font-bold text-gray-500 uppercase mb-1">Terms & Conditions</p>
                        <p className="text-[10px] font-bold text-gray-400 leading-tight mb-4">
                            {type === 'WAIVER'
                                ? "This document represents a manual adjustment/waiver of fees. No physical cash was exchanged for this transaction."
                                : "Fees paid are non-refundable. This receipt is invalid without an official school stamp/signature. Please retain for your records."
                            }
                        </p>
                        <p className="text-xs font-bold text-gray-900">
                            {type === 'WAIVER' ? 'Adjustment has been successfully applied.' : 'Thank you for your payment.'}
                        </p>
                    </div>

                    {/* Signature */}
                    <div className="text-center w-40">
                        <div className="h-16 mb-2 flex items-end justify-center">
                            {/* Placeholder for digital signature img */}
                            <div className="font-script text-2xl text-primary-900 transform -rotate-12 opacity-80">Bursar.Sig</div>
                        </div>
                        <div className="border-t border-gray-900 pt-2">
                            <p className="text-xs font-bold uppercase text-gray-900">Bursar's Signature</p>
                            <p className="text-[10px] text-gray-500">{new Date().toLocaleDateString()}</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
});

ReceiptTemplate.displayName = 'ReceiptTemplate';
