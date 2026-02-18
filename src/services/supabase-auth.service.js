import { supabase, isSupabaseConfigured } from '../lib/supabase.js';

/**
 * Supabase Auth service — wraps Supabase auth methods
 * All methods return { success, data?, error? }
 * Falls back to { success: false } when Supabase not configured
 */

const guard = () => {
  if (!isSupabaseConfigured()) return { success: false, error: 'Supabase not configured' };
  return null;
};

// ── Email/Password ──────────────────────────────────────────

export async function signUpWithEmail({ email, password, name, phone, whatsapp, role, countryCode, accountType }) {
  const g = guard(); if (g) return g;
  try {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          name,
          phone: phone || whatsapp || '',
          whatsapp: whatsapp || phone || '',
          role: role || 'user',
          countryCode: countryCode || 'NG',
          accountType: accountType || 'individual',
        },
      },
    });
    if (error) return { success: false, error: friendlyAuthError(error.message) };
    // Supabase silently returns null user when email already exists (prevents enumeration).
    // Surface this as a friendly error so the user knows to log in instead.
    if (!data?.user) {
      return { success: false, error: 'An account with this email already exists. Please log in instead.' };
    }
    return { success: true, data: { user: data.user, session: data.session } };
  } catch (err) {
    return { success: false, error: friendlyAuthError(err.message) };
  }
}

/** Map raw Supabase / network error messages to something readable. */
function friendlyAuthError(msg = '') {
  const m = msg.toLowerCase();
  if (m.includes('already registered') || m.includes('already exists'))
    return 'An account with this email already exists. Please log in instead.';
  if (m.includes('rate limit') || m.includes('429') || m.includes('too many'))
    return 'Too many attempts. Please wait a moment and try again.';
  if (m.includes('invalid email'))
    return 'Please enter a valid email address.';
  if (m.includes('password') && m.includes('short'))
    return 'Password must be at least 6 characters.';
  if (/5\d\d/.test(m) || m.includes('service unavailable') || m.includes('server error')
      || m.includes('http version') || m.includes('failed to fetch'))
    return 'Service temporarily unavailable. Please check your connection and try again.';
  return msg || 'Something went wrong. Please try again.';
}

export async function signInWithEmail(email, password) {
  const g = guard(); if (g) return g;
  try {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return { success: false, error: friendlyAuthError(error.message) };
    return { success: true, data: { user: data.user, session: data.session } };
  } catch (err) {
    return { success: false, error: friendlyAuthError(err.message) };
  }
}

// ── OAuth (Google) ──────────────────────────────────────────

/**
 * Sign in with Google OAuth.
 * @param {Object} options
 * @param {string} options.redirectTo - Where to redirect after login (default: '/')
 * @param {string} options.role - Role to assign if new user (default: 'user')
 */
export async function signInWithGoogle({ redirectTo, role } = {}) {
  const g = guard(); if (g) return g;
  try {
    const targetPath = redirectTo || '/';
    const targetRole = role || 'user';

    // Store intended role and redirect path in sessionStorage
    // AuthContext will read these after OAuth callback
    sessionStorage.setItem('aurban_oauth_role', targetRole);
    sessionStorage.setItem('aurban_oauth_redirect', targetPath);

    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}${targetPath}` },
    });
    if (error) return { success: false, error: error.message };
    return { success: true, data };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

// ── Phone OTP ───────────────────────────────────────────────

export async function signInWithOTP(phone) {
  const g = guard(); if (g) return g;
  try {
    const { data, error } = await supabase.auth.signInWithOtp({ phone });
    if (error) return { success: false, error: error.message };
    return { success: true, data };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

export async function verifyOTP(phone, token) {
  const g = guard(); if (g) return g;
  try {
    const { data, error } = await supabase.auth.verifyOtp({ phone, token, type: 'sms' });
    if (error) return { success: false, error: error.message };
    return { success: true, data: { user: data.user, session: data.session } };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

// ── Magic Link ──────────────────────────────────────────────

export async function signInWithMagicLink(email) {
  const g = guard(); if (g) return g;
  try {
    const { data, error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: `${window.location.origin}/` },
    });
    if (error) return { success: false, error: error.message };
    return { success: true, data };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

// ── Password Reset ──────────────────────────────────────────

export async function resetPassword(email) {
  const g = guard(); if (g) return g;
  try {
    const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    if (error) return { success: false, error: error.message };
    return { success: true, data };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

export async function updatePassword(newPassword) {
  const g = guard(); if (g) return g;
  try {
    const { data, error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) return { success: false, error: error.message };
    return { success: true, data };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

// ── Profile ─────────────────────────────────────────────────

export async function getProfile(userId) {
  const g = guard(); if (g) return g;
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();
    if (error) return { success: false, error: error.message };
    return {
      success: true,
      data: {
        id:                  data.id,
        name:                data.name,
        email:               data.email,
        phone:               data.phone,
        whatsapp:            data.whatsapp || data.phone,
        role:                data.role,
        avatar:              data.avatar,
        verified:            data.verified,
        verificationStatus:  data.verification_status || (data.verified ? 'approved' : 'unverified'),
        emailVerified:       data.email_verified ?? false,
        whatsappVerified:    data.whatsapp_verified ?? false,
        tier:                data.tier,
        accountType:         data.account_type,
        countryCode:         data.country_code,
        location:            data.location || '',
        settings:            data.settings || {},
      },
    };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

export async function updateProfile(userId, updates) {
  const g = guard(); if (g) return g;
  try {
    const dbUpdates = {};
    if (updates.name !== undefined)               dbUpdates.name = updates.name;
    if (updates.phone !== undefined)              dbUpdates.phone = updates.phone;
    if (updates.whatsapp !== undefined)            dbUpdates.whatsapp = updates.whatsapp;
    if (updates.avatar !== undefined)             dbUpdates.avatar = updates.avatar;
    if (updates.bio !== undefined)                dbUpdates.bio = updates.bio;
    if (updates.countryCode !== undefined)        dbUpdates.country_code = updates.countryCode;
    if (updates.tier !== undefined)               dbUpdates.tier = updates.tier;
    if (updates.accountType !== undefined)        dbUpdates.account_type = updates.accountType;
    if (updates.verificationStatus !== undefined) dbUpdates.verification_status = updates.verificationStatus;
    if (updates.whatsappVerified !== undefined)   dbUpdates.whatsapp_verified = updates.whatsappVerified;
    if (updates.settings !== undefined)          dbUpdates.settings = updates.settings;
    if (updates.location !== undefined)          dbUpdates.location = updates.location;

    const { data, error } = await supabase
      .from('profiles')
      .update(dbUpdates)
      .eq('id', userId)
      .select()
      .single();
    if (error) return { success: false, error: error.message };
    return { success: true, data };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

// ── Sign Out ────────────────────────────────────────────────

export async function signOut() {
  const g = guard(); if (g) return g;
  try {
    const { error } = await supabase.auth.signOut();
    if (error) return { success: false, error: error.message };
    return { success: true };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

// ── Session helpers ─────────────────────────────────────────

export async function getSession() {
  const g = guard(); if (g) return g;
  try {
    const { data, error } = await supabase.auth.getSession();
    if (error) return { success: false, error: error.message };
    return { success: true, data: data.session };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

export function onAuthStateChange(callback) {
  if (!isSupabaseConfigured()) return { data: { subscription: { unsubscribe: () => {} } } };
  return supabase.auth.onAuthStateChange(callback);
}