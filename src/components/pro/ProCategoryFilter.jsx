import { PRO_SERVICE_CATEGORY_MAP } from '../../data/proServiceCategoryFields.js';

/**
 * Horizontal scrollable category chip filter for Pro services.
 * Groups by tier with visual separator.
 */

const TIER_LABELS = {
  1: 'Quick Jobs',
  2: 'Functional',
  3: 'Specialist',
  4: 'Projects',
};

export default function ProCategoryFilter({ selected, onSelect, listings = [] }) {
  const categories = Object.entries(PRO_SERVICE_CATEGORY_MAP);

  // Group by tier
  const grouped = {};
  for (const [key, val] of categories) {
    if (!grouped[val.tier]) grouped[val.tier] = [];
    grouped[val.tier].push({ id: key, ...val });
  }

  // Count per category
  const countMap = {};
  for (const l of listings) {
    countMap[l.category] = (countMap[l.category] || 0) + 1;
  }

  return (
    <div className="flex gap-2 pb-1 overflow-x-auto scrollbar-none">
      {/* All button */}
      <button
        type="button"
        onClick={() => onSelect('all')}
        className={`flex items-center gap-1.5 px-4 py-2 rounded-xl border-2 text-xs font-bold whitespace-nowrap transition-all shrink-0
          ${selected === 'all'
            ? 'border-brand-gold bg-brand-gold text-white'
            : 'border-gray-200 dark:border-white/10 bg-white dark:bg-white/5 text-gray-600 dark:text-white/70 hover:border-brand-gold/50'}`}
      >
        🔧 All Services
      </button>

      {/* Categories grouped by tier */}
      {[1, 2, 3, 4].map(tier => (
        grouped[tier]?.map(cat => (
          <button
            key={cat.id}
            type="button"
            onClick={() => onSelect(cat.id)}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl border-2 text-xs font-bold whitespace-nowrap transition-all shrink-0
              ${selected === cat.id
                ? 'border-brand-gold bg-brand-gold text-white'
                : 'border-gray-200 dark:border-white/10 bg-white dark:bg-white/5 text-gray-600 dark:text-white/70 hover:border-brand-gold/50'}`}
          >
            {cat.icon} {cat.label}
            {countMap[cat.id] > 0 && (
              <span className="px-1.5 py-0.5 text-[9px] rounded-full bg-white/20">{countMap[cat.id]}</span>
            )}
          </button>
        ))
      ))}
    </div>
  );
}
