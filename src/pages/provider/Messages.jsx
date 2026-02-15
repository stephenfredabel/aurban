import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
  MessageCircle, Search, Send, ChevronLeft, Phone, PhoneOff,
  PhoneCall, Mic, MicOff, Volume2, VolumeX, MoreVertical,
  Image, Paperclip, Clock, CheckCheck, Check, MapPin,
  User, Shield, Star, Calendar, Edit3, X,
  Package, BadgeCheck, Tag,
} from 'lucide-react';
import { useMessaging } from '../../context/MessagingContext.jsx';
import { useAuth }      from '../../context/AuthContext.jsx';

/* ════════════════════════════════════════════════════════════
   PROVIDER MESSAGES — Inbox + Thread View

   Wired to shared MessagingContext.
   Local-only state: nicknames, quick-reply visibility, UI toggles.

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

/* ── Time helpers ───────────────────────────────────────── */

function formatCallTime(seconds) {
  const m = Math.floor(seconds / 60).toString().padStart(2, '0');
  const s = (seconds % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
}

/** Format epoch timestamp → relative string ("2 min ago", "1 hr ago", "Yesterday", etc.) */
function relativeTime(ts) {
  if (!ts) return '';
  const diff = Date.now() - ts;
  const secs = Math.floor(diff / 1000);
  if (secs < 60)   return 'Just now';
  const mins = Math.floor(secs / 60);
  if (mins < 60)   return `${mins} min ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24)    return `${hrs} hr${hrs > 1 ? 's' : ''} ago`;
  const days = Math.floor(hrs / 24);
  if (days === 1)  return 'Yesterday';
  if (days < 7)    return `${days} days ago`;
  return new Date(ts).toLocaleDateString();
}

/** Format epoch timestamp → display time for individual messages ("10:30 AM") */
function messageTime(ts) {
  if (!ts) return '';
  const d = new Date(ts);
  const now = new Date();
  const time = d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
  // If same day, just show time
  if (d.toDateString() === now.toDateString()) return time;
  // If yesterday
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  if (d.toDateString() === yesterday.toDateString()) return `Yesterday, ${time}`;
  // Otherwise date + time
  return `${d.toLocaleDateString([], { month: 'short', day: 'numeric' })}, ${time}`;
}

/* ── Initials helper ────────────────────────────────────── */
function getInitials(name) {
  if (!name) return '??';
  return name.split(' ').map(w => w[0]).filter(Boolean).slice(0, 2).join('').toUpperCase();
}

export default function Messages() {
  const { user } = useAuth();
  const providerId = user?.id;

  const {
    conversations,
    totalUnread,
    loading,
    setActive,
    sendMessage: ctxSendMessage,
    startCall: ctxStartCall,
    endCall: ctxEndCall,
    callState: ctxCallState,
    getPeer,
    typingMap,
    setTyping,
  } = useMessaging();

  const [activeConvo, setActiveConvo] = useState(null);
  const [newMessage, setNewMessage]   = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType]   = useState('all');
  const [showQuickReplies, setShowQuickReplies] = useState(false);

  /* ── User info panel + nickname (LOCAL state) ───────────── */
  const [showUserInfo, setShowUserInfo]     = useState(false);
  const [editingNickname, setEditingNickname] = useState(false);
  const [nicknameInput, setNicknameInput]   = useState('');
  const [nicknames, setNicknames]           = useState({}); // { [convId]: string }

  /* ── Call UI state (local timer + mute/speaker) ─────────── */
  const [callSeconds, setCallSeconds] = useState(0);
  const [isMuted, setIsMuted]         = useState(false);
  const [isSpeaker, setIsSpeaker]     = useState(false);
  const timerRef = useRef(null);

  // Track previous callState type so we can detect transitions
  const prevCallTypeRef = useRef(null);

  // When context call becomes 'active', start the timer
  useEffect(() => {
    const type = ctxCallState?.type || null;
    const prevType = prevCallTypeRef.current;
    prevCallTypeRef.current = type;

    if (type === 'active' && prevType !== 'active') {
      // just became active — reset and start timer
      setCallSeconds(0);
      setIsMuted(false);
      setIsSpeaker(false);
      if (timerRef.current) clearInterval(timerRef.current);
      timerRef.current = setInterval(() => setCallSeconds(s => s + 1), 1000);
    }
    if (type !== 'active' && timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, [ctxCallState]);

  // Cleanup timer on unmount
  useEffect(() => () => {
    if (timerRef.current) clearInterval(timerRef.current);
  }, []);

  /* ── Nickname save (local only) ─────────────────────────── */
  const saveNickname = (convoId) => {
    setNicknames(prev => ({
      ...prev,
      [convoId]: nicknameInput.trim() || undefined,
    }));
    setEditingNickname(false);
  };

  /** Get the display name for a conversation (nickname if set, else peer name) */
  const getDisplayName = useCallback((convo) => {
    if (nicknames[convo.id]) return nicknames[convo.id];
    const peer = getPeer(convo, providerId);
    return peer?.name || 'Unknown';
  }, [nicknames, getPeer, providerId]);

  /** Get the real name (peer name, ignoring nickname) */
  const getRealName = useCallback((convo) => {
    const peer = getPeer(convo, providerId);
    return peer?.name || 'Unknown';
  }, [getPeer, providerId]);

  /* ── Filtering ─────────────────────────────────────────── */
  const filtered = useMemo(() => conversations.filter((c) => {
    if (filterType !== 'all' && c.type !== filterType) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const displayName = getDisplayName(c);
      const realName = getRealName(c);
      if (
        !displayName.toLowerCase().includes(q) &&
        !realName.toLowerCase().includes(q) &&
        !(c.lastMessage?.text || '').toLowerCase().includes(q) &&
        !(c.listingTitle || '').toLowerCase().includes(q)
      ) return false;
    }
    return true;
  }), [conversations, filterType, searchQuery, getDisplayName, getRealName]);

  /* ── Send message ──────────────────────────────────────── */
  const handleSend = useCallback(() => {
    if (!newMessage.trim() || !activeConvo) return;
    ctxSendMessage(activeConvo, { text: newMessage.trim() });
    setNewMessage('');
    setShowQuickReplies(false);
  }, [newMessage, activeConvo, ctxSendMessage]);

  /* ── Call actions wired to context ─────────────────────── */
  const handleStartCall = useCallback((convo) => {
    const peer = getPeer(convo, providerId);
    if (!peer?.online) return; // offline — handled in UI
    ctxStartCall(peer.id, peer.name);
  }, [getPeer, providerId, ctxStartCall]);

  const handleEndCall = useCallback(() => {
    ctxEndCall();
  }, [ctxEndCall]);

  /* ── Mark conversation as read when opened ─────────────── */
  const handleOpenConvo = useCallback((convoId) => {
    setActiveConvo(convoId);
    setActive(convoId);
    setShowUserInfo(false);
  }, [setActive]);

  /* ── Loading state ─────────────────────────────────────── */
  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center">
          <div className="w-8 h-8 mx-auto mb-3 border-2 rounded-full border-brand-gold border-t-transparent animate-spin" />
          <p className="text-sm text-gray-400">Loading messages...</p>
        </div>
      </div>
    );
  }

  /* ── Thread view ──────────────────────────────────────── */
  if (activeConvo) {
    const convo = conversations.find((c) => c.id === activeConvo);
    if (!convo) return null;

    const peer = getPeer(convo, providerId);
    const displayName = getDisplayName(convo);
    const realName = getRealName(convo);
    const hasNickname = !!nicknames[convo.id];
    const initials = peer?.avatar ? null : getInitials(peer?.name);
    const peerOnline = peer?.online ?? false;
    const hasPeerMeta = !!convo.peerMeta;
    const hasListing = !!convo.listingTitle;

    // Determine call overlay state from context
    const isCallPeer = ctxCallState && ctxCallState.peerId === peer?.id;
    const showCallOverlay = isCallPeer && (ctxCallState.type === 'outgoing' || ctxCallState.type === 'active');

    return (
      <div className="relative flex flex-col h-[calc(100vh-140px)] lg:h-[calc(100vh-100px)]">
        {/* Thread header */}
        <div className="flex items-center gap-3 p-3 bg-white border-b border-gray-100 dark:bg-gray-900 rounded-t-2xl dark:border-white/10">
          <button onClick={() => { setActiveConvo(null); setShowUserInfo(false); }}
            className="lg:hidden p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-white/10">
            <ChevronLeft size={18} className="text-gray-500" />
          </button>

          {/* Clickable avatar — opens user info */}
          <button onClick={() => hasPeerMeta && setShowUserInfo(!showUserInfo)}
            className="relative flex items-center justify-center text-xs font-bold rounded-full w-9 h-9 bg-brand-gold/20 text-brand-gold shrink-0 hover:ring-2 hover:ring-brand-gold/30 transition-all">
            {peer?.avatar
              ? <img src={peer.avatar} alt="" className="object-cover w-full h-full rounded-full" />
              : initials}
            {peerOnline && <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-500 rounded-full border-2 border-white dark:border-gray-900" />}
          </button>

          <div className="flex-1 min-w-0">
            {/* Clickable name — opens user info */}
            <button onClick={() => hasPeerMeta && setShowUserInfo(!showUserInfo)}
              className="text-sm font-semibold text-brand-charcoal-dark dark:text-white hover:text-brand-gold transition-colors text-left">
              {displayName}
              {hasNickname && (
                <span className="ml-1.5 text-[10px] font-normal text-gray-400">({realName})</span>
              )}
            </button>
            <p className="text-[10px] text-gray-400 truncate">
              {peerOnline ? 'Online' : 'Last seen ' + relativeTime(convo.lastMessage?.timestamp)}
              {hasListing && ` · Re: ${convo.listingTitle}`}
            </p>
          </div>

          <div className="flex gap-1">
            {hasPeerMeta && (
              <button onClick={() => setShowUserInfo(!showUserInfo)}
                className={`p-2 rounded-lg transition-colors ${showUserInfo ? 'bg-brand-gold/10 text-brand-gold' : 'hover:bg-gray-100 dark:hover:bg-white/10 text-gray-400'}`}
                title="User info">
                <User size={14} />
              </button>
            )}
            <button
              onClick={() => handleStartCall(convo)}
              className={`p-2 rounded-lg transition-colors ${peerOnline ? 'hover:bg-emerald-50 dark:hover:bg-emerald-500/10' : 'hover:bg-gray-100 dark:hover:bg-white/10'}`}
              title={peerOnline ? `Call ${displayName}` : `${displayName} is offline`}
            >
              <Phone size={14} className={peerOnline ? 'text-emerald-500' : 'text-gray-400'} />
            </button>
            <button className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-white/10">
              <MoreVertical size={14} className="text-gray-400" />
            </button>
          </div>
        </div>

        {/* ── Unavailable toast (peer offline and user clicked call) ── */}
        {!peerOnline && ctxCallState === null && (
          /* We show the offline indicator inline in the call button color.
             An explicit toast is shown only transiently — keep as non-blocking. */
          null
        )}

        {/* ── Call overlay ───────────────────────────────────── */}
        {showCallOverlay && (
          <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-brand-charcoal-dark/95 rounded-2xl backdrop-blur-sm">
            <div className="relative flex items-center justify-center w-20 h-20 mb-4 text-2xl font-bold rounded-full bg-brand-gold/20 text-brand-gold">
              {peer?.avatar
                ? <img src={peer.avatar} alt="" className="object-cover w-full h-full rounded-full" />
                : initials}
              {ctxCallState.type === 'outgoing' && <div className="absolute inset-0 rounded-full animate-ping bg-brand-gold/20" />}
            </div>
            <p className="text-lg font-semibold text-white">{displayName}</p>
            {ctxCallState.type === 'outgoing' && (
              <p className="flex items-center gap-2 mt-2 text-sm text-gray-400"><PhoneCall size={14} className="animate-pulse" /> Ringing...</p>
            )}
            {ctxCallState.type === 'active' && (
              <p className="mt-2 text-sm font-mono text-emerald-400">{formatCallTime(callSeconds)}</p>
            )}
            <div className="flex items-center gap-5 mt-8">
              {ctxCallState.type === 'active' && (
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
              <button onClick={handleEndCall} className="flex items-center justify-center w-14 h-14 transition-colors bg-red-500 rounded-full hover:bg-red-600">
                <PhoneOff size={22} className="text-white" />
              </button>
            </div>
          </div>
        )}

        {/* ── Content area: messages + optional info panel ──── */}
        <div className="flex flex-1 min-h-0">

          {/* Messages column */}
          <div className={`flex flex-col flex-1 min-w-0 ${showUserInfo ? 'hidden lg:flex' : ''}`}>

            {/* Listing context card */}
            {hasListing && (
              <div className="flex items-center gap-3 px-4 py-2.5 bg-gray-50 dark:bg-white/5 border-b border-gray-100 dark:border-white/10">
                <span className="text-base">{LISTING_TYPE_EMOJI[convo.listingType] || '📋'}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] text-gray-400">Enquiry about</p>
                  <p className="text-xs font-medium truncate text-brand-charcoal-dark dark:text-white">{convo.listingTitle}</p>
                </div>
                <span className="text-xs font-semibold text-brand-gold shrink-0">{convo.listingPrice}</span>
              </div>
            )}

            {/* Messages */}
            <div className="flex-1 p-4 space-y-3 overflow-y-auto bg-gray-50 dark:bg-gray-950">
              {convo.messages.map((msg) => {
                const fromMe = msg.senderId === providerId;
                return (
                  <div key={msg.id} className={`flex ${fromMe ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[80%] rounded-2xl px-4 py-2.5 ${
                      fromMe
                        ? 'bg-brand-charcoal-dark text-white rounded-br-md'
                        : 'bg-white dark:bg-gray-900 text-brand-charcoal-dark dark:text-white shadow-sm rounded-bl-md'
                    }`}>
                      {msg.file && (
                        <p className="text-sm leading-relaxed">📎 {typeof msg.file === 'string' ? msg.file : 'Attachment'}</p>
                      )}
                      {msg.text && <p className="text-sm leading-relaxed">{msg.text}</p>}
                      <div className={`flex items-center gap-1 mt-1 ${fromMe ? 'justify-end' : ''}`}>
                        <span className="text-[10px] text-gray-400">{messageTime(msg.timestamp)}</span>
                        {fromMe && (
                          msg.status === 'read' ? <CheckCheck size={10} className="text-blue-400" /> :
                          msg.status === 'delivered' ? <CheckCheck size={10} className="text-gray-400" /> :
                          <Check size={10} className="text-gray-400" />
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
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

            {/* Typing indicator */}
            {activeConvo && typingMap[activeConvo] && (
              <div className="px-4 py-1.5">
                <span className="text-xs text-gray-400 italic animate-pulse">
                  {typingMap[activeConvo]} is typing…
                </span>
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
                  <textarea value={newMessage} onChange={(e) => { setNewMessage(e.target.value); if (activeConvo) setTyping(activeConvo, true); }}
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
          {showUserInfo && hasPeerMeta && (
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
                    {peer?.avatar
                      ? <img src={peer.avatar} alt="" className="object-cover w-full h-full rounded-full" />
                      : initials}
                  </div>
                  <p className="mt-2 text-sm font-semibold text-brand-charcoal-dark dark:text-white">{realName}</p>
                  {peer?.verified && (
                    <span className="inline-flex items-center gap-1 mt-1 text-[10px] text-emerald-600 font-medium">
                      <BadgeCheck size={10} /> Verified User
                    </span>
                  )}
                  <p className="text-[10px] text-gray-400 mt-0.5">@{peer?.id}</p>
                </div>

                {/* Nickname (local-only) */}
                <div className="p-3 bg-gray-50 dark:bg-white/5 rounded-xl">
                  <div className="flex items-center justify-between mb-1">
                    <p className="flex items-center gap-1 text-[10px] text-gray-400"><Tag size={10} /> Your nickname</p>
                    {!editingNickname && (
                      <button onClick={() => { setEditingNickname(true); setNicknameInput(nicknames[convo.id] || ''); }}
                        className="text-[10px] text-brand-gold hover:underline flex items-center gap-0.5">
                        <Edit3 size={9} /> {nicknames[convo.id] ? 'Edit' : 'Add'}
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
                      {nicknames[convo.id] || <span className="text-gray-400 italic">No nickname set</span>}
                    </p>
                  )}
                </div>

                {/* Details from peerMeta */}
                <div className="space-y-2.5">
                  {convo.peerMeta.visibility?.location !== false && convo.peerMeta.location && (
                    <div className="flex items-center gap-2.5 text-xs">
                      <MapPin size={13} className="text-gray-400 shrink-0" />
                      <span className="text-brand-charcoal-dark dark:text-white">{convo.peerMeta.location}</span>
                    </div>
                  )}
                  {convo.peerMeta.joinedDate && (
                    <div className="flex items-center gap-2.5 text-xs">
                      <Calendar size={13} className="text-gray-400 shrink-0" />
                      <span className="text-brand-charcoal-dark dark:text-white">Joined {convo.peerMeta.joinedDate}</span>
                    </div>
                  )}
                  {convo.peerMeta.totalInquiries != null && (
                    <div className="flex items-center gap-2.5 text-xs">
                      <MessageCircle size={13} className="text-gray-400 shrink-0" />
                      <span className="text-brand-charcoal-dark dark:text-white">{convo.peerMeta.totalInquiries} inquiries on Aurban</span>
                    </div>
                  )}
                  {convo.peerMeta.responseTime && (
                    <div className="flex items-center gap-2.5 text-xs">
                      <Clock size={13} className="text-gray-400 shrink-0" />
                      <span className="text-brand-charcoal-dark dark:text-white">Responds {convo.peerMeta.responseTime.toLowerCase()}</span>
                    </div>
                  )}
                  {convo.peerMeta.visibility?.rating !== false && convo.peerMeta.rating != null && (
                    <div className="flex items-center gap-2.5 text-xs">
                      <Star size={13} className="text-gray-400 shrink-0" />
                      <span className="text-brand-charcoal-dark dark:text-white">{convo.peerMeta.rating} ({convo.peerMeta.reviewCount} reviews)</span>
                    </div>
                  )}
                  {convo.peerMeta.completedDeals != null && (
                    <div className="flex items-center gap-2.5 text-xs">
                      <CheckCheck size={13} className="text-gray-400 shrink-0" />
                      <span className="text-brand-charcoal-dark dark:text-white">{convo.peerMeta.completedDeals} completed deals</span>
                    </div>
                  )}
                </div>

                {/* What they are inquiring about */}
                {hasListing && (
                  <div className="p-3 border border-gray-100 dark:border-white/10 rounded-xl">
                    <p className="flex items-center gap-1 text-[10px] text-gray-400 mb-2"><Package size={10} /> Interested in</p>
                    <div className="flex items-center gap-2">
                      <span className="text-base">{LISTING_TYPE_EMOJI[convo.listingType] || '📋'}</span>
                      <div className="min-w-0">
                        <p className="text-xs font-medium truncate text-brand-charcoal-dark dark:text-white">{convo.listingTitle}</p>
                        <p className="text-[10px] text-brand-gold font-semibold">{convo.listingPrice}</p>
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
            const peer = getPeer(c, providerId);
            const displayName = getDisplayName(c);
            const realName = getRealName(c);
            const hasNickname = !!nicknames[c.id];
            const initials = getInitials(peer?.name);
            const peerOnline = peer?.online ?? false;
            const hasListing = !!c.listingTitle;

            return (
              <button key={c.id} onClick={() => handleOpenConvo(c.id)}
                className={`w-full text-left bg-white dark:bg-gray-900 rounded-2xl shadow-card p-4 hover:shadow-md transition-all
                  ${c.unreadCount > 0 ? 'border-l-4 border-brand-gold' : ''}`}>
                <div className="flex gap-3">
                  <div className="relative flex items-center justify-center text-sm font-bold rounded-full w-11 h-11 bg-brand-gold/20 text-brand-gold shrink-0">
                    {peer?.avatar
                      ? <img src={peer.avatar} alt="" className="object-cover w-full h-full rounded-full" />
                      : initials}
                    {peerOnline && <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-500 rounded-full border-2 border-white dark:border-gray-900" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <p className={`text-sm truncate ${c.unreadCount > 0 ? 'font-bold' : 'font-medium'} text-brand-charcoal-dark dark:text-white`}>
                          {displayName}
                        </p>
                        {hasNickname && <span className="text-[10px] text-gray-400 shrink-0">({realName})</span>}
                      </div>
                      <span className="text-[10px] text-gray-400 shrink-0 ml-2">{relativeTime(c.lastMessage?.timestamp)}</span>
                    </div>
                    {hasListing && (
                      <p className="text-[10px] text-brand-gold font-medium mt-0.5 truncate flex items-center gap-1">
                        <span>{LISTING_TYPE_EMOJI[c.listingType] || '📋'}</span>
                        {c.listingTitle}
                      </p>
                    )}
                    <p className={`text-xs mt-0.5 truncate ${c.unreadCount > 0 ? 'text-brand-charcoal-dark dark:text-white font-medium' : 'text-gray-400'}`}>
                      {c.lastMessage?.text || ''}
                    </p>
                    <div className="flex items-center justify-between mt-1.5">
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium capitalize ${TYPE_COLORS[c.type]}`}>
                        {c.type}
                      </span>
                      {c.unreadCount > 0 && (
                        <span className="bg-brand-gold text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[20px] text-center">
                          {c.unreadCount}
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
