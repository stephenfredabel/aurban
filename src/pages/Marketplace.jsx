import { useState, useMemo }   from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import PageSEO from '../components/seo/PageSEO.jsx';
import {
  Search, Filter, X, ArrowUpDown,
  ChevronDown, ShieldCheck, Truck,
  Package, Heart, ChevronLeft, ChevronRight,
  ShoppingCart,
} from 'lucide-react';
import { useCurrency } from '../hooks/useCurrency.js';
import ProductCard     from '../components/ProductCard.jsx';
import { useProperty } from '../context/PropertyContext.jsx';
import CartIcon        from '../components/marketplace/CartIcon.jsx';
import CartDrawer      from '../components/marketplace/CartDrawer.jsx';
import { getPreferenceGroupList } from '../data/productPreferences.js';

// ─────────────────────────────────────────────────────────────
// CONSTANTS
// ─────────────────────────────────────────────────────────────

const MARKET_CATS = [
  { id: 'all',                   label: 'All Products',     emoji: '🛒' },
  { id: 'building_materials',    label: 'Building Materials',emoji: '🧱' },
  { id: 'furniture_fittings',    label: 'Furniture',         emoji: '🪑' },
  { id: 'home_appliances',       label: 'Appliances',        emoji: '📺' },
  { id: 'interior_decor',        label: 'Décor & Finishing', emoji: '🎨' },
  { id: 'plumbing_sanitary',     label: 'Plumbing',          emoji: '🚿' },
  { id: 'electrical_lighting',   label: 'Electrical',        emoji: '💡' },
  { id: 'garden_outdoor',        label: 'Garden & Outdoor',  emoji: '🌿' },
  { id: 'security_safety',       label: 'Security',          emoji: '🔐' },
  { id: 'cleaning_maintenance',  label: 'Cleaning',          emoji: '🧹' },
  { id: 'professional_services', label: 'Services',          emoji: '👷' },
];

const CONDITIONS     = ['Any', 'Brand New', 'Fairly Used', 'Open Box'];
const DELIVERY_OPTS  = ['Any', 'Delivery Available', 'Pickup Only', 'Pickup or Delivery'];
const SORT_OPTIONS   = [
  { value: 'newest',       label: 'Newest First'      },
  { value: 'price_asc',    label: 'Price: Low → High' },
  { value: 'price_desc',   label: 'Price: High → Low' },
  { value: 'popular',      label: 'Most Viewed'       },
  { value: 'best_selling', label: 'Best Selling'      },
  { value: 'rating',       label: 'Highest Rated'     },
];
const NIGERIA_STATES = [
  'All States','Lagos','Abuja','Rivers','Ogun','Oyo','Kano','Delta',
  'Anambra','Edo','Enugu','Kaduna','Imo','Akwa Ibom',
];

// Products loaded from context in Marketplace component below

const PER_PAGE = 12;

const UNIT_LABEL = {
  per_unit:'/ unit', per_bag:'/ bag', per_carton:'/ carton',
  per_sqm:'/ m²', per_set:'/ set', per_metre:'/ m',
  per_tonne:'/ tonne', bulk_price:'LOT',
};
const CONDITION_LABEL = { new:'Brand New', fairly_used:'Fairly Used', open_box:'Open Box' };
const DELIVERY_COLOR = {
  both:     'bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400',
  delivery: 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
  pickup:   'bg-gray-100 dark:bg-white/10 text-gray-500 dark:text-white/50',
};

// ─────────────────────────────────────────────────────────────
// PRODUCT RESULT CARD
// ─────────────────────────────────────────────────────────────

