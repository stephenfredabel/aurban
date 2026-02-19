import api from './api.js';
import { supabase, isSupabaseConfigured } from '../lib/supabase.js';

/**
 * Pro Safety service — OTP handshake, GPS verification, SOS, masked comms
 * All methods return { success, data?, error? }
 */

// ═══════════════════════════════════════════════
// OTP
// ═══════════════════════════════════════════════

/** Generate OTP for a booking (sent to client) */
export async function generateOTP(bookingId) {
  if (isSupabaseConfigured()) {
    try {
      const otp = String(Math.floor(100000 + Math.random() * 900000));
      const expiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString(); // 15 min
      const { error } = await supabase
        .from('pro_bookings')
        .update({ otp, otp_expires_at: expiresAt })
        .eq('id', bookingId);
      if (!error) return { success: true, otp, expiresAt };
    } catch { /* fall through to api.js */ }
  }

  try {
    const data = await api.post(`/pro/safety/otp/generate`, { bookingId });
    return { success: true, ...data };
  } catch (err) {
    return { success: false, error: err.data?.message || err.message };
  }
}

/** Provider submits OTP for verification */
export async function verifyOTP(bookingId, otp) {
  if (isSupabaseConfigured()) {
    try {
      const { data, error } = await supabase
        .from('pro_bookings')
        .select('otp, otp_expires_at')
        .eq('id', bookingId)
        .single();
      if (!error && data) {
        if (data.otp === otp && new Date(data.otp_expires_at) > new Date()) {
          await supabase.from('pro_bookings').update({ otp: null, otp_expires_at: null, checked_in_at: new Date().toISOString() }).eq('id', bookingId);
          return { success: true, verified: true };
        }
        return { success: false, error: 'Invalid or expired OTP.' };
      }
    } catch { /* fall through to api.js */ }
  }

  try {
    const data = await api.post(`/pro/safety/otp/verify`, { bookingId, otp });
    return { success: true, ...data };
  } catch (err) {
    return { success: false, error: err.data?.message || err.message };
  }
}

/** Get OTP status for a booking */
export async function getOTPStatus(bookingId) {
  if (isSupabaseConfigured()) {
    try {
      const { data, error } = await supabase
        .from('pro_bookings')
        .select('otp, otp_expires_at, checked_in_at')
        .eq('id', bookingId)
        .single();
      if (!error) {
        return {
          success: true,
          hasOTP: !!data.otp,
          checkedIn: !!data.checked_in_at,
          expired: data.otp_expires_at ? new Date(data.otp_expires_at) < new Date() : false,
        };
      }
    } catch { /* fall through to api.js */ }
  }

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
  if (isSupabaseConfigured()) {
    try {
      const { data, error } = await supabase
        .from('pro_bookings')
        .select('location')
        .eq('id', bookingId)
        .single();
      if (!error && data?.location) {
        const loc = typeof data.location === 'string' ? JSON.parse(data.location) : data.location;
        const distance = haversineDistance(lat, lng, loc.lat, loc.lng);
        const withinRadius = distance <= 0.5; // 500m radius
        return { success: true, verified: withinRadius, distance: Math.round(distance * 1000) };
      }
    } catch { /* fall through to api.js */ }
  }

  try {
    const data = await api.post(`/pro/safety/gps/verify`, { bookingId, lat, lng });
    return { success: true, ...data };
  } catch (err) {
    return { success: false, error: err.data?.message || err.message };
  }
}

/** Get location verification status */
export async function getLocationStatus(bookingId) {
  if (isSupabaseConfigured()) {
    try {
      const { data, error } = await supabase
        .from('pro_bookings')
        .select('location, checked_in_at')
        .eq('id', bookingId)
        .single();
      if (!error) {
        return {
          success: true,
          hasLocation: !!data.location,
          checkedIn: !!data.checked_in_at,
        };
      }
    } catch { /* fall through to api.js */ }
  }

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
  if (isSupabaseConfigured()) {
    try {
      const { data, error } = await supabase
        .from('sos_alerts')
        .insert({ booking_id: bookingId, triggered_by: 'client', reason, lat, lng, status: 'active' })
        .select()
        .single();
      if (!error) return { success: true, alert: data };
    } catch { /* fall through to api.js */ }
  }

  try {
    const data = await api.post(`/pro/safety/sos/trigger`, { bookingId, reason, lat, lng });
    return { success: true, ...data };
  } catch (err) {
    return { success: false, error: err.data?.message || err.message };
  }
}

/** Get all active SOS alerts (admin) */
export async function getActiveSOSAlerts() {
  if (isSupabaseConfigured()) {
    try {
      const { data, error } = await supabase
        .from('sos_alerts')
        .select('*')
        .in('status', ['active', 'responding'])
        .order('created_at', { ascending: false });
      if (!error) return { success: true, alerts: data };
    } catch { /* fall through to api.js */ }
  }

  try {
    const data = await api.get('/pro/safety/sos/active', { dedup: true });
    return { success: true, alerts: data };
  } catch (err) {
    return { success: false, error: err.message, alerts: [] };
  }
}

/** Resolve an SOS alert (admin) */
export async function resolveSOSAlert(alertId, { resolution, notes } = {}) {
  if (isSupabaseConfigured()) {
    try {
      const { data, error } = await supabase
        .from('sos_alerts')
        .update({ status: 'resolved', resolution, notes, resolved_at: new Date().toISOString() })
        .eq('id', alertId)
        .select()
        .single();
      if (!error) return { success: true, alert: data };
    } catch { /* fall through to api.js */ }
  }

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
  if (isSupabaseConfigured()) {
    try {
      // Fetch the phone we want to mask
      const { data, error } = await supabase
        .from('pro_bookings')
        .select('client_phone, provider_id')
        .eq('id', bookingId)
        .single();
      if (!error && data) {
        const phone = data.client_phone || '';
        const masked = phone.length > 4
          ? phone.slice(0, 4) + '****' + phone.slice(-2)
          : '****';
        return { success: true, phone: masked };
      }
    } catch { /* fall through to api.js */ }
  }

  try {
    const data = await api.get(`/pro/safety/masked-phone/${bookingId}`, { params: { role } });
    return { success: true, phone: data.phone };
  } catch (err) {
    return { success: false, error: err.message };
  }
}


// ═══════════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════════

/** Haversine distance in km between two lat/lng pairs */
function haversineDistance(lat1, lng1, lat2, lng2) {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}
