export const SUPPORTED_LANGUAGES = [
  // Nigeria
  { code: 'en',  name: 'English',          nativeName: 'English',        flag: '🇬🇧', region: 'nigeria',  rtl: false },
  { code: 'ha',  name: 'Hausa',            nativeName: 'Hausa',          flag: '🇳🇬', region: 'nigeria',  rtl: false },
  { code: 'yo',  name: 'Yoruba',           nativeName: 'Yorùbá',         flag: '🇳🇬', region: 'nigeria',  rtl: false },
  { code: 'ig',  name: 'Igbo',             nativeName: 'Igbo',           flag: '🇳🇬', region: 'nigeria',  rtl: false },
  { code: 'pcm', name: 'Nigerian Pidgin',  nativeName: 'Naija Pidgin',   flag: '🇳🇬', region: 'nigeria',  rtl: false },
  // Africa
  { code: 'fr',  name: 'French',           nativeName: 'Français',       flag: '🇫🇷', region: 'africa',   rtl: false },
  { code: 'sw',  name: 'Swahili',          nativeName: 'Kiswahili',      flag: '🇰🇪', region: 'africa',   rtl: false },
  { code: 'am',  name: 'Amharic',          nativeName: 'አማርኛ',          flag: '🇪🇹', region: 'africa',   rtl: false },
  { code: 'ar',  name: 'Arabic',           nativeName: 'العربية',        flag: '🇦🇪', region: 'africa',   rtl: true  },
  { code: 'pt',  name: 'Portuguese',       nativeName: 'Português',      flag: '🇵🇹', region: 'africa',   rtl: false },
  { code: 'zu',  name: 'Zulu',             nativeName: 'isiZulu',        flag: '🇿🇦', region: 'africa',   rtl: false },
  // Global
  { code: 'es',  name: 'Spanish',          nativeName: 'Español',        flag: '🇪🇸', region: 'global',   rtl: false },
  { code: 'de',  name: 'German',           nativeName: 'Deutsch',        flag: '🇩🇪', region: 'global',   rtl: false },
  { code: 'zh',  name: 'Chinese',          nativeName: '中文',            flag: '🇨🇳', region: 'global',   rtl: false },
];

export const RTL_LANGUAGES = SUPPORTED_LANGUAGES.filter((l) => l.rtl).map((l) => l.code);

export const REGION_LABELS = {
  nigeria: '🇳🇬 Nigerian Languages',
  africa:  '🌍 African Languages',
  global:  '🌐 Global Languages',
};

export function getLanguage(code) {
  return SUPPORTED_LANGUAGES.find((l) => l.code === code) || SUPPORTED_LANGUAGES[0];
}

export function isRTL(code) {
  return RTL_LANGUAGES.includes(code);
}

export function getLanguagesByRegion() {
  return SUPPORTED_LANGUAGES.reduce((acc, lang) => {
    if (!acc[lang.region]) acc[lang.region] = [];
    acc[lang.region].push(lang);
    return acc;
  }, {});
}