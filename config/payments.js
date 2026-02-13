// Payment provider configuration per country/region
// Each provider has: id, label, logo, countries[], type, note

export const PAYMENT_PROVIDERS = [
  // ── Nigeria ──────────────────────────────────────────────
  {
    id:       'paystack',
    label:    'Paystack',
    logo:     '💳',
    type:     'card_bank',
    countries: ['NG'],
    note:     'Cards, bank transfer, USSD',
    envKey:   'VITE_PAYSTACK_PUBLIC_KEY',
    docsUrl:  'https://paystack.com/docs',
  },
  {
    id:       'opay',
    label:    'OPay',
    logo:     '🟢',
    type:     'wallet_bank',
    countries: ['NG'],
    note:     'OPay wallet, bank transfer',
    envKey:   'VITE_OPAY_PUBLIC_KEY',
    docsUrl:  'https://merchant.opay.com',
  },
  {
    id:       'flutterwave',
    label:    'Flutterwave',
    logo:     '🌊',
    type:     'multi',
    countries: [
      'NG','GH','KE','TZ','UG','RW','ZA','CM','SN','CI','BJ','ET',
      'ZM','MW','MZ','TG','NE','ML','BF','GA','CD','MG','SC',
      'GB','US','CA','EU',
    ],
    note:     'Cards, mobile money, bank transfer (35+ countries)',
    envKey:   'VITE_FLUTTERWAVE_PUBLIC_KEY',
    docsUrl:  'https://developer.flutterwave.com',
  },

  // ── East Africa — Mobile Money ────────────────────────────
  {
    id:       'mpesa',
    label:    'M-Pesa',
    logo:     '📱',
    type:     'mobile_money',
    countries: ['KE','TZ','UG','MZ','RW','CD','ET'],
    note:     'Mobile money — Safaricom & Vodacom',
    envKey:   'VITE_MPESA_CONSUMER_KEY',
    docsUrl:  'https://developer.safaricom.co.ke',
  },
  {
    id:       'mtn_momo',
    label:    'MTN Mobile Money',
    logo:     '🟡',
    type:     'mobile_money',
    countries: ['GH','CM','CI','SN','UG','RW','ZM','BJ','ML','BF','GN','MG','CD','LR','AF'],
    note:     'MTN MoMo — 20+ African countries',
    envKey:   'VITE_MTN_MOMO_KEY',
    docsUrl:  'https://momodeveloper.mtn.com',
  },
  {
    id:       'airtel_money',
    label:    'Airtel Money',
    logo:     '🔴',
    type:     'mobile_money',
    countries: ['KE','TZ','UG','RW','ZM','MW','MG','CD','TD','NE','CG','SC'],
    note:     'Airtel Money — East & Central Africa',
    envKey:   'VITE_AIRTEL_MONEY_KEY',
    docsUrl:  'https://developers.airtel.africa',
  },
  {
    id:       'orange_money',
    label:    'Orange Money',
    logo:     '🟠',
    type:     'mobile_money',
    countries: ['SN','CI','ML','BF','GN','CM','MR','MG','MA','TN','EG'],
    note:     'Orange Money — Francophone Africa',
    envKey:   'VITE_ORANGE_MONEY_KEY',
    docsUrl:  'https://developer.orange.com/apis/om-webpay',
  },

  // ── North Africa ──────────────────────────────────────────
  {
    id:       'fawry',
    label:    'Fawry',
    logo:     '💙',
    type:     'card_wallet',
    countries: ['EG'],
    note:     'Egypt — cards, wallets, cash points',
    envKey:   'VITE_FAWRY_MERCHANT_CODE',
    docsUrl:  'https://developer.fawry.com',
  },

  // ── South Africa ──────────────────────────────────────────
  {
    id:       'ozow',
    label:    'Ozow',
    logo:     '💜',
    type:     'bank_transfer',
    countries: ['ZA'],
    note:     'Instant EFT — South Africa',
    envKey:   'VITE_OZOW_API_KEY',
    docsUrl:  'https://ozow.com/integrations',
  },

  // ── Global ────────────────────────────────────────────────
  {
    id:       'stripe',
    label:    'Stripe',
    logo:     '💳',
    type:     'card_global',
    countries: ['GB','US','CA','AU','DE','FR','ES','IT','NL','SE','NO','DK',
                'CH','AT','BE','PT','IE','FI','PL','AE','SG','JP','NZ'],
    note:     'Cards & bank transfer — 135+ countries',
    envKey:   'VITE_STRIPE_PUBLIC_KEY',
    docsUrl:  'https://stripe.com/docs',
  },
];

/**
 * Get payment providers available in a given country code
 */
export const getProvidersForCountry = (countryCode) =>
  PAYMENT_PROVIDERS.filter((p) => p.countries.includes(countryCode));

/**
 * Get the primary (recommended) provider for a country
 * Priority: country-specific first, then multi-country, then global
 */
export const getPrimaryProvider = (countryCode) => {
  const providers = getProvidersForCountry(countryCode);
  return (
    providers.find((p) => p.countries.length === 1 && p.countries[0] === countryCode) ||
    providers.find((p) => p.type === 'multi') ||
    providers[0] ||
    PAYMENT_PROVIDERS.find((p) => p.id === 'stripe')
  );
};