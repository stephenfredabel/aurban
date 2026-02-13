import { useState, useMemo } from 'react';
import { Link }              from 'react-router-dom';
import {
  Search, Calendar, MapPin, Eye, Heart,
  MessageSquare, CreditCard, FileText,
  ChevronRight, Filter, Download, Clock,
  CheckCircle2, XCircle, Home, Briefcase,
  Package, AlertCircle, Star, ChevronDown,
} from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';
import { useCurrency } from '../../hooks/useCurrency.js';

// ─────────────────────────────────────────────────────────────
// CONSTANTS
// ─────────────────────────────────────────────────────────────

const ACTIVITY_TYPES = [
  { id: 'all',         label: 'All Activity',    icon: Clock        },
  { id: 'views',       label: 'Property Views',  icon: Eye          },
  { id: 'saves',       label: 'Saved Items',     icon: Heart        },
  { id: 'messages',    label: 'Messages',        icon: MessageSquare},
  { id: 'bookings',    label: 'Bookings',        icon: Calendar     },
  { id: 'payments',    label: 'Payments',        icon: CreditCard   },
  { id: 'searches',    label: 'Searches',        icon: Search       },
];

const TIME_FILTERS = ['All Time', 'Today', 'This Week', 'This Month', 'Last 3 Months'];

// ─────────────────────────────────────────────────────────────
// MOCK DATA
// ─────────────────────────────────────────────────────────────

const MOCK_ACTIVITIES = [
  { id:'a1',  type:'payment',  action:'Paid rent',         item:{ title:'3-Bedroom Flat, Lekki Phase 1', category:'rental'  }, amount:1200000, status:'completed', date: Date.now() - 1800_000     },
  { id:'a2',  type:'booking',  action:'Inspection booked', item:{ title:'2-Bed Apartment, Ikeja GRA',    category:'rental'  }, ref:'AUR-XYZ123', date: Date.now() - 3600_000     },
  { id:'a3',  type:'message',  action:'Sent message',      item:{ title:'Provider: Chukwuemeka Eze',     category:'service' }, unread:false, date: Date.now() - 7200_000     },
  { id:'a4',  type:'save',     action:'Saved property',    item:{ title:'4-Bed Duplex, Maitama Abuja',   category:'sale'    }, date: Date.now() - 14400_000    },
  { id:'a5',  type:'view',     action:'Viewed property',   item:{ title:'Studio Apartment, Yaba',        category:'rental'  }, date: Date.now() - 21600_000    },
  { id:'a6',  type:'search',   action:'Searched',          query:'3-bed rental Lekki under 1.5M',        results:12, date: Date.now() - 43200_000    },
  { id:'a7',  type:'payment',  action:'Service payment',   item:{ title:'Plumbing Repair',               category:'service' }, amount:25000,   status:'completed', date: Date.now() - 86400_000    },
  { id:'a8',  type:'save',     action:'Saved search',      query:'Shortlet Victoria Island',             alertOn:true, date: Date.now() - 172800_000   },
  { id:'a9',  type:'view',     action:'Viewed service',    item:{ title:'Interior Design Consultation',  category:'service' }, date: Date.now() - 259200_000   },
  { id:'a10', type:'payment',  action:'Escrow payment',    item:{ title:'Land Purchase, Ibeju-Lekki',    category:'land'    }, amount:8500000, status:'in_escrow', date: Date.now() - 345600_000   },
  { id:'a11', type:'booking',  action:'Inspection cancelled', item:{ title:'Mini Flat, Surulere',        category:'rental'  }, ref:'AUR-ABC789', status:'cancelled', date: Date.now() - 432000_000   },
  { id:'a12', type:'message',  action:'Received message',  item:{ title:'Provider: Ngozi Eze',           category:'service' }, unread:true, date: Date.now() - 518400_000   },
];

// ─────────────────────────────────────────────────────────────
// ACTIVITY CARD
// ─────────────────────────────────────────────────────────────

const TYPE_CONFIG = {
  payment:  { icon: CreditCard,   color:'text-emerald-500', bg:'bg-emerald-50 dark:bg-emerald-500/10' },
  booking:  { icon: Calendar,     color:'text-blue-500',    bg:'bg-blue-50 dark:bg-blue-500/10'       },
  message:  { icon: MessageSquare,color:'text-purple-500',  bg:'bg-purple-50 dark:bg-purple-500/10'   },
  save:     { icon: Heart,        color:'text-red-500',     bg:'bg-red-50 dark:bg-red-500/10'         },
  view:     { icon: Eye,          color:'text-gray-400',    bg:'bg-gray-50 dark:bg-white/5'           },
  search:   { icon: Search,       color:'text-brand-gold',  bg:'bg-brand-gold/5 dark:bg-brand-gold/10'},
};

