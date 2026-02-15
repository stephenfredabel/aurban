import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Calendar, Clock, User, MapPin,
  AlertCircle, AlertTriangle, CheckCircle2, MessageSquare,
} from 'lucide-react';
import * as adminService from '../../services/admin.service.js';
import RequirePermission from '../../components/admin/RequirePermission.jsx';
import { maskUserData } from '../../utils/dataMask.js';
import { useAuth } from '../../context/AuthContext.jsx';

/* ════════════════════════════════════════════════════════════
   BOOKING OVERSIGHT — Platform-wide booking management
   Route: /admin/bookings
════════════════════════════════════════════════════════════ */

/* ── Mock data (dev fallback) ────────────────────────────── */
const MOCK_BOOKINGS = [
  { id: 'b1', client: 'Adaeze Obi',     provider: 'Emeka Nwosu',     listing: '3 Bedroom Flat in Lekki',     date: '2025-02-15', time: '10:00 AM', status: 'pending',     escrow: '₦2,500,000' },
  { id: 'b2', client: 'Ibrahim Musa',   provider: 'Tunde Bakare',    listing: 'Land Survey — Ibeju-Lekki',   date: '2025-02-14', time: '2:00 PM',  status: 'confirmed',   escrow: '₦150,000' },
  { id: 'b3', client: 'Chinwe Eze',     provider: 'Funke Adeyemi',   listing: 'Shortlet Apartment V.I',       date: '2025-02-13', time: '12:00 PM', status: 'in_progress', escrow: '₦90,000' },
  { id: 'b4', client: 'Oluwaseun Ajayi', provider: 'Amina Suleiman', listing: 'Home Cleaning Service',        date: '2025-02-12', time: '9:00 AM',  status: 'completed',   escrow: '₦25,000' },
  { id: 'b5', client: 'Tunde Bakare',   provider: 'Chinwe Eze',      listing: 'Professional Plumbing',        date: '2025-02-11', time: '3:00 PM',  status: 'disputed',    escrow: '₦45,000' },
  { id: 'b6', client: 'Amina Suleiman', provider: 'Ibrahim Musa',    listing: 'Samsung Galaxy S24 Ultra',     date: '2025-02-10', time: '11:00 AM', status: 'disputed',    escrow: '₦850,000' },
];

const TABS = [
  { id: 'all',         label: 'All' },
  { id: 'pending',     label: 'Pending' },
  { id: 'confirmed',   label: 'Confirmed' },
  { id: 'in_progress', label: 'In Progress' },
  { id: 'completed',   label: 'Completed' },
  { id: 'disputed',    label: 'Disputed' },
  { id: 'cancelled',   label: 'Cancelled' },
];

const STATUS_STYLES = {
  pending:     { label: 'Pending',     bg: 'bg-amber-50 dark:bg-amber-500/10',     text: 'text-amber-600',   dot: 'bg-amber-400' },
  confirmed:   { label: 'Confirmed',   bg: 'bg-blue-50 dark:bg-blue-500/10',       text: 'text-blue-600',    dot: 'bg-blue-400' },
  in_progress: { label: 'In Progress', bg: 'bg-brand-gold/10',                     text: 'text-brand-gold',  dot: 'bg-brand-gold' },
  completed:   { label: 'Completed',   bg: 'bg-emerald-50 dark:bg-emerald-500/10', text: 'text-emerald-600', dot: 'bg-emerald-400' },
  disputed:    { label: 'Disputed',    bg: 'bg-red-50 dark:bg-red-500/10',         text: 'text-red-500',     dot: 'bg-red-400' },
  cancelled:   { label: 'Cancelled',   bg: 'bg-gray-50 dark:bg-gray-500/10',       text: 'text-gray-500',    dot: 'bg-gray-400' },
};

