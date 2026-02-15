import { useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Store, Search, ShieldCheck, ShieldAlert, Ban,
  CheckCircle2, XCircle, Eye, FileText, Clock, Star,
} from 'lucide-react';
import * as adminService from '../../services/admin.service.js';
import RequirePermission from '../../components/admin/RequirePermission.jsx';
import { useAuth } from '../../context/AuthContext.jsx';

/* ════════════════════════════════════════════════════════════
   VENDOR MODERATION — Admin vendor review & compliance
   Route: /admin/vendor-moderation
════════════════════════════════════════════════════════════ */

const MOCK_VENDORS = [
  { id: 'v1', name: 'Chukwuemeka Eze Construction', email: 'emeka@test.com', products: 12, rating: 4.8, status: 'verified', tier: 3, flagged: false, joined: '2024-06-15' },
  { id: 'v2', name: 'Ngozi Furniture Palace',        email: 'ngozi@test.com', products: 8,  rating: 4.5, status: 'verified', tier: 2, flagged: false, joined: '2024-08-20' },
  { id: 'v3', name: 'TechHome Appliances',           email: 'tech@test.com',  products: 15, rating: 4.2, status: 'pending',  tier: 1, flagged: false, joined: '2025-01-10' },
  { id: 'v4', name: 'Lagos Plumbing Supplies',       email: 'lps@test.com',   products: 6,  rating: 3.9, status: 'pending',  tier: 1, flagged: true,  joined: '2025-01-25' },
  { id: 'v5', name: 'Supreme Décor Nigeria',         email: 'decor@test.com', products: 3,  rating: 0,   status: 'pending',  tier: 1, flagged: false, joined: '2025-02-01' },
  { id: 'v6', name: 'ShadyDeals Limited',            email: 'shady@test.com', products: 1,  rating: 1.5, status: 'suspended',tier: 1, flagged: true,  joined: '2024-12-05' },
];

const TABS = [
  { id: 'all',       label: 'All Vendors' },
  { id: 'pending',   label: 'Pending Review' },
  { id: 'verified',  label: 'Verified'  },
  { id: 'flagged',   label: 'Flagged'   },
  { id: 'suspended', label: 'Suspended' },
];

