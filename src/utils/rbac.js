// ─────────────────────────────────────────────────────────────
// Aurban — Role-Based Access Control (RBAC)
//
// 7 admin roles with granular permissions.
// Legacy 'admin' role auto-maps to 'super_admin'.
//
// Modelled after: Airbnb Trust & Safety, Amazon Seller Central,
// Stripe Dashboard, Uber Admin Ops.
//
// Principles:
//   • Least Privilege — minimum access needed
//   • Separation of Duties — no single point of failure
//   • Escalation Over Access — route, don't grant
//   • Audit Everything — every action is immutably logged
// ─────────────────────────────────────────────────────────────

// ── Admin entry path (non-obvious — security through obscurity layer) ──
// Change this single constant to rotate the admin login URL.
// Never use /admin, /console, /dashboard, /ops, /manage, etc.
export const ADMIN_ENTRY_PATH = '/ax7-internal';

// ── Admin roles ──────────────────────────────────────────────

export const ADMIN_ROLES = [
  'super_admin',
  'operations_admin',
  'moderator',
  'verification_admin',
  'support_admin',
  'finance_admin',
  'compliance_admin',
];

// ── Role levels (hierarchy depth) ────────────────────────────
// L0 = God, L1 = Director, L2 = Specialist

export const ROLE_LEVELS = {
  super_admin:       0,
  finance_admin:     1,
  operations_admin:  1,
  compliance_admin:  1,
  moderator:         2,
  verification_admin:2,
  support_admin:     2,
};

// ── Role metadata ────────────────────────────────────────────

export const ROLE_LABELS = {
  super_admin:       'Super Admin',
  operations_admin:  'Operations Admin',
  moderator:         'Moderator',
  verification_admin:'Verification Admin',
  support_admin:     'Support Admin',
  finance_admin:     'Finance Admin',
  compliance_admin:  'Compliance Admin',
  // Non-admin roles
  host:     'Host',
  agent:    'Agent',
  seller:   'Seller',
  service:  'Service Provider',
  provider: 'Provider',
  user:     'User',
};

export const ROLE_COLORS = {
  super_admin:       'bg-red-50 dark:bg-red-500/10 text-red-600',
  operations_admin:  'bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600',
  moderator:         'bg-amber-50 dark:bg-amber-500/10 text-amber-600',
  verification_admin:'bg-teal-50 dark:bg-teal-500/10 text-teal-600',
  support_admin:     'bg-sky-50 dark:bg-sky-500/10 text-sky-600',
  finance_admin:     'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600',
  compliance_admin:  'bg-purple-50 dark:bg-purple-500/10 text-purple-600',
  // Non-admin roles (kept for sidebar badge)
  host:     'bg-blue-50 dark:bg-blue-500/10 text-blue-600',
  agent:    'bg-purple-50 dark:bg-purple-500/10 text-purple-600',
  seller:   'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600',
  service:  'bg-orange-50 dark:bg-orange-500/10 text-orange-600',
  provider: 'bg-brand-gold/10 text-brand-gold',
};

export const ROLE_DASHBOARD_LABELS = {
  super_admin:       'Super Admin Dashboard',
  operations_admin:  'Operations Dashboard',
  moderator:         'Moderation Dashboard',
  verification_admin:'Verification Dashboard',
  support_admin:     'Support Dashboard',
  finance_admin:     'Finance Dashboard',
  compliance_admin:  'Compliance Dashboard',
  host:     'Host Dashboard',
  agent:    'Agent Dashboard',
  seller:   'Seller Dashboard',
  service:  'Service Provider',
  provider: 'Provider Dashboard',
};

// ── Domain / subdomain per role (for future multi-domain setup) ──
// SECURITY: Use non-obvious subdomain names. Never use predictable
// names like console, admin, dashboard, ops, finance, manage, etc.
// Attacker subdomain scanners try common names — these must not match.

export const ROLE_DOMAINS = {
  super_admin:       'ax7-internal.aurban.com',
  finance_admin:     'fp3-internal.aurban.com',
  operations_admin:  'kw9-internal.aurban.com',
  compliance_admin:  'rc4-internal.aurban.com',
  moderator:         'kw9-internal.aurban.com',
  verification_admin:'kw9-internal.aurban.com',
  support_admin:     'kw9-internal.aurban.com',
};

