import api from './api.js';
import { supabase, isSupabaseConfigured } from '../lib/supabase.js';

/**
 * Booking service
 * CRUD + status management for inspections & appointments
 * All methods return { success, data?, error? }
 */

// -- List bookings --

export async function getBookings({ page = 1, limit = 20, status, role } = {}) {
  if (isSupabaseConfigured()) {
    try {
      const offset = (page - 1) * limit;
      let query = supabase.from('bookings').select('*', { count: 'exact' });
      if (status) query = query.eq('status', status);
      if (role) query = query.eq('role', role);
      const { data, error, count } = await query.range(offset, offset + limit - 1);
      if (!error) return { success: true, bookings: data, total: count, page };
    } catch { /* fall through to api.js */ }
  }

  try {
    const data = await api.get('/bookings', { params: { page, limit, status, role } });
    return { success: true, ...data };
  } catch (err) {
    return { success: false, error: err.message, bookings: [], total: 0 };
  }
}

// -- Single booking --

export async function getBooking(id) {
  if (isSupabaseConfigured()) {
    try {
      const { data, error } = await supabase.from('bookings').select('*').eq('id', id).single();
      if (!error) return { success: true, booking: data };
    } catch { /* fall through to api.js */ }
  }

  try {
    const data = await api.get(`/bookings/${id}`, { dedup: true });
    return { success: true, booking: data };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

// -- Create booking --

export async function createBooking(payload) {
  if (isSupabaseConfigured()) {
    try {
      const { data, error } = await supabase.from('bookings').insert(payload).select().single();
      if (!error) return { success: true, booking: data };
    } catch { /* fall through to api.js */ }
  }

  try {
    const data = await api.post('/bookings', payload);
    return { success: true, booking: data };
  } catch (err) {
    return { success: false, error: err.data?.message || err.message };
  }
}

// -- Update status --

export async function updateBookingStatus(id, status) {
  if (isSupabaseConfigured()) {
    try {
      const { data, error } = await supabase.from('bookings').update({ status }).eq('id', id).select().single();
      if (!error) return { success: true, booking: data };
    } catch { /* fall through to api.js */ }
  }

  try {
    const data = await api.patch(`/bookings/${id}/status`, { status });
    return { success: true, booking: data };
  } catch (err) {
    return { success: false, error: err.data?.message || err.message };
  }
}

// -- Cancel booking --

export async function cancelBooking(id, reason) {
  if (isSupabaseConfigured()) {
    try {
      const { data, error } = await supabase
        .from('bookings')
        .update({ status: 'cancelled', cancel_reason: reason })
        .eq('id', id)
        .select()
        .single();
      if (!error) return { success: true, booking: data };
    } catch { /* fall through to api.js */ }
  }

  try {
    const data = await api.post(`/bookings/${id}/cancel`, { reason });
    return { success: true, booking: data };
  } catch (err) {
    return { success: false, error: err.message };
  }
}
