import { useEffect, useRef } from 'react';
import { useNavigate }       from 'react-router-dom';
import { useTranslation }    from 'react-i18next';
import { ArrowLeft, X }      from 'lucide-react';
import { useOnboarding }     from '../../hooks/useOnboarding.js';
import ProgressBar           from '../ui/ProgressBar.jsx';

// Step components
import Step00_CountryLanguage  from './steps/Step00_CountryLanguage.jsx';
import Step01_ProviderType     from './steps/Step01_ProviderType.jsx';
import Step02_AccountType      from './steps/Step02_AccountType.jsx';
import Step03_AccountBasics    from './steps/Step03_AccountBasics.jsx';
import Step04_Identity         from './steps/Step04_Identity.jsx';
import Step05_Address          from './steps/Step05_Address.jsx';
import Step06_BusinessDocs     from './steps/Step06_BusinessDocs.jsx';
import Step07_IndividualDocs   from './steps/Step07_IndividualDocs.jsx';
import Step08_Offerings        from './steps/Step08_Offerings.jsx';
import Step09_Payment          from './steps/Step09_Payment.jsx';
import Step10_Agreements       from './steps/Step10_Agreements.jsx';

const STEPS = [
  Step00_CountryLanguage,
  Step01_ProviderType,
  Step02_AccountType,
  Step03_AccountBasics,
  Step04_Identity,
  Step05_Address,
  Step06_BusinessDocs,
  Step07_IndividualDocs,
  Step08_Offerings,
  Step09_Payment,
  Step10_Agreements,
];

// Step labels for the progress bar
const STEP_LABELS = [
  'Location', 'Type', 'Account', 'Basics',
  'Identity', 'Address', 'Docs', 'Skills',
  'Offerings', 'Payout', 'Agree',
];

// Estimated minutes remaining per step (counts down)
const MINS_REMAINING = [8, 7, 6, 5, 4, 3, 2, 2, 2, 1, 1];

export default function OnboardingShell() {
  const { t }                             = useTranslation();
  const navigate                          = useNavigate();
  const { currentStep, progress, prevStep, data, totalSteps } = useOnboarding();
  const containerRef                      = useRef(null);
  const prevStepRef                       = useRef(currentStep);

  // Scroll to top on step change
  useEffect(() => {
    containerRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
    prevStepRef.current = currentStep;
  }, [currentStep]);

  const StepComponent = STEPS[currentStep] || STEPS[0];
  const minsLeft      = MINS_REMAINING[currentStep] || 1;
  const isFirstStep   = currentStep === 0;

  const handleBack = () => {
    if (isFirstStep) {
      navigate('/');
    } else {
      prevStep();
    }
  };

  const handleExit = () => {
    navigate('/');
  };

  return (
    <div className="flex flex-col min-h-screen bg-white" ref={containerRef}>

      {/* ── Top bar ───────────────────────────────────────── */}
      <header className="sticky top-0 z-50 bg-white border-b border-gray-100 pt-safe shrink-0">
        <div className="max-w-2xl px-4 mx-auto">
          <div className="flex items-center gap-3 h-14">

            {/* Back button */}
            <button
              type="button"
              onClick={handleBack}
              className="flex items-center justify-center transition-colors w-9 h-9 rounded-xl hover:bg-brand-gray-soft text-brand-charcoal shrink-0"
              aria-label={isFirstStep ? 'Go home' : t('common.back')}
            >
              <ArrowLeft size={20} />
            </button>

            {/* Logo */}
            <div className="flex items-center gap-2 shrink-0">
              <div className="flex items-center justify-center w-7 h-7 rounded-xl bg-brand-gold">
                <span className="text-xs font-black text-white font-display">A</span>
              </div>
              <span className="hidden text-base font-extrabold tracking-tight font-display text-brand-charcoal-dark sm:block">
                Aurban
              </span>
            </div>

            {/* Progress bar — centre */}
            <div className="flex-1 px-2">
              <ProgressBar value={progress} showLabel={false} animated />
            </div>

            {/* Step counter + time */}
            <div className="text-right shrink-0">
              <p className="text-xs font-semibold text-brand-charcoal-dark">
                {currentStep + 1}/{totalSteps}
              </p>
              <p className="text-[10px] text-gray-400 hidden sm:block">
                ~{minsLeft} min left
              </p>
            </div>

            {/* Exit */}
            <button
              type="button"
              onClick={handleExit}
              className="flex items-center justify-center text-gray-400 transition-colors w-9 h-9 rounded-xl hover:bg-brand-gray-soft hover:text-brand-charcoal shrink-0"
              aria-label="Exit onboarding"
            >
              <X size={18} />
            </button>
          </div>

          {/* Draft saved indicator */}
          <div className="flex items-center justify-center pb-2">
            <span className="text-[10px] text-gray-400 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block" />
              {t('common.draft')}
            </span>
          </div>
        </div>
      </header>

      {/* ── Step content ───────────────────────────────────── */}
      <main className="flex flex-col flex-1">
        <div className="flex-1 w-full max-w-2xl px-4 py-8 mx-auto">
          <div key={currentStep} className="step-enter">
            <StepComponent />
          </div>
        </div>
      </main>

      {/* ── Bottom spacer for mobile nav ───────────────────── */}
      <div className="h-8 pb-safe shrink-0" />
    </div>
  );
}