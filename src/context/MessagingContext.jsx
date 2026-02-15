import {
  createContext, useContext, useReducer,
  useCallback, useEffect, useRef,
} from 'react';
import { useAuth }     from './AuthContext.jsx';
import { maskContacts } from '../utils/contactMask.js';
import * as messagingService from '../services/messaging.service.js';
import { isSupabaseConfigured } from '../lib/supabase.js';

// ── Mock data ─────────────────────────────────────────────────
// Used as dev fallback when API is unavailable.
// Rich shape consumed by both user Messages and provider Messages.
const MOCK_CONVERSATIONS = [
  {
    id:           'conv_001',
    listingId:    'prop_101',
    listingTitle: '3 Bedroom Flat in Lekki Phase 1',
    listingType:  'rental',
    listingImage: null,
    listingPrice: '₦2,500,000/yr',
    type:         'inquiry', // inquiry | booking | support
    participants: [
      { id: 'u_provider_01', name: 'Tunde Properties', role: 'provider', roleLabel: 'Agent', avatar: null, online: true, verified: true },
      { id: 'u_user_01',     name: 'Adaeze Okafor',    role: 'user',     roleLabel: 'User',  avatar: null, online: true, verified: true },
    ],
    peerMeta: {
      rating: 4.8, reviewCount: 23, joinedDate: 'Jan 2023',
      location: 'Lekki, Lagos', responseTime: 'Within 2 hours', completedDeals: 47,
      totalInquiries: 3,
      listings: [
        { id: 'l1', title: '3 Bedroom Flat in Lekki Phase 1', type: 'rental', price: '₦2,500,000/yr' },
        { id: 'l2', title: '2 Bedroom Shortlet — Victoria Island', type: 'shortlet', price: '₦85,000/night' },
        { id: 'l3', title: '4 Bedroom Duplex — Ikeja GRA', type: 'rental', price: '₦4,500,000/yr' },
      ],
      recentReviews: [
        { id: 'r1', author: 'Chioma N.', rating: 5, text: 'Very professional agent.', date: 'Jan 2026' },
        { id: 'r2', author: 'Femi A.', rating: 4, text: 'Good service, responsive.', date: 'Dec 2025' },
      ],
      visibility: { location: true, rating: true, listings: true, reviews: true },
    },
    lastMessage:  { text: 'Also, the annual rent is ₦2.5M with a caution fee of ₦500K.', timestamp: Date.now() - 3600_000, senderId: 'u_provider_01' },
    unreadCount:  2,
    isPaid:       false,
    messages: [
      { id: 'm_001', senderId: 'u_user_01',     text: 'Hi, is this property still available for viewing?', timestamp: new Date('2026-02-12T10:00:00Z').getTime(), status: 'read', type: 'text' },
      { id: 'm_002', senderId: 'u_provider_01', text: 'Good morning! Yes, the property is available. When would you like to schedule an inspection?', timestamp: new Date('2026-02-12T10:15:00Z').getTime(), status: 'read', type: 'text' },
      { id: 'm_003', senderId: 'u_user_01',     text: 'This Saturday around 2PM would work for me. Is that okay?', timestamp: new Date('2026-02-12T10:20:00Z').getTime(), status: 'read', type: 'text' },
      { id: 'm_004', senderId: 'u_provider_01', text: 'Saturday 2PM works perfectly. The address is 15B Admiralty Way, Lekki Phase 1.', timestamp: new Date('2026-02-12T11:00:00Z').getTime(), status: 'read', type: 'text' },
      { id: 'm_005', senderId: 'u_provider_01', text: 'Also, the annual rent is ₦2.5M with a caution fee of ₦500K. Service charge is ₦350K.', timestamp: new Date('2026-02-13T08:30:00Z').getTime(), status: 'delivered', type: 'text' },
    ],
  },
  {
    id:           'conv_002',
    listingId:    'svc_201',
    listingTitle: 'Emergency Plumbing Services — Lagos',
    listingType:  'service',
    listingImage: null,
    listingPrice: '₦45,000',
    type:         'booking',
    participants: [
      { id: 'u_provider_02', name: 'Rasheed Adewale', role: 'provider', roleLabel: 'Service Provider', avatar: null, online: false, verified: false },
      { id: 'u_user_01',     name: 'Emeka Johnson',   role: 'user',     roleLabel: 'User',             avatar: null, online: true,  verified: false },
    ],
    peerMeta: {
      rating: 4.5, reviewCount: 15, joinedDate: 'Mar 2022',
      location: 'Victoria Island, Lagos', responseTime: 'Within 4 hours', completedDeals: 31,
      totalInquiries: 1,
      listings: [{ id: 'l4', title: 'Emergency Plumbing Services — Lagos', type: 'service', price: '₦45,000' }],
      recentReviews: [{ id: 'r3', author: 'Bola O.', rating: 5, text: 'Fixed our kitchen sink quickly.', date: 'Feb 2026' }],
      visibility: { location: true, rating: true, listings: true, reviews: true },
    },
    lastMessage:  { text: "Thanks for the quote. I'll get back to you by tomorrow.", timestamp: Date.now() - 86400_000, senderId: 'u_user_01' },
    unreadCount:  0,
    isPaid:       false,
    messages: [
      { id: 'm_006', senderId: 'u_user_01',     text: 'I need plumbing work done in my apartment. Kitchen sink and bathroom.', timestamp: new Date('2026-02-11T09:00:00Z').getTime(), status: 'read', type: 'text' },
      { id: 'm_007', senderId: 'u_provider_02', text: 'I can handle that. For both kitchen sink and bathroom, it would be ₦45,000 including materials.', timestamp: new Date('2026-02-11T09:15:00Z').getTime(), status: 'read', type: 'text' },
      { id: 'm_008', senderId: 'u_user_01',     text: "Thanks for the quote. I'll get back to you by tomorrow.", timestamp: new Date('2026-02-11T09:30:00Z').getTime(), status: 'read', type: 'text' },
    ],
  },
  {
    id:           'conv_003',
    listingId:    'svc_301',
    listingTitle: 'Premium Interior Design',
    listingType:  'service',
    listingImage: null,
    listingPrice: 'From ₦1,500,000',
    type:         'inquiry',
    participants: [
      { id: 'u_provider_03', name: 'Decor Masters NG', role: 'provider', roleLabel: 'Service Provider', avatar: null, online: true,  verified: true },
      { id: 'u_user_01',     name: 'Current User',      role: 'user',     roleLabel: 'User',             avatar: null, online: true,  verified: true },
    ],
    peerMeta: {
      rating: 4.9, reviewCount: 41, joinedDate: 'Aug 2023',
      location: 'Surulere, Lagos', responseTime: 'Within 1 hour', completedDeals: 62,
      totalInquiries: 0,
      listings: [
        { id: 'l6', title: 'Premium Interior Design', type: 'service', price: 'From ₦1,500,000' },
        { id: 'l7', title: 'Office Space Design', type: 'service', price: 'From ₦800,000' },
      ],
      recentReviews: [
        { id: 'r4', author: 'Ngozi E.', rating: 5, text: 'Transformed my apartment beautifully!', date: 'Jan 2026' },
        { id: 'r5', author: 'Tunde L.', rating: 5, text: 'Excellent work on my office.', date: 'Dec 2025' },
      ],
      visibility: { location: true, rating: true, listings: true, reviews: true },
    },
    lastMessage:  { text: 'Just following up — would you like to book a free consultation this week?', timestamp: Date.now() - 7200_000, senderId: 'u_provider_03' },
    unreadCount:  1,
    isPaid:       false,
    messages: [
      { id: 'm_009', senderId: 'u_user_01',     text: 'I need interior design for a 3-bedroom flat in Lekki. Modern minimalist style.', timestamp: new Date('2026-02-10T09:00:00Z').getTime(), status: 'read', type: 'text' },
      { id: 'm_010', senderId: 'u_provider_03', text: 'Hi! For a 3-bed flat, our packages start from ₦1.5M including furniture sourcing.', timestamp: new Date('2026-02-10T10:00:00Z').getTime(), status: 'read', type: 'text' },
      { id: 'm_011', senderId: 'u_provider_03', text: 'Just following up — would you like to book a free consultation this week?', timestamp: new Date('2026-02-13T07:00:00Z').getTime(), status: 'delivered', type: 'text' },
    ],
  },
  {
    id:           'conv_004',
    listingId:    null,
    listingTitle: null,
    listingType:  null,
    listingImage: null,
    listingPrice: null,
    type:         'support',
    participants: [
      { id: 'u_system', name: 'Aurban Support', role: 'system', roleLabel: 'Support', avatar: null, online: true, verified: true },
      { id: 'u_user_01', name: 'Current User', role: 'user', roleLabel: 'User', avatar: null, online: true, verified: true },
    ],
    peerMeta: null,
    lastMessage:  { text: 'Your Pro tier upgrade has been approved!', timestamp: Date.now() - 259200_000, senderId: 'u_system' },
    unreadCount:  0,
    isPaid:       false,
    messages: [
      { id: 'm_012', senderId: 'u_system', text: 'Your Pro tier upgrade has been approved! Congratulations. You now have access to priority placement and advanced analytics.', timestamp: Date.now() - 259200_000, status: 'read', type: 'text' },
    ],
  },
];

