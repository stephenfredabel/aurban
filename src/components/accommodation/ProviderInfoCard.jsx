import { Link } from 'react-router-dom';
import { BadgeCheck, Star, MessageSquare, Clock, Calendar, ShieldCheck } from 'lucide-react';
import Badge from '../ui/Badge.jsx';

/* ════════════════════════════════════════════════════════════
   PROVIDER INFO CARD — Shows provider info on property detail
   Follows ServiceDetail.jsx provider section pattern
════════════════════════════════════════════════════════════ */

export default function ProviderInfoCard({ property, onMessage }) {
  if (!property) return null;

  const {
    providerId, providerName, providerRole, providerAvatar,
    providerRating, providerReviews, providerVerified, providerTier,
    providerPhone,
  } = property;

  const initial = providerName?.charAt(0) || 'A';
  const tierVariant = providerTier === 3 ? 'tier3' : providerTier === 2 ? 'tier2' : 'tier1';

  return (
    <div className="p-4 border border-gray-100 dark:border-white/10 rounded-2xl">
      <div className="flex items-start gap-3">
        {/* Avatar */}
        {providerAvatar ? (
          <img src={providerAvatar} alt={providerName} className="object-cover w-12 h-12 rounded-full" />
        ) : (
          <div className="flex items-center justify-center w-12 h-12 text-lg font-bold rounded-full shrink-0 bg-brand-gold/15 text-brand-gold">
            {initial}
          </div>
        )}

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <Link
              to={`/providers/${providerId}`}
              className="text-sm font-bold text-brand-charcoal-dark dark:text-white hover:text-brand-gold transition-colors"
            >
              {providerName}
            </Link>
            {providerVerified && <BadgeCheck size={14} className="text-brand-gold" />}
          </div>

          {/* Badges */}
          <div className="flex items-center gap-1.5 mb-2">
            <Badge variant={tierVariant} size="sm" />
            {providerRole && (
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-gray-100 dark:bg-white/10 text-gray-500 dark:text-gray-400 capitalize">
                {providerRole}
              </span>
            )}
          </div>

          {/* Stats */}
          <div className="flex items-center gap-3 text-xs text-gray-400">
            {providerRating && (
              <span className="flex items-center gap-1">
                <Star size={11} className="text-brand-gold fill-brand-gold" />
                <span className="font-semibold text-brand-charcoal-dark dark:text-white">{providerRating}</span>
                ({providerReviews})
              </span>
            )}
          </div>
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
          to={`/providers/${providerId}`}
          className="flex items-center justify-center flex-1 gap-1.5 py-2.5 text-xs font-bold transition-colors bg-brand-gray-soft dark:bg-white/10 rounded-xl text-brand-charcoal-dark dark:text-white hover:bg-brand-gold/10"
        >
          View Profile
        </Link>
      </div>
    </div>
  );
}
