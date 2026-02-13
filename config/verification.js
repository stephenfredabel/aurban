// KYC document types available per country
// Used in Step04_Identity to show only relevant ID options

export const ID_TYPES_BY_COUNTRY = {
  // ── Nigeria ──────────────────────────────────────────────
  NG: [
    { value: 'nin',         label: 'National Identity Number (NIN)' },
    { value: 'passport',    label: 'International Passport' },
    { value: 'drivers',     label: "Driver's License" },
    { value: 'voters',      label: "Voter's Card" },
    { value: 'national_id', label: 'National ID Card' },
  ],
  // ── Kenya ─────────────────────────────────────────────────
  KE: [
    { value: 'national_id', label: 'National ID Card' },
    { value: 'passport',    label: 'International Passport' },
    { value: 'drivers',     label: "Driver's License" },
    { value: 'huduma',      label: 'Huduma Namba' },
  ],
  // ── Ghana ─────────────────────────────────────────────────
  GH: [
    { value: 'ghana_card',  label: 'Ghana Card (National ID)' },
    { value: 'passport',    label: 'International Passport' },
    { value: 'drivers',     label: "Driver's License" },
    { value: 'voters',      label: "Voter's ID Card" },
    { value: 'ssnit',       label: 'SSNIT Card' },
  ],
  // ── South Africa ──────────────────────────────────────────
  ZA: [
    { value: 'sa_id',       label: 'South African ID (Green Book / Smart ID)' },
    { value: 'passport',    label: 'International Passport' },
    { value: 'drivers',     label: "Driver's License" },
    { value: 'permit',      label: 'Residence / Work Permit' },
  ],
  // ── Egypt ─────────────────────────────────────────────────
  EG: [
    { value: 'national_id', label: 'National ID Card (بطاقة الرقم القومي)' },
    { value: 'passport',    label: 'International Passport' },
    { value: 'drivers',     label: "Driver's License" },
  ],
  // ── Ethiopia ──────────────────────────────────────────────
  ET: [
    { value: 'national_id', label: 'Ethiopian National ID (Fayda)' },
    { value: 'passport',    label: 'International Passport' },
    { value: 'drivers',     label: "Driver's License" },
  ],
  // ── Tanzania ──────────────────────────────────────────────
  TZ: [
    { value: 'nida',        label: 'NIDA National ID' },
    { value: 'passport',    label: 'International Passport' },
    { value: 'drivers',     label: "Driver's License" },
    { value: 'voters',      label: "Voter's ID" },
  ],
  // ── Uganda ────────────────────────────────────────────────
  UG: [
    { value: 'national_id', label: 'National ID Card' },
    { value: 'passport',    label: 'International Passport' },
    { value: 'drivers',     label: "Driver's License" },
    { value: 'voters',      label: "Voter's Card" },
  ],
  // ── Senegal / Côte d'Ivoire / Francophone West Africa ─────
  SN: [
    { value: 'national_id', label: "Carte Nationale d'Identité" },
    { value: 'passport',    label: 'Passeport International' },
    { value: 'drivers',     label: 'Permis de Conduire' },
  ],
  // ── UK ────────────────────────────────────────────────────
  GB: [
    { value: 'passport',    label: 'UK / International Passport' },
    { value: 'drivers',     label: "Driver's License (DVLA)" },
    { value: 'residence',   label: 'Biometric Residence Permit' },
  ],
  // ── USA ───────────────────────────────────────────────────
  US: [
    { value: 'passport',    label: 'US / International Passport' },
    { value: 'drivers',     label: "Driver's License (State-issued)" },
    { value: 'state_id',    label: 'State-issued ID Card' },
    { value: 'ssn',         label: 'Social Security Card' },
  ],
  // ── UAE ───────────────────────────────────────────────────
  AE: [
    { value: 'emirates_id', label: 'Emirates ID' },
    { value: 'passport',    label: 'International Passport' },
    { value: 'residence',   label: 'UAE Residence Visa' },
  ],
};

// Fallback for countries not explicitly listed — passport always works everywhere
export const DEFAULT_ID_TYPES = [
  { value: 'passport',    label: 'International Passport' },
  { value: 'national_id', label: 'National ID Card' },
  { value: 'drivers',     label: "Driver's License" },
];

export const getIDTypesForCountry = (countryCode) =>
  ID_TYPES_BY_COUNTRY[countryCode] || DEFAULT_ID_TYPES;

// Business registry names per country — used in onboarding label
export const BUSINESS_REGISTRY = {
  NG: { name: 'CAC',   fullName: 'Corporate Affairs Commission',             placeholder: 'RC123456' },
  KE: { name: 'BRS',   fullName: 'Business Registration Service',            placeholder: 'PVT-XXXXXXXX' },
  GH: { name: 'RGD',   fullName: "Registrar General's Department",           placeholder: 'CS-XXXXXXXXXX' },
  ZA: { name: 'CIPC',  fullName: 'Companies and Intellectual Property Commission', placeholder: '20XX/XXXXXX/07' },
  EG: { name: 'GAFI',  fullName: 'General Authority for Investment',         placeholder: 'XXXX-XXXX' },
  ET: { name: 'EIC',   fullName: 'Ethiopian Investment Commission',          placeholder: 'REGXXXXXXXX' },
  TZ: { name: 'BRELA', fullName: 'Business Registrations and Licensing Agency', placeholder: 'XXXXXXXX' },
  UG: { name: 'URSB',  fullName: 'Uganda Registration Services Bureau',     placeholder: '80XXXXXXXXX' },
  GB: { name: 'CH',    fullName: 'Companies House',                          placeholder: 'XXXXXXXX' },
  US: { name: 'SOS',   fullName: 'Secretary of State (State-level)',         placeholder: 'State-specific' },
  AE: { name: 'DED',   fullName: 'Department of Economic Development',       placeholder: 'XXXXXXXXXX' },
};

export const DEFAULT_REGISTRY = {
  name: 'Registry',
  fullName: 'Business Registration Authority',
  placeholder: 'Registration number',
};

export const getBusinessRegistry = (countryCode) =>
  BUSINESS_REGISTRY[countryCode] || DEFAULT_REGISTRY;

// Upload rules
export const UPLOAD_RULES = {
  id:        { maxMB: 10,  accept: ['image/jpeg','image/png','application/pdf'], label: 'ID Document' },
  selfie:    { maxMB: 8,   accept: ['image/jpeg','image/png'],                   label: 'Selfie Photo' },
  address:   { maxMB: 10,  accept: ['image/jpeg','image/png','application/pdf'], label: 'Proof of Address' },
  business:  { maxMB: 15,  accept: ['image/jpeg','image/png','application/pdf'], label: 'Business Document' },
  tax:       { maxMB: 15,  accept: ['image/jpeg','image/png','application/pdf'], label: 'Tax Document' },
  portfolio: { maxMB: 25,  accept: ['image/jpeg','image/png','application/pdf','application/zip'], label: 'Portfolio' },
  license:   { maxMB: 10,  accept: ['image/jpeg','image/png','application/pdf'], label: 'License / Certificate' },
  property:  { maxMB: 20,  accept: ['image/jpeg','image/png','application/pdf'], label: 'Property Document' },
};