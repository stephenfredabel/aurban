import { Check, Circle, Clock, Wallet, ChevronRight } from 'lucide-react';
import { useCurrency } from '../../hooks/useCurrency.js';
import { PRO_TIER4_STATUSES, TIER_CONFIG } from '../../data/proConstants.js';

/**
 * Visual milestone tracker for Tier 4 (project-based) bookings.
 * Renders a vertical stepper showing each milestone phase with
 * status indicators, amounts, release dates, and action buttons.
 *
 * Milestone statuses: pending | in_progress | released
 */

const STATUS_STYLES = {
  released: {
    dot: 'bg-emerald-100 dark:bg-emerald-500/20',
    icon: 'text-emerald-600 dark:text-emerald-400',
    badge: 'bg-green-50 text-green-700 dark:bg-green-500/15 dark:text-green-400',
    badgeLabel: 'Released',
    line: 'bg-emerald-400 dark:bg-emerald-500',
  },
  in_progress: {
    dot: 'bg-brand-gold/15',
    icon: 'text-brand-gold',
    badge: 'bg-amber-50 text-amber-600 dark:bg-amber-500/15 dark:text-amber-400',
    badgeLabel: 'In Progress',
    line: 'bg-brand-gold',
  },
  pending: {
    dot: 'bg-gray-100 dark:bg-white/5',
    icon: 'text-gray-400 dark:text-white/30',
    badge: 'bg-gray-100 text-gray-500 dark:bg-gray-500/15 dark:text-gray-400',
    badgeLabel: 'Pending',
    line: 'bg-gray-200 dark:bg-white/10',
  },
};

