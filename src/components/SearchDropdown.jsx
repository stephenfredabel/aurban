import { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate }     from 'react-router-dom';
import { Search, X, TrendingUp } from 'lucide-react';
import { useTranslation }  from 'react-i18next';
import { properties }      from '../data/properties.js';
import { useProperty }     from '../context/PropertyContext.jsx';

const POPULAR = ['Lekki', 'Victoria Island', 'Abuja', 'Port Harcourt', 'Nairobi'];

export default function SearchDropdown() {
  const { t }                    = useTranslation();
  const { searchQuery, setSearchQuery } = useProperty();
  const [query,   setQuery]      = useState(searchQuery || '');
  const [open,    setOpen]       = useState(false);
  const [results, setResults]    = useState([]);
  const navigate                 = useNavigate();
  const containerRef             = useRef(null);
  const inputRef                 = useRef(null);

  useEffect(() => {
    const handler = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const search = useCallback((q) => {
    if (!q.trim()) { setResults([]); return; }
    const lower = q.toLowerCase();
    const matched = properties
      .filter((p) =>
        p.title?.toLowerCase().includes(lower) ||
        p.location?.toLowerCase().includes(lower) ||
        p.type?.toLowerCase().includes(lower)
      )
      .slice(0, 5);
    setResults(matched);
  }, []);

  const handleChange = (e) => {
    const val = e.target.value;
    setQuery(val);
    search(val);
    setOpen(true);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!query.trim()) return;
    setSearchQuery(query);
    navigate(`/properties?search=${encodeURIComponent(query)}`);
    setOpen(false);
    inputRef.current?.blur();
  };

  const handleSuggestion = (term) => {
    setQuery(term);
    setSearchQuery(term);
    navigate(`/properties?search=${encodeURIComponent(term)}`);
    setOpen(false);
  };

  const clearQuery = () => {
    setQuery('');
    setResults([]);
    setSearchQuery('');
    inputRef.current?.focus();
  };

  return (
    <div ref={containerRef} className="relative w-full">
      <form onSubmit={handleSubmit} role="search">
        <div className="relative">
          <Search
            size={16}
            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
            aria-hidden
          />
          <input
            ref={inputRef}
            type="search"
            value={query}
            onChange={handleChange}
            onFocus={() => setOpen(true)}
            placeholder={t('search.placeholder')}
            aria-label={t('search.placeholder')}
            autoComplete="off"
            className="w-full pl-10 pr-9 py-2.5 bg-brand-gray-soft border border-transparent rounded-xl text-sm font-body text-brand-charcoal-dark placeholder:text-gray-400 outline-none focus:bg-white focus:border-brand-gold focus:ring-2 focus:ring-brand-gold/20 transition-all duration-200"
          />
          {query && (
            <button
              type="button"
              onClick={clearQuery}
              className="absolute text-gray-400 transition-colors -translate-y-1/2 right-3 top-1/2 hover:text-gray-600"
              aria-label={t('search.clear')}
            >
              <X size={14} />
            </button>
          )}
        </div>
      </form>

      {open && (
        <div className="absolute left-0 right-0 z-50 mt-2 overflow-hidden bg-white border border-gray-100 top-full rounded-2xl shadow-dropdown animate-scale-in">
          {results.length > 0 ? (
            <div className="py-1.5">
              {results.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => navigate(`/property/${p.id}`)}
                  className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-brand-gray-soft transition-colors text-left"
                >
                  <div className="w-10 h-10 overflow-hidden bg-gray-100 rounded-xl shrink-0">
                    {p.images?.[0] ? (
                      <img src={p.images[0]} alt={p.title} className="object-cover w-full h-full" />
                    ) : (
                      <div className="w-full h-full bg-brand-gold/20" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold truncate text-brand-charcoal-dark">{p.title}</p>
                    <p className="text-xs text-gray-400 truncate">{p.location}</p>
                  </div>
                </button>
              ))}
            </div>
          ) : query ? (
            <p className="px-4 py-5 text-sm text-center text-gray-400">
              {t('search.noResults', { query })}
            </p>
          ) : (
            <div className="p-4">
              <p className="label-sm mb-2 flex items-center gap-1.5">
                <TrendingUp size={12} />
                {t('search.popular')}
              </p>
              <div className="flex flex-wrap gap-2">
                {POPULAR.map((term) => (
                  <button
                    key={term}
                    type="button"
                    onClick={() => handleSuggestion(term)}
                    className="px-3 py-1.5 text-xs font-medium bg-brand-gray-soft rounded-xl hover:bg-brand-gold/10 hover:text-brand-charcoal-dark transition-colors text-brand-charcoal"
                  >
                    {term}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}