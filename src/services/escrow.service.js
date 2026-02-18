import api from './api.js';
import { supabase, isSupabaseConfigured } from '../lib/supabase.js';
import { PRODUCT_CATEGORY_MAP } from '../data/categoryFields.js';
import { logAction, AUDIT_ACTIONS } from './audit.service.js';

/**
 * Escrow service -- Manages buyer protection for marketplace orders
 *
 * Flow: Payment -> Escrow Hold -> Delivery Confirmation -> 48hr Auto-Release
 * Category-specific refund windows from categoryFields.js
 *
 * All methods return { success, data?, error? }
 */

// -- Create escrow hold --

export async function createEscrow({ orderId, amount, sellerId, buyerId, items }) {
  if (isSupabaseConfigured()) {
    try {
      const { data, error } = await supabase
        .from('escrow')
        .insert({ order_id: orderId, amount, seller_id: sellerId, buyer_id: buyerId, items, status: 'held' })
        .select()
        .single();
      if (!error) {
        try { await logAction({ action: 'escrow_created', targetId: orderId, targetType: 'order', details: `Escrow created for order ${orderId}`, adminId: null, adminRole: 'system' }); } catch { /* audit failure must not break the flow */ }
        return { success: true, ...data };
      }
    } catch { /* fall through to api.js */ }
  }

  try {
    const data = await api.post('/escrow/create', {
      orderId, amount, sellerId, buyerId, items,
    });
    try { await logAction({ action: 'escrow_created', targetId: orderId, targetType: 'order', details: `Escrow created for order ${orderId}`, adminId: null, adminRole: 'system' }); } catch { /* audit failure must not break the flow */ }
    return { success: true, ...data };
  } catch (err) {
    return { success: false, error: err.data?.message || err.message };
  }
}

// -- Get escrow status --

export async function getEscrowStatus(orderId) {
  if (isSupabaseConfigured()) {
    try {
      const { data, error } = await supabase.from('escrow').select('*').eq('order_id', orderId).single();
      if (!error) return { success: true, ...data };
    } catch { /* fall through to api.js */ }
  }

  try {
    const data = await api.get(`/escrow/${orderId}`, { dedup: true });
    return { success: true, ...data };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

// -- Release escrow to seller --

export async function releaseEscrow(orderId) {
  if (isSupabaseConfigured()) {
    try {
      const { data, error } = await supabase
        .from('escrow')
        .update({ status: 'released', released_at: new Date().toISOString() })
        .eq('order_id', orderId)
        .select()
        .single();
      if (!error) {
        try { await logAction({ action: AUDIT_ACTIONS.ESCROW_RELEASE, targetId: orderId, targetType: 'order', details: `Escrow released for order ${orderId}`, adminId: null, adminRole: 'system' }); } catch { /* audit failure must not break the flow */ }
        return { success: true, ...data };
      }
    } catch { /* fall through to api.js */ }
  }

  try {
    const data = await api.post(`/escrow/${orderId}/release`);
    try { await logAction({ action: AUDIT_ACTIONS.ESCROW_RELEASE, targetId: orderId, targetType: 'order', details: `Escrow released for order ${orderId}`, adminId: null, adminRole: 'system' }); } catch { /* audit failure must not break the flow */ }
    return { success: true, ...data };
  } catch (err) {
    return { success: false, error: err.data?.message || err.message };
  }
}

// -- Freeze escrow (admin action for disputes) --

export async function freezeEscrow(orderId, reason) {
  if (isSupabaseConfigured()) {
    try {
      const { data, error } = await supabase
        .from('escrow')
        .update({ status: 'frozen', freeze_reason: reason, frozen_at: new Date().toISOString() })
        .eq('order_id', orderId)
        .select()
        .single();
      if (!error) {
        try { await logAction({ action: AUDIT_ACTIONS.ESCROW_FREEZE, targetId: orderId, targetType: 'order', details: `Escrow frozen for order ${orderId}`, adminId: null, adminRole: 'system' }); } catch { /* audit failure must not break the flow */ }
        return { success: true, ...data };
      }
    } catch { /* fall through to api.js */ }
  }

  try {
    const data = await api.post(`/escrow/${orderId}/freeze`, { reason });
    try { await logAction({ action: AUDIT_ACTIONS.ESCROW_FREEZE, targetId: orderId, targetType: 'order', details: `Escrow frozen for order ${orderId}`, adminId: null, adminRole: 'system' }); } catch { /* audit failure must not break the flow */ }
    return { success: true, ...data };
  } catch (err) {
    return { success: false, error: err.data?.message || err.message };
  }
}

// -- Refund escrow to buyer --

export async function refundEscrow(orderId, { amount, reason, partial = false } = {}) {
  if (isSupabaseConfigured()) {
    try {
      const { data, error } = await supabase
        .from('escrow')
        .update({
          status: partial ? 'partially_refunded' : 'refunded',
          refund_amount: amount,
          refund_reason: reason,
          refunded_at: new Date().toISOString(),
        })
        .eq('order_id', orderId)
        .select()
        .single();
      if (!error) return { success: true, ...data };
    } catch { /* fall through to api.js */ }
  }

  try {
    const data = await api.post(`/escrow/${orderId}/refund`, { amount, reason, partial });
    return { success: true, ...data };
  } catch (err) {
    return { success: false, error: err.data?.message || err.message };
  }
}

// -- Helpers --

/**
 * Get the refund window (in hours) for a product category.
 * Returns 0 for non-refundable categories.
 */
export function getRefundWindowHours(category) {
  const def = PRODUCT_CATEGORY_MAP[category];
  if (!def?.refundPolicy) return 0;
  return def.refundPolicy.window || 0;
}

/**
 * Check if a delivered order is still within the refund window.
 * @param {string} category - Product category key
 * @param {number} deliveredAt - Timestamp of delivery confirmation
 */
export function isWithinRefundWindow(category, deliveredAt) {
  const windowHrs = getRefundWindowHours(category);
  if (windowHrs === 0) return false;
  const elapsed = Date.now() - deliveredAt;
  return elapsed < windowHrs * 3600_000;
}

/**
 * Auto-release timer: 48 hours after delivery confirmation.
 * Returns remaining ms before auto-release, or 0 if already eligible.
 */
export function getAutoReleaseRemainingMs(deliveredAt) {
  const AUTO_RELEASE_MS = 48 * 3600_000;
  const remaining = (deliveredAt + AUTO_RELEASE_MS) - Date.now();
  return Math.max(0, remaining);
}
