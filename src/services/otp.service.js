import { supabase, isSupabaseConfigured } from '../lib/supabase.js';

/* ════════════════════════════════════════════════════════════
   OTP SERVICE — Email (Supabase) + Phone/WhatsApp (Termii)

   Email OTP:
   • Uses Supabase native email OTP (via Brevo SMTP)
   • signUp() sends confirmation email with 6-digit code
   • verifyOtp({ type: 'signup', email, token }) confirms

   Phone/WhatsApp OTP:
   • Calls Supabase Edge Function `termii-otp`
   • Edge function proxies to Termii API (key stored server-side)
   • Returns pinId for verification
════════════════════════════════════════════════════════════ */

// ── Email OTP ──────────────────────────────────────────────

/**
 * Send email OTP for an existing user (resend confirmation)
 * Supabase resends the confirmation email with a new 6-digit code
 */
export async function sendEmailOTP(email) {
  if (!isSupabaseConfigured()) {
    return { success: true, mock: true };
  }
  try {
    const { error } = await supabase.auth.resend({
      type: 'signup',
      email,
    });
    if (error) return { success: false, error: error.message };
    return { success: true };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

/**
 * Verify the 6-digit email OTP code from the confirmation email
 */
export async function verifyEmailOTP(email, token) {
  if (!isSupabaseConfigured()) {
    // Mock mode: accept '123456'
    return token === '123456'
      ? { success: true, verified: true }
      : { success: false, error: 'Invalid code' };
  }
  try {
    const { data, error } = await supabase.auth.verifyOtp({
      email,
      token,
      type: 'signup',
    });
    if (error) return { success: false, error: error.message };
    return { success: true, verified: true, data };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

// ── Phone / WhatsApp OTP (via Termii Edge Function) ────────

/**
 * Send SMS or WhatsApp OTP to a phone number
 * @param {string} phone   — Full international format (+234xxx)
 * @param {'generic'|'whatsapp'} channel — SMS or WhatsApp
 * @returns {{ success, pinId?, error? }}
 */
export async function sendPhoneOTP(phone, channel = 'generic') {
  if (!isSupabaseConfigured()) {
    return { success: true, pinId: 'mock_pin_' + Date.now(), mock: true };
  }
  try {
    const { data, error } = await supabase.functions.invoke('termii-otp', {
      body: { action: 'send', phone, channel },
    });
    if (error) return { success: false, error: error.message || 'Failed to send OTP' };
    if (data?.success) return { success: true, pinId: data.pinId };
    return { success: false, error: data?.error || 'Failed to send OTP' };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

/**
 * Verify a phone OTP code
 * @param {string} pinId — The pinId from sendPhoneOTP
 * @param {string} pin   — The 6-digit code
 * @returns {{ success, verified?, error? }}
 */
export async function verifyPhoneOTP(pinId, pin) {
  if (!isSupabaseConfigured()) {
    return pin === '123456'
      ? { success: true, verified: true }
      : { success: false, error: 'Invalid code' };
  }
  try {
    const { data, error } = await supabase.functions.invoke('termii-otp', {
      body: { action: 'verify', pinId, pin },
    });
    if (error) return { success: false, error: error.message || 'Verification failed' };
    if (data?.success) return { success: true, verified: true };
    return { success: false, error: data?.error || 'Invalid or expired code' };
  } catch (err) {
    return { success: false, error: err.message };
  }
}
