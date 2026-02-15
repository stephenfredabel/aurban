import { TIER_CONFIG } from '../../data/proConstants.js';

/**
 * Color-coded tier indicator for Pro service listings.
 * T1=green, T2=blue, T3=purple, T4=amber
 */
export default function ProTierBadge({ tier, size = 'sm' }) {
  const config = TIER_CONFIG[tier] || TIER_CONFIG[1];
  const isLg = size === 'lg';

  return (
    <span
      className={[
        'inline-flex items-center gap-1 font-bold rounded-full',
        isLg ? 'px-3 py-1.5 text-xs' : 'px-2 py-0.5 text-[10px]',
        config.color,
      ].join(' ')}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${config.badgeColor}`} />
      {config.shortLabel}
    </span>
  );
}
