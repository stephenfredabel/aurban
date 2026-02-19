import { useParams, Link } from 'react-router-dom';
import {
  ChevronLeft, Calendar, MapPin, MessageSquare, Wrench,
} from 'lucide-react';
import { useProBooking } from '../../context/ProBookingContext.jsx';
import { useCurrency } from '../../hooks/useCurrency.js';
import { TIER_CONFIG, PRO_BOOKING_STATUSES, isActiveBooking } from '../../data/proConstants.js';
import ProTierBadge from '../../components/pro/ProTierBadge.jsx';
import ProBookingTimeline from '../../components/pro/ProBookingTimeline.jsx';
import EscrowStatusCard from '../../components/pro/EscrowStatusCard.jsx';
import OTPCheckIn from '../../components/pro/OTPCheckIn.jsx';
import ProCheckOut from '../../components/pro/ProCheckOut.jsx';
import MaskedContactCard from '../../components/pro/MaskedContactCard.jsx';
import ProviderFixResponse from '../../components/pro/ProviderFixResponse.jsx';
import ScopeChangeInvoice from '../../components/pro/ScopeChangeInvoice.jsx';

/* ════════════════════════════════════════════════════════════
   PROVIDER PRO BOOKING DETAIL
   Route: /provider/pro-bookings/:id
════════════════════════════════════════════════════════════ */