const STATUS_CONFIG = {
  completed:  { label:'Completed',  color:'text-emerald-500 bg-emerald-50 dark:bg-emerald-500/10' },
  in_escrow:  { label:'In Escrow',  color:'text-amber-500 bg-amber-50 dark:bg-amber-500/10'       },
  cancelled:  { label:'Cancelled',  color:'text-red-500 bg-red-50 dark:bg-red-500/10'             },
  pending:    { label:'Pending',    color:'text-blue-500 bg-blue-50 dark:bg-blue-500/10'          },
};

function ActivityCard({ activity }) {
  const { symbol } = useCurrency();
  const cfg = TYPE_CONFIG[activity.type] || TYPE_CONFIG.view;
  const { icon: Icon } = cfg;

  return (
    <div className="flex items-start gap-4 p-4 transition-all bg-white border border-gray-100 dark:bg-brand-charcoal-dark rounded-2xl dark:border-white/10 hover:border-brand-gold/40 hover:shadow-sm group">
      {/* Icon */}
      <div className={`w-10 h-10 rounded-2xl ${cfg.bg} flex items-center justify-center shrink-0`}>
        <Icon size={18} className={cfg.color} />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-bold text-brand-charcoal-dark dark:text-white mb-0.5">
          {activity.action}
        </p>

        {/* Item details */}
        {activity.item && (
          <p className="mb-1 text-sm text-gray-500 truncate dark:text-white/60">
            {activity.item.title}
          </p>
        )}

        {/* Query details */}
        {activity.query && (
          <p className="mb-1 text-sm text-gray-500 dark:text-white/60">
            "{activity.query}"
            {activity.results !== undefined && (
              <span className="ml-2 text-xs text-gray-400">({activity.results} results)</span>
            )}
            {activity.alertOn && (
              <span className="inline-flex items-center gap-0.5 ml-2 px-1.5 py-0.5 bg-brand-gold/10 rounded-full text-[10px] font-bold text-brand-gold">
                🔔 Alert ON
              </span>
            )}
          </p>
        )}

        {/* Meta row */}
        <div className="flex flex-wrap items-center gap-3">
          <span className="text-xs text-gray-400">
            {formatDistanceToNow(new Date(activity.date), { addSuffix: true })}
          </span>

          {activity.amount !== undefined && (
            <span className="text-xs font-bold text-brand-charcoal-dark dark:text-white">
              {symbol}{activity.amount.toLocaleString()}
            </span>
          )}

          {activity.ref && (
            <span className="font-mono text-xs text-gray-400">
              Ref: {activity.ref}
            </span>
          )}

          {activity.status && (
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${STATUS_CONFIG[activity.status]?.color || ''}`}>
              {STATUS_CONFIG[activity.status]?.label || activity.status}
            </span>
          )}

          {activity.unread && (
            <span className="w-2 h-2 rounded-full bg-brand-gold animate-pulse" />
          )}
        </div>
      </div>

      {/* Action */}
      {activity.item && (
        <ChevronRight size={16} className="mt-1 text-gray-300 transition-colors dark:text-white/20 group-hover:text-brand-gold shrink-0" />
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// MAIN PAGE
// ─────────────────────────────────────────────────────────────

export default function History() {
  const [typeFilter,  setTypeFilter]  = useState('all');
  const [timeFilter,  setTimeFilter]  = useState('All Time');
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  const filtered = useMemo(() => {
    let list = [...MOCK_ACTIVITIES];

    // Type filter
    if (typeFilter !== 'all') {
      list = list.filter(a => a.type === typeFilter);
    }

    // Time filter
    const now = Date.now();
    if (timeFilter === 'Today') {
      const startOfDay = new Date().setHours(0, 0, 0, 0);
      list = list.filter(a => a.date >= startOfDay);
    } else if (timeFilter === 'This Week') {
      const weekAgo = now - 7 * 86400_000;
      list = list.filter(a => a.date >= weekAgo);
    } else if (timeFilter === 'This Month') {
      const monthAgo = now - 30 * 86400_000;
      list = list.filter(a => a.date >= monthAgo);
    } else if (timeFilter === 'Last 3 Months') {
      const threeMonthsAgo = now - 90 * 86400_000;
      list = list.filter(a => a.date >= threeMonthsAgo);
    }

    // Search
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(a =>
        a.action.toLowerCase().includes(q) ||
        a.item?.title.toLowerCase().includes(q) ||
        a.query?.toLowerCase().includes(q)
      );
    }

    return list;
  }, [typeFilter, timeFilter, searchQuery]);

  // Group by date
  const grouped = useMemo(() => {
    const groups = {};
    filtered.forEach(activity => {
      const dateKey = format(new Date(activity.date), 'yyyy-MM-dd');
      if (!groups[dateKey]) groups[dateKey] = [];
      groups[dateKey].push(activity);
    });
    return Object.entries(groups).sort((a, b) => b[0].localeCompare(a[0]));
  }, [filtered]);

  const activeFilters = [
    typeFilter !== 'all',
    timeFilter !== 'All Time',
    !!searchQuery.trim(),
  ].filter(Boolean).length;

  return (
    <div className="max-w-4xl px-4 py-6 pb-24 mx-auto lg:pb-10">

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-extrabold font-display text-brand-charcoal-dark dark:text-white">
            Activity History
          </h1>
          <p className="text-sm text-gray-400 mt-0.5">
            {filtered.length} {filtered.length === 1 ? 'activity' : 'activities'}
          </p>
        </div>
        <button type="button"
          className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl border-2 border-gray-200 dark:border-white/20 text-sm font-bold text-brand-charcoal dark:text-white hover:border-brand-gold transition-colors">
          <Download size={14} />Export
        </button>
      </div>

      {/* Search & filters */}
      <div className="mb-5 space-y-3">
        {/* Search bar */}
        <div className="relative">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
          <input type="search" value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search activity…"
            className="w-full py-3 pl-10 pr-4 text-sm transition-all bg-white border border-gray-100 outline-none rounded-2xl dark:bg-brand-charcoal-dark dark:border-white/10 font-body text-brand-charcoal-dark dark:text-white placeholder:text-gray-400 focus:border-brand-gold"
          />
        </div>

        {/* Filter pills */}
        <div className="flex items-center gap-2 pb-1 overflow-x-auto scrollbar-none">
          {/* Type filter */}
          {ACTIVITY_TYPES.map(type => (
            <button key={type.id} type="button"
              onClick={() => setTypeFilter(type.id)}
              className={[
                'flex items-center gap-1.5 px-4 py-2 rounded-xl border-2 text-xs font-bold whitespace-nowrap transition-all shrink-0',
                typeFilter === type.id
                  ? 'border-brand-gold bg-brand-gold/10 text-brand-charcoal-dark dark:text-white'
                  : 'border-gray-200 dark:border-white/10 bg-white dark:bg-white/5 text-gray-500 dark:text-white/60 hover:border-brand-gold/50',
              ].join(' ')}>
              <type.icon size={13} />
              {type.label}
            </button>
          ))}

          {/* Time filter dropdown */}
          <div className="relative shrink-0">
            <button type="button" onClick={() => setShowFilters(v => !v)}
              className={[
                'flex items-center gap-1.5 px-4 py-2 rounded-xl border-2 text-xs font-bold transition-all',
                timeFilter !== 'All Time'
                  ? 'border-brand-gold bg-brand-gold/10 text-brand-charcoal-dark dark:text-white'
                  : 'border-gray-200 dark:border-white/10 bg-white dark:bg-white/5 text-gray-500 dark:text-white/60 hover:border-brand-gold/50',
              ].join(' ')}>
              <Clock size={13} />
              {timeFilter}
              <ChevronDown size={11} className={`transition-transform ${showFilters ? 'rotate-180' : ''}`} />
            </button>
            {showFilters && (
              <div className="absolute right-0 z-20 mt-1 overflow-hidden bg-white border border-gray-100 shadow-xl top-full w-44 dark:bg-brand-charcoal-dark rounded-2xl dark:border-white/10"
                onMouseLeave={() => setShowFilters(false)}>
                {TIME_FILTERS.map(t => (
                  <button key={t} type="button"
                    onClick={() => { setTimeFilter(t); setShowFilters(false); }}
                    className={`w-full px-4 py-2.5 text-xs font-semibold text-left transition-colors ${timeFilter === t ? 'bg-brand-gold/10 text-brand-gold' : 'text-brand-charcoal dark:text-white hover:bg-brand-gray-soft dark:hover:bg-white/10'}`}>
                    {t}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Activity list */}
      {grouped.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <Clock size={48} className="mb-4 text-gray-200 dark:text-white/10" />
          <p className="mb-2 text-xl font-extrabold font-display text-brand-charcoal-dark dark:text-white">
            No activity found
          </p>
          <p className="mb-5 text-sm text-gray-400">
            {activeFilters > 0 ? 'Try adjusting your filters' : 'Your activity will appear here'}
          </p>
          {activeFilters > 0 && (
            <button type="button"
              onClick={() => { setTypeFilter('all'); setTimeFilter('All Time'); setSearchQuery(''); }}
              className="px-5 py-2.5 bg-brand-gold hover:bg-brand-gold-dark text-white font-bold text-sm rounded-xl transition-colors">
              Clear Filters
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-6">
          {grouped.map(([dateKey, activities]) => (
            <div key={dateKey}>
              {/* Date header */}
              <div className="flex items-center gap-3 mb-3">
                <div className="flex-1 h-px bg-gray-100 dark:bg-white/10" />
                <p className="text-xs font-bold tracking-wider text-gray-400 uppercase">
                  {format(new Date(dateKey), 'EEEE, d MMMM yyyy')}
                </p>
                <div className="flex-1 h-px bg-gray-100 dark:bg-white/10" />
              </div>

              {/* Activities */}
              <div className="space-y-2">
                {activities.map(activity => (
                  <ActivityCard key={activity.id} activity={activity} />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}