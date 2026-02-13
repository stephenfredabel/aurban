import { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check, Search } from 'lucide-react';
import { COUNTRIES } from '../../config/countries.js';
import { useLocale }  from '../../context/LocaleContext.jsx';

/**
 * Country-code picker + phone number input
 * Validates format via basic pattern per country
 */
export default function PhoneInput({
  value       = '',
  onChange,
  error,
  label       = 'Phone Number',
  required    = false,
  optional    = false,
  id,
}) {
  const { countryCode: defaultCode } = useLocale();
  const [selectedCode, setSelectedCode] = useState(defaultCode || 'NG');
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [search,       setSearch]       = useState('');
  const containerRef   = useRef(null);
  const searchRef      = useRef(null);
  const inputId        = id || `phone-${Math.random().toString(36).slice(2, 7)}`;

  const selectedCountry = COUNTRIES.find((c) => c.code === selectedCode) || COUNTRIES[0];

  useEffect(() => {
    const handler = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setDropdownOpen(false);
        setSearch('');
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  useEffect(() => {
    if (dropdownOpen) setTimeout(() => searchRef.current?.focus(), 50);
  }, [dropdownOpen]);

  const filtered = search
    ? COUNTRIES.filter((c) =>
        c.name.toLowerCase().includes(search.toLowerCase()) ||
        c.phone.includes(search) ||
        c.code.toLowerCase().includes(search.toLowerCase())
      )
    : COUNTRIES;

  const handleCountrySelect = (country) => {
    setSelectedCode(country.code);
    setDropdownOpen(false);
    setSearch('');
    onChange?.({ phone: value, prefix: country.phone, countryCode: country.code });
  };

  const handlePhoneChange = (e) => {
    const raw = e.target.value.replace(/[^\d\s\-()]/g, '').slice(0, 20);
    onChange?.({ phone: raw, prefix: selectedCountry.phone, countryCode: selectedCode });
  };

  return (
    <div className="w-full" ref={containerRef}>
      {label && (
        <div className="flex items-center gap-2 mb-1.5">
          <label htmlFor={inputId} className="label-sm">{label}</label>
          {required && <span className="text-[10px] font-medium text-red-400 bg-red-50 px-1.5 py-0.5 rounded">Required</span>}
          {optional && <span className="text-[10px] font-medium text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded">Optional</span>}
        </div>
      )}

      <div className="flex gap-2">
        {/* Country code picker */}
        <div className="relative shrink-0">
          <button
            type="button"
            onClick={() => setDropdownOpen((v) => !v)}
            className={[
              'flex items-center gap-1.5 h-full px-3 py-3 rounded-xl border text-sm font-body transition-all',
              'bg-white outline-none',
              dropdownOpen
                ? 'border-brand-gold ring-2 ring-brand-gold/20'
                : 'border-gray-200 hover:border-gray-300',
            ].join(' ')}
            aria-label="Select country code"
            aria-expanded={dropdownOpen}
            aria-haspopup="listbox"
          >
            <span className="text-base leading-none">{selectedCountry.flag}</span>
            <span className="text-xs font-semibold text-brand-charcoal">{selectedCountry.phone}</span>
            <ChevronDown size={12} className={`text-gray-400 transition-transform ${dropdownOpen ? 'rotate-180' : ''}`} />
          </button>

          {dropdownOpen && (
            <div
              role="listbox"
              className="absolute top-full left-0 mt-1.5 w-64 bg-white rounded-2xl shadow-dropdown border border-gray-100 z-50 overflow-hidden animate-scale-in"
            >
              <div className="p-2 border-b border-gray-100">
                <div className="relative">
                  <Search size={13} className="absolute text-gray-400 -translate-y-1/2 left-3 top-1/2" />
                  <input
                    ref={searchRef}
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search country..."
                    className="w-full pl-8 pr-3 py-1.5 text-xs bg-brand-gray-soft rounded-lg outline-none border border-transparent focus:border-brand-gold placeholder:text-gray-400"
                  />
                </div>
              </div>
              <div className="py-1 overflow-y-auto max-h-52">
                {filtered.map((country) => (
                  <button
                    key={country.code}
                    type="button"
                    role="option"
                    aria-selected={country.code === selectedCode}
                    onClick={() => handleCountrySelect(country)}
                    className="flex items-center w-full gap-3 px-3 py-2 text-left transition-colors hover:bg-brand-gray-soft"
                  >
                    <span className="text-base shrink-0">{country.flag}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium truncate text-brand-charcoal-dark">{country.name}</p>
                    </div>
                    <span className="text-xs text-gray-400 shrink-0">{country.phone}</span>
                    {country.code === selectedCode && (
                      <Check size={12} className="text-brand-gold shrink-0" />
                    )}
                  </button>
                ))}
                {filtered.length === 0 && (
                  <p className="px-4 py-4 text-xs text-center text-gray-400">No results</p>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Number input */}
        <input
          id={inputId}
          type="tel"
          value={value}
          onChange={handlePhoneChange}
          placeholder="8xx xxx xxxx"
          maxLength={20}
          autoComplete="tel-national"
          aria-invalid={!!error}
          className={[
            'flex-1 input-field',
            error ? 'border-red-300 focus:border-red-400 focus:ring-red-100' : '',
          ].join(' ')}
        />
      </div>

      {error && (
        <p role="alert" className="mt-1.5 flex items-center gap-1.5 text-xs text-red-500">
          <span className="shrink-0">⚠</span>
          {error}
        </p>
      )}
    </div>
  );
}
