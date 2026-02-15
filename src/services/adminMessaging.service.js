import api from './api.js';
import { supabase, isSupabaseConfigured } from '../lib/supabase.js';

/**
 * Admin Inter-Messaging Service
 * Slack-style admin-to-admin chat system within the admin console.
 * Panel channels, incident channels, and direct messages.
 * All methods return { success, data?, error? } -- falls back to mock data when API unavailable.
 */

// -- Mock Channels --
// Panel channels (persistent, role-based), incident channels (auto-created on escalation)

const MOCK_CHANNELS = [
  { id: 'ch_ops',        name: 'operations',                           type: 'panel',    members: ['adm_003', 'adm_004', 'adm_005', 'adm_006'], unread: 3 },
  { id: 'ch_finance',    name: 'finance',                              type: 'panel',    members: ['adm_002'],                                   unread: 0 },
  { id: 'ch_compliance', name: 'compliance',                           type: 'panel',    members: ['adm_007'],                                   unread: 1 },
  { id: 'ch_general',    name: 'general',                              type: 'panel',    members: ['adm_001','adm_002','adm_003','adm_004','adm_005','adm_006','adm_007'], unread: 0 },
  { id: 'ch_inc_001',    name: 'INC-001: Payment Fraud Investigation', type: 'incident', members: ['adm_001','adm_002','adm_007'],                unread: 2 },
];

// -- Mock Direct Message Threads --

const MOCK_DMS = [
  { recipientId: 'adm_003', recipientName: 'Mary Okonkwo',  recipientRole: 'operations_admin', lastMessage: 'Can you check the Lekki listing escalation?',                                       lastTimestamp: '2025-02-13T10:30:00Z', unread: 1 },
  { recipientId: 'adm_002', recipientName: 'John Adeyemi',  recipientRole: 'finance_admin',    lastMessage: 'Payout batch approved. Processing now.',                                             lastTimestamp: '2025-02-13T09:00:00Z', unread: 0 },
  { recipientId: 'adm_007', recipientName: 'Emeka Uche',    recipientRole: 'compliance_admin', lastMessage: 'KYC submission kyc_0047 -- selfie score 63%, looks fine to me. Worth approving?',      lastTimestamp: '2025-02-12T16:45:00Z', unread: 0 },
  { recipientId: 'adm_004', recipientName: 'Ada Nnamdi',    recipientRole: 'moderator',        lastMessage: 'I cleared the flagged listing queue. 2 needed second review -- tagged you.',            lastTimestamp: '2025-02-12T14:20:00Z', unread: 0 },
  { recipientId: 'adm_005', recipientName: 'Chidi Eze',     recipientRole: 'verification_admin', lastMessage: 'Verification for provider PRV-0892 looks clean. Approving now unless you object.',  lastTimestamp: '2025-02-12T11:10:00Z', unread: 2 },
];

// -- Mock Messages --

