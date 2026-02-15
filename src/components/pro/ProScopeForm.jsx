import { FileText, Camera } from 'lucide-react';

/**
 * Work description + scope form for Pro booking.
 */
export default function ProScopeForm({ scope, scopePhotos, onChange, onPhotosChange, errors }) {
  return (
    <div className="space-y-5">
      <div>
        <h3 className="mb-1 text-sm font-bold text-brand-charcoal-dark dark:text-white">Describe the work needed</h3>
        <p className="mb-4 text-xs text-gray-400">Be specific so the provider can prepare properly. This protects you from scope-creep.</p>
      </div>

      {/* Scope description */}
      <div>
        <label className="flex items-center gap-2 mb-1.5 text-xs font-semibold text-gray-500 dark:text-gray-400">
          <FileText size={12} /> Work Description
        </label>
        <textarea
          value={scope}
          onChange={e => onChange(e.target.value)}
          placeholder="Example: Deep clean 3-bedroom flat. Kitchen needs degreasing, all bathrooms need scrubbing, floors mopped throughout. Windows (6 total) need washing inside and out."
          rows={5}
          className={`w-full py-2.5 px-3 text-sm border rounded-xl bg-white dark:bg-white/5 text-brand-charcoal-dark dark:text-white placeholder:text-gray-300 focus:ring-2 focus:ring-brand-gold/30 focus:border-brand-gold outline-none resize-none ${
            errors?.scope ? 'border-red-400' : 'border-gray-200 dark:border-white/10'
          }`}
        />
        {errors?.scope && <p className="mt-1 text-xs text-red-500">{errors.scope}</p>}
      </div>

      {/* Photos (optional) */}
      <div>
        <label className="flex items-center gap-2 mb-1.5 text-xs font-semibold text-gray-500 dark:text-gray-400">
          <Camera size={12} /> Photos (optional)
        </label>
        <p className="mb-2 text-[11px] text-gray-400">Add photos to help the provider understand the scope</p>
        <div className="flex flex-wrap gap-2">
          {scopePhotos?.map((_, i) => (
            <div key={i} className="flex items-center justify-center w-16 h-16 text-xs text-gray-400 bg-gray-100 rounded-xl dark:bg-white/5">
              Photo {i + 1}
            </div>
          ))}
          <button
            type="button"
            onClick={() => onPhotosChange([...(scopePhotos || []), 'placeholder'])}
            className="flex flex-col items-center justify-center w-16 h-16 text-gray-400 transition-colors border-2 border-dashed border-gray-200 dark:border-white/10 rounded-xl hover:border-brand-gold/50"
          >
            <Camera size={16} />
            <span className="text-[9px] mt-0.5">Add</span>
          </button>
        </div>
      </div>

      {/* Scope protection notice */}
      <div className="p-3 rounded-xl bg-blue-50 dark:bg-blue-500/10 border border-blue-100 dark:border-blue-500/20">
        <p className="text-[11px] text-blue-700 dark:text-blue-300">
          <strong>Scope protection:</strong> Any work beyond this description requires a separate add-on invoice that you must approve. You won't be charged for unagreed work.
        </p>
      </div>
    </div>
  );
}