function formatDate(dateStr) {
  if (!dateStr) return null;
  return new Date(dateStr).toLocaleDateString('en-NG', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function MilestoneTracker({
  milestones = [],
  totalPrice = 0,
  onRelease,
  readonly = false,
  bookingStatus: _bookingStatus,
}) {
  const { symbol } = useCurrency();

  if (!milestones.length) return null;

  const releasedTotal = milestones
    .filter(m => m.status === 'released')
    .reduce((sum, m) => sum + (m.amount || 0), 0);
  const pendingTotal = totalPrice - releasedTotal;

  return (
    <div className="p-4 border border-gray-100 dark:border-white/10 rounded-2xl shadow-card">
      {/* ─── Header ─── */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Wallet size={16} className="text-brand-gold" />
          <h4 className="text-xs font-bold font-display text-brand-charcoal-dark dark:text-white section-title">
            Milestone Progress
          </h4>
        </div>
        <span className="text-lg font-extrabold font-display text-brand-gold">
          {symbol}{totalPrice.toLocaleString()}
        </span>
      </div>

      {/* ─── Overall progress bar ─── */}
      <div className="mb-5">
        <div className="flex justify-between text-[10px] text-gray-400 mb-1.5">
          <span>
            {milestones.filter(m => m.status === 'released').length} of {milestones.length} milestones released
          </span>
          <span>
            {totalPrice > 0 ? Math.round((releasedTotal / totalPrice) * 100) : 0}%
          </span>
        </div>
        <div className="w-full h-2 bg-gray-100 dark:bg-white/5 rounded-full overflow-hidden">
          <div
            className="h-full bg-brand-gold rounded-full transition-all duration-500"
            style={{ width: totalPrice > 0 ? `${(releasedTotal / totalPrice) * 100}%` : '0%' }}
          />
        </div>
      </div>

      {/* ─── Vertical timeline ─── */}
      <div className="relative pl-6">
        {/* Vertical connecting line */}
        <div className="absolute left-[9px] top-1 bottom-1 w-0.5 bg-gray-200 dark:bg-white/10" />

        {milestones.map((milestone, idx) => {
          const style = STATUS_STYLES[milestone.status] || STATUS_STYLES.pending;
          const isLast = idx === milestones.length - 1;
          const tier4Def = Object.values(PRO_TIER4_STATUSES).find(
            s => s.phase === milestone.phase,
          );

          return (
            <div
              key={milestone.id || idx}
              className={`relative flex items-start gap-3 ${isLast ? 'pb-0' : 'pb-5'}`}
            >
              {/* Colored segment of the connecting line for completed milestones */}
              {milestone.status === 'released' && !isLast && (
                <div
                  className="absolute left-[9px] top-1 w-0.5 bg-emerald-400 dark:bg-emerald-500"
                  style={{ height: 'calc(100% + 4px)' }}
                />
              )}

              {/* Dot / icon */}
              <div className="absolute -left-6 z-10">
                {milestone.status === 'released' ? (
                  <div className={`flex items-center justify-center w-[18px] h-[18px] rounded-full ${style.dot}`}>
                    <Check size={12} className={style.icon} strokeWidth={3} />
                  </div>
                ) : milestone.status === 'in_progress' ? (
                  <div className="flex items-center justify-center w-[18px] h-[18px] rounded-full border-2 border-brand-gold bg-brand-gold/10">
                    <div className="w-2 h-2 rounded-full bg-brand-gold animate-pulse" />
                  </div>
                ) : (
                  <Circle size={18} className={style.icon} />
                )}
              </div>

              {/* Content card */}
              <div className={`flex-1 min-w-0 p-3 rounded-xl border transition-all ${
                milestone.status === 'in_progress'
                  ? 'border-brand-gold/30 bg-brand-gold/5 dark:bg-brand-gold/5'
                  : milestone.status === 'released'
                    ? 'border-emerald-100 dark:border-emerald-500/20 bg-emerald-50/50 dark:bg-emerald-500/5'
                    : 'border-gray-100 dark:border-white/10 bg-gray-50/50 dark:bg-white/[0.02]'
              }`}>
                {/* Top row: label + badge */}
                <div className="flex items-center justify-between mb-1.5">
                  <p className={`text-xs font-semibold ${
                    milestone.status === 'released'
                      ? 'text-brand-charcoal-dark dark:text-white'
                      : milestone.status === 'in_progress'
                        ? 'text-brand-gold'
                        : 'text-gray-400 dark:text-white/30'
                  }`}>
                    {milestone.label || tier4Def?.label || `Phase ${milestone.phase}`}
                  </p>
                  <span className={`px-2 py-0.5 text-[10px] font-bold rounded-full ${style.badge}`}>
                    {style.badgeLabel}
                  </span>
                </div>

                {/* Percentage + amount */}
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] text-gray-400">
                    {milestone.percent}% of total
                  </span>
                  <span className="text-sm font-bold font-display text-brand-charcoal-dark dark:text-white">
                    {symbol}{(milestone.amount || 0).toLocaleString()}
                  </span>
                </div>

                {/* Release date */}
                {milestone.status === 'released' && milestone.releasedAt && (
                  <div className="flex items-center gap-1 mt-1.5">
                    <Clock size={10} className="text-emerald-500" />
                    <span className="text-[10px] text-gray-400">
                      Released {formatDate(milestone.releasedAt)}
                    </span>
                  </div>
                )}

                {/* Release button */}
                {milestone.status === 'in_progress' && !readonly && onRelease && (
                  <button
                    type="button"
                    onClick={() => onRelease(milestone.id)}
                    className="flex items-center justify-center gap-1.5 w-full mt-3 px-4 py-2 text-xs font-bold text-white bg-brand-gold hover:bg-brand-gold/90 rounded-xl transition-all active:scale-[0.98]"
                  >
                    Release Payment
                    <ChevronRight size={14} />
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* ─── Summary bar ─── */}
      <div className="flex items-center justify-between mt-5 p-3 bg-gray-50 dark:bg-white/[0.02] rounded-xl border border-gray-100 dark:border-white/10">
        <div className="flex items-center gap-1.5">
          <div className="w-2 h-2 rounded-full bg-emerald-500" />
          <span className="text-[11px] text-gray-500 dark:text-gray-400">
            Released: <strong className="text-brand-charcoal-dark dark:text-white">{symbol}{releasedTotal.toLocaleString()}</strong>
            <span className="text-gray-300 dark:text-white/20 mx-1">/</span>
            {symbol}{totalPrice.toLocaleString()}
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-2 h-2 rounded-full bg-gray-300 dark:bg-white/20" />
          <span className="text-[11px] text-gray-500 dark:text-gray-400">
            Pending: <strong className="text-brand-charcoal-dark dark:text-white">{symbol}{pendingTotal.toLocaleString()}</strong>
          </span>
        </div>
      </div>
    </div>
  );
}
