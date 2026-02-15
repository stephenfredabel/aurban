import { useState, useEffect, useRef, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Shield, Sun, Moon, Bell, ChevronDown,
  MessageSquare, LogOut, AlertCircle,
  ArrowUpRight, MessagesSquare,
} from 'lucide-react';
import { useAuth }      from '../../context/AuthContext.jsx';
import { useMessaging } from '../../context/MessagingContext.jsx';
import {
  normalizeRole, ROLE_LABELS, ROLE_DASHBOARD_LABELS,
  ROLE_COLORS, ADMIN_QUEUES, hasPermission, ADMIN_ENTRY_PATH,
} from '../../utils/rbac.js';
import LanguageSwitcher from '../language/LanguageSwitcher.jsx';

/* ════════════════════════════════════════════════════════════
   ADMIN HEADER — Dark-themed header for admin dashboards

   Completely separate from ProviderHeader / public Header.
   • Shield icon (no Aurban logo)
   • Role-specific dashboard title
   • Queue summary badges (critical/high items)
   • Messages, notifications, theme, profile dropdown
   • Logout always → ADMIN_ENTRY_PATH (non-obvious URL)
════════════════════════════════════════════════════════════ */

/* ── Mock queue counts (replaced by API in production) ──── */
const MOCK_QUEUE_COUNTS = {
  escalated_reports: 3, pending_payouts: 8,  flagged_users: 5,
  pending_listings: 12, system_health: 0,    escrow_releases: 4,
  refund_requests: 2,   revenue_today: 0,    active_disputes: 6,
  open_reports: 23,     flagged_listings: 7,  pending_kyc: 15,
  docs_requested: 4,    expired_docs: 2,     urgent_tickets: 9,
  open_tickets: 34,     escalated_tickets: 3, high_risk_users: 2,
  frozen_accounts: 1,   audit_anomalies: 0,
};

/* ── Priority badge colors ─────────────────────────────── */
const PRIORITY_BADGE = {
  critical: 'bg-red-500 text-white',
  high:     'bg-amber-500/90 text-white',
};

