import { useState } from 'react';
import { ChevronLeft, ChevronRight, X, ZoomIn } from 'lucide-react';

export default function ImageGallery({ images = [], title = '' }) {
  const [active, setActive] = useState(0);
  const [lightbox, setLightbox] = useState(false);

  if (!images.length) return null;

  const prev = (e) => { e?.stopPropagation(); setActive((p) => (p === 0 ? images.length - 1 : p - 1)); };
  const next = (e) => { e?.stopPropagation(); setActive((p) => (p === images.length - 1 ? 0 : p + 1)); };

  return (
    <>
      <div className="relative group">
        <div className="aspect-[16/9] bg-gray-100 overflow-hidden rounded-none md:rounded-2xl">
          <img src={images[active]} alt={`${title} — image ${active + 1}`} className="w-full h-full object-cover" loading="lazy" />
        </div>
        {images.length > 1 && (
          <>
            <button onClick={prev} className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 bg-white/90 rounded-full flex items-center justify-center shadow-sm opacity-0 group-hover:opacity-100 transition-opacity" aria-label="Previous">
              <ChevronLeft size={18} />
            </button>
            <button onClick={next} className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 bg-white/90 rounded-full flex items-center justify-center shadow-sm opacity-0 group-hover:opacity-100 transition-opacity" aria-label="Next">
              <ChevronRight size={18} />
            </button>
          </>
        )}
        <button onClick={() => setLightbox(true)} className="absolute bottom-3 right-3 flex items-center gap-1.5 bg-white/90 text-brand-charcoal text-xs font-medium px-3 py-1.5 rounded-xl shadow-sm">
          <ZoomIn size={13} /> {images.length} photos
        </button>
        {images.length > 1 && (
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
            {images.map((_, i) => (
              <button key={i} onClick={() => setActive(i)} className={`h-1.5 rounded-full transition-all ${i === active ? 'w-5 bg-white' : 'w-1.5 bg-white/60'}`} aria-label={`Image ${i + 1}`} />
            ))}
          </div>
        )}
      </div>

      {lightbox && (
        <div className="fixed inset-0 bg-black/95 z-[100] flex flex-col" role="dialog" aria-modal="true">
          <div className="flex items-center justify-between px-4 py-3">
            <span className="text-white/60 text-sm">{active + 1} / {images.length}</span>
            <button onClick={() => setLightbox(false)} className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center text-white hover:bg-white/20" aria-label="Close">
              <X size={18} />
            </button>
          </div>
          <div className="flex-1 flex items-center justify-center px-4 relative">
            <img src={images[active]} alt={`${title} — image ${active + 1}`} className="max-w-full max-h-full object-contain rounded-xl" />
            {images.length > 1 && (
              <>
                <button onClick={prev} className="absolute left-2 w-10 h-10 bg-white/10 rounded-full flex items-center justify-center text-white hover:bg-white/20" aria-label="Previous"><ChevronLeft size={20} /></button>
                <button onClick={next} className="absolute right-2 w-10 h-10 bg-white/10 rounded-full flex items-center justify-center text-white hover:bg-white/20" aria-label="Next"><ChevronRight size={20} /></button>
              </>
            )}
          </div>
          <div className="flex gap-2 px-4 py-3 overflow-x-auto scroll-x">
            {images.map((img, i) => (
              <button key={i} onClick={() => setActive(i)} className={`shrink-0 w-14 h-14 rounded-xl overflow-hidden transition-all ${i === active ? 'ring-2 ring-brand-gold' : 'opacity-50 hover:opacity-80'}`} aria-pressed={i === active}>
                <img src={img} alt="" className="w-full h-full object-cover" />
              </button>
            ))}
          </div>
        </div>
      )}
    </>
  );
}