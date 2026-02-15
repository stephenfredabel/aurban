import i18next from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

// English (base — always bundled, never lazy-loaded)
import enCommon     from './locales/en/common.json';
import enOnboarding from './locales/en/onboarding.json';
import enDashboard  from './locales/en/dashboard.json';
import enProperties from './locales/en/properties.json';
import enErrors     from './locales/en/errors.json';
import enAdmin      from './locales/en/admin.json';

// Nigerian languages — bundled (primary market)
import haCommon  from './locales/ha/common.json';
import yoCommon  from './locales/yo/common.json';
import igCommon  from './locales/ig/common.json';
import pcmCommon from './locales/pcm/common.json';

// African expansion — bundled
import frCommon from './locales/fr/common.json';
import swCommon from './locales/sw/common.json';
import amCommon from './locales/am/common.json';
import arCommon from './locales/ar/common.json';
import ptCommon from './locales/pt/common.json';
import zuCommon from './locales/zu/common.json';

// Global — bundled (Phase 3)
import esCommon from './locales/es/common.json';
import deCommon from './locales/de/common.json';
import zhCommon from './locales/zh/common.json';

i18next
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      en:  { common: enCommon, onboarding: enOnboarding, dashboard: enDashboard, properties: enProperties, errors: enErrors, admin: enAdmin },
      ha:  { common: haCommon },
      yo:  { common: yoCommon },
      ig:  { common: igCommon },
      pcm: { common: pcmCommon },
      fr:  { common: frCommon },
      sw:  { common: swCommon },
      am:  { common: amCommon },
      ar:  { common: arCommon },
      pt:  { common: ptCommon },
      zu:  { common: zuCommon },
      es:  { common: esCommon },
      de:  { common: deCommon },
      zh:  { common: zhCommon },
    },
    defaultNS: 'common',
    fallbackLng: 'en',
    fallbackNS: 'common',
    detection: {
      order: ['localStorage', 'navigator', 'htmlTag'],
      lookupLocalStorage: 'aurban_language',
      caches: ['localStorage'],
    },
    interpolation: {
      escapeValue: false, // React handles XSS
    },
    react: {
      useSuspense: false,
    },
  });

export default i18next;