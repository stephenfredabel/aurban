/**
 * Aurban base API client
 * - Automatic auth token injection
 * - Request deduplication
 * - Retry with exponential back-off (network errors only)
 * - Structured error responses
 * - Abort-controller support
 *
 * NOTE: When Supabase is configured, this client is NOT used for data.
 * All service files hit Supabase directly via the JS client.
 * This file only serves as a fallback for local/mock development
 * when VITE_API_URL is set to a custom backend.
 */

import { isSupabaseConfigured } from '../lib/supabase.js';

// Use a dedicated API URL if provided, otherwise null (no fallback API)
const BASE_URL = import.meta.env.VITE_API_URL || null;
const TIMEOUT_MS = 15_000;

// In-flight request registry (for dedup / abort)
const _inFlight = new Map();

// ── Helpers ──────────────────────────────────────────────────

function getToken() {
  try {
    const session = sessionStorage.getItem('aurban_session');
    return session ? JSON.parse(session).token : null;
  } catch {
    return null;
  }
}

function buildHeaders(extra = {}) {
  const headers = {
    'Content-Type': 'application/json',
    'Accept':       'application/json',
    'X-Client':     'aurban-web',
    ...extra,
  };
  const token = getToken();
  if (token) headers['Authorization'] = `Bearer ${token}`;
  return headers;
}

class ApiError extends Error {
  constructor(message, status, data = {}) {
    super(message);
    this.name   = 'ApiError';
    this.status = status;
    this.data   = data;
  }
}

/**
 * Sanitise server error messages before exposing to UI.
 */
function sanitizeErrorMessage(msg) {
  if (!msg || typeof msg !== 'string') return 'Request failed';
  let clean = msg
    .replace(/\/admin\/[^\s'"]*/gi, '[redacted]')
    .replace(/\/ax7-internal[^\s'"]*/gi, '[redacted]')
    .replace(/\/internal\/[^\s'"]*/gi, '[redacted]')
    .replace(/https?:\/\/[a-z0-9-]+\.aurban\.com[^\s'"]*/gi, '[redacted]')
    .replace(/https?:\/\/[a-z0-9-]+\.supabase\.co[^\s'"]*/gi, '[redacted]')
    .replace(/at\s+\S+\s+\(.*:\d+:\d+\)/g, '')
    .replace(/\/usr\/|\/var\/|\/home\/|C:\\|D:\\/gi, '[redacted]')
    .replace(/node_modules\/[^\s'"]*/g, '[redacted]');
  if (clean.replace(/\[redacted\]/g, '').trim().length < 3) {
    return 'Request failed';
  }
  return clean.trim();
}

async function parseResponse(res) {
  const contentType = res.headers.get('content-type') || '';
  if (contentType.includes('application/json')) {
    const body = await res.json();
    if (!res.ok) {
      throw new ApiError(
        sanitizeErrorMessage(body.message) || 'Request failed',
        res.status,
        body,
      );
    }
    return body;
  }
  if (!res.ok) throw new ApiError(sanitizeErrorMessage(res.statusText) || 'Request failed', res.status);
  return res.text();
}

// ── Core request ─────────────────────────────────────────────

async function request(method, path, {
  body,
  params,
  headers  = {},
  retry    = 2,
  signal,
  dedup    = false,
} = {}) {
  // When Supabase is configured and no separate API URL is set,
  // don't make fallback requests — return empty data gracefully.
  // All real data flows through the Supabase JS client in service files.
  if (!BASE_URL) {
    console.warn(`[api.js] No API backend configured. Skipping ${method} ${path}`);
    return { data: [], conversations: [], messages: [], total: 0 };
  }

  // Build URL
  const url = new URL(`${BASE_URL}${path}`);
  if (params) {
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== null) url.searchParams.set(k, v);
    });
  }

  const key = `${method}:${url.toString()}`;

  // Dedup: return existing promise for identical in-flight GET
  if (dedup && method === 'GET' && _inFlight.has(key)) {
    return _inFlight.get(key);
  }

  const controller = new AbortController();
  const timeout    = setTimeout(() => controller.abort(), TIMEOUT_MS);
  const abortSignal = signal
    ? AbortSignal.any([signal, controller.signal])
    : controller.signal;

  const fetchOptions = {
    method,
    headers: buildHeaders(headers),
    signal:  abortSignal,
  };
  if (body && method !== 'GET' && method !== 'HEAD') {
    fetchOptions.body = body instanceof FormData ? body : JSON.stringify(body);
    if (body instanceof FormData) delete fetchOptions.headers['Content-Type'];
  }

  const attempt = async (triesLeft) => {
    try {
      const res = await fetch(url.toString(), fetchOptions);
      return await parseResponse(res);
    } catch (err) {
      if (err instanceof ApiError) throw err;
      if (err.name === 'AbortError')  throw err;
      if (triesLeft > 0) {
        await new Promise((r) => setTimeout(r, (retry - triesLeft + 1) * 800));
        return attempt(triesLeft - 1);
      }
      throw new ApiError(sanitizeErrorMessage(err.message) || 'Network error', 0);
    } finally {
      clearTimeout(timeout);
    }
  };

  const promise = attempt(retry).finally(() => _inFlight.delete(key));
  if (dedup && method === 'GET') _inFlight.set(key, promise);
  return promise;
}

// ── Public API ───────────────────────────────────────────────

const api = {
  get:    (path, opts = {}) => request('GET',    path, { ...opts, dedup: opts.dedup ?? true }),
  post:   (path, body, opts = {}) => request('POST',   path, { ...opts, body }),
  put:    (path, body, opts = {}) => request('PUT',    path, { ...opts, body }),
  patch:  (path, body, opts = {}) => request('PATCH',  path, { ...opts, body }),
  delete: (path, opts = {})  => request('DELETE', path, opts),
};

export default api;
export { ApiError };