export const COUNTRIES = [
  { code: 'NG', name: 'Nigeria',      phone: '+234', currency: 'NGN', language: 'en', region: 'west_africa',  flag: 'NG' },
  { code: 'GH', name: 'Ghana',        phone: '+233', currency: 'GHS', language: 'en', region: 'west_africa',  flag: 'GH' },
  { code: 'KE', name: 'Kenya',        phone: '+254', currency: 'KES', language: 'sw', region: 'east_africa',  flag: 'KE' },
  { code: 'ZA', name: 'South Africa', phone: '+27',  currency: 'ZAR', language: 'zu', region: 'south_africa', flag: 'ZA' },
  { code: 'EG', name: 'Egypt',        phone: '+20',  currency: 'EGP', language: 'ar', region: 'north_africa', flag: 'EG' },
  { code: 'US', name: 'United States',phone: '+1',   currency: 'USD', language: 'en', region: 'global',       flag: 'US' },
  { code: 'GB', name: 'United Kingdom',phone:'+44',  currency: 'GBP', language: 'en', region: 'global',       flag: 'GB' },
];

export const REGION_LABELS = {
  west_africa: 'West Africa',
  east_africa: 'East Africa',
  south_africa: 'South Africa',
  north_africa: 'North Africa',
  global: 'Global',
};

const COUNTRY_CONFIG = {
  NG: {
    idTypes: ['NIN', 'Voter Card', 'International Passport', 'Driver License'],
    paymentProviders: ['Bank Transfer', 'Card', 'USSD'],
    businessRegistry: 'CAC',
    currency: 'NGN',
    phone: '+234',
    flag: 'NG',
  },
  GH: {
    idTypes: ['Ghana Card', 'Passport', 'Driver License'],
    paymentProviders: ['Mobile Money', 'Bank Transfer', 'Card'],
    businessRegistry: 'RGD',
    currency: 'GHS',
    phone: '+233',
    flag: 'GH',
  },
  KE: {
    idTypes: ['National ID', 'Passport', 'Driver License'],
    paymentProviders: ['M-Pesa', 'Bank Transfer', 'Card'],
    businessRegistry: 'eCitizen',
    currency: 'KES',
    phone: '+254',
    flag: 'KE',
  },
  ZA: {
    idTypes: ['National ID', 'Passport', 'Driver License'],
    paymentProviders: ['EFT', 'Card'],
    businessRegistry: 'CIPC',
    currency: 'ZAR',
    phone: '+27',
    flag: 'ZA',
  },
  EG: {
    idTypes: ['National ID', 'Passport'],
    paymentProviders: ['Bank Transfer', 'Card', 'Mobile Wallet'],
    businessRegistry: 'GAFI',
    currency: 'EGP',
    phone: '+20',
    flag: 'EG',
  },
  US: {
    idTypes: ['Driver License', 'State ID', 'Passport'],
    paymentProviders: ['ACH', 'Card'],
    businessRegistry: 'State Registry',
    currency: 'USD',
    phone: '+1',
    flag: 'US',
  },
  GB: {
    idTypes: ['Driving Licence', 'Passport'],
    paymentProviders: ['Bank Transfer', 'Card'],
    businessRegistry: 'Companies House',
    currency: 'GBP',
    phone: '+44',
    flag: 'GB',
  },
};

const DEFAULT_COUNTRY = COUNTRIES[0];

export const getCountry = (code) =>
  COUNTRIES.find((c) => c.code === code) || DEFAULT_COUNTRY;

export const getCountriesByRegion = () =>
  COUNTRIES.reduce((acc, country) => {
    if (!acc[country.region]) acc[country.region] = [];
    acc[country.region].push(country);
    return acc;
  }, {});

export const getCountryConfig = (code) => {
  const country = getCountry(code);
  return COUNTRY_CONFIG[country.code] || COUNTRY_CONFIG[DEFAULT_COUNTRY.code];
};

