import SectionHeader from './SectionHeader';
import PropertyCard from './PropertyCard';

export default function HorizontalSection({ title, subtitle, seeAllPath, properties }) {
  if (!properties?.length) return null;
  return (
    <section>
      <SectionHeader title={title} subtitle={subtitle} seeAllPath={seeAllPath} />
      {/* Mobile: horizontal scroll */}
      <div className="md:hidden -mx-4 px-4">
        <div className="flex gap-3 scroll-x pb-1">
          {properties.map((p) => (
            <div key={p.id} className="w-64 shrink-0">
              <PropertyCard property={p} size="compact" />
            </div>
          ))}
        </div>
      </div>
      {/* Desktop: grid */}
      <div className="hidden md:grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {properties.map((p) => <PropertyCard key={p.id} property={p} />)}
      </div>
    </section>
  );
}