// ── Permission map ───────────────────────────────────────────
// Format: 'resource:action' → roles that can perform it
// super_admin has all permissions implicitly (checked in hasPermission)
//
// Blueprint alignment: Section 11 — Complete Permissions Matrix

export const PERMISSIONS = {
  // ═══ Dashboard ═══
  'dashboard:view':              ADMIN_ROLES,
  'dashboard:view_revenue':      ['super_admin', 'finance_admin'],
  'dashboard:view_system_health':['super_admin'],

  // ═══ Admin management (Super Admin ONLY) ═══
  'admins:view':                 ['super_admin'],
  'admins:create':               ['super_admin'],
  'admins:edit_role':            ['super_admin'],
  'admins:suspend':              ['super_admin'],
  'admins:delete':               ['super_admin'],
  'admins:force_password_reset': ['super_admin'],
  'admins:view_sessions':        ['super_admin'],
  'admins:restrict_permissions': ['super_admin'],

  // ═══ Platform configuration (Super Admin ONLY) ═══
  'settings:view':               ['super_admin'],
  'settings:edit':               ['super_admin'],
  'settings:commission':         ['super_admin'],
  'settings:feature_flags':      ['super_admin'],
  'settings:payment_gateway':    ['super_admin'],
  'settings:region_management':  ['super_admin'],
  'settings:announcements':      ['super_admin'],

  // ═══ User management ═══
  'users:view':                  ['super_admin', 'operations_admin', 'support_admin', 'compliance_admin'],
  'users:edit':                  ['super_admin', 'operations_admin'],
  'users:view_pii_masked':       ['super_admin', 'operations_admin', 'compliance_admin', 'support_admin'],
  'users:view_pii_unmasked':     ['super_admin', 'compliance_admin'],
  'users:temp_suspend':          ['super_admin', 'operations_admin', 'support_admin', 'moderator'],
  'users:suspend':               ['super_admin', 'operations_admin'],
  'users:ban_permanent':         ['super_admin', 'operations_admin'],
  'users:delete':                ['super_admin'],
  'users:merge_accounts':        ['super_admin', 'operations_admin'],
  'users:unlock_account':        ['super_admin', 'operations_admin', 'support_admin'],
  'users:update_profile':        ['super_admin', 'operations_admin', 'support_admin'],
  'users:reset_verification':    ['super_admin', 'operations_admin', 'support_admin'],
  // Backward compat alias
  'users:view_pii':              ['super_admin', 'compliance_admin', 'support_admin'],

  // ═══ Listing moderation ═══
  'listings:view':               ['super_admin', 'operations_admin', 'moderator'],
  'listings:approve':            ['super_admin', 'operations_admin', 'moderator'],
  'listings:reject':             ['super_admin', 'operations_admin', 'moderator'],
  'listings:flag':               ['super_admin', 'operations_admin', 'moderator'],
  'listings:request_edit':       ['super_admin', 'operations_admin', 'moderator'],
  'listings:delete':             ['super_admin', 'operations_admin'],
  'listings:bulk_actions':       ['super_admin', 'operations_admin'],
  'listings:feature':            ['super_admin', 'operations_admin'],

  // ═══ Booking oversight ═══
  'bookings:view':               ['super_admin', 'operations_admin', 'support_admin'],
  'bookings:cancel':             ['super_admin', 'operations_admin'],
  'bookings:modify':             ['super_admin', 'operations_admin', 'support_admin'],
  'bookings:resolve_dispute':    ['super_admin', 'operations_admin', 'support_admin'],

  // ═══ Payments & escrow ═══
  'payments:view':               ['super_admin', 'finance_admin'],
  'payments:view_amounts':       ['super_admin', 'finance_admin'],
  'payments:release_escrow':     ['super_admin', 'finance_admin'],
  'payments:freeze_escrow':      ['super_admin', 'finance_admin'],
  'payments:process_refund':     ['super_admin', 'finance_admin'],
  'payments:process_refund_small':['super_admin', 'finance_admin', 'support_admin'],
  'payments:process_payout':     ['super_admin', 'finance_admin'],
  'payments:dual_approve':       ['super_admin', 'finance_admin'],
  'payments:view_reports':       ['super_admin', 'finance_admin'],
  'payments:tax_reporting':      ['super_admin', 'finance_admin'],
  'payments:reconciliation':     ['super_admin', 'finance_admin'],
  'payments:chargeback':         ['super_admin', 'finance_admin'],

  // ═══ Analytics ═══
  'analytics:view':              ['super_admin', 'operations_admin', 'finance_admin'],
  'analytics:export':            ['super_admin', 'operations_admin'],
  'analytics:view_revenue':      ['super_admin', 'finance_admin'],
  'analytics:view_engagement':   ['super_admin', 'operations_admin'],

  // ═══ Reports ═══
  'reports:view':                ['super_admin', 'operations_admin', 'moderator', 'support_admin'],
  'reports:resolve':             ['super_admin', 'operations_admin', 'moderator'],
  'reports:escalate':            ['super_admin', 'operations_admin', 'moderator', 'support_admin'],

  // ═══ Verification (provider documents) ═══
  'verification:view':           ['super_admin', 'operations_admin', 'verification_admin'],
  'verification:approve':        ['super_admin', 'operations_admin', 'verification_admin'],
  'verification:reject':         ['super_admin', 'operations_admin', 'verification_admin'],
  'verification:request_docs':   ['super_admin', 'operations_admin', 'verification_admin'],
  'verification:upgrade_tier':   ['super_admin', 'operations_admin'],

  // ═══ Support tickets ═══
  'tickets:view':                ['super_admin', 'operations_admin', 'support_admin'],
  'tickets:respond':             ['super_admin', 'operations_admin', 'support_admin'],
  'tickets:escalate':            ['super_admin', 'operations_admin', 'support_admin'],
  'tickets:close':               ['super_admin', 'operations_admin', 'support_admin'],
  'tickets:label':               ['super_admin', 'operations_admin', 'support_admin'],
  'tickets:route':               ['super_admin', 'operations_admin', 'support_admin'],

  // ═══ Live chat ═══
  'chat:live':                   ['super_admin', 'operations_admin', 'support_admin'],
  'chat:route':                  ['super_admin', 'operations_admin', 'support_admin'],

  // ═══ KYC / Compliance ═══
  'kyc:view':                    ['super_admin', 'compliance_admin'],
  'kyc:approve':                 ['super_admin', 'compliance_admin'],
  'kyc:approve_l3':              ['super_admin', 'compliance_admin', 'verification_admin'],
  'kyc:reject':                  ['super_admin', 'compliance_admin'],
  'kyc:flag_risk':               ['super_admin', 'compliance_admin'],
  'kyc:freeze_account':          ['super_admin', 'compliance_admin'],
  'kyc:sanctions_screening':     ['super_admin', 'compliance_admin'],
  'kyc:file_sar':                ['super_admin', 'compliance_admin'],
  'kyc:risk_scoring':            ['super_admin', 'compliance_admin'],
  'kyc:block_jurisdiction':      ['super_admin', 'compliance_admin'],
  'kyc:view_documents':          ['super_admin', 'compliance_admin', 'verification_admin'],

  // ═══ Data privacy & regulatory ═══
  'compliance:gdpr_requests':    ['super_admin', 'compliance_admin'],
  'compliance:data_export':      ['super_admin', 'compliance_admin'],
  'compliance:consent_management':['super_admin', 'compliance_admin'],
  'compliance:data_retention':   ['super_admin', 'compliance_admin'],

  // ═══ Audit logs ═══
  'audit:view':                  ['super_admin', 'compliance_admin'],
  'audit:export':                ['super_admin'],
  'audit:admin_behavior':        ['super_admin'],

  // ═══ Escalation system ═══
  'escalation:create':           ADMIN_ROLES,
  'escalation:receive':          ['super_admin', 'finance_admin', 'operations_admin', 'compliance_admin'],

  // ═══ Inter-admin messaging ═══
  'messaging:admin_chat':        ADMIN_ROLES,
  'messaging:panel_channels':    ADMIN_ROLES,
  'messaging:secure_send':       ['super_admin'],
  'messaging:file_upload':       ['super_admin'],
  'messaging:voice_note':        ['super_admin'],

  // ═══ Provider management (Ops-level) ═══
  'providers:view':              ['super_admin', 'operations_admin', 'support_admin'],
  'providers:suspend':           ['super_admin', 'operations_admin'],
  'providers:remove':            ['super_admin'],
  'providers:view_performance':  ['super_admin', 'operations_admin'],

  // ═══ Quality auditing ═══
  'quality:review_decisions':    ['super_admin', 'operations_admin'],
  'quality:view_metrics':        ['super_admin', 'operations_admin'],

  // ═══ Aurban Pro — Admin operations ═══
  'pro:escrow_view':             ['super_admin', 'finance_admin', 'operations_admin'],
  'pro:escrow_manage':           ['super_admin', 'finance_admin'],
  'pro:safety_view':             ['super_admin', 'operations_admin', 'support_admin'],
  'pro:safety_manage':           ['super_admin', 'operations_admin'],
  'pro:rectification_view':      ['super_admin', 'operations_admin', 'support_admin'],
  'pro:rectification_manage':    ['super_admin', 'operations_admin'],
  'pro:verification_view':       ['super_admin', 'operations_admin', 'verification_admin'],
  'pro:verification_manage':     ['super_admin', 'operations_admin', 'verification_admin'],
  'pro:config_view':             ['super_admin'],
  'pro:config_manage':           ['super_admin'],
};

