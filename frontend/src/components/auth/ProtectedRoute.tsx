import { Navigate, Outlet } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore';

/**
 * ProtectedRoute component
 * Redirects to /login if the user is not authenticated.
 */
export const ProtectedRoute = () => {
    const { token } = useAuthStore();

    if (!token) {
        // No token found, redirect to login
        // 'replace' prevents the user from going back to the protected page via the back button
        return <Navigate to="/login" replace />;
    }

    // Token exists, render the child routes (internal pages)
    return <Outlet />;
};
