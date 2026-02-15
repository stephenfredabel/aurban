import api from './api.js';
import { supabase, isSupabaseConfigured } from '../lib/supabase.js';

/**
 * Relocation service
 * Provider directory + quote management for relocation marketplace
 * All methods return { success, data?, error? }
 */

// -- List providers --

export async function getProviders({ page = 1, limit = 20, serviceType, state, minRating } = {}) {
  if (isSupabaseConfigured()) {
    try {
      const offset = (page - 1) * limit;
      let query = supabase.from('relocation_providers').select('*', { count: 'exact' });
      if (serviceType) query = query.eq('service_type', serviceType);
      if (state) query = query.eq('state', state);
      if (minRating) query = query.gte('rating', minRating);
      const { data, error, count } = await query.range(offset, offset + limit - 1);
      if (!error) return { success: true, providers: data, total: count, page };
    } catch { /* fall through to api.js */ }
  }

  try {
    const data = await api.get('/relocation/providers', {
      params: { page, limit, serviceType, state, minRating },
    });
    return { success: true, ...data };
  } catch (err) {
    return { success: false, error: err.message, providers: [], total: 0 };
  }
}

// -- Single provider --

export async function getProvider(id) {
  if (isSupabaseConfigured()) {
    try {
      const { data, error } = await supabase.from('relocation_providers').select('*').eq('id', id).single();
      if (!error) return { success: true, provider: data };
    } catch { /* fall through to api.js */ }
  }

  try {
    const data = await api.get(`/relocation/providers/${id}`, { dedup: true });
    return { success: true, provider: data };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

// -- Request a quote --

export async function requestQuote(payload) {
  if (isSupabaseConfigured()) {
    try {
      const { data, error } = await supabase.from('relocation_quotes').insert(payload).select().single();
      if (!error) return { success: true, quote: data };
    } catch { /* fall through to api.js */ }
  }

  try {
    const data = await api.post('/relocation/quotes', payload);
    return { success: true, quote: data };
  } catch (err) {
    return { success: false, error: err.data?.message || err.message };
  }
}

// -- List quotes --

export async function getQuotes({ page = 1, limit = 20 } = {}) {
  if (isSupabaseConfigured()) {
    try {
      const offset = (page - 1) * limit;
      const { data, error, count } = await supabase
        .from('relocation_quotes')
        .select('*', { count: 'exact' })
        .range(offset, offset + limit - 1);
      if (!error) return { success: true, quotes: data, total: count, page };
    } catch { /* fall through to api.js */ }
  }

  try {
    const data = await api.get('/relocation/quotes', { params: { page, limit } });
    return { success: true, ...data };
  } catch (err) {
    return { success: false, error: err.message, quotes: [], total: 0 };
  }
}