// ── Critical actions (require password re-entry) ─────────────

export const CRITICAL_ACTIONS = [
  'users:ban_permanent',
  'users:delete',
  'payments:release_escrow',
  'payments:freeze_escrow',
  'payments:process_refund',
  'payments:process_payout',
  'payments:dual_approve',
  'settings:edit',
  'settings:commission',
  'settings:payment_gateway',
  'kyc:freeze_account',
  'kyc:file_sar',
  'kyc:block_jurisdiction',
  'admins:create',
  'admins:suspend',
  'admins:delete',
  'admins:edit_role',
  'providers:remove',
];

// ── Action risk levels ───────────────────────────────────────

export const RISK_LEVELS = {
  low:      ['listings:view', 'bookings:view', 'users:view', 'analytics:view', 'reports:view',
             'dashboard:view', 'tickets:view', 'kyc:view', 'audit:view', 'verification:view',
             'payments:view', 'settings:view', 'providers:view', 'messaging:admin_chat',
             'users:view_pii_masked', 'analytics:view_engagement', 'quality:view_metrics'],
  medium:   ['listings:approve', 'listings:reject', 'listings:flag', 'listings:request_edit',
             'users:edit', 'users:update_profile', 'users:unlock_account', 'users:reset_verification',
             'tickets:respond', 'tickets:close', 'tickets:label', 'tickets:route',
             'reports:resolve', 'verification:request_docs', 'analytics:export', 'audit:export',
             'chat:live', 'chat:route', 'escalation:create', 'users:temp_suspend',
             'bookings:modify', 'payments:process_refund_small'],
  high:     ['users:suspend', 'bookings:cancel', 'bookings:resolve_dispute', 'reports:escalate',
             'tickets:escalate', 'verification:approve', 'verification:reject', 'verification:upgrade_tier',
             'kyc:approve', 'kyc:approve_l3', 'kyc:reject', 'kyc:flag_risk', 'kyc:sanctions_screening',
             'kyc:risk_scoring', 'listings:delete', 'listings:bulk_actions', 'listings:feature',
             'users:ban_permanent', 'users:merge_accounts', 'users:view_pii_unmasked',
             'providers:suspend', 'compliance:gdpr_requests', 'compliance:data_export',
             'quality:review_decisions'],
  critical: CRITICAL_ACTIONS,
};

