import { useState, useCallback, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Mail, Lock, Eye, EyeOff, AlertCircle,
  CheckCircle2, Loader, Shield, LogIn,
  Key, Smartphone, HelpCircle, ArrowLeft,
  Info, Clock, Wifi, Copy, Check,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext.jsx';
import {
  MOCK_ADMIN_ACCOUNTS, ROLE_LABELS, ROLE_COLORS,
  AUTH_REQUIREMENTS, normalizeRole, getAuthRequirements,
} from '../../utils/rbac.js';
import useAdminSecurity from '../../hooks/useAdminSecurity.js';
import { isSupabaseConfigured } from '../../lib/supabase.js';
import { signInWithEmail, getProfile } from '../../services/supabase-auth.service.js';

/* ════════════════════════════════════════════════════════════
   ADMIN LOGIN — Multi-step authentication panel

   Completely separate from user/provider login flows.
   No links back to public marketplace.
   After login  -> /provider (admin dashboard)
   After logout -> ADMIN_ENTRY_PATH (non-obvious URL)

   Auth model:
   - Looks up email in admin_accounts table (mock for dev)
   - Generic emails like admin@aurban.com are never valid
   - Each admin has a named account: stephen@aurban.com -> super_admin
   - In production, server validates credentials + returns role

   Multi-step flow (based on AUTH_REQUIREMENTS):
   - Step 1: Email + Password         (all roles)
   - Step 2: TOTP 2FA code            (all roles)
   - Step 3: Secret Question          (super_admin only)
   - Step 4: Secret Key               (super_admin only)
════════════════════════════════════════════════════════════ */

const RATE_LIMIT = { maxAttempts: 5, windowMs: 15 * 60 * 1000 };

class AdminRateLimiter {
  constructor() {
    try {
      this.attempts = JSON.parse(sessionStorage.getItem('admin_login_attempts') || '[]');
    } catch { this.attempts = []; }
  }
  isBlocked() { this.cleanup(); return this.attempts.length >= RATE_LIMIT.maxAttempts; }
  record() {
    this.attempts.push(Date.now());
    try { sessionStorage.setItem('admin_login_attempts', JSON.stringify(this.attempts)); } catch { /* ignore */ }
  }
  cleanup() {
    const cutoff = Date.now() - RATE_LIMIT.windowMs;
    this.attempts = this.attempts.filter(t => t > cutoff);
    try { sessionStorage.setItem('admin_login_attempts', JSON.stringify(this.attempts)); } catch { /* ignore */ }
  }
  reset() {
    this.attempts = [];
    try { sessionStorage.removeItem('admin_login_attempts'); } catch { /* ignore */ }
  }
  getRemainingTime() {
    if (!this.attempts.length) return 0;
    return Math.max(0, Math.ceil((RATE_LIMIT.windowMs - (Date.now() - Math.min(...this.attempts))) / 60000));
  }
}

/* ── Step definitions ──────────────────────────────────────── */

/**
 * Build the ordered list of auth steps for a given role.
 * All roles get steps 1 (credentials) and 2 (TOTP).
 * super_admin additionally gets steps 3 (secret question) and 4 (secret key).
 */
function getStepsForRole(role) {
  const steps = [
    { key: 'credentials', label: 'Email & Password',  icon: Lock },
    { key: 'totp',        label: 'Two-Factor Auth',    icon: Smartphone },
  ];
  if (role === 'super_admin') {
    steps.push(
      { key: 'secret_question', label: 'Secret Question', icon: HelpCircle },
      { key: 'secret_key',      label: 'Secret Key',      icon: Key },
    );
  }
  return steps;
}

const MOCK_SECRET_QUESTION = 'What was the name of your first pet?';

/* ── Dev mock credentials (shown in dev helper boxes) ─────── */
const DEV_MOCK_CREDS = {
  password:     'admin123',
  totpCode:     '123456',
  secretAnswer: 'Buddy',
  secretKey:    'AURBAN2026SUPERSECRETKEY12345678',  // 32 chars
};

/* ── Dev Hint Box (shown under each step in dev mode) ─────── */

function DevHint({ label, value, onAutoFill }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(value).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div className="flex items-center gap-2 px-3 py-2 mt-2 rounded-lg bg-amber-500/5 border border-amber-500/15">
      <Info size={12} className="text-amber-500/70 shrink-0" />
      <p className="text-[10px] text-amber-500/70 flex-1">
        <span className="font-medium">Dev:</span>{' '}
        {label}{' '}
        <code className="px-1.5 py-0.5 text-[10px] font-mono font-bold text-amber-400 bg-amber-500/10 rounded">
          {value}
        </code>
      </p>
      <button
        type="button"
        onClick={handleCopy}
        className="p-1 text-amber-500/50 hover:text-amber-400 transition-colors"
        title="Copy"
      >
        {copied ? <Check size={10} /> : <Copy size={10} />}
      </button>
      {onAutoFill && (
        <button
          type="button"
          onClick={onAutoFill}
          className="px-2 py-0.5 text-[9px] font-semibold text-amber-400 bg-amber-500/10 hover:bg-amber-500/20 rounded transition-colors"
        >
          Auto-fill
        </button>
      )}
    </div>
  );
}

