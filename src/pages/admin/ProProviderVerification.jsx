import { useState, useEffect } from 'react';
import {
  Clock, CheckCircle2, Shield, TrendingUp,
  Search, FileText, Star, Eye, UserX, UserCheck,
  AlertCircle, ChevronRight,
} from 'lucide-react';
import { PRO_PROVIDER_LEVELS } from '../../data/proConstants.js';
import * as proAdminService from '../../services/proAdmin.service.js';

/* ════════════════════════════════════════════════════════════
   PRO PROVIDER VERIFICATION — Queue & level management
   Route: /admin/pro-providers
════════════════════════════════════════════════════════════ */

/* ── Mock data ─────────────────────────────────────────────── */
const MOCK_PENDING = [
  {
    id: 'pp1', name: 'Chidi Okonkwo', category: 'Plumbing & Water Systems',
    appliedDate: '2025-02-28', yearsExperience: 8,
    certifications: ['NIOB Certified', 'First Aid'],
    documents: [
      { name: 'Government ID', uploaded: true },
      { name: 'Trade Certificate', uploaded: true },
      { name: 'Insurance Policy', uploaded: true },
      { name: 'Tax Clearance', uploaded: false },
    ],
  },
  {
    id: 'pp2', name: 'Blessing Adekunle', category: 'Electrical & Power',
    appliedDate: '2025-02-27', yearsExperience: 12,
    certifications: ['NEMSA Licensed', 'Solar PV Certified'],
    documents: [
      { name: 'Government ID', uploaded: true },
      { name: 'NEMSA License', uploaded: true },
      { name: 'Insurance Policy', uploaded: true },
      { name: 'Tax Clearance', uploaded: true },
    ],
  },
  {
    id: 'pp3', name: 'Yusuf Abdullahi', category: 'Painting & Decoration',
    appliedDate: '2025-02-26', yearsExperience: 5,
    certifications: [],
    documents: [
      { name: 'Government ID', uploaded: true },
      { name: 'Portfolio', uploaded: true },
      { name: 'Insurance Policy', uploaded: false },
      { name: 'Tax Clearance', uploaded: false },
    ],
  },
  {
    id: 'pp4', name: 'Ngozi Ibe', category: 'Cleaning & Fumigation',
    appliedDate: '2025-02-25', yearsExperience: 3,
    certifications: ['NAFDAC Approved Chemicals'],
    documents: [
      { name: 'Government ID', uploaded: true },
      { name: 'NAFDAC Certificate', uploaded: true },
      { name: 'Insurance Policy', uploaded: true },
      { name: 'Tax Clearance', uploaded: true },
    ],
  },
  {
    id: 'pp5', name: 'Samuel Ogunyemi', category: 'AC & HVAC',
    appliedDate: '2025-02-24', yearsExperience: 10,
    certifications: ['HVAC Specialist', 'Daikin Certified'],
    documents: [
      { name: 'Government ID', uploaded: true },
      { name: 'Trade Certificate', uploaded: true },
      { name: 'Insurance Policy', uploaded: true },
      { name: 'Tax Clearance', uploaded: true },
    ],
  },
];

const MOCK_VERIFIED = [
  { id: 'vp1', name: 'Emeka Nwosu',      category: 'Plumbing',         level: 'gold',     rating: 4.9, completedJobs: 142, verifiedDate: '2024-06-15' },
  { id: 'vp2', name: 'Funke Adeyemi',     category: 'Cleaning',         level: 'top',      rating: 4.8, completedJobs: 87,  verifiedDate: '2024-08-20' },
  { id: 'vp3', name: 'Tunde Bakare',      category: 'Painting',         level: 'verified', rating: 4.6, completedJobs: 34,  verifiedDate: '2024-10-01' },
  { id: 'vp4', name: 'Amina Suleiman',    category: 'AC & HVAC',        level: 'top',      rating: 4.7, completedJobs: 56,  verifiedDate: '2024-09-12' },
  { id: 'vp5', name: 'Chukwuemeka Eze',   category: 'Construction',     level: 'gold',     rating: 4.9, completedJobs: 203, verifiedDate: '2024-03-05' },
  { id: 'vp6', name: 'Ngozi Okafor',      category: 'Tiling',           level: 'verified', rating: 4.5, completedJobs: 22,  verifiedDate: '2024-11-18' },
  { id: 'vp7', name: 'Ibrahim Musa',      category: 'Electrical',       level: 'new',      rating: 4.2, completedJobs: 3,   verifiedDate: '2025-01-10' },
  { id: 'vp8', name: 'Adaeze Obi',        category: 'Fumigation',       level: 'verified', rating: 4.4, completedJobs: 15,  verifiedDate: '2024-12-01' },
];

