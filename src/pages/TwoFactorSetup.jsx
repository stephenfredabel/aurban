import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Shield, Smartphone, Copy, Check, AlertCircle, CheckCircle2, ArrowRight } from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';

export default function TwoFactorSetup() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [step, setStep]         = useState(1); // 1: intro | 2: scan QR | 3: verify | 4: backup codes
  const [code, setCode]         = useState('');
  const [copied, setCopied]     = useState(false);
  const [error, setError]       = useState('');
  const [backupCodes, setBackupCodes] = useState([]);

  // Mock QR code and secret
  const qrCode = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==';
  const secret = 'JBSWY3DPEHPK3PXP';

  const handleVerify = useCallback(async (e) => {
    e.preventDefault();
    setError('');

    if (code.length !== 6) {
      setError('Please enter the 6-digit code');
      return;
    }

    await new Promise(r => setTimeout(r, 1000));

    // Mock: 80% success
    if (Math.random() > 0.2) {
      // Generate backup codes
      const codes = Array.from({ length: 8 }, () =>
        Math.random().toString(36).substring(2, 10).toUpperCase()
      );
      setBackupCodes(codes);
      setStep(4);
    } else {
      setError('Invalid code. Please try again.');
      setCode('');
    }
  }, [code]);

  const handleCopySecret = () => {
    navigator.clipboard.writeText(secret);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleCopyBackupCodes = () => {
    navigator.clipboard.writeText(backupCodes.join('\n'));
  };

  const handleFinish = () => {
    navigate('/dashboard/settings?2fa=enabled');
  };

  return (
    <div className="flex items-center justify-center min-h-screen p-4 bg-gray-50 dark:bg-gray-900/30">
      <div className="w-full max-w-md">
        
        <div className="p-8 bg-white border border-gray-100 shadow-lg dark:bg-brand-charcoal-dark rounded-3xl dark:border-white/10">
          
          {/* Step 1: Intro */}
          {step === 1 && (
            <>
              <div className="mb-6 text-center">
                <div className="flex items-center justify-center w-16 h-16 mx-auto mb-4 bg-blue-100 dark:bg-blue-500/20 rounded-3xl">
                  <Shield size={32} className="text-blue-500" />
                </div>
                <h1 className="mb-2 text-2xl font-extrabold font-display text-brand-charcoal-dark dark:text-white">
                  Enable Two-Factor Authentication
                </h1>
                <p className="text-sm leading-relaxed text-gray-400">
                  Add an extra layer of security to your account with 2FA.
                </p>
              </div>

              <div className="mb-6 space-y-4">
                <div className="flex items-start gap-3 p-4 bg-brand-gray-soft dark:bg-white/5 rounded-2xl">
                  <div className="flex items-center justify-center w-8 h-8 bg-brand-gold/20 rounded-xl shrink-0">
                    <span className="text-sm font-bold text-brand-gold">1</span>
                  </div>
                  <div>
                    <p className="text-sm font-bold text-brand-charcoal-dark dark:text-white mb-0.5">
                      Install an authenticator app
                    </p>
                    <p className="text-xs leading-relaxed text-gray-400">
                      Google Authenticator, Authy, or Microsoft Authenticator
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-4 bg-brand-gray-soft dark:bg-white/5 rounded-2xl">
                  <div className="flex items-center justify-center w-8 h-8 bg-brand-gold/20 rounded-xl shrink-0">
                    <span className="text-sm font-bold text-brand-gold">2</span>
                  </div>
                  <div>
                    <p className="text-sm font-bold text-brand-charcoal-dark dark:text-white mb-0.5">
                      Scan the QR code
                    </p>
                    <p className="text-xs leading-relaxed text-gray-400">
                      Or enter the secret key manually
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-4 bg-brand-gray-soft dark:bg-white/5 rounded-2xl">
                  <div className="flex items-center justify-center w-8 h-8 bg-brand-gold/20 rounded-xl shrink-0">
                    <span className="text-sm font-bold text-brand-gold">3</span>
                  </div>
                  <div>
                    <p className="text-sm font-bold text-brand-charcoal-dark dark:text-white mb-0.5">
                      Verify with a code
                    </p>
                    <p className="text-xs leading-relaxed text-gray-400">
                      Enter the 6-digit code to confirm
                    </p>
                  </div>
                </div>
              </div>

              <button type="button" onClick={() => setStep(2)}
                className="w-full flex items-center justify-center gap-2 py-3.5 bg-brand-gold hover:bg-brand-gold-dark text-white font-bold text-sm rounded-2xl transition-colors">
                Continue <ArrowRight size={16} />
              </button>
            </>
          )}

          {/* Step 2: Scan QR */}
          {step === 2 && (
            <>
              <h2 className="mb-4 text-xl font-extrabold font-display text-brand-charcoal-dark dark:text-white">
                Scan QR Code
              </h2>

              <div className="mb-6">
                <p className="mb-4 text-sm leading-relaxed text-gray-400">
                  Open your authenticator app and scan this QR code:
                </p>

                {/* QR Code */}
                <div className="w-48 h-48 p-4 mx-auto mb-4 bg-white border-2 border-gray-200 rounded-2xl">
                  <img src={qrCode} alt="QR Code" className="object-contain w-full h-full" />
                </div>

                {/* Manual entry */}
                <div className="p-4 bg-brand-gray-soft dark:bg-white/5 rounded-2xl">
                  <p className="mb-2 text-xs font-bold tracking-wider text-gray-400 uppercase">
                    Or enter this key manually:
                  </p>
                  <div className="flex items-center gap-2">
                    <code className="flex-1 px-3 py-2 font-mono text-sm bg-white border border-gray-200 dark:bg-brand-charcoal-dark rounded-xl dark:border-white/10 text-brand-charcoal-dark dark:text-white">
                      {secret}
                    </code>
                    <button type="button" onClick={handleCopySecret}
                      className="flex items-center justify-center text-gray-400 transition-colors bg-white border border-gray-200 w-9 h-9 rounded-xl dark:bg-brand-charcoal-dark dark:border-white/10 hover:text-brand-gold">
                      {copied ? <Check size={14} className="text-emerald-500" /> : <Copy size={14} />}
                    </button>
                  </div>
                </div>
              </div>

              <button type="button" onClick={() => setStep(3)}
                className="w-full py-3.5 bg-brand-gold hover:bg-brand-gold-dark text-white font-bold text-sm rounded-2xl transition-colors">
                Continue
              </button>
            </>
          )}

          {/* Step 3: Verify */}
          {step === 3 && (
            <>
              <h2 className="mb-2 text-xl font-extrabold font-display text-brand-charcoal-dark dark:text-white">
                Verify Code
              </h2>
              <p className="mb-6 text-sm leading-relaxed text-gray-400">
                Enter the 6-digit code from your authenticator app to confirm.
              </p>

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

                <button type="submit" disabled={code.length !== 6}
                  className="w-full flex items-center justify-center gap-2 py-3.5 bg-brand-gold hover:bg-brand-gold-dark disabled:opacity-50 text-white font-bold text-sm rounded-2xl transition-colors">
                  <CheckCircle2 size={16} /> Verify & Enable
                </button>
              </form>
            </>
          )}

          {/* Step 4: Backup codes */}
          {step === 4 && (
            <>
              <div className="mb-6 text-center">
                <div className="flex items-center justify-center w-16 h-16 mx-auto mb-4 bg-emerald-100 dark:bg-emerald-500/20 rounded-3xl">
                  <CheckCircle2 size={32} className="text-emerald-500" />
                </div>
                <h2 className="mb-2 text-2xl font-extrabold font-display text-brand-charcoal-dark dark:text-white">
                  2FA Enabled!
                </h2>
                <p className="text-sm leading-relaxed text-gray-400">
                  Save these backup codes in a secure place. You can use them to sign in if you lose your phone.
                </p>
              </div>

              <div className="p-4 mb-4 bg-brand-gray-soft dark:bg-white/5 rounded-2xl">
                <div className="grid grid-cols-2 gap-2 mb-3">
                  {backupCodes.map((c, i) => (
                    <code key={i} className="px-3 py-2 font-mono text-xs text-center bg-white border border-gray-200 dark:bg-brand-charcoal-dark rounded-xl dark:border-white/10 text-brand-charcoal-dark dark:text-white">
                      {c}
                    </code>
                  ))}
                </div>
                <button type="button" onClick={handleCopyBackupCodes}
                  className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border-2 border-gray-200 dark:border-white/20 text-sm font-bold text-brand-charcoal dark:text-white hover:border-brand-gold transition-colors">
                  <Copy size={14} /> Copy All Codes
                </button>
              </div>

              <div className="flex items-start gap-2.5 p-3.5 bg-amber-50 dark:bg-amber-500/10 rounded-2xl border border-amber-100 dark:border-amber-500/20 mb-5">
                <AlertCircle size={16} className="text-amber-500 mt-0.5 shrink-0" />
                <p className="text-xs leading-relaxed text-amber-700 dark:text-amber-300">
                  Each code can only be used once. Store them safely — you won't see them again.
                </p>
              </div>

              <button type="button" onClick={handleFinish}
                className="w-full py-3.5 bg-brand-gold hover:bg-brand-gold-dark text-white font-bold text-sm rounded-2xl transition-colors">
                Done
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}