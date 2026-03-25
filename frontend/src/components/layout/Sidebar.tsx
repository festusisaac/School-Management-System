import { NavLink, useNavigate } from 'react-router-dom';
import {
    LayoutDashboard,
    Users,
    GraduationCap,
    CreditCard,
    Settings,
    X,
    School,
    BookOpen,
    ChevronDown,
    User as UserIcon,
    Calendar,
    Clock,
    LogOut,
    ChevronRight
} from 'lucide-react';
import { useState } from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { useSystem } from '../../context/SystemContext';
import { useAuthStore } from '../../stores/authStore';

interface SidebarProps {
    isOpen: boolean;
    onClose: () => void;
}

export function Sidebar({ isOpen, onClose }: SidebarProps) {
    const [expandedMenu, setExpandedMenu] = useState<string | null>(null);
    const { settings, getFullUrl } = useSystem();
    const { user, logout } = useAuthStore();
    const navigate = useNavigate();
    const userRole = (user?.roleObject?.name || user?.role || 'student').toLowerCase();
    const isStudentOrParent = userRole === 'student' || userRole === 'parent';
    const userName = user ? `${user.firstName} ${user.lastName}` : 'User';
    const userRoleLabel = user ? (user.roleObject?.name || user.role || 'Student') : 'Student';
    const initials = user ? `${user.firstName?.charAt(0)}${user.lastName?.charAt(0)}` : 'U';

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const toggleSubmenu = (path: string) => {
        setExpandedMenu(expandedMenu === path ? null : path);
    };

    const studentNavItems = [
        { label: 'Dashboard', icon: LayoutDashboard, path: '/dashboard' },
        { label: 'My Profile', icon: UserIcon, path: `/students/profile/${user?.id || 'me'}` },
        { label: 'Finance', icon: CreditCard, path: '/students/finance' },
        { label: 'Class Timetable', icon: Calendar, path: '/students/timetable' },
        { label: 'Attendance', icon: Clock, path: '/students/attendance' },
        {
            label: 'Examination',
            icon: BookOpen,
            path: '/examination',
            children: [
                { label: 'Admit Card', path: '/students/examination/admit-card' },
                { label: 'Check Result', path: '/students/examination/results' },
            ]
        }
    ];

    const adminNavItems = [
        { label: 'Dashboard', icon: LayoutDashboard, path: '/dashboard' },
        {
            label: 'Academics',
            icon: BookOpen,
            path: '/academics',
            children: [
                { label: 'School Sections', path: '/academics/school-sections' },
                { label: 'Classes', path: '/academics/classes' },
                { label: 'Sections', path: '/academics/sections' },
                { label: 'Subject Groups', path: '/academics/subject-groups' },
                { label: 'Subjects', path: '/academics/subjects' },
                { label: 'Assign Class Subjects', path: '/academics/assign-class-subjects' },
                { label: 'Assign Subject Teachers', path: '/academics/assign-subject-teachers' },
                { label: 'Assign Class Teachers', path: '/academics/assign-class-teachers' },
                { label: 'Class Timetable', path: '/academics/class-timetable' },
                { label: 'Teachers Timetable', path: '/academics/teachers-timetable' },
                { label: 'Promote Students', path: '/academics/promotion' },
            ]
        },
        {
            label: 'Human Resource',
            icon: Users,
            path: '/hr',
            children: [
                { label: 'Staff Directory', path: '/hr/staff' },
                { label: 'Department', path: '/hr/departments' },
                { label: 'Staff Attendance', path: '/hr/attendance' },
                { label: 'Payroll', path: '/hr/payroll' },
                { label: 'Approve Leave Request', path: '/hr/leave/approve' },
                { label: 'Apply Leave', path: '/hr/leave/apply' },
                { label: 'Leave Type', path: '/hr/leave-types' },
                { label: 'Teachers Rating', path: '/hr/ratings' },
            ]
        },
        {
            label: 'Student Information',
            icon: GraduationCap,
            path: '/students',
            children: [
                { label: 'Student Directory', path: '/students/directory' },
                { label: 'Student Admission', path: '/students/admission' },
                { label: 'Online Admission', path: '/students/online-admission' },
                { label: 'Deactivate Student', path: '/students/deactivated' },
                { label: 'Student Categories', path: '/students/categories' },
                { label: 'Student House', path: '/students/houses' },
                { label: 'Deactivation Reason', path: '/students/deactivate-reasons' },
                { label: 'Student Profile', path: '/students/profile/:id' },
                { label: 'Rate Teachers', path: '/students/rate-teachers' },
            ]
        },
        {
            label: 'Library',
            icon: BookOpen,
            path: '/library',
            children: [
                { label: 'Books', path: '/library' },
                { label: 'Issue Book', path: '/library/issue' },
                { label: 'Return Book', path: '/library/return' },
                { label: 'Overdues', path: '/library/overdues' },
            ]
        },
        {
            label: 'Finance',
            icon: CreditCard,
            path: '/finance',
            children: [
                { label: 'Offline Fees Collection', path: '/finance/record-payment' },
                { label: 'Fees History', path: '/finance/payments' },
                { label: 'Debtors List', path: '/finance/debtors' },
                { label: 'Fee Structure', path: '/finance/structures' },
                { label: 'Discounts', path: '/finance/discounts' },
                { label: 'Payment Reminders', path: '/finance/reminders' },
                { label: 'Balance Carry-Forward', path: '/finance/carry-forward' },
            ]
        },
        {
            label: 'Examination',
            icon: BookOpen,
            path: '/examination',
            children: [
                // Setup
                { type: 'header', label: 'Exam Setup' },
                { label: 'Exam Groups', path: '/examination/setup/groups' },
                { label: 'Assessment Structure', path: '/examination/setup/structure' },
                { label: 'Grading System', path: '/examination/setup/grading' },
                { label: 'Exam Schedules', path: '/examination/setup/schedules' },
                { label: 'Admit Cards', path: '/examination/setup/admit-cards' },

                // Entry
                { type: 'header', label: 'Score Entry' },
                { label: 'Scoresheet Entry', path: '/examination/entry/scoresheet' },
                { label: 'Skills & Attributes', path: '/examination/entry/skills' },
                { label: 'Psychomotor Skills', path: '/examination/entry/psychomotor' },

                // Reports
                { type: 'header', label: 'Reports' },
                { label: 'Class Broadsheet', path: '/examination/reports/class-broadsheet' },
                { label: 'Subject Broadsheet', path: '/examination/reports/subject-broadsheet' },
                { label: 'Report Card', path: '/examination/reports/report-card' },

                // Control
                { type: 'header', label: 'Control' },
                { label: 'Result Management', path: '/examination/control/results' },
                { label: 'Manage Scratch Cards', path: '/examination/control/scratch-cards' },
            ]
        },
        {
            label: 'Settings',
            icon: Settings,
            path: '/settings',
            children: [
                { type: 'header', label: 'Configuration' },
                { label: 'General Settings', path: '/settings/general' },
                { label: 'Academic Sessions', path: '/settings/sessions' },
                { label: 'Academic Terms', path: '/settings/terms' },
                { label: 'Roles & Permissions', path: '/settings/roles' },
                { label: 'User Management', path: '/settings/users' },
            ]
        },
    ];

    const navItems = isStudentOrParent ? studentNavItems : adminNavItems;

    const handleNavClick = () => {
        // Close sidebar on mobile after navigation
        if (window.innerWidth < 1024) {
            onClose();
        }
    };

    return (
        <>
            {/* Backdrop — Mobile Only */}
            {isOpen && (
                <div
                    className="fixed inset-0 bg-gray-900/60 z-40 lg:hidden backdrop-blur-sm transition-opacity animate-in fade-in duration-200 print:hidden"
                    onClick={onClose}
                />
            )}

            {/* ─────────────────── MOBILE SIDEBAR PANEL ─────────────────── */}
            {/* Slides in from the left on mobile; always visible on desktop */}
            <div className={twMerge(
                "fixed inset-y-0 left-0 z-50 flex flex-col print:hidden",
                // Desktop: slim pinned sidebar
                "lg:relative lg:translate-x-0 lg:z-10",
                // Mobile sizing & transition
                "w-[280px] bg-white/95 dark:bg-gray-900/95 backdrop-blur-2xl border-r border-gray-100 dark:border-gray-800 shadow-2xl",
                "transition-transform duration-300 ease-in-out",
                isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0",
                // Desktop width collapse
                "lg:w-[240px] lg:shadow-none"
            )}>

                {/* ── Mobile Header: User Identity (no logo — it's in TopBar) ── */}
                <div className="lg:hidden p-5 border-b border-gray-100 dark:border-gray-800 relative">
                    <button
                        onClick={onClose}
                        className="absolute top-4 right-4 p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>

                    {/* User Avatar */}
                    <div className="flex items-center gap-3 pr-10">
                        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center text-white font-black text-lg shadow-lg shadow-primary-500/30 flex-shrink-0 uppercase">
                            {initials}
                        </div>
                        <div className="min-w-0">
                            <p className="font-bold text-gray-900 dark:text-white truncate leading-tight">{userName}</p>
                            <p className="text-xs font-semibold text-primary-600 dark:text-primary-400 capitalize mt-0.5">{userRoleLabel}</p>
                        </div>
                    </div>
                </div>

                {/* ── Desktop Header: Logo ── */}
                <div className="hidden lg:flex h-16 items-center px-5 border-b border-gray-50 dark:border-gray-800/50 overflow-hidden">
                    {settings.primaryLogo ? (
                        <img
                            src={getFullUrl(settings.primaryLogo)}
                            className="w-10 h-10 object-contain"
                            alt="Logo"
                        />
                    ) : (
                        <div className="p-2 bg-primary-600 rounded-xl shadow-sm flex items-center justify-center">
                            <School className="w-5 h-5 text-white" />
                        </div>
                    )}
                </div>

                {/* ── Navigation ── */}
                <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto overflow-x-hidden">
                    {navItems.map((item) => (
                        <div key={item.path}>
                            {item.children ? (
                                /* Dropdown Menu */
                                <div>
                                    <button
                                        onClick={() => toggleSubmenu(item.path)}
                                        className={clsx(
                                            "w-full flex items-center gap-3 px-3 py-2.5 text-sm font-semibold rounded-xl transition-all duration-200 group",
                                            expandedMenu === item.path
                                                ? "bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-400"
                                                : "text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800/60 hover:text-gray-900 dark:hover:text-gray-200"
                                        )}
                                    >
                                        <item.icon className={clsx("w-5 h-5 flex-shrink-0 transition-colors", expandedMenu === item.path ? "text-primary-600" : "text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-300")} />
                                        <span className="flex-1 text-left">{item.label}</span>
                                        <ChevronDown className={clsx("w-4 h-4 transition-transform duration-200 opacity-50", expandedMenu === item.path ? "rotate-180" : "")} />
                                    </button>

                                    {/* Submenu Items */}
                                    <div className={clsx(
                                        "overflow-hidden transition-all duration-300 ease-in-out",
                                        expandedMenu === item.path ? "max-h-[1000px] opacity-100" : "max-h-0 opacity-0"
                                    )}>
                                        <div className="pl-4 pt-1 pb-2 space-y-0.5">
                                            {item.children.map((child: any, index: number) => (
                                                child.type === 'header' ? (
                                                    <div key={`header-${index}`} className="px-3 pt-3 pb-1 text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest">
                                                        {child.label}
                                                    </div>
                                                ) : (
                                                    <NavLink
                                                        key={child.path}
                                                        to={child.path}
                                                        onClick={handleNavClick}
                                                        className={({ isActive }) => clsx(
                                                            "flex items-center gap-2.5 px-3 py-2 text-sm rounded-lg transition-colors",
                                                            isActive
                                                                ? "text-primary-600 dark:text-primary-400 bg-primary-50 dark:bg-primary-900/20 font-semibold"
                                                                : "text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800/60 font-medium"
                                                        )}
                                                    >
                                                        <span className={clsx("w-1.5 h-1.5 rounded-full flex-shrink-0", window.location.pathname === child.path ? "bg-primary-600" : "bg-gray-300 dark:bg-gray-600")} />
                                                        {child.label}
                                                    </NavLink>
                                                )
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                /* Regular Nav Link */
                                <NavLink
                                    to={item.path}
                                    onClick={handleNavClick}
                                    className={({ isActive }) => clsx(
                                        "flex items-center gap-3 px-3 py-2.5 text-sm font-semibold rounded-xl transition-all duration-200 group",
                                        isActive
                                            ? "bg-primary-600 text-white shadow-md shadow-primary-500/30"
                                            : "text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800/60 hover:text-gray-900 dark:hover:text-gray-200"
                                    )}
                                >
                                    <item.icon className="w-5 h-5 flex-shrink-0" />
                                    <span>{item.label}</span>
                                </NavLink>
                            )}
                        </div>
                    ))}
                </nav>

                {/* ── Mobile Footer: Logout ── */}
                <div className="lg:hidden p-4 border-t border-gray-100 dark:border-gray-800">
                    <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors group"
                    >
                        <LogOut className="w-5 h-5" />
                        <span>Sign Out</span>
                        <ChevronRight className="w-4 h-4 ml-auto opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
                    </button>
                </div>
            </div>
        </>
    );
}
