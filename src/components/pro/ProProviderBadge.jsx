import { PRO_PROVIDER_LEVELS } from '../../data/proConstants.js';

/**
 * Provider level badge — New Pro / Verified / Top Pro / Gold Pro
 */
export default function ProProviderBadge({ level, size = 'sm' }) {
  const config = PRO_PROVIDER_LEVELS[level] || PRO_PROVIDER_LEVELS.new;
  const isLg = size === 'lg';

  return (
    <span
      className={[
        'inline-flex items-center font-bold rounded-full',
        isLg ? 'px-3 py-1.5 text-xs' : 'px-2 py-0.5 text-[10px]',
        config.color,
      ].join(' ')}
    >
      {config.label}
    </span>
  );
}