// ── Role hierarchy ────────────────────────────────────────
// Defines reporting structure. Parent roles can oversee child roles.

export const ROLE_HIERARCHY = {
  super_admin:       ['finance_admin', 'operations_admin', 'compliance_admin'],
  operations_admin:  ['moderator', 'verification_admin', 'support_admin'],
  finance_admin:     [],
  compliance_admin:  [],
  moderator:         [],
  verification_admin:[],
  support_admin:     [],
};

// ── Authentication requirements per role ─────────────────────
// Based on blueprint Section 10

export const AUTH_REQUIREMENTS = {
  super_admin: {
    layers: 4,                          // Email + Password + Secret Question + Secret Key
    method: 'email_password_question_secretkey',
    sessionTimeoutMs: 15 * 60 * 1000,   // 15 min idle → lock screen
    ipRestriction: true,                // Hardcoded IP whitelist
    secretKeyRotationDays: 90,
    label: 'Email + Password + Secret Question + Secret Key',
  },
  finance_admin: {
    layers: 3,                          // Email + Password + TOTP 2FA
    method: 'email_password_totp',
    sessionTimeoutMs: 15 * 60 * 1000,   // 15 min idle → lock screen
    ipRestriction: true,                // Office IP or approved VPN
    reauthForPayouts: true,             // Re-auth required for every payout batch
    label: 'Email + Password + TOTP 2FA + IP Whitelist',
  },
  operations_admin: {
    layers: 3,
    method: 'email_password_totp',
    sessionTimeoutMs: 30 * 60 * 1000,   // 30 min idle
    ipRestriction: false,
    label: 'Email + Password + TOTP 2FA',
  },
  compliance_admin: {
    layers: 3,
    method: 'email_password_totp',
    sessionTimeoutMs: 15 * 60 * 1000,   // 15 min idle → lock screen
    ipRestriction: true,                // Office IP or approved VPN
    piiViewLogged: true,                // Every PII view is audit-logged
    label: 'Email + Password + TOTP 2FA + IP Whitelist',
  },
  moderator: {
    layers: 3,
    method: 'email_password_totp',
    sessionTimeoutMs: 30 * 60 * 1000,
    ipRestriction: false,
    label: 'Email + Password + TOTP 2FA',
  },
  verification_admin: {
    layers: 3,
    method: 'email_password_totp',
    sessionTimeoutMs: 30 * 60 * 1000,
    ipRestriction: false,
    label: 'Email + Password + TOTP 2FA',
  },
  support_admin: {
    layers: 3,
    method: 'email_password_totp',
    sessionTimeoutMs: 60 * 60 * 1000,   // 60 min — longer for active chat sessions
    ipRestriction: false,
    label: 'Email + Password + TOTP 2FA',
  },
};

