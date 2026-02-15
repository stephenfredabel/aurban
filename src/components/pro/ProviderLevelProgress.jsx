import { PRO_PROVIDER_LEVELS } from '../../data/proConstants.js';

/**
 * ProviderLevelProgress — Progress bar showing how close
 * the provider is to the next level.
 *
 * @param {string} currentLevel — 'new' | 'verified' | 'top' | 'gold'
 * @param {number} completedJobs — total completed jobs
 */

const LEVELS_ORDER = ['new', 'verified', 'top', 'gold'];

const LEVEL_COLORS = {
  new: 'bg-gray-400',
  verified: 'bg-blue-500',
  top: 'bg-purple-500',
  gold: 'bg-amber-500',
};

export default function ProviderLevelProgress({ currentLevel = 'new', completedJobs = 0 }) {
  const currentIdx = LEVELS_ORDER.indexOf(currentLevel);
  const isMaxLevel = currentIdx >= LEVELS_ORDER.length - 1;
  const nextLevel = isMaxLevel ? null : LEVELS_ORDER[currentIdx + 1];
  const nextCfg = nextLevel ? PRO_PROVIDER_LEVELS[nextLevel] : null;
  const currentCfg = PRO_PROVIDER_LEVELS[currentLevel] || PRO_PROVIDER_LEVELS.new;

  // Calculate progress to next level
  const currentMin = currentCfg.minJobs;
  const nextMin = nextCfg ? nextCfg.minJobs : currentCfg.minJobs;
  const range = nextMin - currentMin;
  const progress = isMaxLevel ? 100 : range > 0 ? Math.min(100, ((completedJobs - currentMin) / range) * 100) : 100;
  const jobsRemaining = isMaxLevel ? 0 : Math.max(0, nextMin - completedJobs);

  return (
    <div className="p-4 border border-gray-100 dark:border-white/10 rounded-2xl">
      <div className="flex items-center justify-between mb-2">
        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${currentCfg.color}`}>
          {currentCfg.label}
        </span>
        {nextCfg && (
          <span className="text-[10px] text-gray-400">
            {jobsRemaining} job{jobsRemaining !== 1 ? 's' : ''} to <span className="font-semibold">{nextCfg.label}</span>
          </span>
        )}
        {isMaxLevel && (
          <span className="text-[10px] text-amber-600 font-semibold">Maximum Level</span>
        )}
      </div>

      {/* Progress bar */}
      <div className="h-2 bg-gray-100 dark:bg-white/10 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-700 ${LEVEL_COLORS[currentLevel] || 'bg-gray-400'}`}
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Level markers */}
      <div className="flex justify-between mt-2">
        {LEVELS_ORDER.map((lvl, i) => {
          const lvlCfg = PRO_PROVIDER_LEVELS[lvl];
          const reached = i <= currentIdx;
          return (
            <div key={lvl} className="text-center">
              <div className={`w-2 h-2 mx-auto rounded-full mb-0.5 ${reached ? LEVEL_COLORS[lvl] : 'bg-gray-200 dark:bg-white/10'}`} />
              <span className={`text-[9px] ${reached ? 'text-brand-charcoal-dark dark:text-white font-semibold' : 'text-gray-400'}`}>
                {lvlCfg.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
