import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import {
  AlertTriangle, ArrowUpRight, MessageSquare, CheckCircle2,
  Clock, Send, Shield, User, X, ChevronDown, ChevronUp,
  Plus, Loader2, Filter, Inbox, ArrowLeft,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext.jsx';
import {
  normalizeRole, getEscalationTargets, ROLE_LABELS,
  ROLE_COLORS, MOCK_ADMIN_ACCOUNTS,
} from '../../utils/rbac.js';
import * as escalationService from '../../services/escalation.service.js';
import { ESCALATION_PRIORITIES } from '../../services/escalation.service.js';

/* ════════════════════════════════════════════════════════════
   ESCALATION PANEL — Cross-panel escalation system

   Slide-out panel for creating, viewing, responding to,
   and resolving escalations between admin roles.

   Props:
     isOpen  — controls visibility
     onClose — callback to close the panel
════════════════════════════════════════════════════════════ */

// ── Constants ──────────────────────────────────────────────

const STATUS_FILTERS = [
  { key: 'all',         label: 'All' },
  { key: 'open',        label: 'Open' },
  { key: 'in_progress', label: 'In Progress' },
  { key: 'resolved',    label: 'Resolved' },
];

const STATUS_STYLES = {
  open:        'bg-amber-500/10 text-amber-500',
  in_progress: 'bg-blue-500/10 text-blue-500',
  resolved:    'bg-emerald-500/10 text-emerald-500',
};

const STATUS_LABELS = {
  open:        'Open',
  in_progress: 'In Progress',
  resolved:    'Resolved',
};

const PRIORITY_STYLES = {
  P1: 'bg-red-500/10 text-red-500 ring-1 ring-red-500/20',
  P2: 'bg-amber-500/10 text-amber-500 ring-1 ring-amber-500/20',
  P3: 'bg-blue-500/10 text-blue-500 ring-1 ring-blue-500/20',
  P4: 'bg-gray-500/10 text-gray-400 ring-1 ring-gray-500/20',
};

const PRIORITY_DOT = {
  P1: 'bg-red-500',
  P2: 'bg-amber-500',
  P3: 'bg-blue-500',
  P4: 'bg-gray-500',
};

const TAB_KEYS = { INCOMING: 'incoming', OUTGOING: 'outgoing', CREATE: 'create' };

// ── Helpers ────────────────────────────────────────────────

function timeAgo(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins  = Math.floor(diff / 60000);
  if (mins < 1)  return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString('en-NG', { day: 'numeric', month: 'short' });
}

function formatDate(dateStr) {
  return new Date(dateStr).toLocaleString('en-NG', {
    day: 'numeric', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

// ── Toast component (local, lightweight) ───────────────────

function Toast({ message, type, onDismiss }) {
  useEffect(() => {
    const timer = setTimeout(onDismiss, 4000);
    return () => clearTimeout(timer);
  }, [onDismiss]);

  const colors = {
    success: 'bg-emerald-500',
    error:   'bg-red-500',
    info:    'bg-blue-500',
  };

  return (
    <div className={`fixed bottom-6 right-6 z-[300] flex items-center gap-2 px-4 py-3 rounded-xl text-white text-sm font-medium shadow-lg shadow-black/20 animate-slide-up ${colors[type] || colors.info}`}>
      {type === 'success' && <CheckCircle2 size={16} />}
      {type === 'error' && <AlertTriangle size={16} />}
      <span>{message}</span>
      <button onClick={onDismiss} className="ml-1 opacity-70 hover:opacity-100" aria-label="Dismiss">
        <X size={14} />
      </button>
    </div>
  );
}

// ── Main component ─────────────────────────────────────────

export default function EscalationPanel({ isOpen, onClose }) {
  const { user }      = useAuth();
  const role           = normalizeRole(user?.role);
  const panelRef       = useRef(null);

  // ── State ─────────────────────────────────────────────────
  const [activeTab, setActiveTab]         = useState(TAB_KEYS.INCOMING);
  const [statusFilter, setStatusFilter]   = useState('all');
  const [escalations, setEscalations]     = useState([]);
  const [loading, setLoading]             = useState(false);
  const [expandedId, setExpandedId]       = useState(null);
  const [toast, setToast]                 = useState(null);

  // Response form
  const [responseText, setResponseText]   = useState('');
  const [respondingTo, setRespondingTo]   = useState(null);
  const [submittingResponse, setSubmittingResponse] = useState(false);

  // Resolve form
  const [resolvingId, setResolvingId]       = useState(null);
  const [resolutionText, setResolutionText] = useState('');
  const [submittingResolve, setSubmittingResolve] = useState(false);

  // Create form
  const [createForm, setCreateForm] = useState({
    priority:   'P3',
    targetRole: '',
    subject:    '',
    note:       '',
    contextType:  '',
    contextId:    '',
    contextLabel: '',
  });
  const [submittingCreate, setSubmittingCreate] = useState(false);

  // Escalation targets for current role
  const targets = useMemo(() => getEscalationTargets(role), [role]);

  // ── Fetch escalations ─────────────────────────────────────
  const fetchEscalations = useCallback(async () => {
    setLoading(true);
    try {
      const result = await escalationService.getEscalations({
        status: statusFilter !== 'all' ? statusFilter : undefined,
        role,
      });
      if (result.success) {
        setEscalations(result.escalations || []);
      }
    } catch {
      showToast('Failed to load escalations', 'error');
    } finally {
      setLoading(false);
    }
  }, [role, statusFilter, showToast]);

  useEffect(() => {
    if (isOpen) fetchEscalations();
  }, [isOpen, fetchEscalations]);

  // ── Filter by tab ─────────────────────────────────────────
  const filteredEscalations = useMemo(() => {
    if (activeTab === TAB_KEYS.INCOMING) {
      return escalations.filter(e => e.to.role === role || role === 'super_admin');
    }
    if (activeTab === TAB_KEYS.OUTGOING) {
      return escalations.filter(e => e.from.role === role);
    }
    return [];
  }, [escalations, activeTab, role]);

  // Open count (for badge)
  const openCount = useMemo(() => {
    return escalations.filter(
      e => (e.to.role === role || role === 'super_admin') && e.status !== 'resolved'
    ).length;
  }, [escalations, role]);

  // ── Toast helper ──────────────────────────────────────────
  const showToast = useCallback((message, type = 'info') => {
    setToast({ message, type, key: Date.now() });
  }, []);

  // ── Keyboard: close on Escape ─────────────────────────────
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e) => {
      if (e.key === 'Escape') onClose?.();
    };
    document.addEventListener('keydown', handler);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', handler);
      document.body.style.overflow = '';
    };
  }, [isOpen, onClose]);

  // ── Handlers ──────────────────────────────────────────────

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    if (!createForm.subject.trim() || !createForm.targetRole || !createForm.note.trim()) {
      showToast('Please fill in all required fields.', 'error');
      return;
    }

    setSubmittingCreate(true);
    try {
      const context = createForm.contextType
        ? { type: createForm.contextType, entityId: createForm.contextId, entityLabel: createForm.contextLabel }
        : undefined;

      const result = await escalationService.createEscalation({
        priority:   createForm.priority,
        targetRole: createForm.targetRole,
        subject:    createForm.subject.trim(),
        note:       createForm.note.trim(),
        context,
      });

      if (result.success) {
        showToast('Escalation created successfully.', 'success');
        setCreateForm({ priority: 'P3', targetRole: '', subject: '', note: '', contextType: '', contextId: '', contextLabel: '' });
        setActiveTab(TAB_KEYS.OUTGOING);
        fetchEscalations();
      }
    } catch {
      showToast('Failed to create escalation.', 'error');
    } finally {
      setSubmittingCreate(false);
    }
  };

  const handleRespond = async (escId) => {
    if (!responseText.trim()) return;
    setSubmittingResponse(true);
    try {
      const result = await escalationService.respondToEscalation(escId, { message: responseText.trim() });
      if (result.success) {
        showToast('Response added.', 'success');
        setResponseText('');
        setRespondingTo(null);
        fetchEscalations();
      }
    } catch {
      showToast('Failed to add response.', 'error');
    } finally {
      setSubmittingResponse(false);
    }
  };

  const handleResolve = async (escId) => {
    if (!resolutionText.trim()) {
      showToast('Please provide a resolution summary.', 'error');
      return;
    }
    setSubmittingResolve(true);
    try {
      const result = await escalationService.resolveEscalation(escId, { resolution: resolutionText.trim() });
      if (result.success) {
        showToast('Escalation resolved.', 'success');
        setResolutionText('');
        setResolvingId(null);
        fetchEscalations();
      }
    } catch {
      showToast('Failed to resolve escalation.', 'error');
    } finally {
      setSubmittingResolve(false);
    }
  };

  const handleAssign = async (escId, adminId) => {
    try {
      const result = await escalationService.assignEscalation(escId, { adminId });
      if (result.success) {
        showToast('Escalation assigned.', 'success');
        fetchEscalations();
      }
    } catch {
      showToast('Failed to assign escalation.', 'error');
    }
  };

  // ── Don't render if closed ────────────────────────────────
  if (!isOpen) return null;

  // ── Render ────────────────────────────────────────────────
  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 z-[200] bg-black/50 backdrop-blur-sm animate-fade-in"
        onClick={onClose}
        aria-hidden
      />

      {/* Slide-out panel */}
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label="Escalation Panel"
        className="fixed inset-y-0 right-0 z-[201] flex flex-col w-full max-w-xl bg-gray-900 dark:bg-gray-950 shadow-2xl shadow-black/30 animate-slide-in-right"
      >
        {/* ═══ HEADER ═══ */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-white/5 shrink-0 sm:px-6">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-brand-gold/10">
              <ArrowUpRight size={18} className="text-brand-gold" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Escalations</h2>
              <p className="text-[10px] text-gray-500">Cross-panel escalation system</p>
            </div>
            {openCount > 0 && (
              <span className="flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full bg-red-500 text-white text-[10px] font-bold">
                {openCount}
              </span>
            )}
          </div>
          <button
            onClick={onClose}
            className="flex items-center justify-center w-8 h-8 text-gray-500 transition-colors rounded-lg hover:bg-white/5 hover:text-gray-300"
            aria-label="Close escalation panel"
          >
            <X size={18} />
          </button>
        </div>

        {/* ═══ TABS ═══ */}
        <div className="flex border-b border-white/5 shrink-0">
          {[
            { key: TAB_KEYS.INCOMING,  label: 'Incoming',  icon: Inbox,         count: openCount },
            { key: TAB_KEYS.OUTGOING,  label: 'Outgoing',  icon: ArrowUpRight,  count: null },
            { key: TAB_KEYS.CREATE,    label: 'New',        icon: Plus,          count: null },
          ].map(({ key, label, icon: Icon, count }) => (
            <button
              key={key}
              onClick={() => setActiveTab(key)}
              className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2.5 text-xs font-semibold transition-colors relative
                ${activeTab === key
                  ? 'text-brand-gold'
                  : 'text-gray-500 hover:text-gray-300'
                }`}
              aria-selected={activeTab === key}
              role="tab"
            >
              <Icon size={14} />
              <span>{label}</span>
              {count != null && count > 0 && (
                <span className="flex items-center justify-center min-w-[16px] h-4 px-1 rounded-full bg-red-500 text-white text-[9px] font-bold">
                  {count}
                </span>
              )}
              {activeTab === key && (
                <span className="absolute bottom-0 left-2 right-2 h-0.5 bg-brand-gold rounded-full" />
              )}
            </button>
          ))}
        </div>

        {/* ═══ CONTENT AREA ═══ */}
        <div className="flex-1 overflow-y-auto">

          {/* ── CREATE TAB ──────────────────────────────────── */}
          {activeTab === TAB_KEYS.CREATE && (
            <form onSubmit={handleCreateSubmit} className="p-4 space-y-4 sm:p-6">
              {/* No targets fallback */}
              {targets.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <Shield size={32} className="mb-3 text-gray-600" />
                  <p className="text-sm font-medium text-gray-400">No escalation targets available</p>
                  <p className="mt-1 text-xs text-gray-600">
                    Your role ({ROLE_LABELS[role]}) does not have escalation targets configured.
                  </p>
                </div>
              ) : (
                <>
                  {/* Priority selector */}
                  <div>
                    <label className="block mb-2 text-xs font-semibold tracking-wider text-gray-400 uppercase">
                      Priority
                    </label>
                    <div className="grid grid-cols-4 gap-2">
                      {Object.entries(ESCALATION_PRIORITIES).map(([key, { label, description }]) => (
                        <button
                          key={key}
                          type="button"
                          onClick={() => setCreateForm(f => ({ ...f, priority: key }))}
                          className={`flex flex-col items-center gap-1 p-2.5 rounded-xl border transition-all text-center
                            ${createForm.priority === key
                              ? `${PRIORITY_STYLES[key]} border-current`
                              : 'border-white/5 text-gray-500 hover:border-white/10 hover:text-gray-400'
                            }`}
                          title={description}
                          aria-pressed={createForm.priority === key}
                        >
                          <span className={`w-2 h-2 rounded-full ${PRIORITY_DOT[key]}`} />
                          <span className="text-[11px] font-bold">{key}</span>
                          <span className="text-[9px] opacity-70">{label}</span>
                        </button>
                      ))}
                    </div>
                    <p className="mt-1.5 text-[10px] text-gray-600">
                      {ESCALATION_PRIORITIES[createForm.priority]?.description}
                    </p>
                  </div>

                  {/* Target role */}
                  <div>
                    <label htmlFor="esc-target-role" className="block mb-1.5 text-xs font-semibold tracking-wider text-gray-400 uppercase">
                      Escalate To *
                    </label>
                    <select
                      id="esc-target-role"
                      value={createForm.targetRole}
                      onChange={(e) => setCreateForm(f => ({ ...f, targetRole: e.target.value }))}
                      className="w-full px-3 py-2.5 text-sm bg-gray-800 border border-white/10 rounded-xl text-gray-200 focus:ring-2 focus:ring-brand-gold/30 focus:border-brand-gold outline-none appearance-none"
                      required
                    >
                      <option value="">Select target panel...</option>
                      {targets.map(t => (
                        <option key={t} value={t}>{ROLE_LABELS[t] || t}</option>
                      ))}
                    </select>
                  </div>

                  {/* Subject */}
                  <div>
                    <label htmlFor="esc-subject" className="block mb-1.5 text-xs font-semibold tracking-wider text-gray-400 uppercase">
                      Subject *
                    </label>
                    <input
                      id="esc-subject"
                      type="text"
                      value={createForm.subject}
                      onChange={(e) => setCreateForm(f => ({ ...f, subject: e.target.value }))}
                      maxLength={200}
                      className="w-full px-3 py-2.5 text-sm bg-gray-800 border border-white/10 rounded-xl text-gray-200 placeholder-gray-600 focus:ring-2 focus:ring-brand-gold/30 focus:border-brand-gold outline-none"
                      placeholder="Brief summary of the issue..."
                      required
                    />
                  </div>

                  {/* Note */}
                  <div>
                    <label htmlFor="esc-note" className="block mb-1.5 text-xs font-semibold tracking-wider text-gray-400 uppercase">
                      Detailed Note *
                    </label>
                    <textarea
                      id="esc-note"
                      value={createForm.note}
                      onChange={(e) => setCreateForm(f => ({ ...f, note: e.target.value }))}
                      rows={5}
                      maxLength={2000}
                      className="w-full px-3 py-2.5 text-sm bg-gray-800 border border-white/10 rounded-xl text-gray-200 placeholder-gray-600 focus:ring-2 focus:ring-brand-gold/30 focus:border-brand-gold outline-none resize-none"
                      placeholder="Provide full context: what happened, what you've tried, and what you need from the target panel..."
                      required
                    />
                    <p className="mt-1 text-[10px] text-gray-600 text-right">
                      {createForm.note.length}/2000
                    </p>
                  </div>

                  {/* Context (optional) */}
                  <div>
                    <label className="block mb-1.5 text-xs font-semibold tracking-wider text-gray-400 uppercase">
                      Related Entity <span className="normal-case text-gray-600">(optional)</span>
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      <select
                        value={createForm.contextType}
                        onChange={(e) => setCreateForm(f => ({ ...f, contextType: e.target.value }))}
                        className="px-2.5 py-2 text-xs bg-gray-800 border border-white/10 rounded-xl text-gray-300 focus:ring-2 focus:ring-brand-gold/30 focus:border-brand-gold outline-none appearance-none"
                        aria-label="Entity type"
                      >
                        <option value="">Type</option>
                        <option value="user">User</option>
                        <option value="listing">Listing</option>
                        <option value="booking">Booking</option>
                        <option value="kyc">KYC</option>
                        <option value="payment">Payment</option>
                        <option value="ticket">Ticket</option>
                      </select>
                      <input
                        type="text"
                        value={createForm.contextId}
                        onChange={(e) => setCreateForm(f => ({ ...f, contextId: e.target.value }))}
                        className="px-2.5 py-2 text-xs bg-gray-800 border border-white/10 rounded-xl text-gray-300 placeholder-gray-600 focus:ring-2 focus:ring-brand-gold/30 focus:border-brand-gold outline-none"
                        placeholder="ID"
                        aria-label="Entity ID"
                      />
                      <input
                        type="text"
                        value={createForm.contextLabel}
                        onChange={(e) => setCreateForm(f => ({ ...f, contextLabel: e.target.value }))}
                        className="px-2.5 py-2 text-xs bg-gray-800 border border-white/10 rounded-xl text-gray-300 placeholder-gray-600 focus:ring-2 focus:ring-brand-gold/30 focus:border-brand-gold outline-none"
                        placeholder="Label"
                        aria-label="Entity label"
                      />
                    </div>
                  </div>

                  {/* Submit */}
                  <button
                    type="submit"
                    disabled={submittingCreate}
                    className="flex items-center justify-center w-full gap-2 px-4 py-3 text-sm font-semibold text-white transition-colors rounded-xl bg-brand-gold hover:bg-brand-gold/90 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {submittingCreate ? (
                      <>
                        <Loader2 size={16} className="animate-spin" />
                        Creating...
                      </>
                    ) : (
                      <>
                        <ArrowUpRight size={16} />
                        Create Escalation
                      </>
                    )}
                  </button>
                </>
              )}
            </form>
          )}

          {/* ── LIST TABS (Incoming / Outgoing) ─────────────── */}
          {(activeTab === TAB_KEYS.INCOMING || activeTab === TAB_KEYS.OUTGOING) && (
            <div>
              {/* Status filter bar */}
              <div className="flex items-center gap-1.5 px-4 py-3 border-b border-white/5 sm:px-6 overflow-x-auto no-scrollbar">
                <Filter size={12} className="text-gray-600 shrink-0 mr-1" />
                {STATUS_FILTERS.map(({ key, label }) => (
                  <button
                    key={key}
                    onClick={() => setStatusFilter(key)}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-colors shrink-0
                      ${statusFilter === key
                        ? 'bg-white/10 text-white'
                        : 'text-gray-500 hover:text-gray-300 hover:bg-white/5'
                      }`}
                  >
                    {label}
                  </button>
                ))}
              </div>

              {/* Loading state */}
              {loading && (
                <div className="flex items-center justify-center py-16">
                  <Loader2 size={24} className="text-gray-600 animate-spin" />
                </div>
              )}

              {/* Empty state */}
              {!loading && filteredEscalations.length === 0 && (
                <div className="flex flex-col items-center justify-center py-16 text-center px-6">
                  <div className="flex items-center justify-center w-12 h-12 mb-3 rounded-2xl bg-white/5">
                    <Inbox size={24} className="text-gray-600" />
                  </div>
                  <p className="text-sm font-medium text-gray-400">No escalations found</p>
                  <p className="mt-1 text-xs text-gray-600">
                    {activeTab === TAB_KEYS.INCOMING
                      ? 'No escalations have been sent to your panel.'
                      : 'You have not created any escalations yet.'}
                  </p>
                  {activeTab === TAB_KEYS.OUTGOING && targets.length > 0 && (
                    <button
                      onClick={() => setActiveTab(TAB_KEYS.CREATE)}
                      className="flex items-center gap-1.5 px-3 py-2 mt-4 text-xs font-semibold transition-colors rounded-lg text-brand-gold hover:bg-brand-gold/10"
                    >
                      <Plus size={14} />
                      Create New Escalation
                    </button>
                  )}
                </div>
              )}

              {/* Escalation cards */}
              {!loading && filteredEscalations.length > 0 && (
                <ul className="divide-y divide-white/5" role="list">
                  {filteredEscalations.map(esc => {
                    const isExpanded = expandedId === esc.id;
                    const isResolving = resolvingId === esc.id;
                    const isResponding = respondingTo === esc.id;
                    const priorityMeta = ESCALATION_PRIORITIES[esc.priority] || {};
                    const fromRoleColor = ROLE_COLORS[esc.from.role] || 'bg-gray-500/10 text-gray-400';
                    const toRoleColor = ROLE_COLORS[esc.to.role] || 'bg-gray-500/10 text-gray-400';

                    return (
                      <li key={esc.id} className="group">
                        {/* Card header (clickable) */}
                        <button
                          onClick={() => {
                            setExpandedId(isExpanded ? null : esc.id);
                            setRespondingTo(null);
                            setResolvingId(null);
                            setResponseText('');
                            setResolutionText('');
                          }}
                          className="flex items-start w-full gap-3 px-4 py-3.5 text-left transition-colors hover:bg-white/[0.02] sm:px-6"
                          aria-expanded={isExpanded}
                          aria-label={`Escalation: ${esc.subject}`}
                        >
                          {/* Priority dot */}
                          <div className="mt-1.5 shrink-0">
                            <span className={`block w-2.5 h-2.5 rounded-full ${PRIORITY_DOT[esc.priority]}`}
                              title={`${esc.priority} — ${priorityMeta.label}`} />
                          </div>

                          {/* Content */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              {/* Priority badge */}
                              <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-bold ${PRIORITY_STYLES[esc.priority]}`}>
                                {esc.priority}
                              </span>
                              {/* Status badge */}
                              <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-bold ${STATUS_STYLES[esc.status]}`}>
                                {STATUS_LABELS[esc.status]}
                              </span>
                              {/* Timestamp */}
                              <span className="text-[10px] text-gray-600 ml-auto shrink-0">
                                {timeAgo(esc.createdAt)}
                              </span>
                            </div>

                            {/* Subject */}
                            <p className="mt-1.5 text-sm font-medium text-gray-200 leading-snug line-clamp-2">
                              {esc.subject}
                            </p>

                            {/* From / To */}
                            <div className="flex items-center gap-2 mt-2 flex-wrap">
                              <div className="flex items-center gap-1">
                                <User size={10} className="text-gray-600" />
                                <span className="text-[10px] text-gray-500">{esc.from.name}</span>
                                <span className={`px-1 py-0.5 rounded text-[8px] font-bold ${fromRoleColor}`}>
                                  {ROLE_LABELS[esc.from.role] || esc.from.role}
                                </span>
                              </div>
                              <ArrowUpRight size={10} className="text-gray-600" />
                              <span className={`px-1 py-0.5 rounded text-[8px] font-bold ${toRoleColor}`}>
                                {ROLE_LABELS[esc.to.role] || esc.to.role}
                              </span>
                            </div>
                          </div>

                          {/* Chevron */}
                          <div className="mt-1 shrink-0">
                            {isExpanded
                              ? <ChevronUp size={16} className="text-gray-600" />
                              : <ChevronDown size={16} className="text-gray-600" />
                            }
                          </div>
                        </button>

                        {/* Expanded detail */}
                        {isExpanded && (
                          <div className="px-4 pb-4 sm:px-6 space-y-3 border-t border-white/5 bg-white/[0.01]">
                            {/* Full note */}
                            <div className="pt-3">
                              <h4 className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-1">
                                Description
                              </h4>
                              <p className="text-sm leading-relaxed text-gray-300 whitespace-pre-wrap">
                                {esc.note}
                              </p>
                            </div>

                            {/* Context entity */}
                            {esc.context && (
                              <div className="flex items-center gap-2 p-2.5 rounded-xl bg-white/5">
                                <span className="text-[10px] font-semibold text-gray-500 uppercase">
                                  {esc.context.type}:
                                </span>
                                <span className="text-xs font-medium text-gray-300">
                                  {esc.context.entityLabel}
                                </span>
                                <span className="text-[10px] text-gray-600">
                                  ({esc.context.entityId})
                                </span>
                              </div>
                            )}

                            {/* Assigned admin */}
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <Shield size={12} className="text-gray-600" />
                                <span className="text-[10px] text-gray-500">Assigned to:</span>
                                <span className="text-xs font-medium text-gray-300">
                                  {esc.assignedTo ? esc.assignedTo.name : 'Unassigned'}
                                </span>
                              </div>
                              {/* Assign dropdown (for incoming, unassigned, non-resolved) */}
                              {activeTab === TAB_KEYS.INCOMING && !esc.assignedTo && esc.status !== 'resolved' && (
                                <select
                                  onChange={(e) => { if (e.target.value) handleAssign(esc.id, e.target.value); }}
                                  defaultValue=""
                                  className="px-2 py-1 text-[10px] bg-gray-800 border border-white/10 rounded-lg text-gray-300 outline-none"
                                  aria-label="Assign escalation"
                                >
                                  <option value="">Assign...</option>
                                  {MOCK_ADMIN_ACCOUNTS
                                    .filter(a => a.role === esc.to.role || a.role === 'super_admin')
                                    .map(a => (
                                      <option key={a.id} value={a.id}>{a.name}</option>
                                    ))
                                  }
                                </select>
                              )}
                            </div>

                            {/* Timestamps */}
                            <div className="flex items-center gap-4 text-[10px] text-gray-600">
                              <span className="flex items-center gap-1">
                                <Clock size={10} /> Created: {formatDate(esc.createdAt)}
                              </span>
                              {esc.resolvedAt && (
                                <span className="flex items-center gap-1">
                                  <CheckCircle2 size={10} className="text-emerald-500" /> Resolved: {formatDate(esc.resolvedAt)}
                                </span>
                              )}
                            </div>

                            {/* Resolution (if resolved) */}
                            {esc.resolution && (
                              <div className="p-3 rounded-xl bg-emerald-500/5 border border-emerald-500/10">
                                <h4 className="text-[10px] font-semibold text-emerald-400 uppercase tracking-wider mb-1 flex items-center gap-1">
                                  <CheckCircle2 size={10} />
                                  Resolution
                                </h4>
                                <p className="text-xs text-gray-300">{esc.resolution}</p>
                              </div>
                            )}

                            {/* Responses thread */}
                            {esc.responses && esc.responses.length > 0 && (
                              <div>
                                <h4 className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-2 flex items-center gap-1">
                                  <MessageSquare size={10} />
                                  Responses ({esc.responses.length})
                                </h4>
                                <div className="space-y-2">
                                  {esc.responses.map((resp, idx) => {
                                    const respRoleColor = ROLE_COLORS[resp.role] || 'bg-gray-500/10 text-gray-400';
                                    return (
                                      <div key={idx} className="p-3 rounded-xl bg-white/5">
                                        <div className="flex items-center gap-2 mb-1.5">
                                          <span className="text-xs font-medium text-gray-300">{resp.name}</span>
                                          <span className={`px-1 py-0.5 rounded text-[8px] font-bold ${respRoleColor}`}>
                                            {ROLE_LABELS[resp.role] || resp.role}
                                          </span>
                                          <span className="text-[10px] text-gray-600 ml-auto">
                                            {timeAgo(resp.timestamp)}
                                          </span>
                                        </div>
                                        <p className="text-xs text-gray-400 leading-relaxed">{resp.message}</p>
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>
                            )}

                            {/* Action buttons (only for non-resolved) */}
                            {esc.status !== 'resolved' && (
                              <div className="flex items-center gap-2 pt-2">
                                {/* Respond toggle */}
                                {!isResolving && (
                                  <button
                                    onClick={() => {
                                      setRespondingTo(isResponding ? null : esc.id);
                                      setResolvingId(null);
                                    }}
                                    className="flex items-center gap-1.5 px-3 py-2 text-[11px] font-semibold text-blue-400 transition-colors rounded-lg bg-blue-500/10 hover:bg-blue-500/20"
                                  >
                                    <MessageSquare size={12} />
                                    {isResponding ? 'Cancel' : 'Respond'}
                                  </button>
                                )}

                                {/* Resolve toggle (incoming only) */}
                                {activeTab === TAB_KEYS.INCOMING && !isResponding && (
                                  <button
                                    onClick={() => {
                                      setResolvingId(isResolving ? null : esc.id);
                                      setRespondingTo(null);
                                    }}
                                    className="flex items-center gap-1.5 px-3 py-2 text-[11px] font-semibold text-emerald-400 transition-colors rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20"
                                  >
                                    <CheckCircle2 size={12} />
                                    {isResolving ? 'Cancel' : 'Resolve'}
                                  </button>
                                )}
                              </div>
                            )}

                            {/* Response form */}
                            {isResponding && esc.status !== 'resolved' && (
                              <div className="pt-1 space-y-2">
                                <textarea
                                  value={responseText}
                                  onChange={(e) => setResponseText(e.target.value)}
                                  rows={3}
                                  maxLength={1000}
                                  className="w-full px-3 py-2.5 text-sm bg-gray-800 border border-white/10 rounded-xl text-gray-200 placeholder-gray-600 focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 outline-none resize-none"
                                  placeholder="Type your response..."
                                  aria-label="Escalation response"
                                />
                                <div className="flex justify-end">
                                  <button
                                    onClick={() => handleRespond(esc.id)}
                                    disabled={submittingResponse || !responseText.trim()}
                                    className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white transition-colors rounded-lg bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                                  >
                                    {submittingResponse ? (
                                      <Loader2 size={12} className="animate-spin" />
                                    ) : (
                                      <Send size={12} />
                                    )}
                                    Send Response
                                  </button>
                                </div>
                              </div>
                            )}

                            {/* Resolve form */}
                            {isResolving && esc.status !== 'resolved' && (
                              <div className="pt-1 space-y-2">
                                <textarea
                                  value={resolutionText}
                                  onChange={(e) => setResolutionText(e.target.value)}
                                  rows={3}
                                  maxLength={1000}
                                  className="w-full px-3 py-2.5 text-sm bg-gray-800 border border-white/10 rounded-xl text-gray-200 placeholder-gray-600 focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 outline-none resize-none"
                                  placeholder="Summarize how this was resolved..."
                                  aria-label="Resolution summary"
                                />
                                <div className="flex justify-end">
                                  <button
                                    onClick={() => handleResolve(esc.id)}
                                    disabled={submittingResolve || !resolutionText.trim()}
                                    className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white transition-colors rounded-lg bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed"
                                  >
                                    {submittingResolve ? (
                                      <Loader2 size={12} className="animate-spin" />
                                    ) : (
                                      <CheckCircle2 size={12} />
                                    )}
                                    Mark as Resolved
                                  </button>
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          )}
        </div>

        {/* ═══ FOOTER ═══ */}
        <div className="px-4 py-3 border-t border-white/5 shrink-0 sm:px-6">
          <div className="flex items-center justify-between">
            <p className="text-[10px] text-gray-600">
              {ROLE_LABELS[role]} Panel
            </p>
            <p className="text-[10px] text-gray-600">
              {filteredEscalations.length} escalation{filteredEscalations.length !== 1 ? 's' : ''}
            </p>
          </div>
        </div>
      </div>

      {/* Toast notification */}
      {toast && (
        <Toast
          key={toast.key}
          message={toast.message}
          type={toast.type}
          onDismiss={() => setToast(null)}
        />
      )}
    </>
  );
}
