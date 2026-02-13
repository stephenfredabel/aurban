import { useState, useRef, useEffect, useCallback } from 'react';
import { ChevronDown, Search, Check, AlertCircle } from 'lucide-react';

/**
 * Searchable Select / Dropdown
 * options: [{ value, label, description?, icon?, disabled? }]
 * supports grouping via options: { groupLabel, items: [...] }
 */
export default function Select({
  label,
  hint,
  error,
  value,
  onChange,
  options        = [],
  placeholder    = 'Select...',
  searchable     = false,
  required       = false,
  optional       = false,
  disabled       = false,
  id,
  className      = '',
}) {
  const [open,   setOpen]   = useState(false);
  const [query,  setQuery]  = useState('');
  const selectId = id || `select-${Math.random().toString(36).slice(2, 7)}`;
  const containerRef = useRef(null);
  const searchRef    = useRef(null);

  useEffect(() => {
    const handler = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpen(false);
        setQuery('');
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  useEffect(() => {
    if (open && searchable) {
      setTimeout(() => searchRef.current?.focus(), 50);
    }
  }, [open, searchable]);

  // Normalise to flat list + groups
  const isGrouped = options.length > 0 && options[0]?.items !== undefined;

  const flatOptions = isGrouped
    ? options.flatMap((g) => g.items)
    : options;

  const filteredFlat = query
    ? flatOptions.filter((o) =>
        o.label.toLowerCase().includes(query.toLowerCase()) ||
        o.value.toLowerCase().includes(query.toLowerCase())
      )
    : flatOptions;

  const selectedOption = flatOptions.find((o) => o.value === value);

  const handleSelect = useCallback((opt) => {
    if (opt.disabled) return;
    onChange(opt.value);
    setOpen(false);
    setQuery('');
  }, [onChange]);

  const renderOptions = (opts) =>
    opts.map((opt) => (
      <button
        key={opt.value}
        type="button"
        onClick={() => handleSelect(opt)}
        disabled={opt.disabled}
        className={[
          'w-full flex items-center gap-3 px-4 py-2.5 text-left text-sm transition-colors',
          opt.disabled
            ? 'text-gray-300 cursor-not-allowed'
            : 'text-brand-charcoal hover:bg-brand-gray-soft',
          opt.value === value ? 'bg-brand-gold/8 text-brand-charcoal-dark' : '',
        ].join(' ')}
        role="option"
        aria-selected={opt.value === value}
      >
        {opt.icon && <span className="text-gray-400 shrink-0">{opt.icon}</span>}
        <div className="flex-1 min-w-0">
          <p className="font-medium truncate">{opt.label}</p>
          {opt.description && (
            <p className="text-xs text-gray-400 mt-0.5 truncate">{opt.description}</p>
          )}
        </div>
        {opt.value === value && (
          <Check size={14} className="shrink-0 text-brand-gold" />
        )}
      </button>
    ));

  return (
    <div ref={containerRef} className={`w-full relative ${className}`}>
      {label && (
        <div className="flex items-center gap-2 mb-1.5">
          <label htmlFor={selectId} className="label-sm">
            {label}
          </label>
          {required && <span className="text-[10px] font-medium text-red-400 bg-red-50 px-1.5 py-0.5 rounded">Required</span>}
          {optional && <span className="text-[10px] font-medium text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded">Optional</span>}
        </div>
      )}

      <button
        id={selectId}
        type="button"
        onClick={() => !disabled && setOpen((v) => !v)}
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={open}
        className={[
          'w-full flex items-center gap-3 px-4 py-3 text-sm font-body',
          'rounded-xl border transition-all duration-200 outline-none bg-white text-left',
          error
            ? 'border-red-300 focus:border-red-400 focus:ring-2 focus:ring-red-100'
            : open
              ? 'border-brand-gold ring-2 ring-brand-gold/20'
              : 'border-gray-200 hover:border-gray-300',
          disabled ? 'bg-gray-50 cursor-not-allowed text-gray-400' : '',
        ].join(' ')}
      >
        <span className={`flex-1 truncate ${!selectedOption ? 'text-gray-400' : 'text-brand-charcoal-dark font-medium'}`}>
          {selectedOption?.label || placeholder}
        </span>
        <ChevronDown
          size={16}
          className={`shrink-0 text-gray-400 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
        />
      </button>

      {open && (
        <div
          role="listbox"
          className="absolute top-full left-0 right-0 mt-1.5 bg-white rounded-2xl shadow-dropdown border border-gray-100 z-50 overflow-hidden animate-scale-in"
          style={{ maxHeight: '280px' }}
        >
          {searchable && (
            <div className="p-2 border-b border-gray-100">
              <div className="relative">
                <Search size={14} className="absolute text-gray-400 -translate-y-1/2 left-3 top-1/2" />
                <input
                  ref={searchRef}
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search..."
                  className="w-full py-2 pl-8 pr-3 text-sm transition-colors border border-transparent outline-none bg-brand-gray-soft rounded-xl focus:border-brand-gold placeholder:text-gray-400"
                />
              </div>
            </div>
          )}

          <div className="overflow-y-auto" style={{ maxHeight: searchable ? '220px' : '260px' }}>
            {isGrouped && !query ? (
              options.map((group) => (
                <div key={group.groupLabel}>
                  <p className="px-4 pt-2.5 pb-1 text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                    {group.groupLabel}
                  </p>
                  {renderOptions(group.items)}
                </div>
              ))
            ) : filteredFlat.length > 0 ? (
              <div className="py-1">{renderOptions(filteredFlat)}</div>
            ) : (
              <p className="px-4 py-6 text-sm text-center text-gray-400">No results</p>
            )}
          </div>
        </div>
      )}

      {hint && !error && (
        <p className="mt-1.5 text-xs text-gray-400">{hint}</p>
      )}
      {error && (
        <p role="alert" className="mt-1.5 flex items-center gap-1.5 text-xs text-red-500">
          <AlertCircle size={12} className="shrink-0" />
          {error}
        </p>
      )}
    </div>
  );
}