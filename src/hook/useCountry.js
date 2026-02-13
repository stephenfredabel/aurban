import { useLocale } from '../context/LocaleContext.jsx';

/**
 * Convenience hook — returns country-specific data
 * ready to use in components without destructuring the full locale
 */
export function useCountry() {
  const { countryCode, countryConfig, changeCountry } = useLocale();
  return {
    code:             countryCode,
    config:           countryConfig,
    idTypes:          countryConfig.idTypes,
    paymentProviders: countryConfig.paymentProviders,
    businessRegistry: countryConfig.businessRegistry,
    currency:         countryConfig.currency,
    phonePrefix:      countryConfig.phone,
    flag:             countryConfig.flag,
    changeCountry,
  };
}