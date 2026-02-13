import { useState, useCallback }  from 'react';
import { useTranslation }         from 'react-i18next';
import { Camera, User }           from 'lucide-react';
import { useOnboarding }          from '../../../hooks/useOnboarding.js';
import StepWrapper                from '../StepWrapper.jsx';
import Button                     from '../../ui/Button.jsx';
import Input                      from '../../ui/Input.jsx';
import PhoneInput                 from '../../ui/PhoneInput.jsx';
import { useImageCompress }       from '../../../hooks/useImageCompress.js';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PASS_RE  = /^(?=.*[0-9]).{8,}$/;

export default function Step03_AccountBasics() {
  const { t }                          = useTranslation();
  const { updateStep, nextStep, data } = useOnboarding();
  const { compress }                   = useImageCompress();

  const saved = data.basics || {};

  const [form, setForm] = useState({
    fullName:    saved.fullName    || '',
    displayName: saved.displayName || '',
    email:       saved.email       || '',
    password:    saved.password    || '',
    confirm:     saved.confirm     || '',
    phone:       saved.phone       || '',
    phonePrefix: saved.phonePrefix || '+234',
    phoneCountry:saved.phoneCountry|| 'NG',
  });
  const [errors,  setErrors]  = useState({});
  const [avatar,  setAvatar]  = useState(saved.avatar  || null);
  const [otpSent, setOtpSent] = useState(false);
  const [otp,     setOtp]     = useState('');
  const [phoneVerified, setPhoneVerified] = useState(saved.phoneVerified || false);
  const [loading, setLoading] = useState(false);

  const set = (field) => (val) =>
    setForm((prev) => ({ ...prev, [field]: val }));

  const setField = (field) => (e) =>
    setForm((prev) => ({ ...prev, [field]: e.target.value }));

  // Validate
  const validate = () => {
    const e = {};
    if (!form.fullName.trim() || form.fullName.trim().length < 2)
      e.fullName = t('errors.nameTooShort');
    if (!EMAIL_RE.test(form.email))
      e.email = t('errors.emailInvalid');
    if (!PASS_RE.test(form.password))
      e.password = 'Minimum 8 characters including at least one number';
    if (form.password !== form.confirm)
      e.confirm = t('errors.passwordMatch');
    if (!form.phone)
      e.phone = t('errors.phoneInvalid');
    return e;
  };

  // Avatar upload
  const handleAvatarChange = useCallback(async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const compressed = await compress(file);
    const reader     = new FileReader();
    reader.onload    = (ev) => setAvatar(ev.target.result);
    reader.readAsDataURL(compressed);
  }, [compress]);

  // Mock OTP send
  const handleSendOtp = () => {
    if (!form.phone) return;
    setOtpSent(true);
  };

  const handleVerifyOtp = () => {
    // In production: hit /api/auth/verify-otp
    if (otp.length === 6) {
      setPhoneVerified(true);
    }
  };

  const handleContinue = () => {
    const e = validate();
    if (Object.keys(e).length) { setErrors(e); return; }
    updateStep('basics', { ...form, avatar, phoneVerified });
    nextStep();
  };

  return (
    <StepWrapper
      title="Create your account"
      subtitle="This is how clients and Aurban will identify you."
    >
      {/* ── Avatar ───────────────────────────────────────── */}
      <div className="flex flex-col items-center gap-3 py-2">
        <div className="relative">
          <div className="flex items-center justify-center w-24 h-24 overflow-hidden border-2 border-gray-300 border-dashed rounded-full bg-brand-gray-soft">
            {avatar ? (
              <img src={avatar} alt="Profile" className="object-cover w-full h-full" />
            ) : (
              <User size={28} className="text-gray-300" />
            )}
          </div>
          <label
            htmlFor="avatar-upload"
            className="absolute bottom-0 right-0 flex items-center justify-center w-8 h-8 transition-colors rounded-full shadow-md cursor-pointer bg-brand-gold hover:bg-brand-gold-dark"
            aria-label="Upload profile photo"
          >
            <Camera size={14} className="text-white" />
          </label>
          <input
            id="avatar-upload"
            type="file"
            accept="image/jpeg,image/png"
            onChange={handleAvatarChange}
            className="sr-only"
          />
        </div>
        <p className="text-xs text-gray-400 font-body">
          {avatar ? 'Tap photo to change' : 'Add a profile photo — providers with photos get 3× more leads'}
        </p>
      </div>

      {/* ── Name fields ──────────────────────────────────── */}
      <Input
        label="Full Name"
        placeholder="As it appears on your government ID"
        value={form.fullName}
        onChange={setField('fullName')}
        error={errors.fullName}
        hint="Required for identity verification"
        required
        autoComplete="name"
      />
      <Input
        label="Display Name"
        placeholder="How clients will see you"
        value={form.displayName}
        onChange={setField('displayName')}
        hint="Can be different from your legal name"
        recommended
        autoComplete="nickname"
      />

      {/* ── Email ────────────────────────────────────────── */}
      <Input
        label="Email Address"
        type="email"
        placeholder="you@example.com"
        value={form.email}
        onChange={setField('email')}
        error={errors.email}
        required
        autoComplete="email"
      />

      {/* ── Password ─────────────────────────────────────── */}
      <Input
        label="Password"
        type="password"
        placeholder="Minimum 8 characters, at least one number"
        value={form.password}
        onChange={setField('password')}
        error={errors.password}
        required
        autoComplete="new-password"
      />
      <Input
        label="Confirm Password"
        type="password"
        placeholder="Re-enter your password"
        value={form.confirm}
        onChange={setField('confirm')}
        error={errors.confirm}
        required
        autoComplete="new-password"
      />

      {/* ── Phone + OTP ──────────────────────────────────── */}
      <div>
        <PhoneInput
          label="Phone Number"
          value={form.phone}
          onChange={({ phone, prefix, countryCode }) => {
            setForm((prev) => ({ ...prev, phone, phonePrefix: prefix, phoneCountry: countryCode }));
          }}
          error={errors.phone}
          required
        />

        {/* OTP flow */}
        {form.phone && !phoneVerified && (
          <div className="mt-3">
            {!otpSent ? (
              <button
                type="button"
                onClick={handleSendOtp}
                className="w-full py-2.5 text-sm font-semibold text-brand-gold border border-brand-gold rounded-xl hover:bg-brand-gold/5 transition-colors"
              >
                Send verification code
              </button>
            ) : (
              <div className="space-y-2">
                <p className="text-xs text-gray-500">
                  Code sent to {form.phonePrefix} {form.phone}
                </p>
                <div className="flex gap-2">
                  <input
                    type="tel"
                    maxLength={6}
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                    placeholder="6-digit code"
                    className="flex-1 text-lg font-bold tracking-widest text-center input-field"
                    aria-label="OTP code"
                  />
                  <button
                    type="button"
                    onClick={handleVerifyOtp}
                    className="px-4 btn-primary"
                  >
                    Verify
                  </button>
                </div>
                <button
                  type="button"
                  onClick={handleSendOtp}
                  className="text-xs text-gray-400 underline hover:text-brand-charcoal"
                >
                  Resend code
                </button>
              </div>
            )}
          </div>
        )}

        {/* Verified state */}
        {phoneVerified && (
          <div className="flex items-center gap-2 mt-2 text-xs font-medium text-emerald-600">
            <span className="flex items-center justify-center w-4 h-4 rounded-full bg-emerald-100">✓</span>
            Phone verified
          </div>
        )}
      </div>

      {/* ── Social sign-in divider ───────────────────────── */}
      <div className="divider">
        <span className="px-2 text-xs text-gray-400 font-body whitespace-nowrap">
          or continue with
        </span>
      </div>

      <button
        type="button"
        className="flex items-center justify-center w-full gap-3 py-3 text-sm font-semibold transition-colors border-2 border-gray-200 rounded-2xl hover:border-gray-300 text-brand-charcoal font-body"
        onClick={() => {/* Google OAuth — wire to provider */}}
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
          <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
          <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
          <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
          <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
        </svg>
        Continue with Google
      </button>

      {/* ── CTA ──────────────────────────────────────────── */}
      <Button
        fullWidth
        size="lg"
        loading={loading}
        onClick={handleContinue}
      >
        Create Account
      </Button>

      <p className="text-xs leading-relaxed text-center text-gray-400 font-body">
        By continuing you agree to Aurban's{' '}
        <a href="/terms"   className="underline text-brand-charcoal">Terms</a>{' '}
        and{' '}
        <a href="/privacy" className="underline text-brand-charcoal">Privacy Policy</a>.
      </p>
    </StepWrapper>
  );
}