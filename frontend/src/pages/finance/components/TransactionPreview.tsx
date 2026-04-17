import React from 'react';
import { X, Printer, MapPin, Smartphone, Banknote, Clock, CheckCircle2, AlertCircle, Hash, User, Calendar, CreditCard } from 'lucide-react';
import { formatCurrency } from '../../../utils/currency';
import { formatDateLocal, formatTimeLocal } from '../../../utils/date';
import { getDetailedPaymentMethod } from '../../../utils/transactionUtils';
import { clsx } from 'clsx';

interface TransactionPreviewProps {
    transaction: any;
    onClose: () => void;
    onPrint: () => void;
}

export function TransactionPreview({ transaction, onClose, onPrint }: TransactionPreviewProps) {
    if (!transaction) return null;

    const { student, amount, type, reference, createdAt, paymentMethod } = transaction;

    // Robust parsing for meta
    let meta = transaction.meta;
    try {
        if (typeof meta === 'string') meta = JSON.parse(meta);
    } catch (e) {
        meta = {};
    }
    meta = meta || {};

    // Robust parsing for allocations
    let rawAllocations = meta?.allocations || meta?.bulkAllocations || [];
    try {
        if (typeof rawAllocations === 'string') rawAllocations = JSON.parse(rawAllocations);
    } catch (e) {
        rawAllocations = [];
    }
    const allocations = Array.isArray(rawAllocations) ? rawAllocations : [];

    const paystackData = meta?.paystackData || {};
    const flutterwaveData = meta?.flutterwaveData || {};
    const flutterwaveCustomer = flutterwaveData?.customer || {};

    // Extract potential metadata from stored gateway payloads first, then older top-level fields
    const device =
        paystackData?.ip_address ||
        flutterwaveData?.ip ||
        meta?.device ||
        meta?.ip_address ||
        'Unknown Device/IP';

    const location =
        paystackData?.customer?.country_code ||
        flutterwaveCustomer?.country ||
        meta?.location ||
        'Not Captured';

    const bank =
        paystackData?.authorization?.bank ||
        flutterwaveData?.processor_response ||
        flutterwaveData?.payment_type ||
        meta?.bank ||
        meta?.authorization?.bank ||
        meta?.authorization?.card_type ||
        'N/A';

    const channel =
        paystackData?.channel ||
        flutterwaveData?.payment_type ||
        meta?.channel ||
        meta?.authorization?.channel ||
        paymentMethod;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
            <div className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-900/50">
                    <div className="flex items-center gap-4">
                        <div className={clsx(
                            "w-12 h-12 rounded-xl flex items-center justify-center shadow-lg",
                            type === 'WAIVER' ? "bg-amber-50 text-amber-600 border border-amber-200" :
                                type === 'REFUND' ? "bg-red-50 text-red-600 border border-red-200" :
                                    "bg-primary-50 text-primary-600 border border-primary-200"
                        )}>
                            {type === 'WAIVER' ? <AlertCircle size={24} /> :
                                type === 'REFUND' ? <AlertCircle size={24} /> :
                                    <CheckCircle2 size={24} />}
                        </div>
                        <div>
                            <h3 className="text-xl font-black text-gray-900 dark:text-white uppercase tracking-tighter">
                                {type === 'FEE_PAYMENT' ? 'Payment Details' : type}
                            </h3>
                            <p className="text-sm font-bold text-gray-500">
                                {reference || `TXN-${transaction.id?.slice(0, 8).toUpperCase()}`}
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <button
                            onClick={onPrint}
                            className="flex items-center gap-2 px-5 py-2.5 bg-gray-900 dark:bg-primary-600 text-white rounded-xl text-sm font-black uppercase tracking-widest hover:bg-black dark:hover:bg-primary-700 transition-colors shadow-lg active:scale-95"
                        >
                            <Printer size={16} /> Print Receipt
                        </button>
                        <button
                            onClick={onClose}
                            className="p-2.5 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-xl text-gray-400 dark:text-gray-500 transition-colors"
                        >
                            <X size={20} />
                        </button>
                    </div>
                </div>

                <div className="p-6 max-h-[70vh] overflow-y-auto space-y-8">
                    {/* Amount & Status Banner */}
                    <div className="flex flex-col md:flex-row gap-6">
                        <div className="flex-1 bg-gray-50 dark:bg-gray-900/50 p-6 rounded-2xl border border-gray-100 dark:border-gray-800">
                            <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-1">Total Amount</p>
                            <p className={clsx(
                                "text-4xl font-black tracking-tighter",
                                type === 'WAIVER' ? "text-amber-600" :
                                    type === 'REFUND' ? "text-red-600" :
                                        "text-primary-600"
                            )}>
                                {formatCurrency(amount)}
                            </p>
                        </div>
                        <div className="flex-1 bg-gray-50 dark:bg-gray-900/50 p-6 rounded-2xl border border-gray-100 dark:border-gray-800 flex flex-col justify-center">
                            <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-1">Transaction Status</p>
                            <div className="flex items-center gap-2">
                                <div className={clsx(
                                    "w-3 h-3 rounded-full animate-pulse",
                                    type === 'FEE_PAYMENT' ? "bg-green-500" : "bg-amber-500"
                                )} />
                                <span className={clsx(
                                    "text-lg font-black uppercase tracking-widest",
                                    type === 'FEE_PAYMENT' ? "text-green-600 dark:text-green-500" : "text-amber-600 dark:text-amber-500"
                                )}>
                                    {type === 'REFUND' ? 'REVERSED' : 'SUCCESSFUL'}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Information Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {/* Core Details */}
                        <div className="space-y-4">
                            <h4 className="text-xs font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest flex items-center gap-2 mb-4 border-b border-gray-100 dark:border-gray-800 pb-2">
                                <User size={14} /> Student Information
                            </h4>
                            <div className="grid grid-cols-3 gap-2">
                                <span className="text-sm font-bold text-gray-500 col-span-1">Name:</span>
                                <span className="text-sm font-black text-gray-900 dark:text-white col-span-2 text-right">{student?.firstName} {student?.lastName}</span>
                                
                                <span className="text-sm font-bold text-gray-500 col-span-1">Adm No:</span>
                                <span className="text-sm font-black text-gray-900 dark:text-white col-span-2 text-right">{student?.admissionNo}</span>
                                
                                <span className="text-sm font-bold text-gray-500 col-span-1">Class:</span>
                                <span className="text-sm font-black text-gray-900 dark:text-white col-span-2 text-right">{student?.class?.name} {student?.section?.name}</span>
                            </div>
                        </div>

                        {/* Payment Details */}
                        <div className="space-y-4">
                            <h4 className="text-xs font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest flex items-center gap-2 mb-4 border-b border-gray-100 dark:border-gray-800 pb-2">
                                <Clock size={14} /> Time & Channel
                            </h4>
                            <div className="grid grid-cols-3 gap-2">
                                <span className="text-sm font-bold text-gray-500 col-span-1">Date:</span>
                                <span className="text-sm font-black text-gray-900 dark:text-white col-span-2 text-right">{formatDateLocal(createdAt)}</span>
                                
                                <span className="text-sm font-bold text-gray-500 col-span-1">Time:</span>
                                <span className="text-sm font-black text-gray-900 dark:text-white col-span-2 text-right">{formatTimeLocal(createdAt)}</span>
                                
                                <span className="text-sm font-bold text-gray-500 col-span-1">Method:</span>
                                <span className="text-sm font-black text-gray-900 dark:text-white col-span-2 text-right uppercase">{getDetailedPaymentMethod(transaction)}</span>
                            </div>
                        </div>

                        {/* Technical Details (If online payment) */}
                        {(paymentMethod === 'ONLINE' || paystackData?.channel || flutterwaveData?.payment_type || meta?.authorization || meta?.ip_address) && (
                            <div className="col-span-1 md:col-span-2 bg-gray-50 dark:bg-gray-900/30 p-5 rounded-2xl border border-gray-100 dark:border-gray-800">
                                <h4 className="text-xs font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest flex items-center gap-2 mb-4">
                                    <Smartphone size={14} /> Gateway Metadata
                                </h4>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                    <div>
                                        <p className="text-[10px] font-bold text-gray-500 uppercase">Provider / Channel</p>
                                        <p className="text-sm font-black text-gray-900 dark:text-white uppercase">{channel}</p>
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-bold text-gray-500 uppercase">Origin / Bank</p>
                                        <p className="text-sm font-black text-gray-900 dark:text-white uppercase">{bank}</p>
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-bold text-gray-500 uppercase">Device / IP</p>
                                        <p className="text-sm font-black text-gray-900 dark:text-white truncate" title={device}>{device}</p>
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-bold text-gray-500 uppercase">Geo Location</p>
                                        <p className="text-sm font-black text-gray-900 dark:text-white truncate" title={location}>{location}</p>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Breakdown Table */}
                    {allocations && allocations.length > 0 && (
                        <div>
                            <h4 className="text-xs font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest flex items-center gap-2 mb-4 border-b border-gray-100 dark:border-gray-800 pb-2">
                                <Banknote size={14} /> Payment Breakdown
                            </h4>
                            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 overflow-hidden">
                                <table className="w-full text-left">
                                    <thead className="bg-gray-50/50 dark:bg-gray-900/50 border-b border-gray-100 dark:border-gray-700">
                                        <tr>
                                            <th className="px-4 py-3 text-[10px] font-black text-gray-500 uppercase tracking-widest">Fee Head</th>
                                            <th className="px-4 py-3 text-[10px] font-black text-gray-500 uppercase tracking-widest text-right">Amount</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-50 dark:divide-gray-800">
                                        {allocations.map((alloc: any, idx: number) => (
                                            <tr key={idx}>
                                                <td className="px-4 py-3 text-sm font-bold text-gray-900 dark:text-white">
                                                    {alloc.name}
                                                    {alloc.studentName && <span className="ml-1 text-[10px] text-gray-500 font-normal tracking-wide">({alloc.studentName})</span>}
                                                    {alloc.status && <span className="ml-2 text-[9px] font-black uppercase text-gray-400 bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 rounded">{alloc.status}</span>}
                                                </td>
                                                <td className="px-4 py-3 text-sm font-black text-gray-900 dark:text-white text-right">
                                                    {formatCurrency(parseFloat(alloc.amount))}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
