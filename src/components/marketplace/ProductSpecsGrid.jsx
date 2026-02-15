import { PRODUCT_CATEGORY_MAP } from '../../data/categoryFields.js';

/* ════════════════════════════════════════════════════════════
   PRODUCT SPECS GRID — Renders category-specific fields
   as a responsive label-value grid
════════════════════════════════════════════════════════════ */

function formatValue(val) {
  if (val === true) return 'Yes';
  if (val === false) return 'No';
  if (Array.isArray(val)) return val.join(', ');
  if (val == null || val === '') return '—';
  return String(val);
}

export default function ProductSpecsGrid({ category, categoryFields }) {
  if (!categoryFields || !category) return null;

  const catDef = PRODUCT_CATEGORY_MAP[category];
  if (!catDef) return null;

  // Build label→value pairs from category field definitions
  const specs = catDef.fields
    .map(fieldDef => {
      const val = categoryFields[fieldDef.id];
      if (val == null || val === '') return null;
      return { label: fieldDef.label, value: formatValue(val) };
    })
    .filter(Boolean);

  // Also include any fields in categoryFields not defined in catDef.fields
  const definedIds = new Set(catDef.fields.map(f => f.id));
  Object.entries(categoryFields).forEach(([key, val]) => {
    if (!definedIds.has(key) && val != null && val !== '') {
      const label = key
        .replace(/([A-Z])/g, ' $1')
        .replace(/^./, s => s.toUpperCase())
        .replace(/_/g, ' ');
      specs.push({ label, value: formatValue(val) });
    }
  });

  if (specs.length === 0) return null;

  return (
    <div>
      <h2 className="mb-3 font-bold font-display text-brand-charcoal-dark dark:text-white">
        Specifications
      </h2>
      <div className="overflow-hidden border border-gray-100 dark:border-white/10 rounded-2xl">
        <div className="divide-y divide-gray-100 dark:divide-white/10">
          {specs.map(({ label, value }, i) => (
            <div
              key={label}
              className={`flex items-start gap-4 px-4 py-3 text-sm ${
                i % 2 === 0 ? 'bg-gray-50/50 dark:bg-white/[0.02]' : 'bg-white dark:bg-transparent'
              }`}
            >
              <span className="w-1/3 font-semibold text-gray-500 dark:text-gray-400 shrink-0">
                {label}
              </span>
              <span className="flex-1 text-brand-charcoal-dark dark:text-white">
                {value}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
