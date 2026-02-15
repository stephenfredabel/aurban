import api from './api.js';

/**
 * Quality, SLA, and CSAT Service
 * Tracks admin performance, SLA compliance, quality audits, and customer satisfaction.
 * Falls back to mock data when API is unavailable.
 */

// ── Mock SLA Tracker Data ──────────────────────────────────

const MOCK_SLA_ITEMS = [
  { id: 'sla_001', entityType: 'ticket', entityId: 'tkt_023', priority: 'P1', label: 'Account compromised — User Emmanuel Okwu',        createdAt: '2026-02-13T08:00:00Z', firstResponseAt: '2026-02-13T08:12:00Z', resolvedAt: null,                       status: 'in_progress', assignedTo: 'adm_006', assignedName: 'Fatima Bello',  role: 'support_admin' },
  { id: 'sla_002', entityType: 'ticket', entityId: 'tkt_024', priority: 'P1', label: 'Fraudulent listing reported — Fake property ad',   createdAt: '2026-02-13T07:30:00Z', firstResponseAt: '2026-02-13T07:48:00Z', resolvedAt: '2026-02-13T08:45:00Z',     status: 'resolved',    assignedTo: 'adm_004', assignedName: 'Ada Nnamdi',    role: 'moderator' },
  { id: 'sla_003', entityType: 'escalation', entityId: 'esc_002', priority: 'P2', label: 'Disputed ₦2M property booking — escrow frozen',  createdAt: '2026-02-12T14:00:00Z', firstResponseAt: '2026-02-13T09:15:00Z', resolvedAt: null,                       status: 'in_progress', assignedTo: 'adm_002', assignedName: 'John Adeyemi',  role: 'finance_admin' },
  { id: 'sla_004', entityType: 'kyc', entityId: 'kyc_047', priority: 'P3', label: 'KYC review — Funke Adeyemi (Agent)',                  createdAt: '2026-02-13T06:00:00Z', firstResponseAt: '2026-02-13T07:00:00Z', resolvedAt: null,                       status: 'in_progress', assignedTo: 'adm_005', assignedName: 'Chidi Eze',     role: 'verification_admin' },
  { id: 'sla_005', entityType: 'report', entityId: 'rpt_112', priority: 'P2', label: 'Repeated noise complaints — Shortlet V.I',         createdAt: '2026-02-13T05:00:00Z', firstResponseAt: '2026-02-13T05:30:00Z', resolvedAt: '2026-02-13T10:00:00Z',     status: 'resolved',    assignedTo: 'adm_003', assignedName: 'Mary Okonkwo', role: 'operations_admin' },
  { id: 'sla_006', entityType: 'ticket', entityId: 'tkt_025', priority: 'P4', label: 'Feature request — Dark mode for provider dashboard', createdAt: '2026-02-12T10:00:00Z', firstResponseAt: '2026-02-12T18:00:00Z', resolvedAt: '2026-02-13T09:00:00Z',    status: 'resolved',    assignedTo: 'adm_006', assignedName: 'Fatima Bello',  role: 'support_admin' },
];

// ── Mock Quality Audit Data ─────────────────────────────────

const MOCK_QUALITY_AUDITS = [
  { id: 'qa_001', reviewedAction: 'listing.approve',     reviewedBy: 'adm_004', reviewedByName: 'Ada Nnamdi',    outcome: 'correct',    auditedBy: 'adm_003', auditedByName: 'Mary Okonkwo',  notes: 'Listing met all quality standards. Correct approval.',                       timestamp: '2026-02-13T09:00:00Z' },
  { id: 'qa_002', reviewedAction: 'kyc.approve',         reviewedBy: 'adm_005', reviewedByName: 'Chidi Eze',     outcome: 'correct',    auditedBy: 'adm_007', auditedByName: 'Emeka Uche',    notes: 'All KYC documents verified. BVN and NIN match. Good decision.',              timestamp: '2026-02-13T08:30:00Z' },
  { id: 'qa_003', reviewedAction: 'listing.reject',      reviewedBy: 'adm_004', reviewedByName: 'Ada Nnamdi',    outcome: 'overturned', auditedBy: 'adm_003', auditedByName: 'Mary Okonkwo',  notes: 'Rejection was premature. Listing had valid photos — misclassified as spam.', timestamp: '2026-02-12T16:00:00Z' },
  { id: 'qa_004', reviewedAction: 'payment.refund',      reviewedBy: 'adm_002', reviewedByName: 'John Adeyemi',  outcome: 'correct',    auditedBy: 'adm_001', auditedByName: 'Stephen Okoro', notes: 'Refund amount correct. Provider cancellation confirmed.',                    timestamp: '2026-02-12T14:00:00Z' },
  { id: 'qa_005', reviewedAction: 'user.suspend',        reviewedBy: 'adm_003', reviewedByName: 'Mary Okonkwo',  outcome: 'needs_review', auditedBy: 'adm_001', auditedByName: 'Stephen Okoro', notes: 'Suspension reason unclear. Requesting more documentation from Ops.',        timestamp: '2026-02-12T11:00:00Z' },
];

