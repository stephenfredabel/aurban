import { Shield, Download, Monitor, Wifi, Lock, Share } from 'lucide-react';
import usePWAInstall from '../../hooks/usePWAInstall.js';
import AurbanLogo from '../AurbanLogo.jsx';

/* ════════════════════════════════════════════════════════════
   PWA ADMIN GATE — Assertive overlay shown on admin login
   encouraging PWA installation for security + desktop app feel.

   Not a hard gate — "Continue in browser" always available.

   Props:
     onContinueAnyway  — callback when user skips install
════════════════════════════════════════════════════════════ */

const FEATURES = [
  { icon: Lock,    label: 'Isolated sessions' },
  { icon: Shield,  label: 'Screen protection' },
  { icon: Wifi,    label: 'Offline access' },
  { icon: Monitor, label: 'Desktop app feel' },
];

export default function PWAAdminGate({ onContinueAnyway }) {
  const { canInstall, isInstalled, isIOS, promptInstall } = usePWAInstall();

  // Already installed — don't show gate
  if (isInstalled) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-gray-950 px-4">
      <div className="w-full max-w-md text-center">

        {/* Logo */}
        <div className="flex justify-center mb-6">
          <AurbanLogo size="lg" variant="white" />
        </div>

        {/* Card */}
        <div className="p-6 border rounded-2xl bg-gray-900 border-white/10 sm:p-8">

          {/* Icon */}
          <div className="flex items-center justify-center w-16 h-16 mx-auto mb-5 rounded-2xl
              bg-brand-gold/10 border border-brand-gold/20">
            <Shield size={28} className="text-brand-gold" />
          </div>

          <h1 className="text-xl font-bold text-white font-display">
            Install the Admin Portal
          </h1>
          <p className="mt-2 text-sm leading-relaxed text-gray-400">
            For maximum security and the best experience, install the
            Aurban Admin Portal as a standalone app. This ensures
            screen protection, isolated sessions, and desktop-app performance.
          </p>

          {/* Feature badges */}
          <div className="flex flex-wrap items-center justify-center gap-2 mt-5">
            {FEATURES.map(({ icon: FIcon, label }) => (
              <span
                key={label}
                className="flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-medium
                    text-gray-300 bg-white/5 border border-white/10 rounded-full"
              >
                <FIcon size={12} className="text-brand-gold" />
                {label}
              </span>
            ))}
          </div>

          {/* CTA */}
          <div className="mt-6 space-y-3">
            {canInstall ? (
              <button
                onClick={promptInstall}
                className="flex items-center justify-center w-full gap-2 px-6 py-3
                    text-sm font-bold rounded-full
                    bg-brand-gold text-brand-charcoal-dark
                    hover:bg-brand-gold/90 active:scale-[0.97] transition-all"
              >
                <Download size={16} />
                Install Admin Portal
              </button>
            ) : isIOS ? (
              <div className="p-4 text-left border rounded-xl bg-white/5 border-white/10">
                <p className="text-xs font-semibold text-white mb-1.5">Install on iOS</p>
                <p className="text-[11px] text-gray-400 leading-relaxed">
                  Tap the <Share size={11} className="inline -mt-0.5 text-brand-gold" /> Share
                  button in Safari, then select{' '}
                  <strong className="text-white">&quot;Add to Home Screen&quot;</strong>.
                </p>
              </div>
            ) : (
              <div className="p-4 border rounded-xl bg-white/5 border-white/10">
                <p className="text-xs text-gray-400 leading-relaxed">
                  Open this page in <strong className="text-white">Chrome</strong> or{' '}
                  <strong className="text-white">Edge</strong> to install as a desktop app.
                </p>
              </div>
            )}

            {/* Skip link */}
            <button
              onClick={onContinueAnyway}
              className="block w-full text-xs text-gray-500 transition-colors hover:text-gray-400"
            >
              Continue in browser
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
