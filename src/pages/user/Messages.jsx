import { useState, useCallback, useRef, useEffect } from 'react';
import {
  MessageCircle, Search, Send, ChevronLeft,
  MoreVertical, Check, CheckCheck,
  Phone, Image as ImageIcon, Paperclip,
  User as UserIcon, Clock, Star, X,
  MapPin, Shield, BadgeCheck, Package, ChevronRight,
  Eye, EyeOff, ExternalLink, Calendar, MessageSquare,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext.jsx';
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
════════════════════════════════════════════════════════════ */

const MOCK_CONVERSATIONS = [
  {
    id: 'c1',
    providerId: 'p_tunde01',
    providerName: 'Tunde Properties',
    providerRole: 'Agent',
    providerAvatar: null,
    listingTitle: '3 Bedroom Flat in Lekki Phase 1',
    listingType: 'rental',
    unread: 2,
    lastMessageTime: '2026-02-13T08:30:00Z',
    providerInfo: {
      rating: 4.8,
      reviewCount: 23,
      verified: true,
      joinedDate: 'Jan 2023',
      location: 'Lekki, Lagos',
      responseTime: 'Within 2 hours',
      completedDeals: 47,
      listings: [
        { id: 'l1', title: '3 Bedroom Flat in Lekki Phase 1', type: 'rental', price: '₦2,500,000/yr' },
        { id: 'l2', title: '2 Bedroom Shortlet — Victoria Island', type: 'shortlet', price: '₦85,000/night' },
        { id: 'l3', title: '4 Bedroom Duplex — Ikeja GRA', type: 'rental', price: '₦4,500,000/yr' },
      ],
      recentReviews: [
        { id: 'r1', author: 'Chioma N.', rating: 5, text: 'Very professional agent. Helped me find the perfect apartment quickly.', date: 'Jan 2026' },
        { id: 'r2', author: 'Femi A.', rating: 4, text: 'Good service, responsive and knowledgeable about the area.', date: 'Dec 2025' },
      ],
      visibility: { location: true, rating: true, listings: true, reviews: true },
    },
    messages: [
      { id: 'm1', from: 'user', text: 'Hi, is this property still available for viewing?', time: '2026-02-12T10:00:00Z', read: true },
      { id: 'm2', from: 'provider', text: 'Good morning! Yes, the property is available. When would you like to schedule an inspection?', time: '2026-02-12T10:15:00Z', read: true },
      { id: 'm3', from: 'user', text: 'This Saturday around 2PM would work for me. Is that okay?', time: '2026-02-12T10:20:00Z', read: true },
      { id: 'm4', from: 'provider', text: 'Saturday 2PM works perfectly. The address is 15B Admiralty Way, Lekki Phase 1. Please come with a valid ID. I will meet you at the gate.', time: '2026-02-12T11:00:00Z', read: true },
      { id: 'm5', from: 'provider', text: 'Also, the annual rent is ₦2.5M with a caution fee of ₦500K. Service charge is ₦350K. Let me know if you have questions about the fees.', time: '2026-02-13T08:30:00Z', read: false },
    ],
  },
  {
    id: 'c2',
    providerId: 'p_lagos_land',
    providerName: 'Lagos Land Hub',
    providerRole: 'Seller',
    providerAvatar: null,
    listingTitle: 'Land for Sale — 500sqm Ibeju-Lekki',
    listingType: 'land',
    unread: 0,
    lastMessageTime: '2026-02-11T16:00:00Z',
    providerInfo: {
      rating: 4.5,
      reviewCount: 15,
      verified: true,
      joinedDate: 'Mar 2022',
      location: 'Ibeju-Lekki, Lagos',
      responseTime: 'Within 4 hours',
      completedDeals: 31,
      listings: [
        { id: 'l4', title: 'Land for Sale — 500sqm Ibeju-Lekki', type: 'land', price: '₦15,000,000' },
        { id: 'l5', title: 'Land for Sale — 1000sqm Epe', type: 'land', price: '₦8,000,000' },
      ],
      recentReviews: [
        { id: 'r3', author: 'Bola O.', rating: 5, text: 'Genuine land seller. Documents were authentic and transaction was smooth.', date: 'Feb 2026' },
      ],
      visibility: { location: true, rating: true, listings: true, reviews: true },
    },
    messages: [
      { id: 'm6', from: 'user', text: 'What documents are available for this land? C of O or Governor consent?', time: '2026-02-11T14:00:00Z', read: true },
      { id: 'm7', from: 'provider', text: 'The land has an approved excision and gazette. We are currently processing the C of O. Survey plan is available.', time: '2026-02-11T14:30:00Z', read: true },
      { id: 'm8', from: 'user', text: 'Thank you. I will review and get back to you.', time: '2026-02-11T16:00:00Z', read: true },
    ],
  },
  {
    id: 'c3',
    providerId: 'p_decor_ng',
    providerName: 'Decor Masters NG',
    providerRole: 'Service Provider',
    providerAvatar: null,
    listingTitle: 'Premium Interior Design',
    listingType: 'service',
    unread: 1,
    lastMessageTime: '2026-02-13T07:00:00Z',
    providerInfo: {
      rating: 4.9,
      reviewCount: 41,
      verified: true,
      joinedDate: 'Aug 2023',
      location: 'Surulere, Lagos',
      responseTime: 'Within 1 hour',
      completedDeals: 62,
      listings: [
        { id: 'l6', title: 'Premium Interior Design', type: 'service', price: 'From ₦1,500,000' },
        { id: 'l7', title: 'Office Space Design', type: 'service', price: 'From ₦800,000' },
        { id: 'l8', title: 'Furniture Sourcing', type: 'service', price: 'Varies' },
      ],
      recentReviews: [
        { id: 'r4', author: 'Ngozi E.', rating: 5, text: 'Transformed my apartment beautifully! Highly recommend.', date: 'Jan 2026' },
        { id: 'r5', author: 'Tunde L.', rating: 5, text: 'Excellent work on my office. Modern and functional.', date: 'Dec 2025' },
      ],
      visibility: { location: true, rating: true, listings: true, reviews: true },
    },
    messages: [
      { id: 'm9', from: 'user', text: 'I need interior design for a 3-bedroom flat in Lekki. Modern minimalist style. What is your pricing?', time: '2026-02-10T09:00:00Z', read: true },
      { id: 'm10', from: 'provider', text: 'Hi! For a 3-bed flat, our modern minimalist packages start from ₦1.5M including furniture sourcing. We can schedule a consultation visit first — it is free.', time: '2026-02-10T10:00:00Z', read: true },
      { id: 'm11', from: 'provider', text: 'Just following up — would you like to book a free consultation this week?', time: '2026-02-13T07:00:00Z', read: false },
    ],
  },
];

const TYPE_EMOJI = {
  rental: '🏠', buy: '🏡', land: '🗺️', service: '🔧',
  shortlet: '🏨', shared: '👥', product: '📦',
};

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
  const [conversations, setConversations] = useState(MOCK_CONVERSATIONS);
  const [activeConvo, setActiveConvo] = useState(null);
  const [search, setSearch] = useState('');
  const [replyText, setReplyText] = useState('');
  const [showProviderInfo, setShowProviderInfo] = useState(false);
  const [providerInfoTab, setProviderInfoTab] = useState('about');
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  const totalUnread = conversations.reduce((s, c) => s + c.unread, 0);

  /* ── Open conversation ──────────────────────────────────── */
  const openConvo = useCallback((id) => {
    setActiveConvo(id);
    setConversations((prev) =>
      prev.map((c) => c.id === id ? {
        ...c, unread: 0,
        messages: c.messages.map((m) => ({ ...m, read: true })),
      } : c)
    );
    setReplyText('');
    setShowProviderInfo(false);
  }, []);

  /* ── Send message ───────────────────────────────────────── */
  const sendMessage = useCallback((e) => {
    e.preventDefault();
    const text = sanitize(replyText.trim());
    if (!text || !activeConvo) return;

    const newMsg = {
      id: 'msg_' + Date.now(),
      from: 'user',
      text,
      time: new Date().toISOString(),
      read: false,
    };

    setConversations((prev) =>
      prev.map((c) => c.id === activeConvo ? {
        ...c,
        messages: [...c.messages, newMsg],
        lastMessageTime: newMsg.time,
      } : c)
    );
    setReplyText('');
    setTimeout(() => inputRef.current?.focus(), 50);
  }, [replyText, activeConvo]);

  /* ── Auto-scroll ─────────────────────────────────────────── */
  const activeConvoData = conversations.find((c) => c.id === activeConvo);
  useEffect(() => {
    if (activeConvoData) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [activeConvoData?.messages?.length]);

  /* ── Filtered conversations ─────────────────────────────── */
  const filteredConvos = search.trim()
    ? conversations.filter((c) =>
        c.providerName.toLowerCase().includes(search.toLowerCase()) ||
        c.listingTitle.toLowerCase().includes(search.toLowerCase())
      )
    : conversations;

  /* ── Group messages by date ─────────────────────────────── */
  const groupedMessages = activeConvoData?.messages.reduce((groups, msg) => {
    const dateKey = new Date(msg.time).toDateString();
    if (!groups[dateKey]) groups[dateKey] = { date: msg.time, messages: [] };
    groups[dateKey].messages.push(msg);
    return groups;
  }, {});

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

            {/* Conversation list */}
            <div className="flex-1 overflow-y-auto scroll-y">
              {filteredConvos.length === 0 ? (
                <div className="p-8 text-center">
                  <MessageCircle size={32} className="mx-auto mb-3 text-gray-200 dark:text-gray-700" />
                  <p className="text-sm text-gray-400">No conversations yet</p>
                </div>
              ) : (
                filteredConvos.map((convo) => {
                  const lastMsg = convo.messages[convo.messages.length - 1];
                  return (
                    <button key={convo.id} onClick={() => openConvo(convo.id)}
                      className={`w-full flex items-start gap-3 p-4 text-left border-b border-gray-50 dark:border-white/5 transition-colors
                        ${activeConvo === convo.id
                          ? 'bg-brand-gold/5 dark:bg-brand-gold/10'
                          : 'hover:bg-gray-50 dark:hover:bg-white/5'
                        }`}>
                      <div className="relative flex items-center justify-center w-10 h-10 bg-gray-100 rounded-full dark:bg-white/10 shrink-0">
                        <span className="text-lg">{TYPE_EMOJI[convo.listingType] || '💬'}</span>
                        {convo.unread > 0 && (
                          <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full bg-brand-gold text-white text-[8px] font-bold flex items-center justify-center">
                            {convo.unread}
                          </span>
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-0.5">
                          <div className="flex items-center gap-1.5 min-w-0">
                            <span className={`text-sm font-semibold truncate ${convo.unread > 0 ? 'text-brand-charcoal-dark dark:text-white' : 'text-gray-600 dark:text-gray-400'}`}>
                              {convo.providerName}
                            </span>
                            {convo.providerInfo?.verified && <BadgeCheck size={12} className="text-blue-500 shrink-0" />}
                          </div>
                          <span className="text-[10px] text-gray-400 shrink-0 ml-2">
                            {formatMessageTime(convo.lastMessageTime)}
                          </span>
                        </div>
                        <p className="text-[11px] text-gray-400 truncate mb-0.5">
                          <span className="mr-1">{TYPE_EMOJI[convo.listingType] || '📋'}</span>
                          {convo.listingTitle}
                        </p>
                        <p className={`text-xs truncate ${convo.unread > 0 ? 'text-brand-charcoal dark:text-gray-300 font-medium' : 'text-gray-400'}`}>
                          {lastMsg?.from === 'user' ? 'You: ' : ''}{lastMsg?.text}
                        </p>
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </div>

          {/* ══ THREAD VIEW ═══════════════════════════════ */}
          {activeConvo && activeConvoData ? (
            <div className="flex flex-1 min-w-0">

              {/* Messages column */}
              <div className={`flex flex-col flex-1 min-w-0 ${showProviderInfo ? 'hidden lg:flex' : ''}`}>

                {/* Thread header */}
                <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-100 dark:border-white/10">
                  <button onClick={() => { setActiveConvo(null); setShowProviderInfo(false); }}
                    className="sm:hidden p-1.5 rounded-lg text-gray-400 hover:bg-gray-50 dark:hover:bg-white/5">
                    <ChevronLeft size={20} />
                  </button>

                  {/* Clickable avatar → opens provider info */}
                  <button onClick={() => setShowProviderInfo(!showProviderInfo)}
                    className="flex items-center justify-center bg-gray-100 rounded-full w-9 h-9 dark:bg-white/10 shrink-0 hover:ring-2 hover:ring-brand-gold/30 transition-all">
                    <span className="text-base">{TYPE_EMOJI[activeConvoData.listingType] || '💬'}</span>
                  </button>

                  <div className="flex-1 min-w-0">
                    <button onClick={() => setShowProviderInfo(!showProviderInfo)}
                      className="text-sm font-semibold truncate text-brand-charcoal-dark dark:text-white hover:text-brand-gold transition-colors text-left flex items-center gap-1.5">
                      {activeConvoData.providerName}
                      {activeConvoData.providerInfo?.verified && <BadgeCheck size={12} className="text-blue-500 shrink-0" />}
                    </button>
                    <p className="text-[10px] text-gray-400 truncate">
                      {activeConvoData.providerRole} · {activeConvoData.listingTitle}
                    </p>
                  </div>

                  <div className="flex gap-1">
                    <button onClick={() => setShowProviderInfo(!showProviderInfo)}
                      className={`p-1.5 rounded-lg transition-colors ${showProviderInfo ? 'bg-brand-gold/10 text-brand-gold' : 'text-gray-400 hover:bg-gray-50 dark:hover:bg-white/5'}`}
                      title="Provider info">
                      <UserIcon size={16} />
                    </button>
                    <button className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-50 dark:hover:bg-white/5">
                      <Phone size={16} />
                    </button>
                  </div>
                </div>

                {/* Listing context card */}
                <div className="flex items-center gap-3 px-4 py-2.5 bg-gray-50 dark:bg-white/5 border-b border-gray-100 dark:border-white/10">
                  <span className="text-base">{TYPE_EMOJI[activeConvoData.listingType] || '📋'}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-[10px] text-gray-400">Enquiry about</p>
                    <p className="text-xs font-medium truncate text-brand-charcoal-dark dark:text-white">{activeConvoData.listingTitle}</p>
                  </div>
                  <ChevronRight size={14} className="text-gray-300 shrink-0" />
                </div>

                {/* Messages area */}
                <div className="flex-1 px-4 py-3 space-y-1 overflow-y-auto scroll-y">
                  {groupedMessages && Object.values(groupedMessages).map((group) => (
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

                {/* Reply input */}
                <div className="px-4 py-3 border-t border-gray-100 dark:border-white/10">
                  <form onSubmit={sendMessage} className="flex items-end gap-2">
                    <div className="relative flex-1">
                      <textarea ref={inputRef} value={replyText}
                        onChange={(e) => setReplyText(sanitize(e.target.value))}
                        placeholder="Type a message..."
                        className="w-full px-3.5 py-2.5 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl text-sm resize-none focus:outline-none focus:ring-2 focus:ring-brand-gold/30 max-h-24"
                        rows={1} maxLength={1000}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(e); }
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
              {showProviderInfo && activeConvoData.providerInfo && (
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
                        {activeConvoData.providerName}
                        {activeConvoData.providerInfo.verified && <BadgeCheck size={13} className="text-blue-500" />}
                      </p>
                      <p className="text-[11px] text-gray-400 mt-0.5">{activeConvoData.providerRole}</p>

                      {activeConvoData.providerInfo.visibility.rating && (
                        <div className="flex items-center justify-center gap-2 mt-2">
                          <StarRating rating={activeConvoData.providerInfo.rating} size={12} />
                          <span className="text-xs font-semibold text-brand-charcoal-dark dark:text-white">
                            {activeConvoData.providerInfo.rating}
                          </span>
                          <span className="text-[10px] text-gray-400">
                            ({activeConvoData.providerInfo.reviewCount} reviews)
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
                          {activeConvoData.providerInfo.visibility.location && (
                            <div className="flex items-center gap-2.5 text-xs">
                              <MapPin size={13} className="text-gray-400 shrink-0" />
                              <span className="text-brand-charcoal-dark dark:text-white">{activeConvoData.providerInfo.location}</span>
                            </div>
                          )}
                          <div className="flex items-center gap-2.5 text-xs">
                            <Calendar size={13} className="text-gray-400 shrink-0" />
                            <span className="text-brand-charcoal-dark dark:text-white">Joined {activeConvoData.providerInfo.joinedDate}</span>
                          </div>
                          <div className="flex items-center gap-2.5 text-xs">
                            <Clock size={13} className="text-gray-400 shrink-0" />
                            <span className="text-brand-charcoal-dark dark:text-white">Responds {activeConvoData.providerInfo.responseTime.toLowerCase()}</span>
                          </div>
                          <div className="flex items-center gap-2.5 text-xs">
                            <Package size={13} className="text-gray-400 shrink-0" />
                            <span className="text-brand-charcoal-dark dark:text-white">{activeConvoData.providerInfo.completedDeals} completed deals</span>
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
                      {providerInfoTab === 'listings' && activeConvoData.providerInfo.visibility.listings && (
                        <div className="space-y-2">
                          {activeConvoData.providerInfo.listings.map((l) => (
                            <div key={l.id} className="flex items-center gap-3 p-3 border border-gray-100 dark:border-white/10 rounded-xl hover:bg-gray-50 dark:hover:bg-white/5 transition-colors cursor-pointer">
                              <span className="text-base">{TYPE_EMOJI[l.type] || '📋'}</span>
                              <div className="flex-1 min-w-0">
                                <p className="text-xs font-medium truncate text-brand-charcoal-dark dark:text-white">{l.title}</p>
                                <p className="text-[10px] text-brand-gold font-semibold">{l.price}</p>
                              </div>
                              <ChevronRight size={12} className="text-gray-300 shrink-0" />
                            </div>
                          ))}
                          <p className="text-[10px] text-gray-400 text-center pt-1">
                            {activeConvoData.providerInfo.listings.length} listing{activeConvoData.providerInfo.listings.length !== 1 ? 's' : ''}
                          </p>
                        </div>
                      )}

                      {/* Reviews tab */}
                      {providerInfoTab === 'reviews' && activeConvoData.providerInfo.visibility.reviews && (
                        <div className="space-y-3">
                          {/* Summary */}
                          <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-white/5 rounded-xl">
                            <div className="text-center">
                              <p className="text-2xl font-bold font-display text-brand-charcoal-dark dark:text-white">{activeConvoData.providerInfo.rating}</p>
                              <StarRating rating={activeConvoData.providerInfo.rating} size={10} />
                            </div>
                            <div className="text-xs text-gray-400">
                              <p>{activeConvoData.providerInfo.reviewCount} reviews</p>
                            </div>
                          </div>

                          {/* Review list */}
                          {activeConvoData.providerInfo.recentReviews.map((r) => (
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
