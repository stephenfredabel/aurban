import { Award, TrendingUp, Star, Shield } from 'lucide-react';
import { PRO_PROVIDER_LEVELS } from '../../data/proConstants.js';

/**
 * ProviderLevelCard — Shows current provider level badge with stats.
 * Used in provider dashboard sidebar or profile header.
 *
 * @param {string} level — 'new' | 'verified' | 'top' | 'gold'
 * @param {number} completedJobs
 * @param {number} rating
 * @param {number} totalEarnings
 * @param {string} symbol — currency symbol
 */

const LEVEL_ICONS = {
  new: Shield,
  verified: Award,
  top: Star,
  gold: TrendingUp,
};

const LEVEL_BADGE_COLORS = {
  new: 'from-gray-400 to-gray-500',
  verified: 'from-blue-400 to-blue-600',
  top: 'from-purple-400 to-purple-600',
  gold: 'from-amber-400 to-amber-600',
};

export default function ProviderLevelCard({
  level = 'new',
  completedJobs = 0,
  rating = 0,
  totalEarnings = 0,
  symbol = '₦',
}) {
  const cfg = PRO_PROVIDER_LEVELS[level] || PRO_PROVIDER_LEVELS.new;
  const Icon = LEVEL_ICONS[level] || Shield;
  const gradient = LEVEL_BADGE_COLORS[level] || LEVEL_BADGE_COLORS.new;

  return (
    <div className="p-4 border border-gray-100 dark:border-white/10 rounded-2xl">
      <div className="flex items-center gap-3 mb-3">
        <div className={`flex items-center justify-center w-12 h-12 rounded-2xl bg-gradient-to-br ${gradient} text-white shadow-sm`}>
          <Icon size={20} />
        </div>
        <div>
          <span className={`inline-block px-2.5 py-0.5 text-[10px] font-bold rounded-full ${cfg.color}`}>
            {cfg.label}
          </span>
          <p className="text-xs text-gray-400 mt-0.5">Provider Level</p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div className="text-center">
          <p className="text-lg font-bold font-display text-brand-charcoal-dark dark:text-white">{completedJobs}</p>
          <p className="text-[10px] text-gray-400">Jobs</p>
        </div>
        <div className="text-center">
          <p className="text-lg font-bold font-display text-brand-charcoal-dark dark:text-white">{rating.toFixed(1)}</p>
          <p className="text-[10px] text-gray-400">Rating</p>
        </div>
        <div className="text-center">
          <p className="text-lg font-bold font-display text-brand-charcoal-dark dark:text-white">
            {symbol}{totalEarnings >= 1_000_000 ? `${(totalEarnings / 1_000_000).toFixed(1)}M` : totalEarnings >= 1_000 ? `${Math.round(totalEarnings / 1_000)}K` : totalEarnings.toLocaleString()}
          </p>
          <p className="text-[10px] text-gray-400">Earned</p>
        </div>
      </div>
    </div>
  );
}
