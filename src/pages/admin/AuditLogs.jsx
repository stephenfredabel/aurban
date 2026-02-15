import { useState, useEffect, useMemo } from 'react';
import {
  Search, Clock, Download, Filter, User, Eye,
  AlertCircle, ChevronLeft, ChevronRight, ChevronDown,
  Shield, FileText, CreditCard, Settings, LogIn,
  Globe, ShoppingCart, MessageSquare, UserPlus, Heart,
  MapPin, Package, Calendar, Star, Smartphone, Monitor,
  X, RefreshCw,
} from 'lucide-react';
import RequirePermission from '../../components/admin/RequirePermission.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import { getAuditLogs, AUDIT_ACTIONS } from '../../services/audit.service.js';

/* ════════════════════════════════════════════════════════════
   AUDIT LOGS — Comprehensive platform activity timeline
   Route: /provider/audit   Permission: audit:view

   Categories:
   • Public/Visitors — page views, searches, API calls
   • Users — signups, logins, profile, wishlist, bookings
   • Providers — listings, messages, payouts, reviews
   • Admins — all admin actions
   • System — automated events, cron jobs, errors

   Features:
   • Category tabs with count badges
   • Full-text search across all fields
   • Date range + admin/user filter
   • Severity levels (info, warning, critical)
   • Device/IP/location metadata
   • Export to JSON/CSV
   • Pagination
════════════════════════════════════════════════════════════ */

