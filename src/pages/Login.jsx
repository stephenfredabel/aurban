import { useState, useCallback } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import {
  Mail, Lock, Eye, EyeOff, AlertCircle,
  CheckCircle2, Loader, Shield,
  Smartphone, Send, LogIn,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';
import AurbanLogo  from '../components/AurbanLogo.jsx';
import { isSupabaseConfigured } from '../lib/supabase.js';
import { signInWithEmail, signInWithGoogle, signInWithMagicLink } from '../services/supabase-auth.service.js';
import OTPVerification from '../components/auth/OTPVerification.jsx';
import { safeRedirect, loginLimiter } from '../utils/security.js';

/* ════════════════════════════════════════════════════════════
   LOGIN — End-user / Visitor login
   
   This is the USER login page (reached from Header buttons).
   After successful login → returns to marketplace (/)
   
   Providers have their own login at /provider/login
════════════════════════════════════════════════════════════ */

/* ── Google icon ──────────────────────────────────────────── */
function GoogleIcon({ size = 20 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18A10.96 10.96 0 001 12c0 1.77.42 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
    </svg>
  );
}


export default function Login() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  useAuth(); // provides session context; login handled by onAuthStateChange

  const [mode, setMode]               = useState('password');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading]         = useState(false);
  const [gLoading, setGLoading]       = useState(false);
  const [error, setError]             = useState('');
  const [success, setSuccess]         = useState('');
  const [form, setForm]               = useState({ email: params.get('email') || '', password: '' });
  const [magicLinkSent, setMagicLinkSent] = useState(false);
  const [twoFactorCode, setTwoFactorCode] = useState('');
  const [twoFactorData, setTwoFactorData] = useState(null);
  const [usePhone, setUsePhone]       = useState(false);
  const [needsVerification, setNeedsVerification] = useState(!!params.get('verify'));

  /* ── Helper: redirect BACK TO MARKETPLACE ───────────────── */
  const redirectAfterLogin = () => {
    // safeRedirect ensures only same-origin paths are honored — no open redirect
    const redirect = safeRedirect(params.get('redirect') || '/');
    navigate(redirect, { replace: true });
  };

  /* ── Form submit ────────────────────────────────────────── */
  const handleSubmit = useCallback(async (e) => {
    e.preventDefault();
    setError(''); setSuccess('');

    const rl = loginLimiter.check();
    if (!rl.allowed) {
      setError(loginLimiter.retryMessage(rl.retryAfterMs));
      return;
    }

    setLoading(true);
    loginLimiter.increment();

    try {
      if (isSupabaseConfigured()) {
        // Real Supabase auth
        const res = await signInWithEmail(form.email, form.password);
        if (!res.success) {
          // Detect unverified email — Supabase returns this when email not confirmed
          const errMsg = (res.error || '').toLowerCase();
          if (errMsg.includes('email not confirmed') || errMsg.includes('not confirmed')) {
            setNeedsVerification(true);
            setLoading(false);
            return;
          }
          setError(res.error || 'Invalid credentials.');
          setLoading(false);
          return;
        }
        // AuthContext onAuthStateChange will pick up the session
        loginLimiter.reset();
        setSuccess('Welcome back!');
        setTimeout(() => redirectAfterLogin(), 600);
      } else {
        setError('Authentication service is not configured. Contact support.');
        setLoading(false);
      }
    } catch {
      setError('Invalid credentials. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [form, navigate, params]);

  /* ── 2FA verify (placeholder — wire to real 2FA when ready) ─ */
  const handle2FA = useCallback(async () => {
    if (twoFactorCode.length !== 6) return;
    setLoading(true); setError('');
    // 2FA via Supabase MFA: supabase.auth.mfa.challengeAndVerify(...)
    setError('2FA not yet enabled. Contact support.');
    setLoading(false);
  }, [twoFactorCode]);

  /* ── Google login ───────────────────────────────────────── */
  const handleGoogle = useCallback(async () => {
    setGLoading(true); setError('');
    try {
      if (isSupabaseConfigured()) {
        const res = await signInWithGoogle();
        if (!res.success) { setError(res.error || 'Google login failed.'); setGLoading(false); return; }
        // OAuth redirect will happen — onAuthStateChange handles session
      } else {
        setError('Authentication service is not configured. Contact support.');
        setGLoading(false);
      }
    } catch {
      setError('Google login failed.');
    } finally {
      setGLoading(false);
    }
  }, [navigate]);

  /* ── Magic link ─────────────────────────────────────────── */
  const sendMagicLink = useCallback(async () => {
    if (!form.email) { setError('Enter your email first.'); return; }
    setLoading(true); setError('');
    try {
      if (isSupabaseConfigured()) {
        const res = await signInWithMagicLink(form.email);
        if (!res.success) { setError(res.error || 'Failed to send magic link.'); setLoading(false); return; }
      } else {
        await new Promise(r => setTimeout(r, 1000));
      }
      setMagicLinkSent(true);
      setSuccess('Magic link sent! Check your inbox.');
    } catch {
      setError('Failed to send magic link.');
    } finally {
      setLoading(false);
    }
  }, [form.email]);

  const update = (field, value) => setForm(prev => ({ ...prev, [field]: value }));

  /* ═══════════════════════════════════════════════════════════
     RENDER
  ═══════════════════════════════════════════════════════════ */
  return (
    <div className="flex items-center justify-center min-h-screen px-4 py-12 bg-white dark:bg-gray-950">
      <div className="w-full max-w-md">

        {/* Logo */}
        <div className="flex justify-center mb-8">
          <Link to="/" className="flex items-center gap-2">
            <AurbanLogo size="md" />
          </Link>
        </div>

        {/* Title */}
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-bold font-display text-brand-charcoal-dark dark:text-white">
            Welcome back
          </h1>
          <p className="mt-2 text-sm text-gray-400">
            Log in to continue exploring properties, services & more
          </p>
        </div>

        {/* ── Email verification needed ───────────────────── */}
        {needsVerification ? (
          <div className="space-y-5">
            <div className="p-6 bg-white border border-gray-100 shadow-sm dark:bg-gray-900 dark:border-white/10 rounded-2xl">
              <OTPVerification
                email={form.email}
                onVerified={() => {
                  setNeedsVerification(false);
                  setSuccess('Email verified! Logging in...');
                  // After verification, Supabase auto-signs in via verifyOtp
                  setTimeout(() => redirectAfterLogin(), 800);
                }}
                title="Verify your email"
                subtitle={`Your email ${form.email} needs verification before you can log in.`}
              />
            </div>
            <button onClick={() => setNeedsVerification(false)}
              className="w-full text-sm text-gray-400 hover:text-gray-600">
              ← Back to login
            </button>
          </div>
        ) : twoFactorData ? (
          <div className="space-y-5">
            <div className="p-4 text-center bg-blue-50 dark:bg-blue-500/10 rounded-2xl">
              <Shield size={32} className="mx-auto mb-2 text-blue-500" />
              <p className="text-sm font-semibold text-blue-700 dark:text-blue-300">Two-Factor Authentication</p>
              <p className="mt-1 text-xs text-blue-600/70 dark:text-blue-400/70">Enter the 6-digit code from your authenticator app</p>
            </div>

            <input type="text" inputMode="numeric" maxLength={6} value={twoFactorCode}
              onChange={(e) => setTwoFactorCode(e.target.value.replace(/\D/g, ''))}
              placeholder="000000"
              className="w-full h-14 text-2xl font-mono tracking-[0.5em] text-center bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-2xl focus:outline-none focus:ring-2 focus:ring-brand-gold/30" />

            {error && <p className="flex items-center gap-2 text-sm text-red-500"><AlertCircle size={14} />{error}</p>}
            {success && <p className="flex items-center gap-2 text-sm text-emerald-600"><CheckCircle2 size={14} />{success}</p>}

            <button onClick={handle2FA} disabled={twoFactorCode.length !== 6 || loading}
              className="w-full h-12 font-semibold text-white transition-all rounded-full bg-brand-gold hover:bg-brand-gold-dark disabled:opacity-40 active:scale-[0.98] flex items-center justify-center gap-2">
              {loading ? <Loader size={18} className="animate-spin" /> : <><Shield size={16} /> Verify</>}
            </button>

            <button onClick={() => { setTwoFactorData(null); setTwoFactorCode(''); }}
              className="w-full text-sm text-gray-400 hover:text-gray-600">
              ← Back to login
            </button>
          </div>
        ) : magicLinkSent ? (
          /* ── Magic link sent ─────────────────────────────── */
          <div className="space-y-5 text-center">
            <div className="p-6 bg-emerald-50 dark:bg-emerald-500/10 rounded-2xl">
              <Send size={32} className="mx-auto mb-3 text-emerald-500" />
              <p className="text-sm font-semibold text-emerald-700 dark:text-emerald-300">Check your inbox</p>
              <p className="mt-1 text-xs text-emerald-600/70 dark:text-emerald-400/70">
                We sent a magic link to <strong>{form.email}</strong>
              </p>
            </div>
            <button onClick={() => setMagicLinkSent(false)}
              className="text-sm text-gray-400 hover:text-gray-600">
              ← Try a different method
            </button>
          </div>
        ) : (
          /* ── Main login form ─────────────────────────────── */
          <div className="space-y-5">

            {/* Google */}
            <button onClick={handleGoogle} disabled={gLoading}
              className="flex items-center justify-center w-full gap-3 py-3 text-sm font-medium text-gray-700 transition-all bg-white border border-gray-200 dark:bg-white/5 dark:border-white/10 dark:text-gray-200 rounded-full hover:bg-gray-50 dark:hover:bg-white/10 active:scale-[0.98]">
              {gLoading ? <Loader size={18} className="animate-spin" /> : <><GoogleIcon size={18} /> Continue with Google</>}
            </button>

            <div className="flex items-center gap-4">
              <div className="flex-1 h-px bg-gray-100 dark:bg-white/10" />
              <span className="text-xs text-gray-400">or</span>
              <div className="flex-1 h-px bg-gray-100 dark:bg-white/10" />
            </div>

            {/* Email / Phone toggle */}
            <div className="flex p-1 bg-gray-100 rounded-full dark:bg-white/5">
              <button onClick={() => setUsePhone(false)}
                className={`flex-1 py-2 text-xs font-semibold rounded-full transition-all ${!usePhone ? 'bg-white dark:bg-gray-800 text-brand-charcoal-dark dark:text-white shadow-sm' : 'text-gray-400'}`}>
                <Mail size={13} className="inline mr-1.5 -mt-0.5" />Email
              </button>
              <button onClick={() => setUsePhone(true)}
                className={`flex-1 py-2 text-xs font-semibold rounded-full transition-all ${usePhone ? 'bg-white dark:bg-gray-800 text-brand-charcoal-dark dark:text-white shadow-sm' : 'text-gray-400'}`}>
                <Smartphone size={13} className="inline mr-1.5 -mt-0.5" />Phone
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Email / Phone input */}
              <div>
                <label className="block mb-1.5 text-xs font-medium text-gray-500 dark:text-gray-400">
                  {usePhone ? 'Phone number' : 'Email address'}
                </label>
                <div className="relative">
                  {usePhone
                    ? <Smartphone size={16} className="absolute text-gray-300 -translate-y-1/2 left-4 top-1/2" />
                    : <Mail size={16} className="absolute text-gray-300 -translate-y-1/2 left-4 top-1/2" />
                  }
                  <input
                    type={usePhone ? 'tel' : 'email'}
                    value={form.email}
                    onChange={(e) => update('email', e.target.value)}
                    placeholder={usePhone ? '+234 xxx xxxx xxx' : 'you@example.com'}
                    required autoComplete={usePhone ? 'tel' : 'email'}
                    className="w-full h-12 pr-4 text-sm text-gray-800 border border-gray-200 pl-11 bg-gray-50 dark:bg-white/5 dark:border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-gold/30 dark:text-white placeholder:text-gray-300"
                  />
                </div>
              </div>

              {/* Password (only in password mode) */}
              {mode === 'password' && (
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-medium text-gray-500 dark:text-gray-400">Password</label>
                    <button type="button" onClick={() => setMode('magic')}
                      className="text-xs font-medium text-brand-gold hover:text-brand-gold-dark">
                      Use magic link instead
                    </button>
                  </div>
                  <div className="relative">
                    <Lock size={16} className="absolute text-gray-300 -translate-y-1/2 left-4 top-1/2" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={form.password}
                      onChange={(e) => update('password', e.target.value)}
                      placeholder="••••••••"
                      required autoComplete="current-password"
                      className="w-full h-12 pr-12 text-sm text-gray-800 border border-gray-200 pl-11 bg-gray-50 dark:bg-white/5 dark:border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-gold/30 dark:text-white placeholder:text-gray-300"
                    />
                    <button type="button" onClick={() => setShowPassword(!showPassword)}
                      className="absolute p-1 text-gray-400 -translate-y-1/2 right-3 top-1/2 hover:text-gray-600">
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>
              )}

              {error && <p className="flex items-center gap-2 text-sm text-red-500"><AlertCircle size={14} />{error}</p>}
              {success && <p className="flex items-center gap-2 text-sm text-emerald-600"><CheckCircle2 size={14} />{success}</p>}

              {mode === 'password' ? (
                <button type="submit" disabled={loading}
                  className="w-full h-12 font-semibold text-white transition-all rounded-full bg-brand-gold hover:bg-brand-gold-dark disabled:opacity-40 active:scale-[0.98] flex items-center justify-center gap-2">
                  {loading ? <Loader size={18} className="animate-spin" /> : <><LogIn size={16} /> Log in</>}
                </button>
              ) : (
                <button type="button" onClick={sendMagicLink} disabled={loading || !form.email}
                  className="w-full h-12 font-semibold text-white transition-all rounded-full bg-brand-gold hover:bg-brand-gold-dark disabled:opacity-40 active:scale-[0.98] flex items-center justify-center gap-2">
                  {loading ? <Loader size={18} className="animate-spin" /> : <><Send size={16} /> Send magic link</>}
                </button>
              )}
            </form>

            {/* Toggle mode */}
            {mode === 'magic' && (
              <button onClick={() => setMode('password')}
                className="w-full text-xs text-gray-400 hover:text-gray-600">
                Use password instead
              </button>
            )}
          </div>
        )}

        {/* Bottom links */}
        <div className="mt-8 space-y-3 text-center">
          <p className="text-sm text-gray-400">
            Don&apos;t have an account?{' '}
            <Link to="/signup" className="font-semibold text-brand-gold hover:text-brand-gold-dark">Sign up</Link>
          </p>
          <p className="text-xs text-gray-300 dark:text-gray-600">
            Are you a provider?{' '}
            <Link to="/provider/login" className="font-medium text-gray-500 dark:text-gray-400 hover:text-brand-gold">Provider login →</Link>
          </p>
        </div>
      </div>
    </div>
  );
}