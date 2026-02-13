import { useEffect, useState } from 'react';
import ServiceCard from '../components/ServiceCard';
import { services, serviceCategories } from '../data/homeSections';

export default function ServicesPage() {
  const [activeCategory, setActiveCategory] = useState('all');

  useEffect(() => { document.title = 'Services — Aurban'; }, []);

  const filtered = activeCategory === 'all'
    ? services
    : services.filter((s) => s.category === activeCategory);

  return (
    <div className="max-w-7xl mx-auto px-4 py-4">
      <h1 className="section-title mb-1">Real Estate Services</h1>
      <p className="text-sm text-gray-400 mb-5">Find trusted professionals for all your property needs</p>

      <div className="flex gap-2 scroll-x pb-3 mb-4">
        {serviceCategories.map((c) => (
          <button key={c.id} onClick={() => setActiveCategory(c.id)}
            className={`shrink-0 px-4 py-2 rounded-xl text-sm font-medium border transition-all
              ${activeCategory === c.id ? 'bg-brand-charcoal text-white border-brand-charcoal dark:bg-white dark:text-brand-charcoal-dark dark:border-white' : 'border-gray-200 dark:border-white/10 text-brand-charcoal dark:text-white/70 hover:border-brand-charcoal'}`}
          >
            {c.label}
          </button>
        ))}
      </div>

      {filtered.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {filtered.map((s) => <ServiceCard key={s.id} service={s} />)}
        </div>
      ) : (
        <div className="text-center py-16">
          <div className="text-4xl mb-3">🔧</div>
          <p className="font-semibold text-brand-charcoal-dark dark:text-white">No services in this category yet</p>
          <p className="text-sm text-gray-400 mt-1">Check back soon or browse all services</p>
          <button onClick={() => setActiveCategory('all')} className="btn-primary mt-4">Show All</button>
        </div>
      )}
    </div>
  );
}