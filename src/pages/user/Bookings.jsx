import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Calendar, Clock, MapPin, CheckCircle2, XCircle,
  AlertCircle, Star, ChevronRight, Search,
} from 'lucide-react';
import { useBooking }  from '../../context/BookingContext.jsx';
import { useCurrency } from '../../hooks/useCurrency.js';

/* ════════════════════════════════════════════════════════════
   USER BOOKINGS — Manage inspections & appointments
   Route: /dashboard/bookings
════════════════════════════════════════════════════════════ */

const STATUS_STYLES = {
  pending:      { label: 'Pending',      bg: 'bg-amber-50 dark:bg-amber-500/10',   text: 'text-amber-600',   dot: 'bg-amber-400'   },
  confirmed:    { label: 'Confirmed',    bg: 'bg-blue-50 dark:bg-blue-500/10',     text: 'text-blue-600',    dot: 'bg-blue-400'    },
  in_progress:  { label: 'In Progress',  bg: 'bg-brand-gold/10',                   text: 'text-brand-gold',  dot: 'bg-brand-gold'  },
  completed:    { label: 'Completed',    bg: 'bg-emerald-50 dark:bg-emerald-500/10', text: 'text-emerald-600', dot: 'bg-emerald-400' },
  released:     { label: 'Released',     bg: 'bg-emerald-50 dark:bg-emerald-500/10', text: 'text-emerald-600', dot: 'bg-emerald-400' },
  cancelled:    { label: 'Cancelled',    bg: 'bg-gray-100 dark:bg-white/5',        text: 'text-gray-500',    dot: 'bg-gray-400'    },
  disputed:     { label: 'Disputed',     bg: 'bg-red-50 dark:bg-red-500/10',       text: 'text-red-500',     dot: 'bg-red-400'     },
};

const TABS = ['upcoming', 'past', 'all'];

