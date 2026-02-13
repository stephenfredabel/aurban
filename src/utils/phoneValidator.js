/**
 * Phone number validation and formatting utilities
 * Uses country-aware rules — no external dependency required
 */

// Rules: [countryCode, dialPrefix, minDigits, maxDigits, example]
const RULES = {
  NG: { prefix: '+234', min: 10, max: 11, localMin: 10, pattern: /^0?[789][01]\d{8}$/,    example: '0801 234 5678'  },
  KE: { prefix: '+254', min: 9,  max: 10, localMin: 9,  pattern: /^0?[17]\d{8}$/,          example: '0712 345 678'   },
  GH: { prefix: '+233', min: 9,  max: 10, localMin: 9,  pattern: /^0?[235]\d{8}$/,          example: '0241 234 567'   },
  ZA: { prefix: '+27',  min: 9,  max: 10, localMin: 9,  pattern: /^0?[678]\d{8}$/,          example: '071 234 5678'   },
  EG: { prefix: '+20',  min: 10, max: 11, localMin: 10, pattern: /^0?1[0-25]\d{8}$/,        example: '0101 234 5678'  },
  ET: { prefix: '+251', min: 9,  max: 10, localMin: 9,  pattern: /^0?9\d{8}$/,              example: '091 234 5678'   },
  TZ: { prefix: '+255', min: 9,  max: 10, localMin: 9,  pattern: /^0?[67]\d{8}$/,           example: '0712 345 678'   },
  UG: { prefix: '+256', min: 9,  max: 10, localMin: 9,  pattern: /^0?[37]\d{8}$/,           example: '0712 345 678'   },
  RW: { prefix: '+250', min: 9,  max: 9,  localMin: 9,  pattern: /^0?7[2-8]\d{7}$/,         example: '0721 234 567'   },
  SN: { prefix: '+221', min: 9,  max: 9,  localMin: 9,  pattern: /^[37]\d{8}$/,             example: '77 123 4567'    },
  CI: { prefix: '+225', min: 10, max: 10, localMin: 10, pattern: /^0[57]\d{8}$/,            example: '07 00 00 0000'  },
  MA: { prefix: '+212', min: 9,  max: 10, localMin: 9,  pattern: /^0?[567]\d{8}$/,          example: '0612 345 678'   },
  GB: { prefix: '+44',  min: 10, max: 11, localMin: 10, pattern: /^0?[1-9]\d{9,10}$/,       example: '07911 123456'   },
  US: { prefix: '+1',   min: 10, max: 10, localMin: 10, pattern: /^[2-9]\d{9}$/,            example: '(555) 234-5678' },
  AE: { prefix: '+971', min: 9,  max: 9,  localMin: 9,  pattern: /^0?5\d{8}$/,              example: '050 123 4567'   },
};

const DEFAULT_RULE = { min: 7, max: 15, pattern: /^\d{7,15}$/, example: 'Phone number' };

/**
 * Strip all non-digit characters except leading +
 */
function strip(phone) {
  return phone?.replace(/[^\d+]/g, '') || '';
}

/**
 * Validate a phone number
 * @param {string} phone        Raw local number (with or without leading 0)
 * @param {string} countryCode  ISO 3166-1 alpha-2 country code
 * @returns {{ valid: boolean, error?: string, formatted?: string }}
 */
export function validatePhone(phone, countryCode = 'NG') {
  if (!phone) return { valid: false, error: 'Phone number is required' };

  const rule   = RULES[countryCode] || DEFAULT_RULE;
  const digits = strip(phone).replace(/^\+\d+/, ''); // Remove prefix if passed with it

  if (!rule.pattern) {
    const len = digits.length;
    if (len < rule.min || len > rule.max) {
      return { valid: false, error: `Invalid phone number (${rule.min}–${rule.max} digits)` };
    }
    return { valid: true, formatted: `${rule.prefix}${digits.replace(/^0/, '')}` };
  }

  if (!rule.pattern.test(digits)) {
    return {
      valid: false,
      error: `Invalid ${countryCode} phone number. Example: ${rule.example}`,
    };
  }

  const e164 = `${rule.prefix}${digits.replace(/^0/, '')}`;
  return { valid: true, formatted: e164 };
}

/**
 * Format a local number to E.164 international format
 * e.g. '08012345678', 'NG' → '+2348012345678'
 */
export function toE164(phone, countryCode = 'NG') {
  const rule   = RULES[countryCode];
  if (!rule) return phone;
  const digits = strip(phone).replace(/^0/, '');
  return `${rule.prefix}${digits}`;
}

/**
 * Get the dialling prefix for a country
 */
export function getDialPrefix(countryCode) {
  return RULES[countryCode]?.prefix || '';
}

/**
 * Get a placeholder example for a country's phone input
 */
export function getPhonePlaceholder(countryCode) {
  return RULES[countryCode]?.example || 'Phone number';
}

/**
 * Detect whether a raw string looks like a valid phone (loose check)
 */
export function looksLikePhone(str) {
  return /^\+?\d[\d\s\-()]{6,18}\d$/.test(str?.trim());
}