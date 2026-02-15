import { Link } from 'react-router-dom';
import { X, Minus, Plus, Trash2, ShoppingCart, ArrowRight } from 'lucide-react';
import { useCart } from '../../context/CartContext.jsx';
import { useCurrency } from '../../hooks/useCurrency.js';
import { PRODUCT_CATEGORY_MAP } from '../../data/categoryFields.js';

/* ════════════════════════════════════════════════════════════
   CART DRAWER — Slide-in from right
   Follows MarketplaceFilterDrawer pattern
════════════════════════════════════════════════════════════ */

const UNIT_LABEL = {
  per_unit:'/ unit', per_bag:'/ bag', per_carton:'/ carton',
  per_sqm:'/ m²', per_set:'/ set', per_metre:'/ m',
  per_tonne:'/ tonne', per_roll:'/ roll', bulk_price:'LOT',
};

export default function CartDrawer({ onClose }) {
  const { items, itemCount, subtotal, totalDeliveryFee, serviceFee, grandTotal, groupedBySeller, updateQuantity, removeItem, clearCart } = useCart();
  const { symbol } = useCurrency();

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <button type="button" className="flex-1 bg-black/40 backdrop-blur-sm" onClick={onClose} />

      <div className="flex flex-col w-full h-full max-w-md overflow-y-auto bg-white shadow-2xl dark:bg-brand-charcoal-dark">
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between px-5 py-4 bg-white border-b border-gray-100 dark:border-white/10 dark:bg-brand-charcoal-dark">
          <div className="flex items-center gap-2">
            <ShoppingCart size={18} className="text-brand-gold" />
            <h2 className="text-lg font-extrabold font-display text-brand-charcoal-dark dark:text-white">
              Cart ({itemCount})
            </h2>
          </div>
          <div className="flex items-center gap-2">
            {items.length > 0 && (
              <button
                type="button"
                onClick={clearCart}
                className="px-2.5 py-1 text-[11px] font-bold text-red-500 transition-colors rounded-lg hover:bg-red-50 dark:hover:bg-red-500/10"
              >
                Clear All
              </button>
            )}
            <button type="button" onClick={onClose} className="flex items-center justify-center w-8 h-8 rounded-xl hover:bg-brand-gray-soft dark:hover:bg-white/10">
              <X size={16} className="text-brand-charcoal dark:text-white" />
            </button>
          </div>
        </div>

        {/* Cart items */}
        <div className="flex-1 px-5 py-4">
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <ShoppingCart size={48} className="mb-4 text-gray-200 dark:text-gray-700" />
              <p className="mb-2 text-lg font-bold text-brand-charcoal-dark dark:text-white">Your cart is empty</p>
              <p className="mb-5 text-sm text-gray-400">Browse the marketplace to find products</p>
              <Link
                to="/marketplace"
                onClick={onClose}
                className="inline-flex items-center gap-1.5 px-5 py-2.5 text-sm font-bold text-white transition-colors rounded-xl bg-brand-gold hover:bg-brand-gold-dark"
              >
                Browse Marketplace <ArrowRight size={14} />
              </Link>
            </div>
          ) : (
            <div className="space-y-5">
              {groupedBySeller.map(group => (
                <div key={group.sellerId} className="pb-4 border-b border-gray-100 dark:border-white/10 last:border-0">
                  {/* Seller header */}
                  <p className="mb-3 text-xs font-bold text-gray-400 uppercase tracking-wider">
                    {group.sellerName}
                  </p>

                  <div className="space-y-3">
                    {group.items.map(item => {
                      const catEmoji = PRODUCT_CATEGORY_MAP[item.category]?.emoji || '📦';
                      return (
                        <div key={item.productId} className="flex gap-3">
                          {/* Product image / emoji */}
                          <div className="flex items-center justify-center text-2xl rounded-xl w-16 h-16 bg-brand-gray-soft dark:bg-white/5 shrink-0">
                            {catEmoji}
                          </div>

                          <div className="flex-1 min-w-0">
                            <Link
                              to={`/product/${item.productId}`}
                              onClick={onClose}
                              className="text-sm font-bold text-brand-charcoal-dark dark:text-white hover:text-brand-gold line-clamp-2 transition-colors"
                            >
                              {item.title}
                            </Link>
                            <p className="mt-0.5 text-xs text-gray-400">
                              {symbol}{item.price.toLocaleString()} {UNIT_LABEL[item.pricingUnit] || ''}
                            </p>

                            {/* Quantity controls */}
                            <div className="flex items-center justify-between mt-2">
                              <div className="flex items-center gap-2">
                                <button
                                  type="button"
                                  onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                                  disabled={item.quantity <= 1}
                                  className="flex items-center justify-center w-7 h-7 border border-gray-200 dark:border-white/10 rounded-lg hover:border-brand-gold disabled:opacity-30 transition-colors"
                                >
                                  <Minus size={11} />
                                </button>
                                <span className="w-8 text-sm font-bold text-center text-brand-charcoal-dark dark:text-white">
                                  {item.quantity}
                                </span>
                                <button
                                  type="button"
                                  onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                                  className="flex items-center justify-center w-7 h-7 border border-gray-200 dark:border-white/10 rounded-lg hover:border-brand-gold transition-colors"
                                >
                                  <Plus size={11} />
                                </button>
                              </div>

                              <div className="flex items-center gap-3">
                                <span className="text-sm font-extrabold text-brand-charcoal-dark dark:text-white">
                                  {symbol}{(item.price * item.quantity).toLocaleString()}
                                </span>
                                <button
                                  type="button"
                                  onClick={() => removeItem(item.productId)}
                                  className="flex items-center justify-center w-7 h-7 text-gray-400 transition-colors rounded-lg hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10"
                                >
                                  <Trash2 size={13} />
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Seller delivery fee */}
                  {group.deliveryFee > 0 && (
                    <p className="mt-2 text-[11px] text-gray-400">
                      Delivery: {symbol}{group.deliveryFee.toLocaleString()}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer — Totals + Checkout */}
        {items.length > 0 && (
          <div className="px-5 py-4 border-t border-gray-100 dark:border-white/10">
            <div className="space-y-1.5 mb-4 text-sm">
              <div className="flex justify-between text-gray-500 dark:text-gray-400">
                <span>Subtotal</span>
                <span className="font-semibold text-brand-charcoal-dark dark:text-white">{symbol}{subtotal.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-gray-500 dark:text-gray-400">
                <span>Delivery</span>
                <span className="font-semibold text-brand-charcoal-dark dark:text-white">
                  {totalDeliveryFee === 0 ? 'Free' : `${symbol}${totalDeliveryFee.toLocaleString()}`}
                </span>
              </div>
              <div className="flex justify-between text-gray-500 dark:text-gray-400">
                <span>Service fee (1.5%)</span>
                <span className="font-semibold text-brand-charcoal-dark dark:text-white">{symbol}{serviceFee.toLocaleString()}</span>
              </div>
              <div className="flex justify-between pt-2 border-t border-gray-100 dark:border-white/10">
                <span className="font-bold text-brand-charcoal-dark dark:text-white">Total</span>
                <span className="text-lg font-extrabold text-brand-gold">{symbol}{grandTotal.toLocaleString()}</span>
              </div>
            </div>

            <Link
              to="/checkout"
              onClick={onClose}
              className="flex items-center justify-center w-full gap-2 py-4 text-sm font-bold text-white transition-colors rounded-2xl bg-brand-gold hover:bg-brand-gold-dark"
            >
              Proceed to Checkout <ArrowRight size={14} />
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
