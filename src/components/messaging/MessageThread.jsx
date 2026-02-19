import { useEffect, useRef, useState } from 'react';
import { format, isToday, isYesterday, isSameDay } from 'date-fns';
import {
  Phone, Video, MoreVertical, ArrowLeft,
  Check, CheckCheck, Clock, Image,
  FileText, AlertTriangle, ShieldAlert,
  ChevronDown, X, Flag,
} from 'lucide-react';
import { useMessaging }     from '../../context/MessagingContext.jsx';
import { useAuth }          from '../../context/AuthContext.jsx';
import MessageInput         from './MessageInput.jsx';

// ── Message status icons ──────────────────────────────────────
function StatusIcon({ status }) {
  if (status === 'sending') return <Clock size={11} className="text-white/50" />;
  if (status === 'sent')    return <Check size={11} className="text-white/60" />;
  if (status === 'delivered') return <CheckCheck size={11} className="text-white/60" />;
  if (status === 'read')    return <CheckCheck size={11} className="text-brand-gold" />;
  return null;
}

// ── Date divider ──────────────────────────────────────────────
function DateDivider({ timestamp }) {
  const d = new Date(timestamp);
  const label = isToday(d)     ? 'Today'
              : isYesterday(d) ? 'Yesterday'
              : format(d, 'EEEE, d MMMM yyyy');
  return (
    <div className="flex items-center gap-3 py-2">
      <span className="flex-1 h-px bg-gray-100 dark:bg-white/10" />
      <span className="text-[11px] font-semibold text-gray-400 dark:text-white/30 px-3 py-1 rounded-full bg-brand-gray-soft dark:bg-white/5">
        {label}
      </span>
      <span className="flex-1 h-px bg-gray-100 dark:bg-white/10" />
    </div>
  );
}

