import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

/* ════════════════════════════════════════════════════════════
   PROTECTED ROUTE — Auth + optional role guard
   
   Usage:
     <ProtectedRoute>                    — any logged-in user
     <ProtectedRoute requiredRole="provider">  — provider only
   
   Security:
   • Redirects unauthenticated users to /login
   • Saves intended destination for post-login redirect
   • Validates role if requiredRole is specified
   • Uses safeRedirect pattern (relative paths only)
════════════════════════════════════════════════════════════ */

export default function ProtectedRoute({ children, requiredRole }) {
  const { user, loading } = useAuth();
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
    // Only allow relative paths (prevent open redirect attacks)
    const safeReturn = returnTo.startsWith('/') && !returnTo.startsWith('//') ? returnTo : '/';
    return <Navigate to={`/login?redirect=${encodeURIComponent(safeReturn)}`} replace />;
  }

  // Role check (if required)
  if (requiredRole) {
    const providerRoles = ['provider', 'admin', 'host', 'agent', 'seller', 'service'];
    const hasAccess = requiredRole === 'provider'
      ? providerRoles.includes(user.role)
      : user.role === requiredRole;

    if (!hasAccess) {
      // User doesn't have the required role — send to user dashboard
      return <Navigate to="/dashboard" replace />;
    }
  }

  return children;
}