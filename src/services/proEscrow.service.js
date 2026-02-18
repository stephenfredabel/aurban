import api from './api.js';
import { supabase, isSupabaseConfigured } from '../lib/supabase.js';
import { PRO_SERVICE_CATEGORY_MAP } from '../data/proServiceCategoryFields.js';
import { TIER_CONFIG } from '../data/proConstants.js';
import { logAction, AUDIT_ACTIONS } from './audit.service.js';

/**
 * Pro Escrow service -- Tier-aware escrow for service bookings
 *
 * Flow by tier:
 *   T1-T3: Full amount held -> commitment released on OTP -> balance released after observation
 *   T4:    Full amount held -> milestone releases (30/40/20/10) -> retention auto-releases after 14 days
 *
 * All methods return { success, data?, error? }
 */

// -- Create escrow --

export async function createProEscrow({ bookingId, amount, clientId, providerId, category, tier }) {
  if (isSupabaseConfigured()) {
    try {
      const { data, error } = await supabase
        .from('pro_escrow')
        .insert({ booking_id: bookingId, amount, client_id: clientId, provider_id: providerId, category, tier, status: 'held' })
        .select()
        .single();
      if (!error) {
        try { await logAction({ action: 'pro_escrow_created', targetId: bookingId, targetType: 'booking', details: `Pro escrow created for booking ${bookingId}`, adminId: null, adminRole: 'system' }); } catch { /* audit failure must not break the flow */ }
        return { success: true, ...data };
      }
    } catch { /* fall through to api.js */ }
  }

  try {
    const data = await api.post('/pro/escrow/create', {
      bookingId, amount, clientId, providerId, category, tier,
    });
    try { await logAction({ action: 'pro_escrow_created', targetId: bookingId, targetType: 'booking', details: `Pro escrow created for booking ${bookingId}`, adminId: null, adminRole: 'system' }); } catch { /* audit failure must not break the flow */ }
    return { success: true, ...data };
  } catch (err) {
    return { success: false, error: err.data?.message || err.message };
  }
}

// -- Get escrow status --

