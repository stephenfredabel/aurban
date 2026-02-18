import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  Heart, X, MapPin, Bed, Bath, Trash2,
  Search, Filter, Grid3X3, List, ExternalLink,
  Share2, Eye, ChevronDown, SlidersHorizontal,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext.jsx';
import { sanitize } from '../../utils/security.js';


/* ════════════════════════════════════════════════════════════
   WISHLIST — Saved properties, services, and products
   
   Data persisted in sessionStorage (keyed per user).
   In production: sync with backend API.
   
   Features:
   • Filter by type (All, Property, Service, Product)
   • Search within saved items
   • Grid / List view toggle
   • Remove individual or clear all
   • Sort by date saved / price / name
════════════════════════════════════════════════════════════ */

const STORAGE_KEY = 'aurban_wishlist';

/* ── Mock saved items (initial state if storage is empty) ── */
const MOCK_WISHLIST = [
  {
    id: 'w1', type: 'property', title: '3 Bedroom Flat in Lekki Phase 1',
    location: 'Lekki, Lagos', price: 2500000, pricePeriod: '/yr',
    bedrooms: 3, bathrooms: 2, image: null, category: 'rental',
    savedAt: '2026-02-12T10:30:00Z', providerName: 'Tunde Properties',
  },
  {
    id: 'w2', type: 'property', title: 'Land for Sale — 500sqm Ibeju-Lekki',
    location: 'Ibeju-Lekki, Lagos', price: 15000000, pricePeriod: '',
    bedrooms: null, bathrooms: null, image: null, category: 'land',
    savedAt: '2026-02-11T14:20:00Z', providerName: 'Lagos Land Hub',
  },
  {
    id: 'w3', type: 'service', title: 'Premium Interior Design',
    location: 'Lagos, Nigeria', price: 150000, pricePeriod: ' starting',
    bedrooms: null, bathrooms: null, image: null, category: 'interior',
    savedAt: '2026-02-10T09:15:00Z', providerName: 'Décor Masters NG',
  },
  {
    id: 'w4', type: 'product', title: 'Dangote 42.5N Cement — 50kg',
    location: 'Nationwide Delivery', price: 5800, pricePeriod: ' /bag',
    bedrooms: null, bathrooms: null, image: null, category: 'cement',
    savedAt: '2026-02-09T16:45:00Z', providerName: 'BuildMart Nigeria',
  },
  {
    id: 'w5', type: 'property', title: 'Luxury 4 Bed Duplex — Banana Island',
    location: 'Banana Island, Lagos', price: 420000000, pricePeriod: '',
    bedrooms: 4, bathrooms: 5, image: null, category: 'buy',
    savedAt: '2026-02-08T11:00:00Z', providerName: 'Elite Realtors',
  },
];

const CATEGORY_EMOJI = {
  rental: '🏠', shortlet: '🏨', buy: '🏡', land: '🗺️', shared: '👥',
  lease: '📋', commercial: '🏢', interior: '🛋️', plumber: '🔧',
  electrician: '⚡', cement: '🧱', furniture: '🪑',
};

const TYPE_LABELS = {
  property: { label: 'Property', color: 'bg-blue-50 dark:bg-blue-500/10 text-blue-600' },
  service:  { label: 'Service',  color: 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600' },
  product:  { label: 'Product',  color: 'bg-purple-50 dark:bg-purple-500/10 text-purple-600' },
};

function formatMoney(n) {
  if (n >= 1000000) return '₦' + (n / 1000000).toFixed(1) + 'M';
  if (n >= 1000) return '₦' + (n / 1000).toFixed(0) + 'K';
  return '₦' + n.toLocaleString();
}

function timeAgo(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString('en-NG', { month: 'short', day: 'numeric' });
}

function loadWishlist() {
  try {
    // Prefer localStorage for cross-session persistence, fall back to sessionStorage
    const stored = localStorage.getItem(STORAGE_KEY) || sessionStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      // Migrate: if it was in sessionStorage only, copy to localStorage
      if (!localStorage.getItem(STORAGE_KEY)) localStorage.setItem(STORAGE_KEY, stored);
      return parsed;
    }
  } catch {}
  return MOCK_WISHLIST;
}

