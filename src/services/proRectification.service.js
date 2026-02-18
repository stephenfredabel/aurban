import api from './api.js';
import { supabase, isSupabaseConfigured } from '../lib/supabase.js';

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
  if (isSupabaseConfigured()) {
    try {
      const { data, error } = await supabase
        .from('pro_rectifications')
        .insert({
          booking_id: bookingId,
          category,
          description,
          photos: photos || [],
          status: 'reported',
          reporter_id: (await supabase.auth.getUser()).data?.user?.id,
        })
        .select()
        .single();
      if (!error) return { success: true, issue: data };
    } catch { /* fall through to api.js */ }
  }

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
  if (isSupabaseConfigured()) {
    try {
      const { data, error } = await supabase
        .from('pro_rectifications')
        .select('*')
        .eq('id', issueId)
        .single();
      if (!error) return { success: true, issue: data };
    } catch { /* fall through to api.js */ }
  }

  try {
    const data = await api.get(`/pro/rectification/${issueId}`, { dedup: true });
    return { success: true, issue: data };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

// ── Get issues for a booking ──────────────────────────────────

export async function getBookingIssues(bookingId) {
  if (isSupabaseConfigured()) {
    try {
      const { data, error } = await supabase
        .from('pro_rectifications')
        .select('*')
        .eq('booking_id', bookingId)
        .order('created_at', { ascending: false });
      if (!error) return { success: true, issues: data };
    } catch { /* fall through to api.js */ }
  }

  try {
    const data = await api.get(`/pro/rectification/booking/${bookingId}`, { dedup: true });
    return { success: true, issues: data };
  } catch (err) {
    return { success: false, error: err.message, issues: [] };
  }
}

// ── Provider responds to issue ────────────────────────────────

export async function providerRespondToIssue(issueId, { response, fixDate } = {}) {
  if (isSupabaseConfigured()) {
    try {
      const { data, error } = await supabase
        .from('pro_rectifications')
        .update({
          provider_response: response,
          fix_date: fixDate || null,
          status: 'fix_scheduled',
        })
        .eq('id', issueId)
        .select()
        .single();
      if (!error) return { success: true, issue: data };
    } catch { /* fall through to api.js */ }
  }

  try {
    const data = await api.post(`/pro/rectification/${issueId}/respond`, { response, fixDate });
    return { success: true, issue: data };
  } catch (err) {
    return { success: false, error: err.data?.message || err.message };
  }
}

// ── Confirm fix complete ──────────────────────────────────────

export async function confirmFixComplete(issueId, { notes, photos } = {}) {
  if (isSupabaseConfigured()) {
    try {
      const { data, error } = await supabase
        .from('pro_rectifications')
        .update({
          fix_notes: notes,
          fix_photos: photos || [],
          status: 'fix_complete',
        })
        .eq('id', issueId)
        .select()
        .single();
      if (!error) return { success: true, issue: data };
    } catch { /* fall through to api.js */ }
  }

  try {
    const data = await api.post(`/pro/rectification/${issueId}/fix-complete`, { notes, photos });
    return { success: true, issue: data };
  } catch (err) {
    return { success: false, error: err.data?.message || err.message };
  }
}

// ── Client confirms resolution ────────────────────────────────

export async function confirmResolution(issueId) {
  if (isSupabaseConfigured()) {
    try {
      const { data, error } = await supabase
        .from('pro_rectifications')
        .update({ status: 'resolved' })
        .eq('id', issueId)
        .select()
        .single();
      if (!error) return { success: true, issue: data };
    } catch { /* fall through to api.js */ }
  }

  try {
    const data = await api.post(`/pro/rectification/${issueId}/resolve`);
    return { success: true, issue: data };
  } catch (err) {
    return { success: false, error: err.data?.message || err.message };
  }
}

// ── Escalate to admin ─────────────────────────────────────────

export async function escalateIssue(issueId, { reason } = {}) {
  if (isSupabaseConfigured()) {
    try {
      const { data, error } = await supabase
        .from('pro_rectifications')
        .update({ status: 'escalated', ruling_notes: reason })
        .eq('id', issueId)
        .select()
        .single();
      if (!error) return { success: true, issue: data };
    } catch { /* fall through to api.js */ }
  }

  try {
    const data = await api.post(`/pro/rectification/${issueId}/escalate`, { reason });
    return { success: true, issue: data };
  } catch (err) {
    return { success: false, error: err.data?.message || err.message };
  }
}

// ── Admin: List all issues ────────────────────────────────────

export async function getAllIssues({ page = 1, limit = 20, status } = {}) {
  if (isSupabaseConfigured()) {
    try {
      const offset = (page - 1) * limit;
      let query = supabase.from('pro_rectifications').select('*', { count: 'exact' });
      if (status) query = query.eq('status', status);
      const { data, error, count } = await query.order('created_at', { ascending: false }).range(offset, offset + limit - 1);
      if (!error) return { success: true, issues: data, total: count, page };
    } catch { /* fall through to api.js */ }
  }

  try {
    const data = await api.get('/pro/rectification', { params: { page, limit, status } });
    return { success: true, ...data };
  } catch (err) {
    return { success: false, error: err.message, issues: [], total: 0 };
  }
}

// ── Admin: Rule on escalated issue ────────────────────────────

export async function adminRuleOnIssue(issueId, { ruling, refundAmount, notes } = {}) {
  if (isSupabaseConfigured()) {
    try {
      const { data, error } = await supabase
        .from('pro_rectifications')
        .update({
          ruling,
          refund_amount: refundAmount || 0,
          ruling_notes: notes,
          status: 'resolved',
          ruled_by: (await supabase.auth.getUser()).data?.user?.id,
        })
        .eq('id', issueId)
        .select()
        .single();
      if (!error) return { success: true, issue: data };
    } catch { /* fall through to api.js */ }
  }

  try {
    const data = await api.post(`/pro/rectification/${issueId}/admin-rule`, {
      ruling, refundAmount, notes,
    });
    return { success: true, issue: data };
  } catch (err) {
    return { success: false, error: err.data?.message || err.message };
  }
}
