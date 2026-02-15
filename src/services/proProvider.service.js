import api from './api.js';

/**
 * Pro Provider service — Provider profiles, stats, verification
 * All methods return { success, data?, error? }
 */

// ── Get provider profile ──────────────────────────────────────

export async function getProProviderProfile(providerId) {
  try {
    const data = await api.get(`/pro/providers/${providerId}`, { dedup: true });
    return { success: true, provider: data };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

// ── Update provider profile ───────────────────────────────────

export async function updateProProviderProfile(providerId, payload) {
  try {
    const data = await api.put(`/pro/providers/${providerId}`, payload);
    return { success: true, provider: data };
  } catch (err) {
    return { success: false, error: err.data?.message || err.message };
  }
}

// ── Get provider stats ────────────────────────────────────────

export async function getProProviderStats(providerId) {
  try {
    const data = await api.get(`/pro/providers/${providerId}/stats`, { dedup: true });
    return { success: true, stats: data };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

// ── Submit for verification ───────────────────────────────────

export async function submitForVerification(providerId, { documents, certifications } = {}) {
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
  try {
    const data = await api.get(`/pro/providers/${providerId}/reviews`, { params: { page, limit } });
    return { success: true, ...data };
  } catch (err) {
    return { success: false, error: err.message, reviews: [], total: 0 };
  }
}

// ── Get provider availability ─────────────────────────────────

export async function getProProviderAvailability(providerId) {
  try {
    const data = await api.get(`/pro/providers/${providerId}/availability`, { dedup: true });
    return { success: true, availability: data };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

// ── Update provider availability ──────────────────────────────

export async function updateProProviderAvailability(providerId, availability) {
  try {
    const data = await api.put(`/pro/providers/${providerId}/availability`, { availability });
    return { success: true, availability: data };
  } catch (err) {
    return { success: false, error: err.data?.message || err.message };
  }
}
