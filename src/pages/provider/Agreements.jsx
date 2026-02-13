import { useState } from 'react';
import {
  FileText, Search, ChevronRight, Download, Eye,
  CheckCircle, Clock, AlertCircle, XCircle, Calendar,
  Users, MapPin, DollarSign, Shield, Pen, Send,
  ChevronDown, ChevronUp,
} from 'lucide-react';

/* ════════════════════════════════════════════════════════════
   PROVIDER AGREEMENTS — Contracts, leases, service agreements

   Features:
   • Agreement list with status badges
   • Expandable detail view
   • Filter by status and type
   • Document download
   • E-signature status tracking
   • Milestone / payment schedule
════════════════════════════════════════════════════════════ */

const STATUS_CONFIG = {
  active:    { label: 'Active',     color: 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600', icon: CheckCircle },
  pending:   { label: 'Pending',    color: 'bg-yellow-50 dark:bg-yellow-500/10 text-yellow-600',   icon: Clock },
  draft:     { label: 'Draft',      color: 'bg-gray-100 dark:bg-white/10 text-gray-500',           icon: FileText },
  expired:   { label: 'Expired',    color: 'bg-red-50 dark:bg-red-500/10 text-red-500',            icon: XCircle },
  completed: { label: 'Completed',  color: 'bg-blue-50 dark:bg-blue-500/10 text-blue-600',         icon: CheckCircle },
};

const TYPE_LABELS = {
  rental:  'Rental Agreement',
  lease:   'Lease Contract',
  service: 'Service Contract',
  sale:    'Sale Agreement',
  nda:     'Non-Disclosure',
};

const MOCK_AGREEMENTS = [
  {
    id: 'a1', type: 'rental', status: 'active',
    title: 'Tenancy Agreement — 3BR Lekki Phase 1',
    client: 'Adaeze Okafor', clientInitials: 'AO',
    property: '3 Bedroom Flat in Lekki Phase 1',
    location: 'Lekki, Lagos',
    startDate: 'Jan 15, 2025', endDate: 'Jan 14, 2026',
    value: '₦2,500,000/yr',
    signed: { provider: true, client: true },
    milestones: [
      { label: 'Initial deposit', amount: '₦625,000', status: 'paid', date: 'Jan 10, 2025' },
      { label: 'Q1 rent', amount: '₦625,000', status: 'paid', date: 'Jan 15, 2025' },
      { label: 'Q2 rent', amount: '₦625,000', status: 'upcoming', date: 'Apr 15, 2025' },
      { label: 'Q3 rent', amount: '₦625,000', status: 'upcoming', date: 'Jul 15, 2025' },
    ],
  },
  {
    id: 'a2', type: 'service', status: 'pending',
    title: 'Plumbing Service Contract — Emeka Johnson',
    client: 'Emeka Johnson', clientInitials: 'EJ',
    property: null,
    location: 'Victoria Island, Lagos',
    startDate: 'Feb 15, 2025', endDate: 'Feb 15, 2025',
    value: '₦45,000',
    signed: { provider: true, client: false },
    milestones: [
      { label: 'Full payment on completion', amount: '₦45,000', status: 'pending', date: 'Feb 15, 2025' },
    ],
  },
  {
    id: 'a3', type: 'sale', status: 'draft',
    title: 'Land Sale Agreement — Ibeju-Lekki 500sqm',
    client: 'Blessing Adekunle', clientInitials: 'BA',
    property: 'Land for Sale — 500sqm Ibeju-Lekki',
    location: 'Ibeju-Lekki, Lagos',
    startDate: 'TBD', endDate: 'TBD',
    value: '₦15,000,000',
    signed: { provider: false, client: false },
    milestones: [
      { label: 'Deposit (30%)', amount: '₦4,500,000', status: 'pending', date: 'TBD' },
      { label: 'Balance (70%)', amount: '₦10,500,000', status: 'pending', date: 'TBD' },
    ],
  },
  {
    id: 'a4', type: 'rental', status: 'expired',
    title: 'Tenancy Agreement — Studio Yaba',
    client: 'Chinedu Eze', clientInitials: 'CE',
    property: 'Studio Apartment Yaba',
    location: 'Yaba, Lagos',
    startDate: 'Jan 1, 2024', endDate: 'Dec 31, 2024',
    value: '₦800,000/yr',
    signed: { provider: true, client: true },
    milestones: [
      { label: 'Full payment', amount: '₦800,000', status: 'paid', date: 'Jan 1, 2024' },
    ],
  },
];

export default function ProviderAgreements() {
  const [agreements] = useState(MOCK_AGREEMENTS);
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedId, setExpandedId] = useState(null);

  const filtered = agreements.filter((a) => {
    if (statusFilter !== 'all' && a.status !== statusFilter) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      if (!a.title.toLowerCase().includes(q) && !a.client.toLowerCase().includes(q)) return false;
    }
    return true;
  });

  const counts = {
    all: agreements.length,
    active: agreements.filter((a) => a.status === 'active').length,
    pending: agreements.filter((a) => a.status === 'pending').length,
    draft: agreements.filter((a) => a.status === 'draft').length,
  };

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-lg font-bold font-display text-brand-charcoal-dark dark:text-white">Agreements</h2>
        <p className="text-xs text-gray-400 mt-0.5">{agreements.length} total · {counts.active} active</p>
      </div>

      {/* Search + filters */}
      <div className="space-y-3">
        <div className="relative">
          <Search size={14} className="absolute text-gray-400 -translate-y-1/2 left-3 top-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search agreements..."
            className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-gray-900 text-sm text-brand-charcoal-dark dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-gold/30 focus:border-brand-gold"
          />
        </div>
        <div className="flex gap-2 overflow-x-auto scrollbar-hide">
          {[
            { key: 'all', label: `All (${counts.all})` },
            { key: 'active', label: `Active (${counts.active})` },
            { key: 'pending', label: `Pending (${counts.pending})` },
            { key: 'draft', label: `Drafts (${counts.draft})` },
          ].map((f) => (
            <button key={f.key} onClick={() => setStatusFilter(f.key)}
              className={`text-xs font-medium px-3 py-1.5 rounded-full whitespace-nowrap transition-colors
                ${statusFilter === f.key ? 'bg-brand-charcoal-dark text-white' : 'bg-gray-100 dark:bg-white/5 text-gray-500 hover:bg-gray-200'}`}>
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Agreements list */}
      {filtered.length === 0 ? (
        <div className="py-12 text-center">
          <FileText size={32} className="mx-auto mb-3 text-gray-300" />
          <p className="text-sm text-gray-400">No agreements found</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((a) => {
            const statusCfg = STATUS_CONFIG[a.status];
            const StatusIcon = statusCfg.icon;
            const isExpanded = expandedId === a.id;

            return (
              <div key={a.id} className="overflow-hidden bg-white dark:bg-gray-900 rounded-2xl shadow-card">
                {/* Header */}
                <button onClick={() => setExpandedId(isExpanded ? null : a.id)}
                  className="w-full p-4 text-left transition-colors hover:bg-gray-50 dark:hover:bg-white/5">
                  <div className="flex gap-3">
                    <div className="flex items-center justify-center w-10 h-10 bg-brand-gold/10 rounded-xl shrink-0">
                      <FileText size={18} className="text-brand-gold" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="text-sm font-semibold text-brand-charcoal-dark dark:text-white">{a.title}</p>
                          <p className="text-xs text-gray-400 mt-0.5 flex items-center gap-1">
                            <Users size={10} /> {a.client}
                            {a.location && <><span className="mx-1">·</span><MapPin size={10} /> {a.location}</>}
                          </p>
                        </div>
                        {isExpanded ? <ChevronUp size={16} className="mt-1 text-gray-400 shrink-0" /> : <ChevronDown size={16} className="mt-1 text-gray-400 shrink-0" />}
                      </div>
                      <div className="flex items-center gap-2 mt-2">
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium inline-flex items-center gap-1 ${statusCfg.color}`}>
                          <StatusIcon size={10} /> {statusCfg.label}
                        </span>
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-gray-100 dark:bg-white/5 text-gray-500 font-medium">
                          {TYPE_LABELS[a.type]}
                        </span>
                        <span className="ml-auto text-xs font-semibold text-brand-gold">{a.value}</span>
                      </div>
                    </div>
                  </div>
                </button>

                {/* Expanded details */}
                {isExpanded && (
                  <div className="p-4 space-y-4 border-t border-gray-100 dark:border-white/10">
                    {/* Dates + signatures */}
                    <div className="grid grid-cols-2 gap-3">
                      <div className="p-3 bg-gray-50 dark:bg-white/5 rounded-xl">
                        <p className="text-[10px] text-gray-400 flex items-center gap-1"><Calendar size={10} /> Duration</p>
                        <p className="mt-1 text-xs font-medium text-brand-charcoal-dark dark:text-white">{a.startDate} — {a.endDate}</p>
                      </div>
                      <div className="p-3 bg-gray-50 dark:bg-white/5 rounded-xl">
                        <p className="text-[10px] text-gray-400 flex items-center gap-1"><Pen size={10} /> E-Signatures</p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className={`text-[10px] flex items-center gap-0.5 ${a.signed.provider ? 'text-emerald-600' : 'text-gray-400'}`}>
                            {a.signed.provider ? <CheckCircle size={10} /> : <Clock size={10} />} You
                          </span>
                          <span className={`text-[10px] flex items-center gap-0.5 ${a.signed.client ? 'text-emerald-600' : 'text-gray-400'}`}>
                            {a.signed.client ? <CheckCircle size={10} /> : <Clock size={10} />} Client
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Milestones */}
                    <div>
                      <p className="flex items-center gap-1 mb-2 text-xs font-semibold text-brand-charcoal-dark dark:text-white">
                        <DollarSign size={12} /> Payment Schedule
                      </p>
                      <div className="space-y-1.5">
                        {a.milestones.map((m, i) => (
                          <div key={i} className="flex items-center justify-between p-2 rounded-lg bg-gray-50 dark:bg-white/5">
                            <div className="flex items-center gap-2">
                              {m.status === 'paid' ? <CheckCircle size={12} className="text-emerald-500" /> :
                               m.status === 'upcoming' ? <Clock size={12} className="text-blue-500" /> :
                               <AlertCircle size={12} className="text-yellow-500" />}
                              <div>
                                <p className="text-xs text-brand-charcoal-dark dark:text-white">{m.label}</p>
                                <p className="text-[10px] text-gray-400">{m.date}</p>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="text-xs font-semibold text-brand-charcoal-dark dark:text-white">{m.amount}</p>
                              <p className={`text-[10px] capitalize ${m.status === 'paid' ? 'text-emerald-500' : m.status === 'upcoming' ? 'text-blue-500' : 'text-yellow-500'}`}>
                                {m.status}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2 pt-2">
                      <button className="flex-1 bg-gray-100 dark:bg-white/5 hover:bg-gray-200 dark:hover:bg-white/10 text-gray-600 dark:text-gray-300 text-xs font-medium py-2.5 rounded-xl transition-colors flex items-center justify-center gap-1.5">
                        <Download size={12} /> Download PDF
                      </button>
                      {a.status === 'draft' && (
                        <button className="flex-1 bg-brand-gold hover:bg-brand-gold-dark text-brand-charcoal-dark text-xs font-semibold py-2.5 rounded-xl transition-colors flex items-center justify-center gap-1.5">
                          <Send size={12} /> Send to Client
                        </button>
                      )}
                      {a.status === 'pending' && !a.signed.provider && (
                        <button className="flex-1 bg-brand-gold hover:bg-brand-gold-dark text-brand-charcoal-dark text-xs font-semibold py-2.5 rounded-xl transition-colors flex items-center justify-center gap-1.5">
                          <Pen size={12} /> Sign Now
                        </button>
                      )}
                      <button className="flex items-center justify-center px-3 text-gray-400 transition-colors bg-gray-100 dark:bg-white/5 hover:bg-gray-200 dark:hover:bg-white/10 rounded-xl">
                        <Eye size={14} />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Escrow info */}
      <div className="flex items-start gap-3 p-4 bg-emerald-50 dark:bg-emerald-500/10 rounded-2xl">
        <Shield size={16} className="text-emerald-500 shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-medium text-emerald-700 dark:text-emerald-300">Escrow Protection</p>
          <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-0.5">
            All agreements on Aurban are backed by our escrow system. Funds are held securely until milestones are met and both parties confirm.
          </p>
        </div>
      </div>
    </div>
  );
}
