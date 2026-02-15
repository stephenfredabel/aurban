import { Wallet, AlertTriangle, Loader2, CheckCircle } from 'lucide-react';

/**
 * MilestonePayment — payment breakdown and release confirmation
 * for a single milestone in a Tier 4 (project-based) booking.
 *
 * Shows the milestone details, amount, booking context,
 * an irreversibility warning, and Confirm / Cancel actions.
 */
export default function MilestonePayment({
  milestone,
  bookingTitle,
  providerName,
  symbol = '\u20A6',
  onConfirmRelease,
  onCancel,
  processing = false,
}) {
  if (!milestone) return null;

  const statusDone = milestone.status === 'released';

  return (
    <div className="w-full max-w-md mx-auto bg-white dark:bg-brand-charcoal-dark border border-gray-100 dark:border-white/10 rounded-2xl shadow-card overflow-hidden">

      {/* ── Header ─────────────────────────────────── */}
      <div className="flex items-center gap-3 px-5 py-4 border-b border-gray-100 dark:border-white/10">
        <div className="flex items-center justify-center w-10 h-10 rounded-2xl bg-brand-gold/10 shrink-0">
          <Wallet size={20} className="text-brand-gold" />
        </div>
        <div className="min-w-0">
          <h3 className="text-sm font-extrabold font-display text-brand-charcoal-dark dark:text-white">
            Release Milestone Payment
          </h3>
          <p className="text-xs text-gray-400">Tier 4 escrow release</p>
        </div>
      </div>

      <div className="px-5 py-5 space-y-5">

        {/* ── Milestone label + percentage badge ──── */}
        <div className="flex items-center justify-between">
          <p className="text-sm font-bold text-brand-charcoal-dark dark:text-white truncate">
            Phase {milestone.phase}: {milestone.label}
          </p>
          <span className="ml-2 shrink-0 px-2.5 py-0.5 text-[11px] font-bold rounded-full bg-brand-gold/15 text-brand-gold">
            {milestone.percent}%
          </span>
        </div>

        {/* ── Amount ────────────────────────────────── */}
        <div className="flex items-center justify-center p-4 bg-gray-50 dark:bg-white/[0.02] rounded-2xl">
          <p className="text-2xl font-extrabold font-display text-brand-gold">
            {symbol}{milestone.amount?.toLocaleString()}
          </p>
        </div>

        {/* ── Divider ──────────────────────────────── */}
        <div className="border-t border-gray-100 dark:border-white/10" />

        {/* ── Booking context ──────────────────────── */}
        <div className="space-y-2">
          <div className="flex justify-between text-xs">
            <span className="text-gray-500">Booking</span>
            <span className="font-semibold text-brand-charcoal-dark dark:text-white truncate max-w-[220px] text-right">
              {bookingTitle}
            </span>
          </div>
          <div className="flex justify-between text-xs">
            <span className="text-gray-500">Provider</span>
            <span className="font-semibold text-brand-charcoal-dark dark:text-white">
              {providerName}
            </span>
          </div>
          <div className="flex justify-between text-xs">
            <span className="text-gray-500">Milestone Status</span>
            <span className={`font-semibold ${
              statusDone
                ? 'text-emerald-600 dark:text-emerald-400'
                : 'text-amber-600 dark:text-amber-400'
            }`}>
              {statusDone ? 'Released' : milestone.status?.replace(/_/g, ' ') || 'Pending'}
            </span>
          </div>
        </div>

        {/* ── Divider ──────────────────────────────── */}
        <div className="border-t border-gray-100 dark:border-white/10" />

        {/* ── Warning note ─────────────────────────── */}
        <div className="flex items-start gap-2.5 p-3.5 bg-amber-50 dark:bg-amber-500/10 rounded-xl border border-amber-200 dark:border-amber-500/20">
          <AlertTriangle size={15} className="text-amber-500 shrink-0 mt-0.5" />
          <p className="text-[11px] leading-relaxed text-amber-700 dark:text-amber-300">
            This will release funds from escrow to the provider's wallet.
            <strong className="block mt-0.5">This action cannot be undone.</strong>
          </p>
        </div>

        {/* ── Already released banner ──────────────── */}
        {statusDone && (
          <div className="flex items-center gap-3 p-3.5 bg-emerald-50 dark:bg-emerald-500/10 rounded-xl border border-emerald-100 dark:border-emerald-500/20">
            <CheckCircle size={16} className="text-emerald-500 shrink-0" />
            <p className="text-xs font-semibold text-emerald-700 dark:text-emerald-300">
              This milestone has already been released.
            </p>
          </div>
        )}

        {/* ── Action buttons ───────────────────────── */}
        {!statusDone && (
          <div className="flex gap-3 pt-1">
            <button
              type="button"
              onClick={onCancel}
              disabled={processing}
              className="flex-1 px-4 py-3 text-sm font-bold border border-gray-200 dark:border-white/10 rounded-xl text-brand-charcoal-dark dark:text-white hover:bg-gray-50 dark:hover:bg-white/5 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => onConfirmRelease?.(milestone.id)}
              disabled={processing}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-3 text-sm font-bold text-white bg-brand-gold rounded-xl hover:bg-brand-gold-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {processing ? (
                <>
                  <Loader2 size={15} className="animate-spin" />
                  Releasing...
                </>
              ) : (
                <>
                  <CheckCircle size={15} />
                  Confirm Release
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
