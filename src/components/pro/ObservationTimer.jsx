import { useState, useEffect } from 'react';
import { Clock, Shield, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { TIER_CONFIG } from '../../data/proConstants.js';

/**
 * Observation window countdown timer.
 * Shows days/hours remaining, progress bar, and auto-release notice.
 */
export default function ObservationTimer({ completedAt, tier, onExpired }) {
  const tierCfg = TIER_CONFIG[tier] || TIER_CONFIG[1];
  const durationMs = tierCfg.observationDays * 24 * 60 * 60 * 1000;
  const endTime = new Date(completedAt).getTime() + durationMs;

  const [remaining, setRemaining] = useState(() => Math.max(0, endTime - Date.now()));
  const expired = remaining <= 0;
  const progress = Math.min(100, ((durationMs - remaining) / durationMs) * 100);

  useEffect(() => {
    if (expired) {
      onExpired?.();
      return;
    }
    const id = setInterval(() => {
      const r = Math.max(0, endTime - Date.now());
      setRemaining(r);
      if (r <= 0) {
        onExpired?.();
        clearInterval(id);
      }
    }, 60_000); // update every minute
    return () => clearInterval(id);
  }, [endTime, expired, onExpired]);

  const days = Math.floor(remaining / 86_400_000);
  const hours = Math.floor((remaining % 86_400_000) / 3_600_000);
  const minutes = Math.floor((remaining % 3_600_000) / 60_000);

  return (
    <div className={`p-4 rounded-2xl border ${
      expired
        ? 'bg-emerald-50 dark:bg-emerald-500/10 border-emerald-100 dark:border-emerald-500/20'
        : 'bg-purple-50 dark:bg-purple-500/10 border-purple-100 dark:border-purple-500/20'
    }`}>
      <div className="flex items-center gap-2 mb-3">
        {expired ? (
          <CheckCircle2 size={16} className="text-emerald-600" />
        ) : (
          <Clock size={16} className="text-purple-600" />
        )}
        <h4 className={`text-xs font-bold ${expired ? 'text-emerald-700 dark:text-emerald-300' : 'text-purple-700 dark:text-purple-300'}`}>
          {expired ? 'Observation Complete' : 'Observation Window'}
        </h4>
        <span className={`ml-auto text-[10px] font-bold px-2 py-0.5 rounded-full ${
          expired
            ? 'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300'
            : 'bg-purple-100 dark:bg-purple-500/20 text-purple-700 dark:text-purple-300'
        }`}>
          {tierCfg.observationDays}-day window
        </span>
      </div>

      {/* Countdown */}
      {!expired ? (
        <div className="mb-3">
          <div className="flex items-center justify-center gap-4 mb-2">
            <div className="text-center">
              <p className="text-2xl font-extrabold font-display text-purple-700 dark:text-purple-300">{days}</p>
              <p className="text-[10px] text-purple-500">Days</p>
            </div>
            <span className="text-lg font-bold text-purple-400">:</span>
            <div className="text-center">
              <p className="text-2xl font-extrabold font-display text-purple-700 dark:text-purple-300">{hours}</p>
              <p className="text-[10px] text-purple-500">Hours</p>
            </div>
            <span className="text-lg font-bold text-purple-400">:</span>
            <div className="text-center">
              <p className="text-2xl font-extrabold font-display text-purple-700 dark:text-purple-300">{String(minutes).padStart(2, '0')}</p>
              <p className="text-[10px] text-purple-500">Mins</p>
            </div>
          </div>

          {/* Progress bar */}
          <div className="h-2 bg-purple-200 dark:bg-purple-500/20 rounded-full overflow-hidden">
            <div
              className="h-full bg-purple-500 rounded-full transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="mt-1 text-center text-[10px] text-purple-500">
            {Math.round(progress)}% elapsed
          </p>
        </div>
      ) : (
        <p className="mb-3 text-sm font-bold text-center text-emerald-700 dark:text-emerald-300">
          Balance will be auto-released to the provider
        </p>
      )}

      {/* Notice */}
      <div className="flex items-start gap-2 p-2.5 rounded-xl bg-white/60 dark:bg-white/5">
        {expired ? (
          <Shield size={12} className="text-emerald-600 shrink-0 mt-0.5" />
        ) : (
          <AlertTriangle size={12} className="text-purple-600 shrink-0 mt-0.5" />
        )}
        <p className="text-[11px] text-gray-600 dark:text-white/70">
          {expired
            ? 'No issues were reported during the observation window. The remaining balance will be released to the provider automatically.'
            : 'If you notice any issues with the work, report them now. The escrow will freeze until the issue is resolved.'
          }
        </p>
      </div>
    </div>
  );
}
