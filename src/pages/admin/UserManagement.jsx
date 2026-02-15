import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Search, User, Shield, ShieldOff,
  ChevronLeft, ChevronRight, Mail, Calendar,
  AlertCircle,
} from 'lucide-react';
import * as adminService from '../../services/admin.service.js';
import RequirePermission from '../../components/admin/RequirePermission.jsx';
import ConfirmAction from '../../components/admin/ConfirmAction.jsx';
import useAdminAction from '../../hooks/useAdminAction.js';
import { AUDIT_ACTIONS } from '../../services/audit.service.js';
import { maskUserData } from '../../utils/dataMask.js';
import { useAuth } from '../../context/AuthContext.jsx';

/* ════════════════════════════════════════════════════════════
   USER MANAGEMENT — Search, filter, suspend users
   Route: /admin/users
════════════════════════════════════════════════════════════ */

/* ── Mock data (dev fallback) ────────────────────────────── */
const MOCK_USERS = [
  { id: 'u1', name: 'Adaeze Obi',       email: 'adaeze@example.com',   role: 'user',             status: 'active',              joinDate: '2024-11-15', listingCount: 0 },
  { id: 'u2', name: 'Emeka Nwosu',      email: 'emeka@example.com',    role: 'host',             status: 'active',              joinDate: '2024-09-22', listingCount: 5 },
  { id: 'u3', name: 'Funke Adeyemi',    email: 'funke@example.com',    role: 'agent',            status: 'suspended',           joinDate: '2024-08-10', listingCount: 12 },
  { id: 'u4', name: 'Ibrahim Musa',     email: 'ibrahim@example.com',  role: 'seller',           status: 'active',              joinDate: '2025-01-03', listingCount: 3 },
  { id: 'u5', name: 'Chinwe Eze',       email: 'chinwe@example.com',   role: 'service_provider', status: 'pending_verification', joinDate: '2025-02-01', listingCount: 1 },
  { id: 'u6', name: 'Tunde Bakare',     email: 'tunde@example.com',    role: 'host',             status: 'active',              joinDate: '2024-07-18', listingCount: 8 },
  { id: 'u7', name: 'Amina Suleiman',   email: 'amina@example.com',    role: 'user',             status: 'pending_verification', joinDate: '2025-01-28', listingCount: 0 },
  { id: 'u8', name: 'Oluwaseun Ajayi',  email: 'seun@example.com',     role: 'agent',            status: 'active',              joinDate: '2024-10-05', listingCount: 20 },
];

const ROLE_FILTERS   = ['all', 'user', 'host', 'agent', 'seller', 'service_provider'];
const STATUS_FILTERS = ['all', 'active', 'suspended', 'banned', 'pending_verification'];

const ROLE_LABELS = {
  user: 'User', host: 'Host', agent: 'Agent',
  seller: 'Seller', service_provider: 'Service Provider',
};

const ROLE_STYLES = {
  user:             'bg-blue-50 dark:bg-blue-500/10 text-blue-600',
  host:             'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600',
  agent:            'bg-purple-50 dark:bg-purple-500/10 text-purple-600',
  seller:           'bg-amber-50 dark:bg-amber-500/10 text-amber-600',
  service_provider: 'bg-rose-50 dark:bg-rose-500/10 text-rose-600',
};

const STATUS_STYLES = {
  active:               { label: 'Active',              bg: 'bg-emerald-50 dark:bg-emerald-500/10', text: 'text-emerald-600' },
  suspended:            { label: 'Suspended',           bg: 'bg-red-50 dark:bg-red-500/10',         text: 'text-red-600' },
  banned:               { label: 'Banned',              bg: 'bg-gray-100 dark:bg-gray-700',         text: 'text-gray-600 dark:text-gray-300' },
  pending_verification: { label: 'Pending Verification', bg: 'bg-amber-50 dark:bg-amber-500/10',    text: 'text-amber-600' },
};

const PAGE_SIZE = 6;

