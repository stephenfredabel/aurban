import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  Calendar, MapPin, Shield, ChevronRight, Search,
  CheckCircle2, Clock, AlertTriangle,
} from 'lucide-react';
import { useProBooking } from '../../context/ProBookingContext.jsx';
import { useCurrency } from '../../hooks/useCurrency.js';
import { PRO_BOOKING_STATUSES, TIER_CONFIG, isActiveBooking } from '../../data/proConstants.js';
import ProTierBadge from '../../components/pro/ProTierBadge.jsx';

/* ════════════════════════════════════════════════════════════
   PROVIDER PRO BOOKINGS
   Route: /provider/pro-bookings
════════════════════════════════════════════════════════════ */

const TABS = [
  { id: 'incoming', label: 'Incoming' },
  { id: 'confirmed', label: 'Confirmed' },
  { id: 'active', label: 'Active' },
  { id: 'observation', label: 'Observation' },
  { id: 'history', label: 'History' },
];

export default function ProviderProBookings() {
  const { bookings } = useProBooking();
  const { symbol } = useCurrency();
  const [tab, setTab] = useState('incoming');
  const [search, setSearch] = useState('');

  const filtered = useMemo(() => {
    let list = bookings;
    switch (tab) {
      case 'incoming': list = bookings.filter(b => b.status === 'confirmed'); break;
      case 'confirmed': list = bookings.filter(b => ['provider_confirmed', 'en_route'].includes(b.status)); break;
      case 'active': list = bookings.filter(b => isActiveBooking(b.status)); break;
      case 'observation': list = bookings.filter(b => b.status === 'observation'); break;
      case 'history': list = bookings.filter(b => ['completed', 'cancelled', 'paid'].includes(b.status)); break;
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(b =>
        b.serviceTitle?.toLowerCase().includes(q) ||
        b.clientName?.toLowerCase().includes(q) ||
        b.ref?.toLowerCase().includes(q)
      );
    }
    return list;
  }, [tab, search, bookings]);

  return (
    <div>
      <h1 className="section-title mb-1">Pro Bookings</h1>
      <p className="mb-5 text-sm text-gray-400">Manage your Aurban Pro service bookings</p>

      {/* Tabs */}
      <div className="flex gap-1 p-1 mb-5 overflow-x-auto bg-gray-100 dark:bg-white/5 rounded-xl w-fit">
        {TABS.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`px-3 py-2 text-xs font-bold rounded-lg whitespace-nowrap transition-colors active:scale-[0.97] ${
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
          placeholder="Search by service, client, or reference..."
          className="w-full py-2.5 pl-9 pr-4 text-sm border border-gray-200 dark:border-white/10 rounded-xl bg-white dark:bg-white/5 text-brand-charcoal-dark dark:text-white placeholder:text-gray-300 focus:ring-2 focus:ring-brand-gold/30 focus:border-brand-gold outline-none"
        />
      </div>

      {filtered.length === 0 ? (
        <div className="py-12 text-center">
          <Calendar size={40} className="mx-auto mb-3 text-gray-200 dark:text-gray-700" />
          <p className="mb-1 text-sm font-bold text-brand-charcoal-dark dark:text-white">No bookings found</p>
          <p className="text-xs text-gray-400">No Pro bookings in this tab</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(booking => {
            const statusDef = PRO_BOOKING_STATUSES[booking.status];
            return (
              <Link
                key={booking.id}
                to={`/provider/pro-bookings/${booking.id}`}
                className="block p-4 border border-gray-100 dark:border-white/10 rounded-2xl hover:border-brand-gold/30 transition-colors"
              >
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-brand-charcoal-dark dark:text-white truncate">{booking.serviceTitle}</p>
                    <p className="text-xs text-gray-400 mt-0.5">Client: {booking.clientName || 'Unknown'}</p>
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
                  <span className="text-sm font-bold text-brand-gold">{symbol}{booking.price?.toLocaleString()}</span>
                  <div className="flex items-center gap-1 text-xs text-gray-400">
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