// ── Escalation routes ────────────────────────────────────────
// From → To → When (for escalation system UI)

export const ESCALATION_ROUTES = [
  { from: 'support_admin',      to: 'operations_admin',  when: 'Complex issue beyond Support authority',     example: 'Provider threatening legal action over listing removal' },
  { from: 'support_admin',      to: 'finance_admin',     when: 'Refund >₦100K or payment investigation',     example: 'User claims ₦500K charge but booking cancelled', via: 'operations_admin' },
  { from: 'support_admin',      to: 'compliance_admin',  when: 'Fraud suspicion or identity concern',        example: 'User reports provider using fake business name', via: 'operations_admin' },
  { from: 'moderator',          to: 'operations_admin',  when: 'Severe policy violation or provider pattern', example: 'Same provider flagged 10 times in one week' },
  { from: 'verification_admin', to: 'operations_admin',  when: 'Suspicious documents or edge case',          example: 'CAC certificate looks altered or expired' },
  { from: 'verification_admin', to: 'compliance_admin',  when: 'Identity fraud suspicion',                   example: 'Selfie doesn\'t match any submitted ID' },
  { from: 'operations_admin',   to: 'finance_admin',     when: 'Financial dispute or large refund',           example: 'Dispute over ₦2M property booking' },
  { from: 'operations_admin',   to: 'compliance_admin',  when: 'AML red flag or regulatory question',        example: 'Provider received 20 large payments from new accounts' },
  { from: 'finance_admin',      to: 'compliance_admin',  when: 'Transaction anomaly suggesting fraud',       example: 'Structured payments avoiding threshold reporting' },
  { from: '*',                  to: 'super_admin',       when: 'Cannot resolve at current level',             example: 'Conflicting decisions between two panels' },
];

// ── Escalation targets per role ──────────────────────────────

export const ESCALATION_TARGETS = {
  support_admin:      ['operations_admin', 'super_admin'],
  moderator:          ['operations_admin', 'super_admin'],
  verification_admin: ['operations_admin', 'compliance_admin', 'super_admin'],
  operations_admin:   ['finance_admin', 'compliance_admin', 'super_admin'],
  finance_admin:      ['compliance_admin', 'super_admin'],
  compliance_admin:   ['super_admin'],
  super_admin:        [],
};

// ── SLA targets ──────────────────────────────────────────────
// Based on blueprint Section 12