export default function UserManagement() {
  const { t } = useTranslation('admin');
  const { user } = useAuth();

  const [users, setUsers]           = useState(MOCK_USERS);
  const [search, setSearch]         = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [page, setPage]             = useState(1);
  const [loading, setLoading]       = useState(true);
  const [usingFallback, setUsingFallback] = useState(false);

  useEffect(() => {
    document.title = t('users.title', 'User Management') + ' — Aurban';
  }, [t]);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      try {
        const res = await adminService.getUsers({ page: 1, limit: 100 });
        if (!cancelled && res.success && res.users?.length) {
          setUsers(res.users);
          setUsingFallback(false);
        } else if (!cancelled) {
          setUsingFallback(true);
        }
      } catch {
        if (!cancelled) setUsingFallback(true);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, []);

  /* ── Filtering ─────────────────────────────────────────── */
  const filtered = users.filter((u) => {
    if (roleFilter !== 'all' && u.role !== roleFilter) return false;
    if (statusFilter !== 'all' && u.status !== statusFilter) return false;
    if (search) {
      const q = search.toLowerCase();
      return u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q);
    }
    return true;
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const [activeUserId, setActiveUserId] = useState(null);

  /* ── Suspend / unsuspend ───────────────────────────────── */
  const toggleSuspend = async (userId) => {
    const target = users.find((u) => u.id === userId);
    if (!target) return;
    const nextStatus = target.status === 'suspended' ? 'active' : 'suspended';
    setUsers((prev) => prev.map((u) => u.id === userId ? { ...u, status: nextStatus } : u));
    await adminService.updateUser(userId, { status: nextStatus });
  };

  /* ── Admin action for suspend (with confirmation) ────── */
  const suspendAction = useAdminAction({
    permission: 'users:suspend',
    action: AUDIT_ACTIONS.USER_SUSPEND,
    requireReason: true,
    targetId: activeUserId,
    targetType: 'user',
    onExecute: async () => { if (activeUserId) await toggleSuspend(activeUserId); },
    onSuccess: () => setActiveUserId(null),
  });

  /* ── Ban action (with confirmation) ────────────────────── */
  const banAction = useAdminAction({
    permission: 'users:ban_permanent',
    action: AUDIT_ACTIONS.USER_BAN || 'user_ban',
    confirmTitle: t('users.confirmBan', 'Permanently Ban User'),
    confirmMessage: t('users.confirmBanMsg', 'This will permanently ban the user from the platform. This action cannot be undone.'),
    confirmLabel: t('users.ban', 'Ban'),
    requireReason: true,
    targetId: activeUserId,
    targetType: 'user',
    onExecute: async () => {
      if (activeUserId) {
        setUsers((prev) => prev.map((u) => u.id === activeUserId ? { ...u, status: 'banned' } : u));
        await adminService.updateUser(activeUserId, { status: 'banned' });
      }
    },
    onSuccess: () => setActiveUserId(null),
  });

  return (
    <div className="pb-8 space-y-5">
      {/* ── Fallback banner ──────────────────────────────────── */}
      {usingFallback && (
        <div className="flex items-center gap-2 px-4 py-2.5 text-xs font-medium text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-500/10 rounded-xl">
          <AlertCircle size={14} className="shrink-0" />
          {t('fallback', 'Could not reach server. Showing cached data.')}
        </div>
      )}

      {/* ── Header ───────────────────────────────────────────── */}
      <div>
        <h1 className="text-xl font-bold font-display text-brand-charcoal-dark dark:text-white">
          {t('users.title', 'User Management')}
        </h1>
        <p className="text-sm text-gray-400 mt-0.5">
          {t('users.subtitle', 'Search, filter, and manage platform users')}
        </p>
      </div>

      {/* ── Search ───────────────────────────────────────────── */}
      <div className="relative">
        <Search size={16} className="absolute text-gray-400 -translate-y-1/2 left-3 top-1/2" />
        <input
          type="text"
          placeholder={t('users.searchPlaceholder', 'Search by name or email...')}
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          className="w-full py-2.5 pl-10 pr-4 text-sm bg-white dark:bg-gray-900 border border-gray-200 dark:border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-gold/40 text-brand-charcoal-dark dark:text-white placeholder-gray-400"
        />
      </div>

      {/* ── Role filter pills ────────────────────────────────── */}
      <div className="flex gap-2 overflow-x-auto scrollbar-hide">
        {ROLE_FILTERS.map((r) => (
          <button
            key={r}
            onClick={() => { setRoleFilter(r); setPage(1); }}
            className={`text-xs font-medium px-3 py-1.5 rounded-full transition-colors capitalize whitespace-nowrap shrink-0
              ${roleFilter === r
                ? 'bg-brand-charcoal-dark dark:bg-white text-white dark:text-gray-900'
                : 'bg-gray-100 dark:bg-white/5 text-gray-500 hover:bg-gray-200 dark:hover:bg-white/10'
              }`}
          >
            {r === 'all' ? t('users.filters.all', 'All') : ROLE_LABELS[r] || r}
          </button>
        ))}
      </div>

      {/* ── Status filter pills ──────────────────────────────── */}
      <div className="flex gap-2 overflow-x-auto scrollbar-hide">
        {STATUS_FILTERS.map((s) => (
          <button
            key={s}
            onClick={() => { setStatusFilter(s); setPage(1); }}
            className={`text-xs font-medium px-3 py-1.5 rounded-full transition-colors whitespace-nowrap shrink-0
              ${statusFilter === s
                ? 'bg-brand-charcoal-dark dark:bg-white text-white dark:text-gray-900'
                : 'bg-gray-100 dark:bg-white/5 text-gray-500 hover:bg-gray-200 dark:hover:bg-white/10'
              }`}
          >
            {s === 'all' ? t('users.filters.allStatus', 'All Status') : STATUS_STYLES[s]?.label || s}
          </button>
        ))}
      </div>

      {/* ── User cards ───────────────────────────────────────── */}
      {loading ? (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-40 bg-white dark:bg-gray-900 rounded-2xl shadow-card animate-pulse" />
          ))}
        </div>
      ) : paged.length === 0 ? (
        <div className="py-16 text-center">
          <User size={36} className="mx-auto mb-3 text-gray-300" />
          <p className="text-sm font-semibold text-brand-charcoal-dark dark:text-white">
            {t('users.empty.title', 'No users found')}
          </p>
          <p className="mt-1 text-xs text-gray-400">
            {t('users.empty.subtitle', 'Try adjusting your search or filters')}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {paged.map((u) => {
            const role   = ROLE_STYLES[u.role]   || ROLE_STYLES.user;
            const status = STATUS_STYLES[u.status] || STATUS_STYLES.active;
            return (
              <div key={u.id} className="p-4 bg-white dark:bg-gray-900 rounded-2xl shadow-card sm:p-5">
                <div className="flex items-start gap-3">
                  {/* Avatar */}
                  <div className="flex items-center justify-center w-10 h-10 bg-gray-100 rounded-full dark:bg-white/10 shrink-0">
                    <User size={18} className="text-gray-400" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-brand-charcoal-dark dark:text-white truncate">{u.name}</p>
                    <div className="flex items-center gap-1 mt-0.5 text-xs text-gray-400">
                      <Mail size={11} /> <span className="truncate">{maskUserData({ email: u.email }, user?.role).email}</span>
                    </div>
                  </div>
                </div>

                {/* Badges */}
                <div className="flex flex-wrap gap-1.5 mt-3">
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${role}`}>
                    {ROLE_LABELS[u.role] || u.role}
                  </span>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${status.bg} ${status.text}`}>
                    {status.label}
                  </span>
                </div>

                {/* Meta */}
                <div className="flex items-center gap-4 mt-3 text-xs text-gray-400">
                  <span className="flex items-center gap-1"><Calendar size={11} /> {u.joinDate}</span>
                  <span>{u.listingCount} listing{u.listingCount !== 1 ? 's' : ''}</span>
                </div>

                {/* Actions */}
                <div className="flex gap-2 mt-3">
                  <button
                    onClick={() => setActiveUserId(activeUserId === u.id ? null : u.id)}
                    className="flex-1 px-4 py-2 text-xs font-bold transition-colors bg-gray-100 dark:bg-white/5 text-brand-charcoal-dark dark:text-white rounded-xl hover:bg-gray-200 dark:hover:bg-white/10"
                  >
                    {t('users.viewProfile', 'View Profile')}
                  </button>
                  <RequirePermission permission="users:suspend">
                    <button
                      onClick={() => { setActiveUserId(u.id); setTimeout(() => suspendAction.execute(), 0); }}
                      className={`px-4 py-2 text-xs font-bold rounded-xl transition-colors flex items-center gap-1.5
                        ${u.status === 'suspended'
                          ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 hover:bg-emerald-100'
                          : 'bg-red-50 dark:bg-red-500/10 text-red-600 hover:bg-red-100'
                        }`}
                    >
                      {u.status === 'suspended'
                        ? <><Shield size={12} /> {t('users.unsuspend', 'Unsuspend')}</>
                        : <><ShieldOff size={12} /> {t('users.suspend', 'Suspend')}</>
                      }
                    </button>
                  </RequirePermission>
                  <RequirePermission permission="users:ban_permanent">
                    <button
                      onClick={() => { setActiveUserId(u.id); setTimeout(() => banAction.execute(), 0); }}
                      className="px-4 py-2 text-xs font-bold rounded-xl transition-colors flex items-center gap-1.5 bg-red-100 dark:bg-red-500/20 text-red-700 hover:bg-red-200 dark:hover:bg-red-500/30"
                    >
                      <ShieldOff size={12} /> {t('users.ban', 'Ban')}
                    </button>
                  </RequirePermission>
                </div>

                {/* Expanded profile detail */}
                {activeUserId === u.id && (
                  <div className="mt-3 p-3 bg-gray-50 dark:bg-white/5 rounded-xl space-y-1.5 text-xs text-gray-500 dark:text-gray-400">
                    <p><span className="font-medium text-brand-charcoal-dark dark:text-white">ID:</span> {u.id}</p>
                    <p><span className="font-medium text-brand-charcoal-dark dark:text-white">Email:</span> {maskUserData({ email: u.email }, user?.role).email}</p>
                    <p><span className="font-medium text-brand-charcoal-dark dark:text-white">Role:</span> {ROLE_LABELS[u.role] || u.role}</p>
                    <p><span className="font-medium text-brand-charcoal-dark dark:text-white">Joined:</span> {u.joinDate}</p>
                    <p><span className="font-medium text-brand-charcoal-dark dark:text-white">Listings:</span> {u.listingCount}</p>
                    <p><span className="font-medium text-brand-charcoal-dark dark:text-white">Status:</span> {STATUS_STYLES[u.status]?.label || u.status}</p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* ── Confirm modals ─────────────────────────────────────── */}
      <ConfirmAction {...suspendAction.confirmProps} />
      <ConfirmAction {...banAction.confirmProps} />

      {/* ── Pagination ───────────────────────────────────────── */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="p-2 text-gray-400 transition-colors bg-white dark:bg-gray-900 rounded-lg shadow-card hover:text-brand-charcoal-dark dark:hover:text-white disabled:opacity-30"
          >
            <ChevronLeft size={16} />
          </button>
          {Array.from({ length: totalPages }).map((_, i) => (
            <button
              key={i}
              onClick={() => setPage(i + 1)}
              className={`w-8 h-8 rounded-lg text-xs font-bold transition-colors
                ${page === i + 1
                  ? 'bg-brand-charcoal-dark dark:bg-white text-white dark:text-gray-900'
                  : 'bg-white dark:bg-gray-900 text-gray-400 shadow-card hover:text-brand-charcoal-dark dark:hover:text-white'
                }`}
            >
              {i + 1}
            </button>
          ))}
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="p-2 text-gray-400 transition-colors bg-white dark:bg-gray-900 rounded-lg shadow-card hover:text-brand-charcoal-dark dark:hover:text-white disabled:opacity-30"
          >
            <ChevronRight size={16} />
          </button>
        </div>
      )}
    </div>
  );
}