const STATUS_STYLES = {
  verified:  { label: 'Verified',  color: 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600' },
  pending:   { label: 'Pending',   color: 'bg-amber-50 dark:bg-amber-500/10 text-amber-600' },
  suspended: { label: 'Suspended', color: 'bg-red-50 dark:bg-red-500/10 text-red-600' },
  banned:    { label: 'Banned',    color: 'bg-gray-100 dark:bg-white/10 text-gray-500' },
};

export default function VendorModeration() {
  const { t } = useTranslation('admin');
  const { user } = useAuth();

  const [vendors, setVendors] = useState(MOCK_VENDORS);
  const [tab, setTab]         = useState('all');
  const [search, setSearch]   = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => { document.title = 'Vendor Moderation — Admin'; }, []);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      try {
        const res = await adminService.getProviders?.({ page: 1, limit: 50 });
        if (!cancelled && res?.success && res?.providers?.length) {
          setVendors(res.providers);
        }
      } catch { /* use mock */ }
      if (!cancelled) setLoading(false);
    }
    load();
    return () => { cancelled = true; };
  }, []);

  const filtered = useMemo(() => {
    let list = vendors;
    if (tab === 'pending')   list = list.filter(v => v.status === 'pending');
    if (tab === 'verified')  list = list.filter(v => v.status === 'verified');
    if (tab === 'flagged')   list = list.filter(v => v.flagged);
    if (tab === 'suspended') list = list.filter(v => v.status === 'suspended' || v.status === 'banned');

    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(v => v.name.toLowerCase().includes(q) || v.email.toLowerCase().includes(q));
    }
    return list;
  }, [tab, vendors, search]);

  const handleAction = (vendorId, action) => {
    setVendors(prev => prev.map(v => {
      if (v.id !== vendorId) return v;
      if (action === 'approve')   return { ...v, status: 'verified', flagged: false };
      if (action === 'suspend')   return { ...v, status: 'suspended' };
      if (action === 'ban')       return { ...v, status: 'banned' };
      if (action === 'unflag')    return { ...v, flagged: false };
      return v;
    }));
  };

  return (
    <RequirePermission permission="listings:view" fallback={<p className="p-8 text-center text-gray-400">Access denied</p>}>
      <div>
        <h1 className="mb-1 section-title">Vendor Moderation</h1>
        <p className="mb-5 text-sm text-gray-400">Review vendors, verify accounts, and manage compliance</p>

        {/* Stats row */}
        <div className="grid grid-cols-2 gap-3 mb-5 lg:grid-cols-4">
          {[
            { label: 'Total Vendors', value: vendors.length, icon: Store, color: 'text-blue-500', bg: 'bg-blue-50 dark:bg-blue-500/10' },
            { label: 'Pending Review', value: vendors.filter(v => v.status === 'pending').length, icon: Clock, color: 'text-amber-500', bg: 'bg-amber-50 dark:bg-amber-500/10' },
            { label: 'Verified', value: vendors.filter(v => v.status === 'verified').length, icon: ShieldCheck, color: 'text-emerald-500', bg: 'bg-emerald-50 dark:bg-emerald-500/10' },
            { label: 'Flagged', value: vendors.filter(v => v.flagged).length, icon: ShieldAlert, color: 'text-red-500', bg: 'bg-red-50 dark:bg-red-500/10' },
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
            placeholder="Search vendors..."
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

        {/* Vendor list */}
        <div className="space-y-3">
          {filtered.length === 0 && (
            <div className="py-12 text-center text-sm text-gray-400">No vendors match your filters</div>
          )}
          {filtered.map(vendor => {
            const statusDef = STATUS_STYLES[vendor.status] || STATUS_STYLES.pending;
            return (
              <div key={vendor.id} className="p-4 bg-white border border-gray-100 dark:border-white/10 rounded-2xl dark:bg-gray-900 sm:p-5">
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center justify-center w-11 h-11 text-lg font-bold rounded-xl bg-purple-100 dark:bg-purple-500/15 text-purple-600 dark:text-purple-400 shrink-0">
                      {vendor.name.charAt(0)}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-bold text-brand-charcoal-dark dark:text-white">{vendor.name}</p>
                        {vendor.flagged && <ShieldAlert size={13} className="text-red-500" />}
                      </div>
                      <p className="text-xs text-gray-400">{vendor.email}</p>
                    </div>
                  </div>
                  <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold ${statusDef.color}`}>
                    {statusDef.label}
                  </span>
                </div>

                <div className="flex flex-wrap items-center gap-4 mb-3 text-xs text-gray-400">
                  <span>{vendor.products} products</span>
                  {vendor.rating > 0 && (
                    <span className="flex items-center gap-1">
                      <Star size={11} className="text-brand-gold fill-brand-gold" /> {vendor.rating}
                    </span>
                  )}
                  <span>Tier {vendor.tier}</span>
                  <span>Joined {vendor.joined}</span>
                </div>

                {/* Actions */}
                <div className="flex gap-2 pt-3 border-t border-gray-100 dark:border-white/10">
                  {vendor.status === 'pending' && (
                    <button onClick={() => handleAction(vendor.id, 'approve')}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-white bg-emerald-500 rounded-xl hover:bg-emerald-600 transition-colors">
                      <CheckCircle2 size={12} /> Approve
                    </button>
                  )}
                  {vendor.status !== 'suspended' && vendor.status !== 'banned' && (
                    <button onClick={() => handleAction(vendor.id, 'suspend')}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-orange-500 bg-orange-50 dark:bg-orange-500/10 rounded-xl hover:bg-orange-100 transition-colors">
                      <XCircle size={12} /> Suspend
                    </button>
                  )}
                  {vendor.flagged && (
                    <button onClick={() => handleAction(vendor.id, 'unflag')}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-gray-500 bg-gray-100 dark:bg-white/10 rounded-xl hover:bg-gray-200 transition-colors">
                      <ShieldCheck size={12} /> Unflag
                    </button>
                  )}
                  {(vendor.status === 'suspended') && (
                    <button onClick={() => handleAction(vendor.id, 'ban')}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-red-500 bg-red-50 dark:bg-red-500/10 rounded-xl hover:bg-red-100 transition-colors">
                      <Ban size={12} /> Ban
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </RequirePermission>
  );
}