const MOCK_MESSAGES = [
  // -- DM Thread: Fatima (support) <-> Mary (operations) --
  { id: 'm_001', senderId: 'adm_006', senderName: 'Fatima Bello',   senderRole: 'support_admin',     content: 'Hey Mary, quick question about the Lekki listing removal. Provider is very upset.',                               timestamp: '2025-02-13T10:15:00Z', type: 'dm', recipientId: 'adm_003', read: true  },
  { id: 'm_002', senderId: 'adm_003', senderName: 'Mary Okonkwo',   senderRole: 'operations_admin',  content: 'I saw the escalation. Let me review the listing history and get back to you.',                                    timestamp: '2025-02-13T10:20:00Z', type: 'dm', recipientId: 'adm_006', read: true  },
  { id: 'm_003', senderId: 'adm_006', senderName: 'Fatima Bello',   senderRole: 'support_admin',     content: 'Can you check the Lekki listing escalation?',                                                                     timestamp: '2025-02-13T10:30:00Z', type: 'dm', recipientId: 'adm_003', read: false },

  // -- DM Thread: current user <-> John (finance) --
  { id: 'm_004', senderId: 'adm_006', senderName: 'Fatima Bello',   senderRole: 'support_admin',     content: 'John, user acc_341 is asking about a missing payout from last week. Can you check the batch?',                     timestamp: '2025-02-13T08:30:00Z', type: 'dm', recipientId: 'adm_002', read: true  },
  { id: 'm_005', senderId: 'adm_002', senderName: 'John Adeyemi',   senderRole: 'finance_admin',     content: 'Found it -- was stuck in reconciliation. Released now. Provider should see it within 24 hours.',                    timestamp: '2025-02-13T08:45:00Z', type: 'dm', recipientId: 'adm_006', read: true  },
  { id: 'm_006', senderId: 'adm_002', senderName: 'John Adeyemi',   senderRole: 'finance_admin',     content: 'Payout batch approved. Processing now.',                                                                          timestamp: '2025-02-13T09:00:00Z', type: 'dm', recipientId: 'adm_006', read: true  },

  // -- DM Thread: current user <-> Emeka (compliance) --
  { id: 'm_007', senderId: 'adm_006', senderName: 'Fatima Bello',   senderRole: 'support_admin',     content: 'Emeka, got a user complaint about KYC rejection. Submission kyc_0047. Can you take another look?',                  timestamp: '2025-02-12T16:00:00Z', type: 'dm', recipientId: 'adm_007', read: true  },
  { id: 'm_008', senderId: 'adm_007', senderName: 'Emeka Uche',     senderRole: 'compliance_admin',  content: 'KYC submission kyc_0047 -- selfie score 63%, looks fine to me. Worth approving?',                                   timestamp: '2025-02-12T16:45:00Z', type: 'dm', recipientId: 'adm_006', read: true  },

  // -- DM Thread: current user <-> Ada (moderator) --
  { id: 'm_040', senderId: 'adm_006', senderName: 'Fatima Bello',   senderRole: 'support_admin',     content: 'Ada, a provider is disputing the flagged listing LIS-0442. Says photos were auto-cropped incorrectly.',             timestamp: '2025-02-12T14:00:00Z', type: 'dm', recipientId: 'adm_004', read: true  },
  { id: 'm_041', senderId: 'adm_004', senderName: 'Ada Nnamdi',     senderRole: 'moderator',         content: 'I cleared the flagged listing queue. 2 needed second review -- tagged you.',                                        timestamp: '2025-02-12T14:20:00Z', type: 'dm', recipientId: 'adm_006', read: true  },

  // -- DM Thread: current user <-> Chidi (verification) --
  { id: 'm_042', senderId: 'adm_005', senderName: 'Chidi Eze',      senderRole: 'verification_admin', content: 'Fatima, PRV-0892 submitted new CAC docs. Looks legitimate but the expiry date is in 3 months.',                   timestamp: '2025-02-12T11:00:00Z', type: 'dm', recipientId: 'adm_006', read: true  },
  { id: 'm_043', senderId: 'adm_005', senderName: 'Chidi Eze',      senderRole: 'verification_admin', content: 'Verification for provider PRV-0892 looks clean. Approving now unless you object.',                               timestamp: '2025-02-12T11:10:00Z', type: 'dm', recipientId: 'adm_006', read: false },

  // -- Channel: #operations --
  { id: 'm_010', senderId: 'adm_003', senderName: 'Mary Okonkwo',   senderRole: 'operations_admin',  content: 'Team heads up: we have 12 pending listings in the queue. Moderators please prioritize the flagged ones first.',     timestamp: '2025-02-13T08:00:00Z', type: 'channel', channelId: 'ch_ops', read: true  },
  { id: 'm_011', senderId: 'adm_004', senderName: 'Ada Nnamdi',     senderRole: 'moderator',         content: 'On it. I\'ll clear the flagged queue by noon.',                                                                    timestamp: '2025-02-13T08:15:00Z', type: 'channel', channelId: 'ch_ops', read: true  },
  { id: 'm_012', senderId: 'adm_005', senderName: 'Chidi Eze',      senderRole: 'verification_admin', content: 'FYI -- I have 4 pending verifications, 1 looks suspicious. May escalate to compliance.',                           timestamp: '2025-02-13T08:30:00Z', type: 'channel', channelId: 'ch_ops', read: false },
  { id: 'm_013', senderId: 'adm_006', senderName: 'Fatima Bello',   senderRole: 'support_admin',     content: 'Support queue is heavy today -- 9 urgent tickets. I might need to route 2 booking disputes to Ops.',                timestamp: '2025-02-13T09:00:00Z', type: 'channel', channelId: 'ch_ops', read: false },
  { id: 'm_014', senderId: 'adm_003', senderName: 'Mary Okonkwo',   senderRole: 'operations_admin',  content: 'Send them over, Fatima. Chidi, go ahead and escalate the suspicious verification to Emeka.',                       timestamp: '2025-02-13T09:15:00Z', type: 'channel', channelId: 'ch_ops', read: false },

  // -- Channel: #finance --
  { id: 'm_015', senderId: 'adm_002', senderName: 'John Adeyemi',   senderRole: 'finance_admin',     content: 'Daily reconciliation complete. 47 payouts processed, 2 flagged for manual review (amounts > N2M).',                  timestamp: '2025-02-13T07:00:00Z', type: 'channel', channelId: 'ch_finance', read: true },
  { id: 'm_016', senderId: 'adm_002', senderName: 'John Adeyemi',   senderRole: 'finance_admin',     content: 'Escrow balance: N14.2M across 23 active bookings. 3 approaching auto-release threshold.',                          timestamp: '2025-02-13T11:00:00Z', type: 'channel', channelId: 'ch_finance', read: true },

  // -- Channel: #compliance --
  { id: 'm_017', senderId: 'adm_007', senderName: 'Emeka Uche',     senderRole: 'compliance_admin',  content: 'Weekly AML report: 3 accounts flagged for unusual transaction patterns. All under investigation.',                  timestamp: '2025-02-13T06:30:00Z', type: 'channel', channelId: 'ch_compliance', read: true  },
  { id: 'm_018', senderId: 'adm_007', senderName: 'Emeka Uche',     senderRole: 'compliance_admin',  content: 'Reminder: CBN audit prep docs due by Friday. I need all Q4 transaction summaries from Finance.',                    timestamp: '2025-02-13T10:00:00Z', type: 'channel', channelId: 'ch_compliance', read: false },

  // -- Channel: #general --
  { id: 'm_020', senderId: 'adm_001', senderName: 'Stephen Okoro',  senderRole: 'super_admin',       content: 'Good morning team. Reminder: we have a platform maintenance window tonight 11PM-2AM WAT. All admin panels will remain accessible.', timestamp: '2025-02-13T07:30:00Z', type: 'channel', channelId: 'ch_general', read: true  },
  { id: 'm_021', senderId: 'adm_003', senderName: 'Mary Okonkwo',   senderRole: 'operations_admin',  content: 'Noted. I\'ll let the support team know to expect potential user confusion around that window.',                      timestamp: '2025-02-13T07:45:00Z', type: 'channel', channelId: 'ch_general', read: true  },
  { id: 'm_022', senderId: 'adm_006', senderName: 'Fatima Bello',   senderRole: 'support_admin',     content: 'Will prepare a canned response for users who report issues during maintenance. Thanks for the heads up.',            timestamp: '2025-02-13T07:50:00Z', type: 'channel', channelId: 'ch_general', read: true  },

  // -- Incident Channel: INC-001 -- Payment Fraud Investigation --
  { id: 'm_030', senderId: 'adm_007', senderName: 'Emeka Uche',     senderRole: 'compliance_admin',  content: 'Flagging transaction pattern: User acc_892 has 15 payments of exactly N499,000 in the last 48 hours. Possible structuring to avoid N500K threshold.',                  timestamp: '2025-02-13T06:00:00Z', type: 'channel', channelId: 'ch_inc_001', read: true  },
  { id: 'm_031', senderId: 'adm_002', senderName: 'John Adeyemi',   senderRole: 'finance_admin',     content: 'Confirmed from payments side. All transactions routed through same Paystack sub-account. Freezing escrow on all pending.',                                            timestamp: '2025-02-13T06:30:00Z', type: 'channel', channelId: 'ch_inc_001', read: true  },
  { id: 'm_032', senderId: 'adm_001', senderName: 'Stephen Okoro',  senderRole: 'super_admin',       content: 'Good work flagging this. Emeka, please prepare SAR documentation. John, hold all payouts for this account. I\'m escalating to the board.',                             timestamp: '2025-02-13T07:00:00Z', type: 'channel', channelId: 'ch_inc_001', read: false },
  { id: 'm_033', senderId: 'adm_007', senderName: 'Emeka Uche',     senderRole: 'compliance_admin',  content: 'SAR draft ready. Also found a linked account (acc_893) with similar pattern -- 8 transactions of N498,500. Recommending we freeze both.',                               timestamp: '2025-02-13T08:00:00Z', type: 'channel', channelId: 'ch_inc_001', read: false },
];

