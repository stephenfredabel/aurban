import { useLocale } from '../context/LocaleContext.jsx';

/**
 * Returns currency formatters bound to the current locale
 * Usage:
 *   const { format, formatWithUnit } = useCurrency();
 *   format(1500000)              → "₦1,500,000"
 *   formatWithUnit(1500000, 'year') → "₦1,500,000 / yr"
 */
export function useCurrency() {
  const { currency, formatAmount, formatItemPrice, currencyCode } = useLocale();
  return {
    currency,
    currencyCode,
    format:         formatAmount,
    formatWithUnit: formatItemPrice,
  };
}