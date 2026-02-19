import { useState, useCallback, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import {
  Mail, Lock, Eye, EyeOff, AlertCircle,
  CheckCircle2, Loader, Smartphone,
  LogIn, Building2,
} from 'lucide-react';

import { useAuth } from "@/context/AuthContext";
import AurbanLogo from "@/components/AurbanLogo";
import { isSupabaseConfigured } from "@/lib/supabase";
import { safeRedirect, loginLimiter } from "@/utils/security";

import {
  signInWithEmail,
  signInWithGoogle,
  signInWithApple,
} from "@/services/supabase-auth.service";
import OTPVerification from "@/components/auth/OTPVerification";


/* ════════════════════════════════════════════════════════════
   PROVIDER LOGIN — Provider-specific authentication

   Reached from: Footer "Provider Login" link
   After login → /provider (provider dashboard)

   Separate from user login (which is in the Header)
════════════════════════════════════════════════════════════ */

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

function AppleIcon({ size = 20 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
      <path d="M17.05 20.28c-.98.95-2.05.88-3.08.4-1.09-.5-2.08-.48-3.24 0-1.44.62-2.2.44-3.06-.4C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/>
    </svg>
  );
}


export default function ProviderLogin() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const { user } = useAuth();

  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading]         = useState(false);
  const [gLoading, setGLoading]       = useState(false);
  const [aLoading, setALoading]       = useState(false);
  const [error, setError]             = useState('');
  const [success, setSuccess]         = useState('');
  const [form, setForm]               = useState({ email: params.get('email') || '', password: '' });
  const [usePhone, setUsePhone]       = useState(false);
  const [needsVerification, setNeedsVerification] = useState(!!params.get('verify'));
  const [loginSuccess, setLoginSuccess] = useState(false);

  /* ── Redirect to PROVIDER DASHBOARD ─────────────────────── */
  const redirectAfterLogin = () => {
    // safeRedirect ensures only same-origin paths — no open redirect
    const redirect = safeRedirect(params.get('redirect') || '/provider');
    navigate(redirect, { replace: true });
  };

  /* ── Wait for AuthContext to load profile, then redirect ─── */
  // AuthContext loads the profile (and upgrades role if needed) on SIGNED_IN.
  // Only redirect once user state is actually set — avoids the 600 ms blind timeout.
  useEffect(() => {
    if (loginSuccess && user) {
      redirectAfterLogin();
    }
  }, [user, loginSuccess]); // eslint-disable-line react-hooks/exhaustive-deps

  /* ── Form submit ──────────────────────────────────────────── */
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
        // Signal AuthContext to upgrade role 'user' → 'provider' if the account
        // was originally registered as a regular user (mirrors the OAuth flow pattern).
        sessionStorage.setItem('aurban_oauth_role', 'provider');

        const res = await signInWithEmail(form.email, form.password);
        if (!res.success) {
          sessionStorage.removeItem('aurban_oauth_role');
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
        // AuthContext's onAuthStateChange loads the profile (and upgrades role if needed).
        // useEffect above redirects as soon as user state is set — no blind timeout.
        loginLimiter.reset();
        setSuccess('Welcome back!');
        setLoginSuccess(true);
      } else {
        setError('Authentication service is not configured. Contact support.');
        setLoading(false);
      }
    } catch {
      sessionStorage.removeItem('aurban_oauth_role');
      setError('Invalid credentials. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [form]);

  /* ── Google login ───────────────────────────────────────── */
  const handleGoogle = useCallback(async () => {
    setGLoading(true); setError('');
    try {
      if (isSupabaseConfigured()) {
        const res = await signInWithGoogle({ redirectTo: '/provider', role: 'provider' });
        if (!res.success) { setError(res.error || 'Google login failed.'); setGLoading(false); return; }
      } else {
        setError('Authentication service is not configured. Contact support.');
        setGLoading(false);
      }
    } catch {
      setError('Google login failed.');
    } finally {
      setGLoading(false);
    }
  }, []);

  /* ── Apple login ────────────────────────────────────────── */
  const handleApple = useCallback(async () => {
    setALoading(true); setError('');
    try {
      if (isSupabaseConfigured()) {
        const res = await signInWithApple({ redirectTo: '/provider', role: 'provider' });
        if (!res.success) { setError(res.error || 'Apple login failed.'); setALoading(false); return; }
      } else {
        setError('Authentication service is not configured. Contact support.');
        setALoading(false);
      }
    } catch {
      setError('Apple login failed.');
    } finally {
      setALoading(false);
    }
  }, []);

  const update = (field, value) => setForm(prev => ({ ...prev, [field]: value }));

  return (
    <div className="flex items-center justify-center min-h-screen px-4 py-12 bg-gray-50 dark:bg-gray-950">
      <div className="w-full max-w-md">

        {/* Logo + Provider badge */}
        <div className="flex flex-col items-center mb-8">
          <Link to="/" className="flex items-center gap-2 mb-3">
            <AurbanLogo size="md" />
          </Link>
          <div className="flex items-center gap-2 px-3 py-1.5 bg-brand-charcoal-dark text-white text-xs font-semibold rounded-full">
            <Building2 size={13} />
            Provider Portal
          </div>
        </div>

        {/* Card */}
        <div className="p-6 bg-white shadow-sm dark:bg-gray-900 rounded-2xl sm:p-8">

          {needsVerification ? (
            <div className="space-y-5">
              <OTPVerification
                email={form.email}
                onVerified={() => {
                  setNeedsVerification(false);
                  setSuccess('Email verified! Logging in...');
                  setTimeout(() => redirectAfterLogin(), 800);
                }}
                title="Verify your email"
                subtitle={`Your email ${form.email} needs verification before you can access the Provider Portal.`}
              />
              <button onClick={() => setNeedsVerification(false)}
                className="w-full text-sm text-gray-400 hover:text-gray-600">
                ← Back to login
              </button>
            </div>
          ) : (
            <>
              <div className="mb-6 text-center">
                <h1 className="text-xl font-bold font-display text-brand-charcoal-dark dark:text-white">
                  Provider Login
                </h1>
                <p className="mt-1.5 text-sm text-gray-400">
                  Access your listings, analytics & provider dashboard
                </p>
              </div>

              <div className="space-y-5">

                {/* OAuth buttons */}
                <div className="space-y-3">
                  <button onClick={handleGoogle} disabled={gLoading}
                    className="flex items-center justify-center w-full gap-3 py-3 text-sm font-medium text-gray-700 transition-all bg-white border border-gray-200 dark:bg-white/5 dark:border-white/10 dark:text-gray-200 rounded-full hover:bg-gray-50 dark:hover:bg-white/10 active:scale-[0.98]">
                    {gLoading ? <Loader size={18} className="animate-spin" /> : <><GoogleIcon size={18} /> With Google</>}
                  </button>

                  <button onClick={handleApple} disabled={aLoading}
                    className="flex items-center justify-center w-full gap-3 py-3 text-sm font-medium text-gray-700 transition-all bg-white border border-gray-200 dark:bg-white/5 dark:border-white/10 dark:text-gray-200 rounded-full hover:bg-gray-50 dark:hover:bg-white/10 active:scale-[0.98]">
                    {aLoading ? <Loader size={18} className="animate-spin" /> : <><AppleIcon size={18} /> With Apple</>}
                  </button>
                </div>

                <div className="flex items-center gap-4">
                  <div className="flex-1 h-px bg-gray-100 dark:bg-white/10" />
                  <span className="text-xs text-gray-400">Or Sign In</span>
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
                  <div>
                    <label htmlFor="provider-login-email" className="block mb-1.5 text-xs font-medium text-gray-500 dark:text-gray-400">
                      {usePhone ? 'Phone number' : 'Email address'}
                    </label>
                    <div className="relative">
                      {usePhone
                        ? <Smartphone size={16} className="absolute text-gray-300 -translate-y-1/2 left-4 top-1/2" />
                        : <Mail size={16} className="absolute text-gray-300 -translate-y-1/2 left-4 top-1/2" />}
                      <input
                        id="provider-login-email"
                        type={usePhone ? 'tel' : 'email'}
                        value={form.email}
                        onChange={(e) => update('email', e.target.value)}
                        placeholder={usePhone ? '+234 xxx xxxx xxx' : 'provider@example.com'}
                        required autoComplete={usePhone ? 'tel' : 'email'}
                        className="w-full h-12 pr-4 text-sm text-gray-800 border border-gray-200 pl-11 bg-gray-50 dark:bg-white/5 dark:border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-gold/30 dark:text-white placeholder:text-gray-300"
                      />
                    </div>
                  </div>

                  <div>
                    <label htmlFor="provider-login-password" className="block mb-1.5 text-xs font-medium text-gray-500 dark:text-gray-400">Password</label>
                    <div className="relative">
                      <Lock size={16} className="absolute text-gray-300 -translate-y-1/2 left-4 top-1/2" />
                      <input
                        id="provider-login-password"
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

                  {error && <p className="flex items-center gap-2 text-sm text-red-500"><AlertCircle size={14} />{error}</p>}
                  {success && <p className="flex items-center gap-2 text-sm text-emerald-600"><CheckCircle2 size={14} />{success}</p>}

                  <button type="submit" disabled={loading}
                    className="w-full h-12 font-semibold text-white transition-all rounded-full bg-brand-charcoal-dark hover:bg-brand-charcoal disabled:opacity-40 active:scale-[0.98] flex items-center justify-center gap-2">
                    {loading ? <Loader size={18} className="animate-spin" /> : <><LogIn size={16} /> Log in to Provider Portal</>}
                  </button>
                </form>
              </div>
            </>
          )}
        </div>

        {/* Bottom links */}
        <div className="mt-6 space-y-3 text-center">
          <p className="text-sm text-gray-400">
            New provider?{' '}
            <Link to="/provider/signup" className="font-semibold text-brand-gold hover:text-brand-gold-dark">
              Register as a provider →
            </Link>
          </p>
          <p className="text-xs text-gray-300 dark:text-gray-600">
            Looking to browse properties?{' '}
            <Link to="/login" className="font-medium text-gray-500 dark:text-gray-400 hover:text-brand-gold">
              User login
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}