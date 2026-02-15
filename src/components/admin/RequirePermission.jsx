import { useAuth } from '../../context/AuthContext.jsx';
import { hasPermission, hasAnyPermission, isAdminRole, normalizeRole } from '../../utils/rbac.js';

/**
 * RequirePermission — conditional render based on RBAC.
 * Hides children if the current user lacks the required permission.
 *
 * Usage:
 *   <RequirePermission permission="users:suspend">
 *     <SuspendButton />
 *   </RequirePermission>
 *
 *   <RequirePermission permissions={['users:suspend', 'users:ban_permanent']} any>
 *     <ActionMenu />
 *   </RequirePermission>
 */
export default function RequirePermission({
  permission,       // single permission string
  permissions,      // array of permission strings
  any = false,      // if true, ANY of the permissions grants access; else ALL required
  adminOnly = false,// if true, just checks isAdminRole (no specific permission)
  fallback = null,  // optional fallback UI when access denied
  children,
}) {
  const { user } = useAuth();
  const role = normalizeRole(user?.role);

  // Not logged in → hide
  if (!user) return fallback;

  // adminOnly mode: just check admin role
  if (adminOnly) {
    return isAdminRole(role) ? children : fallback;
  }

  // Single permission check
  if (permission) {
    return hasPermission(role, permission) ? children : fallback;
  }

  // Multiple permissions check
  if (permissions && permissions.length > 0) {
    const allowed = any
      ? hasAnyPermission(role, permissions)
      : permissions.every(p => hasPermission(role, p));
    return allowed ? children : fallback;
  }

  // No permission specified → render children
  return children;
}

/**
 * usePermission — hook returning boolean for a single permission.
 */
export function usePermission(permission) {
  const { user } = useAuth();
  const role = normalizeRole(user?.role);
  if (!user) return false;
  return hasPermission(role, permission);
}

/**
 * useIsAdmin — hook returning boolean for any admin role.
 */
export function useIsAdmin() {
  const { user } = useAuth();
  return isAdminRole(user?.role);
}
