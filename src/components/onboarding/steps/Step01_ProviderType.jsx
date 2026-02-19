import { useState }       from 'react';
import { useTranslation } from 'react-i18next';
import {
  Home, Wrench, ShoppingBag, Building2, ChevronRight
} from 'lucide-react';
import { useOnboarding }  from '../../../hooks/useOnboarding.js';
import StepWrapper        from '../StepWrapper.jsx';
import Button             from '../../ui/Button.jsx';

const PROVIDER_TYPES = [
  {
    id:          'property',
    icon:        Home,
    color:       'bg-amber-50 text-amber-600',
    border:      'border-amber-200',
    title:       'List a Property',
    description: 'Rent, lease or sell residential & commercial property',
    examples:    ['Apartments', 'Duplexes', 'Offices', 'Land', 'Shortlet'],
  },
  {
    id:          'services',
    icon:        Wrench,
    color:       'bg-blue-50 text-blue-600',
    border:      'border-blue-200',
    title:       'Offer Services',
    description: 'Provide real estate related professional services',
    examples:    ['Plumbing', 'Electrical', 'Architecture', 'Cleaning', 'Security'],
  },
  {
    id:          'products',
    icon:        ShoppingBag,
    color:       'bg-emerald-50 text-emerald-600',
    border:      'border-emerald-200',
    title:       'Sell Products',
    description: 'List building materials, furniture and fittings',
    examples:    ['Tiles', 'Doors', 'Fixtures', 'Paint', 'Furniture'],
  },
  {
    id:          'business',
    icon:        Building2,
    color:       'bg-purple-50 text-purple-600',
    border:      'border-purple-200',
    title:       'Register a Business',
    description: 'Set up a real estate company, agency or developer profile',
    examples:    ['Real estate agency', 'Developer', 'Facility manager'],
  },
];

export default function Step01_ProviderType() {
  const { t: _t }                       = useTranslation();
  const { updateStep, nextStep, data } = useOnboarding();
  const [selected, setSelected]        = useState(data.providerType || '');
  const [error, setError]              = useState('');

  const handleContinue = () => {
    if (!selected) {
      setError('Please choose what you would like to offer');
      return;
    }
    updateStep('providerType', selected);
    nextStep();
  };

  return (
    <StepWrapper
      title="What would you like to offer?"
      subtitle="Choose one to begin — you can always add more from your dashboard later."
    >
      {/* Provider type cards */}
      <div className="space-y-3">
        {PROVIDER_TYPES.map((type) => {
          const Icon     = type.icon;
          const isActive = selected === type.id;

          return (
            <button
              key={type.id}
              type="button"
              onClick={() => { setSelected(type.id); setError(''); }}
              className={[
                'w-full flex items-center gap-4 p-4 rounded-2xl border-2 text-left transition-all duration-200',
                'outline-none focus-visible:ring-2 focus-visible:ring-brand-gold/40',
                'active:scale-[0.99]',
                isActive
                  ? `${type.border} bg-white shadow-card`
                  : 'border-gray-200 hover:border-gray-300 bg-white',
              ].join(' ')}
              aria-pressed={isActive}
            >
              {/* Icon */}
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${type.color}`}>
                <Icon size={22} aria-hidden />
              </div>

              {/* Text */}
              <div className="flex-1 min-w-0">
                <p className="font-display font-bold text-brand-charcoal-dark text-sm mb-0.5">
                  {type.title}
                </p>
                <p className="mb-2 text-xs text-gray-500 font-body">
                  {type.description}
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {type.examples.map((ex) => (
                    <span
                      key={ex}
                      className="px-2 py-0.5 bg-brand-gray-soft text-brand-charcoal-light text-[10px] font-medium rounded-full"
                    >
                      {ex}
                    </span>
                  ))}
                </div>
              </div>

              {/* Arrow / check indicator */}
              <div className={[
                'w-7 h-7 rounded-full flex items-center justify-center shrink-0 transition-colors',
                isActive ? 'bg-brand-gold' : 'bg-gray-100',
              ].join(' ')}>
                <ChevronRight
                  size={14}
                  className={isActive ? 'text-white' : 'text-gray-400'}
                />
              </div>
            </button>
          );
        })}
      </div>

      {/* Error */}
      {error && (
        <p role="alert" className="text-sm text-center text-red-500 font-body">
          {error}
        </p>
      )}

      {/* Social proof */}
      <div className="flex items-center justify-center gap-2 py-1">
        <div className="flex -space-x-2">
          {['bg-brand-gold/30','bg-blue-200','bg-emerald-200','bg-purple-200'].map((c, i) => (
            <div key={i} className={`w-7 h-7 rounded-full ${c} border-2 border-white`} />
          ))}
        </div>
        <p className="text-xs text-gray-400 font-body">
          <span className="font-semibold text-brand-charcoal">4,200+ providers</span> in Lagos alone
        </p>
      </div>

      {/* CTA */}
      <Button
        fullWidth
        size="lg"
        disabled={!selected}
        onClick={handleContinue}
      >
        Continue
      </Button>
    </StepWrapper>
  );
}