import api from './api.js';
import { supabase, isSupabaseConfigured } from '../lib/supabase.js';

/**
 * Pro Admin Service
 * Admin-level API wrapper for Aurban Pro operations:
 * escrow overrides, safety monitoring, rectification rulings,
 * provider verification, and system configuration.
 * All methods return { success, data?, error? }
 */

// ── Pro Escrow Management ─────────────────────────────────────

export async function getProEscrowStats() {
  if (isSupabaseConfigured()) {
    try {
      const { data, error, count } = await supabase
        .from('pro_escrow')
        .select('status, amount', { count: 'exact' });
      if (!error) {
        const rows = data || [];
        const held = rows.filter(r => r.status === 'held');
        const released = rows.filter(r => r.status === 'released');
        const disputed = rows.filter(r => r.status === 'disputed');
        return {
          success: true,
          stats: {
            total: count || 0,
            heldCount: held.length,
            heldAmount: held.reduce((s, r) => s + (r.amount || 0), 0),
            releasedCount: released.length,
            releasedAmount: released.reduce((s, r) => s + (r.amount || 0), 0),
            disputedCount: disputed.length,
          },
        };
      }
    } catch { /* fall through to api.js */ }
  }

  try {
    const data = await api.get('/admin/pro/escrow/stats');
    return { success: true, ...data };
  } catch (err) {
    return { success: false, error: err.message, stats: null };
  }
}

export async function getProEscrows({ page = 1, limit = 20, status, tier, search } = {}) {
  if (isSupabaseConfigured()) {
    try {
      const offset = (page - 1) * limit;
      let query = supabase.from('pro_escrow').select('*, pro_bookings(ref, title, tier, provider_name, client_name)', { count: 'exact' });
      if (status) query = query.eq('status', status);
      if (tier) query = query.eq('pro_bookings.tier', tier);
      if (search) query = query.or(`pro_bookings.provider_name.ilike.%${search}%,pro_bookings.client_name.ilike.%${search}%`);
      const { data, error, count } = await query.order('created_at', { ascending: false }).range(offset, offset + limit - 1);
      if (!error) return { success: true, escrows: data, total: count, page };
    } catch { /* fall through to api.js */ }
  }

  try {
    const data = await api.get('/admin/pro/escrow', { params: { page, limit, status, tier, search } });
    return { success: true, ...data };
  } catch (err) {
    return { success: false, error: err.message, escrows: [], total: 0 };
  }
}

