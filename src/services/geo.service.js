import api from './api.js';

/**
 * Geo service
 * Location data — states, areas, geocoding
 * All methods return { success, data?, error? }
 */

// ── States / Regions ─────────────────────────────────────────

export async function getStates(countryCode = 'NG') {
  try {
    const data = await api.get('/geo/states', { params: { country: countryCode }, dedup: true });
    return { success: true, states: data.states || [] };
  } catch (err) {
    return { success: false, error: err.message, states: [] };
  }
}

export async function getAreas(stateCode) {
  try {
    const data = await api.get('/geo/areas', { params: { state: stateCode }, dedup: true });
    return { success: true, areas: data.areas || [] };
  } catch (err) {
    return { success: false, error: err.message, areas: [] };
  }
}

// ── Geocoding ────────────────────────────────────────────────

export async function geocode(address) {
  try {
    const data = await api.get('/geo/geocode', { params: { address }, dedup: true });
    return { success: true, ...data };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

export async function reverseGeocode(lat, lng) {
  try {
    const data = await api.get('/geo/reverse', { params: { lat, lng }, dedup: true });
    return { success: true, ...data };
  } catch (err) {
    return { success: false, error: err.message };
  }
}