const MOCK_SUSPENDED = [
  { id: 'sp1', name: 'Dayo Adeleke', reason: 'Multiple no-shows (3 in 30 days)', suspendedDate: '2025-02-20', duration: '14 days' },
  { id: 'sp2', name: 'Kelechi Nnamdi', reason: 'Client safety complaint — under investigation', suspendedDate: '2025-02-25', duration: 'Indefinite' },
];

const MOCK_UPGRADES = [
  { id: 'up1', name: 'Tunde Bakare', currentLevel: 'verified', requestedLevel: 'top', completedJobs: 34, rating: 4.6, requestDate: '2025-02-28' },
  { id: 'up2', name: 'Ngozi Okafor', currentLevel: 'verified', requestedLevel: 'top', completedJobs: 22, rating: 4.5, requestDate: '2025-02-27' },
];

const MOCK_COMPANIES = [
  { id: 'cp1', companyName: 'Veritasi Homes & Properties', rcNumber: 'RC-123456', contactPerson: 'Adebayo Johnson', appliedDate: '2025-02-26', documents: [{ name: 'CAC Certificate', uploaded: true }, { name: 'TIN Document', uploaded: true }, { name: 'Company Profile', uploaded: true }], status: 'pending' },
  { id: 'cp2', companyName: 'Landwey Investment Limited', rcNumber: 'RC-789012', contactPerson: 'Oluwaseun Adeyemi', appliedDate: '2025-02-24', documents: [{ name: 'CAC Certificate', uploaded: true }, { name: 'TIN Document', uploaded: false }, { name: 'Company Profile', uploaded: true }], status: 'pending' },
  { id: 'cp3', companyName: 'RevolutionPlus Property', rcNumber: 'RC-345678', contactPerson: 'Bamidele Oniru', appliedDate: '2025-02-22', documents: [{ name: 'CAC Certificate', uploaded: true }, { name: 'TIN Document', uploaded: true }, { name: 'Company Profile', uploaded: true }], status: 'pending' },
];

const STAT_CARDS = [
  { key: 'pending',    label: 'Pending Review',  value: 5,  icon: Clock,        color: 'text-amber-500',   bg: 'bg-amber-50 dark:bg-amber-500/10' },
  { key: 'verified',   label: 'Verified',        value: 42, icon: CheckCircle2, color: 'text-emerald-500', bg: 'bg-emerald-50 dark:bg-emerald-500/10' },
  { key: 'suspended',  label: 'Suspended',       value: 3,  icon: Shield,       color: 'text-red-500',     bg: 'bg-red-50 dark:bg-red-500/10' },
  { key: 'upgrades',   label: 'Level Upgrades',  value: 2,  icon: TrendingUp,   color: 'text-blue-500',    bg: 'bg-blue-50 dark:bg-blue-500/10' },
  { key: 'companies', label: 'Company Queue',   value: 3,  icon: Shield,       color: 'text-purple-500',  bg: 'bg-purple-50 dark:bg-purple-500/10' },
];

const TABS = [
  { id: 'pending',   label: 'Pending' },
  { id: 'verified',  label: 'Verified' },
  { id: 'suspended', label: 'Suspended' },
  { id: 'upgrades',  label: 'Level Upgrades' },
  { id: 'companies', label: 'Companies' },
];

