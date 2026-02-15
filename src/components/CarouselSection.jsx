import { useRef, useState, useEffect, useCallback } from 'react';
import { ChevronLeft, ChevronRight, ArrowRight }     from 'lucide-react';
import { Link }                                       from 'react-router-dom';
import { useTranslation }                             from 'react-i18next';

/**
 * CarouselSection
 * Shows 4 cards on desktop, 2 on tablet, 1.5 on mobile.
 * Left/right arrows + "View All" button.
 *
 * Props:
 *   title       string
 *   titleKey    i18n key (overrides title)
 *   seeAllTo    route string
 *   items       array
 *   renderItem  (item, index) => ReactNode
 *   className   extra class
 */
export default function CarouselSection({
  title,
  titleKey,
  seeAllTo,
  items = [],
  renderItem,
  className = '',
}) {
  const { t }       = useTranslation();
  const scrollRef   = useRef(null);
  const [canLeft,  setCanLeft]  = useState(false);
  const [canRight, setCanRight] = useState(false);

  const label = titleKey ? t(titleKey) : title;

  const updateArrows = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    setCanLeft(el.scrollLeft > 2);
    setCanRight(el.scrollLeft + el.offsetWidth < el.scrollWidth - 2);
  }, []);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    updateArrows();
    el.addEventListener('scroll', updateArrows, { passive: true });
    const ro = new ResizeObserver(updateArrows);
    ro.observe(el);
    return () => {
      el.removeEventListener('scroll', updateArrows);
      ro.disconnect();
    };
  }, [items, updateArrows]);

  const scroll = (dir) => {
    const el = scrollRef.current;
    if (!el) return;
    // Scroll by one card width (25% of container on desktop)
    const cardW = el.firstElementChild?.offsetWidth || 280;
    el.scrollBy({ left: dir === 'right' ? cardW + 16 : -(cardW + 16), behavior: 'smooth' });
  };

  if (!items.length) return null;

  return (
    <section className={`${className}`} aria-label={label}>
      {/* ── Header row ────────────────────────────────── */}
      <div className="flex items-center justify-between px-4 mb-4 lg:px-0">
        <h2 className="section-title">{label}</h2>
        {seeAllTo && (
          <Link
            to={seeAllTo}
            className="flex items-center gap-1 text-sm font-semibold transition-colors text-brand-gold hover:text-brand-gold-dark group"
            aria-label={`View all ${label}`}
          >
            {t('common.seeAll', { defaultValue: 'View all' })}
            <ArrowRight size={14} className="group-hover:translate-x-0.5 transition-transform" />
          </Link>
        )}
      </div>

      {/* ── Carousel wrapper ──────────────────────────── */}
      <div className="relative group">
        {/* Left arrow */}
        <button
          type="button"
          onClick={() => scroll('left')}
          disabled={!canLeft}
          aria-label="Scroll left"
          className={[
            'absolute left-0 top-1/2 -translate-y-1/2 -translate-x-3 z-10',
            'w-10 h-10 rounded-full bg-white dark:bg-brand-charcoal-dark',
            'shadow-md border border-gray-100 dark:border-white/10',
            'flex items-center justify-center',
            'transition-all duration-200',
            canLeft
              ? 'opacity-0 group-hover:opacity-100 hover:shadow-lg cursor-pointer text-brand-charcoal dark:text-white'
              : 'opacity-0 pointer-events-none',
          ].join(' ')}
        >
          <ChevronLeft size={18} />
        </button>

        {/* Scrollable track */}
        <div
          ref={scrollRef}
          className="flex gap-4 px-4 pb-1 overflow-x-auto scroll-x lg:px-0"
          style={{ scrollSnapType: 'x mandatory' }}
        >
          {items.map((item, i) => (
            <div
              key={item.id ?? i}
              className={[
                'flex-none',
                'w-[75vw] sm:w-[calc(50%-8px)] lg:w-[calc(25%-12px)]',
                'scroll-snap-align-start',
              ].join(' ')}
              style={{ scrollSnapAlign: 'start' }}
            >
              {renderItem(item, i)}
            </div>
          ))}
        </div>

        {/* Right arrow */}
        <button
          type="button"
          onClick={() => scroll('right')}
          disabled={!canRight}
          aria-label="Scroll right"
          className={[
            'absolute right-0 top-1/2 -translate-y-1/2 translate-x-3 z-10',
            'w-10 h-10 rounded-full bg-white dark:bg-brand-charcoal-dark',
            'shadow-md border border-gray-100 dark:border-white/10',
            'flex items-center justify-center',
            'transition-all duration-200',
            canRight
              ? 'opacity-0 group-hover:opacity-100 hover:shadow-lg cursor-pointer text-brand-charcoal dark:text-white'
              : 'opacity-0 pointer-events-none',
          ].join(' ')}
        >
          <ChevronRight size={18} />
        </button>
      </div>

      {/* ── Dot indicators (mobile) ───────────────────── */}
      <div className="flex justify-center gap-1.5 mt-4 md:hidden" aria-hidden>
        {Array.from({ length: Math.min(items.length, 6) }).map((_, i) => (
          <span key={i} className="w-1.5 h-1.5 rounded-full bg-gray-200" />
        ))}
      </div>
    </section>
  );
}