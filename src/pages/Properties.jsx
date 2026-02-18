import { useState, useEffect, useCallback, useMemo } from 'react';
import { useSearchParams, Link, useNavigate }         from 'react-router-dom';
import PageSEO from '../components/seo/PageSEO.jsx';
import {
  SlidersHorizontal, Map, Grid3X3, Bell, BellOff,
  Search, X, ChevronDown, ShieldCheck, MapPin,
  Star, Heart, ArrowUpDown, SortAsc, Filter,
  ChevronLeft, ChevronRight,
} from 'lucide-react';
import { useCurrency }   from '../hooks/useCurrency.js';
import { useAuth }       from '../context/AuthContext.jsx';
import PropertyCard      from '../components/PropertyCard.jsx';
import PropertyMap       from '../components/PropertyMap.jsx';

// ─────────────────────────────────────────────────────────────
// CONSTANTS
// ─────────────────────────────────────────────────────────────

const CATEGORIES = [
  { id: 'all',      label: 'All',          emoji: '🏘️' },
  { id: 'rental',   label: 'For Rent',     emoji: '🔑' },
  { id: 'shortlet', label: 'Shortlet',     emoji: '🌙' },
  { id: 'sale',     label: 'For Sale',     emoji: '🏷️' },
  { id: 'lease',    label: 'Lease',        emoji: '📋' },
  { id: 'land',     label: 'Land',         emoji: '🌍' },
  { id: 'shared',   label: 'Shared',       emoji: '🤝' },
];

const SUBCATEGORIES = {
  rental:   ['3 Bedroom Flat', 'Mini Flat', 'Duplex', 'Self-Contained', 'Room & Parlour', 'Shared Apartment'],
  sale:     ['Fully Detached Duplex', 'Semi-Detached Duplex', 'Terrace', 'Bungalow', 'Mansion', 'Penthouse'],
  shortlet: ['Studio', '1 Bedroom', '2 Bedroom', 'Luxury Suite', 'Entire Home'],
  lease:    ['Office Space', 'Shop', 'Warehouse', 'Event Centre', 'Co-working Space'],
  land:     ['Residential', 'Commercial', 'Industrial', 'Agricultural', 'Mixed-Use'],
  shared:   ['Male Only', 'Female Only', 'Mixed', 'Couple Friendly'],
};

const SORT_OPTIONS = [
  { value: 'newest',     label: 'Newest First'      },
  { value: 'price_asc',  label: 'Price: Low → High' },
  { value: 'price_desc', label: 'Price: High → Low' },
  { value: 'popular',    label: 'Most Viewed'       },
  { value: 'verified',   label: 'Verified First'    },
];

const BEDROOM_OPTIONS   = ['Any', '1', '2', '3', '4', '5+'];
const BATHROOM_OPTIONS  = ['Any', '1', '2', '3', '4+'];
const FURNISHING_OPTIONS = ['Any', 'Unfurnished', 'Semi-Furnished', 'Furnished', 'Serviced'];

const NIGERIA_STATES = [
  'All States','Abia','Adamawa','Akwa Ibom','Anambra','Bauchi','Bayelsa','Benue',
  'Borno','Cross River','Delta','Ebonyi','Edo','Ekiti','Enugu','FCT','Gombe',
  'Imo','Jigawa','Kaduna','Kano','Katsina','Kebbi','Kogi','Kwara','Lagos',
  'Nasarawa','Niger','Ogun','Ondo','Osun','Oyo','Plateau','Rivers','Sokoto',
  'Taraba','Yobe','Zamfara',
];

// ─────────────────────────────────────────────────────────────
// MOCK LISTINGS  (replace with API call)
// ─────────────────────────────────────────────────────────────

