import { Bell, Menu, Search, Sun, Moon, LogOut, User as UserIcon, Settings as SettingsIcon, Calendar } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { useSystem } from '../../context/SystemContext';
import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore';
import { api, getFileUrl, NoticeAudience, type Notice } from '../../services/api';

interface TopBarProps {
    onMenuClick: () => void;
}

export function TopBar({ onMenuClick }: TopBarProps) {
    const { theme, toggleTheme } = useTheme();
    const { settings, getFullUrl, activeSectionId, setActiveSectionId, availableSections } = useSystem();
    const navigate = useNavigate();
    const [isProfileOpen, setIsProfileOpen] = useState(false);
    const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
    const [notifications, setNotifications] = useState<Notice[]>([]);
    const [loadingNotifications, setLoadingNotifications] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const notificationsRef = useRef<HTMLDivElement>(null);

    const { user, logout, childrenList, selectedChildId, setSelectedChildId } = useAuthStore();
    
    // UI Cleanup for names (strips legacy system suffixes like 'Member')
    const cleanName = (name: string) => {
        if (!name) return '';
        return name.replace(/\s*Member\s*$/gi, '').replace(/\s*Staff\s*$/gi, '').trim();
    };

    const userName = user ? `${cleanName(user.firstName)} ${cleanName(user.lastName)}`.trim() || 'User' : 'User';
    // Normalize the role label — the DB may store 'member', 'parent', etc.
    const rawRoleStr = (user?.roleObject?.name || user?.role || '').toLowerCase().trim();
    const userRole = rawRoleStr === 'parent' || rawRoleStr === 'member'
        ? 'Parent'
        : rawRoleStr === 'student'
            ? 'Student'
            : (user?.roleObject?.name || user?.role || 'Staff');
    const initials = user ? `${user.firstName?.charAt(0) || ''}${user.lastName?.charAt(0) || ''}` : 'U';

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const getNoticeStorageKey = (noticeId: string) => `notice_seen_${user?.id}_${noticeId}`;
    const unreadNotifications = notifications.filter((notice) => !localStorage.getItem(getNoticeStorageKey(notice.id)));

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsProfileOpen(false);
            }
            if (notificationsRef.current && !notificationsRef.current.contains(event.target as Node)) {
                setIsNotificationsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const rawRole = (user?.roleObject?.name || user?.role || '').toLowerCase().trim();
    const isSuperAdmin = rawRole === 'super administrator' || rawRole === 'super admin';
    const isScopedFinanceUser = rawRole === 'accountant' || rawRole === 'bursar';
    const canShowSectionSwitcher = isSuperAdmin || isScopedFinanceUser;
    const userPermissions = [
        ...(user?.permissions || []),
        ...(user?.roleObject?.permissions?.map((permission: any) => permission.slug) || []),
    ];
    const canViewNotices =
        isSuperAdmin ||
        userPermissions.includes('communication:view_notices') ||
        userPermissions.includes('communication:manage_notices');

    useEffect(() => {
        if (!user?.id || !canViewNotices) {
            setNotifications([]);
            return;
        }

        let cancelled = false;
        const role = (user?.role || user?.roleObject?.name || '').toLowerCase();
        const audience = role === 'student' || role === 'parent'
            ? NoticeAudience.STUDENTS
            : NoticeAudience.STAFF;

        const loadNotifications = async () => {
            try {
                setLoadingNotifications(true);
                const latestNotices = await api.getNotices({
                    audience,
                    schoolSectionId: activeSectionId || undefined,
                });

                if (!cancelled) {
                    setNotifications(Array.isArray(latestNotices) ? latestNotices.slice(0, 8) : []);
                }
            } catch {
                if (!cancelled) {
                    setNotifications([]);
                }
            } finally {
                if (!cancelled) {
                    setLoadingNotifications(false);
                }
            }
        };

        loadNotifications();
        const interval = setInterval(loadNotifications, 60000);

        return () => {
            cancelled = true;
            clearInterval(interval);
        };
    }, [activeSectionId, canViewNotices, user]);

    const handleOpenNotifications = () => {
        const nextOpen = !isNotificationsOpen;
        setIsNotificationsOpen(nextOpen);

        if (nextOpen) {
            unreadNotifications.forEach((notice) => {
                localStorage.setItem(getNoticeStorageKey(notice.id), new Date().toISOString());
            });
        }
    };

    const openNoticeboard = () => {
        setIsNotificationsOpen(false);
        navigate('/communication/noticeboard');
    };

    return (
        <header className="h-16 px-6 bg-white/80 dark:bg-gray-900/80 border-b border-gray-100 dark:border-gray-800 backdrop-blur-xl flex items-center justify-between sticky top-0 z-40 shadow-sm lg:shadow-none transition-colors duration-200 print:hidden">
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
                {/* Section Context Switcher */}
                {canShowSectionSwitcher && (
                    <div className="hidden sm:flex items-center px-2 py-1 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg">
                        <select 
                            value={activeSectionId}
                            onChange={(e) => setActiveSectionId(e.target.value)}
                            className="bg-transparent border-none text-xs font-bold text-primary-700 dark:text-primary-400 focus:ring-0 cursor-pointer outline-none pl-1 pr-5 hover:text-primary-800 transition-colors transition-all"
                        >
                            {isSuperAdmin && <option value="">All Sections</option>}
                            {availableSections.map((sec) => (
                                <option key={sec.id} value={sec.id}>{sec.name}</option>
                            ))}
                        </select>
                    </div>
                )}

                {/* Parent/Staff-Parent Child Switcher */}
                {childrenList && childrenList.length > 0 && (
                    <div className="hidden sm:flex items-center px-3 py-1.5 bg-primary-50 dark:bg-primary-900/30 border border-primary-100 dark:border-primary-800 rounded-lg mr-2 transition-all">
                        <UserIcon className="w-4 h-4 text-primary-600 dark:text-primary-400 mr-2" />
                        <span className="text-xs text-primary-700 dark:text-primary-300 font-medium mr-2 whitespace-nowrap">Viewing:</span>
                        <select 
                            value={selectedChildId || ''}
                            onChange={(e) => setSelectedChildId(e.target.value)}
                            className="bg-transparent border-none text-sm font-bold text-primary-800 dark:text-primary-200 focus:ring-0 cursor-pointer outline-none pl-0 pr-6 hover:text-primary-900 transition-colors w-full max-w-[150px] truncate"
                        >
                            {/* If staff/admin, allow switching back to their own portal */}
                            {['super administrator', 'admin', 'teacher', 'staff'].includes(rawRole) && (
                                <option value="">My Portal</option>
                            )}
                            {childrenList.map((child: any) => (
                                <option key={child.id} value={child.id}>
                                    {cleanName(child.firstName)} {cleanName(child.lastName)}'s Portal
                                </option>
                            ))}
                        </select>
                    </div>
                )}
                
                {/* Theme Toggle */}
                <button
                    onClick={toggleTheme}
                    className="p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-400 hover:text-gray-600 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
                    title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
                >
                    {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
                </button>

                {/* Notifications */}
                {canViewNotices && (
                    <div className="relative" ref={notificationsRef}>
                        <button
                            onClick={handleOpenNotifications}
                            className="relative p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-400 hover:text-gray-600 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
                            title="Notifications"
                        >
                            <Bell className="w-5 h-5" />
                            {unreadNotifications.length > 0 && (
                                <>
                                    <span className="absolute top-1.5 right-1.5 min-w-[1.1rem] h-[1.1rem] px-1 bg-red-500 text-white rounded-full ring-2 ring-white dark:ring-gray-800 text-[10px] font-bold flex items-center justify-center leading-none">
                                        {Math.min(unreadNotifications.length, 9)}
                                    </span>
                                    <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full ring-2 ring-white dark:ring-gray-800 sm:hidden"></span>
                                </>
                            )}
                        </button>

                        {isNotificationsOpen && (
                            <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-100 dark:border-gray-700 overflow-hidden animate-in fade-in zoom-in duration-200 origin-top-right z-[100]">
                                <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between">
                                    <div>
                                        <p className="text-sm font-bold text-gray-900 dark:text-white">Notifications</p>
                                        <p className="text-xs text-gray-500 dark:text-gray-400">
                                            {unreadNotifications.length > 0 ? `${unreadNotifications.length} unread notice${unreadNotifications.length > 1 ? 's' : ''}` : 'All caught up'}
                                        </p>
                                    </div>
                                    <button
                                        onClick={openNoticeboard}
                                        className="text-xs font-bold text-primary-600 hover:text-primary-700"
                                    >
                                        Open Noticeboard
                                    </button>
                                </div>

                                <div className="max-h-96 overflow-y-auto">
                                    {loadingNotifications ? (
                                        <div className="px-4 py-6 text-sm text-gray-500 dark:text-gray-400">Loading notices...</div>
                                    ) : notifications.length === 0 ? (
                                        <div className="px-4 py-6 text-sm text-gray-500 dark:text-gray-400">No notices available.</div>
                                    ) : (
                                        notifications.map((notice) => {
                                            const isUnread = unreadNotifications.some((item) => item.id === notice.id);
                                            return (
                                                <button
                                                    key={notice.id}
                                                    onClick={openNoticeboard}
                                                    className="w-full text-left px-4 py-3 border-b border-gray-100 dark:border-gray-700 last:border-b-0 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                                                >
                                                    <div className="flex items-start gap-3">
                                                        <div className="relative mt-0.5">
                                                            <Bell className="w-4 h-4 text-primary-500" />
                                                            {isUnread && <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full"></span>}
                                                        </div>
                                                        <div className="min-w-0 flex-1">
                                                            <div className="flex items-center justify-between gap-2">
                                                                <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">{notice.title}</p>
                                                                <span className="text-[10px] text-gray-400 whitespace-nowrap">
                                                                    {new Date(notice.createdAt).toLocaleDateString()}
                                                                </span>
                                                            </div>
                                                            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400 line-clamp-2">
                                                                {notice.content}
                                                            </p>
                                                        </div>
                                                    </div>
                                                </button>
                                            );
                                        })
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* Divider */}
                <div className="h-6 w-px bg-gray-200 dark:bg-gray-700 mx-1"></div>

                {/* Profile Dropdown */}
                <div className="relative" ref={dropdownRef}>
                    <button
                        onClick={() => setIsProfileOpen(!isProfileOpen)}
                        className="flex items-center p-0.5 rounded-full hover:ring-4 hover:ring-primary-50 dark:hover:ring-primary-900/20 transition-all duration-300 active:scale-95"
                    >
                        {user?.photo ? (
                            <img
                                src={getFileUrl(user.photo)}
                                alt={userName}
                                className="w-9 h-9 rounded-full object-cover ring-2 ring-primary-500/20 dark:ring-primary-400/20 shadow-md"
                            />
                        ) : (
                            <div className="w-9 h-9 rounded-full bg-primary-100 dark:bg-primary-900 flex items-center justify-center text-primary-700 dark:text-primary-200 font-bold text-sm ring-2 ring-primary-500/20 dark:ring-primary-400/20 shadow-md uppercase">
                                {initials}
                            </div>
                        )}
                    </button>

                    {/* Dropdown Menu */}
                    {isProfileOpen && (
                        <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-100 dark:border-gray-700 py-2 animate-in fade-in zoom-in duration-200 origin-top-right z-[100]">
                            <div className="px-4 py-2 border-b border-gray-100 dark:border-gray-700 mb-1">
                                <p className="text-sm font-bold text-gray-900 dark:text-white truncate">{userName}</p>
                                <div className="flex items-center gap-2 mt-1">
                                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-primary-50 text-primary-700 dark:bg-primary-900/30 dark:text-primary-300 border border-primary-100 dark:border-primary-800">
                                        {userRole}
                                    </span>
                                </div>
                                <p className="text-xs text-gray-500 dark:text-gray-400 truncate mt-1">{user?.email}</p>
                            </div>

                            <button 
                                onClick={() => {
                                    setIsProfileOpen(false);
                                    const role = (user?.role || user?.roleObject?.name || '').toLowerCase();
                                    if (role === 'student') {
                                        navigate('/students/profile/me');
                                    } else if (role === 'parent' || role === 'member') {
                                        navigate('/parent/profile');
                                    } else if (role === 'super administrator' || role === 'administrator' || role === 'admin') {
                                        navigate('/settings/profile');
                                    } else {
                                        navigate('/hr/staff/profile');
                                    }
                                }}
                                className="w-full flex items-center gap-3 px-4 py-2 text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                            >
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
