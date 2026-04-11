import { useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { TopBar } from './TopBar';
import NoticeNotification from '../communication/NoticeNotification';
import { useSessionTimeout } from '../../hooks/useSessionTimeout';
import { useAuthStore } from '../../stores/authStore';

export function MainLayout() {
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const { WarningModal } = useSessionTimeout();
    const { refreshUser, user, setChildrenList, setSelectedChildId, childrenList } = useAuthStore();

    useEffect(() => {
        // Only open on desktop by default
        if (window.innerWidth >= 1024) {
            setIsSidebarOpen(true);
        }
        refreshUser();
    }, []);

    // Load children if user is a parent
    useEffect(() => {
        const loadChildren = async () => {
            const role = (user?.role || user?.roleObject?.name || '').toLowerCase();
            if (role === 'parent' && childrenList.length === 0) {
                try {
                    const { default: api } = await import('../../services/api');
                    const children = await api.getMyChildren();
                    setChildrenList(children);
                    if (children.length > 0) {
                        setSelectedChildId(children[0].id);
                    }
                } catch (error) {
                    console.error("Failed to load children", error);
                }
            }
        };
        loadChildren();
    }, [user]);

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

