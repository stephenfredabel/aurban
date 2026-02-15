import { Link } from 'react-router-dom';
import { BadgeCheck, Star, MessageSquare, Store } from 'lucide-react';
import Badge from '../ui/Badge.jsx';

/* ════════════════════════════════════════════════════════════
   SELLER INFO CARD — Shows vendor/seller info on product detail
   Pattern follows ProviderInfoCard.jsx
════════════════════════════════════════════════════════════ */

export default function SellerInfoCard({ product, onMessage }) {
  if (!product) return null;

  const {
    providerId, providerName, providerAvatar,
    providerRating, providerReviews, providerVerified, providerTier,
  } = product;

  const initial = providerName?.charAt(0) || 'S';
  const tierVariant = providerTier === 3 ? 'tier3' : providerTier === 2 ? 'tier2' : 'tier1';

  return (
    <div className="p-4 border border-gray-100 dark:border-white/10 rounded-2xl">
      <h3 className="mb-3 text-xs font-bold tracking-wider text-gray-400 uppercase">Sold by</h3>

      <div className="flex items-start gap-3">
        {/* Avatar */}
        {providerAvatar ? (
          <img src={providerAvatar} alt={providerName} className="object-cover w-12 h-12 rounded-full" />
        ) : (
          <div className="flex items-center justify-center w-12 h-12 text-lg font-bold rounded-full shrink-0 bg-purple-100 dark:bg-purple-500/15 text-purple-600 dark:text-purple-400">
            {initial}
          </div>
        )}

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-sm font-bold text-brand-charcoal-dark dark:text-white">
              {providerName}
            </span>
            {providerVerified && <BadgeCheck size={14} className="text-brand-gold" />}
          </div>

          <div className="flex items-center gap-1.5 mb-2">
            <Badge variant={tierVariant} size="sm" />
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-50 dark:bg-purple-500/10 text-purple-600 dark:text-purple-400 font-semibold">
              Seller
            </span>
          </div>

          {providerRating && (
            <div className="flex items-center gap-1 text-xs text-gray-400">
              <Star size={11} className="text-brand-gold fill-brand-gold" />
              <span className="font-semibold text-brand-charcoal-dark dark:text-white">{providerRating}</span>
              ({providerReviews} reviews)
            </div>
          )}
        </div>
      </div>

      {/* Action buttons */}
      <div className="flex gap-2 mt-3">
        <button
          type="button"
          onClick={() => onMessage?.()}
          className="flex items-center justify-center flex-1 gap-1.5 py-2.5 text-xs font-bold transition-colors border border-gray-200 dark:border-white/10 rounded-xl text-brand-charcoal-dark dark:text-white hover:border-brand-gold"
        >
          <MessageSquare size={13} /> Message
        </button>
        <Link
          to={`/vendor/${providerId}`}
          className="flex items-center justify-center flex-1 gap-1.5 py-2.5 text-xs font-bold transition-colors bg-brand-gray-soft dark:bg-white/10 rounded-xl text-brand-charcoal-dark dark:text-white hover:bg-brand-gold/10"
        >
          <Store size={13} /> View Store
        </Link>
      </div>
    </div>
  );
}
