import { useState, useEffect } from 'react';
import { Shield, Clock, Eye, EyeOff, AlertTriangle } from 'lucide-react';
import { formatOTPCountdown, isOTPExpired } from '../../utils/otp.js';

/**
 * User-side OTP display — shows the 6-digit code that the provider
 * must enter on arrival. Includes countdown, hide/reveal toggle,
 * and safety reminder.
 */
export default function OTPDisplay({ otp, onRegenerate }) {
  const [revealed, setRevealed] = useState(false);
  const [countdown, setCountdown] = useState('');
  const expired = otp ? isOTPExpired(otp) : false;

  useEffect(() => {
    if (!otp) return;
    const tick = () => setCountdown(formatOTPCountdown(otp.expiresAt));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [otp]);

  if (!otp) return null;

  const digits = otp.code.split('');

  return (
    <div className="space-y-4">
      <div className="text-center">
        <p className="mb-1 text-xs font-bold text-gray-400 uppercase tracking-wider">Your Check-In Code</p>
        <p className="text-[11px] text-gray-400">Only share this when the provider arrives at your location</p>
      </div>

      {/* Code display */}
      <div className="flex items-center justify-center gap-2">
        {digits.map((d, i) => (
          <div
            key={i}
            className="flex items-center justify-center w-12 h-14 text-2xl font-extrabold font-display rounded-xl border-2 border-brand-gold/30 bg-brand-gold/5 text-brand-charcoal-dark dark:text-white"
          >
            {revealed ? d : '•'}
          </div>
        ))}
      </div>

      {/* Reveal toggle */}
      <div className="flex justify-center">
        <button
          onClick={() => setRevealed(v => !v)}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-gray-500 hover:text-brand-gold transition-colors"
        >
          {revealed ? <EyeOff size={14} /> : <Eye size={14} />}
          {revealed ? 'Hide code' : 'Reveal code'}
        </button>
      </div>

      {/* Timer */}
      <div className="flex items-center justify-center gap-2 text-sm">
        <Clock size={14} className={expired ? 'text-red-500' : 'text-brand-gold'} />
        {expired ? (
          <span className="font-bold text-red-500">Code expired</span>
        ) : (
          <>
            <span className="text-gray-400">Expires in</span>
            <span className="font-bold text-brand-charcoal-dark dark:text-white">{countdown}</span>
          </>
        )}
      </div>

      {/* Regenerate if expired */}
      {expired && onRegenerate && (
        <div className="text-center">
          <button
            onClick={onRegenerate}
            className="px-4 py-2 text-xs font-bold text-white rounded-xl bg-brand-gold hover:bg-brand-gold-dark transition-colors"
          >
            Generate New Code
          </button>
        </div>
      )}

      {/* Safety notice */}
      <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-500/10 border border-amber-100 dark:border-amber-500/20">
        <div className="flex items-start gap-2">
          <AlertTriangle size={14} className="text-amber-600 shrink-0 mt-0.5" />
          <div className="text-[11px] text-amber-700 dark:text-amber-300 space-y-1">
            <p><strong>Safety reminders:</strong></p>
            <ul className="space-y-0.5 list-disc list-inside">
              <li>Only share this code in person, never by phone/text</li>
              <li>Verify the provider's identity before sharing</li>
              <li>The provider must be at your location (GPS verified)</li>
            </ul>
          </div>
        </div>
      </div>

      <p className="text-center text-[10px] text-gray-400 flex items-center justify-center gap-1">
        <Shield size={10} className="text-brand-gold" />
        OTP verified check-in protects your payment
      </p>
    </div>
  );
}
