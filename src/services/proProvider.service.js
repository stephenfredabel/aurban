import api from './api.js';
import { supabase, isSupabaseConfigured } from '../lib/supabase.js';

/**
 * Pro Provider service — Provider profiles, stats, verification
 * All methods return { success, data?, error? }
 */

// ── Get provider profile ──────────────────────────────────────

export async function getProProviderProfile(providerId) {
  if (isSupabaseConfigured()) {
    try {
      const { data, error } = await supabase
        .from('pro_providers')
        .select('*')
        .eq('id', providerId)
        .single();
      if (!error) return { success: true, provider: data };
    } catch { /* fall through to api.js */ }
  }

  try {
    const data = await api.get(`/pro/providers/${providerId}`, { dedup: true });
    return { success: true, provider: data };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

// ── Update provider profile ───────────────────────────────────

export async function updateProProviderProfile(providerId, payload) {
  if (isSupabaseConfigured()) {
    try {
      const { data, error } = await supabase
        .from('pro_providers')
        .update(payload)
        .eq('id', providerId)
        .select()
        .single();
      if (!error) return { success: true, provider: data };
    } catch { /* fall through to api.js */ }
  }

  try {
    const data = await api.put(`/pro/providers/${providerId}`, payload);
    return { success: true, provider: data };
  } catch (err) {
    return { success: false, error: err.data?.message || err.message };
  }
}

// ── Get provider stats ────────────────────────────────────────

export async function getProProviderStats(providerId) {
  if (isSupabaseConfigured()) {
    try {
      // Aggregate stats from bookings and reviews
      const [bookingsRes, reviewsRes] = await Promise.all([
        supabase.from('pro_bookings').select('status, price', { count: 'exact' }).eq('provider_id', providerId),
        supabase.from('pro_listing_reviews').select('rating', { count: 'exact' }).eq('provider_id', providerId),
      ]);

      if (!bookingsRes.error && !reviewsRes.error) {
        const bookings = bookingsRes.data || [];
        const reviews = reviewsRes.data || [];
        const completed = bookings.filter(b => ['completed', 'paid'].includes(b.status));
        const avgRating = reviews.length
          ? reviews.reduce((sum, r) => sum + (r.rating || 0), 0) / reviews.length
          : 0;

        return {
          success: true,
          stats: {
            totalBookings: bookingsRes.count || 0,
            completedBookings: completed.length,
            totalEarnings: completed.reduce((sum, b) => sum + (b.price || 0), 0),
            avgRating: Math.round(avgRating * 10) / 10,
            reviewCount: reviewsRes.count || 0,
          },
        };
      }
    } catch { /* fall through to api.js */ }
  }

  try {
    const data = await api.get(`/pro/providers/${providerId}/stats`, { dedup: true });
    return { success: true, stats: data };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

// ── Submit for verification ───────────────────────────────────

export async function submitForVerification(providerId, { documents, certifications } = {}) {
  if (isSupabaseConfigured()) {
    try {
      const { data, error } = await supabase
        .from('provider_verification')
        .insert({
          provider_id: providerId,
          documents: documents || [],
          certifications: certifications || [],
          status: 'pending',
        })
        .select()
        .single();
      if (!error) return { success: true, verification: data };
    } catch { /* fall through to api.js */ }
  }

  try {
    const data = await api.post(`/pro/providers/${providerId}/verify`, {
      documents, certifications,
    });
    return { success: true, ...data };
  } catch (err) {
    return { success: false, error: err.data?.message || err.message };
  }
}

// ── Get provider reviews ──────────────────────────────────────

export async function getProProviderReviews(providerId, { page = 1, limit = 10 } = {}) {
  if (isSupabaseConfigured()) {
    try {
      const offset = (page - 1) * limit;
      const { data, error, count } = await supabase
        .from('pro_listing_reviews')
        .select('*', { count: 'exact' })
        .eq('provider_id', providerId)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);
      if (!error) return { success: true, reviews: data, total: count, page };
    } catch { /* fall through to api.js */ }
  }

  try {
    const data = await api.get(`/pro/providers/${providerId}/reviews`, { params: { page, limit } });
    return { success: true, ...data };
  } catch (err) {
    return { success: false, error: err.message, reviews: [], total: 0 };
  }
}

// ── Get provider availability ─────────────────────────────────

export async function getProProviderAvailability(providerId) {
  if (isSupabaseConfigured()) {
    try {
      const { data, error } = await supabase
        .from('pro_providers')
        .select('id, availability')
        .eq('id', providerId)
        .single();
      if (!error) return { success: true, availability: data?.availability || {} };
    } catch { /* fall through to api.js */ }
  }

  try {
    const data = await api.get(`/pro/providers/${providerId}/availability`, { dedup: true });
    return { success: true, availability: data };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

// ── Update provider availability ──────────────────────────────

export async function updateProProviderAvailability(providerId, availability) {
  if (isSupabaseConfigured()) {
    try {
      const { data, error } = await supabase
        .from('pro_providers')
        .update({ availability })
        .eq('id', providerId)
        .select('id, availability')
        .single();
      if (!error) return { success: true, availability: data?.availability || {} };
    } catch { /* fall through to api.js */ }
  }

  try {
    const data = await api.put(`/pro/providers/${providerId}/availability`, { availability });
    return { success: true, availability: data };
  } catch (err) {
    return { success: false, error: err.data?.message || err.message };
  }
}
