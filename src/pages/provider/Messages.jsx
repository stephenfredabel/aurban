import { useState, useEffect, useRef, useCallback } from 'react';
import {
  MessageCircle, Search, Send, ChevronLeft, Phone, PhoneOff,
  PhoneCall, Mic, MicOff, Volume2, VolumeX, MoreVertical,
  Image, Paperclip, Clock, CheckCheck, Check, AlertCircle, MapPin,
  User, Shield, Star, Calendar, Edit3, X, Eye, EyeOff,
  ChevronRight, Package, BadgeCheck, Tag,
} from 'lucide-react';

/* ════════════════════════════════════════════════════════════
   PROVIDER MESSAGES — Inbox + Thread View

   Features:
   • Conversation list with unread badges
   • Thread view with real-time-style messages
   • Quick reply templates
   • Message type indicators (inquiry, booking, support)
   • User info panel — click to see user details
   • Custom nickname for contacts (provider-side)
   • Service/product context on each conversation
   • Call functionality (online/offline detection)
   • Privacy controls — provider chooses what users can see
   • Mobile-first: list → thread drill-down
════════════════════════════════════════════════════════════ */

const MOCK_CONVERSATIONS = [
  {
    id: 'c1',
    userId: 'u_a8x92k',              // hidden from provider UI, used for backend
    name: 'Adaeze Okafor',
    nickname: null,                    // provider can assign a custom name
    avatar: null, initials: 'AO',
    lastMessage: "Is the 3 bedroom flat still available? I'd like to schedule a viewing this weekend.",
    timestamp: '2 min ago', unread: 2, type: 'inquiry', online: true,
    // What the user is inquiring about
    listing: {
      title: '3 Bedroom Flat in Lekki Phase 1',
      type: 'rental',
      price: '₦2,500,000/yr',
      id: 'l1',
    },
    userInfo: {
      joinedDate: 'Nov 2024',
      location: 'Lekki, Lagos',
      verified: true,
      totalInquiries: 3,
      visibility: { location: true, joinedDate: true, verified: true },
    },
    messages: [
      { id: 'm1', from: 'them', text: 'Hi, I saw your listing for the 3 bedroom flat in Lekki Phase 1.', time: '10:30 AM', status: 'read' },
      { id: 'm2', from: 'them', text: "Is the 3 bedroom flat still available? I'd like to schedule a viewing this weekend.", time: '10:31 AM', status: 'read' },
      { id: 'm3', from: 'me', text: 'Hello Adaeze! Yes, the flat is still available. Weekend viewings are fine. Would Saturday morning work for you?', time: '10:45 AM', status: 'delivered' },
      { id: 'm4', from: 'them', text: "Saturday at 10am would be perfect. What's the exact address?", time: '11:02 AM', status: 'unread' },
      { id: 'm5', from: 'them', text: 'Also, does it come with parking space?', time: '11:03 AM', status: 'unread' },
    ],
  },
  {
    id: 'c2',
    userId: 'u_j3m71p',
    name: 'Emeka Johnson',
    nickname: null,
    avatar: null, initials: 'EJ',
    lastMessage: "Thanks for the quote. I'll get back to you by tomorrow.",
    timestamp: '1 hr ago', unread: 0, type: 'booking', online: false,
    listing: {
      title: 'Plumbing Services',
      type: 'service',
      price: '₦45,000',
      id: 'l2',
    },
    userInfo: {
      joinedDate: 'Jun 2025',
      location: 'Victoria Island, Lagos',
      verified: false,
      totalInquiries: 1,
      visibility: { location: true, joinedDate: true, verified: true },
    },
    messages: [
      { id: 'm1', from: 'them', text: 'I need plumbing work done in my apartment. Kitchen sink and bathroom.', time: '9:00 AM', status: 'read' },
      { id: 'm2', from: 'me', text: 'I can handle that. For both kitchen sink and bathroom, it would be ₦45,000 including materials. When would you need it done?', time: '9:15 AM', status: 'read' },
      { id: 'm3', from: 'them', text: "Thanks for the quote. I'll get back to you by tomorrow.", time: '9:30 AM', status: 'read' },
    ],
  },
  {
    id: 'c3',
    userId: 'u_b5k22r',
    name: 'Blessing Adekunle',
    nickname: 'Ibeju Buyer',
    avatar: null, initials: 'BA',
    lastMessage: "The land documents check out. Let's proceed with the agreement.",
    timestamp: 'Yesterday', unread: 1, type: 'inquiry', online: false,
    listing: {
      title: 'Land for Sale — 500sqm Ibeju-Lekki',
      type: 'land',
      price: '₦15,000,000',
      id: 'l3',
    },
    userInfo: {
      joinedDate: 'Mar 2024',
      location: 'Ibeju-Lekki, Lagos',
      verified: true,
      totalInquiries: 7,
      visibility: { location: true, joinedDate: true, verified: true },
    },
    messages: [
      { id: 'm1', from: 'them', text: "Hello, I'm interested in the Ibeju-Lekki land. Can you share the survey plan?", time: 'Yesterday, 2:00 PM', status: 'read' },
      { id: 'm2', from: 'me', text: "Of course! I'll send the survey plan and C of O documents. Give me a moment.", time: 'Yesterday, 2:15 PM', status: 'read' },
      { id: 'm3', from: 'me', text: '📎 Survey_Plan_IbejuLekki_500sqm.pdf', time: 'Yesterday, 2:18 PM', status: 'read' },
      { id: 'm4', from: 'them', text: "The land documents check out. Let's proceed with the agreement.", time: 'Yesterday, 4:30 PM', status: 'unread' },
    ],
  },
  {
    id: 'c4',
    userId: 'u_system',
    name: 'Aurban Support',
    nickname: null,
    avatar: null, initials: 'AS',
    lastMessage: 'Your Pro tier upgrade has been approved! Congratulations.',
    timestamp: '3 days ago', unread: 0, type: 'support', online: true,
    listing: null,
    userInfo: null,
    messages: [
      { id: 'm1', from: 'them', text: 'Your Pro tier upgrade has been approved! Congratulations. You now have access to priority placement and advanced analytics.', time: '3 days ago', status: 'read' },
    ],
  },
];

