import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Users, Package, Calendar, Wallet, Flag,
  ArrowUpRight, AlertCircle, CheckCircle2,
  UserPlus, Shield, Clock, AlertTriangle,
  FileCheck, MessageSquare, Eye, Banknote,
  Activity, ShieldAlert, ScrollText,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext.jsx';
import {
  normalizeRole, ADMIN_QUEUES, ROLE_LABELS, ROLE_DASHBOARD_LABELS,
  SLA_TARGETS, ROLE_LEVELS, hasPermission,
} from '../../utils/rbac.js';
import * as adminService from '../../services/admin.service.js';
import RequirePermission from '../../components/admin/RequirePermission.jsx';

/* ════════════════════════════════════════════════════════════
   ADMIN DASHBOARD — Role-specific priority queues

   Each admin role sees their own priority queue first:
   • Super Admin  → escalated reports, payouts, flagged users
   • Finance      → payouts, escrow releases, refunds
   • Operations   → pending listings, disputes, flagged users
   • Moderator    → listings to review, flagged, reports
   • Verification → pending verifications, doc resubmits
   • Support      → urgent tickets, open tickets, disputes
   • Compliance   → KYC apps, high-risk users, frozen accounts

   Queue priority levels:
   • critical (red pulse)  — cannot be ignored
   • high     (amber)      — needs attention soon
   • normal   (gray)       — routine items
════════════════════════════════════════════════════════════ */

/* ── Mock queue counts (dev fallback) ──────────────────── */
const MOCK_QUEUE_COUNTS = {
  escalated_reports: 3,
  pending_payouts:   8,
  flagged_users:     5,
  pending_listings:  12,
  system_health:     0,
  escrow_releases:   4,
  refund_requests:   2,
  revenue_today:     0,
  active_disputes:   6,
  open_reports:      23,
  flagged_listings:  7,
  pending_kyc:       15,
  docs_requested:    4,
  expired_docs:      2,
  urgent_tickets:    9,
  open_tickets:      34,
  escalated_tickets: 3,
  high_risk_users:   2,
  frozen_accounts:   1,
  audit_anomalies:   0,
};

/* ── Icon mapping for queue items ──────────────────────── */
const QUEUE_ICONS = {
  escalated_reports: Flag,
  pending_payouts:   Banknote,
  flagged_users:     ShieldAlert,
  pending_listings:  Package,
  system_health:     Activity,
  escrow_releases:   Wallet,
  refund_requests:   Wallet,
  revenue_today:     Wallet,
  active_disputes:   AlertTriangle,
  open_reports:      Flag,
  flagged_listings:  AlertCircle,
  pending_kyc:       FileCheck,
  docs_requested:    ScrollText,
  expired_docs:      Clock,
  urgent_tickets:    AlertTriangle,
  open_tickets:      MessageSquare,
  escalated_tickets: MessageSquare,
  high_risk_users:   ShieldAlert,
  frozen_accounts:   Shield,
  audit_anomalies:   Eye,
};

/* ── Priority styling ──────────────────────────────────── */
const PRIORITY_STYLES = {
  critical: {
    badge:  'bg-red-500 text-white',
    border: 'border-red-200 dark:border-red-500/20',
    bg:     'bg-red-50 dark:bg-red-500/5',
    icon:   'text-red-500',
    dot:    'bg-red-500 animate-pulse',
    iconBg: 'bg-red-100 dark:bg-red-500/15',
    label:  'Requires action',
  },
  high: {
    badge:  'bg-amber-500 text-white',
    border: 'border-amber-200 dark:border-amber-500/20',
    bg:     'bg-amber-50 dark:bg-amber-500/5',
    icon:   'text-amber-500',
    dot:    'bg-amber-500',
    iconBg: 'bg-amber-100 dark:bg-amber-500/15',
    label:  'Needs attention',
  },
  normal: {
    badge:  'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300',
    border: 'border-gray-100 dark:border-white/5',
    bg:     'bg-white dark:bg-gray-900',
    icon:   'text-gray-400',
    dot:    'bg-gray-400',
    iconBg: 'bg-gray-50 dark:bg-white/5',
    label:  'In queue',
  },
};

