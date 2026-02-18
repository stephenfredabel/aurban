import { useState, useEffect, useMemo, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Search, MessageSquare, AlertTriangle, ArrowUpRight,
  XCircle, AlertCircle, ChevronLeft, ChevronRight,
  Clock, User, CheckCircle, Send, Star, Radio,
  ChevronDown, Shuffle, X,
} from 'lucide-react';
import RequirePermission from '../../components/admin/RequirePermission.jsx';
import ConfirmAction from '../../components/admin/ConfirmAction.jsx';
import useAdminAction from '../../hooks/useAdminAction.js';
import { AUDIT_ACTIONS } from '../../services/audit.service.js';
import * as adminService from '../../services/admin.service.js';
import { TICKET_CATEGORIES, SLA_TARGETS } from '../../utils/rbac.js';
import { useAuth } from '../../context/AuthContext.jsx';

/* ════════════════════════════════════════════════════════════
   SUPPORT TICKETS — Ticket queue with priority, SLA, CSAT,
   live-chat, routing & auto-escalation
   Route: /provider/tickets   Permission: tickets:view
════════════════════════════════════════════════════════════ */

/* ── Priority → SLA key mapping ──────────────────────────── */
const PRIORITY_TO_SLA = {
  urgent: 'P1',   // 15 min first response
  high:   'P2',   // 1 hr
  medium: 'P3',   // 4 hr
  low:    'P4',   // 24 hr
};

/* ── Seed-based pseudo-random (deterministic per ticket id) ─ */
function seededRandom(seed) {
  let h = 0;
  for (let i = 0; i < seed.length; i++) {
    h = Math.imul(31, h) + seed.charCodeAt(i) | 0;
  }
  return ((h >>> 0) % 100) / 100;
}

function mockCsatForTicket(ticketId) {
  // Returns 3, 4 or 5 stars deterministically
  const r = seededRandom(ticketId + '_csat');
  if (r < 0.25) return 3;
  if (r < 0.6)  return 4;
  return 5;
}

function mockCategoryForTicket(ticketId) {
  const keys = TICKET_CATEGORIES.map(c => c.key);
  const idx  = Math.abs(seededRandom(ticketId + '_cat') * keys.length | 0) % keys.length;
  return keys[idx];
}

/* ── Mock data (dev fallback) ────────────────────────────── */
const MOCK_TICKETS = [
  {
    id: 'tk1', subject: 'Unable to complete booking payment',
    userName: 'Adaeze Obi', userEmail: 'adaeze@example.com',
    priority: 'urgent', status: 'open', category: 'payment',
    createdAt: new Date(Date.now() - 12 * 60 * 1000).toISOString(), // 12 min ago — within P1 SLA
    lastResponse: new Date(Date.now() - 12 * 60 * 1000).toISOString(),
    messages: 3,
  },
  {
    id: 'tk2', subject: 'Listing photos not uploading correctly',
    userName: 'Emeka Nwosu', userEmail: 'emeka@example.com',
    priority: 'high', status: 'in_progress', category: 'listing',
    createdAt: new Date(Date.now() - 50 * 60 * 1000).toISOString(), // 50 min ago — nearing P2 SLA
    lastResponse: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
    messages: 5,
  },
  {
    id: 'tk3', subject: 'Request to change account email address',
    userName: 'Funke Adeyemi', userEmail: 'funke@example.com',
    priority: 'medium', status: 'open', category: 'account',
    createdAt: new Date(Date.now() - 3.5 * 60 * 60 * 1000).toISOString(), // 3.5hr — nearing P3
    lastResponse: new Date(Date.now() - 3.5 * 60 * 60 * 1000).toISOString(),
    messages: 1,
  },
  {
    id: 'tk4', subject: 'Dispute about property condition on check-in',
    userName: 'Ibrahim Musa', userEmail: 'ibrahim@example.com',
    priority: 'high', status: 'escalated', category: 'booking',
    createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2hr — breached P2
    lastResponse: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
    messages: 8,
  },
  {
    id: 'tk5', subject: 'How to become a verified agent',
    userName: 'Chinwe Eze', userEmail: 'chinwe@example.com',
    priority: 'low', status: 'resolved', category: 'provider',
    createdAt: new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString(),
    lastResponse: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
    messages: 4,
  },
  {
    id: 'tk6', subject: 'Refund not received after booking cancellation',
    userName: 'Tunde Bakare', userEmail: 'tunde@example.com',
    priority: 'urgent', status: 'in_progress', category: 'payment',
    createdAt: new Date(Date.now() - 20 * 60 * 1000).toISOString(), // 20 min — breached P1
    lastResponse: new Date(Date.now() - 10 * 60 * 1000).toISOString(),
    messages: 12,
  },
  {
    id: 'tk7', subject: 'Suspicious listing with fake photos',
    userName: 'Ngozi Okafor', userEmail: 'ngozi@example.com',
    priority: 'high', status: 'resolved', category: 'trust',
    createdAt: new Date(Date.now() - 72 * 60 * 60 * 1000).toISOString(),
    lastResponse: new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString(),
    messages: 6,
  },
  {
    id: 'tk8', subject: 'App keeps crashing on property search',
    userName: 'Olumide Balogun', userEmail: 'olumide@example.com',
    priority: 'medium', status: 'resolved', category: 'technical',
    createdAt: new Date(Date.now() - 96 * 60 * 60 * 1000).toISOString(),
    lastResponse: new Date(Date.now() - 72 * 60 * 60 * 1000).toISOString(),
    messages: 3,
  },
];

