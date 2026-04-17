import { forwardRef } from 'react';
import { formatCurrency } from '../../../utils/currency';
import { numberToWords } from '../../../utils/numberToWords';
import { getDetailedPaymentMethod } from '../../../utils/transactionUtils';
import { formatDateLocal, formatTimeLocal } from '../../../utils/date';
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
        bursarSignature?: string;
        principalSignature?: string;
    };
}

export const ReceiptTemplate = forwardRef<HTMLDivElement, ReceiptProps>(({ transaction, schoolInfo }, ref) => {
    if (!transaction) return null;

    const { student, amount, type, reference, createdAt } = transaction;

    // Robust parsing for meta which can be an object or a stringified JSON
    let meta = transaction.meta;
    try {
        if (typeof meta === 'string') meta = JSON.parse(meta);
    } catch (e) {
        meta = {};
    }
    meta = meta || {};

    // Robust parsing for allocations/bulkAllocations which can also be stringified sometimes
    let rawAllocations = meta?.allocations || meta?.bulkAllocations || [];
    try {
        if (typeof rawAllocations === 'string') rawAllocations = JSON.parse(rawAllocations);
    } catch (e) {
        rawAllocations = [];
    }
    const allocations = Array.isArray(rawAllocations) ? rawAllocations : [];
    const receiptStudents = Array.from(
        new Map(
            allocations
                .filter((alloc: any) => alloc?.studentName || alloc?.studentId)
                .map((alloc: any) => [
                    alloc.studentId || alloc.studentName,
                    {
                        studentName: alloc.studentName || [student?.firstName, student?.lastName].filter(Boolean).join(' '),
                        admissionNo: alloc.admissionNo || student?.admissionNo || 'N/A',
                        className: alloc.className || student?.class?.name || 'N/A',
                    },
                ])
        ).values()
    );
    const hasMultipleStudents = receiptStudents.length > 1;
    const displayStudentName = hasMultipleStudents
        ? 'Family Payment'
        : receiptStudents[0]?.studentName || [student?.firstName, student?.lastName].filter(Boolean).join(' ');
    const displayStudentMeta = hasMultipleStudents
        ? `${receiptStudents.length} students covered`
        : receiptStudents[0]?.admissionNo || student?.admissionNo;
    const displayStudentClass = hasMultipleStudents
        ? receiptStudents.map((entry) => entry.studentName).join(', ')
        : receiptStudents[0]?.className || student?.class?.name || 'N/A';

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

    const verificationUrl = `${window.location.origin}/verify/receipt/${transaction.id}`;

    return (
        <div
            ref={ref}
            data-receipt-root
            className="bg-white text-black font-sans leading-relaxed relative print:w-full print:p-0 print:m-0 print:break-after-page"
        >
            {/* Watermark moved to top layer */}
            <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 -rotate-45 text-9xl font-black uppercase pointer-events-none select-none z-50 ${watermarkColor}`}>
                {watermarkText}
            </div>

            <div
                data-receipt-card
                className={clsx(
                    "relative z-10 p-8 m-10 max-w-3xl mx-auto min-h-[95vh] border-4 border-double print:m-0 print:max-w-none print:min-h-0 flex flex-col",
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
                            className="w-20 h-20 object-contain"
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
                            <p className="text-lg font-bold text-gray-900">{displayStudentName || 'Walk-in Payment'}</p>
                            <p className="text-sm font-medium text-gray-600">
                                {hasMultipleStudents ? 'Coverage: ' : 'Admission No: '}
                                <span className="font-bold text-black">{displayStudentMeta}</span>
                            </p>
                            <p className="text-sm font-medium text-gray-600">
                                {hasMultipleStudents ? 'Students: ' : 'Class: '}
                                <span className="font-bold text-black">
                                    {displayStudentClass}
                                    {!hasMultipleStudents && student?.section?.name ? ` (${student.section.name})` : ''}
                                </span>
                            </p>
                        </div>
                    </div>

                    {/* Right: Payment Details */}
                    <div className="text-right">
                        <h3 className="text-xs font-black uppercase text-gray-400 tracking-widest mb-3 border-b border-gray-200 pb-1">Payment Details</h3>
                        <div className="space-y-1">
                            <p className="text-sm font-medium text-gray-600">Date: <span className="font-bold text-black">{formatDateLocal(createdAt)}</span></p>
                            <p className="text-sm font-medium text-gray-600">Time: <span className="font-bold text-black">{formatTimeLocal(createdAt)}</span></p>
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
                <div data-receipt-table-section className="mb-8">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="border-b-2 border-gray-900 bg-gray-50 print:bg-white text-gray-900">
                                <th className="py-3 px-4 text-xs font-black uppercase tracking-widest text-left text-gray-700">Item Description</th>
                                <th className="py-3 px-4 text-xs font-black uppercase tracking-widest text-right text-gray-700 w-32">Amount Due</th>
                                <th className="py-3 px-4 text-xs font-black uppercase tracking-widest text-right text-gray-700 w-32">Amount Paid</th>
                                <th className="py-3 px-4 text-xs font-black uppercase tracking-widest text-right text-gray-700 w-32">Balance</th>
                            </tr>
                        </thead>
                        <tbody>
                            {allocations.length > 0 ? (
                                allocations.map((alloc: any, idx: number) => {
                                    // 1. Resolve Clean Name: Priority to feeHeadName, strip redundant student names in parentheses
                                    let cleanName = (alloc.feeHeadName || alloc.name || 'Fee Payment');
                                    cleanName = cleanName.replace(/\s*\(.*?\)\s*/g, '').trim(); // Remove anything in parentheses like "(Joy Lara)"

                                    // 2. Resolve Balances
                                    const itemAmountDue = parseFloat(alloc.amountDue || alloc.totalDue || '0');
                                    const itemPaid = parseFloat(alloc.amount || '0');
                                    const itemBalance = parseFloat(alloc.balance || '0');

                                    return (
                                        <tr key={idx} className="border-b border-gray-200 print:break-inside-avoid">
                                            <td className="py-3 px-4 text-sm font-bold text-gray-900">
                                                <div className="flex flex-col">
                                                    <div className="flex items-center gap-2">
                                                    {cleanName}
                                                        {(cleanName.toLowerCase().includes('brought forward') || alloc.type === 'CARRY_FORWARD') && (
                                                            <span className="px-1.5 py-0.5 bg-amber-50 text-amber-700 border border-amber-200 text-[8px] font-black rounded uppercase tracking-tighter shadow-sm">
                                                                Prior Arrears
                                                            </span>
                                                        )}
                                                    </div>
                                                    {hasMultipleStudents && (
                                                        <span className="text-[10px] font-medium text-gray-500 mt-0.5">
                                                            {alloc.studentName || 'Student'}
                                                            {alloc.admissionNo ? ` • ${alloc.admissionNo}` : ''}
                                                            {alloc.className ? ` • ${alloc.className}` : ''}
                                                        </span>
                                                    )}
                                                    {alloc.status && <span className="text-[10px] font-normal text-gray-500 uppercase mt-0.5">{alloc.status} Payment</span>}
                                                </div>
                                            </td>
                                            <td className="py-3 px-4 text-sm text-right text-gray-600 w-32">
                                                {formatCurrency(itemAmountDue)}
                                            </td>
                                            <td className="py-3 px-4 text-sm font-bold text-right text-black w-32">
                                                {formatCurrency(itemPaid)}
                                            </td>
                                            <td className="py-3 px-4 text-sm text-right text-gray-600 w-32">
                                                {formatCurrency(itemBalance)}
                                            </td>
                                        </tr>
                                    );
                                })
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

                    {/* Grand Totals */}
                    <div className="border-t-2 border-gray-900 bg-gray-50 flex items-stretch print:break-inside-avoid shadow-sm">
                        <div className="flex-1 py-4 px-4 text-sm font-black uppercase text-left">
                            Grand Totals
                        </div>
                        <div className="w-32 py-4 px-4 text-sm text-right text-gray-600 border-l border-gray-200">
                            {allocations.length > 0 ? formatCurrency(allocations.reduce((acc: number, a: any) => acc + parseFloat(a.amountDue || a.totalDue || '0'), 0)) : '-'}
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

                <div data-receipt-spacer className="flex-grow print:hidden"></div>

                <div data-receipt-footer-group className="print:break-inside-avoid">
                    <div className="mb-8 border border-gray-200 bg-gray-50 p-4 rounded-lg">
                        <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-1">Amount in Words</p>
                        <p className="text-sm italic font-bold text-gray-900 capitalize">
                            {numberToWords(amount, schoolInfo?.currencyName, schoolInfo?.subunitName)}
                        </p>
                    </div>

                    <div data-receipt-footer className="flex items-end justify-between mt-12 pt-4 print:mt-8 print:break-inside-avoid">
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

                        <div className="text-center w-40">
                            <div className="h-16 mb-2 flex items-end justify-center">
                                {schoolInfo?.bursarSignature ? (
                                    <img src={schoolInfo.bursarSignature} alt="Bursar Signature" className="max-h-full max-w-full object-contain" />
                                ) : (
                                    <div className="font-script text-2xl text-primary-900 transform -rotate-12 opacity-80">Bursar.Sig</div>
                                )}
                            </div>
                            <div className="border-t border-gray-900 pt-2">
                                <p className="text-xs font-bold uppercase text-gray-900">Bursar's Signature</p>
                                <p className="text-[10px] text-gray-500">{new Date().toLocaleDateString()}</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
});

ReceiptTemplate.displayName = 'ReceiptTemplate';