/* ── General stat cards (visible per permission) ───────── */
const MOCK_STATS = [
  { key: 'totalUsers',      label: 'Total Users',        value: '12,847', icon: Users,    color: 'text-blue-500',    bg: 'bg-blue-50 dark:bg-blue-500/10' },
  { key: 'activeListings',  label: 'Active Listings',    value: '3,241',  icon: Package,  color: 'text-emerald-500', bg: 'bg-emerald-50 dark:bg-emerald-500/10' },
  { key: 'activeBookings',  label: 'Active Bookings',    value: '156',    icon: Calendar,  color: 'text-purple-500',  bg: 'bg-purple-50 dark:bg-purple-500/10' },
  { key: 'revenue',         label: 'Revenue This Month', value: '₦45.2M', icon: Wallet,   color: 'text-brand-gold',  bg: 'bg-yellow-50 dark:bg-yellow-500/10' },
  { key: 'pendingReports',  label: 'Pending Reports',    value: '23',     icon: Flag,      color: 'text-red-500',     bg: 'bg-red-50 dark:bg-red-500/10' },
];

const MOCK_ACTIVITY = [
  { id: 1, type: 'signup',   text: 'New user signed up — Adaeze Obi',       time: '5 min ago',  icon: UserPlus,     color: 'text-blue-500',    bg: 'bg-blue-50 dark:bg-blue-500/10' },
  { id: 2, type: 'listing',  text: 'Listing approved — 3BR Flat in Lekki',  time: '12 min ago', icon: CheckCircle2, color: 'text-emerald-500', bg: 'bg-emerald-50 dark:bg-emerald-500/10' },
  { id: 3, type: 'booking',  text: 'Booking completed — Inspection #1042',  time: '28 min ago', icon: Calendar,      color: 'text-purple-500',  bg: 'bg-purple-50 dark:bg-purple-500/10' },
  { id: 4, type: 'payment',  text: 'Payment received — ₦2.5M via Paystack', time: '1 hr ago',   icon: Wallet,       color: 'text-brand-gold',  bg: 'bg-yellow-50 dark:bg-yellow-500/10' },
  { id: 5, type: 'report',   text: 'Report filed — Possible scam listing',  time: '2 hrs ago',  icon: Flag,         color: 'text-red-500',     bg: 'bg-red-50 dark:bg-red-500/10' },
];

/* ── Mock SLA compliance data ──────────────────────────── */
const MOCK_SLA_COMPLIANCE = {
  P1: { total: 14, met: 12, breached: 2 },
  P2: { total: 38, met: 35, breached: 3 },
  P3: { total: 92, met: 87, breached: 5 },
  P4: { total: 156, met: 152, breached: 4 },
};

/* ── Mock escalation summary ──────────────────────────── */
const MOCK_ESCALATION_SUMMARY = {
  open: 3, inProgress: 2, resolvedToday: 7, avgResolutionHrs: 4.2,
};

/* ── Mock team performance (for L0/L1 roles) ────────────── */
const MOCK_TEAM_PERFORMANCE = [
  { name: 'Fatima Bello',   role: 'support_admin',       actionsToday: 47, avgResponseMin: 8,  csat: 4.6 },
  { name: 'Ada Nnamdi',     role: 'moderator',           actionsToday: 31, avgResponseMin: 12, csat: 4.4 },
  { name: 'Chidi Eze',      role: 'verification_admin',  actionsToday: 22, avgResponseMin: 15, csat: 4.7 },
  { name: 'Mary Okonkwo',   role: 'operations_admin',    actionsToday: 18, avgResponseMin: 22, csat: 4.3 },
  { name: 'John Adeyemi',   role: 'finance_admin',       actionsToday: 15, avgResponseMin: 30, csat: 4.5 },
  { name: 'Emeka Uche',     role: 'compliance_admin',    actionsToday: 11, avgResponseMin: 45, csat: 4.8 },
];

/* ── Queue key → admin page route ────────────────────────── */
const QUEUE_ROUTES = {
  escalated_reports: '/provider/reports',
  pending_payouts:   '/provider/payments',
  flagged_users:     '/provider/users',
  pending_listings:  '/provider/moderation',
  system_health:     '/provider/platform-settings',
  escrow_releases:   '/provider/payments',
  refund_requests:   '/provider/payments',
  revenue_today:     '/provider/analytics',
  active_disputes:   '/provider/bookings',
  open_reports:      '/provider/reports',
  flagged_listings:  '/provider/moderation',
  pending_kyc:       '/provider/kyc',
  docs_requested:    '/provider/verification',
  expired_docs:      '/provider/verification',
  urgent_tickets:    '/provider/tickets',
  open_tickets:      '/provider/tickets',
  escalated_tickets: '/provider/tickets',
  high_risk_users:   '/provider/users',
  frozen_accounts:   '/provider/users',
  audit_anomalies:   '/provider/audit',
};

