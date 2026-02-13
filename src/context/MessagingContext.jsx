import {
  createContext, useContext, useReducer,
  useCallback, useEffect, useRef,
} from 'react';
import { useAuth }     from './AuthContext.jsx';
import { maskContacts } from '../utils/contactMask.js';

// ── Mock data ─────────────────────────────────────────────────
// Replace with Socket.io + API calls in production
const MOCK_CONVERSATIONS = [
  {
    id:           'conv_001',
    listingId:    'prop_101',
    listingTitle: '3-Bedroom Flat in Lekki Phase 1',
    listingType:  'rental',
    listingImage: null,
    participants: [
      { id: 'u_provider_01', name: 'Chukwuemeka Eze',    role: 'provider', avatar: null, online: true  },
      { id: 'u_user_01',     name: 'Current User',        role: 'user',     avatar: null, online: true  },
    ],
    lastMessage:  { text: 'Is the property still available?', timestamp: Date.now() - 3600_000, senderId: 'u_user_01' },
    unreadCount:  2,
    isPaid:       false,
    messages: [
      { id: 'm_001', senderId: 'u_user_01',     text: 'Hello, is this property still available?', timestamp: Date.now() - 7200_000, status: 'read', type: 'text' },
      { id: 'm_002', senderId: 'u_provider_01', text: 'Yes it is! When would you like to view it?', timestamp: Date.now() - 3700_000, status: 'read', type: 'text' },
      { id: 'm_003', senderId: 'u_user_01',     text: 'Is the property still available?', timestamp: Date.now() - 3600_000, status: 'delivered', type: 'text' },
    ],
  },
  {
    id:           'conv_002',
    listingId:    'svc_201',
    listingTitle: 'Emergency Plumbing Services — Lagos',
    listingType:  'service',
    listingImage: null,
    participants: [
      { id: 'u_provider_02', name: 'Rasheed Adewale', role: 'provider', avatar: null, online: false },
      { id: 'u_user_01',     name: 'Current User',     role: 'user',     avatar: null, online: true  },
    ],
    lastMessage:  { text: 'I can come Wednesday at 10am', timestamp: Date.now() - 86400_000, senderId: 'u_provider_02' },
    unreadCount:  0,
    isPaid:       false,
    messages: [
      { id: 'm_004', senderId: 'u_user_01',     text: 'I need a plumber urgently', timestamp: Date.now() - 90000_000, status: 'read', type: 'text' },
      { id: 'm_005', senderId: 'u_provider_02', text: 'I can come Wednesday at 10am', timestamp: Date.now() - 86400_000, status: 'read', type: 'text' },
    ],
  },
];

// ── State & Reducer ───────────────────────────────────────────
const initialState = {
  conversations:      MOCK_CONVERSATIONS,
  activeConvId:       null,
  loading:            false,
  callState:          null, // null | { type:'incoming'|'outgoing'|'active', peerId, peerName }
  typingMap:          {},   // { convId: [userId] }
};

function reducer(state, action) {
  switch (action.type) {
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

    case 'UPDATE_STATUS': {
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

  // ── Set active conversation ──────────────────────────────────
  const setActive = useCallback((id) => dispatch({ type: 'SET_ACTIVE', id }), []);

  // ── Send message ─────────────────────────────────────────────
  const sendMessage = useCallback((convId, { text, file }) => {
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
    dispatch({ type: 'SEND_MESSAGE', convId, message });

    // Simulate delivery after 800ms
    setTimeout(() => dispatch({ type: 'UPDATE_STATUS', convId, messageId: message.id, status: 'delivered' }), 800);
  }, [user]);

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

  // ── Call actions ─────────────────────────────────────────────
  const startCall = useCallback((peerId, peerName) => {
    dispatch({ type: 'OUTGOING_CALL', peerId, peerName });
    // In production: connect to WebRTC signalling server here
  }, []);

  const acceptCall = useCallback(() => dispatch({ type: 'CALL_ACCEPTED' }), []);

  const endCall = useCallback(() => {
    dispatch({ type: 'CALL_ENDED' });
    // In production: close RTCPeerConnection here
  }, []);

  const totalUnread = state.conversations.reduce((sum, c) => sum + (c.unreadCount || 0), 0);

  return (
    <MessagingContext.Provider value={{
      conversations:    state.conversations,
      activeConvId:     state.activeConvId,
      activeConversation,
      callState:        state.callState,
      typingMap:        state.typingMap,
      totalUnread,
      setActive,
      sendMessage,
      setTyping,
      startCall,
      acceptCall,
      endCall,
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