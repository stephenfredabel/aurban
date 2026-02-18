import { useState, useEffect } from 'react';
import {
  Star, Search, MessageCircle, ThumbsUp,
  ChevronDown, ChevronUp, Send,
  AlertCircle,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext.jsx';
import { getProProviderReviews } from '../../services/proProvider.service.js';

/* ════════════════════════════════════════════════════════════
   PROVIDER REVIEWS — Client reviews & ratings management

   Features:
   • Overall rating summary with breakdown
   • Review list with star ratings
   • Filter by rating / status
   • Reply to reviews
   • Review stats & insights
════════════════════════════════════════════════════════════ */

const MOCK_REVIEWS = [
  {
    id: 'r1', clientName: 'Adaeze Okafor', clientInitials: 'AO',
    rating: 5, title: 'Excellent property and service',
    text: 'The 3 bedroom flat was exactly as described. The provider was very responsive and professional throughout the viewing and agreement process. Highly recommend!',
    date: 'Feb 10, 2025', listing: '3 Bedroom Flat in Lekki Phase 1',
    type: 'rental', helpful: 8, replied: true,
    reply: 'Thank you so much, Adaeze! It was a pleasure working with you. Wishing you a wonderful stay!',
    replyDate: 'Feb 11, 2025',
  },
  {
    id: 'r2', clientName: 'Emeka Johnson', clientInitials: 'EJ',
    rating: 4, title: 'Great plumbing work, minor delay',
    text: 'The plumbing work was done well — kitchen sink and bathroom are working perfectly. Only issue was a 30-minute delay on arrival, but the quality of work made up for it.',
    date: 'Feb 8, 2025', listing: 'Plumbing Services',
    type: 'service', helpful: 3, replied: false,
    reply: null, replyDate: null,
  },
  {
    id: 'r3', clientName: 'Blessing Adekunle', clientInitials: 'BA',
    rating: 5, title: 'Very transparent land documentation',
    text: 'The land documents were provided promptly and everything checked out with my lawyer. The survey plan was accurate and the C of O was genuine. Great experience overall.',
    date: 'Feb 5, 2025', listing: 'Land for Sale — 500sqm Ibeju-Lekki',
    type: 'sale', helpful: 12, replied: true,
    reply: 'Thank you, Blessing! We always ensure our documentation is thorough and legitimate. Best of luck with your development plans!',
    replyDate: 'Feb 6, 2025',
  },
  {
    id: 'r4', clientName: 'Chinedu Eze', clientInitials: 'CE',
    rating: 3, title: 'Decent apartment but maintenance could improve',
    text: 'The studio apartment in Yaba was okay for the price. Location is great and close to everything. However, some maintenance issues like the AC took a while to get fixed. Communication could be better.',
    date: 'Jan 20, 2025', listing: 'Shared Apartment — Male Only',
    type: 'rental', helpful: 5, replied: true,
    reply: 'Hi Chinedu, thank you for the honest feedback. We\'ve improved our maintenance response time since then and have a dedicated team for urgent repairs. Hope to serve you better!',
    replyDate: 'Jan 21, 2025',
  },
  {
    id: 'r5', clientName: 'Funke Adeyemi', clientInitials: 'FA',
    rating: 5, title: 'Best service provider on Aurban!',
    text: 'I\'ve used this provider for both property rental and plumbing services. Always professional, always on time, and the prices are fair. Can\'t recommend enough.',
    date: 'Jan 15, 2025', listing: 'Plumbing Services',
    type: 'service', helpful: 15, replied: false,
    reply: null, replyDate: null,
  },
  {
    id: 'r6', clientName: 'Tola Bakare', clientInitials: 'TB',
    rating: 2, title: 'Property didn\'t match photos',
    text: 'The listing photos were somewhat misleading. The actual apartment was smaller than expected and the neighborhood was noisier than described. Fair price though.',
    date: 'Jan 5, 2025', listing: '3 Bedroom Flat in Lekki Phase 1',
    type: 'rental', helpful: 2, replied: true,
    reply: 'Hi Tola, we apologize for the discrepancy. We\'ve since updated our listing photos to be more accurate and added video walkthroughs. Thank you for the feedback.',
    replyDate: 'Jan 6, 2025',
  },
];

function StarRating({ rating, size = 14 }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          size={size}
          className={i <= rating ? 'text-brand-gold fill-brand-gold' : 'text-gray-300 dark:text-gray-600'}
        />
      ))}
    </div>
  );
}

