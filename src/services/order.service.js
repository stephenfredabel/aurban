import api from './api.js';
import { supabase, isSupabaseConfigured } from '../lib/supabase.js';

/**
 * Order service -- Marketplace order lifecycle
 * Following booking.service.js pattern: all methods return { success, data?, error? }
 */

// -- List orders --

export async function getOrders({ page = 1, limit = 20, status, role } = {}) {
  if (isSupabaseConfigured()) {
    try {
      const offset = (page - 1) * limit;
      let query = supabase.from('orders').select('*', { count: 'exact' });
      if (status) query = query.eq('status', status);
      if (role) query = query.eq('role', role);
      const { data, error, count } = await query.range(offset, offset + limit - 1);
      if (!error) return { success: true, orders: data, total: count, page };
    } catch { /* fall through to api.js */ }
  }

  try {
    const data = await api.get('/orders', { params: { page, limit, status, role } });
    return { success: true, ...data };
  } catch (err) {
    return { success: false, error: err.message, orders: [], total: 0 };
  }
}

// -- Single order --

export async function getOrder(id) {
  if (isSupabaseConfigured()) {
    try {
      const { data, error } = await supabase.from('orders').select('*').eq('id', id).single();
      if (!error) return { success: true, order: data };
    } catch { /* fall through to api.js */ }
  }

  try {
    const data = await api.get(`/orders/${id}`, { dedup: true });
    return { success: true, order: data };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

// -- Create order --

export async function createOrder(payload) {
  if (isSupabaseConfigured()) {
    try {
      const { data, error } = await supabase.from('orders').insert(payload).select().single();
      if (!error) return { success: true, order: data };
    } catch { /* fall through to api.js */ }
  }

  try {
    const data = await api.post('/orders', payload);
    return { success: true, order: data };
  } catch (err) {
    return { success: false, error: err.data?.message || err.message };
  }
}

// -- Update order status --

export async function updateOrderStatus(id, status, meta = {}) {
  if (isSupabaseConfigured()) {
    try {
      const { data, error } = await supabase
        .from('orders')
        .update({ status, ...meta })
        .eq('id', id)
        .select()
        .single();
      if (!error) return { success: true, order: data };
    } catch { /* fall through to api.js */ }
  }

  try {
    const data = await api.patch(`/orders/${id}/status`, { status, ...meta });
    return { success: true, order: data };
  } catch (err) {
    return { success: false, error: err.data?.message || err.message };
  }
}

// -- Cancel order --

export async function cancelOrder(id, reason) {
  if (isSupabaseConfigured()) {
    try {
      const { data, error } = await supabase
        .from('orders')
        .update({ status: 'cancelled', cancel_reason: reason })
        .eq('id', id)
        .select()
        .single();
      if (!error) return { success: true, order: data };
    } catch { /* fall through to api.js */ }
  }

  try {
    const data = await api.post(`/orders/${id}/cancel`, { reason });
    return { success: true, order: data };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

// -- Confirm delivery (buyer) --

export async function confirmDelivery(id) {
  if (isSupabaseConfigured()) {
    try {
      const { data, error } = await supabase
        .from('orders')
        .update({ status: 'delivered', delivered_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();
      if (!error) return { success: true, order: data };
    } catch { /* fall through to api.js */ }
  }

  try {
    const data = await api.post(`/orders/${id}/confirm-delivery`);
    return { success: true, order: data };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

// -- Request refund --

export async function requestRefund(id, { reason, evidence } = {}) {
  if (isSupabaseConfigured()) {
    try {
      const { data, error } = await supabase
        .from('orders')
        .update({ status: 'refund_requested', refund_reason: reason, refund_evidence: evidence })
        .eq('id', id)
        .select()
        .single();
      if (!error) return { success: true, order: data };
    } catch { /* fall through to api.js */ }
  }

  try {
    const data = await api.post(`/orders/${id}/refund`, { reason, evidence });
    return { success: true, order: data };
  } catch (err) {
    return { success: false, error: err.data?.message || err.message };
  }
}

// -- Report issue --

export async function reportIssue(id, { type, description, photos } = {}) {
  if (isSupabaseConfigured()) {
    try {
      const { data, error } = await supabase
        .from('orders')
        .update({ has_issue: true, issue_type: type, issue_description: description, issue_photos: photos })
        .eq('id', id)
        .select()
        .single();
      if (!error) return { success: true, order: data };
    } catch { /* fall through to api.js */ }
  }

  try {
    const data = await api.post(`/orders/${id}/issue`, { type, description, photos });
    return { success: true, order: data };
  } catch (err) {
    return { success: false, error: err.message };
  }
}
