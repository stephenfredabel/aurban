import api from './api.js';

/**
 * Payment service
 * Wraps Paystack / Flutterwave / OPay / Stripe
 * All provider-specific SDK calls route through backend to keep keys server-side
 */

// ── Initiate payment ──────────────────────────────────────────

/**
 * Initialise a payment transaction
 * @param {object} opts
 * @param {number} opts.amount       Amount in smallest currency unit (kobo for NGN, cents for USD)
 * @param {string} opts.currency     ISO code e.g. 'NGN'
 * @param {string} opts.provider     'paystack' | 'flutterwave' | 'opay' | 'stripe' | 'mpesa'
 * @param {string} opts.type         'service_booking' | 'property_deposit' | 'subscription'
 * @param {string} opts.entityId     Service/property/subscription ID being paid for
 * @param {string} opts.description  Human-readable description
 * @param {object} opts.metadata     Any extra fields the provider should echo back
 * @returns {{ success, paymentUrl?, reference?, clientSecret?, error? }}
 */
export async function initiatePayment({
  amount,
  currency  = 'NGN',
  provider  = 'paystack',
  type,
  entityId,
  description,
  metadata  = {},
}) {
  try {
    const data = await api.post('/payments/initiate', {
      amount, currency, provider, type, entityId, description, metadata,
    });
    return { success: true, ...data };
  } catch (err) {
    return { success: false, error: err.data?.message || err.message };
  }
}

/**
 * Verify a completed payment by reference
 * @param {string} reference  Transaction reference returned by provider
 * @param {string} provider   Which provider processed the payment
 * @returns {{ success, verified, transaction?, error? }}
 */
export async function verifyPayment(reference, provider) {
  try {
    const data = await api.get('/payments/verify', {
      params: { reference, provider },
      dedup:  false,
    });
    return { success: true, verified: data.verified, transaction: data.transaction };
  } catch (err) {
    return { success: false, verified: false, error: err.message };
  }
}

/**
 * Get payment history for current user
 * @param {{ page, limit, type }} opts
 */
export async function getPaymentHistory({ page = 1, limit = 20, type } = {}) {
  try {
    const data = await api.get('/payments/history', { params: { page, limit, type } });
    return { success: true, ...data };
  } catch (err) {
    return { success: false, error: err.message, transactions: [], total: 0 };
  }
}

/**
 * Get payout balance for a provider
 */
export async function getPayoutBalance() {
  try {
    const data = await api.get('/payments/payout/balance', { dedup: true });
    return { success: true, ...data };
  } catch (err) {
    return { success: false, error: err.message, available: 0, pending: 0 };
  }
}

/**
 * Request a payout withdrawal
 * @param {{ amount, bankDetails }} opts
 */
export async function requestPayout({ amount, bankDetails } = {}) {
  try {
    const data = await api.post('/payments/payout/request', { amount, bankDetails });
    return { success: true, ...data };
  } catch (err) {
    return { success: false, error: err.data?.message || err.message };
  }
}

/**
 * Add / update saved payout details (bank account / OPay / M-Pesa)
 */
export async function savePayoutDetails(details) {
  try {
    const data = await api.put('/payments/payout/details', details);
    return { success: true, ...data };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

/**
 * Resolve a bank account number to account name (Nigeria NUBAN resolution)
 * @param {{ accountNumber, bankCode }} opts
 */
export async function resolveAccountName({ accountNumber, bankCode }) {
  try {
    const data = await api.get('/payments/resolve-account', {
      params: { accountNumber, bankCode },
      dedup:  true,
    });
    return { success: true, accountName: data.accountName };
  } catch (err) {
    return { success: false, error: err.data?.message || 'Could not resolve account' };
  }
}

// ── OPay specific ─────────────────────────────────────────────

/**
 * Initiate an OPay wallet-to-wallet transfer
 */
export async function opayTransfer({ phone, amount, note }) {
  return initiatePayment({
    amount,
    currency: 'NGN',
    provider: 'opay',
    type:     'wallet_transfer',
    metadata: { phone, note },
  });
}

// ── Paystack inline helper ────────────────────────────────────

/**
 * Load Paystack inline JS and open the checkout popup
 * @param {{ key, email, amount, currency, reference, onSuccess, onClose }} opts
 */
export function openPaystackInline({ key, email, amount, currency = 'NGN', reference, onSuccess, onClose }) {
  if (typeof window === 'undefined') return;

  const load = () => {
    const handler = window.PaystackPop.setup({
      key,
      email,
      amount,
      currency,
      ref:        reference,
      onClose:    onClose  || (() => {}),
      callback:   (response) => onSuccess?.(response),
    });
    handler.openIframe();
  };

  if (window.PaystackPop) {
    load();
  } else {
    const script    = document.createElement('script');
    script.src      = 'https://js.paystack.co/v1/inline.js';
    script.onload   = load;
    document.head.appendChild(script);
  }
}