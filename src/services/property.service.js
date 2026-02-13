import api from './api.js';

/**
 * Property service
 * CRUD + search + wishlist sync
 */

export async function getProperties({ page = 1, limit = 20, ...filters } = {}) {
  try {
    const data = await api.get('/properties', { params: { page, limit, ...filters } });
    return { success: true, ...data };
  } catch (err) {
    return { success: false, error: err.message, properties: [], total: 0 };
  }
}

export async function getProperty(id) {
  try {
    const data = await api.get(`/properties/${id}`, { dedup: true });
    return { success: true, property: data };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

export async function createProperty(payload) {
  try {
    const data = await api.post('/properties', payload);
    return { success: true, property: data };
  } catch (err) {
    return { success: false, error: err.data?.message || err.message };
  }
}

export async function updateProperty(id, payload) {
  try {
    const data = await api.patch(`/properties/${id}`, payload);
    return { success: true, property: data };
  } catch (err) {
    return { success: false, error: err.data?.message || err.message };
  }
}

export async function deleteProperty(id) {
  try {
    await api.delete(`/properties/${id}`);
    return { success: true };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

export async function searchProperties(query, filters = {}) {
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
  try {
    const data = await api.get('/properties/featured', { dedup: true });
    return { success: true, properties: data.properties || [] };
  } catch (err) {
    return { success: false, error: err.message, properties: [] };
  }
}

export async function getSimilar(propertyId, limit = 4) {
  try {
    const data = await api.get(`/properties/${propertyId}/similar`, { params: { limit } });
    return { success: true, properties: data.properties || [] };
  } catch (err) {
    return { success: false, properties: [] };
  }
}

// ── Wishlist ──────────────────────────────────────────────────

export async function syncWishlist(ids) {
  try {
    const data = await api.put('/user/wishlist', { propertyIds: ids });
    return { success: true, ...data };
  } catch (err) {
    return { success: false, error: err.message };
  }
}