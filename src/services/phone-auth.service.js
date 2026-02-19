import React, { useState, useRef, useEffect, useCallback } from 'react';
import { requestPhoneOTP, verifyAndSignIn, formatNigerianPhone } from '../services/phone-auth.service.js';

/**
 * PhoneAuth — Two-step phone authentication component
 * Step 1: Enter phone number → sends OTP via Firebase
 * Step 2: Enter 6-digit code → verifies & signs into Supabase
 *
 * Props:
 *   onSuccess({ isNewUser }) — called after successful verification
 *   onCancel() — called when user cancels
 *   onError(message) — optional error callback
 *   defaultRole — 'user' | 'provider' (default: 'user')
 */
export default function PhoneAuth({ onSuccess, onCancel, onError }) {
  const [step, setStep] = useState('phone'); // 'phone' | 'otp' | 'verifying' | 'done'
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [formattedPhone, setFormattedPhone] = useState('');

  const phoneInputRef = useRef(null);
  const otpRefs = useRef([]);
  const sendBtnRef = useRef(null);

  // Focus phone input on mount
  useEffect(() => {
    if (step === 'phone' && phoneInputRef.current) {
      phoneInputRef.current.focus();
    }
  }, [step]);

  // Focus first OTP input when switching to OTP step
  useEffect(() => {
    if (step === 'otp' && otpRefs.current[0]) {
      otpRefs.current[0].focus();
    }
  }, [step]);

  // Countdown timer for resend
  useEffect(() => {
    if (countdown <= 0) return;
    const timer = setInterval(() => setCountdown(c => c - 1), 1000);
    return () => clearInterval(timer);
  }, [countdown]);

  // ── Phone validation ──────────────────────────────────────
  const isValidNigerianPhone = useCallback((value) => {
    const clean = value.replace(/[\s\-()]/g, '');
    // Nigerian numbers: 080x, 081x, 070x, 090x, 091x, etc.
    if (/^0[789][01]\d{8}$/.test(clean)) return true;
    if (/^\+234[789][01]\d{8}$/.test(clean)) return true;
    if (/^234[789][01]\d{8}$/.test(clean)) return true;
    return false;
  }, []);

  // ── Format phone as user types ────────────────────────────
  const handlePhoneChange = (e) => {
    let val = e.target.value.replace(/[^\d+]/g, '');
    // Limit length
    if (val.startsWith('+234')) {
      val = val.slice(0, 14); // +234XXXXXXXXXX
    } else if (val.startsWith('0')) {
      val = val.slice(0, 11); // 080XXXXXXXX
    }
    setPhone(val);
    setError('');
  };

  // ── Send OTP ──────────────────────────────────────────────
  const handleSendOTP = async (e) => {
    e.preventDefault();

    if (!isValidNigerianPhone(phone)) {
      setError('Enter a valid Nigerian phone number');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const formatted = formatNigerianPhone(phone);
      setFormattedPhone(formatted);

      const result = await requestPhoneOTP(formatted, sendBtnRef.current);

      if (result.success) {
        setStep('otp');
        setCountdown(60);
      } else {
        setError(result.error || 'Failed to send code. Try again.');
        if (onError) onError(result.error);
      }
    } catch (err) {
      setError('Something went wrong. Please try again.');
      if (onError) onError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // ── OTP input handling ────────────────────────────────────
  const handleOtpChange = (index, value) => {
    // Only allow digits
    const digit = value.replace(/\D/g, '').slice(-1);
    const newOtp = [...otp];
    newOtp[index] = digit;
    setOtp(newOtp);
    setError('');

    // Auto-advance to next input
    if (digit && index < 5) {
      otpRefs.current[index + 1]?.focus();
    }

    // Auto-submit when all 6 digits entered
    if (digit && index === 5 && newOtp.every(d => d !== '')) {
      handleVerifyOTP(newOtp.join(''));
    }
  };

  const handleOtpKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
    if (e.key === 'ArrowLeft' && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
    if (e.key === 'ArrowRight' && index < 5) {
      otpRefs.current[index + 1]?.focus();
    }
  };

  // Handle paste — fill all 6 boxes
  const handleOtpPaste = (e) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (pasted.length === 6) {
      const newOtp = pasted.split('');
      setOtp(newOtp);
      otpRefs.current[5]?.focus();
      handleVerifyOTP(pasted);
    }
  };

  // ── Verify OTP ────────────────────────────────────────────
  const handleVerifyOTP = async (code) => {
    if (!code || code.length !== 6) {
      setError('Enter the 6-digit code');
      return;
    }

    setStep('verifying');
    setLoading(true);
    setError('');

    try {
      const result = await verifyAndSignIn(code, formattedPhone);

      if (result.success) {
        setStep('done');
        if (onSuccess) onSuccess({ isNewUser: result.isNewUser });
      } else {
        setStep('otp');
        setOtp(['', '', '', '', '', '']);
        setError(result.error || 'Invalid code. Please try again.');
        otpRefs.current[0]?.focus();
        if (onError) onError(result.error);
      }
    } catch (err) {
      setStep('otp');
      setOtp(['', '', '', '', '', '']);
      setError('Verification failed. Please try again.');
      otpRefs.current[0]?.focus();
      if (onError) onError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // ── Resend OTP ────────────────────────────────────────────
  const handleResend = async () => {
    if (countdown > 0) return;
    setOtp(['', '', '', '', '', '']);
    setError('');
    setLoading(true);

    try {
      // Reset reCAPTCHA
      window.recaptchaVerifier = null;
      const result = await requestPhoneOTP(formattedPhone, sendBtnRef.current);
      if (result.success) {
        setCountdown(60);
      } else {
        setError('Failed to resend. Try again.');
      }
    } catch {
      setError('Failed to resend code.');
    } finally {
      setLoading(false);
    }
  };

  // ── Mask phone for display ────────────────────────────────
  const maskedPhone = formattedPhone
    ? formattedPhone.slice(0, 7) + '****' + formattedPhone.slice(-2)
    : '';

  // ── Styles ────────────────────────────────────────────────
  const styles = {
    container: {
      width: '100%',
      maxWidth: '400px',
      margin: '0 auto',
      fontFamily: "'Segoe UI', -apple-system, BlinkMacSystemFont, sans-serif",
    },
    header: {
      textAlign: 'center',
      marginBottom: '28px',
    },
    iconCircle: {
      width: '64px',
      height: '64px',
      borderRadius: '50%',
      background: 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      margin: '0 auto 16px',
      boxShadow: '0 4px 14px rgba(34, 197, 94, 0.3)',
    },
    title: {
      fontSize: '22px',
      fontWeight: '700',
      color: '#1a1a1a',
      margin: '0 0 6px',
    },
    subtitle: {
      fontSize: '14px',
      color: '#6b7280',
      margin: 0,
      lineHeight: '1.4',
    },
    inputGroup: {
      position: 'relative',
      marginBottom: '16px',
    },
    phonePrefix: {
      position: 'absolute',
      left: '14px',
      top: '50%',
      transform: 'translateY(-50%)',
      display: 'flex',
      alignItems: 'center',
      gap: '6px',
      fontSize: '15px',
      color: '#374151',
      fontWeight: '500',
      pointerEvents: 'none',
      zIndex: 1,
    },
    flag: {
      fontSize: '20px',
    },
    phoneInput: {
      width: '100%',
      height: '52px',
      paddingLeft: '82px',
      paddingRight: '14px',
      fontSize: '16px',
      fontWeight: '500',
      letterSpacing: '0.5px',
      border: '2px solid #e5e7eb',
      borderRadius: '12px',
      outline: 'none',
      transition: 'border-color 0.2s, box-shadow 0.2s',
      backgroundColor: '#fafafa',
      boxSizing: 'border-box',
    },
    phoneInputFocus: {
      borderColor: '#22c55e',
      boxShadow: '0 0 0 3px rgba(34, 197, 94, 0.1)',
      backgroundColor: '#fff',
    },
    otpContainer: {
      display: 'flex',
      gap: '8px',
      justifyContent: 'center',
      marginBottom: '20px',
    },
    otpInput: {
      width: '48px',
      height: '56px',
      textAlign: 'center',
      fontSize: '22px',
      fontWeight: '700',
      border: '2px solid #e5e7eb',
      borderRadius: '12px',
      outline: 'none',
      transition: 'border-color 0.2s, box-shadow 0.2s',
      backgroundColor: '#fafafa',
      color: '#1a1a1a',
    },
    otpInputFilled: {
      borderColor: '#22c55e',
      backgroundColor: '#f0fdf4',
    },
    otpInputFocused: {
      borderColor: '#22c55e',
      boxShadow: '0 0 0 3px rgba(34, 197, 94, 0.1)',
      backgroundColor: '#fff',
    },
    button: {
      width: '100%',
      height: '50px',
      border: 'none',
      borderRadius: '12px',
      fontSize: '16px',
      fontWeight: '600',
      cursor: 'pointer',
      transition: 'all 0.2s',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '8px',
    },
    primaryBtn: {
      background: 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)',
      color: '#fff',
      boxShadow: '0 2px 8px rgba(34, 197, 94, 0.3)',
    },
    primaryBtnDisabled: {
      background: '#d1d5db',
      color: '#9ca3af',
      boxShadow: 'none',
      cursor: 'not-allowed',
    },
    secondaryBtn: {
      background: 'transparent',
      color: '#6b7280',
      border: '1px solid #e5e7eb',
    },
    error: {
      backgroundColor: '#fef2f2',
      border: '1px solid #fecaca',
      borderRadius: '10px',
      padding: '10px 14px',
      fontSize: '13px',
      color: '#dc2626',
      marginBottom: '16px',
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
    },
    resendRow: {
      textAlign: 'center',
      fontSize: '14px',
      color: '#6b7280',
      marginBottom: '20px',
    },
    resendLink: {
      color: '#22c55e',
      fontWeight: '600',
      cursor: 'pointer',
      background: 'none',
      border: 'none',
      fontSize: '14px',
      textDecoration: 'underline',
    },
    resendDisabled: {
      color: '#9ca3af',
      cursor: 'not-allowed',
      textDecoration: 'none',
    },
    spinner: {
      width: '20px',
      height: '20px',
      border: '2.5px solid rgba(255,255,255,0.3)',
      borderTopColor: '#fff',
      borderRadius: '50%',
      animation: 'aurban-spin 0.7s linear infinite',
    },
    divider: {
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
      margin: '20px 0',
      color: '#9ca3af',
      fontSize: '13px',
    },
    dividerLine: {
      flex: 1,
      height: '1px',
      backgroundColor: '#e5e7eb',
    },
    verifyingBox: {
      textAlign: 'center',
      padding: '40px 20px',
    },
    successBox: {
      textAlign: 'center',
      padding: '30px 20px',
    },
    checkCircle: {
      width: '64px',
      height: '64px',
      borderRadius: '50%',
      background: 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      margin: '0 auto 16px',
    },
    backBtn: {
      background: 'none',
      border: 'none',
      color: '#6b7280',
      fontSize: '14px',
      cursor: 'pointer',
      display: 'flex',
      alignItems: 'center',
      gap: '4px',
      padding: '4px 0',
      marginBottom: '16px',
    },
  };

  return (
    <div style={styles.container}>
      {/* Keyframe animation for spinner */}
      <style>{`
        @keyframes aurban-spin {
          to { transform: rotate(360deg); }
        }
        @keyframes aurban-fadeIn {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .aurban-phone-input:focus {
          border-color: #22c55e !important;
          box-shadow: 0 0 0 3px rgba(34, 197, 94, 0.1) !important;
          background-color: #fff !important;
        }
        .aurban-otp-input:focus {
          border-color: #22c55e !important;
          box-shadow: 0 0 0 3px rgba(34, 197, 94, 0.1) !important;
          background-color: #fff !important;
        }
        .aurban-btn-primary:hover:not(:disabled) {
          transform: translateY(-1px);
          box-shadow: 0 4px 14px rgba(34, 197, 94, 0.4) !important;
        }
        .aurban-btn-primary:active:not(:disabled) {
          transform: translateY(0);
        }
        .aurban-btn-secondary:hover {
          background-color: #f9fafb !important;
          border-color: #d1d5db !important;
        }
        .aurban-resend:hover:not(:disabled) {
          color: #16a34a !important;
        }
      `}</style>

      {/* ──── STEP 1: Phone Number ──── */}
      {step === 'phone' && (
        <div style={{ animation: 'aurban-fadeIn 0.3s ease' }}>
          <div style={styles.header}>
            <div style={styles.iconCircle}>
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72 12.84 12.84 0 00.7 2.81 2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45 12.84 12.84 0 002.81.7A2 2 0 0122 16.92z"/>
              </svg>
            </div>
            <h2 style={styles.title}>Enter your phone number</h2>
            <p style={styles.subtitle}>
              We'll send a verification code to confirm your number
            </p>
          </div>

          {error && (
            <div style={styles.error}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="2">
                <circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/>
              </svg>
              {error}
            </div>
          )}

          <form onSubmit={handleSendOTP}>
            <div style={styles.inputGroup}>
              <div style={styles.phonePrefix}>
                <span style={styles.flag}>🇳🇬</span>
                <span>+234</span>
              </div>
              <input
                ref={phoneInputRef}
                type="tel"
                className="aurban-phone-input"
                placeholder="080 1234 5678"
                value={phone}
                onChange={handlePhoneChange}
                style={styles.phoneInput}
                maxLength={14}
                autoComplete="tel"
                disabled={loading}
              />
            </div>

            <button
              ref={sendBtnRef}
              type="submit"
              className="aurban-btn-primary"
              disabled={loading || !phone}
              style={{
                ...styles.button,
                ...(loading || !phone ? styles.primaryBtnDisabled : styles.primaryBtn),
              }}
            >
              {loading ? (
                <>
                  <div style={styles.spinner}></div>
                  Sending code...
                </>
              ) : (
                'Send verification code'
              )}
            </button>
          </form>

          {onCancel && (
            <>
              <div style={styles.divider}>
                <div style={styles.dividerLine}></div>
                <span>or</span>
                <div style={styles.dividerLine}></div>
              </div>
              <button
                className="aurban-btn-secondary"
                onClick={onCancel}
                style={{ ...styles.button, ...styles.secondaryBtn }}
              >
                Use another sign-in method
              </button>
            </>
          )}
        </div>
      )}

      {/* ──── STEP 2: OTP Verification ──── */}
      {step === 'otp' && (
        <div style={{ animation: 'aurban-fadeIn 0.3s ease' }}>
          <button
            style={styles.backBtn}
            onClick={() => {
              setStep('phone');
              setOtp(['', '', '', '', '', '']);
              setError('');
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="15 18 9 12 15 6"/>
            </svg>
            Back
          </button>

          <div style={styles.header}>
            <div style={styles.iconCircle}>
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0110 0v4"/>
              </svg>
            </div>
            <h2 style={styles.title}>Enter verification code</h2>
            <p style={styles.subtitle}>
              We sent a 6-digit code to <strong>{maskedPhone}</strong>
            </p>
          </div>

          {error && (
            <div style={styles.error}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="2">
                <circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/>
              </svg>
              {error}
            </div>
          )}

          {/* OTP Boxes */}
          <div style={styles.otpContainer} onPaste={handleOtpPaste}>
            {otp.map((digit, i) => (
              <input
                key={i}
                ref={el => otpRefs.current[i] = el}
                type="text"
                inputMode="numeric"
                maxLength={1}
                className="aurban-otp-input"
                value={digit}
                onChange={(e) => handleOtpChange(i, e.target.value)}
                onKeyDown={(e) => handleOtpKeyDown(i, e)}
                disabled={loading}
                style={{
                  ...styles.otpInput,
                  ...(digit ? styles.otpInputFilled : {}),
                }}
                autoComplete={i === 0 ? 'one-time-code' : 'off'}
              />
            ))}
          </div>

          {/* Resend */}
          <div style={styles.resendRow}>
            Didn't receive the code?{' '}
            <button
              className="aurban-resend"
              onClick={handleResend}
              disabled={countdown > 0 || loading}
              style={{
                ...styles.resendLink,
                ...(countdown > 0 ? styles.resendDisabled : {}),
              }}
            >
              {countdown > 0 ? `Resend in ${countdown}s` : 'Resend code'}
            </button>
          </div>

          <button
            className="aurban-btn-primary"
            onClick={() => handleVerifyOTP(otp.join(''))}
            disabled={loading || otp.some(d => !d)}
            style={{
              ...styles.button,
              ...(loading || otp.some(d => !d) ? styles.primaryBtnDisabled : styles.primaryBtn),
            }}
          >
            {loading ? (
              <>
                <div style={styles.spinner}></div>
                Verifying...
              </>
            ) : (
              'Verify & continue'
            )}
          </button>

          {onCancel && (
            <>
              <div style={styles.divider}>
                <div style={styles.dividerLine}></div>
                <span>or</span>
                <div style={styles.dividerLine}></div>
              </div>
              <button
                className="aurban-btn-secondary"
                onClick={onCancel}
                style={{ ...styles.button, ...styles.secondaryBtn }}
              >
                Use another sign-in method
              </button>
            </>
          )}
        </div>
      )}

      {/* ──── VERIFYING STATE ──── */}
      {step === 'verifying' && (
        <div style={{ ...styles.verifyingBox, animation: 'aurban-fadeIn 0.3s ease' }}>
          <div style={{ ...styles.spinner, width: '40px', height: '40px', borderWidth: '3px', borderColor: 'rgba(34,197,94,0.2)', borderTopColor: '#22c55e', margin: '0 auto 20px' }}></div>
          <h2 style={{ ...styles.title, fontSize: '18px' }}>Verifying your number...</h2>
          <p style={styles.subtitle}>This will only take a moment</p>
        </div>
      )}

      {/* ──── SUCCESS STATE ──── */}
      {step === 'done' && (
        <div style={{ ...styles.successBox, animation: 'aurban-fadeIn 0.3s ease' }}>
          <div style={styles.checkCircle}>
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12"/>
            </svg>
          </div>
          <h2 style={{ ...styles.title, color: '#16a34a' }}>Phone verified!</h2>
          <p style={styles.subtitle}>Redirecting you now...</p>
        </div>
      )}
    </div>
  );
}