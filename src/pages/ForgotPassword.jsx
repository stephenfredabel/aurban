import { useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Mail, ArrowRight, Send, CheckCircle2, AlertCircle } from 'lucide-react';
import AurbanLogo from '../components/AurbanLogo.jsx';

export default function ForgotPassword() {
  const [email, setEmail]     = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent]       = useState(false);
  const [error, setError]     = useState('');

  const handleSubmit = useCallback(async (e) => {
    e.preventDefault();
    setError('');

    if (!email.trim()) {
      setError('Please enter your email address');
      return;
    }

    if (!/\S+@\S+\.\S+/.test(email)) {
      setError('Please enter a valid email address');
      return;
    }

    setLoading(true);
    await new Promise(r => setTimeout(r, 1200));
    setLoading(false);
    setSent(true);
  }, [email]);

  return (
    <div className="flex items-center justify-center min-h-screen p-4 bg-gray-50 dark:bg-gray-900/30">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <Link to="/" className="inline-block">
            <AurbanLogo size="lg" showName />
          </Link>
        </div>

        <div className="p-8 bg-white border border-gray-100 shadow-lg dark:bg-brand-charcoal-dark rounded-3xl dark:border-white/10">
          
          {!sent ? (
            <>
              <h1 className="mb-2 text-2xl font-extrabold font-display text-brand-charcoal-dark dark:text-white">
                Forgot Password?
              </h1>
              <p className="mb-6 text-sm leading-relaxed text-gray-400">
                Enter your email and we'll send you a secure link to reset your password.
              </p>

              {error && (
                <div className="flex items-start gap-2.5 p-3.5 bg-red-50 dark:bg-red-500/10 rounded-2xl border border-red-100 dark:border-red-500/20 mb-5">
                  <AlertCircle size={16} className="text-red-500 mt-0.5 shrink-0" />
                  <p className="text-sm leading-relaxed text-red-600 dark:text-red-400">{error}</p>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="label-sm mb-1.5">Email Address</label>
                  <div className="relative">
                    <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                    <input type="email" inputMode="email" value={email}
                      onChange={e => setEmail(e.target.value)}
                      placeholder="you@example.com"
                      className="input-field pl-11"
                    />
                  </div>
                </div>

                <button type="submit" disabled={loading}
                  className="w-full flex items-center justify-center gap-2 py-3.5 bg-brand-gold hover:bg-brand-gold-dark disabled:opacity-50 text-white font-bold text-sm rounded-2xl transition-colors">
                  {loading ? 'Sending…' : <><Send size={16} /> Send Reset Link</>}
                </button>
              </form>

              <div className="flex items-center justify-center gap-1 mt-6 text-sm">
                <Link to="/login" className="flex items-center gap-1 font-bold transition-colors text-brand-gold hover:text-brand-gold-dark">
                  <ArrowRight size={14} className="rotate-180" /> Back to Sign In
                </Link>
              </div>
            </>
          ) : (
            <div className="text-center">
              <div className="flex items-center justify-center w-16 h-16 mx-auto mb-4 bg-emerald-100 dark:bg-emerald-500/20 rounded-3xl">
                <CheckCircle2 size={32} className="text-emerald-500" />
              </div>
              <h2 className="mb-2 text-2xl font-extrabold font-display text-brand-charcoal-dark dark:text-white">
                Check Your Email
              </h2>
              <p className="mb-6 text-sm leading-relaxed text-gray-400">
                We've sent password reset instructions to <strong className="text-brand-charcoal-dark dark:text-white">{email}</strong>. Check your inbox and spam folder.
              </p>
              <p className="mb-6 text-xs text-gray-400">
                The link expires in <strong>1 hour</strong>.
              </p>
              <button type="button" onClick={() => setSent(false)}
                className="text-sm font-bold transition-colors text-brand-gold hover:text-brand-gold-dark">
                Didn't receive it? Resend
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}