// -- In-memory store for new messages sent during session --

let _sessionMessages = [];
let _sessionNextId = 100;

// -- API Methods --

/**
 * Get all channels the current admin can see.
 */
export async function getChannels() {
  if (isSupabaseConfigured()) {
    try {
      const { data, error } = await supabase.from('admin_channels').select('*');
      if (!error) return { success: true, channels: data };
    } catch { /* fall through to api.js */ }
  }

  try {
    const data = await api.get('/admin/messaging/channels');
    return { success: true, channels: data.channels || data };
  } catch {
    // Mock fallback
    return { success: true, channels: [...MOCK_CHANNELS] };
  }
}

/**
 * Get direct message threads for a given admin.
 * @param {string} adminId - The current admin's ID
 */
export async function getDMs(adminId) {
  if (isSupabaseConfigured()) {
    try {
      const { data, error } = await supabase
        .from('admin_messages')
        .select('*')
        .eq('type', 'dm')
        .or(`sender_id.eq.${adminId},recipient_id.eq.${adminId}`)
        .order('timestamp', { ascending: false });
      if (!error) return { success: true, dms: data };
    } catch { /* fall through to api.js */ }
  }

  try {
    const data = await api.get('/admin/messaging/dms', { params: { adminId } });
    return { success: true, dms: data.dms || data };
  } catch {
    // Mock fallback -- return all DM threads
    return { success: true, dms: [...MOCK_DMS] };
  }
}

