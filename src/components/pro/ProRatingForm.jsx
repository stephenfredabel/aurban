import { useState } from 'react';
import { Star, Loader2, MessageSquare } from 'lucide-react';

/**
 * Post-completion rating form — stars + category ratings + comment.
 * Shown after observation window completes.
 */

const RATING_CATEGORIES = [
  { id: 'quality', label: 'Work Quality' },
  { id: 'communication', label: 'Communication' },
  { id: 'punctuality', label: 'Punctuality' },
  { id: 'value', label: 'Value for Money' },
];

function StarInput({ rating, onChange, size = 20 }) {
  const [hover, setHover] = useState(0);

  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map(n => (
        <button
          key={n}
          type="button"
          onMouseEnter={() => setHover(n)}
          onMouseLeave={() => setHover(0)}
          onClick={() => onChange(n)}
          className="transition-transform hover:scale-110"
        >
          <Star
            size={size}
            className={`transition-colors ${
              n <= (hover || rating) ? 'text-brand-gold fill-brand-gold' : 'text-gray-300 dark:text-white/20'
            }`}
          />
        </button>
      ))}
    </div>
  );
}

export default function ProRatingForm({ booking, onSubmit }) {
  const [overall, setOverall] = useState(0);
  const [categories, setCategories] = useState({});
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [submitted, setSubmitted] = useState(false);

  function updateCategory(id, value) {
    setCategories(prev => ({ ...prev, [id]: value }));
  }

  async function handleSubmit() {
    if (overall === 0) { setError('Please give an overall rating'); return; }
    setSubmitting(true);
    setError('');
    try {
      await onSubmit?.({
        bookingId: booking.id,
        overall,
        categories,
        comment: comment.trim(),
        createdAt: new Date().toISOString(),
      });
      setSubmitted(true);
    } catch { setError('Failed to submit rating'); }
    finally { setSubmitting(false); }
  }

  if (submitted) {
    return (
      <div className="p-6 text-center border border-gray-100 dark:border-white/10 rounded-2xl">
        <div className="flex items-center justify-center w-12 h-12 mx-auto mb-3 rounded-full bg-brand-gold/10">
          <Star size={24} className="text-brand-gold fill-brand-gold" />
        </div>
        <p className="text-sm font-bold text-brand-charcoal-dark dark:text-white">Thank you for your feedback!</p>
        <p className="mt-1 text-xs text-gray-400">Your rating helps other users find great providers.</p>
      </div>
    );
  }

  return (
    <div className="p-4 border border-gray-100 dark:border-white/10 rounded-2xl">
      <h4 className="mb-1 text-sm font-bold text-brand-charcoal-dark dark:text-white">Rate Your Experience</h4>
      <p className="mb-4 text-xs text-gray-400">How was the service from {booking.providerName}?</p>

      {/* Overall rating */}
      <div className="mb-5 text-center">
        <p className="mb-2 text-xs font-semibold text-gray-500">Overall Rating</p>
        <div className="flex justify-center">
          <StarInput rating={overall} onChange={setOverall} size={28} />
        </div>
        {overall > 0 && (
          <p className="mt-1 text-xs text-brand-gold font-bold">
            {overall === 5 ? 'Excellent!' : overall === 4 ? 'Great' : overall === 3 ? 'Good' : overall === 2 ? 'Fair' : 'Poor'}
          </p>
        )}
      </div>

      {/* Category ratings */}
      <div className="space-y-3 mb-5">
        {RATING_CATEGORIES.map(cat => (
          <div key={cat.id} className="flex items-center justify-between">
            <span className="text-xs text-gray-500">{cat.label}</span>
            <StarInput rating={categories[cat.id] || 0} onChange={v => updateCategory(cat.id, v)} size={16} />
          </div>
        ))}
      </div>

      {/* Comment */}
      <div className="mb-4">
        <label className="flex items-center gap-2 mb-1.5 text-xs font-semibold text-gray-500 dark:text-gray-400">
          <MessageSquare size={12} /> Comment (optional)
        </label>
        <textarea
          value={comment}
          onChange={e => setComment(e.target.value)}
          placeholder="Share your experience..."
          rows={3}
          className="w-full py-2.5 px-3 text-sm border border-gray-200 dark:border-white/10 rounded-xl bg-white dark:bg-white/5 text-brand-charcoal-dark dark:text-white placeholder:text-gray-300 focus:ring-2 focus:ring-brand-gold/30 focus:border-brand-gold outline-none resize-none"
        />
      </div>

      {error && <p className="mb-3 text-xs text-red-500">{error}</p>}

      <button
        onClick={handleSubmit}
        disabled={submitting}
        className="flex items-center justify-center gap-2 w-full px-4 py-3 text-sm font-bold text-white bg-brand-gold rounded-xl hover:bg-brand-gold-dark disabled:opacity-50"
      >
        {submitting ? <Loader2 size={16} className="animate-spin" /> : <Star size={16} />}
        Submit Rating
      </button>
    </div>
  );
}