/* ── TOTP Input (6-digit auto-focus) ──────────────────────── */

function TOTPInput({ value, onChange, disabled }) {
  const inputRefs = useRef([]);
  const digits = value.padEnd(6, '').split('').slice(0, 6);

  const handleChange = (index, char) => {
    if (!/^\d?$/.test(char)) return;
    const next = [...digits];
    next[index] = char;
    const joined = next.join('');
    onChange(joined);
    // Auto-advance to next input
    if (char && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !digits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (pasted) {
      onChange(pasted);
      const focusIdx = Math.min(pasted.length, 5);
      inputRefs.current[focusIdx]?.focus();
    }
  };

  // Auto-focus first empty digit on mount
  useEffect(() => {
    const firstEmpty = digits.findIndex(d => !d);
    const idx = firstEmpty === -1 ? 0 : firstEmpty;
    inputRefs.current[idx]?.focus();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="flex justify-center gap-2" onPaste={handlePaste}>
      {digits.map((d, i) => (
        <input
          key={i}
          ref={el => (inputRefs.current[i] = el)}
          type="text"
          inputMode="numeric"
          maxLength={1}
          value={d}
          disabled={disabled}
          onChange={e => handleChange(i, e.target.value)}
          onKeyDown={e => handleKeyDown(i, e)}
          className="w-11 h-13 text-center text-lg font-mono font-bold text-white bg-gray-800 border rounded-xl border-white/10 focus:ring-2 focus:ring-brand-gold/30 focus:border-brand-gold outline-none disabled:opacity-50"
        />
      ))}
    </div>
  );
}

/* ── Secret Key Input (32-char, 8 segments of 4) ─────────── */

function SecretKeyInput({ value, onChange, disabled }) {
  const segmentRefs = useRef([]);
  // Split value into 8 segments of 4 chars
  const raw = value.replace(/-/g, '').toUpperCase().slice(0, 32);
  const segments = Array.from({ length: 8 }, (_, i) => raw.slice(i * 4, i * 4 + 4));

  const handleSegmentChange = (index, text) => {
    const cleaned = text.replace(/[^A-Za-z0-9]/g, '').toUpperCase().slice(0, 4);
    const next = [...segments];
    next[index] = cleaned;
    onChange(next.join(''));
    // Auto-advance when segment is full
    if (cleaned.length === 4 && index < 7) {
      segmentRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !segments[index] && index > 0) {
      segmentRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/[^A-Za-z0-9]/g, '').toUpperCase().slice(0, 32);
    if (pasted) {
      onChange(pasted);
    }
  };

  // Auto-focus first empty segment on mount
  useEffect(() => {
    const firstEmpty = segments.findIndex(s => s.length < 4);
    const idx = firstEmpty === -1 ? 0 : firstEmpty;
    segmentRefs.current[idx]?.focus();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="space-y-2" onPaste={handlePaste}>
      <div className="grid grid-cols-4 gap-1.5">
        {segments.map((seg, i) => (
          <div key={i} className="relative">
            <input
              ref={el => (segmentRefs.current[i] = el)}
              type="text"
              maxLength={4}
              value={seg}
              disabled={disabled}
              onChange={e => handleSegmentChange(i, e.target.value)}
              onKeyDown={e => handleKeyDown(i, e)}
              placeholder="____"
              className="w-full h-10 text-center text-xs font-mono font-bold tracking-wider text-white uppercase bg-gray-800 border rounded-lg border-white/10 focus:ring-2 focus:ring-brand-gold/30 focus:border-brand-gold outline-none placeholder:text-gray-700 disabled:opacity-50"
            />
            {i < 7 && (
              <span className="absolute right-[-0.45rem] top-1/2 -translate-y-1/2 text-gray-600 text-xs font-mono pointer-events-none z-10">-</span>
            )}
          </div>
        ))}
      </div>
      <p className="text-[10px] text-gray-500 text-center font-mono tracking-wide">
        {raw.length}/32 characters
      </p>
    </div>
  );
}

/* ── Progress bar ─────────────────────────────────────────── */

function StepProgress({ currentStep, totalSteps, steps }) {
  return (
    <div className="mb-6">
      {/* Step counter */}
      <div className="flex items-center justify-between mb-2.5">
        <span className="text-[10px] text-gray-500 uppercase tracking-wider font-semibold">
          Step {currentStep + 1} of {totalSteps}
        </span>
        <span className="text-[10px] text-gray-400 font-medium">
          {steps[currentStep]?.label}
        </span>
      </div>
      {/* Progress dots */}
      <div className="flex gap-1.5">
        {steps.map((_, i) => (
          <div
            key={i}
            className={`h-1 flex-1 rounded-full transition-colors duration-300 ${
              i < currentStep
                ? 'bg-brand-gold'
                : i === currentStep
                  ? 'bg-brand-gold/60'
                  : 'bg-gray-800'
            }`}
          />
        ))}
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════
   MAIN COMPONENT
════════════════════════════════════════════════════════════ */

export default function AdminLogin() {
  const navigate = useNavigate();
  const { login } = useAuth();

  // Anti-screenshot, anti-screenrecord, anti-console on login page
  useAdminSecurity({ enabled: true, adminName: 'Login', adminEmail: 'pre-auth' });

  // Block search engine indexing on admin login page
  useEffect(() => {
    let meta = document.querySelector('meta[name="robots"]');
    if (!meta) {
      meta = document.createElement('meta');
      meta.setAttribute('name', 'robots');
      document.head.appendChild(meta);
    }
    meta.setAttribute('content', 'noindex, nofollow');
    document.title = 'Login — Internal';
    return () => { if (meta.parentNode) meta.parentNode.removeChild(meta); };
  }, []);

  /* ── State ───────────────────────────────────────────────── */
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading]           = useState(false);
  const [error, setError]               = useState('');
  const [success, setSuccess]           = useState('');
  const [rateLimiter]                   = useState(() => new AdminRateLimiter());

  // Form fields
  const [form, setForm] = useState({
    email: '',
    password: '',
    totpCode: '',
    secretAnswer: '',
    secretKey: '',
  });

  // Multi-step state
  const [currentStep, setCurrentStep]       = useState(0);
  const [matchedAccount, setMatchedAccount] = useState(null);
  const [authReqs, setAuthReqs]             = useState(null);
  const [steps, setSteps]                   = useState([]);

  const resolvedRole = matchedAccount ? normalizeRole(matchedAccount.role) : null;

  /* ── Handlers ────────────────────────────────────────────── */

  const handleChange = (field) => (e) => {
    setForm(prev => ({ ...prev, [field]: e.target.value }));
    if (error) setError('');
  };

  const handleTotpChange = (val) => {
    setForm(prev => ({ ...prev, totpCode: val }));
    if (error) setError('');
  };

  const handleSecretKeyChange = (val) => {
    setForm(prev => ({ ...prev, secretKey: val }));
    if (error) setError('');
  };

  const goBack = () => {
    if (currentStep === 0) return;
    setError('');
    if (currentStep === 1) {
      // Going back to credentials step resets the matched account
      setCurrentStep(0);
      setMatchedAccount(null);
      setAuthReqs(null);
      setSteps([]);
      setForm(prev => ({ ...prev, totpCode: '', secretAnswer: '', secretKey: '' }));
    } else {
      setCurrentStep(prev => prev - 1);
    }
  };

  /* ── Step 1: Validate credentials ────────────────────────── */
  const handleCredentials = async () => {
    if (!form.email || !form.password) {
      setError('Email and password are required.');
      return;
    }

    if (rateLimiter.isBlocked()) {
      setError(`Too many attempts. Try again in ${rateLimiter.getRemainingTime()} minutes.`);
      return;
    }

    setLoading(true);
    rateLimiter.record();

    try {
      const emailLower = form.email.trim().toLowerCase();

      if (isSupabaseConfigured()) {
        // Real Supabase auth — verify credentials then check admin role
        const res = await signInWithEmail(emailLower, form.password);
        if (!res.success) { setError(res.error || 'Invalid credentials.'); setLoading(false); return; }
        // Fetch profile to verify admin role
        const profileRes = await getProfile(res.data.user.id);
        const profileRole = profileRes.success ? normalizeRole(profileRes.data.role) : null;
        const isAdmin = profileRole && [
          'super_admin','operations_admin','moderator',
          'verification_admin','support_admin','finance_admin','compliance_admin','admin',
        ].includes(profileRole);
        if (!isAdmin) { setError('This account is not registered as an admin.'); setLoading(false); return; }
        const account = { id: res.data.user.id, name: profileRes.data.name, email: emailLower, role: profileRole };
        const role = normalizeRole(account.role);
        const reqs = getAuthRequirements(role);
        const roleSteps = getStepsForRole(role);
        setMatchedAccount(account);
        setAuthReqs(reqs);
        setSteps(roleSteps);
        setCurrentStep(1);
      } else {
        // Mock fallback
        await new Promise(r => setTimeout(r, 800));
        const account = MOCK_ADMIN_ACCOUNTS.find(a => a.email === emailLower);
        if (!account) { setError('Invalid credentials. This email is not registered as an admin account.'); return; }
        const role = normalizeRole(account.role);
        const reqs = getAuthRequirements(role);
        const roleSteps = getStepsForRole(role);
        setMatchedAccount(account);
        setAuthReqs(reqs);
        setSteps(roleSteps);
        setCurrentStep(1);
      }
    } catch {
      setError('Authentication failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  /* ── Step 2: Validate TOTP ──────────────────────────────── */
  const handleTotp = async () => {
    const code = form.totpCode.replace(/\s/g, '');
    if (code.length !== 6 || !/^\d{6}$/.test(code)) {
      setError('Enter a valid 6-digit verification code.');
      return;
    }

    setLoading(true);
    try {
      await new Promise(r => setTimeout(r, 600));
      // Mock: any 6-digit code is accepted in dev
      // Check if there are more steps
      if (currentStep + 1 < steps.length) {
        setCurrentStep(prev => prev + 1);
      } else {
        completeLogin();
        return;
      }
    } catch {
      setError('Verification failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  /* ── Step 3: Validate secret question ───────────────────── */
  const handleSecretQuestion = async () => {
    if (!form.secretAnswer.trim()) {
      setError('Please answer the security question.');
      return;
    }

    setLoading(true);
    try {
      await new Promise(r => setTimeout(r, 500));
      // Mock: any answer accepted in dev
      if (currentStep + 1 < steps.length) {
        setCurrentStep(prev => prev + 1);
      } else {
        completeLogin();
        return;
      }
    } catch {
      setError('Verification failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  /* ── Step 4: Validate secret key ────────────────────────── */
  const handleSecretKey = async () => {
    const raw = form.secretKey.replace(/-/g, '');
    if (raw.length !== 32) {
      setError(`Secret key must be 32 characters. Currently ${raw.length}/32.`);
      return;
    }
    if (!/^[A-Za-z0-9]{32}$/.test(raw)) {
      setError('Secret key must contain only letters and numbers.');
      return;
    }

    setLoading(true);
    try {
      await new Promise(r => setTimeout(r, 500));
      // Mock: any 32-char alphanumeric string accepted in dev
      completeLogin();
    } catch {
      setError('Verification failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  /* ── Complete login ─────────────────────────────────────── */
  const completeLogin = () => {
    if (!matchedAccount) return;

    const role = normalizeRole(matchedAccount.role);
    const reqs = getAuthRequirements(role);
    const timeoutMinutes = Math.round(reqs.sessionTimeoutMs / 60000);

    login({
      id: matchedAccount.id,
      name: matchedAccount.name,
      email: matchedAccount.email,
      phone: matchedAccount.phone,
      role: matchedAccount.role,
      verified: true,
      avatar: null,
      tier: { type: 'business', level: 3, label: ROLE_LABELS[matchedAccount.role] || 'Admin' },
      countryCode: 'NG',
    });

    rateLimiter.reset();
    setLoading(false);
    setSuccess(`Welcome, ${matchedAccount.name}. Session expires after ${timeoutMinutes} minutes of inactivity.`);
    setTimeout(() => navigate('/provider', { replace: true }), 1400);
  };

  /* ── Form submit dispatcher ─────────────────────────────── */
  const handleSubmit = useCallback((e) => {
    e.preventDefault();
    setError('');

    const stepKey = steps[currentStep]?.key;
    switch (stepKey) {
      case 'totp':
        handleTotp();
        break;
      case 'secret_question':
        handleSecretQuestion();
        break;
      case 'secret_key':
        handleSecretKey();
        break;
      default:
        // Step 0 or unknown: credentials
        handleCredentials();
        break;
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form, currentStep, steps, matchedAccount, rateLimiter]);

  /* ── Derived ────────────────────────────────────────────── */
  const timeoutMinutes = authReqs ? Math.round(authReqs.sessionTimeoutMs / 60000) : null;

  /* ── Render ─────────────────────────────────────────────── */
  return (
    <div className="flex items-center justify-center min-h-screen px-4 bg-gray-950">
      {/* Background pattern */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(202,138,4,0.08),transparent_50%)]" />

      <div className="relative z-10 w-full max-w-sm">
        {/* Header */}
        <div className="mb-8 text-center">
          <div className="flex items-center justify-center w-14 h-14 mx-auto mb-4 rounded-2xl bg-brand-gold/10 border border-brand-gold/20">
            <Shield size={28} className="text-brand-gold" />
          </div>
          <h1 className="text-2xl font-bold text-white font-display">
            Admin Portal
          </h1>
          <p className="mt-1.5 text-sm text-gray-400">
            Aurban Platform Administration
          </p>
        </div>

        {/* Login card */}
        <div className="p-6 bg-gray-900 border rounded-2xl border-white/10">

          {/* Role badge + auth info (shown after email validation) */}
          {matchedAccount && resolvedRole && (
            <div className="mb-4 space-y-2">
              {/* Role badge */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-semibold rounded-lg ${ROLE_COLORS[resolvedRole] || 'bg-gray-500/10 text-gray-400'}`}>
                    {ROLE_LABELS[resolvedRole] || resolvedRole}
                  </span>
                  {/* IP restriction badge */}
                  {authReqs?.ipRestriction && (
                    <span className="inline-flex items-center gap-1 px-2 py-1 text-[10px] font-medium rounded-md bg-amber-500/10 text-amber-400 border border-amber-500/20">
                      <Wifi size={10} />
                      IP-restricted
                    </span>
                  )}
                </div>
              </div>
              {/* Auth method label */}
              <p className="text-[10px] text-gray-500 leading-relaxed">
                {authReqs?.label}
              </p>
            </div>
          )}

          {/* Step progress indicator (shown after step 0) */}
          {steps.length > 0 && (
            <StepProgress
              currentStep={currentStep}
              totalSteps={steps.length}
              steps={steps}
            />
          )}

          {/* Success message */}
          {success && (
            <div className="flex items-start gap-2 px-4 py-3 mb-4 text-sm text-emerald-400 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
              <CheckCircle2 size={16} className="mt-0.5 shrink-0" />
              <div>
                <p>{success}</p>
              </div>
            </div>
          )}

          {/* Error message */}
          {error && (
            <div className="flex items-center gap-2 px-4 py-3 mb-4 text-sm text-red-400 rounded-xl bg-red-500/10 border border-red-500/20">
              <AlertCircle size={16} className="shrink-0" />
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">

            {/* ═══ STEP 0: Email + Password ═══ */}
            {currentStep === 0 && (
              <>
                {/* Email */}
                <div>
                  <label className="block mb-1.5 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                    Admin Email
                  </label>
                  <div className="relative">
                    <Mail size={16} className="absolute text-gray-500 -translate-y-1/2 left-3.5 top-1/2" />
                    <input
                      type="email"
                      value={form.email}
                      onChange={handleChange('email')}
                      className="w-full h-12 pl-10 pr-4 text-sm text-white placeholder-gray-500 bg-gray-800 border rounded-xl border-white/10 focus:ring-2 focus:ring-brand-gold/30 focus:border-brand-gold outline-none"
                      placeholder="name@aurban.com"
                      autoComplete="email"
                      required
                    />
                  </div>
                </div>

                {/* Password */}
                <div>
                  <label className="block mb-1.5 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                    Password
                  </label>
                  <div className="relative">
                    <Lock size={16} className="absolute text-gray-500 -translate-y-1/2 left-3.5 top-1/2" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={form.password}
                      onChange={handleChange('password')}
                      className="w-full h-12 pl-10 pr-12 text-sm text-white placeholder-gray-500 bg-gray-800 border rounded-xl border-white/10 focus:ring-2 focus:ring-brand-gold/30 focus:border-brand-gold outline-none"
                      placeholder="Enter password"
                      autoComplete="current-password"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute -translate-y-1/2 right-3 top-1/2 text-gray-500 hover:text-gray-300"
                      tabIndex={-1}
                    >
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                {/* Dev hint: password */}
                <DevHint
                  label="Password:"
                  value={DEV_MOCK_CREDS.password}
                  onAutoFill={() => setForm(prev => ({ ...prev, password: DEV_MOCK_CREDS.password }))}
                />
              </>
            )}

            {/* ═══ STEP 1: TOTP 2FA ═══ */}
            {currentStep === 1 && steps[currentStep]?.key === 'totp' && (
              <div className="space-y-3">
                <div className="text-center">
                  <div className="flex items-center justify-center w-12 h-12 mx-auto mb-3 rounded-xl bg-brand-gold/10 border border-brand-gold/20">
                    <Smartphone size={22} className="text-brand-gold" />
                  </div>
                  <p className="text-sm text-gray-300 font-medium mb-1">
                    Two-Factor Authentication
                  </p>
                  <p className="text-xs text-gray-500">
                    Enter the 6-digit code from your authenticator app
                  </p>
                </div>
                <TOTPInput
                  value={form.totpCode}
                  onChange={handleTotpChange}
                  disabled={loading}
                />
                <p className="text-[10px] text-gray-600 text-center">
                  Code refreshes every 30 seconds
                </p>

                {/* Dev hint: TOTP code */}
                <DevHint
                  label="Use any 6-digit code, e.g."
                  value={DEV_MOCK_CREDS.totpCode}
                  onAutoFill={() => {
                    setForm(prev => ({ ...prev, totpCode: DEV_MOCK_CREDS.totpCode }));
                  }}
                />
              </div>
            )}

            {/* ═══ STEP 2 (super_admin only): Secret Question ═══ */}
            {steps[currentStep]?.key === 'secret_question' && (
              <div className="space-y-3">
                <div className="text-center">
                  <div className="flex items-center justify-center w-12 h-12 mx-auto mb-3 rounded-xl bg-brand-gold/10 border border-brand-gold/20">
                    <HelpCircle size={22} className="text-brand-gold" />
                  </div>
                  <p className="text-sm text-gray-300 font-medium mb-1">
                    Security Question
                  </p>
                  <p className="text-xs text-gray-500">
                    Answer the question you set during account setup
                  </p>
                </div>
                <div className="p-3 bg-gray-800/50 border border-white/5 rounded-xl">
                  <p className="text-sm text-gray-300 font-medium text-center italic">
                    &ldquo;{MOCK_SECRET_QUESTION}&rdquo;
                  </p>
                </div>
                <div className="relative">
                  <HelpCircle size={16} className="absolute text-gray-500 -translate-y-1/2 left-3.5 top-1/2" />
                  <input
                    type="text"
                    value={form.secretAnswer}
                    onChange={handleChange('secretAnswer')}
                    className="w-full h-12 pl-10 pr-4 text-sm text-white placeholder-gray-500 bg-gray-800 border rounded-xl border-white/10 focus:ring-2 focus:ring-brand-gold/30 focus:border-brand-gold outline-none"
                    placeholder="Your answer"
                    autoComplete="off"
                    required
                  />
                </div>

                {/* Dev hint: secret answer */}
                <DevHint
                  label="Answer:"
                  value={DEV_MOCK_CREDS.secretAnswer}
                  onAutoFill={() => setForm(prev => ({ ...prev, secretAnswer: DEV_MOCK_CREDS.secretAnswer }))}
                />
              </div>
            )}

            {/* ═══ STEP 3 (super_admin only): Secret Key ═══ */}
            {steps[currentStep]?.key === 'secret_key' && (
              <div className="space-y-3">
                <div className="text-center">
                  <div className="flex items-center justify-center w-12 h-12 mx-auto mb-3 rounded-xl bg-brand-gold/10 border border-brand-gold/20">
                    <Key size={22} className="text-brand-gold" />
                  </div>
                  <p className="text-sm text-gray-300 font-medium mb-1">
                    Secret Key Verification
                  </p>
                  <p className="text-xs text-gray-500">
                    Enter your 32-character secret key
                  </p>
                </div>
                <SecretKeyInput
                  value={form.secretKey}
                  onChange={handleSecretKeyChange}
                  disabled={loading}
                />

                {/* Dev hint: secret key */}
                <DevHint
                  label="Key:"
                  value={DEV_MOCK_CREDS.secretKey}
                  onAutoFill={() => setForm(prev => ({ ...prev, secretKey: DEV_MOCK_CREDS.secretKey }))}
                />
              </div>
            )}

            {/* Navigation + Submit */}
            <div className="flex items-center gap-3">
              {/* Back button (steps > 0) */}
              {currentStep > 0 && !success && (
                <button
                  type="button"
                  onClick={goBack}
                  disabled={loading}
                  className="flex items-center justify-center w-12 h-12 text-gray-400 bg-gray-800 border rounded-xl border-white/10 hover:text-white hover:bg-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
                >
                  <ArrowLeft size={18} />
                </button>
              )}

              {/* Submit button */}
              <button
                type="submit"
                disabled={loading || !!success}
                className="flex items-center justify-center flex-1 h-12 gap-2 text-sm font-semibold transition-colors rounded-xl bg-brand-gold hover:bg-brand-gold-dark text-brand-charcoal-dark disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <Loader size={18} className="animate-spin" />
                ) : success ? (
                  <>
                    <CheckCircle2 size={16} />
                    Authenticated
                  </>
                ) : currentStep === 0 ? (
                  <>
                    <LogIn size={16} />
                    Continue
                  </>
                ) : currentStep + 1 >= steps.length ? (
                  <>
                    <Shield size={16} />
                    Sign In
                  </>
                ) : (
                  <>
                    <LogIn size={16} />
                    Verify &amp; Continue
                  </>
                )}
              </button>
            </div>
          </form>

          {/* Session timeout info (shown after account is matched) */}
          {matchedAccount && timeoutMinutes && !success && (
            <div className="flex items-center gap-2 mt-4 px-3 py-2 rounded-lg bg-gray-800/50 border border-white/5">
              <Clock size={12} className="text-gray-500 shrink-0" />
              <p className="text-[10px] text-gray-500">
                Session expires after <span className="text-gray-400 font-semibold">{timeoutMinutes} min</span> of inactivity
              </p>
            </div>
          )}

          {/* Security notice */}
          <p className="mt-4 text-[10px] text-gray-600 text-center leading-relaxed">
            This portal is for authorized administrators only.
            All login attempts are logged and monitored.
          </p>
        </div>

        {/* Admin accounts (dev only -- remove in production) */}
        <div className="mt-6 p-4 bg-gray-900/50 border border-white/5 rounded-xl">
          <p className="mb-2.5 text-[10px] text-gray-500 uppercase tracking-wider font-semibold">Dev: Registered Admin Accounts</p>
          <div className="space-y-1.5">
            {MOCK_ADMIN_ACCOUNTS.map(a => {
              const nRole = normalizeRole(a.role);
              const colorClass = ROLE_COLORS[nRole]?.split(' ')[0] || 'bg-gray-500';
              const reqs = AUTH_REQUIREMENTS[nRole];
              return (
                <button
                  key={a.id}
                  type="button"
                  onClick={() => setForm(prev => ({ ...prev, email: a.email, password: DEV_MOCK_CREDS.password }))}
                  className="flex items-center gap-2 w-full text-left hover:bg-white/5 px-1.5 py-1 -mx-1.5 rounded-lg transition-colors group"
                >
                  <span className={`inline-block w-1.5 h-1.5 rounded-full shrink-0 ${colorClass}`} />
                  <span className="text-[10px] text-gray-400 truncate group-hover:text-gray-300">{a.email}</span>
                  <span className="text-[10px] text-gray-600 ml-auto shrink-0">
                    {ROLE_LABELS[a.role]}
                    {reqs && (
                      <span className="text-gray-700 ml-1">({reqs.layers}-layer)</span>
                    )}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Mock credentials summary */}
          <div className="mt-3 pt-3 border-t border-white/5 space-y-1">
            <p className="text-[10px] text-gray-600 uppercase tracking-wider font-semibold mb-1.5">Mock Credentials (all accounts)</p>
            <div className="flex items-center gap-2">
              <span className="text-[10px] text-gray-500 w-16 shrink-0">Password:</span>
              <code className="text-[10px] font-mono text-amber-400/80">{DEV_MOCK_CREDS.password}</code>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] text-gray-500 w-16 shrink-0">TOTP:</span>
              <code className="text-[10px] font-mono text-amber-400/80">{DEV_MOCK_CREDS.totpCode}</code>
              <span className="text-[10px] text-gray-600">(any 6-digit code works)</span>
            </div>
            <p className="text-[10px] text-gray-600 uppercase tracking-wider font-semibold mt-2 mb-1.5">Super Admin Only (stephen@aurban.com)</p>
            <div className="flex items-center gap-2">
              <span className="text-[10px] text-gray-500 w-16 shrink-0">Q&amp;A:</span>
              <code className="text-[10px] font-mono text-amber-400/80">{DEV_MOCK_CREDS.secretAnswer}</code>
              <span className="text-[10px] text-gray-600">(first pet&rsquo;s name)</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-[10px] text-gray-500 w-16 shrink-0 mt-0.5">Secret Key:</span>
              <code className="text-[10px] font-mono text-amber-400/80 break-all leading-relaxed">{DEV_MOCK_CREDS.secretKey}</code>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
