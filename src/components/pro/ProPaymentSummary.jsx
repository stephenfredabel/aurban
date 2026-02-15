import { Shield, CreditCard, Building2 } from 'lucide-react';
import { useCurrency } from '../../hooks/useCurrency.js';
import { TIER_CONFIG, calculatePlatformFee } from '../../data/proConstants.js';

/**
 * Payment breakdown for Pro booking — commitment + balance + platform fee.
 */
export default function ProPaymentSummary({
  price,
  tier,
  paymentMethod,
  onPaymentMethodChange,
  agreedToTerms,
  onAgreeChange,
  errors,
  milestones,
}) {
  const { symbol } = useCurrency();
  const config = TIER_CONFIG[tier] || TIER_CONFIG[1];
  const platformFee = calculatePlatformFee(price);
  const total = price + platformFee;
  const commitmentAmount = Math.round(price * config.commitmentFeePercent / 100);
  const balanceAmount = price - commitmentAmount;
  const isTier4 = tier === 4;

  return (
    <div className="space-y-5">
      <div>
        <h3 className="mb-1 text-sm font-bold text-brand-charcoal-dark dark:text-white">Payment Summary</h3>
        <p className="mb-4 text-xs text-gray-400">Your full payment is held securely in escrow</p>
      </div>

      {/* Breakdown */}
      <div className="p-4 border border-gray-100 dark:border-white/10 rounded-2xl">
        <div className="space-y-2.5 mb-3 pb-3 border-b border-gray-100 dark:border-white/10">
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Service price</span>
            <span className="font-bold text-brand-charcoal-dark dark:text-white">{symbol}{price.toLocaleString()}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Platform fee</span>
            <span className="font-bold text-brand-charcoal-dark dark:text-white">{symbol}{platformFee.toLocaleString()}</span>
          </div>
        </div>
        <div className="flex justify-between text-sm font-bold">
          <span className="text-brand-charcoal-dark dark:text-white">Total (held in escrow)</span>
          <span className="text-brand-gold">{symbol}{total.toLocaleString()}</span>
        </div>
      </div>

      {/* Payment split */}
      <div className="p-4 bg-gray-50 dark:bg-white/[0.02] rounded-2xl">
        <p className="mb-3 text-xs font-bold text-gray-400 uppercase tracking-wider">Payment Release Schedule</p>
        {isTier4 && milestones ? (
          <div className="space-y-2">
            {milestones.map(m => (
              <div key={m.phase} className="flex items-center justify-between text-xs">
                <span className="text-gray-500">Phase {m.phase}: {m.label} ({m.percent}%)</span>
                <span className="font-bold text-brand-charcoal-dark dark:text-white">{symbol}{m.amount.toLocaleString()}</span>
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-gray-500">On provider check-in ({config.commitmentFeePercent}%)</span>
              <span className="font-bold text-brand-charcoal-dark dark:text-white">{symbol}{commitmentAmount.toLocaleString()}</span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-gray-500">After {config.observationDays}-day observation</span>
              <span className="font-bold text-brand-charcoal-dark dark:text-white">{symbol}{balanceAmount.toLocaleString()}</span>
            </div>
          </div>
        )}
      </div>

      {/* Payment method */}
      <div>
        <p className="mb-2 text-xs font-semibold text-gray-500 dark:text-gray-400">Payment Method</p>
        <div className="space-y-2">
          {[
            { id: 'card', label: 'Debit/Credit Card', icon: CreditCard },
            { id: 'transfer', label: 'Bank Transfer', icon: Building2 },
          ].map(method => (
            <button
              key={method.id}
              type="button"
              onClick={() => onPaymentMethodChange(method.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border-2 text-sm font-semibold text-left transition-all ${
                paymentMethod === method.id
                  ? 'border-brand-gold bg-brand-gold/10 text-brand-charcoal-dark dark:text-white'
                  : 'border-gray-200 dark:border-white/10 text-gray-600 dark:text-white/70 hover:border-brand-gold/50'
              }`}
            >
              <method.icon size={16} />
              {method.label}
            </button>
          ))}
        </div>
      </div>

      {/* Terms agreement */}
      <div className={`flex items-start gap-3 p-3.5 rounded-xl ${errors?.agreedToTerms ? 'bg-red-50 dark:bg-red-500/10' : 'bg-brand-gray-soft dark:bg-white/5'}`}>
        <input
          type="checkbox"
          id="pro-terms"
          checked={agreedToTerms}
          onChange={e => onAgreeChange(e.target.checked)}
          className="w-4 h-4 mt-0.5 accent-brand-gold"
        />
        <label htmlFor="pro-terms" className="text-xs text-gray-600 dark:text-white/70 cursor-pointer leading-relaxed">
          I agree to the <a href="/terms" className="font-semibold text-brand-gold hover:underline">Terms of Service</a> and understand
          that my payment will be held in escrow and released according to the {config.shortLabel} payment schedule.
        </label>
      </div>
      {errors?.agreedToTerms && <p className="text-xs text-red-500">{errors.agreedToTerms}</p>}

      {/* Escrow badge */}
      <div className="flex items-center justify-center gap-2 p-2 text-xs text-gray-400">
        <Shield size={12} className="text-brand-gold" />
        Protected by Aurban Escrow
      </div>
    </div>
  );
}