/* ── Comprehensive mock data ──────────────────────────── */
const MOCK_LOGS = [
  // Admin actions
  { id: 'al01', category: 'admin',    action: 'admin.suspend_user',     actor: 'Mary Okonkwo',       actorRole: 'operations_admin', severity: 'warning',  target: 'User: Funke Adeyemi (u3)',     details: 'Suspended user for fraudulent listing activity',                         ip: '102.89.23.xx',  device: 'Chrome/Desktop',  location: 'Lagos, NG',    timestamp: '2026-02-13T14:32:00Z' },
  { id: 'al02', category: 'admin',    action: 'admin.approve_listing',  actor: 'Ada Nnamdi',         actorRole: 'moderator',        severity: 'info',     target: 'Listing: 3BR Lekki Flat (l22)', details: 'Approved 3-bedroom apartment listing after photo review',                timestamp: '2026-02-13T11:15:00Z' },
  { id: 'al03', category: 'admin',    action: 'admin.verify_provider',  actor: 'Chidi Eze',          actorRole: 'verification_admin', severity: 'info',   target: 'Provider: Oluwaseun Ajayi (u8)', details: 'Provider verification approved — all documents valid (NIN, CAC, utility bill)', ip: '102.89.45.xx', device: 'Firefox/Desktop', location: 'Abuja, NG', timestamp: '2026-02-13T09:20:00Z' },
  { id: 'al04', category: 'admin',    action: 'admin.flag_risk',        actor: 'Emeka Uche',         actorRole: 'compliance_admin', severity: 'critical', target: 'User: Ibrahim Musa (u12)',      details: 'Flagged as high risk — mismatched NIN and BVN data, possible identity fraud', ip: '102.89.78.xx', device: 'Chrome/Desktop', location: 'Lagos, NG', timestamp: '2026-02-12T17:45:00Z' },
  { id: 'al05', category: 'admin',    action: 'admin.escalate_ticket',  actor: 'Fatima Bello',       actorRole: 'support_admin',    severity: 'warning',  target: 'Ticket: #TKT-0045',             details: 'Escalated to operations — payment dispute requires manual escrow review',    ip: '102.89.12.xx', device: 'Safari/macOS',   location: 'Kano, NG',    timestamp: '2026-02-12T09:00:00Z' },
  { id: 'al06', category: 'admin',    action: 'admin.release_escrow',   actor: 'John Adeyemi',       actorRole: 'finance_admin',    severity: 'critical', target: 'Payment: ₦2,450,000 (p9)',      details: 'Released escrow payment to host after booking completion confirmed',         ip: '102.89.34.xx', device: 'Chrome/Desktop', location: 'Lagos, NG',   timestamp: '2026-02-11T16:30:00Z' },
  { id: 'al07', category: 'admin',    action: 'admin.update_settings',  actor: 'Stephen Okoro',      actorRole: 'super_admin',      severity: 'critical', target: 'Platform Settings',              details: 'Updated commission rate from 5% to 4.5%, effective immediately',             ip: '102.89.01.xx', device: 'Chrome/Desktop', location: 'Lagos, NG',   timestamp: '2026-02-11T10:00:00Z' },
  { id: 'al08', category: 'admin',    action: 'admin.create_admin',     actor: 'Stephen Okoro',      actorRole: 'super_admin',      severity: 'critical', target: 'Admin: Fatima Bello',            details: 'Created admin account fatima@aurban.com with role Support Admin',            ip: '102.89.01.xx', device: 'Chrome/Desktop', location: 'Lagos, NG',   timestamp: '2026-02-10T08:00:00Z' },

  // User actions
  { id: 'al09', category: 'user',     action: 'user.signup',            actor: 'Amina Suleiman',     actorRole: 'user',             severity: 'info',     target: 'New Account',                   details: 'Email signup via mobile app — email verification sent',                      ip: '105.112.xx.xx', device: 'Mobile/Android',  location: 'Abuja, NG',   timestamp: '2026-02-13T13:45:00Z' },
  { id: 'al10', category: 'user',     action: 'user.login',             actor: 'Tunde Bakare',       actorRole: 'user',             severity: 'info',     target: 'Session',                       details: 'Successful login via email/password',                                        ip: '102.89.56.xx', device: 'Chrome/Desktop',  location: 'Lagos, NG',   timestamp: '2026-02-13T12:30:00Z' },
  { id: 'al11', category: 'user',     action: 'user.login_failed',      actor: 'unknown@test.com',   actorRole: 'guest',            severity: 'warning',  target: 'Auth Attempt',                  details: 'Failed login attempt — wrong password (3rd attempt)',                        ip: '41.58.xx.xx',  device: 'Chrome/Mobile',   location: 'PH, NG',     timestamp: '2026-02-13T11:20:00Z' },
  { id: 'al12', category: 'user',     action: 'user.profile_update',    actor: 'Chinwe Eze',         actorRole: 'user',             severity: 'info',     target: 'Profile',                       details: 'Updated profile photo and bio',                                              ip: '102.89.89.xx', device: 'Safari/iPhone',    location: 'Enugu, NG',   timestamp: '2026-02-13T10:15:00Z' },
  { id: 'al13', category: 'user',     action: 'user.wishlist_add',      actor: 'Adaeze Obi',         actorRole: 'user',             severity: 'info',     target: 'Listing: 2BR Ikoyi (l15)',      details: 'Added to wishlist',                                                          ip: '105.112.xx.xx', device: 'Mobile/iOS',     location: 'Lagos, NG',   timestamp: '2026-02-13T09:00:00Z' },
  { id: 'al14', category: 'user',     action: 'user.booking_create',    actor: 'Ibrahim Musa',       actorRole: 'user',             severity: 'info',     target: 'Booking: #BK-1234',             details: 'Booked property inspection for 3BR Lekki Flat — Feb 18, 2pm',                ip: '102.89.22.xx', device: 'Chrome/Desktop',  location: 'Abuja, NG',   timestamp: '2026-02-12T15:00:00Z' },
  { id: 'al15', category: 'user',     action: 'user.review_submit',     actor: 'Funke Adeyemi',      actorRole: 'user',             severity: 'info',     target: 'Provider: Emeka Nwosu',         details: 'Submitted 4-star review for property listing experience',                    ip: '102.89.33.xx', device: 'Firefox/Desktop', location: 'Ibadan, NG',  timestamp: '2026-02-12T11:30:00Z' },

  // Provider actions
  { id: 'al16', category: 'provider', action: 'provider.listing_create', actor: 'Emeka Nwosu',       actorRole: 'host',             severity: 'info',     target: 'Listing: Land Ibeju-Lekki',     details: 'Created new land listing — 500sqm plot, ₦15M asking price',                  ip: '102.89.44.xx', device: 'Chrome/Desktop',  location: 'Lagos, NG',   timestamp: '2026-02-13T08:30:00Z' },
  { id: 'al17', category: 'provider', action: 'provider.listing_edit',   actor: 'Oluwaseun Ajayi',   actorRole: 'agent',            severity: 'info',     target: 'Listing: 4BR Duplex (l08)',     details: 'Updated price from ₦85M to ₦78M, added 5 new photos',                       ip: '102.89.55.xx', device: 'Safari/macOS',    location: 'Lagos, NG',   timestamp: '2026-02-12T14:20:00Z' },
  { id: 'al18', category: 'provider', action: 'provider.payout_request', actor: 'Tunde Bakare',      actorRole: 'host',             severity: 'info',     target: 'Payout: ₦340,000',              details: 'Requested payout to GTBank ****4521 — processing in 24-48hrs',               ip: '102.89.67.xx', device: 'Chrome/Mobile',   location: 'Lagos, NG',   timestamp: '2026-02-11T09:45:00Z' },
  { id: 'al19', category: 'provider', action: 'provider.message_send',   actor: 'Chinwe Eze',        actorRole: 'service_provider', severity: 'info',     target: 'Chat: Adaeze Obi',              details: 'Sent message regarding plumbing service quote',                              ip: '102.89.78.xx', device: 'Mobile/Android',  location: 'Enugu, NG',   timestamp: '2026-02-11T08:15:00Z' },
  { id: 'al20', category: 'provider', action: 'provider.verification_submit', actor: 'Amaka Johnson', actorRole: 'host',            severity: 'info',     target: 'Verification',                  details: 'Submitted NIN, CAC certificate, and utility bill for verification',          ip: '105.112.xx.xx', device: 'Chrome/Desktop', location: 'Abuja, NG',   timestamp: '2026-02-10T16:00:00Z' },

  // Public/Visitor actions
  { id: 'al21', category: 'public',   action: 'public.page_view',       actor: 'Anonymous',          actorRole: 'visitor',          severity: 'info',     target: '/properties',                   details: 'Viewed properties listing page — 2,340 properties loaded',                   ip: '41.58.xx.xx',  device: 'Chrome/Mobile',   location: 'Lagos, NG',   timestamp: '2026-02-13T15:00:00Z' },
  { id: 'al22', category: 'public',   action: 'public.search',          actor: 'Anonymous',          actorRole: 'visitor',          severity: 'info',     target: 'Search: "3 bedroom lekki"',     details: 'Property search — 48 results returned in 120ms',                             ip: '105.112.xx.xx', device: 'Safari/iPhone',  location: 'Lagos, NG',   timestamp: '2026-02-13T14:50:00Z' },
  { id: 'al23', category: 'public',   action: 'public.listing_view',    actor: 'Anonymous',          actorRole: 'visitor',          severity: 'info',     target: 'Listing: 3BR Lekki Flat (l22)', details: 'Viewed listing detail page — spent 4m 12s, clicked contact',                  ip: '102.89.90.xx', device: 'Firefox/Desktop', location: 'Abuja, NG',   timestamp: '2026-02-13T14:30:00Z' },
  { id: 'al24', category: 'public',   action: 'public.api_call',        actor: 'System',             actorRole: 'api',              severity: 'info',     target: 'GET /api/v1/properties',        details: 'API call from mobile app — 200 OK, 85ms response time',                      ip: '10.0.xx.xx',   device: 'API/Mobile',     location: 'Server',      timestamp: '2026-02-13T14:00:00Z' },

  // System events
  { id: 'al25', category: 'system',   action: 'system.backup_complete', actor: 'System',             actorRole: 'system',           severity: 'info',     target: 'Database',                      details: 'Daily database backup completed — 2.4GB compressed, stored in S3',           ip: 'internal',     device: 'Cron/Server',     location: 'AWS Lagos',   timestamp: '2026-02-13T03:00:00Z' },
  { id: 'al26', category: 'system',   action: 'system.error',           actor: 'System',             actorRole: 'system',           severity: 'critical', target: 'Payment Gateway',               details: 'Paystack webhook timeout — 3 failed deliveries, auto-retry scheduled',       ip: 'internal',     device: 'Webhook/Server',  location: 'AWS Lagos',   timestamp: '2026-02-12T22:15:00Z' },
  { id: 'al27', category: 'system',   action: 'system.rate_limit',      actor: '41.58.xx.xx',        actorRole: 'system',           severity: 'warning',  target: 'API Rate Limit',                details: 'IP rate limited — exceeded 100 requests/minute on /api/v1/search',           ip: '41.58.xx.xx',  device: 'Unknown',         location: 'PH, NG',     timestamp: '2026-02-12T20:30:00Z' },
];

