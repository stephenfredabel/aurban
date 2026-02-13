import { useState, useMemo } from 'react';
import { useTranslation }    from 'react-i18next';
import { Search }            from 'lucide-react';
import ServiceCard           from '../components/ServiceCard.jsx';
import { search, sanitize }  from '../utils/searchHelper.js';
import { services }          from '../data/services.js';

const SERVICE_CATS = [
  'All','Plumbing','Electrical','Architecture','Interior Design',
  'Construction','Cleaning','Security','Property Management',
  'Moving & Relocation','Solar',
];

export default function ServicesPage() {
  const { t }             = useTranslation();
  const [query, setQuery] = useState('');
  const [cat,   setCat]   = useState('All');

  const filtered = useMemo(() => {
    let results = services;
    if (query) results = search(results, query, {
      weights: { name: 10, category: 8, provider: 6, location: 4 },
    });
    if (cat !== 'All') results = results.filter((s) =>
      s.category?.toLowerCase() === cat.toLowerCase()
    );
    return results;
  }, [query, cat]);

  return (
    <div className="px-4 py-6 pb-24 mx-auto max-w-7xl lg:pb-8">
      {/* Header */}
      <div className="mb-6">
        <h1 className="mb-1 text-2xl font-extrabold font-display text-brand-charcoal-dark dark:text-white">
          {t('nav.services')}
        </h1>
        <p className="text-sm text-gray-400">
          Find verified real estate professionals near you
        </p>
      </div>

      {/* Search */}
      <div className="relative mb-4">
        <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(sanitize(e.target.value))}
          placeholder="Search plumbers, movers, electricians..."
          className="w-full py-3 pl-10 pr-4 text-sm transition-all border border-transparent outline-none bg-brand-gray-soft dark:bg-white/10 dark:text-white rounded-xl font-body focus:border-brand-gold focus:bg-white dark:focus:bg-white/15"
        />
      </div>

      {/* Category chips */}
      <div className="mb-5 scroll-x">
        <div className="flex gap-2 pb-1 w-max">
          {SERVICE_CATS.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setCat(c)}
              className={[
                'px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap border transition-colors',
                cat === c
                  ? 'bg-brand-charcoal-dark text-white border-brand-charcoal-dark dark:bg-white dark:text-brand-charcoal-dark dark:border-white'
                  : 'bg-white dark:bg-white/5 text-brand-charcoal dark:text-white/70 border-gray-200 dark:border-white/10 hover:border-gray-300',
              ].join(' ')}
            >
              {c}
            </button>
          ))}
        </div>
      </div>

      {/* Results */}
      <p className="mb-4 text-xs text-gray-400">{filtered.length} providers</p>
      {filtered.length > 0 ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {filtered.map((s) => (
            <ServiceCard key={s.id} service={s} />
          ))}
        </div>
      ) : (
        <div className="py-16 text-center">
          <p className="mb-3 text-2xl">🔧</p>
          <p className="mb-1 font-bold font-display text-brand-charcoal-dark dark:text-white">No providers found</p>
          <p className="text-sm text-gray-400">Try a different search or category</p>
        </div>
      )}
    </div>
  );
}