import { Link }     from 'react-router-dom';
import { Star, MapPin, BadgeCheck, ChevronRight, Truck, Shield, Navigation } from 'lucide-react';
import { useCurrency } from '../../hooks/useCurrency.js';
import Badge           from '../ui/Badge.jsx';

const SERVICE_TYPE_LABEL = {
  local:         'Local',
  interstate:    'Interstate',
  international: 'International',
  office:        'Office',
  packing:       'Packing',
  storage:       'Storage',
  vehicle:       'Vehicle',
};

const SERVICE_TYPE_COLOR = {
  local:         'bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400',
  interstate:    'bg-purple-50 dark:bg-purple-500/10 text-purple-600 dark:text-purple-400',
  international: 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
  office:        'bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400',
  packing:       'bg-pink-50 dark:bg-pink-500/10 text-pink-600 dark:text-pink-400',
  storage:       'bg-gray-100 dark:bg-white/10 text-gray-600 dark:text-gray-400',
  vehicle:       'bg-teal-50 dark:bg-teal-500/10 text-teal-600 dark:text-teal-400',
};

export default function RelocationProviderCard({ provider, compact = false }) {
  const { symbol } = useCurrency();
  if (!provider) return null;

  const {
    id, name, avatar, rating, reviews = 0, verified, tier,
    serviceTypes = [], serviceAreas = [], priceRange = {},
    completedMoves, responseTime, insurance, gpsTracking, location,
  } = provider;

  const tierVariant = tier === 3 ? 'tier3' : tier === 2 ? 'tier2' : 'tier1';

  // Lowest starting price across all service types
  const minPrices = Object.values(priceRange).map(v => v.min).filter(Boolean);
  const lowestPrice = minPrices.length ? Math.min(...minPrices) : null;

  // Show max 3 service types
  const visibleTypes = serviceTypes.slice(0, 3);
  const extraCount = serviceTypes.length - 3;

  return (
    <Link
      to={`/relocation/${id}`}
      className="block card group focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-gold/40"
      aria-label={`${name} — relocation provider`}
    >
      <div className="p-4">
        {/* Provider row */}
        <div className="flex items-center gap-2.5 mb-3">
          <div className="relative shrink-0">
            <div className="flex items-center justify-center w-12 h-12 overflow-hidden rounded-full bg-brand-gold/20">
              {avatar ? (
                <img src={avatar} alt={name} className="object-cover w-full h-full" />
              ) : (
                <span className="text-base font-bold text-brand-gold-dark">
                  {name?.charAt(0)?.toUpperCase() || 'M'}
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
            <p className="text-sm font-bold truncate text-brand-charcoal-dark dark:text-white">{name}</p>
            {location && (
              <p className="flex items-center gap-1 text-xs text-gray-400 dark:text-gray-500 truncate">
                <MapPin size={10} aria-hidden />
                {location}
              </p>
            )}
          </div>
          {tier && <Badge variant={tierVariant} size="sm" />}
        </div>

        {/* Service type chips */}
        <div className="flex flex-wrap gap-1.5 mb-3">
          {visibleTypes.map(st => (
            <span key={st} className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${SERVICE_TYPE_COLOR[st] || SERVICE_TYPE_COLOR.local}`}>
              {SERVICE_TYPE_LABEL[st] || st}
            </span>
          ))}
          {extraCount > 0 && (
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-gray-100 dark:bg-white/10 text-gray-500 dark:text-gray-400">
              +{extraCount}
            </span>
          )}
        </div>

        {/* Stats row */}
        <div className="flex items-center gap-3 mb-3 text-xs text-gray-500 dark:text-white/60">
          {rating && (
            <span className="flex items-center gap-1">
              <Star size={11} fill="currentColor" className="text-brand-gold" />
              <span className="font-bold text-brand-charcoal-dark dark:text-white">{rating}</span>
              <span>({reviews})</span>
            </span>
          )}
          {completedMoves && (
            <span className="flex items-center gap-1">
              <Truck size={11} />
              {completedMoves} moves
            </span>
          )}
          {responseTime && (
            <span className="truncate">{responseTime}</span>
          )}
        </div>

        {/* Service areas (hidden in compact mode) */}
        {!compact && serviceAreas.length > 0 && (
          <p className="flex items-center gap-1 mb-3 text-xs text-gray-400 dark:text-gray-500 truncate">
            <Navigation size={10} className="shrink-0" />
            {serviceAreas.slice(0, 3).join(', ')}
            {serviceAreas.length > 3 && ` +${serviceAreas.length - 3}`}
          </p>
        )}

        {/* Trust indicators (hidden in compact mode) */}
        {!compact && (insurance || gpsTracking) && (
          <div className="flex items-center gap-2 mb-3">
            {insurance && (
              <span className="flex items-center gap-1 px-2 py-0.5 text-[10px] font-bold rounded-full bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                <Shield size={9} /> Insured
              </span>
            )}
            {gpsTracking && (
              <span className="flex items-center gap-1 px-2 py-0.5 text-[10px] font-bold rounded-full bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400">
                <MapPin size={9} /> GPS
              </span>
            )}
          </div>
        )}

        {/* Price + CTA */}
        <div className="flex items-center justify-between pt-2 border-t border-gray-100 dark:border-white/10">
          <div>
            <p className="text-xs text-gray-400 dark:text-gray-500">From</p>
            <p className="text-base font-extrabold font-display text-brand-charcoal-dark dark:text-white">
              {lowestPrice ? `${symbol}${lowestPrice.toLocaleString()}` : 'Get Quote'}
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