// ── Single message bubble ─────────────────────────────────────
function MessageBubble({ msg, isMine, senderName, showAvatar }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const time = format(new Date(msg.timestamp), 'HH:mm');

  return (
    <div className={`flex items-end gap-2 group ${isMine ? 'flex-row-reverse' : 'flex-row'}`}>
      {/* Sender avatar */}
      {!isMine && (
        <div className={`w-7 h-7 rounded-xl bg-brand-gold/20 flex items-center justify-center shrink-0 mb-1 ${showAvatar ? 'visible' : 'invisible'}`}>
          <span className="text-[10px] font-bold text-brand-gold-dark">
            {senderName?.charAt(0)?.toUpperCase()}
          </span>
        </div>
      )}

      <div className={`flex flex-col max-w-[70%] sm:max-w-[60%] ${isMine ? 'items-end' : 'items-start'}`}>
        {/* Bubble */}
        <div className={[
          'relative px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed',
          isMine
            ? 'bg-brand-charcoal-dark dark:bg-brand-gold text-white rounded-br-md'
            : 'bg-white dark:bg-white/10 text-brand-charcoal-dark dark:text-white shadow-sm rounded-bl-md border border-gray-100 dark:border-white/10',
        ].join(' ')}>

          {/* File attachment */}
          {msg.type === 'file' && msg.file && (
            <div className={`flex items-center gap-2 mb-1.5 p-2 rounded-xl ${isMine ? 'bg-white/10' : 'bg-brand-gray-soft dark:bg-white/10'}`}>
              {msg.file.type?.startsWith('image/')
                ? <Image size={14} className="shrink-0 opacity-70" />
                : <FileText size={14} className="shrink-0 opacity-70" />
              }
              <span className="text-xs font-semibold truncate max-w-[140px]">{msg.file.name}</span>
            </div>
          )}

          {/* Masked / warned text */}
          {msg.masked && (
            <div className="flex items-start gap-1.5 mb-1.5 p-2 bg-amber-100/60 dark:bg-amber-500/20 rounded-xl">
              <AlertTriangle size={12} className="text-amber-500 mt-0.5 shrink-0" />
              <p className="text-[11px] text-amber-700 dark:text-amber-300 font-semibold leading-relaxed">
                Contact info hidden — complete a booking to exchange details.
              </p>
            </div>
          )}

          {/* Message text */}
          {msg.text && <p className="break-words whitespace-pre-wrap">{msg.text}</p>}

          {/* Time + status */}
          <div className={`flex items-center gap-1 mt-1 ${isMine ? 'justify-end' : 'justify-start'}`}>
            <span className={`text-[10px] ${isMine ? 'text-white/50' : 'text-gray-400'}`}>{time}</span>
            {isMine && <StatusIcon status={msg.status} />}
          </div>
        </div>
      </div>

      {/* Context menu trigger */}
      <div className="relative self-center transition-opacity opacity-0 group-hover:opacity-100">
        <button type="button" onClick={() => setMenuOpen(v => !v)}
          aria-label="Message options"
          className="flex items-center justify-center w-6 h-6 text-gray-400 transition-colors rounded-lg bg-brand-gray-soft dark:bg-white/10 hover:text-brand-charcoal dark:hover:text-white">
          <MoreVertical size={12} />
        </button>
        {menuOpen && (
          <div className={`absolute bottom-full mb-1 ${isMine ? 'right-0' : 'left-0'} z-20 w-32 bg-white dark:bg-brand-charcoal-dark rounded-xl shadow-xl border border-gray-100 dark:border-white/10 overflow-hidden`}
            onMouseLeave={() => setMenuOpen(false)}>
            {['Copy', 'Report', 'Delete'].map(label => (
              <button key={label} type="button"
                className={`w-full flex items-center gap-2 px-3 py-2 text-xs font-semibold transition-colors
                  ${label === 'Delete' || label === 'Report'
                    ? 'text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10'
                    : 'text-brand-charcoal dark:text-white hover:bg-brand-gray-soft dark:hover:bg-white/10'}`}
                onClick={() => setMenuOpen(false)}>
                {label === 'Report' && <Flag size={11} />}
                {label}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Main component
// ─────────────────────────────────────────────────────────────
export default function MessageThread({ onBack }) {
  const { activeConversation, typingMap, startCall } = useMessaging();
  const { user }  = useAuth();
  const bottomRef = useRef(null);
  const [showScrollBtn, setShowScrollBtn] = useState(false);

  const myId = user?.id || 'u_user_01';
  const conv = activeConversation;
  const other = conv?.participants.find(p => p.id !== myId);
  const isTyping = (typingMap[conv?.id] || []).filter(id => id !== myId).length > 0;

  // Auto scroll to bottom on new message
  useEffect(() => {
    if (bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [conv?.messages?.length, isTyping]);

  if (!conv) {
    return (
      <div className="flex flex-col items-center justify-center h-full px-8 text-center">
        <p className="mb-4 text-5xl">💬</p>
        <p className="mb-2 text-xl font-extrabold font-display text-brand-charcoal-dark dark:text-white">
          Your Messages
        </p>
        <p className="max-w-xs text-sm leading-relaxed text-gray-500 dark:text-gray-400">
          Select a conversation from the list, or start a new one by messaging any listing.
        </p>
      </div>
    );
  }

  // Group messages and insert date dividers
  const grouped = [];
  conv.messages.forEach((msg, i) => {
    const prev = conv.messages[i - 1];
    if (!prev || !isSameDay(new Date(prev.timestamp), new Date(msg.timestamp))) {
      grouped.push({ type: 'divider', timestamp: msg.timestamp, key: `div_${msg.timestamp}` });
    }
    grouped.push({ type: 'message', msg, key: msg.id });
  });

  return (
    <div className="flex flex-col h-full bg-gray-50 dark:bg-gray-900/50">

      {/* ── Thread header ─────────────────────────────── */}
      <div className="flex items-center gap-3 px-4 py-3 bg-white border-b border-gray-100 shadow-sm dark:bg-brand-charcoal-dark dark:border-white/10 shrink-0">
        {/* Back button (mobile) */}
        <button type="button" onClick={onBack}
          className="flex items-center justify-center w-8 h-8 transition-colors md:hidden rounded-xl text-brand-charcoal dark:text-white hover:bg-brand-gray-soft dark:hover:bg-white/10"
          aria-label="Back to conversations">
          <ArrowLeft size={18} />
        </button>

        {/* Peer info */}
        <div className="relative shrink-0">
          <div className="flex items-center justify-center w-10 h-10 rounded-2xl bg-brand-gold/20">
            <span className="text-sm font-bold text-brand-gold-dark">
              {other?.name?.charAt(0)?.toUpperCase()}
            </span>
          </div>
          <span className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white dark:border-brand-charcoal-dark ${other?.online ? 'bg-emerald-500' : 'bg-gray-300'}`} />
        </div>

        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold truncate text-brand-charcoal-dark dark:text-white">{other?.name}</p>
          <p className="text-xs text-gray-400 truncate">
            {other?.online ? '🟢 Online' : 'Last seen recently'} · {conv.listingTitle}
          </p>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1 shrink-0">
          {/* Voice call */}
          <button
            type="button"
            onClick={() => startCall(other?.id, other?.name)}
            aria-label="Voice call"
            className="flex items-center justify-center transition-colors w-9 h-9 rounded-xl text-brand-charcoal dark:text-white hover:bg-brand-gray-soft dark:hover:bg-white/10 hover:text-brand-gold"
          >
            <Phone size={17} />
          </button>
          {/* More options */}
          <button type="button" aria-label="More options"
            className="flex items-center justify-center transition-colors w-9 h-9 rounded-xl text-brand-charcoal dark:text-white hover:bg-brand-gray-soft dark:hover:bg-white/10">
            <MoreVertical size={17} />
          </button>
        </div>
      </div>

      {/* ── Listing context banner ─────────────────────── */}
      <div className="flex items-center gap-3 px-4 py-2.5 bg-brand-gold/5 dark:bg-brand-gold/10 border-b border-brand-gold/20 shrink-0">
        <div className="flex items-center justify-center w-6 h-6 rounded-lg bg-brand-gold/20 shrink-0">
          <span className="text-xs">🏠</span>
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-bold truncate text-brand-charcoal-dark dark:text-white">{conv.listingTitle}</p>
          <p className="text-[10px] text-gray-400 capitalize">{conv.listingType} listing</p>
        </div>
        {!conv.isPaid && (
          <div className="flex items-center gap-1 shrink-0">
            <ShieldAlert size={12} className="text-amber-500" />
            <p className="text-[10px] font-bold text-amber-600 dark:text-amber-400">Contact protected</p>
          </div>
        )}
      </div>

      {/* ── Messages ──────────────────────────────────── */}
      <div
        className="flex-1 px-4 py-4 space-y-1 overflow-y-auto"
        onScroll={(e) => {
          const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
          setShowScrollBtn(scrollHeight - scrollTop - clientHeight > 200);
        }}
      >
        {grouped.map((item) => {
          if (item.type === 'divider') {
            return <DateDivider key={item.key} timestamp={item.timestamp} />;
          }
          const { msg }  = item;
          const isMine   = msg.senderId === myId;
          const sender   = conv.participants.find(p => p.id === msg.senderId);
          const prevMsg  = conv.messages[conv.messages.indexOf(msg) - 1];
          const showAvatar = !isMine && (!prevMsg || prevMsg.senderId !== msg.senderId);
          return (
            <MessageBubble
              key={msg.id}
              msg={msg}
              isMine={isMine}
              senderName={sender?.name}
              showAvatar={showAvatar}
            />
          );
        })}

        {/* Typing indicator */}
        {isTyping && (
          <div className="flex items-end gap-2">
            <div className="flex items-center justify-center w-7 h-7 rounded-xl bg-brand-gold/20 shrink-0">
              <span className="text-[10px] font-bold text-brand-gold-dark">
                {other?.name?.charAt(0)?.toUpperCase()}
              </span>
            </div>
            <div className="px-4 py-3 bg-white border border-gray-100 shadow-sm dark:bg-white/10 rounded-2xl rounded-bl-md dark:border-white/10">
              <div className="flex gap-1">
                {[0, 1, 2].map(i => (
                  <span key={i}
                    className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                    style={{ animationDelay: `${i * 0.15}s` }} />
                ))}
              </div>
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Scroll-to-bottom button */}
      {showScrollBtn && (
        <button
          type="button"
          onClick={() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' })}
          aria-label="Scroll to latest messages"
          className="absolute flex items-center justify-center transition-all bg-white border border-gray-200 rounded-full shadow-lg bottom-24 right-6 w-9 h-9 dark:bg-brand-charcoal-dark dark:border-white/20 text-brand-charcoal dark:text-white hover:border-brand-gold"
        >
          <ChevronDown size={16} />
        </button>
      )}

      {/* ── Input ─────────────────────────────────────── */}
      <MessageInput convId={conv.id} isPaid={conv.isPaid} />
    </div>
  );
}