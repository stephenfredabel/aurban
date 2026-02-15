import { useEffect, useState, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  ChevronLeft, Calendar, MapPin, Shield, MessageSquare,
  AlertTriangle, Wrench,
} from 'lucide-react';
import { useProBooking } from '../../context/ProBookingContext.jsx';
import { useCurrency } from '../../hooks/useCurrency.js';
import { TIER_CONFIG, PRO_BOOKING_STATUSES, isActiveBooking } from '../../data/proConstants.js';
import { createOTPRecord } from '../../utils/otp.js';
import ProTierBadge from '../../components/pro/ProTierBadge.jsx';
import ProBookingTimeline from '../../components/pro/ProBookingTimeline.jsx';
import EscrowStatusCard from '../../components/pro/EscrowStatusCard.jsx';
import ObservationTimer from '../../components/pro/ObservationTimer.jsx';
import OTPDisplay from '../../components/pro/OTPDisplay.jsx';
import MaskedContactCard from '../../components/pro/MaskedContactCard.jsx';
import SOSButton from '../../components/pro/SOSButton.jsx';

/* ════════════════════════════════════════════════════════════
   USER PRO BOOKING DETAIL
   Route: /dashboard/pro-bookings/:id
════════════════════════════════════════════════════════════ */

export default function ProBookingDetail() {
  const { id } = useParams();
  const { getBookingById, updateStatus } = useProBooking();
  const { symbol } = useCurrency();
  const booking = getBookingById(id);

  const [otp, setOtp] = useState(null);

  useEffect(() => {
    document.title = booking ? `Booking ${booking.ref} — Aurban Pro` : 'Booking — Aurban Pro';
  }, [booking]);

  // Generate OTP when provider confirms
  useEffect(() => {
    if (booking && ['provider_confirmed', 'en_route'].includes(booking.status) && !otp) {
      setOtp(createOTPRecord(booking.id));
    }
  }, [booking?.status, otp, booking]);

  if (!booking) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <Wrench size={40} className="mb-3 text-gray-200 dark:text-gray-700" />
        <p className="mb-1 text-sm font-bold text-brand-charcoal-dark dark:text-white">Booking not found</p>
        <Link to="/dashboard/pro-bookings" className="mt-3 text-xs font-bold text-brand-gold hover:underline">
          Back to Pro Bookings
        </Link>
      </div>
    );
  }

  const tierCfg = TIER_CONFIG[booking.tier] || TIER_CONFIG[1];
  const statusDef = PRO_BOOKING_STATUSES[booking.status];
  const showOTP = ['provider_confirmed', 'en_route'].includes(booking.status);
  const showObservation = booking.status === 'observation';
  const showSOS = isActiveBooking(booking.status);

  function handleRegenerateOTP() {
    setOtp(createOTPRecord(booking.id));
  }

  function handleSOS(bookingId) {
    updateStatus(bookingId, 'disputed');
  }

  return (
    <div>
      {/* Back nav */}
      <Link to="/dashboard/pro-bookings" className="flex items-center gap-1.5 mb-4 text-sm text-gray-500 hover:text-brand-gold transition-colors">
        <ChevronLeft size={16} /> Pro Bookings
      </Link>

      {/* Header */}
      <div className="mb-6">
        <div className="flex items-start justify-between gap-3 mb-2">
          <div>
            <h1 className="text-lg font-extrabold font-display text-brand-charcoal-dark dark:text-white">
              {booking.serviceTitle}
            </h1>
            <p className="text-xs text-gray-400">{booking.providerName}</p>
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

          {/* OTP Display (when provider confirmed / en route) */}
          {showOTP && otp && (
            <div className="p-4 border border-brand-gold/20 rounded-2xl bg-brand-gold/5">
              <OTPDisplay otp={otp} onRegenerate={handleRegenerateOTP} />
            </div>
          )}

          {/* Observation Timer */}
          {showObservation && booking.completedAt && (
            <ObservationTimer
              completedAt={booking.completedAt}
              tier={booking.tier}
            />
          )}

          {/* Timeline */}
          <div className="p-4 border border-gray-100 dark:border-white/10 rounded-2xl">
            <ProBookingTimeline booking={booking} />
          </div>

          {/* Scope */}
          {booking.scope && (
            <div className="p-4 border border-gray-100 dark:border-white/10 rounded-2xl">
              <h4 className="mb-2 text-xs font-bold text-gray-400 uppercase tracking-wider">Work Scope</h4>
              <p className="text-sm text-gray-600 dark:text-white/70 whitespace-pre-wrap">{booking.scope}</p>
            </div>
          )}
        </div>

        {/* ── Right column ── */}
        <div className="space-y-5">

          {/* Escrow Status */}
          <EscrowStatusCard booking={booking} />

          {/* Price Summary */}
          <div className="p-4 border border-gray-100 dark:border-white/10 rounded-2xl">
            <h4 className="mb-3 text-xs font-bold text-gray-400 uppercase tracking-wider">Payment Summary</h4>
            <div className="space-y-2">
              <div className="flex justify-between text-xs">
                <span className="text-gray-500">Service Price</span>
                <span className="font-bold text-brand-charcoal-dark dark:text-white">{symbol}{booking.price?.toLocaleString()}</span>
              </div>
              {booking.platformFee > 0 && (
                <div className="flex justify-between text-xs">
                  <span className="text-gray-500">Platform Fee</span>
                  <span className="font-bold text-brand-charcoal-dark dark:text-white">{symbol}{booking.platformFee?.toLocaleString()}</span>
                </div>
              )}
              <div className="flex justify-between text-xs pt-2 border-t border-gray-100 dark:border-white/10">
                <span className="font-bold text-brand-charcoal-dark dark:text-white">Total</span>
                <span className="font-bold text-brand-gold">{symbol}{booking.total?.toLocaleString()}</span>
              </div>
            </div>
          </div>

          {/* Provider contact (masked) */}
          <MaskedContactCard
            maskedPhone={`080****${Math.floor(1000 + Math.random() * 9000)}`}
            name={booking.providerName}
            role="provider"
            onCall={() => {}}
            onMessage={() => {}}
          />

          {/* Actions */}
          <div className="space-y-2">
            <Link
              to={`/dashboard/messages?provider=${booking.providerId}&type=pro`}
              className="flex items-center justify-center gap-2 w-full px-4 py-3 text-sm font-bold border border-gray-200 dark:border-white/10 rounded-xl text-brand-charcoal-dark dark:text-white hover:border-brand-gold transition-colors"
            >
              <MessageSquare size={16} /> Message Provider
            </Link>

            {showObservation && (
              <button
                className="flex items-center justify-center gap-2 w-full px-4 py-3 text-sm font-bold text-red-600 border border-red-200 dark:border-red-500/20 rounded-xl hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors"
              >
                <AlertTriangle size={16} /> Report Issue
              </button>
            )}
          </div>
        </div>
      </div>

      {/* SOS Button (during active booking) */}
      {showSOS && (
        <SOSButton bookingId={booking.id} onTriggerSOS={handleSOS} />
      )}
    </div>
  );
}
