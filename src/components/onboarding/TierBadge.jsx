import { ShieldCheck, Award, Briefcase, Star, Lock, Unlock } from 'lucide-react';
import { useCurrency } from '../../hooks/useCurrency.js';
import { getTierCap }  from '../../context/OnboardingContext.jsx';

const TIER_CONFIG = {
  individual: {
    1: { icon: ShieldCheck, color: 'text-gray-500',        bg: 'bg-gray-100',       border: 'border-gray-200',      label: 'Basic Provider'          },
    2: { icon: ShieldCheck, color: 'text-blue-600',        bg: 'bg-blue-50',         border: 'border-blue-200',      label: 'Professional Provider'   },
    3: { icon: Award,       color: 'text-brand-gold-dark', bg: 'bg-brand-gold/10',   border: 'border-brand-gold/30', label: 'Certified / Licensed'    },
  },
  company: {
    1: { icon: Briefcase,   color: 'text-gray-500',        bg: 'bg-gray-100',        border: 'border-gray-200',      label: 'Registered Business'     },
    2: { icon: Briefcase,   color: 'text-blue-600',        bg: 'bg-blue-50',         border: 'border-blue-200',      label: 'Verified Business'       },
    3: { icon: Star,        color: 'text-brand-gold-dark', bg: 'bg-brand-gold/10',   border: 'border-brand-gold/30', label: 'Fully Verified Company'  },
  },
};

const PERKS = {
  individual_1: ['Phone verified',   'Basic visibility',     'Job value up to ₦50k', 'No platform payouts'],
  individual_2: ['ID verified',      'Higher visibility',    'Job value up to ₦500k','Platform payouts enabled'],
  individual_3: ['Fully certified',  'Priority listing',     'Unlimited job value',  'Priority support'],
  company_1:    ['Phone verified',   'Basic company profile','Job value up to ₦50k', 'No platform payouts'],
  company_2:    ['CAC verified',     'Business badge',       'Job value up to ₦500k','Platform payouts enabled'],
  company_3:    ['TIN + CAC + docs', 'Enterprise projects',  'Unlimited job value',  'Dedicated account'],
};

export default function TierBadge({ tier, compact = false }) {
  const { format: _format } = useCurrency();
  const config         = TIER_CONFIG[tier.type]?.[tier.level] || TIER_CONFIG.individual[1];
  const Icon           = config.icon;
  const cap            = getTierCap(tier);
  const perkKey        = `${tier.type}_${tier.level}`;
  const perks          = PERKS[perkKey] || [];
  const payoutsEnabled = tier.level >= 2;

  if (compact) {
    return (
      <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full border ${config.bg} ${config.border}`}>
        <Icon size={13} className={config.color} />
        <span className={`text-xs font-bold font-body ${config.color}`}>{tier.label || config.label}</span>
      </div>
    );
  }

  return (
    <div className={`rounded-2xl border-2 ${config.border} ${config.bg} p-4`}>
      {/* Header */}
      <div className="flex items-center gap-3 mb-3">
        <div className={`w-10 h-10 rounded-xl ${config.bg} border ${config.border} flex items-center justify-center`}>
          <Icon size={20} className={config.color} />
        </div>
        <div>
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Your current tier</p>
          <p className={`text-base font-display font-bold ${config.color}`}>
            {tier.label || config.label}
          </p>
        </div>
        <div className="flex gap-1 ml-auto">
          {[1,2,3].map((l) => (
            <div
              key={l}
              className={`w-2 h-2 rounded-full transition-colors ${
                l <= tier.level ? 'bg-brand-gold' : 'bg-gray-200'
              }`}
            />
          ))}
        </div>
      </div>

      {/* Perks */}
      <div className="space-y-1.5 mb-3">
        {perks.map((perk, i) => {
          const isLocked = (i === 3 && !payoutsEnabled) || (i === 2 && cap !== null);
          return (
            <div key={i} className="flex items-center gap-2">
              {isLocked ? (
                <Lock size={11} className="text-gray-400 shrink-0" />
              ) : (
                <Unlock size={11} className="text-emerald-500 shrink-0" />
              )}
              <span className={`text-xs font-body ${isLocked ? 'text-gray-400' : 'text-brand-charcoal-dark'}`}>
                {perk}
              </span>
            </div>
          );
        })}
      </div>

      {/* Cap notice */}
      {cap !== null && (
        <p className="text-[11px] text-gray-500 bg-white/60 rounded-xl px-3 py-2 font-body">
          💡 Add more documents to unlock higher job values and platform payouts
        </p>
      )}
    </div>
  );
}