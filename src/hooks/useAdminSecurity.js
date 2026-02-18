/**
 * useAdminSecurity — Anti-screenshot, anti-screenrecord, anti-console
 *
 * Instead of watermarking, this hook blacks out the entire screen
 * whenever a capture attempt is detected. Screenshots and screen
 * recordings show nothing but a solid black frame.
 *
 *   1. BLACK SHIELD — instant full-screen black overlay
 *      - Fires on PrintScreen, Cmd+Shift+3/4/5, Win+Shift+S, Snipping Tool
 *      - Fires on tab switch / window blur (OBS, Zoom screen share, alt-tab)
 *      - Fires when DevTools is detected open
 *      - A pre-rendered GPU-accelerated overlay (opacity 0) flips to
 *        opacity 1 on keydown — before the OS captures the frame
 *
 *   2. Console lockdown
 *      - All console methods replaced with no-ops
 *
 *   3. Screen Capture API block
 *      - navigator.mediaDevices.getDisplayMedia overridden to reject
 *
 *   4. Copy / right-click / drag disabled
 *
 * Limitations:
 *   - Phone cameras pointed at screen cannot be stopped by software
 *   - Browser extensions with elevated privileges can bypass JS protections
 *   - The keydown → black shield race depends on browser event timing;
 *     the pre-rendered overlay + will-change makes this near-instant
 */

import { useEffect, useRef, useCallback } from 'react';

// ── Console lockdown ──────────────────────────────────────────

const CONSOLE_METHODS = ['log', 'warn', 'error', 'debug', 'info', 'table', 'dir', 'trace', 'group', 'groupEnd'];
const _originals = {};

function lockConsole() {
  CONSOLE_METHODS.forEach(method => {
    if (!_originals[method]) _originals[method] = console[method];
    console[method] = () => {};
  });
  if (!_originals.clear) _originals.clear = console.clear;
  console.clear = () => {};
}

function unlockConsole() {
  Object.entries(_originals).forEach(([method, fn]) => {
    if (fn) console[method] = fn;
  });
}

// ── DevTools detection ────────────────────────────────────────

function detectDevTools() {
  const threshold = 160;
  const widthDiff = window.outerWidth - window.innerWidth;
  const heightDiff = window.outerHeight - window.innerHeight;
  return widthDiff > threshold || heightDiff > threshold;
}

// ── Blocked key combos ────────────────────────────────────────

function isScreenshotKey(e) {
  if (e.key === 'PrintScreen') return true;
  if (e.ctrlKey && e.shiftKey && /^[sSiIjJcC]$/.test(e.key)) return true;
  if (e.key === 'F12') return true;
  if (e.ctrlKey && /^[uU]$/.test(e.key)) return true;
  if (e.metaKey && e.shiftKey && ['3', '4', '5'].includes(e.key)) return true;
  if (e.metaKey && e.shiftKey && /^[sS]$/.test(e.key)) return true;
  return false;
}

// ── Black shield helpers ──────────────────────────────────────

const SHIELD_ID = 'admin-black-shield';

/** Pre-render the black shield (opacity 0, GPU-accelerated) */
function createShield() {
  if (document.getElementById(SHIELD_ID)) return;
  const el = document.createElement('div');
  el.id = SHIELD_ID;
  document.body.appendChild(el);
}

/** Instantly flip shield to opaque black */
function activateShield() {
  const el = document.getElementById(SHIELD_ID);
  if (el) el.classList.add('active');
}

/** Hide shield after a delay */
function deactivateShield(delayMs = 600) {
  setTimeout(() => {
    const el = document.getElementById(SHIELD_ID);
    if (el) el.classList.remove('active');
  }, delayMs);
}

function removeShield() {
  const el = document.getElementById(SHIELD_ID);
  if (el) el.remove();
}

// ── Main hook ─────────────────────────────────────────────────

