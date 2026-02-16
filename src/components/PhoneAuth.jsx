import { initializeApp } from 'firebase/app';
import { getAuth, RecaptchaVerifier, signInWithPhoneNumber } from 'firebase/auth';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

let app = null;
let auth = null;

/**
 * Returns true when Firebase env vars are set.
 */
export function isFirebaseConfigured() {
  return Boolean(
    import.meta.env.VITE_FIREBASE_API_KEY &&
    import.meta.env.VITE_FIREBASE_PROJECT_ID
  );
}

/**
 * Lazily initialize Firebase (only when needed).
 */
function getFirebaseAuth() {
  if (!auth) {
    app = initializeApp(firebaseConfig);
    auth = getAuth(app);
    auth.useDeviceLanguage(); // SMS in user's language
  }
  return auth;
}

/**
 * Send OTP to phone number via Firebase.
 * @param {string} phoneNumber — e.g. '+2348012345678'
 * @param {HTMLElement} buttonElement — button that triggers this (for invisible reCAPTCHA)
 * @returns {Promise<ConfirmationResult>}
 */
export async function sendPhoneOTP(phoneNumber, buttonElement) {
  const firebaseAuth = getFirebaseAuth();

  // Create invisible reCAPTCHA (user never sees it)
  if (!window.recaptchaVerifier) {
    window.recaptchaVerifier = new RecaptchaVerifier(firebaseAuth, buttonElement, {
      size: 'invisible',
      callback: () => {
        // reCAPTCHA solved — allow signInWithPhoneNumber
      },
      'expired-callback': () => {
        // Reset if reCAPTCHA expires
        window.recaptchaVerifier = null;
      },
    });
  }

  const confirmationResult = await signInWithPhoneNumber(
    firebaseAuth,
    phoneNumber,
    window.recaptchaVerifier
  );

  // Store for later verification
  window.confirmationResult = confirmationResult;
  return confirmationResult;
}

/**
 * Verify the 6-digit OTP code.
 * @param {string} code — 6-digit code from SMS
 * @returns {Promise<FirebaseUser>}
 */
export async function verifyPhoneOTP(code) {
  if (!window.confirmationResult) {
    throw new Error('No verification in progress. Please request a new code.');
  }

  const result = await window.confirmationResult.confirm(code);
  return result.user;
}

export { getFirebaseAuth };