const CATEGORIES = {
  all:      { label: 'All Activity',  icon: Globe,          color: 'text-gray-500',    bg: 'bg-gray-100 dark:bg-white/5' },
  admin:    { label: 'Admin',         icon: Shield,         color: 'text-red-500',     bg: 'bg-red-50 dark:bg-red-500/10' },
  user:     { label: 'Users',         icon: User,           color: 'text-blue-500',    bg: 'bg-blue-50 dark:bg-blue-500/10' },
  provider: { label: 'Providers',     icon: Package,        color: 'text-emerald-500', bg: 'bg-emerald-50 dark:bg-emerald-500/10' },
  public:   { label: 'Public',        icon: Eye,            color: 'text-purple-500',  bg: 'bg-purple-50 dark:bg-purple-500/10' },
  system:   { label: 'System',        icon: Monitor,        color: 'text-gray-500',    bg: 'bg-gray-100 dark:bg-white/5' },
};

const SEVERITY_STYLES = {
  info:     { dot: 'bg-blue-400',   label: 'Info',     text: 'text-blue-600' },
  warning:  { dot: 'bg-amber-400',  label: 'Warning',  text: 'text-amber-600' },
  critical: { dot: 'bg-red-500',    label: 'Critical', text: 'text-red-600' },
};

const ACTION_ICONS = {
  'admin.suspend_user': Shield, 'admin.approve_listing': FileText, 'admin.verify_provider': Shield,
  'admin.flag_risk': AlertCircle, 'admin.escalate_ticket': MessageSquare, 'admin.release_escrow': CreditCard,
  'admin.update_settings': Settings, 'admin.create_admin': UserPlus,
  'user.signup': UserPlus, 'user.login': LogIn, 'user.login_failed': AlertCircle,
  'user.profile_update': User, 'user.wishlist_add': Heart, 'user.booking_create': Calendar,
  'user.review_submit': Star,
  'provider.listing_create': Package, 'provider.listing_edit': FileText, 'provider.payout_request': CreditCard,
  'provider.message_send': MessageSquare, 'provider.verification_submit': Shield,
  'public.page_view': Eye, 'public.search': Search, 'public.listing_view': Eye, 'public.api_call': Globe,
  'system.backup_complete': RefreshCw, 'system.error': AlertCircle, 'system.rate_limit': Shield,
};

