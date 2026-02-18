import { useState, useMemo, useEffect } from 'react';
import {
  AlertCircle, Clock, AlertTriangle, CheckCircle2,
  Search, Eye, UserCheck, Gavel, ArrowUpRight,
} from 'lucide-react';
import { PRO_RECTIFICATION_STATUSES } from '../../data/proConstants.js';
import * as proAdminService from '../../services/proAdmin.service.js';

/* ════════════════════════════════════════════════════════════
   PRO RECTIFICATION MANAGEMENT — Dispute rectification cases
   Route: /admin/pro-rectification
════════════════════════════════════════════════════════════ */

/* ── Mock data ─────────────────────────────────────────────── */
const MOCK_CASES = [
  {
    id: 'rc1', caseNum: 'REC-001', service: 'Full Plumbing Overhaul',
    client: 'Adaeze Obi', provider: 'Emeka Nwosu',
    issue: 'Incomplete work', status: 'reported',
    slaHoursRemaining: 68, priority: 'medium',
    createdAt: '2025-03-01T08:00:00Z',
  },
  {
    id: 'rc2', caseNum: 'REC-002', service: 'Painting — Living Room',
    client: 'Ibrahim Musa', provider: 'Tunde Bakare',
    issue: 'Quality below standard', status: 'provider_notified',
    slaHoursRemaining: 42, priority: 'high',
    createdAt: '2025-02-28T14:00:00Z',
  },
  {
    id: 'rc3', caseNum: 'REC-003', service: 'AC Installation',
    client: 'Chinwe Eze', provider: 'Amina Suleiman',
    issue: 'Damage to property', status: 'escalated',
    slaHoursRemaining: 8, priority: 'critical',
    createdAt: '2025-02-27T10:00:00Z',
  },
  {
    id: 'rc4', caseNum: 'REC-004', service: 'Electrical Rewiring',
    client: 'Oluwaseun Ajayi', provider: 'Chukwuemeka Eze',
    issue: 'Safety concern', status: 'fix_scheduled',
    slaHoursRemaining: 55, priority: 'high',
    createdAt: '2025-02-26T16:00:00Z',
  },
  {
    id: 'rc5', caseNum: 'REC-005', service: 'Tiling — Bathroom',
    client: 'Funke Adeyemi', provider: 'Ngozi Okafor',
    issue: 'Scope dispute', status: 'fix_in_progress',
    slaHoursRemaining: 30, priority: 'medium',
    createdAt: '2025-02-25T09:00:00Z',
  },
  {
    id: 'rc6', caseNum: 'REC-006', service: 'Deep Cleaning',
    client: 'Tunde Bakare', provider: 'Funke Adeyemi',
    issue: 'No-show', status: 'resolved',
    slaHoursRemaining: 0, priority: 'low',
    createdAt: '2025-02-20T11:00:00Z',
  },
];

const STAT_CARDS = [
  { key: 'activeCases',     label: 'Active Cases',       value: 4, icon: AlertCircle,   color: 'text-amber-500',   bg: 'bg-amber-50 dark:bg-amber-500/10' },
  { key: 'awaitingProvider', label: 'Awaiting Provider', value: 2, icon: Clock,         color: 'text-blue-500',    bg: 'bg-blue-50 dark:bg-blue-500/10' },
  { key: 'escalated',       label: 'Escalated',          value: 1, icon: AlertTriangle, color: 'text-red-500',     bg: 'bg-red-50 dark:bg-red-500/10' },
  { key: 'resolved30d',     label: 'Resolved (30d)',     value: 8, icon: CheckCircle2,  color: 'text-emerald-500', bg: 'bg-emerald-50 dark:bg-emerald-500/10' },
];

const TABS = [
  { id: 'all',                label: 'Active' },
  { id: 'provider_notified',  label: 'Awaiting Provider' },
  { id: 'escalated',          label: 'Escalated' },
  { id: 'resolved',           label: 'Resolved' },
];

const PRIORITY_STYLES = {
  low:      { label: 'Low',      bg: 'bg-gray-100 dark:bg-gray-500/10',   text: 'text-gray-500',  pulse: false },
  medium:   { label: 'Medium',   bg: 'bg-amber-50 dark:bg-amber-500/10',  text: 'text-amber-600', pulse: false },
  high:     { label: 'High',     bg: 'bg-red-50 dark:bg-red-500/10',      text: 'text-red-600',   pulse: false },
  critical: { label: 'Critical', bg: 'bg-red-50 dark:bg-red-500/10',      text: 'text-red-600',   pulse: true },
};

