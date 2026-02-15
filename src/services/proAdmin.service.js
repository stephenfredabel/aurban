import api from './api.js';

/**
 * Pro Admin Service
 * Admin-level API wrapper for Aurban Pro operations:
 * escrow overrides, safety monitoring, rectification rulings,
 * provider verification, and system configuration.
 * All methods return { success, data?, error? }
 */

// ── Pro Escrow Management ─────────────────────────────────────

export async function getProEscrowStats() {
  try {
    const data = await api.get('/admin/pro/escrow/stats');
    return { success: true, ...data };
  } catch (err) {
    return { success: false, error: err.message, stats: null };
  }
}

export async function getProEscrows({ page = 1, limit = 20, status, tier, search } = {}) {
  try {
    const data = await api.get('/admin/pro/escrow', { params: { page, limit, status, tier, search } });
    return { success: true, ...data };
  } catch (err) {
    return { success: false, error: err.message, escrows: [], total: 0 };
  }
}

export async function releaseProEscrow(escrowId, { amount, reason }) {
  try {
    const data = await api.post(`/admin/pro/escrow/${escrowId}/release`, { amount, reason });
    return { success: true, ...data };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

export async function freezeProEscrow(escrowId, { reason }) {
  try {
    const data = await api.post(`/admin/pro/escrow/${escrowId}/freeze`, { reason });
    return { success: true, ...data };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

export async function refundProEscrow(escrowId, { amount, reason, refundTo }) {
  try {
    const data = await api.post(`/admin/pro/escrow/${escrowId}/refund`, { amount, reason, refundTo });
    return { success: true, ...data };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

// ── Pro Safety Monitoring ─────────────────────────────────────

export async function getActiveSOSAlerts({ page = 1, limit = 20 } = {}) {
  try {
    const data = await api.get('/admin/pro/safety/sos', { params: { page, limit } });
    return { success: true, ...data };
  } catch (err) {
    return { success: false, error: err.message, alerts: [], total: 0 };
  }
}

export async function resolveSOSAlert(alertId, { resolution, notes }) {
  try {
    const data = await api.post(`/admin/pro/safety/sos/${alertId}/resolve`, { resolution, notes });
    return { success: true, ...data };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

export async function getSafetyIncidents({ page = 1, limit = 20, status } = {}) {
  try {
    const data = await api.get('/admin/pro/safety/incidents', { params: { page, limit, status } });
    return { success: true, ...data };
  } catch (err) {
    return { success: false, error: err.message, incidents: [], total: 0 };
  }
}

export async function freezeBooking(bookingId, { reason }) {
  try {
    const data = await api.post(`/admin/pro/safety/freeze/${bookingId}`, { reason });
    return { success: true, ...data };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

// ── Pro Rectification Management ──────────────────────────────

export async function getProRectifications({ page = 1, limit = 20, status, priority } = {}) {
  try {
    const data = await api.get('/admin/pro/rectification', { params: { page, limit, status, priority } });
    return { success: true, ...data };
  } catch (err) {
    return { success: false, error: err.message, rectifications: [], total: 0 };
  }
}

export async function getRectificationDetail(rectId) {
  try {
    const data = await api.get(`/admin/pro/rectification/${rectId}`);
    return { success: true, rectification: data };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

export async function issueRectificationRuling(rectId, { ruling, notes, refundAmount }) {
  try {
    const data = await api.post(`/admin/pro/rectification/${rectId}/ruling`, { ruling, notes, refundAmount });
    return { success: true, ...data };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

// ── Pro Provider Verification ─────────────────────────────────

export async function getVerificationQueue({ page = 1, limit = 20, status } = {}) {
  try {
    const data = await api.get('/admin/pro/verification', { params: { page, limit, status } });
    return { success: true, ...data };
  } catch (err) {
    return { success: false, error: err.message, providers: [], total: 0 };
  }
}

export async function approveProvider(providerId, { level, notes }) {
  try {
    const data = await api.post(`/admin/pro/verification/${providerId}/approve`, { level, notes });
    return { success: true, ...data };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

export async function rejectProvider(providerId, { reason }) {
  try {
    const data = await api.post(`/admin/pro/verification/${providerId}/reject`, { reason });
    return { success: true, ...data };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

export async function suspendProvider(providerId, { reason, duration }) {
  try {
    const data = await api.post(`/admin/pro/verification/${providerId}/suspend`, { reason, duration });
    return { success: true, ...data };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

// ── Pro System Configuration ──────────────────────────────────

export async function getProConfig() {
  try {
    const data = await api.get('/admin/pro/config');
    return { success: true, config: data };
  } catch (err) {
    return { success: false, error: err.message, config: null };
  }
}

export async function updateProConfig(updates) {
  try {
    const data = await api.put('/admin/pro/config', updates);
    return { success: true, config: data };
  } catch (err) {
    return { success: false, error: err.message };
  }
}
