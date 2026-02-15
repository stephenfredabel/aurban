import { useState } from 'react';
import { CheckCircle2, Camera, FileText, Loader2, Clock } from 'lucide-react';
import { TIER_CONFIG } from '../../data/proConstants.js';

/**
 * Provider checkout form — marks work as complete, adds notes,
 * optionally uploads before/after photos, and triggers the
 * observation window.
 */
export default function ProCheckOut({ booking, onCheckOut, disabled }) {
  const [notes, setNotes] = useState('');
  const [photos, setPhotos] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const tierCfg = TIER_CONFIG[booking?.tier] || TIER_CONFIG[1];

  async function handleSubmit() {
    if (!notes.trim()) {
      setError('Please add completion notes describing the work done');
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      await onCheckOut({
        bookingId: booking.id,
        completionNotes: notes.trim(),
        completionPhotos: photos,
        completedAt: new Date().toISOString(),
      });
    } catch (err) {
      setError(err?.message || 'Failed to submit. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-5">
      <div className="text-center">
        <div className="flex items-center justify-center w-14 h-14 mx-auto mb-3 rounded-full bg-emerald-100 dark:bg-emerald-500/20">
          <CheckCircle2 size={28} className="text-emerald-600" />
        </div>
        <h3 className="mb-1 text-sm font-bold text-brand-charcoal-dark dark:text-white">Mark Work Complete</h3>
        <p className="text-xs text-gray-400">This will start the {tierCfg.observationDays}-day observation window</p>
      </div>

      {/* Completion notes */}
      <div>
        <label className="flex items-center gap-2 mb-1.5 text-xs font-semibold text-gray-500 dark:text-gray-400">
          <FileText size={12} /> Completion Notes
        </label>
        <textarea
          value={notes}
          onChange={e => { setNotes(e.target.value); setError(''); }}
          placeholder="Describe the work completed, any notes for the client..."
          rows={4}
          className={`w-full py-2.5 px-3 text-sm border rounded-xl bg-white dark:bg-white/5 text-brand-charcoal-dark dark:text-white placeholder:text-gray-300 focus:ring-2 focus:ring-brand-gold/30 focus:border-brand-gold outline-none resize-none ${
            error ? 'border-red-400' : 'border-gray-200 dark:border-white/10'
          }`}
        />
        {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
      </div>

      {/* Photos */}
      <div>
        <label className="flex items-center gap-2 mb-1.5 text-xs font-semibold text-gray-500 dark:text-gray-400">
          <Camera size={12} /> Before/After Photos (optional)
        </label>
        <div className="flex flex-wrap gap-2">
          {photos.map((_, i) => (
            <div key={i} className="flex items-center justify-center w-16 h-16 text-xs text-gray-400 bg-gray-100 dark:bg-white/5 rounded-xl">
              Photo {i + 1}
            </div>
          ))}
          <button
            type="button"
            onClick={() => setPhotos(prev => [...prev, 'placeholder'])}
            className="flex flex-col items-center justify-center w-16 h-16 text-gray-400 border-2 border-dashed border-gray-200 dark:border-white/10 rounded-xl hover:border-brand-gold/50 transition-colors"
          >
            <Camera size={16} />
            <span className="text-[9px] mt-0.5">Add</span>
          </button>
        </div>
      </div>

      {/* Observation window notice */}
      <div className="p-3 rounded-xl bg-purple-50 dark:bg-purple-500/10 border border-purple-100 dark:border-purple-500/20">
        <div className="flex items-start gap-2">
          <Clock size={14} className="text-purple-600 shrink-0 mt-0.5" />
          <div className="text-[11px] text-purple-700 dark:text-purple-300">
            <p className="font-bold mb-1">Observation window: {tierCfg.observationDays} days</p>
            <p>After you mark complete, the client has {tierCfg.observationDays} days to inspect the work. If no issues are reported, the remaining balance is released automatically.</p>
          </div>
        </div>
      </div>

      {/* Submit */}
      <button
        onClick={handleSubmit}
        disabled={submitting || disabled}
        className="flex items-center justify-center gap-2 w-full px-5 py-3 text-sm font-bold text-white rounded-xl bg-emerald-600 hover:bg-emerald-700 transition-colors disabled:opacity-50"
      >
        {submitting ? (
          <><Loader2 size={16} className="animate-spin" /> Submitting...</>
        ) : (
          <><CheckCircle2 size={16} /> Complete & Start Observation</>
        )}
      </button>
    </div>
  );
}
