import { useState, useCallback, useRef, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  MessageCircle, Search, Send, ChevronLeft,
  MoreVertical, Check, CheckCheck,
  Phone, Image as ImageIcon, Paperclip,
  User as UserIcon, Clock, Star, X,
  MapPin, Shield, BadgeCheck, Package, ChevronRight,
  Eye, EyeOff, ExternalLink, Calendar, MessageSquare,
  PhoneOff,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext.jsx';
import { useMessaging } from '../../context/MessagingContext.jsx';
import { sanitize } from '../../utils/security.js';


/* ════════════════════════════════════════════════════════════
   USER MESSAGES — Inbox with provider info panel

   Features:
   • Conversation list with unread indicators
   • Thread view with message bubbles
   • Provider info panel — full provider details, listings,
     reviews, rating, profile
   • Service/product context on each conversation
   • Privacy controls — user chooses what providers see
   • Search, reply, date grouping, read receipts
   • Voice call overlay via shared MessagingContext
════════════════════════════════════════════════════════════ */

const TYPE_EMOJI = {
  rental: '\u{1F3E0}', buy: '\u{1F3E1}', land: '\u{1F5FA}\uFE0F', service: '\u{1F527}',
  shortlet: '\u{1F3E8}', shared: '\u{1F465}', product: '\u{1F4E6}',
};

/* ── Adapter: convert context message shape to local display shape ── */
function adaptMessage(msg, userId) {
  return {
    id:   msg.id,
    from: msg.senderId === userId ? 'user' : 'provider',
    text: msg.text || '',
    file: msg.file || null,
    time: new Date(msg.timestamp).toISOString(),
    read: msg.status === 'read',
  };
}

function formatMessageTime(dateStr) {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHrs = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHrs / 24);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m`;
  if (diffHrs < 24) return `${diffHrs}h`;
  if (diffDays < 7) return `${diffDays}d`;
  return date.toLocaleDateString('en-NG', { month: 'short', day: 'numeric' });
}

function formatFullTime(dateStr) {
  return new Date(dateStr).toLocaleTimeString('en-NG', { hour: '2-digit', minute: '2-digit' });
}

function formatDateHeader(dateStr) {
  const date = new Date(dateStr);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  if (date.toDateString() === today.toDateString()) return 'Today';
  if (date.toDateString() === yesterday.toDateString()) return 'Yesterday';
  return date.toLocaleDateString('en-NG', { weekday: 'long', month: 'short', day: 'numeric' });
}

/* ── Star rating display ────────────────────────────────── */
function StarRating({ rating, size = 10 }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <Star key={i} size={size}
          className={i <= Math.round(rating) ? 'text-brand-gold fill-brand-gold' : 'text-gray-300 dark:text-gray-600'}
        />
      ))}
    </div>
  );
}

export default function Messages() {
  const { user } = useAuth();
  const userId = user?.id || 'u_user_01';

  const {
    conversations,
    sendMessage: ctxSendMessage,
    setActive,
    totalUnread,
    addConversation,
    startCall,
    endCall,
    callState,
    getPeer,
    loading,
    typingMap,
    setTyping,
  } = useMessaging();

  const [searchParams, setSearchParams] = useSearchParams();
  const [activeConvo, setActiveConvo] = useState(null);
  const [search, setSearch] = useState('');
  const [replyText, setReplyText] = useState('');
  const [showProviderInfo, setShowProviderInfo] = useState(false);
  const [providerInfoTab, setProviderInfoTab] = useState('about');
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const deepLinkHandled = useRef(false);

  /* ── Deep-link: auto-create conversation from property/service context ── */
  useEffect(() => {
    if (deepLinkHandled.current || loading) return;
    const listingId    = searchParams.get('listing');
    const providerId   = searchParams.get('provider');
    const providerName = searchParams.get('providerName');
    const title        = searchParams.get('title');
    const type         = searchParams.get('type') || 'rental';
    const roomName     = searchParams.get('room');

    if (!listingId || !providerId) return;
    deepLinkHandled.current = true;

    // Check if conversation already exists for this listing+provider
    const existing = conversations.find(
      c => c.participants?.some(p => p.id === providerId) && c.listingTitle === title
    );

    if (existing) {
      setActiveConvo(existing.id);
      setActive(existing.id);
      setSearchParams({}, { replace: true });
      return;
    }

    // Build initial message based on context
    let initialMsg = `Hi, I'm interested in "${title}".`;
    if (roomName) {
      initialMsg = `Hi, I'd like to inquire about the room "${roomName}" in "${title}".`;
    }
    if (type === 'shortlet') {
      initialMsg = `Hi, I'm interested in booking "${title}". Is it available?`;
    }
    if (type === 'shared') {
      initialMsg = roomName
        ? `Hi, I'd like to inquire about the room "${roomName}" in "${title}". Is it still available?`
        : `Hi, I'm interested in a room at "${title}". Can you share more details?`;
    }
    if (type === 'stay') {
      initialMsg = `Hi, I'm interested in a long-term stay at "${title}". Can we discuss availability and terms?`;
    }

    const decodedName  = decodeURIComponent(providerName || 'Provider');
    const decodedTitle = decodeURIComponent(title || 'Listing');
    const roleLabel    = (type === 'shortlet' || type === 'shared' || type === 'stay') ? 'Host' : 'Agent';

    const newConvo = {
      id:           `c_${Date.now()}`,
      listingId,
      listingTitle: decodedTitle,
      listingType:  type,
      listingImage: null,
      listingPrice: '',
      type:         'inquiry',
      participants: [
        { id: providerId, name: decodedName, role: 'provider', roleLabel, avatar: null, online: false, verified: true },
        { id: userId, name: user?.name || 'You', role: 'user', roleLabel: 'User', avatar: null, online: true, verified: true },
      ],
      peerMeta: {
        rating: 4.5,
        reviewCount: 0,
        joinedDate: 'Jan 2024',
        location: 'Lagos, Nigeria',
        responseTime: 'Within 2 hours',
        completedDeals: 0,
        totalInquiries: 0,
        listings: [{ id: listingId, title: decodedTitle, type, price: '' }],
        recentReviews: [],
        visibility: { location: true, rating: true, listings: true, reviews: true },
      },
      lastMessage: { text: initialMsg, timestamp: Date.now(), senderId: userId },
      unreadCount: 0,
      messages: [
        {
          id:        `m_${Date.now()}`,
          senderId:  userId,
          text:      initialMsg,
          file:      null,
          timestamp: Date.now(),
          status:    'sent',
          type:      'text',
        },
      ],
    };

    addConversation(newConvo);
    setActiveConvo(newConvo.id);
    setActive(newConvo.id);
    setSearchParams({}, { replace: true });
  }, [searchParams, conversations, setSearchParams, loading, addConversation, setActive, userId, user]);

  /* ── Open conversation ──────────────────────────────────── */
  const openConvo = useCallback((id) => {
    setActiveConvo(id);
    setActive(id);
    setReplyText('');
    setShowProviderInfo(false);
  }, [setActive]);

  /* ── Send message ───────────────────────────────────────── */
  const handleSendMessage = useCallback((e) => {
    e.preventDefault();
    const text = sanitize(replyText.trim());
    if (!text || !activeConvo) return;

    ctxSendMessage(activeConvo, { text });
    setReplyText('');
    setTimeout(() => inputRef.current?.focus(), 50);
  }, [replyText, activeConvo, ctxSendMessage]);

  /* ── Resolve active conversation data from context ──────── */
  const activeConvoData = conversations.find((c) => c.id === activeConvo) || null;
  const peer = activeConvoData ? getPeer(activeConvoData, userId) : null;
  const peerMeta = activeConvoData?.peerMeta || null;

  /* ── Adapt messages to local display shape ──────────────── */
  const adaptedMessages = activeConvoData?.messages?.map(m => adaptMessage(m, userId)) || [];

  /* ── Auto-scroll ─────────────────────────────────────────── */
  useEffect(() => {
    if (activeConvoData) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps -- only auto-scroll when message count changes, not on every activeConvoData reference change
  }, [activeConvoData?.messages?.length]);

  /* ── Filtered conversations ─────────────────────────────── */
  const filteredConvos = search.trim()
    ? conversations.filter((c) => {
        const peerP = getPeer(c, userId);
        const peerName = peerP?.name || '';
        return peerName.toLowerCase().includes(search.toLowerCase()) ||
          (c.listingTitle || '').toLowerCase().includes(search.toLowerCase());
      })
    : conversations;

  /* ── Group messages by date ─────────────────────────────── */
  const groupedMessages = adaptedMessages.reduce((groups, msg) => {
    const dateKey = new Date(msg.time).toDateString();
    if (!groups[dateKey]) groups[dateKey] = { date: msg.time, messages: [] };
    groups[dateKey].messages.push(msg);
    return groups;
  }, {});

  /* ── Call overlay logic ─────────────────────────────────── */
  const showCallOverlay = callState && peer && callState.peerName === peer.name;

  return (
      <div className="overflow-hidden bg-white dark:bg-gray-900 rounded-2xl shadow-card" style={{ height: 'calc(100vh - 200px)', minHeight: '500px' }}>
        <div className="flex h-full">

          {/* ══ CONVERSATION LIST ══════════════════════════ */}
          <div className={`w-full sm:w-80 shrink-0 border-r border-gray-100 dark:border-white/10 flex flex-col
            ${activeConvo ? 'hidden sm:flex' : 'flex'}`}>

            {/* Header */}
            <div className="p-4 border-b border-gray-100 dark:border-white/10">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-lg font-bold font-display text-brand-charcoal-dark dark:text-white">
                  Messages
                  {totalUnread > 0 && (
                    <span className="ml-2 min-w-[20px] h-5 px-1.5 rounded-full bg-brand-gold text-white text-[10px] font-bold inline-flex items-center justify-center">
                      {totalUnread}
                    </span>
                  )}
                </h2>
              </div>

              <div className="relative">
                <Search size={14} className="absolute text-gray-400 -translate-y-1/2 left-3 top-1/2" />
                <input type="text" value={search}
                  onChange={(e) => setSearch(sanitize(e.target.value))}
                  placeholder="Search providers or listings..."
                  className="w-full py-2 pr-3 text-xs border border-gray-200 pl-9 bg-gray-50 dark:bg-white/5 dark:border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-gold/30"
                  maxLength={60}
                />
              </div>
            </div>

            {/* Loading state */}
            {loading ? (
              <div className="p-8 text-center">
                <div className="w-6 h-6 mx-auto mb-3 border-2 rounded-full border-brand-gold border-t-transparent animate-spin" />
                <p className="text-sm text-gray-400">Loading conversations...</p>
              </div>
            ) : (
              /* Conversation list */
              <div className="flex-1 overflow-y-auto scroll-y">
                {filteredConvos.length === 0 ? (
                  <div className="p-8 text-center">
                    <MessageCircle size={32} className="mx-auto mb-3 text-gray-200 dark:text-gray-700" />
                    <p className="text-sm text-gray-400">No conversations yet</p>
                  </div>
                ) : (
                  filteredConvos.map((convo) => {
                    const convoPeer = getPeer(convo, userId);
                    const lastMsg = convo.lastMessage;
                    const lastMsgIsUser = lastMsg?.senderId === userId;
                    return (
                      <button key={convo.id} onClick={() => openConvo(convo.id)}
                        className={`w-full flex items-start gap-3 p-4 text-left border-b border-gray-50 dark:border-white/5 transition-colors
                          ${activeConvo === convo.id
                            ? 'bg-brand-gold/5 dark:bg-brand-gold/10'
                            : 'hover:bg-gray-50 dark:hover:bg-white/5'
                          }`}>
                        <div className="relative flex items-center justify-center w-10 h-10 bg-gray-100 rounded-full dark:bg-white/10 shrink-0">
                          <span className="text-lg">{TYPE_EMOJI[convo.listingType] || '\u{1F4AC}'}</span>
                          {convo.unreadCount > 0 && (
                            <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full bg-brand-gold text-white text-[8px] font-bold flex items-center justify-center">
                              {convo.unreadCount}
                            </span>
                          )}
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-0.5">
                            <div className="flex items-center gap-1.5 min-w-0">
                              <span className={`text-sm font-semibold truncate ${convo.unreadCount > 0 ? 'text-brand-charcoal-dark dark:text-white' : 'text-gray-600 dark:text-gray-400'}`}>
                                {convoPeer?.name || 'Unknown'}
                              </span>
                              {convoPeer?.verified && <BadgeCheck size={12} className="text-blue-500 shrink-0" />}
                            </div>
                            <span className="text-[10px] text-gray-400 shrink-0 ml-2">
                              {lastMsg?.timestamp ? formatMessageTime(new Date(lastMsg.timestamp).toISOString()) : ''}
                            </span>
                          </div>
                          <p className="text-[11px] text-gray-400 truncate mb-0.5">
                            <span className="mr-1">{TYPE_EMOJI[convo.listingType] || '\u{1F4CB}'}</span>
                            {convo.listingTitle || 'Support'}
                          </p>
                          <p className={`text-xs truncate ${convo.unreadCount > 0 ? 'text-brand-charcoal dark:text-gray-300 font-medium' : 'text-gray-400'}`}>
                            {lastMsgIsUser ? 'You: ' : ''}{lastMsg?.text || ''}
                          </p>
                        </div>
                      </button>
                    );
                  })
                )}
              </div>
            )}
          </div>

          {/* ══ THREAD VIEW ═══════════════════════════════ */}
          {activeConvo && activeConvoData ? (
            <div className="flex flex-1 min-w-0">

              {/* Messages column */}
              <div className={`flex flex-col flex-1 min-w-0 ${showProviderInfo ? 'hidden lg:flex' : ''}`}>

                {/* Call overlay */}
                {showCallOverlay && (
                  <div className="flex items-center justify-between px-4 py-3 bg-emerald-500 text-white animate-pulse">
                    <div className="flex items-center gap-3">
                      <Phone size={16} />
                      <span className="text-sm font-semibold">
                        {callState.type === 'outgoing' && `Calling ${callState.peerName}...`}
                        {callState.type === 'incoming' && `Incoming call from ${callState.peerName}...`}
                        {callState.type === 'active' && `In call with ${callState.peerName}`}
                      </span>
                    </div>
                    <button onClick={() => endCall()}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-red-500 hover:bg-red-600 rounded-lg text-sm font-medium transition-colors">
                      <PhoneOff size={14} />
                      End
                    </button>
                  </div>
                )}

                {/* Thread header */}
                <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-100 dark:border-white/10">
                  <button onClick={() => { setActiveConvo(null); setShowProviderInfo(false); }}
                    className="sm:hidden p-1.5 rounded-lg text-gray-400 hover:bg-gray-50 dark:hover:bg-white/5">
                    <ChevronLeft size={20} />
                  </button>

                  {/* Clickable avatar - opens provider info */}
                  <button onClick={() => setShowProviderInfo(!showProviderInfo)}
                    className="flex items-center justify-center bg-gray-100 rounded-full w-9 h-9 dark:bg-white/10 shrink-0 hover:ring-2 hover:ring-brand-gold/30 transition-all">
                    <span className="text-base">{TYPE_EMOJI[activeConvoData.listingType] || '\u{1F4AC}'}</span>
                  </button>

                  <div className="flex-1 min-w-0">
                    <button onClick={() => setShowProviderInfo(!showProviderInfo)}
                      className="text-sm font-semibold truncate text-brand-charcoal-dark dark:text-white hover:text-brand-gold transition-colors text-left flex items-center gap-1.5">
                      {peer?.name || 'Unknown'}
                      {peer?.verified && <BadgeCheck size={12} className="text-blue-500 shrink-0" />}
                    </button>
                    <p className="text-[10px] text-gray-400 truncate">
                      {peer?.roleLabel || peer?.role || ''} · {activeConvoData.listingTitle || 'Support'}
                    </p>
                  </div>

                  <div className="flex gap-1">
                    <button onClick={() => setShowProviderInfo(!showProviderInfo)}
                      className={`p-1.5 rounded-lg transition-colors ${showProviderInfo ? 'bg-brand-gold/10 text-brand-gold' : 'text-gray-400 hover:bg-gray-50 dark:hover:bg-white/5'}`}
                      title="Provider info">
                      <UserIcon size={16} />
                    </button>
                    <button
                      onClick={() => { if (peer) startCall(peer.id, peer.name); }}
                      className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-50 dark:hover:bg-white/5"
                      title="Call">
                      <Phone size={16} />
                    </button>
                  </div>
                </div>

                {/* Listing context card */}
                {activeConvoData.listingTitle && (
                  <div className="flex items-center gap-3 px-4 py-2.5 bg-gray-50 dark:bg-white/5 border-b border-gray-100 dark:border-white/10">
                    <span className="text-base">{TYPE_EMOJI[activeConvoData.listingType] || '\u{1F4CB}'}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-[10px] text-gray-400">Enquiry about</p>
                      <p className="text-xs font-medium truncate text-brand-charcoal-dark dark:text-white">{activeConvoData.listingTitle}</p>
                    </div>
                    <ChevronRight size={14} className="text-gray-300 shrink-0" />
                  </div>
                )}

                {/* Messages area */}
                <div className="flex-1 px-4 py-3 space-y-1 overflow-y-auto scroll-y">
                  {Object.values(groupedMessages).map((group) => (
                    <div key={group.date}>
                      <div className="flex items-center gap-3 my-3">
                        <div className="flex-1 h-px bg-gray-100 dark:bg-white/10" />
                        <span className="text-[10px] text-gray-400 font-medium">{formatDateHeader(group.date)}</span>
                        <div className="flex-1 h-px bg-gray-100 dark:bg-white/10" />
                      </div>

                      {group.messages.map((msg) => (
                        <div key={msg.id} className={`flex mb-2 ${msg.from === 'user' ? 'justify-end' : 'justify-start'}`}>
                          <div className={`max-w-[80%] sm:max-w-[70%] ${msg.from === 'user'
                            ? 'bg-brand-gold text-brand-charcoal-dark rounded-2xl rounded-br-md'
                            : 'bg-gray-100 dark:bg-white/10 text-brand-charcoal-dark dark:text-white rounded-2xl rounded-bl-md'
                          } px-3.5 py-2.5`}>
                            <p className="text-sm leading-relaxed whitespace-pre-line">{msg.text}</p>
                            <div className={`flex items-center gap-1 mt-1 ${msg.from === 'user' ? 'justify-end' : 'justify-start'}`}>
                              <span className={`text-[9px] ${msg.from === 'user' ? 'text-brand-charcoal-dark/50' : 'text-gray-400'}`}>
                                {formatFullTime(msg.time)}
                              </span>
                              {msg.from === 'user' && (
                                msg.read
                                  ? <CheckCheck size={10} className="text-brand-charcoal-dark/50" />
                                  : <Check size={10} className="text-brand-charcoal-dark/50" />
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ))}
                  <div ref={messagesEndRef} />
                </div>

                {/* Typing indicator */}
                {activeConvo && typingMap[activeConvo] && (
                  <div className="px-4 py-1.5">
                    <span className="text-xs text-gray-400 italic animate-pulse">
                      {typingMap[activeConvo]} is typing…
                    </span>
                  </div>
                )}

                {/* Reply input */}
                <div className="px-4 py-3 border-t border-gray-100 dark:border-white/10">
                  <form onSubmit={handleSendMessage} className="flex items-end gap-2">
                    <div className="relative flex-1">
                      <textarea ref={inputRef} value={replyText}
                        onChange={(e) => { setReplyText(sanitize(e.target.value)); if (activeConvo) setTyping(activeConvo, true); }}
                        placeholder="Type a message..."
                        className="w-full px-3.5 py-2.5 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl text-sm resize-none focus:outline-none focus:ring-2 focus:ring-brand-gold/30 max-h-24"
                        rows={1} maxLength={1000}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSendMessage(e); }
                        }}
                      />
                    </div>
                    <button type="submit" disabled={!replyText.trim()}
                      className="flex items-center justify-center w-10 h-10 text-white transition-colors rounded-xl bg-brand-gold hover:bg-brand-gold-dark disabled:opacity-30 disabled:cursor-not-allowed shrink-0">
                      <Send size={16} />
                    </button>
                  </form>
                  <p className="text-[9px] text-gray-400 mt-1">Press Enter to send · Shift+Enter for new line</p>
                </div>
              </div>

              {/* ── Provider info panel ────────────────────── */}
              {showProviderInfo && peerMeta && (
                <div className="flex flex-col w-full border-l border-gray-100 lg:w-80 shrink-0 dark:border-white/10 bg-white dark:bg-gray-900">
                  <div className="flex items-center justify-between p-4 border-b border-gray-100 dark:border-white/10">
                    <p className="text-sm font-semibold text-brand-charcoal-dark dark:text-white">Provider Info</p>
                    <button onClick={() => setShowProviderInfo(false)} className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-white/10">
                      <X size={14} className="text-gray-400" />
                    </button>
                  </div>

                  <div className="flex-1 overflow-y-auto scroll-y">
                    {/* Provider header */}
                    <div className="p-4 text-center border-b border-gray-100 dark:border-white/10">
                      <div className="flex items-center justify-center w-16 h-16 mx-auto bg-gray-100 rounded-full dark:bg-white/10">
                        <UserIcon size={24} className="text-gray-400" />
                      </div>
                      <p className="mt-2 text-sm font-semibold text-brand-charcoal-dark dark:text-white flex items-center justify-center gap-1.5">
                        {peer?.name || 'Unknown'}
                        {peer?.verified && <BadgeCheck size={13} className="text-blue-500" />}
                      </p>
                      <p className="text-[11px] text-gray-400 mt-0.5">{peer?.roleLabel || peer?.role || ''}</p>

                      {peerMeta.visibility?.rating && (
                        <div className="flex items-center justify-center gap-2 mt-2">
                          <StarRating rating={peerMeta.rating} size={12} />
                          <span className="text-xs font-semibold text-brand-charcoal-dark dark:text-white">
                            {peerMeta.rating}
                          </span>
                          <span className="text-[10px] text-gray-400">
                            ({peerMeta.reviewCount} reviews)
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Tab bar */}
                    <div className="flex border-b border-gray-100 dark:border-white/10">
                      {[
                        { id: 'about', label: 'About' },
                        { id: 'listings', label: 'Listings' },
                        { id: 'reviews', label: 'Reviews' },
                      ].map((t) => (
                        <button key={t.id} onClick={() => setProviderInfoTab(t.id)}
                          className={`flex-1 py-2.5 text-[11px] font-medium transition-colors border-b-2
                            ${providerInfoTab === t.id
                              ? 'border-brand-gold text-brand-gold'
                              : 'border-transparent text-gray-400 hover:text-gray-600'
                            }`}>
                          {t.label}
                        </button>
                      ))}
                    </div>

                    <div className="p-4">
                      {/* About tab */}
                      {providerInfoTab === 'about' && (
                        <div className="space-y-3">
                          {peerMeta.visibility?.location && (
                            <div className="flex items-center gap-2.5 text-xs">
                              <MapPin size={13} className="text-gray-400 shrink-0" />
                              <span className="text-brand-charcoal-dark dark:text-white">{peerMeta.location}</span>
                            </div>
                          )}
                          <div className="flex items-center gap-2.5 text-xs">
                            <Calendar size={13} className="text-gray-400 shrink-0" />
                            <span className="text-brand-charcoal-dark dark:text-white">Joined {peerMeta.joinedDate}</span>
                          </div>
                          <div className="flex items-center gap-2.5 text-xs">
                            <Clock size={13} className="text-gray-400 shrink-0" />
                            <span className="text-brand-charcoal-dark dark:text-white">Responds {(peerMeta.responseTime || '').toLowerCase()}</span>
                          </div>
                          <div className="flex items-center gap-2.5 text-xs">
                            <Package size={13} className="text-gray-400 shrink-0" />
                            <span className="text-brand-charcoal-dark dark:text-white">{peerMeta.completedDeals} completed deals</span>
                          </div>

                          {/* Trust badge */}
                          <div className="flex items-start gap-2 p-3 mt-2 bg-emerald-50 dark:bg-emerald-500/10 rounded-xl">
                            <Shield size={12} className="text-emerald-500 shrink-0 mt-0.5" />
                            <p className="text-[10px] text-emerald-600 dark:text-emerald-400 leading-relaxed">
                              This provider is verified by Aurban. All transactions are protected by our escrow system.
                            </p>
                          </div>
                        </div>
                      )}

                      {/* Listings tab */}
                      {providerInfoTab === 'listings' && peerMeta.visibility?.listings && (
                        <div className="space-y-2">
                          {(peerMeta.listings || []).map((l) => (
                            <div key={l.id} className="flex items-center gap-3 p-3 border border-gray-100 dark:border-white/10 rounded-xl hover:bg-gray-50 dark:hover:bg-white/5 transition-colors cursor-pointer">
                              <span className="text-base">{TYPE_EMOJI[l.type] || '\u{1F4CB}'}</span>
                              <div className="flex-1 min-w-0">
                                <p className="text-xs font-medium truncate text-brand-charcoal-dark dark:text-white">{l.title}</p>
                                <p className="text-[10px] text-brand-gold font-semibold">{l.price}</p>
                              </div>
                              <ChevronRight size={12} className="text-gray-300 shrink-0" />
                            </div>
                          ))}
                          <p className="text-[10px] text-gray-400 text-center pt-1">
                            {(peerMeta.listings || []).length} listing{(peerMeta.listings || []).length !== 1 ? 's' : ''}
                          </p>
                        </div>
                      )}

                      {/* Reviews tab */}
                      {providerInfoTab === 'reviews' && peerMeta.visibility?.reviews && (
                        <div className="space-y-3">
                          {/* Summary */}
                          <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-white/5 rounded-xl">
                            <div className="text-center">
                              <p className="text-2xl font-bold font-display text-brand-charcoal-dark dark:text-white">{peerMeta.rating}</p>
                              <StarRating rating={peerMeta.rating} size={10} />
                            </div>
                            <div className="text-xs text-gray-400">
                              <p>{peerMeta.reviewCount} reviews</p>
                            </div>
                          </div>

                          {/* Review list */}
                          {(peerMeta.recentReviews || []).map((r) => (
                            <div key={r.id} className="p-3 border border-gray-100 dark:border-white/10 rounded-xl">
                              <div className="flex items-center justify-between mb-1">
                                <span className="text-xs font-medium text-brand-charcoal-dark dark:text-white">{r.author}</span>
                                <span className="text-[10px] text-gray-400">{r.date}</span>
                              </div>
                              <StarRating rating={r.rating} size={9} />
                              <p className="mt-1.5 text-[11px] text-gray-500 dark:text-gray-400 leading-relaxed">{r.text}</p>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Privacy note */}
                    <div className="p-4 border-t border-gray-100 dark:border-white/10">
                      <div className="flex items-start gap-2 p-3 bg-blue-50 dark:bg-blue-500/10 rounded-xl">
                        <Shield size={12} className="text-blue-500 shrink-0 mt-0.5" />
                        <p className="text-[10px] text-blue-600 dark:text-blue-400 leading-relaxed">
                          This provider controls what info is visible to you. Manage your own visibility in your account settings.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="items-center justify-center flex-1 hidden sm:flex">
              <div className="text-center">
                <MessageCircle size={40} className="mx-auto mb-3 text-gray-200 dark:text-gray-700" />
                <p className="text-sm text-gray-400">Select a conversation to start messaging</p>
              </div>
            </div>
          )}
        </div>
      </div>
  );
}
