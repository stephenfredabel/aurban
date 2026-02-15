import api from './api.js';
import { supabase, isSupabaseConfigured } from '../lib/supabase.js';

/**
 * Audit Log Service
 * Sends admin action logs to backend API.
 * Falls back to sessionStorage append-only log when API is unavailable.
 * All methods return { success, data?, error? }
 */

// -- Audit action types --

export const AUDIT_ACTIONS = {
  // -- Users --
  USER_VIEW:             'user.view',
  USER_EDIT:             'user.edit',
  USER_SUSPEND:          'user.suspend',
  USER_UNSUSPEND:        'user.unsuspend',
  USER_TEMP_SUSPEND:     'user.temp_suspend',
  USER_BAN:              'user.ban',
  USER_DELETE:           'user.delete',
  USER_MERGE:            'user.merge_accounts',
  USER_UNLOCK:           'user.unlock_account',
  USER_VIEW_PII:         'user.view_pii',

  // -- Listings --
  LISTING_APPROVE:       'listing.approve',
  LISTING_REJECT:        'listing.reject',
  LISTING_FLAG:          'listing.flag',
  LISTING_DELETE:        'listing.delete',
  LISTING_REQUEST_EDIT:  'listing.request_edit',
  LISTING_FEATURE:       'listing.feature',
  LISTING_BULK_ACTION:   'listing.bulk_action',

  // -- Bookings --
  BOOKING_CANCEL:        'booking.cancel',
  BOOKING_DISPUTE:       'booking.resolve_dispute',
  BOOKING_OVERRIDE:      'booking.override',

  // -- Payments & Finance --
  ESCROW_RELEASE:        'payment.escrow_release',
  ESCROW_FREEZE:         'payment.escrow_freeze',
  REFUND_PROCESS:        'payment.refund',
  REFUND_DUAL_APPROVE:   'payment.refund_dual_approve',
  PAYOUT_PROCESS:        'payment.payout',
  PAYOUT_HOLD:           'payment.payout_hold',
  RECONCILIATION_RUN:    'payment.reconciliation',
  TAX_REPORT_GENERATE:   'payment.tax_report',

  // -- Verification --
  VERIFY_APPROVE:        'verification.approve',
  VERIFY_REJECT:         'verification.reject',
  VERIFY_REQUEST_DOCS:   'verification.request_docs',
  VERIFY_UPGRADE_TIER:   'verification.upgrade_tier',

  // -- KYC & Compliance --
  KYC_APPROVE:           'kyc.approve',
  KYC_REJECT:            'kyc.reject',
  KYC_FLAG_RISK:         'kyc.flag_risk',
  KYC_FREEZE:            'kyc.freeze_account',
  KYC_SANCTIONS_SCREEN:  'kyc.sanctions_screening',
  KYC_FILE_SAR:          'kyc.file_sar',
  KYC_RISK_SCORE:        'kyc.risk_scoring',
  KYC_BLOCK_JURISDICTION:'kyc.block_jurisdiction',

  // -- Compliance & Data Privacy --
  COMPLIANCE_GDPR:       'compliance.gdpr_request',
  COMPLIANCE_DATA_EXPORT:'compliance.data_export',
  COMPLIANCE_DATA_DELETE: 'compliance.data_delete',
  COMPLIANCE_POLICY_UPDATE:'compliance.policy_update',

  // -- Support --
  TICKET_RESPOND:        'ticket.respond',
  TICKET_ESCALATE:       'ticket.escalate',
  TICKET_CLOSE:          'ticket.close',
  TICKET_REASSIGN:       'ticket.reassign',

  // -- Reports --
  REPORT_RESOLVE:        'report.resolve',
  REPORT_ESCALATE:       'report.escalate',

  // -- Escalation System --
  ESCALATION_CREATE:     'escalation.create',
  ESCALATION_ACCEPT:     'escalation.accept',
  ESCALATION_RESOLVE:    'escalation.resolve',
  ESCALATION_REJECT:     'escalation.reject',
  ESCALATION_AUTO:       'escalation.auto_escalate',

  // -- Inter-Admin Messaging --
  MESSAGE_SEND:          'messaging.send',
  MESSAGE_READ:          'messaging.read',

  // -- Provider Management --
  PROVIDER_SUSPEND:      'provider.suspend',
  PROVIDER_REMOVE:       'provider.remove',
  PROVIDER_PERFORMANCE:  'provider.view_performance',

  // -- Quality & SLA --
  QUALITY_REVIEW:        'quality.review_decision',
  QUALITY_OVERRIDE:      'quality.override',
  SLA_BREACH:            'sla.breach',
  SLA_ACKNOWLEDGE:       'sla.acknowledge',
  CSAT_SUBMIT:           'csat.submit',

  // -- Settings --
  SETTINGS_UPDATE:       'settings.update',
  SETTINGS_COMMISSION:   'settings.commission',
  SETTINGS_FEATURE_FLAG: 'settings.feature_flag',
  SETTINGS_PAYMENT_GW:   'settings.payment_gateway',
  SETTINGS_REGION:       'settings.region_management',

  // -- Admin Management --
  ADMIN_CREATE:          'admin.create',
  ADMIN_SUSPEND:         'admin.suspend',
  ADMIN_EDIT_ROLE:       'admin.edit_role',
  ADMIN_DELETE:          'admin.delete',
  ADMIN_FORCE_RESET:     'admin.force_password_reset',
  ADMIN_VIEW_SESSIONS:   'admin.view_sessions',
  ADMIN_RESTRICT:        'admin.restrict_permissions',

  // -- Auth --
  ADMIN_LOGIN:           'auth.login',
  ADMIN_LOGIN_FAIL:      'auth.login_fail',
  ADMIN_LOGOUT:          'auth.logout',
  ADMIN_REAUTH:          'auth.reauth',
  ADMIN_2FA_VERIFY:      'auth.2fa_verify',
  ADMIN_SESSION_EXPIRE:  'auth.session_expire',
  ADMIN_IP_BLOCKED:      'auth.ip_blocked',
};

