import { useState, useCallback, useMemo, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Heart, Share2, ShoppingCart, Minus, Plus,
  Star, BadgeCheck, MessageSquare, Truck, Shield,
  Package, Eye, Clock, CheckCircle2,
} from 'lucide-react';
import { useProperty }        from '../context/PropertyContext.jsx';
import { useCurrency }        from '../hooks/useCurrency.js';
import ImageGallery            from '../components/ImageGallery.jsx';
import ProductSpecsGrid        from '../components/marketplace/ProductSpecsGrid.jsx';
import SellerInfoCard          from '../components/marketplace/SellerInfoCard.jsx';
import DeliveryInfoCard        from '../components/marketplace/DeliveryInfoCard.jsx';
import { PRODUCT_CATEGORY_MAP, getRefundBadge } from '../data/categoryFields.js';
import { getProductLabel, PRODUCT_PREFERENCES } from '../data/productPreferences.js';

/* ── Helpers ─────────────────────────────────────────────── */
const UNIT_LABEL = {
  per_unit:'/ unit', per_bag:'/ bag', per_carton:'/ carton',
  per_sqm:'/ m²', per_set:'/ set', per_metre:'/ m',
  per_tonne:'/ tonne', per_roll:'/ roll', bulk_price:'LOT',
};

const CONDITION_BADGE = {
  new:         { label: 'Brand New',     bg: 'bg-emerald-50 dark:bg-emerald-500/10', text: 'text-emerald-600 dark:text-emerald-400' },
  fairly_used: { label: 'Fairly Used',   bg: 'bg-amber-50 dark:bg-amber-500/10',     text: 'text-amber-600 dark:text-amber-400' },
  open_box:    { label: 'Open Box',      bg: 'bg-blue-50 dark:bg-blue-500/10',       text: 'text-blue-600 dark:text-blue-400' },
};

function timeAgo(dateStr) {
  try {
    const diff = Math.floor((Date.now() - new Date(dateStr)) / 86400000);
    if (diff < 1) return 'today';
    if (diff < 7) return `${diff}d ago`;
    if (diff < 30) return `${Math.floor(diff / 7)}w ago`;
    return new Date(dateStr).toLocaleDateString('en-NG', { month: 'short', year: 'numeric' });
  } catch { return ''; }
}

