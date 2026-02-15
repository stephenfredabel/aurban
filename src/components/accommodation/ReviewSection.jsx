import { Star, ThumbsUp, Calendar, Moon, Users } from 'lucide-react';

/* ════════════════════════════════════════════════════════════
   REVIEW SECTION — Property reviews with ratings
   Used on Property detail page for all accommodation types
════════════════════════════════════════════════════════════ */

function StarRating({ rating, size = 13 }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map(star => (
        <Star
          key={star}
          size={size}
          className={star <= rating ? 'text-brand-gold fill-brand-gold' : 'text-gray-200 dark:text-white/20'}
        />
      ))}
    </div>
  );
}

function ReviewCard({ review }) {
  const initial = review.userName?.charAt(0) || '?';
  return (
    <div className="p-4 border border-gray-100 dark:border-white/10 rounded-2xl">
      <div className="flex items-start gap-3 mb-3">
        {/* Avatar */}
        {review.userAvatar ? (
          <img src={review.userAvatar} alt="" className="object-cover w-10 h-10 rounded-full" />
        ) : (
          <div className="flex items-center justify-center w-10 h-10 text-sm font-bold rounded-full shrink-0 bg-brand-gold/15 text-brand-gold">
            {initial}
          </div>
        )}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between">
            <p className="text-sm font-bold text-brand-charcoal-dark dark:text-white">{review.userName}</p>
            <StarRating rating={review.rating} size={11} />
          </div>
          <div className="flex items-center gap-2 mt-0.5">
            <span className="text-[11px] text-gray-400">{formatDate(review.date)}</span>
            {review.stayDuration && (
              <span className="text-[11px] text-gray-400 flex items-center gap-1">
                <Moon size={10} /> {review.stayDuration}
              </span>
            )}
          </div>
        </div>
      </div>
      <p className="text-sm leading-relaxed text-gray-600 dark:text-gray-300">{review.comment}</p>
    </div>
  );
}

function formatDate(dateStr) {
  try {
    return new Date(dateStr).toLocaleDateString('en-NG', { month: 'short', year: 'numeric' });
  } catch {
    return dateStr;
  }
}

export default function ReviewSection({ reviews = [], rating, reviewCount }) {
  if (!reviews.length && !rating) return null;

  const avgRating = rating || (reviews.length
    ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
    : 0);

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-bold font-display text-brand-charcoal-dark dark:text-white">Reviews</h2>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1">
            <Star size={16} className="text-brand-gold fill-brand-gold" />
            <span className="text-lg font-extrabold text-brand-charcoal-dark dark:text-white">{avgRating}</span>
          </div>
          <span className="text-xs text-gray-400">({reviewCount || reviews.length} review{(reviewCount || reviews.length) !== 1 ? 's' : ''})</span>
        </div>
      </div>

      {reviews.length > 0 ? (
        <div className="space-y-3">
          {reviews.map(review => (
            <ReviewCard key={review.id} review={review} />
          ))}
        </div>
      ) : (
        <div className="py-6 text-center">
          <p className="text-sm text-gray-400">No reviews yet</p>
        </div>
      )}
    </div>
  );
}
