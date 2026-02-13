import { useProperty } from '../context/PropertyContext';

const propertyTypes = ['Apartment', 'Duplex', 'Terrace', 'Mini Flat', 'Commercial', 'Land'];
const bedroomOptions = ['1', '2', '3', '4', '5+'];

export default function PropertyFilters() {
  const { filters, updateFilters, resetFilters } = useProperty();
  return (
    <aside className="hidden lg:block w-60 shrink-0">
      <div className="bg-white rounded-2xl shadow-card p-5 sticky top-[120px] space-y-5">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold text-brand-charcoal-dark text-sm">Filters</h2>
          <button onClick={resetFilters} className="text-xs text-brand-gold font-medium hover:underline">Reset</button>
        </div>
        <div>
          <label className="block text-xs font-semibold text-brand-charcoal-dark mb-2 uppercase tracking-wider">Price Range (₦)</label>
          <div className="space-y-2">
            <input type="number" placeholder="Min price" value={filters.minPrice} onChange={(e) => updateFilters({ minPrice: e.target.value })} className="input-field text-xs" aria-label="Minimum price" />
            <input type="number" placeholder="Max price" value={filters.maxPrice} onChange={(e) => updateFilters({ maxPrice: e.target.value })} className="input-field text-xs" aria-label="Maximum price" />
          </div>
        </div>
        <div>
          <label className="block text-xs font-semibold text-brand-charcoal-dark mb-2 uppercase tracking-wider">Property Type</label>
          <div className="flex flex-wrap gap-1.5">
            {propertyTypes.map((t) => (
              <button key={t} onClick={() => updateFilters({ type: filters.type === t ? '' : t })}
                className={`px-2.5 py-1.5 rounded-lg text-xs font-medium border transition-all ${filters.type === t ? 'border-brand-charcoal bg-brand-charcoal text-white' : 'border-gray-200 text-brand-charcoal hover:border-brand-charcoal'}`}
                aria-pressed={filters.type === t}>
                {t}
              </button>
            ))}
          </div>
        </div>
        <div>
          <label className="block text-xs font-semibold text-brand-charcoal-dark mb-2 uppercase tracking-wider">Bedrooms (min)</label>
          <div className="flex gap-1.5">
            {bedroomOptions.map((b) => (
              <button key={b} onClick={() => updateFilters({ bedrooms: filters.bedrooms === b ? '' : b })}
                className={`flex-1 py-2 rounded-xl text-xs font-semibold border transition-all ${filters.bedrooms === b ? 'border-brand-gold bg-brand-gold text-brand-charcoal-dark' : 'border-gray-200 text-brand-charcoal hover:border-brand-gold'}`}
                aria-pressed={filters.bedrooms === b}>
                {b}
              </button>
            ))}
          </div>
        </div>
        <div>
          <label htmlFor="sidebar-location" className="block text-xs font-semibold text-brand-charcoal-dark mb-2 uppercase tracking-wider">Location</label>
          <input id="sidebar-location" type="text" placeholder="e.g. Lekki, Abuja" value={filters.location} onChange={(e) => updateFilters({ location: e.target.value.slice(0, 100) })} className="input-field text-xs" />
        </div>
      </div>
    </aside>
  );
}