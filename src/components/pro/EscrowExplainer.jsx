import { Shield, Clock, CheckCircle2, AlertTriangle } from 'lucide-react';
import { TIER_CONFIG } from '../../data/proConstants.js';

/**
 * Explains how escrow protection works for a service listing's tier.
 * Shows commitment %, observation window, and payment split.
 */
export default function EscrowExplainer({ tier, price, className = '' }) {
  const config = TIER_CONFIG[tier] || TIER_CONFIG[1];
  const commitmentAmount = price ? Math.round(price * config.commitmentFeePercent / 100) : null;
  const balanceAmount = price && commitmentAmount ? price - commitmentAmount : null;
  const isTier4 = tier === 4;

  return (
    <div className={`p-4 border border-gray-100 dark:border-white/10 rounded-2xl bg-gray-50 dark:bg-white/[0.02] ${className}`}>
      <div className="flex items-center gap-2 mb-3">
        <div className={`flex items-center justify-center w-8 h-8 rounded-xl ${config.iconBg}`}>
          <Shield size={16} className="text-brand-gold" />
        </div>
        <div>
          <h4 className="text-sm font-bold text-brand-charcoal-dark dark:text-white">Escrow Protection</h4>
          <p className="text-[10px] text-gray-400">{config.shortLabel} &mdash; {config.desc}</p>
        </div>
      </div>

      <div className="space-y-2.5">
        {/* Step 1: Payment held */}
        <div className="flex items-start gap-2.5">
          <div className="flex items-center justify-center w-5 h-5 mt-0.5 rounded-full bg-blue-100 dark:bg-blue-500/20 shrink-0">
            <span className="text-[10px] font-bold text-blue-600">1</span>
          </div>
          <div>
            <p className="text-xs font-semibold text-brand-charcoal-dark dark:text-white">Full payment held in escrow</p>
            <p className="text-[11px] text-gray-400">Your money is protected until the job is verified</p>
          </div>
        </div>

        {/* Step 2: Commitment released */}
        <div className="flex items-start gap-2.5">
          <div className="flex items-center justify-center w-5 h-5 mt-0.5 rounded-full bg-teal-100 dark:bg-teal-500/20 shrink-0">
            <span className="text-[10px] font-bold text-teal-600">2</span>
          </div>
          <div>
            <p className="text-xs font-semibold text-brand-charcoal-dark dark:text-white">
              {config.commitmentFeePercent}% commitment on arrival
              {commitmentAmount && <span className="text-gray-400 font-normal"> ({'\u20A6'}{commitmentAmount.toLocaleString()})</span>}
            </p>
            <p className="text-[11px] text-gray-400">Released when provider checks in via OTP + GPS</p>
          </div>
        </div>

        {/* Step 3: Observation */}
        <div className="flex items-start gap-2.5">
          <div className="flex items-center justify-center w-5 h-5 mt-0.5 rounded-full bg-purple-100 dark:bg-purple-500/20 shrink-0">
            <Clock size={10} className="text-purple-600" />
          </div>
          <div>
            <p className="text-xs font-semibold text-brand-charcoal-dark dark:text-white">
              {config.observationDays}-day observation window
            </p>
            <p className="text-[11px] text-gray-400">
              {isTier4
                ? 'Milestone payments released as phases complete'
                : `Balance released after ${config.observationDays} days with no issues`}
              {balanceAmount && !isTier4 && <span> ({'\u20A6'}{balanceAmount.toLocaleString()})</span>}
            </p>
          </div>
        </div>

        {/* Step 4: Protection */}
        <div className="flex items-start gap-2.5">
          <div className="flex items-center justify-center w-5 h-5 mt-0.5 rounded-full bg-emerald-100 dark:bg-emerald-500/20 shrink-0">
            <CheckCircle2 size={10} className="text-emerald-600" />
          </div>
          <div>
            <p className="text-xs font-semibold text-brand-charcoal-dark dark:text-white">Issue? Provider fixes first</p>
            <p className="text-[11px] text-gray-400">Report during observation — escrow freezes, provider returns to fix. Escalate if needed.</p>
          </div>
        </div>
      </div>

      {isTier4 && (
        <div className="flex items-start gap-2 p-2.5 mt-3 rounded-xl bg-amber-50 dark:bg-amber-500/10 border border-amber-100 dark:border-amber-500/20">
          <AlertTriangle size={12} className="mt-0.5 text-amber-500 shrink-0" />
          <p className="text-[11px] text-amber-700 dark:text-amber-300">
            <strong>Milestone project:</strong> Payment split into 4 phases (30% / 40% / 20% / 10%). Each release requires photo evidence and your approval.
          </p>
        </div>
      )}
    </div>
  );
}