export default function AdminHeader({ onToggleEscalation, escalationCount = 0, onToggleMessaging, messagingUnread = 0 }) {
  const { t }            = useTranslation();
  const { user, logout } = useAuth();
  const { totalUnread }  = useMessaging();
  const [profileOpen, setProfileOpen] = useState(false);
  const profileRef = useRef(null);

  const role      = normalizeRole(user?.role);
  const dashTitle = ROLE_DASHBOARD_LABELS[role] || 'Admin Dashboard';
  const roleLabel = ROLE_LABELS[role] || 'Admin';
  const badgeColor = ROLE_COLORS[role] || 'bg-brand-gold/10 text-brand-gold';

  /* ── Queue badges (critical + high only) ───────────────── */
  const queueBadges = useMemo(() => {
    const roleQueues = ADMIN_QUEUES[role] || [];
    return roleQueues
      .filter(q => (q.priority === 'critical' || q.priority === 'high') && (MOCK_QUEUE_COUNTS[q.key] ?? 0) > 0)
      .map(q => ({
        key: q.key,
        label: q.label,
        count: MOCK_QUEUE_COUNTS[q.key] ?? 0,
        priority: q.priority,
        badgeClass: PRIORITY_BADGE[q.priority],
      }));
  }, [role]);

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
    try { sessionStorage.setItem('aurban_theme', next ? 'dark' : 'light'); } catch {}
  };

  /* ── Close dropdown on outside click ────────────────────── */
  useEffect(() => {
    const handler = (e) => {
      if (profileRef.current && !profileRef.current.contains(e.target)) setProfileOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  /* ── Logout → admin login portal ────────────────────────── */
  const handleLogout = async () => {
    setProfileOpen(false);
    await logout();
    window.location.href = ADMIN_ENTRY_PATH;
  };

  /* ── Initials for avatar ─────────────────────────────────── */
  const getInitials = () => {
    if (!user?.name) return 'A';
    const parts = user.name.split(' ').filter(Boolean);
    return parts.length > 1 ? (parts[0][0] + parts[1][0]).toUpperCase() : parts[0][0].toUpperCase();
  };

  return (
    <header className="sticky top-0 z-50 bg-gray-900 border-b border-white/5">
      <div className="flex items-center px-4 mx-auto sm:px-6 max-w-7xl h-14">

        {/* ═══ LEFT: Shield + Dashboard title ═══ */}
        <Link to="/provider" className="flex items-center gap-2.5 mr-4 shrink-0" aria-label="Admin Dashboard">
          <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-brand-gold/10">
            <Shield size={16} className="text-brand-gold" />
          </div>
          <div className="hidden sm:block">
            <p className="text-sm font-bold leading-tight text-white">
              {dashTitle}
            </p>
          </div>
        </Link>

        {/* ═══ CENTER: Queue summary badges ═══ */}
        <div className="flex-1 flex items-center justify-center gap-2 overflow-x-auto no-scrollbar">
          {queueBadges.map(({ key, label, count, badgeClass }) => (
            <button
              key={key}
              className="hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 transition-colors shrink-0"
              title={label}
            >
              <span className={`inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full text-[9px] font-bold ${badgeClass}`}>
                {count}
              </span>
              <span className="text-[10px] text-gray-400 font-medium truncate max-w-[100px]">
                {label}
              </span>
            </button>
          ))}
          {/* Mobile: show total critical count */}
          {queueBadges.length > 0 && (
            <div className="flex items-center gap-1.5 md:hidden">
              <AlertCircle size={14} className="text-red-400" />
              <span className="text-[10px] text-gray-400 font-medium">
                {queueBadges.reduce((sum, q) => sum + q.count, 0)} items need attention
              </span>
            </div>
          )}
        </div>

        {/* ═══ RIGHT: Admin actions ═══ */}
        <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">

          {/* Language switcher */}
          <LanguageSwitcher compact />

          {/* Theme toggle */}
          <button onClick={toggleTheme}
            className="flex items-center justify-center w-8 h-8 text-gray-400 transition-colors rounded-lg hover:bg-white/5"
            aria-label={dark ? 'Light mode' : 'Dark mode'}>
            {dark ? <Sun size={16} /> : <Moon size={16} />}
          </button>

          {/* Escalation panel toggle */}
          {hasPermission(role, 'escalation:create') && onToggleEscalation && (
            <button onClick={onToggleEscalation}
              className="relative flex items-center justify-center w-8 h-8 text-gray-400 transition-colors rounded-lg hover:bg-white/5"
              aria-label="Escalations">
              <ArrowUpRight size={16} />
              {escalationCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 px-0.5 bg-amber-500 rounded-full flex items-center justify-center text-[9px] font-bold text-white">
                  {escalationCount > 9 ? '9+' : escalationCount}
                </span>
              )}
            </button>
          )}

          {/* Admin messaging toggle */}
          {hasPermission(role, 'messaging:admin_chat') && onToggleMessaging && (
            <button onClick={onToggleMessaging}
              className="relative flex items-center justify-center w-8 h-8 text-gray-400 transition-colors rounded-lg hover:bg-white/5"
              aria-label="Admin Chat">
              <MessagesSquare size={16} />
              {messagingUnread > 0 && (
                <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 px-0.5 bg-blue-500 rounded-full flex items-center justify-center text-[9px] font-bold text-white">
                  {messagingUnread > 9 ? '9+' : messagingUnread}
                </span>
              )}
            </button>
          )}

          {/* Messages */}
          <Link to="/provider/messages"
            className="relative flex items-center justify-center w-8 h-8 text-gray-400 transition-colors rounded-lg hover:bg-white/5"
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
            className="relative flex items-center justify-center w-8 h-8 text-gray-400 transition-colors rounded-lg hover:bg-white/5"
            aria-label="Notifications">
            <Bell size={16} />
          </button>

          {/* Profile avatar + dropdown */}
          <div ref={profileRef} className="relative">
            <button onClick={() => setProfileOpen(!profileOpen)}
              className="flex items-center gap-1.5 h-9 rounded-full hover:bg-white/5 transition-colors px-1 sm:px-2"
              aria-expanded={profileOpen} aria-haspopup="true">
              {user?.avatar ? (
                <img src={user.avatar} alt="" className="object-cover w-8 h-8 rounded-full ring-2 ring-white/10" />
              ) : (
                <div className="flex items-center justify-center w-8 h-8 rounded-full bg-brand-gold/10 ring-2 ring-white/10">
                  <span className="text-xs font-bold uppercase text-brand-gold">{getInitials()}</span>
                </div>
              )}
              <span className="hidden sm:block text-sm font-medium text-gray-200 max-w-[100px] truncate">
                {user?.name?.split(' ')[0] || 'Admin'}
              </span>
              <ChevronDown size={14} className={`hidden sm:block text-gray-500 transition-transform ${profileOpen ? 'rotate-180' : ''}`} />
            </button>

            {/* Dropdown */}
            {profileOpen && (
              <div className="absolute right-0 z-50 w-56 py-1.5 mt-2 bg-gray-800 border border-white/10 top-full rounded-2xl shadow-lg shadow-black/20">
                {/* Admin info */}
                <div className="px-4 py-3 border-b border-white/10">
                  <p className="text-sm font-semibold text-white truncate">{user?.name}</p>
                  <p className="text-[10px] text-gray-500 truncate mt-0.5">{user?.email}</p>
                  <span className={`inline-block px-1.5 py-0.5 rounded text-[9px] font-bold capitalize mt-1.5 ${badgeColor}`}>
                    {roleLabel}
                  </span>
                </div>

                {/* Quick nav */}
                <div className="py-1">
                  <Link to="/provider" onClick={() => setProfileOpen(false)}
                    className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-300 hover:bg-white/5 transition-colors">
                    <Shield size={16} className="text-gray-500" /> {t('dashboard.overview', 'Dashboard')}
                  </Link>
                </div>

                {/* Sign out */}
                <div className="pt-1 border-t border-white/10">
                  <button onClick={handleLogout}
                    className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-red-400 hover:bg-red-500/10 transition-colors">
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
