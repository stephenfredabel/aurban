import { useState, useMemo }   from 'react';
import { useSearchParams }     from 'react-router-dom';
import {
  Search, Filter, X, ArrowUpDown,
  ChevronDown, ChevronLeft, ChevronRight,
  Moon, Star, Zap, ShieldCheck,
} from 'lucide-react';
import { useCurrency }       from '../hooks/useCurrency.js';
import PropertyCard          from '../components/PropertyCard.jsx';
import { useProperty, NIGERIAN_STATES } from '../context/PropertyContext.jsx';

/* ════════════════════════════════════════════════════════════
   SHORTLETS PAGE — Browse short-term accommodation
   Follows Marketplace.jsx pattern: search, filters, sort, grid
════════════════════════════════════════════════════════════ */

const SORT_OPTIONS = [
  { value: 'popular',    label: 'Most Popular'      },
  { value: 'price_asc',  label: 'Price: Low → High' },
  { value: 'price_desc', label: 'Price: High → Low' },
  { value: 'rating',     label: 'Highest Rated'     },
  { value: 'newest',     label: 'Newest First'      },
];

const BEDROOM_OPTIONS = ['Any', '1', '2', '3', '4+'];

const PER_PAGE = 12;

/* ── Filter Drawer ─────────────────────────────────────────── */
function ShortletFilterDrawer({ isOpen, onClose, filters, onChange }) {
  const [local, setLocal] = useState(filters);
  const set = (k, v) => setLocal(f => ({ ...f, [k]: v }));

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] lg:hidden">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="absolute bottom-0 left-0 right-0 max-h-[85vh] overflow-y-auto bg-white dark:bg-brand-charcoal-dark rounded-t-3xl animate-slide-up">
        <div className="sticky top-0 z-10 flex items-center justify-between px-5 py-4 bg-white dark:bg-brand-charcoal-dark border-b border-gray-100 dark:border-white/10">
          <h3 className="text-lg font-bold font-display text-brand-charcoal-dark dark:text-white">Filters</h3>
          <button type="button" onClick={onClose} className="p-1.5 rounded-full hover:bg-gray-100 dark:hover:bg-white/10">
            <X size={18} className="text-gray-400" />
          </button>
        </div>

        <div className="p-5 space-y-5">
          {/* State */}
          <div>
            <label className="mb-2 label-sm">Location</label>
            <select value={local.state} onChange={e => set('state', e.target.value)}
              className="w-full select-field">
              {NIGERIAN_STATES.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>

          {/* Budget range */}
          <div>
            <label className="mb-2 label-sm">Budget per Night</label>
            <div className="grid grid-cols-2 gap-2">
              <input type="number" value={local.minPrice} placeholder="Min ₦"
                onChange={e => set('minPrice', e.target.value)}
                className="input-field text-sm" />
              <input type="number" value={local.maxPrice} placeholder="Max ₦"
                onChange={e => set('maxPrice', e.target.value)}
                className="input-field text-sm" />
            </div>
          </div>

          {/* Bedrooms */}
          <div>
            <label className="mb-2 label-sm">Bedrooms</label>
            <div className="flex gap-2">
              {BEDROOM_OPTIONS.map(opt => (
                <button key={opt} type="button"
                  onClick={() => set('bedrooms', opt)}
                  className={`flex-1 py-2.5 text-xs font-bold rounded-xl border-2 transition-all ${
                    local.bedrooms === opt
                      ? 'border-brand-gold bg-brand-gold/10 text-brand-charcoal-dark dark:text-white'
                      : 'border-gray-200 dark:border-white/10 text-gray-500 dark:text-gray-400'
                  }`}>
                  {opt}
                </button>
              ))}
            </div>
          </div>

          {/* Instant booking */}
          <div className="flex items-center gap-3">
            <input type="checkbox" id="sl-instant" checked={local.instantBooking}
              onChange={e => set('instantBooking', e.target.checked)}
              className="w-4 h-4 accent-brand-gold" />
            <label htmlFor="sl-instant" className="flex items-center gap-2 text-sm font-semibold cursor-pointer text-brand-charcoal-dark dark:text-white">
              <Zap size={14} className="text-brand-gold" />
              Instant booking only
            </label>
          </div>

          {/* Verified */}
          <div className="flex items-center gap-3">
            <input type="checkbox" id="sl-verified" checked={local.verified}
              onChange={e => set('verified', e.target.checked)}
              className="w-4 h-4 accent-brand-gold" />
            <label htmlFor="sl-verified" className="flex items-center gap-2 text-sm font-semibold cursor-pointer text-brand-charcoal-dark dark:text-white">
              <ShieldCheck size={14} className="text-emerald-500" />
              Verified hosts only
            </label>
          </div>
        </div>

        <div className="flex gap-3 px-5 py-4 border-t border-gray-100 dark:border-white/10">
          <button type="button"
            onClick={() => setLocal({ state:'All States', minPrice:'', maxPrice:'', bedrooms:'Any', instantBooking:false, verified:false })}
            className="flex-none px-5 py-3 text-sm font-bold border-2 border-gray-200 rounded-xl dark:border-white/20 text-brand-charcoal dark:text-white">
            Clear
          </button>
          <button type="button" onClick={() => { onChange(local); onClose(); }}
            className="flex-1 py-3 text-sm font-bold text-white transition-colors rounded-xl bg-brand-gold hover:bg-brand-gold-dark">
            Apply
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── Main Page ─────────────────────────────────────────────── */
export default function Shortlets() {
  const { properties } = useProperty();
  const [params]       = useSearchParams();

  const [keyword,     setKeyword]     = useState(params.get('q') || '');
  const [showFilters, setShowFilters] = useState(false);
  const [sortBy,      setSortBy]      = useState('popular');
  const [showSort,    setShowSort]    = useState(false);
  const [page,        setPage]        = useState(1);

  const [filters, setFilters] = useState({
    state:          'All States',
    minPrice:       '',
    maxPrice:       '',
    bedrooms:       'Any',
    instantBooking: false,
    verified:       false,
  });

  /* ── Filter + sort ─────────────────────────────────────── */
  const filtered = useMemo(() => {
    let list = properties.filter(p => p.category === 'shortlet');

    if (keyword.trim()) {
      const q = keyword.toLowerCase();
      list = list.filter(p =>
        p.title.toLowerCase().includes(q) ||
        p.location.toLowerCase().includes(q) ||
        p.description?.toLowerCase().includes(q)
      );
    }

    if (filters.state !== 'All States')
      list = list.filter(p => p.state === filters.state);

    if (filters.minPrice)
      list = list.filter(p => (p.pricePerNight || p.price) >= Number(filters.minPrice));

    if (filters.maxPrice)
      list = list.filter(p => (p.pricePerNight || p.price) <= Number(filters.maxPrice));

    if (filters.bedrooms !== 'Any') {
      const beds = filters.bedrooms === '4+' ? 4 : Number(filters.bedrooms);
      list = list.filter(p => p.bedrooms >= beds);
    }

    if (filters.instantBooking)
      list = list.filter(p => p.availability?.instantBooking);

    if (filters.verified)
      list = list.filter(p => p.verified);

    if (sortBy === 'price_asc')  list.sort((a, b) => (a.pricePerNight || a.price) - (b.pricePerNight || b.price));
    if (sortBy === 'price_desc') list.sort((a, b) => (b.pricePerNight || b.price) - (a.pricePerNight || a.price));
    if (sortBy === 'rating')     list.sort((a, b) => (b.providerRating || 0) - (a.providerRating || 0));
    if (sortBy === 'popular')    list.sort((a, b) => (b.views || 0) - (a.views || 0));
    if (sortBy === 'newest')     list.sort((a, b) => new Date(b.postedAt) - new Date(a.postedAt));

    return list;
  }, [properties, filters, keyword, sortBy]);

  const totalPages = Math.ceil(filtered.length / PER_PAGE);
  const paginated  = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);
  const activeCount = [
    filters.state !== 'All States', !!filters.minPrice, !!filters.maxPrice,
    filters.bedrooms !== 'Any', filters.instantBooking, filters.verified,
  ].filter(Boolean).length;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900/30">

      {/* ── Search bar ───────────────────────────────────────── */}
      <div className="sticky top-0 z-30 px-4 py-3 bg-white border-b border-gray-100 shadow-sm dark:bg-brand-charcoal-dark dark:border-white/10">
        <div className="flex items-center max-w-6xl gap-2 mx-auto">
          <div className="relative flex-1">
            <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
            <input type="search" value={keyword}
              onChange={e => { setKeyword(e.target.value); setPage(1); }}
              placeholder="Search shortlets by location, name…"
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-brand-gray-soft dark:bg-white/10 text-sm font-body text-brand-charcoal-dark dark:text-white placeholder:text-gray-400 border border-transparent focus:border-brand-gold outline-none transition-all"
            />
          </div>
          <button type="button" onClick={() => setShowFilters(true)}
            className={`flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl border-2 text-sm font-bold transition-all shrink-0
              ${activeCount > 0 ? 'border-brand-gold bg-brand-gold/10 text-brand-charcoal-dark dark:text-white' : 'border-gray-200 dark:border-white/20 bg-white dark:bg-white/5 text-brand-charcoal dark:text-white hover:border-gray-300'}`}>
            <Filter size={14} />Filters
            {activeCount > 0 && <span className="w-5 h-5 bg-brand-gold text-white text-[10px] font-bold rounded-full flex items-center justify-center">{activeCount}</span>}
          </button>
        </div>
      </div>

      <div className="px-4 py-6 mx-auto max-w-6xl">

        {/* ── Header + sort ──────────────────────────────────── */}
        <div className="flex items-center justify-between mb-5">
          <div>
            <h1 className="text-2xl font-extrabold font-display text-brand-charcoal-dark dark:text-white sm:text-3xl">
              Shortlets
            </h1>
            <p className="mt-1 text-sm text-gray-400">
              {filtered.length} furnished short-stay{filtered.length !== 1 ? 's' : ''} available
            </p>
          </div>

          {/* Sort */}
          <div className="relative">
            <button type="button" onClick={() => setShowSort(v => !v)}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold border border-gray-200 dark:border-white/10 rounded-xl text-brand-charcoal dark:text-white hover:border-gray-300 transition-colors">
              <ArrowUpDown size={13} />
              {SORT_OPTIONS.find(s => s.value === sortBy)?.label}
              <ChevronDown size={12} />
            </button>
            {showSort && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setShowSort(false)} />
                <div className="absolute right-0 z-50 mt-1 overflow-hidden bg-white border border-gray-100 shadow-lg dark:bg-brand-charcoal-dark dark:border-white/10 rounded-xl w-44">
                  {SORT_OPTIONS.map(s => (
                    <button key={s.value} type="button"
                      onClick={() => { setSortBy(s.value); setShowSort(false); setPage(1); }}
                      className={`w-full px-4 py-2.5 text-left text-xs font-semibold transition-colors
                        ${sortBy === s.value ? 'bg-brand-gold/10 text-brand-gold' : 'text-brand-charcoal dark:text-white hover:bg-brand-gray-soft dark:hover:bg-white/10'}`}>
                      {s.label}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>

        {/* ── Info banner ────────────────────────────────────── */}
        <div className="flex items-center gap-3 p-3.5 mb-5 bg-brand-gold/5 dark:bg-brand-gold/10 rounded-2xl border border-brand-gold/20">
          <Moon size={16} className="text-brand-gold shrink-0" />
          <p className="text-xs text-gray-600 dark:text-gray-300">
            <strong className="text-brand-charcoal-dark dark:text-white">All stays are verified.</strong> Book with confidence — payments protected by Aurban Escrow.
          </p>
        </div>

        {/* ── Grid ───────────────────────────────────────────── */}
        {paginated.length > 0 ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {paginated.map(p => <PropertyCard key={p.id} property={p} />)}
          </div>
        ) : (
          <div className="py-16 text-center">
            <p className="mb-2 text-4xl">🏨</p>
            <h2 className="mb-1 text-lg font-bold font-display text-brand-charcoal-dark dark:text-white">No shortlets found</h2>
            <p className="mb-4 text-sm text-gray-400">Try adjusting your search or filters</p>
            <button type="button"
              onClick={() => { setKeyword(''); setFilters({ state:'All States', minPrice:'', maxPrice:'', bedrooms:'Any', instantBooking:false, verified:false }); setPage(1); }}
              className="text-sm font-bold text-brand-gold hover:text-brand-gold-dark">
              Clear all filters
            </button>
          </div>
        )}

        {/* ── Pagination ─────────────────────────────────────── */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 mt-8">
            <button type="button" disabled={page <= 1}
              onClick={() => setPage(p => p - 1)}
              className="flex items-center justify-center w-9 h-9 border border-gray-200 dark:border-white/10 rounded-xl disabled:opacity-30 text-brand-charcoal dark:text-white hover:border-brand-gold transition-colors">
              <ChevronLeft size={16} />
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map(n => (
              <button key={n} type="button" onClick={() => setPage(n)}
                className={`w-9 h-9 rounded-xl text-xs font-bold transition-all ${
                  n === page
                    ? 'bg-brand-gold text-white'
                    : 'border border-gray-200 dark:border-white/10 text-brand-charcoal dark:text-white hover:border-brand-gold'
                }`}>
                {n}
              </button>
            ))}
            <button type="button" disabled={page >= totalPages}
              onClick={() => setPage(p => p + 1)}
              className="flex items-center justify-center w-9 h-9 border border-gray-200 dark:border-white/10 rounded-xl disabled:opacity-30 text-brand-charcoal dark:text-white hover:border-brand-gold transition-colors">
              <ChevronRight size={16} />
            </button>
          </div>
        )}
      </div>

      {/* ── Filter Drawer ────────────────────────────────────── */}
      <ShortletFilterDrawer
        isOpen={showFilters}
        onClose={() => setShowFilters(false)}
        filters={filters}
        onChange={f => { setFilters(f); setPage(1); }}
      />
    </div>
  );
}