export async function releaseProEscrow(escrowId, { amount, reason }) {
  if (isSupabaseConfigured()) {
    try {
      const { data, error } = await supabase
        .from('pro_escrow')
        .update({ status: 'released', released_amount: amount, release_reason: reason, released_at: new Date().toISOString() })
        .eq('id', escrowId)
        .select()
        .single();
      if (!error) return { success: true, escrow: data };
    } catch { /* fall through to api.js */ }
  }

  try {
    const data = await api.post(`/admin/pro/escrow/${escrowId}/release`, { amount, reason });
    return { success: true, ...data };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

export async function freezeProEscrow(escrowId, { reason }) {
  if (isSupabaseConfigured()) {
    try {
      const { data, error } = await supabase
        .from('pro_escrow')
        .update({ status: 'frozen', freeze_reason: reason })
        .eq('id', escrowId)
        .select()
        .single();
      if (!error) return { success: true, escrow: data };
    } catch { /* fall through to api.js */ }
  }

  try {
    const data = await api.post(`/admin/pro/escrow/${escrowId}/freeze`, { reason });
    return { success: true, ...data };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

export async function refundProEscrow(escrowId, { amount, reason, refundTo }) {
  if (isSupabaseConfigured()) {
    try {
      const { data, error } = await supabase
        .from('pro_escrow')
        .update({ status: 'refunded', refund_amount: amount, refund_reason: reason, refund_to: refundTo })
        .eq('id', escrowId)
        .select()
        .single();
      if (!error) return { success: true, escrow: data };
    } catch { /* fall through to api.js */ }
  }

  try {
    const data = await api.post(`/admin/pro/escrow/${escrowId}/refund`, { amount, reason, refundTo });
    return { success: true, ...data };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

// ── Pro Safety Monitoring ─────────────────────────────────────

export async function getActiveSOSAlerts({ page = 1, limit = 20 } = {}) {
  if (isSupabaseConfigured()) {
    try {
      const offset = (page - 1) * limit;
      const { data, error, count } = await supabase
        .from('sos_alerts')
        .select('*', { count: 'exact' })
        .in('status', ['active', 'responding'])
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);
      if (!error) return { success: true, alerts: data, total: count, page };
    } catch { /* fall through to api.js */ }
  }

  try {
    const data = await api.get('/admin/pro/safety/sos', { params: { page, limit } });
    return { success: true, ...data };
  } catch (err) {
    return { success: false, error: err.message, alerts: [], total: 0 };
  }
}

export async function resolveSOSAlert(alertId, { resolution, notes }) {
  if (isSupabaseConfigured()) {
    try {
      const { data, error } = await supabase
        .from('sos_alerts')
        .update({ status: 'resolved', resolution, notes, resolved_at: new Date().toISOString() })
        .eq('id', alertId)
        .select()
        .single();
      if (!error) return { success: true, alert: data };
    } catch { /* fall through to api.js */ }
  }

  try {
    const data = await api.post(`/admin/pro/safety/sos/${alertId}/resolve`, { resolution, notes });
    return { success: true, ...data };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

export async function getSafetyIncidents({ page = 1, limit = 20, status } = {}) {
  if (isSupabaseConfigured()) {
    try {
      const offset = (page - 1) * limit;
      let query = supabase.from('sos_alerts').select('*', { count: 'exact' });
      if (status) query = query.eq('status', status);
      const { data, error, count } = await query.order('created_at', { ascending: false }).range(offset, offset + limit - 1);
      if (!error) return { success: true, incidents: data, total: count, page };
    } catch { /* fall through to api.js */ }
  }

  try {
    const data = await api.get('/admin/pro/safety/incidents', { params: { page, limit, status } });
    return { success: true, ...data };
  } catch (err) {
    return { success: false, error: err.message, incidents: [], total: 0 };
  }
}

export async function freezeBooking(bookingId, { reason }) {
  if (isSupabaseConfigured()) {
    try {
      const { data, error } = await supabase
        .from('pro_bookings')
        .update({ status: 'frozen', cancel_reason: reason })
        .eq('id', bookingId)
        .select()
        .single();
      if (!error) return { success: true, booking: data };
    } catch { /* fall through to api.js */ }
  }

  try {
    const data = await api.post(`/admin/pro/safety/freeze/${bookingId}`, { reason });
    return { success: true, ...data };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

// ── Pro Rectification Management ──────────────────────────────

export async function getProRectifications({ page = 1, limit = 20, status, priority } = {}) {
  if (isSupabaseConfigured()) {
    try {
      const offset = (page - 1) * limit;
      let query = supabase.from('pro_rectifications').select('*', { count: 'exact' });
      if (status) query = query.eq('status', status);
      if (priority) query = query.eq('priority', priority);
      const { data, error, count } = await query.order('created_at', { ascending: false }).range(offset, offset + limit - 1);
      if (!error) return { success: true, rectifications: data, total: count, page };
    } catch { /* fall through to api.js */ }
  }

  try {
    const data = await api.get('/admin/pro/rectification', { params: { page, limit, status, priority } });
    return { success: true, ...data };
  } catch (err) {
    return { success: false, error: err.message, rectifications: [], total: 0 };
  }
}

export async function getRectificationDetail(rectId) {
  if (isSupabaseConfigured()) {
    try {
      const { data, error } = await supabase
        .from('pro_rectifications')
        .select('*')
        .eq('id', rectId)
        .single();
      if (!error) return { success: true, rectification: data };
    } catch { /* fall through to api.js */ }
  }

  try {
    const data = await api.get(`/admin/pro/rectification/${rectId}`);
    return { success: true, rectification: data };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

export async function issueRectificationRuling(rectId, { ruling, notes, refundAmount }) {
  if (isSupabaseConfigured()) {
    try {
      const { data, error } = await supabase
        .from('pro_rectifications')
        .update({ ruling, ruling_notes: notes, refund_amount: refundAmount || 0, status: 'resolved' })
        .eq('id', rectId)
        .select()
        .single();
      if (!error) return { success: true, rectification: data };
    } catch { /* fall through to api.js */ }
  }

  try {
    const data = await api.post(`/admin/pro/rectification/${rectId}/ruling`, { ruling, notes, refundAmount });
    return { success: true, ...data };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

// ── Pro Provider Verification ─────────────────────────────────

export async function getVerificationQueue({ page = 1, limit = 20, status } = {}) {
  if (isSupabaseConfigured()) {
    try {
      const offset = (page - 1) * limit;
      let query = supabase.from('provider_verification').select('*, pro_providers(name, categories, certifications)', { count: 'exact' });
      if (status) query = query.eq('status', status);
      const { data, error, count } = await query.order('created_at', { ascending: false }).range(offset, offset + limit - 1);
      if (!error) return { success: true, providers: data, total: count, page };
    } catch { /* fall through to api.js */ }
  }

  try {
    const data = await api.get('/admin/pro/verification', { params: { page, limit, status } });
    return { success: true, ...data };
  } catch (err) {
    return { success: false, error: err.message, providers: [], total: 0 };
  }
}

export async function approveProvider(providerId, { level, notes }) {
  if (isSupabaseConfigured()) {
    try {
      const [verRes, provRes] = await Promise.all([
        supabase.from('provider_verification').update({ status: 'approved', notes }).eq('provider_id', providerId),
        supabase.from('pro_providers').update({ verified: true, level: level || 'verified' }).eq('id', providerId),
      ]);
      if (!verRes.error && !provRes.error) return { success: true };
    } catch { /* fall through to api.js */ }
  }

  try {
    const data = await api.post(`/admin/pro/verification/${providerId}/approve`, { level, notes });
    return { success: true, ...data };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

export async function rejectProvider(providerId, { reason }) {
  if (isSupabaseConfigured()) {
    try {
      const { error } = await supabase
        .from('provider_verification')
        .update({ status: 'rejected', notes: reason })
        .eq('provider_id', providerId);
      if (!error) return { success: true };
    } catch { /* fall through to api.js */ }
  }

  try {
    const data = await api.post(`/admin/pro/verification/${providerId}/reject`, { reason });
    return { success: true, ...data };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

export async function suspendProvider(providerId, { reason, duration }) {
  if (isSupabaseConfigured()) {
    try {
      const { error } = await supabase
        .from('pro_providers')
        .update({ verified: false, level: 'suspended' })
        .eq('id', providerId);
      if (!error) {
        await supabase.from('provider_verification').update({ status: 'suspended', notes: `${reason} (${duration || 'indefinite'})` }).eq('provider_id', providerId);
        return { success: true };
      }
    } catch { /* fall through to api.js */ }
  }

  try {
    const data = await api.post(`/admin/pro/verification/${providerId}/suspend`, { reason, duration });
    return { success: true, ...data };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

// ── Pro System Configuration ──────────────────────────────────

export async function getProConfig() {
  if (isSupabaseConfigured()) {
    try {
      const { data, error } = await supabase
        .from('platform_settings')
        .select('*')
        .eq('category', 'pro')
        .single();
      if (!error) return { success: true, config: data?.value || data };
    } catch { /* fall through to api.js */ }
  }

  try {
    const data = await api.get('/admin/pro/config');
    return { success: true, config: data };
  } catch (err) {
    return { success: false, error: err.message, config: null };
  }
}

export async function updateProConfig(updates) {
  if (isSupabaseConfigured()) {
    try {
      const { data, error } = await supabase
        .from('platform_settings')
        .upsert({ category: 'pro', key: 'pro_config', value: updates }, { onConflict: 'category,key' })
        .select()
        .single();
      if (!error) return { success: true, config: data?.value || data };
    } catch { /* fall through to api.js */ }
  }

  try {
    const data = await api.put('/admin/pro/config', updates);
    return { success: true, config: data };
  } catch (err) {
    return { success: false, error: err.message };
  }
}
