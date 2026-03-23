import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { TopBar } from './TopBar';
import { useSessionTimeout } from '../../hooks/useSessionTimeout';

export function MainLayout() {
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);
    const { WarningModal } = useSessionTimeout();

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex">
            {/* Session Timeout Warning */}
            {WarningModal}

            {/* Sidebar */}
            <Sidebar
                isOpen={isSidebarOpen}
                onClose={() => setIsSidebarOpen(false)}
            />

            {/* Main Content Area */}
            <div className="flex-1 flex flex-col min-h-screen transition-all duration-300 overflow-hidden">
                <TopBar onMenuClick={() => setIsSidebarOpen(!isSidebarOpen)} />

                <main className="flex-1 p-4 md:p-8 overflow-y-auto">
                    <div className="max-w-7xl mx-auto w-full">
                        <Outlet />
                    </div>
                </main>
            </div>
        </div>
    );
}

