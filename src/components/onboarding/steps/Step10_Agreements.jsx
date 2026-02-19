import { useState }       from 'react';
import { useTranslation } from 'react-i18next';
import { Check, ExternalLink, PartyPopper } from 'lucide-react';
import { useNavigate }    from 'react-router-dom';
import { useOnboarding }  from '../../../hooks/useOnboarding.js';
import { useAuth }        from '../../../context/AuthContext.jsx';
import StepWrapper        from '../StepWrapper.jsx';
import TierBadge          from '../TierBadge.jsx';
import Button             from '../../ui/Button.jsx';

const AGREEMENTS = [
  {
    id:       'accuracy',
    required: true,
    label:    'I confirm that all information I have provided is accurate and complete.',
  },
  {
    id:       'verification',
    required: true,
    label:    'I consent to Aurban performing identity and document verification checks.',
    detail:   'Your documents are reviewed by our secure verification team within 24-48 hours.',
  },
  {
    id:       'terms',
    required: true,
    label:    <>I agree to Aurban's <a href="/terms" target="_blank" rel="noopener noreferrer" className="text-brand-gold font-bold hover:underline inline-flex items-center gap-0.5">Provider Terms <ExternalLink size={10} /></a> and <a href="/terms#provider" target="_blank" rel="noopener noreferrer" className="text-brand-gold font-bold hover:underline inline-flex items-center gap-0.5">Service Agreement <ExternalLink size={10} /></a>.</>,
  },
  {
    id:       'payment',
    required: true,
    label:    <>I agree to Aurban's <a href="/payment-terms" target="_blank" rel="noopener noreferrer" className="text-brand-gold font-bold hover:underline inline-flex items-center gap-0.5">Payment Terms <ExternalLink size={10} /></a> including the platform commission structure.</>,
  },
  {
    id:       'communications',
    required: false,
    label:    'I consent to receiving transactional emails, SMS alerts and Aurban product updates.',
    detail:   'You can unsubscribe from marketing at any time. Transactional messages cannot be opted out.',
  },
  {
    id:       'data',
    required: false,
    label:    <>I have read the <a href="/privacy" target="_blank" rel="noopener noreferrer" className="text-brand-gold font-bold hover:underline inline-flex items-center gap-0.5">Privacy Policy <ExternalLink size={10} /></a> and understand how my data is used.</>,
  },
];

// Profile completeness score based on steps filled
const calcCompleteness = (data) => {
  const checks = [
    Boolean(data.country?.code),
    Boolean(data.providerType),
    Boolean(data.accountType),
    Boolean(data.basics?.email),
    Boolean(data.basics?.phoneVerified),
    Boolean(data.identity?.idNumber),
    Boolean(data.identity?.selfie),
    Boolean(data.address?.fields?.street),
    Boolean(data.individualDocs?.primaryService || data.businessDocs?.companyName),
    Boolean(data.offerings?.description),
    Boolean(data.payment?.method),
  ];
  return Math.round((checks.filter(Boolean).length / checks.length) * 100);
};

