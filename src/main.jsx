import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import './i18n/index.js';
import App from './App.jsx';

/* ════════════════════════════════════════════════════════════
   ENTRY POINT — Aurban Platform
   
   Security notes:
   • CSP headers set in index.html meta tags
   • No eval() or Function() used anywhere
   • All user inputs sanitized via utils/security.js
   • Auth tokens stored in sessionStorage only (clears on tab close)
════════════════════════════════════════════════════════════ */

const rootEl = document.getElementById('root');

if (!rootEl) {
  throw new Error(
    '[Aurban] Root element #root not found. Check index.html.'
  );
}

createRoot(rootEl).render(
  <StrictMode>
    <App />
  </StrictMode>
);

/* ── Disable right-click in production (optional deterrent) ─ */
if (import.meta.env.PROD) {
  document.addEventListener('contextmenu', (e) => {
    // Only block on images to prevent easy asset theft
    if (e.target?.tagName === 'IMG') {
      e.preventDefault();
    }
  });
}