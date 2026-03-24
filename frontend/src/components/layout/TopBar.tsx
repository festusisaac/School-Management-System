import { Bell, Menu, Search, Sun, Moon, LogOut, User as UserIcon, Settings as SettingsIcon, ChevronDown } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { useSystem } from '../../context/SystemContext';
import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore';

interface TopBarProps {
    onMenuClick: () => void;
}

export function TopBar({ onMenuClick }: TopBarProps) {
    const { theme, toggleTheme } = useTheme();
    const { settings, getFullUrl } = useSystem();
    const navigate = useNavigate();
    const [isProfileOpen, setIsProfileOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    const { user, logout } = useAuthStore();
    const userName = user ? `${user.firstName} ${user.lastName}` : 'User';
    const userRole = user ? (user.roleObject?.name || user.role).charAt(0).toUpperCase() + (user.roleObject?.name || user.role).slice(1) : 'Staff';
    const initials = user ? `${user.firstName.charAt(0)}${user.lastName.charAt(0)}` : 'U';

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsProfileOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    return (
        <header className="h-16 px-6 bg-white/80 dark:bg-gray-900/80 border-b border-gray-100 dark:border-gray-800 backdrop-blur-xl flex items-center justify-between sticky top-0 z-30 shadow-sm lg:shadow-none transition-colors duration-200 print:hidden">
        <div className="flex items-center gap-3">
                <button
                    onClick={onMenuClick}
                    className="p-2 -ml-1 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 dark:text-gray-400 transition-colors flex-shrink-0"
                >
                    <Menu className="w-5 h-5" />
                </button>

                {/* Mobile Logo — visible only on small screens */}
                <div className="flex items-center lg:hidden">
                    {settings.primaryLogo ? (
                        <img
                            src={getFullUrl(settings.primaryLogo)}
                            className="w-9 h-9 object-contain"
                            alt="Logo"
                        />
                    ) : (
                        <div className="w-9 h-9 bg-primary-600 rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm shadow-primary-500/30">
                            <span className="text-white text-sm font-black">S</span>
                        </div>
                    )}
                </div>

                {/* Desktop School Name */}
                <div className="hidden lg:flex items-center mr-4">
                    <span className="text-[1.35rem] font-black tracking-tight bg-gradient-to-r from-primary-700 to-primary-500 dark:from-primary-300 dark:to-primary-500 bg-clip-text text-transparent drop-shadow-sm truncate max-w-[300px] xl:max-w-[400px]">
                        {settings.schoolName || 'SMS Admin'}
                    </span>
                </div>

                {/* Search Bar */}
                <div className="hidden md:flex items-center gap-2 px-4 py-2 bg-gray-50 dark:bg-gray-700 rounded-lg border border-transparent focus-within:border-primary-100 dark:focus-within:border-gray-600 focus-within:bg-white dark:focus-within:bg-gray-800 focus-within:ring-2 focus-within:ring-primary-100/50 transition-all">
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

                {/* Profile Dropdown */}
                <div className="relative" ref={dropdownRef}>
                    <button
                        onClick={() => setIsProfileOpen(!isProfileOpen)}
                        className="flex items-center gap-3 p-1.5 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-all border border-transparent hover:border-gray-100 dark:hover:border-gray-600"
                    >
                        <div className="w-8 h-8 rounded-full bg-primary-100 dark:bg-primary-900 flex items-center justify-center text-primary-700 dark:text-primary-200 font-bold text-xs ring-2 ring-white dark:ring-gray-700 shadow-sm uppercase">
                            {initials}
                        </div>
                        <div className="text-left hidden md:block">
                            <p className="text-sm font-semibold text-gray-700 dark:text-gray-200 leading-none">{userName}</p>
                            <p className="text-[10px] text-gray-500 dark:text-gray-400 font-medium">{userRole}</p>
                        </div>
                        <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${isProfileOpen ? 'rotate-180' : ''}`} />
                    </button>

                    {/* Dropdown Menu */}
                    {isProfileOpen && (
                        <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-100 dark:border-gray-700 py-2 animate-in fade-in zoom-in duration-200 origin-top-right">
                            <div className="px-4 py-2 border-b border-gray-100 dark:border-gray-700 mb-1">
                                <p className="text-sm font-bold text-gray-900 dark:text-white truncate">{userName}</p>
                                <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{user?.email}</p>
                            </div>

                            <button className="w-full flex items-center gap-3 px-4 py-2 text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                                <UserIcon className="w-4 h-4" />
                                My Profile
                            </button>
                            <button
                                onClick={() => {
                                    setIsProfileOpen(false);
                                    navigate('/settings/general');
                                }}
                                className="w-full flex items-center gap-3 px-4 py-2 text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                            >
                                <SettingsIcon className="w-4 h-4" />
                                Settings
                            </button>

                            <div className="h-px bg-gray-100 dark:border-gray-700 my-1 mx-2"></div>

                            <button
                                onClick={handleLogout}
                                className="w-full flex items-center gap-3 px-4 py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                            >
                                <LogOut className="w-4 h-4" />
                                Logout
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </header>
    );
}