function saveWishlist(items) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  } catch {}
}

export default function Wishlist() {
  const { user } = useAuth();
  const [items, setItems]       = useState(() => loadWishlist());
  const [filter, setFilter]     = useState('all');
  const [search, setSearch]     = useState('');
  const [sortBy, setSortBy]     = useState('date');
  const [viewMode, setViewMode] = useState('grid');
  const [confirmClear, setConfirmClear] = useState(false);

  /* ── Persist on change ──────────────────────────────────── */
  useEffect(() => {
    saveWishlist(items);
  }, [items]);

  /* ── Remove item ────────────────────────────────────────── */
  const removeItem = (id) => {
    setItems((prev) => prev.filter((item) => item.id !== id));
  };

  const clearAll = () => {
    setItems([]);
    setConfirmClear(false);
  };

  /* ── Filtered + sorted items ────────────────────────────── */
  const filtered = useMemo(() => {
    let result = [...items];

    // Type filter
    if (filter !== 'all') {
      result = result.filter((item) => item.type === filter);
    }

    // Search
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter((item) =>
        item.title.toLowerCase().includes(q) ||
        item.location.toLowerCase().includes(q) ||
        item.providerName.toLowerCase().includes(q)
      );
    }

    // Sort
    if (sortBy === 'date') result.sort((a, b) => new Date(b.savedAt) - new Date(a.savedAt));
    if (sortBy === 'price_low') result.sort((a, b) => a.price - b.price);
    if (sortBy === 'price_high') result.sort((a, b) => b.price - a.price);
    if (sortBy === 'name') result.sort((a, b) => a.title.localeCompare(b.title));

    return result;
  }, [items, filter, search, sortBy]);

  /* ── Type counts ────────────────────────────────────────── */
  const counts = {
    all: items.length,
    property: items.filter((i) => i.type === 'property').length,
    service: items.filter((i) => i.type === 'service').length,
    product: items.filter((i) => i.type === 'product').length,
  };

  /* ── Get link for item ──────────────────────────────────── */
  const getItemLink = (item) => {
    if (item.type === 'property') return `/property/${item.id}`;
    if (item.type === 'service') return `/service/${item.id}`;
    if (item.type === 'product') return `/product/${item.id}`;
    return '#';
  };

  return (
      <div className="space-y-5">

        {/* ── Header ──────────────────────────────────────── */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="flex items-center gap-2 text-xl font-bold font-display text-brand-charcoal-dark dark:text-white">
              <Heart size={20} className="text-rose-500" />
              Wishlist
            </h1>
            <p className="text-sm text-gray-400 mt-0.5">{items.length} saved items</p>
          </div>

          {items.length > 0 && (
            <div className="flex items-center gap-2">
              {/* View mode toggle */}
              <div className="flex bg-gray-100 dark:bg-white/5 rounded-lg p-0.5">
                <button onClick={() => setViewMode('grid')}
                  className={`p-1.5 rounded-md transition-colors ${viewMode === 'grid' ? 'bg-white dark:bg-gray-800 shadow-sm' : 'text-gray-400'}`}
                  aria-label="Grid view">
                  <Grid3X3 size={14} />
                </button>
                <button onClick={() => setViewMode('list')}
                  className={`p-1.5 rounded-md transition-colors ${viewMode === 'list' ? 'bg-white dark:bg-gray-800 shadow-sm' : 'text-gray-400'}`}
                  aria-label="List view">
                  <List size={14} />
                </button>
              </div>

              {/* Clear all */}
              {!confirmClear ? (
                <button onClick={() => setConfirmClear(true)}
                  className="text-xs text-red-400 hover:text-red-500 font-medium px-3 py-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors">
                  Clear All
                </button>
              ) : (
                <div className="flex items-center gap-1.5">
                  <span className="text-xs text-red-500">Delete all?</span>
                  <button onClick={clearAll} className="px-2 py-1 text-xs font-bold text-white bg-red-500 rounded-lg hover:bg-red-600">Yes</button>
                  <button onClick={() => setConfirmClear(false)} className="px-2 py-1 text-xs text-gray-400 rounded-lg hover:bg-gray-100 dark:hover:bg-white/5">No</button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* ── Filters + Search ────────────────────────────── */}
        {items.length > 0 && (
          <div className="flex flex-col gap-3 sm:flex-row">
            {/* Type filter pills */}
            <div className="flex gap-1.5 overflow-x-auto scroll-x">
              {[
                { id: 'all', label: 'All' },
                { id: 'property', label: 'Properties' },
                { id: 'service', label: 'Services' },
                { id: 'product', label: 'Products' },
              ].map((f) => (
                <button key={f.id} onClick={() => setFilter(f.id)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium shrink-0 transition-all border
                    ${filter === f.id
                      ? 'border-brand-gold bg-brand-gold/5 dark:bg-brand-gold/10 text-brand-charcoal-dark dark:text-white'
                      : 'border-gray-200 dark:border-white/10 text-gray-400 hover:border-gray-300'
                    }`}>
                  {f.label}
                  <span className={`min-w-[16px] h-[16px] px-1 rounded-full text-[9px] font-bold flex items-center justify-center
                    ${filter === f.id ? 'bg-brand-gold text-white' : 'bg-gray-200 dark:bg-white/10 text-gray-500'}`}>
                    {counts[f.id]}
                  </span>
                </button>
              ))}
            </div>

            {/* Search + Sort */}
            <div className="flex gap-2 sm:ml-auto">
              <div className="relative flex-1 sm:w-48">
                <Search size={14} className="absolute text-gray-400 -translate-y-1/2 left-3 top-1/2" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(sanitize(e.target.value))}
                  placeholder="Search saved..."
                  className="w-full py-2 pr-3 text-xs border border-gray-200 pl-9 bg-gray-50 dark:bg-white/5 dark:border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-gold/30"
                  maxLength={60}
                />
              </div>

              <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}
                className="px-3 py-2 text-xs text-gray-600 border border-gray-200 bg-gray-50 dark:bg-white/5 dark:border-white/10 rounded-xl dark:text-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-gold/30">
                <option value="date">Recently Saved</option>
                <option value="price_low">Price: Low → High</option>
                <option value="price_high">Price: High → Low</option>
                <option value="name">Name A → Z</option>
              </select>
            </div>
          </div>
        )}

        {/* ── Empty state ─────────────────────────────────── */}
        {items.length === 0 && (
          <div className="p-12 text-center bg-white dark:bg-gray-900 rounded-2xl shadow-card">
            <Heart size={48} className="mx-auto mb-4 text-gray-200 dark:text-gray-700" />
            <h2 className="mb-2 text-lg font-bold font-display text-brand-charcoal-dark dark:text-white">
              Your wishlist is empty
            </h2>
            <p className="max-w-sm mx-auto mb-6 text-sm text-gray-400">
              Save properties, services, and products you like by tapping the heart icon. They will appear here for easy access.
            </p>
            <Link to="/properties" className="inline-block text-sm btn-primary">Browse Properties</Link>
          </div>
        )}

        {/* ── No results from filter ──────────────────────── */}
        {items.length > 0 && filtered.length === 0 && (
          <div className="p-8 text-center bg-white dark:bg-gray-900 rounded-2xl shadow-card">
            <Search size={32} className="mx-auto mb-3 text-gray-200 dark:text-gray-700" />
            <p className="text-sm text-gray-500">No saved items match your filter</p>
            <button onClick={() => { setFilter('all'); setSearch(''); }}
              className="mt-3 text-xs font-semibold text-brand-gold hover:underline">
              Clear filters
            </button>
          </div>
        )}

        {/* ── Grid view ───────────────────────────────────── */}
        {filtered.length > 0 && viewMode === 'grid' && (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {filtered.map((item) => (
              <div key={item.id} className="overflow-hidden transition-shadow bg-white dark:bg-gray-900 rounded-2xl shadow-card group hover:shadow-card-hover">
                {/* Image / Placeholder */}
                <div className="relative flex items-center justify-center bg-gray-100 h-36 dark:bg-white/5">
                  {item.image ? (
                    <img src={item.image} alt={item.title} className="object-cover w-full h-full" loading="lazy" />
                  ) : (
                    <span className="text-4xl">{CATEGORY_EMOJI[item.category] || '📋'}</span>
                  )}

                  {/* Type badge */}
                  <span className={`absolute top-2.5 left-2.5 px-2 py-0.5 rounded-lg text-[10px] font-bold ${TYPE_LABELS[item.type]?.color || ''}`}>
                    {TYPE_LABELS[item.type]?.label}
                  </span>

                  {/* Remove button */}
                  <button onClick={() => removeItem(item.id)}
                    className="absolute top-2.5 right-2.5 w-7 h-7 rounded-full bg-white/90 dark:bg-gray-900/90 flex items-center justify-center text-red-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/20 opacity-0 group-hover:opacity-100 transition-all shadow-sm"
                    aria-label="Remove from wishlist">
                    <X size={14} />
                  </button>

                  {/* Saved date */}
                  <span className="absolute bottom-2 right-2.5 text-[9px] bg-black/50 text-white px-1.5 py-0.5 rounded-md">
                    Saved {timeAgo(item.savedAt)}
                  </span>
                </div>

                {/* Details */}
                <div className="p-3.5">
                  <Link to={getItemLink(item)} className="block group/link">
                    <h3 className="text-sm font-semibold truncate transition-colors text-brand-charcoal-dark dark:text-white group-hover/link:text-brand-gold">
                      {item.title}
                    </h3>
                  </Link>

                  <div className="flex items-center gap-1 mt-1 text-xs text-gray-400">
                    <MapPin size={11} />
                    <span className="truncate">{item.location}</span>
                  </div>

                  {/* Specs (property only) */}
                  {item.type === 'property' && item.bedrooms && (
                    <div className="flex items-center gap-3 mt-2 text-xs text-gray-400">
                      <span className="flex items-center gap-1"><Bed size={11} /> {item.bedrooms} Bed</span>
                      {item.bathrooms && <span className="flex items-center gap-1"><Bath size={11} /> {item.bathrooms} Bath</span>}
                    </div>
                  )}

                  {/* Price + provider */}
                  <div className="flex items-center justify-between mt-2.5 pt-2.5 border-t border-gray-50 dark:border-white/5">
                    <span className="text-sm font-bold font-display text-brand-gold">
                      {formatMoney(item.price)}<span className="text-[10px] text-gray-400 font-normal">{item.pricePeriod}</span>
                    </span>
                    <span className="text-[10px] text-gray-400 truncate ml-2">{item.providerName}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ── List view ───────────────────────────────────── */}
        {filtered.length > 0 && viewMode === 'list' && (
          <div className="space-y-2">
            {filtered.map((item) => (
              <div key={item.id} className="bg-white dark:bg-gray-900 rounded-2xl shadow-card p-3.5 flex items-center gap-3 group hover:shadow-card-hover transition-shadow">
                {/* Thumbnail */}
                <div className="flex items-center justify-center overflow-hidden bg-gray-100 w-14 h-14 rounded-xl dark:bg-white/5 shrink-0">
                  {item.image ? (
                    <img src={item.image} alt="" className="object-cover w-14 h-14 rounded-xl" />
                  ) : (
                    <span className="text-2xl">{CATEGORY_EMOJI[item.category] || '📋'}</span>
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${TYPE_LABELS[item.type]?.color || ''}`}>
                      {TYPE_LABELS[item.type]?.label}
                    </span>
                    <span className="text-[10px] text-gray-400">{timeAgo(item.savedAt)}</span>
                  </div>
                  <Link to={getItemLink(item)}>
                    <h3 className="text-sm font-semibold truncate transition-colors text-brand-charcoal-dark dark:text-white hover:text-brand-gold">
                      {item.title}
                    </h3>
                  </Link>
                  <p className="text-[11px] text-gray-400 truncate mt-0.5">{item.location} · {item.providerName}</p>
                </div>

                {/* Price + remove */}
                <div className="text-right shrink-0">
                  <p className="text-sm font-bold font-display text-brand-gold">{formatMoney(item.price)}</p>
                  <button onClick={() => removeItem(item.id)}
                    className="text-[10px] text-red-400 hover:text-red-500 font-medium mt-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    Remove
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
  );
}