import { X, ShieldCheck, KeySquare, Mail, User, ShieldAlert } from 'lucide-react';
import { cn } from '../../../utils/cn';

interface CredentialSummaryModalProps {
    isOpen: boolean;
    onClose: () => void;
    student: any;
    onResetPassword: (target: { userId: string, userName: string, userType: 'student' | 'parent', defaultPattern: string }) => void;
}

export function CredentialSummaryModal({ isOpen, onClose, student, onResetPassword }: CredentialSummaryModalProps) {
    if (!isOpen || !student) return null;

    const studentUsername = student.user?.email || student.admissionNo || '-';
    const parentUsername = student.parent?.user?.email || student.parent?.guardianEmail || '-';

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-2xl w-full max-w-xl border border-gray-100 dark:border-gray-700 overflow-hidden animate-in zoom-in-95 duration-200">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-900/50">
                    <div className="flex items-center gap-3">
                        <div className="p-3 bg-primary-600 rounded-2xl shadow-lg shadow-primary-500/20">
                            <ShieldCheck className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <h3 className="text-xl font-black text-gray-900 dark:text-white uppercase tracking-tight">Portal Access Credentials</h3>
                            <p className="text-xs text-gray-500 dark:text-gray-400 font-bold uppercase tracking-widest">Administrative Access Only</p>
                        </div>
                    </div>
                    <button 
                        onClick={onClose}
                        className="p-2.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl text-gray-400 transition-all hover:rotate-90 duration-300"
                    >
                        <X className="w-6 h-6" />
                    </button>
                </div>

                <div className="p-8 space-y-8">
                    {/* Security Notice */}
                    <div className="p-4 bg-primary-50/50 dark:bg-primary-900/10 border border-primary-100/50 dark:border-primary-800/30 rounded-2xl flex gap-4">
                        <ShieldAlert className="w-6 h-6 text-primary-600 flex-shrink-0" />
                        <p className="text-xs text-primary-900/70 dark:text-primary-300 leading-relaxed font-medium">
                            These credentials allow users to access the school portal. Keep this information confidential. You can reset passwords if a user forgets theirs.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Student Credentials */}
                        <div className="space-y-4">
                            <div className="flex items-center gap-2">
                                <User className="w-4 h-4 text-primary-600" />
                                <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Student Account</h4>
                            </div>
                            
                            <div className="p-5 bg-gray-50 dark:bg-gray-900/50 rounded-2xl border border-gray-100 dark:border-gray-800 space-y-4">
                                <div className="space-y-1">
                                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Username</p>
                                    <p className="text-sm font-black text-gray-900 dark:text-white truncate">{studentUsername}</p>
                                </div>
                                
                                <button 
                                    onClick={() => onResetPassword({
                                        userId: student.userId,
                                        userName: `${student.firstName} ${student.lastName}`,
                                        userType: 'student',
                                        defaultPattern: `Std@${student.admissionNo.slice(-4)}`
                                    })}
                                    disabled={!student.userId}
                                    className="w-full flex items-center justify-center gap-2 py-3 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 border border-gray-200 dark:border-gray-700 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-gray-50 dark:hover:bg-gray-700 transition-all active:scale-95 disabled:opacity-50 shadow-sm"
                                >
                                    <KeySquare className="w-4 h-4" />
                                    Reset Password
                                </button>
                            </div>
                        </div>

                        {/* Parent Credentials */}
                        <div className="space-y-4">
                            <div className="flex items-center gap-2">
                                <Mail className="w-4 h-4 text-primary-600" />
                                <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Parent Account</h4>
                            </div>
                            
                            <div className="p-5 bg-gray-50 dark:bg-gray-900/50 rounded-2xl border border-gray-100 dark:border-gray-800 space-y-4">
                                <div className="space-y-1">
                                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Username</p>
                                    <p className="text-sm font-black text-gray-900 dark:text-white truncate">{parentUsername}</p>
                                </div>
                                
                                <button 
                                    onClick={() => onResetPassword({
                                        userId: student.parent?.userId,
                                        userName: student.parent?.guardianName || student.parent?.fatherName || 'Parent',
                                        userType: 'parent',
                                        defaultPattern: `Parent@${student.parent?.guardianPhone?.slice(-4) || '1234'}`
                                    })}
                                    disabled={!student.parent?.userId}
                                    className="w-full flex items-center justify-center gap-2 py-3 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 border border-gray-200 dark:border-gray-700 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-gray-50 dark:hover:bg-gray-700 transition-all active:scale-95 disabled:opacity-50 shadow-sm"
                                >
                                    <KeySquare className="w-4 h-4" />
                                    Reset Password
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="p-6 bg-gray-50/50 dark:bg-gray-900/50 border-t border-gray-100 dark:border-gray-700 flex justify-end">
                    <button
                        onClick={onClose}
                        className="px-8 py-3 bg-gray-900 dark:bg-white text-white dark:text-gray-900 font-black text-xs uppercase tracking-[0.2em] rounded-xl hover:opacity-90 transition-all active:scale-95"
                    >
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
}
