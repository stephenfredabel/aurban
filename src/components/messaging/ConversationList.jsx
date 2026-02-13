import { formatDistanceToNow } from 'date-fns';
import { Search, MessageSquarePlus } from 'lucide-react';
import { useState }           from 'react';
import { useMessaging }       from '../../context/MessagingContext.jsx';
import { useAuth }            from '../../context/AuthContext.jsx';

const TYPE_COLORS = {
  rental:     'bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-300',
  shortlet:   'bg-purple-100 dark:bg-purple-500/20 text-purple-700 dark:text-purple-300',
  service:    'bg-blue-100 dark:bg-blue-500/20 text-blue-700 dark:text-blue-300',
  marketplace:'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300',
  roommate:   'bg-pink-100 dark:bg-pink-500/20 text-pink-700 dark:text-pink-300',
  default:    'bg-gray-100 dark:bg-white/10 text-gray-500 dark:text-white/50',
};

function Avatar({ name, size = 'md', online }) {
  const sz = size === 'sm' ? 'w-8 h-8 text-xs' : 'w-11 h-11 text-sm';
  const initials = name?.split(' ').slice(0, 2).map(n => n[0]).join('').toUpperCase() || '?';
  return (
    <div className={`relative shrink-0 ${sz} rounded-2xl bg-brand-gold/20 flex items-center justify-center`}>
      <span className="font-bold text-brand-gold-dark">{initials}</span>
      {online !== undefined && (
        <span className={`absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border-2 border-white dark:border-brand-charcoal-dark ${online ? 'bg-emerald-500' : 'bg-gray-300'}`} />
      )}
    </div>
  );
}

export default function ConversationList({ onSelectMobile }) {
  const { conversations, activeConvId, setActive } = useMessaging();
  const { user }   = useAuth();
  const [q, setQ]  = useState('');

  const myId  = user?.id || 'u_user_01';

  const filtered = conversations.filter(c =>
    c.listingTitle.toLowerCase().includes(q.toLowerCase()) ||
    c.participants.some(p => p.id !== myId && p.name.toLowerCase().includes(q.toLowerCase()))
  );

  const select = (id) => {
    setActive(id);
    onSelectMobile?.();
  };

  return (
    <div className="flex flex-col h-full bg-white dark:bg-brand-charcoal-dark">

      {/* Header */}
      <div className="px-4 py-4 border-b border-gray-100 dark:border-white/10">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-extrabold font-display text-brand-charcoal-dark dark:text-white">
            Messages
          </h2>
          <button
            type="button"
            aria-label="New conversation"
            className="flex items-center justify-center w-8 h-8 transition-colors rounded-xl bg-brand-gray-soft dark:bg-white/10 text-brand-charcoal dark:text-white hover:bg-brand-gold/10 hover:text-brand-gold"
          >
            <MessageSquarePlus size={16} />
          </button>
        </div>

        {/* Search */}
        <div className="relative">
          <Search size={14} className="absolute text-gray-400 -translate-y-1/2 pointer-events-none left-3 top-1/2" aria-hidden />
          <input
            type="search"
            placeholder="Search conversations…"
            value={q}
            onChange={e => setQ(e.target.value)}
            className="w-full py-2 pr-4 text-sm transition-all border border-transparent outline-none pl-9 rounded-xl font-body bg-brand-gray-soft dark:bg-white/10 text-brand-charcoal-dark dark:text-white placeholder:text-gray-400 focus:border-brand-gold"
          />
        </div>
      </div>

      {/* List */}
      <ul className="flex-1 overflow-y-auto" role="listbox" aria-label="Conversations">
        {filtered.length === 0 && (
          <li className="flex flex-col items-center justify-center h-48 px-6 text-center">
            <p className="mb-2 text-2xl">💬</p>
            <p className="text-sm font-semibold text-brand-charcoal-dark dark:text-white">No conversations yet</p>
            <p className="mt-1 text-xs text-gray-400">Start a conversation by messaging a listing</p>
          </li>
        )}

        {filtered.map(conv => {
          const other    = conv.participants.find(p => p.id !== myId);
          const isActive = conv.id === activeConvId;
          const typeTag  = TYPE_COLORS[conv.listingType] || TYPE_COLORS.default;
          const last     = conv.lastMessage;

          return (
            <li key={conv.id} role="option" aria-selected={isActive}>
              <button
                type="button"
                onClick={() => select(conv.id)}
                className={[
                  'w-full flex items-start gap-3 px-4 py-3.5 text-left transition-colors',
                  isActive
                    ? 'bg-brand-gold/10 dark:bg-brand-gold/15 border-r-2 border-brand-gold'
                    : 'hover:bg-brand-gray-soft dark:hover:bg-white/5 border-r-2 border-transparent',
                ].join(' ')}
              >
                {/* Avatar */}
                <Avatar name={other?.name} online={other?.online} />

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline justify-between gap-2 mb-0.5">
                    <p className={`text-sm font-bold truncate ${isActive ? 'text-brand-gold' : 'text-brand-charcoal-dark dark:text-white'}`}>
                      {other?.name || 'Unknown'}
                    </p>
                    {last && (
                      <span className="text-[10px] text-gray-400 shrink-0">
                        {formatDistanceToNow(last.timestamp, { addSuffix: false })}
                      </span>
                    )}
                  </div>

                  {/* Listing tag */}
                  <div className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold mb-1 ${typeTag}`}>
                    {conv.listingTitle.slice(0, 28)}{conv.listingTitle.length > 28 ? '…' : ''}
                  </div>

                  {/* Last message */}
                  <div className="flex items-center justify-between gap-2">
                    <p className={`text-xs truncate ${conv.unreadCount > 0 ? 'font-semibold text-brand-charcoal-dark dark:text-white' : 'text-gray-500 dark:text-white/50'}`}>
                      {last?.senderId === myId ? '↩ ' : ''}{last?.text || 'No messages yet'}
                    </p>
                    {conv.unreadCount > 0 && (
                      <span className="shrink-0 min-w-[18px] h-[18px] px-1 bg-brand-gold rounded-full flex items-center justify-center text-[10px] font-bold text-white">
                        {conv.unreadCount > 9 ? '9+' : conv.unreadCount}
                      </span>
                    )}
                  </div>
                </div>
              </button>

              {/* Divider */}
              <div className="h-px mx-4 bg-gray-100 dark:bg-white/5 last:hidden" />
            </li>
          );
        })}
      </ul>
    </div>
  );
}