/* ── Level badge ──────────────────────────────────────────── */
function LevelBadge({ level }) {
  const def = PRO_PROVIDER_LEVELS[level];
  if (!def) return <span className="text-[10px] text-gray-400">{level}</span>;
  return (
    <span className={`text-[10px] px-2.5 py-1 rounded-full font-bold whitespace-nowrap ${def.color}`}>
      {def.label}
    </span>
  );
}

/* ══════════════════════════════════════════════════════════════
   COMPONENT
══════════════════════════════════════════════════════════════ */
export default function ProProviderVerification() {
  const [activeTab, setActiveTab] = useState('pending');
  const [search, setSearch]       = useState('');
  const [pendingList, setPendingList]     = useState(MOCK_PENDING);
  const [verifiedList]                    = useState(MOCK_VERIFIED);
  const [suspendedList, setSuspendedList] = useState(MOCK_SUSPENDED);
  const [upgradeList]                     = useState(MOCK_UPGRADES);
  const [companyList, setCompanyList]     = useState(MOCK_COMPANIES);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const res = await proAdminService.getVerificationQueue({ page: 1, limit: 50, status: 'pending' });
        if (!cancelled && res.success && res.providers?.length) {
          setPendingList(res.providers.map((p) => ({
            id: p.id,
            name: p.name || p.provider_name || 'Provider',
            category: p.category || p.service_category || 'Service',
            appliedDate: p.created_at ? p.created_at.slice(0, 10) : '',
            yearsExperience: p.years_experience || p.yearsExperience || 0,
            certifications: p.certifications || [],
            documents: (p.documents || []).map((d) => ({ name: d.name || d, uploaded: true })),
            raw: p,
          })));
        }
      } catch { /* keep mock */ }
    }
    load();
    return () => { cancelled = true; };
  }, []);

  /* ── Search ────────────────────────────────────────────── */
  const filterBySearch = (list, keys) => {
    if (!search.trim()) return list;
    const q = search.toLowerCase();
    return list.filter((item) => keys.some((k) => item[k]?.toLowerCase().includes(q)));
  };

  const filteredPending   = filterBySearch(pendingList, ['name', 'category']);
  const filteredVerified  = filterBySearch(verifiedList, ['name', 'category']);
  const filteredSuspended = filterBySearch(suspendedList, ['name', 'reason']);
  const filteredCompanies = filterBySearch(companyList, ['companyName', 'contactPerson']);
  const filteredUpgrades  = filterBySearch(upgradeList, ['name']);

  /* ── Actions ───────────────────────────────────────────── */
  const handleApprovePending = async (id) => {
    setPendingList((prev) => prev.filter((p) => p.id !== id));
    try { await proAdminService.approveProvider(id, { level: 'verified' }); } catch { /* keep optimistic */ }
  };

  const handleRejectPending = async (id) => {
    setPendingList((prev) => prev.filter((p) => p.id !== id));
    try { await proAdminService.rejectProvider(id, { reason: 'Rejected by admin' }); } catch { /* keep optimistic */ }
  };

  const handleReinstate = (id) => {
    setSuspendedList((prev) => prev.filter((s) => s.id !== id));
  };

  return (
    <div className="pb-8 space-y-5">
      {/* ── Header ───────────────────────────────────────────── */}
      <div>
        <h1 className="text-xl font-bold font-display text-brand-charcoal-dark dark:text-white">
          Pro Provider Verification
        </h1>
        <p className="text-sm text-gray-400 mt-0.5">
          Verification queue, level management, and provider oversight
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
          placeholder="Search providers..."
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

      {/* ═══════════════════════════════════════════════════════
          PENDING TAB — Card-based layout
      ═══════════════════════════════════════════════════════ */}
      {activeTab === 'pending' && (
        <div className="space-y-4">
          {filteredPending.length === 0 ? (
            <div className="py-16 text-center">
              <CheckCircle2 size={36} className="mx-auto mb-3 text-emerald-400" />
              <p className="text-sm font-semibold text-brand-charcoal-dark dark:text-white">All caught up!</p>
              <p className="mt-1 text-xs text-gray-400">No pending verification requests</p>
            </div>
          ) : (
            filteredPending.map((p) => {
              const docsUploaded = p.documents.filter((d) => d.uploaded).length;
              const docsTotal = p.documents.length;
              return (
                <div key={p.id} className="p-4 bg-white dark:bg-gray-900 rounded-2xl shadow-card sm:p-5">
                  {/* Top row */}
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div>
                      <p className="text-sm font-bold text-brand-charcoal-dark dark:text-white">{p.name}</p>
                      <p className="text-xs text-gray-400">{p.category}</p>
                    </div>
                    <span className="text-[10px] px-2.5 py-1 rounded-full font-medium bg-amber-50 dark:bg-amber-500/10 text-amber-600 whitespace-nowrap">
                      Applied {p.appliedDate}
                    </span>
                  </div>

                  {/* Info grid */}
                  <div className="grid grid-cols-2 gap-3 mb-3 sm:grid-cols-3">
                    <div>
                      <p className="text-[10px] text-gray-400 uppercase font-semibold tracking-wider">Experience</p>
                      <p className="text-sm font-semibold text-brand-charcoal-dark dark:text-white">{p.yearsExperience} years</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-gray-400 uppercase font-semibold tracking-wider">Certifications</p>
                      <p className="text-sm font-semibold text-brand-charcoal-dark dark:text-white">
                        {p.certifications.length > 0 ? p.certifications.join(', ') : 'None'}
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] text-gray-400 uppercase font-semibold tracking-wider">Documents</p>
                      <p className="text-sm font-semibold text-brand-charcoal-dark dark:text-white">{docsUploaded}/{docsTotal} uploaded</p>
                    </div>
                  </div>

                  {/* Documents list */}
                  <div className="flex flex-wrap gap-1.5 mb-4">
                    {p.documents.map((doc, i) => (
                      <span
                        key={i}
                        className={`flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full font-medium ${
                          doc.uploaded
                            ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600'
                            : 'bg-red-50 dark:bg-red-500/10 text-red-500'
                        }`}
                      >
                        {doc.uploaded ? <CheckCircle2 size={10} /> : <AlertCircle size={10} />}
                        {doc.name}
                      </span>
                    ))}
                  </div>

                  {/* Actions */}
                  <div className="flex flex-wrap gap-2 pt-3 border-t border-gray-100 dark:border-white/10">
                    <button
                      onClick={() => handleApprovePending(p.id)}
                      className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-emerald-500 rounded-xl hover:bg-emerald-600 transition-colors"
                    >
                      <CheckCircle2 size={12} /> Approve
                    </button>
                    <button
                      className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-blue-600 bg-blue-50 dark:bg-blue-500/10 rounded-xl hover:bg-blue-100 dark:hover:bg-blue-500/20 transition-colors"
                    >
                      <FileText size={12} /> Request More Info
                    </button>
                    <button
                      onClick={() => handleRejectPending(p.id)}
                      className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-red-600 bg-red-50 dark:bg-red-500/10 rounded-xl hover:bg-red-100 dark:hover:bg-red-500/20 transition-colors"
                    >
                      <UserX size={12} /> Reject
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════
          VERIFIED TAB — Table layout
      ═══════════════════════════════════════════════════════ */}
      {activeTab === 'verified' && (
        <div className="overflow-x-auto rounded-2xl border border-gray-200 dark:border-white/10">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-gray-50 dark:bg-white/5">
                {['Name', 'Category', 'Level', 'Rating', 'Jobs', 'Verified', 'Action'].map((h) => (
                  <th key={h} className="px-4 py-3 text-[10px] font-semibold text-gray-400 uppercase tracking-wider whitespace-nowrap">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-white/5">
              {filteredVerified.map((v) => (
                <tr key={v.id} className="bg-white dark:bg-gray-900 hover:bg-gray-50 dark:hover:bg-white/[0.02] transition-colors">
                  <td className="px-4 py-3 text-xs font-semibold text-brand-charcoal-dark dark:text-white whitespace-nowrap">{v.name}</td>
                  <td className="px-4 py-3 text-xs text-gray-600 dark:text-gray-300 whitespace-nowrap">{v.category}</td>
                  <td className="px-4 py-3 whitespace-nowrap"><LevelBadge level={v.level} /></td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <span className="flex items-center gap-1 text-xs font-bold text-brand-charcoal-dark dark:text-white">
                      <Star size={11} className="text-amber-400 fill-amber-400" /> {v.rating}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs font-semibold text-brand-charcoal-dark dark:text-white whitespace-nowrap">{v.completedJobs}</td>
                  <td className="px-4 py-3 text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap">{v.verifiedDate}</td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <div className="flex gap-1.5">
                      <button className="flex items-center gap-1 px-2.5 py-1.5 text-[10px] font-bold text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-white/5 rounded-lg hover:bg-gray-200 dark:hover:bg-white/10 transition-colors">
                        <Eye size={11} /> View
                      </button>
                      <button className="flex items-center gap-1 px-2.5 py-1.5 text-[10px] font-bold text-red-600 bg-red-50 dark:bg-red-500/10 rounded-lg hover:bg-red-100 dark:hover:bg-red-500/20 transition-colors">
                        <Shield size={11} /> Suspend
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════
          SUSPENDED TAB — Table layout
      ═══════════════════════════════════════════════════════ */}
      {activeTab === 'suspended' && (
        <div className="overflow-x-auto rounded-2xl border border-gray-200 dark:border-white/10">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-gray-50 dark:bg-white/5">
                {['Name', 'Reason', 'Suspended Date', 'Duration', 'Action'].map((h) => (
                  <th key={h} className="px-4 py-3 text-[10px] font-semibold text-gray-400 uppercase tracking-wider whitespace-nowrap">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-white/5">
              {filteredSuspended.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-12 text-center text-sm text-gray-400">No suspended providers</td>
                </tr>
              ) : (
                filteredSuspended.map((s) => (
                  <tr key={s.id} className="bg-white dark:bg-gray-900 hover:bg-gray-50 dark:hover:bg-white/[0.02] transition-colors">
                    <td className="px-4 py-3 text-xs font-semibold text-brand-charcoal-dark dark:text-white whitespace-nowrap">{s.name}</td>
                    <td className="px-4 py-3 text-xs text-gray-600 dark:text-gray-300">{s.reason}</td>
                    <td className="px-4 py-3 text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap">{s.suspendedDate}</td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className="text-[10px] px-2.5 py-1 rounded-full font-bold bg-red-50 dark:bg-red-500/10 text-red-600">
                        {s.duration}
                      </span>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <button
                        onClick={() => handleReinstate(s.id)}
                        className="flex items-center gap-1 px-3 py-1.5 text-[10px] font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-500/10 rounded-lg hover:bg-emerald-100 dark:hover:bg-emerald-500/20 transition-colors"
                      >
                        <UserCheck size={11} /> Reinstate
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════
          LEVEL UPGRADES TAB — Table layout
      ═══════════════════════════════════════════════════════ */}
      {activeTab === 'upgrades' && (
        <div className="overflow-x-auto rounded-2xl border border-gray-200 dark:border-white/10">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-gray-50 dark:bg-white/5">
                {['Name', 'Current Level', 'Requested Level', 'Jobs', 'Rating', 'Request Date', 'Action'].map((h) => (
                  <th key={h} className="px-4 py-3 text-[10px] font-semibold text-gray-400 uppercase tracking-wider whitespace-nowrap">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-white/5">
              {filteredUpgrades.map((u) => (
                <tr key={u.id} className="bg-white dark:bg-gray-900 hover:bg-gray-50 dark:hover:bg-white/[0.02] transition-colors">
                  <td className="px-4 py-3 text-xs font-semibold text-brand-charcoal-dark dark:text-white whitespace-nowrap">{u.name}</td>
                  <td className="px-4 py-3 whitespace-nowrap"><LevelBadge level={u.currentLevel} /></td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <span className="flex items-center gap-1">
                      <ChevronRight size={11} className="text-gray-400" />
                      <LevelBadge level={u.requestedLevel} />
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs font-semibold text-brand-charcoal-dark dark:text-white whitespace-nowrap">{u.completedJobs}</td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <span className="flex items-center gap-1 text-xs font-bold text-brand-charcoal-dark dark:text-white">
                      <Star size={11} className="text-amber-400 fill-amber-400" /> {u.rating}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap">{u.requestDate}</td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <div className="flex gap-1.5">
                      <button className="flex items-center gap-1 px-2.5 py-1.5 text-[10px] font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-500/10 rounded-lg hover:bg-emerald-100 dark:hover:bg-emerald-500/20 transition-colors">
                        <CheckCircle2 size={11} /> Approve
                      </button>
                      <button className="flex items-center gap-1 px-2.5 py-1.5 text-[10px] font-bold text-red-600 bg-red-50 dark:bg-red-500/10 rounded-lg hover:bg-red-100 dark:hover:bg-red-500/20 transition-colors">
                        <UserX size={11} /> Deny
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════
          COMPANIES TAB — Company verification queue
      ═══════════════════════════════════════════════════════ */}
      {activeTab === 'companies' && (
        <div className="space-y-4">
          {filteredCompanies.length === 0 ? (
            <div className="py-16 text-center">
              <CheckCircle2 size={36} className="mx-auto mb-3 text-emerald-400" />
              <p className="text-sm font-semibold text-brand-charcoal-dark dark:text-white">No pending company verifications</p>
            </div>
          ) : (
            filteredCompanies.map((c) => {
              return (
                <div key={c.id} className="p-4 bg-white dark:bg-gray-900 rounded-2xl shadow-card sm:p-5">
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div>
                      <p className="text-sm font-bold text-brand-charcoal-dark dark:text-white">{c.companyName}</p>
                      <p className="text-xs text-gray-400">RC: {c.rcNumber} · Contact: {c.contactPerson}</p>
                    </div>
                    <span className="text-[10px] px-2.5 py-1 rounded-full font-medium bg-purple-50 dark:bg-purple-500/10 text-purple-600 whitespace-nowrap">
                      Applied {c.appliedDate}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-1.5 mb-4">
                    {c.documents.map((doc, i) => (
                      <span key={i} className={`flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full font-medium ${doc.uploaded ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600' : 'bg-red-50 dark:bg-red-500/10 text-red-500'}`}>
                        {doc.uploaded ? <CheckCircle2 size={10} /> : <AlertCircle size={10} />}
                        {doc.name}
                      </span>
                    ))}
                  </div>
                  <div className="flex flex-wrap gap-2 pt-3 border-t border-gray-100 dark:border-white/10">
                    <button
                      onClick={() => setCompanyList((prev) => prev.filter((x) => x.id !== c.id))}
                      className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-emerald-500 rounded-xl hover:bg-emerald-600 transition-colors"
                    >
                      <CheckCircle2 size={12} /> Verify Company
                    </button>
                    <button className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-blue-600 bg-blue-50 dark:bg-blue-500/10 rounded-xl hover:bg-blue-100 transition-colors">
                      <Eye size={12} /> Review Documents
                    </button>
                    <button
                      onClick={() => setCompanyList((prev) => prev.filter((x) => x.id !== c.id))}
                      className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-red-600 bg-red-50 dark:bg-red-500/10 rounded-xl hover:bg-red-100 transition-colors"
                    >
                      <UserX size={12} /> Reject
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* ── Info banner ──────────────────────────────────────── */}
      <div className="flex items-center gap-2 px-4 py-2.5 text-xs font-medium text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-500/10 rounded-xl">
        <AlertCircle size={14} className="shrink-0" />
        Provider levels: New Pro (0+ jobs) → Verified (5+) → Top Pro (25+) → Gold Pro (100+)
      </div>
    </div>
  );
}
