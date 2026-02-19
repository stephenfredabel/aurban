import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  MessageSquare, Bell, Sun, Moon, ChevronDown,
  LayoutDashboard, ListFilter, Settings, LogOut,
} from 'lucide-react';
import { useAuth }      from '../context/AuthContext.jsx';
import { useMessaging } from '../context/MessagingContext.jsx';
import { isAdminRole, normalizeRole, ROLE_LABELS, ROLE_COLORS, ADMIN_ENTRY_PATH } from '../utils/rbac.js';
import AurbanLogo       from './AurbanLogo.jsx';
import LanguageSwitcher from './language/LanguageSwitcher.jsx';
import CurrencySwitcher from './CurrencySwitcher.jsx';

/* ════════════════════════════════════════════════════════════
   PROVIDER HEADER — Provider-only top bar

   Shows:  Logo → provider name/badge → theme · messages · bell · profile
   Hides:  Search bar, wishlist, user login/signup, marketplace nav

   Used in ProviderAppLayout (replaces the user-facing Header
   for all /provider/* routes).
════════════════════════════════════════════════════════════ */


export default function ProviderHeader() {
  const { t }            = useTranslation();
  const { user, logout } = useAuth();
  const { totalUnread }  = useMessaging();
  const [profileOpen, setProfileOpen] = useState(false);
  const profileRef = useRef(null);

  /* ── Theme toggle ───────────────────────────────────────── */
  const [dark, setDark] = useState(() => {
    if (typeof window !== 'undefined') {
      return document.documentElement.classList.contains('dark');
    }
    return false;
  });

  const toggleTheme = () => {
    const next = !dark;
    setDark(next);
    document.documentElement.classList.toggle('dark', next);
    try { sessionStorage.setItem('aurban_theme', next ? 'dark' : 'light'); } catch { /* ignore */ }
  };

  /* ── Close dropdown on outside click ────────────────────── */
  useEffect(() => {
    const handler = (e) => {
      if (profileRef.current && !profileRef.current.contains(e.target)) setProfileOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  /* ── Logout ─────────────────────────────────────────────── */
  const handleLogout = async () => {
    setProfileOpen(false);
    // Capture admin state BEFORE logout clears user
    const wasAdmin = isAdminRole(user?.role);
    await logout();
    // Admin → admin login portal (fully isolated)
    // Provider → marketplace home
    // Use window.location for full page reload to clear all state
    window.location.href = wasAdmin ? ADMIN_ENTRY_PATH : '/';
  };

  /* ── User initials for avatar ───────────────────────────── */
  const getInitials = () => {
    if (!user?.name) return 'P';
    const parts = user.name.split(' ').filter(Boolean);
    return parts.length > 1 ? (parts[0][0] + parts[1][0]).toUpperCase() : parts[0][0].toUpperCase();
  };

  const nRole      = normalizeRole(user?.role);
  const roleLabel  = ROLE_LABELS[nRole] || 'Provider';
  const badgeColor = ROLE_COLORS[nRole] || 'bg-brand-gold/10 text-brand-gold';

  return (
    <header className="sticky top-0 z-50 bg-white border-b border-gray-100 dark:bg-gray-950 dark:border-white/5">
      <div className="flex items-center px-4 mx-auto sm:px-6 max-w-7xl h-14">

        {/* ═══ LEFT: Logo → links to provider dashboard ═══ */}
        <Link to="/provider" className="flex items-center gap-2.5 mr-4 shrink-0" aria-label="Provider Dashboard">
          <AurbanLogo size="sm" showName={false} />
          <div className="hidden sm:block">
            <p className="text-sm font-bold leading-tight text-brand-charcoal-dark dark:text-white">
              {roleLabel} Dashboard
            </p>
          </div>
        </Link>

        {/* ═══ CENTER: Spacer ═══ */}
        <div className="flex-1" />

        {/* ═══ RIGHT: Provider actions ═══ */}
        <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">

          {/* Currency switcher */}
          <CurrencySwitcher compact />

          {/* Language switcher */}
          <LanguageSwitcher compact />

          {/* Theme toggle */}
          <button onClick={toggleTheme}
            className="flex items-center justify-center w-8 h-8 text-gray-400 transition-colors rounded-lg hover:bg-gray-50 dark:hover:bg-white/5"
            aria-label={dark ? 'Light mode' : 'Dark mode'}>
            {dark ? <Sun size={16} /> : <Moon size={16} />}
          </button>

          {/* Messages → provider messages */}
          <Link to="/provider/messages"
            className="relative flex items-center justify-center w-8 h-8 text-gray-400 transition-colors rounded-lg hover:bg-gray-50 dark:hover:bg-white/5"
            aria-label="Messages">
            <MessageSquare size={16} />
            {totalUnread > 0 && (
              <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 px-0.5 bg-red-500 rounded-full flex items-center justify-center text-[9px] font-bold text-white">
                {totalUnread > 9 ? '9+' : totalUnread}
              </span>
            )}
          </Link>

          {/* Notifications */}
          <button
            className="relative flex items-center justify-center w-8 h-8 text-gray-400 transition-colors rounded-lg hover:bg-gray-50 dark:hover:bg-white/5"
            aria-label="Notifications">
            <Bell size={16} />
          </button>

          {/* Profile avatar + dropdown */}
          <div ref={profileRef} className="relative">
            <button onClick={() => setProfileOpen(!profileOpen)}
              className="flex items-center gap-1.5 h-9 rounded-full hover:bg-gray-50 dark:hover:bg-white/5 transition-colors px-1 sm:px-2"
              aria-expanded={profileOpen} aria-haspopup="true">
              {user?.avatar ? (
                <img src={user.avatar} alt="" className="object-cover w-8 h-8 rounded-full ring-2 ring-gray-100 dark:ring-white/10" />
              ) : (
                <div className="flex items-center justify-center w-8 h-8 rounded-full bg-brand-gold/10 ring-2 ring-gray-100 dark:ring-white/10">
                  <span className="text-xs font-bold uppercase text-brand-gold">{getInitials()}</span>
                </div>
              )}
              <span className="hidden sm:block text-sm font-medium text-gray-700 dark:text-gray-200 max-w-[100px] truncate">
                {user?.name?.split(' ')[0] || 'Provider'}
              </span>
              <ChevronDown size={14} className={`hidden sm:block text-gray-400 transition-transform ${profileOpen ? 'rotate-180' : ''}`} />
            </button>

            {/* Dropdown */}
            {profileOpen && (
              <div className="absolute right-0 z-50 w-56 py-1.5 mt-2 bg-white border border-gray-100 top-full dark:bg-gray-900 dark:border-white/10 rounded-2xl shadow-lg shadow-black/5">
                {/* User info */}
                <div className="px-4 py-3 border-b border-gray-100 dark:border-white/10">
                  <p className="text-sm font-semibold text-gray-800 truncate dark:text-white">{user?.name}</p>
                  <span className={`inline-block px-1.5 py-0.5 rounded text-[9px] font-bold capitalize mt-1 ${badgeColor}`}>
                    {user?.role || 'provider'}
                  </span>
                </div>

                {/* Provider nav links */}
                <div className="py-1">
                  <Link to="/provider" onClick={() => setProfileOpen(false)}
                    className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors">
                    <LayoutDashboard size={16} className="text-gray-400" /> {t('dashboard.overview', 'Overview')}
                  </Link>
                  <Link to="/provider/listings" onClick={() => setProfileOpen(false)}
                    className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors">
                    <ListFilter size={16} className="text-gray-400" /> {t('dashboard.listings', 'My Listings')}
                  </Link>
                  <Link to="/provider/settings" onClick={() => setProfileOpen(false)}
                    className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors">
                    <Settings size={16} className="text-gray-400" /> {t('dashboard.settings', 'Settings')}
                  </Link>
                </div>

                {/* Sign out */}
                <div className="pt-1 border-t border-gray-100 dark:border-white/10">
                  <button onClick={handleLogout}
                    className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors">
                    <LogOut size={16} /> {t('nav.logout', 'Sign Out')}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
