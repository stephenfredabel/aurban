import { useState, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Mail, Lock, Eye, EyeOff, AlertCircle, CheckCircle2,
  Loader, Building2, User as UserIcon, Phone,
  ArrowRight, Users, Briefcase,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext.jsx';
import AurbanLogo from '../../components/AurbanLogo.jsx';
import { isSupabaseConfigured } from '../../lib/supabase.js';
import { signUpWithEmail, signInWithGoogle } from '../../services/supabase-auth.service.js';
import OTPVerification from '../../components/auth/OTPVerification.jsx';

/* ════════════════════════════════════════════════════════════
   PROVIDER SIGNUP — Provider registration

   Flow:
     Step 1: Full Name, Email, Password, WhatsApp, Account Type
     Step 2: OTP verification (email or phone)
     Done → provider dashboard (restricted until admin approval)
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

const RATE_LIMIT = { maxAttempts: 5, windowMs: 10 * 60 * 1000 };

export default function ProviderSignUp() {
  const navigate = useNavigate();
  useAuth();

  const [step, setStep] = useState(1);
  const [form, setForm] = useState({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '',
    whatsapp: '',
    accountType: 'individual',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading]     = useState(false);
  const [gLoading, setGLoading]   = useState(false);
  const [error, setError]         = useState('');
  const [success, setSuccess]     = useState('');
  const [honeypot, setHoneypot]   = useState('');
  const [attempts, setAttempts]   = useState([]);

  const isBlocked = () => {
    const now = Date.now();
    const recent = attempts.filter(t => t > now - RATE_LIMIT.windowMs);
    return recent.length >= RATE_LIMIT.maxAttempts;
  };

  const update = (field, value) => setForm(prev => ({ ...prev, [field]: value }));

  /* ── Validate ───────────────────────────────────────────── */
  const validate = () => {
    if (honeypot) return 'Please try again.';
    if (!form.fullName.trim() || form.fullName.trim().length < 2)
      return 'Please enter your full name.';
    if (!form.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email))
      return 'Please enter a valid email address.';
    if (!form.password || form.password.length < 8)
      return 'Password must be at least 8 characters.';
    if (form.password !== form.confirmPassword)
      return 'Passwords do not match.';
    if (!form.whatsapp.trim() || !/^\+?\d{7,15}$/.test(form.whatsapp.replace(/[\s-]/g, '')))
      return 'Please enter a valid WhatsApp number (e.g. +234 xxx xxxx xxx).';
    return null;
  };

  /* ── Submit (Step 1) ─────────────────────────────────────── */
  const handleSubmit = useCallback(async (e) => {
    e.preventDefault();
    setError(''); setSuccess('');

    if (isBlocked()) {
      setError('Too many attempts. Please try again later.');
      return;
    }

    const err = validate();
    if (err) { setError(err); return; }

    setLoading(true);
    setAttempts(prev => [...prev, Date.now()]);

    try {
      if (isSupabaseConfigured()) {
        const res = await signUpWithEmail({
          email: form.email.trim(),
          password: form.password,
          name: form.fullName.trim(),
          whatsapp: form.whatsapp.trim(),
          phone: form.whatsapp.trim(),
          role: 'provider',
          accountType: form.accountType,
        });
        if (!res.success) {
          setError(res.error || 'Registration failed.');
          setLoading(false);
          return;
        }
      } else {
        setError('Authentication service is not configured. Contact support.');
        setLoading(false);
        return;
      }
      // Move to OTP verification step
      setStep(2);
    } catch {
      setError('Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [form, honeypot, attempts]);

  /* ── OTP verified (Step 2) ────────────────────────────────── */
  const handleOTPVerified = useCallback(() => {
    // Supabase verifyOtp auto-signs the user in → onAuthStateChange handles the session
    setSuccess('Account verified! Redirecting to your dashboard...');
    setTimeout(() => navigate('/provider', { replace: true }), 1000);
  }, [navigate]);

  /* ── Google signup ──────────────────────────────────────── */
  const handleGoogle = useCallback(async () => {
    setGLoading(true); setError('');
    try {
      if (isSupabaseConfigured()) {
        // Pass role + redirect so signInWithGoogle sets the correct sessionStorage values
        // (previously these were set here then overwritten by signInWithGoogle defaults)
        const res = await signInWithGoogle({ redirectTo: '/provider', role: 'provider' });
        if (!res.success) { setError(res.error || 'Google signup failed.'); setGLoading(false); return; }
      } else {
        setError('Authentication service is not configured. Contact support.');
        setGLoading(false);
        return;
      }
    } catch {
      setError('Google signup failed. Please try again.');
    } finally {
      setGLoading(false);
    }
  }, [navigate]);

  /* ── Step 2: OTP Verification ─────────────────────────────── */
  if (step === 2) {
    return (
      <div className="flex items-center justify-center min-h-screen px-4 py-12 bg-gray-50 dark:bg-gray-950">
        <div className="w-full max-w-md">
          <div className="flex flex-col items-center mb-8">
            <Link to="/" className="flex items-center gap-2 mb-3">
              <AurbanLogo size="md" />
            </Link>
            <div className="flex items-center gap-2 px-3 py-1.5 bg-brand-charcoal-dark text-white text-xs font-semibold rounded-full">
              <Building2 size={13} />
              Provider Registration
            </div>
          </div>

          <div className="p-6 bg-white shadow-sm dark:bg-gray-900 rounded-2xl sm:p-8">
            <OTPVerification
              email={form.email.trim()}
              phone={form.whatsapp.trim()}
              onVerified={handleOTPVerified}
              title="Verify your identity"
              subtitle={`We sent a code to ${form.email.trim()}`}
            />
          </div>

          {success && (
            <div className="flex items-center justify-center gap-2 mt-4 text-sm text-emerald-600">
              <CheckCircle2 size={14} />{success}
            </div>
          )}
        </div>
      </div>
    );
  }

  /* ── Step 1: Registration Form ────────────────────────────── */
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
            Provider Registration
          </div>
        </div>

        {/* Card */}
        <div className="p-6 bg-white shadow-sm dark:bg-gray-900 rounded-2xl sm:p-8">

          <div className="mb-6 text-center">
            <h1 className="text-xl font-bold font-display text-brand-charcoal-dark dark:text-white">
              Create Provider Account
            </h1>
            <p className="mt-1.5 text-sm text-gray-400">
              Register to list properties, offer services & sell products
            </p>
          </div>

          <div className="space-y-5">

            {/* Google */}
            <button onClick={handleGoogle} disabled={gLoading}
              className="flex items-center justify-center w-full gap-3 py-3 text-sm font-medium text-gray-700 transition-all bg-white border border-gray-200 dark:bg-white/5 dark:border-white/10 dark:text-gray-200 rounded-full hover:bg-gray-50 dark:hover:bg-white/10 active:scale-[0.98]">
              {gLoading ? <Loader size={18} className="animate-spin" /> : <><GoogleIcon size={18} /> Continue with Google</>}
            </button>

            <div className="flex items-center gap-4">
              <div className="flex-1 h-px bg-gray-100 dark:bg-white/10" />
              <span className="text-xs text-gray-400">or register with email</span>
              <div className="flex-1 h-px bg-gray-100 dark:bg-white/10" />
            </div>

            {/* Account Type Toggle */}
            <div>
              <label htmlFor="account-type-toggle" className="block mb-1.5 text-xs font-medium text-gray-500 dark:text-gray-400">Account type</label>
              <div id="account-type-toggle" className="flex p-1 bg-gray-100 rounded-full dark:bg-white/5">
                <button type="button" onClick={() => update('accountType', 'individual')}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-semibold rounded-full transition-all ${form.accountType === 'individual' ? 'bg-white dark:bg-gray-800 text-brand-charcoal-dark dark:text-white shadow-sm' : 'text-gray-400'}`}>
                  <UserIcon size={13} /> Individual
                </button>
                <button type="button" onClick={() => update('accountType', 'company')}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-semibold rounded-full transition-all ${form.accountType === 'company' ? 'bg-white dark:bg-gray-800 text-brand-charcoal-dark dark:text-white shadow-sm' : 'text-gray-400'}`}>
                  <Briefcase size={13} /> Company
                </button>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">

              {/* Honeypot */}
              <div style={{ position: 'absolute', left: '-9999px', opacity: 0, height: 0, overflow: 'hidden' }} aria-hidden="true">
                <input type="text" name="aurban_hp_field" value={honeypot} onChange={(e) => setHoneypot(e.target.value)} tabIndex={-1} autoComplete="new-password" />
              </div>

              {/* Full name */}
              <div>
                <label htmlFor="provider-fullname" className="block mb-1.5 text-xs font-medium text-gray-500 dark:text-gray-400">
                  {form.accountType === 'company' ? 'Contact person full name' : 'Full name'}
                </label>
                <div className="relative">
                  <UserIcon size={16} className="absolute text-gray-300 -translate-y-1/2 left-4 top-1/2" />
                  <input id="provider-fullname" type="text" value={form.fullName} onChange={(e) => update('fullName', e.target.value)}
                    placeholder="Your full name" required maxLength={100} autoComplete="name"
                    className="w-full h-12 pr-4 text-sm text-gray-800 border border-gray-200 pl-11 bg-gray-50 dark:bg-white/5 dark:border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-gold/30 dark:text-white placeholder:text-gray-300" />
                </div>
              </div>

              {/* Email */}
              <div>
                <label htmlFor="provider-email" className="block mb-1.5 text-xs font-medium text-gray-500 dark:text-gray-400">Email address</label>
                <div className="relative">
                  <Mail size={16} className="absolute text-gray-300 -translate-y-1/2 left-4 top-1/2" />
                  <input id="provider-email" type="email" value={form.email} onChange={(e) => update('email', e.target.value)}
                    placeholder={form.accountType === 'company' ? 'company@example.com' : 'provider@example.com'}
                    required maxLength={200} autoComplete="email"
                    className="w-full h-12 pr-4 text-sm text-gray-800 border border-gray-200 pl-11 bg-gray-50 dark:bg-white/5 dark:border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-gold/30 dark:text-white placeholder:text-gray-300" />
                </div>
              </div>

              {/* WhatsApp Number */}
              <div>
                <label htmlFor="provider-whatsapp" className="block mb-1.5 text-xs font-medium text-gray-500 dark:text-gray-400">WhatsApp number</label>
                <div className="relative">
                  <Phone size={16} className="absolute text-gray-300 -translate-y-1/2 left-4 top-1/2" />
                  <input id="provider-whatsapp" type="tel" value={form.whatsapp} onChange={(e) => update('whatsapp', e.target.value)}
                    placeholder="+234 xxx xxxx xxx" required maxLength={20} autoComplete="tel"
                    className="w-full h-12 pr-4 text-sm text-gray-800 border border-gray-200 pl-11 bg-gray-50 dark:bg-white/5 dark:border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-gold/30 dark:text-white placeholder:text-gray-300" />
                </div>
                <p className="mt-1 text-[10px] text-gray-400">We&apos;ll verify this number via OTP</p>
              </div>

              {/* Password */}
              <div>
                <label htmlFor="provider-password" className="block mb-1.5 text-xs font-medium text-gray-500 dark:text-gray-400">Password</label>
                <div className="relative">
                  <Lock size={16} className="absolute text-gray-300 -translate-y-1/2 left-4 top-1/2" />
                  <input id="provider-password" type={showPassword ? 'text' : 'password'} value={form.password} onChange={(e) => update('password', e.target.value)}
                    placeholder="Min. 8 characters" required minLength={8} autoComplete="new-password"
                    className="w-full h-12 pr-12 text-sm text-gray-800 border border-gray-200 pl-11 bg-gray-50 dark:bg-white/5 dark:border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-gold/30 dark:text-white placeholder:text-gray-300" />
                  <button type="button" onClick={() => setShowPassword(!showPassword)}
                    className="absolute p-1 text-gray-400 -translate-y-1/2 right-3 top-1/2 hover:text-gray-600">
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              {/* Confirm Password */}
              <div>
                <label htmlFor="provider-confirm-password" className="block mb-1.5 text-xs font-medium text-gray-500 dark:text-gray-400">Confirm password</label>
                <div className="relative">
                  <Lock size={16} className="absolute text-gray-300 -translate-y-1/2 left-4 top-1/2" />
                  <input id="provider-confirm-password" type={showPassword ? 'text' : 'password'} value={form.confirmPassword} onChange={(e) => update('confirmPassword', e.target.value)}
                    placeholder="Re-enter password" required minLength={8} autoComplete="new-password"
                    className="w-full h-12 pr-4 text-sm text-gray-800 border border-gray-200 pl-11 bg-gray-50 dark:bg-white/5 dark:border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-gold/30 dark:text-white placeholder:text-gray-300" />
                </div>
              </div>

              {error && <p className="flex items-center gap-2 text-sm text-red-500"><AlertCircle size={14} />{error}</p>}
              {success && (
                <div className="flex items-start gap-2 p-3 text-sm rounded-xl bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-300">
                  <CheckCircle2 size={16} className="mt-0.5 shrink-0" />
                  <p className="font-medium">{success}</p>
                </div>
              )}

              <button type="submit" disabled={loading || !!success}
                className="w-full h-12 font-semibold text-white transition-all rounded-full bg-brand-charcoal-dark hover:bg-brand-charcoal disabled:opacity-40 active:scale-[0.98] flex items-center justify-center gap-2">
                {loading ? <Loader size={18} className="animate-spin" /> : <>Create Provider Account <ArrowRight size={16} /></>}
              </button>
            </form>

            {/* Terms */}
            <p className="text-[11px] text-gray-400 text-center leading-relaxed">
              By registering, you agree to Aurban&apos;s{' '}
              <Link to="/terms" className="underline hover:text-gray-600">Terms of Service</Link> and{' '}
              <Link to="/privacy" className="underline hover:text-gray-600">Privacy Policy</Link>.
            </p>
          </div>
        </div>

        {/* Account type info */}
        <div className="p-4 mt-4 bg-white shadow-sm dark:bg-gray-900 rounded-2xl">
          <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-2">
            {form.accountType === 'company' ? 'Company accounts' : 'Individual accounts'}
          </p>
          {form.accountType === 'company' ? (
            <ul className="space-y-1.5 text-xs text-gray-500 dark:text-gray-400">
              <li className="flex items-start gap-2"><Briefcase size={12} className="mt-0.5 shrink-0 text-brand-gold" /> Register your business with CAC documents</li>
              <li className="flex items-start gap-2"><Users size={12} className="mt-0.5 shrink-0 text-brand-gold" /> Manage a team with multiple staff accounts</li>
              <li className="flex items-start gap-2"><Building2 size={12} className="mt-0.5 shrink-0 text-brand-gold" /> Higher transaction limits after verification</li>
            </ul>
          ) : (
            <ul className="space-y-1.5 text-xs text-gray-500 dark:text-gray-400">
              <li className="flex items-start gap-2"><UserIcon size={12} className="mt-0.5 shrink-0 text-brand-gold" /> Verify with valid government ID</li>
              <li className="flex items-start gap-2"><CheckCircle2 size={12} className="mt-0.5 shrink-0 text-brand-gold" /> Upload professional certificates & licenses</li>
              <li className="flex items-start gap-2"><ArrowRight size={12} className="mt-0.5 shrink-0 text-brand-gold" /> Upgrade to company account anytime</li>
            </ul>
          )}
        </div>

        {/* Bottom links */}
        <div className="mt-6 space-y-3 text-center">
          <p className="text-sm text-gray-400">
            Already have an account?{' '}
            <Link to="/provider/login" className="font-semibold text-brand-gold hover:text-brand-gold-dark">
              Provider Login
            </Link>
          </p>
          <p className="text-xs text-gray-300 dark:text-gray-600">
            Looking to browse properties?{' '}
            <Link to="/signup" className="font-medium text-gray-500 dark:text-gray-400 hover:text-brand-gold">
              User signup
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