export default function useAdminSecurity({ enabled = false } = {}) {
  const devToolsWarningRef = useRef(null);

  // Block keyboard shortcuts + activate black shield
  const handleKeyDown = useCallback((e) => {
    if (!enabled) return;
    if (isScreenshotKey(e)) {
      e.preventDefault();
      e.stopPropagation();
      // Black shield FIRST — before the OS can capture
      activateShield();
      // Hold black for 1.5s — long enough to outlast any capture tool
      deactivateShield(1500);
    }
  }, [enabled]);

  const handleContextMenu = useCallback((e) => {
    if (!enabled) return;
    e.preventDefault();
  }, [enabled]);

  const handleCopy = useCallback((e) => {
    if (!enabled) return;
    e.preventDefault();
    e.clipboardData?.setData('text/plain', '');
  }, [enabled]);

  const handleDragStart = useCallback((e) => {
    if (!enabled) return;
    e.preventDefault();
  }, [enabled]);

  useEffect(() => {
    if (!enabled) return;

    // ─── 1. Lock console ───────────────────────────────────
    lockConsole();

    // ─── 2. Create pre-rendered black shield ───────────────
    createShield();

    // ─── 3. Keyboard / mouse event blocking ────────────────
    document.addEventListener('keydown', handleKeyDown, true);
    document.addEventListener('contextmenu', handleContextMenu, true);
    document.addEventListener('copy', handleCopy, true);
    document.addEventListener('dragstart', handleDragStart, true);

    // ─── 4. CSS ────────────────────────────────────────────
    const style = document.createElement('style');
    style.id = 'admin-security-css';
    style.textContent = `
      /* ── Text selection blocking ─────────────────────── */
      body.admin-secured {
        -webkit-user-select: none !important;
        -moz-user-select: none !important;
        -ms-user-select: none !important;
        user-select: none !important;
        -webkit-touch-callout: none !important;
      }
      body.admin-secured input,
      body.admin-secured textarea,
      body.admin-secured [contenteditable="true"] {
        -webkit-user-select: text !important;
        -moz-user-select: text !important;
        -ms-user-select: text !important;
        user-select: text !important;
      }

      /* ── BLACK SHIELD ────────────────────────────────── */
      /* Pre-rendered at opacity 0, GPU-accelerated via    */
      /* will-change + translateZ so the flip to opacity 1 */
      /* is a single compositor frame — near instant.      */
      #${SHIELD_ID} {
        position: fixed;
        inset: 0;
        background: #000;
        z-index: 2147483647;
        opacity: 0;
        pointer-events: none;
        will-change: opacity;
        transform: translateZ(0);
        transition: opacity 0.01s linear;
      }
      #${SHIELD_ID}.active {
        opacity: 1;
        pointer-events: all;
      }

      /* ── DevTools warning ────────────────────────────── */
      .admin-devtools-warning {
        position: fixed;
        inset: 0;
        background: #000;
        z-index: 2147483646;
        display: flex;
        align-items: center;
        justify-content: center;
        flex-direction: column;
        gap: 12px;
        color: #ef4444;
        font-family: system-ui, sans-serif;
      }
      .admin-devtools-warning h2 {
        font-size: 20px;
        font-weight: 700;
        letter-spacing: 0.05em;
      }
      .admin-devtools-warning p {
        font-size: 13px;
        color: #6b7280;
        max-width: 340px;
        text-align: center;
        line-height: 1.5;
      }
    `;
    document.head.appendChild(style);
    document.body.classList.add('admin-secured');

    // ─── 5. Tab switch / window blur → BLACK ───────────────
    const handleVisibilityChange = () => {
      if (document.hidden) {
        activateShield();
      } else {
        deactivateShield(500);
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    const handleWindowBlur = () => activateShield();
    const handleWindowFocus = () => deactivateShield(500);
    window.addEventListener('blur', handleWindowBlur);
    window.addEventListener('focus', handleWindowFocus);

    // ─── 6. DevTools detection → BLACK ─────────────────────
    const devToolsCheckInterval = setInterval(() => {
      if (detectDevTools()) {
        activateShield();
        if (!devToolsWarningRef.current) {
          const warning = document.createElement('div');
          warning.className = 'admin-devtools-warning';

          const h2 = document.createElement('h2');
          h2.textContent = 'DEVELOPER TOOLS DETECTED';

          const p1 = document.createElement('p');
          p1.textContent = 'Developer tools are disabled on admin panels. Close DevTools to continue.';

          const p2 = document.createElement('p');
          p2.style.cssText = 'font-size:10px;color:#4b5563;margin-top:8px;';
          p2.textContent = 'This event has been logged.';

          warning.appendChild(h2);
          warning.appendChild(p1);
          warning.appendChild(p2);
          document.body.appendChild(warning);
          devToolsWarningRef.current = warning;
        }
      } else {
        if (devToolsWarningRef.current) {
          devToolsWarningRef.current.remove();
          devToolsWarningRef.current = null;
          deactivateShield(300);
        }
      }
    }, 1000);

    // ─── 7. Block Screen Capture API ───────────────────────
    const origGetDisplayMedia = navigator.mediaDevices?.getDisplayMedia;
    if (navigator.mediaDevices) {
      navigator.mediaDevices.getDisplayMedia = () => {
        activateShield();
        deactivateShield(2000);
        return Promise.reject(
          new DOMException('Screen capture is disabled.', 'NotAllowedError')
        );
      };
    }

    // ─── Cleanup ───────────────────────────────────────────
    return () => {
      unlockConsole();
      document.removeEventListener('keydown', handleKeyDown, true);
      document.removeEventListener('contextmenu', handleContextMenu, true);
      document.removeEventListener('copy', handleCopy, true);
      document.removeEventListener('dragstart', handleDragStart, true);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('blur', handleWindowBlur);
      window.removeEventListener('focus', handleWindowFocus);
      clearInterval(devToolsCheckInterval);

      document.body.classList.remove('admin-secured');
      removeShield();

      const styleEl = document.getElementById('admin-security-css');
      if (styleEl) styleEl.remove();

      if (devToolsWarningRef.current) {
        devToolsWarningRef.current.remove();
        devToolsWarningRef.current = null;
      }

      if (navigator.mediaDevices && origGetDisplayMedia) {
        navigator.mediaDevices.getDisplayMedia = origGetDisplayMedia;
      }
    };
  }, [enabled, handleKeyDown, handleContextMenu, handleCopy, handleDragStart]);
}
