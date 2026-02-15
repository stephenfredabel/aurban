import { Phone, MessageSquare, Shield } from 'lucide-react';

/**
 * Masked phone display for active Pro bookings.
 * Shows a partially redacted phone number with "Call via Aurban"
 * and "Message" action buttons. Real phone numbers are never exposed.
 */
export default function MaskedContactCard({ maskedPhone, name, role, onCall, onMessage }) {
  const displayPhone = maskedPhone || '080*****XXX';
  const roleLabel = role === 'provider' ? 'Provider' : 'Client';

  return (
    <div className="p-4 border border-gray-100 dark:border-white/10 rounded-2xl">
      <div className="flex items-center gap-3 mb-3">
        <div className="flex items-center justify-center w-10 h-10 rounded-full bg-brand-gold/10 text-brand-gold font-bold text-sm">
          {name?.charAt(0) || roleLabel.charAt(0)}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-brand-charcoal-dark dark:text-white truncate">{name || roleLabel}</p>
          <p className="text-xs text-gray-400">{roleLabel}</p>
        </div>
      </div>

      {/* Masked phone */}
      <div className="flex items-center gap-2 p-2.5 mb-3 bg-gray-50 dark:bg-white/[0.02] rounded-xl">
        <Phone size={14} className="text-gray-400" />
        <span className="text-sm font-mono font-bold tracking-wider text-brand-charcoal-dark dark:text-white">{displayPhone}</span>
        <Shield size={12} className="ml-auto text-brand-gold" />
      </div>

      {/* Actions */}
      <div className="flex gap-2">
        <button
          onClick={onCall}
          className="flex items-center justify-center gap-2 flex-1 px-4 py-2.5 text-xs font-bold text-white rounded-xl bg-brand-gold hover:bg-brand-gold-dark transition-colors"
        >
          <Phone size={14} /> Call via Aurban
        </button>
        <button
          onClick={onMessage}
          className="flex items-center justify-center gap-2 flex-1 px-4 py-2.5 text-xs font-bold border border-gray-200 dark:border-white/10 rounded-xl text-brand-charcoal-dark dark:text-white hover:border-brand-gold transition-colors"
        >
          <MessageSquare size={14} /> Message
        </button>
      </div>

      <p className="mt-2 text-center text-[10px] text-gray-400 flex items-center justify-center gap-1">
        <Shield size={9} className="text-brand-gold" />
        Real phone number is masked for your safety
      </p>
    </div>
  );
}
