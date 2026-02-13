import { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import i18next from 'i18next';
import { getCountry, getCountryConfig }    from '../config/countries.js';
import { getCurrency, formatCurrency, formatPrice } from '../config/currencies.js';
import { isRTL }                           from '../config/languages.js';

const LocaleContext = createContext(null);

const STORAGE_KEY_COUNTRY  = 'aurban_country';
const STORAGE_KEY_LANGUAGE = 'aurban_language';
const STORAGE_KEY_CURRENCY = 'aurban_currency';

export function LocaleProvider({ children }) {
  const [countryCode, setCountryCode] = useState(
    () => localStorage.getItem(STORAGE_KEY_COUNTRY) ||
          import.meta.env.VITE_DEFAULT_COUNTRY || 'NG'
  );
  const [languageCode, setLanguageCode] = useState(
    () => localStorage.getItem(STORAGE_KEY_LANGUAGE) || 'en'
  );
  const [currencyCode, setCurrencyCode] = useState(
    () => localStorage.getItem(STORAGE_KEY_CURRENCY) ||
          import.meta.env.VITE_DEFAULT_CURRENCY || 'NGN'
  );

  // Sync i18next when language changes
  useEffect(() => {
    i18next.changeLanguage(languageCode);
    localStorage.setItem(STORAGE_KEY_LANGUAGE, languageCode);

    // RTL direction
    const rtl = isRTL(languageCode);
    document.documentElement.setAttribute('dir', rtl ? 'rtl' : 'ltr');
    document.documentElement.setAttribute('lang', languageCode);
  }, [languageCode]);

  // Persist country + currency
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_COUNTRY, countryCode);
  }, [countryCode]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_CURRENCY, currencyCode);
  }, [currencyCode]);

  const changeCountry = useCallback((code) => {
    const country = getCountry(code);
    setCountryCode(code);
    setCurrencyCode(country.currency);
    // Auto-switch language only if user hasn't manually overridden it
    if (!localStorage.getItem(STORAGE_KEY_LANGUAGE)) {
      setLanguageCode(country.language);
    }
  }, []);

  const changeLanguage = useCallback((code) => {
    setLanguageCode(code);
    localStorage.setItem(STORAGE_KEY_LANGUAGE, code);
  }, []);

  const changeCurrency = useCallback((code) => {
    setCurrencyCode(code);
  }, []);

  // Memoised country config (includes ID types, payments, registry)
  const countryConfig = useMemo(() =>
    getCountryConfig(countryCode), [countryCode]
  );

  const currency = useMemo(() =>
    getCurrency(currencyCode), [currencyCode]
  );

  const rtl = useMemo(() => isRTL(languageCode), [languageCode]);

  // Convenience formatters bound to current currency
  const formatAmount = useCallback(
    (amount, options) => formatCurrency(amount, currencyCode, options),
    [currencyCode]
  );

  const formatItemPrice = useCallback(
    (amount, unit) => formatPrice(amount, currencyCode, unit),
    [currencyCode]
  );

  return (
    <LocaleContext.Provider value={{
      countryCode,
      languageCode,
      currencyCode,
      countryConfig,
      currency,
      rtl,
      changeCountry,
      changeLanguage,
      changeCurrency,
      formatAmount,
      formatItemPrice,
    }}>
      {children}
    </LocaleContext.Provider>
  );
}

export function useLocale() {
  const ctx = useContext(LocaleContext);
  if (!ctx) throw new Error('useLocale must be used inside LocaleProvider');
  return ctx;
}