const MOCK_PROPERTIES = Array.from({ length: 24 }, (_, i) => ({
  id:          `prop_${i + 1}`,
  title:       [
    '3-Bedroom Flat in Lekki Phase 1', '2-Bed Apartment, Ikeja GRA',
    'Studio in Yaba', '4-Bed Duplex, Maitama Abuja', 'Mini Flat, Surulere',
    'Land for Sale — Ibeju-Lekki', 'Shortlet in Victoria Island',
    '5-Bed Mansion, Banana Island', 'Self-Con in Ajah',
    '2-Bed Terrace, Gwarinpa',
  ][i % 10],
  category:    CATEGORIES.slice(1)[i % (CATEGORIES.length - 1)].id,
  price:       [380000, 750000, 450000, 1200000, 8500000, 45000, 95000000, 280000, 650000, 2800000][i % 10],
  period:      ['yr', 'yr', 'yr', 'yr', '', '/night', '', 'yr', 'yr', 'yr'][i % 10],
  location:    ['Lekki Phase 1, Lagos', 'Ikeja GRA, Lagos', 'Yaba, Lagos', 'Maitama, Abuja', 'Ibeju-Lekki, Lagos'][i % 5],
  state:       ['Lagos', 'Lagos', 'Lagos', 'Abuja', 'Lagos'][i % 5],
  bedrooms:    [3, 2, 1, 4, null, 2, 5, 1, 2, null][i % 10],
  bathrooms:   [3, 2, 1, 4, null, 2, 5, 1, 2, null][i % 10],
  furnishing:  ['Furnished', 'Unfurnished', 'Semi-Furnished', 'Serviced', 'Unfurnished'][i % 5],
  verified:    i % 3 !== 0,
  rating:      +(3.8 + (i % 12) * 0.1).toFixed(1),
  reviewCount: 2 + (i % 20),
  views:       50 + i * 13,
  saved:       false,
  createdAt:   Date.now() - i * 86400_000 * 2,
  lat:         6.43 + (i % 7) * 0.03,
  lng:         3.40 + (i % 6) * 0.04,
  promoted:    i % 7 === 0,
}));

const PER_PAGE = 12;

// ─────────────────────────────────────────────────────────────
// FILTER DRAWER
// ─────────────────────────────────────────────────────────────

