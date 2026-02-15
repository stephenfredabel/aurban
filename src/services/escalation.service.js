import api from './api.js';
import { supabase, isSupabaseConfigured } from '../lib/supabase.js';

// Escalation priorities
export const ESCALATION_PRIORITIES = {
  P1: { label: 'Critical', color: 'red', description: 'Safety threat, fraud in progress, account compromise' },
  P2: { label: 'High', color: 'amber', description: 'Failed payout, stuck escrow, locked provider' },
  P3: { label: 'Medium', color: 'blue', description: 'Listing dispute, refund request, verification delay' },
  P4: { label: 'Low', color: 'gray', description: 'General inquiry, feature request' },
};

// Mock escalations for dev
const MOCK_ESCALATIONS = [
  {
    id: 'esc_001', priority: 'P1', status: 'open',
    from: { adminId: 'adm_006', role: 'support_admin', name: 'Fatima Bello' },
    to: { role: 'operations_admin' },
    assignedTo: { adminId: 'adm_003', name: 'Mary Okonkwo' },
    subject: 'Provider threatening legal action over listing removal',
    note: 'Provider Tunde Bakare (8 listings) is claiming wrongful removal of his Lekki listing. Has sent lawyer letter via email. Support cannot resolve — needs Ops intervention.',
    context: { type: 'listing', entityId: 'l3', entityLabel: 'Samsung Galaxy S24 Ultra' },
    createdAt: '2025-02-13T08:30:00Z',
    updatedAt: '2025-02-13T08:30:00Z',
    responses: [],
  },
  {
    id: 'esc_002', priority: 'P2', status: 'in_progress',
    from: { adminId: 'adm_003', role: 'operations_admin', name: 'Mary Okonkwo' },
    to: { role: 'finance_admin' },
    assignedTo: { adminId: 'adm_002', name: 'John Adeyemi' },
    subject: 'Disputed N2M property booking -- escrow frozen',
    note: 'User paid N2M for inspection booking but provider claims booking was cancelled. Escrow is frozen. Need Finance to review transaction and decide on release or refund.',
    context: { type: 'booking', entityId: 'b_042', entityLabel: 'Inspection #1042 -- 3BR Flat Lekki' },
    createdAt: '2025-02-12T14:00:00Z',
    updatedAt: '2025-02-13T09:15:00Z',
    responses: [
      { adminId: 'adm_002', name: 'John Adeyemi', role: 'finance_admin', message: 'Reviewing transaction history. Will have update by EOD.', timestamp: '2025-02-13T09:15:00Z' },
    ],
  },
  {
    id: 'esc_003', priority: 'P2', status: 'open',
    from: { adminId: 'adm_005', role: 'verification_admin', name: 'Chidi Eze' },
    to: { role: 'compliance_admin' },
    assignedTo: null,
    subject: 'Suspected identity fraud -- selfie mismatch on provider KYC',
    note: 'Provider Funke Adeyemi submitted Government ID but selfie verification score is 34% (threshold is 60%). ID document also shows signs of digital alteration. Flagging for compliance investigation.',
    context: { type: 'kyc', entityId: 'kyc4', entityLabel: 'Funke Adeyemi -- Agent KYC' },
    createdAt: '2025-02-13T07:00:00Z',
    updatedAt: '2025-02-13T07:00:00Z',
    responses: [],
  },
  {
    id: 'esc_004', priority: 'P3', status: 'resolved',
    from: { adminId: 'adm_006', role: 'support_admin', name: 'Fatima Bello' },
    to: { role: 'operations_admin' },
    assignedTo: { adminId: 'adm_003', name: 'Mary Okonkwo' },
    subject: 'User cannot access dashboard after email change',
    note: 'User Amina Suleiman changed email but old session token is still active causing redirect loop. Support tried clearing session but issue persists.',
    context: { type: 'user', entityId: 'u7', entityLabel: 'Amina Suleiman' },
    createdAt: '2025-02-11T10:00:00Z',
    updatedAt: '2025-02-12T11:30:00Z',
    responses: [
      { adminId: 'adm_003', name: 'Mary Okonkwo', role: 'operations_admin', message: 'Forced session invalidation and password reset. User can now log in.', timestamp: '2025-02-12T11:30:00Z' },
    ],
    resolvedAt: '2025-02-12T11:30:00Z',
    resolution: 'Forced session invalidation and triggered password reset email.',
  },
];

