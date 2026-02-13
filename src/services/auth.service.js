import api, { ApiError } from './api.js';

/**
 * Auth service
 * All methods return { success, data?, error? }
 * Session stored in sessionStorage under 'aurban_session'
 */

// ── Session helpers ───────────────────────────────────────────

export function getSession() {
  try {
    const raw = sessionStorage.getItem('aurban_session');
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function saveSession(session) {
  sessionStorage.setItem('aurban_session', JSON.stringify(session));
}

export function clearSession() {
  sessionStorage.removeItem('aurban_session');
}

// ── Auth methods ──────────────────────────────────────────────

/**
 * Register a new user
 * @param {{ email, password, name, phone, phonePrefix, countryCode, role }} payload
 */
export async function register(payload) {
  try {
    const data = await api.post('/auth/register', {
      email:       payload.email?.toLowerCase().trim(),
      password:    payload.password,
      name:        payload.name?.trim(),
      phone:       payload.phone,
      phonePrefix: payload.phonePrefix || '+234',
      countryCode: payload.countryCode || 'NG',
      role:        payload.role || 'user',
    });
    if (data.token) saveSession(data);
    return { success: true, data };
  } catch (err) {
    return { success: false, error: err.data?.message || err.message };
  }
}

/**
 * Login with email + password
 * Rate-limit friendly: does not throw on 429, returns error message instead
 */
export async function login(email, password) {
  try {
    const data = await api.post('/auth/login', {
      email:    email?.toLowerCase().trim(),
      password,
    });
    if (data.token) saveSession(data);
    return { success: true, data };
  } catch (err) {
    if (err.status === 429) {
      return { success: false, error: 'Too many attempts. Please wait a few minutes.', rateLimited: true };
    }
    return { success: false, error: err.data?.message || err.message };
  }
}

/**
 * OAuth (Google / Apple) — receives token from provider redirect
 */
export async function oauthLogin(provider, token) {
  try {
    const data = await api.post('/auth/oauth', { provider, token });
    if (data.token) saveSession(data);
    return { success: true, data };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

/**
 * Logout — clears session and calls server to invalidate token
 */
export async function logout() {
  try {
    await api.post('/auth/logout', {});
  } catch { /* Ignore — clear session regardless */ }
  clearSession();
  return { success: true };
}

/**
 * Send OTP to phone number
 * @param {{ phonePrefix, phone, countryCode }} payload
 */
export async function sendOTP(payload) {
  try {
    await api.post('/auth/otp/send', payload);
    return { success: true };
  } catch (err) {
    if (err.status === 429) {
      return { success: false, error: 'OTP limit reached. Try again in 10 minutes.', rateLimited: true };
    }
    return { success: false, error: err.message };
  }
}

/**
 * Verify OTP code
 * @param {{ phone, code }} payload
 */
export async function verifyOTP(phone, code) {
  try {
    const data = await api.post('/auth/otp/verify', { phone, code });
    return { success: true, data };
  } catch (err) {
    return { success: false, error: err.data?.message || 'Invalid or expired code.' };
  }
}

/**
 * Send password reset email
 */
export async function forgotPassword(email) {
  try {
    await api.post('/auth/password/forgot', { email: email?.toLowerCase().trim() });
    return { success: true };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

/**
 * Reset password with token from email link
 */
export async function resetPassword(token, newPassword) {
  try {
    await api.post('/auth/password/reset', { token, password: newPassword });
    return { success: true };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

/**
 * Get current user profile (re-hydrate after page refresh)
 */
export async function getMe() {
  try {
    const data = await api.get('/auth/me', { dedup: true });
    return { success: true, data };
  } catch (err) {
    if (err.status === 401) clearSession();
    return { success: false, error: err.message };
  }
}

/**
 * Update user profile fields
 */
export async function updateProfile(fields) {
  try {
    const data = await api.patch('/auth/me', fields);
    // Merge into session
    const session = getSession();
    if (session) saveSession({ ...session, user: { ...session.user, ...data } });
    return { success: true, data };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

/**
 * Change password (while logged in)
 */
export async function changePassword(currentPassword, newPassword) {
  try {
    await api.post('/auth/password/change', { currentPassword, newPassword });
    return { success: true };
  } catch (err) {
    return { success: false, error: err.data?.message || err.message };
  }
}