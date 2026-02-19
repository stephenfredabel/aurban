import { useState, useEffect, useCallback } from 'react';

/* ════════════════════════════════════════════════════════════
   usePWAInstall — Captures the browser's "beforeinstallprompt"
   event and exposes PWA install state to any component.

   Returns:
     canInstall     — true when the native install prompt is available
     isInstalled    — true when running in standalone (PWA) mode
     isIOS          — true on iOS (needs manual "Add to Home Screen")
     promptInstall  — triggers the native install dialog
     dismissed      — user dismissed the custom banner this session
     dismiss        — mark banner as dismissed (sessionStorage)
════════════════════════════════════════════════════════════ */

// Module-level capture — the event fires once, early, possibly
// before any React component mounts. We store it here so hooks
// that mount later can still access it.
let deferredPrompt = null;

if (typeof window !== 'undefined') {
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;
    window.dispatchEvent(new CustomEvent('pwa-prompt-available'));
  });
}

const DISMISS_KEY = 'aurban_pwa_dismissed';

function checkIsInstalled() {
  if (typeof window === 'undefined') return false;
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    window.navigator.standalone === true
  );
}

function checkIsIOS() {
  if (typeof navigator === 'undefined') return false;
  const ua = navigator.userAgent;
  return /iPhone|iPad|iPod/.test(ua) && !/CriOS|FxiOS/.test(ua);
}

export default function usePWAInstall() {
  const [canInstall, setCanInstall] = useState(!!deferredPrompt);
  const [isInstalled] = useState(checkIsInstalled);
  const [isIOS] = useState(checkIsIOS);
  const [dismissed, setDismissed] = useState(
    () => sessionStorage.getItem(DISMISS_KEY) === '1'
  );

  // Listen for late-arriving prompt event
  useEffect(() => {
    function onPromptAvailable() {
      setCanInstall(true);
    }
    window.addEventListener('pwa-prompt-available', onPromptAvailable);

    // Also listen for app install — hide banners after install
    function onAppInstalled() {
      setCanInstall(false);
      deferredPrompt = null;
    }
    window.addEventListener('appinstalled', onAppInstalled);

    return () => {
      window.removeEventListener('pwa-prompt-available', onPromptAvailable);
      window.removeEventListener('appinstalled', onAppInstalled);
    };
  }, []);

  const promptInstall = useCallback(async () => {
    if (!deferredPrompt) return 'dismissed';
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    deferredPrompt = null;
    setCanInstall(false);
    return outcome; // 'accepted' | 'dismissed'
  }, []);

  const dismiss = useCallback(() => {
    sessionStorage.setItem(DISMISS_KEY, '1');
    setDismissed(true);
  }, []);

  return { canInstall, isInstalled, isIOS, promptInstall, dismissed, dismiss };
}