export default function Reviews() {
  const { user } = useAuth();
  const [reviews, setReviews] = useState(MOCK_REVIEWS);

  useEffect(() => {
    if (!user?.id) return;
    (async () => {
      try {
        const res = await getProProviderReviews(user.id, { page: 1, limit: 50 });
        if (res.success && res.reviews?.length) {
          setReviews(res.reviews.map(r => ({
            id: r.id,
            clientName: r.client_name || r.reviewer_name || 'Client',
            clientInitials: (r.client_name || r.reviewer_name || 'C').split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase(),
            rating: r.rating || 0,
            title: r.title || '',
            text: r.comment || r.text || '',
            date: new Date(r.created_at).toLocaleDateString('en-NG', { month: 'short', day: 'numeric', year: 'numeric' }),
            listing: r.listing_title || r.listing || '',
            type: r.type || 'service',
            helpful: r.helpful_count || 0,
            replied: !!r.reply,
            reply: r.reply || null,
            replyDate: r.reply_date ? new Date(r.reply_date).toLocaleDateString('en-NG', { month: 'short', day: 'numeric', year: 'numeric' }) : null,
          })));
        }
      } catch { /* keep mock fallback */ }
    })();
  }, [user?.id]);
  const [ratingFilter, setRatingFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedId, setExpandedId] = useState(null);
  const [replyText, setReplyText] = useState('');
  const [replyingTo, setReplyingTo] = useState(null);

  const filtered = reviews.filter((r) => {
    if (ratingFilter !== 'all' && r.rating !== Number(ratingFilter)) return false;
    if (statusFilter === 'replied' && !r.replied) return false;
    if (statusFilter === 'unreplied' && r.replied) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      if (!r.clientName.toLowerCase().includes(q) &&
          !r.text.toLowerCase().includes(q) &&
          !r.listing.toLowerCase().includes(q)) return false;
    }
    return true;
  });

  /* Rating stats */
  const totalReviews = reviews.length;
  const avgRating = totalReviews > 0
    ? (reviews.reduce((s, r) => s + r.rating, 0) / totalReviews).toFixed(1)
    : '0.0';
  const ratingCounts = [5, 4, 3, 2, 1].map((r) => ({
    stars: r,
    count: reviews.filter((rv) => rv.rating === r).length,
  }));
  const repliedCount = reviews.filter((r) => r.replied).length;

  const handleReply = (reviewId) => {
    if (!replyText.trim()) return;
    setReplyText('');
    setReplyingTo(null);
  };

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-lg font-bold font-display text-brand-charcoal-dark dark:text-white">Reviews</h2>
        <p className="text-xs text-gray-400 mt-0.5">{totalReviews} reviews · {avgRating} average rating</p>
      </div>

      {/* Rating summary card */}
      <div className="p-5 bg-white dark:bg-gray-900 rounded-2xl shadow-card">
        <div className="flex gap-6">
          {/* Overall rating */}
          <div className="text-center shrink-0">
            <p className="text-4xl font-bold font-display text-brand-charcoal-dark dark:text-white">{avgRating}</p>
            <StarRating rating={Math.round(Number(avgRating))} size={16} />
            <p className="text-xs text-gray-400 mt-1">{totalReviews} review{totalReviews !== 1 ? 's' : ''}</p>
          </div>

          {/* Rating breakdown */}
          <div className="flex-1 space-y-1.5">
            {ratingCounts.map(({ stars, count }) => {
              const pct = totalReviews > 0 ? (count / totalReviews) * 100 : 0;
              return (
                <div key={stars} className="flex items-center gap-2">
                  <span className="text-xs text-gray-400 w-3 text-right">{stars}</span>
                  <Star size={10} className="text-brand-gold fill-brand-gold shrink-0" />
                  <div className="flex-1 h-2 overflow-hidden bg-gray-100 rounded-full dark:bg-white/10">
                    <div className="h-full rounded-full bg-brand-gold transition-all" style={{ width: `${pct}%` }} />
                  </div>
                  <span className="text-[10px] text-gray-400 w-6 text-right">{count}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Quick stats */}
        <div className="grid grid-cols-3 gap-3 pt-4 mt-4 border-t border-gray-100 dark:border-white/10">
          <div className="text-center">
            <p className="text-sm font-bold text-brand-charcoal-dark dark:text-white">{repliedCount}/{totalReviews}</p>
            <p className="text-[10px] text-gray-400">Replied</p>
          </div>
          <div className="text-center">
            <p className="text-sm font-bold text-emerald-600">{Math.round((repliedCount / Math.max(totalReviews, 1)) * 100)}%</p>
            <p className="text-[10px] text-gray-400">Response Rate</p>
          </div>
          <div className="text-center">
            <p className="text-sm font-bold text-brand-charcoal-dark dark:text-white">~2hrs</p>
            <p className="text-[10px] text-gray-400">Avg. Response</p>
          </div>
        </div>
      </div>

      {/* Search + filters */}
      <div className="space-y-3">
        <div className="relative">
          <Search size={14} className="absolute text-gray-400 -translate-y-1/2 left-3 top-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search reviews..."
            className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-gray-900 text-sm text-brand-charcoal-dark dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-gold/30 focus:border-brand-gold"
          />
        </div>
        <div className="flex gap-2 overflow-x-auto scrollbar-hide">
          {[
            { key: 'all', label: 'All' },
            { key: '5', label: '5 Stars' },
            { key: '4', label: '4 Stars' },
            { key: '3', label: '3 Stars' },
            { key: '2', label: '2 Stars' },
            { key: '1', label: '1 Star' },
          ].map((f) => (
            <button key={f.key} onClick={() => setRatingFilter(f.key)}
              className={`text-xs font-medium px-3 py-2.5 rounded-full whitespace-nowrap transition-colors active:scale-[0.97]
                ${ratingFilter === f.key ? 'bg-brand-charcoal-dark text-white' : 'bg-gray-100 dark:bg-white/5 text-gray-500 hover:bg-gray-200'}`}>
              {f.label}
            </button>
          ))}
        </div>
        <div className="flex gap-2">
          {[
            { key: 'all', label: 'All Replies' },
            { key: 'unreplied', label: 'Needs Reply' },
            { key: 'replied', label: 'Replied' },
          ].map((f) => (
            <button key={f.key} onClick={() => setStatusFilter(f.key)}
              className={`text-xs font-medium px-3 py-2.5 rounded-full whitespace-nowrap transition-colors active:scale-[0.97]
                ${statusFilter === f.key ? 'bg-brand-charcoal-dark text-white' : 'bg-gray-100 dark:bg-white/5 text-gray-500 hover:bg-gray-200'}`}>
              {f.label}
              {f.key === 'unreplied' && (
                <span className="ml-1 bg-red-500 text-white text-[9px] font-bold px-1 py-0.5 rounded-full">
                  {totalReviews - repliedCount}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Reviews list */}
      {filtered.length === 0 ? (
        <div className="py-12 text-center">
          <Star size={32} className="mx-auto mb-3 text-gray-300" />
          <p className="text-sm text-gray-400">No reviews found</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((review) => {
            const isExpanded = expandedId === review.id;
            const isReplying = replyingTo === review.id;

            return (
              <div key={review.id} className="overflow-hidden bg-white dark:bg-gray-900 rounded-2xl shadow-card">
                {/* Review header */}
                <button onClick={() => setExpandedId(isExpanded ? null : review.id)}
                  className="w-full p-4 text-left transition-colors hover:bg-gray-50 dark:hover:bg-white/5">
                  <div className="flex gap-3">
                    <div className="flex items-center justify-center text-xs font-bold rounded-full w-10 h-10 bg-brand-gold/20 text-brand-gold shrink-0">
                      {review.clientInitials}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="text-sm font-semibold text-brand-charcoal-dark dark:text-white">{review.clientName}</p>
                          <p className="text-[10px] text-gray-400 mt-0.5">{review.date} · {review.listing}</p>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          {!review.replied && (
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-red-50 dark:bg-red-500/10 text-red-500 font-medium">
                              Needs reply
                            </span>
                          )}
                          {isExpanded ? <ChevronUp size={14} className="text-gray-400" /> : <ChevronDown size={14} className="text-gray-400" />}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 mt-1.5">
                        <StarRating rating={review.rating} size={12} />
                        <span className="text-xs font-medium text-brand-charcoal-dark dark:text-white">{review.rating}.0</span>
                      </div>
                      <p className="text-sm font-medium mt-1 text-brand-charcoal-dark dark:text-white">{review.title}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 line-clamp-2">{review.text}</p>
                    </div>
                  </div>
                </button>

                {/* Expanded details */}
                {isExpanded && (
                  <div className="p-4 space-y-3 border-t border-gray-100 dark:border-white/10">
                    {/* Full review text */}
                    <p className="text-sm leading-relaxed text-gray-600 dark:text-gray-300">{review.text}</p>

                    {/* Helpful count */}
                    <div className="flex items-center gap-3">
                      <span className="flex items-center gap-1 text-xs text-gray-400">
                        <ThumbsUp size={12} /> {review.helpful} found helpful
                      </span>
                    </div>

                    {/* Provider reply */}
                    {review.replied && review.reply && (
                      <div className="p-3 ml-4 border-l-2 bg-gray-50 dark:bg-white/5 rounded-xl border-brand-gold">
                        <p className="text-[10px] text-brand-gold font-medium mb-1">Your Reply · {review.replyDate}</p>
                        <p className="text-xs text-gray-600 dark:text-gray-300">{review.reply}</p>
                      </div>
                    )}

                    {/* Reply form */}
                    {!review.replied && !isReplying && (
                      <button onClick={() => setReplyingTo(review.id)}
                        className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold transition-colors bg-brand-gold hover:bg-brand-gold-dark text-brand-charcoal-dark rounded-xl">
                        <MessageCircle size={12} /> Write Reply
                      </button>
                    )}

                    {isReplying && (
                      <div className="space-y-2">
                        <textarea
                          value={replyText}
                          onChange={(e) => setReplyText(e.target.value)}
                          placeholder="Write your reply to this review..."
                          rows={3}
                          className="w-full rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-gray-800 px-4 py-2.5 text-sm text-brand-charcoal-dark dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-gold/30 focus:border-brand-gold resize-none"
                        />
                        <div className="flex gap-2">
                          <button onClick={() => handleReply(review.id)}
                            disabled={!replyText.trim()}
                            className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold transition-colors bg-brand-gold hover:bg-brand-gold-dark text-brand-charcoal-dark rounded-xl disabled:opacity-40">
                            <Send size={12} /> Send Reply
                          </button>
                          <button onClick={() => { setReplyingTo(null); setReplyText(''); }}
                            className="px-4 py-2 text-xs font-medium text-gray-500 transition-colors bg-gray-100 dark:bg-white/5 rounded-xl hover:bg-gray-200">
                            Cancel
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Tips card */}
      <div className="flex items-start gap-3 p-4 bg-blue-50 dark:bg-blue-500/10 rounded-2xl">
        <AlertCircle size={16} className="text-blue-500 shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-medium text-blue-700 dark:text-blue-300">Improve Your Rating</p>
          <p className="text-xs text-blue-600 dark:text-blue-400 mt-0.5">
            Respond to all reviews promptly — providers who reply to reviews within 24 hours see 15% more inquiries. Be professional and constructive, even with negative reviews.
          </p>
        </div>
      </div>
    </div>
  );
}