export default function Step10_Agreements() {
  const { t: _t }                       = useTranslation();
  const { data, tier, finishOnboarding } = useOnboarding();
  const { updateUser }                 = useAuth();
  const navigate                       = useNavigate();

  const [checked,    setChecked]    = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [done,       setDone]       = useState(false);
  const [errors,     setErrors]     = useState({});

  const completeness = calcCompleteness(data);

  const toggleAgreement = (id) => {
    setChecked((prev) => ({ ...prev, [id]: !prev[id] }));
    setErrors((prev) => ({ ...prev, [id]: null }));
  };

  const validate = () => {
    const e = {};
    AGREEMENTS.filter((a) => a.required).forEach((a) => {
      if (!checked[a.id]) e[a.id] = true;
    });
    return e;
  };

  const handleSubmit = async () => {
    const e = validate();
    if (Object.keys(e).length) { setErrors(e); return; }

    setSubmitting(true);
    try {
      // In production: POST /api/onboarding/complete with { data, tier, agreements: checked }
      await new Promise((res) => setTimeout(res, 1800)); // Simulate API

      // Update auth context with new tier
      updateUser({ tier, onboarded: true });
      finishOnboarding();
      setDone(true);
    } finally {
      setSubmitting(false);
    }
  };

  const handleGoToDashboard = () => navigate('/dashboard');

  // ── Success screen ─────────────────────────────────────────
  if (done) {
    return (
      <div className="flex flex-col items-center justify-center gap-6 py-8 text-center animate-fade-up">
        <div className="flex items-center justify-center w-20 h-20 rounded-full bg-brand-gold/10">
          <PartyPopper size={36} className="text-brand-gold" />
        </div>
        <div>
          <h2 className="mb-2 text-2xl font-extrabold font-display text-brand-charcoal-dark">
            You're live on Aurban!
          </h2>
          <p className="max-w-xs mx-auto text-sm leading-relaxed text-gray-500 font-body">
            Your profile is published. Our team will review your documents within 24–48 hours.
          </p>
        </div>

        <TierBadge tier={tier} />

        {/* What happens next */}
        <div className="w-full p-4 text-left bg-brand-gray-soft rounded-2xl">
          <p className="mb-3 label-sm">What happens next</p>
          <div className="space-y-2.5">
            {[
              { step: '1', text: 'Our team reviews your documents (24–48 hours)', done: false },
              { step: '2', text: 'You receive an email when verification is complete', done: false },
              { step: '3', text: 'Your tier upgrades automatically', done: false },
              { step: '4', text: 'Clients can discover and contact you', done: false },
            ].map(({ step, text }) => (
              <div key={step} className="flex items-start gap-3">
                <div className="flex items-center justify-center w-6 h-6 rounded-full bg-brand-gold/20 shrink-0">
                  <span className="text-[10px] font-bold text-brand-gold-dark">{step}</span>
                </div>
                <p className="text-xs text-brand-charcoal font-body">{text}</p>
              </div>
            ))}
          </div>
        </div>

        <Button fullWidth size="lg" onClick={handleGoToDashboard}>
          Go to Dashboard
        </Button>
      </div>
    );
  }

  // ── Agreements screen ──────────────────────────────────────
  return (
    <StepWrapper
      title="Almost done"
      subtitle="Review and confirm your commitments before publishing your profile."
    >

      {/* Tier summary */}
      <div>
        <p className="mb-2 label-sm">Your tier at launch</p>
        <TierBadge tier={tier} />
      </div>

      {/* Profile completeness */}
      <div className="p-4 bg-brand-gray-soft rounded-2xl">
        <div className="flex items-center justify-between mb-2">
          <p className="text-sm font-bold text-brand-charcoal-dark">Profile Completeness</p>
          <span className="text-sm font-extrabold text-brand-gold">{completeness}%</span>
        </div>
        <div className="h-2 overflow-hidden bg-gray-200 rounded-full">
          <div
            className="h-full transition-all duration-700 rounded-full bg-brand-gold"
            style={{ width: `${completeness}%` }}
          />
        </div>
        {completeness < 80 && (
          <p className="mt-2 text-xs text-gray-400 font-body">
            💡 Complete more sections from your dashboard to improve your profile and get more leads.
          </p>
        )}
      </div>

      {/* Agreement checkboxes */}
      <div className="space-y-2.5">
        {AGREEMENTS.map((agreement) => {
          const isChecked = Boolean(checked[agreement.id]);
          const hasError  = Boolean(errors[agreement.id]);

          return (
            <button
              key={agreement.id}
              type="button"
              onClick={() => toggleAgreement(agreement.id)}
              className={[
                'w-full flex items-start gap-3 p-3.5 rounded-2xl border-2 text-left transition-all',
                'outline-none focus-visible:ring-2 focus-visible:ring-brand-gold/40',
                hasError
                  ? 'border-red-300 bg-red-50/50'
                  : isChecked
                    ? 'border-brand-gold/30 bg-brand-gold/5'
                    : 'border-gray-200 hover:border-gray-300',
              ].join(' ')}
              aria-pressed={isChecked}
            >
              {/* Custom checkbox */}
              <div className={[
                'w-5 h-5 rounded flex items-center justify-center border-2 shrink-0 mt-0.5 transition-all',
                isChecked
                  ? 'bg-brand-gold border-brand-gold'
                  : hasError
                    ? 'border-red-400'
                    : 'border-gray-300',
              ].join(' ')}>
                {isChecked && <Check size={11} className="text-white" />}
              </div>

              <div className="flex-1 min-w-0">
                <p className={`text-sm font-body leading-relaxed ${isChecked ? 'text-brand-charcoal-dark' : 'text-gray-600'}`}>
                  {agreement.label}
                  {!agreement.required && (
                    <span className="ml-1.5 text-[10px] font-semibold text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded inline-block align-middle">
                      Optional
                    </span>
                  )}
                </p>
                {agreement.detail && (
                  <p className="text-[11px] text-gray-400 mt-1 font-body">{agreement.detail}</p>
                )}
              </div>
            </button>
          );
        })}
      </div>

      {/* Required checkbox warning */}
      {Object.keys(errors).length > 0 && (
        <p role="alert" className="text-sm text-center text-red-500 font-body">
          Please check all required agreements to continue.
        </p>
      )}

      {/* Submit */}
      <Button
        fullWidth
        size="xl"
        loading={submitting}
        onClick={handleSubmit}
      >
        {submitting ? 'Publishing your profile...' : '🚀 Publish My Profile'}
      </Button>

      <p className="text-xs text-center text-gray-400 font-body">
        You can update any information from your dashboard after publishing.
      </p>
    </StepWrapper>
  );
}