function FilterDrawer({ filters, onChange, onClose, onClear }) {
  const { symbol } = useCurrency();
  const [local, setLocal] = useState(filters);
  const set = (k, v) => setLocal(f => ({ ...f, [k]: v }));

  const apply = () => { onChange(local); onClose(); };
  const clear  = () => { setLocal({ category:'all', subcategory:'', bedrooms:'Any', bathrooms:'Any', minPrice:'', maxPrice:'', state:'All States', furnishing:'Any', verified:false }); };

  return (
    <div className="fixed inset-0 z-50 flex">
      {/* Backdrop */}
      <button type="button" className="flex-1 bg-black/40 backdrop-blur-sm" onClick={onClose} aria-label="Close filters" />

      {/* Panel */}
      <div className="flex flex-col w-full h-full max-w-sm overflow-y-auto bg-white shadow-2xl dark:bg-brand-charcoal-dark">
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between px-5 py-4 bg-white border-b border-gray-100 dark:border-white/10 dark:bg-brand-charcoal-dark">
          <h2 className="text-lg font-extrabold font-display text-brand-charcoal-dark dark:text-white">Filters</h2>
          <button type="button" onClick={onClose} className="flex items-center justify-center w-8 h-8 transition-colors rounded-xl hover:bg-brand-gray-soft dark:hover:bg-white/10">
            <X size={16} className="text-brand-charcoal dark:text-white" />
          </button>
        </div>

        <div className="flex-1 px-5 py-5 space-y-6">

          {/* State */}
          <div>
            <label className="mb-2 label-sm">State</label>
            <select value={local.state} onChange={e => set('state', e.target.value)} className="input-field">
              {NIGERIA_STATES.map(s => <option key={s}>{s}</option>)}
            </select>
          </div>

          {/* Price range */}
          <div>
            <label className="mb-2 label-sm">Price Range ({symbol})</label>
            <div className="grid grid-cols-2 gap-3">
              <div className="relative">
                <span className="absolute text-xs text-gray-400 -translate-y-1/2 pointer-events-none left-3 top-1/2">{symbol}</span>
                <input type="number" inputMode="numeric" placeholder="Min"
                  value={local.minPrice} onChange={e => set('minPrice', e.target.value)}
                  className="text-sm input-field pl-7" />
              </div>
              <div className="relative">
                <span className="absolute text-xs text-gray-400 -translate-y-1/2 pointer-events-none left-3 top-1/2">{symbol}</span>
                <input type="number" inputMode="numeric" placeholder="Max"
                  value={local.maxPrice} onChange={e => set('maxPrice', e.target.value)}
                  className="text-sm input-field pl-7" />
              </div>
            </div>
          </div>

          {/* Bedrooms */}
          <div>
            <label className="mb-2 label-sm">Bedrooms</label>
            <div className="flex flex-wrap gap-2">
              {BEDROOM_OPTIONS.map(b => (
                <button key={b} type="button" onClick={() => set('bedrooms', b)}
                  className={`px-3 py-1.5 rounded-xl border-2 text-sm font-bold transition-all ${local.bedrooms === b ? 'border-brand-gold bg-brand-gold/10 text-brand-charcoal-dark dark:text-white' : 'border-gray-200 dark:border-white/10 bg-white dark:bg-white/5 text-gray-500 dark:text-white/60'}`}>
                  {b}
                </button>
              ))}
            </div>
          </div>

          {/* Bathrooms */}
          <div>
            <label className="mb-2 label-sm">Bathrooms</label>
            <div className="flex flex-wrap gap-2">
              {BATHROOM_OPTIONS.map(b => (
                <button key={b} type="button" onClick={() => set('bathrooms', b)}
                  className={`px-3 py-1.5 rounded-xl border-2 text-sm font-bold transition-all ${local.bathrooms === b ? 'border-brand-gold bg-brand-gold/10 text-brand-charcoal-dark dark:text-white' : 'border-gray-200 dark:border-white/10 bg-white dark:bg-white/5 text-gray-500 dark:text-white/60'}`}>
                  {b}
                </button>
              ))}
            </div>
          </div>

          {/* Furnishing */}
          <div>
            <label className="mb-2 label-sm">Furnishing</label>
            <div className="flex flex-wrap gap-2">
              {FURNISHING_OPTIONS.map(f => (
                <button key={f} type="button" onClick={() => set('furnishing', f)}
                  className={`px-3 py-1.5 rounded-xl border-2 text-sm font-bold transition-all ${local.furnishing === f ? 'border-brand-gold bg-brand-gold/10 text-brand-charcoal-dark dark:text-white' : 'border-gray-200 dark:border-white/10 bg-white dark:bg-white/5 text-gray-500 dark:text-white/60'}`}>
                  {f}
                </button>
              ))}
            </div>
          </div>

          {/* Verified only */}
          <div className="flex items-center gap-3 p-4 bg-brand-gray-soft dark:bg-white/5 rounded-2xl">
            <input type="checkbox" id="verified-only" checked={local.verified}
              onChange={e => set('verified', e.target.checked)}
              className="w-4 h-4 accent-brand-gold" />
            <label htmlFor="verified-only" className="flex items-center gap-2 text-sm font-semibold cursor-pointer text-brand-charcoal-dark dark:text-white">
              <ShieldCheck size={15} className="text-emerald-500" />
              Verified listings only
            </label>
          </div>
        </div>

        {/* Footer */}
        <div className="flex gap-3 px-5 py-4 border-t border-gray-100 dark:border-white/10">
          <button type="button" onClick={clear}
            className="flex-none px-5 py-3 text-sm font-bold transition-colors border-2 border-gray-200 rounded-xl dark:border-white/20 text-brand-charcoal dark:text-white hover:border-gray-300">
            Clear
          </button>
          <button type="button" onClick={apply}
            className="flex-1 py-3 text-sm font-bold text-white transition-colors rounded-xl bg-brand-gold hover:bg-brand-gold-dark">
            Show Results
          </button>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// SAVE SEARCH TOAST
// ─────────────────────────────────────────────────────────────

function SaveSearchBanner({ label, onSave, onDismiss }) {
  return (
    <div className="flex items-center gap-3 p-3 border border-blue-100 bg-blue-50 dark:bg-blue-500/10 rounded-2xl dark:border-blue-500/20">
      <Bell size={15} className="text-blue-500 shrink-0" />
      <p className="flex-1 text-xs leading-relaxed text-blue-700 dark:text-blue-300">
        Get notified when new <strong>{label}</strong> listings are posted.
      </p>
      <button type="button" onClick={onSave}
        className="px-3 py-1.5 bg-blue-500 hover:bg-blue-600 text-white text-xs font-bold rounded-xl transition-colors shrink-0">
        Save Search
      </button>
      <button type="button" onClick={onDismiss} className="text-blue-400 hover:text-blue-600 shrink-0">
        <X size={13} />
      </button>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// MAIN PAGE
// ─────────────────────────────────────────────────────────────

export default function Properties() {
  const { symbol }      = useCurrency();
  const { user }        = useAuth();
  const [params, setParams] = useSearchParams();
  const navigate        = useNavigate();

  // ── View & UI state ───────────────────────────────────────
  const [viewMode,      setViewMode]      = useState('grid');    // 'grid' | 'map'
  const [showFilters,   setShowFilters]   = useState(false);
  const [showSaveBanner,setShowSaveBanner]= useState(false);
  const [searchSaved,   setSearchSaved]   = useState(false);
  const [savedIds,      setSavedIds]      = useState(new Set());
  const [page,          setPage]          = useState(1);
  const [sortBy,        setSortBy]        = useState(params.get('sort') || 'newest');
  const [showSort,      setShowSort]      = useState(false);

  // ── Filter state (from URL params) ───────────────────────
  const [filters, setFilters] = useState({
    category:    params.get('category') || 'all',
    subcategory: params.get('subcategory') || '',
    bedrooms:    params.get('bedrooms') || 'Any',
    bathrooms:   params.get('bathrooms') || 'Any',
    minPrice:    params.get('minPrice') || '',
    maxPrice:    params.get('maxPrice') || '',
    state:       params.get('state') || 'All States',
    furnishing:  params.get('furnishing') || 'Any',
    verified:    params.get('verified') === 'true',
  });

  const [keyword, setKeyword] = useState(params.get('q') || '');

  // Show save-search banner after filters applied
  useEffect(() => {
    const hasFilter = filters.state !== 'All States' || filters.minPrice || filters.maxPrice ||
      filters.bedrooms !== 'Any' || filters.verified;
    if (hasFilter && !searchSaved) setShowSaveBanner(true);
    else setShowSaveBanner(false);
  }, [filters, searchSaved]);

  // Sync URL params
  useEffect(() => {
    const p = new URLSearchParams();
    if (filters.category !== 'all')   p.set('category',  filters.category);
    if (filters.subcategory)          p.set('subcategory', filters.subcategory);
    if (keyword)                       p.set('q',         keyword);
    if (filters.state !== 'All States') p.set('state',    filters.state);
    if (filters.bedrooms !== 'Any')    p.set('bedrooms',  filters.bedrooms);
    if (filters.bathrooms !== 'Any')   p.set('bathrooms', filters.bathrooms);
    if (filters.minPrice)              p.set('minPrice',  filters.minPrice);
    if (filters.maxPrice)              p.set('maxPrice',  filters.maxPrice);
    if (filters.furnishing !== 'Any')  p.set('furnishing',filters.furnishing);
    if (filters.verified)              p.set('verified',  'true');
    if (sortBy !== 'newest')           p.set('sort',      sortBy);
    setParams(p, { replace: true });
  }, [filters, keyword, sortBy]);

  // ── Filter + sort logic ───────────────────────────────────
  const filtered = useMemo(() => {
    let list = [...MOCK_PROPERTIES];

    if (filters.category !== 'all')
      list = list.filter(p => p.category === filters.category);

    if (filters.subcategory)
      list = list.filter(p =>
        (p.type || '').toLowerCase().includes(filters.subcategory.toLowerCase()) ||
        (p.title || '').toLowerCase().includes(filters.subcategory.toLowerCase())
      );

    if (keyword.trim())
      list = list.filter(p =>
        p.title.toLowerCase().includes(keyword.toLowerCase()) ||
        p.location.toLowerCase().includes(keyword.toLowerCase())
      );

    if (filters.state !== 'All States')
      list = list.filter(p => p.state === filters.state);

    if (filters.bedrooms !== 'Any')
      list = list.filter(p => {
        if (filters.bedrooms === '5+') return (p.bedrooms || 0) >= 5;
        return p.bedrooms === Number(filters.bedrooms);
      });

    if (filters.bathrooms !== 'Any')
      list = list.filter(p => {
        if (filters.bathrooms === '4+') return (p.bathrooms || 0) >= 4;
        return p.bathrooms === Number(filters.bathrooms);
      });

    if (filters.minPrice)
      list = list.filter(p => p.price >= Number(filters.minPrice));

    if (filters.maxPrice)
      list = list.filter(p => p.price <= Number(filters.maxPrice));

    if (filters.furnishing !== 'Any')
      list = list.filter(p => p.furnishing === filters.furnishing);

    if (filters.verified)
      list = list.filter(p => p.verified);

    // Sort
    if (sortBy === 'price_asc')   list.sort((a, b) => a.price - b.price);
    if (sortBy === 'price_desc')  list.sort((a, b) => b.price - a.price);
    if (sortBy === 'popular')     list.sort((a, b) => b.views - a.views);
    if (sortBy === 'newest')      list.sort((a, b) => b.createdAt - a.createdAt);
    if (sortBy === 'verified')    list.sort((a, b) => (b.verified ? 1 : 0) - (a.verified ? 1 : 0));

    return list;
  }, [filters, keyword, sortBy]);

  const totalPages = Math.ceil(filtered.length / PER_PAGE);
  const paginated  = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  const toggleSave = useCallback((id) => {
    setSavedIds(s => {
      const next = new Set(s);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }, []);

  const handleFilterChange = (newFilters) => {
    setFilters(newFilters);
    setPage(1);
    setSearchSaved(false);
  };

  const activeFilterCount = [
    filters.category !== 'all',
    filters.bedrooms !== 'Any',
    filters.bathrooms !== 'Any',
    !!filters.minPrice,
    !!filters.maxPrice,
    filters.state !== 'All States',
    filters.furnishing !== 'Any',
    filters.verified,
  ].filter(Boolean).length;

  const categoryLabel = CATEGORIES.find(c => c.id === filters.category)?.label || 'Properties';
  const saveSearchLabel = `${filters.bedrooms !== 'Any' ? filters.bedrooms + '-bed ' : ''}${categoryLabel}${filters.state !== 'All States' ? ' in ' + filters.state : ''}`;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900/30">
      <PageSEO
        title="Property Listings in Nigeria — Rent, Buy & Lease"
        description="Browse thousands of verified properties across Lagos, Abuja, Port Harcourt and Nigeria. Filter by rent, sale, shortlet, shared housing, land and more."
        url="/properties"
      />

      {/* ── Search bar row ─────────────────────────── */}
      <div className="sticky top-0 z-30 px-4 py-3 bg-white border-b border-gray-100 shadow-sm dark:bg-brand-charcoal-dark dark:border-white/10">
        <div className="flex items-center max-w-6xl gap-2 mx-auto">
          {/* Search input */}
          <div className="relative flex-1">
            <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
            <input
              type="search"
              value={keyword}
              onChange={e => { setKeyword(e.target.value); setPage(1); }}
              placeholder="Search properties, areas, landmarks…"
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-brand-gray-soft dark:bg-white/10 text-sm font-body text-brand-charcoal-dark dark:text-white placeholder:text-gray-400 border border-transparent focus:border-brand-gold outline-none transition-all"
            />
          </div>

          {/* Filters button */}
          <button type="button" onClick={() => setShowFilters(true)}
            className={`flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl border-2 text-sm font-bold transition-all shrink-0
              ${activeFilterCount > 0
                ? 'border-brand-gold bg-brand-gold/10 text-brand-charcoal-dark dark:text-white'
                : 'border-gray-200 dark:border-white/20 bg-white dark:bg-white/5 text-brand-charcoal dark:text-white hover:border-gray-300'}`}>
            <Filter size={14} />
            Filters
            {activeFilterCount > 0 && (
              <span className="w-5 h-5 bg-brand-gold text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                {activeFilterCount}
              </span>
            )}
          </button>

          {/* Map/Grid toggle */}
          <div className="flex bg-brand-gray-soft dark:bg-white/10 rounded-xl p-0.5 shrink-0">
            {[
              { id: 'grid', icon: Grid3X3, label: 'Grid view' },
              { id: 'map',  icon: Map,     label: 'Map view'  },
            ].map(({ id, icon: Icon, label }) => (
              <button key={id} type="button" onClick={() => setViewMode(id)}
                aria-label={label}
                className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all ${viewMode === id ? 'bg-white dark:bg-brand-charcoal-dark shadow-sm text-brand-charcoal-dark dark:text-white' : 'text-gray-400 hover:text-brand-charcoal dark:hover:text-white'}`}>
                <Icon size={15} />
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-6xl px-4 py-5 pb-24 mx-auto lg:pb-10">

        {/* Category strip */}
        <div className="flex gap-2 pb-1 mb-3 overflow-x-auto scrollbar-none">
          {CATEGORIES.map(({ id, label, emoji }) => (
            <button key={id} type="button"
              onClick={() => { setFilters(f => ({ ...f, category: id, subcategory: '' })); setPage(1); }}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-xl border-2 text-sm font-bold whitespace-nowrap transition-all shrink-0
                ${filters.category === id
                  ? 'border-brand-gold bg-brand-gold text-white'
                  : 'border-gray-200 dark:border-white/10 bg-white dark:bg-white/5 text-gray-600 dark:text-white/70 hover:border-brand-gold/50'}`}>
              <span>{emoji}</span>
              {label}
            </button>
          ))}
        </div>

        {/* Subcategory chips */}
        {filters.category !== 'all' && SUBCATEGORIES[filters.category] && (
          <div className="flex gap-2 pb-1 mb-5 overflow-x-auto scrollbar-none">
            <button type="button"
              onClick={() => { setFilters(f => ({ ...f, subcategory: '' })); setPage(1); }}
              className={`px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all shrink-0
                ${!filters.subcategory
                  ? 'bg-brand-charcoal-dark text-white dark:bg-white dark:text-brand-charcoal-dark'
                  : 'bg-brand-gray-soft dark:bg-white/10 text-gray-500 dark:text-white/60 hover:bg-gray-200 dark:hover:bg-white/20'}`}>
              All
            </button>
            {SUBCATEGORIES[filters.category].map(sub => (
              <button key={sub} type="button"
                onClick={() => { setFilters(f => ({ ...f, subcategory: f.subcategory === sub ? '' : sub })); setPage(1); }}
                className={`px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all shrink-0
                  ${filters.subcategory === sub
                    ? 'bg-brand-charcoal-dark text-white dark:bg-white dark:text-brand-charcoal-dark'
                    : 'bg-brand-gray-soft dark:bg-white/10 text-gray-500 dark:text-white/60 hover:bg-gray-200 dark:hover:bg-white/20'}`}>
                {sub}
              </button>
            ))}
          </div>
        )}

        {/* Results header */}
        <div className="flex items-center justify-between gap-3 mb-4">
          <div>
            <p className="text-sm font-bold text-brand-charcoal-dark dark:text-white">
              {filtered.length.toLocaleString()} {filtered.length === 1 ? 'listing' : 'listings'}
              {keyword && <span className="font-normal text-gray-400"> for "{keyword}"</span>}
              {filters.state !== 'All States' && <span className="font-normal text-gray-400"> in {filters.state}</span>}
            </p>
          </div>

          {/* Sort */}
          <div className="relative">
            <button type="button" onClick={() => setShowSort(v => !v)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 text-xs font-bold text-brand-charcoal dark:text-white hover:border-gray-300 transition-colors">
              <ArrowUpDown size={12} />
              {SORT_OPTIONS.find(s => s.value === sortBy)?.label}
              <ChevronDown size={12} className={`transition-transform ${showSort ? 'rotate-180' : ''}`} />
            </button>
            {showSort && (
              <div className="absolute right-0 z-20 mt-1 overflow-hidden bg-white border border-gray-100 shadow-xl top-full w-44 dark:bg-brand-charcoal-dark rounded-2xl dark:border-white/10"
                onMouseLeave={() => setShowSort(false)}>
                {SORT_OPTIONS.map(s => (
                  <button key={s.value} type="button"
                    onClick={() => { setSortBy(s.value); setShowSort(false); setPage(1); }}
                    className={`w-full px-4 py-2.5 text-xs font-semibold text-left transition-colors
                      ${sortBy === s.value
                        ? 'bg-brand-gold/10 text-brand-gold'
                        : 'text-brand-charcoal dark:text-white hover:bg-brand-gray-soft dark:hover:bg-white/10'}`}>
                    {s.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Save search banner */}
        {showSaveBanner && !searchSaved && (
          <div className="mb-4">
            <SaveSearchBanner
              label={saveSearchLabel}
              onSave={() => { setSearchSaved(true); setShowSaveBanner(false); }}
              onDismiss={() => setShowSaveBanner(false)}
            />
          </div>
        )}
        {searchSaved && (
          <div className="flex items-center gap-2 p-3 mb-4 border bg-emerald-50 dark:bg-emerald-500/10 rounded-2xl border-emerald-100 dark:border-emerald-500/20">
            <Bell size={14} className="text-emerald-500 shrink-0" />
            <p className="text-xs font-semibold text-emerald-700 dark:text-emerald-300">Search saved — we'll alert you when new matching listings are posted.</p>
          </div>
        )}

        {/* ── Map view ──────────────────────────────── */}
        {viewMode === 'map' && (
          <div className="rounded-2xl overflow-hidden border border-gray-100 dark:border-white/10 mb-6 h-[60vh]">
            <PropertyMap properties={paginated} />
          </div>
        )}

        {/* ── Grid view ─────────────────────────────── */}
        {viewMode === 'grid' && (
          <>
            {paginated.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <p className="mb-4 text-5xl">🏘️</p>
                <p className="mb-2 text-xl font-extrabold font-display text-brand-charcoal-dark dark:text-white">No listings found</p>
                <p className="mb-6 text-sm text-gray-400">Try adjusting your filters or search in a different area.</p>
                <button type="button"
                  onClick={() => { setFilters({ category:'all', subcategory:'', bedrooms:'Any', bathrooms:'Any', minPrice:'', maxPrice:'', state:'All States', furnishing:'Any', verified:false }); setKeyword(''); setPage(1); }}
                  className="btn-primary">
                  Clear All Filters
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {paginated.map(prop => (
                  <div key={prop.id} className="relative group">
                    <Link to={`/property/${prop.id}`}>
                      <PropertyCard property={prop} />
                    </Link>
                    {/* Save button overlay */}
                    <button
                      type="button"
                      onClick={(e) => { e.preventDefault(); toggleSave(prop.id); }}
                      aria-label={savedIds.has(prop.id) ? 'Unsave' : 'Save'}
                      className="absolute z-10 flex items-center justify-center w-8 h-8 transition-all rounded-full shadow-md top-3 right-3 bg-white/90 dark:bg-brand-charcoal-dark/90 hover:scale-110">
                      <Heart size={15}
                        className={savedIds.has(prop.id) ? 'text-red-500 fill-red-500' : 'text-gray-400'} />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-8">
                <button type="button" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                  className="flex items-center justify-center transition-colors border border-gray-200 w-9 h-9 rounded-xl dark:border-white/10 text-brand-charcoal dark:text-white disabled:opacity-30 hover:border-brand-gold">
                  <ChevronLeft size={16} />
                </button>

                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  const pageNum = Math.max(1, Math.min(totalPages - 4, page - 2)) + i;
                  return (
                    <button key={pageNum} type="button" onClick={() => setPage(pageNum)}
                      className={`w-9 h-9 rounded-xl text-sm font-bold transition-all ${page === pageNum ? 'bg-brand-gold text-white' : 'border border-gray-200 dark:border-white/10 text-brand-charcoal dark:text-white hover:border-brand-gold'}`}>
                      {pageNum}
                    </button>
                  );
                })}

                <button type="button" onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
                  className="flex items-center justify-center transition-colors border border-gray-200 w-9 h-9 rounded-xl dark:border-white/10 text-brand-charcoal dark:text-white disabled:opacity-30 hover:border-brand-gold">
                  <ChevronRight size={16} />
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Filter drawer */}
      {showFilters && (
        <FilterDrawer
          filters={filters}
          onChange={handleFilterChange}
          onClose={() => setShowFilters(false)}
        />
      )}
    </div>
  );
}