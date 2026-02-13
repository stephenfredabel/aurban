import { useState, useEffect } from 'react';
import { X, SlidersHorizontal } from 'lucide-react';
import { useProperty } from '../context/PropertyContext';

const propertyTypes = ['Apartment', 'Duplex', 'Terrace', 'Mini Flat', 'Commercial', 'Land'];
const bedroomOptions = ['1', '2', '3', '4', '5+'];

export default function FilterDrawer({ isOpen, onClose }) {
  const { filters, updateFilters, resetFilters } = useProperty();
  const [local, setLocal] = useState(filters);

  useEffect(() => { setLocal(filters); }, [filters]);

  const apply = () => { updateFilters(local); onClose(); };
  const reset = () => {
    resetFilters();
    setLocal({ category: '', minPrice: '', maxPrice: '', location: '', bedrooms: '', type: '' });
  };
  const set = (key, val) => setLocal((p) => ({ ...p, [key]: val }));

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 bg-black/40 z-50" onClick={onClose} aria-hidden />
      <div role="dialog" aria-label="Filter properties" aria-modal="true" className="fixed bottom-0 left-0 right-0 z-50 bg-white rounded-t-3xl shadow-2xl max-h-[85vh] flex flex-col">
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 rounded-full bg-gray-200" />
        </div>

        <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <SlidersHorizontal size={18} className="text-brand-charcoal" />
            <h2 className="font-display font-semibold text-brand-charcoal-dark">Filters</h2>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-gray-100 transition-colors" aria-label="Close">
            <X size={18} />
          </button>
        </div>

        <div className="overflow-y-auto flex-1 px-5 py-4 space-y-6">
          <div>
            <label className="block text-sm font-semibold text-brand-charcoal-dark mb-2">Price Range (₦)</label>
            <div className="flex items-center gap-3">
              <input type="number" placeholder="Min" value={local.minPrice} onChange={(e) => set('minPrice', e.target.value)} min="0" className="input-field" aria-label="Minimum price" />
              <span className="text-gray-400 shrink-0">–</span>
              <input type="number" placeholder="Max" value={local.maxPrice} onChange={(e) => set('maxPrice', e.target.value)} min="0" className="input-field" aria-label="Maximum price" />
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-brand-charcoal-dark mb-2">Property Type</label>
            <div className="flex flex-wrap gap-2">
              {propertyTypes.map((t) => (
                <button key={t} onClick={() => set('type', local.type === t ? '' : t)}
                  className={`px-3.5 py-2 rounded-xl text-sm font-medium border transition-all active:scale-95 ${local.type === t ? 'border-brand-charcoal bg-brand-charcoal text-white' : 'border-gray-200 text-brand-charcoal hover:border-brand-charcoal'}`}
                  aria-pressed={local.type === t}>
                  {t}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-brand-charcoal-dark mb-2">Minimum Bedrooms</label>
            <div className="flex gap-2">
              {bedroomOptions.map((b) => (
                <button key={b} onClick={() => set('bedrooms', local.bedrooms === b ? '' : b)}
                  className={`w-12 h-12 rounded-xl text-sm font-semibold border transition-all active:scale-95 ${local.bedrooms === b ? 'border-brand-gold bg-brand-gold text-brand-charcoal-dark' : 'border-gray-200 text-brand-charcoal hover:border-brand-gold'}`}
                  aria-pressed={local.bedrooms === b}>
                  {b}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label htmlFor="filter-location" className="block text-sm font-semibold text-brand-charcoal-dark mb-2">Location</label>
            <input id="filter-location" type="text" placeholder="e.g. Lekki, Abuja" value={local.location} onChange={(e) => set('location', e.target.value.slice(0, 100))} className="input-field" />
          </div>
        </div>

        <div className="px-5 py-4 border-t border-gray-100 flex gap-3 pb-safe">
          <button onClick={reset} className="btn-outline flex-1">Reset</button>
          <button onClick={apply} className="btn-primary flex-1">Show Results</button>
        </div>
      </div>
    </>
  );
}