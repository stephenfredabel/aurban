import api from './api.js';
import { supabase, isSupabaseConfigured } from '../lib/supabase.js';

/**
 * Pro Booking service -- Service booking lifecycle
 * All methods return { success, data?, error? }
 *
 * Flow: create -> confirm -> provider_confirm -> en_route ->
 *       check_in (OTP) -> in_progress -> complete -> observation -> paid -> completed
 */

// -- List bookings --

export async function getProBookings({ page = 1, limit = 20, status, role, category } = {}) {
  if (isSupabaseConfigured()) {
    try {
      const offset = (page - 1) * limit;
      let query = supabase.from('pro_bookings').select('*', { count: 'exact' });
      if (status) query = query.eq('status', status);
      if (role) query = query.eq('role', role);
      if (category) query = query.eq('category', category);
      const { data, error, count } = await query.range(offset, offset + limit - 1);
      if (!error) return { success: true, bookings: data, total: count, page };
    } catch { /* fall through to api.js */ }
  }

  try {
    const data = await api.get('/pro/bookings', { params: { page, limit, status, role, category } });
    return { success: true, ...data };
  } catch (err) {
    return { success: false, error: err.message, bookings: [], total: 0 };
  }
}

// -- Single booking --

export async function getProBooking(id) {
  if (isSupabaseConfigured()) {
    try {
      const { data, error } = await supabase.from('pro_bookings').select('*').eq('id', id).single();
      if (!error) return { success: true, booking: data };
    } catch { /* fall through to api.js */ }
  }

  try {
    const data = await api.get(`/pro/bookings/${id}`, { dedup: true });
    return { success: true, booking: data };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

// -- Create booking --

export async function createProBooking(payload) {
  if (isSupabaseConfigured()) {
    try {
      const { data, error } = await supabase.from('pro_bookings').insert(payload).select().single();
      if (!error) return { success: true, booking: data };
    } catch { /* fall through to api.js */ }
  }

  try {
    const data = await api.post('/pro/bookings', payload);
    return { success: true, booking: data };
  } catch (err) {
    return { success: false, error: err.data?.message || err.message };
  }
}

// -- Update booking status --

export async function updateProBookingStatus(id, status, meta = {}) {
  if (isSupabaseConfigured()) {
    try {
      const { data, error } = await supabase
        .from('pro_bookings')
        .update({ status, ...meta })
        .eq('id', id)
        .select()
        .single();
      if (!error) return { success: true, booking: data };
    } catch { /* fall through to api.js */ }
  }

  try {
    const data = await api.patch(`/pro/bookings/${id}/status`, { status, ...meta });
    return { success: true, booking: data };
  } catch (err) {
    return { success: false, error: err.data?.message || err.message };
  }
}

// -- Cancel booking --

export async function cancelProBooking(id, reason) {
  if (isSupabaseConfigured()) {
    try {
      const { data, error } = await supabase
        .from('pro_bookings')
        .update({ status: 'cancelled', cancel_reason: reason })
        .eq('id', id)
        .select()
        .single();
      if (!error) return { success: true, booking: data };
    } catch { /* fall through to api.js */ }
  }

  try {
    const data = await api.post(`/pro/bookings/${id}/cancel`, { reason });
    return { success: true, booking: data };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

// -- Provider confirms booking --

export async function confirmProBooking(id) {
  if (isSupabaseConfigured()) {
    try {
      const { data, error } = await supabase
        .from('pro_bookings')
        .update({ status: 'provider_confirmed', confirmed_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();
      if (!error) return { success: true, booking: data };
    } catch { /* fall through to api.js */ }
  }

  try {
    const data = await api.post(`/pro/bookings/${id}/provider-confirm`);
    return { success: true, booking: data };
  } catch (err) {
    return { success: false, error: err.data?.message || err.message };
  }
}

// -- Provider check-in (OTP verified) --

export async function checkInProvider(id, { otp, lat, lng } = {}) {
  if (isSupabaseConfigured()) {
    try {
      const { data, error } = await supabase
        .from('pro_bookings')
        .update({ status: 'checked_in', otp_verified: true, check_in_lat: lat, check_in_lng: lng, checked_in_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();
      if (!error) return { success: true, booking: data };
    } catch { /* fall through to api.js */ }
  }

  try {
    const data = await api.post(`/pro/bookings/${id}/check-in`, { otp, lat, lng });
    return { success: true, booking: data };
  } catch (err) {
    return { success: false, error: err.data?.message || err.message };
  }
}

// -- Provider check-out (work complete) --

export async function checkOutProvider(id, { notes, photos } = {}) {
  if (isSupabaseConfigured()) {
    try {
      const { data, error } = await supabase
        .from('pro_bookings')
        .update({ status: 'checked_out', checkout_notes: notes, checkout_photos: photos, checked_out_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();
      if (!error) return { success: true, booking: data };
    } catch { /* fall through to api.js */ }
  }

  try {
    const data = await api.post(`/pro/bookings/${id}/check-out`, { notes, photos });
    return { success: true, booking: data };
  } catch (err) {
    return { success: false, error: err.data?.message || err.message };
  }
}

// -- Report completion (triggers observation window) --

export async function reportCompletion(id, { notes, beforePhotos, afterPhotos } = {}) {
  if (isSupabaseConfigured()) {
    try {
      const { data, error } = await supabase
        .from('pro_bookings')
        .update({
          status: 'completed',
          completion_notes: notes,
          before_photos: beforePhotos,
          after_photos: afterPhotos,
          completed_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select()
        .single();
      if (!error) return { success: true, booking: data };
    } catch { /* fall through to api.js */ }
  }

  try {
    const data = await api.post(`/pro/bookings/${id}/complete`, { notes, beforePhotos, afterPhotos });
    return { success: true, booking: data };
  } catch (err) {
    return { success: false, error: err.data?.message || err.message };
  }
}

// -- Get booking timeline --

export async function getProBookingTimeline(id) {
  if (isSupabaseConfigured()) {
    try {
      const { data, error } = await supabase
        .from('pro_bookings')
        .select('timeline')
        .eq('id', id)
        .single();
      if (!error) return { success: true, timeline: data?.timeline || [] };
    } catch { /* fall through to api.js */ }
  }

  try {
    const data = await api.get(`/pro/bookings/${id}/timeline`, { dedup: true });
    return { success: true, timeline: data };
  } catch (err) {
    return { success: false, error: err.message, timeline: [] };
  }
}