// ── Mock CSAT Scores ────────────────────────────────────────

const MOCK_CSAT_SCORES = [
  { id: 'csat_001', adminId: 'adm_006', adminName: 'Fatima Bello',  role: 'support_admin',       score: 5, comment: 'Very helpful, resolved my issue quickly!',              ticketId: 'tkt_020', userId: 'usr_341',  userName: 'Adaeze Obi',        timestamp: '2026-02-13T10:00:00Z' },
  { id: 'csat_002', adminId: 'adm_006', adminName: 'Fatima Bello',  role: 'support_admin',       score: 4, comment: 'Good response but took a while to get back to me.',     ticketId: 'tkt_021', userId: 'usr_455',  userName: 'Tunde Bakare',      timestamp: '2026-02-13T09:00:00Z' },
  { id: 'csat_003', adminId: 'adm_006', adminName: 'Fatima Bello',  role: 'support_admin',       score: 5, comment: 'Excellent! Problem solved in minutes.',                 ticketId: 'tkt_018', userId: 'usr_112',  userName: 'Funke Adeyemi',     timestamp: '2026-02-12T15:00:00Z' },
  { id: 'csat_004', adminId: 'adm_003', adminName: 'Mary Okonkwo',  role: 'operations_admin',    score: 4, comment: 'Professional handling of my listing dispute.',           ticketId: 'esc_004', userId: 'usr_287',  userName: 'Amina Suleiman',    timestamp: '2026-02-12T12:00:00Z' },
  { id: 'csat_005', adminId: 'adm_005', adminName: 'Chidi Eze',     role: 'verification_admin',  score: 3, comment: 'Verification took longer than expected.',               ticketId: 'ver_015', userId: 'usr_560',  userName: 'Ibrahim Musa',      timestamp: '2026-02-12T10:00:00Z' },
  { id: 'csat_006', adminId: 'adm_002', adminName: 'John Adeyemi',  role: 'finance_admin',       score: 5, comment: 'Refund processed same day. Very impressed.',            ticketId: 'pay_032', userId: 'usr_178',  userName: 'Chinwe Eze',        timestamp: '2026-02-11T16:00:00Z' },
];

// ── Mock Admin Performance ──────────────────────────────────

const MOCK_ADMIN_PERFORMANCE = {
  adm_001: { actionsToday: 8,  actionsWeek: 42,  avgResponseMin: 45, slaCompliance: 100, csatAvg: 4.9, qualityScore: 98, streak: 14 },
  adm_002: { actionsToday: 15, actionsWeek: 78,  avgResponseMin: 30, slaCompliance: 95,  csatAvg: 4.7, qualityScore: 96, streak: 7 },
  adm_003: { actionsToday: 18, actionsWeek: 95,  avgResponseMin: 22, slaCompliance: 92,  csatAvg: 4.3, qualityScore: 90, streak: 5 },
  adm_004: { actionsToday: 31, actionsWeek: 148, avgResponseMin: 12, slaCompliance: 88,  csatAvg: 4.4, qualityScore: 85, streak: 3 },
  adm_005: { actionsToday: 22, actionsWeek: 110, avgResponseMin: 15, slaCompliance: 94,  csatAvg: 4.7, qualityScore: 93, streak: 8 },
  adm_006: { actionsToday: 47, actionsWeek: 230, avgResponseMin: 8,  slaCompliance: 97,  csatAvg: 4.6, qualityScore: 94, streak: 12 },
  adm_007: { actionsToday: 11, actionsWeek: 55,  avgResponseMin: 45, slaCompliance: 98,  csatAvg: 4.8, qualityScore: 97, streak: 10 },
};