// ── State & Reducer ───────────────────────────────────────────
const initialState = {
  conversations:      [],
  activeConvId:       null,
  loading:            true,
  error:              null,
  callState:          null, // null | { type:'incoming'|'outgoing'|'active', peerId, peerName }
  typingMap:          {},   // { convId: [userId] }
};

function reducer(state, action) {
  switch (action.type) {
    case 'FETCH_START':
      return { ...state, loading: true, error: null };

    case 'FETCH_SUCCESS':
      return { ...state, loading: false, conversations: action.conversations };

    case 'FETCH_ERROR':
      return { ...state, loading: false, error: action.error };

    case 'USE_FALLBACK':
      return { ...state, loading: false, conversations: MOCK_CONVERSATIONS, error: null };

    case 'SET_ACTIVE':
      return {
        ...state,
        activeConvId: action.id,
        conversations: state.conversations.map(c =>
          c.id === action.id ? { ...c, unreadCount: 0 } : c
        ),
      };

    case 'SEND_MESSAGE': {
      const { convId, message } = action;
      return {
        ...state,
        conversations: state.conversations.map(c => {
          if (c.id !== convId) return c;
          return {
            ...c,
            messages:    [...c.messages, message],
            lastMessage: { text: message.text || '📎 Attachment', timestamp: message.timestamp, senderId: message.senderId },
          };
        }),
      };
    }

    case 'RECEIVE_MESSAGE': {
      const { convId, message, myId } = action;
      const isActiveConv = state.activeConvId === convId;
      return {
        ...state,
        conversations: state.conversations.map(c => {
          if (c.id !== convId) return c;
          // Don't add duplicate messages
          if (c.messages.some(m => m.id === message.id)) return c;
          return {
            ...c,
            messages:    [...c.messages, message],
            lastMessage: { text: message.text || '(file)', timestamp: message.timestamp || Date.now(), senderId: message.senderId },
            unreadCount: isActiveConv || message.senderId === myId ? c.unreadCount : (c.unreadCount || 0) + 1,
          };
        }),
      };
    }

    case 'ADD_CONVERSATION':
      return { ...state, conversations: [action.conversation, ...state.conversations] };

    case 'UPDATE_MSG_STATUS': {
      const { convId, messageId, status } = action;
      return {
        ...state,
        conversations: state.conversations.map(c => {
          if (c.id !== convId) return c;
          return {
            ...c,
            messages: c.messages.map(m =>
              m.id === messageId ? { ...m, status } : m
            ),
          };
        }),
      };
    }

    case 'SET_TYPING': {
      const { convId, userId, typing } = action;
      const current = state.typingMap[convId] || [];
      const next    = typing
        ? [...new Set([...current, userId])]
        : current.filter(id => id !== userId);
      return { ...state, typingMap: { ...state.typingMap, [convId]: next } };
    }

    case 'INCOMING_CALL':
      return { ...state, callState: { type: 'incoming', peerId: action.peerId, peerName: action.peerName } };
    case 'OUTGOING_CALL':
      return { ...state, callState: { type: 'outgoing', peerId: action.peerId, peerName: action.peerName } };
    case 'CALL_ACCEPTED':
      return { ...state, callState: { ...state.callState, type: 'active' } };
    case 'CALL_ENDED':
      return { ...state, callState: null };

    default:
      return state;
  }
}