export const SLA_TARGETS = {
  P1: {
    label: 'Critical',
    description: 'Account compromise, safety threat, payment fraud in progress',
    firstResponseMs:    15 * 60 * 1000,     // 15 minutes
    resolutionTargetMs: 2 * 60 * 60 * 1000, // 2 hours
    autoEscalate: [
      { afterMs: 30 * 60 * 1000, to: 'operations_admin' },
      { afterMs: 60 * 60 * 1000, to: 'super_admin' },
    ],
  },
  P2: {
    label: 'High',
    description: 'Failed payout, stuck escrow, provider locked out before booking',
    firstResponseMs:    60 * 60 * 1000,      // 1 hour
    resolutionTargetMs: 8 * 60 * 60 * 1000,  // 8 hours
    autoEscalate: [
      { afterMs: 4 * 60 * 60 * 1000,  to: 'operations_admin' },
      { afterMs: 8 * 60 * 60 * 1000,  to: 'super_admin' },
    ],
  },
  P3: {
    label: 'Medium',
    description: 'Listing issues, refund request, verification delay, booking dispute',
    firstResponseMs:    4 * 60 * 60 * 1000,   // 4 hours
    resolutionTargetMs: 24 * 60 * 60 * 1000,  // 24 hours
    autoEscalate: [
      { afterMs: 24 * 60 * 60 * 1000, to: 'operations_admin' },
    ],
  },
  P4: {
    label: 'Low',
    description: 'Feature request, general inquiry, feedback, how-to question',
    firstResponseMs:    24 * 60 * 60 * 1000,  // 24 hours
    resolutionTargetMs: 72 * 60 * 60 * 1000,  // 72 hours
    autoEscalate: [],
    autoCloseMs:        72 * 60 * 60 * 1000,  // Auto-close with follow-up survey
  },
};

// ── Refund thresholds ────────────────────────────────────────
// Based on blueprint Section 12

export const REFUND_THRESHOLDS = {
  support_admin:    { max: 100_000,    approvalNeeded: false, label: '≤₦100K' },
  operations_admin: { max: 500_000,    approvalNeeded: true,  approver: 'single', label: '₦100K–₦500K' },
  finance_admin:    { max: 5_000_000,  approvalNeeded: true,  approver: 'single', label: '₦500K–₦5M' },
  super_admin:      { max: Infinity,   approvalNeeded: true,  approver: 'dual',   label: '>₦5M (dual approval)' },
};

// ── Payout thresholds ────────────────────────────────────────

export const PAYOUT_THRESHOLDS = {
  singleApproval: 5_000_000,   // ≤₦5M — one Finance Admin
  dualApproval:   5_000_001,   // >₦5M — two approvals (Finance + Super)
};

// ── Provider tiers ───────────────────────────────────────────

export const PROVIDER_TIERS = {
  starter:  { level: 1, label: 'Starter',  requirements: 'Business documents confirmed, basic profile, 1+ listings' },
  verified: { level: 2, label: 'Verified', requirements: '6+ months, 4.5+ rating, 90%+ response, 10+ transactions, no violations' },
  pro:      { level: 3, label: 'Pro',      requirements: '12+ months, 4.8+ rating, 95%+ completion, ₦5M+ earnings, insurance docs' },
  elite:    { level: 4, label: 'Elite',    requirements: 'Pro + Ops Admin recommendation' },
};

// ── KYC levels ───────────────────────────────────────────────

export const KYC_LEVELS = {
  L1: { label: 'Basic',    description: 'Email + phone verification',            handler: 'auto' },
  L2: { label: 'Standard', description: 'Government ID + selfie',                handler: 'compliance_admin' },
  L3: { label: 'Provider', description: 'Business docs + CAC + trade license',   handler: ['compliance_admin', 'verification_admin'] },
  L4: { label: 'Enhanced', description: 'Source of funds + additional identity',  handler: 'compliance_admin', threshold: 5_000_000 },
};

// ── Ticket categories ────────────────────────────────────────

