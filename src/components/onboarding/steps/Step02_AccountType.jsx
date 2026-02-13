import { useState }       from 'react';
import { useTranslation } from 'react-i18next';
import { User, Building2, Check } from 'lucide-react';
import { useOnboarding }  from '../../../hooks/useOnboarding.js';
import StepWrapper        from '../StepWrapper.jsx';
import Button             from '../../ui/Button.jsx';
import TierBadge          from '../TierBadge.jsx';
import { calculateTier }  from '../../../context/OnboardingContext.jsx';

const ACCOUNT_TYPES = [
  {
    id:          'individual',
    icon:        User,
    color:       'bg-brand-gold/10 text-brand-gold-dark',
    border:      'border-brand-gold/30',
    title:       'Individual',
    description: 'A person offering services, property or products',
    bullets:     [
      'Set up in under 5 minutes',
      'Add credentials to unlock higher tiers',
      'Grow your personal brand',
    ],
  },
  {
    id:          'company',
    icon:        Building2,
    color:       'bg-blue-50 text-blue-600',
    border:      'border-blue-200',
    title:       'Company / Business',
    description: 'A registered business, agency or organisation',
    bullets:     [
      'Business verification badge',
      'CAC / business registration support',
      'Multi-staff management (coming soon)',
    ],
  },
];

export default function Step02_AccountType() {
  const { t }                          = useTranslation();
  const { updateStep, nextStep, data } = useOnboarding();
  const [selected, setSelected]        = useState(data.accountType || 'individual');

  const previewTier = calculateTier({ accountType: selected });

  const handleContinue = () => {
    updateStep('accountType', selected);
    nextStep();
  };

  return (
    <StepWrapper
      title="Individual or company?"
      subtitle="This determines your verification path and tier structure."
    >
      {/* Account type cards */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {ACCOUNT_TYPES.map((type) => {
          const Icon     = type.icon;
          const isActive = selected === type.id;

          return (
            <button
              key={type.id}
              type="button"
              onClick={() => setSelected(type.id)}
              className={[
                'flex flex-col gap-3 p-4 rounded-2xl border-2 text-left transition-all duration-200',
                'outline-none focus-visible:ring-2 focus-visible:ring-brand-gold/40',
                'active:scale-[0.99]',
                isActive
                  ? `${type.border} bg-white shadow-card`
                  : 'border-gray-200 hover:border-gray-300 bg-white',
              ].join(' ')}
              aria-pressed={isActive}
            >
              {/* Icon + check */}
              <div className="flex items-center justify-between">
                <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${type.color}`}>
                  <Icon size={20} aria-hidden />
                </div>
                <div className={[
                  'w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all',
                  isActive ? 'border-brand-gold bg-brand-gold' : 'border-gray-300',
                ].join(' ')}>
                  {isActive && <Check size={12} className="text-white" />}
                </div>
              </div>

              {/* Title + desc */}
              <div>
                <p className="mb-1 text-sm font-bold font-display text-brand-charcoal-dark">
                  {type.title}
                </p>
                <p className="text-xs leading-relaxed text-gray-500 font-body">
                  {type.description}
                </p>
              </div>

              {/* Bullets */}
              <ul className="space-y-1">
                {type.bullets.map((b) => (
                  <li key={b} className="flex items-start gap-1.5">
                    <span className="w-3.5 h-3.5 rounded-full bg-emerald-100 flex items-center justify-center shrink-0 mt-0.5">
                      <Check size={8} className="text-emerald-600" />
                    </span>
                    <span className="text-[11px] text-gray-500 font-body">{b}</span>
                  </li>
                ))}
              </ul>
            </button>
          );
        })}
      </div>

      {/* Live tier preview */}
      <div>
        <p className="mb-2 label-sm">Your starting tier preview</p>
        <TierBadge tier={previewTier} />
      </div>

      {/* CTA */}
      <Button fullWidth size="lg" onClick={handleContinue}>
        Continue as {ACCOUNT_TYPES.find((t) => t.id === selected)?.title}
      </Button>
    </StepWrapper>
  );
}