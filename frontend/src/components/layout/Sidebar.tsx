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
    ChevronRight,
    Video,
    MessageSquare,
    Star
} from 'lucide-react';
import { useState } from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { useSystem } from '../../context/SystemContext';
import { useAuthStore } from '../../stores/authStore';
import { usePermissions } from '../../hooks/usePermissions';
import { getFileUrl } from '../../services/api';

interface SidebarProps {
    isOpen: boolean;
    onClose: () => void;
}

export function Sidebar({ isOpen, onClose }: SidebarProps) {
    const [expandedMenu, setExpandedMenu] = useState<string | null>(null);
    const { settings, getFullUrl } = useSystem();
    const { user, logout } = useAuthStore();
    const navigate = useNavigate();
    const userRole = (user?.role || user?.roleObject?.name || 'student').toLowerCase();
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
        { label: 'My Profile', icon: UserIcon, path: '/students/profile/me' },
        { label: 'Finance', icon: CreditCard, path: '/students/finance' },
        { label: 'Class Timetable', icon: Calendar, path: '/students/timetable' },
        { label: 'Attendance', icon: Clock, path: '/students/attendance' },
        { label: 'Rate Teachers', icon: Star, path: '/students/rate-teachers' },
        { label: 'My Library', icon: BookOpen, path: '/students/library' },
        {
            label: 'Examination',
            icon: BookOpen,
            path: '/examination',
            children: [
                { label: 'Admit Card', path: '/students/examination/admit-card' },
                { label: 'Check Result', path: '/students/examination/results' },
            ]
        },
        { 
            label: 'Online Classes', 
            icon: Video, 
            path: '/students/online-classes'
        },
        {
            label: 'Homework',
            icon: BookOpen,
            path: '/students/homework'
        }
    ];

    const { hasPermission } = usePermissions();

    const staffNavItems = [
        { label: 'Dashboard', icon: LayoutDashboard, path: '/dashboard' },
        {
            label: 'Academics',
            icon: BookOpen,
            path: '/academics',
            children: [
                { label: 'Classes', path: '/academics/classes', permission: 'academics:manage_classes' },
                { label: 'Sections', path: '/academics/sections', permission: 'academics:manage_classes' },
                { label: 'Subject Groups', path: '/academics/subject-groups', permission: 'academics:manage_subjects' },
                { label: 'Subjects', path: '/academics/subjects', permission: 'academics:manage_subjects' },
                { label: 'Assign Class Subjects', path: '/academics/assign-class-subjects', permission: 'academics:assign_teachers' },
                { label: 'Assign Subject Teachers', path: '/academics/assign-subject-teachers', permission: 'academics:assign_teachers' },
                { label: 'Assign Class Teachers', path: '/academics/assign-class-teachers', permission: 'academics:assign_teachers' },
                { label: 'Class Timetable', path: '/academics/class-timetable', permission: 'academics:view_timetable' },
                { label: 'Teachers Timetable', path: '/academics/teachers-timetable', permission: 'academics:view_timetable' },
                { label: 'Promote Students', path: '/academics/promotion', permission: 'academics:promote_students' },
            ]
        },
        { 
            label: 'Online Classes', 
            icon: Video, 
            path: '/online-classes',
            // Dedicated permission for virtual learning
            children: [
                { label: 'Classes Schedule', path: '/online-classes/schedule', permission: 'online_classes:manage' },
                { label: 'Completed Classes', path: '/online-classes/history', permission: 'online_classes:history' },
            ]
        },
        {
            label: 'Homework',
            icon: BookOpen,
            path: '/homework',
            permission: 'homework:view'
        },
        {
            label: 'Human Resource',
            icon: Users,
            path: '/hr',
            children: [
                { label: 'Staff Directory', path: '/hr/staff', permission: 'hr:manage_staff' },
                { label: 'Department', path: '/hr/departments', permission: 'hr:manage_departments' },
                { label: 'Staff Attendance', path: '/hr/attendance', permission: 'hr:manage_attendance' },
                { label: 'Payroll', path: '/hr/payroll', permission: 'hr:manage_payroll' },
                { label: 'Approve Leave Request', path: '/hr/leave/approve', permission: 'hr:manage_leave' },
                // Only show Apply Leave to actual staff members (not Super Admins or Admins)
                ...(userRole !== 'super administrator' && userRole !== 'admin' ? [
                    { label: 'Apply Leave', path: '/hr/leave/apply' }
                ] : []),
                { label: 'Leave Type', path: '/hr/leave-types', permission: 'hr:manage_leave' },
                // Only show Ratings to Super Admin
                ...(userRole === 'super administrator' ? [
                    { label: 'Teachers Rating', path: '/hr/ratings', permission: 'hr:manage_staff' }
                ] : []),
            ]
        },
        {
            label: 'Student Attendance',
            icon: Clock,
            path: '/students/attendance',
            children: [
                { label: 'Mark Attendance', path: '/students/attendance/mark', permission: 'attendance:mark' },
                { label: 'Attendance History', path: '/students/attendance/history', permission: 'attendance:view_history' },
                { label: 'Attendance Reports', path: '/students/attendance/reports', permission: 'attendance:view_reports' },
            ]
        },
        {
            label: 'Student Information',
            icon: GraduationCap,
            path: '/students',
            permission: 'students:view_directory', // Parent now explicitly requires directory view
            children: [
                { label: 'Student Directory', path: '/students/directory', permission: 'students:view_directory' },
                { label: 'Student Admission', path: '/students/admission', permission: 'students:create' },
                { label: 'Online Admission', path: '/students/online-admission', permission: 'students:create' },
                { label: 'Deactivate Student', path: '/students/deactivated', permission: 'students:delete' },
                { label: 'Student Categories', path: '/students/categories', permission: 'students:manage_categories' },
                { label: 'Student House', path: '/students/houses', permission: 'students:manage_categories' },
                { label: 'Deactivation Reason', path: '/students/deactivate-reasons', permission: 'students:manage_categories' },
                // Only show Rate Teachers to Super Admin
                ...(userRole === 'super administrator' ? [
                    { label: 'Rate Teachers', path: '/students/rate-teachers', permission: 'students:view_directory_disabled' }
                ] : []),
            ]
        },
        {
            label: 'Library',
            icon: BookOpen,
            path: '/library',
            children: [
                { label: 'Dashboard', path: '/library/dashboard', permission: 'library:manage_books' },
                { label: 'Books Catalog', path: '/library', permission: 'library:view_books' },
                { label: 'Authors', path: '/library/authors', permission: 'library:view_books' },
                { label: 'Categories', path: '/library/categories', permission: 'library:view_books' },
                { type: 'header', label: 'Circulation' },
                { label: 'Issue Book', path: '/library/issue', permission: 'library:issue_return' },
                { label: 'Return Book', path: '/library/return', permission: 'library:issue_return' },
                { label: 'Overdue Loans', path: '/library/overdues', permission: 'library:view_reports' },
                { type: 'header', label: 'Setup' },
                { label: 'Library Settings', path: '/library/settings', permission: 'settings:general' },
            ]
        },
        {
            label: 'Finance',
            icon: CreditCard,
            path: '/finance',
            children: [
                { label: 'Offline Fees Collection', path: '/finance/record-payment', permission: 'finance:collect_fees' },
                { label: 'Fees History', path: '/finance/payments', permission: 'finance:view_payments' },
                { label: 'Debtors List', path: '/finance/debtors', permission: 'finance:view_reports' },
                { label: 'Fee Structure', path: '/finance/structures', permission: 'finance:manage_fee_structure' },
                { label: 'Discounts', path: '/finance/discounts', permission: 'finance:manage_fee_structure' },
                { label: 'Payment Reminders', path: '/finance/reminders', permission: 'finance:manage_reminders' },
                { label: 'Balance Carry-Forward', path: '/finance/carry-forward', permission: 'finance:manage_fee_structure' },
            ]
        },
        {
            label: 'Communication',
            icon: MessageSquare,
            path: '/communication',
            children: [
                { label: 'Send Message', path: '/communication/broadcast', permission: 'communication:manage' },
                { label: 'Message Templates', path: '/communication/templates', permission: 'communication:manage' },
            ]
        },
        {
            label: 'Examination',
            icon: BookOpen,
            path: '/examination',
            children: [
                // Setup
                { type: 'header', label: 'Exam Setup' },
                { label: 'Exam Groups', path: '/examination/setup/groups', permission: 'exams:manage_setup' },
                { label: 'Assessment Structure', path: '/examination/setup/structure', permission: 'exams:manage_setup' },
                { label: 'Grading System', path: '/examination/setup/grading', permission: 'exams:manage_setup' },
                { label: 'Exam Schedules', path: '/examination/setup/schedules', permission: 'exams:manage_schedule' },
                { label: 'Admit Cards', path: '/examination/setup/admit-cards', permission: 'exams:manage_admit_cards' },

                // Entry
                { type: 'header', label: 'Score Entry', permission: 'exams:enter_marks' },
                { label: 'Scoresheet Entry', path: '/examination/entry/scoresheet', permission: 'exams:enter_marks' },
                { label: 'Skills & Attributes', path: '/examination/entry/skills', permission: 'exams:manage_domains' },
                { label: 'Psychomotor Skills', path: '/examination/entry/psychomotor', permission: 'exams:manage_domains' },

                // Reports
                { type: 'header', label: 'Reports', permission: 'exams:view_reports' },
                { label: 'Class Broadsheet', path: '/examination/reports/class-broadsheet', permission: 'exams:view_reports' },
                { label: 'Subject Broadsheet', path: '/examination/reports/subject-broadsheet', permission: 'exams:view_reports' },
                { label: 'Report Card', path: '/examination/reports/report-card', permission: 'exams:view_reports' },

                // Control
                { type: 'header', label: 'Control', permission: 'exams:process_results' },
                { label: 'Result Management', path: '/examination/control/results', permission: 'exams:process_results' },
                { label: 'Manage Scratch Cards', path: '/examination/control/scratch-cards', permission: 'exams:process_results' },
            ]
        },
        {
            label: 'Settings',
            icon: Settings,
            path: '/settings',
            permission: 'settings:general',
            children: [
                { type: 'header', label: 'Configuration' },
                { label: 'General Settings', path: '/settings/general', permission: 'settings:general' },
                { label: 'School Sections', path: '/academics/school-sections', permission: 'settings:academic_setup' },
                { label: 'Academic Sessions', path: '/settings/sessions', permission: 'settings:academic_setup' },
                { label: 'Academic Terms', path: '/settings/terms', permission: 'settings:academic_setup' },
                { label: 'Roles & Permissions', path: '/settings/roles', permission: 'settings:roles_permissions' },
                { label: 'User Management', path: '/settings/users', permission: 'settings:manage_users' },
            ]
        },
    ];

    const filterNavItems = (items: any[]): any[] => {
        return items
            .filter(item => {
                if (item.type === 'header' && !item.permission) return true; // Keep headers by default unless specifically permissioned
                return hasPermission(item.permission);
            })
            .map(item => {
                if (item.children) {
                    const filteredChildren: any[] = filterNavItems(item.children);
                    return { ...item, children: filteredChildren };
                }
                return item;
            })
            .filter(item => {
                // Remove parents with no non-header children left (except standalone items like Dashboard)
                if (item.children) {
                    return item.children.some((child: any) => child.type !== 'header');
                }
                return true; 
            });
    };

    const finalStaffNavItems = filterNavItems(staffNavItems);
    const navItems = isStudentOrParent ? studentNavItems : finalStaffNavItems;

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
                        {user?.photo ? (
                            <img
                                src={getFileUrl(user.photo)}
                                alt={userName}
                                className="w-12 h-12 rounded-2xl object-cover shadow-lg shadow-primary-500/30 flex-shrink-0"
                            />
                        ) : (
                            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center text-white font-black text-lg shadow-lg shadow-primary-500/30 flex-shrink-0 uppercase">
                                {initials}
                            </div>
                        )}
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
                    {/* Academic Context Indicator */}
                    {(settings.activeSessionName || settings.activeTermName) && (
                        <div className="mb-4 mx-1 p-3 bg-primary-50/40 dark:bg-primary-900/10 border border-primary-100/50 dark:border-primary-800/50 rounded-xl animate-in fade-in slide-in-from-top-4 duration-500">
                            <div className="flex items-center gap-2.5">
                                <div className="p-1.5 bg-primary-100 dark:bg-primary-800 rounded-lg">
                                    <Calendar className="w-3.5 h-3.5 text-primary-600 dark:text-primary-400" />
                                </div>
                                <div className="min-w-0">
                                    <p className="text-[10px] font-black text-primary-600/60 dark:text-primary-400/60 uppercase tracking-widest leading-none mb-1">
                                        Active Session
                                    </p>
                                    <p className="text-[11px] font-bold text-primary-700 dark:text-primary-300 truncate">
                                        {settings.activeSessionName || 'N/A'}
                                    </p>
                                    {settings.activeTermName && (
                                        <p className="text-[10px] font-semibold text-gray-500 dark:text-gray-400 mt-0.5 truncate uppercase">
                                            {settings.activeTermName}
                                        </p>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

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
