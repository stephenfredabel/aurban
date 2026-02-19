import { useState, useRef, useEffect, useCallback } from 'react';
import { Shield, MapPin, Loader2, CheckCircle2, XCircle, Navigation } from 'lucide-react';
import useGeoLocation from '../../hooks/useGeoLocation.js';
import { OTP_CONFIG, GPS_CONFIG } from '../../data/proConstants.js';

/**
 * Provider-side OTP check-in.
 * 1. Provider enters the 6-digit OTP code given by the client
 * 2. GPS location is verified (within 200m of booking location)
 * 3. On success → commitment fee released, status → checked_in
 */
export default function OTPCheckIn({ booking, onVerify, disabled }) {
  const [digits, setDigits] = useState(Array(OTP_CONFIG.length).fill(''));
  const [verifying, setVerifying] = useState(false);
  const [error, setError] = useState('');
  const [gpsStatus, setGpsStatus] = useState('idle'); // idle | checking | success | error
  const [gpsMessage, setGpsMessage] = useState('');
  const inputRefs = useRef([]);

  const geo = useGeoLocation();

  const checkGPS = useCallback(async () => {
    if (!booking?.location?.lat) {
      // No GPS coordinates set — skip GPS check (will be verified server-side)
      setGpsStatus('success');
      setGpsMessage('Location verification will be confirmed on check-in');
      return;
    }

    setGpsStatus('checking');
    setGpsMessage('Checking your location...');

    try {
      const _coords = await geo.getCurrentPosition();
      const { within, distance } = geo.isWithinRadius(booking.location.lat, booking.location.lng, GPS_CONFIG.radiusMeters);

      if (within) {
        setGpsStatus('success');
        setGpsMessage(`Within ${distance}m of booking location`);
      } else {
        setGpsStatus('error');
        setGpsMessage(`You are ${distance}m away. Must be within ${GPS_CONFIG.radiusMeters}m.`);
      }
    } catch (err) {
      setGpsStatus('error');
      setGpsMessage(typeof err === 'string' ? err : 'Could not verify location');
    }
  }, [booking?.location?.lat, booking?.location?.lng, geo]);

  // Auto-check GPS on mount
  useEffect(() => {
    checkGPS();
  }, [checkGPS]);

  function handleDigitChange(index, value) {
    if (!/^\d?$/.test(value)) return;
    const next = [...digits];
    next[index] = value;
    setDigits(next);
    setError('');

    // Auto-focus next input
    if (value && index < OTP_CONFIG.length - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  }

  function handleKeyDown(index, e) {
    if (e.key === 'Backspace' && !digits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  }

  function handlePaste(e) {
    const text = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, OTP_CONFIG.length);
    if (text.length === OTP_CONFIG.length) {
      setDigits(text.split(''));
      inputRefs.current[OTP_CONFIG.length - 1]?.focus();
      e.preventDefault();
    }
  }

  async function handleSubmit() {
    const code = digits.join('');
    if (code.length !== OTP_CONFIG.length) {
      setError('Enter the full 6-digit code');
      return;
    }

    // GPS must pass (unless booking has no coordinates)
    if (booking?.location?.lat && gpsStatus !== 'success') {
      setError('GPS verification required. Please enable location access.');
      return;
    }

    setVerifying(true);
    setError('');

    try {
      await onVerify(code, geo.position);
    } catch (err) {
      setError(err?.message || 'Verification failed. Check the code and try again.');
    } finally {
      setVerifying(false);
    }
  }

  const canSubmit = digits.every(d => d) && !verifying && !disabled;

  return (
    <div className="space-y-5">
      <div className="text-center">
        <h3 className="mb-1 text-sm font-bold text-brand-charcoal-dark dark:text-white">Provider Check-In</h3>
        <p className="text-xs text-gray-400">Enter the 6-digit code given by the client</p>
      </div>

      {/* GPS Status */}
      <div className={`flex items-center gap-3 p-3 rounded-xl border ${
        gpsStatus === 'success' ? 'bg-emerald-50 dark:bg-emerald-500/10 border-emerald-100 dark:border-emerald-500/20' :
        gpsStatus === 'error' ? 'bg-red-50 dark:bg-red-500/10 border-red-100 dark:border-red-500/20' :
        gpsStatus === 'checking' ? 'bg-blue-50 dark:bg-blue-500/10 border-blue-100 dark:border-blue-500/20' :
        'bg-gray-50 dark:bg-white/5 border-gray-200 dark:border-white/10'
      }`}>
        {gpsStatus === 'checking' && <Loader2 size={16} className="text-blue-500 animate-spin" />}
        {gpsStatus === 'success' && <CheckCircle2 size={16} className="text-emerald-600" />}
        {gpsStatus === 'error' && <XCircle size={16} className="text-red-500" />}
        {gpsStatus === 'idle' && <MapPin size={16} className="text-gray-400" />}

        <div className="flex-1 min-w-0">
          <p className="text-xs font-semibold text-brand-charcoal-dark dark:text-white">GPS Verification</p>
          <p className="text-[11px] text-gray-500 dark:text-white/60">{gpsMessage || 'Waiting to verify location...'}</p>
        </div>

        {gpsStatus === 'error' && (
          <button
            onClick={checkGPS}
            className="px-3 py-1.5 text-[10px] font-bold rounded-lg bg-white dark:bg-white/10 text-gray-600 dark:text-white hover:text-brand-gold transition-colors"
          >
            Retry
          </button>
        )}
      </div>

      {/* OTP Input */}
      <div className="flex items-center justify-center gap-2" onPaste={handlePaste}>
        {digits.map((d, i) => (
          <input
            key={i}
            ref={el => inputRefs.current[i] = el}
            type="text"
            inputMode="numeric"
            maxLength={1}
            value={d}
            onChange={e => handleDigitChange(i, e.target.value)}
            onKeyDown={e => handleKeyDown(i, e)}
            className="w-12 h-14 text-center text-2xl font-extrabold font-display border-2 rounded-xl bg-white dark:bg-white/5 text-brand-charcoal-dark dark:text-white focus:border-brand-gold focus:ring-2 focus:ring-brand-gold/30 outline-none border-gray-200 dark:border-white/10"
          />
        ))}
      </div>

      {error && (
        <p className="text-center text-xs text-red-500">{error}</p>
      )}

      {/* Submit */}
      <button
        onClick={handleSubmit}
        disabled={!canSubmit}
        className="flex items-center justify-center gap-2 w-full px-5 py-3 text-sm font-bold text-white rounded-xl bg-brand-gold hover:bg-brand-gold-dark transition-colors disabled:opacity-50"
      >
        {verifying ? (
          <><Loader2 size={16} className="animate-spin" /> Verifying...</>
        ) : (
          <><Shield size={16} /> Verify & Check In</>
        )}
      </button>

      <p className="text-center text-[10px] text-gray-400">
        Commitment fee will be released to you upon successful check-in
      </p>
    </div>
  );
}
