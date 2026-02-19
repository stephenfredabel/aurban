import { useState, useCallback }       from 'react';
import { useNavigate, Link }           from 'react-router-dom';
import { useAuth }                     from '../../context/AuthContext.jsx';
import { useCurrency }                 from '../../hooks/useCurrency.js';
import { format, formatDistanceToNow } from 'date-fns';
import {
  Heart, Clock, Search, MapPin,
  Trash2, Bell, BellOff,
  RefreshCw, Star, ShieldCheck,
  ChevronRight, Plus,
  TrendingUp, Eye,
} from 'lucide-react';

// ─────────────────────────────────────────────────────────────
// MOCK DATA
// ─────────────────────────────────────────────────────────────

const MOCK_SAVED = [
  {
    id: 'p_001', title: '3-Bed Flat, Lekki Phase 1', category: 'rental',
    price: 1200000, period: 'yr', location: 'Lekki Phase 1, Lagos',
    bedrooms: 3, bathrooms: 3, verified: true, rating: 4.8,
    savedAt: Date.now() - 2 * 86400_000,
  },
  {
    id: 'p_002', title: 'Land for Sale — Ibeju-Lekki', category: 'land',
    price: 8500000, period: '', location: 'Ibeju-Lekki, Lagos',
    bedrooms: null, bathrooms: null, verified: false, rating: null,
    savedAt: Date.now() - 5 * 86400_000,
  },
  {
    id: 'p_003', title: 'Studio Apartment in Yaba', category: 'rental',
    price: 380000, period: 'yr', location: 'Yaba, Lagos',
    bedrooms: 1, bathrooms: 1, verified: true, rating: 4.5,
    savedAt: Date.now() - 8 * 86400_000,
  },
  {
    id: 'p_004', title: '5-Bed Detached in Abuja', category: 'sale',
    price: 95000000, period: '', location: 'Maitama, Abuja',
    bedrooms: 5, bathrooms: 6, verified: true, rating: 4.9,
    savedAt: Date.now() - 12 * 86400_000,
  },
];

const MOCK_RECENT = [
  {
    id: 'p_005', title: 'Shortlet in V.I, Lagos', category: 'shortlet',
    price: 45000, period: '/night', location: 'Victoria Island, Lagos',
    bedrooms: 2, bathrooms: 2, verified: true,
    viewedAt: Date.now() - 3600_000,
  },
  {
    id: 'p_006', title: '2-Bed Flat in Ikeja GRA', category: 'rental',
    price: 750000, period: 'yr', location: 'Ikeja GRA, Lagos',
    bedrooms: 2, bathrooms: 2, verified: false,
    viewedAt: Date.now() - 7200_000,
  },
  {
    id: 'p_007', title: 'Professional Electrician', category: 'service',
    price: 15000, period: '/job', location: 'Lagos-wide',
    bedrooms: null, bathrooms: null, verified: true,
    viewedAt: Date.now() - 86400_000,
  },
  {
    id: 'p_008', title: 'Mini Flat in Surulere', category: 'rental',
    price: 450000, period: 'yr', location: 'Surulere, Lagos',
    bedrooms: 1, bathrooms: 1, verified: false,
    viewedAt: Date.now() - 2 * 86400_000,
  },
];

const MOCK_SEARCHES = [
  {
    id: 'srch_001',
    label: '3-bed rental · Lekki · Under ₦1.5M',
    query: '/properties?category=rental&bedrooms=3&area=Lekki&maxPrice=1500000',
    alertOn:   true,
    lastAlertAt: Date.now() - 86400_000,
    newMatches:  3,
    createdAt: Date.now() - 7 * 86400_000,
  },
  {
    id: 'srch_002',
    label: 'Land for sale · Ibeju-Lekki',
    query: '/properties?category=land&area=Ibeju-Lekki',
    alertOn:   false,
    lastAlertAt: null,
    newMatches:  0,
    createdAt: Date.now() - 14 * 86400_000,
  },
  {
    id: 'srch_003',
    label: 'Shortlet · Victoria Island · Under ₦60K/night',
    query: '/properties?category=shortlet&area=Victoria+Island&maxPrice=60000',
    alertOn:   true,
    lastAlertAt: Date.now() - 3 * 86400_000,
    newMatches:  1,
    createdAt: Date.now() - 20 * 86400_000,
  },
];

const USER_STATS = {
  totalSaved:    MOCK_SAVED.length,
  recentViews:   MOCK_RECENT.length,
  savedSearches: MOCK_SEARCHES.length,
  daysActive:    42,
};

// ─────────────────────────────────────────────────────────────
// SHARED HELPERS
// ─────────────────────────────────────────────────────────────

