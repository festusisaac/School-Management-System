import React, { useMemo, useState } from 'react';
import { Download, FileText, Loader2, X } from 'lucide-react';
import { formatCurrency } from '../../../utils/currency';
import { formatDateLocal, formatTimeLocal } from '../../../utils/date';
import { getDetailedPaymentMethod } from '../../../utils/transactionUtils';
import { exportStudentStatementPdf } from '../../finance/utils/reportPdf';
import { useToast } from '../../../context/ToastContext';

interface ParentStatementModalProps {
  isOpen: boolean;
  onClose: () => void;
  student: any;
  statement: any;
  schoolInfo?: any;
}

export function ParentStatementModal({ isOpen, onClose, student, statement, schoolInfo }: ParentStatementModalProps) {
  const { showError, showSuccess } = useToast();
  const [exporting, setExporting] = useState(false);

  const feeRows = useMemo(() => [
    ...(statement?.assignedHeads || []).map((head: any) => ({
      key: `head-${head.id}`,
      name: head.name,
      billed: parseFloat(head.amount || '0'),
      paid: parseFloat(head.paid || '0'),
      balance: parseFloat(head.balance || '0'),
      badge: head.balance <= 0 ? 'Paid' : parseFloat(head.paid || '0') > 0 ? 'Partial' : 'Due',
    })),
    ...(statement?.carryForwards || []).map((cf: any) => ({
      key: `cf-${cf.id}`,
      name: cf.name,
      billed: parseFloat(cf.amount || '0'),
      paid: parseFloat(cf.paid || '0'),
      balance: parseFloat(cf.balance || '0'),
      badge: parseFloat(cf.balance || '0') <= 0 ? 'Settled' : 'Arrears',
    })),
  ], [statement]);

  const transactions = useMemo(
    () => (statement?.transactions || []).filter((tx: any) => tx.type !== 'CARRY_FORWARD'),
    [statement]
  );

  const handleExportPdf = async () => {
    if (!student?.id || !statement) return;

    try {
      setExporting(true);
      // Let the loading state paint before the synchronous PDF generation starts.
      await new Promise((resolve) => setTimeout(resolve, 0));
      exportStudentStatementPdf({ student, statement }, schoolInfo);
      showSuccess('Statement PDF exported successfully!');
    } catch (error) {
      console.error('Failed to export parent statement PDF:', error);
      showError('Failed to export statement PDF');
    } finally {
      setExporting(false);
    }
  };

  if (!isOpen || !student || !statement) return null;

  return (
    <div className="fixed inset-0 z-[120] flex items-end justify-center bg-black/55 p-0 backdrop-blur-sm sm:items-center sm:p-4">
      <div className="flex h-[100dvh] w-full flex-col overflow-hidden rounded-none bg-white shadow-2xl dark:bg-gray-900 sm:max-h-[90vh] sm:max-w-5xl sm:rounded-3xl sm:border sm:border-gray-100 dark:sm:border-gray-800">
        <div className="sticky top-0 z-10 border-b border-gray-100 bg-white px-4 py-4 dark:border-gray-800 dark:bg-gray-900 sm:px-6 sm:py-5">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="mb-3 inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-primary-50 text-primary-600 dark:bg-primary-900/20 dark:text-primary-300">
                <FileText size={20} />
              </div>
              <h3 className="text-xl font-black text-gray-900 dark:text-white sm:text-2xl">Account Statement</h3>
              <p className="mt-1 break-words text-xs text-gray-500 dark:text-gray-400 sm:text-sm">
                {student.firstName} {student.lastName} <span className="hidden sm:inline">| </span><span className="block sm:inline">{student.admissionNo}</span>
              </p>
            </div>
            <div className="flex items-center gap-2 sm:gap-3">
              <button
                onClick={handleExportPdf}
                disabled={exporting}
                className="hidden items-center gap-2 rounded-2xl bg-gray-900 px-5 py-3 text-sm font-black uppercase tracking-[0.14em] text-white transition hover:bg-black disabled:opacity-50 dark:bg-primary-600 dark:hover:bg-primary-700 sm:inline-flex"
              >
                {exporting ? <Loader2 className="animate-spin" size={16} /> : <Download size={16} />}
                {exporting ? 'Exporting...' : 'Export PDF'}
              </button>
              <button
                onClick={onClose}
                className="rounded-xl p-2 text-gray-400 transition hover:bg-gray-100 hover:text-gray-700 dark:hover:bg-gray-800 dark:hover:text-gray-200"
              >
                <X size={20} />
              </button>
            </div>
          </div>
        </div>

        <div className="grid min-h-0 flex-1 grid-cols-1 gap-0 lg:grid-cols-[0.95fr_1.05fr]">
          <div className="min-h-0 overflow-y-auto border-b border-gray-100 px-4 py-4 dark:border-gray-800 sm:px-6 sm:py-5 lg:border-b-0 lg:border-r">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <div className="rounded-2xl border border-gray-100 bg-gray-50 p-4 dark:border-gray-800 dark:bg-gray-800/50">
                <p className="text-[10px] font-black uppercase tracking-[0.14em] text-gray-400">Total Due</p>
                <p className="mt-2 text-xl font-black text-gray-900 dark:text-white">{formatCurrency(statement.totalDue || 0)}</p>
              </div>
              <div className="rounded-2xl border border-gray-100 bg-gray-50 p-4 dark:border-gray-800 dark:bg-gray-800/50">
                <p className="text-[10px] font-black uppercase tracking-[0.14em] text-gray-400">Paid</p>
                <p className="mt-2 text-xl font-black text-emerald-600">{formatCurrency(statement.totalPaid || 0)}</p>
              </div>
              <div className="rounded-2xl border border-gray-100 bg-gray-50 p-4 dark:border-gray-800 dark:bg-gray-800/50">
                <p className="text-[10px] font-black uppercase tracking-[0.14em] text-gray-400">Balance</p>
                <p className="mt-2 text-xl font-black text-red-600">{formatCurrency(statement.balance || 0)}</p>
              </div>
            </div>

            <div className="mt-6">
              <h4 className="text-xs font-black uppercase tracking-[0.16em] text-gray-400">Fee Breakdown</h4>
              <div className="mt-3 space-y-3">
                {feeRows.map((row) => (
                  <div key={row.key} className="rounded-2xl border border-gray-100 p-4 dark:border-gray-800">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                      <div className="min-w-0">
                        <p className="text-sm font-black text-gray-900 dark:text-white">{row.name}</p>
                        <span className="mt-2 inline-flex rounded-lg bg-gray-100 px-2 py-1 text-[10px] font-black uppercase tracking-[0.12em] text-gray-500 dark:bg-gray-800 dark:text-gray-300">
                          {row.badge}
                        </span>
                      </div>
                      <div className="grid grid-cols-1 gap-2 text-sm sm:text-right">
                        <p className="text-gray-500">Billed: <span className="font-bold text-gray-900 dark:text-white">{formatCurrency(row.billed)}</span></p>
                        <p className="text-gray-500">Paid: <span className="font-bold text-emerald-600">{formatCurrency(row.paid)}</span></p>
                        <p className="text-gray-500">Balance: <span className="font-black text-gray-900 dark:text-white">{formatCurrency(row.balance)}</span></p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="min-h-0 overflow-y-auto px-4 py-4 sm:px-6 sm:py-5">
            <h4 className="text-xs font-black uppercase tracking-[0.16em] text-gray-400">Transaction History</h4>
            <div className="mt-3 space-y-3">
              {transactions.length > 0 ? transactions.map((tx: any) => (
                <div key={tx.id} className="rounded-2xl border border-gray-100 p-4 dark:border-gray-800">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-black text-gray-900 dark:text-white">{tx.reference || tx.id}</p>
                      <p className="mt-1 text-xs text-gray-500">{formatDateLocal(tx.createdAt)} | {formatTimeLocal(tx.createdAt)}</p>
                      <p className="mt-2 text-xs font-bold uppercase tracking-[0.12em] text-gray-400">{getDetailedPaymentMethod(tx)}</p>
                    </div>
                    <div className="sm:text-right">
                      <p className="text-lg font-black text-gray-900 dark:text-white">{formatCurrency(tx.amount)}</p>
                      <p className="text-xs text-gray-400 uppercase">{tx.type.replace(/_/g, ' ')}</p>
                    </div>
                  </div>
                </div>
              )) : (
                <div className="rounded-2xl border border-dashed border-gray-200 px-4 py-8 text-center text-sm text-gray-500 dark:border-gray-700 dark:text-gray-400">
                  No transactions recorded for this student.
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="border-t border-gray-100 bg-white p-4 dark:border-gray-800 dark:bg-gray-900 sm:hidden">
          <button
            onClick={handleExportPdf}
            disabled={exporting}
            className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-gray-900 px-5 py-3 text-sm font-black uppercase tracking-[0.14em] text-white transition hover:bg-black disabled:opacity-50 dark:bg-primary-600 dark:hover:bg-primary-700"
          >
            {exporting ? <Loader2 className="animate-spin" size={16} /> : <Download size={16} />}
            {exporting ? 'Exporting...' : 'Export PDF'}
          </button>
        </div>
      </div>
    </div>
  );
}
