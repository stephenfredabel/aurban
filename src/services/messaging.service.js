import api from './api.js';
import { supabase, isSupabaseConfigured } from '../lib/supabase.js';

/**
 * Messaging service
 * Conversations + messages (Supabase first, api.js fallback, mock fallback)
 * All methods return { success, data?, error? }
 */

// ── Conversations ────────────────────────────────────────────

export async function getConversations({ page = 1, limit = 20 } = {}) {
  if (isSupabaseConfigured()) {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const offset = (page - 1) * limit;
        const { data, error, count } = await supabase
          .from('conversation_participants')
          .select(`
            unread_count,
            role,
            conversations (
              id, listing_id, listing_title, listing_type,
              listing_image, listing_price, type, is_paid,
              last_message, created_at, updated_at
            )
          `, { count: 'exact' })
          .eq('user_id', user.id)
          .order('conversations(updated_at)', { ascending: false })
          .range(offset, offset + limit - 1);

        if (!error && data) {
          const conversations = data.map(row => ({
            ...row.conversations,
            unreadCount: row.unread_count,
            myRole: row.role,
          }));
          return { success: true, conversations, total: count || conversations.length };
        }
      }
    } catch { /* fall through */ }
  }

  try {
    const data = await api.get('/messages/conversations', { params: { page, limit } });
    return { success: true, ...data };
  } catch (err) {
    return { success: false, error: err.message, conversations: [], total: 0 };
  }
}

export async function startConversation({ listingId, recipientId, initialMessage }) {
  if (isSupabaseConfigured()) {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        // Create conversation
        const { data: conv, error: convErr } = await supabase
          .from('conversations')
          .insert({ listing_id: listingId, type: 'inquiry' })
          .select()
          .single();
        if (convErr) throw convErr;

        // Add both participants
        await supabase.from('conversation_participants').insert([
          { conversation_id: conv.id, user_id: user.id, role: 'user' },
          { conversation_id: conv.id, user_id: recipientId, role: 'provider' },
        ]);

        // Send initial message if provided
        if (initialMessage) {
          await supabase.from('messages').insert({
            conversation_id: conv.id,
            sender_id: user.id,
            text: initialMessage,
            type: 'text',
          });
        }

        return { success: true, conversation: conv };
      }
    } catch { /* fall through */ }
  }

  try {
    const data = await api.post('/messages/conversations', { listingId, recipientId, initialMessage });
    return { success: true, conversation: data };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

// ── Messages ─────────────────────────────────────────────────

export async function getMessages(conversationId, { page = 1, limit = 50 } = {}) {
  if (isSupabaseConfigured()) {
    try {
      const offset = (page - 1) * limit;
      const { data, error, count } = await supabase
        .from('messages')
        .select('*', { count: 'exact' })
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true })
        .range(offset, offset + limit - 1);

      if (!error && data) {
        return { success: true, messages: data, total: count || data.length };
      }
    } catch { /* fall through */ }
  }

  try {
    const data = await api.get(`/messages/conversations/${conversationId}`, { params: { page, limit } });
    return { success: true, ...data };
  } catch (err) {
    return { success: false, error: err.message, messages: [] };
  }
}

export async function sendMessage(conversationId, { text, file }) {
  if (isSupabaseConfigured()) {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const insert = {
          conversation_id: conversationId,
          sender_id: user.id,
          text: text || null,
          file: file || null,
          type: file ? 'file' : 'text',
        };
        const { data, error } = await supabase
          .from('messages')
          .insert(insert)
          .select()
          .single();
        if (!error && data) {
          // Update conversation's last_message for list ordering
          await supabase.from('conversations').update({
            last_message: { text: text || '(file)', senderId: user.id, createdAt: data.created_at },
          }).eq('id', conversationId);

          return { success: true, message: data };
        }
      }
    } catch { /* fall through */ }
  }

  try {
    const data = await api.post(`/messages/conversations/${conversationId}`, { text, file });
    return { success: true, message: data };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

// ── Read receipts ────────────────────────────────────────────

export async function markRead(conversationId) {
  if (isSupabaseConfigured()) {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase
          .from('conversation_participants')
          .update({ unread_count: 0 })
          .eq('conversation_id', conversationId)
          .eq('user_id', user.id);
        return { success: true };
      }
    } catch { /* fall through */ }
  }

  try {
    await api.post(`/messages/conversations/${conversationId}/read`);
    return { success: true };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

// ── Realtime subscription helper ─────────────────────────────

/**
 * Subscribe to new messages in a conversation via Supabase Realtime.
 * Returns an object with an `unsubscribe()` method, or null if not configured.
 */
export function subscribeToMessages(conversationId, onMessage) {
  if (!isSupabaseConfigured()) return null;

  const channel = supabase
    .channel(`messages:${conversationId}`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `conversation_id=eq.${conversationId}`,
      },
      (payload) => {
        onMessage(payload.new);
      }
    )
    .subscribe();

  return {
    unsubscribe: () => supabase.removeChannel(channel),
  };
}
