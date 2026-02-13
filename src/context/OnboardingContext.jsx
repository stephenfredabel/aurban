import { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { useAuth } from './AuthContext.jsx';

const OnboardingContext = createContext(null);

const DRAFT_KEY = 'aurban_onboarding_draft';

// Tiering calculation — pure function, no side effects
export const calculateTier = (data) => {
  const isCompany = data.accountType === 'company';

  if (isCompany) {
    const hasCac     = Boolean(data.businessDocs?.registrationNumber && data.businessDocs?.docUrl);
    const hasAddress = Boolean(data.address?.street);
    const hasTin     = Boolean(data.businessDocs?.tin);

    if (hasCac && hasAddress && hasTin)  return { type: 'company', level: 3, label: 'Fully Verified Company' };
    if (hasCac && hasAddress)            return { type: 'company', level: 2, label: 'Verified Business' };
    return                                      { type: 'company', level: 1, label: 'Registered Business (Basic)' };
  }

  // Individual
  const hasId      = Boolean(data.identity?.idNumber && data.identity?.docUrl);
  const hasAddress = Boolean(data.address?.street);
  const hasCert    = Boolean(data.individualDocs?.certificateUrl);
  const hasLicense = Boolean(data.individualDocs?.licenseNumber);

  if (hasId && hasAddress && hasCert && hasLicense) return { type: 'individual', level: 3, label: 'Certified / Licensed Provider' };
  if (hasId && hasAddress)                          return { type: 'individual', level: 2, label: 'Professional Provider' };
  return                                                   { type: 'individual', level: 1, label: 'Basic Provider' };
};

const JOB_CAPS = {
  individual_1: 50_000,
  individual_2: 500_000,
  individual_3: null, // unlimited
  company_1:    50_000,
  company_2:    500_000,
  company_3:    null,
};

export const getTierCap = (tier) =>
  JOB_CAPS[`${tier.type}_${tier.level}`] ?? null;

const INITIAL_DATA = {
  country:      {},
  providerType: '',
  accountType:  'individual',
  basics:       {},
  identity:     {},
  address:      {},
  businessDocs: {},
  individualDocs:{},
  offerings:    {},
  payment:      {},
  agreements:   {},
};

export function OnboardingProvider({ children }) {
  const { user } = useAuth();

  const [data, setData] = useState(() => {
    try {
      const raw = sessionStorage.getItem(DRAFT_KEY);
      return raw ? { ...INITIAL_DATA, ...JSON.parse(raw) } : INITIAL_DATA;
    } catch {
      return INITIAL_DATA;
    }
  });

  const [currentStep, setCurrentStep] = useState(0);
  const [completed,   setCompleted]   = useState(false);

  // Auto-save draft to sessionStorage on every change
  useEffect(() => {
    try {
      sessionStorage.setItem(DRAFT_KEY, JSON.stringify(data));
    } catch { /* fail silently */ }
  }, [data]);

  const updateStep = useCallback((stepKey, stepData) => {
    setData((prev) => ({ ...prev, [stepKey]: { ...prev[stepKey], ...stepData } }));
  }, []);

  const goToStep = useCallback((step) => {
    setCurrentStep(step);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const nextStep = useCallback(() => {
    setCurrentStep((s) => s + 1);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const prevStep = useCallback(() => {
    setCurrentStep((s) => Math.max(0, s - 1));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const resetOnboarding = useCallback(() => {
    setData(INITIAL_DATA);
    setCurrentStep(0);
    setCompleted(false);
    sessionStorage.removeItem(DRAFT_KEY);
  }, []);

  const finishOnboarding = useCallback(() => {
    setCompleted(true);
    sessionStorage.removeItem(DRAFT_KEY);
  }, []);

  const tier = calculateTier(data);
  const cap  = getTierCap(tier);

  // Total steps — varies by account type and provider type
  const totalSteps = data.accountType === 'company' ? 11 : 11;
  const progress   = Math.round((currentStep / (totalSteps - 1)) * 100);

  return (
    <OnboardingContext.Provider value={{
      data,
      currentStep,
      totalSteps,
      progress,
      tier,
      cap,
      completed,
      updateStep,
      goToStep,
      nextStep,
      prevStep,
      resetOnboarding,
      finishOnboarding,
    }}>
      {children}
    </OnboardingContext.Provider>
  );
}

export function useOnboarding() {
  const ctx = useContext(OnboardingContext);
  if (!ctx) throw new Error('useOnboarding must be used inside OnboardingProvider');
  return ctx;
}