const CATEGORY_EMOJI = {
  rental: '🔑', shortlet: '🌙', lease: '📋',
  sale: '🏷️', land: '🌍', shared: '🤝', service: '🔧',
};

const CATEGORY_LABEL = {
  rental: 'For Rent', shortlet: 'Shortlet', lease: 'Lease',
  sale: 'For Sale', land: 'Land', shared: 'Shared', service: 'Service',
};

const TAG_COLORS = {
  rental:   'bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-300',
  shortlet: 'bg-purple-100 dark:bg-purple-500/20 text-purple-700 dark:text-purple-300',
  sale:     'bg-blue-100 dark:bg-blue-500/20 text-blue-700 dark:text-blue-300',
  land:     'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300',
  service:  'bg-gray-100 dark:bg-white/10 text-gray-500 dark:text-white/50',
  default:  'bg-gray-100 dark:bg-white/10 text-gray-500 dark:text-white/50',
};

function ListingCard({ listing, onRemove, removeLabel = 'Remove', timeLabel, timeValue }) {
  const { symbol } = useCurrency();
  return (
    <div className="overflow-hidden bg-white border border-gray-100 dark:bg-brand-charcoal-dark rounded-2xl dark:border-white/10 group">
      {/* Photo / emoji placeholder */}
      <div className="aspect-[4/3] bg-brand-gray-soft dark:bg-white/5 flex items-center justify-center text-4xl relative">
        {CATEGORY_EMOJI[listing.category] || '🏠'}
        {listing.verified && (
          <div className="absolute top-2 right-2 flex items-center gap-1 px-2 py-0.5 bg-white/90 dark:bg-brand-charcoal-dark/90 rounded-full">
            <ShieldCheck size={10} className="text-emerald-500" />
            <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400">Verified</span>
          </div>
        )}
        <span className={`absolute top-2 left-2 px-2 py-0.5 rounded-full text-[10px] font-bold ${TAG_COLORS[listing.category] || TAG_COLORS.default}`}>
          {CATEGORY_LABEL[listing.category] || listing.category}
        </span>
      </div>

      {/* Info */}
      <div className="p-3.5">
        <p className="mb-1 text-sm font-bold leading-tight truncate text-brand-charcoal-dark dark:text-white">
          {listing.title}
        </p>
        <p className="flex items-center gap-1 mb-2 text-xs text-gray-400 truncate">
          <MapPin size={10} className="shrink-0" />{listing.location}
        </p>
        <div className="flex items-center justify-between">
          <p className="text-base font-extrabold font-display text-brand-charcoal-dark dark:text-white">
            {symbol}{listing.price.toLocaleString()}
            {listing.period && <span className="text-xs font-normal text-gray-400 ml-0.5">{listing.period}</span>}
          </p>
          {listing.rating && (
            <span className="flex items-center gap-1 text-xs font-semibold text-amber-500">
              <Star size={10} fill="currentColor" />{listing.rating}
            </span>
          )}
        </div>
        {listing.bedrooms && (
          <p className="mt-1 text-xs text-gray-400">{listing.bedrooms} bed · {listing.bathrooms} bath</p>
        )}

        {/* Time info */}
        <p className="text-[11px] text-gray-400 mt-1.5 flex items-center gap-1">
          <Clock size={9} />
          {timeLabel} {formatDistanceToNow(timeValue, { addSuffix: true })}
        </p>

        {/* Actions */}
        <div className="flex gap-2 mt-3">
          <Link to={`/listing/${listing.id}`}
            className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl bg-brand-gray-soft dark:bg-white/10 text-xs font-bold text-brand-charcoal dark:text-white hover:bg-gray-200 dark:hover:bg-white/20 transition-colors">
            <Eye size={11} /> View
          </Link>
          <button type="button" onClick={() => onRemove(listing.id)}
            className="flex items-center gap-1.5 py-2 px-3 rounded-xl text-xs font-bold text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors">
            <Trash2 size={11} /> {removeLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// TAB: SAVED
// ─────────────────────────────────────────────────────────────

function SavedTab() {
  const navigate = useNavigate();
  const [saved, setSaved] = useState(MOCK_SAVED);

  const remove = useCallback((id) => setSaved(s => s.filter(item => item.id !== id)), []);

  if (saved.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="flex items-center justify-center w-16 h-16 mx-auto mb-4 bg-red-50 dark:bg-red-500/10 rounded-3xl">
          <Heart size={28} className="text-red-300" />
        </div>
        <p className="mb-1 font-bold text-brand-charcoal-dark dark:text-white">No saved listings</p>
        <p className="mb-5 text-sm text-gray-400">Tap the heart icon on any listing to save it here.</p>
        <button type="button" onClick={() => navigate('/properties')} className="btn-primary">
          Browse Properties
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold text-gray-400">{saved.length} saved listing{saved.length !== 1 ? 's' : ''}</p>
        <button type="button" onClick={() => setSaved([])}
          className="text-xs font-bold text-red-400 transition-colors hover:text-red-500">
          Clear all
        </button>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {saved.map(item => (
          <ListingCard
            key={item.id}
            listing={item}
            onRemove={remove}
            removeLabel="Unsave"
            timeLabel="Saved"
            timeValue={item.savedAt}
          />
        ))}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// TAB: RECENTLY VIEWED
// ─────────────────────────────────────────────────────────────

function RecentTab() {
  const navigate = useNavigate();
  const [recent, setRecent] = useState(MOCK_RECENT);

  const remove = useCallback((id) => setRecent(r => r.filter(item => item.id !== id)), []);

  if (recent.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="flex items-center justify-center w-16 h-16 mx-auto mb-4 bg-gray-50 dark:bg-white/5 rounded-3xl">
          <Clock size={28} className="text-gray-300" />
        </div>
        <p className="mb-1 font-bold text-brand-charcoal-dark dark:text-white">No recent views</p>
        <p className="mb-5 text-sm text-gray-400">Listings you view will appear here for quick access.</p>
        <button type="button" onClick={() => navigate('/properties')} className="btn-primary">
          Start Browsing
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold text-gray-400">{recent.length} recently viewed</p>
        <button type="button" onClick={() => setRecent([])}
          className="text-xs font-bold text-gray-400 transition-colors hover:text-red-500">
          Clear history
        </button>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {recent.map(item => (
          <ListingCard
            key={item.id}
            listing={item}
            onRemove={remove}
            removeLabel="Remove"
            timeLabel="Viewed"
            timeValue={item.viewedAt}
          />
        ))}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// TAB: SAVED SEARCHES
// ─────────────────────────────────────────────────────────────

function SearchesTab() {
  const navigate = useNavigate();
  const [searches, setSearches] = useState(MOCK_SEARCHES);

  const toggleAlert = useCallback((id) => {
    setSearches(s => s.map(srch => srch.id === id ? { ...srch, alertOn: !srch.alertOn } : srch));
  }, []);

  const remove = useCallback((id) => {
    setSearches(s => s.filter(srch => srch.id !== id));
  }, []);

  if (searches.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="flex items-center justify-center w-16 h-16 mx-auto mb-4 bg-brand-gray-soft dark:bg-white/5 rounded-3xl">
          <Search size={28} className="text-gray-300" />
        </div>
        <p className="mb-1 font-bold text-brand-charcoal-dark dark:text-white">No saved searches</p>
        <p className="mb-5 text-sm text-gray-400">Save a search to get email alerts when new matching listings are posted.</p>
        <button type="button" onClick={() => navigate('/properties')} className="btn-primary">
          Search Properties
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <p className="text-xs font-semibold text-gray-400">{searches.length} saved search{searches.length !== 1 ? 'es' : ''}</p>

      {searches.map(srch => (
        <div key={srch.id}
          className="p-4 bg-white border border-gray-100 dark:bg-brand-charcoal-dark rounded-2xl dark:border-white/10">
          <div className="flex items-start gap-3">
            <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-brand-gold/10 shrink-0">
              <Search size={15} className="text-brand-gold" />
            </div>

            <div className="flex-1 min-w-0">
              <p className="mb-1 text-sm font-bold leading-tight text-brand-charcoal-dark dark:text-white">
                {srch.label}
              </p>
              <div className="flex flex-wrap items-center gap-3">
                <span className="text-xs text-gray-400">
                  Saved {format(new Date(srch.createdAt), 'd MMM yyyy')}
                </span>
                {srch.newMatches > 0 && (
                  <span className="flex items-center gap-1 px-2 py-0.5 bg-brand-gold/10 rounded-full text-[11px] font-bold text-brand-gold">
                    <TrendingUp size={9} />
                    {srch.newMatches} new match{srch.newMatches !== 1 ? 'es' : ''}
                  </span>
                )}
                {srch.alertOn && srch.lastAlertAt && (
                  <span className="text-[11px] text-gray-400">
                    Last alert {formatDistanceToNow(srch.lastAlertAt, { addSuffix: true })}
                  </span>
                )}
              </div>
            </div>

            {/* Alert toggle */}
            <button
              type="button"
              onClick={() => toggleAlert(srch.id)}
              aria-label={srch.alertOn ? 'Disable alert' : 'Enable alert'}
              aria-pressed={srch.alertOn}
              className={[
                'w-8 h-8 rounded-xl flex items-center justify-center transition-colors shrink-0',
                srch.alertOn
                  ? 'bg-brand-gold/10 text-brand-gold hover:bg-brand-gold/20'
                  : 'bg-gray-100 dark:bg-white/10 text-gray-400 hover:bg-gray-200 dark:hover:bg-white/20',
              ].join(' ')}>
              {srch.alertOn ? <Bell size={15} /> : <BellOff size={15} />}
            </button>
          </div>

          {/* Action row */}
          <div className="flex items-center gap-2 pt-3 mt-3 border-t border-gray-50 dark:border-white/5">
            <button type="button"
              onClick={() => navigate(srch.query)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-brand-gray-soft dark:bg-white/10 text-xs font-bold text-brand-charcoal dark:text-white hover:bg-gray-200 dark:hover:bg-white/20 transition-colors">
              <RefreshCw size={11} /> Run search
            </button>
            <span className="flex-1 text-xs text-gray-400">
              {srch.alertOn ? '🔔 Email alerts on' : '🔕 Alerts off'}
            </span>
            <button type="button" onClick={() => remove(srch.id)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors">
              <Trash2 size={11} /> Delete
            </button>
          </div>
        </div>
      ))}

      {/* Alert info */}
      <div className="flex items-start gap-2.5 p-3.5 bg-blue-50 dark:bg-blue-500/10 rounded-2xl border border-blue-100 dark:border-blue-500/20">
        <Bell size={14} className="text-blue-500 mt-0.5 shrink-0" />
        <p className="text-xs leading-relaxed text-blue-700 dark:text-blue-300">
          When alerts are on, we'll email you as soon as new listings matching your search are posted. Manage email preferences in <Link to="/dashboard/settings" className="font-bold underline">Settings</Link>.
        </p>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// MAIN EXPORT
// ─────────────────────────────────────────────────────────────

const TABS = [
  { id: 'saved',    label: 'Saved',    icon: Heart,  badge: USER_STATS.totalSaved    },
  { id: 'recent',   label: 'Recent',   icon: Clock,  badge: USER_STATS.recentViews   },
  { id: 'searches', label: 'Searches', icon: Search, badge: USER_STATS.savedSearches },
];

export default function UserDashboard() {
  const { user }      = useAuth();
  useNavigate();
  const [activeTab, setActiveTab] = useState('saved');

  const displayName = user?.name?.split(' ')?.[0] || 'there';

  return (
    <div className="max-w-4xl px-4 py-6 pb-24 mx-auto lg:pb-10">

      {/* Page header */}
      <div className="mb-6">
        <h1 className="text-2xl font-extrabold font-display text-brand-charcoal-dark dark:text-white">
          Welcome, {displayName}
        </h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
          Your saved listings, recently viewed, and search alerts.
        </p>
      </div>

      {/* Stats strip */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        {[
          { label: 'Saved',    value: USER_STATS.totalSaved,    color: 'text-red-400'         },
          { label: 'Viewed',   value: USER_STATS.recentViews,   color: 'text-brand-charcoal dark:text-white/70' },
          { label: 'Searches', value: USER_STATS.savedSearches, color: 'text-brand-gold'       },
        ].map(({ label, value, color }) => (
          <div key={label}
            className="p-4 text-center bg-white border border-gray-100 dark:bg-brand-charcoal-dark rounded-2xl dark:border-white/10">
            <p className={`font-display font-extrabold text-2xl ${color}`}>{value}</p>
            <p className="text-xs text-gray-400 dark:text-white/40 mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      {/* Tab navigation */}
      <div className="flex gap-1 p-1 mb-6 bg-brand-gray-soft dark:bg-white/5 rounded-2xl">
        {TABS.map(({ id, label, icon: Icon, badge }) => (
          <button key={id} type="button" onClick={() => setActiveTab(id)}
            className={[
              'flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition-all flex-1 justify-center',
              activeTab === id
                ? 'bg-white dark:bg-brand-charcoal-dark text-brand-charcoal-dark dark:text-white shadow-sm'
                : 'text-gray-400 dark:text-white/40 hover:text-brand-charcoal dark:hover:text-white/60',
            ].join(' ')}>
            <Icon size={15} />
            <span>{label}</span>
            {badge > 0 && (
              <span className={`min-w-[18px] h-[18px] px-1 rounded-full flex items-center justify-center text-[10px] font-bold ${activeTab === id ? 'bg-brand-gold text-white' : 'bg-gray-200 dark:bg-white/20 text-gray-500 dark:text-white/50'}`}>
                {badge}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {activeTab === 'saved'    && <SavedTab    />}
      {activeTab === 'recent'   && <RecentTab   />}
      {activeTab === 'searches' && <SearchesTab />}

    </div>
  );
}