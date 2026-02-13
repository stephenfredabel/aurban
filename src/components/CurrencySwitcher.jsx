import { useState, useRef, useEffect } from 'react';
import { Check, ChevronDown, X } from 'lucide-react';
import { useLocale } from '../context/LocaleContext.jsx';
import { CURRENCIES } from '../config/currencies.js';

const FLAGS = {
  NGN: '🇳🇬', GHS: '🇬🇭', KES: '🇰🇪', ZAR: '🇿🇦',
  EGP: '🇪🇬', USD: '🇺🇸', EUR: '🇪🇺', GBP: '🇬🇧',
};

const GROUPS = [
  { label: 'Nigerian', codes: ['NGN'] },
  { label: 'African', codes: ['GHS', 'KES', 'ZAR', 'EGP'] },
  { label: 'Global', codes: ['USD', 'EUR', 'GBP'] },
];

export default function CurrencySwitcher({ compact = false }) {
  const { currencyCode, changeCurrency } = useLocale();
  const [open, setOpen] = useState(false);
  const panelRef = useRef(null);

  useEffect(() => {
    const handler = (e) => {
      if (panelRef.current && !panelRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleSelect = (code) => {
    changeCurrency(code);
    setOpen(false);
  };

  const currencyMap = Object.fromEntries(CURRENCIES.map((c) => [c.code, c]));

  const renderOption = (code) => {
    const cur = currencyMap[code];
    if (!cur) return null;
    const selected = code === currencyCode;
    return (
      <button
        key={code}
        type="button"
        onClick={() => handleSelect(code)}
        className={[
          'w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors rounded-xl',
          selected
            ? 'bg-brand-gold/10 text-brand-charcoal-dark dark:text-white'
            : 'hover:bg-brand-gray-soft dark:hover:bg-white/5 text-brand-charcoal dark:text-gray-300',
        ].join(' ')}
        role="option"
        aria-selected={selected}
      >
        <span className="text-lg leading-none shrink-0">{FLAGS[code]}</span>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold truncate">{cur.code}</p>
          <p className="text-xs text-gray-400 truncate">{cur.name}</p>
        </div>
        {selected && <Check size={14} className="text-brand-gold shrink-0" />}
      </button>
    );
  };

  return (
    <div ref={panelRef} className="relative">
      {/* Trigger */}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label="Change currency"
        aria-expanded={open}
        aria-haspopup="listbox"
        className={[
          'flex items-center gap-1.5 transition-colors rounded-xl',
          'outline-none focus-visible:ring-2 focus-visible:ring-brand-gold/40',
          compact
            ? 'p-2 hover:bg-brand-gray-soft dark:hover:bg-white/5 text-brand-charcoal dark:text-gray-300'
            : 'px-3 py-2 hover:bg-brand-gray-soft dark:hover:bg-white/5 text-brand-charcoal dark:text-gray-300',
        ].join(' ')}
      >
        <span className="text-base leading-none shrink-0">{FLAGS[currencyCode] || '💱'}</span>
        {!compact && (
          <>
            <span className="hidden text-sm font-medium sm:block">{currencyCode}</span>
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
          aria-label="Select currency"
          className={[
            'absolute z-[100] bg-white dark:bg-brand-charcoal-dark rounded-2xl shadow-dropdown',
            'border border-gray-100 dark:border-white/10 animate-scale-in overflow-hidden',
            'right-0 mt-2 w-64',
          ].join(' ')}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 dark:border-white/10">
            <p className="text-sm font-bold text-brand-charcoal-dark dark:text-white">Select Currency</p>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="flex items-center justify-center text-gray-400 transition-colors rounded-full w-7 h-7 hover:bg-gray-100 dark:hover:bg-white/10"
              aria-label="Close"
            >
              <X size={14} />
            </button>
          </div>

          {/* Options */}
          <div className="p-2 overflow-y-auto max-h-72">
            {GROUPS.map((group) => (
              <div key={group.label} className="mb-2">
                <p className="px-4 pt-2 pb-1 text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                  {group.label}
                </p>
                <div className="space-y-0.5">
                  {group.codes.map(renderOption)}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
