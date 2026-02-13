export const CURRENCIES = [
  { code: 'NGN', symbol: 'NGN', name: 'Nigerian Naira' },
  { code: 'GHS', symbol: 'GHS', name: 'Ghanaian Cedi' },
  { code: 'KES', symbol: 'KES', name: 'Kenyan Shilling' },
  { code: 'ZAR', symbol: 'ZAR', name: 'South African Rand' },
  { code: 'EGP', symbol: 'EGP', name: 'Egyptian Pound' },
  { code: 'USD', symbol: 'USD', name: 'US Dollar' },
  { code: 'EUR', symbol: 'EUR', name: 'Euro' },
  { code: 'GBP', symbol: 'GBP', name: 'British Pound' },
];

const DEFAULT_CURRENCY = CURRENCIES[0];

export const getCurrency = (code) =>
  CURRENCIES.find((c) => c.code === code) || DEFAULT_CURRENCY;

export const formatCurrency = (amount, code = 'NGN', options = {}) => {
  const safeAmount = Number.isFinite(Number(amount)) ? Number(amount) : 0;
  return new Intl.NumberFormat(undefined, {
    style: 'currency',
    currency: code,
    maximumFractionDigits: 0,
    ...options,
  }).format(safeAmount);
};

const UNIT_LABELS = {
  year: 'yr',
  month: 'mo',
  week: 'wk',
  day: 'day',
  job: 'job',
};

export const formatPrice = (amount, code = 'NGN', unit = 'year') => {
  const unitLabel = UNIT_LABELS[unit] || unit;
  return `${formatCurrency(amount, code)} / ${unitLabel}`;
};

