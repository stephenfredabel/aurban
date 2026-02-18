import { useState, useMemo }     from 'react';
import { useSearchParams }       from 'react-router-dom';
import PageSEO from '../components/seo/PageSEO.jsx';
import {
  Search, Filter, X, ArrowUpDown, ChevronDown,
  Truck, Home, MapPin, Globe, Building2, Package,
  Warehouse, Car, Shield, ShieldCheck,
  ChevronLeft, ChevronRight, Star,
} from 'lucide-react';
import { useCurrency }           from '../hooks/useCurrency.js';
import { useProperty }           from '../context/PropertyContext.jsx';
import { NIGERIAN_STATES }       from '../context/PropertyContext.jsx';
import RelocationProviderCard    from '../components/relocation/RelocationProviderCard.jsx';
import { sanitize }              from '../utils/searchHelper.js';

// ─────────────────────────────────────────────────────────────
// CONSTANTS
// ─────────────────────────────────────────────────────────────

const RELOCATION_CATS = [
  { id: 'all',           label: 'All Services',     Icon: Truck     },
  { id: 'local',         label: 'Local Moving',     Icon: Home      },
  { id: 'interstate',    label: 'Interstate',        Icon: MapPin    },
  { id: 'international', label: 'International',     Icon: Globe     },
  { id: 'office',        label: 'Office/Commercial', Icon: Building2 },
  { id: 'packing',       label: 'Packing Only',      Icon: Package   },
  { id: 'storage',       label: 'Storage',            Icon: Warehouse },
  { id: 'vehicle',       label: 'Vehicle Transport',  Icon: Car       },
];

const SORT_OPTIONS = [
  { value: 'best_match', label: 'Best Match'        },
  { value: 'rating',     label: 'Highest Rated'     },
  { value: 'price_asc',  label: 'Price: Low → High' },
  { value: 'price_desc', label: 'Price: High → Low' },
  { value: 'reviews',    label: 'Most Reviews'      },
  { value: 'moves',      label: 'Most Moves'        },
];

const RATING_OPTIONS = [0, 3, 3.5, 4, 4.5];

const PER_PAGE = 12;

// ─────────────────────────────────────────────────────────────
// FILTER DRAWER
// ─────────────────────────────────────────────────────────────