const PRIORITY_STYLES = {
  low:    { label: 'Low',    bg: 'bg-gray-100 dark:bg-white/5',        text: 'text-gray-500',    dot: 'bg-gray-400' },
  medium: { label: 'Medium', bg: 'bg-blue-50 dark:bg-blue-500/10',     text: 'text-blue-600',    dot: 'bg-blue-500' },
  high:   { label: 'High',   bg: 'bg-orange-50 dark:bg-orange-500/10', text: 'text-orange-600',  dot: 'bg-orange-500' },
  urgent: { label: 'Urgent', bg: 'bg-red-50 dark:bg-red-500/10',       text: 'text-red-600',     dot: 'bg-red-500' },
};

const STATUS_STYLES = {
  open:        { label: 'Open',        bg: 'bg-amber-50 dark:bg-amber-500/10',   text: 'text-amber-600',   icon: AlertCircle },
  in_progress: { label: 'In Progress', bg: 'bg-blue-50 dark:bg-blue-500/10',     text: 'text-blue-600',    icon: Clock },
  escalated:   { label: 'Escalated',   bg: 'bg-orange-50 dark:bg-orange-500/10', text: 'text-orange-600',  icon: ArrowUpRight },
  resolved:    { label: 'Resolved',    bg: 'bg-emerald-50 dark:bg-emerald-500/10', text: 'text-emerald-600', icon: CheckCircle },
  closed:      { label: 'Closed',      bg: 'bg-gray-100 dark:bg-white/5',        text: 'text-gray-500',    icon: XCircle },
};

const CATEGORY_STYLES = {
  account:   { bg: 'bg-sky-50 dark:bg-sky-500/10',       text: 'text-sky-600' },
  payment:   { bg: 'bg-emerald-50 dark:bg-emerald-500/10', text: 'text-emerald-600' },
  listing:   { bg: 'bg-violet-50 dark:bg-violet-500/10', text: 'text-violet-600' },
  booking:   { bg: 'bg-indigo-50 dark:bg-indigo-500/10', text: 'text-indigo-600' },
  provider:  { bg: 'bg-amber-50 dark:bg-amber-500/10',   text: 'text-amber-600' },
  technical: { bg: 'bg-gray-100 dark:bg-gray-500/10',    text: 'text-gray-600' },
  trust:     { bg: 'bg-red-50 dark:bg-red-500/10',       text: 'text-red-600' },
  general:   { bg: 'bg-teal-50 dark:bg-teal-500/10',     text: 'text-teal-600' },
};

const ROUTE_TARGETS = [
  { key: 'operations',  label: 'Operations' },
  { key: 'finance',     label: 'Finance' },
  { key: 'compliance',  label: 'Compliance' },
];

const STATUS_FILTERS   = ['all', 'open', 'in_progress', 'escalated', 'resolved', 'closed'];
const PRIORITY_FILTERS = ['all', 'urgent', 'high', 'medium', 'low'];
const CATEGORY_FILTERS = ['all', ...TICKET_CATEGORIES.map(c => c.key)];

const PAGE_SIZE = 4;

function formatDate(ts) {
  return new Date(ts).toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: 'numeric' });
}

