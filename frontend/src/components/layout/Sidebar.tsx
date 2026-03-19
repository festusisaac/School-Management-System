import { NavLink } from 'react-router-dom';
import {
    LayoutDashboard,
    Users,
    GraduationCap,
    CreditCard,
    Settings,
    X,
    School,
    BookOpen,
    ChevronDown
} from 'lucide-react';
import { useState } from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { useSystem } from '../../context/SystemContext';

interface SidebarProps {
    isOpen: boolean;
    onClose: () => void;
}

export function Sidebar({ isOpen, onClose }: SidebarProps) {
    const [expandedMenu, setExpandedMenu] = useState<string | null>(null);
    const { settings, getFullUrl } = useSystem();

    const toggleSubmenu = (path: string) => {
        if (!isOpen) {
            // If collapsed, opening a submenu should probably expand the sidebar first or logic changes
            // For now, let's keep it simple: expansion logic inside
        }
        setExpandedMenu(expandedMenu === path ? null : path);
    };

    const navItems = [
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
            icon: BookOpen, // Or FileText if imported
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

                // Processing
                { type: 'header', label: 'Processing' },
                { label: 'Broadsheet', path: '/examination/processing/broadsheet' },
                { label: 'Result Sheet', path: '/examination/processing/result-sheet' },

                // Control
                { type: 'header', label: 'Control' },
                { label: 'Result Management', path: '/examination/control/results' },
                { label: 'Approval', path: '/examination/control/approval' },
                { label: 'Publish', path: '/examination/control/publish' },
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

    return (
        <>
            {/* Mobile Overlay */}
            {isOpen && (
                <div
                    className="fixed inset-0 bg-gray-900/50 z-40 lg:hidden backdrop-blur-sm transition-opacity print:hidden"
                    onClick={onClose}
                />
            )}

            {/* Sidebar Container */}
            <div className={twMerge(
                "fixed inset-y-0 left-0 z-50 bg-white/80 dark:bg-gray-900/80 border-r border-gray-100 dark:border-gray-800 backdrop-blur-xl transition-all duration-300 ease-in-out flex flex-col print:hidden",
                // On Desktop: integrate into flex flow properly
                "lg:relative lg:translate-x-0 lg:shadow-none lg:z-10",
                // Width Logic
                isOpen ? "translate-x-0 w-64 shadow-2xl" : "-translate-x-full lg:w-20 lg:translate-x-0"
            )}>
                {/* Logo Section */}
                <div className="flex h-16 items-center px-6 border-b border-gray-50 dark:border-gray-800/50 overflow-hidden relative justify-center">
                    <div className="flex items-center justify-center w-full">
                        {settings.primaryLogo ? (
                            <img
                                src={getFullUrl(settings.primaryLogo)}
                                className="w-14 h-14 object-contain"
                                alt="Logo"
                            />
                        ) : (
                            <div className="p-2.5 bg-primary-600 rounded-xl shadow-sm flex items-center justify-center">
                                <School className="w-6 h-6 text-white" />
                            </div>
                        )}
                    </div>
                    <button
                        onClick={onClose}
                        className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 dark:text-gray-400 absolute right-4 lg:hidden transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Navigation Links */}
                <nav className="p-4 space-y-1 flex-1 overflow-y-auto overflow-x-hidden">
                    {navItems.map((item) => (
                        <div key={item.path}>
                            {item.children ? (
                                /* Dropdown Menu */
                                <div className="space-y-1">
                                    <button
                                        onClick={() => toggleSubmenu(item.path)}
                                        className={clsx(
                                            "w-full flex items-center gap-3 px-4 py-2.5 text-sm font-medium rounded-xl transition-all duration-200 group overflow-hidden whitespace-nowrap",
                                            expandedMenu === item.path
                                                ? "bg-gray-50 dark:bg-gray-700/50 text-gray-900 dark:text-white"
                                                : "text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700/50 hover:text-gray-900 dark:hover:text-gray-200"
                                        )}
                                    >
                                        <item.icon className="w-5 h-5 text-gray-400 dark:text-gray-500 group-hover:text-gray-600 dark:group-hover:text-gray-300 transition-colors flex-shrink-0" />
                                        <span className={twMerge(
                                            "flex-1 text-left transition-opacity duration-300",
                                            isOpen ? "opacity-100" : "opacity-0 lg:hidden"
                                        )}>
                                            {item.label}
                                        </span>
                                        <ChevronDown className={twMerge(
                                            "w-4 h-4 transition-transform duration-200",
                                            expandedMenu === item.path ? "rotate-180" : "",
                                            isOpen ? "opacity-100" : "opacity-0 invisible"
                                        )} />
                                    </button>

                                    {/* Submenu Items */}
                                    <div className={clsx(
                                        "overflow-hidden transition-all duration-300 ease-in-out",
                                        (expandedMenu === item.path && isOpen) ? "max-h-[1000px] opacity-100 mb-2" : "max-h-0 opacity-0"
                                    )}>
                                        <div className="pl-11 space-y-1 py-1">
                                            {item.children.map((child: any, index: number) => (
                                                child.type === 'header' ? (
                                                    <div key={`header-${index}`} className="px-4 py-2 text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest transition-opacity duration-300">
                                                        {child.label}
                                                    </div>
                                                ) : (
                                                    <NavLink
                                                        key={child.path}
                                                        to={child.path}
                                                        className={({ isActive }) => clsx(
                                                            "group flex items-center gap-3 px-4 py-2 text-sm font-medium rounded-lg transition-colors overflow-hidden whitespace-nowrap",
                                                            isActive
                                                                ? "text-primary-600 dark:text-primary-400"
                                                                : "text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200"
                                                        )}
                                                    >
                                                        <span className={clsx(
                                                            "w-1.5 h-1.5 rounded-full flex-shrink-0 transition-colors",
                                                            window.location.pathname === child.path
                                                                ? "bg-primary-600 dark:bg-primary-400"
                                                                : "bg-gray-300 dark:bg-gray-600 group-hover:bg-gray-500 dark:group-hover:bg-gray-400"
                                                        )} />
                                                        <span className="flex-1">{child.label}</span>
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
                                    className={({ isActive }) => clsx(
                                        "flex items-center gap-3 px-4 py-2.5 text-sm font-medium rounded-xl transition-all duration-200 group overflow-hidden whitespace-nowrap",
                                        isActive
                                            ? "bg-primary-600 text-white shadow-lg shadow-primary-600/25"
                                            : "text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700/50 hover:text-gray-900 dark:hover:text-gray-200"
                                    )}
                                >
                                    <item.icon className={clsx(
                                        "w-5 h-5 flex-shrink-0 transition-colors",
                                        "group-hover:text-inherit"
                                    )} />
                                    <span className={twMerge(
                                        "transition-opacity duration-300",
                                        isOpen ? "opacity-100" : "opacity-0 lg:hidden"
                                    )}>
                                        {item.label}
                                    </span>
                                </NavLink>
                            )}
                        </div>
                    ))}
                </nav>

                {/* Bottom Section - User / Settings / Help */}

            </div>
        </>
    );
}
