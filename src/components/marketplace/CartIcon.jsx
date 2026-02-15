import { ShoppingCart } from 'lucide-react';
import { useCart } from '../../context/CartContext.jsx';

/* ════════════════════════════════════════════════════════════
   CART ICON — Shopping cart button with item count badge
════════════════════════════════════════════════════════════ */

export default function CartIcon({ onClick, className = '' }) {
  const { itemCount } = useCart();

  return (
    <button
      type="button"
      onClick={onClick}
      className={`relative flex items-center justify-center w-9 h-9 rounded-full transition-colors hover:bg-brand-gray-soft dark:hover:bg-white/10 ${className}`}
      aria-label={`Cart (${itemCount} items)`}
    >
      <ShoppingCart size={18} className="text-brand-charcoal dark:text-white" />
      {itemCount > 0 && (
        <span className="absolute -top-0.5 -right-0.5 flex items-center justify-center min-w-[18px] h-[18px] px-1 text-[10px] font-bold text-white rounded-full bg-brand-gold">
          {itemCount > 99 ? '99+' : itemCount}
        </span>
      )}
    </button>
  );
}