function timeAgo(ts) {
  const diff = Date.now() - new Date(ts).getTime();
  const hours = Math.floor(diff / 3600000);
  if (hours < 1) return 'Just now';
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

/* ── SLA helpers ─────────────────────────────────────────── */

/**
 * Calculate SLA status for a ticket.
 * Returns { elapsed, target, ratio, breached, warning, label, color }
 */
function getSlaStatus(ticket) {
  const slaKey    = PRIORITY_TO_SLA[ticket.priority];
  const slaConfig = SLA_TARGETS[slaKey];
  if (!slaConfig) return null;

  const targetMs = slaConfig.firstResponseMs;
  const elapsed  = Date.now() - new Date(ticket.createdAt).getTime();
  const ratio    = Math.min(elapsed / targetMs, 2); // cap at 2x for display
  const breached = elapsed > targetMs;
  const warning  = ratio >= 0.75 && !breached;

  // Human-readable remaining/elapsed
  let label;
  if (breached) {
    const overMs = elapsed - targetMs;
    label = formatDuration(overMs) + ' overdue';
  } else {
    const remainMs = targetMs - elapsed;
    label = formatDuration(remainMs) + ' left';
  }

  const color = breached ? 'red' : warning ? 'amber' : 'emerald';

  return { elapsed, target: targetMs, ratio, breached, warning, label, color };
}

function formatDuration(ms) {
  const totalSec = Math.floor(ms / 1000);
  if (totalSec < 60) return `${totalSec}s`;
  const min = Math.floor(totalSec / 60);
  if (min < 60) return `${min}m`;
  const hr = Math.floor(min / 60);
  const remMin = min % 60;
  if (hr < 24) return remMin > 0 ? `${hr}h ${remMin}m` : `${hr}h`;
  const days = Math.floor(hr / 24);
  const remHr = hr % 24;
  return remHr > 0 ? `${days}d ${remHr}h` : `${days}d`;
}

/* ── Star rating component ───────────────────────────────── */
function StarRating({ score, size = 12 }) {
  return (
    <span className="inline-flex items-center gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          size={size}
          className={i < score
            ? 'fill-brand-gold text-brand-gold'
            : 'text-gray-300 dark:text-gray-600'
          }
        />
      ))}
    </span>
  );
}

/* ── SLA Timer badge ─────────────────────────────────────── */
function SlaTimerBadge({ ticket }) {
  const sla = getSlaStatus(ticket);
  if (!sla) return null;

  // Do not show SLA timer for resolved/closed tickets
  if (ticket.status === 'resolved' || ticket.status === 'closed') return null;

  const colorMap = {
    emerald: {
      bg:   'bg-emerald-50 dark:bg-emerald-500/10',
      text: 'text-emerald-600 dark:text-emerald-400',
      ring: '',
    },
    amber: {
      bg:   'bg-amber-50 dark:bg-amber-500/10',
      text: 'text-amber-600 dark:text-amber-400',
      ring: 'ring-1 ring-amber-300 dark:ring-amber-500/30 animate-pulse',
    },
    red: {
      bg:   'bg-red-50 dark:bg-red-500/10',
      text: 'text-red-600 dark:text-red-400',
      ring: 'ring-1 ring-red-300 dark:ring-red-500/30 animate-pulse',
    },
  };

  const style = colorMap[sla.color];

  return (
    <span className={`inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full font-semibold ${style.bg} ${style.text} ${style.ring}`}>
      <Clock size={10} />
      {sla.label}
    </span>
  );
}

