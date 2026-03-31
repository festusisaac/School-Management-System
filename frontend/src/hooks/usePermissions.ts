import { useAuth } from './useAuth';

export const usePermissions = () => {
  const { user } = useAuth();

  const hasPermission = (permission?: string): boolean => {
    if (!permission) return true;
    if (!user) return false;

    const role = (user.role || user.roleObject?.name)?.toLowerCase();
    
    // Super Administrator bypasses ALL checks (Master Key)
    if (role === 'super administrator') {
      return true;
    }

    // Aggregate permissions from direct permissions array and roleObject permissions
    const userPermissions = [
      ...(user.permissions || []),
      ...(user.roleObject?.permissions?.map((p: any) => p.slug) || [])
    ];

    // Explicit check against the aggregated permissions array
    if (userPermissions.includes(permission)) return true;

    // Fallback: If requesting a 'view' permission, check if they have 'manage' for that same topic
    // e.g., if checking for 'academics:view_timetable', but they have 'academics:manage_timetable'
    if (permission.includes(':view_')) {
      const manageEquivalent = permission.replace(':view_', ':manage_');
      if (userPermissions.includes(manageEquivalent)) return true;
    }

    return false;
  };

  /**
   * Helper to check if the user has ANY of the provided permissions
   */
  const hasAnyPermission = (permissions: string[]): boolean => {
    return permissions.some(p => hasPermission(p));
  };

  /**
   * Helper to check if the user has ALL of the provided permissions
   */
  const hasAllPermissions = (permissions: string[]): boolean => {
    return permissions.every(p => hasPermission(p));
  };

  return {
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    userRole: user?.role?.toLowerCase(),
  };
};
