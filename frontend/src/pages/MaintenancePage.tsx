import { Construction, Settings, ShieldAlert } from 'lucide-react';

export default function MaintenancePage() {
    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center p-6">
            <div className="max-w-lg w-full text-center space-y-8">
                {/* Animated Icon */}
                <div className="relative mx-auto w-32 h-32">
                    <div className="absolute inset-0 bg-primary-500/20 rounded-full animate-ping" />
                    <div className="relative w-32 h-32 bg-gradient-to-br from-primary-500 to-primary-700 rounded-full flex items-center justify-center shadow-2xl shadow-primary-500/30">
                        <Construction size={56} className="text-white" />
                    </div>
                </div>

                {/* Title */}
                <div className="space-y-3">
                    <h1 className="text-4xl font-black text-white uppercase tracking-tighter">
                        Under Maintenance
                    </h1>
                    <p className="text-gray-400 text-lg font-medium leading-relaxed max-w-md mx-auto">
                        We're performing scheduled maintenance to improve your experience. The system will be back online shortly.
                    </p>
                </div>

                {/* Status Cards */}
                <div className="flex justify-center gap-4">
                    <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-4 flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-amber-500/20 flex items-center justify-center">
                            <ShieldAlert size={20} className="text-amber-400" />
                        </div>
                        <div className="text-left">
                            <p className="text-xs font-bold text-gray-500 uppercase tracking-widest">Status</p>
                            <p className="text-sm font-bold text-amber-400">Maintenance Mode</p>
                        </div>
                    </div>
                    <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-4 flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-primary-500/20 flex items-center justify-center">
                            <Settings size={20} className="text-primary-400 animate-spin" style={{ animationDuration: '3s' }} />
                        </div>
                        <div className="text-left">
                            <p className="text-xs font-bold text-gray-500 uppercase tracking-widest">Progress</p>
                            <p className="text-sm font-bold text-primary-400">In Progress</p>
                        </div>
                    </div>
                </div>

                {/* Info */}
                <p className="text-xs text-gray-600 font-medium">
                    If you are an administrator, please log in to access the system.
                </p>

                {/* Login Button for Admins */}
                <a
                    href="/login"
                    className="inline-flex items-center gap-2 px-6 py-3 bg-white/10 hover:bg-white/20 border border-white/20 rounded-xl text-white font-bold text-sm uppercase tracking-widest transition-all hover:scale-105"
                >
                    Go to Login
                </a>
            </div>
        </div>
    );
}