export async function getProEscrowStatus(bookingId) {
  if (isSupabaseConfigured()) {
    try {
      const { data, error } = await supabase.from('pro_escrow').select('*').eq('booking_id', bookingId).single();
      if (!error) return { success: true, ...data };
    } catch { /* fall through to api.js */ }
  }

  try {
    const data = await api.get(`/pro/escrow/${bookingId}`, { dedup: true });
    return { success: true, ...data };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

// -- Release commitment fee (on OTP check-in) --

export async function releaseCommitmentFee(bookingId) {
  if (isSupabaseConfigured()) {
    try {
      const { data, error } = await supabase
        .from('pro_escrow')
        .update({ commitment_released: true, commitment_released_at: new Date().toISOString() })
        .eq('booking_id', bookingId)
        .select()
        .single();
      if (!error) {
        try { await logAction({ action: AUDIT_ACTIONS.ESCROW_RELEASE, targetId: bookingId, targetType: 'booking', details: `Commitment fee released for booking ${bookingId}`, adminId: null, adminRole: 'system' }); } catch { /* audit failure must not break the flow */ }
        return { success: true, ...data };
      }
    } catch { /* fall through to api.js */ }
  }

  try {
    const data = await api.post(`/pro/escrow/${bookingId}/release-commitment`);
    try { await logAction({ action: AUDIT_ACTIONS.ESCROW_RELEASE, targetId: bookingId, targetType: 'booking', details: `Commitment fee released for booking ${bookingId}`, adminId: null, adminRole: 'system' }); } catch { /* audit failure must not break the flow */ }
    return { success: true, ...data };
  } catch (err) {
    return { success: false, error: err.data?.message || err.message };
  }
}

// -- Start observation window (on work completion) --

export async function startObservationWindow(bookingId) {
  if (isSupabaseConfigured()) {
    try {
      const { data, error } = await supabase
        .from('pro_escrow')
        .update({ observation_started: true, observation_started_at: new Date().toISOString() })
        .eq('booking_id', bookingId)
        .select()
        .single();
      if (!error) {
        try { await logAction({ action: 'pro_escrow_observation_started', targetId: bookingId, targetType: 'booking', details: `Observation window started for booking ${bookingId}`, adminId: null, adminRole: 'system' }); } catch { /* audit failure must not break the flow */ }
        return { success: true, ...data };
      }
    } catch { /* fall through to api.js */ }
  }

  try {
    const data = await api.post(`/pro/escrow/${bookingId}/start-observation`);
    try { await logAction({ action: 'pro_escrow_observation_started', targetId: bookingId, targetType: 'booking', details: `Observation window started for booking ${bookingId}`, adminId: null, adminRole: 'system' }); } catch { /* audit failure must not break the flow */ }
    return { success: true, ...data };
  } catch (err) {
    return { success: false, error: err.data?.message || err.message };
  }
}

// -- Release balance (after observation) --

export async function releaseBalance(bookingId) {
  if (isSupabaseConfigured()) {
    try {
      const { data, error } = await supabase
        .from('pro_escrow')
        .update({ status: 'released', balance_released_at: new Date().toISOString() })
        .eq('booking_id', bookingId)
        .select()
        .single();
      if (!error) return { success: true, ...data };
    } catch { /* fall through to api.js */ }
  }

  try {
    const data = await api.post(`/pro/escrow/${bookingId}/release-balance`);
    return { success: true, ...data };
  } catch (err) {
    return { success: false, error: err.data?.message || err.message };
  }
}

// -- Auto-release check (cron / timer) --

export async function autoReleaseCheck(bookingId) {
  if (isSupabaseConfigured()) {
    try {
      const { data, error } = await supabase
        .from('pro_escrow')
        .select('*')
        .eq('booking_id', bookingId)
        .single();
      if (!error && data) {
        // Check if auto-release conditions are met
        if (data.observation_started && data.observation_started_at) {
          const { data: updated, error: updateErr } = await supabase
            .from('pro_escrow')
            .update({ status: 'auto_released', auto_released_at: new Date().toISOString() })
            .eq('booking_id', bookingId)
            .select()
            .single();
          if (!updateErr) return { success: true, ...updated };
        }
        return { success: true, ...data };
      }
    } catch { /* fall through to api.js */ }
  }

  try {
    const data = await api.post(`/pro/escrow/${bookingId}/auto-release`);
    return { success: true, ...data };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

// -- Freeze escrow (dispute / SOS) --

export async function freezeProEscrow(bookingId, reason) {
  if (isSupabaseConfigured()) {
    try {
      const { data, error } = await supabase
        .from('pro_escrow')
        .update({ status: 'frozen', freeze_reason: reason, frozen_at: new Date().toISOString() })
        .eq('booking_id', bookingId)
        .select()
        .single();
      if (!error) return { success: true, ...data };
    } catch { /* fall through to api.js */ }
  }

  try {
    const data = await api.post(`/pro/escrow/${bookingId}/freeze`, { reason });
    return { success: true, ...data };
  } catch (err) {
    return { success: false, error: err.data?.message || err.message };
  }
}

// -- Refund escrow --

export async function refundProEscrow(bookingId, { amount, reason, partial = false } = {}) {
  if (isSupabaseConfigured()) {
    try {
      const { data, error } = await supabase
        .from('pro_escrow')
        .update({
          status: partial ? 'partially_refunded' : 'refunded',
          refund_amount: amount,
          refund_reason: reason,
          refunded_at: new Date().toISOString(),
        })
        .eq('booking_id', bookingId)
        .select()
        .single();
      if (!error) return { success: true, ...data };
    } catch { /* fall through to api.js */ }
  }

  try {
    const data = await api.post(`/pro/escrow/${bookingId}/refund`, { amount, reason, partial });
    return { success: true, ...data };
  } catch (err) {
    return { success: false, error: err.data?.message || err.message };
  }
}

// -- Tier 4: Release milestone --

export async function releaseMilestone(bookingId, { phase, evidence } = {}) {
  if (isSupabaseConfigured()) {
    try {
      // Get current milestone data
      const { data: escrow } = await supabase.from('pro_escrow').select('milestones').eq('booking_id', bookingId).single();
      const milestones = escrow?.milestones || [];
      const updatedMilestones = milestones.map(m =>
        m.phase === phase ? { ...m, released: true, evidence, released_at: new Date().toISOString() } : m
      );
      const { data, error } = await supabase
        .from('pro_escrow')
        .update({ milestones: updatedMilestones })
        .eq('booking_id', bookingId)
        .select()
        .single();
      if (!error) return { success: true, ...data };
    } catch { /* fall through to api.js */ }
  }

  try {
    const data = await api.post(`/pro/escrow/${bookingId}/milestone`, { phase, evidence });
    return { success: true, ...data };
  } catch (err) {
    return { success: false, error: err.data?.message || err.message };
  }
}

// -- Tier 4: Get milestone status --

export async function getMilestoneStatus(bookingId) {
  if (isSupabaseConfigured()) {
    try {
      const { data, error } = await supabase
        .from('pro_escrow')
        .select('milestones')
        .eq('booking_id', bookingId)
        .single();
      if (!error) return { success: true, milestones: data?.milestones || [] };
    } catch { /* fall through to api.js */ }
  }

  try {
    const data = await api.get(`/pro/escrow/${bookingId}/milestones`, { dedup: true });
    return { success: true, milestones: data };
  } catch (err) {
    return { success: false, error: err.message, milestones: [] };
  }
}


// -- Helpers --

/**
 * Calculate commitment fee amount from total + tier
 */
export function calculateCommitmentFee(amount, tier) {
  const config = TIER_CONFIG[tier] ?? TIER_CONFIG[1];
  return Math.round(amount * config.commitmentFeePercent / 100);
}

/**
 * Get remaining observation time in ms.
 * Returns 0 if already expired.
 */
export function getObservationRemainingMs(completedAt, category) {
  const catDef = PRO_SERVICE_CATEGORY_MAP[category];
  const days = catDef?.observationDays ?? 3;
  const endsAt = completedAt + days * 86_400_000;
  return Math.max(0, endsAt - Date.now());
}

/**
 * Calculate Tier 4 milestone split for a total amount.
 * Returns array of { phase, label, percent, amount }.
 */
export function calculateMilestoneSplit(total) {
  return [
    { phase: 1, label: 'Mobilization',  percent: 30, amount: Math.round(total * 0.30) },
    { phase: 2, label: 'Structure',      percent: 40, amount: Math.round(total * 0.40) },
    { phase: 3, label: 'Finishing',      percent: 20, amount: Math.round(total * 0.20) },
    { phase: 4, label: 'Retention',      percent: 10, amount: Math.round(total * 0.10) },
  ];
}
