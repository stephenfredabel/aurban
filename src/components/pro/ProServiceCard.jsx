import { Link } from 'react-router-dom';
import { Star, MapPin, BadgeCheck } from 'lucide-react';
import { useCurrency } from '../../hooks/useCurrency.js';
import { PRO_SERVICE_CATEGORY_MAP } from '../../data/proServiceCategoryFields.js';
import { PRO_PRICING_MODES } from '../../data/proConstants.js';
import ProTierBadge from './ProTierBadge.jsx';
import ProProviderBadge from './ProProviderBadge.jsx';

/**
 * Card for a Pro service listing — used in the browse grid.
 */
export default function ProServiceCard({ service }) {
  const { symbol } = useCurrency();
  const catDef = PRO_SERVICE_CATEGORY_MAP[service.category];
  const pricingLabel = PRO_PRICING_MODES[service.pricingMode]?.label || '';

  return (
    <Link
      to={`/pro/${service.id}`}
      className="block overflow-hidden transition-all bg-white border border-gray-100 dark:bg-brand-charcoal-dark rounded-2xl dark:border-white/10 hover:border-brand-gold/40 hover:shadow-md"
    >
      {/* Category icon header */}
      <div className="relative flex items-center justify-center h-32 text-4xl bg-brand-gray-soft dark:bg-white/5">
        {catDef?.icon || '🔧'}
        <ProTierBadge tier={service.tier} size="sm" />
        <span className="absolute bottom-2 left-2 px-2 py-0.5 rounded-full text-[10px] font-bold bg-white/90 dark:bg-brand-charcoal-dark/90 text-gray-600 dark:text-white/70">
          {catDef?.label || service.category}
        </span>
      </div>

      <div className="p-4">
        {/* Provider row */}
        <div className="flex items-center gap-2 mb-2">
          <div className="flex items-center justify-center w-6 h-6 text-xs font-bold rounded-full shrink-0 bg-purple-500/15 text-purple-500">
            {service.providerName?.charAt(0) || 'P'}
          </div>
          <p className="text-xs font-semibold truncate text-gray-500 dark:text-white/60">{service.providerName}</p>
          {service.providerVerified && <BadgeCheck size={12} className="text-brand-gold shrink-0" />}
        </div>

        {/* Title */}
        <h3 className="mb-2 text-sm font-bold leading-tight text-brand-charcoal-dark dark:text-white line-clamp-2">
          {service.title}
        </h3>

        {/* Badges row */}
        <div className="flex flex-wrap items-center gap-1.5 mb-3">
          <ProProviderBadge level={service.providerLevel} />
          {service.subcategory && (
            <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-gray-100 dark:bg-white/5 text-gray-500 dark:text-white/50">
              {service.subcategory}
            </span>
          )}
        </div>

        {/* Rating + Location */}
        <div className="flex items-center gap-3 mb-3 text-[11px] text-gray-400">
          {service.rating > 0 && (
            <span className="flex items-center gap-1">
              <Star size={11} className="text-brand-gold fill-brand-gold" />
              <span className="font-semibold text-brand-charcoal-dark dark:text-white">{service.rating}</span>
              ({service.reviewCount})
            </span>
          )}
          {service.state && (
            <span className="flex items-center gap-1">
              <MapPin size={11} /> {service.state}
            </span>
          )}
        </div>

        {/* Price + CTA */}
        <div className="flex items-end justify-between gap-2">
          <div>
            <p className="text-base font-extrabold font-display text-brand-charcoal-dark dark:text-white">
              {service.pricingMode === 'quote' ? 'Get Quote' : `${symbol}${service.price?.toLocaleString()}`}
            </p>
            {pricingLabel && service.pricingMode !== 'quote' && (
              <p className="text-[10px] text-gray-400">{pricingLabel}</p>
            )}
          </div>
          <span className="px-3 py-1.5 bg-brand-gold hover:bg-brand-gold-dark text-white text-xs font-bold rounded-xl transition-colors shrink-0">
            View
          </span>
        </div>
      </div>
    </Link>
  );
}
