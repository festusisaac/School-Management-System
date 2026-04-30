import React, { useEffect, useMemo, useState } from 'react';
import { ArrowRight, RotateCcw, Wallet, X } from 'lucide-react';
import { clsx } from 'clsx';

export interface ParentPaymentAllocationLine {
    studentId: string;
    studentName: string;
    admissionNo?: string;
    className?: string;
    id: string;
    feeHeadId?: string;
    feeHeadName: string;
    amountDue: string;
    amount: string;
    balance: string;
    sourceType?: 'FEE_HEAD' | 'CARRY_FORWARD';
}

interface FamilyAllocationModalProps {
    isOpen: boolean;
    title: string;
    description: string;
    lines: ParentPaymentAllocationLine[];
    formatCurrency: (value: number | string) => string;
    onClose: () => void;
    onConfirm: (allocations: ParentPaymentAllocationLine[]) => void;
}

export function FamilyAllocationModal({
    isOpen,
    title,
    description,
    lines,
    formatCurrency,
    onClose,
    onConfirm,
}: FamilyAllocationModalProps) {
    const [draftLines, setDraftLines] = useState<ParentPaymentAllocationLine[]>([]);

    useEffect(() => {
        if (!isOpen) return;
        setDraftLines(lines.map((line) => ({ ...line })));
    }, [isOpen, lines]);

    const totalOutstanding = useMemo(
        () => draftLines.reduce((sum, line) => sum + (parseFloat(line.amountDue || '0') || 0), 0),
        [draftLines]
    );

    const totalAllocated = useMemo(
        () => draftLines.reduce((sum, line) => sum + (parseFloat(line.amount || '0') || 0), 0),
        [draftLines]
    );

    const activeLines = useMemo(
        () => draftLines.filter((line) => (parseFloat(line.amount || '0') || 0) > 0),
        [draftLines]
    );

    const updateLineAmount = (index: number, nextValue: string) => {
        setDraftLines((current) =>
            current.map((line, lineIndex) => {
                if (lineIndex !== index) return line;

                const maxAmount = parseFloat(line.amountDue || '0') || 0;
                const numericValue = parseFloat(nextValue || '0') || 0;

                // Clamp: if user types more than max, cap it (no toFixed to avoid cursor jump)
                const clampedStr = numericValue > maxAmount
                    ? String(maxAmount)
                    : nextValue;
                const clamped = Math.min(maxAmount, numericValue);

                return {
                    ...line,
                    amount: clampedStr,
                    balance: Math.max(0, maxAmount - clamped).toFixed(2),
                };
            })
        );
    };

    const formatLineAmount = (index: number) => {
        // On blur: clamp and format to 2dp
        setDraftLines((current) =>
            current.map((line, lineIndex) => {
                if (lineIndex !== index) return line;
                const maxAmount = parseFloat(line.amountDue || '0') || 0;
                const numericValue = Math.max(0, Math.min(maxAmount, parseFloat(line.amount || '0') || 0));
                return {
                    ...line,
                    amount: numericValue ? numericValue.toFixed(2) : '',
                    balance: (maxAmount - numericValue).toFixed(2),
                };
            })
        );
    };

    const autoAllocateFull = () => {
        setDraftLines((current) =>
            current.map((line) => ({
                ...line,
                amount: (parseFloat(line.amountDue || '0') || 0).toFixed(2),
                balance: '0.00',
            }))
        );
    };

    const clearAll = () => {
        setDraftLines((current) =>
            current.map((line) => ({
                ...line,
                amount: '',
                balance: line.amountDue,
            }))
        );
    };

    const handleConfirm = () => {
        if (activeLines.length === 0) return;
        onConfirm(activeLines);
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <div className="w-full max-w-5xl max-h-[92vh] overflow-hidden rounded-3xl bg-white dark:bg-gray-800 shadow-2xl border border-white/20 flex flex-col">
                <div className="p-4 sm:p-6 border-b border-gray-100 dark:border-gray-700 flex items-start justify-between gap-4 shrink-0">
                    <div>
                        <h3 className="text-lg font-black text-gray-900 dark:text-white tracking-tight leading-tight">{title}</h3>
                        <p className="text-[10px] sm:text-sm text-gray-500 dark:text-gray-400 mt-1 max-w-2xl line-clamp-1 sm:line-clamp-none">{description}</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                    >
                        <X size={20} />
                    </button>
                </div>

                <div className="p-3 sm:p-6 border-b border-gray-100 dark:border-gray-700 bg-gray-50/70 dark:bg-gray-900/30 shrink-0">
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-4">
                        <div className="rounded-xl sm:rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-2.5 sm:p-4">
                            <p className="text-[9px] sm:text-[11px] font-bold text-gray-400 uppercase tracking-widest">Outstanding</p>
                            <p className="text-sm sm:text-2xl font-black text-red-600 mt-0.5">{formatCurrency(totalOutstanding)}</p>
                        </div>
                        <div className="rounded-xl sm:rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-2.5 sm:p-4">
                            <p className="text-[9px] sm:text-[11px] font-bold text-gray-400 uppercase tracking-widest">Allocated</p>
                            <p className="text-sm sm:text-2xl font-black text-primary-600 mt-0.5">{formatCurrency(totalAllocated)}</p>
                        </div>
                        <div className="col-span-2 sm:col-span-1 rounded-xl sm:rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-2.5 sm:p-4 flex sm:block items-center justify-between">
                            <div>
                                <p className="text-[9px] sm:text-[11px] font-bold text-gray-400 uppercase tracking-widest">Unallocated</p>
                                <p className="text-sm sm:text-2xl font-black text-amber-600 mt-0.5">{formatCurrency(totalOutstanding - totalAllocated)}</p>
                            </div>
                            <span className="sm:hidden text-[10px] font-bold px-2 py-1 bg-amber-50 dark:bg-amber-900/20 text-amber-600 rounded-lg">Balance</span>
                        </div>
                    </div>

                    <div className="mt-3 flex flex-wrap items-center gap-2">
                        <button
                            onClick={autoAllocateFull}
                            className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-3 py-2 rounded-lg sm:rounded-xl bg-primary-600 text-white text-[11px] sm:text-sm font-bold hover:bg-primary-700 transition-colors"
                        >
                            <Wallet size={14} />
                            Auto Allocate
                        </button>
                        <button
                            onClick={clearAll}
                            className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-3 py-2 rounded-lg sm:rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-[11px] sm:text-sm font-bold text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                        >
                            <RotateCcw size={14} />
                            Clear All
                        </button>
                    </div>
                </div>

                <div className="flex-1 overflow-auto p-4 sm:p-6">
                    <div className="space-y-2 md:hidden">
                        {draftLines.map((line, index) => {
                            const outstanding = parseFloat(line.amountDue || '0') || 0;
                            const allocated = parseFloat(line.amount || '0') || 0;
                            const remaining = outstanding - allocated;

                            return (
                                <div key={`${line.studentId}-${line.id}`} className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-3 space-y-2.5">
                                    <div className="flex items-start justify-between gap-3">
                                        <div className="min-w-0">
                                            <p className="text-xs font-black text-gray-900 dark:text-white truncate">{line.studentName}</p>
                                            <p className="text-[9px] text-gray-400 uppercase tracking-wider font-bold">
                                                {line.feeHeadName}
                                            </p>
                                        </div>
                                        <div className="text-right shrink-0">
                                            <p className="text-[9px] font-bold text-gray-400 uppercase">Due</p>
                                            <p className="text-xs font-black text-gray-900 dark:text-white">
                                                {formatCurrency(outstanding)}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-3">
                                        <div className="flex-1">
                                            <div className="relative">
                                                <input
                                                    type="number"
                                                    min="0"
                                                    step="0.01"
                                                    max={outstanding}
                                                    value={line.amount}
                                                    onChange={(event) => updateLineAmount(index, event.target.value)}
                                                    onBlur={() => formatLineAmount(index)}
                                                    className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 pl-3 pr-8 py-2 text-sm font-bold text-gray-900 dark:text-white focus:ring-1 focus:ring-primary-500"
                                                    placeholder="0.00"
                                                />
                                                <div className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-gray-400">#</div>
                                            </div>
                                        </div>
                                        <div className="text-right shrink-0 min-w-[70px]">
                                            <p className="text-[9px] font-bold text-gray-400 uppercase">Remaining</p>
                                            <p className={clsx(
                                                "text-xs font-black",
                                                remaining > 0 ? "text-amber-600" : "text-emerald-600"
                                            )}>
                                                {formatCurrency(remaining)}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    <div className="hidden md:block overflow-hidden rounded-2xl border border-gray-200 dark:border-gray-700">
                        <table className="w-full text-left">
                            <thead className="bg-gray-50 dark:bg-gray-900/50">
                                <tr className="border-b border-gray-200 dark:border-gray-700">
                                    <th className="px-4 py-3 text-[11px] font-bold uppercase tracking-widest text-gray-500">Child</th>
                                    <th className="px-4 py-3 text-[11px] font-bold uppercase tracking-widest text-gray-500">Fee Head</th>
                                    <th className="px-4 py-3 text-[11px] font-bold uppercase tracking-widest text-gray-500 text-right">Outstanding</th>
                                    <th className="px-4 py-3 text-[11px] font-bold uppercase tracking-widest text-gray-500">Allocate</th>
                                    <th className="px-4 py-3 text-[11px] font-bold uppercase tracking-widest text-gray-500 text-right">Remaining</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                                {draftLines.map((line, index) => {
                                    const outstanding = parseFloat(line.amountDue || '0') || 0;
                                    const allocated = parseFloat(line.amount || '0') || 0;
                                    const remaining = outstanding - allocated;

                                    return (
                                        <tr key={`${line.studentId}-${line.id}`} className="bg-white dark:bg-gray-800">
                                            <td className="px-4 py-4">
                                                <div>
                                                    <p className="font-bold text-gray-900 dark:text-white">{line.studentName}</p>
                                                    <p className="text-[11px] text-gray-400 uppercase tracking-wider mt-1">
                                                        {line.sourceType === 'CARRY_FORWARD' ? 'Arrears' : 'Assigned Fee'}
                                                    </p>
                                                </div>
                                            </td>
                                            <td className="px-4 py-4">
                                                <p className="font-semibold text-gray-700 dark:text-gray-300">{line.feeHeadName}</p>
                                            </td>
                                            <td className="px-4 py-4 text-right font-bold text-gray-900 dark:text-white">
                                                {formatCurrency(outstanding)}
                                            </td>
                                             <td className="px-4 py-4">
                                                <input
                                                    type="number"
                                                    min="0"
                                                    step="0.01"
                                                    max={outstanding}
                                                    value={line.amount}
                                                    onChange={(event) => updateLineAmount(index, event.target.value)}
                                                    onBlur={() => formatLineAmount(index)}
                                                    className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 px-4 py-2.5 text-sm font-bold text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                                                    placeholder="0.00"
                                                />
                                            </td>
                                            <td
                                                className={clsx(
                                                    "px-4 py-4 text-right font-bold",
                                                    remaining > 0 ? "text-amber-600" : "text-emerald-600"
                                                )}
                                            >
                                                {formatCurrency(remaining)}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>

                <div className="p-4 sm:p-6 border-t border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">
                            Every payment line will be posted to a specific child and fee head before gateway checkout.
                        </p>
                    </div>
                    <button
                        onClick={handleConfirm}
                        disabled={activeLines.length === 0}
                        className="w-full md:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-primary-600 text-white font-bold hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        Proceed to Payment
                        <ArrowRight size={18} />
                    </button>
                </div>
            </div>
        </div>
    );
}
