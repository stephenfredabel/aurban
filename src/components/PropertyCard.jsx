import { useState } from 'react';
import { Link }     from 'react-router-dom';
import { Heart, MapPin, Bed, Bath, Maximize2, BadgeCheck } from 'lucide-react';
import { useProperty } from '../context/PropertyContext.jsx';
import { useCurrency } from '../hook/useCurrency.js';

export default function PropertyCard({ property, compact = false }) {
  const { toggleWishlist, isWishlisted } = useProperty();
  const { formatWithUnit }               = useCurrency();
  const [imgError, setImgError]          = useState(false);
  const [imgLoaded, setImgLoaded]        = useState(false);
  const [hovered, setHovered]            = useState(false);
  const [activeImgIdx, setActiveImgIdx]  = useState(0);

  if (!property) return null;

  const {
    id, title, price, priceUnit = 'year', location, images = [],
    bedrooms, bathrooms, area, type, verified, category,
  } = property;

  const wished    = isWishlisted(id);
  const imgSrc    = !imgError && images[activeImgIdx] ? images[activeImgIdx] : null;

  const handleWishlist = (e) => {
    e.preventDefault();
    e.stopPropagation();
    toggleWishlist(id);
  };

  return (
    <Link
      to={`/property/${id}`}
      className={`card group block focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-gold/40 ${compact ? '' : ''}`}
      aria-label={`${title} — ${location}`}
    >
      {/* Image */}
      <div
        className={`relative bg-gray-100 overflow-hidden ${compact ? 'h-40' : 'h-48'}`}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => { setHovered(false); setActiveImgIdx(0); }}
      >
        {imgSrc ? (
          <>
            {!imgLoaded && <div className="absolute inset-0 shimmer" />}
            <img
              src={imgSrc}
              alt={title}
              onLoad={() => setImgLoaded(true)}
              onError={() => setImgError(true)}
              className={`w-full h-full object-cover transition-all duration-500 group-hover:scale-105 ${imgLoaded ? 'opacity-100' : 'opacity-0'}`}
              loading="lazy"
            />
          </>
        ) : (
          <div className="flex items-center justify-center w-full h-full bg-gradient-to-br from-brand-gold/20 to-brand-gold/5">
            <span className="text-4xl font-black font-display text-brand-gold/30">A</span>
          </div>
        )}

        {/* Category chip */}
        {category && (
          <span className="absolute top-3 left-3 tag bg-white/90 backdrop-blur-sm text-brand-charcoal-dark capitalize shadow-sm text-[11px]">
            {category}
          </span>
        )}

        {/* Wishlist */}
        <button
          onClick={handleWishlist}
          className={[
            'absolute top-3 right-3 w-8 h-8 rounded-full flex items-center justify-center shadow-sm transition-all duration-200',
            wished
              ? 'bg-red-500 text-white scale-110'
              : 'bg-white/90 backdrop-blur-sm text-gray-500 hover:text-red-500 hover:scale-110',
          ].join(' ')}
          aria-label={wished ? 'Remove from saved' : 'Save property'}
          aria-pressed={wished}
        >
          <Heart size={14} fill={wished ? 'currentColor' : 'none'} />
        </button>

        {/* Hover sub-images (desktop only) */}
        {hovered && images.length > 1 && (
          <div className="absolute bottom-0 left-0 right-0 hidden p-2 md:flex gap-1.5 bg-gradient-to-t from-black/60 to-transparent">
            {images.slice(0, 5).map((img, idx) => (
              <div
                key={idx}
                className={`w-12 h-9 rounded-lg overflow-hidden shrink-0 border-2 transition-all cursor-pointer
                  ${idx === activeImgIdx ? 'border-white' : 'border-transparent hover:border-white/70'}`}
                onMouseEnter={() => setActiveImgIdx(idx)}
              >
                <img
                  src={img}
                  alt={`${title} ${idx + 1}`}
                  className="object-cover w-full h-full"
                  loading="lazy"
                />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Info */}
      <div className={compact ? 'p-3' : 'p-4'}>
        {/* Title + verified */}
        <div className="flex items-start gap-2 mb-1">
          <h3 className={`font-display font-bold text-brand-charcoal-dark dark:text-white flex-1 line-clamp-1 ${compact ? 'text-sm' : 'text-base'}`}>
            {title}
          </h3>
          {verified && (
            <BadgeCheck size={15} className="text-brand-gold shrink-0 mt-0.5" aria-label="Verified listing" />
          )}
        </div>

        {/* Location */}
        <p className="flex items-center gap-1 text-xs text-gray-400 dark:text-gray-500 mb-2.5">
          <MapPin size={11} className="shrink-0" aria-hidden />
          <span className="truncate">{location}</span>
        </p>

        {/* Stats */}
        {(bedrooms || bathrooms || area) && (
          <div className="flex items-center gap-3 mb-3 text-xs text-brand-charcoal-light dark:text-gray-400">
            {bedrooms  != null && (
              <span className="flex items-center gap-1">
                <Bed  size={12} aria-hidden />
                {bedrooms}
              </span>
            )}
            {bathrooms != null && (
              <span className="flex items-center gap-1">
                <Bath size={12} aria-hidden />
                {bathrooms}
              </span>
            )}
            {area && (
              <span className="flex items-center gap-1">
                <Maximize2 size={12} aria-hidden />
                {area}
              </span>
            )}
          </div>
        )}

        {/* Price */}
        <div className="flex items-center justify-between">
          <p className={`font-display font-extrabold text-brand-charcoal-dark dark:text-white ${compact ? 'text-base' : 'text-lg'}`}>
            {formatWithUnit(price, priceUnit)}
          </p>
          {type && (
            <span className="tag bg-brand-gray-soft text-brand-charcoal-light text-[10px]">
              {type}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}
