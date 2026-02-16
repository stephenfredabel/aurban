import { initializeApp } from 'firebase/app';
import { getAuth, RecaptchaVerifier, signInWithPhoneNumber } from 'firebase/auth';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);
export const firebaseAuth = getAuth(app);

/**
 * Send OTP to phone number
 * @param {string} phoneNumber - e.g. '+2348012345678'
 * @param {HTMLElement} buttonElement - the button that triggers this (for reCAPTCHA)
 */
export async function sendPhoneOTP(phoneNumber, buttonElement) {
  // Invisible reCAPTCHA — user never sees it
  if (!window.recaptchaVerifier) {
    window.recaptchaVerifier = new RecaptchaVerifier(firebaseAuth, buttonElement, {
      size: 'invisible',
    });
  }

  const confirmationResult = await signInWithPhoneNumber(
    firebaseAuth,
    phoneNumber,
    window.recaptchaVerifier
  );

  // Store this — needed to verify the code later
  window.confirmationResult = confirmationResult;
  return confirmationResult;
}

/**
 * Verify the OTP code user entered
 * @param {string} code - 6-digit code from SMS
 */
export async function verifyPhoneOTP(code) {
  if (!window.confirmationResult) {
    throw new Error('No verification in progress');
  }

  const result = await window.confirmationResult.confirm(code);
  return result.user;  // Firebase user object
}