import { Bell, Menu, Search, Sun, Moon } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';

interface TopBarProps {
    onMenuClick: () => void;
}

export function TopBar({ onMenuClick }: TopBarProps) {
    const { theme, toggleTheme } = useTheme();

    return (
        <header className="h-16 px-6 bg-white/80 dark:bg-gray-900/80 border-b border-gray-100 dark:border-gray-800 backdrop-blur-xl flex items-center justify-between sticky top-0 z-30 shadow-sm lg:shadow-none transition-colors duration-200 print:hidden">
            <div className="flex items-center gap-4">
                <button
                    onClick={onMenuClick}
                    className="p-2 -ml-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 dark:text-gray-400 transition-colors"
                >
                    <Menu className="w-6 h-6" />
                </button>

                {/* Search Bar (Optional visual element) */}
                <div className="hidden md:flex items-center gap-2 px-4 py-2 bg-gray-50 dark:bg-gray-700 rounded-lg border border-transparent focus-within:border-blue-100 dark:focus-within:border-gray-600 focus-within:bg-white dark:focus-within:bg-gray-800 focus-within:ring-2 focus-within:ring-blue-100/50 transition-all">
                    <Search className="w-4 h-4 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Search anything..."
                        className="bg-transparent border-none outline-none text-sm placeholder:text-gray-400 text-gray-700 dark:text-gray-200 w-64"
                    />
                </div>
            </div>

            <div className="flex items-center gap-3">
                {/* Theme Toggle */}
                <button
                    onClick={toggleTheme}
                    className="p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-400 hover:text-gray-600 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
                    title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
                >
                    {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
                </button>

                {/* Notifications */}
                <button className="relative p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-400 hover:text-gray-600 dark:text-gray-400 dark:hover:text-gray-200 transition-colors">
                    <Bell className="w-5 h-5" />
                    <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full ring-2 ring-white dark:ring-gray-800"></span>
                </button>

                {/* Divider */}
                <div className="h-6 w-px bg-gray-200 dark:bg-gray-700 mx-1"></div>

                {/* Profile Dropdown Trigger */}
                <button className="flex items-center gap-3 p-1.5 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-all border border-transparent hover:border-gray-100 dark:hover:border-gray-600">
                    <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center text-blue-700 dark:text-blue-200 font-bold text-xs ring-2 ring-white dark:ring-gray-700 shadow-sm">
                        JD
                    </div>
                    <div className="text-left hidden md:block">
                        <p className="text-sm font-semibold text-gray-700 dark:text-gray-200 leading-none">John Doe</p>
                        <p className="text-[10px] text-gray-500 dark:text-gray-400 font-medium">Administrator</p>
                    </div>
                </button>
            </div>
        </header>
    );
}
