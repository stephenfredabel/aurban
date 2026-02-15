import { PRODUCT_CATEGORY_MAP } from '../../data/categoryFields.js';

/* ════════════════════════════════════════════════════════════
   CATEGORY FIELDS STEP — Dynamic form renderer for product specs
   Reads field definitions from categoryFields.js and renders
   the appropriate controls per category.
════════════════════════════════════════════════════════════ */

export default function CategoryFieldsStep({ category, values, onChange }) {
  const catDef = PRODUCT_CATEGORY_MAP[category];
  if (!catDef || !catDef.fields?.length) {
    return (
      <div className="py-8 text-center">
        <p className="text-sm text-gray-400">No additional specifications needed for this category.</p>
      </div>
    );
  }

  const handleChange = (fieldId, value) => {
    onChange({ ...values, [fieldId]: value });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-2">
        <span className="text-xl">{catDef.emoji}</span>
        <h3 className="text-sm font-bold text-brand-charcoal-dark dark:text-white">
          {catDef.label} — Specifications
        </h3>
      </div>
      <p className="mb-4 text-xs text-gray-400">
        Fill in the product specifications to help buyers find your listing.
      </p>

      <div className="grid gap-4 sm:grid-cols-2">
        {catDef.fields.map((field) => {
          const val = values[field.id] ?? '';

          // ── Select ──
          if (field.type === 'select' && field.options) {
            return (
              <div key={field.id}>
                <label className="block mb-1.5 text-xs font-semibold text-gray-500 dark:text-gray-400">
                  {field.label} {field.required && <span className="text-red-400">*</span>}
                </label>
                <select
                  value={val}
                  onChange={e => handleChange(field.id, e.target.value)}
                  className="w-full py-2.5 px-3 text-sm border border-gray-200 dark:border-white/10 rounded-xl bg-white dark:bg-white/5 text-brand-charcoal-dark dark:text-white focus:ring-2 focus:ring-brand-gold/30 focus:border-brand-gold outline-none"
                >
                  <option value="">Select {field.label.toLowerCase()}</option>
                  {field.options.map(opt => (
                    <option key={opt} value={opt}>{opt}</option>
                  ))}
                </select>
              </div>
            );
          }

          // ── Toggle / boolean ──
          if (field.type === 'toggle') {
            return (
              <div key={field.id} className="flex items-center justify-between p-3 border border-gray-200 dark:border-white/10 rounded-xl">
                <span className="text-sm font-medium text-brand-charcoal-dark dark:text-white">
                  {field.label}
                </span>
                <button
                  type="button"
                  onClick={() => handleChange(field.id, !val)}
                  className={`relative w-10 h-6 rounded-full transition-colors ${val ? 'bg-brand-gold' : 'bg-gray-200 dark:bg-white/10'}`}
                >
                  <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${val ? 'left-[18px]' : 'left-0.5'}`} />
                </button>
              </div>
            );
          }

          // ── Number ──
          if (field.type === 'number') {
            return (
              <div key={field.id}>
                <label className="block mb-1.5 text-xs font-semibold text-gray-500 dark:text-gray-400">
                  {field.label} {field.required && <span className="text-red-400">*</span>}
                </label>
                <input
                  type="number"
                  value={val}
                  onChange={e => handleChange(field.id, e.target.value)}
                  placeholder={field.placeholder || `Enter ${field.label.toLowerCase()}`}
                  className="w-full py-2.5 px-3 text-sm border border-gray-200 dark:border-white/10 rounded-xl bg-white dark:bg-white/5 text-brand-charcoal-dark dark:text-white placeholder:text-gray-300 focus:ring-2 focus:ring-brand-gold/30 focus:border-brand-gold outline-none"
                />
              </div>
            );
          }

          // ── Multi-select (checkboxes) ──
          if (field.type === 'multi-select' && field.options) {
            const selected = Array.isArray(val) ? val : [];
            return (
              <div key={field.id} className="sm:col-span-2">
                <label className="block mb-1.5 text-xs font-semibold text-gray-500 dark:text-gray-400">
                  {field.label} {field.required && <span className="text-red-400">*</span>}
                </label>
                <div className="flex flex-wrap gap-2">
                  {field.options.map(opt => {
                    const active = selected.includes(opt);
                    return (
                      <button
                        key={opt}
                        type="button"
                        onClick={() => {
                          const next = active ? selected.filter(s => s !== opt) : [...selected, opt];
                          handleChange(field.id, next);
                        }}
                        className={`px-3 py-1.5 text-xs font-semibold rounded-lg border transition-colors ${
                          active
                            ? 'border-brand-gold bg-brand-gold/10 text-brand-gold'
                            : 'border-gray-200 dark:border-white/10 text-gray-500 hover:border-brand-gold/50'
                        }`}
                      >
                        {opt}
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          }

          // ── Default: text input ──
          return (
            <div key={field.id}>
              <label className="block mb-1.5 text-xs font-semibold text-gray-500 dark:text-gray-400">
                {field.label} {field.required && <span className="text-red-400">*</span>}
              </label>
              <input
                type="text"
                value={val}
                onChange={e => handleChange(field.id, e.target.value)}
                placeholder={field.placeholder || `Enter ${field.label.toLowerCase()}`}
                className="w-full py-2.5 px-3 text-sm border border-gray-200 dark:border-white/10 rounded-xl bg-white dark:bg-white/5 text-brand-charcoal-dark dark:text-white placeholder:text-gray-300 focus:ring-2 focus:ring-brand-gold/30 focus:border-brand-gold outline-none"
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}
