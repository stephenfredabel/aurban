import { Link }     from 'react-router-dom';
import { Star, MapPin, BadgeCheck, ChevronRight } from 'lucide-react';
import { useCurrency } from '../hooks/useCurrency.js';
import Badge           from './ui/Badge.jsx';

export default function ServiceCard({ service, compact = false }) {
  const { formatWithUnit } = useCurrency();
  if (!service) return null;

  const {
    id, name, category, provider, avatar, rating, reviews = 0,
    price, priceUnit = 'job', location, verified, tier, image,
  } = service;

  const tierVariant = tier === 3 ? 'tier3' : tier === 2 ? 'tier2' : 'tier1';

  return (
    <Link
      to={`/service/${id}`}
      className="block card group focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-gold/40"
      aria-label={`${name} by ${provider}`}
    >
      {/* Cover image */}
      {!compact && image && (
        <div className="h-32 overflow-hidden bg-gray-100">
          <img
            src={image}
            alt={name}
            className="object-cover w-full h-full transition-transform duration-500 group-hover:scale-105"
            loading="lazy"
          />
        </div>
      )}

      <div className="p-4">
        {/* Provider row */}
        <div className="flex items-center gap-2.5 mb-3">
          <div className="relative shrink-0">
            <div className="flex items-center justify-center w-10 h-10 overflow-hidden rounded-full bg-brand-gold/20">
              {avatar ? (
                <img src={avatar} alt={provider} className="object-cover w-full h-full" />
              ) : (
                <span className="text-sm font-bold text-brand-gold-dark">
                  {provider?.charAt(0)?.toUpperCase() || 'P'}
                </span>
              )}
            </div>
            {verified && (
              <BadgeCheck
                size={14}
                className="absolute -bottom-0.5 -right-0.5 text-brand-gold bg-white dark:bg-gray-900 rounded-full"
                aria-label="Verified provider"
              />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold truncate text-brand-charcoal-dark dark:text-white">{provider}</p>
            <p className="text-xs text-gray-400 dark:text-gray-500 truncate">{category}</p>
          </div>
          {tier && <Badge variant={tierVariant} size="sm" />}
        </div>

        {/* Service name */}
        <h3 className="font-display font-bold text-brand-charcoal-dark dark:text-white text-base line-clamp-1 mb-1.5">
          {name}
        </h3>

        {/* Location */}
        {location && (
          <p className="flex items-center gap-1 text-xs text-gray-400 dark:text-gray-500 mb-2.5">
            <MapPin size={11} aria-hidden />
            <span className="truncate">{location}</span>
          </p>
        )}

        {/* Rating */}
        {rating && (
          <div className="flex items-center gap-1.5 mb-3">
            <div className="flex">
              {[1,2,3,4,5].map((s) => (
                <Star
                  key={s}
                  size={11}
                  className={s <= Math.round(rating) ? 'text-brand-gold' : 'text-gray-200'}
                  fill={s <= Math.round(rating) ? 'currentColor' : 'none'}
                  aria-hidden
                />
              ))}
            </div>
            <span className="text-xs font-semibold text-brand-charcoal dark:text-white">{rating}</span>
            <span className="text-xs text-gray-400 dark:text-gray-500">({reviews})</span>
          </div>
        )}

        {/* Price + CTA */}
        <div className="flex items-center justify-between pt-2 border-t border-gray-100 dark:border-white/10">
          <div>
            <p className="text-xs text-gray-400 dark:text-gray-500">From</p>
            <p className="text-base font-extrabold font-display text-brand-charcoal-dark dark:text-white">
              {formatWithUnit(price, priceUnit)}
            </p>
          </div>
          <div className="flex items-center justify-center w-8 h-8 transition-colors rounded-xl bg-brand-gold/10 group-hover:bg-brand-gold">
            <ChevronRight size={15} className="text-brand-gold-dark group-hover:text-white" />
          </div>
        </div>
      </div>
    </Link>
  );
}