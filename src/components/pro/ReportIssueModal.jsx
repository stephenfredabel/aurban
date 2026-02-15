import { useState } from 'react';
import { X, AlertTriangle, Camera, Loader2, Shield } from 'lucide-react';
import { PRO_ISSUE_CATEGORIES } from '../../data/proConstants.js';

/**
 * Report issue modal — shown during observation window.
 * On submit, escrow is frozen until the issue is resolved.
 */
export default function ReportIssueModal({ booking, onSubmit, onClose }) {
  const [category, setCategory] = useState('');
  const [description, setDescription] = useState('');
  const [photos, setPhotos] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState({});

  function validate() {
    const errs = {};
    if (!category) errs.category = 'Select an issue category';
    if (!description.trim()) errs.description = 'Describe the issue';
    if (description.trim().length < 20) errs.description = 'Please provide more detail (at least 20 characters)';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  async function handleSubmit() {
    if (!validate()) return;
    setSubmitting(true);
    try {
      await onSubmit?.({
        bookingId: booking.id,
        category,
        description: description.trim(),
        photos,
        reportedAt: new Date().toISOString(),
      });
    } catch {
      setErrors({ submit: 'Failed to submit. Please try again.' });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="w-full max-w-md bg-white dark:bg-gray-900 rounded-2xl shadow-2xl max-h-[85vh] overflow-y-auto">

        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-100 dark:border-white/10">
          <div className="flex items-center gap-2">
            <AlertTriangle size={16} className="text-red-500" />
            <h3 className="text-sm font-bold text-brand-charcoal-dark dark:text-white">Report an Issue</h3>
          </div>
          <button onClick={onClose} className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg">
            <X size={16} />
          </button>
        </div>

        <div className="p-4 space-y-4">

          {/* Escrow freeze warning */}
          <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-500/10 border border-amber-100 dark:border-amber-500/20">
            <p className="text-[11px] text-amber-700 dark:text-amber-300">
              <strong>Important:</strong> Reporting an issue will freeze the escrow. The provider will be notified
              and given 72 hours to schedule a fix. If unresolved, it escalates to Aurban support.
            </p>
          </div>

          {/* Issue category */}
          <div>
            <label className="mb-1.5 text-xs font-semibold text-gray-500 dark:text-gray-400 block">Issue Category</label>
            <select
              value={category}
              onChange={e => { setCategory(e.target.value); setErrors(p => ({ ...p, category: undefined })); }}
              className={`w-full py-2.5 px-3 text-sm border rounded-xl bg-white dark:bg-white/5 text-brand-charcoal-dark dark:text-white focus:ring-2 focus:ring-brand-gold/30 focus:border-brand-gold outline-none ${
                errors.category ? 'border-red-400' : 'border-gray-200 dark:border-white/10'
              }`}
            >
              <option value="">Select category</option>
              {PRO_ISSUE_CATEGORIES.map(c => (
                <option key={c.id} value={c.id}>{c.label}</option>
              ))}
            </select>
            {errors.category && <p className="mt-1 text-xs text-red-500">{errors.category}</p>}
            {category && (
              <p className="mt-1 text-[11px] text-gray-400">
                {PRO_ISSUE_CATEGORIES.find(c => c.id === category)?.desc}
              </p>
            )}
          </div>

          {/* Description */}
          <div>
            <label className="mb-1.5 text-xs font-semibold text-gray-500 dark:text-gray-400 block">Description</label>
            <textarea
              value={description}
              onChange={e => { setDescription(e.target.value); setErrors(p => ({ ...p, description: undefined })); }}
              placeholder="Describe the issue in detail. What was agreed vs what happened?"
              rows={4}
              className={`w-full py-2.5 px-3 text-sm border rounded-xl bg-white dark:bg-white/5 text-brand-charcoal-dark dark:text-white placeholder:text-gray-300 focus:ring-2 focus:ring-brand-gold/30 focus:border-brand-gold outline-none resize-none ${
                errors.description ? 'border-red-400' : 'border-gray-200 dark:border-white/10'
              }`}
            />
            {errors.description && <p className="mt-1 text-xs text-red-500">{errors.description}</p>}
          </div>

          {/* Photos */}
          <div>
            <label className="mb-1.5 text-xs font-semibold text-gray-500 dark:text-gray-400 block">Evidence Photos</label>
            <div className="flex flex-wrap gap-2">
              {photos.map((_, i) => (
                <div key={i} className="flex items-center justify-center w-16 h-16 text-xs text-gray-400 bg-gray-100 dark:bg-white/5 rounded-xl">
                  Photo {i + 1}
                </div>
              ))}
              <button
                type="button"
                onClick={() => setPhotos(prev => [...prev, 'placeholder'])}
                className="flex flex-col items-center justify-center w-16 h-16 text-gray-400 border-2 border-dashed border-gray-200 dark:border-white/10 rounded-xl hover:border-brand-gold/50"
              >
                <Camera size={16} />
                <span className="text-[9px] mt-0.5">Add</span>
              </button>
            </div>
          </div>

          {errors.submit && <p className="text-xs text-red-500">{errors.submit}</p>}

          {/* Actions */}
          <div className="flex gap-2 pt-2">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2.5 text-xs font-bold border border-gray-200 dark:border-white/10 rounded-xl text-brand-charcoal-dark dark:text-white"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={submitting}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-bold text-white bg-red-600 rounded-xl hover:bg-red-700 disabled:opacity-50"
            >
              {submitting ? <Loader2 size={14} className="animate-spin" /> : <AlertTriangle size={14} />}
              Submit Report
            </button>
          </div>

          <p className="text-center text-[10px] text-gray-400 flex items-center justify-center gap-1">
            <Shield size={10} className="text-brand-gold" />
            Escrow will be frozen until resolution
          </p>
        </div>
      </div>
    </div>
  );
}
