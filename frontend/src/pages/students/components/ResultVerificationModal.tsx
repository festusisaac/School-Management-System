import React, { useState } from 'react';
import { Modal } from '../../../components/ui/modal';
import { KeyRound, Loader2, AlertCircle, CheckCircle2, Ticket, Hash } from 'lucide-react';
import { examinationService } from '../../../services/examinationService';

interface ResultVerificationModalProps {
    isOpen: boolean;
    onClose: () => void;
    studentId: string;
    examGroups: any[];
    onSuccess: (data: any) => void;
}

export const ResultVerificationModal: React.FC<ResultVerificationModalProps> = ({
    isOpen,
    onClose,
    studentId,
    examGroups,
    onSuccess
}) => {
    const [code, setCode] = useState('');
    const [pin, setPin] = useState('');
    const [examGroupId, setExamGroupId] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!code || !pin || !examGroupId) {
            setError('Please provide Serial Number, PIN and select a term');
            return;
        }

        setLoading(true);
        setError(null);

        try {
            const response = await examinationService.verifyStudentResult(studentId, { 
                code, 
                pin, 
                examGroupId 
            });
            onSuccess(response);
            onClose();
        } catch (err: any) {
            setError(err.response?.data?.message || 'Invalid Scratch Card details or usage limit exceeded');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title="Verify Academic Result"
            size="md"
        >
            <div className="space-y-6">
                <div className="bg-primary-50 dark:bg-primary-900/20 p-4 rounded-xl flex items-start gap-4 border border-primary-100 dark:border-primary-800">
                    <div className="bg-primary-100 dark:bg-primary-800 p-2 rounded-lg">
                        <Ticket className="w-6 h-6 text-primary-600 dark:text-primary-400" />
                    </div>
                    <div>
                        <h4 className="font-bold text-primary-900 dark:text-primary-100">Scratch Card Required</h4>
                        <p className="text-sm text-primary-700 dark:text-primary-300 mt-1">
                            Please enter the Serial Number and PIN found on your result checker card to view your performance.
                        </p>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-5">
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                            Select Examination Term
                        </label>
                        <select
                            value={examGroupId}
                            onChange={(e) => setExamGroupId(e.target.value)}
                            className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 focus:ring-2 focus:ring-primary-500 outline-none transition-all"
                            required
                        >
                            <option value="">-- Choose Term --</option>
                            {examGroups.map((group) => (
                                <option key={group.id} value={group.id}>
                                    {group.name}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                                Serial Number
                            </label>
                            <div className="relative">
                                <Hash className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                                <input
                                    type="text"
                                    value={code}
                                    onChange={(e) => setCode(e.target.value.toUpperCase())}
                                    placeholder="SERIAL NO"
                                    className="w-full pl-11 pr-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 font-mono focus:ring-2 focus:ring-primary-500 outline-none transition-all"
                                    required
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                                Scratch Card PIN
                            </label>
                            <div className="relative">
                                <KeyRound className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                                <input
                                    type="text"
                                    value={pin}
                                    onChange={(e) => setPin(e.target.value.toUpperCase())}
                                    placeholder="PIN CODE"
                                    className="w-full pl-11 pr-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 font-mono tracking-widest focus:ring-2 focus:ring-primary-500 outline-none transition-all"
                                    required
                                />
                            </div>
                        </div>
                    </div>

                    {error && (
                        <div className="flex items-center gap-2 p-3 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm border border-red-100 dark:border-red-800">
                            <AlertCircle className="w-4 h-4 shrink-0" />
                            <span>{error}</span>
                        </div>
                    )}

                    <div className="pt-2">
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-primary-600 hover:bg-primary-700 disabled:bg-primary-400 text-white font-bold py-4 rounded-xl transition-all shadow-lg shadow-primary-500/20 flex items-center justify-center gap-2 group"
                        >
                            {loading ? (
                                <Loader2 className="w-5 h-5 animate-spin" />
                            ) : (
                                <>
                                    <span>Check Result</span>
                                    <CheckCircle2 className="w-5 h-5 group-hover:scale-110 transition-transform" />
                                </>
                            )}
                        </button>
                    </div>
                </form>

                <p className="text-center text-xs text-gray-500 dark:text-gray-400">
                    Lost your card? Contact the school bursary for a replacement. Each card has a limited usage count.
                </p>
            </div>
        </Modal>
    );
};
