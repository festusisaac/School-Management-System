import { useState, useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { TopBar } from './TopBar';
import NoticeNotification from '../communication/NoticeNotification';
import { useSessionTimeout } from '../../hooks/useSessionTimeout';
import { useAuthStore } from '../../stores/authStore';

export function MainLayout() {
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const { WarningModal } = useSessionTimeout();
    const { refreshUser, user, setChildrenList, setSelectedChildId, childrenList, selectedChildId } = useAuthStore();

    const location = useLocation();
    
    useEffect(() => {
        // Close sidebar on mobile when navigating
        if (window.innerWidth < 1024) {
            setIsSidebarOpen(false);
        }
    }, [location.pathname]);

    useEffect(() => {
        // Initial responsive check - explicitly closed on mobile
        const isDesktop = window.matchMedia('(min-width: 1024px)').matches;
        setIsSidebarOpen(isDesktop);
        refreshUser();
    }, []);

    // Load children if user is a parent or staff who is also a parent
    useEffect(() => {
        const loadChildren = async () => {
            const userRole = (user?.roleObject?.name || user?.role || 'student').toLowerCase().trim();
            const isStaffOrAdmin = ['super administrator', 'admin', 'teacher', 'staff'].includes(userRole);
            
            if ((userRole === 'parent' || isStaffOrAdmin) && childrenList.length === 0) {
                try {
                    const { default: api } = await import('../../services/api');
                    const children = await api.getMyChildren();
                    setChildrenList(children);
                    
                    /* Auto-selection removed to allow parents to see Family Dashboard first */
                } catch (error) {
                    console.error("Failed to load children", error);
                }
            }
        };
        loadChildren();
    }, [user, childrenList.length, selectedChildId, setChildrenList, setSelectedChildId]);

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
