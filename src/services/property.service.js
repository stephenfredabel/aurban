import api from './api.js';
import { supabase, isSupabaseConfigured } from '../lib/supabase.js';

/**
 * Property service
 * CRUD + search + wishlist sync
 */

export async function getProperties({ page = 1, limit = 20, ...filters } = {}) {
  if (isSupabaseConfigured()) {
    try {
      const offset = (page - 1) * limit;
      let query = supabase.from('properties').select('*', { count: 'exact' });
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) query = query.eq(key, value);
      });
      const { data, error, count } = await query.range(offset, offset + limit - 1);
      if (!error) return { success: true, properties: data, total: count, page };
    } catch { /* fall through to api.js */ }
  }

  try {
    const data = await api.get('/properties', { params: { page, limit, ...filters } });
    return { success: true, ...data };
  } catch (err) {
    return { success: false, error: err.message, properties: [], total: 0 };
  }
}

export async function getProperty(id) {
  if (isSupabaseConfigured()) {
    try {
      const { data, error } = await supabase.from('properties').select('*').eq('id', id).single();
      if (!error) return { success: true, property: data };
    } catch { /* fall through to api.js */ }
  }

  try {
    const data = await api.get(`/properties/${id}`, { dedup: true });
    return { success: true, property: data };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

export async function createProperty(payload) {
  if (isSupabaseConfigured()) {
    try {
      const { data, error } = await supabase.from('properties').insert(payload).select().single();
      if (!error) return { success: true, property: data };
    } catch { /* fall through to api.js */ }
  }

  try {
    const data = await api.post('/properties', payload);
    return { success: true, property: data };
  } catch (err) {
    return { success: false, error: err.data?.message || err.message };
  }
}

export async function updateProperty(id, payload) {
  if (isSupabaseConfigured()) {
    try {
      const { data, error } = await supabase.from('properties').update(payload).eq('id', id).select().single();
      if (!error) return { success: true, property: data };
    } catch { /* fall through to api.js */ }
  }

  try {
    const data = await api.patch(`/properties/${id}`, payload);
    return { success: true, property: data };
  } catch (err) {
    return { success: false, error: err.data?.message || err.message };
  }
}

export async function deleteProperty(id) {
  if (isSupabaseConfigured()) {
    try {
      const { error } = await supabase.from('properties').delete().eq('id', id);
      if (!error) return { success: true };
    } catch { /* fall through to api.js */ }
  }

  try {
    await api.delete(`/properties/${id}`);
    return { success: true };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

export async function searchProperties(query, filters = {}) {
  if (isSupabaseConfigured()) {
    try {
      let q = supabase.from('properties').select('*', { count: 'exact' });
      if (query) q = q.ilike('title', `%${query}%`);
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) q = q.eq(key, value);
      });
      const { data, error, count } = await q;
      if (!error) return { success: true, results: data, total: count };
    } catch { /* fall through to api.js */ }
  }

  try {
    const data = await api.get('/properties/search', {
      params: { q: query, ...filters },
    });
    return { success: true, ...data };
  } catch (err) {
    return { success: false, error: err.message, results: [] };
  }
}

export async function getFeatured() {
  if (isSupabaseConfigured()) {
    try {
      const { data, error } = await supabase.from('properties').select('*').eq('featured', true).limit(10);
      if (!error) return { success: true, properties: data || [] };
    } catch { /* fall through to api.js */ }
  }

  try {
    const data = await api.get('/properties/featured', { dedup: true });
    return { success: true, properties: data.properties || [] };
  } catch (err) {
    return { success: false, error: err.message, properties: [] };
  }
}

export async function getSimilar(propertyId, limit = 4) {
  if (isSupabaseConfigured()) {
    try {
      // Get the property first to find similar ones by type/location
      const { data: prop } = await supabase.from('properties').select('type, city, state').eq('id', propertyId).single();
      if (prop) {
        const { data, error } = await supabase
          .from('properties')
          .select('*')
          .neq('id', propertyId)
          .or(`type.eq.${prop.type},city.eq.${prop.city}`)
          .limit(limit);
        if (!error) return { success: true, properties: data || [] };
      }
    } catch { /* fall through to api.js */ }
  }

  try {
    const data = await api.get(`/properties/${propertyId}/similar`, { params: { limit } });
    return { success: true, properties: data.properties || [] };
  } catch (err) {
    return { success: false, properties: [] };
  }
}

// -- Wishlist --

export async function syncWishlist(ids) {
  if (isSupabaseConfigured()) {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        // Delete existing wishlist entries for this user
        await supabase.from('wishlists').delete().eq('user_id', user.id);
        // Insert new wishlist entries
        if (ids.length > 0) {
          const rows = ids.map(propertyId => ({ user_id: user.id, property_id: propertyId }));
          const { error } = await supabase.from('wishlists').insert(rows);
          if (!error) return { success: true, propertyIds: ids };
        } else {
          return { success: true, propertyIds: [] };
        }
      }
    } catch { /* fall through to api.js */ }
  }

  try {
    const data = await api.put('/user/wishlist', { propertyIds: ids });
    return { success: true, ...data };
  } catch (err) {
    return { success: false, error: err.message };
  }
}