export const TICKET_CATEGORIES = [
  { key: 'account',    label: 'Account Issues',   description: 'Locked out, email change, password reset' },
  { key: 'payment',    label: 'Payment Issues',   description: 'Failed payment, missing refund, payout not received' },
  { key: 'listing',    label: 'Listing Issues',   description: 'Listing not appearing, wrong category, image upload' },
  { key: 'booking',    label: 'Booking Issues',   description: 'Cancellation, date change, no-show' },
  { key: 'provider',   label: 'Provider Issues',  description: 'Verification stuck, tier question, earnings inquiry' },
  { key: 'technical',  label: 'Technical Issues', description: 'App crash, loading errors, notification problems' },
  { key: 'trust',      label: 'Trust & Safety',   description: 'Harassment report, scam suspicion, fake listing' },
  { key: 'general',    label: 'General Inquiry',  description: 'How-to questions, feature requests, feedback' },
];

// ── Mock admin accounts (dev only — production uses admin_accounts DB) ──
// Each entry mirrors one row: id | email | role
// Generic emails like admin@aurban.com are NEVER valid.

export const MOCK_ADMIN_ACCOUNTS = [
  { id: 'adm_001', email: 'stephen@aurban.com', name: 'Stephen Okoro',  role: 'super_admin',        phone: '+234 801 000 0001' },
  { id: 'adm_002', email: 'john@aurban.com',    name: 'John Adeyemi',   role: 'finance_admin',      phone: '+234 801 000 0002' },
  { id: 'adm_003', email: 'mary@aurban.com',    name: 'Mary Okonkwo',   role: 'operations_admin',   phone: '+234 801 000 0003' },
  { id: 'adm_004', email: 'ada@aurban.com',     name: 'Ada Nnamdi',     role: 'moderator',          phone: '+234 801 000 0004' },
  { id: 'adm_005', email: 'chidi@aurban.com',   name: 'Chidi Eze',      role: 'verification_admin', phone: '+234 801 000 0005' },
  { id: 'adm_006', email: 'fatima@aurban.com',  name: 'Fatima Bello',   role: 'support_admin',      phone: '+234 801 000 0006' },
  { id: 'adm_007', email: 'emeka@aurban.com',   name: 'Emeka Uche',     role: 'compliance_admin',   phone: '+234 801 000 0007' },
];

// ── Admin queue config ────────────────────────────────────
// What each role sees FIRST on login — their priority queue.
// priority: 'critical' (red) | 'high' (amber) | 'normal' (gray)

export const ADMIN_QUEUES = {
  super_admin: [
    { key: 'escalated_reports', label: 'Escalated Reports',       permission: 'reports:view',             priority: 'critical' },
    { key: 'pending_payouts',   label: 'Pending Payouts',         permission: 'payments:view',            priority: 'critical' },
    { key: 'flagged_users',     label: 'Flagged Users',           permission: 'users:view',               priority: 'high' },
    { key: 'pending_listings',  label: 'Pending Listings',        permission: 'listings:view',            priority: 'normal' },
    { key: 'system_health',     label: 'System Health',           permission: 'settings:view',            priority: 'normal' },
  ],
  finance_admin: [
    { key: 'pending_payouts',   label: 'Pending Payouts',         permission: 'payments:view',            priority: 'critical' },
    { key: 'escrow_releases',   label: 'Escrow Awaiting Release', permission: 'payments:release_escrow',  priority: 'critical' },
    { key: 'refund_requests',   label: 'Refund Requests',         permission: 'payments:process_refund',  priority: 'high' },
    { key: 'revenue_today',     label: 'Revenue Today',           permission: 'analytics:view_revenue',   priority: 'normal' },
  ],
  operations_admin: [
    { key: 'pending_listings',  label: 'Pending Listings',        permission: 'listings:view',            priority: 'critical' },
    { key: 'active_disputes',   label: 'Active Disputes',         permission: 'bookings:resolve_dispute', priority: 'high' },
    { key: 'flagged_users',     label: 'Flagged Users',           permission: 'users:view',               priority: 'high' },
    { key: 'open_reports',      label: 'Open Reports',            permission: 'reports:view',             priority: 'normal' },
  ],
  moderator: [
    { key: 'pending_listings',  label: 'Listings to Review',      permission: 'listings:view',            priority: 'critical' },
    { key: 'flagged_listings',  label: 'Flagged Listings',        permission: 'listings:flag',            priority: 'high' },
    { key: 'open_reports',      label: 'Open Reports',            permission: 'reports:view',             priority: 'normal' },
  ],
  verification_admin: [
    { key: 'pending_kyc',       label: 'Pending Verifications',   permission: 'verification:view',        priority: 'critical' },
    { key: 'docs_requested',    label: 'Docs Awaiting Resubmit',  permission: 'verification:view',        priority: 'high' },
    { key: 'expired_docs',      label: 'Expiring Documents',      permission: 'verification:view',        priority: 'normal' },
  ],
  support_admin: [
    { key: 'urgent_tickets',    label: 'Urgent Tickets',          permission: 'tickets:view',             priority: 'critical' },
    { key: 'open_tickets',      label: 'Open Tickets',            permission: 'tickets:view',             priority: 'high' },
    { key: 'escalated_tickets', label: 'Escalated Tickets',       permission: 'tickets:escalate',         priority: 'high' },
    { key: 'active_disputes',   label: 'Active Disputes',         permission: 'bookings:resolve_dispute', priority: 'normal' },
  ],
  compliance_admin: [
    { key: 'pending_kyc',       label: 'KYC Applications',        permission: 'kyc:view',                 priority: 'critical' },
    { key: 'high_risk_users',   label: 'High-Risk Users',         permission: 'kyc:flag_risk',            priority: 'critical' },
    { key: 'frozen_accounts',   label: 'Frozen Accounts',         permission: 'kyc:freeze_account',       priority: 'high' },
    { key: 'audit_anomalies',   label: 'Audit Anomalies',         permission: 'audit:view',               priority: 'normal' },
  ],
};

