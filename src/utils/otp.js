// ─────────────────────────────────────────────────────────────
// OTP generation / verification helpers for Aurban Pro
// ─────────────────────────────────────────────────────────────
import { OTP_CONFIG } from '../data/proConstants.js';

/** Generate a random N-digit OTP code (default 6 digits) */
export function generateOTPCode(length = OTP_CONFIG.length) {
  const digits = '0123456789';
  let code = '';
  for (let i = 0; i < length; i++) {
    code += digits.charAt(Math.floor(Math.random() * digits.length));
  }
  return code;
}

/** Create a full OTP object with expiry and attempt tracking */
export function createOTPRecord(bookingId) {
  const code = generateOTPCode();
  return {
    bookingId,
    code,
    createdAt: new Date().toISOString(),
    expiresAt: new Date(Date.now() + OTP_CONFIG.expiryMinutes * 60_000).toISOString(),
    attempts: 0,
    maxAttempts: OTP_CONFIG.maxAttempts,
    verified: false,
  };
}

/** Check if an OTP record has expired */
export function isOTPExpired(otp) {
  return new Date(otp.expiresAt) < new Date();
}

/** Check if max attempts have been reached */
export function isOTPLocked(otp) {
  return otp.attempts >= otp.maxAttempts;
}

/** Verify an OTP code against the record */
export function verifyOTPCode(otp, inputCode) {
  if (otp.verified) return { valid: false, reason: 'Already used' };
  if (isOTPExpired(otp)) return { valid: false, reason: 'Code expired' };
  if (isOTPLocked(otp)) return { valid: false, reason: 'Too many attempts' };
  if (otp.code !== inputCode) return { valid: false, reason: 'Incorrect code' };
  return { valid: true, reason: null };
}

/** Format remaining time as MM:SS */
export function formatOTPCountdown(expiresAt) {
  const ms = new Date(expiresAt) - Date.now();
  if (ms <= 0) return '00:00';
  const mins = Math.floor(ms / 60_000);
  const secs = Math.floor((ms % 60_000) / 1000);
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}
