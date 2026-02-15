import { Link } from 'react-router-dom';
import { CheckCircle2, Calendar, MessageSquare, Shield } from 'lucide-react';
import { useCurrency } from '../../hooks/useCurrency.js';

/**
 * Post-booking confirmation screen with reference, next steps.
 */
export default function ProBookingConfirmation({ booking, service }) {
  const { symbol } = useCurrency();

  return (
    <div className="max-w-md mx-auto text-center">
      {/* Success icon */}
      <div className="flex items-center justify-center w-16 h-16 mx-auto mb-4 rounded-full bg-emerald-100 dark:bg-emerald-500/20">
        <CheckCircle2 size={32} className="text-emerald-600" />
      </div>

      <h2 className="mb-2 text-xl font-extrabold font-display text-brand-charcoal-dark dark:text-white">
        Booking Confirmed!
      </h2>
      <p className="mb-6 text-sm text-gray-400">
        Your payment is secure in escrow. The provider will confirm shortly.
      </p>

      {/* Reference */}
      <div className="p-4 mb-6 border border-gray-100 dark:border-white/10 rounded-2xl bg-gray-50 dark:bg-white/[0.02]">
        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Booking Reference</p>
        <p className="text-lg font-extrabold font-display text-brand-charcoal-dark dark:text-white">
          {booking?.ref || 'PRO-XXXXXX'}
        </p>
      </div>

      {/* Summary */}
      <div className="p-4 mb-6 text-left border border-gray-100 dark:border-white/10 rounded-2xl">
        <div className="space-y-2">
          <div className="flex justify-between text-xs">
            <span className="text-gray-500">Service</span>
            <span className="font-semibold text-brand-charcoal-dark dark:text-white truncate max-w-[200px]">{service?.title}</span>
          </div>
          <div className="flex justify-between text-xs">
            <span className="text-gray-500">Provider</span>
            <span className="font-semibold text-brand-charcoal-dark dark:text-white">{service?.providerName}</span>
          </div>
          {booking?.scheduledDate && (
            <div className="flex justify-between text-xs">
              <span className="text-gray-500">Date</span>
              <span className="font-semibold text-brand-charcoal-dark dark:text-white">
                {new Date(booking.scheduledDate).toLocaleDateString('en-NG', { weekday: 'short', day: 'numeric', month: 'short' })}
                {booking.scheduledTime && ` at ${booking.scheduledTime}`}
              </span>
            </div>
          )}
          <div className="flex justify-between text-xs">
            <span className="text-gray-500">Total (in escrow)</span>
            <span className="font-bold text-brand-gold">{symbol}{booking?.price?.toLocaleString()}</span>
          </div>
        </div>
      </div>

      {/* Next steps */}
      <div className="p-4 mb-6 text-left bg-blue-50 dark:bg-blue-500/10 rounded-2xl border border-blue-100 dark:border-blue-500/20">
        <p className="mb-2 text-xs font-bold text-blue-700 dark:text-blue-300">What happens next?</p>
        <ol className="space-y-1.5 text-[11px] text-blue-600 dark:text-blue-300 list-decimal list-inside">
          <li>Provider confirms your booking (usually within 4 hours)</li>
          <li>You'll receive an OTP code on the scheduled day</li>
          <li>Provider enters OTP on arrival — commitment fee released</li>
          <li>After work completes, observation window begins</li>
          <li>Balance released automatically if no issues reported</li>
        </ol>
      </div>

      {/* Actions */}
      <div className="flex flex-col gap-3">
        <Link to="/dashboard/pro-bookings"
          className="flex items-center justify-center gap-2 w-full px-5 py-3 text-sm font-bold text-white rounded-xl bg-brand-gold hover:bg-brand-gold-dark transition-colors">
          <Calendar size={16} /> View My Bookings
        </Link>
        <Link to={`/dashboard/messages?provider=${service?.providerId}&type=pro`}
          className="flex items-center justify-center gap-2 w-full px-5 py-3 text-sm font-bold border border-gray-200 dark:border-white/10 rounded-xl text-brand-charcoal-dark dark:text-white hover:border-brand-gold transition-colors">
          <MessageSquare size={16} /> Message Provider
        </Link>
        <Link to="/pro" className="text-xs font-semibold text-gray-400 hover:text-brand-gold transition-colors">
          Browse more services
        </Link>
      </div>

      <p className="mt-4 text-[10px] text-gray-400 flex items-center justify-center gap-1">
        <Shield size={10} className="text-brand-gold" /> Your payment is protected by Aurban Escrow
      </p>
    </div>
  );
}
