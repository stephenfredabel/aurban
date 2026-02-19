import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  Calendar, Clock, MapPin, Shield, ChevronRight, Search,
  AlertCircle, CheckCircle2, Eye,
} from 'lucide-react';
import { useProBooking } from '../../context/ProBookingContext.jsx';
import { useCurrency } from '../../hooks/useCurrency.js';
import { PRO_BOOKING_STATUSES, TIER_CONFIG } from '../../data/proConstants.js';
import ProTierBadge from '../../components/pro/ProTierBadge.jsx';

/* ════════════════════════════════════════════════════════════
   USER PRO BOOKINGS — Manage Pro service bookings
   Route: /dashboard/pro-bookings
════════════════════════════════════════════════════════════ */

const TABS = [
  { id: 'active', label: 'Active' },
  { id: 'observation', label: 'Observation' },
  { id: 'completed', label: 'Completed' },
  { id: 'all', label: 'All' },
];

export default function ProBookings() {
  const { bookings, getActiveBookings, getInObservation, getCompletedBookings } = useProBooking();
  const { symbol } = useCurrency();
  const [tab, setTab] = useState('active');
  const [search, setSearch] = useState('');

  useEffect(() => {
    document.title = 'Pro Bookings — Aurban';
  }, []);

  const filtered = useMemo(() => {
    let list;
    switch (tab) {
      case 'active': list = getActiveBookings; break;
      case 'observation': list = getInObservation; break;
      case 'completed': list = getCompletedBookings; break;
      default: list = bookings;
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(b =>
        b.serviceTitle?.toLowerCase().includes(q) ||
        b.providerName?.toLowerCase().includes(q) ||
        b.ref?.toLowerCase().includes(q)
      );
    }
    return list;
  }, [tab, search, bookings, getActiveBookings, getInObservation, getCompletedBookings]);

  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <h1 className="section-title">Pro Bookings</h1>
        <Link
          to="/pro"
          className="text-xs font-bold text-brand-gold hover:underline"
        >
          Browse Services
        </Link>
      </div>
      <p className="mb-5 text-sm text-gray-400">Your Aurban Pro service bookings</p>

      {/* Tabs */}
      <div className="flex gap-1 p-1 mb-5 bg-gray-100 dark:bg-white/5 rounded-xl w-fit">
        {TABS.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors ${
              tab === t.id
                ? 'bg-white dark:bg-gray-900 text-brand-charcoal-dark dark:text-white shadow-sm'
                : 'text-gray-500 hover:text-brand-charcoal-dark dark:hover:text-white'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="relative mb-5">
        <Search size={14} className="absolute text-gray-300 left-3 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search by service, provider, or reference..."
          className="w-full py-2.5 pl-9 pr-4 text-sm border border-gray-200 dark:border-white/10 rounded-xl bg-white dark:bg-white/5 text-brand-charcoal-dark dark:text-white placeholder:text-gray-300 focus:ring-2 focus:ring-brand-gold/30 focus:border-brand-gold outline-none"
        />
      </div>

      {/* Bookings list */}
      {filtered.length === 0 ? (
        <div className="py-12 text-center">
          <Calendar size={40} className="mx-auto mb-3 text-gray-200 dark:text-gray-700" />
          <p className="mb-1 text-sm font-bold text-brand-charcoal-dark dark:text-white">No bookings found</p>
          <p className="mb-4 text-xs text-gray-400">
            {tab === 'active' ? "You don't have any active Pro bookings" : 'No bookings match your search'}
          </p>
          <Link to="/pro" className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white rounded-xl bg-brand-gold">
            Browse Pro Services
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(booking => {
            const statusDef = PRO_BOOKING_STATUSES[booking.status];
            const isObs = booking.status === 'observation';

            return (
              <Link
                key={booking.id}
                to={`/dashboard/pro-bookings/${booking.id}`}
                className="block p-4 border border-gray-100 dark:border-white/10 rounded-2xl hover:border-brand-gold/30 transition-colors"
              >
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-brand-charcoal-dark dark:text-white truncate">{booking.serviceTitle}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{booking.providerName}</p>
                  </div>
                  <span className={`shrink-0 px-2 py-0.5 text-[10px] font-bold rounded-full ${statusDef?.color || 'bg-gray-100 text-gray-600'}`}>
                    {statusDef?.label || booking.status}
                  </span>
                </div>

                <div className="flex flex-wrap items-center gap-3 mb-3 text-xs text-gray-400">
                  {booking.scheduledDate && (
                    <span className="flex items-center gap-1">
                      <Calendar size={12} />
                      {new Date(booking.scheduledDate).toLocaleDateString('en-NG', { day: 'numeric', month: 'short' })}
                      {booking.scheduledTime && ` at ${booking.scheduledTime}`}
                    </span>
                  )}
                  <span className="flex items-center gap-1">
                    <MapPin size={12} /> {booking.location?.state || 'N/A'}
                  </span>
                  <ProTierBadge tier={booking.tier} size="sm" />
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-brand-gold">{symbol}{booking.price?.toLocaleString()}</span>
                    <span className="flex items-center gap-1 text-[10px] text-gray-400">
                      <Shield size={10} className="text-brand-gold" /> Escrow
                    </span>
                  </div>
                  <div className="flex items-center gap-1 text-xs text-gray-400">
                    {isObs && (
                      <span className="flex items-center gap-1 text-purple-600 dark:text-purple-400 text-[10px] font-bold mr-2">
                        <Eye size={10} /> Observing
                      </span>
                    )}
                    <span className="text-[10px]">{booking.ref}</span>
                    <ChevronRight size={14} />
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