export default function BookingOversight() {
  const { t } = useTranslation('admin');
  const { user } = useAuth();

  const [bookings, setBookings]   = useState(MOCK_BOOKINGS);
  const [activeTab, setActiveTab] = useState('all');
  const [loading, setLoading]     = useState(true);
  const [usingFallback, setUsingFallback] = useState(false);
  const [cancellingId, setCancellingId]   = useState(null);
  const [resolvingId, setResolvingId]     = useState(null);
  const [resolveNote, setResolveNote]     = useState('');

  useEffect(() => {
    document.title = t('bookings.title', 'Booking Oversight') + ' — Aurban';
  }, [t]);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      try {
        const res = await adminService.getAllBookings({ page: 1, limit: 50 });
        if (!cancelled && res.success && res.bookings?.length) {
          setBookings(res.bookings);
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

  const filtered = activeTab === 'all' ? bookings : bookings.filter((b) => b.status === activeTab);

  /* ── Actions ────────────────────────────────────────────── */
  const handleCancelBooking = (id) => {
    setBookings((prev) => prev.map((b) => b.id === id ? { ...b, status: 'cancelled' } : b));
    setCancellingId(null);
  };

  const handleResolveDispute = (id) => {
    setBookings((prev) => prev.map((b) => b.id === id ? { ...b, status: 'completed' } : b));
    setResolvingId(null);
    setResolveNote('');
  };

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
          {t('bookings.title', 'Booking Oversight')}
        </h1>
        <p className="text-sm text-gray-400 mt-0.5">
          {t('bookings.subtitle', 'Platform-wide booking and dispute management')}
        </p>
      </div>

      {/* ── Tab bar ──────────────────────────────────────────── */}
      <div className="flex gap-2 mb-5 overflow-x-auto scrollbar-hide">
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
              {t(`bookings.tabs.${tab.id}`, tab.label)}
            </button>
          );
        })}
      </div>

      {/* ── Booking rows ─────────────────────────────────────── */}
      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-28 bg-white dark:bg-gray-900 rounded-2xl shadow-card animate-pulse" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="py-16 text-center">
          <Calendar size={36} className="mx-auto mb-3 text-gray-300" />
          <p className="text-sm font-semibold text-brand-charcoal-dark dark:text-white">
            {t('bookings.empty.title', 'No bookings found')}
          </p>
          <p className="mt-1 text-xs text-gray-400">
            {t('bookings.empty.subtitle', 'No bookings match this filter')}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((booking) => {
            const style = STATUS_STYLES[booking.status] || STATUS_STYLES.pending;
            const isDisputed = booking.status === 'disputed';

            return (
              <div
                key={booking.id}
                className={`p-4 bg-white dark:bg-gray-900 rounded-2xl shadow-card sm:p-5 transition-all
                  ${isDisputed ? 'ring-2 ring-red-300 dark:ring-red-500/40' : ''}`}
              >
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  {/* Booking info */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-brand-charcoal-dark dark:text-white truncate">
                      {booking.listing}
                    </p>

                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1.5 text-xs text-gray-400">
                      <span className="flex items-center gap-1">
                        <User size={11} /> {maskUserData({ name: booking.client }, user?.role).name}
                      </span>
                      <span className="flex items-center gap-1">
                        <MapPin size={11} /> {maskUserData({ name: booking.provider }, user?.role).name}
                      </span>
                      <span className="flex items-center gap-1">
                        <Calendar size={11} /> {booking.date}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock size={11} /> {booking.time}
                      </span>
                    </div>
                  </div>

                  {/* Right side: status + escrow */}
                  <div className="flex items-center gap-3 shrink-0">
                    <div className="text-right">
                      <p className="text-sm font-bold text-brand-charcoal-dark dark:text-white">{booking.escrow}</p>
                      <p className="text-[10px] text-gray-400">{t('bookings.escrow', 'Escrow')}</p>
                    </div>
                    <span className={`text-[10px] px-2.5 py-1 rounded-full font-medium ${style.bg} ${style.text} flex items-center gap-1`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${style.dot}`} />
                      {style.label}
                    </span>
                  </div>
                </div>

                {/* Cancel booking action */}
                {(booking.status === 'pending' || booking.status === 'confirmed' || booking.status === 'in_progress') && (
                  <div className="flex gap-2 mt-3">
                    <RequirePermission permission="bookings:cancel">
                      <button
                        onClick={() => setCancellingId(cancellingId === booking.id ? null : booking.id)}
                        className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-red-600 transition-colors bg-red-50 dark:bg-red-500/10 rounded-xl hover:bg-red-100 dark:hover:bg-red-500/20"
                      >
                        <AlertCircle size={12} />
                        {t('bookings.cancel', 'Cancel Booking')}
                      </button>
                    </RequirePermission>
                  </div>
                )}

                {/* Inline cancel confirmation */}
                {cancellingId === booking.id && (
                  <div className="mt-3 p-3 bg-red-50 dark:bg-red-500/10 rounded-xl space-y-2">
                    <div className="flex items-center gap-2 text-xs font-medium text-red-600">
                      <AlertTriangle size={13} />
                      {t('bookings.cancelConfirmLabel', 'Are you sure you want to cancel this booking?')}
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleCancelBooking(booking.id)}
                        className="px-4 py-2 text-xs font-bold text-white transition-colors bg-red-500 rounded-lg hover:bg-red-600"
                      >
                        {t('bookings.confirmCancel', 'Confirm Cancellation')}
                      </button>
                      <button
                        onClick={() => setCancellingId(null)}
                        className="px-4 py-2 text-xs font-bold text-gray-500 transition-colors bg-white dark:bg-gray-800 rounded-lg hover:bg-gray-100"
                      >
                        {t('common.cancel', 'Cancel')}
                      </button>
                    </div>
                  </div>
                )}

                {/* Dispute action */}
                {isDisputed && (
                  <div className="flex items-center justify-between p-3 mt-3 bg-red-50 dark:bg-red-500/10 rounded-xl">
                    <div className="flex items-center gap-2 text-xs text-red-600">
                      <AlertCircle size={13} />
                      {t('bookings.disputeNotice', 'This booking has an active dispute')}
                    </div>
                    <RequirePermission permission="bookings:resolve_dispute">
                      <button
                        onClick={() => { setResolvingId(resolvingId === booking.id ? null : booking.id); setResolveNote(''); }}
                        className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white transition-colors bg-red-500 rounded-xl hover:bg-red-600"
                      >
                        <MessageSquare size={12} />
                        {t('bookings.resolveDispute', 'Resolve Dispute')}
                      </button>
                    </RequirePermission>
                  </div>
                )}

                {/* Inline dispute resolution */}
                {resolvingId === booking.id && (
                  <div className="mt-3 p-3 bg-red-50 dark:bg-red-500/10 rounded-xl space-y-2">
                    <div className="flex items-center gap-2 text-xs font-medium text-red-600">
                      <AlertTriangle size={13} />
                      {t('bookings.resolveNoteLabel', 'Resolution notes')}
                    </div>
                    <input
                      type="text"
                      value={resolveNote}
                      onChange={(e) => setResolveNote(e.target.value)}
                      placeholder={t('bookings.resolveNotePlaceholder', 'Enter resolution details...')}
                      className="w-full px-3 py-2 text-sm bg-white dark:bg-gray-900 border border-red-200 dark:border-red-500/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-300 text-brand-charcoal-dark dark:text-white placeholder-gray-400"
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleResolveDispute(booking.id)}
                        disabled={!resolveNote.trim()}
                        className="px-4 py-2 text-xs font-bold text-white transition-colors bg-emerald-500 rounded-lg hover:bg-emerald-600 disabled:opacity-40 disabled:cursor-not-allowed"
                      >
                        <span className="flex items-center gap-1.5">
                          <CheckCircle2 size={12} />
                          {t('bookings.confirmResolve', 'Mark Resolved')}
                        </span>
                      </button>
                      <button
                        onClick={() => { setResolvingId(null); setResolveNote(''); }}
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
    </div>
  );
}