function ProductResultCard({ product, saved, onToggleSave }) {
  const { symbol } = useCurrency();
  const cat = MARKET_CATS.find(c => c.id === product.category);

  return (
    <div className="overflow-hidden transition-all bg-white border border-gray-100 dark:bg-brand-charcoal-dark rounded-2xl dark:border-white/10 hover:border-brand-gold/40 hover:shadow-md">
      {/* Image area */}
      <div className="relative flex items-center justify-center text-5xl aspect-square bg-brand-gray-soft dark:bg-white/5">
        {cat?.emoji || '📦'}
        <button type="button" onClick={onToggleSave}
          aria-label={saved ? 'Unsave' : 'Save'}
          className="absolute flex items-center justify-center w-8 h-8 transition-all rounded-full shadow-md top-2 right-2 bg-white/90 dark:bg-brand-charcoal-dark/90 hover:scale-110">
          <Heart size={14} className={saved ? 'text-red-500 fill-red-500' : 'text-gray-400'} />
        </button>
        <span className="absolute top-2 left-2 px-2 py-0.5 rounded-full text-[10px] font-bold bg-white/90 dark:bg-brand-charcoal-dark/90 text-brand-charcoal dark:text-white">
          {CONDITION_LABEL[product.condition]}
        </span>
      </div>

      <div className="p-4">
        <p className="text-[10px] font-bold text-brand-gold uppercase tracking-wider mb-1">{cat?.label}</p>
        <h3 className="mb-2 text-sm font-bold leading-tight text-brand-charcoal-dark dark:text-white line-clamp-2">
          {product.title}
        </h3>

        {/* Seller */}
        <div className="flex items-center gap-1.5 mb-2">
          <p className="text-xs text-gray-500 truncate dark:text-white/60">{product.seller.name}</p>
          {product.seller.verified && (
            <ShieldCheck size={11} className="text-emerald-500 shrink-0" />
          )}
        </div>

        {/* Delivery badge */}
        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold mb-3 ${DELIVERY_COLOR[product.deliveryOption] || DELIVERY_COLOR.pickup}`}>
          <Truck size={9} />
          {product.deliveryOption === 'both' ? 'Pickup / Delivery'
          : product.deliveryOption === 'delivery' ? 'Delivery'
          : 'Pickup Only'}
        </span>

        {/* Price + CTA */}
        <div className="flex items-end justify-between gap-2">
          <div>
            <p className="text-base font-extrabold font-display text-brand-charcoal-dark dark:text-white">
              {symbol}{product.price.toLocaleString()}
            </p>
            <p className="text-[11px] text-gray-400">
              {UNIT_LABEL[product.pricingUnit] || '/ unit'}
              {product.negotiable && ' · Negotiable'}
            </p>
          </div>
          <Link to={`/product/${product.id}`}
            className="px-3 py-1.5 bg-brand-gold hover:bg-brand-gold-dark text-white text-xs font-bold rounded-xl transition-colors shrink-0">
            View
          </Link>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// FILTER DRAWER
// ─────────────────────────────────────────────────────────────

function MarketplaceFilterDrawer({ filters, onChange, onClose }) {
  const { symbol } = useCurrency();
  const [local, setLocal] = useState(filters);
  const set = (k, v) => setLocal(f => ({ ...f, [k]: v }));

  return (
    <div className="fixed inset-0 z-50 flex">
      <button type="button" className="flex-1 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="flex flex-col w-full h-full max-w-sm overflow-y-auto bg-white shadow-2xl dark:bg-brand-charcoal-dark">
        <div className="sticky top-0 z-10 flex items-center justify-between px-5 py-4 bg-white border-b border-gray-100 dark:border-white/10 dark:bg-brand-charcoal-dark">
          <h2 className="text-lg font-extrabold font-display text-brand-charcoal-dark dark:text-white">Filter Products</h2>
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

          <div>
            <label className="mb-2 label-sm">Condition</label>
            <div className="flex flex-wrap gap-2">
              {CONDITIONS.map(c => (
                <button key={c} type="button" onClick={() => set('condition', c)}
                  className={`px-3 py-1.5 rounded-xl border-2 text-xs font-bold transition-all ${local.condition === c ? 'border-brand-gold bg-brand-gold/10 text-brand-charcoal-dark dark:text-white' : 'border-gray-200 dark:border-white/10 bg-white dark:bg-white/5 text-gray-500 dark:text-white/60'}`}>
                  {c}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="mb-2 label-sm">Delivery / Pickup</label>
            <div className="space-y-2">
              {DELIVERY_OPTS.map(d => (
                <button key={d} type="button" onClick={() => set('delivery', d)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border-2 text-sm font-semibold text-left transition-all ${local.delivery === d ? 'border-brand-gold bg-brand-gold/10 text-brand-charcoal-dark dark:text-white' : 'border-gray-200 dark:border-white/10 bg-white dark:bg-white/5 text-gray-600 dark:text-white/70'}`}>
                  <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 ${local.delivery === d ? 'border-brand-gold' : 'border-gray-300'}`}>
                    {local.delivery === d && <div className="w-2 h-2 rounded-full bg-brand-gold" />}
                  </div>
                  {d}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-3 p-3.5 bg-brand-gray-soft dark:bg-white/5 rounded-xl">
            <input type="checkbox" id="mkt-verified" checked={local.verified}
              onChange={e => set('verified', e.target.checked)}
              className="w-4 h-4 accent-brand-gold" />
            <label htmlFor="mkt-verified" className="flex items-center gap-2 text-sm font-semibold cursor-pointer text-brand-charcoal-dark dark:text-white">
              <ShieldCheck size={14} className="text-emerald-500" />
              Verified sellers only
            </label>
          </div>
        </div>

        <div className="flex gap-3 px-5 py-4 border-t border-gray-100 dark:border-white/10">
          <button type="button"
            onClick={() => setLocal({ category:'all', state:'All States', minPrice:'', maxPrice:'', condition:'Any', delivery:'Any', verified:false })}
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

export default function Marketplace() {
  const { symbol }  = useCurrency();
  const { products } = useProperty();
  const [params]    = useSearchParams();

  const [keyword,     setKeyword]     = useState(params.get('q') || '');
  const [showFilters, setShowFilters] = useState(false);
  const [sortBy,      setSortBy]      = useState('newest');
  const [showSort,    setShowSort]    = useState(false);
  const [page,        setPage]        = useState(1);
  const [savedIds,    setSavedIds]    = useState(new Set());
  const [cartOpen,   setCartOpen]    = useState(false);

  const [filters, setFilters] = useState({
    category:  params.get('category') || 'all',
    state:     'All States',
    minPrice:  '',
    maxPrice:  '',
    condition: 'Any',
    delivery:  'Any',
    verified:  false,
  });

  const filtered = useMemo(() => {
    let list = [...products];

    if (filters.category !== 'all')
      list = list.filter(p => p.category === filters.category);

    if (keyword.trim())
      list = list.filter(p =>
        p.title.toLowerCase().includes(keyword.toLowerCase()) ||
        p.seller.name.toLowerCase().includes(keyword.toLowerCase())
      );

    if (filters.state !== 'All States')
      list = list.filter(p => p.state === filters.state);

    if (filters.minPrice)
      list = list.filter(p => p.price >= Number(filters.minPrice));

    if (filters.maxPrice)
      list = list.filter(p => p.price <= Number(filters.maxPrice));

    if (filters.condition !== 'Any') {
      const condMap = { 'Brand New': 'new', 'Fairly Used': 'fairly_used', 'Open Box': 'open_box' };
      list = list.filter(p => p.condition === condMap[filters.condition]);
    }

    if (filters.delivery !== 'Any') {
      const dlvMap = { 'Delivery Available': 'delivery', 'Pickup Only': 'pickup', 'Pickup or Delivery': 'both' };
      list = list.filter(p => p.deliveryOption === dlvMap[filters.delivery]);
    }

    if (filters.verified)
      list = list.filter(p => p.seller.verified);

    if (sortBy === 'price_asc')  list.sort((a, b) => a.price - b.price);
    if (sortBy === 'price_desc') list.sort((a, b) => b.price - a.price);
    if (sortBy === 'popular')    list.sort((a, b) => b.views - a.views);

    return list;
  }, [products, filters, keyword, sortBy]);

  const totalPages = Math.ceil(filtered.length / PER_PAGE);
  const paginated  = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);
  const toggleSave  = (id) => setSavedIds(s => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n; });
  const activeCount = [filters.state !== 'All States', !!filters.minPrice, !!filters.maxPrice, filters.condition !== 'Any', filters.delivery !== 'Any', filters.verified].filter(Boolean).length;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900/30">
      <PageSEO
        title="Building Materials & Real Estate Products Marketplace"
        description="Shop cement, tiles, furniture, pipes and building materials at wholesale prices. Trusted sellers across Nigeria with delivery options."
        url="/marketplace"
      />

      {/* Search bar */}
      <div className="sticky top-0 z-30 px-4 py-3 bg-white border-b border-gray-100 shadow-sm dark:bg-brand-charcoal-dark dark:border-white/10">
        <div className="flex items-center max-w-6xl gap-2 mx-auto">
          <div className="relative flex-1">
            <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
            <input type="search" value={keyword}
              onChange={e => { setKeyword(e.target.value); setPage(1); }}
              placeholder="Search products, brands, suppliers…"
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-brand-gray-soft dark:bg-white/10 text-sm font-body text-brand-charcoal-dark dark:text-white placeholder:text-gray-400 border border-transparent focus:border-brand-gold outline-none transition-all"
            />
          </div>
          <button type="button" onClick={() => setShowFilters(true)}
            className={`flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl border-2 text-sm font-bold transition-all shrink-0
              ${activeCount > 0 ? 'border-brand-gold bg-brand-gold/10 text-brand-charcoal-dark dark:text-white' : 'border-gray-200 dark:border-white/20 bg-white dark:bg-white/5 text-brand-charcoal dark:text-white hover:border-gray-300'}`}>
            <Filter size={14} />Filters
            {activeCount > 0 && <span className="w-5 h-5 bg-brand-gold text-white text-[10px] font-bold rounded-full flex items-center justify-center">{activeCount}</span>}
          </button>
          <CartIcon onClick={() => setCartOpen(true)} />
        </div>
      </div>

      {/* Cart drawer */}
      {cartOpen && <CartDrawer onClose={() => setCartOpen(false)} />}

      <div className="max-w-6xl px-4 py-5 pb-24 mx-auto lg:pb-10">

        {/* Category strip */}
        <div className="flex gap-2 pb-1 mb-5 overflow-x-auto scrollbar-none">
          {MARKET_CATS.map(({ id, label, emoji }) => (
            <button key={id} type="button"
              onClick={() => { setFilters(f => ({ ...f, category: id })); setPage(1); }}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-xl border-2 text-xs font-bold whitespace-nowrap transition-all shrink-0
                ${filters.category === id
                  ? 'border-brand-gold bg-brand-gold text-white'
                  : 'border-gray-200 dark:border-white/10 bg-white dark:bg-white/5 text-gray-600 dark:text-white/70 hover:border-brand-gold/50'}`}>
              {emoji} {label}
            </button>
          ))}
        </div>

        {/* Building materials: preference group sub-filters */}
        {filters.category === 'building_materials' && (
          <div className="flex gap-2 pb-1 mb-4 overflow-x-auto scrollbar-none">
            {getPreferenceGroupList().map(({ key, label, emoji, productCount }) => (
              <button key={key} type="button"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-200 dark:border-white/10
                  text-[11px] font-bold whitespace-nowrap bg-white dark:bg-white/5 text-gray-600 dark:text-white/70
                  hover:border-brand-gold/50 hover:bg-brand-gold/5 transition-all shrink-0">
                {emoji} {label}
                <span className="text-[9px] text-gray-400 font-normal">({productCount})</span>
              </button>
            ))}
          </div>
        )}

        {/* Marketplace policy notice */}
        <div className="flex items-center gap-2 p-3 mb-5 border bg-amber-50 dark:bg-amber-500/10 rounded-2xl border-amber-100 dark:border-amber-500/20">
          <Package size={14} className="text-amber-500 shrink-0" />
          <p className="text-xs leading-relaxed text-amber-700 dark:text-amber-300">
            <strong>Real estate products only.</strong> Building materials, fittings, furniture & construction goods. General consumer goods are not allowed.
          </p>
        </div>

        {/* Results header + sort */}
        <div className="flex items-center justify-between gap-3 mb-5">
          <p className="text-sm font-bold text-brand-charcoal-dark dark:text-white">
            {filtered.length.toLocaleString()} product{filtered.length !== 1 ? 's' : ''}
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
            <p className="mb-4 text-5xl">📦</p>
            <p className="mb-2 text-xl font-extrabold font-display text-brand-charcoal-dark dark:text-white">No products found</p>
            <p className="mb-5 text-sm text-gray-400">Try a different category or adjust filters.</p>
            <button type="button"
              onClick={() => { setFilters({ category:'all', state:'All States', minPrice:'', maxPrice:'', condition:'Any', delivery:'Any', verified:false }); setKeyword(''); }}
              className="btn-primary">Clear Filters</button>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
            {paginated.map(prod => (
              <ProductResultCard
                key={prod.id}
                product={prod}
                saved={savedIds.has(prod.id)}
                onToggleSave={() => toggleSave(prod.id)}
              />
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
        <MarketplaceFilterDrawer
          filters={filters}
          onChange={f => { setFilters(f); setPage(1); }}
          onClose={() => setShowFilters(false)}
        />
      )}
    </div>
  );
}