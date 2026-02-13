import { createContext, useContext, useState, useCallback, useEffect } from 'react';

/* ════════════════════════════════════════════════════════════
   AUTH CONTEXT — Session management + Role-based routing

   TWO SEPARATE AUTH FLOWS:
   ─────────────────────────────────────────────────────────
   1. USER/VISITOR  (Header login/signup)
      • Role: 'user'
      • After login → back to marketplace (/)
      • Dashboard: /dashboard/*
   
   2. PROVIDER      (Footer login/signup)
      • Roles: 'provider', 'host', 'agent', 'seller', 'service'
      • After login → /provider
      • Dashboard: /provider/*

   ROUTING HELPERS (exported):
   • getPostLoginRedirect(role) → '/' or '/provider'
   • isProviderRole(role) → boolean
════════════════════════════════════════════════════════════ */

const AuthContext = createContext(null);
const SESSION_KEY = 'aurban_session';

const PROVIDER_ROLES = ['provider', 'host', 'agent', 'seller', 'service', 'admin'];

/* ── Routing helpers ──────────────────────────────────────── */

/**
 * Where to go AFTER login:
 * - Users → marketplace (/)
 * - Providers → provider dashboard (/provider)
 */
export function getPostLoginRedirect(role) {
  return PROVIDER_ROLES.includes(role) ? '/provider' : '/';
}

/**
 * Where to find the user's dashboard:
 * - Users → /dashboard
 * - Providers → /provider
 */
export function getDashboardPath(role) {
  return PROVIDER_ROLES.includes(role) ? '/provider' : '/dashboard';
}

export function isProviderRole(role) {
  return PROVIDER_ROLES.includes(role);
}

/* ── Sanitize user data before storing ────────────────────── */
const sanitizeUser = (user) => ({
  id:          String(user.id  || ''),
  name:        String(user.name || '').slice(0, 100),
  email:       String(user.email || '').slice(0, 200),
  phone:       String(user.phone || '').slice(0, 30),
  role:        ['user', 'host', 'agent', 'seller', 'service', 'provider', 'admin'].includes(user.role)
               ? user.role : 'user',
  avatar:      user.avatar ? String(user.avatar).slice(0, 500) : null,
  verified:    Boolean(user.verified),
  tier:        user.tier || { type: 'individual', level: 1, label: 'Basic Provider' },
  countryCode: user.countryCode || 'NG',
});

export function AuthProvider({ children }) {
  const [user,    setUser]    = useState(null);
  const [loading, setLoading] = useState(true);

  /* ── Restore session ────────────────────────────────────── */
  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(SESSION_KEY);
      if (raw) setUser(sanitizeUser(JSON.parse(raw)));
    } catch {
      sessionStorage.removeItem(SESSION_KEY);
    } finally {
      setLoading(false);
    }
  }, []);

  /* ── Login ──────────────────────────────────────────────── */
  const login = useCallback((userData) => {
    const clean = sanitizeUser(userData);
    setUser(clean);
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(clean));
  }, []);

  /* ── Logout ─────────────────────────────────────────────── */
  const logout = useCallback(() => {
    setUser(null);
    sessionStorage.removeItem(SESSION_KEY);
  }, []);

  /* ── Update profile ─────────────────────────────────────── */
  const updateUser = useCallback((updates) => {
    setUser((prev) => {
      if (!prev) return null;
      const updated = sanitizeUser({ ...prev, ...updates });
      sessionStorage.setItem(SESSION_KEY, JSON.stringify(updated));
      return updated;
    });
  }, []);

  return (
    <AuthContext.Provider value={{
      user,
      login,
      logout,
      updateUser,
      loading,
      isAuthenticated: !!user,
      isProvider: user ? isProviderRole(user.role) : false,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}