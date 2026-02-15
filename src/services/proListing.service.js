import api from './api.js';
import { supabase, isSupabaseConfigured } from '../lib/supabase.js';

/**
 * Pro Listing service -- Service listing CRUD
 * All methods return { success, data?, error? }
 */

// -- List all Pro services (public browse) --

export async function getProListings({ page = 1, limit = 20, category, tier, state, sort, search } = {}) {
  if (isSupabaseConfigured()) {
    try {
      const offset = (page - 1) * limit;
      let query = supabase.from('pro_listings').select('*', { count: 'exact' });
      if (category) query = query.eq('category', category);
      if (tier) query = query.eq('tier', tier);
      if (state) query = query.eq('state', state);
      if (search) query = query.ilike('title', `%${search}%`);
      if (sort) query = query.order(sort, { ascending: false });
      const { data, error, count } = await query.range(offset, offset + limit - 1);
      if (!error) return { success: true, listings: data, total: count, page };
    } catch { /* fall through to api.js */ }
  }

  try {
    const data = await api.get('/pro/listings', {
      params: { page, limit, category, tier, state, sort, search },
    });
    return { success: true, ...data };
  } catch (err) {
    return { success: false, error: err.message, listings: [], total: 0 };
  }
}

// -- Single listing detail --

export async function getProListing(id) {
  if (isSupabaseConfigured()) {
    try {
      const { data, error } = await supabase.from('pro_listings').select('*').eq('id', id).single();
      if (!error) return { success: true, listing: data };
    } catch { /* fall through to api.js */ }
  }

  try {
    const data = await api.get(`/pro/listings/${id}`, { dedup: true });
    return { success: true, listing: data };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

// -- Create listing (provider) --

export async function createProListing(payload) {
  if (isSupabaseConfigured()) {
    try {
      const { data, error } = await supabase.from('pro_listings').insert(payload).select().single();
      if (!error) return { success: true, listing: data };
    } catch { /* fall through to api.js */ }
  }

  try {
    const data = await api.post('/pro/listings', payload);
    return { success: true, listing: data };
  } catch (err) {
    return { success: false, error: err.data?.message || err.message };
  }
}

// -- Update listing --

export async function updateProListing(id, payload) {
  if (isSupabaseConfigured()) {
    try {
      const { data, error } = await supabase.from('pro_listings').update(payload).eq('id', id).select().single();
      if (!error) return { success: true, listing: data };
    } catch { /* fall through to api.js */ }
  }

  try {
    const data = await api.put(`/pro/listings/${id}`, payload);
    return { success: true, listing: data };
  } catch (err) {
    return { success: false, error: err.data?.message || err.message };
  }
}

// -- Delete listing --

export async function deleteProListing(id) {
  if (isSupabaseConfigured()) {
    try {
      const { error } = await supabase.from('pro_listings').delete().eq('id', id);
      if (!error) return { success: true };
    } catch { /* fall through to api.js */ }
  }

  try {
    await api.delete(`/pro/listings/${id}`);
    return { success: true };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

// -- Toggle listing active/inactive --

export async function toggleProListing(id, active) {
  if (isSupabaseConfigured()) {
    try {
      const { data, error } = await supabase.from('pro_listings').update({ active }).eq('id', id).select().single();
      if (!error) return { success: true, listing: data };
    } catch { /* fall through to api.js */ }
  }

  try {
    const data = await api.patch(`/pro/listings/${id}/toggle`, { active });
    return { success: true, listing: data };
  } catch (err) {
    return { success: false, error: err.data?.message || err.message };
  }
}

// -- Get listings by provider --

export async function getProListingsByProvider(providerId, { page = 1, limit = 50 } = {}) {
  if (isSupabaseConfigured()) {
    try {
      const offset = (page - 1) * limit;
      const { data, error, count } = await supabase
        .from('pro_listings')
        .select('*', { count: 'exact' })
        .eq('provider_id', providerId)
        .range(offset, offset + limit - 1);
      if (!error) return { success: true, listings: data, total: count, page };
    } catch { /* fall through to api.js */ }
  }

  try {
    const data = await api.get(`/pro/listings/provider/${providerId}`, { params: { page, limit } });
    return { success: true, ...data };
  } catch (err) {
    return { success: false, error: err.message, listings: [], total: 0 };
  }
}

// -- Get featured listings (home / landing) --

export async function getFeaturedProListings(limit = 6) {
  if (isSupabaseConfigured()) {
    try {
      const { data, error } = await supabase
        .from('pro_listings')
        .select('*')
        .eq('featured', true)
        .limit(limit);
      if (!error) return { success: true, listings: data || [] };
    } catch { /* fall through to api.js */ }
  }

  try {
    const data = await api.get('/pro/listings/featured', { params: { limit } });
    return { success: true, listings: data };
  } catch (err) {
    return { success: false, error: err.message, listings: [] };
  }
}