export default function AdminDashboard() {
  const { t } = useTranslation('admin');
  const { user } = useAuth();
  const navigate = useNavigate();
  const role = normalizeRole(user?.role);

  const [stats, setStats]               = useState(MOCK_STATS);
  const [activity, setActivity]         = useState(MOCK_ACTIVITY);
  const [queueCounts, setQueueCounts]   = useState(MOCK_QUEUE_COUNTS);
  const [loading, setLoading]           = useState(true);
  const [usingFallback, setUsingFallback] = useState(false);

  /* ── Role-specific queue items ───────────────────────── */
  const queueItems = useMemo(() => {
    const roleQueues = ADMIN_QUEUES[role] || ADMIN_QUEUES.super_admin;
    return roleQueues.map(q => ({
      ...q,
      count: queueCounts[q.key] ?? 0,
      Icon:  QUEUE_ICONS[q.key] || AlertCircle,
      style: PRIORITY_STYLES[q.priority] || PRIORITY_STYLES.normal,
    }));
  }, [role, queueCounts]);

  const dashTitle = ROLE_DASHBOARD_LABELS[role] || 'Admin Dashboard';

  useEffect(() => {
    document.title = `${dashTitle} — Aurban`;
  }, [dashTitle]);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      try {
        const res = await adminService.getPlatformAnalytics({ period: '30d' });
        if (!cancelled && res.success && res.stats) {
          setStats(res.stats);
          if (res.activity) setActivity(res.activity);
          if (res.queueCounts) setQueueCounts(res.queueCounts);
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

  return (
    <div className="pb-8 space-y-5">
      {/* ── Fallback banner ──────────────────────────────── */}
      {usingFallback && (
        <div className="flex items-center gap-2 px-4 py-2.5 text-xs font-medium text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-500/10 rounded-xl">
          <AlertCircle size={14} className="shrink-0" />
          {t('fallback', 'Could not reach server. Showing cached data.')}
        </div>
      )}

      {/* ── Page header ──────────────────────────────────── */}
      <div>
        <h1 className="text-xl font-bold font-display text-brand-charcoal-dark dark:text-white">
          {dashTitle}
        </h1>
        <p className="text-sm text-gray-400 mt-0.5">
          Welcome back, {user?.name?.split(' ')[0] || ROLE_LABELS[role]}
        </p>
      </div>

      {/* ═══ PRIORITY QUEUE — Role-specific, always first ═══ */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <h2 className="text-sm font-semibold text-brand-charcoal-dark dark:text-white">
            Your Queue
          </h2>
          <span className="px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider rounded bg-brand-gold/10 text-brand-gold">
            {ROLE_LABELS[role]}
          </span>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-24 bg-white dark:bg-gray-900 rounded-2xl shadow-card animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {queueItems.map(({ key, label, count, priority, Icon, style }) => (
              <button
                key={key}
                onClick={() => navigate(QUEUE_ROUTES[key] || '/provider')}
                className={`relative flex items-start gap-3 p-4 text-left border transition-shadow rounded-2xl shadow-card hover:shadow-md group ${style.border} ${style.bg}`}
              >
                {/* Critical pulse dot */}
                {priority === 'critical' && count > 0 && (
                  <span className={`absolute top-3 right-3 w-2 h-2 rounded-full ${style.dot}`} />
                )}

                <div className={`flex items-center justify-center w-10 h-10 rounded-xl shrink-0 ${style.iconBg}`}>
                  <Icon size={18} className={style.icon} />
                </div>

                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-brand-charcoal-dark dark:text-white truncate mb-0.5">
                    {label}
                  </p>
                  <div className="flex items-center gap-2">
                    <span className={`inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full text-[10px] font-bold ${style.badge}`}>
                      {count}
                    </span>
                    <span className="text-[10px] text-gray-400 uppercase tracking-wider font-medium">
                      {style.label}
                    </span>
                  </div>
                </div>

                <ArrowUpRight size={14} className="mt-1 text-gray-300 transition-colors shrink-0 group-hover:text-brand-gold" />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* ═══ STAT CARDS — General platform overview ═══ */}
      {loading ? (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-28 bg-white dark:bg-gray-900 rounded-2xl shadow-card animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          {stats.map((s) => {
            const Icon = s.icon;
            const card = (
              <div key={s.key} className="p-4 bg-white dark:bg-gray-900 rounded-2xl shadow-card">
                <div className={`w-8 h-8 ${s.bg} rounded-lg flex items-center justify-center mb-2`}>
                  <Icon size={16} className={s.color} />
                </div>
                <p className="text-lg font-bold text-brand-charcoal-dark dark:text-white">{s.value}</p>
                <p className="text-xs text-gray-400">{t(`dashboard.stats.${s.key}`, s.label)}</p>
              </div>
            );

            if (s.key === 'revenue') {
              return (
                <RequirePermission key={s.key} permission="dashboard:view_revenue">
                  {card}
                </RequirePermission>
              );
            }

            return card;
          })}
        </div>
      )}

      {/* ═══ SLA COMPLIANCE + ESCALATION SUMMARY (side by side) ═══ */}
      {!loading && (
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
          {/* ── SLA Compliance ──────────────────────────────── */}
          <div className="p-4 bg-white dark:bg-gray-900 rounded-2xl shadow-card sm:p-5">
            <div className="flex items-center gap-2 mb-4">
              <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-500/10">
                <Clock size={16} className="text-blue-500" />
              </div>
              <h2 className="text-sm font-semibold text-brand-charcoal-dark dark:text-white">
                SLA Compliance
              </h2>
            </div>

            <div className="space-y-3">
              {Object.entries(SLA_TARGETS).map(([priority, sla]) => {
                const data = MOCK_SLA_COMPLIANCE[priority];
                if (!data) return null;
                const pct = data.total > 0 ? Math.round((data.met / data.total) * 100) : 100;
                const colors = {
                  P1: { bar: 'bg-red-500',    bg: 'bg-red-100 dark:bg-red-500/10',    text: 'text-red-500' },
                  P2: { bar: 'bg-amber-500',  bg: 'bg-amber-100 dark:bg-amber-500/10', text: 'text-amber-500' },
                  P3: { bar: 'bg-blue-500',   bg: 'bg-blue-100 dark:bg-blue-500/10',   text: 'text-blue-500' },
                  P4: { bar: 'bg-gray-400',   bg: 'bg-gray-100 dark:bg-gray-500/10',   text: 'text-gray-400' },
                };
                const c = colors[priority] || colors.P4;
                const targetLabel = sla.firstResponseMs < 3600000
                  ? `${Math.round(sla.firstResponseMs / 60000)}min`
                  : `${Math.round(sla.firstResponseMs / 3600000)}hr`;

                return (
                  <div key={priority}>
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <span className={`px-1.5 py-0.5 text-[9px] font-bold rounded ${c.bg} ${c.text}`}>
                          {priority}
                        </span>
                        <span className="text-xs text-gray-500">{sla.label}</span>
                        <span className="text-[10px] text-gray-400">({targetLabel} target)</span>
                      </div>
                      <span className={`text-xs font-bold ${pct >= 90 ? 'text-emerald-500' : pct >= 75 ? 'text-amber-500' : 'text-red-500'}`}>
                        {pct}%
                      </span>
                    </div>
                    <div className="h-1.5 rounded-full bg-gray-100 dark:bg-white/5 overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${pct >= 90 ? 'bg-emerald-500' : pct >= 75 ? 'bg-amber-500' : c.bar}`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <div className="flex justify-between mt-0.5">
                      <span className="text-[9px] text-gray-400">{data.met}/{data.total} met</span>
                      {data.breached > 0 && (
                        <span className="text-[9px] text-red-400 font-medium">{data.breached} breached</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* ── Escalation Summary ──────────────────────────── */}
          <div className="p-4 bg-white dark:bg-gray-900 rounded-2xl shadow-card sm:p-5">
            <div className="flex items-center gap-2 mb-4">
              <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-amber-50 dark:bg-amber-500/10">
                <ArrowUpRight size={16} className="text-amber-500" />
              </div>
              <h2 className="text-sm font-semibold text-brand-charcoal-dark dark:text-white">
                Escalations
              </h2>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 rounded-xl bg-red-50 dark:bg-red-500/5 border border-red-100 dark:border-red-500/10">
                <p className="text-lg font-bold text-red-600 dark:text-red-400">{MOCK_ESCALATION_SUMMARY.open}</p>
                <p className="text-[10px] text-red-500/70">Open</p>
              </div>
              <div className="p-3 rounded-xl bg-blue-50 dark:bg-blue-500/5 border border-blue-100 dark:border-blue-500/10">
                <p className="text-lg font-bold text-blue-600 dark:text-blue-400">{MOCK_ESCALATION_SUMMARY.inProgress}</p>
                <p className="text-[10px] text-blue-500/70">In Progress</p>
              </div>
              <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-500/5 border border-emerald-100 dark:border-emerald-500/10">
                <p className="text-lg font-bold text-emerald-600 dark:text-emerald-400">{MOCK_ESCALATION_SUMMARY.resolvedToday}</p>
                <p className="text-[10px] text-emerald-500/70">Resolved Today</p>
              </div>
              <div className="p-3 rounded-xl bg-purple-50 dark:bg-purple-500/5 border border-purple-100 dark:border-purple-500/10">
                <p className="text-lg font-bold text-purple-600 dark:text-purple-400">{MOCK_ESCALATION_SUMMARY.avgResolutionHrs}h</p>
                <p className="text-[10px] text-purple-500/70">Avg Resolution</p>
              </div>
            </div>

            <button
              onClick={() => navigate('/provider/reports')}
              className="flex items-center justify-center w-full gap-1.5 px-3 py-2.5 mt-3 text-xs font-semibold transition-colors rounded-xl text-brand-gold bg-brand-gold/10 hover:bg-brand-gold/20"
            >
              <ArrowUpRight size={14} />
              View All Escalations
            </button>
          </div>
        </div>
      )}

      {/* ═══ TEAM PERFORMANCE (L0/L1 roles only) ═══ */}
      {!loading && ROLE_LEVELS[role] !== undefined && ROLE_LEVELS[role] <= 1 && hasPermission(role, 'quality:review_decisions') && (
        <div className="p-4 bg-white dark:bg-gray-900 rounded-2xl shadow-card sm:p-5">
          <div className="flex items-center gap-2 mb-4">
            <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-purple-50 dark:bg-purple-500/10">
              <Users size={16} className="text-purple-500" />
            </div>
            <h2 className="text-sm font-semibold text-brand-charcoal-dark dark:text-white">
              Team Performance — Today
            </h2>
          </div>

          {/* Table header */}
          <div className="hidden sm:grid grid-cols-5 gap-3 px-3 py-2 mb-1 text-[10px] font-semibold text-gray-400 uppercase tracking-wider">
            <span className="col-span-2">Admin</span>
            <span className="text-center">Actions</span>
            <span className="text-center">Avg Response</span>
            <span className="text-center">CSAT</span>
          </div>

          <div className="space-y-1.5">
            {MOCK_TEAM_PERFORMANCE.map((member) => (
              <div key={member.name} className="grid grid-cols-1 sm:grid-cols-5 gap-2 sm:gap-3 items-center p-3 rounded-xl hover:bg-gray-50 dark:hover:bg-white/5 transition-colors">
                <div className="col-span-2 flex items-center gap-2 min-w-0">
                  <div className="flex items-center justify-center w-7 h-7 rounded-full bg-brand-gold/10 shrink-0">
                    <span className="text-[10px] font-bold text-brand-gold uppercase">
                      {member.name.split(' ').map(n => n[0]).join('')}
                    </span>
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-medium text-brand-charcoal-dark dark:text-white truncate">{member.name}</p>
                    <p className="text-[9px] text-gray-400">{ROLE_LABELS[member.role]}</p>
                  </div>
                </div>
                <p className="text-center text-xs font-semibold text-brand-charcoal-dark dark:text-white">{member.actionsToday}</p>
                <p className={`text-center text-xs font-medium ${member.avgResponseMin <= 15 ? 'text-emerald-500' : member.avgResponseMin <= 30 ? 'text-amber-500' : 'text-red-400'}`}>
                  {member.avgResponseMin}min
                </p>
                <div className="flex items-center justify-center gap-1">
                  <span className="text-xs font-bold text-brand-charcoal-dark dark:text-white">{member.csat}</span>
                  <span className="text-[10px] text-amber-500">★</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ═══ RECENT ACTIVITY ═══ */}
      <div className="p-4 bg-white dark:bg-gray-900 rounded-2xl shadow-card sm:p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold text-brand-charcoal-dark dark:text-white">
            {t('dashboard.recentActivity', 'Recent Activity')}
          </h2>
          <span className="text-[10px] text-gray-400 uppercase tracking-wider font-semibold">Live</span>
        </div>

        <div className="space-y-2">
          {activity.map((a) => {
            const Icon = a.icon;
            return (
              <div key={a.id} className="flex items-center gap-3 p-2 transition-colors rounded-xl hover:bg-gray-50 dark:hover:bg-white/5">
                <div className={`w-8 h-8 ${a.bg} rounded-lg flex items-center justify-center shrink-0`}>
                  <Icon size={14} className={a.color} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-brand-charcoal-dark dark:text-white truncate">{a.text}</p>
                  <p className="text-[10px] text-gray-400">{a.time}</p>
                </div>
                <ArrowUpRight size={14} className="text-gray-300 shrink-0" />
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
