import { useEffect } from 'react';

/* ════════════════════════════════════════════════════════════
   useDashboardSecurity — Lighter security for user/provider
   dashboards. Only active in production.

   Measures:
   1. DevTools detection → console warning
   2. Right-click blocked on [data-sensitive] elements
   3. console.log / console.dir replaced with no-ops

   Does NOT include (admin-only):
   - Black shield overlay
   - Screenshot key blocking
   - Visibility change handling
   - Screen Capture API blocking
   - Global copy/drag/text-selection blocking
════════════════════════════════════════════════════════════ */

const _origLog = typeof console !== 'undefined' ? console.log : null;
const _origDir = typeof console !== 'undefined' ? console.dir : null;

export default function useDashboardSecurity({ enabled = false } = {}) {
  useEffect(() => {
    if (!enabled) return;

    // ── 1. Lock console.log and console.dir ──────────────
    const noop = () => {};
    console.log = noop;
    console.dir = noop;

    // ── 2. Right-click blocked on [data-sensitive] ───────
    function handleContextMenu(e) {
      if (e.target.closest('[data-sensitive]')) {
        e.preventDefault();
      }
    }
    document.addEventListener('contextmenu', handleContextMenu);

    // ── 3. DevTools detection via window size ─────────────
    let devToolsWarned = false;
    function checkDevTools() {
      const threshold = 160;
      const widthDiff = window.outerWidth - window.innerWidth > threshold;
      const heightDiff = window.outerHeight - window.innerHeight > threshold;
      if ((widthDiff || heightDiff) && !devToolsWarned) {
        devToolsWarned = true;
        // Use original warn (not replaced)
        if (console.warn) {
          console.warn('[Aurban] Developer tools detected on dashboard.');
        }
      } else if (!widthDiff && !heightDiff) {
        devToolsWarned = false;
      }
    }

    const devToolsInterval = setInterval(checkDevTools, 2000);
    checkDevTools();

    // ── Cleanup ──────────────────────────────────────────
    return () => {
      if (_origLog) console.log = _origLog;
      if (_origDir) console.dir = _origDir;
      document.removeEventListener('contextmenu', handleContextMenu);
      clearInterval(devToolsInterval);
    };
  }, [enabled]);
}