/**
 * Get messages for a channel or DM thread.
 * @param {Object} params
 * @param {string} [params.channelId] - Channel ID (for channel messages)
 * @param {string} [params.recipientId] - Recipient admin ID (for DM messages)
 * @param {number} [params.limit=50] - Max messages to return
 */
export async function getMessages({ channelId, recipientId, limit = 50 } = {}) {
  if (isSupabaseConfigured()) {
    try {
      let query = supabase.from('admin_messages').select('*');
      if (channelId) {
        query = query.eq('type', 'channel').eq('channel_id', channelId);
      } else if (recipientId) {
        query = query.eq('type', 'dm').or(`recipient_id.eq.${recipientId},sender_id.eq.${recipientId}`);
      }
      query = query.order('timestamp', { ascending: true }).limit(limit);
      const { data, error } = await query;
      if (!error) return { success: true, messages: data };
    } catch { /* fall through to api.js */ }
  }

  try {
    const data = await api.get('/admin/messaging/messages', {
      params: { channelId, recipientId, limit },
    });
    return { success: true, messages: data.messages || data };
  } catch {
    // Mock fallback -- filter from mock + session messages
    const allMessages = [...MOCK_MESSAGES, ..._sessionMessages];
    let filtered;

    if (channelId) {
      filtered = allMessages.filter(m => m.type === 'channel' && m.channelId === channelId);
    } else if (recipientId) {
      // DM thread: messages where sender or recipient matches
      filtered = allMessages.filter(m =>
        m.type === 'dm' && (m.recipientId === recipientId || m.senderId === recipientId)
      );
    } else {
      filtered = [];
    }

    // Sort by timestamp ascending (oldest first for chat display)
    filtered.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));

    return { success: true, messages: filtered.slice(-limit) };
  }
}

/**
 * Send a message to a channel or DM.
 * @param {Object} params
 * @param {string} params.content - Message text
 * @param {string} [params.channelId] - Target channel ID
 * @param {string} [params.recipientId] - Target admin ID (for DM)
 * @param {string} params.senderId - Sender admin ID
 * @param {string} params.senderName - Sender display name
 * @param {string} params.senderRole - Sender role
 * @param {Object} [params.file] - Attached file { name, url, type, size }
 * @param {Object} [params.voiceNote] - Voice note { url, duration }
 */
