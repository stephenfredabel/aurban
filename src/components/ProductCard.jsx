import { Link }     from 'react-router-dom';
import { ShoppingCart, Star, BadgeCheck } from 'lucide-react';
import { useCurrency } from '../hooks/useCurrency.js';

export default function ProductCard({ product, compact = false }) {
  const { format } = useCurrency();
  if (!product) return null;

  const {
    id, name, price, image, brand, rating, reviews = 0,
    verified, inStock = true, category,
  } = product;

  return (
    <Link
      to={`/product/${id}`}
      className="block card group focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-gold/40"
      aria-label={`${name}${brand ? ` by ${brand}` : ''}`}
    >
      {/* Image */}
      <div className={`relative bg-gray-100 overflow-hidden ${compact ? 'h-36' : 'h-44'}`}>
        {image ? (
          <img
            src={image}
            alt={name}
            className="object-cover w-full h-full transition-transform duration-500 group-hover:scale-105"
            loading="lazy"
          />
        ) : (
          <div className="flex items-center justify-center w-full h-full bg-gradient-to-br from-gray-100 to-gray-200">
            <ShoppingCart size={28} className="text-gray-300" />
          </div>
        )}
        {!inStock && (
          <div className="absolute inset-0 flex items-center justify-center bg-white/60">
            <span className="text-xs text-white bg-gray-800 tag">Out of stock</span>
          </div>
        )}
        {category && (
          <span className="absolute top-3 left-3 tag bg-white/90 backdrop-blur-sm text-brand-charcoal-dark capitalize text-[11px] shadow-sm">
            {category}
          </span>
        )}
      </div>

      <div className="p-3.5">
        {/* Brand + verified */}
        {brand && (
          <div className="flex items-center gap-1 mb-1">
            <p className="text-xs text-gray-400 dark:text-gray-500 truncate">{brand}</p>
            {verified && <BadgeCheck size={12} className="text-brand-gold shrink-0" />}
          </div>
        )}

        {/* Name */}
        <h3 className={`font-display font-bold text-brand-charcoal-dark dark:text-white line-clamp-2 mb-1.5 ${compact ? 'text-sm' : 'text-sm'}`}>
          {name}
        </h3>

        {/* Rating */}
        {rating && (
          <div className="flex items-center gap-1 mb-2">
            <Star size={10} fill="currentColor" className="text-brand-gold" />
            <span className="text-xs font-semibold text-brand-charcoal dark:text-white">{rating}</span>
            <span className="text-xs text-gray-400 dark:text-gray-500">({reviews})</span>
          </div>
        )}

        {/* Price */}
        <p className="text-base font-extrabold font-display text-brand-charcoal-dark dark:text-white">
          {format(price)}
        </p>
      </div>
    </Link>
  );
}