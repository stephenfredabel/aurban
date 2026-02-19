import { useState, useMemo, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  Store, BadgeCheck, Star, MapPin, MessageSquare,
  ChevronLeft, Search, ShoppingCart, Package,
} from 'lucide-react';
import { useProperty } from '../context/PropertyContext.jsx';
import { useCurrency } from '../hooks/useCurrency.js';
import { PRODUCT_CATEGORY_MAP } from '../data/categoryFields.js';
import Badge from '../components/ui/Badge.jsx';

/* ════════════════════════════════════════════════════════════
   VENDOR STORE — Public storefront for a marketplace seller
   Route: /vendor/:id
════════════════════════════════════════════════════════════ */

const CONDITION_STYLES = {
  new:         'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600',
  refurbished: 'bg-amber-50 dark:bg-amber-500/10 text-amber-600',
  used:        'bg-gray-100 dark:bg-white/10 text-gray-500',
};

export default function VendorStore() {
  const { id } = useParams();
  const { getProductsBySeller } = useProperty();
  const { symbol } = useCurrency();
  const [search, setSearch] = useState('');
  const [selectedCat, setSelectedCat] = useState('all');

  // Get seller's products
  const sellerProducts = useMemo(() => getProductsBySeller(id), [id, getProductsBySeller]);

  // Seller info from first product
  const seller = useMemo(() => {
    const p = sellerProducts[0];
    if (!p) return null;
    return {
      id: p.providerId,
      name: p.providerName,
      avatar: p.providerAvatar,
      rating: p.providerRating,
      reviews: p.providerReviews,
      verified: p.providerVerified,
      tier: p.providerTier,
      location: p.state,
    };
  }, [sellerProducts]);

  useEffect(() => {
    document.title = seller ? `${seller.name} — Store — Aurban` : 'Store — Aurban';
  }, [seller]);

  // Filter categories from seller's products
  const categories = useMemo(() => {
    const cats = new Set(sellerProducts.map(p => p.category));
    return Array.from(cats);
  }, [sellerProducts]);

  // Filter products
  const filtered = useMemo(() => {
    let list = sellerProducts;
    if (selectedCat !== 'all') list = list.filter(p => p.category === selectedCat);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(p => p.title?.toLowerCase().includes(q) || p.description?.toLowerCase().includes(q));
    }
    return list;
  }, [sellerProducts, selectedCat, search]);

  if (!seller) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
        <Store size={48} className="mb-4 text-gray-200 dark:text-gray-700" />
        <p className="mb-2 text-lg font-bold text-brand-charcoal-dark dark:text-white">Store not found</p>
        <p className="mb-5 text-sm text-gray-400">This vendor may not exist or has no listed products</p>
        <Link to="/marketplace" className="inline-flex items-center gap-1.5 px-5 py-2.5 text-sm font-bold text-white rounded-xl bg-brand-gold hover:bg-brand-gold-dark">
          Browse Marketplace
        </Link>
      </div>
    );
  }

  const initial = seller.name?.charAt(0) || 'S';
  const tierVariant = seller.tier === 3 ? 'tier3' : seller.tier === 2 ? 'tier2' : 'tier1';

  return (
    <div className="min-h-screen bg-white dark:bg-brand-charcoal-dark">
      {/* ── Back nav ── */}
      <div className="sticky top-0 z-20 bg-white border-b border-gray-100 dark:bg-brand-charcoal-dark dark:border-white/10">
        <div className="flex items-center gap-3 px-4 py-3 mx-auto max-w-5xl">
          <Link to="/marketplace" className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-brand-gold transition-colors">
            <ChevronLeft size={16} /> Marketplace
          </Link>
        </div>
      </div>

      <div className="px-4 mx-auto max-w-5xl">
        {/* ── Store banner ── */}
        <div className="relative p-6 mt-6 overflow-hidden text-white bg-brand-charcoal-dark rounded-2xl">
          <div className="absolute top-0 rounded-full -right-4 w-32 h-32 bg-brand-gold/10 -translate-y-1/3" />
          <div className="relative z-10">
            <div className="flex items-center gap-4 mb-4">
              {seller.avatar ? (
                <img src={seller.avatar} alt={seller.name} className="object-cover w-16 h-16 rounded-2xl" />
              ) : (
                <div className="flex items-center justify-center w-16 h-16 text-2xl font-bold rounded-2xl bg-purple-500/20 text-purple-400 shrink-0">
                  {initial}
                </div>
              )}
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <h1 className="text-xl font-extrabold font-display">{seller.name}</h1>
                  {seller.verified && <BadgeCheck size={18} className="text-brand-gold" />}
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={tierVariant} size="sm" />
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-400 font-semibold">
                    Seller
                  </span>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-4 text-xs text-gray-400">
              {seller.rating && (
                <span className="flex items-center gap-1">
                  <Star size={12} className="text-brand-gold fill-brand-gold" />
                  <span className="font-semibold text-white">{seller.rating}</span> ({seller.reviews} reviews)
                </span>
              )}
              {seller.location && (
                <span className="flex items-center gap-1">
                  <MapPin size={12} /> {seller.location}
                </span>
              )}
              <span className="flex items-center gap-1">
                <Package size={12} /> {sellerProducts.length} product{sellerProducts.length !== 1 ? 's' : ''}
              </span>
            </div>
          </div>
        </div>

        {/* ── Actions ── */}
        <div className="flex gap-3 mt-4">
          <Link to={`/dashboard/messages?provider=${seller.id}&type=store`}
            className="flex items-center gap-2 px-5 py-2.5 text-sm font-bold border border-gray-200 dark:border-white/10 rounded-xl text-brand-charcoal-dark dark:text-white hover:border-brand-gold transition-colors">
            <MessageSquare size={14} /> Message Seller
          </Link>
        </div>

        {/* ── Search + Filters ── */}
        <div className="mt-6 mb-4">
          <div className="relative mb-3">
            <Search size={14} className="absolute text-gray-400 left-3 top-3" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search this store..."
              className="w-full py-2.5 pl-9 pr-4 text-sm border border-gray-200 dark:border-white/10 rounded-xl bg-white dark:bg-white/5 text-brand-charcoal-dark dark:text-white placeholder:text-gray-300 focus:ring-2 focus:ring-brand-gold/30 focus:border-brand-gold outline-none"
            />
          </div>
          <div className="flex gap-2 overflow-x-auto">
            <button
              onClick={() => setSelectedCat('all')}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors whitespace-nowrap ${
                selectedCat === 'all' ? 'bg-brand-gold text-white' : 'bg-gray-100 dark:bg-white/5 text-gray-500'
              }`}
            >
              All ({sellerProducts.length})
            </button>
            {categories.map(cat => {
              const catDef = PRODUCT_CATEGORY_MAP[cat];
              const count = sellerProducts.filter(p => p.category === cat).length;
              return (
                <button key={cat} onClick={() => setSelectedCat(cat)}
                  className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors whitespace-nowrap ${
                    selectedCat === cat ? 'bg-brand-gold text-white' : 'bg-gray-100 dark:bg-white/5 text-gray-500'
                  }`}>
                  {catDef?.emoji || '📦'} {catDef?.label || cat} ({count})
                </button>
              );
            })}
          </div>
        </div>

        {/* ── Product Grid ── */}
        {filtered.length === 0 ? (
          <div className="py-16 text-center">
            <ShoppingCart size={40} className="mx-auto mb-3 text-gray-200 dark:text-gray-700" />
            <p className="text-sm text-gray-400">No products match your search</p>
          </div>
        ) : (
          <div className="grid gap-4 pb-12 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map(product => {
              const catDef = PRODUCT_CATEGORY_MAP[product.category];
              const condStyle = CONDITION_STYLES[product.condition] || CONDITION_STYLES.new;
              return (
                <Link
                  key={product.id}
                  to={`/product/${product.id}`}
                  className="block overflow-hidden transition-shadow bg-white border border-gray-100 dark:border-white/10 rounded-2xl dark:bg-gray-900 hover:shadow-md"
                >
                  {/* Image / emoji placeholder */}
                  <div className="flex items-center justify-center h-40 text-4xl bg-brand-gray-soft dark:bg-white/5">
                    {product.images?.[0] ? (
                      <img src={product.images[0]} alt="" className="object-cover w-full h-full" />
                    ) : (
                      catDef?.emoji || '📦'
                    )}
                  </div>
                  <div className="p-4">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`px-1.5 py-0.5 text-[9px] font-bold rounded-full capitalize ${condStyle}`}>
                        {product.condition || 'New'}
                      </span>
                      {product.subcategory && (
                        <span className="px-1.5 py-0.5 text-[9px] font-bold rounded-full bg-gray-100 dark:bg-white/5 text-gray-500">
                          {product.subcategory}
                        </span>
                      )}
                    </div>
                    <h3 className="mt-1 text-sm font-bold text-brand-charcoal-dark dark:text-white line-clamp-2">
                      {product.title}
                    </h3>
                    <p className="mt-2 text-lg font-extrabold text-brand-gold">
                      {symbol}{product.price?.toLocaleString()}
                    </p>
                    {product.stockQuantity > 0 && (
                      <p className="mt-1 text-[10px] text-gray-400">{product.stockQuantity} in stock</p>
                    )}
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
