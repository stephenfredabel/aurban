import { useState, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Mail, Smartphone, Loader, CheckCircle2, AlertCircle,
  ArrowRight, User as UserIcon, Lock,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext.jsx';
import AurbanLogo  from '../../components/AurbanLogo.jsx';
import { sanitize } from '../../utils/security.js';
import { isSupabaseConfigured } from '../../lib/supabase.js';
import { signUpWithEmail, signInWithGoogle } from '../../services/supabase-auth.service.js';
import OTPVerification from '../../components/auth/OTPVerification.jsx';

/* ════════════════════════════════════════════════════════════
   SIGNUP — End-user / Visitor registration

   Flow:
     Step 1: Full name + email + password
     Step 2: OTP verification (email or phone)
     Done → marketplace (/)
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

const RATE_LIMIT = { maxAttempts: 3, windowMs: 10 * 60 * 1000 };

export default function SignUp() {
  const navigate = useNavigate();
  const { login } = useAuth();

  // Step 1 = registration form, Step 2 = OTP verification
  const [step, setStep]         = useState(1);
  const [form, setForm]         = useState({ fullName: '', email: '', password: '' });
  const [loading, setLoading]   = useState(false);
  const [gLoading, setGLoading] = useState(false);
  const [error, setError]       = useState('');
  const [success, setSuccess]   = useState('');
  const [honeypot, setHoneypot] = useState('');
  const [attempts, setAttempts] = useState([]);

  const isBlocked = () => {
    const now = Date.now();
    const recent = attempts.filter(t => t > now - RATE_LIMIT.windowMs);
    return recent.length >= RATE_LIMIT.maxAttempts;
  };

  const update = (field, value) => setForm(prev => ({ ...prev, [field]: sanitize(value) }));

  /* ── Validate ───────────────────────────────────────────── */
  const validate = () => {
    if (honeypot) return 'Something went wrong.';
    if (!form.fullName.trim() || form.fullName.trim().length < 2) return 'Please enter your full name.';
    if (!form.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) return 'Please enter a valid email address.';
    if (!form.password || form.password.length < 8) return 'Password must be at least 8 characters.';
    return null;
  };

  /* ── Submit (Step 1) ──────────────────────────────────────── */
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
          role: 'user',
        });
        if (!res.success) { setError(res.error || 'Registration failed.'); setLoading(false); return; }
        // Move to OTP verification step
        setStep(2);
      } else {
        // Mock mode — go to step 2 for demo
        await new Promise(r => setTimeout(r, 800));
        setStep(2);
      }
    } catch {
      setError('Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [form, honeypot, attempts]);

  /* ── OTP verified (Step 2) ────────────────────────────────── */
  const handleOTPVerified = useCallback(({ method }) => {
    if (!isSupabaseConfigured()) {
      // Mock mode — log in directly
      login({
        id: 'u_' + Date.now(),
        name: form.fullName.trim(),
        email: form.email.trim(),
        role: 'user',
        verified: false,
        emailVerified: method === 'email',
        whatsappVerified: method === 'phone',
      });
    }
    // Supabase mode: verifyOtp auto-signs the user in → onAuthStateChange handles it
    setSuccess('Account verified! Welcome to Aurban.');
    setTimeout(() => navigate('/', { replace: true }), 800);
  }, [form, login, navigate]);

  /* ── Google signup ──────────────────────────────────────── */
  const handleGoogle = useCallback(async () => {
    setGLoading(true); setError('');
    try {
      if (isSupabaseConfigured()) {
        const res = await signInWithGoogle();
        if (!res.success) { setError(res.error || 'Google signup failed.'); setGLoading(false); return; }
        // OAuth redirect — Google = pre-verified email
      } else {
        await new Promise(r => setTimeout(r, 1500));
        login({
          id: 'g_' + Date.now(),
          name: 'Google User',
          email: 'user@gmail.com',
          role: 'user',
          verified: true,
          emailVerified: true,
          avatar: null,
        });
        navigate('/', { replace: true });
      }
    } catch {
      setError('Google signup failed. Please try again.');
    } finally {
      setGLoading(false);
    }
  }, [login, navigate]);

  /* ── Step 2: OTP Verification ─────────────────────────────── */
  if (step === 2) {
    return (
      <div className="flex items-center justify-center min-h-screen px-4 py-12 bg-white dark:bg-gray-950">
        <div className="w-full max-w-md">
          <div className="flex justify-center mb-8">
            <Link to="/" className="flex items-center gap-2">
              <AurbanLogo size="md" />
            </Link>
          </div>

          <div className="p-6 bg-white border border-gray-100 shadow-sm dark:bg-gray-900 dark:border-white/10 rounded-2xl sm:p-8">
            <OTPVerification
              email={form.email.trim()}
              onVerified={handleOTPVerified}
              title="Verify your account"
              subtitle={`We sent a code to ${form.email.trim()}`}
            />
          </div>

          {success && (
            <p className="flex items-center justify-center gap-2 mt-4 text-sm text-emerald-600">
              <CheckCircle2 size={14} />{success}
            </p>
          )}
        </div>
      </div>
    );
  }

  /* ── Step 1: Registration Form ────────────────────────────── */
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
            Create your account
          </h1>
          <p className="mt-2 text-sm text-gray-400">
            Join Aurban to find properties, services & products
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
            <span className="text-xs text-gray-400">or sign up with email</span>
            <div className="flex-1 h-px bg-gray-100 dark:bg-white/10" />
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">

            {/* Honeypot (hidden) */}
            <input type="text" name="website" value={honeypot} onChange={(e) => setHoneypot(e.target.value)}
              className="absolute opacity-0 pointer-events-none" tabIndex={-1} autoComplete="off" aria-hidden />

            {/* Full name */}
            <div>
              <label className="block mb-1.5 text-xs font-medium text-gray-500 dark:text-gray-400">Full name</label>
              <div className="relative">
                <UserIcon size={16} className="absolute text-gray-300 -translate-y-1/2 left-4 top-1/2" />
                <input type="text" value={form.fullName} onChange={(e) => update('fullName', e.target.value)}
                  placeholder="Your full name" required maxLength={100} autoComplete="name"
                  className="w-full h-12 pr-4 text-sm text-gray-800 border border-gray-200 pl-11 bg-gray-50 dark:bg-white/5 dark:border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-gold/30 dark:text-white placeholder:text-gray-300" />
              </div>
            </div>

            {/* Email */}
            <div>
              <label className="block mb-1.5 text-xs font-medium text-gray-500 dark:text-gray-400">Email address</label>
              <div className="relative">
                <Mail size={16} className="absolute text-gray-300 -translate-y-1/2 left-4 top-1/2" />
                <input type="email" value={form.email} onChange={(e) => update('email', e.target.value)}
                  placeholder="you@example.com" required maxLength={200} autoComplete="email"
                  className="w-full h-12 pr-4 text-sm text-gray-800 border border-gray-200 pl-11 bg-gray-50 dark:bg-white/5 dark:border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-gold/30 dark:text-white placeholder:text-gray-300" />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block mb-1.5 text-xs font-medium text-gray-500 dark:text-gray-400">Password</label>
              <div className="relative">
                <Lock size={16} className="absolute text-gray-300 -translate-y-1/2 left-4 top-1/2" />
                <input type="password" value={form.password} onChange={(e) => update('password', e.target.value)}
                  placeholder="Min. 8 characters" required minLength={8} autoComplete="new-password"
                  className="w-full h-12 pr-4 text-sm text-gray-800 border border-gray-200 pl-11 bg-gray-50 dark:bg-white/5 dark:border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-gold/30 dark:text-white placeholder:text-gray-300" />
              </div>
            </div>

            {error && <p className="flex items-center gap-2 text-sm text-red-500"><AlertCircle size={14} />{error}</p>}
            {success && <p className="flex items-center gap-2 text-sm text-emerald-600"><CheckCircle2 size={14} />{success}</p>}

            <button type="submit" disabled={loading}
              className="w-full h-12 font-semibold text-white transition-all rounded-full bg-brand-gold hover:bg-brand-gold-dark disabled:opacity-40 active:scale-[0.98] flex items-center justify-center gap-2">
              {loading ? <Loader size={18} className="animate-spin" /> : <>Create account <ArrowRight size={16} /></>}
            </button>
          </form>

          {/* Terms */}
          <p className="text-[11px] text-gray-400 text-center leading-relaxed">
            By signing up, you agree to Aurban&apos;s{' '}
            <a href="#" className="underline hover:text-gray-600">Terms of Service</a> and{' '}
            <a href="#" className="underline hover:text-gray-600">Privacy Policy</a>.
          </p>
        </div>

        {/* Bottom links */}
        <div className="mt-8 space-y-3 text-center">
          <p className="text-sm text-gray-400">
            Already have an account?{' '}
            <Link to="/login" className="font-semibold text-brand-gold hover:text-brand-gold-dark">Log in</Link>
          </p>
          <p className="text-xs text-gray-300 dark:text-gray-600">
            Want to list properties or offer services?{' '}
            <Link to="/provider/signup" className="font-medium text-gray-500 dark:text-gray-400 hover:text-brand-gold">Become a provider →</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
