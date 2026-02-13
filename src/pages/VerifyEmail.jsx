import { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Mail, CheckCircle2, AlertCircle, Loader, ArrowRight } from 'lucide-react';
import AurbanLogo from '../components/AurbanLogo.jsx';

export default function VerifyEmail() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const token = params.get('token');

  const [status, setStatus] = useState('verifying'); // 'verifying' | 'success' | 'error'
  const [error,  setError]  = useState('');

  useEffect(() => {
    if (!token) {
      setStatus('error');
      setError('Invalid verification link');
      return;
    }

    const verify = async () => {
      await new Promise(r => setTimeout(r, 2000));

      // Mock: 90% success
      if (Math.random() > 0.1) {
        setStatus('success');
        setTimeout(() => navigate('/dashboard?verified=true'), 3000);
      } else {
        setStatus('error');
        setError('Verification link expired or already used');
      }
    };

    verify();
  }, [token, navigate]);

  return (
    <div className="flex items-center justify-center min-h-screen p-4 bg-gray-50 dark:bg-gray-900/30">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <Link to="/" className="inline-block">
            <AurbanLogo size="lg" showName />
          </Link>
        </div>

        <div className="p-8 text-center bg-white border border-gray-100 shadow-lg dark:bg-brand-charcoal-dark rounded-3xl dark:border-white/10">
          
          {/* Verifying */}
          {status === 'verifying' && (
            <>
              <div className="flex items-center justify-center w-16 h-16 mx-auto mb-4 bg-blue-100 dark:bg-blue-500/20 rounded-3xl">
                <Loader size={32} className="text-blue-500 animate-spin" />
              </div>
              <h2 className="mb-2 text-2xl font-extrabold font-display text-brand-charcoal-dark dark:text-white">
                Verifying Your Email
              </h2>
              <p className="text-sm leading-relaxed text-gray-400">
                Please wait while we verify your email address…
              </p>
            </>
          )}

          {/* Success */}
          {status === 'success' && (
            <>
              <div className="flex items-center justify-center w-16 h-16 mx-auto mb-4 bg-emerald-100 dark:bg-emerald-500/20 rounded-3xl">
                <CheckCircle2 size={32} className="text-emerald-500" />
              </div>
              <h2 className="mb-2 text-2xl font-extrabold font-display text-brand-charcoal-dark dark:text-white">
                Email Verified!
              </h2>
              <p className="mb-6 text-sm leading-relaxed text-gray-400">
                Your email has been verified successfully. You now have full access to your Aurban account.
              </p>
              <p className="text-xs text-gray-400">Redirecting to dashboard…</p>
            </>
          )}

          {/* Error */}
          {status === 'error' && (
            <>
              <div className="flex items-center justify-center w-16 h-16 mx-auto mb-4 bg-red-100 dark:bg-red-500/20 rounded-3xl">
                <AlertCircle size={32} className="text-red-500" />
              </div>
              <h2 className="mb-2 text-2xl font-extrabold font-display text-brand-charcoal-dark dark:text-white">
                Verification Failed
              </h2>
              <p className="mb-6 text-sm leading-relaxed text-gray-400">
                {error || `We couldn't verify your email address. The link may have expired or already been used.`}
              </p>
              <Link to="/dashboard/settings?resend=true"
                className="inline-flex items-center gap-2 px-6 py-3 text-sm font-bold text-white transition-colors bg-brand-gold hover:bg-brand-gold-dark rounded-2xl">
                Resend Verification Email <ArrowRight size={14} />
              </Link>
            </>
          )}
        </div>
      </div>
    </div>
  );
}