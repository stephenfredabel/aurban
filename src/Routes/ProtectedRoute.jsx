import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { hasPermission, isAdminRole, normalizeRole } from '../utils/rbac.js';

/* ════════════════════════════════════════════════════════════
   PROTECTED ROUTE — Auth + role + permission guard

   Usage:
     <ProtectedRoute>                              — any logged-in user
     <ProtectedRoute requiredRole="provider">      — provider / admin
     <ProtectedRoute adminOnly>                    — any admin role
     <ProtectedRoute requiredPermission="users:view"> — RBAC permission

   Security:
   • Redirects unauthenticated users to /login
   • Saves intended destination for post-login redirect
   • Validates role if requiredRole is specified
   • Validates RBAC permission if requiredPermission is specified
   • Uses safeRedirect pattern (relative paths only)
════════════════════════════════════════════════════════════ */

export default function ProtectedRoute({
  children,
  requiredRole,
  requiredPermission,
  adminOnly = false,
}) {
  const { user, loading, isVerified } = useAuth();
  const location          = useLocation();

  // While auth state is loading, show nothing (prevents flash)
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-6 h-6 border-2 rounded-full border-brand-gold/30 border-t-brand-gold animate-spin" />
      </div>
    );
  }

  // Not authenticated → redirect to login with return path
  if (!user) {
    const returnTo = location.pathname + location.search;
    const safeReturn = returnTo.startsWith('/') && !returnTo.startsWith('//') ? returnTo : '/';
    return <Navigate to={`/login?redirect=${encodeURIComponent(safeReturn)}`} replace />;
  }

  const role = normalizeRole(user.role);

  // Verified check — unverified users must complete OTP before accessing protected routes
  if (!isVerified) {
    const providerRoles = ['provider', 'host', 'agent', 'seller', 'service'];
    const loginPath = (providerRoles.includes(user.role) || isAdminRole(role))
      ? `/provider/login?email=${encodeURIComponent(user.email)}&verify=1`
      : `/login?email=${encodeURIComponent(user.email)}&verify=1`;
    return <Navigate to={loginPath} replace />;
  }

  // Admin-only check
  if (adminOnly && !isAdminRole(role)) {
    return <Navigate to="/dashboard" replace />;
  }

  // Permission check (RBAC)
  if (requiredPermission && !hasPermission(role, requiredPermission)) {
    return <Navigate to="/provider" replace />;
  }

  // Role check (if required)
  if (requiredRole) {
    const providerRoles = ['provider', 'host', 'agent', 'seller', 'service'];
    const hasAccess = requiredRole === 'provider'
      ? (providerRoles.includes(user.role) || isAdminRole(role))
      : user.role === requiredRole || role === requiredRole;

    if (!hasAccess) {
      return <Navigate to="/dashboard" replace />;
    }

    // Onboarding gate — providers must complete profile setup (tier.level >= 2)
    // before accessing any provider dashboard route.
    // Admins bypass this. The /onboarding route itself is excluded to avoid a loop.
    if (
      requiredRole === 'provider' &&
      !isAdminRole(role) &&
      providerRoles.includes(user.role) &&
      (user.tier?.level ?? 1) < 2 &&
      location.pathname !== '/onboarding'
    ) {
      return <Navigate to="/onboarding" replace />;
    }
  }

  return children;
}