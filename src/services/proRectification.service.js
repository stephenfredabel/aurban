import api from './api.js';

/**
 * Pro Rectification service — Fix-it-first dispute resolution
 *
 * Flow: report → provider notified → fix scheduled → fix in progress →
 *       fix complete → mini-observation → resolved
 *       └── escalated (if provider refuses or fix fails)
 *
 * All methods return { success, data?, error? }
 */

// ── Report issue ──────────────────────────────────────────────

export async function reportIssue(bookingId, { category, description, photos } = {}) {
  try {
    const data = await api.post(`/pro/rectification/report`, {
      bookingId, category, description, photos,
    });
    return { success: true, issue: data };
  } catch (err) {
    return { success: false, error: err.data?.message || err.message };
  }
}

// ── Get issue status ──────────────────────────────────────────

export async function getIssueStatus(issueId) {
  try {
    const data = await api.get(`/pro/rectification/${issueId}`, { dedup: true });
    return { success: true, issue: data };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

// ── Get issues for a booking ──────────────────────────────────

export async function getBookingIssues(bookingId) {
  try {
    const data = await api.get(`/pro/rectification/booking/${bookingId}`, { dedup: true });
    return { success: true, issues: data };
  } catch (err) {
    return { success: false, error: err.message, issues: [] };
  }
}

// ── Provider responds to issue ────────────────────────────────

export async function providerRespondToIssue(issueId, { response, fixDate } = {}) {
  try {
    const data = await api.post(`/pro/rectification/${issueId}/respond`, { response, fixDate });
    return { success: true, issue: data };
  } catch (err) {
    return { success: false, error: err.data?.message || err.message };
  }
}

// ── Confirm fix complete ──────────────────────────────────────

export async function confirmFixComplete(issueId, { notes, photos } = {}) {
  try {
    const data = await api.post(`/pro/rectification/${issueId}/fix-complete`, { notes, photos });
    return { success: true, issue: data };
  } catch (err) {
    return { success: false, error: err.data?.message || err.message };
  }
}

// ── Client confirms resolution ────────────────────────────────

export async function confirmResolution(issueId) {
  try {
    const data = await api.post(`/pro/rectification/${issueId}/resolve`);
    return { success: true, issue: data };
  } catch (err) {
    return { success: false, error: err.data?.message || err.message };
  }
}

// ── Escalate to admin ─────────────────────────────────────────

export async function escalateIssue(issueId, { reason } = {}) {
  try {
    const data = await api.post(`/pro/rectification/${issueId}/escalate`, { reason });
    return { success: true, issue: data };
  } catch (err) {
    return { success: false, error: err.data?.message || err.message };
  }
}

// ── Admin: List all issues ────────────────────────────────────

export async function getAllIssues({ page = 1, limit = 20, status } = {}) {
  try {
    const data = await api.get('/pro/rectification', { params: { page, limit, status } });
    return { success: true, ...data };
  } catch (err) {
    return { success: false, error: err.message, issues: [], total: 0 };
  }
}

// ── Admin: Rule on escalated issue ────────────────────────────

export async function adminRuleOnIssue(issueId, { ruling, refundAmount, notes } = {}) {
  try {
    const data = await api.post(`/pro/rectification/${issueId}/admin-rule`, {
      ruling, refundAmount, notes,
    });
    return { success: true, issue: data };
  } catch (err) {
    return { success: false, error: err.data?.message || err.message };
  }
}
