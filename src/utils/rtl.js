/**
 * RTL layout utilities
 * Works alongside Tailwind's RTL variant and the RTLWrapper component
 */

const RTL_LANGUAGES = ['ar', 'he', 'fa', 'ur', 'ps', 'sd', 'yi'];

/**
 * Whether a language code is RTL
 */
export function isRTL(languageCode) {
  return RTL_LANGUAGES.includes(languageCode?.split('-')[0]);
}

/**
 * Returns 'rtl' | 'ltr' for CSS dir attribute
 */
export function getDir(languageCode) {
  return isRTL(languageCode) ? 'rtl' : 'ltr';
}

/**
 * Swaps start/end margin/padding class for current direction
 * e.g. 'ml-4' in RTL context → 'mr-4'
 * Use sparingly — prefer Tailwind's rtl: variant
 */
export function mirrorClass(cls, rtl) {
  if (!rtl) return cls;
  return cls
    .replace(/\bml-/g, '__mr__')
    .replace(/\bmr-/g, 'ml-')
    .replace(/__mr__/g, 'mr-')
    .replace(/\bpl-/g, '__pr__')
    .replace(/\bpr-/g, 'pl-')
    .replace(/__pr__/g, 'pr-')
    .replace(/\bleft-/g, '__right__')
    .replace(/\bright-/g, 'left-')
    .replace(/__right__/g, 'right-')
    .replace(/\btext-left\b/g, '__text-right__')
    .replace(/\btext-right\b/g, 'text-left')
    .replace(/__text-right__/g, 'text-right')
    .replace(/\brounded-l/g, '__rounded-r__')
    .replace(/\brounded-r/g, 'rounded-l')
    .replace(/__rounded-r__/g, 'rounded-r');
}

/**
 * Returns logical inline styles for RTL-sensitive positioning
 * e.g. left icon padding in RTL should become right padding
 */
export function logicalPadding(side, value, rtl) {
  const map = rtl
    ? { left: 'paddingRight', right: 'paddingLeft', start: 'paddingRight', end: 'paddingLeft' }
    : { left: 'paddingLeft',  right: 'paddingRight', start: 'paddingLeft',  end: 'paddingRight' };
  return { [map[side] || 'paddingLeft']: value };
}

/**
 * Applies document-level RTL
 * Called once by RTLWrapper — exported for programmatic use
 */
export function applyDocumentDir(languageCode) {
  const dir = getDir(languageCode);
  document.documentElement.setAttribute('dir',  dir);
  document.documentElement.setAttribute('lang', languageCode);
  return dir;
}

/**
 * Number formatting: RTL languages sometimes need Arabic-Indic numerals
 * Pass through Intl.NumberFormat to get the right script
 */
export function formatNumberForLocale(number, languageCode) {
  try {
    return new Intl.NumberFormat(languageCode).format(number);
  } catch {
    return String(number);
  }
}