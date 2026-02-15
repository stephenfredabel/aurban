import { useState, useMemo } from 'react';
import {
  Wallet, Eye, Clock, Shield, Search, ChevronDown,
  ArrowUpRight, RotateCcw, Snowflake, FileText,
  AlertCircle,
} from 'lucide-react';
import { PRO_ESCROW_STATUSES, TIER_CONFIG } from '../../data/proConstants.js';

/* ════════════════════════════════════════════════════════════
   PRO ESCROW DASHBOARD — Admin oversight for Pro escrow flow
   Route: /admin/pro-escrow
════════════════════════════════════════════════════════════ */

/* ── Mock data ─────────────────────────────────────────────── */
const MOCK_ESCROWS = [
  {
    id: 'esc1', ref: 'ESC-20250301-001', service: 'Home Deep Clean',
    provider: 'Emeka Nwosu', client: 'Adaeze Obi',
    amount: 85000, status: 'held', tier: 1, escrowState: 'held',
  },
  {
    id: 'esc2', ref: 'ESC-20250228-002', service: 'Full Plumbing Overhaul',
    provider: 'Tunde Bakare', client: 'Ibrahim Musa',
    amount: 350000, status: 'observation_active', tier: 2, escrowState: 'observation_active',
  },
  {
    id: 'esc3', ref: 'ESC-20250227-003', service: 'Solar Panel Installation',
    provider: 'Funke Adeyemi', client: 'Chinwe Eze',
    amount: 2500000, status: 'released', tier: 3, escrowState: 'released',
  },
  {
    id: 'esc4', ref: 'ESC-20250226-004', service: 'AC Installation & Ducting',
    provider: 'Amina Suleiman', client: 'Oluwaseun Ajayi',
    amount: 500000, status: 'frozen', tier: 3, escrowState: 'frozen',
  },
  {
    id: 'esc5', ref: 'ESC-20250225-005', service: 'Building Renovation Phase 1',
    provider: 'Chukwuemeka Eze', client: 'Tunde Bakare',
    amount: 8000000, status: 'held', tier: 4, escrowState: 'held',
  },
  {
    id: 'esc6', ref: 'ESC-20250224-006', service: 'Fumigation Service',
    provider: 'Ngozi Okafor', client: 'Funke Adeyemi',
    amount: 25000, status: 'auto_released', tier: 1, escrowState: 'auto_released',
  },
  {
    id: 'esc7', ref: 'ESC-20250223-007', service: 'Electrical Rewiring',
    provider: 'Ibrahim Musa', client: 'Amina Suleiman',
    amount: 450000, status: 'refunded', tier: 2, escrowState: 'refunded',
  },
  {
    id: 'esc8', ref: 'ESC-20250222-008', service: 'CCTV & Security Setup',
    provider: 'Adaeze Obi', client: 'Chukwuemeka Eze',
    amount: 1200000, status: 'observation_active', tier: 3, escrowState: 'observation_active',
  },
];

const STAT_CARDS = [
  { key: 'totalHeld',      label: 'Total Held',       value: '₦12,450,000', icon: Wallet, color: 'text-blue-500',   bg: 'bg-blue-50 dark:bg-blue-500/10' },
  { key: 'inObservation',  label: 'In Observation',   value: '₦3,200,000',  icon: Eye,    color: 'text-purple-500', bg: 'bg-purple-50 dark:bg-purple-500/10' },
  { key: 'pendingRelease', label: 'Pending Release',   value: '₦1,850,000',  icon: Clock,  color: 'text-amber-500',  bg: 'bg-amber-50 dark:bg-amber-500/10' },
  { key: 'frozen',         label: 'Frozen',            value: '₦500,000',    icon: Shield, color: 'text-red-500',    bg: 'bg-red-50 dark:bg-red-500/10' },
];

const TABS = [
  { id: 'all',                label: 'All' },
  { id: 'held',               label: 'Held' },
  { id: 'observation_active', label: 'Observation' },
  { id: 'released',           label: 'Released' },
  { id: 'frozen',             label: 'Frozen' },
  { id: 'refunded',           label: 'Refunded' },
];

/* ── Escrow state badge using PRO_ESCROW_STATUSES colors ──── */
function EscrowBadge({ state }) {
  const def = PRO_ESCROW_STATUSES[state];
  if (!def) return <span className="text-[10px] text-gray-400">{state}</span>;
  return (
    <span className={`inline-flex items-center gap-1 text-[10px] px-2.5 py-1 rounded-full font-medium whitespace-nowrap ${def.color}`}>
      <span className="w-1.5 h-1.5 rounded-full bg-current opacity-60" />
      {def.label}
    </span>
  );
}

