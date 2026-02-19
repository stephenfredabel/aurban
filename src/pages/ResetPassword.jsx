import { useState, useCallback } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Lock, Eye, EyeOff, CheckCircle2, AlertCircle, ArrowRight } from 'lucide-react';
import AurbanLogo from '../components/AurbanLogo.jsx';

export default function ResetPassword() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const token = params.get('token');

  const [showPassword, setShowPassword]       = useState(false);
  const [showConfirm,  setShowConfirm]        = useState(false);
  const [loading,      setLoading]            = useState(false);
  const [success,      setSuccess]            = useState(false);
  const [error,        setError]              = useState('');
  const [tokenError]         = useState(!token);

  const [form, setForm] = useState({
    password:        '',
    confirmPassword: '',
  });

  const handleSubmit = useCallback(async (e) => {
    e.preventDefault();
    setError('');

    if (!form.password.trim() || !form.confirmPassword.trim()) {
      setError('Please fill in both fields');
      return;
    }

    if (form.password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }

    if (form.password !== form.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);
    await new Promise(r => setTimeout(r, 1500));

    // Mock: 90% success
    if (Math.random() > 0.1) {
      setSuccess(true);
      setTimeout(() => navigate('/login?reset=success'), 2000);
    } else {
      setError('Reset link expired. Please request a new one.');
    }

    setLoading(false);
  }, [form, navigate]);

  if (tokenError) {
    return (
      <div className="flex items-center justify-center min-h-screen p-4 bg-gray-50 dark:bg-gray-900/30">
        <div className="w-full max-w-md">
          <div className="mb-8 text-center">
            <Link to="/" className="inline-block">
              <AurbanLogo size="lg" showName />
            </Link>
          </div>

          <div className="p-8 text-center bg-white border border-gray-100 shadow-lg dark:bg-brand-charcoal-dark rounded-3xl dark:border-white/10">
            <div className="flex items-center justify-center w-16 h-16 mx-auto mb-4 bg-red-100 dark:bg-red-500/20 rounded-3xl">
              <AlertCircle size={32} className="text-red-500" />
            </div>
            <h2 className="mb-2 text-2xl font-extrabold font-display text-brand-charcoal-dark dark:text-white">
              Invalid Reset Link
            </h2>
            <p className="mb-6 text-sm leading-relaxed text-gray-400">
              This password reset link is invalid or has expired. Please request a new one.
            </p>
            <Link to="/forgot-password"
              className="inline-flex items-center gap-2 px-6 py-3 text-sm font-bold text-white transition-colors bg-brand-gold hover:bg-brand-gold-dark rounded-2xl">
              Request New Link <ArrowRight size={14} />
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-screen p-4 bg-gray-50 dark:bg-gray-900/30">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <Link to="/" className="inline-block">
            <AurbanLogo size="lg" showName />
          </Link>
        </div>

        <div className="p-8 bg-white border border-gray-100 shadow-lg dark:bg-brand-charcoal-dark rounded-3xl dark:border-white/10">
          
          {!success ? (
            <>
              <h1 className="mb-2 text-2xl font-extrabold font-display text-brand-charcoal-dark dark:text-white">
                Reset Your Password
              </h1>
              <p className="mb-6 text-sm leading-relaxed text-gray-400">
                Enter a new password for your Aurban account.
              </p>

              {error && (
                <div className="flex items-start gap-2.5 p-3.5 bg-red-50 dark:bg-red-500/10 rounded-2xl border border-red-100 dark:border-red-500/20 mb-5">
                  <AlertCircle size={16} className="text-red-500 mt-0.5 shrink-0" />
                  <p className="text-sm leading-relaxed text-red-600 dark:text-red-400">{error}</p>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                {/* New password */}
                <div>
                  <label className="label-sm mb-1.5">New Password</label>
                  <div className="relative">
                    <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                    <input type={showPassword ? 'text' : 'password'} value={form.password}
                      onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                      placeholder="At least 8 characters"
                      className="input-field pl-11 pr-11"
                    />
                    <button type="button" onClick={() => setShowPassword(v => !v)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-white transition-colors">
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                  <p className="mt-1 text-xs text-gray-400">Must be at least 8 characters</p>
                </div>

                {/* Confirm password */}
                <div>
                  <label className="label-sm mb-1.5">Confirm New Password</label>
                  <div className="relative">
                    <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                    <input type={showConfirm ? 'text' : 'password'} value={form.confirmPassword}
                      onChange={e => setForm(f => ({ ...f, confirmPassword: e.target.value }))}
                      placeholder="Re-enter password"
                      className="input-field pl-11 pr-11"
                    />
                    <button type="button" onClick={() => setShowConfirm(v => !v)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-white transition-colors">
                      {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                <button type="submit" disabled={loading}
                  className="w-full flex items-center justify-center gap-2 py-3.5 bg-brand-gold hover:bg-brand-gold-dark disabled:opacity-50 text-white font-bold text-sm rounded-2xl transition-colors">
                  {loading ? 'Resetting Password…' : <><CheckCircle2 size={16} /> Reset Password</>}
                </button>
              </form>
            </>
          ) : (
            <div className="text-center">
              <div className="flex items-center justify-center w-16 h-16 mx-auto mb-4 bg-emerald-100 dark:bg-emerald-500/20 rounded-3xl">
                <CheckCircle2 size={32} className="text-emerald-500" />
              </div>
              <h2 className="mb-2 text-2xl font-extrabold font-display text-brand-charcoal-dark dark:text-white">
                Password Reset!
              </h2>
              <p className="mb-6 text-sm leading-relaxed text-gray-400">
                Your password has been reset successfully. You can now sign in with your new password.
              </p>
              <p className="text-xs text-gray-400">Redirecting to login…</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}