import { getIDTypesForCountry } from './verification.js';
import { getBusinessRegistry }  from './verification.js';
import { getProvidersForCountry } from './payments.js';

// Complete country registry
// Each entry: code, name, currency, phone prefix, flag, language, region
export const COUNTRIES = [
  // ── Nigeria first ─────────────────────────────────────────
  { code: 'NG', name: 'Nigeria',              currency: 'NGN', phone: '+234', flag: '🇳🇬', language: 'en',  region: 'west_africa'   },
  // ── Africa ────────────────────────────────────────────────
  { code: 'GH', name: 'Ghana',                currency: 'GHS', phone: '+233', flag: '🇬🇭', language: 'en',  region: 'west_africa'   },
  { code: 'KE', name: 'Kenya',                currency: 'KES', phone: '+254', flag: '🇰🇪', language: 'sw',  region: 'east_africa'   },
  { code: 'TZ', name: 'Tanzania',             currency: 'TZS', phone: '+255', flag: '🇹🇿', language: 'sw',  region: 'east_africa'   },
  { code: 'UG', name: 'Uganda',               currency: 'UGX', phone: '+256', flag: '🇺🇬', language: 'sw',  region: 'east_africa'   },
  { code: 'RW', name: 'Rwanda',               currency: 'RWF', phone: '+250', flag: '🇷🇼', language: 'fr',  region: 'east_africa'   },
  { code: 'ET', name: 'Ethiopia',             currency: 'ETB', phone: '+251', flag: '🇪🇹', language: 'am',  region: 'east_africa'   },
  { code: 'ZA', name: 'South Africa',         currency: 'ZAR', phone: '+27',  flag: '🇿🇦', language: 'en',  region: 'southern_africa'},
  { code: 'ZM', name: 'Zambia',               currency: 'ZMW', phone: '+260', flag: '🇿🇲', language: 'en',  region: 'southern_africa'},
  { code: 'MZ', name: 'Mozambique',           currency: 'MZN', phone: '+258', flag: '🇲🇿', language: 'pt',  region: 'southern_africa'},
  { code: 'AO', name: 'Angola',               currency: 'AOA', phone: '+244', flag: '🇦🇴', language: 'pt',  region: 'southern_africa'},
  { code: 'EG', name: 'Egypt',                currency: 'EGP', phone: '+20',  flag: '🇪🇬', language: 'ar',  region: 'north_africa'  },
  { code: 'MA', name: 'Morocco',              currency: 'MAD', phone: '+212', flag: '🇲🇦', language: 'ar',  region: 'north_africa'  },
  { code: 'TN', name: 'Tunisia',              currency: 'TND', phone: '+216', flag: '🇹🇳', language: 'ar',  region: 'north_africa'  },
  { code: 'SN', name: 'Senegal',              currency: 'XOF', phone: '+221', flag: '🇸🇳', language: 'fr',  region: 'west_africa'   },
  { code: 'CI', name: "Côte d'Ivoire",        currency: 'XOF', phone: '+225', flag: '🇨🇮', language: 'fr',  region: 'west_africa'   },
  { code: 'CM', name: 'Cameroon',             currency: 'XAF', phone: '+237', flag: '🇨🇲', language: 'fr',  region: 'central_africa' },
  { code: 'CD', name: 'DR Congo',             currency: 'CDF', phone: '+243', flag: '🇨🇩', language: 'fr',  region: 'central_africa' },
  // ── Global ────────────────────────────────────────────────
  { code: 'GB', name: 'United Kingdom',       currency: 'GBP', phone: '+44',  flag: '🇬🇧', language: 'en',  region: 'europe'        },
  { code: 'US', name: 'United States',        currency: 'USD', phone: '+1',   flag: '🇺🇸', language: 'en',  region: 'americas'      },
  { code: 'CA', name: 'Canada',               currency: 'CAD', phone: '+1',   flag: '🇨🇦', language: 'en',  region: 'americas'      },
  { code: 'DE', name: 'Germany',              currency: 'EUR', phone: '+49',  flag: '🇩🇪', language: 'de',  region: 'europe'        },
  { code: 'FR', name: 'France',               currency: 'EUR', phone: '+33',  flag: '🇫🇷', language: 'fr',  region: 'europe'        },
  { code: 'AE', name: 'United Arab Emirates', currency: 'AED', phone: '+971', flag: '🇦🇪', language: 'ar',  region: 'middle_east'   },
  { code: 'IN', name: 'India',                currency: 'INR', phone: '+91',  flag: '🇮🇳', language: 'en',  region: 'asia'          },
  { code: 'CN', name: 'China',                currency: 'CNY', phone: '+86',  flag: '🇨🇳', language: 'zh',  region: 'asia'          },
];

export const REGION_LABELS = {
  west_africa:     'West Africa',
  east_africa:     'East Africa',
  north_africa:    'North Africa',
  southern_africa: 'Southern Africa',
  central_africa:  'Central Africa',
  europe:          'Europe',
  americas:        'Americas',
  middle_east:     'Middle East',
  asia:            'Asia',
};

export const getCountry = (code) =>
  COUNTRIES.find((c) => c.code === code) || COUNTRIES[0];

export const getCountriesByRegion = () =>
  COUNTRIES.reduce((acc, c) => {
    if (!acc[c.region]) acc[c.region] = [];
    acc[c.region].push(c);
    return acc;
  }, {});

/**
 * Get full country config including ID types,
 * payment providers and business registry
 */
export const getCountryConfig = (code) => {
  const country = getCountry(code);
  return {
    ...country,
    idTypes:          getIDTypesForCountry(code),
    paymentProviders: getProvidersForCountry(code),
    businessRegistry: getBusinessRegistry(code),
  };
};