export default function Bookings() {
  const { t }            = useTranslation();
  const { bookings, getUpcoming, getPast, updateStatus, cancelBooking } = useBooking();
  const { format: formatPrice }  = useCurrency();
  const [tab, setTab]    = useState('upcoming');
  const [cancelId, setCancelId] = useState(null);

  useEffect(() => { document.title = t('booking.title', 'Bookings') + ' — Aurban'; }, [t]);

  const filtered = useMemo(() => {
    if (tab === 'upcoming') return getUpcoming;
    if (tab === 'past')     return getPast;
    return bookings;
  }, [tab, getUpcoming, getPast, bookings]);

  const handleMarkComplete = (id) => {
    updateStatus(id, 'completed');
  };

  const handleCancel = (id) => {
    cancelBooking(id);
    setCancelId(null);
  };

  const formatDate = (dateStr) => {
    const d = new Date(dateStr + 'T00:00:00');
    return d.toLocaleDateString('en-NG', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });
  };

  return (
    <div>
      <h1 className="section-title mb-1">{t('booking.title', 'Bookings')}</h1>
      <p className="text-sm text-gray-400 mb-5">{t('booking.subtitle', 'Your inspections and appointments')}</p>

      {/* Tab bar */}
      <div className="flex gap-2 mb-5 overflow-x-auto">
        {TABS.map((id) => (
          <button key={id} onClick={() => setTab(id)}
            className={`px-4 py-2 text-xs font-bold rounded-xl capitalize transition-colors whitespace-nowrap ${
              tab === id
                ? 'bg-brand-gold text-white'
                : 'bg-gray-100 dark:bg-white/5 text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-white/10'
            }`}>
            {t(`booking.${id}`, id)}
            {id === 'upcoming' && getUpcoming.length > 0 && (
              <span className="ml-1.5 px-1.5 py-0.5 text-[10px] bg-white/20 rounded-full">{getUpcoming.length}</span>
            )}
          </button>
        ))}
      </div>

      {/* Booking list */}
      {filtered.length === 0 ? (
        <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-card p-12 text-center">
          <div className="w-16 h-16 bg-brand-gold/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <Calendar size={28} className="text-brand-gold" />
          </div>
          <h3 className="font-display font-semibold text-brand-charcoal-dark dark:text-white">
            {t('booking.noBookings', 'No bookings yet')}
          </h3>
          <p className="text-sm text-gray-400 mt-1 max-w-xs mx-auto">
            Browse properties and services to book your first inspection
          </p>
          <Link to="/properties"
            className="inline-flex items-center gap-2 mt-5 px-5 py-2.5 bg-brand-gold hover:bg-brand-gold-dark text-white text-sm font-bold rounded-xl transition-colors">
            <Search size={14} /> {t('booking.browseProperties', 'Browse Properties')}
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((booking) => {
            const style = STATUS_STYLES[booking.status] || STATUS_STYLES.pending;
            const isPast = ['completed', 'released', 'cancelled'].includes(booking.status);

            return (
              <div key={booking.id}
                className="bg-white dark:bg-gray-900 rounded-2xl shadow-card p-4 sm:p-5 transition-shadow hover:shadow-md">
                {/* Top row: title + status */}
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="min-w-0">
                    <h3 className="text-sm font-bold text-brand-charcoal-dark dark:text-white truncate">
                      {booking.listingTitle}
                    </h3>
                    <p className="text-xs text-gray-400 mt-0.5">{booking.providerName}</p>
                  </div>
                  <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold whitespace-nowrap ${style.bg} ${style.text}`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${style.dot}`} />
                    {style.label}
                  </span>
                </div>

                {/* Details row */}
                <div className="flex flex-wrap gap-x-4 gap-y-1.5 text-xs text-gray-500 dark:text-gray-400 mb-3">
                  <span className="flex items-center gap-1.5">
                    <Calendar size={12} className="text-brand-gold" />
                    {formatDate(booking.date)}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Clock size={12} /> {booking.time}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <MapPin size={12} /> {booking.address}
                  </span>
                </div>

                {/* Escrow amount */}
                {booking.escrowAmount > 0 && (
                  <div className="flex items-center gap-2 px-3 py-2 mb-3 rounded-xl bg-amber-50 dark:bg-amber-500/10 border border-amber-100 dark:border-amber-500/20">
                    <AlertCircle size={13} className="text-amber-500 shrink-0" />
                    <span className="text-xs font-semibold text-amber-700 dark:text-amber-300">
                      {isPast ? t('booking.escrowReleased', 'Released to Provider') : t('booking.escrowHeld', 'Held in Escrow')}:
                      {' '}{formatPrice(booking.escrowAmount)}
                    </span>
                  </div>
                )}

                {/* Actions */}
                <div className="flex items-center gap-2 pt-2 border-t border-gray-100 dark:border-white/10">
                  {booking.status === 'confirmed' && (
                    <button onClick={() => setCancelId(booking.id)}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-red-500 bg-red-50 dark:bg-red-500/10 rounded-xl hover:bg-red-100 dark:hover:bg-red-500/20 transition-colors">
                      <XCircle size={13} /> {t('booking.cancelBooking', 'Cancel')}
                    </button>
                  )}
                  {booking.status === 'in_progress' && (
                    <button onClick={() => handleMarkComplete(booking.id)}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-white bg-brand-gold hover:bg-brand-gold-dark rounded-xl transition-colors">
                      <CheckCircle2 size={13} /> {t('booking.markComplete', 'Mark Complete')}
                    </button>
                  )}
                  {booking.status === 'completed' && (
                    <Link to={`/dashboard/bookings`}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-brand-gold bg-brand-gold/10 rounded-xl hover:bg-brand-gold/20 transition-colors">
                      <Star size={13} /> {t('booking.leaveReview', 'Leave Review')}
                    </Link>
                  )}
                  <Link to={`/dashboard/messages`}
                    className="ml-auto flex items-center gap-1 text-xs font-semibold text-gray-400 hover:text-brand-gold transition-colors">
                    Message <ChevronRight size={12} />
                  </Link>
                </div>

                {/* Cancel confirmation */}
                {cancelId === booking.id && (
                  <div className="mt-3 p-3 bg-red-50 dark:bg-red-500/10 rounded-xl border border-red-100 dark:border-red-500/20">
                    <p className="text-xs text-red-600 dark:text-red-400 mb-2 font-medium">
                      Are you sure? Late cancellations may affect your booking rating.
                    </p>
                    <div className="flex gap-2">
                      <button onClick={() => handleCancel(booking.id)}
                        className="px-3 py-1.5 text-xs font-bold text-white bg-red-500 rounded-lg hover:bg-red-600 transition-colors">
                        Yes, cancel
                      </button>
                      <button onClick={() => setCancelId(null)}
                        className="px-3 py-1.5 text-xs font-bold text-gray-600 dark:text-gray-300 bg-white dark:bg-gray-800 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                        Keep booking
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
