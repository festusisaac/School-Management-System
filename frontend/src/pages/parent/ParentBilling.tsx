import React, { useState, useEffect, useCallback } from 'react';
import {
  CreditCard,
  ShieldCheck,
  AlertCircle,
  ArrowRight,
  History,
  Info,
  ChevronDown,
  Printer,
  Wallet,
  CheckCircle2,
  FileText,
  Users
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api, { getFileUrl } from '../../services/api';
import { useToast } from '../../context/ToastContext';
import { useAuthStore } from '../../stores/authStore';
import { useSystem } from '../../context/SystemContext';
import { PaymentModal } from '../students/components/PaymentModal';
import { FamilyAllocationModal, ParentPaymentAllocationLine } from './components/FamilyAllocationModal';
import { clsx } from 'clsx';
import { format } from 'date-fns';

export default function ParentBilling() {
  const { user } = useAuthStore();
  const { showError } = useToast();
  const { formatCurrency } = useSystem();
  const navigate = useNavigate();
  
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showAllocationModal, setShowAllocationModal] = useState(false);
  const [allocationContext, setAllocationContext] = useState<{ scope: 'FAMILY' | 'CHILD'; studentId?: string } | null>(null);
  const [selectedStudent, setSelectedStudent] = useState<any>(null);
  const [selectedFeeHead, setSelectedFeeHead] = useState<any>(null);
  const [selectedAllocations, setSelectedAllocations] = useState<ParentPaymentAllocationLine[]>([]);
  const [expandedChild, setExpandedChild] = useState<string | null>(null);

  const fetchFamilyData = useCallback(async () => {
    if (!user?.id) return;
    setLoading(true);
    try {
      const response = (await api.getMyChildren()) as any;
      const children = Array.isArray(response) ? response : (response?.data || []);
      
      if (children && children.length > 0) {
        const statsResponse = (await api.getFamilyFinancials(children[0].id)) as any;
        setData(statsResponse?.data || statsResponse);
      }
    } catch (error) {
      console.error(error);
      showError('Failed to load family financial data');
    } finally {
      setLoading(false);
    }
  }, [user?.id, showError]);

  useEffect(() => {
    fetchFamilyData();
  }, [fetchFamilyData]);

  const getAllocationLines = useCallback((scope: { scope: 'FAMILY' | 'CHILD'; studentId?: string } | null) => {
    if (!scope || !data?.siblings) return [];

    const siblings = scope.scope === 'CHILD'
      ? data.siblings.filter((s: any) => s.student.id === scope.studentId)
      : data.siblings;

    return siblings.flatMap((childData: any) => {
      const childName = `${childData.student.firstName} ${childData.student.lastName}`;
      const assignedHeadLines = (childData.assignedHeads || [])
        .filter((head: any) => parseFloat(head.balance || '0') > 0)
        .map((head: any) => ({
          studentId: childData.student.id,
          studentName: childName,
          admissionNo: childData.student.admissionNo,
          className: childData.student.class?.name || 'N/A',
          id: head.id,
          feeHeadId: head.id,
          feeHeadName: head.name,
          amountDue: parseFloat(head.balance || '0').toFixed(2),
          amount: parseFloat(head.balance || '0').toFixed(2),
          balance: '0.00',
          sourceType: 'FEE_HEAD' as const,
        }));

      const carryForwardLines = (childData.carryForwards || [])
        .filter((carry: any) => parseFloat(carry.balance || '0') > 0)
        .map((carry: any) => ({
          studentId: childData.student.id,
          studentName: childName,
          admissionNo: childData.student.admissionNo,
          className: childData.student.class?.name || 'N/A',
          id: carry.id,
          feeHeadId: carry.feeHeadId || carry.id,
          feeHeadName: carry.name,
          amountDue: parseFloat(carry.balance || '0').toFixed(2),
          amount: parseFloat(carry.balance || '0').toFixed(2),
          balance: '0.00',
          sourceType: 'CARRY_FORWARD' as const,
        }));

      return [...assignedHeadLines, ...carryForwardLines];
    });
  }, [data]);

  const allocationLines = getAllocationLines(allocationContext);

  const handlePayAll = () => {
    setAllocationContext({ scope: 'FAMILY' });
    setShowAllocationModal(true);
  };

  const handleAllocationConfirmed = (allocations: ParentPaymentAllocationLine[]) => {
    const total = allocations.reduce((sum, line) => sum + (parseFloat(line.amount || '0') || 0), 0);
    if (total <= 0) {
      showError('Please allocate an amount before proceeding.');
      return;
    }

    const firstStudent = data?.siblings?.find((s: any) => s.student.id === allocations[0].studentId)?.student;
    setSelectedAllocations(allocations);
    setSelectedStudent(firstStudent || data?.siblings?.[0]?.student || null);
    setSelectedFeeHead({
      id: allocationContext?.scope === 'CHILD' ? 'ALLOCATED_CHILD_PAYMENT' : 'ALLOCATED_FAMILY_PAYMENT',
      name: allocationContext?.scope === 'CHILD' ? 'Allocated Child Payment' : 'Allocated Family Payment',
      balance: total.toFixed(2),
    });
    setShowAllocationModal(false);
    setShowPaymentModal(true);
  };

  if (loading) {
      return (
          <div className="flex items-center justify-center min-h-[400px]">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
          </div>
      );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-20">
      {/* Minimal Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Family Billing</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            View statements and settle tuition balances for your registered children
          </p>
        </div>
        <button
            onClick={handlePayAll}
            disabled={parseFloat(data?.familyBalance || '0') <= 0}
            className="flex items-center gap-2 px-6 py-3 bg-primary-600 text-white rounded-lg font-bold hover:bg-primary-700 transition-colors shadow-sm disabled:opacity-50"
          >
            <CreditCard size={18} />
            Pay Family Balance ({formatCurrency(data?.familyBalance || 0)})
          </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm flex items-center gap-4">
              <div className="w-12 h-12 bg-gray-50 dark:bg-gray-700/50 rounded-lg flex items-center justify-center">
                  <FileText className="text-gray-400" size={24} />
              </div>
              <div>
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-widest">Total Billed</p>
                  <p className="text-xl font-bold text-gray-900 dark:text-white">{formatCurrency(data?.familyTotalDue || 0)}</p>
              </div>
          </div>
          <div className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm flex items-center gap-4">
              <div className="w-12 h-12 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg flex items-center justify-center">
                  <CheckCircle2 className="text-emerald-500" size={24} />
              </div>
              <div>
                  <p className="text-xs font-medium text-emerald-500 uppercase tracking-widest">Total Paid</p>
                  <p className="text-xl font-bold text-emerald-600 dark:text-emerald-400">{formatCurrency(data?.familyTotalPaid || 0)}</p>
              </div>
          </div>
          <div className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm flex items-center gap-4">
              <div className="w-12 h-12 bg-red-50 dark:bg-red-900/20 rounded-lg flex items-center justify-center">
                  <AlertCircle className="text-red-500" size={24} />
              </div>
              <div>
                  <p className="text-xs font-medium text-red-500 uppercase tracking-widest">Net Due</p>
                  <p className="text-xl font-bold text-red-600 dark:text-red-400">{formatCurrency(data?.familyBalance || 0)}</p>
              </div>
          </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Child Listings */}
        <div className="lg:col-span-8 space-y-4">
            {data?.siblings?.map((childData: any) => {
                const child = childData.student;
                const isExpanded = expandedChild === child.id;
                const balance = parseFloat(childData.balance || '0');

                return (
                    <div key={child.id} className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
                        {/* Trigger Row */}
                        <div 
                            className="p-5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors"
                            onClick={() => setExpandedChild(isExpanded ? null : child.id)}
                        >
                            <div className="flex items-center gap-4">
                                <div className="w-14 h-14 bg-gray-100 dark:bg-gray-700 rounded-lg overflow-hidden border border-gray-200 dark:border-gray-600 flex-shrink-0">
                                    {child.photo ? (
                                        <img src={getFileUrl(child.photo)} alt={child.firstName} className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center font-bold text-gray-400">
                                            {child.firstName?.charAt(0)}{child.lastName?.charAt(0)}
                                        </div>
                                    )}
                                </div>
                                <div>
                                    <h3 className="font-bold text-gray-900 dark:text-white capitalize">{child.firstName} {child.lastName}</h3>
                                    <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider mt-0.5">
                                        {child.class?.name || 'Class Unassigned'} • {child.admissionNo || 'No ID'}
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-center gap-6 w-full sm:w-auto self-end sm:self-center">
                                <div className="text-right">
                                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Balance Due</p>
                                    <p className={clsx("text-lg font-bold", balance > 0 ? "text-red-600" : "text-emerald-600")}>
                                        {formatCurrency(balance)}
                                    </p>
                                </div>
                                <div className={clsx("p-2 rounded-lg transition-transform", isExpanded && "rotate-180 bg-gray-50 dark:bg-gray-700")}>
                                    <ChevronDown className="text-gray-400" size={20} />
                                </div>
                            </div>
                        </div>

                        {/* Collapsible Detail Section */}
                        {isExpanded && (
                            <div className="border-t border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-900/20">
                                {/* Fee Breakdown Table */}
                                <div className="p-6">
                                    <div className="flex items-center justify-between mb-4">
                                        <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider flex items-center gap-2">
                                            <Wallet size={14} className="text-primary-500" /> Fee Breakdown
                                        </h4>
                                    </div>
                                    <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden bg-white dark:bg-gray-800">
                                        <table className="w-full text-xs text-left">
                                            <thead>
                                                <tr className="bg-gray-50 dark:bg-gray-700/50 border-b border-gray-200 dark:border-gray-700 font-bold text-gray-500">
                                                    <th className="px-4 py-3">Description</th>
                                                    <th className="px-4 py-3">Billed</th>
                                                    <th className="px-4 py-3">Paid</th>
                                                    <th className="px-4 py-3 text-right">Balance</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                                                {childData.assignedHeads?.map((head: any) => (
                                                    <tr key={head.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/30">
                                                        <td className="px-4 py-3 font-medium text-gray-700 dark:text-gray-300">{head.name}</td>
                                                        <td className="px-4 py-3 text-gray-600 dark:text-gray-400">{formatCurrency(head.amount)}</td>
                                                        <td className="px-4 py-3 text-emerald-600">{formatCurrency(head.paid)}</td>
                                                        <td className="px-4 py-3 text-right font-bold text-gray-900 dark:text-white">{formatCurrency(head.balance)}</td>
                                                    </tr>
                                                ))}
                                                {childData.carryForwards?.map((cf: any) => (
                                                    <tr key={cf.id} className="bg-amber-50/20 dark:bg-amber-900/5">
                                                        <td className="px-4 py-3 font-medium text-amber-700">Bal. Brought Forward ({cf.academicYear})</td>
                                                        <td className="px-4 py-3 text-amber-600">{formatCurrency(cf.amount)}</td>
                                                        <td className="px-4 py-3 text-emerald-600/50">-</td>
                                                        <td className="px-4 py-3 text-right font-bold text-amber-700">{formatCurrency(cf.amount)}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>

                                {/* Transaction History */}
                                <div className="px-6 pb-6">
                                    {/* Real Payments */}
                                    <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider flex items-center gap-2 mb-4">
                                        <History size={14} className="text-emerald-500" /> Recent Payments
                                    </h4>
                                    <div className="space-y-2 mb-4">
                                        {childData.transactions?.filter((tx: any) => tx.type !== 'CARRY_FORWARD').length === 0 ? (
                                            <p className="text-xs text-gray-400 italic py-4 text-center border border-dashed border-gray-200 dark:border-gray-700 rounded-lg">No payments recorded for this child.</p>
                                        ) : (
                                            childData.transactions?.filter((tx: any) => tx.type !== 'CARRY_FORWARD').slice(0, 3).map((tx: any) => (
                                                <div key={tx.id} className="flex items-center justify-between p-3 bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-lg text-xs">
                                                    <div className="flex items-center gap-3">
                                                        <div className="p-1.5 bg-emerald-50 dark:bg-emerald-900/20 rounded text-emerald-600">
                                                            <CheckCircle2 size={14} />
                                                        </div>
                                                        <div>
                                                            <p className="font-bold text-gray-800 dark:text-gray-200 capitalize">
                                                                {tx.meta?.narrative || tx.type.toLowerCase().replace(/_/g, ' ')}
                                                            </p>
                                                            <p className="text-[10px] text-gray-400">{format(new Date(tx.createdAt), 'MMM dd, yyyy')} • Ref: {tx.reference || tx.id.substring(0, 8)}</p>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-4">
                                                        <span className="font-bold text-gray-900 dark:text-white">{formatCurrency(tx.amount)}</span>
                                                        <Printer size={14} className="text-gray-300 cursor-pointer hover:text-primary-500 transition-colors" />
                                                    </div>
                                                </div>
                                            ))
                                        )}
                                    </div>

                                    {/* Balance Transfers (audit trail, not payments) */}
                                    {childData.transactions?.some((tx: any) => tx.type === 'CARRY_FORWARD') && (
                                        <>
                                            <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider flex items-center gap-2 mb-3 mt-2">
                                                <ArrowRight size={14} className="text-amber-500" /> Balance Transfers
                                            </h4>
                                            <div className="space-y-2">
                                                {childData.transactions?.filter((tx: any) => tx.type === 'CARRY_FORWARD').map((tx: any) => (
                                                    <div key={tx.id} className="flex items-center justify-between p-3 bg-amber-50/40 dark:bg-amber-900/10 border border-amber-100 dark:border-amber-900/30 rounded-lg text-xs">
                                                        <div className="flex items-center gap-3">
                                                            <div className="p-1.5 bg-amber-100 dark:bg-amber-900/30 rounded text-amber-600">
                                                                <ArrowRight size={14} />
                                                            </div>
                                                            <div>
                                                                <p className="font-bold text-amber-800 dark:text-amber-300">
                                                                    {tx.meta?.narrative || 'Balance Carried Forward'}
                                                                </p>
                                                                <p className="text-[10px] text-gray-400">{format(new Date(tx.createdAt), 'MMM dd, yyyy')} • Ref: {tx.reference || tx.id.substring(0, 8)}</p>
                                                            </div>
                                                        </div>
                                                        <span className="font-bold text-amber-700 dark:text-amber-400">{formatCurrency(tx.amount)}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </>
                                    )}
                                </div>

                                {/* Action Bar */}
                                <div className="px-6 py-4 bg-gray-50 dark:bg-gray-800 border-t border-gray-100 dark:border-gray-700 flex justify-end gap-3">
                                    <button 
                                        onClick={() => navigate(`/students/profile/${child.id}`)}
                                        className="px-4 py-2 text-xs font-bold text-gray-500 hover:text-gray-700 transition-all"
                                    >
                                        View Full Account Statement
                                    </button>
                                    {balance > 0 && (
                                        <button 
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setAllocationContext({ scope: 'CHILD', studentId: child.id });
                                                setShowAllocationModal(true);
                                            }}
                                            className="px-6 py-2 bg-gray-900 dark:bg-gray-700 text-white text-xs font-bold rounded-lg hover:bg-black transition-all"
                                        >
                                            Settle Balance
                                        </button>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                );
            })}

            {data?.siblings?.length === 0 && (
                <div className="text-center py-16 bg-white dark:bg-gray-800 rounded-xl border-2 border-dashed border-gray-100 dark:border-gray-700">
                    <Users className="mx-auto text-gray-200 mb-4" size={48} />
                    <p className="text-sm text-gray-500">No student records found linked to your parent account.</p>
                </div>
            )}
        </div>

        {/* Sidebar Info */}
        <div className="lg:col-span-4 space-y-6">
            <div className="bg-primary-600 rounded-xl p-6 text-white shadow-sm">
                <h3 className="font-bold flex items-center gap-2 mb-3">
                    <ShieldCheck size={20} /> Secure Payments
                </h3>
                <p className="text-xs text-primary-50 leading-relaxed font-medium">
                    Our billing system uses industrial-standard encryption to protect your data. All digital receipts are generated instantly and stored for your records.
                </p>
            </div>

            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-6 shadow-sm">
                <h3 className="text-xs font-bold text-gray-900 dark:text-white uppercase tracking-wider mb-4 flex items-center gap-2">
                    <Info size={16} className="text-primary-500" /> Payment Policy
                </h3>
                <div className="space-y-4">
                    <div className="flex gap-3">
                        <div className="w-1.5 h-1.5 rounded-full bg-primary-500 mt-1.5"></div>
                        <p className="text-[11px] text-gray-500 dark:text-gray-400">Transactions reflect instantly on successful payment gateway redirect.</p>
                    </div>
                    <div className="flex gap-3">
                        <div className="w-1.5 h-1.5 rounded-full bg-primary-500 mt-1.5"></div>
                        <p className="text-[11px] text-gray-500 dark:text-gray-400">Please quote your reference ID for any manual bank audit requests.</p>
                    </div>
                </div>
            </div>
        </div>
      </div>

      {selectedStudent && (
          <PaymentModal
            isOpen={showPaymentModal}
            onClose={() => {
                setShowPaymentModal(false);
                setSelectedStudent(null);
                setSelectedFeeHead(null);
                setSelectedAllocations([]);
            }}
            student={selectedStudent}
            feeHead={selectedFeeHead}
            onSuccess={() => fetchFamilyData()}
            isBulk={selectedAllocations.length > 0}
            bulkAllocations={selectedAllocations}
          />
      )}

      <FamilyAllocationModal
        isOpen={showAllocationModal}
        title={allocationContext?.scope === 'CHILD' ? 'Allocate Child Payment' : 'Allocate Family Payment'}
        description={
          allocationContext?.scope === 'CHILD'
            ? 'Assign this payment to the exact fee heads you want to settle for this child.'
            : 'Assign this payment to the exact child and fee-head lines before checkout.'
        }
        lines={allocationLines}
        formatCurrency={formatCurrency}
        onClose={() => {
          setShowAllocationModal(false);
          setAllocationContext(null);
        }}
        onConfirm={handleAllocationConfirmed}
      />
    </div>
  );
}
