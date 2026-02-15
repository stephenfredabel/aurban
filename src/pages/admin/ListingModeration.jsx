import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  CheckCircle2, XCircle, Flag, AlertTriangle,
  Package, MapPin, Clock, AlertCircle,
  Star, Edit3, Layers,
} from 'lucide-react';
import * as adminService from '../../services/admin.service.js';
import RequirePermission from '../../components/admin/RequirePermission.jsx';
import ConfirmAction from '../../components/admin/ConfirmAction.jsx';
import useAdminAction from '../../hooks/useAdminAction.js';
import { AUDIT_ACTIONS } from '../../services/audit.service.js';

/* ════════════════════════════════════════════════════════════
   LISTING MODERATION — Review queue for listings
   Route: /admin/listings
════════════════════════════════════════════════════════════ */

/* ── Mock data (dev fallback) ────────────────────────────── */
const MOCK_LISTINGS = [
  { id: 'l1', title: '3 Bedroom Flat in Lekki Phase 1', provider: 'Emeka Nwosu',  category: 'Rental',      emoji: '🏠', price: '₦2.5M/yr',  status: 'pending',  submittedDate: '2025-02-10' },
  { id: 'l2', title: 'Professional Plumbing Service',   provider: 'Chinwe Eze',    category: 'Service',     emoji: '🔧', price: '₦25K/job',   status: 'pending',  submittedDate: '2025-02-09' },
  { id: 'l3', title: 'Samsung Galaxy S24 Ultra',        provider: 'Ibrahim Musa',  category: 'Marketplace', emoji: '📦', price: '₦850K',      status: 'flagged',  submittedDate: '2025-02-08' },
  { id: 'l4', title: 'Land for Sale — 500sqm Ajah',    provider: 'Tunde Bakare',  category: 'Land',        emoji: '🏠', price: '₦15M',       status: 'pending',  submittedDate: '2025-02-08' },
  { id: 'l5', title: 'Shortlet Apartment V.I',          provider: 'Funke Adeyemi', category: 'Shortlet',    emoji: '🏠', price: '₦45K/night', status: 'flagged',  submittedDate: '2025-02-07' },
  { id: 'l6', title: 'Home Cleaning Service',           provider: 'Amina Suleiman', category: 'Service',    emoji: '🔧', price: '₦15K/visit', status: 'approved', submittedDate: '2025-02-06' },
];

const TABS = [
  { id: 'pending',  label: 'Pending Review' },
  { id: 'flagged',  label: 'Flagged' },
  { id: 'approved', label: 'Approved' },
  { id: 'rejected', label: 'Rejected' },
];

const CATEGORY_STYLES = {
  Rental:      'bg-blue-50 dark:bg-blue-500/10 text-blue-600',
  Service:     'bg-purple-50 dark:bg-purple-500/10 text-purple-600',
  Marketplace: 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600',
  Land:        'bg-amber-50 dark:bg-amber-500/10 text-amber-600',
  Shortlet:    'bg-rose-50 dark:bg-rose-500/10 text-rose-600',
};

