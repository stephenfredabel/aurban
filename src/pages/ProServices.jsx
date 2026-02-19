import { useState, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import PageSEO from '../components/seo/PageSEO.jsx';
import {
  Search, Filter, X, ArrowUpDown, ChevronDown,
  ChevronLeft, ChevronRight, Shield, Wrench,
} from 'lucide-react';
import { useProListing } from '../context/ProListingContext.jsx';
import { useCurrency } from '../hooks/useCurrency.js';
import ProServiceCard from '../components/pro/ProServiceCard.jsx';
import ProCategoryFilter from '../components/pro/ProCategoryFilter.jsx';
import ProTierBadge from '../components/pro/ProTierBadge.jsx';

/* ════════════════════════════════════════════════════════════
   AURBAN PRO — Service Browse Page
   Route: /pro
════════════════════════════════════════════════════════════ */

const SORT_OPTIONS = [
  { value: 'newest',    label: 'Newest First'      },
  { value: 'price_asc', label: 'Price: Low → High' },
  { value: 'price_desc',label: 'Price: High → Low' },
  { value: 'rating',    label: 'Highest Rated'     },
  { value: 'popular',   label: 'Most Reviews'      },
];

const TIER_OPTIONS = [
  { value: 'all', label: 'All Tiers' },
  { value: '1',   label: 'Tier 1 — Quick' },
  { value: '2',   label: 'Tier 2 — Functional' },
  { value: '3',   label: 'Tier 3 — Specialist' },
  { value: '4',   label: 'Tier 4 — Projects' },
];

const NIGERIA_STATES = [
  'All States', 'Lagos', 'Abuja', 'Rivers', 'Ogun', 'Oyo', 'Kano', 'Delta',
  'Anambra', 'Edo', 'Enugu', 'Kaduna', 'Imo', 'Akwa Ibom',
];

const PER_PAGE = 12;

// ── Filter Drawer ──────────────────────────────────────────

function ProFilterDrawer({ filters, onChange, onClose }) {
  const { symbol } = useCurrency();
  const [local, setLocal] = useState(filters);
  const set = (k, v) => setLocal(f => ({ ...f, [k]: v }));

  return (
    <div className="fixed inset-0 z-50 flex">
      <button type="button" className="flex-1 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="flex flex-col w-full h-full max-w-sm overflow-y-auto bg-white shadow-2xl dark:bg-brand-charcoal-dark">
        <div className="sticky top-0 z-10 flex items-center justify-between px-5 py-4 bg-white border-b border-gray-100 dark:border-white/10 dark:bg-brand-charcoal-dark">
          <h2 className="text-lg font-extrabold font-display text-brand-charcoal-dark dark:text-white">Filter Services</h2>
          <button type="button" onClick={onClose} className="flex items-center justify-center w-8 h-8 rounded-xl hover:bg-brand-gray-soft dark:hover:bg-white/10">
            <X size={16} className="text-brand-charcoal dark:text-white" />
          </button>
        </div>

        <div className="flex-1 px-5 py-5 space-y-6">
          <div>
            <label className="mb-2 label-sm">State</label>
            <select value={local.state} onChange={e => set('state', e.target.value)} className="input-field">
              {NIGERIA_STATES.map(s => <option key={s}>{s}</option>)}
            </select>
          </div>

          <div>
            <label className="mb-2 label-sm">Tier</label>
            <div className="flex flex-wrap gap-2">
              {TIER_OPTIONS.map(t => (
                <button key={t.value} type="button" onClick={() => set('tier', t.value)}
                  className={`px-3 py-1.5 rounded-xl border-2 text-xs font-bold transition-all ${local.tier === t.value ? 'border-brand-gold bg-brand-gold/10 text-brand-charcoal-dark dark:text-white' : 'border-gray-200 dark:border-white/10 bg-white dark:bg-white/5 text-gray-500 dark:text-white/60'}`}>
                  {t.label}
                </button>
              ))}
            </div>
          </div>

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

          <div className="flex items-center gap-3 p-3.5 bg-brand-gray-soft dark:bg-white/5 rounded-xl">
            <input type="checkbox" id="pro-verified" checked={local.verified}
              onChange={e => set('verified', e.target.checked)}
              className="w-4 h-4 accent-brand-gold" />
            <label htmlFor="pro-verified" className="flex items-center gap-2 text-sm font-semibold cursor-pointer text-brand-charcoal-dark dark:text-white">
              <Shield size={14} className="text-emerald-500" />
              Verified providers only
            </label>
          </div>
        </div>

        <div className="flex gap-3 px-5 py-4 border-t border-gray-100 dark:border-white/10">
          <button type="button"
            onClick={() => setLocal({ category: 'all', state: 'All States', tier: 'all', minPrice: '', maxPrice: '', verified: false })}
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

// ── Main Page ──────────────────────────────────────────────

export default function ProServices() {
  const { listings } = useProListing();
  useCurrency();
  const [params] = useSearchParams();

  const [keyword, setKeyword] = useState(params.get('q') || '');
  const [showFilters, setShowFilters] = useState(false);
  const [sortBy, setSortBy] = useState('newest');
  const [showSort, setShowSort] = useState(false);
  const [page, setPage] = useState(1);

  const [filters, setFilters] = useState({
    category: params.get('category') || 'all',
    state: 'All States',
    tier: 'all',
    minPrice: '',
    maxPrice: '',
    verified: false,
  });

  const filtered = useMemo(() => {
    let list = listings.filter(l => l.active);

    if (filters.category !== 'all')
      list = list.filter(l => l.category === filters.category);

    if (filters.tier !== 'all')
      list = list.filter(l => l.tier === Number(filters.tier));

    if (keyword.trim()) {
      const q = keyword.toLowerCase();
      list = list.filter(l =>
        l.title.toLowerCase().includes(q) ||
        l.providerName?.toLowerCase().includes(q) ||
        l.description?.toLowerCase().includes(q)
      );
    }

    if (filters.state !== 'All States')
      list = list.filter(l => l.state === filters.state);

    if (filters.minPrice)
      list = list.filter(l => l.price >= Number(filters.minPrice));

    if (filters.maxPrice)
      list = list.filter(l => l.price <= Number(filters.maxPrice));

    if (filters.verified)
      list = list.filter(l => l.providerVerified);

    if (sortBy === 'price_asc')  list.sort((a, b) => a.price - b.price);
    if (sortBy === 'price_desc') list.sort((a, b) => b.price - a.price);
    if (sortBy === 'rating')     list.sort((a, b) => (b.rating || 0) - (a.rating || 0));
    if (sortBy === 'popular')    list.sort((a, b) => (b.reviewCount || 0) - (a.reviewCount || 0));

    return list;
  }, [listings, filters, keyword, sortBy]);

  const totalPages = Math.ceil(filtered.length / PER_PAGE);
  const paginated = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  const activeCount = [
    filters.state !== 'All States',
    filters.tier !== 'all',
    !!filters.minPrice,
    !!filters.maxPrice,
    filters.verified,
  ].filter(Boolean).length;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900/30">
      <PageSEO
        title="Aurban Pro — Hire Verified Plumbers, Electricians & More"
        description="Book trusted, escrow-protected professionals for plumbing, electrical, cleaning, painting and home services across Nigeria."
        url="/pro"
      />

      {/* Search bar */}
      <div className="sticky top-0 z-30 px-4 py-3 bg-white border-b border-gray-100 shadow-sm dark:bg-brand-charcoal-dark dark:border-white/10">
        <div className="flex items-center max-w-6xl gap-2 mx-auto">
          <div className="relative flex-1">
            <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
            <input type="search" value={keyword}
              onChange={e => { setKeyword(e.target.value); setPage(1); }}
              placeholder="Search services, providers, categories..."
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

        {/* Category strip */}
        <div className="mb-5">
          <ProCategoryFilter
            selected={filters.category}
            onSelect={cat => { setFilters(f => ({ ...f, category: cat })); setPage(1); }}
            listings={listings}
          />
        </div>

        {/* Pro notice banner */}
        <div className="flex items-center gap-2 p-3 mb-5 border bg-purple-50 dark:bg-purple-500/10 rounded-2xl border-purple-100 dark:border-purple-500/20">
          <Wrench size={14} className="text-purple-500 shrink-0" />
          <p className="text-xs leading-relaxed text-purple-700 dark:text-purple-300">
            <strong>Aurban Pro</strong> — Hire verified professionals with escrow protection, OTP check-in, and observation windows.
          </p>
        </div>

        {/* Results header + sort */}
        <div className="flex items-center justify-between gap-3 mb-5">
          <p className="text-sm font-bold text-brand-charcoal-dark dark:text-white">
            {filtered.length.toLocaleString()} service{filtered.length !== 1 ? 's' : ''}
          </p>
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
            <p className="mb-4 text-5xl">🔧</p>
            <p className="mb-2 text-xl font-extrabold font-display text-brand-charcoal-dark dark:text-white">No services found</p>
            <p className="mb-5 text-sm text-gray-400">Try a different category or adjust your filters.</p>
            <button type="button"
              onClick={() => { setFilters({ category: 'all', state: 'All States', tier: 'all', minPrice: '', maxPrice: '', verified: false }); setKeyword(''); }}
              className="btn-primary">Clear Filters</button>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {paginated.map(service => (
              <ProServiceCard key={service.id} service={service} />
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
        <ProFilterDrawer
          filters={filters}
          onChange={f => { setFilters(f); setPage(1); }}
          onClose={() => setShowFilters(false)}
        />
      )}
    </div>
  );
}