/* ── Tier badge ───────────────────────────────────────────── */
function TierBadge({ tier }) {
  const cfg = TIER_CONFIG[tier];
  if (!cfg) return <span className="text-[10px] text-gray-400">T{tier}</span>;
  return (
    <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${cfg.color}`}>
      {cfg.shortLabel}
    </span>
  );
}

/* ── Action dropdown ──────────────────────────────────────── */
function ActionMenu({ escrow, onAction }) {
  const [open, setOpen] = useState(false);

  const canRelease = ['held', 'observation_active'].includes(escrow.escrowState);
  const canFreeze  = ['held', 'observation_active'].includes(escrow.escrowState);
  const canRefund  = escrow.escrowState === 'frozen';

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1 px-3 py-1.5 text-xs font-bold bg-gray-100 dark:bg-white/5 text-brand-charcoal-dark dark:text-white rounded-lg hover:bg-gray-200 dark:hover:bg-white/10 transition-colors"
      >
        Actions <ChevronDown size={12} className={`transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="absolute right-0 z-20 mt-1 w-44 bg-white dark:bg-gray-800 border border-gray-200 dark:border-white/10 rounded-xl shadow-lg overflow-hidden">
          {canRelease && (
            <button
              onClick={() => { onAction(escrow.id, 'release'); setOpen(false); }}
              className="flex items-center gap-2 w-full px-3 py-2.5 text-xs font-medium text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-500/10 transition-colors"
            >
              <ArrowUpRight size={13} /> Release Funds
            </button>
          )}
          {canFreeze && (
            <button
              onClick={() => { onAction(escrow.id, 'freeze'); setOpen(false); }}
              className="flex items-center gap-2 w-full px-3 py-2.5 text-xs font-medium text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-500/10 transition-colors"
            >
              <Snowflake size={13} /> Freeze Escrow
            </button>
          )}
          {canRefund && (
            <button
              onClick={() => { onAction(escrow.id, 'refund'); setOpen(false); }}
              className="flex items-center gap-2 w-full px-3 py-2.5 text-xs font-medium text-red-600 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors"
            >
              <RotateCcw size={13} /> Refund
            </button>
          )}
          <button
            onClick={() => { onAction(escrow.id, 'view'); setOpen(false); }}
            className="flex items-center gap-2 w-full px-3 py-2.5 text-xs font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors"
          >
            <FileText size={13} /> View Details
          </button>
        </div>
      )}
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════
   COMPONENT
══════════════════════════════════════════════════════════════ */
export default function ProEscrowDashboard() {
  const [escrows, setEscrows]     = useState(MOCK_ESCROWS);
  const [activeTab, setActiveTab] = useState('all');
  const [search, setSearch]       = useState('');

  /* ── Filter logic ──────────────────────────────────────────── */
  const filtered = useMemo(() => {
    let list = escrows;
    if (activeTab !== 'all') list = list.filter((e) => e.escrowState === activeTab);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter((e) =>
        e.ref.toLowerCase().includes(q) ||
        e.service.toLowerCase().includes(q) ||
        e.provider.toLowerCase().includes(q) ||
        e.client.toLowerCase().includes(q)
      );
    }
    return list;
  }, [escrows, activeTab, search]);

  /* ── Actions ───────────────────────────────────────────────── */
  const handleAction = (id, action) => {
    if (action === 'release') {
      setEscrows((prev) => prev.map((e) => e.id === id ? { ...e, escrowState: 'released', status: 'released' } : e));
    } else if (action === 'freeze') {
      setEscrows((prev) => prev.map((e) => e.id === id ? { ...e, escrowState: 'frozen', status: 'frozen' } : e));
    } else if (action === 'refund') {
      setEscrows((prev) => prev.map((e) => e.id === id ? { ...e, escrowState: 'refunded', status: 'refunded' } : e));
    }
    // 'view' — in production, navigate to detail page
  };

  return (
    <div className="pb-8 space-y-5">
      {/* ── Header ───────────────────────────────────────────── */}
      <div>
        <h1 className="text-xl font-bold font-display text-brand-charcoal-dark dark:text-white">
          Pro Escrow Dashboard
        </h1>
        <p className="text-sm text-gray-400 mt-0.5">
          Oversight of all Pro marketplace escrow transactions
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
          placeholder="Search by reference, service, provider, or client..."
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
          <Wallet size={36} className="mx-auto mb-3 text-gray-300" />
          <p className="text-sm font-semibold text-brand-charcoal-dark dark:text-white">No escrow records found</p>
          <p className="mt-1 text-xs text-gray-400">Try adjusting your search or filter</p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-gray-200 dark:border-white/10">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-gray-50 dark:bg-white/5">
                {['Reference', 'Service', 'Provider', 'Client', 'Amount', 'Status', 'Tier', 'Escrow State', 'Actions'].map((h) => (
                  <th key={h} className="px-4 py-3 text-[10px] font-semibold text-gray-400 uppercase tracking-wider whitespace-nowrap">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-white/5">
              {filtered.map((esc) => (
                <tr key={esc.id} className="bg-white dark:bg-gray-900 hover:bg-gray-50 dark:hover:bg-white/[0.02] transition-colors">
                  <td className="px-4 py-3 text-xs font-mono text-gray-500 dark:text-gray-400 whitespace-nowrap">{esc.ref}</td>
                  <td className="px-4 py-3 text-xs font-semibold text-brand-charcoal-dark dark:text-white whitespace-nowrap">{esc.service}</td>
                  <td className="px-4 py-3 text-xs text-gray-600 dark:text-gray-300 whitespace-nowrap">{esc.provider}</td>
                  <td className="px-4 py-3 text-xs text-gray-600 dark:text-gray-300 whitespace-nowrap">{esc.client}</td>
                  <td className="px-4 py-3 text-xs font-bold text-brand-charcoal-dark dark:text-white whitespace-nowrap">
                    ₦{esc.amount.toLocaleString()}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <EscrowBadge state={esc.status} />
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <TierBadge tier={esc.tier} />
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <EscrowBadge state={esc.escrowState} />
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <ActionMenu escrow={esc} onAction={handleAction} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ── Summary banner ───────────────────────────────────── */}
      <div className="flex items-center gap-2 px-4 py-2.5 text-xs font-medium text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-500/10 rounded-xl">
        <AlertCircle size={14} className="shrink-0" />
        Showing {filtered.length} of {escrows.length} escrow records. Mock data for development.
      </div>
    </div>
  );
}