// ── Context ───────────────────────────────────────────────────
const MessagingContext = createContext(null);

export function MessagingProvider({ children }) {
  const { user }              = useAuth();
  const [state, dispatch]     = useReducer(reducer, initialState);
  const typingTimerRef        = useRef({});

  const activeConversation = state.conversations.find(c => c.id === state.activeConvId) || null;

  // ── Fetch conversations from API (fall back to mock) ───────
  const fetchConversations = useCallback(async () => {
    dispatch({ type: 'FETCH_START' });
    try {
      const res = await messagingService.getConversations();
      if (res.success && res.conversations) {
        dispatch({ type: 'FETCH_SUCCESS', conversations: res.conversations });
      } else {
        dispatch({ type: 'USE_FALLBACK' });
      }
    } catch {
      dispatch({ type: 'USE_FALLBACK' });
    }
  }, []);

  useEffect(() => {
    fetchConversations();
  }, [fetchConversations]);

  // ── Set active conversation ──────────────────────────────────
  const setActive = useCallback((id) => {
    dispatch({ type: 'SET_ACTIVE', id });
    // Mark read on server (fire-and-forget)
    messagingService.markRead(id).catch(() => {});
  }, []);

  // ── Send message (optimistic + API) ─────────────────────────
  const sendMessage = useCallback(async (convId, { text, file }) => {
    const safeTxt = maskContacts(text || '');
    const message = {
      id:        `m_${Date.now()}`,
      senderId:  user?.id || 'u_user_01',
      text:      safeTxt,
      file:      file || null,
      timestamp: Date.now(),
      status:    'sent',
      type:      file ? 'file' : 'text',
    };
    // Optimistic add
    dispatch({ type: 'SEND_MESSAGE', convId, message });

    // Try API
    try {
      const res = await messagingService.sendMessage(convId, { text: safeTxt, file });
      if (res.success) {
        dispatch({ type: 'UPDATE_MSG_STATUS', convId, messageId: message.id, status: 'delivered' });
      }
    } catch {
      // Simulate delivery for dev fallback
      setTimeout(() => dispatch({ type: 'UPDATE_MSG_STATUS', convId, messageId: message.id, status: 'delivered' }), 800);
    }
  }, [user]);

  // ── Add conversation (for deep-link creation) ────────────────
  const addConversation = useCallback((conversation) => {
    dispatch({ type: 'ADD_CONVERSATION', conversation });
  }, []);

  // ── Typing indicator ─────────────────────────────────────────
  const setTyping = useCallback((convId, typing) => {
    const uid = user?.id || 'u_user_01';
    dispatch({ type: 'SET_TYPING', convId, userId: uid, typing });
    if (typing) {
      clearTimeout(typingTimerRef.current[convId]);
      typingTimerRef.current[convId] = setTimeout(() => {
        dispatch({ type: 'SET_TYPING', convId, userId: uid, typing: false });
      }, 3000);
    }
  }, [user]);

  // ── Realtime subscription for active conversation ───────────
  const realtimeSubRef = useRef(null);

  useEffect(() => {
    // Clean up previous subscription
    realtimeSubRef.current?.unsubscribe();
    realtimeSubRef.current = null;

    if (!state.activeConvId || !isSupabaseConfigured()) return;

    const sub = messagingService.subscribeToMessages(state.activeConvId, (newMsg) => {
      const message = {
        id:        newMsg.id,
        senderId:  newMsg.sender_id,
        text:      newMsg.text,
        file:      newMsg.file,
        timestamp: new Date(newMsg.created_at).getTime(),
        status:    newMsg.status || 'delivered',
        type:      newMsg.type || 'text',
      };
      dispatch({
        type: 'RECEIVE_MESSAGE',
        convId: state.activeConvId,
        message,
        myId: user?.id,
      });
    });

    realtimeSubRef.current = sub;

    return () => {
      sub?.unsubscribe();
      realtimeSubRef.current = null;
    };
  }, [state.activeConvId, user?.id]);

  // ── WebRTC call instance ───────────────────────────────────
  const callRef = useRef(null);
  const remoteAudioRef = useRef(null);

  const startCall = useCallback(async (peerId, peerName) => {
    dispatch({ type: 'OUTGOING_CALL', peerId, peerName });

    if (isSupabaseConfigured() && state.activeConvId) {
      try {
        const { AurbanCall } = await import('../lib/webrtc.js');
        const call = new AurbanCall({
          conversationId: state.activeConvId,
          userId: user?.id,
          onRemoteStream: (stream) => {
            if (remoteAudioRef.current) {
              remoteAudioRef.current.srcObject = stream;
            }
          },
          onStateChange: (s) => {
            if (s === 'active') dispatch({ type: 'CALL_ACCEPTED' });
            if (s === 'ended')  dispatch({ type: 'CALL_ENDED' });
          },
        });
        await call.init();
        await call.startCall();
        callRef.current = call;
      } catch {
        // WebRTC not available — UI-only call state
      }
    }
  }, [state.activeConvId, user?.id]);

  const acceptCall = useCallback(async () => {
    dispatch({ type: 'CALL_ACCEPTED' });
    if (callRef.current) {
      try {
        await callRef.current.acceptPendingCall();
      } catch { /* fallback to UI-only */ }
    }
  }, []);

  const endCall = useCallback(() => {
    if (callRef.current) {
      callRef.current.endCall();
      callRef.current = null;
    }
    dispatch({ type: 'CALL_ENDED' });
  }, []);

  const totalUnread = state.conversations.reduce((sum, c) => sum + (c.unreadCount || 0), 0);

  // ── Helper: get the "other" participant (peer) in a conversation ──
  const getPeer = useCallback((conversation, myId) => {
    const uid = myId || user?.id || 'u_user_01';
    return conversation?.participants?.find(p => p.id !== uid) || conversation?.participants?.[0] || null;
  }, [user]);

  return (
    <MessagingContext.Provider value={{
      conversations:    state.conversations,
      activeConvId:     state.activeConvId,
      activeConversation,
      callState:        state.callState,
      typingMap:        state.typingMap,
      loading:          state.loading,
      error:            state.error,
      totalUnread,
      setActive,
      sendMessage,
      addConversation,
      setTyping,
      startCall,
      acceptCall,
      endCall,
      getPeer,
      remoteAudioRef,
      refreshConversations: fetchConversations,
    }}>
      {children}
    </MessagingContext.Provider>
  );
}

export function useMessaging() {
  const ctx = useContext(MessagingContext);
  if (!ctx) throw new Error('useMessaging must be used inside MessagingProvider');
  return ctx;
}
