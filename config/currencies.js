// All currencies supported by Aurban
// symbol  — display symbol
// code    — ISO 4217 code (always show alongside symbol to avoid confusion)
// locale  — Intl.NumberFormat locale string
// region  — for grouping in UI

export const CURRENCIES = {
  NGN: { code: 'NGN', symbol: '₦',   name: 'Nigerian Naira',       locale: 'en-NG', region: 'nigeria' },
  KES: { code: 'KES', symbol: 'KSh', name: 'Kenyan Shilling',      locale: 'sw-KE', region: 'africa'  },
  GHS: { code: 'GHS', symbol: 'GH₵', name: 'Ghanaian Cedi',        locale: 'en-GH', region: 'africa'  },
  ZAR: { code: 'ZAR', symbol: 'R',   name: 'South African Rand',   locale: 'en-ZA', region: 'africa'  },
  EGP: { code: 'EGP', symbol: 'E£',  name: 'Egyptian Pound',       locale: 'ar-EG', region: 'africa'  },
  ETB: { code: 'ETB', symbol: 'Br',  name: 'Ethiopian Birr',       locale: 'am-ET', region: 'africa'  },
  TZS: { code: 'TZS', symbol: 'TSh', name: 'Tanzanian Shilling',   locale: 'sw-TZ', region: 'africa'  },
  UGX: { code: 'UGX', symbol: 'USh', name: 'Ugandan Shilling',     locale: 'en-UG', region: 'africa'  },
  RWF: { code: 'RWF', symbol: 'RF',  name: 'Rwandan Franc',        locale: 'rw-RW', region: 'africa'  },
  XOF: { code: 'XOF', symbol: 'CFA', name: 'West African CFA Franc',locale: 'fr-SN', region: 'africa'  },
  XAF: { code: 'XAF', symbol: 'CFA', name: 'Central African CFA',  locale: 'fr-CM', region: 'africa'  },
  MAD: { code: 'MAD', symbol: 'MAD', name: 'Moroccan Dirham',      locale: 'ar-MA', region: 'africa'  },
  GBP: { code: 'GBP', symbol: '£',   name: 'British Pound',        locale: 'en-GB', region: 'global'  },
  EUR: { code: 'EUR', symbol: '€',   name: 'Euro',                 locale: 'de-DE', region: 'global'  },
  USD: { code: 'USD', symbol: '$',   name: 'US Dollar',            locale: 'en-US', region: 'global'  },
  AED: { code: 'AED', symbol: 'د.إ', name: 'UAE Dirham',           locale: 'ar-AE', region: 'global'  },
  CAD: { code: 'CAD', symbol: 'CA$', name: 'Canadian Dollar',      locale: 'en-CA', region: 'global'  },
};

export const getCurrency = (code) =>
  CURRENCIES[code] || CURRENCIES.USD;

/**
 * Format a number as currency using Intl.NumberFormat
 * Always shows ISO code alongside symbol for clarity across regions
 */
export const formatCurrency = (amount, currencyCode = 'NGN', options = {}) => {
  const currency = getCurrency(currencyCode);
  try {
    return new Intl.NumberFormat(currency.locale, {
      style: 'currency',
      currency: currency.code,
      maximumFractionDigits: 0,
      ...options,
    }).format(amount);
  } catch {
    // Fallback if Intl fails for any locale
    return `${currency.symbol}${Number(amount).toLocaleString()}`;
  }
};

/**
 * Format with price unit (per year, per month, etc.)
 */
export const formatPrice = (amount, currencyCode = 'NGN', unit) => {
  const formatted = formatCurrency(amount, currencyCode);
  if (!unit || unit === 'outright') return formatted;
  const unitLabels = {
    year:  '/ yr',
    month: '/ mo',
    night: '/ night',
    week:  '/ wk',
    day:   '/ day',
    job:   '/ job',
    sqm:   '/ m²',
    project: '/ project',
  };
  return `${formatted} ${unitLabels[unit] || `/ ${unit}`}`;
};