/* ── SLA timer display ────────────────────────────────────── */
function SLATimer({ hoursRemaining }) {
  if (hoursRemaining <= 0) {
    return (
      <span className="text-[10px] px-2.5 py-1 rounded-full font-bold bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600">
        Resolved
      </span>
    );
  }
  const isUrgent = hoursRemaining < 12;
  return (
    <span className={`text-[10px] px-2.5 py-1 rounded-full font-bold whitespace-nowrap ${
      isUrgent
        ? 'bg-red-50 dark:bg-red-500/10 text-red-600'
        : 'bg-blue-50 dark:bg-blue-500/10 text-blue-600'
    }`}>
      {hoursRemaining}h / 72h
    </span>
  );
}

/* ══════════════════════════════════════════════════════════════
   COMPONENT
══════════════════════════════════════════════════════════════ */
export default function ProRectificationManagement() {
  const [cases, setCases]         = useState(MOCK_CASES);
  const [activeTab, setActiveTab] = useState('all');
  const [search, setSearch]       = useState('');

  useEffect(() => {
    (async () => {
      try {
        const res = await proAdminService.getProRectifications({ page: 1, limit: 50 });
        if (res.success && res.rectifications?.length) {
          setCases(res.rectifications.map(r => ({
            id: r.id,
            caseNum: r.case_num || `REC-${r.id.slice(0, 3).toUpperCase()}`,
            service: r.service || r.booking_title || '',
            client: r.client_name || '',
            provider: r.provider_name || '',
            issue: r.category || r.description || '',
            status: r.status || 'reported',
            slaHoursRemaining: r.sla_hours_remaining ?? Math.max(0, 72 - Math.floor((Date.now() - new Date(r.created_at)) / 3600000)),
            priority: r.priority || 'medium',
            createdAt: r.created_at,
          })));
        }
      } catch { /* keep mock fallback */ }
    })();
  }, []);

  /* ── Filter logic ──────────────────────────────────────── */
  const filtered = useMemo(() => {
    let list = cases;
    if (activeTab === 'provider_notified') {
      list = list.filter((c) => c.status === 'provider_notified' || c.status === 'reported');
    } else if (activeTab === 'escalated') {
      list = list.filter((c) => c.status === 'escalated');
    } else if (activeTab === 'resolved') {
      list = list.filter((c) => c.status === 'resolved');
    }
    // 'all' shows active (non-resolved)
    if (activeTab === 'all') {
      list = list.filter((c) => c.status !== 'resolved');
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter((c) =>
        c.caseNum.toLowerCase().includes(q) ||
        c.service.toLowerCase().includes(q) ||
        c.client.toLowerCase().includes(q) ||
        c.provider.toLowerCase().includes(q) ||
        c.issue.toLowerCase().includes(q)
      );
    }
    return list;
  }, [cases, activeTab, search]);

  /* ── Actions ───────────────────────────────────────────── */
  const handleAction = (id, action) => {
    if (action === 'escalate') {
      setCases((prev) => prev.map((c) => c.id === id ? { ...c, status: 'escalated', priority: 'critical' } : c));
    } else if (action === 'resolve') {
      setCases((prev) => prev.map((c) => c.id === id ? { ...c, status: 'resolved', slaHoursRemaining: 0 } : c));
    }
  };

  return (
    <div className="pb-8 space-y-5">
      {/* ── Header ───────────────────────────────────────────── */}
      <div>
        <h1 className="text-xl font-bold font-display text-brand-charcoal-dark dark:text-white">
          Pro Rectification Management
        </h1>
        <p className="text-sm text-gray-400 mt-0.5">
          Manage rectification disputes and SLA compliance for Pro bookings
        </p>
      </div>

      {/* ── Stat cards ───────────────────────────────────────── */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {STAT_CARDS.map((s) => {
          const Icon = s.icon;
          return (
            <div key={s.key} className="p-4 bg-white dark:bg-gray-900 rounded-2xl shadow-card sm:p-5">
              <div className={`w-9 h-9 ${s.bg} rounded-xl flex items-center justify-center mb-2`}>
                <Icon size={16} className={s.color} />
              </div>
              <p className="text-xs text-gray-400">{s.label}</p>
              <p className="text-lg font-extrabold text-brand-charcoal-dark dark:text-white">{s.value}</p>
            </div>
          );
        })}
      </div>

      {/* ── Search ───────────────────────────────────────────── */}
      <div className="relative">
        <Search size={16} className="absolute text-gray-400 -translate-y-1/2 left-3 top-1/2" />
        <input
          type="text"
          placeholder="Search by case #, service, client, or provider..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full py-2.5 pl-10 pr-4 text-sm bg-white dark:bg-gray-900 border border-gray-200 dark:border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-gold/40 text-brand-charcoal-dark dark:text-white placeholder-gray-400"
        />
      </div>

      {/* ── Tab bar ──────────────────────────────────────────── */}
      <div className="flex gap-2 overflow-x-auto scrollbar-hide">
        {TABS.map((tab) => {
          const active = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2 text-xs font-bold rounded-xl transition-colors whitespace-nowrap shrink-0
                ${active
                  ? 'bg-brand-charcoal-dark dark:bg-white text-white dark:text-gray-900'
                  : 'bg-gray-100 dark:bg-white/5 text-gray-500 hover:bg-gray-200 dark:hover:bg-white/10'
                }`}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* ── Table ────────────────────────────────────────────── */}
      {filtered.length === 0 ? (
        <div className="py-16 text-center">
          <CheckCircle2 size={36} className="mx-auto mb-3 text-gray-300" />
          <p className="text-sm font-semibold text-brand-charcoal-dark dark:text-white">No cases found</p>
          <p className="mt-1 text-xs text-gray-400">No rectification cases match your filter</p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-gray-200 dark:border-white/10">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-gray-50 dark:bg-white/5">
                {['Case #', 'Service', 'Client', 'Provider', 'Issue', 'Status', 'SLA Timer', 'Priority', 'Actions'].map((h) => (
                  <th key={h} className="px-4 py-3 text-[10px] font-semibold text-gray-400 uppercase tracking-wider whitespace-nowrap">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-white/5">
              {filtered.map((c) => {
                const statusDef = PRO_RECTIFICATION_STATUSES[c.status];
                const priorityDef = PRIORITY_STYLES[c.priority] || PRIORITY_STYLES.medium;
                const isActive = c.status !== 'resolved';

                return (
                  <tr key={c.id} className="bg-white dark:bg-gray-900 hover:bg-gray-50 dark:hover:bg-white/[0.02] transition-colors">
                    <td className="px-4 py-3 text-xs font-mono font-bold text-brand-charcoal-dark dark:text-white whitespace-nowrap">{c.caseNum}</td>
                    <td className="px-4 py-3 text-xs font-semibold text-brand-charcoal-dark dark:text-white whitespace-nowrap">{c.service}</td>
                    <td className="px-4 py-3 text-xs text-gray-600 dark:text-gray-300 whitespace-nowrap">{c.client}</td>
                    <td className="px-4 py-3 text-xs text-gray-600 dark:text-gray-300 whitespace-nowrap">{c.provider}</td>
                    <td className="px-4 py-3 text-xs text-gray-600 dark:text-gray-300 whitespace-nowrap">{c.issue}</td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      {statusDef ? (
                        <span className={`text-[10px] px-2.5 py-1 rounded-full font-medium whitespace-nowrap ${statusDef.color}`}>
                          {statusDef.label}
                        </span>
                      ) : (
                        <span className="text-[10px] text-gray-400">{c.status}</span>
                      )}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <SLATimer hoursRemaining={c.slaHoursRemaining} />
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className={`text-[10px] px-2.5 py-1 rounded-full font-bold ${priorityDef.bg} ${priorityDef.text} ${priorityDef.pulse ? 'animate-pulse' : ''}`}>
                        {priorityDef.label}
                      </span>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="flex gap-1.5">
                        <button
                          className="flex items-center gap-1 px-2.5 py-1.5 text-[10px] font-bold text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-white/5 rounded-lg hover:bg-gray-200 dark:hover:bg-white/10 transition-colors"
                          title="View Details"
                        >
                          <Eye size={11} /> View
                        </button>
                        {isActive && (
                          <>
                            <button
                              className="flex items-center gap-1 px-2.5 py-1.5 text-[10px] font-bold text-blue-600 bg-blue-50 dark:bg-blue-500/10 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-500/20 transition-colors"
                              title="Assign to Me"
                            >
                              <UserCheck size={11} />
                            </button>
                            <button
                              onClick={() => handleAction(c.id, 'resolve')}
                              className="flex items-center gap-1 px-2.5 py-1.5 text-[10px] font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-500/10 rounded-lg hover:bg-emerald-100 dark:hover:bg-emerald-500/20 transition-colors"
                              title="Issue Ruling"
                            >
                              <Gavel size={11} />
                            </button>
                            {c.status !== 'escalated' && (
                              <button
                                onClick={() => handleAction(c.id, 'escalate')}
                                className="flex items-center gap-1 px-2.5 py-1.5 text-[10px] font-bold text-red-600 bg-red-50 dark:bg-red-500/10 rounded-lg hover:bg-red-100 dark:hover:bg-red-500/20 transition-colors"
                                title="Escalate"
                              >
                                <ArrowUpRight size={11} />
                              </button>
                            )}
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* ── Info banner ──────────────────────────────────────── */}
      <div className="flex items-center gap-2 px-4 py-2.5 text-xs font-medium text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-500/10 rounded-xl">
        <AlertCircle size={14} className="shrink-0" />
        Rectification SLA: 72-hour resolution window. Cases auto-escalate if SLA is breached.
      </div>
    </div>
  );
}