const PAGE_SIZE = 8;

function formatTimestamp(ts) {
  const d = new Date(ts);
  const now = new Date();
  const diffMin = Math.floor((now - d) / 60000);
  if (diffMin < 60) return `${diffMin}m ago`;
  if (diffMin < 1440) return `${Math.floor(diffMin / 60)}h ago`;
  return d.toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: 'numeric' })
    + ' ' + d.toLocaleTimeString('en-NG', { hour: '2-digit', minute: '2-digit' });
}

function formatAction(action) {
  return action.split('.').pop().replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
}

export default function AuditLogs() {
  const { user } = useAuth();

  const [logs, setLogs]                   = useState(MOCK_LOGS);
  const [search, setSearch]               = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [severityFilter, setSeverityFilter] = useState('all');
  const [actorFilter, setActorFilter]     = useState('');
  const [dateFrom, setDateFrom]           = useState('');
  const [dateTo, setDateTo]               = useState('');
  const [page, setPage]                   = useState(1);
  const [loading, setLoading]             = useState(true);
  const [showFilters, setShowFilters]     = useState(false);

  useEffect(() => { document.title = 'Audit Logs — Aurban'; }, []);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      try {
        const res = await getAuditLogs({ page: 1, limit: 500 });
        if (!cancelled && res.success && res.logs?.length) setLogs(res.logs);
      } catch { /* keep mock */ }
      if (!cancelled) setLoading(false);
    }
    load();
    return () => { cancelled = true; };
  }, []);

  /* ── Category counts ───────────────────────────────────── */
  const categoryCounts = useMemo(() => {
    const counts = { all: logs.length };
    logs.forEach(l => { counts[l.category] = (counts[l.category] || 0) + 1; });
    return counts;
  }, [logs]);

  /* ── Filtering ─────────────────────────────────────────── */
  const filtered = useMemo(() => {
    return logs.filter(l => {
      if (categoryFilter !== 'all' && l.category !== categoryFilter) return false;
      if (severityFilter !== 'all' && l.severity !== severityFilter) return false;
      if (actorFilter && !l.actor?.toLowerCase().includes(actorFilter.toLowerCase())) return false;
      if (dateFrom && new Date(l.timestamp) < new Date(dateFrom)) return false;
      if (dateTo && new Date(l.timestamp) > new Date(dateTo + 'T23:59:59Z')) return false;
      if (search) {
        const q = search.toLowerCase();
        return (l.details?.toLowerCase().includes(q) || l.actor?.toLowerCase().includes(q) ||
          l.action?.toLowerCase().includes(q) || l.target?.toLowerCase().includes(q));
      }
      return true;
    });
  }, [logs, categoryFilter, severityFilter, actorFilter, dateFrom, dateTo, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  /* ── Export ────────────────────────────────────────────── */
  const handleExport = (format) => {
    if (format === 'json') {
      const blob = new Blob([JSON.stringify(filtered, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a'); a.href = url;
      a.download = `audit-logs-${new Date().toISOString().slice(0, 10)}.json`;
      a.click(); URL.revokeObjectURL(url);
    } else {
      const headers = 'Timestamp,Category,Action,Actor,Role,Severity,Target,Details,IP,Device,Location\n';
      const rows = filtered.map(l =>
        `"${l.timestamp}","${l.category}","${l.action}","${l.actor}","${l.actorRole}","${l.severity}","${l.target}","${l.details}","${l.ip || ''}","${l.device || ''}","${l.location || ''}"`
      ).join('\n');
      const blob = new Blob([headers + rows], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a'); a.href = url;
      a.download = `audit-logs-${new Date().toISOString().slice(0, 10)}.csv`;
      a.click(); URL.revokeObjectURL(url);
    }
  };

  const clearFilters = () => {
    setSearch(''); setCategoryFilter('all'); setSeverityFilter('all');
    setActorFilter(''); setDateFrom(''); setDateTo(''); setPage(1);
  };

  const hasActiveFilters = search || categoryFilter !== 'all' || severityFilter !== 'all' || actorFilter || dateFrom || dateTo;

  return (
    <RequirePermission permission="audit:view">
      <div className="pb-8 space-y-5">

        {/* ── Header ───────────────────────────────────────────── */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-xl font-bold font-display text-brand-charcoal-dark dark:text-white">Audit Logs</h1>
            <p className="text-sm text-gray-400 mt-0.5">
              {filtered.length.toLocaleString()} events — complete platform activity timeline
            </p>
          </div>
          <RequirePermission permission="audit:export">
            <div className="flex gap-2">
              <button onClick={() => handleExport('csv')}
                className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-brand-charcoal-dark dark:text-white bg-gray-100 dark:bg-white/5 rounded-xl hover:bg-gray-200 dark:hover:bg-white/10 transition-colors">
                <Download size={13} /> CSV
              </button>
              <button onClick={() => handleExport('json')}
                className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-brand-charcoal-dark dark:text-white bg-gray-100 dark:bg-white/5 rounded-xl hover:bg-gray-200 dark:hover:bg-white/10 transition-colors">
                <Download size={13} /> JSON
              </button>
            </div>
          </RequirePermission>
        </div>

        {/* ── Category tabs ──────────────────────────────────── */}
        <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1">
          {Object.entries(CATEGORIES).map(([key, cat]) => {
            const count = categoryCounts[key] || 0;
            const Icon = cat.icon;
            return (
              <button key={key} onClick={() => { setCategoryFilter(key); setPage(1); }}
                className={`flex items-center gap-1.5 text-xs font-medium px-3 py-2 rounded-xl transition-colors whitespace-nowrap shrink-0
                  ${categoryFilter === key
                    ? 'bg-brand-charcoal-dark dark:bg-white text-white dark:text-gray-900'
                    : 'bg-gray-100 dark:bg-white/5 text-gray-500 hover:bg-gray-200 dark:hover:bg-white/10'
                  }`}>
                <Icon size={13} />
                {cat.label}
                <span className={`min-w-[18px] h-[18px] px-1 rounded-full text-[9px] font-bold flex items-center justify-center ${
                  categoryFilter === key ? 'bg-white/20 text-white dark:bg-gray-900/30 dark:text-gray-200' : 'bg-gray-200 dark:bg-white/10 text-gray-500'
                }`}>{count}</span>
              </button>
            );
          })}
        </div>

        {/* ── Search ───────────────────────────────────────────── */}
        <div className="flex flex-col gap-3 sm:flex-row">
          <div className="relative flex-1">
            <Search size={16} className="absolute text-gray-400 -translate-y-1/2 left-3 top-1/2" />
            <input type="text" placeholder="Search actions, actors, targets, details..."
              value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              className="w-full py-2.5 pl-10 pr-4 text-sm bg-white dark:bg-gray-900 border border-gray-200 dark:border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-gold/40 text-brand-charcoal-dark dark:text-white placeholder-gray-400" />
          </div>
          <button onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium rounded-xl border transition-colors ${
              hasActiveFilters ? 'border-brand-gold bg-brand-gold/5 text-brand-gold' : 'border-gray-200 dark:border-white/10 text-gray-500 hover:bg-gray-50 dark:hover:bg-white/5'
            }`}>
            <Filter size={14} />
            Filters
            {hasActiveFilters && <span className="w-2 h-2 bg-brand-gold rounded-full" />}
          </button>
        </div>

        {/* ── Advanced filters ────────────────────────────────── */}
        {showFilters && (
          <div className="p-4 bg-white dark:bg-gray-900 rounded-2xl shadow-card border border-gray-100 dark:border-white/10 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Advanced Filters</span>
              {hasActiveFilters && (
                <button onClick={clearFilters} className="text-xs text-brand-gold hover:underline">Clear all</button>
              )}
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <div className="relative">
                <select value={severityFilter} onChange={(e) => { setSeverityFilter(e.target.value); setPage(1); }}
                  className="px-3 py-1.5 text-xs bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-lg text-brand-charcoal-dark dark:text-white appearance-none pr-7 focus:outline-none">
                  <option value="all">All Severity</option>
                  <option value="info">Info</option>
                  <option value="warning">Warning</option>
                  <option value="critical">Critical</option>
                </select>
                <ChevronDown size={12} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
              </div>
              <input type="text" placeholder="Filter by actor..." value={actorFilter}
                onChange={(e) => { setActorFilter(e.target.value); setPage(1); }}
                className="px-3 py-1.5 text-xs bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-lg text-brand-charcoal-dark dark:text-white placeholder-gray-400 focus:outline-none min-w-[160px]" />
              <input type="date" value={dateFrom} onChange={(e) => { setDateFrom(e.target.value); setPage(1); }}
                className="px-3 py-1.5 text-xs bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-lg text-brand-charcoal-dark dark:text-white focus:outline-none" />
              <span className="text-xs text-gray-400">to</span>
              <input type="date" value={dateTo} onChange={(e) => { setDateTo(e.target.value); setPage(1); }}
                className="px-3 py-1.5 text-xs bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-lg text-brand-charcoal-dark dark:text-white focus:outline-none" />
            </div>
          </div>
        )}

        {/* ── Log entries ────────────────────────────────────── */}
        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-24 bg-white dark:bg-gray-900 rounded-2xl shadow-card animate-pulse" />
            ))}
          </div>
        ) : paged.length === 0 ? (
          <div className="py-16 text-center">
            <Clock size={36} className="mx-auto mb-3 text-gray-300 dark:text-gray-600" />
            <p className="text-sm font-semibold text-brand-charcoal-dark dark:text-white">No logs found</p>
            <p className="mt-1 text-xs text-gray-400">Try adjusting your filters or date range</p>
            {hasActiveFilters && (
              <button onClick={clearFilters} className="mt-3 text-xs font-medium text-brand-gold hover:underline">Clear all filters</button>
            )}
          </div>
        ) : (
          <div className="space-y-2">
            {paged.map((log) => {
              const cat = CATEGORIES[log.category] || CATEGORIES.all;
              const sev = SEVERITY_STYLES[log.severity] || SEVERITY_STYLES.info;
              const ActionIcon = ACTION_ICONS[log.action] || cat.icon;
              const CatIcon = cat.icon;

              return (
                <div key={log.id} className="p-4 bg-white dark:bg-gray-900 rounded-2xl shadow-card sm:p-5 hover:shadow-md transition-shadow">
                  <div className="flex items-start gap-3">
                    {/* Icon */}
                    <div className={`flex items-center justify-center w-10 h-10 rounded-xl shrink-0 ${cat.bg}`}>
                      <ActionIcon size={18} className={cat.color} />
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      {/* Tags row */}
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className={`text-[9px] px-2 py-0.5 rounded-full font-bold ${cat.bg} ${cat.color}`}>
                          {cat.label}
                        </span>
                        <span className={`text-[9px] px-2 py-0.5 rounded-full font-bold flex items-center gap-1 ${
                          log.severity === 'critical' ? 'bg-red-50 dark:bg-red-500/10 text-red-600' :
                          log.severity === 'warning' ? 'bg-amber-50 dark:bg-amber-500/10 text-amber-600' :
                          'bg-gray-100 dark:bg-white/5 text-gray-500'
                        }`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${sev.dot}`} />
                          {sev.label}
                        </span>
                        <span className="text-[9px] px-2 py-0.5 rounded-full font-medium bg-gray-100 dark:bg-white/5 text-gray-500">
                          {formatAction(log.action)}
                        </span>
                      </div>

                      {/* Details */}
                      <p className="mt-1.5 text-sm text-brand-charcoal-dark dark:text-white">{log.details}</p>

                      {/* Target */}
                      <p className="mt-1 text-xs text-gray-400">{log.target}</p>

                      {/* Metadata row */}
                      <div className="flex flex-wrap items-center gap-3 mt-2 text-[11px] text-gray-400">
                        <span className="flex items-center gap-1 font-medium">
                          <User size={10} /> {log.actor}
                          {log.actorRole && log.actorRole !== 'visitor' && log.actorRole !== 'system' && log.actorRole !== 'api' && log.actorRole !== 'guest' && (
                            <span className="px-1 py-0.5 rounded bg-gray-100 dark:bg-white/5 text-[9px]">{log.actorRole}</span>
                          )}
                        </span>
                        <span className="flex items-center gap-1"><Clock size={10} /> {formatTimestamp(log.timestamp)}</span>
                        {log.ip && <span className="flex items-center gap-1"><Globe size={10} /> {log.ip}</span>}
                        {log.device && <span className="flex items-center gap-1"><Smartphone size={10} /> {log.device}</span>}
                        {log.location && <span className="flex items-center gap-1"><MapPin size={10} /> {log.location}</span>}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* ── Pagination ─────────────────────────────────────── */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between">
            <p className="text-xs text-gray-400">
              Showing {(page - 1) * PAGE_SIZE + 1}-{Math.min(page * PAGE_SIZE, filtered.length)} of {filtered.length}
            </p>
            <div className="flex items-center gap-1.5">
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                className="p-2 text-gray-400 bg-white dark:bg-gray-900 rounded-lg shadow-card hover:text-brand-charcoal-dark dark:hover:text-white disabled:opacity-30 transition-colors">
                <ChevronLeft size={16} />
              </button>
              {Array.from({ length: Math.min(totalPages, 5) }).map((_, i) => {
                const pageNum = totalPages <= 5 ? i + 1 : page <= 3 ? i + 1 : page >= totalPages - 2 ? totalPages - 4 + i : page - 2 + i;
                return (
                  <button key={pageNum} onClick={() => setPage(pageNum)}
                    className={`w-8 h-8 rounded-lg text-xs font-bold transition-colors ${
                      page === pageNum ? 'bg-brand-charcoal-dark dark:bg-white text-white dark:text-gray-900'
                        : 'bg-white dark:bg-gray-900 text-gray-400 shadow-card hover:text-brand-charcoal-dark dark:hover:text-white'
                    }`}>{pageNum}</button>
                );
              })}
              <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
                className="p-2 text-gray-400 bg-white dark:bg-gray-900 rounded-lg shadow-card hover:text-brand-charcoal-dark dark:hover:text-white disabled:opacity-30 transition-colors">
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>
    </RequirePermission>
  );
}
