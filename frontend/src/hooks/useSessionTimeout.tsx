import { useEffect, useRef, useState, useCallback } from 'react';
import { useSystem } from '../context/SystemContext';
import { Clock, AlertTriangle } from 'lucide-react';

const ACTIVITY_EVENTS = ['mousedown', 'mousemove', 'keydown', 'scroll', 'touchstart', 'click'];
const WARNING_BEFORE_SECONDS = 60; // Show warning 60s before logout

export function useSessionTimeout() {
    const { settings } = useSystem();
    const timeoutMinutes = settings?.sessionTimeoutMinutes || 0;
    const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const warningTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const [showWarning, setShowWarning] = useState(false);
    const [secondsLeft, setSecondsLeft] = useState(WARNING_BEFORE_SECONDS);
    const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null);

    const logout = useCallback(() => {
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        window.location.href = '/login?reason=timeout';
    }, []);

    const clearAllTimers = useCallback(() => {
        if (timerRef.current) clearTimeout(timerRef.current);
        if (warningTimerRef.current) clearTimeout(warningTimerRef.current);
        if (countdownRef.current) clearInterval(countdownRef.current);
        timerRef.current = null;
        warningTimerRef.current = null;
        countdownRef.current = null;
    }, []);

    const resetTimer = useCallback(() => {
        if (!timeoutMinutes || timeoutMinutes <= 0) return;

        clearAllTimers();
        setShowWarning(false);
        setSecondsLeft(WARNING_BEFORE_SECONDS);

        const totalMs = timeoutMinutes * 60 * 1000;
        const warningMs = totalMs - (WARNING_BEFORE_SECONDS * 1000);

        // Set warning timer (fires WARNING_BEFORE_SECONDS before logout)
        if (warningMs > 0) {
            warningTimerRef.current = setTimeout(() => {
                setShowWarning(true);
                setSecondsLeft(WARNING_BEFORE_SECONDS);

                // Start countdown
                countdownRef.current = setInterval(() => {
                    setSecondsLeft(prev => {
                        if (prev <= 1) {
                            if (countdownRef.current) clearInterval(countdownRef.current);
                            return 0;
                        }
                        return prev - 1;
                    });
                }, 1000);
            }, warningMs);
        }

        // Set final logout timer
        timerRef.current = setTimeout(logout, totalMs);
    }, [timeoutMinutes, logout, clearAllTimers]);

    const handleActivity = useCallback(() => {
        if (showWarning) {
            // User interacted during warning — reset everything
            setShowWarning(false);
        }
        resetTimer();
    }, [resetTimer, showWarning]);

    useEffect(() => {
        if (!timeoutMinutes || timeoutMinutes <= 0) return;

        // Only run when logged in
        const token = localStorage.getItem('access_token');
        if (!token) return;

        resetTimer();

        ACTIVITY_EVENTS.forEach(event => {
            document.addEventListener(event, handleActivity, { passive: true });
        });

        return () => {
            clearAllTimers();
            ACTIVITY_EVENTS.forEach(event => {
                document.removeEventListener(event, handleActivity);
            });
        };
    }, [timeoutMinutes, resetTimer, handleActivity, clearAllTimers]);

    // Warning Modal Component
    const WarningModal = showWarning ? (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-300">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-sm w-full p-8 text-center space-y-6 animate-in zoom-in-95 duration-200">
                <div className="w-20 h-20 mx-auto bg-amber-100 dark:bg-amber-900/30 rounded-full flex items-center justify-center border-4 border-amber-50 dark:border-amber-900/10">
                    <AlertTriangle size={40} className="text-amber-600" />
                </div>
                <div className="space-y-2">
                    <h3 className="text-xl font-black text-gray-900 dark:text-white uppercase tracking-tight">Session Expiring</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                        Your session will expire due to inactivity.
                    </p>
                </div>
                <div className="flex items-center justify-center gap-2 text-3xl font-black text-amber-600">
                    <Clock size={28} />
                    <span>{secondsLeft}s</span>
                </div>
                <button
                    onClick={handleActivity}
                    className="w-full py-3 bg-primary-600 hover:bg-primary-700 text-white rounded-xl font-bold uppercase tracking-widest transition-all shadow-lg shadow-primary-500/20"
                >
                    I'm Still Here
                </button>
            </div>
        </div>
    ) : null;

    return { WarningModal };
}
