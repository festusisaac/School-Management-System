import { useEffect, useLayoutEffect, useState } from 'react';
import axios from 'axios';
import { Outlet, useNavigate, Link, useLocation, Navigate } from 'react-router-dom';
import { DownloadCloud, Users, UploadCloud, LogOut, Menu, BarChart3, ClipboardList, FileBarChart2 } from 'lucide-react';
import { applyAdminAuthDefaults, clearAdminAuthDefaults, clearAdminToken, getAdminAuthConfig, getAdminToken } from '../utils/adminAuth';

const navItems = [
    { path: '/admin/pull', label: 'Provision Node', icon: DownloadCloud },
    { path: '/admin/monitor', label: 'Live Monitor', icon: Users },
    { path: '/admin/push', label: 'Push Results', icon: UploadCloud },
    { path: '/admin/results', label: 'Result Summary', icon: FileBarChart2 },
    { path: '/admin/analytics', label: 'Analytics', icon: BarChart3 },
    { path: '/admin/audit', label: 'Audit Logs', icon: ClipboardList },
];

export default function AdminLayout() {
    const navigate = useNavigate();
    const location = useLocation();
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const token = getAdminToken();

    useLayoutEffect(() => {
        if (!token) return;
        applyAdminAuthDefaults();
    }, [token]);

    useEffect(() => {
        if (!token) clearAdminAuthDefaults();
    }, [token]);

    useEffect(() => {
        if (!token) return;
        const verifySession = async () => {
            try {
                await axios.get('/api/admin/randomization', getAdminAuthConfig());
            } catch (error: any) {
                if (error?.response?.status === 401) {
                    clearAdminToken();
                    clearAdminAuthDefaults();
                    navigate('/admin/login', { replace: true });
                }
            }
        };
        verifySession();
    }, [navigate, token]);

    const handleLogout = () => {
        clearAdminToken();
        clearAdminAuthDefaults();
        navigate('/admin/login');
    };

    if (!token) {
        return <Navigate to="/admin/login" replace />;
    }

    return (
        <div className="h-screen bg-gray-100 flex flex-col font-sans overflow-hidden">
            <header className="h-14 bg-white border-b border-gray-200 px-4 md:px-6 flex items-center justify-between shrink-0">
                <div className="flex items-center gap-3 md:gap-5">
                    <button
                        onClick={() => setSidebarOpen((prev) => !prev)}
                        className="md:hidden p-1.5 rounded border border-gray-200 text-gray-600"
                    >
                        <Menu className="w-4 h-4" />
                    </button>
                    <h1 className="text-sm md:text-base font-bold text-gray-900 uppercase tracking-wide">CBT Admin Console</h1>
                    <span className="hidden md:inline text-[11px] font-semibold text-emerald-700 uppercase tracking-wider">Node Online</span>
                </div>

                <div className="flex items-center gap-3">
                    <span className="hidden sm:inline text-[11px] font-mono font-semibold text-gray-500 uppercase">
                        {window.location.hostname}
                    </span>
                    <button
                        onClick={handleLogout}
                        className="p-1.5 rounded border border-rose-200 text-rose-600 hover:bg-rose-50"
                        title="Logout"
                    >
                        <LogOut className="w-4 h-4" />
                    </button>
                </div>
            </header>

            <main className="flex-1 flex overflow-hidden">
                <aside className={`${sidebarOpen ? 'block' : 'hidden'} md:block w-64 bg-white border-r border-gray-200 shrink-0`}>
                    <div className="p-4 border-b border-gray-100">
                        <p className="text-[11px] font-bold text-gray-400 uppercase tracking-[0.2em]">Navigation</p>
                    </div>
                    <nav className="p-3 space-y-1">
                        {navItems.map((item) => {
                            const Icon = item.icon;
                            const active = location.pathname.startsWith(item.path);
                            return (
                                <Link
                                    key={item.path}
                                    to={item.path}
                                    onClick={() => setSidebarOpen(false)}
                                    className={`flex items-center gap-3 px-3 py-2.5 rounded text-sm font-semibold transition-colors ${
                                        active
                                            ? 'bg-blue-50 text-blue-700 border border-blue-100'
                                            : 'text-gray-700 hover:bg-gray-50'
                                    }`}
                                >
                                    <Icon className="w-4 h-4" />
                                    <span>{item.label}</span>
                                </Link>
                            );
                        })}
                    </nav>
                </aside>

                <section className="flex-1 overflow-y-auto p-4 md:p-6">
                    <div className="max-w-6xl mx-auto">
                        <Outlet />
                    </div>
                </section>
            </main>
        </div>
    );
}