const QUICK_REPLIES = [
  "Yes, it's still available!",
  'Let me check and get back to you.',
  'Can we schedule a viewing?',
  "I'll send the documents shortly.",
  'The price is negotiable.',
];

const TYPE_COLORS = {
  inquiry: 'bg-blue-50 dark:bg-blue-500/10 text-blue-600',
  booking: 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600',
  support: 'bg-purple-50 dark:bg-purple-500/10 text-purple-600',
};

const LISTING_TYPE_EMOJI = {
  rental: '🏠', service: '🔧', land: '🗺️', buy: '🏡',
  shortlet: '🏨', shared: '👥', product: '📦',
};

/* ── Call states: idle → ringing → connected → ended ────── */
const CALL_RING_DURATION = 3000;
const CALL_STATES = { IDLE: 'idle', RINGING: 'ringing', CONNECTED: 'connected', ENDED: 'ended', UNAVAILABLE: 'unavailable' };

function formatCallTime(seconds) {
  const m = Math.floor(seconds / 60).toString().padStart(2, '0');
  const s = (seconds % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
}

export default function Messages() {
  const [conversations, setConversations] = useState(MOCK_CONVERSATIONS);
  const [activeConvo, setActiveConvo] = useState(null);
  const [newMessage, setNewMessage] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [showQuickReplies, setShowQuickReplies] = useState(false);

  /* ── User info panel + nickname ───────────────────────────── */
  const [showUserInfo, setShowUserInfo] = useState(false);
  const [editingNickname, setEditingNickname] = useState(false);
  const [nicknameInput, setNicknameInput] = useState('');

  /* ── Call state ──────────────────────────────────────────── */
  const [callState, setCallState] = useState(CALL_STATES.IDLE);
  const [callSeconds, setCallSeconds] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [isSpeaker, setIsSpeaker] = useState(false);
  const timerRef = useRef(null);
  const ringRef  = useRef(null);

  const clearTimers = useCallback(() => {
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
    if (ringRef.current)  { clearTimeout(ringRef.current);   ringRef.current  = null; }
  }, []);

  const startCall = useCallback((convo) => {
    if (!convo.online) {
      setCallState(CALL_STATES.UNAVAILABLE);
      setTimeout(() => setCallState(CALL_STATES.IDLE), 3000);
      return;
    }
    setCallState(CALL_STATES.RINGING);
    setCallSeconds(0);
    setIsMuted(false);
    setIsSpeaker(false);
    ringRef.current = setTimeout(() => {
      setCallState(CALL_STATES.CONNECTED);
      timerRef.current = setInterval(() => setCallSeconds((s) => s + 1), 1000);
    }, CALL_RING_DURATION);
  }, []);

  const endCall = useCallback(() => {
    clearTimers();
    setCallState(CALL_STATES.ENDED);
    setTimeout(() => setCallState(CALL_STATES.IDLE), 2000);
  }, [clearTimers]);

  useEffect(() => clearTimers, [clearTimers]);

  /* ── Nickname save ─────────────────────────────────────────── */
  const saveNickname = (convoId) => {
    setConversations((prev) =>
      prev.map((c) => c.id === convoId ? { ...c, nickname: nicknameInput.trim() || null } : c)
    );
    setEditingNickname(false);
  };

  /* ── Filtering ─────────────────────────────────────────────── */
  const filtered = conversations.filter((c) => {
    if (filterType !== 'all' && c.type !== filterType) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const displayName = c.nickname || c.name;
      if (!displayName.toLowerCase().includes(q) &&
          !c.lastMessage.toLowerCase().includes(q) &&
          !(c.listing?.title || '').toLowerCase().includes(q)) return false;
    }
    return true;
  });

  const totalUnread = conversations.reduce((s, c) => s + c.unread, 0);

  const handleSend = () => {
    if (!newMessage.trim()) return;
    setNewMessage('');
    setShowQuickReplies(false);
  };

  /* ── Thread view ───────────────────────────────────────────── */
  if (activeConvo) {
    const convo = conversations.find((c) => c.id === activeConvo);
    if (!convo) return null;
    const displayName = convo.nickname || convo.name;

    return (
      <div className="relative flex flex-col h-[calc(100vh-140px)] lg:h-[calc(100vh-100px)]">
        {/* Thread header */}
        <div className="flex items-center gap-3 p-3 bg-white border-b border-gray-100 dark:bg-gray-900 rounded-t-2xl dark:border-white/10">
          <button onClick={() => { setActiveConvo(null); setShowUserInfo(false); }}
            className="lg:hidden p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-white/10">
            <ChevronLeft size={18} className="text-gray-500" />
          </button>

          {/* Clickable avatar → opens user info */}
          <button onClick={() => convo.userInfo && setShowUserInfo(!showUserInfo)}
            className="relative flex items-center justify-center text-xs font-bold rounded-full w-9 h-9 bg-brand-gold/20 text-brand-gold shrink-0 hover:ring-2 hover:ring-brand-gold/30 transition-all">
            {convo.initials}
            {convo.online && <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-500 rounded-full border-2 border-white dark:border-gray-900" />}
          </button>

          <div className="flex-1 min-w-0">
            {/* Clickable name → opens user info */}
            <button onClick={() => convo.userInfo && setShowUserInfo(!showUserInfo)}
              className="text-sm font-semibold text-brand-charcoal-dark dark:text-white hover:text-brand-gold transition-colors text-left">
              {displayName}
              {convo.nickname && (
                <span className="ml-1.5 text-[10px] font-normal text-gray-400">({convo.name})</span>
              )}
            </button>
            <p className="text-[10px] text-gray-400 truncate">
              {convo.online ? 'Online' : 'Last seen ' + convo.timestamp}
              {convo.listing && ` · Re: ${convo.listing.title}`}
            </p>
          </div>

          <div className="flex gap-1">
            {convo.userInfo && (
              <button onClick={() => setShowUserInfo(!showUserInfo)}
                className={`p-2 rounded-lg transition-colors ${showUserInfo ? 'bg-brand-gold/10 text-brand-gold' : 'hover:bg-gray-100 dark:hover:bg-white/10 text-gray-400'}`}
                title="User info">
                <User size={14} />
              </button>
            )}
            <button
              onClick={() => startCall(convo)}
              className={`p-2 rounded-lg transition-colors ${convo.online ? 'hover:bg-emerald-50 dark:hover:bg-emerald-500/10' : 'hover:bg-gray-100 dark:hover:bg-white/10'}`}
              title={convo.online ? `Call ${displayName}` : `${displayName} is offline`}
            >
              <Phone size={14} className={convo.online ? 'text-emerald-500' : 'text-gray-400'} />
            </button>
            <button className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-white/10">
              <MoreVertical size={14} className="text-gray-400" />
            </button>
          </div>
        </div>

        {/* ── Unavailable toast ──────────────────────────────── */}
        {callState === CALL_STATES.UNAVAILABLE && (
          <div className="flex items-center gap-2 px-4 py-2.5 bg-yellow-50 dark:bg-yellow-500/10 border-b border-yellow-100 dark:border-yellow-500/20">
            <AlertCircle size={14} className="text-yellow-600 shrink-0" />
            <p className="text-xs font-medium text-yellow-700 dark:text-yellow-400">
              {displayName} is currently offline. Try again when they are active.
            </p>
          </div>
        )}

        {/* ── Call overlay ───────────────────────────────────── */}
        {(callState === CALL_STATES.RINGING || callState === CALL_STATES.CONNECTED || callState === CALL_STATES.ENDED) && (
          <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-brand-charcoal-dark/95 rounded-2xl backdrop-blur-sm">
            <div className="relative flex items-center justify-center w-20 h-20 mb-4 text-2xl font-bold rounded-full bg-brand-gold/20 text-brand-gold">
              {convo.initials}
              {callState === CALL_STATES.RINGING && <div className="absolute inset-0 rounded-full animate-ping bg-brand-gold/20" />}
            </div>
            <p className="text-lg font-semibold text-white">{displayName}</p>
            {callState === CALL_STATES.RINGING && (
              <p className="flex items-center gap-2 mt-2 text-sm text-gray-400"><PhoneCall size={14} className="animate-pulse" /> Ringing...</p>
            )}
            {callState === CALL_STATES.CONNECTED && (
              <p className="mt-2 text-sm font-mono text-emerald-400">{formatCallTime(callSeconds)}</p>
            )}
            {callState === CALL_STATES.ENDED && <p className="mt-2 text-sm text-gray-400">Call ended</p>}
            {callState !== CALL_STATES.ENDED && (
              <div className="flex items-center gap-5 mt-8">
                {callState === CALL_STATES.CONNECTED && (
                  <>
                    <button onClick={() => setIsMuted((m) => !m)}
                      className={`w-12 h-12 rounded-full flex items-center justify-center transition-colors ${isMuted ? 'bg-red-500/20 text-red-400' : 'bg-white/10 text-white hover:bg-white/20'}`}>
                      {isMuted ? <MicOff size={20} /> : <Mic size={20} />}
                    </button>
                    <button onClick={() => setIsSpeaker((s) => !s)}
                      className={`w-12 h-12 rounded-full flex items-center justify-center transition-colors ${isSpeaker ? 'bg-brand-gold/20 text-brand-gold' : 'bg-white/10 text-white hover:bg-white/20'}`}>
                      {isSpeaker ? <Volume2 size={20} /> : <VolumeX size={20} />}
                    </button>
                  </>
                )}
                <button onClick={endCall} className="flex items-center justify-center w-14 h-14 transition-colors bg-red-500 rounded-full hover:bg-red-600">
                  <PhoneOff size={22} className="text-white" />
                </button>
              </div>
            )}
          </div>
        )}

        {/* ── Content area: messages + optional info panel ──── */}
        <div className="flex flex-1 min-h-0">

          {/* Messages column */}
          <div className={`flex flex-col flex-1 min-w-0 ${showUserInfo ? 'hidden lg:flex' : ''}`}>

            {/* Listing context card */}
            {convo.listing && (
              <div className="flex items-center gap-3 px-4 py-2.5 bg-gray-50 dark:bg-white/5 border-b border-gray-100 dark:border-white/10">
                <span className="text-base">{LISTING_TYPE_EMOJI[convo.listing.type] || '📋'}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] text-gray-400">Enquiry about</p>
                  <p className="text-xs font-medium truncate text-brand-charcoal-dark dark:text-white">{convo.listing.title}</p>
                </div>
                <span className="text-xs font-semibold text-brand-gold shrink-0">{convo.listing.price}</span>
              </div>
            )}

            {/* Messages */}
            <div className="flex-1 p-4 space-y-3 overflow-y-auto bg-gray-50 dark:bg-gray-950">
              {convo.messages.map((msg) => (
                <div key={msg.id} className={`flex ${msg.from === 'me' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[80%] rounded-2xl px-4 py-2.5 ${
                    msg.from === 'me'
                      ? 'bg-brand-charcoal-dark text-white rounded-br-md'
                      : 'bg-white dark:bg-gray-900 text-brand-charcoal-dark dark:text-white shadow-sm rounded-bl-md'
                  }`}>
                    <p className="text-sm leading-relaxed">{msg.text}</p>
                    <div className={`flex items-center gap-1 mt-1 ${msg.from === 'me' ? 'justify-end' : ''}`}>
                      <span className="text-[10px] text-gray-400">{msg.time}</span>
                      {msg.from === 'me' && (
                        msg.status === 'read' ? <CheckCheck size={10} className="text-blue-400" /> :
                        msg.status === 'delivered' ? <CheckCheck size={10} className="text-gray-400" /> :
                        <Check size={10} className="text-gray-400" />
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Quick replies */}
            {showQuickReplies && (
              <div className="p-2 bg-white border-t border-gray-100 dark:bg-gray-900 dark:border-white/10">
                <div className="flex gap-2 pb-1 overflow-x-auto scroll-x">
                  {QUICK_REPLIES.map((qr, i) => (
                    <button key={i} onClick={() => { setNewMessage(qr); setShowQuickReplies(false); }}
                      className="text-[11px] px-3 py-1.5 rounded-full bg-gray-100 dark:bg-white/10 text-gray-600 dark:text-gray-300 hover:bg-brand-gold/10 hover:text-brand-gold whitespace-nowrap transition-colors">
                      {qr}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Compose bar */}
            <div className="p-3 bg-white border-t border-gray-100 dark:bg-gray-900 rounded-b-2xl dark:border-white/10">
              <div className="flex items-end gap-2">
                <div className="flex gap-1">
                  <button className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-white/10">
                    <Paperclip size={16} className="text-gray-400" />
                  </button>
                  <button className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-white/10">
                    <Image size={16} className="text-gray-400" />
                  </button>
                  <button onClick={() => setShowQuickReplies(!showQuickReplies)}
                    className={`p-2 rounded-lg transition-colors ${showQuickReplies ? 'bg-brand-gold/10 text-brand-gold' : 'hover:bg-gray-100 dark:hover:bg-white/10 text-gray-400'}`}>
                    <MessageCircle size={16} />
                  </button>
                </div>
                <div className="relative flex-1">
                  <textarea value={newMessage} onChange={(e) => setNewMessage(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
                    placeholder="Type a message..." rows={1}
                    className="w-full resize-none rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-gray-800 px-4 py-2.5 text-sm text-brand-charcoal-dark dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-gold/30 focus:border-brand-gold"
                  />
                </div>
                <button onClick={handleSend} disabled={!newMessage.trim()}
                  className="p-2.5 rounded-xl bg-brand-gold hover:bg-brand-gold-dark text-white transition-colors disabled:opacity-30 disabled:cursor-not-allowed">
                  <Send size={16} />
                </button>
              </div>
            </div>
          </div>

          {/* ── User info panel (right side on desktop, full on mobile) ── */}
          {showUserInfo && convo.userInfo && (
            <div className="flex flex-col w-full border-l border-gray-100 lg:w-72 shrink-0 dark:border-white/10 bg-white dark:bg-gray-900">
              <div className="flex items-center justify-between p-4 border-b border-gray-100 dark:border-white/10">
                <p className="text-sm font-semibold text-brand-charcoal-dark dark:text-white">User Info</p>
                <button onClick={() => setShowUserInfo(false)} className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-white/10">
                  <X size={14} className="text-gray-400" />
                </button>
              </div>

              <div className="flex-1 p-4 space-y-4 overflow-y-auto scroll-y">
                {/* Avatar + name */}
                <div className="text-center">
                  <div className="flex items-center justify-center w-16 h-16 mx-auto text-xl font-bold rounded-full bg-brand-gold/20 text-brand-gold">
                    {convo.initials}
                  </div>
                  <p className="mt-2 text-sm font-semibold text-brand-charcoal-dark dark:text-white">{convo.name}</p>
                  {convo.userInfo.verified && (
                    <span className="inline-flex items-center gap-1 mt-1 text-[10px] text-emerald-600 font-medium">
                      <BadgeCheck size={10} /> Verified User
                    </span>
                  )}
                  <p className="text-[10px] text-gray-400 mt-0.5">@{convo.userId}</p>
                </div>

                {/* Nickname */}
                <div className="p-3 bg-gray-50 dark:bg-white/5 rounded-xl">
                  <div className="flex items-center justify-between mb-1">
                    <p className="flex items-center gap-1 text-[10px] text-gray-400"><Tag size={10} /> Your nickname</p>
                    {!editingNickname && (
                      <button onClick={() => { setEditingNickname(true); setNicknameInput(convo.nickname || ''); }}
                        className="text-[10px] text-brand-gold hover:underline flex items-center gap-0.5">
                        <Edit3 size={9} /> {convo.nickname ? 'Edit' : 'Add'}
                      </button>
                    )}
                  </div>
                  {editingNickname ? (
                    <div className="flex gap-1.5">
                      <input value={nicknameInput} onChange={(e) => setNicknameInput(e.target.value)}
                        placeholder="e.g. Lekki Tenant" maxLength={30}
                        className="flex-1 px-2 py-1.5 text-xs bg-white dark:bg-gray-800 border border-gray-200 dark:border-white/10 rounded-lg focus:outline-none focus:ring-1 focus:ring-brand-gold/30"
                        onKeyDown={(e) => { if (e.key === 'Enter') saveNickname(convo.id); }}
                        autoFocus
                      />
                      <button onClick={() => saveNickname(convo.id)}
                        className="px-2 py-1 text-[10px] font-medium bg-brand-gold text-white rounded-lg">Save</button>
                      <button onClick={() => setEditingNickname(false)}
                        className="px-2 py-1 text-[10px] text-gray-400 rounded-lg hover:bg-gray-100 dark:hover:bg-white/10">Cancel</button>
                    </div>
                  ) : (
                    <p className="text-xs font-medium text-brand-charcoal-dark dark:text-white">
                      {convo.nickname || <span className="text-gray-400 italic">No nickname set</span>}
                    </p>
                  )}
                </div>

                {/* Details */}
                <div className="space-y-2.5">
                  {convo.userInfo.visibility.location && convo.userInfo.location && (
                    <div className="flex items-center gap-2.5 text-xs">
                      <MapPin size={13} className="text-gray-400 shrink-0" />
                      <span className="text-brand-charcoal-dark dark:text-white">{convo.userInfo.location}</span>
                    </div>
                  )}
                  {convo.userInfo.visibility.joinedDate && (
                    <div className="flex items-center gap-2.5 text-xs">
                      <Calendar size={13} className="text-gray-400 shrink-0" />
                      <span className="text-brand-charcoal-dark dark:text-white">Joined {convo.userInfo.joinedDate}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2.5 text-xs">
                    <MessageCircle size={13} className="text-gray-400 shrink-0" />
                    <span className="text-brand-charcoal-dark dark:text-white">{convo.userInfo.totalInquiries} inquiries on Aurban</span>
                  </div>
                </div>

                {/* What they are inquiring about */}
                {convo.listing && (
                  <div className="p-3 border border-gray-100 dark:border-white/10 rounded-xl">
                    <p className="flex items-center gap-1 text-[10px] text-gray-400 mb-2"><Package size={10} /> Interested in</p>
                    <div className="flex items-center gap-2">
                      <span className="text-base">{LISTING_TYPE_EMOJI[convo.listing.type] || '📋'}</span>
                      <div className="min-w-0">
                        <p className="text-xs font-medium truncate text-brand-charcoal-dark dark:text-white">{convo.listing.title}</p>
                        <p className="text-[10px] text-brand-gold font-semibold">{convo.listing.price}</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Privacy note */}
                <div className="flex items-start gap-2 p-3 bg-blue-50 dark:bg-blue-500/10 rounded-xl">
                  <Shield size={12} className="text-blue-500 shrink-0 mt-0.5" />
                  <p className="text-[10px] text-blue-600 dark:text-blue-400 leading-relaxed">
                    This user controls what info is visible to you. Some details may be hidden based on their privacy settings.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  /* ── Conversation list ──────────────────────────────────── */
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold font-display text-brand-charcoal-dark dark:text-white">Messages</h2>
          {totalUnread > 0 && (
            <p className="text-xs text-gray-400 mt-0.5">{totalUnread} unread message{totalUnread !== 1 ? 's' : ''}</p>
          )}
        </div>
      </div>

      {/* Search + filter */}
      <div className="space-y-3">
        <div className="relative">
          <Search size={14} className="absolute text-gray-400 -translate-y-1/2 left-3 top-1/2" />
          <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by name, nickname, or listing..."
            className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-gray-900 text-sm text-brand-charcoal-dark dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-gold/30 focus:border-brand-gold"
          />
        </div>
        <div className="flex gap-2 overflow-x-auto scroll-x">
          {[
            { key: 'all', label: 'All' },
            { key: 'inquiry', label: 'Inquiries' },
            { key: 'booking', label: 'Bookings' },
            { key: 'support', label: 'Support' },
          ].map((f) => (
            <button key={f.key} onClick={() => setFilterType(f.key)}
              className={`text-xs font-medium px-3 py-1.5 rounded-full whitespace-nowrap transition-colors
                ${filterType === f.key ? 'bg-brand-charcoal-dark text-white' : 'bg-gray-100 dark:bg-white/5 text-gray-500 hover:bg-gray-200'}`}>
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Conversations */}
      {filtered.length === 0 ? (
        <div className="py-12 text-center">
          <MessageCircle size={32} className="mx-auto mb-3 text-gray-300" />
          <p className="text-sm text-gray-400">No conversations found</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((c) => {
            const displayName = c.nickname || c.name;
            return (
              <button key={c.id} onClick={() => setActiveConvo(c.id)}
                className={`w-full text-left bg-white dark:bg-gray-900 rounded-2xl shadow-card p-4 hover:shadow-md transition-all
                  ${c.unread > 0 ? 'border-l-4 border-brand-gold' : ''}`}>
                <div className="flex gap-3">
                  <div className="relative flex items-center justify-center text-sm font-bold rounded-full w-11 h-11 bg-brand-gold/20 text-brand-gold shrink-0">
                    {c.initials}
                    {c.online && <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-500 rounded-full border-2 border-white dark:border-gray-900" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <p className={`text-sm truncate ${c.unread > 0 ? 'font-bold' : 'font-medium'} text-brand-charcoal-dark dark:text-white`}>
                          {displayName}
                        </p>
                        {c.nickname && <span className="text-[10px] text-gray-400 shrink-0">({c.name})</span>}
                      </div>
                      <span className="text-[10px] text-gray-400 shrink-0 ml-2">{c.timestamp}</span>
                    </div>
                    {c.listing && (
                      <p className="text-[10px] text-brand-gold font-medium mt-0.5 truncate flex items-center gap-1">
                        <span>{LISTING_TYPE_EMOJI[c.listing.type] || '📋'}</span>
                        {c.listing.title}
                      </p>
                    )}
                    <p className={`text-xs mt-0.5 truncate ${c.unread > 0 ? 'text-brand-charcoal-dark dark:text-white font-medium' : 'text-gray-400'}`}>
                      {c.lastMessage}
                    </p>
                    <div className="flex items-center justify-between mt-1.5">
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium capitalize ${TYPE_COLORS[c.type]}`}>
                        {c.type}
                      </span>
                      {c.unread > 0 && (
                        <span className="bg-brand-gold text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[20px] text-center">
                          {c.unread}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