// ── Helpers ──────────────────────────────────────────────────

/**
 * Normalize legacy 'admin' role to 'super_admin'.
 */
export function normalizeRole(role) {
  if (role === 'admin') return 'super_admin';
  return role;
}

/**
 * Check if a role is any admin role.
 */
export function isAdminRole(role) {
  const r = normalizeRole(role);
  return ADMIN_ROLES.includes(r);
}

/**
 * Check if a role has a specific permission.
 * super_admin always has all permissions.
 */
export function hasPermission(role, permission) {
  const r = normalizeRole(role);
  if (r === 'super_admin') return true;
  const allowed = PERMISSIONS[permission];
  if (!allowed) return false;
  return allowed.includes(r);
}

/**
 * Check if a role has ANY of the given permissions.
 */
export function hasAnyPermission(role, permissions) {
  return permissions.some(p => hasPermission(role, p));
}

/**
 * Check if a role has ALL of the given permissions.
 */
export function hasAllPermissions(role, permissions) {
  return permissions.every(p => hasPermission(role, p));
}

/**
 * Check if an action is critical (requires re-authentication).
 */
export function isCriticalAction(permission) {
  return CRITICAL_ACTIONS.includes(permission);
}

/**
 * Get the risk level of a permission.
 */
export function getRiskLevel(permission) {
  for (const [level, perms] of Object.entries(RISK_LEVELS)) {
    if (perms.includes(permission)) return level;
  }
  return 'low';
}

/**
 * Get all permissions a role has.
 */
export function getPermissionsForRole(role) {
  const r = normalizeRole(role);
  if (r === 'super_admin') return Object.keys(PERMISSIONS);
  return Object.entries(PERMISSIONS)
    .filter(([, roles]) => roles.includes(r))
    .map(([perm]) => perm);
}

/**
 * Get escalation targets available for a given role.
 */
export function getEscalationTargets(role) {
  const r = normalizeRole(role);
  return ESCALATION_TARGETS[r] || [];
}

/**
 * Check if role A can oversee role B (is parent in hierarchy).
 */
export function canOversee(roleA, roleB) {
  const a = normalizeRole(roleA);
  const b = normalizeRole(roleB);
  if (a === 'super_admin') return true;
  const children = ROLE_HIERARCHY[a] || [];
  if (children.includes(b)) return true;
  // Check transitive (e.g., super_admin → ops_admin → moderator)
  return children.some(child => canOversee(child, b));
}

/**
 * Get the maximum refund amount a role can process.
 */
export function getMaxRefund(role) {
  const r = normalizeRole(role);
  return REFUND_THRESHOLDS[r]?.max || 0;
}

/**
 * Get auth requirements for a role.
 */
export function getAuthRequirements(role) {
  const r = normalizeRole(role);
  return AUTH_REQUIREMENTS[r] || AUTH_REQUIREMENTS.support_admin;
}
