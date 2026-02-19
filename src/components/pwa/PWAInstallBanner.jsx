import { Download, Smartphone, X, Share } from 'lucide-react';
import usePWAInstall from '../../hooks/usePWAInstall.js';

/* ════════════════════════════════════════════════════════════
   PWA INSTALL BANNER — Non-intrusive dismissible banner shown
   in user and provider dashboards encouraging app installation.

   Props:
     variant  — 'user' | 'provider'  (controls copy)
════════════════════════════════════════════════════════════ */

const COPY = {
  user: {
    title: 'Install Aurban for quick access',
    desc: 'Get quick access to your dashboard, bookings, and messages. Install Aurban on your device for a native app experience.',
  },
  provider: {
    title: 'Install Aurban to manage on the go',
    desc: 'Manage your listings, bookings, and earnings anywhere. Install Aurban for instant access without opening your browser.',
  },
};

export default function PWAInstallBanner({ variant = 'user' }) {
  const { canInstall, isInstalled, isIOS, promptInstall, dismissed, dismiss } = usePWAInstall();

  // Don't show if already installed or dismissed
  if (isInstalled || dismissed) return null;

  // Don't show if can't install and not iOS
  if (!canInstall && !isIOS) return null;

  const { title, desc } = COPY[variant] || COPY.user;

  return (
    <div className="relative mb-4 overflow-hidden border rounded-2xl
        bg-brand-gold/5 border-brand-gold/20
        dark:bg-brand-gold/10 dark:border-brand-gold/30
        animate-fade-up">

      {/* Dismiss button */}
      <button
        onClick={dismiss}
        className="absolute z-10 p-1 transition-colors rounded-full top-3 right-3
            text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
        aria-label="Dismiss install banner"
      >
        <X size={16} />
      </button>

      <div className="flex items-start gap-4 p-4 sm:items-center sm:p-5">
        {/* Icon */}
        <div className="flex items-center justify-center flex-shrink-0 rounded-xl
            w-11 h-11 bg-brand-gold/10 dark:bg-brand-gold/20">
          {isIOS
            ? <Smartphone size={20} className="text-brand-gold" />
            : <Download size={20} className="text-brand-gold" />}
        </div>

        {/* Text */}
        <div className="flex-1 min-w-0 pr-6">
          <p className="text-sm font-bold text-brand-charcoal-dark dark:text-white leading-tight">
            {title}
          </p>
          <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
            {desc}
          </p>
        </div>

        {/* CTA */}
        <div className="flex-shrink-0">
          {isIOS ? (
            <div className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-full
                bg-brand-gold text-brand-charcoal-dark">
              <Share size={13} />
              Add to Home
            </div>
          ) : (
            <button
              onClick={promptInstall}
              className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-full
                  bg-brand-gold text-brand-charcoal-dark
                  hover:bg-brand-gold/90 active:scale-[0.97] transition-all"
            >
              <Download size={13} />
              Install App
            </button>
          )}
        </div>
      </div>

      {/* iOS instructions */}
      {isIOS && (
        <div className="px-4 pb-4 sm:px-5 sm:pb-5 -mt-1">
          <p className="text-[11px] text-gray-400 dark:text-gray-500 leading-relaxed">
            Tap the <Share size={11} className="inline -mt-0.5 text-brand-gold" /> Share button in Safari,
            then select <strong className="text-gray-600 dark:text-gray-300">&quot;Add to Home Screen&quot;</strong>.
          </p>
        </div>
      )}
    </div>
  );
}
