import React, { useState } from 'react';
import { CreditCard, X, ShieldCheck, Loader2, ArrowRight } from 'lucide-react';
import { formatCurrency } from '../../../utils/currency';
import api from '../../../services/api';
import { useToast } from '../../../context/ToastContext';
import { usePaystackPayment } from 'react-paystack';
import { useFlutterwave, closePaymentModal } from 'flutterwave-react-v3';
import { useSystem } from '../../../context/SystemContext';

interface PaymentModalProps {
    isOpen: boolean;
    onClose: () => void;
    student: any;
    feeHead: any; // { id, name, balance }
    onSuccess: () => void;
}

export function PaymentModal({ isOpen, onClose, student, feeHead, onSuccess }: PaymentModalProps) {
    const { showError, showSuccess } = useToast();
    const { settings, formatCurrency } = useSystem();
    const [amount, setAmount] = useState(feeHead?.balance || '');
    const [isProcessing, setIsProcessing] = useState(false);
    const [step, setStep] = useState<'DETAILS' | 'GATEWAY_SELECTION' | 'SUCCESS'>('DETAILS');

    if (!isOpen || !feeHead) return null;

    const maxAmount = parseFloat(feeHead.balance);
    const payAmountNum = parseFloat(amount);

    const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        let val = e.target.value;
        const numVal = parseFloat(val);
        if (numVal > maxAmount) {
            val = maxAmount.toString();
        }
        setAmount(val);
    };

    const handleProceed = () => {
        if (isNaN(payAmountNum) || payAmountNum <= 0) {
            showError('Please enter a valid amount.');
            return;
        }
        setStep('GATEWAY_SELECTION');
    };

    const paymentMeta = {
        note: `Online payment for ${feeHead.name}`,
        allocations: [{
            id: feeHead.id,
            name: feeHead.name,
            amount: payAmountNum.toString(),
            status: payAmountNum >= maxAmount ? 'PAID' : 'PARTIAL'
        }]
    };

    // Paystack Configuration
    const paystackConfig = {
        reference: `PS_${Math.random().toString(36).substring(2, 10).toUpperCase()}_${Date.now()}`,
        email: student.email || 'student@example.com',
        amount: Math.round(payAmountNum * 100), // Minor units (kobo/cents)
        currency: settings.currencyCode || 'NGN',
        publicKey: (import.meta as any).env.VITE_PAYSTACK_PUBLIC_KEY,
        metadata: {
            custom_fields: [],
            studentId: student.id,
            ...paymentMeta
        }
    };

    const initializePaystack = usePaystackPayment(paystackConfig);

    const handlePaystackSuccess = async (reference: any) => {
        setIsProcessing(true);
        try {
            await api.verifyPaystackPayment({
                reference: reference.reference,
                meta: paymentMeta,
                studentId: student.id,
            });
            showSuccess('Payment verified successfully!');
            setStep('SUCCESS');
        } catch (error: any) {
            showError(error.response?.data?.message || 'Payment verification failed.');
            setStep('DETAILS');
        } finally {
            setIsProcessing(false);
        }
    };

    const handlePaystackClose = () => {
        showError('Payment cancelled.');
        setIsProcessing(false);
    };

    const payWithPaystack = () => {
        setIsProcessing(true);
        initializePaystack({ onSuccess: handlePaystackSuccess, onClose: handlePaystackClose });
    };

    // Flutterwave Configuration
    const flutterwaveConfig = {
        public_key: (import.meta as any).env.VITE_FLUTTERWAVE_PUBLIC_KEY,
        tx_ref: `FW_${Math.random().toString(36).substring(2, 10).toUpperCase()}_${Date.now()}`,
        amount: payAmountNum,
        currency: settings.currencyCode || 'NGN',
        payment_options: 'card,mobilemoney,ussd',
        customer: {
            email: student.email || 'student@example.com',
            phone_number: student.mobileNumber || student.fatherPhone || '',
            name: `${student.firstName} ${student.lastName}`,
        },
        customizations: {
            title: 'School Fee Payment',
            description: `Payment for ${feeHead.name}`,
            logo: 'https://st2.depositphotos.com/4403291/7418/v/450/depositphotos_74189661-stock-illustration-online-shop-log.jpg',
        },
        meta: {
            studentId: student.id,
            allocations: JSON.stringify(paymentMeta.allocations),
            note: paymentMeta.note
        }
    };

    const handleFlutterwavePayment = useFlutterwave(flutterwaveConfig);

    const payWithFlutterwave = () => {
        setIsProcessing(true);
        handleFlutterwavePayment({
            callback: async (response) => {
                closePaymentModal();
                if (response.status === 'successful') {
                     try {
                        await api.verifyFlutterwavePayment({
                            transactionId: response.transaction_id.toString(),
                            meta: paymentMeta,
                            studentId: student.id,
                        });
                        showSuccess('Payment verified successfully!');
                        setStep('SUCCESS');
                    } catch (error: any) {
                        showError(error.response?.data?.message || 'Payment verification failed.');
                        setStep('DETAILS');
                    } finally {
                        setIsProcessing(false);
                    }
                } else {
                    showError('Payment failed or cancelled.');
                    setIsProcessing(false);
                    setStep('DETAILS');
                }
            },
            onClose: () => {
                showError('Payment cancelled.');
                setIsProcessing(false);
            },
        });
    };

    const handleClose = () => {
        if (step === 'SUCCESS') {
            onSuccess();
        }
        setTimeout(() => {
            setStep('DETAILS');
            setAmount('');
        }, 300);
        onClose();
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
            <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
                {step === 'DETAILS' && (
                    <>
                        <div className="p-6 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-primary-50 dark:bg-primary-900/30 flex items-center justify-center text-primary-600">
                                    <CreditCard size={20} />
                                </div>
                                <div>
                                    <h3 className="text-lg font-black text-gray-900 dark:text-white uppercase tracking-tighter">Pay Fees Online</h3>
                                    <p className="text-xs font-medium text-gray-500">{feeHead.name}</p>
                                </div>
                            </div>
                            <button onClick={handleClose} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full text-gray-400 transition-colors">
                                <X size={20} />
                            </button>
                        </div>
                        
                        <div className="p-6 space-y-6 bg-gray-50/50 dark:bg-gray-900/50">
                            <div className="bg-white dark:bg-gray-800 p-5 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm space-y-4">
                                <div className="flex justify-between items-center pb-4 border-b border-gray-50 dark:border-gray-700">
                                    <span className="text-xs font-bold text-gray-500 uppercase tracking-widest">Student</span>
                                    <span className="text-sm font-black text-gray-900 dark:text-white">{student.firstName} {student.lastName}</span>
                                </div>
                                <div className="flex justify-between items-center pb-4 border-b border-gray-50 dark:border-gray-700">
                                    <span className="text-xs font-bold text-gray-500 uppercase tracking-widest">Outstanding Due</span>
                                    <span className="text-sm font-black text-red-600">{formatCurrency(parseFloat(feeHead.balance))}</span>
                                </div>
                                
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Amount to Pay</label>
                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                            <span className="text-gray-500 font-black sm:text-lg">{settings.currencySymbol || '₦'}</span>
                                        </div>
                                        <input
                                            type="number"
                                            step="0.01"
                                            className="w-full pl-10 pr-4 py-4 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 rounded-xl text-lg font-black text-gray-900 dark:text-white transition-all shadow-inner"
                                            value={amount}
                                            onChange={handleAmountChange}
                                            placeholder="0.00"
                                            max={maxAmount}
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="flex items-center gap-2 justify-center text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest">
                                <ShieldCheck size={14} className="text-emerald-500" />
                                Secured Payment Gateways
                            </div>
                        </div>

                        <div className="p-6 bg-white dark:bg-gray-800 border-t border-gray-100 dark:border-gray-700">
                            <button
                                onClick={handleProceed}
                                disabled={!amount || parseFloat(amount) <= 0}
                                className="w-full py-4 bg-primary-600 text-white rounded-xl text-sm font-black uppercase tracking-widest shadow-lg shadow-primary-500/30 hover:bg-primary-700 hover:-translate-y-0.5 active:translate-y-0 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                            >
                                Proceed to Select Gateway
                                <ArrowRight size={16} />
                            </button>
                        </div>
                    </>
                )}

                {step === 'GATEWAY_SELECTION' && (
                    <div className="p-8 text-center space-y-6">
                        <div className="w-16 h-16 bg-[#09A5DB]/10 rounded-full flex items-center justify-center mx-auto mb-4">
                            <ShieldCheck size={32} className="text-[#09A5DB]" />
                        </div>
                        <h3 className="text-2xl font-black text-gray-900 dark:text-white tracking-tight">Select Payment Gateway</h3>
                        <p className="text-sm text-gray-500">
                            You are about to pay <span className="font-black text-gray-900 dark:text-white">{formatCurrency(parseFloat(amount))}</span> for {feeHead.name}.
                        </p>
                        
                        <div className="grid grid-cols-1 gap-4 my-6">
                            <button
                                onClick={payWithPaystack}
                                disabled={isProcessing || !(import.meta as any).env.VITE_PAYSTACK_PUBLIC_KEY}
                                className="w-full py-4 bg-[#09A5DB] text-white rounded-xl text-sm font-black uppercase tracking-widest shadow-lg shadow-[#09A5DB]/30 hover:bg-[#0894C4] transition-all disabled:opacity-70 flex items-center justify-center gap-2"
                            >
                                {isProcessing ? (
                                    <>
                                        <Loader2 className="animate-spin" size={18} />
                                        Processing...
                                    </>
                                ) : (
                                    'Pay with Paystack'
                                )}
                            </button>
                            
                            <button
                                onClick={payWithFlutterwave}
                                disabled={isProcessing || !(import.meta as any).env.VITE_FLUTTERWAVE_PUBLIC_KEY}
                                className="w-full py-4 bg-[#F5A623] hover:bg-[#e0961c] text-white rounded-xl text-sm font-black uppercase tracking-widest shadow-lg transition-all disabled:opacity-70 flex items-center justify-center gap-2"
                            >
                                {isProcessing ? (
                                    <>
                                        <Loader2 className="animate-spin" size={18} />
                                        Processing...
                                    </>
                                ) : (
                                    'Pay with Flutterwave'
                                )}
                            </button>
                        </div>
                        
                        <button
                            onClick={() => setStep('DETAILS')}
                            disabled={isProcessing}
                            className="text-xs font-bold text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 uppercase tracking-widest"
                        >
                            Back
                        </button>
                    </div>
                )}

                {step === 'SUCCESS' && (
                    <div className="p-8 text-center space-y-6">
                        <div className="w-24 h-24 bg-emerald-100 dark:bg-emerald-900/30 rounded-full flex items-center justify-center text-emerald-600 mx-auto border-8 border-emerald-50 dark:border-emerald-900/10 shadow-lg">
                            <ShieldCheck size={48} />
                        </div>
                        <div className="space-y-2">
                            <h3 className="text-2xl font-black text-gray-900 dark:text-white uppercase tracking-tighter">Payment Successful!</h3>
                            <p className="text-sm font-medium text-gray-500">Your payment of <span className="font-bold text-gray-900 dark:text-white">{formatCurrency(parseFloat(amount))}</span> has been received and your ledger updated.</p>
                        </div>
                        
                        <button
                            onClick={handleClose}
                            className="w-full py-4 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-xl text-sm font-black uppercase tracking-widest shadow-lg hover:bg-black dark:hover:bg-gray-100 transition-all mt-6"
                        >
                            Done
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
