import { useState, useRef, useCallback, useEffect } from 'react';
import {
  Mail, Smartphone, Loader, CheckCircle2, AlertCircle,
  ArrowRight, RotateCcw, Shield, MessageSquare,
} from 'lucide-react';
import { COUNTRIES } from '../../config/countries.js';
import { useLocale } from '../../context/LocaleContext.jsx';
import {
  sendEmailOTP, verifyEmailOTP,
  sendPhoneOTP, verifyPhoneOTP,
} from '../../services/otp.service.js';

/* ════════════════════════════════════════════════════════════
   OTP VERIFICATION — Reusable component for login/register

   Props:
   • email        — user's email (for email OTP)
   • phone        — user's phone (for phone OTP, optional)
   • onVerified   — callback({ method: 'email'|'phone', data })
   • onSkip       — optional skip callback (if allowed)
   • title        — optional heading
   • subtitle     — optional subtext
════════════════════════════════════════════════════════════ */

const RESEND_COOLDOWN = 60; // seconds

export default function OTPVerification({
  email,
  phone: initialPhone,
  onVerified,
  onSkip,
  title = 'Verify your identity',
  subtitle,
}) {
  const { countryCode: defaultCountryCode } = useLocale();

  const [method, setMethod] = useState('email'); // 'email' | 'phone'
  const [channel, setChannel] = useState('whatsapp'); // 'whatsapp' | 'generic'
  const [code, setCode]     = useState(['', '', '', '', '', '']);
  const [phoneNumber, setPhoneNumber] = useState(initialPhone || '');
  const [countryCode, setCountryCode] = useState(defaultCountryCode || 'NG');
  const [pinId, setPinId]   = useState(null);
  const [sent, setSent]     = useState(false);
  const [loading, setLoading] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [error, setError]   = useState('');
  const [success, setSuccess] = useState('');
  const [cooldown, setCooldown] = useState(0);

  const inputRefs = useRef([]);
  const cooldownRef = useRef(null);

  const selectedCountry = COUNTRIES.find(c => c.code === countryCode) || COUNTRIES[0];

  // Auto-send email OTP on mount
  useEffect(() => {
    if (email && method === 'email') {
      handleSendOTP();
    }
    return () => clearInterval(cooldownRef.current);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Cooldown timer
  useEffect(() => {
    if (cooldown <= 0) {
      clearInterval(cooldownRef.current);
      return;
    }
    cooldownRef.current = setInterval(() => {
      setCooldown(prev => {
        if (prev <= 1) { clearInterval(cooldownRef.current); return 0; }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(cooldownRef.current);
  }, [cooldown]);

  /* ── Send OTP ─────────────────────────────────────────────── */
  const handleSendOTP = useCallback(async () => {
    setError(''); setSuccess('');
    setLoading(true);

    try {
      if (method === 'email') {
        const res = await sendEmailOTP(email);
        if (!res.success) { setError(res.error || 'Failed to send code.'); setLoading(false); return; }
        setSent(true);
        setCooldown(RESEND_COOLDOWN);
        setSuccess(`Verification code sent to ${email}`);
      } else {
        const fullPhone = selectedCountry.phone + phoneNumber.replace(/^0+/, '');
        const res = await sendPhoneOTP(fullPhone, channel);
        if (!res.success) { setError(res.error || 'Failed to send code.'); setLoading(false); return; }
        setPinId(res.pinId);
        setSent(true);
        setCooldown(RESEND_COOLDOWN);
        setSuccess(`Code sent via ${channel === 'whatsapp' ? 'WhatsApp' : 'SMS'} to ${fullPhone}`);
      }
    } catch {
      setError('Failed to send verification code.');
    } finally {
      setLoading(false);
    }
  }, [method, email, phoneNumber, channel, selectedCountry]);

  /* ── Verify OTP ───────────────────────────────────────────── */
  const handleVerify = useCallback(async () => {
    const token = code.join('');
    if (token.length !== 6) { setError('Please enter the full 6-digit code.'); return; }

    setError(''); setVerifying(true);

    try {
      let res;
      if (method === 'email') {
        res = await verifyEmailOTP(email, token);
      } else {
        res = await verifyPhoneOTP(pinId, token);
      }

      if (res.success && res.verified) {
        setSuccess('Verified!');
        setTimeout(() => onVerified?.({ method, data: res.data }), 500);
      } else {
        setError(res.error || 'Invalid code. Please try again.');
        setCode(['', '', '', '', '', '']);
        inputRefs.current[0]?.focus();
      }
    } catch {
      setError('Verification failed. Please try again.');
    } finally {
      setVerifying(false);
    }
  }, [code, method, email, pinId, onVerified]);

  /* ── Code input handlers ──────────────────────────────────── */
  const handleCodeChange = (index, value) => {
    if (!/^\d*$/.test(value)) return;
    const newCode = [...code];
    newCode[index] = value.slice(-1);
    setCode(newCode);
    if (value && index < 5) inputRefs.current[index + 1]?.focus();
    // Auto-verify when all 6 digits entered
    if (value && index === 5 && newCode.every(d => d)) {
      setTimeout(() => handleVerify(), 100);
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !code[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
    if (e.key === 'Enter') handleVerify();
  };

  const handlePaste = (e) => {
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (pasted.length === 6) {
      setCode(pasted.split(''));
      inputRefs.current[5]?.focus();
      e.preventDefault();
    }
  };

  /* ── Switch method ────────────────────────────────────────── */
  const switchMethod = (newMethod) => {
    setMethod(newMethod);
    setCode(['', '', '', '', '', '']);
    setSent(newMethod === 'email'); // Email is auto-sent
    setError('');
    setSuccess('');
    setPinId(null);
    if (newMethod === 'email' && email) {
      handleSendOTP();
    }
  };

  return (
    <div className="w-full max-w-md mx-auto">

      {/* Header */}
      <div className="mb-6 text-center">
        <div className="flex items-center justify-center w-14 h-14 mx-auto mb-4 bg-brand-gold/10 rounded-2xl">
          <Shield size={28} className="text-brand-gold" />
        </div>
        <h2 className="text-xl font-bold font-display text-brand-charcoal-dark dark:text-white">
          {title}
        </h2>
        <p className="mt-1.5 text-sm text-gray-400">
          {subtitle || 'Choose how you want to verify your account'}
        </p>
      </div>

      {/* Method tabs */}
      <div className="flex p-1 mb-5 bg-gray-100 rounded-full dark:bg-white/5">
        <button
          type="button"
          onClick={() => switchMethod('email')}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-semibold rounded-full transition-all
            ${method === 'email' ? 'bg-white dark:bg-gray-800 text-brand-charcoal-dark dark:text-white shadow-sm' : 'text-gray-400'}`}
        >
          <Mail size={13} /> Email
        </button>
        <button
          type="button"
          onClick={() => switchMethod('phone')}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-semibold rounded-full transition-all
            ${method === 'phone' ? 'bg-white dark:bg-gray-800 text-brand-charcoal-dark dark:text-white shadow-sm' : 'text-gray-400'}`}
        >
          <Smartphone size={13} /> Phone
        </button>
      </div>

      {/* Phone input (only for phone method) */}
      {method === 'phone' && !sent && (
        <div className="mb-5 space-y-3">
          {/* Channel toggle */}
          <div className="flex p-0.5 bg-gray-50 dark:bg-white/5 rounded-lg">
            <button type="button" onClick={() => setChannel('whatsapp')}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 text-[11px] font-medium rounded-md transition-all
                ${channel === 'whatsapp' ? 'bg-emerald-500 text-white shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}>
              <MessageSquare size={11} /> WhatsApp
            </button>
            <button type="button" onClick={() => setChannel('generic')}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 text-[11px] font-medium rounded-md transition-all
                ${channel === 'generic' ? 'bg-blue-500 text-white shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}>
              <Smartphone size={11} /> SMS
            </button>
          </div>

          {/* Country + phone number */}
          <div className="flex gap-2">
            <select
              value={countryCode}
              onChange={(e) => setCountryCode(e.target.value)}
              className="px-3 py-3 text-sm border border-gray-200 rounded-xl bg-gray-50 dark:bg-white/5 dark:border-white/10 focus:outline-none focus:ring-2 focus:ring-brand-gold/30 shrink-0"
            >
              {COUNTRIES.map(c => (
                <option key={c.code} value={c.code}>
                  {c.flag} {c.phone}
                </option>
              ))}
            </select>
            <input
              type="tel"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value.replace(/[^\d\s-]/g, '').slice(0, 15))}
              placeholder="8xx xxxx xxxx"
              className="flex-1 px-4 py-3 text-sm border border-gray-200 rounded-xl bg-gray-50 dark:bg-white/5 dark:border-white/10 focus:outline-none focus:ring-2 focus:ring-brand-gold/30 dark:text-white placeholder:text-gray-300"
            />
          </div>

          <button
            type="button"
            onClick={handleSendOTP}
            disabled={loading || !phoneNumber.trim()}
            className="w-full py-3 text-sm font-semibold text-white transition-all rounded-full bg-brand-gold hover:bg-brand-gold-dark disabled:opacity-40 flex items-center justify-center gap-2"
          >
            {loading ? <Loader size={16} className="animate-spin" /> : <>Send Code <ArrowRight size={14} /></>}
          </button>
        </div>
      )}

      {/* OTP Code Input (shown after sending) */}
      {(sent || method === 'email') && (
        <div className="space-y-5">

          {/* 6-digit input */}
          <div>
            <p className="mb-3 text-xs font-medium text-center text-gray-500 dark:text-gray-400">
              Enter the 6-digit code
            </p>
            <div className="flex justify-center gap-2.5" onPaste={handlePaste}>
              {code.map((digit, i) => (
                <input
                  key={i}
                  ref={el => inputRefs.current[i] = el}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleCodeChange(i, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(i, e)}
                  className={`w-12 h-14 text-center text-xl font-bold border rounded-xl focus:outline-none focus:ring-2 transition-all
                    ${digit
                      ? 'border-brand-gold bg-brand-gold/5 text-brand-charcoal-dark dark:text-white focus:ring-brand-gold/30'
                      : 'border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5 text-gray-800 dark:text-white focus:ring-brand-gold/30'
                    }`}
                  autoComplete="one-time-code"
                />
              ))}
            </div>
          </div>

          {/* Status messages */}
          {error && (
            <p className="flex items-center justify-center gap-2 text-sm text-red-500">
              <AlertCircle size={14} />{error}
            </p>
          )}
          {success && !error && (
            <p className="flex items-center justify-center gap-2 text-sm text-emerald-600">
              <CheckCircle2 size={14} />{success}
            </p>
          )}

          {/* Verify button */}
          <button
            type="button"
            onClick={handleVerify}
            disabled={verifying || code.join('').length !== 6}
            className="w-full py-3 text-sm font-semibold text-white transition-all rounded-full bg-brand-gold hover:bg-brand-gold-dark disabled:opacity-40 flex items-center justify-center gap-2"
          >
            {verifying ? <Loader size={16} className="animate-spin" /> : <>Verify <CheckCircle2 size={14} /></>}
          </button>

          {/* Resend */}
          <div className="text-center">
            {cooldown > 0 ? (
              <p className="text-xs text-gray-400">
                Resend code in <span className="font-semibold text-brand-gold">{cooldown}s</span>
              </p>
            ) : (
              <button
                type="button"
                onClick={handleSendOTP}
                disabled={loading}
                className="inline-flex items-center gap-1.5 text-xs font-medium text-brand-gold hover:text-brand-gold-dark transition-colors"
              >
                <RotateCcw size={12} /> Resend code
              </button>
            )}
          </div>

          {/* Skip option */}
          {onSkip && (
            <button
              type="button"
              onClick={onSkip}
              className="w-full py-2 text-xs text-gray-400 transition-colors hover:text-gray-600"
            >
              Skip for now
            </button>
          )}
        </div>
      )}
    </div>
  );
}
