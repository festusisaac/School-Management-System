import { Navigate, Outlet } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore';

const ADMIN_ROLES = ['super administrator', 'super admin', 'administrator', 'admin'];

/**
 * SettingsRoute
 * Permission-driven guard for the /settings area. Allowed if the user is an
 * admin/super admin, OR has been granted any `settings:*` permission — so
 * granting a teacher/staff access via Roles & Permissions actually works.
 * The backend enforces the same rule; this is the UX guard on top.
 */
export const SettingsRoute = () => {
    const { user } = useAuthStore();
    const u = user as any;
    const role = (u?.roleObject?.name || u?.role || '').toLowerCase().trim();
    const perms: string[] = [
        ...(u?.permissions || []),
        ...((u?.roleObject?.permissions || []).map((p: any) => p.slug)),
    ];
    const allowed = ADMIN_ROLES.includes(role) || perms.some((p) => p && p.startsWith('settings:'));

    if (!allowed) {
        return <Navigate to="/" replace />;
    }
    return <Outlet />;
};
