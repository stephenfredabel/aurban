import { Shield, Lock, Unlock, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { useCurrency } from '../../hooks/useCurrency.js';
import { PRO_ESCROW_STATUSES, TIER_CONFIG } from '../../data/proConstants.js';

/**
 * Real-time escrow status display.
 * Shows commitment (released/held), balance (held/released),
 * and milestone bars for Tier 4.
 */
export default function EscrowStatusCard({ booking }) {
  const { symbol } = useCurrency();
  if (!booking) return null;

  const tierCfg = TIER_CONFIG[booking.tier] || TIER_CONFIG[1];
  const escrowStatus = booking.escrowStatus || 'held';
  const escrowDef = PRO_ESCROW_STATUSES[escrowStatus];
  const commitmentAmount = booking.commitmentAmount || Math.round(booking.price * tierCfg.commitmentFeePercent / 100);
  const balanceAmount = booking.price - commitmentAmount;

  const commitmentReleased = ['commitment_released', 'observation_active', 'released', 'auto_released'].includes(escrowStatus);
  const balanceReleased = ['released', 'auto_released'].includes(escrowStatus);
  const frozen = escrowStatus === 'frozen';

  return (
    <div className="p-4 border border-gray-100 dark:border-white/10 rounded-2xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Shield size={16} className="text-brand-gold" />
          <h4 className="text-xs font-bold text-brand-charcoal-dark dark:text-white">Escrow Status</h4>
        </div>
        <span className={`px-2 py-0.5 text-[10px] font-bold rounded-full ${escrowDef?.color || 'bg-gray-100 text-gray-600'}`}>
          {escrowDef?.label || escrowStatus}
        </span>
      </div>

      {/* Total in escrow */}
      <div className="p-3 mb-4 bg-gray-50 dark:bg-white/[0.02] rounded-xl">
        <div className="flex justify-between items-center">
          <span className="text-xs text-gray-500">Total in Escrow</span>
          <span className="text-lg font-extrabold font-display text-brand-gold">
            {symbol}{booking.price?.toLocaleString()}
          </span>
        </div>
      </div>

      {/* Payment segments */}
      <div className="space-y-3">
        {/* Commitment fee */}
        <div className="flex items-center gap-3">
          <div className={`flex items-center justify-center w-8 h-8 rounded-full shrink-0 ${
            frozen ? 'bg-red-100 dark:bg-red-500/20' :
            commitmentReleased ? 'bg-emerald-100 dark:bg-emerald-500/20' :
            'bg-gray-100 dark:bg-white/5'
          }`}>
            {frozen ? <AlertTriangle size={14} className="text-red-500" /> :
             commitmentReleased ? <Unlock size={14} className="text-emerald-600" /> :
             <Lock size={14} className="text-gray-400" />}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold text-brand-charcoal-dark dark:text-white">
                Commitment ({tierCfg.commitmentFeePercent}%)
              </p>
              <p className="text-xs font-bold text-brand-charcoal-dark dark:text-white">
                {symbol}{commitmentAmount.toLocaleString()}
              </p>
            </div>
            <p className="text-[10px] text-gray-400">
              {frozen ? 'Frozen — dispute in progress' :
               commitmentReleased ? 'Released to provider' :
               'Released on check-in (OTP)'}
            </p>
          </div>
        </div>

        {/* Balance */}
        <div className="flex items-center gap-3">
          <div className={`flex items-center justify-center w-8 h-8 rounded-full shrink-0 ${
            frozen ? 'bg-red-100 dark:bg-red-500/20' :
            balanceReleased ? 'bg-emerald-100 dark:bg-emerald-500/20' :
            'bg-gray-100 dark:bg-white/5'
          }`}>
            {frozen ? <AlertTriangle size={14} className="text-red-500" /> :
             balanceReleased ? <Unlock size={14} className="text-emerald-600" /> :
             <Lock size={14} className="text-gray-400" />}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold text-brand-charcoal-dark dark:text-white">
                Balance ({100 - tierCfg.commitmentFeePercent}%)
              </p>
              <p className="text-xs font-bold text-brand-charcoal-dark dark:text-white">
                {symbol}{balanceAmount.toLocaleString()}
              </p>
            </div>
            <p className="text-[10px] text-gray-400">
              {frozen ? 'Frozen — dispute in progress' :
               balanceReleased ? 'Released to provider' :
               `After ${tierCfg.observationDays}-day observation`}
            </p>
          </div>
        </div>
      </div>

      {/* Frozen warning */}
      {frozen && (
        <div className="flex items-start gap-2 p-3 mt-4 bg-red-50 dark:bg-red-500/10 rounded-xl border border-red-100 dark:border-red-500/20">
          <AlertTriangle size={14} className="text-red-500 shrink-0 mt-0.5" />
          <p className="text-[11px] text-red-700 dark:text-red-300">
            <strong>Escrow frozen</strong> — An active dispute or safety alert has frozen all payments.
            Resolution is pending with Aurban support.
          </p>
        </div>
      )}

      {/* Refund */}
      {escrowStatus === 'refunded' && (
        <div className="flex items-center gap-2 p-3 mt-4 bg-emerald-50 dark:bg-emerald-500/10 rounded-xl">
          <CheckCircle2 size={14} className="text-emerald-600" />
          <p className="text-[11px] text-emerald-700 dark:text-emerald-300">
            Full amount has been refunded to your payment method.
          </p>
        </div>
      )}
    </div>
  );
}
