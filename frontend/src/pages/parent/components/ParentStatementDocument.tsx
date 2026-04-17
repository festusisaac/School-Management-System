import { forwardRef } from 'react';
import { formatCurrency } from '../../../utils/currency';
import { formatDateLocal, formatTimeLocal } from '../../../utils/date';
import { getDetailedPaymentMethod } from '../../../utils/transactionUtils';

interface ParentStatementDocumentProps {
  student: any;
  statement: any;
  schoolInfo?: {
    name: string;
    address: string;
    phone: string;
    email: string;
    logo?: string;
  };
}

export const ParentStatementDocument = forwardRef<HTMLDivElement, ParentStatementDocumentProps>(
  ({ student, statement, schoolInfo }, ref) => {
    if (!student || !statement) return null;

    const feeRows = [
      ...(statement.assignedHeads || []).map((head: any) => ({
        key: `head-${head.id}`,
        name: head.name,
        billed: parseFloat(head.amount || '0'),
        paid: parseFloat(head.paid || '0'),
        balance: parseFloat(head.balance || '0'),
        note: head.group || 'Fee Group',
      })),
      ...(statement.carryForwards || []).map((cf: any) => ({
        key: `cf-${cf.id}`,
        name: cf.name,
        billed: parseFloat(cf.amount || '0'),
        paid: parseFloat(cf.paid || '0'),
        balance: parseFloat(cf.balance || '0'),
        note: 'Carry Forward',
      })),
    ];

    const transactions = (statement.transactions || []).filter((tx: any) => tx.type !== 'CARRY_FORWARD');

    return (
      <div ref={ref} className="bg-white text-black">
        <div className="mx-auto max-w-4xl p-8">
          <div className="mb-8 flex items-start justify-between border-b-2 border-gray-900 pb-6">
            <div className="flex items-center gap-4">
              <img
                src={schoolInfo?.logo || 'https://placehold.co/120x120?text=LOGO'}
                alt="School logo"
                className="h-16 w-16 object-contain"
              />
              <div>
                <h1 className="text-2xl font-black uppercase">{schoolInfo?.name || 'School Name'}</h1>
                <p className="text-sm text-gray-600">{schoolInfo?.address || 'School Address'}</p>
                <p className="text-xs font-semibold text-gray-500">{schoolInfo?.phone || ''} {schoolInfo?.email ? `• ${schoolInfo.email}` : ''}</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-xl font-black uppercase tracking-widest">Account Statement</p>
              <p className="text-sm text-gray-600">Generated: {new Date().toLocaleDateString()}</p>
            </div>
          </div>

          <div className="mb-8 grid grid-cols-2 gap-8">
            <div>
              <p className="mb-2 text-xs font-black uppercase tracking-widest text-gray-400">Student</p>
              <p className="text-lg font-black">{student.firstName} {student.lastName}</p>
              <p className="text-sm text-gray-600">Admission No: <span className="font-bold text-black">{student.admissionNo}</span></p>
              <p className="text-sm text-gray-600">Class: <span className="font-bold text-black">{student.class?.name || 'N/A'}</span></p>
            </div>
            <div className="text-right">
              <p className="mb-2 text-xs font-black uppercase tracking-widest text-gray-400">Summary</p>
              <p className="text-sm text-gray-600">Total Due: <span className="font-bold text-black">{formatCurrency(statement.totalDue || 0)}</span></p>
              <p className="text-sm text-gray-600">Amount Paid: <span className="font-bold text-black">{formatCurrency(statement.totalPaid || 0)}</span></p>
              <p className="text-sm text-gray-600">Balance: <span className="font-black text-red-600">{formatCurrency(statement.balance || 0)}</span></p>
            </div>
          </div>

          <div className="mb-8">
            <p className="mb-3 text-xs font-black uppercase tracking-widest text-gray-400">Fee Breakdown</p>
            <table className="w-full border-collapse text-left">
              <thead>
                <tr className="border-b-2 border-gray-900 bg-gray-50">
                  <th className="px-4 py-3 text-xs font-black uppercase tracking-widest">Description</th>
                  <th className="px-4 py-3 text-xs font-black uppercase tracking-widest">Type</th>
                  <th className="px-4 py-3 text-xs font-black uppercase tracking-widest text-right">Billed</th>
                  <th className="px-4 py-3 text-xs font-black uppercase tracking-widest text-right">Paid</th>
                  <th className="px-4 py-3 text-xs font-black uppercase tracking-widest text-right">Balance</th>
                </tr>
              </thead>
              <tbody>
                {feeRows.map((row) => (
                  <tr key={row.key} className="border-b border-gray-200">
                    <td className="px-4 py-3 text-sm font-bold">{row.name}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{row.note}</td>
                    <td className="px-4 py-3 text-right text-sm">{formatCurrency(row.billed)}</td>
                    <td className="px-4 py-3 text-right text-sm text-emerald-600">{formatCurrency(row.paid)}</td>
                    <td className="px-4 py-3 text-right text-sm font-black">{formatCurrency(row.balance)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div>
            <p className="mb-3 text-xs font-black uppercase tracking-widest text-gray-400">Transaction History</p>
            <table className="w-full border-collapse text-left">
              <thead>
                <tr className="border-b-2 border-gray-900 bg-gray-50">
                  <th className="px-4 py-3 text-xs font-black uppercase tracking-widest">Date</th>
                  <th className="px-4 py-3 text-xs font-black uppercase tracking-widest">Reference</th>
                  <th className="px-4 py-3 text-xs font-black uppercase tracking-widest">Method</th>
                  <th className="px-4 py-3 text-xs font-black uppercase tracking-widest text-right">Amount</th>
                </tr>
              </thead>
              <tbody>
                {transactions.length > 0 ? transactions.map((tx: any) => (
                  <tr key={tx.id} className="border-b border-gray-200">
                    <td className="px-4 py-3 text-sm">
                      <div className="font-bold">{formatDateLocal(tx.createdAt)}</div>
                      <div className="text-xs text-gray-500">{formatTimeLocal(tx.createdAt)}</div>
                    </td>
                    <td className="px-4 py-3 text-sm font-semibold">{tx.reference || tx.id}</td>
                    <td className="px-4 py-3 text-sm">{getDetailedPaymentMethod(tx)}</td>
                    <td className="px-4 py-3 text-right text-sm font-black">{formatCurrency(tx.amount)}</td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan={4} className="px-4 py-6 text-center text-sm text-gray-500">No transactions recorded.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  }
);

ParentStatementDocument.displayName = 'ParentStatementDocument';
