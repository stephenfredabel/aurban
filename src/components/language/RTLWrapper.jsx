import { useEffect } from 'react';
import { useLocale } from '../../context/LocaleContext.jsx';

/**
 * Sets dir="rtl" on <html> and applies RTL-aware Tailwind classes
 * Wrap your entire app with this — it's lightweight, just syncs the DOM
 */
export default function RTLWrapper({ children }) {
  const { rtl, languageCode } = useLocale();

  useEffect(() => {
    document.documentElement.setAttribute('dir',  rtl ? 'rtl' : 'ltr');
    document.documentElement.setAttribute('lang', languageCode);
  }, [rtl, languageCode]);

  return (
    <div dir={rtl ? 'rtl' : 'ltr'} className={rtl ? 'font-arabic' : 'font-body'}>
      {children}
    </div>
  );
}