export default function ListingModeration() {
  const { t } = useTranslation('admin');

  const [listings, setListings]     = useState(MOCK_LISTINGS);
  const [activeTab, setActiveTab]   = useState('pending');
  const [rejectingId, setRejectingId] = useState(null);
  const [rejectReason, setRejectReason] = useState('');
  const [loading, setLoading]       = useState(true);
  const [usingFallback, setUsingFallback] = useState(false);
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [activeListingId, setActiveListingId] = useState(null);
  const [requestEditId, setRequestEditId] = useState(null);
  const [editRequest, setEditRequest] = useState('');

  useEffect(() => {
    document.title = t('listings.title', 'Listing Moderation') + ' — Aurban';
  }, [t]);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      try {
        const res = await adminService.getListingsForModeration({ page: 1, limit: 50 });
        if (!cancelled && res.success && res.listings?.length) {
          setListings(res.listings);
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

  /* ── Tab counts ─────────────────────────────────────────── */
  const counts = {
    pending:  listings.filter((l) => l.status === 'pending').length,
    flagged:  listings.filter((l) => l.status === 'flagged').length,
    approved: listings.filter((l) => l.status === 'approved').length,
    rejected: listings.filter((l) => l.status === 'rejected').length,
  };

  const filtered = listings.filter((l) => l.status === activeTab);

  /* ── Actions ────────────────────────────────────────────── */
  const handleApprove = async (id) => {
    setListings((prev) => prev.map((l) => l.id === id ? { ...l, status: 'approved' } : l));
    await adminService.moderateListing(id, { action: 'approve' });
  };

  const handleFlag = async (id) => {
    setListings((prev) => prev.map((l) => l.id === id ? { ...l, status: 'flagged' } : l));
    await adminService.moderateListing(id, { action: 'flag' });
  };

  const handleReject = async (id) => {
    setListings((prev) => prev.map((l) => l.id === id ? { ...l, status: 'rejected' } : l));
    await adminService.moderateListing(id, { action: 'reject', reason: rejectReason });
    setRejectingId(null);
    setRejectReason('');
  };

  const handleFeature = async (id) => {
    setListings((prev) => prev.map((l) => l.id === id ? { ...l, featured: !l.featured } : l));
    await adminService.moderateListing(id, { action: 'feature' });
  };

  const handleRequestEdit = async (id) => {
    if (!editRequest.trim()) return;
    await adminService.moderateListing(id, { action: 'request_edit', reason: editRequest });
    setRequestEditId(null);
    setEditRequest('');
  };

  const handleBulkApprove = async () => {
    const ids = [...selectedIds];
    setListings((prev) => prev.map((l) => ids.includes(l.id) ? { ...l, status: 'approved' } : l));
    setSelectedIds(new Set());
    for (const id of ids) {
      await adminService.moderateListing(id, { action: 'approve' });
    }
  };

  const toggleSelect = (id) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  /* ── Feature listing action ─────────────────────────────── */
  const featureAction = useAdminAction({
    permission: 'listings:feature',
    action: AUDIT_ACTIONS.LISTING_FEATURE,
    onExecute: async () => {
      if (activeListingId) await handleFeature(activeListingId);
    },
  });

  return (
    <div className="pb-8 space-y-5">
      {/* ── Fallback banner ──────────────────────────────────── */}
      {usingFallback && (
        <div className="flex items-center gap-2 px-4 py-2.5 text-xs font-medium text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-500/10 rounded-xl">
          <AlertCircle size={14} className="shrink-0" />
          {t('fallback', 'Could not reach server. Showing cached data.')}
        </div>
      )}

      {/* ── Header ───────────────────────────────────────────── */}
      <div>
        <h1 className="text-xl font-bold font-display text-brand-charcoal-dark dark:text-white">
          {t('listings.title', 'Listing Moderation')}
        </h1>
        <p className="text-sm text-gray-400 mt-0.5">
          {t('listings.subtitle', 'Review, approve, or reject submitted listings')}
        </p>
      </div>

      {/* ── Tab bar ──────────────────────────────────────────── */}
      <div className="flex gap-2 mb-5 overflow-x-auto scrollbar-hide">
        {TABS.map((tab) => {
          const count = counts[tab.id];
          const active = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-xl transition-colors whitespace-nowrap shrink-0
                ${active
                  ? 'bg-brand-charcoal-dark dark:bg-white text-white dark:text-gray-900'
                  : 'bg-gray-100 dark:bg-white/5 text-gray-500 hover:bg-gray-200 dark:hover:bg-white/10'
                }`}
            >
              {t(`listings.tabs.${tab.id}`, tab.label)}
              {count > 0 && (
                <span className={`text-[10px] px-1.5 py-0.5 rounded-full min-w-[20px] text-center
                  ${active ? 'bg-white/20 text-white dark:bg-gray-900/20 dark:text-gray-900' : 'bg-gray-200 dark:bg-white/10 text-gray-500'}`}>
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* ── Bulk actions bar ───────────────────────────────────── */}
      {selectedIds.size > 0 && (
        <RequirePermission permission="listings:bulk_actions">
          <div className="flex items-center gap-3 px-4 py-2.5 bg-brand-gold/10 border border-brand-gold/20 rounded-xl">
            <Layers size={14} className="text-brand-gold shrink-0" />
            <span className="text-xs font-semibold text-brand-charcoal-dark dark:text-white">
              {selectedIds.size} listing{selectedIds.size > 1 ? 's' : ''} selected
            </span>
            <button
              onClick={handleBulkApprove}
              className="ml-auto flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-500/10 rounded-lg hover:bg-emerald-100"
            >
              <CheckCircle2 size={12} /> Bulk Approve
            </button>
            <button
              onClick={() => setSelectedIds(new Set())}
              className="px-3 py-1.5 text-xs font-bold text-gray-500 bg-gray-100 dark:bg-white/5 rounded-lg hover:bg-gray-200"
            >
              Clear
            </button>
          </div>
        </RequirePermission>
      )}

      {/* ── Listing cards ────────────────────────────────────── */}
      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-36 bg-white dark:bg-gray-900 rounded-2xl shadow-card animate-pulse" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="py-16 text-center">
          <Package size={36} className="mx-auto mb-3 text-gray-300" />
          <p className="text-sm font-semibold text-brand-charcoal-dark dark:text-white">
            {t('listings.empty.title', 'No listings in this queue')}
          </p>
          <p className="mt-1 text-xs text-gray-400">
            {t('listings.empty.subtitle', 'All caught up!')}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((listing) => {
            const catStyle = CATEGORY_STYLES[listing.category] || 'bg-gray-100 dark:bg-white/5 text-gray-500';
            return (
              <div key={listing.id} className="p-4 bg-white dark:bg-gray-900 rounded-2xl shadow-card sm:p-5">
                <div className="flex gap-3">
                  {/* Bulk select checkbox */}
                  {(listing.status === 'pending' || listing.status === 'flagged') && (
                    <RequirePermission permission="listings:bulk_actions">
                      <input
                        type="checkbox"
                        checked={selectedIds.has(listing.id)}
                        onChange={() => toggleSelect(listing.id)}
                        className="w-4 h-4 mt-1 rounded border-gray-300 text-brand-gold focus:ring-brand-gold/40 shrink-0"
                        aria-label={`Select ${listing.title}`}
                      />
                    </RequirePermission>
                  )}

                  {/* Emoji placeholder */}
                  <div className="flex items-center justify-center w-12 h-12 text-xl bg-gray-100 rounded-xl dark:bg-white/10 shrink-0">
                    {listing.emoji}
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-brand-charcoal-dark dark:text-white truncate">{listing.title}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{listing.provider}</p>

                    <div className="flex flex-wrap items-center gap-2 mt-2">
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${catStyle}`}>
                        {listing.category}
                      </span>
                      <span className="text-xs font-semibold text-brand-gold">{listing.price}</span>
                      <span className="flex items-center gap-1 text-xs text-gray-400">
                        <Clock size={11} /> {listing.submittedDate}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Action buttons */}
                {(listing.status === 'pending' || listing.status === 'flagged') && (
                  <div className="flex gap-2 mt-3">
                    <RequirePermission permission="listings:approve">
                      <button
                        onClick={() => handleApprove(listing.id)}
                        className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-emerald-600 transition-colors bg-emerald-50 dark:bg-emerald-500/10 rounded-xl hover:bg-emerald-100 dark:hover:bg-emerald-500/20"
                      >
                        <CheckCircle2 size={13} /> {t('listings.approve', 'Approve')}
                      </button>
                    </RequirePermission>
                    <RequirePermission permission="listings:reject">
                      <button
                        onClick={() => { setRejectingId(rejectingId === listing.id ? null : listing.id); setRejectReason(''); }}
                        className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-red-600 transition-colors bg-red-50 dark:bg-red-500/10 rounded-xl hover:bg-red-100 dark:hover:bg-red-500/20"
                      >
                        <XCircle size={13} /> {t('listings.reject', 'Reject')}
                      </button>
                    </RequirePermission>
                    {listing.status !== 'flagged' && (
                      <RequirePermission permission="listings:flag">
                        <button
                          onClick={() => handleFlag(listing.id)}
                          className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-amber-600 transition-colors bg-amber-50 dark:bg-amber-500/10 rounded-xl hover:bg-amber-100 dark:hover:bg-amber-500/20"
                        >
                          <Flag size={13} /> {t('listings.flag', 'Flag')}
                        </button>
                      </RequirePermission>
                    )}
                    <RequirePermission permission="listings:feature">
                      <button
                        onClick={() => { setActiveListingId(listing.id); setTimeout(() => featureAction.execute(), 0); }}
                        className={`flex items-center gap-1.5 px-4 py-2 text-xs font-bold transition-colors rounded-xl ${
                          listing.featured
                            ? 'text-brand-gold bg-brand-gold/10 hover:bg-brand-gold/20'
                            : 'text-gray-500 bg-gray-50 dark:bg-white/5 hover:bg-gray-100 dark:hover:bg-white/10'
                        }`}
                      >
                        <Star size={13} className={listing.featured ? 'fill-brand-gold' : ''} />
                        {listing.featured ? 'Featured' : 'Feature'}
                      </button>
                    </RequirePermission>
                    <RequirePermission permission="listings:request_edit">
                      <button
                        onClick={() => { setRequestEditId(requestEditId === listing.id ? null : listing.id); setEditRequest(''); }}
                        className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-blue-600 transition-colors bg-blue-50 dark:bg-blue-500/10 rounded-xl hover:bg-blue-100 dark:hover:bg-blue-500/20"
                      >
                        <Edit3 size={13} /> Request Edit
                      </button>
                    </RequirePermission>
                  </div>
                )}

                {/* Inline request edit form */}
                {requestEditId === listing.id && (
                  <div className="mt-3 p-3 bg-blue-50 dark:bg-blue-500/10 rounded-xl space-y-2">
                    <div className="flex items-center gap-2 text-xs font-medium text-blue-600">
                      <Edit3 size={13} />
                      What changes should the provider make?
                    </div>
                    <input
                      type="text"
                      value={editRequest}
                      onChange={(e) => setEditRequest(e.target.value)}
                      placeholder="E.g., Update property photos, fix pricing, correct address..."
                      className="w-full px-3 py-2 text-sm bg-white dark:bg-gray-900 border border-blue-200 dark:border-blue-500/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-300 text-brand-charcoal-dark dark:text-white placeholder-gray-400"
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleRequestEdit(listing.id)}
                        disabled={!editRequest.trim()}
                        className="px-4 py-2 text-xs font-bold text-white transition-colors bg-blue-500 rounded-lg hover:bg-blue-600 disabled:opacity-40 disabled:cursor-not-allowed"
                      >
                        Send Request
                      </button>
                      <button
                        onClick={() => { setRequestEditId(null); setEditRequest(''); }}
                        className="px-4 py-2 text-xs font-bold text-gray-500 transition-colors bg-white dark:bg-gray-800 rounded-lg hover:bg-gray-100"
                      >
                        {t('common.cancel', 'Cancel')}
                      </button>
                    </div>
                  </div>
                )}

                {/* Inline rejection reason input */}
                {rejectingId === listing.id && (
                  <div className="mt-3 p-3 bg-red-50 dark:bg-red-500/10 rounded-xl space-y-2">
                    <div className="flex items-center gap-2 text-xs font-medium text-red-600">
                      <AlertTriangle size={13} />
                      {t('listings.rejectReasonLabel', 'Reason for rejection')}
                    </div>
                    <input
                      type="text"
                      value={rejectReason}
                      onChange={(e) => setRejectReason(e.target.value)}
                      placeholder={t('listings.rejectReasonPlaceholder', 'Enter reason...')}
                      className="w-full px-3 py-2 text-sm bg-white dark:bg-gray-900 border border-red-200 dark:border-red-500/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-300 text-brand-charcoal-dark dark:text-white placeholder-gray-400"
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleReject(listing.id)}
                        disabled={!rejectReason.trim()}
                        className="px-4 py-2 text-xs font-bold text-white transition-colors bg-red-500 rounded-lg hover:bg-red-600 disabled:opacity-40 disabled:cursor-not-allowed"
                      >
                        {t('listings.confirmReject', 'Confirm Rejection')}
                      </button>
                      <button
                        onClick={() => { setRejectingId(null); setRejectReason(''); }}
                        className="px-4 py-2 text-xs font-bold text-gray-500 transition-colors bg-white dark:bg-gray-800 rounded-lg hover:bg-gray-100"
                      >
                        {t('common.cancel', 'Cancel')}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* ── Confirm modals ─────────────────────────────────── */}
      <ConfirmAction {...featureAction.confirmProps} />
    </div>
  );
}
