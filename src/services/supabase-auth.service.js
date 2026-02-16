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
    if (error) return { success: false, error: error.message };
    return { success: true, data: { user: data.user, session: data.session } };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

export async function signInWithEmail(email, password) {
  const g = guard(); if (g) return g;
  try {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return { success: false, error: error.message };
    return { success: true, data: { user: data.user, session: data.session } };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

// ── OAuth (Google) ──────────────────────────────────────────

export async function signInWithGoogle() {
  const g = guard(); if (g) return g;
  try {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/` },
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