export async function sendMessage({
  content, channelId, recipientId, senderId, senderName, senderRole,
  file = null, voiceNote = null,
}) {
  if (isSupabaseConfigured()) {
    try {
      const { data, error } = await supabase
        .from('admin_messages')
        .insert({
          sender_id: senderId,
          sender_name: senderName,
          sender_role: senderRole,
          content,
          file,
          voice_note: voiceNote,
          type: channelId ? 'channel' : 'dm',
          channel_id: channelId || null,
          recipient_id: recipientId || null,
          read: true,
          timestamp: new Date().toISOString(),
        })
        .select()
        .single();
      if (!error) return { success: true, message: data };
    } catch { /* fall through to api.js */ }
  }

  try {
    const data = await api.post('/admin/messaging/messages', {
      content, channelId, recipientId, file, voiceNote,
    });
    return { success: true, message: data.message || data };
  } catch {
    // Mock fallback -- store in session
    const newMessage = {
      id:        `m_session_${_sessionNextId++}`,
      senderId:  senderId || 'adm_006',
      senderName: senderName || 'You',
      senderRole: senderRole || 'support_admin',
      content,
      file:      file || null,
      voiceNote: voiceNote || null,
      secured:   false,
      timestamp: new Date().toISOString(),
      type:      channelId ? 'channel' : 'dm',
      channelId: channelId || undefined,
      recipientId: recipientId || undefined,
      read:      true,
    };
    _sessionMessages.push(newMessage);
    return { success: true, message: newMessage };
  }
}

/**
 * Mark a channel or DM thread as read.
 * @param {Object} params
 * @param {string} [params.channelId] - Channel to mark read
 * @param {string} [params.recipientId] - DM thread to mark read
 */
export async function markRead({ channelId, recipientId } = {}) {
  if (isSupabaseConfigured()) {
    try {
      let query = supabase.from('admin_messages').update({ read: true });
      if (channelId) {
        query = query.eq('channel_id', channelId).eq('read', false);
      } else if (recipientId) {
        query = query.eq('recipient_id', recipientId).eq('read', false);
      }
      const { error } = await query;
      if (!error) return { success: true };
    } catch { /* fall through to api.js */ }
  }

  try {
    await api.post('/admin/messaging/read', { channelId, recipientId });
    return { success: true };
  } catch {
    // Mock fallback -- update in-memory mock data
    if (channelId) {
      const ch = MOCK_CHANNELS.find(c => c.id === channelId);
      if (ch) ch.unread = 0;
    }
    if (recipientId) {
      const dm = MOCK_DMS.find(d => d.recipientId === recipientId);
      if (dm) dm.unread = 0;
    }
    return { success: true };
  }
}

/**
 * Get total unread count across all channels and DMs.
 */
export function getTotalUnread() {
  const channelUnread = MOCK_CHANNELS.reduce((sum, ch) => sum + ch.unread, 0);
  const dmUnread = MOCK_DMS.reduce((sum, dm) => sum + dm.unread, 0);
  return channelUnread + dmUnread;
}

/**
 * Send a secured message (super_admin only).
 * Secured messages are encrypted at rest, audit-logged, and cannot be deleted.
 */
export async function sendSecuredMessage({
  content, recipientId, senderId, senderName, senderRole,
  file = null, voiceNote = null,
}) {
  if (isSupabaseConfigured()) {
    try {
      const { data, error } = await supabase
        .from('admin_messages')
        .insert({
          sender_id: senderId || 'adm_001',
          sender_name: senderName || 'Super Admin',
          sender_role: senderRole || 'super_admin',
          content,
          file,
          voice_note: voiceNote,
          type: 'dm',
          recipient_id: recipientId,
          read: true,
          secured: true,
          timestamp: new Date().toISOString(),
        })
        .select()
        .single();
      if (!error) return { success: true, message: data };
    } catch { /* fall through to api.js */ }
  }

  try {
    const data = await api.post('/admin/messaging/secured', {
      content, recipientId, file, voiceNote,
    });
    return { success: true, message: data.message || data };
  } catch {
    const newMessage = {
      id:          `m_secured_${_sessionNextId++}`,
      senderId:    senderId || 'adm_001',
      senderName:  senderName || 'Super Admin',
      senderRole:  senderRole || 'super_admin',
      content,
      file:        file || null,
      voiceNote:   voiceNote || null,
      timestamp:   new Date().toISOString(),
      type:        'dm',
      recipientId,
      read:        true,
      secured:     true,
    };
    _sessionMessages.push(newMessage);
    return { success: true, message: newMessage };
  }
}
