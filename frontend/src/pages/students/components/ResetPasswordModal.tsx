import { useState } from 'react';
import { X, Lock, Eye, EyeOff, ShieldCheck, AlertCircle } from 'lucide-react';
import api from '../../../services/api';
import { useToast } from '../../../context/ToastContext';

interface ResetPasswordModalProps {
    isOpen: boolean;
    onClose: () => void;
    userId: string;
    userName: string;
    userType: 'student' | 'parent' | 'staff';
    defaultPattern?: string;
}

export function ResetPasswordModal({ isOpen, onClose, userId, userName, userType, defaultPattern }: ResetPasswordModalProps) {
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const toast = useToast();

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (password !== confirmPassword) {
            toast.showWarning('Passwords do not match');
            return;
        }

        if (password.length < 6) {
            toast.showWarning('Password must be at least 6 characters');
            return;
        }

        setIsSubmitting(true);
        try {
            await api.patch(`/users/${userId}`, { password });
            toast.showSuccess(`Password for ${userName} reset successfully`);
            onClose();
            setPassword('');
            setConfirmPassword('');
        } catch (error: any) {
            toast.showError('Failed to reset password: ' + (error.response?.data?.message || error.message));
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-md border border-gray-100 dark:border-gray-700 overflow-hidden animate-in zoom-in-95 duration-200">
                <div className="flex items-center justify-between p-6 border-b border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-900/50">
                    <div className="flex items-center gap-3">
                        <div className="p-2.5 bg-primary-50 dark:bg-primary-900/30 rounded-xl">
                            <Lock className="w-5 h-5 text-primary-600" />
                        </div>
                        <div>
                            <h3 className="text-lg font-bold text-gray-900 dark:text-white">Reset Password</h3>
                            <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">Managing credentials for {userName}</p>
                        </div>
                    </div>
                    <button 
                        onClick={onClose}
                        className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg text-gray-400 transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-5">
                    {/* Security Note */}
                    <div className="p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-100 dark:border-amber-800/30 rounded-xl flex gap-3">
                        <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0" />
                        <div className="space-y-1">
                            <p className="text-xs font-bold text-amber-800 dark:text-amber-400 uppercase tracking-widest">Security Action</p>
                            <p className="text-xs text-amber-700 dark:text-amber-500 leading-relaxed">
                                You are about to set a new password for this {userType}. Ensure you share the new credentials securely.
                            </p>
                        </div>
                    </div>

                    {defaultPattern && (
                        <div className="p-3 bg-primary-50/50 dark:bg-primary-900/10 border border-primary-100/50 dark:border-primary-800/50 rounded-xl">
                            <div className="flex items-center gap-2 mb-1">
                                <ShieldCheck className="w-3.5 h-3.5 text-primary-600" />
                                <span className="text-[10px] font-black text-primary-600 uppercase tracking-widest">Recommended Pattern</span>
                            </div>
                            <code className="text-xs font-mono font-bold text-primary-700 dark:text-primary-400 bg-white/50 dark:bg-gray-900/50 px-2 py-0.5 rounded">
                                {defaultPattern}
                            </code>
                        </div>
                    )}

                    <div className="space-y-4">
                        <div className="space-y-1.5">
                            <label className="text-xs font-bold text-gray-400 uppercase tracking-widest ml-1">New Password</label>
                            <div className="relative">
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full pl-4 pr-12 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-100 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 outline-none transition-all text-sm font-medium text-gray-900 dark:text-white"
                                    placeholder="Enter new password"
                                    required
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                                >
                                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                </button>
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-xs font-bold text-gray-400 uppercase tracking-widest ml-1">Confirm Password</label>
                            <input
                                type={showPassword ? 'text' : 'password'}
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-100 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 outline-none transition-all text-sm font-medium text-gray-900 dark:text-white"
                                placeholder="Repeat new password"
                                required
                            />
                        </div>
                    </div>

                    <div className="flex gap-3 pt-2">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 px-4 py-3 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 font-bold text-xs uppercase tracking-widest rounded-xl hover:bg-gray-200 dark:hover:bg-gray-600 transition-all active:scale-95"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="flex-1 px-4 py-3 bg-primary-600 text-white font-bold text-xs uppercase tracking-widest rounded-xl hover:bg-primary-700 shadow-lg shadow-primary-500/20 transition-all active:scale-95 disabled:opacity-50 disabled:active:scale-100"
                        >
                            {isSubmitting ? 'Resetting...' : 'Update Password'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
