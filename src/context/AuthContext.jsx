import { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';
import { isAdminRole, normalizeRole } from '../utils/rbac.js';
import { isSupabaseConfigured } from '../lib/supabase.js';
import { getProfile, signOut as sbSignOut, onAuthStateChange } from '../services/supabase-auth.service.js';

/* ════════════════════════════════════════════════════════════
   AUTH CONTEXT — Session management + Role-based routing

   THREE AUTH FLOWS:
   ─────────────────────────────────────────────────────────
   1. USER/VISITOR  (Header login/signup)
      • Role: 'user'
      • After login → back to marketplace (/)
      • Dashboard: /dashboard/*

   2. PROVIDER      (Footer login/signup)
      • Roles: 'provider', 'host', 'agent', 'seller', 'service'
      • After login → /provider
      • Dashboard: /provider/*

   3. ADMIN         (admin login)
      • Roles: 'super_admin', 'operations_admin', 'moderator',
      •         'verification_admin', 'support_admin',
      •         'finance_admin', 'compliance_admin'
      • Legacy 'admin' → mapped to 'super_admin'
      • After login → /provider
      • Dashboard: /provider/* (admin tabs)

   ROUTING HELPERS (exported):
   • getPostLoginRedirect(role) → '/' or '/provider'
   • isProviderRole(role) → boolean
════════════════════════════════════════════════════════════ */

const AuthContext = createContext(null);
const SESSION_KEY = 'aurban_session';

const PROVIDER_ROLES = ['provider', 'host', 'agent', 'seller', 'service', 'admin'];

// All valid roles (providers + 7 admin roles)
const ALL_VALID_ROLES = [
  'user', 'host', 'agent', 'seller', 'service', 'provider',
  'admin', // legacy — maps to super_admin
  'super_admin', 'operations_admin', 'moderator',
  'verification_admin', 'support_admin', 'finance_admin', 'compliance_admin',
];

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
  return PROVIDER_ROLES.includes(role) || isAdminRole(role);
}

/* ── Sanitize user data before storing ────────────────────── */
const sanitizeUser = (user) => {
  const rawRole = ALL_VALID_ROLES.includes(user.role) ? user.role : 'user';
  return {
    id:          String(user.id  || ''),
    name:        String(user.name || '').slice(0, 100),
    email:       String(user.email || '').slice(0, 200),
    phone:       String(user.phone || '').slice(0, 30),
    role:        rawRole,
    avatar:      user.avatar ? String(user.avatar).slice(0, 500) : null,
    verified:    Boolean(user.verified),
    tier:        user.tier || { type: 'individual', level: 1, label: 'Basic Provider' },
    accountType: user.accountType || user.tier?.type || 'individual',
    countryCode: user.countryCode || 'NG',
  };
};

export function AuthProvider({ children }) {
  const [user,    setUser]    = useState(null);
  const [loading, setLoading] = useState(true);
  const sbListenerRef = useRef(null);

  /* ── Helper: load profile from Supabase and set user ───── */
  const loadSupabaseProfile = useCallback(async (sbUser) => {
    if (!sbUser) return null;
    const res = await getProfile(sbUser.id);
    if (res.success && res.data) {
      const clean = sanitizeUser(res.data);
      setUser(clean);
      sessionStorage.setItem(SESSION_KEY, JSON.stringify(clean));
      return clean;
    }
    // Profile not yet created (trigger may still be running) — build from auth metadata
    const meta = sbUser.user_metadata || {};
    const fallback = sanitizeUser({
      id:    sbUser.id,
      name:  meta.name || '',
      email: sbUser.email || '',
      phone: sbUser.phone || '',
      role:  meta.role || 'user',
    });
    setUser(fallback);
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(fallback));
    return fallback;
  }, []);

  /* ── Restore session ────────────────────────────────────── */
  useEffect(() => {
    let cancelled = false;

    const restore = async () => {
      // 1. Try Supabase session first
      if (isSupabaseConfigured()) {
        try {
          const { default: { supabase } } = await import('../lib/supabase.js');
          const { data: { session } } = await supabase.auth.getSession();
          if (!cancelled && session?.user) {
            await loadSupabaseProfile(session.user);
            setLoading(false);
            return;
          }
        } catch { /* fall through to sessionStorage */ }
      }

      // 2. Fall back to sessionStorage (mock mode)
      try {
        const raw = sessionStorage.getItem(SESSION_KEY);
        if (raw && !cancelled) setUser(sanitizeUser(JSON.parse(raw)));
      } catch {
        sessionStorage.removeItem(SESSION_KEY);
      }
      if (!cancelled) setLoading(false);
    };

    restore();

    // 3. Subscribe to Supabase auth state changes (handles OAuth redirect, token refresh)
    if (isSupabaseConfigured()) {
      const { data } = onAuthStateChange(async (event, session) => {
        if (cancelled) return;
        if (event === 'SIGNED_IN' && session?.user) {
          await loadSupabaseProfile(session.user);
        } else if (event === 'SIGNED_OUT') {
          setUser(null);
          sessionStorage.removeItem(SESSION_KEY);
        } else if (event === 'TOKEN_REFRESHED' && session?.user) {
          // Session refreshed — no action needed, user already loaded
        }
      });
      sbListenerRef.current = data.subscription;
    }

    return () => {
      cancelled = true;
      sbListenerRef.current?.unsubscribe();
    };
  }, [loadSupabaseProfile]);

  /* ── Login ──────────────────────────────────────────────── */
  const login = useCallback((userData) => {
    const clean = sanitizeUser(userData);
    setUser(clean);
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(clean));
  }, []);

  /* ── Logout ─────────────────────────────────────────────── */
  const logout = useCallback(async () => {
    if (isSupabaseConfigured()) {
      await sbSignOut();
    }
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

  const normalizedRole = user ? normalizeRole(user.role) : null;

  return (
    <AuthContext.Provider value={{
      user,
      login,
      logout,
      updateUser,
      loading,
      isAuthenticated: !!user,
      isProvider: user ? isProviderRole(user.role) : false,
      isAdmin:    user ? isAdminRole(user.role) : false,
      isCompany:  user?.accountType === 'company',
      normalizedRole,
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