import { useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { TopBar } from './TopBar';
import NoticeNotification from '../communication/NoticeNotification';
import { useSessionTimeout } from '../../hooks/useSessionTimeout';
import { useAuthStore } from '../../stores/authStore';

export function MainLayout() {
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);
    const { WarningModal } = useSessionTimeout();
    const { refreshUser } = useAuthStore();

    useEffect(() => {
        refreshUser();
    }, []);

    return (
        <div className="h-screen bg-gray-50 dark:bg-gray-950 flex overflow-hidden">
            {/* Global Notice Notification Trigger */}
            <NoticeNotification />

            {/* Session Timeout Warning */}
            {WarningModal}

            {/* Sidebar */}
            <Sidebar
                isOpen={isSidebarOpen}
                onClose={() => setIsSidebarOpen(false)}
            />

            {/* Main Content Area */}
            <div className="flex-1 flex flex-col h-full transition-all duration-300 overflow-hidden">
                <TopBar onMenuClick={() => setIsSidebarOpen(!isSidebarOpen)} />

                <main className="flex-1 overflow-y-auto">
                    <div className="w-full px-4 md:px-8 py-4 md:py-6 max-w-[100%] mx-auto">
                        <Outlet />
                    </div>
                </main>
            </div>
        </div>
    );
}