// ── API Methods ──────────────────────────────────────────────

/**
 * Get SLA tracked items (tickets, escalations, etc.)
 */
export async function getSLAItems({ status, priority, role } = {}) {
  try {
    const data = await api.get('/admin/quality/sla', { params: { status, priority, role } });
    return { success: true, ...data };
  } catch {
    let items = [...MOCK_SLA_ITEMS];
    if (status && status !== 'all') items = items.filter(i => i.status === status);
    if (priority) items = items.filter(i => i.priority === priority);
    if (role) items = items.filter(i => i.role === role);
    return { success: true, items, total: items.length };
  }
}

/**
 * Get quality audit records.
 */
export async function getQualityAudits({ outcome, limit = 20 } = {}) {
  try {
    const data = await api.get('/admin/quality/audits', { params: { outcome, limit } });
    return { success: true, ...data };
  } catch {
    let audits = [...MOCK_QUALITY_AUDITS];
    if (outcome && outcome !== 'all') audits = audits.filter(a => a.outcome === outcome);
    return { success: true, audits, total: audits.length };
  }
}

/**
 * Create a quality audit for a past decision.
 */
export async function createQualityAudit({ reviewedAction, reviewedBy, outcome, notes }) {
  try {
    const data = await api.post('/admin/quality/audits', { reviewedAction, reviewedBy, outcome, notes });
    return { success: true, ...data };
  } catch {
    return { success: true, audit: { id: `qa_${Date.now()}`, timestamp: new Date().toISOString() } };
  }
}

/**
 * Get CSAT scores (optionally filtered by admin or period).
 */
export async function getCSATScores({ adminId, period } = {}) {
  try {
    const data = await api.get('/admin/quality/csat', { params: { adminId, period } });
    return { success: true, ...data };
  } catch {
    let scores = [...MOCK_CSAT_SCORES];
    if (adminId) scores = scores.filter(s => s.adminId === adminId);
    const avg = scores.length > 0 ? +(scores.reduce((sum, s) => sum + s.score, 0) / scores.length).toFixed(1) : 0;
    return { success: true, scores, total: scores.length, average: avg };
  }
}

/**
 * Submit a CSAT score for an admin interaction.
 */
export async function submitCSAT({ adminId, score, comment, ticketId }) {
  try {
    const data = await api.post('/admin/quality/csat', { adminId, score, comment, ticketId });
    return { success: true, ...data };
  } catch {
    return { success: true };
  }
}

/**
 * Get performance metrics for a specific admin.
 */
export async function getAdminPerformance(adminId) {
  try {
    const data = await api.get(`/admin/quality/performance/${adminId}`);
    return { success: true, ...data };
  } catch {
    const perf = MOCK_ADMIN_PERFORMANCE[adminId] || MOCK_ADMIN_PERFORMANCE.adm_001;
    return { success: true, performance: perf };
  }
}

/**
 * Get aggregated team performance metrics.
 */
export async function getTeamPerformance() {
  try {
    const data = await api.get('/admin/quality/performance/team');
    return { success: true, ...data };
  } catch {
    const entries = Object.entries(MOCK_ADMIN_PERFORMANCE);
    const avgSLA = +(entries.reduce((s, [, p]) => s + p.slaCompliance, 0) / entries.length).toFixed(1);
    const avgCSAT = +(entries.reduce((s, [, p]) => s + p.csatAvg, 0) / entries.length).toFixed(1);
    const totalActions = entries.reduce((s, [, p]) => s + p.actionsToday, 0);
    return {
      success: true,
      team: { avgSLA, avgCSAT, totalActionsToday: totalActions, adminCount: entries.length },
      admins: MOCK_ADMIN_PERFORMANCE,
    };
  }
}

/**
 * Acknowledge an SLA breach.
 */
export async function acknowledgeSLABreach(slaId, { reason }) {
  try {
    const data = await api.post(`/admin/quality/sla/${slaId}/acknowledge`, { reason });
    return { success: true, ...data };
  } catch {
    return { success: true };
  }
}
