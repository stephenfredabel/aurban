import { useState, useRef, useEffect } from 'react';
import { Globe, Check, Search, ChevronDown, X } from 'lucide-react';
import { useLanguage } from '../../hooks/useLanguage.js';
import { REGION_LABELS } from '../../i18n/config.js';

/**
 * Language switcher — grouped panel
 * Groups: Nigerian Languages / African Languages / Global Languages
 * Has search, shows current selection, RTL-aware
 */
export default function LanguageSwitcher({ compact = false }) {
  const { language, languageCode, changeLanguage, languagesByRegion } = useLanguage();
  const [open,   setOpen]   = useState(false);
  const [query,  setQuery]  = useState('');
  const panelRef = useRef(null);
  const searchRef = useRef(null);

  useEffect(() => {
    const handler = (e) => {
      if (panelRef.current && !panelRef.current.contains(e.target)) {
        setOpen(false);
        setQuery('');
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  useEffect(() => {
    if (open) setTimeout(() => searchRef.current?.focus(), 60);
  }, [open]);

  // Flatten for search
  const allLanguages = Object.values(languagesByRegion).flat();
  const filtered = query
    ? allLanguages.filter((l) =>
        l.name.toLowerCase().includes(query.toLowerCase()) ||
        l.nativeName.toLowerCase().includes(query.toLowerCase())
      )
    : null;

  const handleSelect = (code) => {
    changeLanguage(code);
    setOpen(false);
    setQuery('');
  };

  const renderLanguageBtn = (lang) => (
    <button
      key={lang.code}
      type="button"
      onClick={() => handleSelect(lang.code)}
      className={[
        'w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors rounded-xl',
        lang.code === languageCode
          ? 'bg-brand-gold/10 text-brand-charcoal-dark'
          : 'hover:bg-brand-gray-soft text-brand-charcoal',
      ].join(' ')}
      role="option"
      aria-selected={lang.code === languageCode}
    >
      <span className="text-lg leading-none shrink-0">{lang.flag}</span>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold truncate">{lang.nativeName}</p>
        {lang.nativeName !== lang.name && (
          <p className="text-xs text-gray-400 truncate">{lang.name}</p>
        )}
      </div>
      {lang.rtl && (
        <span className="text-[10px] font-bold text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded shrink-0">
          RTL
        </span>
      )}
      {lang.code === languageCode && (
        <Check size={14} className="text-brand-gold shrink-0" />
      )}
    </button>
  );

  return (
    <div ref={panelRef} className="relative">
      {/* Trigger */}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label="Change language"
        aria-expanded={open}
        aria-haspopup="listbox"
        className={[
          'flex items-center gap-1.5 transition-colors rounded-xl',
          'outline-none focus-visible:ring-2 focus-visible:ring-brand-gold/40',
          compact
            ? 'p-2 hover:bg-brand-gray-soft text-brand-charcoal'
            : 'px-3 py-2 hover:bg-brand-gray-soft text-brand-charcoal',
        ].join(' ')}
      >
        <Globe size={16} className="shrink-0" aria-hidden />
        {!compact && (
          <>
            <span className="hidden text-sm font-medium sm:block">{language.nativeName}</span>
            <ChevronDown
              size={12}
              className={`text-gray-400 transition-transform hidden sm:block ${open ? 'rotate-180' : ''}`}
            />
          </>
        )}
      </button>

      {/* Panel */}
      {open && (
        <div
          role="listbox"
          aria-label="Select language"
          className={[
            'absolute z-[100] bg-white rounded-2xl shadow-dropdown border border-gray-100',
            'animate-scale-in overflow-hidden',
            'right-0 mt-2 w-72',
          ].join(' ')}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
            <p className="text-sm font-bold text-brand-charcoal-dark">Select Language</p>
            <button
              type="button"
              onClick={() => { setOpen(false); setQuery(''); }}
              className="flex items-center justify-center text-gray-400 transition-colors rounded-full w-7 h-7 hover:bg-gray-100"
              aria-label="Close"
            >
              <X size={14} />
            </button>
          </div>

          {/* Search */}
          <div className="p-3 border-b border-gray-100">
            <div className="relative">
              <Search size={13} className="absolute text-gray-400 -translate-y-1/2 left-3 top-1/2" />
              <input
                ref={searchRef}
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search languages..."
                className="w-full py-2 pl-8 pr-3 text-sm transition-colors border border-transparent outline-none bg-brand-gray-soft rounded-xl focus:border-brand-gold placeholder:text-gray-400"
              />
            </div>
          </div>

          {/* Options */}
          <div className="p-2 overflow-y-auto max-h-72">
            {filtered ? (
              filtered.length > 0 ? (
                <div className="space-y-0.5">{filtered.map(renderLanguageBtn)}</div>
              ) : (
                <p className="py-6 text-sm text-center text-gray-400">No languages found</p>
              )
            ) : (
              Object.entries(languagesByRegion).map(([region, langs]) => (
                <div key={region} className="mb-2">
                  <p className="px-4 pt-2 pb-1 text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                    {REGION_LABELS[region] || region}
                  </p>
                  <div className="space-y-0.5">
                    {langs.map(renderLanguageBtn)}
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer */}
          <div className="px-4 py-3 border-t border-gray-100">
            <p className="text-[11px] text-gray-400 text-center">
              More languages coming soon
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
