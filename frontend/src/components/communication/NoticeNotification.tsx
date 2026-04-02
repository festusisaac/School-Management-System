import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { Bell } from 'lucide-react';
import { api, NoticeAudience } from '../../services/api';
import { useAuthStore } from '../../stores/authStore';

/**
 * NoticeNotification
 * A background component included in MainLayout that checks for new
 * school-wide notices and alerts the user with a toast.
 */
export default function NoticeNotification() {
    const { user } = useAuthStore();
    const navigate = useNavigate();

    useEffect(() => {
        const userRole = (user?.role || user?.roleObject?.name || '').toLowerCase();
        if (!user || userRole === 'super administrator') return;

        const checkNewNotices = async () => {
            try {
                const userRole = (user?.role || user?.roleObject?.name || 'student').toLowerCase();
                const audience = userRole === 'student' || userRole === 'parent' 
                    ? NoticeAudience.STUDENTS 
                    : NoticeAudience.STAFF;

                // Fetch latest notices for this user
                const notices = await api.getNotices({ audience });
                
                if (notices && notices.length > 0) {
                    const latestNotice = notices[0];
                    const storageKey = `session_notified_notice_${user?.id || 'unknown'}`;
                    const lastNotifiedId = sessionStorage.getItem(storageKey);

                    // Only notify if it's a new notice we haven't shown a toast for in THIS session
                    if (latestNotice.id !== lastNotifiedId) {
                        toast.custom((t) => (
                            <div
                                className={`${
                                    t.visible ? 'animate-in fade-in slide-in-from-top-full' : 'animate-out fade-out slide-out-to-top-full'
                                } max-w-md w-full bg-white dark:bg-gray-800 shadow-2xl rounded-2xl pointer-events-auto flex ring-1 ring-black ring-opacity-5 border border-primary-500/20 overflow-hidden`}
                            >
                                <div className="flex-1 w-0 p-4">
                                    <div className="flex items-start">
                                        <div className="flex-shrink-0 pt-0.5">
                                            <div className="h-10 w-10 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center">
                                                <Bell className="h-5 w-5 text-primary-600 dark:text-primary-400" />
                                            </div>
                                        </div>
                                        <div className="ml-3 flex-1 min-w-0">
                                            <p className="text-sm font-black text-gray-900 dark:text-white truncate uppercase tracking-tight">
                                                New School Notice
                                            </p>
                                            <p className="mt-0.5 text-sm font-semibold text-gray-500 dark:text-gray-400 line-clamp-1">
                                                {latestNotice.title}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex items-stretch border-l border-gray-100 dark:border-gray-700">
                                    <button
                                        onClick={() => {
                                            sessionStorage.setItem(storageKey, latestNotice.id);
                                            toast.dismiss(t.id);
                                            navigate('/communication/noticeboard');
                                        }}
                                        className="px-6 flex items-center justify-center text-sm font-black text-primary-600 hover:text-primary-700 hover:bg-primary-50 dark:hover:bg-primary-900/10 transition-colors uppercase tracking-widest"
                                    >
                                        Read
                                    </button>
                                    <button
                                        onClick={() => {
                                            sessionStorage.setItem(storageKey, latestNotice.id);
                                            toast.dismiss(t.id);
                                        }}
                                        className="px-4 flex items-center justify-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 border-l border-gray-100 dark:border-gray-700 transition-colors"
                                    >
                                        <span className="sr-only">Close</span>
                                        <svg className="h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                        </svg>
                                    </button>
                                </div>
                            </div>
                        ), { duration: 8000, position: 'top-center' });
                    }
                }
            } catch (error) {
                // Silently avoid logging permission errors (staff without permission will just skip)
                console.debug('Notice check skipped: Unauthorized or error fetching notices');
            }
        };

        // Small delay to let the dashboard render first
        const timer = setTimeout(checkNewNotices, 1500);
        return () => clearTimeout(timer);
    }, [user, navigate]);

    return null;
}
