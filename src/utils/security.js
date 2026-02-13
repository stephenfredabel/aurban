/**
 * Aurban Security Utilities
 * Client-side hardening: sanitization, rate limiting,
 * CSRF-ready tokens, secure storage, input validation.
 */

// ── XSS / Injection ──────────────────────────────────────────

/**
 * Inject a basic CSP meta tag at runtime.
 * NOTE: Meta-based CSP is limited and can be overridden by HTTP headers.
 */
export function injectCSPMeta() {
  if (typeof document === 'undefined') return;
  if (document.querySelector('meta[http-equiv="Content-Security-Policy"]')) return;

  const meta = document.createElement('meta');
  meta.httpEquiv = 'Content-Security-Policy';
  meta.content = [
    "default-src 'self'",
    "img-src 'self' data: https:",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "font-src 'self' https://fonts.gstatic.com",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
    "connect-src 'self' https:",
  ].join('; ');
  document.head.appendChild(meta);
}

const XSS_PATTERNS = [
  /<script[\s\S]*?>[\s\S]*?<\/script>/gi,
  /<[^>]+on\w+\s*=\s*["'][^"']*["'][^>]*>/gi,
  /javascript\s*:/gi,
  /data\s*:\s*text\/html/gi,
  /vbscript\s*:/gi,
  /<iframe[\s\S]*?>/gi,
  /<object[\s\S]*?>/gi,
  /<embed[\s\S]*?>/gi,
  /<link[\s\S]*?>/gi,
  /expression\s*\(/gi,
  /url\s*\(\s*["']?\s*javascript/gi,
];

/**
 * Strip XSS vectors and HTML from any user-supplied string.
 * Always call this before displaying or storing user input.
 */
export function sanitize(input) {
  if (typeof input !== 'string') return '';
  let out = input.trim().slice(0, 2000);
  XSS_PATTERNS.forEach((re) => { out = out.replace(re, ''); });
  return out;
}

/**
 * Strip ALL HTML tags — for contexts where markup is never valid.
 */
export function stripTags(input) {
  return sanitize(input).replace(/<[^>]*>/g, '');
}

/**
 * Encode for safe display inside HTML text nodes.
 * Use when rendering untrusted content via dangerouslySetInnerHTML.
 */
export function encodeHTML(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;');
}

// ── Validation patterns ───────────────────────────────────────

export const PATTERNS = {
  EMAIL:    /^[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}$/,
  PHONE_NG: /^(\+?234|0)[789][01]\d{8}$/,
  PASSWORD: /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d@$!%*#?&^_\-]{8,72}$/,
  NAME:     /^[a-zA-ZÀ-ÖØ-öø-ÿ\s'\-]{2,80}$/,
  URL:      /^https?:\/\/[^\s/$.?#].[^\s]*$/i,
  POSTCODE: /^[A-Z0-9\s\-]{3,12}$/i,
  NUBAN:    /^\d{10}$/,
};

export function isValidEmail(v)  { return PATTERNS.EMAIL.test(sanitize(v)); }
export function isValidPhone(v)  { return PATTERNS.PHONE_NG.test(sanitize(v)); }
export function isValidURL(v)    { return PATTERNS.URL.test(sanitize(v)); }
export function isValidNUBAN(v)  { return PATTERNS.NUBAN.test(sanitize(v)); }

/**
 * Password strength scorer → 0–4
 * Returns { score, label, color, suggestions }
 */
export function checkPasswordStrength(password) {
  if (!password) return { score: 0, label: '', color: 'bg-gray-200', suggestions: [] };

  const checks = [
    { re: /.{8,}/,           hint: 'At least 8 characters'          },
    { re: /[A-Z]/,           hint: 'At least one uppercase letter'  },
    { re: /[a-z]/,           hint: 'At least one lowercase letter'  },
    { re: /\d/,              hint: 'At least one number'            },
    { re: /[@$!%*#?&^_\-]/, hint: 'At least one special character' },
  ];

  const failed = checks.filter(({ re }) => !re.test(password)).map(({ hint }) => hint);
  const score  = checks.length - failed.length;

  const map = [
    { label: '',        color: 'bg-gray-200'   },
    { label: 'Weak',    color: 'bg-red-400'    },
    { label: 'Fair',    color: 'bg-orange-400' },
    { label: 'Good',    color: 'bg-yellow-400' },
    { label: 'Strong',  color: 'bg-emerald-400'},
    { label: 'Strong',  color: 'bg-emerald-500'},
  ];

  return { score, ...map[score], suggestions: failed };
}

// ── CSRF token ────────────────────────────────────────────────

let _csrfToken = null;

export function generateCSRFToken() {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  _csrfToken = Array.from(array, (b) => b.toString(16).padStart(2, '0')).join('');
  try { sessionStorage.setItem('_csrf', _csrfToken); } catch { /* ignore */ }
  return _csrfToken;
}

export function getCSRFToken() {
  if (_csrfToken) return _csrfToken;
  try { _csrfToken = sessionStorage.getItem('_csrf'); } catch { /* ignore */ }
  if (!_csrfToken) _csrfToken = generateCSRFToken();
  return _csrfToken;
}

// ── Rate limiter ──────────────────────────────────────────────

export class RateLimiter {
  /**
   * @param {string} key      Unique identifier (e.g. 'login', 'otp')
   * @param {number} limit    Max attempts
   * @param {number} windowMs Window in milliseconds
   */
  constructor(key, limit = 5, windowMs = 15 * 60 * 1000) {
    this.key      = `rl_${key}`;
    this.limit    = limit;
    this.windowMs = windowMs;
  }

  _load() {
    try {
      const raw = sessionStorage.getItem(this.key);
      return raw ? JSON.parse(raw) : { attempts: 0, firstAt: null };
    } catch { return { attempts: 0, firstAt: null }; }
  }

  _save(data) {
    try { sessionStorage.setItem(this.key, JSON.stringify(data)); } catch { /* ignore */ }
  }

  /** Returns { allowed, remaining, retryAfterMs } */
  check() {
    const data = this._load();
    const now  = Date.now();

    if (data.firstAt && now - data.firstAt > this.windowMs) {
      this._save({ attempts: 0, firstAt: null });
      return { allowed: true, remaining: this.limit, retryAfterMs: 0 };
    }

    if (data.attempts >= this.limit) {
      const retryAfterMs = this.windowMs - (now - data.firstAt);
      return { allowed: false, remaining: 0, retryAfterMs: Math.max(0, retryAfterMs) };
    }

    return { allowed: true, remaining: this.limit - data.attempts, retryAfterMs: 0 };
  }

  /** Record an attempt. Call AFTER the action. */
  increment() {
    const data = this._load();
    const now  = Date.now();
    const next = {
      attempts: data.attempts + 1,
      firstAt:  data.firstAt || now,
    };
    this._save(next);
  }

  reset() {
    try { sessionStorage.removeItem(this.key); } catch { /* ignore */ }
  }

  /** Formatted countdown string */
  retryMessage(retryAfterMs) {
    const mins = Math.ceil(retryAfterMs / 60000);
    return `Too many attempts. Try again in ${mins} minute${mins !== 1 ? 's' : ''}.`;
  }
}

// Pre-built limiters
export const loginLimiter = new RateLimiter('login', 5, 15 * 60 * 1000);
export const otpLimiter   = new RateLimiter('otp',   3, 10 * 60 * 1000);
export const signupLimiter = new RateLimiter('signup', 3, 60 * 60 * 1000);

// ── Secure session storage ────────────────────────────────────
// Simple obfuscation layer — not a substitute for server-side auth

const _KEY_PREFIX = '__au__';

export const secureStorage = {
  set(key, value) {
    try {
      const payload = btoa(JSON.stringify({ v: value, t: Date.now() }));
      sessionStorage.setItem(_KEY_PREFIX + key, payload);
    } catch { /* ignore */ }
  },
  get(key) {
    try {
      const raw = sessionStorage.getItem(_KEY_PREFIX + key);
      if (!raw) return null;
      const { v } = JSON.parse(atob(raw));
      return v;
    } catch { return null; }
  },
  remove(key) {
    try { sessionStorage.removeItem(_KEY_PREFIX + key); } catch { /* ignore */ }
  },
  clear() {
    try {
      Object.keys(sessionStorage)
        .filter((k) => k.startsWith(_KEY_PREFIX))
        .forEach((k) => sessionStorage.removeItem(k));
    } catch { /* ignore */ }
  },
};

// ── Nonce / random helpers ────────────────────────────────────

export function generateNonce(bytes = 16) {
  const arr = new Uint8Array(bytes);
  crypto.getRandomValues(arr);
  return btoa(String.fromCharCode(...arr));
}

export function generateId() {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 9)}`;
}

// ── URL / redirect safety ─────────────────────────────────────

const SAFE_ORIGINS = [window.location.origin];

/**
 * Returns sanitized redirect path — only same-origin relative paths allowed.
 */
export function safeRedirect(path) {
  if (!path || typeof path !== 'string') return '/';
  const cleaned = sanitize(path);
  if (/^https?:\/\//i.test(cleaned)) {
    try {
      const url = new URL(cleaned);
      if (!SAFE_ORIGINS.includes(url.origin)) return '/';
      return url.pathname + url.search;
    } catch { return '/'; }
  }
  if (!cleaned.startsWith('/')) return '/';
  return cleaned.split('#')[0].slice(0, 200);
}

// ── Honeypot field helper ─────────────────────────────────────

/**
 * Returns props for a honeypot (anti-bot) hidden field.
 * If the field is filled, the request is from a bot.
 */
export function honeypotProps(name = '_hp') {
  return {
    name,
    tabIndex: -1,
    autoComplete: 'off',
    'aria-hidden': true,
    style: { position: 'absolute', left: '-9999px', opacity: 0, pointerEvents: 'none' },
  };
}

export function isHoneypotFilled(formData, name = '_hp') {
  return Boolean(formData[name]);
}