export default function ProviderProBookingDetail() {
  const { id } = useParams();
  const { getBookingById, updateStatus, checkIn, checkOut } = useProBooking();
  const { symbol } = useCurrency();
  const booking = getBookingById(id);

  if (!booking) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <Wrench size={40} className="mb-3 text-gray-200 dark:text-gray-700" />
        <p className="mb-1 text-sm font-bold text-brand-charcoal-dark dark:text-white">Booking not found</p>
        <Link to="/provider/pro-bookings" className="mt-3 text-xs font-bold text-brand-gold hover:underline">
          Back to Pro Bookings
        </Link>
      </div>
    );
  }

  const tierCfg = TIER_CONFIG[booking.tier] || TIER_CONFIG[1];
  const statusDef = PRO_BOOKING_STATUSES[booking.status];
  const showCheckIn = ['provider_confirmed', 'en_route'].includes(booking.status);
  const showCheckOut = isActiveBooking(booking.status);
  const showRectification = booking.status === 'rectification';

  async function handleConfirm() {
    updateStatus(booking.id, 'provider_confirmed');
  }

  async function handleEnRoute() {
    updateStatus(booking.id, 'en_route');
  }

  async function handleOTPVerify() {
    checkIn(booking.id);
  }

  async function handleCheckOut() {
    checkOut(booking.id);
  }

  return (
    <div>
      <Link to="/provider/pro-bookings" className="flex items-center gap-1.5 mb-4 text-sm text-gray-500 hover:text-brand-gold transition-colors">
        <ChevronLeft size={16} /> Pro Bookings
      </Link>

      {/* Header */}
      <div className="mb-6">
        <div className="flex items-start justify-between gap-3 mb-2">
          <div>
            <h1 className="text-lg font-extrabold font-display text-brand-charcoal-dark dark:text-white">
              {booking.serviceTitle}
            </h1>
            <p className="text-xs text-gray-400">Client: {booking.clientName}</p>
          </div>
          <span className={`shrink-0 px-2.5 py-1 text-[10px] font-bold rounded-full ${statusDef?.color || 'bg-gray-100 text-gray-600'}`}>
            {statusDef?.label || booking.status}
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-3 text-xs text-gray-400">
          <span className="font-mono text-[10px]">{booking.ref}</span>
          <ProTierBadge tier={booking.tier} size="sm" />
          {booking.scheduledDate && (
            <span className="flex items-center gap-1">
              <Calendar size={12} />
              {new Date(booking.scheduledDate).toLocaleDateString('en-NG', { weekday: 'short', day: 'numeric', month: 'short' })}
              {booking.scheduledTime && ` at ${booking.scheduledTime}`}
            </span>
          )}
          {booking.location?.state && (
            <span className="flex items-center gap-1">
              <MapPin size={12} /> {booking.location.lga ? `${booking.location.lga}, ` : ''}{booking.location.state}
            </span>
          )}
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-2">

        {/* ── Left column ── */}
        <div className="space-y-5">

          {/* Confirm / En Route buttons */}
          {booking.status === 'confirmed' && (
            <div className="p-4 border-2 border-brand-gold/30 rounded-2xl bg-brand-gold/5">
              <p className="mb-3 text-sm font-bold text-brand-charcoal-dark dark:text-white">New Booking Request</p>
              <p className="mb-4 text-xs text-gray-400">Accept this booking to confirm with the client.</p>
              <button
                onClick={handleConfirm}
                className="w-full px-4 py-3 text-sm font-bold text-white rounded-xl bg-brand-gold hover:bg-brand-gold-dark transition-colors"
              >
                Accept & Confirm Booking
              </button>
            </div>
          )}

          {booking.status === 'provider_confirmed' && (
            <div className="p-4 border border-blue-200 dark:border-blue-500/20 rounded-2xl bg-blue-50/50 dark:bg-blue-500/5">
              <p className="mb-3 text-sm font-bold text-brand-charcoal-dark dark:text-white">Ready to Head Out?</p>
              <button
                onClick={handleEnRoute}
                className="w-full px-4 py-3 text-sm font-bold text-white rounded-xl bg-blue-600 hover:bg-blue-700 transition-colors"
              >
                Mark as En Route
              </button>
            </div>
          )}

          {/* OTP Check-In */}
          {showCheckIn && (
            <div className="p-4 border border-brand-gold/20 rounded-2xl bg-brand-gold/5">
              <OTPCheckIn booking={booking} onVerify={handleOTPVerify} />
            </div>
          )}

          {/* Check-Out form */}
          {showCheckOut && (
            <ProCheckOut booking={booking} onCheckOut={handleCheckOut} />
          )}

          {/* Rectification response */}
          {showRectification && (
            <ProviderFixResponse
              rectification={{ id: 'rect_1', status: 'reported', description: 'Issue reported by client' }}
              onAccept={() => {}}
              onDispute={() => {}}
            />
          )}

          {/* Timeline */}
          <div className="p-4 border border-gray-100 dark:border-white/10 rounded-2xl">
            <ProBookingTimeline booking={booking} />
          </div>

          {/* Scope */}
          {booking.scope && (
            <div className="p-4 border border-gray-100 dark:border-white/10 rounded-2xl">
              <h4 className="mb-2 text-xs font-bold text-gray-400 uppercase tracking-wider">Client Work Scope</h4>
              <p className="text-sm text-gray-600 dark:text-white/70 whitespace-pre-wrap">{booking.scope}</p>
            </div>
          )}

          {/* Scope change invoice */}
          {isActiveBooking(booking.status) && (
            <ScopeChangeInvoice booking={booking} onSubmit={() => {}} />
          )}
        </div>

        {/* ── Right column ── */}
        <div className="space-y-5">

          {/* Escrow Status */}
          <EscrowStatusCard booking={booking} />

          {/* Earnings breakdown */}
          <div className="p-4 border border-gray-100 dark:border-white/10 rounded-2xl">
            <h4 className="mb-3 text-xs font-bold text-gray-400 uppercase tracking-wider">Your Earnings</h4>
            <div className="space-y-2">
              <div className="flex justify-between text-xs">
                <span className="text-gray-500">Service Price</span>
                <span className="font-bold text-brand-charcoal-dark dark:text-white">{symbol}{booking.price?.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-gray-500">Commitment ({tierCfg.commitmentFeePercent}%)</span>
                <span className="font-bold text-brand-charcoal-dark dark:text-white">
                  {symbol}{(booking.commitmentAmount || Math.round(booking.price * tierCfg.commitmentFeePercent / 100)).toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-gray-500">Balance (after observation)</span>
                <span className="font-bold text-brand-charcoal-dark dark:text-white">
                  {symbol}{(booking.price - (booking.commitmentAmount || Math.round(booking.price * tierCfg.commitmentFeePercent / 100))).toLocaleString()}
                </span>
              </div>
            </div>
          </div>

          {/* Client contact (masked) */}
          <MaskedContactCard
            maskedPhone={`080****${Math.floor(1000 + Math.random() * 9000)}`}
            name={booking.clientName}
            role="client"
            onCall={() => {}}
            onMessage={() => {}}
          />

          {/* Location details */}
          {booking.location && (
            <div className="p-4 border border-gray-100 dark:border-white/10 rounded-2xl">
              <h4 className="mb-2 text-xs font-bold text-gray-400 uppercase tracking-wider">Work Location</h4>
              <div className="space-y-1.5 text-xs">
                <p className="text-brand-charcoal-dark dark:text-white font-semibold">{booking.location.address}</p>
                {booking.location.lga && <p className="text-gray-500">{booking.location.lga}, {booking.location.state}</p>}
                {booking.location.landmark && <p className="text-gray-400 italic">Landmark: {booking.location.landmark}</p>}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
