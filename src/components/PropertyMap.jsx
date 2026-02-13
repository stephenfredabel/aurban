import { MapPin } from 'lucide-react';

export default function PropertyMap({ location, title }) {
  const query = encodeURIComponent(`${title}, ${location}, Nigeria`);
  return (
    <div className="rounded-2xl overflow-hidden border border-gray-100 shadow-card">
      <div className="bg-brand-gray-soft px-4 py-3 border-b border-gray-100 flex items-center gap-2">
        <MapPin size={15} className="text-brand-gold" />
        <span className="text-sm font-medium text-brand-charcoal-dark">{location}</span>
      </div>
      <div className="aspect-[16/7] bg-gray-100 flex flex-col items-center justify-center gap-2">
        <div className="w-10 h-10 bg-brand-gold rounded-full flex items-center justify-center">
          <MapPin size={20} className="text-white" />
        </div>
        <p className="text-sm font-medium text-brand-charcoal-dark">{location}</p>
        <p className="text-xs text-gray-400">Connect Google Maps or Mapbox here</p>
        <a href={`https://maps.google.com/?q=${query}`} target="_blank" rel="noopener noreferrer" className="mt-1 tag bg-brand-charcoal text-white text-xs">
          View on Google Maps →
        </a>
      </div>
    </div>
  );
}