/* ── Auto-escalation warning badge ───────────────────────── */
function SlaWarningBadge({ ticket }) {
  const sla = getSlaStatus(ticket);
  if (!sla) return null;
  if (ticket.status === 'resolved' || ticket.status === 'closed') return null;
  if (!sla.warning && !sla.breached) return null;

  if (sla.breached) {
    return (
      <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full font-bold bg-red-100 dark:bg-red-500/20 text-red-700 dark:text-red-400 ring-1 ring-red-300 dark:ring-red-500/30 animate-pulse">
        <AlertTriangle size={10} />
        SLA Breached
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full font-bold bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-400 ring-1 ring-amber-300 dark:ring-amber-500/30 animate-pulse">
      <AlertTriangle size={10} />
      SLA Warning
    </span>
  );
}

/* ═══════════════════════════════════════════════════════════ */

export default function SupportTickets() {
  const { t } = useTranslation('admin');
  const { user } = useAuth();

  const [tickets, setTickets]               = useState(MOCK_TICKETS);
  const [search, setSearch]                 = useState('');
  const [statusFilter, setStatusFilter]     = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [page, setPage]                     = useState(1);
  const [loading, setLoading]               = useState(true);
  const [usingFallback, setUsingFallback]   = useState(false);
  const [activeTicket, setActiveTicket]     = useState(null);
  const [respondingTo, setRespondingTo]     = useState(null);
  const [responseText, setResponseText]     = useState('');
  const [routeOpen, setRouteOpen]           = useState(null);    // ticket id with open route dropdown
  const [toast, setToast]                   = useState(null);
  const [, setTick]                         = useState(0);       // force re-render for live SLA timers

  useEffect(() => {
    document.title = t('tickets.title', 'Support Tickets') + ' — Aurban';
  }, [t]);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      try {
        const res = await adminService.getTickets({ page: 1, limit: 100 });
        if (!cancelled && res.success && res.tickets?.length) {
          const normalized = res.tickets.map((tk) => {
            const responses = tk.responses || [];
            const last = responses.length ? responses[responses.length - 1] : null;
            return {
              id: tk.id,
              subject: tk.subject || 'Support Ticket',
              userName: tk.user_name || tk.userName || tk.user || 'User',
              userEmail: tk.user_email || tk.userEmail || '',
              priority: tk.priority || 'medium',
              status: tk.status || 'open',
              category: tk.category || 'general',
              createdAt: tk.created_at || tk.createdAt || new Date().toISOString(),
              lastResponse: last?.timestamp || tk.updated_at || tk.updatedAt || tk.created_at || new Date().toISOString(),
              messages: responses.length,
              raw: tk,
            };
          });
          setTickets(normalized);
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

  /* ── Re-render every 30s to keep SLA timers live ─────── */
  useEffect(() => {
    const interval = setInterval(() => setTick(t => t + 1), 30_000);
    return () => clearInterval(interval);
  }, []);

  /* ── Toast helper ──────────────────────────────────────── */
  const showToast = useCallback((message, type = 'info') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  }, []);

  /* ── Admin actions ─────────────────────────────────────── */
  const escalateAction = useAdminAction({
    permission: 'tickets:escalate',
    action: AUDIT_ACTIONS.TICKET_ESCALATE,
    confirmTitle: t('tickets.confirmEscalate', 'Escalate Ticket'),
    confirmMessage: t('tickets.confirmEscalateMsg', 'This will escalate the ticket to a senior team member for review.'),
    confirmLabel: t('tickets.escalate', 'Escalate'),
    requireReason: true,
    targetId: activeTicket?.id,
    targetType: 'ticket',
    onExecute: async ({ reason }) => {
      setTickets((prev) => prev.map((tk) => tk.id === activeTicket?.id ? { ...tk, status: 'escalated' } : tk));
      if (activeTicket?.id) {
        try { await adminService.escalateTicket(activeTicket.id, { reason }); } catch { /* keep optimistic */ }
      }
    },
    onSuccess: () => setActiveTicket(null),
  });

  const closeAction = useAdminAction({
    permission: 'tickets:close',
    action: AUDIT_ACTIONS.TICKET_CLOSE,
    confirmTitle: t('tickets.confirmClose', 'Close Ticket'),
    confirmMessage: t('tickets.confirmCloseMsg', 'This will close the ticket. The user will be notified.'),
    confirmLabel: t('tickets.close', 'Close Ticket'),
    requireReason: true,
    targetId: activeTicket?.id,
    targetType: 'ticket',
    onExecute: async ({ reason }) => {
      setTickets((prev) => prev.map((tk) => tk.id === activeTicket?.id ? { ...tk, status: 'closed' } : tk));
      if (activeTicket?.id) {
        try { await adminService.closeTicket(activeTicket.id, { resolution: reason }); } catch { /* keep optimistic */ }
      }
    },
    onSuccess: () => setActiveTicket(null),
  });

  const routeAction = useAdminAction({
    permission: 'chat:route',
    action: AUDIT_ACTIONS.TICKET_REASSIGN,
    confirmTitle: t('tickets.confirmRoute', 'Route Ticket'),
    confirmMessage: t('tickets.confirmRouteMsg', 'This will reassign the ticket to the selected admin panel for handling.'),
    confirmLabel: t('tickets.route', 'Route Ticket'),
    requireReason: true,
    targetId: activeTicket?.id,
    targetType: 'ticket',
    onExecute: async ({ reason }) => {
      setTickets((prev) => prev.map((tk) =>
        tk.id === activeTicket?.id ? { ...tk, status: 'escalated' } : tk,
      ));
      if (activeTicket?.id) {
        try { await adminService.escalateTicket(activeTicket.id, { reason }); } catch { /* keep optimistic */ }
      }
    },
    onSuccess: () => {
      setActiveTicket(null);
      setRouteOpen(null);
    },
  });

  /* ── Respond handler ─────────────────────────────────── */
  const toggleRespond = (ticketId) => {
    if (respondingTo === ticketId) {
      setRespondingTo(null);
      setResponseText('');
    } else {
      setRespondingTo(ticketId);
      setResponseText('');
    }
  };

  const sendResponse = async (ticketId) => {
    if (!responseText.trim()) return;
    setTickets((prev) =>
      prev.map((tk) =>
        tk.id === ticketId
          ? {
              ...tk,
              messages: tk.messages + 1,
              lastResponse: new Date().toISOString(),
              status: tk.status === 'open' ? 'in_progress' : tk.status,
            }
          : tk,
      ),
    );
    try {
      await adminService.respondToTicket(ticketId, { message: responseText.trim() });
    } catch { /* keep optimistic */ }
    setRespondingTo(null);
    setResponseText('');
  };

  /* ── Live Chat handler ───────────────────────────────── */
  const handleLiveChat = (ticket) => {
    showToast(`Live chat not yet available. Ticket: ${ticket.id}`, 'warning');
  };

  /* ── Route handler ───────────────────────────────────── */
  const handleRoute = (ticket, target) => {
    setActiveTicket(ticket);
    setRouteOpen(null);
    // Short delay so activeTicket is set before confirm modal opens
    setTimeout(() => routeAction.execute(), 0);
  };

  /* ── Filtering ─────────────────────────────────────────── */
  const filtered = tickets.filter((tk) => {
    if (statusFilter !== 'all' && tk.status !== statusFilter) return false;
    if (priorityFilter !== 'all' && tk.priority !== priorityFilter) return false;
    if (categoryFilter !== 'all') {
      const cat = tk.category || mockCategoryForTicket(tk.id);
      if (cat !== categoryFilter) return false;
    }
    if (search) {
      const q = search.toLowerCase();
      return tk.subject.toLowerCase().includes(q) || tk.userName.toLowerCase().includes(q) || tk.userEmail.toLowerCase().includes(q);
    }
    return true;
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  /* ── Header stats ─────────────────────────────────────── */
  const stats = useMemo(() => {
    const open      = tickets.filter(t => t.status === 'open').length;
    const inProg    = tickets.filter(t => t.status === 'in_progress').length;
    const escalated = tickets.filter(t => t.status === 'escalated').length;
    const resolved  = tickets.filter(t => t.status === 'resolved' || t.status === 'closed').length;

    // SLA breaches (open / in_progress / escalated only)
    const activeTickets = tickets.filter(t => t.status !== 'resolved' && t.status !== 'closed');
    const breached = activeTickets.filter(t => {
      const sla = getSlaStatus(t);
      return sla?.breached;
    }).length;

    // Average CSAT for resolved tickets
    const resolvedTickets = tickets.filter(t => t.status === 'resolved' || t.status === 'closed');
    let avgCsat = 0;
    if (resolvedTickets.length > 0) {
      const total = resolvedTickets.reduce((sum, t) => sum + mockCsatForTicket(t.id), 0);
      avgCsat = (total / resolvedTickets.length).toFixed(1);
    }

    return { open, inProg, escalated, resolved, breached, avgCsat, resolvedCount: resolvedTickets.length };
  }, [tickets]);

  /* ── Category label lookup ─────────────────────────────── */
  const getCategoryLabel = (key) => {
    const cat = TICKET_CATEGORIES.find(c => c.key === key);
    return cat?.label || key;
  };

  return (
    <RequirePermission permission="tickets:view">
      <div className="pb-8 space-y-5">

        {/* ── Toast notification ──────────────────────────────── */}
        {toast && (
          <div className={`fixed top-20 right-4 z-[100] flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg animate-slide-in-right ${
            toast.type === 'warning' ? 'bg-amber-500 text-white'
              : toast.type === 'error' ? 'bg-red-500 text-white'
              : 'bg-emerald-500 text-white'
          }`}>
            {toast.type === 'warning' ? <AlertCircle size={16} />
              : toast.type === 'error' ? <XCircle size={16} />
              : <CheckCircle size={16} />
            }
            <span className="text-sm font-medium">{toast.message}</span>
            <button onClick={() => setToast(null)} className="ml-2 opacity-70 hover:opacity-100">
              <X size={14} />
            </button>
          </div>
        )}

        {/* ── Fallback banner ──────────────────────────────────── */}
        {usingFallback && (
          <div className="flex items-center gap-2 px-4 py-2.5 text-xs font-medium text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-500/10 rounded-xl">
            <AlertCircle size={14} className="shrink-0" />
            {t('fallback', 'Could not reach server. Showing mock data for development.')}
          </div>
        )}

        {/* ── Header ───────────────────────────────────────────── */}
        <div>
          <h1 className="text-xl font-bold font-display text-brand-charcoal-dark dark:text-white">
            {t('tickets.title', 'Support Tickets')}
          </h1>
          <p className="text-sm text-gray-400 mt-0.5">
            {t('tickets.subtitle', 'Manage support requests and user inquiries')}
          </p>
        </div>

        {/* ── Header stats ─────────────────────────────────────── */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {[
            { label: 'Open',      value: stats.open,      color: 'text-amber-600',   bg: 'bg-amber-50 dark:bg-amber-500/10' },
            { label: 'In Progress', value: stats.inProg,  color: 'text-blue-600',    bg: 'bg-blue-50 dark:bg-blue-500/10' },
            { label: 'Escalated', value: stats.escalated,  color: 'text-orange-600',  bg: 'bg-orange-50 dark:bg-orange-500/10' },
            { label: 'Resolved',  value: stats.resolved,   color: 'text-emerald-600', bg: 'bg-emerald-50 dark:bg-emerald-500/10' },
            { label: 'SLA Breached', value: stats.breached, color: 'text-red-600',     bg: 'bg-red-50 dark:bg-red-500/10' },
            {
              label: 'Avg CSAT',
              value: stats.resolvedCount > 0 ? stats.avgCsat : '—',
              color: 'text-brand-gold',
              bg: 'bg-brand-gold/5 dark:bg-brand-gold/10',
              isCsat: true,
            },
          ].map((s) => (
            <div key={s.label} className={`flex flex-col items-center gap-1 px-3 py-3 rounded-xl ${s.bg}`}>
              <span className={`text-lg font-bold font-display ${s.color}`}>{s.value}</span>
              <span className="text-[10px] font-medium text-gray-500 dark:text-gray-400 text-center">
                {s.label}
                {s.isCsat && stats.resolvedCount > 0 && (
                  <span className="block mt-0.5">
                    <StarRating score={Math.round(Number(stats.avgCsat))} size={10} />
                  </span>
                )}
              </span>
            </div>
          ))}
        </div>

        {/* ── Search ───────────────────────────────────────────── */}
        <div className="relative">
          <Search size={16} className="absolute text-gray-400 -translate-y-1/2 left-3 top-1/2" />
          <input
            type="text"
            placeholder={t('tickets.searchPlaceholder', 'Search by subject, user name, or email...')}
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="w-full py-2.5 pl-10 pr-4 text-sm bg-white dark:bg-gray-900 border border-gray-200 dark:border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-gold/40 text-brand-charcoal-dark dark:text-white placeholder-gray-400"
          />
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
              {s === 'all' ? t('tickets.filters.allStatus', 'All Status') : STATUS_STYLES[s]?.label || s}
            </button>
          ))}
        </div>

        {/* ── Priority filter pills ────────────────────────────── */}
        <div className="flex gap-2 overflow-x-auto scrollbar-hide">
          {PRIORITY_FILTERS.map((p) => (
            <button
              key={p}
              onClick={() => { setPriorityFilter(p); setPage(1); }}
              className={`text-xs font-medium px-3 py-1.5 rounded-full transition-colors capitalize whitespace-nowrap shrink-0
                ${priorityFilter === p
                  ? 'bg-brand-charcoal-dark dark:bg-white text-white dark:text-gray-900'
                  : 'bg-gray-100 dark:bg-white/5 text-gray-500 hover:bg-gray-200 dark:hover:bg-white/10'
                }`}
            >
              {p === 'all' ? t('tickets.filters.allPriority', 'All Priority') : PRIORITY_STYLES[p]?.label || p}
            </button>
          ))}
        </div>

        {/* ── Category filter dropdown ─────────────────────────── */}
        <div className="flex items-center gap-3">
          <label className="text-xs font-medium text-gray-500 dark:text-gray-400 shrink-0">
            Category:
          </label>
          <div className="relative">
            <select
              value={categoryFilter}
              onChange={(e) => { setCategoryFilter(e.target.value); setPage(1); }}
              className="appearance-none text-xs font-medium px-3 py-1.5 pr-8 rounded-xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-white/10 text-brand-charcoal-dark dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-gold/40 cursor-pointer"
            >
              <option value="all">{t('tickets.filters.allCategory', 'All Categories')}</option>
              {TICKET_CATEGORIES.map((c) => (
                <option key={c.key} value={c.key}>{c.label}</option>
              ))}
            </select>
            <ChevronDown size={12} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
          </div>
        </div>

        {/* ── Ticket cards ─────────────────────────────────────── */}
        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-40 bg-white dark:bg-gray-900 rounded-2xl shadow-card animate-pulse" />
            ))}
          </div>
        ) : paged.length === 0 ? (
          <div className="py-16 text-center">
            <MessageSquare size={36} className="mx-auto mb-3 text-gray-300" />
            <p className="text-sm font-semibold text-brand-charcoal-dark dark:text-white">
              {t('tickets.empty.title', 'No tickets found')}
            </p>
            <p className="mt-1 text-xs text-gray-400">
              {t('tickets.empty.subtitle', 'Try adjusting your search or filters')}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {paged.map((tk) => {
              const priority    = PRIORITY_STYLES[tk.priority] || PRIORITY_STYLES.medium;
              const status      = STATUS_STYLES[tk.status]     || STATUS_STYLES.open;
              const StatusIcon  = status.icon;
              const category    = tk.category || mockCategoryForTicket(tk.id);
              const catLabel    = getCategoryLabel(category);
              const catStyle    = CATEGORY_STYLES[category] || CATEGORY_STYLES.general;
              const isResolved  = tk.status === 'resolved' || tk.status === 'closed';
              const isOpen      = tk.status === 'open' || tk.status === 'in_progress';
              const csatScore   = isResolved ? mockCsatForTicket(tk.id) : null;

              return (
                <div key={tk.id} className="p-4 bg-white dark:bg-gray-900 rounded-2xl shadow-card sm:p-5">
                  {/* Top row */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3 min-w-0">
                      {/* Priority dot */}
                      <div className="flex flex-col items-center gap-1 pt-1.5 shrink-0">
                        <div className={`w-2.5 h-2.5 rounded-full ${priority.dot}`} />
                      </div>

                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-brand-charcoal-dark dark:text-white">
                          {tk.subject}
                        </p>
                        <div className="flex items-center gap-2 mt-0.5 text-xs text-gray-400">
                          <span className="flex items-center gap-1"><User size={11} /> {tk.userName}</span>
                          <span className="text-gray-300 dark:text-gray-600">/</span>
                          <span className="truncate">{tk.userEmail}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center justify-end gap-1.5 shrink-0">
                      {/* Category badge */}
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${catStyle.bg} ${catStyle.text}`}>
                        {catLabel}
                      </span>
                      {/* Priority badge */}
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${priority.bg} ${priority.text}`}>
                        {priority.label}
                      </span>
                      {/* Status badge */}
                      <span className={`flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full font-medium ${status.bg} ${status.text}`}>
                        <StatusIcon size={10} /> {status.label}
                      </span>
                    </div>
                  </div>

                  {/* SLA + CSAT row */}
                  <div className="flex flex-wrap items-center gap-2 mt-2">
                    <SlaTimerBadge ticket={tk} />
                    <SlaWarningBadge ticket={tk} />
                    {isResolved && csatScore !== null && (
                      <span className="inline-flex items-center gap-1.5 text-[10px] px-2 py-0.5 rounded-full font-medium bg-brand-gold/5 dark:bg-brand-gold/10 text-brand-gold">
                        CSAT: <StarRating score={csatScore} size={10} />
                      </span>
                    )}
                  </div>

                  {/* Meta row */}
                  <div className="flex flex-wrap items-center gap-4 mt-3 text-xs text-gray-400">
                    <span className="flex items-center gap-1"><Clock size={11} /> Created {formatDate(tk.createdAt)}</span>
                    <span>Last response: {timeAgo(tk.lastResponse)}</span>
                    <span className="flex items-center gap-1"><MessageSquare size={11} /> {tk.messages} message{tk.messages !== 1 ? 's' : ''}</span>
                  </div>

                  {/* Actions */}
                  <div className="flex flex-wrap gap-2 mt-3">
                    {/* Respond */}
                    <RequirePermission permission="tickets:respond">
                      <button
                        onClick={() => toggleRespond(tk.id)}
                        className={`flex items-center gap-1.5 px-3 py-2 text-xs font-bold rounded-xl transition-colors ${
                          respondingTo === tk.id
                            ? 'bg-brand-charcoal-dark dark:bg-white text-white dark:text-gray-900'
                            : 'bg-gray-100 dark:bg-white/5 text-brand-charcoal-dark dark:text-white hover:bg-gray-200 dark:hover:bg-white/10'
                        }`}
                      >
                        <MessageSquare size={12} /> {t('tickets.respond', 'Respond')}
                      </button>
                    </RequirePermission>

                    {/* Live Chat — only for open/in_progress tickets */}
                    {isOpen && (
                      <RequirePermission permission="chat:live">
                        <button
                          onClick={() => handleLiveChat(tk)}
                          className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold bg-sky-50 dark:bg-sky-500/10 text-sky-600 rounded-xl hover:bg-sky-100 dark:hover:bg-sky-500/20 transition-colors"
                        >
                          <Radio size={12} /> {t('tickets.liveChat', 'Start Live Chat')}
                        </button>
                      </RequirePermission>
                    )}

                    {/* Route ticket dropdown */}
                    {tk.status !== 'closed' && (
                      <RequirePermission permission="chat:route">
                        <div className="relative">
                          <button
                            onClick={() => setRouteOpen(routeOpen === tk.id ? null : tk.id)}
                            className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold bg-purple-50 dark:bg-purple-500/10 text-purple-600 rounded-xl hover:bg-purple-100 dark:hover:bg-purple-500/20 transition-colors"
                          >
                            <Shuffle size={12} /> {t('tickets.route', 'Route')}
                            <ChevronDown size={10} className={`transition-transform ${routeOpen === tk.id ? 'rotate-180' : ''}`} />
                          </button>

                          {routeOpen === tk.id && (
                            <div className="absolute left-0 z-30 mt-1 overflow-hidden bg-white border shadow-lg top-full dark:bg-gray-800 rounded-xl border-gray-200 dark:border-white/10 min-w-[160px]">
                              <div className="px-3 py-2 text-[10px] font-semibold text-gray-400 uppercase tracking-wide border-b border-gray-100 dark:border-white/5">
                                Route to panel
                              </div>
                              {ROUTE_TARGETS.map((target) => (
                                <button
                                  key={target.key}
                                  onClick={() => handleRoute(tk, target)}
                                  className="flex items-center w-full gap-2 px-3 py-2 text-xs font-medium text-left text-brand-charcoal-dark dark:text-white hover:bg-gray-50 dark:hover:bg-white/5 transition-colors"
                                >
                                  <ArrowUpRight size={11} className="text-purple-500" />
                                  {target.label}
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                      </RequirePermission>
                    )}

                    {/* Escalate */}
                    {tk.status !== 'escalated' && tk.status !== 'closed' && tk.status !== 'resolved' && (
                      <RequirePermission permission="tickets:escalate">
                        <button
                          onClick={() => { setActiveTicket(tk); escalateAction.execute(); }}
                          className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold bg-orange-50 dark:bg-orange-500/10 text-orange-600 rounded-xl hover:bg-orange-100 dark:hover:bg-orange-500/20 transition-colors"
                        >
                          <ArrowUpRight size={12} /> {t('tickets.escalate', 'Escalate')}
                        </button>
                      </RequirePermission>
                    )}

                    {/* Close */}
                    {tk.status !== 'closed' && (
                      <RequirePermission permission="tickets:close">
                        <button
                          onClick={() => { setActiveTicket(tk); closeAction.execute(); }}
                          className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold bg-red-50 dark:bg-red-500/10 text-red-600 rounded-xl hover:bg-red-100 dark:hover:bg-red-500/20 transition-colors"
                        >
                          <XCircle size={12} /> {t('tickets.close', 'Close')}
                        </button>
                      </RequirePermission>
                    )}
                  </div>

                  {/* ── Response textarea (toggled per ticket) ────── */}
                  {respondingTo === tk.id && (
                    <div className="mt-3 space-y-2">
                      <textarea
                        rows={4}
                        value={responseText}
                        onChange={(e) => setResponseText(e.target.value)}
                        placeholder={t('tickets.responsePlaceholder', 'Type your response...')}
                        className="w-full px-4 py-3 text-sm bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-gold/40 text-brand-charcoal-dark dark:text-white placeholder-gray-400 resize-y"
                      />
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => sendResponse(tk.id)}
                          disabled={!responseText.trim()}
                          className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-brand-charcoal-dark dark:bg-white dark:text-gray-900 rounded-xl hover:opacity-90 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                        >
                          <Send size={12} /> {t('tickets.sendResponse', 'Send Response')}
                        </button>
                        <button
                          onClick={() => toggleRespond(tk.id)}
                          className="px-3 py-2 text-xs font-bold text-gray-500 bg-gray-100 dark:bg-white/5 rounded-xl hover:bg-gray-200 dark:hover:bg-white/10 transition-colors"
                        >
                          {t('tickets.cancel', 'Cancel')}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

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

        {/* ── Confirm modals ───────────────────────────────────── */}
        <ConfirmAction {...escalateAction.confirmProps} />
        <ConfirmAction {...closeAction.confirmProps} />
        <ConfirmAction {...routeAction.confirmProps} />
      </div>
    </RequirePermission>
  );
}
