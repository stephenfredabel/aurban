import { useState, useCallback } from 'react';

/**
 * Multi-step booking wizard state management + per-step validation.
 * Steps: 0=Service, 1=Schedule, 2=Location, 3=Scope, 4=Payment, 5=Confirmation
 */

const STEP_LABELS = ['Service', 'Schedule', 'Location', 'Scope', 'Payment', 'Confirmation'];

export default function useProBookingWizard(totalSteps = 6) {
  const [step, setStep] = useState(0);
  const [data, setData] = useState({
    serviceId: '',
    scheduledDate: '',
    scheduledTime: '',
    location: { state: '', lga: '', address: '', landmark: '', lat: null, lng: null },
    scope: '',
    scopePhotos: [],
    scopeFields: {},
    paymentMethod: 'card',
    agreedToTerms: false,
  });
  const [errors, setErrors] = useState({});

  const updateField = useCallback((field, value) => {
    setData(prev => ({ ...prev, [field]: value }));
    setErrors(prev => ({ ...prev, [field]: undefined }));
  }, []);

  const updateLocation = useCallback((field, value) => {
    setData(prev => ({
      ...prev,
      location: { ...prev.location, [field]: value },
    }));
  }, []);

  const validateStep = useCallback((currentStep) => {
    const errs = {};

    if (currentStep === 1) {
      if (!data.scheduledDate) errs.scheduledDate = 'Select a date';
      if (!data.scheduledTime) errs.scheduledTime = 'Select a time';
    }

    if (currentStep === 2) {
      if (!data.location.state) errs.state = 'Select a state';
      if (!data.location.address) errs.address = 'Enter an address';
    }

    if (currentStep === 3) {
      if (!data.scope?.trim()) errs.scope = 'Describe the work needed';
    }

    if (currentStep === 4) {
      if (!data.agreedToTerms) errs.agreedToTerms = 'You must agree to the terms';
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  }, [data]);

  const next = useCallback(() => {
    if (validateStep(step)) {
      setStep(s => Math.min(s + 1, totalSteps - 1));
      return true;
    }
    return false;
  }, [step, totalSteps, validateStep]);

  const prev = useCallback(() => {
    setStep(s => Math.max(s - 1, 0));
  }, []);

  const goTo = useCallback((s) => {
    setStep(Math.max(0, Math.min(s, totalSteps - 1)));
  }, [totalSteps]);

  return {
    step,
    data,
    errors,
    stepLabels: STEP_LABELS,
    isFirst: step === 0,
    isLast: step === totalSteps - 1,
    isConfirmation: step === totalSteps - 1,
    updateField,
    updateLocation,
    validateStep,
    next,
    prev,
    goTo,
    setData,
  };
}
