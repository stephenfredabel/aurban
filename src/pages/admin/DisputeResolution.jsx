import { useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import {
  AlertTriangle, Search, MessageSquare, Shield,
  CheckCircle2, XCircle, RotateCcw, Clock,
  DollarSign, User, Eye,
} from 'lucide-react';
import * as adminService from '../../services/admin.service.js';
import RequirePermission from '../../components/admin/RequirePermission.jsx';
import { useAuth } from '../../context/AuthContext.jsx';

/* ════════════════════════════════════════════════════════════
   DISPUTE RESOLUTION — Admin dispute management panel
   Route: /admin/disputes
════════════════════════════════════════════════════════════ */

const MOCK_DISPUTES = [
  {
    id: 'd1', orderId: 'ord_a03', ref: 'ORD-240203-CCC',
    buyer: 'Chinwe Eze', seller: 'TechHome', amount: 324800,
    reason: 'Wrong item received — ordered Samsung AC, got LG',
    status: 'open', priority: 'high', category: 'wrong_item',
    createdAt: Date.now() - 3 * 86400_000,
    messages: 4, evidence: 2,
  },
  {
    id: 'd2', orderId: 'ord_a05', ref: 'ORD-240205-EEE',
    buyer: 'Funke Adeyemi', seller: 'Lagos Plumbing', amount: 135450,
    reason: 'Items arrived damaged — cracked WC cistern and broken pipe fittings',
    status: 'open', priority: 'medium', category: 'damaged',
    createdAt: Date.now() - 2 * 86400_000,
    messages: 2, evidence: 5,
  },
  {
    id: 'd3', orderId: 'ord_b01', ref: 'ORD-240110-GGG',
    buyer: 'Tunde Bakare', seller: 'Ngozi Furniture', amount: 89000,
    reason: 'Item not as described — colour different from listing',
    status: 'resolved', priority: 'low', category: 'not_as_described',
    resolution: 'Partial refund — ₦20,000 returned to buyer',
    createdAt: Date.now() - 15 * 86400_000,
    messages: 8, evidence: 3,
  },
  {
    id: 'd4', orderId: 'ord_b02', ref: 'ORD-240120-HHH',
    buyer: 'Ibrahim Musa', seller: 'Chukwuemeka Eze', amount: 228150,
    reason: 'Never received delivery — seller claims delivered, no proof',
    status: 'escalated', priority: 'high', category: 'not_delivered',
    createdAt: Date.now() - 5 * 86400_000,
    messages: 6, evidence: 1,
  },
];

const TABS = [
  { id: 'all',       label: 'All'       },
  { id: 'open',      label: 'Open'      },
  { id: 'escalated', label: 'Escalated' },
  { id: 'resolved',  label: 'Resolved'  },
];

const STATUS_STYLES = {
  open:      { label: 'Open',      color: 'bg-amber-50 dark:bg-amber-500/10 text-amber-600' },
  escalated: { label: 'Escalated', color: 'bg-red-50 dark:bg-red-500/10 text-red-600' },
  resolved:  { label: 'Resolved',  color: 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600' },
  closed:    { label: 'Closed',    color: 'bg-gray-100 dark:bg-white/10 text-gray-500' },
};

const PRIORITY_STYLES = {
  high:   'bg-red-50 dark:bg-red-500/10 text-red-600',
  medium: 'bg-amber-50 dark:bg-amber-500/10 text-amber-600',
  low:    'bg-blue-50 dark:bg-blue-500/10 text-blue-600',
};

const CATEGORY_LABELS = {
  wrong_item:       'Wrong Item',
  damaged:          'Damaged',
  not_as_described: 'Not as Described',
  not_delivered:    'Not Delivered',
  other:            'Other',
};

export default function DisputeResolution() {
  const { t } = useTranslation('admin');
  const { user } = useAuth();

  const [disputes, setDisputes] = useState(MOCK_DISPUTES);
  const [tab, setTab]           = useState('all');
  const [search, setSearch]     = useState('');
  const [loading, setLoading]   = useState(true);
  const [resolveId, setResolveId] = useState(null);
  const [resolution, setResolution] = useState('');
  const [resolutionType, setResolutionType] = useState('full_refund');

  useEffect(() => { document.title = 'Dispute Resolution — Admin'; }, []);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      // In production, call adminService.getDisputes()
      setTimeout(() => { if (!cancelled) setLoading(false); }, 300);
    }
    load();
    return () => { cancelled = true; };
  }, []);

  const filtered = useMemo(() => {
    let list = disputes;
    if (tab !== 'all') list = list.filter(d => d.status === tab);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(d =>
        d.ref?.toLowerCase().includes(q) ||
        d.buyer?.toLowerCase().includes(q) ||
        d.seller?.toLowerCase().includes(q) ||
        d.reason?.toLowerCase().includes(q)
      );
    }
    return list;
  }, [tab, disputes, search]);

  const handleResolve = (disputeId) => {
    if (!resolution.trim()) return;
    setDisputes(prev => prev.map(d =>
      d.id === disputeId ? { ...d, status: 'resolved', resolution: `${resolutionType}: ${resolution}` } : d
    ));
    setResolveId(null);
    setResolution('');
  };

  const handleEscalate = (disputeId) => {
    setDisputes(prev => prev.map(d =>
      d.id === disputeId ? { ...d, status: 'escalated', priority: 'high' } : d
    ));
  };

  const formatDate = (ts) => new Date(ts).toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: 'numeric' });
  const formatMoney = (n) => '₦' + n.toLocaleString();

  return (
    <RequirePermission permission="bookings:view" fallback={<p className="p-8 text-center text-gray-400">Access denied</p>}>
      <div>
        <h1 className="mb-1 section-title">Dispute Resolution</h1>
        <p className="mb-5 text-sm text-gray-400">Review and resolve buyer-seller disputes</p>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-3 mb-5 lg:grid-cols-4">
          {[
            { label: 'Total Disputes', value: disputes.length, icon: AlertTriangle, color: 'text-amber-500', bg: 'bg-amber-50 dark:bg-amber-500/10' },
            { label: 'Open',    value: disputes.filter(d => d.status === 'open').length, icon: Clock, color: 'text-blue-500', bg: 'bg-blue-50 dark:bg-blue-500/10' },
            { label: 'Escalated', value: disputes.filter(d => d.status === 'escalated').length, icon: AlertTriangle, color: 'text-red-500', bg: 'bg-red-50 dark:bg-red-500/10' },
            { label: 'Amount at Stake', value: formatMoney(disputes.filter(d => d.status !== 'resolved').reduce((s, d) => s + d.amount, 0)), icon: DollarSign, color: 'text-purple-500', bg: 'bg-purple-50 dark:bg-purple-500/10' },
          ].map(({ label, value, icon: Icon, color, bg }) => (
            <div key={label} className="p-4 bg-white border border-gray-100 dark:border-white/10 rounded-2xl dark:bg-gray-900">
              <div className={`flex items-center justify-center w-9 h-9 mb-2 rounded-xl ${bg}`}>
                <Icon size={16} className={color} />
              </div>
              <p className="text-xs text-gray-400">{label}</p>
              <p className="text-lg font-extrabold text-brand-charcoal-dark dark:text-white">{value}</p>
            </div>
          ))}
        </div>

        {/* Search */}
        <div className="relative mb-4">
          <Search size={14} className="absolute text-gray-400 left-3 top-3" />
          <input type="text" value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search disputes..."
            className="w-full py-2.5 pl-9 pr-4 text-sm border border-gray-200 dark:border-white/10 rounded-xl bg-white dark:bg-white/5 text-brand-charcoal-dark dark:text-white placeholder:text-gray-300 focus:ring-2 focus:ring-brand-gold/30 focus:border-brand-gold outline-none"
          />
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-5 overflow-x-auto">
          {TABS.map(({ id, label }) => (
            <button key={id} onClick={() => setTab(id)}
              className={`px-4 py-2 text-xs font-bold rounded-xl transition-colors whitespace-nowrap ${
                tab === id ? 'bg-brand-gold text-white' : 'bg-gray-100 dark:bg-white/5 text-gray-500'
              }`}>
              {label}
            </button>
          ))}
        </div>

        {/* Dispute list */}
        <div className="space-y-3">
          {filtered.length === 0 && (
            <div className="py-12 text-center text-sm text-gray-400">No disputes match your filters</div>
          )}
          {filtered.map(dispute => {
            const statusDef = STATUS_STYLES[dispute.status] || STATUS_STYLES.open;
            const priorityStyle = PRIORITY_STYLES[dispute.priority] || PRIORITY_STYLES.medium;

            return (
              <div key={dispute.id} className="p-4 bg-white border border-gray-100 dark:border-white/10 rounded-2xl dark:bg-gray-900 sm:p-5">
                {/* Header */}
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-mono text-gray-400">{dispute.ref}</span>
                      <span className={`px-1.5 py-0.5 text-[9px] font-bold rounded-full ${priorityStyle}`}>
                        {dispute.priority?.toUpperCase()}
                      </span>
                      <span className="px-1.5 py-0.5 text-[9px] font-bold rounded-full bg-gray-100 dark:bg-white/10 text-gray-500">
                        {CATEGORY_LABELS[dispute.category] || dispute.category}
                      </span>
                    </div>
                    <p className="text-sm font-bold text-brand-charcoal-dark dark:text-white">{dispute.reason}</p>
                  </div>
                  <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold whitespace-nowrap ${statusDef.color}`}>
                    {statusDef.label}
                  </span>
                </div>

                {/* Details */}
                <div className="flex flex-wrap items-center gap-4 mb-3 text-xs text-gray-400">
                  <span className="flex items-center gap-1">
                    <User size={11} /> Buyer: <span className="font-semibold text-brand-charcoal-dark dark:text-white">{dispute.buyer}</span>
                  </span>
                  <span className="flex items-center gap-1">
                    vs Seller: <span className="font-semibold text-brand-charcoal-dark dark:text-white">{dispute.seller}</span>
                  </span>
                  <span className="font-bold text-brand-charcoal-dark dark:text-white">{formatMoney(dispute.amount)}</span>
                  <span><Clock size={11} className="inline mr-1" />{formatDate(dispute.createdAt)}</span>
                  <span>{dispute.messages} messages</span>
                  <span>{dispute.evidence} evidence files</span>
                </div>

                {/* Resolution (if resolved) */}
                {dispute.resolution && (
                  <div className="p-3 mb-3 text-xs border border-emerald-200 dark:border-emerald-500/20 bg-emerald-50 dark:bg-emerald-500/5 rounded-xl">
                    <p className="font-bold text-emerald-700 dark:text-emerald-400">Resolution:</p>
                    <p className="text-emerald-600 dark:text-emerald-400/80">{dispute.resolution}</p>
                  </div>
                )}

                {/* Actions */}
                {dispute.status !== 'resolved' && dispute.status !== 'closed' && (
                  <div className="flex flex-wrap gap-2 pt-3 border-t border-gray-100 dark:border-white/10">
                    <button onClick={() => setResolveId(resolveId === dispute.id ? null : dispute.id)}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-white bg-brand-gold rounded-xl hover:bg-brand-gold-dark transition-colors">
                      <CheckCircle2 size={12} /> Resolve
                    </button>
                    {dispute.status !== 'escalated' && (
                      <button onClick={() => handleEscalate(dispute.id)}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-red-500 bg-red-50 dark:bg-red-500/10 rounded-xl hover:bg-red-100 transition-colors">
                        <AlertTriangle size={12} /> Escalate
                      </button>
                    )}
                  </div>
                )}

                {/* Resolve form */}
                {resolveId === dispute.id && (
                  <div className="mt-3 p-3 border border-brand-gold/20 bg-brand-gold/5 rounded-xl space-y-3">
                    <div className="flex gap-2">
                      {['full_refund', 'partial_refund', 'no_refund'].map(type => (
                        <button key={type} type="button"
                          onClick={() => setResolutionType(type)}
                          className={`flex-1 py-2 text-xs font-bold rounded-lg border capitalize transition-colors ${
                            resolutionType === type
                              ? 'border-brand-gold bg-brand-gold/10 text-brand-gold'
                              : 'border-gray-200 dark:border-white/10 text-gray-500'
                          }`}>
                          {type.replace(/_/g, ' ')}
                        </button>
                      ))}
                    </div>
                    <textarea
                      value={resolution}
                      onChange={e => setResolution(e.target.value)}
                      placeholder="Resolution notes..."
                      rows={2}
                      className="w-full p-3 text-sm border border-gray-200 dark:border-white/10 rounded-xl bg-white dark:bg-white/5 text-brand-charcoal-dark dark:text-white placeholder:text-gray-300 focus:ring-2 focus:ring-brand-gold/30 outline-none resize-none"
                    />
                    <div className="flex gap-2">
                      <button onClick={() => handleResolve(dispute.id)}
                        className="px-4 py-2 text-xs font-bold text-white bg-brand-gold rounded-xl hover:bg-brand-gold-dark transition-colors">
                        Submit Resolution
                      </button>
                      <button onClick={() => setResolveId(null)}
                        className="px-4 py-2 text-xs font-bold text-gray-500 border border-gray-200 dark:border-white/10 rounded-xl hover:bg-gray-50 transition-colors">
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </RequirePermission>
  );
}
