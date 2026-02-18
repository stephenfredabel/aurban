import api from './api.js';
import { supabase, isSupabaseConfigured } from '../lib/supabase.js';
import { logAction, AUDIT_ACTIONS } from './audit.service.js';

/**
 * Admin service
 * Platform management endpoints -- users, listings, bookings, payments, analytics, reports, settings
 * All methods return { success, data?, error? }
 */

// -- Users --

export async function getUsers({ page = 1, limit = 20, role, search, status } = {}) {
  if (isSupabaseConfigured()) {
    try {
      const offset = (page - 1) * limit;
      let query = supabase.from('users').select('*', { count: 'exact' });
      if (role) query = query.eq('role', role);
      if (status) query = query.eq('status', status);
      if (search) query = query.ilike('name', `%${search}%`);
      const { data, error, count } = await query.range(offset, offset + limit - 1);
      if (!error) return { success: true, users: data, total: count, page };
    } catch { /* fall through to api.js */ }
  }

  try {
    const data = await api.get('/admin/users', { params: { page, limit, role, search, status } });
    return { success: true, ...data };
  } catch (err) {
    return { success: false, error: err.message, users: [], total: 0 };
  }
}

export async function getUser(id) {
  if (isSupabaseConfigured()) {
    try {
      const { data, error } = await supabase.from('users').select('*').eq('id', id).single();
      if (!error) return { success: true, user: data };
    } catch { /* fall through to api.js */ }
  }

  try {
    const data = await api.get(`/admin/users/${id}`);
    return { success: true, user: data };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

export async function updateUser(id, updates) {
  if (isSupabaseConfigured()) {
    try {
      const { data, error } = await supabase.from('users').update(updates).eq('id', id).select().single();
      if (!error) return { success: true, user: data };
    } catch { /* fall through to api.js */ }
  }

  try {
    const data = await api.patch(`/admin/users/${id}`, updates);
    return { success: true, user: data };
  } catch (err) {
    return { success: false, error: err.data?.message || err.message };
  }
}

export async function suspendUser(id, reason) {
  if (isSupabaseConfigured()) {
    try {
      const { error } = await supabase.from('users').update({ status: 'suspended', suspend_reason: reason }).eq('id', id);
      if (!error) return { success: true };
    } catch { /* fall through to api.js */ }
  }

  try {
    await api.post(`/admin/users/${id}/suspend`, { reason });
    return { success: true };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

// -- Listings (moderation) --

export async function getListingsForModeration({ page = 1, limit = 20, status, type } = {}) {
  if (isSupabaseConfigured()) {
    try {
      const offset = (page - 1) * limit;
      let query = supabase.from('properties').select('*', { count: 'exact' });
      if (status) query = query.eq('moderation_status', status);
      if (type) query = query.eq('type', type);
      const { data, error, count } = await query.range(offset, offset + limit - 1);
      if (!error) return { success: true, listings: data, total: count, page };
    } catch { /* fall through to api.js */ }
  }

  try {
    const data = await api.get('/admin/listings', { params: { page, limit, status, type } });
    return { success: true, ...data };
  } catch (err) {
    return { success: false, error: err.message, listings: [], total: 0 };
  }
}

export async function moderateListing(id, { action, reason }) {
  if (isSupabaseConfigured()) {
    try {
      const { data, error } = await supabase
        .from('properties')
        .update({ moderation_status: action, moderation_reason: reason })
        .eq('id', id)
        .select()
        .single();
      if (!error) {
        try { await logAction({ action: action === 'approved' ? AUDIT_ACTIONS.LISTING_APPROVE : AUDIT_ACTIONS.LISTING_REJECT, targetId: id, targetType: 'listing', details: `Listing ${id} moderated: ${action}`, adminId: null, adminRole: 'system' }); } catch { /* audit failure must not break the flow */ }
        return { success: true, listing: data };
      }
    } catch { /* fall through to api.js */ }
  }

  try {
    const data = await api.post(`/admin/listings/${id}/moderate`, { action, reason });
    try { await logAction({ action: action === 'approved' ? AUDIT_ACTIONS.LISTING_APPROVE : AUDIT_ACTIONS.LISTING_REJECT, targetId: id, targetType: 'listing', details: `Listing ${id} moderated: ${action}`, adminId: null, adminRole: 'system' }); } catch { /* audit failure must not break the flow */ }
    return { success: true, listing: data };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

export async function updateListing(id, updates) {
  if (isSupabaseConfigured()) {
    try {
      const { data, error } = await supabase
        .from('properties')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      if (!error) return { success: true, listing: data };
    } catch { /* fall through to api.js */ }
  }

  try {
    const data = await api.patch(`/admin/listings/${id}`, updates);
    return { success: true, listing: data };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

// -- Bookings --

export async function getAllBookings({ page = 1, limit = 20, status } = {}) {
  if (isSupabaseConfigured()) {
    try {
      const offset = (page - 1) * limit;
      let query = supabase.from('bookings').select('*', { count: 'exact' });
      if (status) query = query.eq('status', status);
      const { data, error, count } = await query.range(offset, offset + limit - 1);
      if (!error) return { success: true, bookings: data, total: count, page };
    } catch { /* fall through to api.js */ }
  }

  try {
    const data = await api.get('/admin/bookings', { params: { page, limit, status } });
    return { success: true, ...data };
  } catch (err) {
    return { success: false, error: err.message, bookings: [], total: 0 };
  }
}

export async function updateBookingStatus(id, status, meta = {}) {
  if (isSupabaseConfigured()) {
    try {
      const { data, error } = await supabase
        .from('bookings')
        .update({ status, ...meta })
        .eq('id', id)
        .select()
        .single();
      if (!error) return { success: true, booking: data };
    } catch { /* fall through to api.js */ }
  }

  try {
    const data = await api.patch(`/admin/bookings/${id}/status`, { status, ...meta });
    return { success: true, booking: data };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

// -- Payments / Escrow --

export async function getTransactions({ page = 1, limit = 20, status, provider } = {}) {
  if (isSupabaseConfigured()) {
    try {
      const offset = (page - 1) * limit;
      let query = supabase.from('transactions').select('*', { count: 'exact' });
      if (status) query = query.eq('status', status);
      if (provider) query = query.eq('provider_id', provider);
      const { data, error, count } = await query.range(offset, offset + limit - 1);
      if (!error) return { success: true, transactions: data, total: count, page };
    } catch { /* fall through to api.js */ }
  }

  try {
    const data = await api.get('/admin/payments', { params: { page, limit, status, provider } });
    return { success: true, ...data };
  } catch (err) {
    return { success: false, error: err.message, transactions: [], total: 0 };
  }
}

export async function getEscrowDetails(transactionId) {
  if (isSupabaseConfigured()) {
    try {
      const { data, error } = await supabase.from('escrow').select('*').eq('transaction_id', transactionId).single();
      if (!error) return { success: true, ...data };
    } catch { /* fall through to api.js */ }
  }

  try {
    const data = await api.get(`/admin/payments/${transactionId}/escrow`);
    return { success: true, ...data };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

export async function releaseEscrow(transactionId) {
  if (isSupabaseConfigured()) {
    try {
      const { data, error } = await supabase
        .from('escrow')
        .update({ status: 'released', released_at: new Date().toISOString() })
        .eq('transaction_id', transactionId)
        .select()
        .single();
      if (!error) return { success: true, ...data };
    } catch { /* fall through to api.js */ }
  }

  try {
    const data = await api.post(`/admin/payments/${transactionId}/escrow/release`);
    return { success: true, ...data };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

export async function processRefund(transactionId) {
  if (isSupabaseConfigured()) {
    try {
      const { data, error } = await supabase
        .from('escrow')
        .update({ status: 'refunded', refunded_at: new Date().toISOString() })
        .eq('transaction_id', transactionId)
        .select()
        .single();
      if (!error) return { success: true, ...data };
    } catch { /* fall through to api.js */ }
  }

  try {
    const data = await api.post(`/admin/payments/${transactionId}/refund`);
    return { success: true, ...data };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

// -- Analytics (platform-wide) --

export async function getPlatformAnalytics({ period = '30d' } = {}) {
  if (isSupabaseConfigured()) {
    try {
      const { data, error } = await supabase.from('platform_analytics').select('*').eq('period', period).single();
      if (!error) return { success: true, ...data };
    } catch { /* fall through to api.js */ }
  }

  try {
    const data = await api.get('/admin/analytics', { params: { period } });
    return { success: true, ...data };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

// -- Reports --

export async function getReports({ page = 1, limit = 20, type, status } = {}) {
  if (isSupabaseConfigured()) {
    try {
      const offset = (page - 1) * limit;
      let query = supabase.from('reports').select('*', { count: 'exact' });
      if (type) query = query.eq('type', type);
      if (status) query = query.eq('status', status);
      const { data, error, count } = await query.range(offset, offset + limit - 1);
      if (!error) return { success: true, reports: data, total: count, page };
    } catch { /* fall through to api.js */ }
  }

  try {
    const data = await api.get('/admin/reports', { params: { page, limit, type, status } });
    return { success: true, ...data };
  } catch (err) {
    return { success: false, error: err.message, reports: [], total: 0 };
  }
}

export async function resolveReport(id, { resolution, notes }) {
  if (isSupabaseConfigured()) {
    try {
      const { data, error } = await supabase
        .from('reports')
        .update({ status: 'resolved', resolution, notes, resolved_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();
      if (!error) return { success: true, report: data };
    } catch { /* fall through to api.js */ }
  }

  try {
    const data = await api.post(`/admin/reports/${id}/resolve`, { resolution, notes });
    return { success: true, report: data };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

export async function updateReportStatus(id, status, { resolution, notes } = {}) {
  const payload = {
    status,
    resolution,
    notes,
    ...(status === 'resolved' ? { resolved_at: new Date().toISOString() } : {}),
  };

  if (isSupabaseConfigured()) {
    try {
      const { data, error } = await supabase
        .from('reports')
        .update(payload)
        .eq('id', id)
        .select()
        .single();
      if (!error) return { success: true, report: data };
    } catch { /* fall through to api.js */ }
  }

  try {
    const data = await api.patch(`/admin/reports/${id}`, payload);
    return { success: true, report: data };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

// -- Platform Settings --

export async function getSettings() {
  if (isSupabaseConfigured()) {
    try {
      const { data, error } = await supabase.from('platform_settings').select('*').single();
      if (!error) return { success: true, settings: data };
    } catch { /* fall through to api.js */ }
  }

  try {
    const data = await api.get('/admin/settings');
    return { success: true, settings: data };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

export async function updateSettings(settings) {
  if (isSupabaseConfigured()) {
    try {
      const { data, error } = await supabase.from('platform_settings').update(settings).eq('id', settings.id || 1).select().single();
      if (!error) return { success: true, settings: data };
    } catch { /* fall through to api.js */ }
  }

  try {
    const data = await api.patch('/admin/settings', settings);
    return { success: true, settings: data };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

// -- Re-authentication --

export async function reAuthenticate(password) {
  if (isSupabaseConfigured()) {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { error } = await supabase.auth.signInWithPassword({ email: user.email, password });
        if (!error) return { success: true, verified: true };
      }
    } catch { /* fall through to api.js */ }
  }

  try {
    const data = await api.post('/admin/auth/reauth', { password });
    return { success: true, ...data };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

// -- Verification --

export async function getVerificationQueue({ page = 1, limit = 20, status, type } = {}) {
  if (isSupabaseConfigured()) {
    try {
      const offset = (page - 1) * limit;
      let query = supabase.from('provider_verification').select('*', { count: 'exact' });
      if (status) query = query.eq('status', status);
      if (type) query = query.eq('type', type);
      const { data, error, count } = await query.range(offset, offset + limit - 1);
      if (!error) return { success: true, submissions: data, total: count, page };
    } catch { /* fall through to api.js */ }
  }

  try {
    const data = await api.get('/admin/verification', { params: { page, limit, status, type } });
    return { success: true, ...data };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

export async function approveVerification(id, { notes } = {}) {
  if (isSupabaseConfigured()) {
    try {
      const { data, error } = await supabase
        .from('provider_verification')
        .update({ status: 'approved', notes, approved_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();
      if (!error) return { success: true, ...data };
    } catch { /* fall through to api.js */ }
  }

  try {
    const data = await api.post(`/admin/verification/${id}/approve`, { notes });
    return { success: true, ...data };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

export async function rejectVerification(id, { reason }) {
  if (isSupabaseConfigured()) {
    try {
      const { data, error } = await supabase
        .from('provider_verification')
        .update({ status: 'rejected', rejection_reason: reason })
        .eq('id', id)
        .select()
        .single();
      if (!error) return { success: true, ...data };
    } catch { /* fall through to api.js */ }
  }

  try {
    const data = await api.post(`/admin/verification/${id}/reject`, { reason });
    return { success: true, ...data };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

export async function requestAdditionalDocs(id, { documents }) {
  if (isSupabaseConfigured()) {
    try {
      const { data, error } = await supabase
        .from('provider_verification')
        .update({ status: 'docs_requested', requested_documents: documents })
        .eq('id', id)
        .select()
        .single();
      if (!error) return { success: true, ...data };
    } catch { /* fall through to api.js */ }
  }

  try {
    const data = await api.post(`/admin/verification/${id}/request-docs`, { documents });
    return { success: true, ...data };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

// -- Support Tickets --

export async function getTickets({ page = 1, limit = 20, status, priority } = {}) {
  if (isSupabaseConfigured()) {
    try {
      const offset = (page - 1) * limit;
      let query = supabase.from('support_tickets').select('*', { count: 'exact' });
      if (status) query = query.eq('status', status);
      if (priority) query = query.eq('priority', priority);
      const { data, error, count } = await query.range(offset, offset + limit - 1);
      if (!error) return { success: true, tickets: data, total: count, page };
    } catch { /* fall through to api.js */ }
  }

  try {
    const data = await api.get('/admin/tickets', { params: { page, limit, status, priority } });
    return { success: true, ...data };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

export async function getTicket(id) {
  if (isSupabaseConfigured()) {
    try {
      const { data, error } = await supabase.from('support_tickets').select('*').eq('id', id).single();
      if (!error) return { success: true, ...data };
    } catch { /* fall through to api.js */ }
  }

  try {
    const data = await api.get(`/admin/tickets/${id}`);
    return { success: true, ...data };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

export async function respondToTicket(id, { message }) {
  if (isSupabaseConfigured()) {
    try {
      // Get current responses and append
      const { data: ticket } = await supabase.from('support_tickets').select('responses').eq('id', id).single();
      const responses = ticket?.responses || [];
      const { data: { user } } = await supabase.auth.getUser();
      responses.push({ admin_id: user?.id, message, timestamp: new Date().toISOString() });
      const { data, error } = await supabase
        .from('support_tickets')
        .update({ responses, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();
      if (!error) return { success: true, ...data };
    } catch { /* fall through to api.js */ }
  }

  try {
    const data = await api.post(`/admin/tickets/${id}/respond`, { message });
    return { success: true, ...data };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

export async function escalateTicket(id, { reason }) {
  if (isSupabaseConfigured()) {
    try {
      const { data, error } = await supabase
        .from('support_tickets')
        .update({ status: 'escalated', escalation_reason: reason })
        .eq('id', id)
        .select()
        .single();
      if (!error) return { success: true, ...data };
    } catch { /* fall through to api.js */ }
  }

  try {
    const data = await api.post(`/admin/tickets/${id}/escalate`, { reason });
    return { success: true, ...data };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

export async function closeTicket(id, { resolution }) {
  if (isSupabaseConfigured()) {
    try {
      const { data, error } = await supabase
        .from('support_tickets')
        .update({ status: 'closed', resolution, closed_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();
      if (!error) return { success: true, ...data };
    } catch { /* fall through to api.js */ }
  }

  try {
    const data = await api.post(`/admin/tickets/${id}/close`, { resolution });
    return { success: true, ...data };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

// -- KYC / Compliance --

export async function getKYCQueue({ page = 1, limit = 20, status, risk } = {}) {
  if (isSupabaseConfigured()) {
    try {
      const offset = (page - 1) * limit;
      let query = supabase.from('kyc_submissions').select('*', { count: 'exact' });
      if (status) query = query.eq('status', status);
      if (risk) query = query.eq('risk_level', risk);
      const { data, error, count } = await query.range(offset, offset + limit - 1);
      if (!error) return { success: true, submissions: data, total: count, page };
    } catch { /* fall through to api.js */ }
  }

  try {
    const data = await api.get('/admin/kyc', { params: { page, limit, status, risk } });
    return { success: true, ...data };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

export async function approveKYC(id, { notes } = {}) {
  if (isSupabaseConfigured()) {
    try {
      const { data, error } = await supabase
        .from('kyc_submissions')
        .update({ status: 'approved', notes, approved_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();
      if (!error) return { success: true, ...data };
    } catch { /* fall through to api.js */ }
  }

  try {
    const data = await api.post(`/admin/kyc/${id}/approve`, { notes });
    return { success: true, ...data };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

export async function rejectKYC(id, { reason }) {
  if (isSupabaseConfigured()) {
    try {
      const { data, error } = await supabase
        .from('kyc_submissions')
        .update({ status: 'rejected', rejection_reason: reason })
        .eq('id', id)
        .select()
        .single();
      if (!error) return { success: true, ...data };
    } catch { /* fall through to api.js */ }
  }

  try {
    const data = await api.post(`/admin/kyc/${id}/reject`, { reason });
    return { success: true, ...data };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

export async function flagKYC(id, { notes, riskLevel = 'high' } = {}) {
  if (isSupabaseConfigured()) {
    try {
      const { data, error } = await supabase
        .from('kyc_submissions')
        .update({ status: 'flagged', risk_level: riskLevel, reviewer_notes: notes })
        .eq('id', id)
        .select()
        .single();
      if (!error) return { success: true, ...data };
    } catch { /* fall through to api.js */ }
  }

  try {
    const data = await api.post(`/admin/kyc/${id}/flag`, { notes, riskLevel });
    return { success: true, ...data };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

export async function flagHighRisk(id, { reason }) {
  if (isSupabaseConfigured()) {
    try {
      const { data, error } = await supabase
        .from('kyc_submissions')
        .update({ risk_level: 'high', flag_reason: reason })
        .eq('id', id)
        .select()
        .single();
      if (!error) return { success: true, ...data };
    } catch { /* fall through to api.js */ }
  }

  try {
    const data = await api.post(`/admin/kyc/${id}/flag`, { reason });
    return { success: true, ...data };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

export async function freezeAccount(userId, { reason }) {
  if (isSupabaseConfigured()) {
    try {
      const { data, error } = await supabase
        .from('users')
        .update({ status: 'frozen', freeze_reason: reason })
        .eq('id', userId)
        .select()
        .single();
      if (!error) return { success: true, ...data };
    } catch { /* fall through to api.js */ }
  }

  try {
    const data = await api.post(`/admin/users/${userId}/freeze`, { reason });
    return { success: true, ...data };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

// -- Admin Management --

export async function getAdminList({ page = 1, limit = 20 } = {}) {
  if (isSupabaseConfigured()) {
    try {
      const offset = (page - 1) * limit;
      const { data, error, count } = await supabase
        .from('users')
        .select('*', { count: 'exact' })
        .in('role', ['super_admin', 'operations_admin', 'finance_admin', 'support_admin', 'moderator', 'verification_admin', 'compliance_admin'])
        .range(offset, offset + limit - 1);
      if (!error) return { success: true, admins: data, total: count, page };
    } catch { /* fall through to api.js */ }
  }

  try {
    const data = await api.get('/admin/admins', { params: { page, limit } });
    return { success: true, ...data };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

export async function createAdmin(adminData) {
  if (isSupabaseConfigured()) {
    try {
      const { data, error } = await supabase.from('users').insert(adminData).select().single();
      if (!error) return { success: true, ...data };
    } catch { /* fall through to api.js */ }
  }

  try {
    const data = await api.post('/admin/admins', adminData);
    return { success: true, ...data };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

export async function suspendAdmin(id, { reason }) {
  if (isSupabaseConfigured()) {
    try {
      const { data, error } = await supabase
        .from('users')
        .update({ status: 'suspended', suspend_reason: reason })
        .eq('id', id)
        .select()
        .single();
      if (!error) return { success: true, ...data };
    } catch { /* fall through to api.js */ }
  }

  try {
    const data = await api.post(`/admin/admins/${id}/suspend`, { reason });
    return { success: true, ...data };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

// -- Admin Session Management --

export async function getActiveSessions() {
  if (isSupabaseConfigured()) {
    try {
      const { data, error } = await supabase.from('admin_sessions').select('*').eq('active', true);
      if (!error) return { success: true, sessions: data };
    } catch { /* fall through to api.js */ }
  }

  try {
    const data = await api.get('/admin/sessions');
    return { success: true, ...data };
  } catch (err) {
    return { success: false, error: err.message, sessions: [] };
  }
}

export async function terminateSession(sessionId) {
  if (isSupabaseConfigured()) {
    try {
      const { data, error } = await supabase
        .from('admin_sessions')
        .update({ active: false, terminated_at: new Date().toISOString() })
        .eq('id', sessionId)
        .select()
        .single();
      if (!error) return { success: true, ...data };
    } catch { /* fall through to api.js */ }
  }

  try {
    const data = await api.post(`/admin/sessions/${sessionId}/terminate`);
    return { success: true, ...data };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

export async function forcePasswordReset(adminId) {
  if (isSupabaseConfigured()) {
    try {
      const { data: admin } = await supabase.from('users').select('email').eq('id', adminId).single();
      if (admin?.email) {
        const { error } = await supabase.auth.resetPasswordForEmail(admin.email);
        if (!error) return { success: true };
      }
    } catch { /* fall through to api.js */ }
  }

  try {
    const data = await api.post(`/admin/admins/${adminId}/force-password-reset`);
    return { success: true, ...data };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

// -- Provider Management --

export async function getProviders({ page = 1, limit = 20, status, tier } = {}) {
  if (isSupabaseConfigured()) {
    try {
      const offset = (page - 1) * limit;
      let query = supabase.from('users').select('*', { count: 'exact' }).eq('role', 'provider');
      if (status) query = query.eq('status', status);
      if (tier) query = query.eq('tier', tier);
      const { data, error, count } = await query.range(offset, offset + limit - 1);
      if (!error) return { success: true, providers: data, total: count, page };
    } catch { /* fall through to api.js */ }
  }

  try {
    const data = await api.get('/admin/providers', { params: { page, limit, status, tier } });
    return { success: true, ...data };
  } catch (err) {
    return { success: false, error: err.message, providers: [], total: 0 };
  }
}

export async function upgradeProviderTier(providerId, { tier, notes }) {
  if (isSupabaseConfigured()) {
    try {
      const { data, error } = await supabase
        .from('users')
        .update({ tier, tier_upgrade_notes: notes })
        .eq('id', providerId)
        .select()
        .single();
      if (!error) return { success: true, ...data };
    } catch { /* fall through to api.js */ }
  }

  try {
    const data = await api.post(`/admin/providers/${providerId}/upgrade-tier`, { tier, notes });
    return { success: true, ...data };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

export async function getProviderPerformance(providerId) {
  if (isSupabaseConfigured()) {
    try {
      const { data, error } = await supabase.from('provider_performance').select('*').eq('provider_id', providerId).single();
      if (!error) return { success: true, ...data };
    } catch { /* fall through to api.js */ }
  }

  try {
    const data = await api.get(`/admin/providers/${providerId}/performance`);
    return { success: true, ...data };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

// -- Escrow Management --

export async function freezeEscrow(transactionId, { reason }) {
  if (isSupabaseConfigured()) {
    try {
      const { data, error } = await supabase
        .from('escrow')
        .update({ status: 'frozen', freeze_reason: reason, frozen_at: new Date().toISOString() })
        .eq('transaction_id', transactionId)
        .select()
        .single();
      if (!error) return { success: true, ...data };
    } catch { /* fall through to api.js */ }
  }

  try {
    const data = await api.post(`/admin/payments/${transactionId}/escrow/freeze`, { reason });
    return { success: true, ...data };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

export async function getEscrowHolds({ status } = {}) {
  if (isSupabaseConfigured()) {
    try {
      let query = supabase.from('escrow').select('*', { count: 'exact' }).eq('status', 'held');
      if (status) query = query.eq('status', status);
      const { data, error, count } = await query;
      if (!error) return { success: true, holds: data, total: count };
    } catch { /* fall through to api.js */ }
  }

  try {
    const data = await api.get('/admin/escrow/holds', { params: { status } });
    return { success: true, ...data };
  } catch (err) {
    return { success: false, error: err.message, holds: [], total: 0 };
  }
}

// -- Financial Reporting --

export async function getRevenueReport({ period, breakdown } = {}) {
  if (isSupabaseConfigured()) {
    try {
      let query = supabase.from('revenue_reports').select('*');
      if (period) query = query.eq('period', period);
      if (breakdown) query = query.eq('breakdown', breakdown);
      const { data, error } = await query.single();
      if (!error) return { success: true, ...data };
    } catch { /* fall through to api.js */ }
  }

  try {
    const data = await api.get('/admin/finance/revenue', { params: { period, breakdown } });
    return { success: true, ...data };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

export async function getTaxReport({ quarter, year } = {}) {
  if (isSupabaseConfigured()) {
    try {
      let query = supabase.from('tax_reports').select('*');
      if (quarter) query = query.eq('quarter', quarter);
      if (year) query = query.eq('year', year);
      const { data, error } = await query.single();
      if (!error) return { success: true, ...data };
    } catch { /* fall through to api.js */ }
  }

  try {
    const data = await api.get('/admin/finance/tax', { params: { quarter, year } });
    return { success: true, ...data };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

export async function getReconciliationReport({ gateway, period } = {}) {
  if (isSupabaseConfigured()) {
    try {
      let query = supabase.from('reconciliation_reports').select('*');
      if (gateway) query = query.eq('gateway', gateway);
      if (period) query = query.eq('period', period);
      const { data, error } = await query.single();
      if (!error) return { success: true, ...data };
    } catch { /* fall through to api.js */ }
  }

  try {
    const data = await api.get('/admin/finance/reconciliation', { params: { gateway, period } });
    return { success: true, ...data };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

// -- Sanctions & AML --

export async function runSanctionsScreening(userId) {
  if (isSupabaseConfigured()) {
    try {
      const { data, error } = await supabase
        .from('sanctions_screenings')
        .insert({ user_id: userId, status: 'pending', screened_at: new Date().toISOString() })
        .select()
        .single();
      if (!error) return { success: true, ...data };
    } catch { /* fall through to api.js */ }
  }

  try {
    const data = await api.post(`/admin/compliance/sanctions/screen`, { userId });
    return { success: true, ...data };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

export async function getSanctionsHits({ status } = {}) {
  if (isSupabaseConfigured()) {
    try {
      let query = supabase.from('sanctions_hits').select('*', { count: 'exact' });
      if (status) query = query.eq('status', status);
      const { data, error, count } = await query;
      if (!error) return { success: true, hits: data, total: count };
    } catch { /* fall through to api.js */ }
  }

  try {
    const data = await api.get('/admin/compliance/sanctions/hits', { params: { status } });
    return { success: true, ...data };
  } catch (err) {
    return { success: false, error: err.message, hits: [], total: 0 };
  }
}

export async function clearSanctionsHit(hitId, { reason }) {
  if (isSupabaseConfigured()) {
    try {
      const { data, error } = await supabase
        .from('sanctions_hits')
        .update({ status: 'cleared', clear_reason: reason, cleared_at: new Date().toISOString() })
        .eq('id', hitId)
        .select()
        .single();
      if (!error) return { success: true, ...data };
    } catch { /* fall through to api.js */ }
  }

  try {
    const data = await api.post(`/admin/compliance/sanctions/hits/${hitId}/clear`, { reason });
    return { success: true, ...data };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

export async function fileSAR(userId, { evidence, narrative }) {
  if (isSupabaseConfigured()) {
    try {
      const { data, error } = await supabase
        .from('suspicious_activity_reports')
        .insert({ user_id: userId, evidence, narrative, filed_at: new Date().toISOString() })
        .select()
        .single();
      if (!error) return { success: true, ...data };
    } catch { /* fall through to api.js */ }
  }

  try {
    const data = await api.post('/admin/compliance/sar', { userId, evidence, narrative });
    return { success: true, ...data };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

// -- Data Privacy (GDPR / NDPR) --

export async function getDataRequests({ status } = {}) {
  if (isSupabaseConfigured()) {
    try {
      let query = supabase.from('data_requests').select('*', { count: 'exact' });
      if (status) query = query.eq('status', status);
      const { data, error, count } = await query;
      if (!error) return { success: true, requests: data, total: count };
    } catch { /* fall through to api.js */ }
  }

  try {
    const data = await api.get('/admin/compliance/data-requests', { params: { status } });
    return { success: true, ...data };
  } catch (err) {
    return { success: false, error: err.message, requests: [], total: 0 };
  }
}

export async function processDataRequest(requestId, { action }) {
  if (isSupabaseConfigured()) {
    try {
      const { data, error } = await supabase
        .from('data_requests')
        .update({ status: action, processed_at: new Date().toISOString() })
        .eq('id', requestId)
        .select()
        .single();
      if (!error) return { success: true, ...data };
    } catch { /* fall through to api.js */ }
  }

  try {
    const data = await api.post(`/admin/compliance/data-requests/${requestId}/process`, { action });
    return { success: true, ...data };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

// -- Quality & Metrics --

export async function getAdminPerformanceMetrics(adminId) {
  if (isSupabaseConfigured()) {
    try {
      const { data, error } = await supabase.from('admin_metrics').select('*').eq('admin_id', adminId).single();
      if (!error) return { success: true, ...data };
    } catch { /* fall through to api.js */ }
  }

  try {
    const data = await api.get(`/admin/metrics/admin/${adminId}`);
    return { success: true, ...data };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

export async function getTeamMetrics({ role } = {}) {
  if (isSupabaseConfigured()) {
    try {
      let query = supabase.from('admin_metrics').select('*');
      if (role) query = query.eq('role', role);
      const { data, error } = await query;
      if (!error) return { success: true, metrics: data };
    } catch { /* fall through to api.js */ }
  }

  try {
    const data = await api.get('/admin/metrics/team', { params: { role } });
    return { success: true, ...data };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

export async function getCSATScores({ adminId, period } = {}) {
  if (isSupabaseConfigured()) {
    try {
      let query = supabase.from('csat_scores').select('*');
      if (adminId) query = query.eq('admin_id', adminId);
      if (period) query = query.eq('period', period);
      const { data, error } = await query;
      if (!error) return { success: true, scores: data };
    } catch { /* fall through to api.js */ }
  }

  try {
    const data = await api.get('/admin/metrics/csat', { params: { adminId, period } });
    return { success: true, ...data };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

// -- Admin Role Management (Extended) --

export async function updateAdminRole(adminId, { role, reason }) {
  if (isSupabaseConfigured()) {
    try {
      const { data, error } = await supabase
        .from('users')
        .update({ role, role_change_reason: reason })
        .eq('id', adminId)
        .select()
        .single();
      if (!error) {
        try { await logAction({ action: AUDIT_ACTIONS.ADMIN_EDIT_ROLE, targetId: adminId, targetType: 'admin', details: `Admin ${adminId} role updated to ${role}`, adminId: null, adminRole: 'system' }); } catch { /* audit failure must not break the flow */ }
        return { success: true, ...data };
      }
    } catch { /* fall through to api.js */ }
  }

  try {
    const data = await api.patch(`/admin/admins/${adminId}/role`, { role, reason });
    try { await logAction({ action: AUDIT_ACTIONS.ADMIN_EDIT_ROLE, targetId: adminId, targetType: 'admin', details: `Admin ${adminId} role updated to ${role}`, adminId: null, adminRole: 'system' }); } catch { /* audit failure must not break the flow */ }
    return { success: true, ...data };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

export async function deleteAdmin(adminId, { reason }) {
  if (isSupabaseConfigured()) {
    try {
      const { data, error } = await supabase
        .from('users')
        .update({ status: 'deleted', delete_reason: reason, deleted_at: new Date().toISOString() })
        .eq('id', adminId)
        .select()
        .single();
      if (!error) {
        try { await logAction({ action: AUDIT_ACTIONS.ADMIN_DELETE, targetId: adminId, targetType: 'admin', details: `Admin ${adminId} deleted`, adminId: null, adminRole: 'system' }); } catch { /* audit failure must not break the flow */ }
        return { success: true, ...data };
      }
    } catch { /* fall through to api.js */ }
  }

  try {
    const data = await api.post(`/admin/admins/${adminId}/delete`, { reason });
    try { await logAction({ action: AUDIT_ACTIONS.ADMIN_DELETE, targetId: adminId, targetType: 'admin', details: `Admin ${adminId} deleted`, adminId: null, adminRole: 'system' }); } catch { /* audit failure must not break the flow */ }
    return { success: true, ...data };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

export async function reactivateAdmin(adminId) {
  if (isSupabaseConfigured()) {
    try {
      const { data, error } = await supabase
        .from('users')
        .update({ status: 'active' })
        .eq('id', adminId)
        .select()
        .single();
      if (!error) return { success: true, ...data };
    } catch { /* fall through to api.js */ }
  }

  try {
    const data = await api.post(`/admin/admins/${adminId}/reactivate`);
    return { success: true, ...data };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

export async function restrictPermissions(adminId, { permissions, reason }) {
  if (isSupabaseConfigured()) {
    try {
      const { data, error } = await supabase
        .from('users')
        .update({ restricted_permissions: permissions, restriction_reason: reason })
        .eq('id', adminId)
        .select()
        .single();
      if (!error) {
        try { await logAction({ action: AUDIT_ACTIONS.ADMIN_RESTRICT, targetId: adminId, targetType: 'admin', details: `Admin ${adminId} permissions restricted`, adminId: null, adminRole: 'system' }); } catch { /* audit failure must not break the flow */ }
        return { success: true, ...data };
      }
    } catch { /* fall through to api.js */ }
  }

  try {
    const data = await api.post(`/admin/admins/${adminId}/restrict`, { permissions, reason });
    try { await logAction({ action: AUDIT_ACTIONS.ADMIN_RESTRICT, targetId: adminId, targetType: 'admin', details: `Admin ${adminId} permissions restricted`, adminId: null, adminRole: 'system' }); } catch { /* audit failure must not break the flow */ }
    return { success: true, ...data };
  } catch (err) {
    return { success: false, error: err.message };
  }
}