/* ════════════════════════════════════════════════════════════
   PRODUCT DETAIL PAGE
   Full rewrite — follows Property.jsx 2-column layout pattern
════════════════════════════════════════════════════════════ */
export default function ProductDetail() {
  const { id }      = useParams();
  const navigate    = useNavigate();
  const { getProductById, filterProducts, toggleWishlist, isWishlisted } = useProperty();
  const { format, symbol } = useCurrency();

  const [qty, setQty]               = useState(1);
  const [showAllDesc, setShowAllDesc] = useState(false);
  const [addedToCart, setAddedToCart]  = useState(false);
  const [selectedPrefs, setSelectedPrefs] = useState({});

  const product = getProductById(id);

  // Preference template lookup — finds the product definition in PRODUCT_PREFERENCES
  const prefTemplate = useMemo(() => {
    if (!product?.preferences?.product) return null;
    for (const group of Object.values(PRODUCT_PREFERENCES)) {
      if (group.products[product.preferences.product]) {
        return group.products[product.preferences.product];
      }
    }
    return null;
  }, [product]);

  // Initialize selectedPrefs from the seller's listed attributes
  useEffect(() => {
    if (product?.preferences?.attributes) {
      setSelectedPrefs({ ...product.preferences.attributes });
    }
  }, [product?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  // Similar products
  const similar = filterProducts({ category: product?.category })
    .filter(p => String(p.id) !== String(id))
    .slice(0, 4);

  /* ── Message seller ─────────────────────────────────────── */
  const handleMessage = useCallback(() => {
    if (!product) return;
    const params = new URLSearchParams({
      listing:      product.id,
      provider:     product.providerId || 'seller_1',
      providerName: product.providerName || 'Seller',
      title:        product.title,
      type:         'product',
    });
    navigate(`/dashboard/messages?${params.toString()}`);
  }, [product, navigate]);

  /* ── Add to cart (session storage for now) ───────────────── */
  const handleAddToCart = useCallback(() => {
    if (!product) return;
    try {
      const raw = sessionStorage.getItem('aurban_cart');
      const cart = raw ? JSON.parse(raw) : { items: [] };
      // Build preference key for variant-aware cart matching
      const prefKey = product.preferences?.product
        ? JSON.stringify(selectedPrefs)
        : null;
      const existing = cart.items.find(i =>
        i.productId === product.id &&
        (!prefKey || JSON.stringify(i.preferences?.attributes || {}) === prefKey)
      );
      if (existing) {
        existing.quantity += qty;
      } else {
        cart.items.push({
          productId: product.id,
          sellerId: product.providerId,
          sellerName: product.providerName,
          title: product.title,
          image: product.images?.[0] || null,
          price: product.price,
          pricingUnit: product.pricingUnit,
          quantity: qty,
          deliveryOption: product.deliveryOption,
          deliveryFee: product.deliveryFee || 0,
          addedAt: new Date().toISOString(),
          ...(product.preferences?.product && {
            preferences: {
              product: product.preferences.product,
              attributes: { ...selectedPrefs },
            },
          }),
        });
      }
      cart.updatedAt = new Date().toISOString();
      sessionStorage.setItem('aurban_cart', JSON.stringify(cart));
      setAddedToCart(true);
      setTimeout(() => setAddedToCart(false), 2000);
    } catch {}
  }, [product, qty]);

  /* ── Not found ──────────────────────────────────────────── */
  if (!product) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] px-4">
        <Package size={48} className="mb-4 text-gray-200" />
        <h1 className="mb-2 text-xl font-extrabold font-display text-brand-charcoal-dark dark:text-white">Product Not Found</h1>
        <p className="mb-5 text-sm text-gray-400">This product may have been removed or is no longer available.</p>
        <Link to="/marketplace" className="inline-flex items-center gap-1.5 text-sm font-bold text-brand-gold hover:text-brand-gold-dark">
          <ArrowLeft size={14} /> Back to Marketplace
        </Link>
      </div>
    );
  }

  const {
    title, description, price, pricingUnit, pricePeriod, condition,
    category, subcategory, images, categoryFields,
    minOrder, maxOrder, stockQuantity, bulkPricing,
    negotiable, inStock, views, orderCount,
    providerName, providerRating, providerReviews,
    reviews, postedAt,
  } = product;

  const catDef = PRODUCT_CATEGORY_MAP[category];
  const condBadge = CONDITION_BADGE[condition] || CONDITION_BADGE.new;
  const refundBadge = getRefundBadge(category);
  const unitLabel = UNIT_LABEL[pricingUnit] || pricePeriod || '';
  const lineTotal = price * qty;
  const saved = isWishlisted(id);
  const descTruncated = description?.length > 400 && !showAllDesc;

  // Bulk pricing match
  const activeBulk = bulkPricing?.length
    ? [...bulkPricing].sort((a, b) => b.minQty - a.minQty).find(t => qty >= t.minQty)
    : null;
  const effectivePrice = activeBulk ? Math.round(price * (1 - activeBulk.discount / 100)) : price;

  return (
    <div className="pb-28 lg:pb-8 dark:bg-gray-950">

      {/* ═══ 1. BACK NAV ═══════════════════════════════════════ */}
      <div className="px-4 pt-4 pb-2 mx-auto max-w-6xl">
        <Link
          to="/marketplace"
          className="inline-flex items-center gap-1.5 text-sm text-brand-charcoal dark:text-gray-400 hover:text-brand-charcoal-dark dark:hover:text-white transition-colors"
        >
          <ArrowLeft size={16} /> Marketplace
        </Link>
      </div>

      {/* ═══ 2. PHOTO GALLERY ══════════════════════════════════ */}
      <div className="relative">
        <ImageGallery images={images} title={title} />

        {/* Condition badge */}
        <span className={`absolute top-4 left-4 lg:left-8 z-10 px-2.5 py-1 rounded-full text-[11px] font-bold ${condBadge.bg} ${condBadge.text}`}>
          {condBadge.label}
        </span>

        {/* Share + Save */}
        <div className="absolute z-10 flex gap-2 top-4 right-4 lg:right-8">
          <button
            type="button"
            onClick={() => navigator.share?.({ title, url: window.location.href })}
            className="flex items-center justify-center text-gray-600 transition-colors rounded-full shadow w-9 h-9 bg-white/90 backdrop-blur-sm hover:text-brand-charcoal"
            aria-label="Share"
          >
            <Share2 size={15} />
          </button>
          <button
            type="button"
            onClick={() => toggleWishlist(product)}
            className={`flex items-center justify-center rounded-full shadow w-9 h-9 bg-white/90 backdrop-blur-sm transition-colors ${saved ? 'text-red-500' : 'text-gray-600 hover:text-red-500'}`}
            aria-label={saved ? 'Remove from wishlist' : 'Save'}
          >
            <Heart size={15} className={saved ? 'fill-red-500' : ''} />
          </button>
        </div>
      </div>

      {/* ═══ 3. MAIN CONTENT — 2 column ═══════════════════════ */}
      <div className="grid max-w-6xl gap-8 px-4 pt-5 mx-auto lg:grid-cols-3">

        {/* ── LEFT COLUMN (details) ───────────────────────────── */}
        <div className="space-y-6 lg:col-span-2">

          {/* Title + category + meta */}
          <div>
            {catDef && (
              <p className="text-[11px] font-bold text-brand-gold uppercase tracking-wider mb-1">
                {catDef.emoji} {catDef.label}
                {subcategory && <span className="text-gray-400"> / {subcategory}</span>}
              </p>
            )}
            <h1 className="text-xl font-extrabold leading-tight lg:text-2xl font-display text-brand-charcoal-dark dark:text-white">
              {title}
            </h1>
            <div className="flex flex-wrap items-center gap-3 mt-2 text-xs text-gray-400">
              {views && (
                <span className="flex items-center gap-1">
                  <Eye size={12} /> {views.toLocaleString()} views
                </span>
              )}
              {orderCount > 0 && (
                <span className="flex items-center gap-1">
                  <Package size={12} /> {orderCount} sold
                </span>
              )}
              {postedAt && (
                <span className="flex items-center gap-1">
                  <Clock size={12} /> Listed {timeAgo(postedAt)}
                </span>
              )}
            </div>
          </div>

          {/* Price — desktop */}
          <div className="hidden lg:block">
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-extrabold font-display text-brand-charcoal-dark dark:text-white">
                {symbol}{effectivePrice.toLocaleString()}
              </span>
              {unitLabel && (
                <span className="text-sm text-gray-400">{unitLabel}</span>
              )}
              {negotiable && (
                <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-brand-gold/10 text-brand-gold">Negotiable</span>
              )}
            </div>
            {activeBulk && (
              <p className="mt-1 text-xs text-emerald-500">
                Bulk discount applied: {activeBulk.discount}% off (min {activeBulk.minQty} units)
              </p>
            )}
            {bulkPricing?.length > 0 && !activeBulk && (
              <div className="mt-1 text-xs text-gray-400">
                Bulk discounts: {bulkPricing.map(b => `${b.minQty}+: ${b.discount}% off`).join(' · ')}
              </div>
            )}
          </div>

          {/* Description */}
          <div>
            <h2 className="mb-2 font-bold font-display text-brand-charcoal-dark dark:text-white">Description</h2>
            <p className="text-sm leading-relaxed text-gray-600 dark:text-gray-300 whitespace-pre-line">
              {descTruncated ? description.slice(0, 400) + '…' : description}
            </p>
            {description?.length > 400 && (
              <button
                type="button"
                onClick={() => setShowAllDesc(v => !v)}
                className="mt-2 text-xs font-bold text-brand-gold hover:text-brand-gold-dark"
              >
                {showAllDesc ? 'Show less' : 'Read more'}
              </button>
            )}
          </div>

          {/* Specifications */}
          <ProductSpecsGrid category={category} categoryFields={categoryFields} />

          {/* Structured Preferences — interactive variant selector */}
          {product.preferences?.product && prefTemplate && (
            <div>
              <h2 className="mb-1 font-bold font-display text-brand-charcoal-dark dark:text-white">
                Product Specifications
              </h2>
              <p className="mb-3 text-xs text-gray-400">Select your preferred specifications</p>
              <div className="overflow-hidden border border-gray-100 dark:border-white/10 rounded-2xl">
                <div className="divide-y divide-gray-100 dark:divide-white/10">
                  {/* Product type (non-editable) */}
                  <div className="flex items-center gap-4 px-4 py-3 text-sm bg-brand-gold/5">
                    <span className="w-1/3 font-semibold text-gray-500 dark:text-gray-400">Product</span>
                    <span className="flex-1 font-bold text-brand-charcoal-dark dark:text-white">
                      {getProductLabel(product.preferences.product)}
                    </span>
                  </div>
                  {/* Interactive attribute dropdowns */}
                  {Object.entries(prefTemplate.preferences).map(([attrKey, attrDef], i) => (
                    <div key={attrKey}
                      className={`flex items-center gap-4 px-4 py-2.5 text-sm
                        ${i % 2 === 0 ? 'bg-gray-50/50 dark:bg-white/[0.02]' : 'bg-white dark:bg-transparent'}`}>
                      <span className="w-1/3 font-semibold text-gray-500 dark:text-gray-400">
                        {attrDef.label}
                      </span>
                      <div className="flex-1">
                        <select
                          value={selectedPrefs[attrKey] || ''}
                          onChange={(e) => setSelectedPrefs(prev => ({ ...prev, [attrKey]: e.target.value }))}
                          className="w-full px-3 py-1.5 text-sm bg-white dark:bg-gray-800 border border-gray-200 dark:border-white/10 rounded-lg text-brand-charcoal-dark dark:text-white focus:ring-2 focus:ring-brand-gold/30 focus:border-brand-gold outline-none transition-all cursor-pointer"
                        >
                          <option value="">Select {attrDef.label}</option>
                          {attrDef.options.map((opt) => (
                            <option key={String(opt)} value={String(opt)}>{String(opt)}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              {/* Selected attributes summary chips */}
              {Object.keys(selectedPrefs).filter(k => selectedPrefs[k]).length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-3">
                  {Object.entries(selectedPrefs).filter(([, v]) => v).map(([key, val]) => {
                    const label = prefTemplate.preferences[key]?.label || key.replace(/_/g, ' ');
                    return (
                      <span key={key} className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-medium bg-brand-gold/10 text-brand-charcoal-dark dark:text-brand-gold rounded-full">
                        {label}: {val}
                      </span>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* Static fallback for products with preferences but no template match */}
          {product.preferences?.product && !prefTemplate && (
            <div>
              <h2 className="mb-3 font-bold font-display text-brand-charcoal-dark dark:text-white">
                Product Specifications
              </h2>
              <div className="overflow-hidden border border-gray-100 dark:border-white/10 rounded-2xl">
                <div className="divide-y divide-gray-100 dark:divide-white/10">
                  <div className="flex items-start gap-4 px-4 py-3 text-sm bg-brand-gold/5">
                    <span className="w-1/3 font-semibold text-gray-500 dark:text-gray-400">Product</span>
                    <span className="flex-1 font-bold text-brand-charcoal-dark dark:text-white">
                      {getProductLabel(product.preferences.product)}
                    </span>
                  </div>
                  {Object.entries(product.preferences.attributes || {}).map(([key, val], i) => (
                    <div key={key}
                      className={`flex items-start gap-4 px-4 py-3 text-sm
                        ${i % 2 === 0 ? 'bg-gray-50/50 dark:bg-white/[0.02]' : 'bg-white dark:bg-transparent'}`}>
                      <span className="w-1/3 font-semibold text-gray-500 dark:text-gray-400 capitalize">
                        {key.replace(/_/g, ' ')}
                      </span>
                      <span className="flex-1 text-brand-charcoal-dark dark:text-white">{val}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Delivery + Returns */}
          <DeliveryInfoCard product={product} />

          {/* Seller card */}
          <div>
            <SellerInfoCard product={product} onMessage={handleMessage} />
          </div>

          {/* Reviews */}
          {reviews?.length > 0 && (
            <div>
              <h2 className="mb-3 font-bold font-display text-brand-charcoal-dark dark:text-white">
                Reviews ({reviews.length})
              </h2>
              <div className="space-y-3">
                {reviews.map(rev => (
                  <div key={rev.id} className="p-4 border border-gray-100 dark:border-white/10 rounded-2xl">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="flex items-center justify-center w-8 h-8 text-xs font-bold rounded-full bg-brand-gold/15 text-brand-gold">
                        {rev.userName?.charAt(0) || 'U'}
                      </div>
                      <div>
                        <p className="text-sm font-bold text-brand-charcoal-dark dark:text-white">{rev.userName}</p>
                        <div className="flex items-center gap-1">
                          {Array.from({ length: 5 }, (_, i) => (
                            <Star key={i} size={10} className={i < rev.rating ? 'text-brand-gold fill-brand-gold' : 'text-gray-200'} />
                          ))}
                          <span className="ml-1 text-[10px] text-gray-400">{timeAgo(rev.date)}</span>
                        </div>
                      </div>
                    </div>
                    <p className="text-sm leading-relaxed text-gray-600 dark:text-gray-300">{rev.comment}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Similar Products */}
          {similar.length > 0 && (
            <div>
              <h2 className="mb-3 font-bold font-display text-brand-charcoal-dark dark:text-white">
                Similar Products
              </h2>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                {similar.map(p => (
                  <Link
                    key={p.id}
                    to={`/product/${p.id}`}
                    className="overflow-hidden transition-all bg-white border border-gray-100 group dark:bg-brand-charcoal-dark rounded-2xl dark:border-white/10 hover:border-brand-gold/40"
                  >
                    <div className="flex items-center justify-center text-3xl aspect-square bg-brand-gray-soft dark:bg-white/5">
                      {PRODUCT_CATEGORY_MAP[p.category]?.emoji || '📦'}
                    </div>
                    <div className="p-3">
                      <p className="text-xs font-bold leading-tight text-brand-charcoal-dark dark:text-white line-clamp-2">{p.title}</p>
                      <p className="mt-1 text-sm font-extrabold text-brand-gold">{symbol}{p.price.toLocaleString()}</p>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* ── RIGHT COLUMN (purchase panel — desktop) ──────── */}
        <div className="hidden lg:block">
          <div className="sticky p-5 space-y-5 bg-white border border-gray-100 top-24 dark:bg-brand-charcoal-dark rounded-2xl dark:border-white/10">

            {/* Price */}
            <div>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-extrabold font-display text-brand-charcoal-dark dark:text-white">
                  {symbol}{effectivePrice.toLocaleString()}
                </span>
                {unitLabel && <span className="text-sm text-gray-400">{unitLabel}</span>}
              </div>
              {activeBulk && (
                <p className="mt-1 text-xs text-emerald-500">{activeBulk.discount}% bulk discount applied</p>
              )}
            </div>

            {/* Stock status */}
            {inStock ? (
              <div className="flex items-center gap-1.5 text-xs text-emerald-500 font-semibold">
                <CheckCircle2 size={13} /> In Stock
                {stockQuantity && <span className="text-gray-400 font-normal">({stockQuantity} available)</span>}
              </div>
            ) : (
              <div className="flex items-center gap-1.5 text-xs text-red-500 font-semibold">
                <Package size={13} /> Out of Stock
              </div>
            )}

            {/* Quantity selector */}
            <div>
              <label className="mb-2 text-xs font-bold text-gray-500 dark:text-gray-400">Quantity</label>
              <div className="flex items-center gap-3 mt-1">
                <button
                  type="button"
                  onClick={() => setQty(q => Math.max(minOrder || 1, q - 1))}
                  disabled={qty <= (minOrder || 1)}
                  className="flex items-center justify-center w-10 h-10 transition-colors border border-gray-200 dark:border-white/10 rounded-xl hover:border-brand-gold disabled:opacity-30"
                >
                  <Minus size={14} />
                </button>
                <input
                  type="number"
                  value={qty}
                  onChange={e => {
                    const v = Math.max(minOrder || 1, Math.min(maxOrder || 9999, Number(e.target.value) || 1));
                    setQty(v);
                  }}
                  className="w-16 py-2 text-sm font-bold text-center border border-gray-200 dark:border-white/10 rounded-xl bg-brand-gray-soft dark:bg-white/5 text-brand-charcoal-dark dark:text-white"
                />
                <button
                  type="button"
                  onClick={() => setQty(q => Math.min(maxOrder || 9999, q + 1))}
                  disabled={maxOrder && qty >= maxOrder}
                  className="flex items-center justify-center w-10 h-10 transition-colors border border-gray-200 dark:border-white/10 rounded-xl hover:border-brand-gold disabled:opacity-30"
                >
                  <Plus size={14} />
                </button>
              </div>
              {minOrder > 1 && (
                <p className="mt-1 text-[10px] text-gray-400">Min order: {minOrder} units</p>
              )}
            </div>

            {/* Line total */}
            <div className="flex items-center justify-between p-3 rounded-xl bg-brand-gray-soft dark:bg-white/5">
              <span className="text-xs font-semibold text-gray-500 dark:text-gray-400">Total</span>
              <span className="text-lg font-extrabold text-brand-charcoal-dark dark:text-white">
                {symbol}{(effectivePrice * qty).toLocaleString()}
              </span>
            </div>

            {/* CTA buttons */}
            <div className="space-y-2">
              <button
                type="button"
                onClick={handleAddToCart}
                disabled={!inStock}
                className="flex items-center justify-center w-full gap-2 py-4 text-sm font-bold text-white transition-colors shadow-lg bg-brand-gold hover:bg-brand-gold-dark disabled:opacity-40 disabled:cursor-not-allowed rounded-2xl"
              >
                {addedToCart ? (
                  <><CheckCircle2 size={16} /> Added to Cart</>
                ) : (
                  <><ShoppingCart size={16} /> Add to Cart</>
                )}
              </button>
              <button
                type="button"
                onClick={handleMessage}
                className="flex items-center justify-center w-full gap-2 py-3 text-sm font-bold transition-colors border-2 border-gray-200 dark:border-white/10 text-brand-charcoal-dark dark:text-white hover:border-brand-gold rounded-2xl"
              >
                <MessageSquare size={16} /> Message Seller
              </button>
            </div>

            {/* Escrow notice */}
            <div className="flex items-start gap-2 p-3 text-xs leading-relaxed rounded-xl bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <Shield size={14} className="mt-0.5 shrink-0" />
              <span>Payment is held securely in escrow until you confirm delivery.</span>
            </div>

            {/* Refund badge */}
            <div className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold ${refundBadge.bg} ${refundBadge.text}`}>
              {refundBadge.label}
              {refundBadge.window > 0 && <span className="text-gray-400 font-normal">({refundBadge.window}hr window)</span>}
            </div>

            {/* Delivery summary */}
            <div className="space-y-1 text-xs text-gray-400">
              {product.deliveryTime && (
                <div className="flex items-center gap-1.5">
                  <Truck size={12} /> Est. delivery: {product.deliveryTime}
                </div>
              )}
              {product.deliveryFee != null && (
                <div className="flex items-center gap-1.5">
                  <Package size={12} /> Delivery fee: {product.deliveryFee === 0 ? 'Free' : format(product.deliveryFee)}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ═══ STICKY CTA — Mobile only ════════════════════════ */}
      <div className="fixed bottom-0 left-0 right-0 z-30 flex items-center gap-3 px-4 py-4 bg-white dark:bg-gray-950 border-t border-gray-100 dark:border-white/10 pb-safe shadow-nav lg:hidden">
        <div className="min-w-0">
          <p className="text-lg font-extrabold font-display text-brand-charcoal-dark dark:text-white">
            {symbol}{effectivePrice.toLocaleString()}
          </p>
          <p className="text-[11px] text-gray-400">{unitLabel} × {qty}</p>
        </div>
        <button
          type="button"
          onClick={handleMessage}
          className="flex items-center gap-1.5 px-4 py-3 text-sm font-bold transition-colors border border-gray-200 dark:border-white/10 rounded-xl text-brand-charcoal-dark dark:text-white hover:border-brand-gold"
        >
          <MessageSquare size={14} />
        </button>
        <button
          type="button"
          onClick={handleAddToCart}
          disabled={!inStock}
          className="flex items-center gap-2 px-6 py-3 text-sm font-bold text-white transition-colors rounded-xl bg-brand-gold hover:bg-brand-gold-dark disabled:opacity-40"
        >
          {addedToCart ? <CheckCircle2 size={14} /> : <ShoppingCart size={14} />}
          {addedToCart ? 'Added' : 'Add to Cart'}
        </button>
      </div>
    </div>
  );
}
