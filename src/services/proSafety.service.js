import api from './api.js';

/**
 * Pro Safety service — OTP handshake, GPS verification, SOS, masked comms
 * All methods return { success, data?, error? }
 */

// ═══════════════════════════════════════════════
// OTP
// ═══════════════════════════════════════════════

/** Generate OTP for a booking (sent to client) */
export async function generateOTP(bookingId) {
  try {
    const data = await api.post(`/pro/safety/otp/generate`, { bookingId });
    return { success: true, ...data };
  } catch (err) {
    return { success: false, error: err.data?.message || err.message };
  }
}

/** Provider submits OTP for verification */
export async function verifyOTP(bookingId, otp) {
  try {
    const data = await api.post(`/pro/safety/otp/verify`, { bookingId, otp });
    return { success: true, ...data };
  } catch (err) {
    return { success: false, error: err.data?.message || err.message };
  }
}

/** Get OTP status for a booking */
export async function getOTPStatus(bookingId) {
  try {
    const data = await api.get(`/pro/safety/otp/${bookingId}`, { dedup: true });
    return { success: true, ...data };
  } catch (err) {
    return { success: false, error: err.message };
  }
}


// ═══════════════════════════════════════════════
// GPS VERIFICATION
// ═══════════════════════════════════════════════

/** Verify provider is within radius of job location */
export async function verifyProviderLocation(bookingId, { lat, lng }) {
  try {
    const data = await api.post(`/pro/safety/gps/verify`, { bookingId, lat, lng });
    return { success: true, ...data };
  } catch (err) {
    return { success: false, error: err.data?.message || err.message };
  }
}

/** Get location verification status */
export async function getLocationStatus(bookingId) {
  try {
    const data = await api.get(`/pro/safety/gps/${bookingId}`, { dedup: true });
    return { success: true, ...data };
  } catch (err) {
    return { success: false, error: err.message };
  }
}


// ═══════════════════════════════════════════════
// SOS / EMERGENCY
// ═══════════════════════════════════════════════

/** Trigger SOS alert for an active booking */
export async function triggerSOS(bookingId, { reason, lat, lng } = {}) {
  try {
    const data = await api.post(`/pro/safety/sos/trigger`, { bookingId, reason, lat, lng });
    return { success: true, ...data };
  } catch (err) {
    return { success: false, error: err.data?.message || err.message };
  }
}

/** Get all active SOS alerts (admin) */
export async function getActiveSOSAlerts() {
  try {
    const data = await api.get('/pro/safety/sos/active', { dedup: true });
    return { success: true, alerts: data };
  } catch (err) {
    return { success: false, error: err.message, alerts: [] };
  }
}

/** Resolve an SOS alert (admin) */
export async function resolveSOSAlert(alertId, { resolution, notes } = {}) {
  try {
    const data = await api.post(`/pro/safety/sos/${alertId}/resolve`, { resolution, notes });
    return { success: true, ...data };
  } catch (err) {
    return { success: false, error: err.data?.message || err.message };
  }
}


// ═══════════════════════════════════════════════
// MASKED CONTACTS
// ═══════════════════════════════════════════════

/** Get masked phone number for a booking participant */
export async function getMaskedPhone(bookingId, role) {
  try {
    const data = await api.get(`/pro/safety/masked-phone/${bookingId}`, { params: { role } });
    return { success: true, phone: data.phone };
  } catch (err) {
    return { success: false, error: err.message };
  }
}