function RelocationFilterDrawer({ filters, onChange, onClose }) {
  const { symbol } = useCurrency();
  const [local, setLocal] = useState(filters);
  const set = (k, v) => setLocal(f => ({ ...f, [k]: v }));

  return (
    <div className="fixed inset-0 z-50 flex">
      <button type="button" className="flex-1 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="flex flex-col w-full h-full max-w-sm overflow-y-auto bg-white shadow-2xl dark:bg-brand-charcoal-dark">
        <div className="sticky top-0 z-10 flex items-center justify-between px-5 py-4 bg-white border-b border-gray-100 dark:border-white/10 dark:bg-brand-charcoal-dark">
          <h2 className="text-lg font-extrabold font-display text-brand-charcoal-dark dark:text-white">Filter Movers</h2>
          <button type="button" onClick={onClose} className="flex items-center justify-center w-8 h-8 rounded-xl hover:bg-brand-gray-soft dark:hover:bg-white/10">
            <X size={16} className="text-brand-charcoal dark:text-white" />
          </button>
        </div>

        <div className="flex-1 px-5 py-5 space-y-6">
          {/* State */}
          <div>
            <label className="mb-2 label-sm">State / Region</label>
            <select value={local.state} onChange={e => set('state', e.target.value)} className="input-field">
              {NIGERIAN_STATES.map(s => <option key={s}>{s}</option>)}
            </select>
          </div>

          {/* Budget */}
          <div>
            <label className="mb-2 label-sm">Budget Range ({symbol})</label>
            <div className="grid grid-cols-2 gap-3">
              <div className="relative">
                <span className="absolute text-xs text-gray-400 -translate-y-1/2 pointer-events-none left-3 top-1/2">{symbol}</span>
                <input type="number" inputMode="numeric" placeholder="Min"
                  value={local.minBudget} onChange={e => set('minBudget', e.target.value)}
                  className="text-sm input-field pl-7" />
              </div>
              <div className="relative">
                <span className="absolute text-xs text-gray-400 -translate-y-1/2 pointer-events-none left-3 top-1/2">{symbol}</span>
                <input type="number" inputMode="numeric" placeholder="Max"
                  value={local.maxBudget} onChange={e => set('maxBudget', e.target.value)}
                  className="text-sm input-field pl-7" />
              </div>
            </div>
          </div>

          {/* Service type */}
          <div>
            <label className="mb-2 label-sm">Service Type</label>
            <div className="flex flex-wrap gap-2">
              {RELOCATION_CATS.map(({ id, label }) => (
                <button key={id} type="button" onClick={() => set('serviceType', id)}
                  className={`px-3 py-1.5 rounded-xl border-2 text-xs font-bold transition-all ${local.serviceType === id ? 'border-brand-gold bg-brand-gold/10 text-brand-charcoal-dark dark:text-white' : 'border-gray-200 dark:border-white/10 bg-white dark:bg-white/5 text-gray-500 dark:text-white/60'}`}>
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Minimum rating */}
          <div>
            <label className="mb-2 label-sm">Minimum Rating</label>
            <div className="flex gap-2">
              {RATING_OPTIONS.map(r => (
                <button key={r} type="button" onClick={() => set('minRating', r)}
                  className={`flex items-center gap-1 px-3 py-1.5 rounded-xl border-2 text-xs font-bold transition-all ${local.minRating === r ? 'border-brand-gold bg-brand-gold/10 text-brand-charcoal-dark dark:text-white' : 'border-gray-200 dark:border-white/10 bg-white dark:bg-white/5 text-gray-500 dark:text-white/60'}`}>
                  {r === 0 ? 'Any' : <><Star size={10} fill="currentColor" className="text-brand-gold" /> {r}+</>}
                </button>
              ))}
            </div>
          </div>

          {/* Insurance */}
          <div className="flex items-center gap-3 p-3.5 bg-brand-gray-soft dark:bg-white/5 rounded-xl">
            <input type="checkbox" id="rlc-insurance" checked={local.insurance}
              onChange={e => set('insurance', e.target.checked)}
              className="w-4 h-4 accent-brand-gold" />
            <label htmlFor="rlc-insurance" className="flex items-center gap-2 text-sm font-semibold cursor-pointer text-brand-charcoal-dark dark:text-white">
              <Shield size={14} className="text-emerald-500" />
              Insurance required
            </label>
          </div>

          {/* Verified only */}
          <div className="flex items-center gap-3 p-3.5 bg-brand-gray-soft dark:bg-white/5 rounded-xl">
            <input type="checkbox" id="rlc-verified" checked={local.verified}
              onChange={e => set('verified', e.target.checked)}
              className="w-4 h-4 accent-brand-gold" />
            <label htmlFor="rlc-verified" className="flex items-center gap-2 text-sm font-semibold cursor-pointer text-brand-charcoal-dark dark:text-white">
              <ShieldCheck size={14} className="text-emerald-500" />
              Verified providers only
            </label>
          </div>
        </div>

        <div className="flex gap-3 px-5 py-4 border-t border-gray-100 dark:border-white/10">
          <button type="button"
            onClick={() => setLocal({ serviceType: 'all', state: 'All States', minBudget: '', maxBudget: '', minRating: 0, insurance: false, verified: false })}
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

// ─────────────────────────────────────────────────────────────
// MAIN PAGE
// ─────────────────────────────────────────────────────────────

export default function Relocation() {
  const { symbol }              = useCurrency();
  const { relocationProviders } = useProperty();
  const [params]                = useSearchParams();

  const [keyword,     setKeyword]     = useState(params.get('q') || '');
  const [showFilters, setShowFilters] = useState(false);
  const [sortBy,      setSortBy]      = useState('best_match');
  const [showSort,    setShowSort]    = useState(false);
  const [page,        setPage]        = useState(1);

  const [filters, setFilters] = useState({
    serviceType: params.get('type') || 'all',
    state:       'All States',
    minBudget:   '',
    maxBudget:   '',
    minRating:   0,
    insurance:   false,
    verified:    false,
  });

  const filtered = useMemo(() => {
    let list = [...relocationProviders];

    // Category filter
    if (filters.serviceType !== 'all')
      list = list.filter(p => p.serviceTypes?.includes(filters.serviceType));

    // Keyword search
    if (keyword.trim()) {
      const q = keyword.toLowerCase();
      list = list.filter(p =>
        p.name.toLowerCase().includes(q) ||
        p.description?.toLowerCase().includes(q) ||
        p.serviceAreas?.some(a => a.toLowerCase().includes(q))
      );
    }

    // State filter
    if (filters.state !== 'All States')
      list = list.filter(p => p.state === filters.state || p.serviceAreas?.includes(filters.state));

    // Budget filters
    if (filters.minBudget) {
      const min = Number(filters.minBudget);
      list = list.filter(p => {
        const mins = Object.values(p.priceRange || {}).map(v => v.min);
        return mins.length && Math.min(...mins) >= min;
      });
    }
    if (filters.maxBudget) {
      const max = Number(filters.maxBudget);
      list = list.filter(p => {
        const mins = Object.values(p.priceRange || {}).map(v => v.min);
        return mins.length && Math.min(...mins) <= max;
      });
    }

    // Rating filter
    if (filters.minRating)
      list = list.filter(p => p.rating >= filters.minRating);

    // Insurance filter
    if (filters.insurance)
      list = list.filter(p => p.insurance);

    // Verified filter
    if (filters.verified)
      list = list.filter(p => p.verified);

    // Sorting
    if (sortBy === 'rating')     list.sort((a, b) => b.rating - a.rating);
    if (sortBy === 'reviews')    list.sort((a, b) => b.reviews - a.reviews);
    if (sortBy === 'moves')      list.sort((a, b) => b.completedMoves - a.completedMoves);
    if (sortBy === 'price_asc') {
      list.sort((a, b) => {
        const aMin = Math.min(...Object.values(a.priceRange || {}).map(v => v.min));
        const bMin = Math.min(...Object.values(b.priceRange || {}).map(v => v.min));
        return aMin - bMin;
      });
    }
    if (sortBy === 'price_desc') {
      list.sort((a, b) => {
        const aMin = Math.min(...Object.values(a.priceRange || {}).map(v => v.min));
        const bMin = Math.min(...Object.values(b.priceRange || {}).map(v => v.min));
        return bMin - aMin;
      });
    }

    return list;
  }, [relocationProviders, filters, keyword, sortBy]);

  const totalPages = Math.ceil(filtered.length / PER_PAGE);
  const paginated  = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);
  const activeCount = [
    filters.state !== 'All States',
    !!filters.minBudget,
    !!filters.maxBudget,
    filters.minRating > 0,
    filters.insurance,
    filters.verified,
  ].filter(Boolean).length;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900/30">
      <PageSEO
        title="Relocation Services Nigeria — Moving & Logistics"
        description="Find trusted relocation companies for local and international moves across Nigeria. Compare quotes, read reviews and book verified movers."
        url="/relocation"
      />

      {/* Sticky search bar */}
      <div className="sticky top-0 z-30 px-4 py-3 bg-white border-b border-gray-100 shadow-sm dark:bg-brand-charcoal-dark dark:border-white/10">
        <div className="flex items-center max-w-6xl gap-2 mx-auto">
          <div className="relative flex-1">
            <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
            <input type="search" value={keyword}
              onChange={e => { setKeyword(sanitize(e.target.value)); setPage(1); }}
              placeholder="Search movers, locations, services…"
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

      <div className="max-w-6xl px-4 py-5 pb-24 mx-auto lg:pb-10">

        {/* Page header */}
        <div className="mb-5">
          <h1 className="mb-1 text-2xl font-extrabold font-display text-brand-charcoal-dark dark:text-white">
            Relocation Services
          </h1>
          <p className="text-sm text-gray-400">
            Compare verified movers, get instant quotes, move with confidence
          </p>
        </div>

        {/* Category chips */}
        <div className="flex gap-2 pb-1 mb-5 overflow-x-auto scrollbar-none">
          {RELOCATION_CATS.map(({ id, label, Icon }) => (
            <button key={id} type="button"
              onClick={() => { setFilters(f => ({ ...f, serviceType: id })); setPage(1); }}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-xl border-2 text-xs font-bold whitespace-nowrap transition-all shrink-0
                ${filters.serviceType === id
                  ? 'border-brand-gold bg-brand-gold text-white'
                  : 'border-gray-200 dark:border-white/10 bg-white dark:bg-white/5 text-gray-600 dark:text-white/70 hover:border-brand-gold/50'}`}>
              <Icon size={13} /> {label}
            </button>
          ))}
        </div>

        {/* Policy notice */}
        <div className="flex items-center gap-2 p-3 mb-5 border bg-emerald-50 dark:bg-emerald-500/10 rounded-2xl border-emerald-100 dark:border-emerald-500/20">
          <Shield size={14} className="text-emerald-500 shrink-0" />
          <p className="text-xs leading-relaxed text-emerald-700 dark:text-emerald-300">
            <strong>Verified movers only.</strong> All providers are background-checked and insured. Get quotes before committing to any service.
          </p>
        </div>

        {/* Results header + sort */}
        <div className="flex items-center justify-between gap-3 mb-5">
          <p className="text-sm font-bold text-brand-charcoal-dark dark:text-white">
            {filtered.length.toLocaleString()} provider{filtered.length !== 1 ? 's' : ''}
          </p>
          <div className="relative">
            <button type="button" onClick={() => setShowSort(v => !v)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 text-xs font-bold text-brand-charcoal dark:text-white hover:border-gray-300 transition-colors">
              <ArrowUpDown size={12} />
              {SORT_OPTIONS.find(s => s.value === sortBy)?.label}
              <ChevronDown size={12} className={`transition-transform ${showSort ? 'rotate-180' : ''}`} />
            </button>
            {showSort && (
              <div className="absolute right-0 z-20 mt-1 overflow-hidden bg-white border border-gray-100 shadow-xl top-full w-48 dark:bg-brand-charcoal-dark rounded-2xl dark:border-white/10"
                onMouseLeave={() => setShowSort(false)}>
                {SORT_OPTIONS.map(s => (
                  <button key={s.value} type="button" onClick={() => { setSortBy(s.value); setShowSort(false); setPage(1); }}
                    className={`w-full px-4 py-2.5 text-xs font-semibold text-left transition-colors ${sortBy === s.value ? 'bg-brand-gold/10 text-brand-gold' : 'text-brand-charcoal dark:text-white hover:bg-brand-gray-soft dark:hover:bg-white/10'}`}>
                    {s.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Grid */}
        {paginated.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <p className="mb-4 text-5xl">🚚</p>
            <p className="mb-2 text-xl font-extrabold font-display text-brand-charcoal-dark dark:text-white">No movers found</p>
            <p className="mb-5 text-sm text-gray-400">Try a different location or adjust your filters.</p>
            <button type="button"
              onClick={() => {
                setFilters({ serviceType: 'all', state: 'All States', minBudget: '', maxBudget: '', minRating: 0, insurance: false, verified: false });
                setKeyword('');
              }}
              className="btn-primary">Clear Filters</button>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {paginated.map(provider => (
              <RelocationProviderCard key={provider.id} provider={provider} />
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
              const n = Math.max(1, Math.min(totalPages - 4, page - 2)) + i;
              return (
                <button key={n} type="button" onClick={() => setPage(n)}
                  className={`w-9 h-9 rounded-xl text-sm font-bold transition-all ${page === n ? 'bg-brand-gold text-white' : 'border border-gray-200 dark:border-white/10 text-brand-charcoal dark:text-white hover:border-brand-gold'}`}>
                  {n}
                </button>
              );
            })}
            <button type="button" onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
              className="flex items-center justify-center transition-colors border border-gray-200 w-9 h-9 rounded-xl dark:border-white/10 text-brand-charcoal dark:text-white disabled:opacity-30 hover:border-brand-gold">
              <ChevronRight size={16} />
            </button>
          </div>
        )}
      </div>

      {showFilters && (
        <RelocationFilterDrawer
          filters={filters}
          onChange={f => { setFilters(f); setPage(1); }}
          onClose={() => setShowFilters(false)}
        />
      )}
    </div>
  );
}
