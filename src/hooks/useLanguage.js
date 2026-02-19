import { useTranslation } from 'react-i18next';
import { useLocale }      from '../context/LocaleContext.jsx';
import { getLanguagesByRegion, getLanguage } from '../i18n/config.js';

/**
 * Convenience hook for language-related operations
 */
export function useLanguage() {
  const { t } = useTranslation();
  const { languageCode, rtl, changeLanguage } = useLocale();

  return {
    t,
    language:           getLanguage(languageCode),
    languageCode,
    rtl,
    changeLanguage,
    languagesByRegion:  getLanguagesByRegion(),
    allLanguages:       Object.values(getLanguagesByRegion()).flat(),
  };
}