const STORAGE_KEY = 'aurban_audit_log';

// -- Local fallback --

function appendLocal(entry) {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    const logs = raw ? JSON.parse(raw) : [];
    logs.push(entry);
    // Keep last 200 entries to avoid storage overflow
    if (logs.length > 200) logs.splice(0, logs.length - 200);
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(logs));
  } catch { /* storage full or unavailable */ }
}

function getLocalLogs() {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

// -- API methods --

/**
 * Log an admin action. Always succeeds (falls back to local storage).
 *
 * @param {Object} params
 * @param {string} params.action      - One of AUDIT_ACTIONS values
 * @param {string} params.targetId    - ID of the entity acted upon
 * @param {string} params.targetType  - Type: 'user', 'listing', 'booking', 'payment', etc.
 * @param {string} params.details     - Human-readable description
 * @param {string} params.adminId     - ID of the admin performing the action
 * @param {string} params.adminRole   - Role of the admin
 */
export async function logAction({ action, targetId, targetType, details, adminId, adminRole }) {
  const entry = {
    id:        `audit_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    action,
    targetId:   targetId || null,
    targetType: targetType || null,
    details:    details || '',
    adminId:    adminId || null,
    adminRole:  adminRole || null,
    timestamp:  Date.now(),
    ip:         null, // Set server-side
  };

  // Always store locally first (append-only)
  appendLocal(entry);

  if (isSupabaseConfigured()) {
    try {
      const { error } = await supabase.from('audit_logs').insert({
        action: entry.action,
        target_id: entry.targetId,
        target_type: entry.targetType,
        details: entry.details,
        admin_id: entry.adminId,
        admin_role: entry.adminRole,
        timestamp: new Date(entry.timestamp).toISOString(),
      });
      if (!error) return { success: true };
    } catch { /* fall through to api.js */ }
  }

  // Try API
  try {
    await api.post('/admin/audit', entry);
    return { success: true };
  } catch {
    // Silently fall back -- local log already saved
    return { success: true };
  }
}

/**
 * Fetch audit logs (paginated, filterable).
 * Falls back to local logs when API is unavailable.
 */
export async function getAuditLogs({
  page = 1,
  limit = 50,
  action,
  adminId,
  targetType,
  startDate,
  endDate,
} = {}) {
  if (isSupabaseConfigured()) {
    try {
      const offset = (page - 1) * limit;
      let query = supabase.from('audit_logs').select('*', { count: 'exact' });
      if (action) query = query.eq('action', action);
      if (adminId) query = query.eq('admin_id', adminId);
      if (targetType) query = query.eq('target_type', targetType);
      if (startDate) query = query.gte('timestamp', new Date(startDate).toISOString());
      if (endDate) query = query.lte('timestamp', new Date(endDate).toISOString());
      query = query.order('timestamp', { ascending: false });
      const { data, error, count } = await query.range(offset, offset + limit - 1);
      if (!error) return { success: true, logs: data, total: count, page };
    } catch { /* fall through to api.js */ }
  }

  try {
    const data = await api.get('/admin/audit', {
      params: { page, limit, action, adminId, targetType, startDate, endDate },
    });
    return { success: true, ...data };
  } catch {
    // Fallback: filter local logs
    let logs = getLocalLogs();

    if (action)     logs = logs.filter(l => l.action === action);
    if (adminId)    logs = logs.filter(l => l.adminId === adminId);
    if (targetType) logs = logs.filter(l => l.targetType === targetType);
    if (startDate)  logs = logs.filter(l => l.timestamp >= new Date(startDate).getTime());
    if (endDate)    logs = logs.filter(l => l.timestamp <= new Date(endDate).getTime());

    // Sort newest first
    logs.sort((a, b) => b.timestamp - a.timestamp);

    const start = (page - 1) * limit;
    return {
      success: true,
      logs:    logs.slice(start, start + limit),
      total:   logs.length,
      page,
    };
  }
}

/**
 * Export audit logs as JSON array (for admin download).
 */
export async function exportAuditLogs(filters = {}) {
  if (isSupabaseConfigured()) {
    try {
      let query = supabase.from('audit_logs').select('*');
      if (filters.action) query = query.eq('action', filters.action);
      if (filters.adminId) query = query.eq('admin_id', filters.adminId);
      if (filters.targetType) query = query.eq('target_type', filters.targetType);
      if (filters.startDate) query = query.gte('timestamp', new Date(filters.startDate).toISOString());
      if (filters.endDate) query = query.lte('timestamp', new Date(filters.endDate).toISOString());
      query = query.order('timestamp', { ascending: false });
      const { data, error } = await query;
      if (!error) return { success: true, data };
    } catch { /* fall through to api.js */ }
  }

  try {
    const data = await api.get('/admin/audit/export', { params: filters });
    return { success: true, data };
  } catch {
    // Fallback: return local logs
    return { success: true, data: getLocalLogs() };
  }
}
