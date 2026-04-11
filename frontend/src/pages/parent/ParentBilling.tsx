import React, { useState, useEffect, useCallback } from 'react';
import {
  CreditCard,
  ChevronRight,
  ShieldCheck,
  AlertCircle,
  ArrowRight,
  TrendingUp,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { useToast } from '../../context/ToastContext';
import { useAuthStore } from '../../stores/authStore';
import { useSystem } from '../../context/SystemContext';
import { PaymentModal } from '../students/components/PaymentModal';

export default function ParentBilling() {
  const { user } = useAuthStore();
  const { showError } = useToast();
  const { formatCurrency } = useSystem();
  const navigate = useNavigate();
  
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentMode, setPaymentMode] = useState<'SINGLE' | 'BULK'>('BULK');
  const [selectedStudent, setSelectedStudent] = useState<any>(null);
  const [selectedFeeHead, setSelectedFeeHead] = useState<any>(null);

  const fetchFamilyData = useCallback(async () => {
    if (!user?.id) return;
    setLoading(true);
    try {
      const response = (await api.getMyChildren()) as any;
      const children = Array.isArray(response) ? response : (response?.data || []);
      
      if (children && children.length > 0) {
        const statsResponse = (await api.getFamilyFinancials(children[0].id)) as any;
        const result = statsResponse?.data || statsResponse;
        setData(result);
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

  const handlePayAll = () => {
    setPaymentMode('BULK');
    if (data?.siblings?.length > 0) {
        setSelectedStudent(data.siblings[0]);
        setSelectedFeeHead({
            id: 'BULK',
            name: 'Family Outstanding Balance',
            balance: data.totalFamilyBalance.toString()
        });
        setShowPaymentModal(true);
    }
  };

  if (loading) {
      return (
          <div className="flex items-center justify-center min-h-[400px]">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-900"></div>
          </div>
      );
  }

  const bulkAllocations = data?.siblings?.map((s: any) => ({
      studentId: s.id,
      amount: s.balance,
      name: `${s.firstName} ${s.lastName}`
  })).filter((a: any) => parseFloat(a.amount) > 0) || [];

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-20">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-200 pb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Family Billing</h1>
          <p className="text-sm text-slate-500">View and settle tuition balances for all registered children.</p>
        </div>
        <button
            onClick={handlePayAll}
            disabled={parseFloat(data?.totalFamilyBalance) <= 0}
            className="px-6 py-3 bg-slate-900 text-white rounded-lg font-bold text-sm hover:bg-black transition-all disabled:opacity-30 flex items-center gap-2"
          >
            <CreditCard size={18} />
            Pay All ({formatCurrency(data?.totalFamilyBalance)})
          </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Summary Card */}
        <div className="lg:col-span-1 space-y-4">
            <div className="bg-slate-50 border border-slate-200 p-6 rounded-xl">
                <h3 className="text-sm font-bold text-slate-500 uppercase tracking-widest mb-4">Family Summary</h3>
                <div className="space-y-4">
                    <div className="flex justify-between items-center">
                        <span className="text-sm text-slate-600">Total Billed</span>
                        <span className="font-bold">{formatCurrency(data?.totalFamilyDue)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                        <span className="text-sm text-slate-600">Total Paid</span>
                        <span className="font-bold text-emerald-600">{formatCurrency(data?.totalFamilyPaid)}</span>
                    </div>
                    <div className="pt-4 border-t border-slate-200 flex justify-between items-center">
                        <span className="text-base font-bold text-slate-900">Net Due</span>
                        <span className="text-xl font-bold text-red-600">{formatCurrency(data?.totalFamilyBalance)}</span>
                    </div>
                </div>
            </div>

            <div className="bg-white border border-gray-200 p-4 rounded-xl flex items-center gap-3">
                <ShieldCheck className="text-emerald-500" size={20} />
                <p className="text-xs text-slate-500 font-medium leading-tight">All payments are secured and a digital receipt will be issued immediately.</p>
            </div>
        </div>

        {/* Children Breakdown */}
        <div className="lg:col-span-2 space-y-4">
            <h3 className="text-sm font-bold text-slate-500 uppercase tracking-widest pl-1">Statements by Child</h3>
            {data?.siblings?.map((child: any) => (
                <div key={child.id} className="bg-white border border-gray-200 rounded-xl p-5 hover:border-slate-400 transition-colors">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-slate-100 rounded-lg flex items-center justify-center font-bold text-slate-500 border border-slate-200">
                                {child.firstName?.charAt(0) || ''}{child.lastName?.charAt(0) || ''}
                            </div>
                            <div>
                                <h4 className="font-bold text-slate-900">{child.firstName} {child.lastName}</h4>
                                <p className="text-xs text-slate-500">
                                    {child.className || 'Unassigned Class'} {child.sectionName ? `- ${child.sectionName}` : ''}
                                </p>
                            </div>
                        </div>
                        <div className="flex flex-row sm:flex-col items-center sm:items-end gap-3 w-full sm:w-auto">
                            <div className="flex-1 sm:text-right">
                                <p className="text-[10px] font-bold text-slate-400 uppercase mb-0.5">Outstanding</p>
                                <p className="font-bold text-slate-900">{formatCurrency(child.balance)}</p>
                            </div>
                            <div className="flex gap-2">
                                <button 
                                    onClick={() => navigate(`/students/profile/${child.id}`)}
                                    className="px-3 py-2 text-xs font-bold text-slate-500 hover:text-slate-900 border border-transparent hover:border-slate-200 rounded-lg transition-all"
                                >
                                    View Statement
                                </button>
                                {parseFloat(child.balance) > 0 && (
                                    <button 
                                        onClick={() => {
                                            setPaymentMode('SINGLE');
                                            setSelectedStudent(child);
                                            setSelectedFeeHead({ id: 'TOTAL', name: `Balance for ${child.firstName}`, balance: child.balance });
                                            setShowPaymentModal(true);
                                        }}
                                        className="px-4 py-2 bg-slate-100 text-slate-900 text-xs font-bold rounded-lg hover:bg-slate-200 transition-all border border-slate-200"
                                    >
                                        Settle
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            ))}

            {data?.siblings?.length === 0 && (
                <div className="text-center py-12 bg-gray-50 rounded-xl border border-dashed border-gray-300">
                    <AlertCircle className="mx-auto text-gray-400 mb-2" size={32} />
                    <p className="text-sm font-medium text-gray-500">No student records found linked to this account.</p>
                </div>
            )}
        </div>
      </div>

      {selectedStudent && (
          <PaymentModal
            isOpen={showPaymentModal}
            onClose={() => {
                setShowPaymentModal(false);
                setSelectedStudent(null);
                setSelectedFeeHead(null);
            }}
            student={selectedStudent}
            feeHead={selectedFeeHead}
            onSuccess={() => fetchFamilyData()}
            isBulk={paymentMode === 'BULK'}
            bulkAllocations={paymentMode === 'BULK' ? bulkAllocations : []}
          />
      )}
    </div>
  );
}
