import { useState, useCallback, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Shield, Smartphone, AlertCircle, ArrowRight } from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';
import AurbanLogo  from '../components/AurbanLogo.jsx';

export default function TwoFactorVerify() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();

  const sessionData = useMemo(() => location.state || { email: 'user@example.com' }, [location.state]);

  const [code, setCode]       = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState('');

  const handleVerify = useCallback(async (e) => {
    e.preventDefault();
    setError('');

    if (code.length !== 6) {
      setError('Please enter the 6-digit code');
      return;
    }

    setLoading(true);
    await new Promise(r => setTimeout(r, 1000));

    // Mock: 80% success
    if (Math.random() > 0.2) {
      login({ name: 'User', email: sessionData.email, role: 'user' });
      navigate('/dashboard');
    } else {
      setError('Invalid code. Please try again.');
      setCode('');
    }

    setLoading(false);
  }, [code, sessionData, login, navigate]);

  return (
    <div className="flex items-center justify-center min-h-screen p-4 bg-gray-50 dark:bg-gray-900/30">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <Link to="/" className="inline-block">
            <AurbanLogo size="lg" showName />
          </Link>
        </div>

        <div className="p-8 bg-white border border-gray-100 shadow-lg dark:bg-brand-charcoal-dark rounded-3xl dark:border-white/10">
          
          <button type="button" onClick={() => navigate('/login')}
            className="flex items-center gap-1.5 text-sm font-bold text-gray-400 hover:text-brand-charcoal dark:hover:text-white mb-5 transition-colors">
            <ArrowRight size={14} className="rotate-180" /> Back to login
          </button>

          <div className="mb-6 text-center">
            <div className="flex items-center justify-center w-16 h-16 mx-auto mb-4 bg-blue-100 dark:bg-blue-500/20 rounded-3xl">
              <Shield size={32} className="text-blue-500" />
            </div>
            <h1 className="mb-2 text-2xl font-extrabold font-display text-brand-charcoal-dark dark:text-white">
              Two-Factor Authentication
            </h1>
            <p className="text-sm leading-relaxed text-gray-400">
              Enter the 6-digit code from your authenticator app
            </p>
          </div>

          {error && (
            <div className="flex items-start gap-2.5 p-3.5 bg-red-50 dark:bg-red-500/10 rounded-2xl border border-red-100 dark:border-red-500/20 mb-5">
              <AlertCircle size={16} className="text-red-500 mt-0.5 shrink-0" />
              <p className="text-sm leading-relaxed text-red-600 dark:text-red-400">{error}</p>
            </div>
          )}

          <form onSubmit={handleVerify} className="space-y-4">
            <div>
              <label className="label-sm mb-1.5">Verification Code</label>
              <div className="relative">
                <Smartphone size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                <input type="text" inputMode="numeric" value={code}
                  onChange={e => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  placeholder="000000"
                  maxLength={6}
                  className="font-mono text-lg tracking-widest text-center input-field pl-11"
                />
              </div>
            </div>

            <button type="submit" disabled={loading || code.length !== 6}
              className="w-full flex items-center justify-center gap-2 py-3.5 bg-brand-gold hover:bg-brand-gold-dark disabled:opacity-50 text-white font-bold text-sm rounded-2xl transition-colors">
              {loading ? 'Verifying…' : 'Verify & Sign In'}
            </button>
          </form>

          <p className="mt-5 text-xs text-center text-gray-400">
            Lost your device?{' '}
            <button type="button" className="font-bold transition-colors text-brand-gold hover:text-brand-gold-dark">
              Use backup code
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}