export async function getEscalations({ status, priority, role } = {}) {
  if (isSupabaseConfigured()) {
    try {
      let query = supabase.from('escalations').select('*', { count: 'exact' });
      if (status && status !== 'all') query = query.eq('status', status);
      if (priority) query = query.eq('priority', priority);
      const { data, error, count } = await query;
      if (!error) return { success: true, escalations: data, total: count };
    } catch { /* fall through to api.js */ }
  }

  try {
    const data = await api.get('/admin/escalations', { params: { status, priority, role } });
    return { success: true, ...data };
  } catch {
    let filtered = [...MOCK_ESCALATIONS];
    if (status && status !== 'all') filtered = filtered.filter(e => e.status === status);
    if (priority) filtered = filtered.filter(e => e.priority === priority);
    if (role) filtered = filtered.filter(e => e.to.role === role || e.from.role === role);
    return { success: true, escalations: filtered, total: filtered.length };
  }
}

export async function createEscalation({ priority, targetRole, subject, note, context }) {
  if (isSupabaseConfigured()) {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const { data, error } = await supabase
        .from('escalations')
        .insert({
          priority,
          target_role: targetRole,
          subject,
          note,
          context,
          status: 'open',
          created_by: user?.id || null,
        })
        .select()
        .single();
      if (!error) return { success: true, escalation: data };
    } catch { /* fall through to api.js */ }
  }

  try {
    const data = await api.post('/admin/escalations', { priority, targetRole, subject, note, context });
    return { success: true, ...data };
  } catch {
    return { success: true, escalation: { id: `esc_${Date.now()}`, status: 'open', createdAt: new Date().toISOString() } };
  }
}

export async function respondToEscalation(id, { message }) {
  if (isSupabaseConfigured()) {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      // Get current responses and append
      const { data: esc } = await supabase.from('escalations').select('responses').eq('id', id).single();
      const responses = esc?.responses || [];
      responses.push({ admin_id: user?.id, message, timestamp: new Date().toISOString() });
      const { error } = await supabase
        .from('escalations')
        .update({ responses, status: 'in_progress', updated_at: new Date().toISOString() })
        .eq('id', id);
      if (!error) return { success: true };
    } catch { /* fall through to api.js */ }
  }

  try {
    const data = await api.post(`/admin/escalations/${id}/respond`, { message });
    return { success: true, ...data };
  } catch {
    return { success: true };
  }
}

export async function resolveEscalation(id, { resolution }) {
  if (isSupabaseConfigured()) {
    try {
      const { error } = await supabase
        .from('escalations')
        .update({ status: 'resolved', resolution, resolved_at: new Date().toISOString() })
        .eq('id', id);
      if (!error) return { success: true };
    } catch { /* fall through to api.js */ }
  }

  try {
    const data = await api.post(`/admin/escalations/${id}/resolve`, { resolution });
    return { success: true, ...data };
  } catch {
    return { success: true };
  }
}

export async function assignEscalation(id, { adminId }) {
  if (isSupabaseConfigured()) {
    try {
      const { error } = await supabase
        .from('escalations')
        .update({ assigned_to: adminId, updated_at: new Date().toISOString() })
        .eq('id', id);
      if (!error) return { success: true };
    } catch { /* fall through to api.js */ }
  }

  try {
    const data = await api.post(`/admin/escalations/${id}/assign`, { adminId });
    return { success: true, ...data };
  } catch {
    return { success: true };
  }
}
