import { useState, useCallback, useEffect } from 'react';
import { X, ChevronLeft, ChevronRight, Play, Grid3X3, Maximize2 } from 'lucide-react';

/* ════════════════════════════════════════════════════════════
   IMAGE GALLERY — Grid layout + fullscreen viewer

   Features:
   • Adaptive grid: 1 image = full, 2 = side-by-side,
     3 = 1 large + 2 small, 4+ = 1 large + 3 small + "+N"
   • Placeholder grid when no images
   • Fullscreen viewer with left/right navigation
   • YouTube video support (plays in fullscreen viewer)
   • Keyboard navigation (← → Esc)
════════════════════════════════════════════════════════════ */

const YOUTUBE_RE = /(?:youtube\.com\/watch\?v=|youtu\.be\/)([\w-]{11})/;

function extractYoutubeId(url) {
  const match = url?.match(YOUTUBE_RE);
  return match ? match[1] : null;
}

export default function ImageGallery({ images = [], videoUrl, title = '' }) {
  const [fullscreen, setFullscreen] = useState(false);
  const [activeIdx, setActiveIdx]   = useState(0);

  const youtubeId = extractYoutubeId(videoUrl);

  // Build media array: images + optional video
  const media = [
    ...images.map((src, i) => ({ type: 'image', src, idx: i })),
    ...(youtubeId ? [{ type: 'video', youtubeId, idx: images.length }] : []),
  ];

  const openFullscreen = useCallback((idx) => {
    setActiveIdx(idx);
    setFullscreen(true);
  }, []);

  const closeFullscreen = useCallback(() => setFullscreen(false), []);

  const goPrev = useCallback(() => {
    setActiveIdx(i => (i - 1 + media.length) % media.length);
  }, [media.length]);

  const goNext = useCallback(() => {
    setActiveIdx(i => (i + 1) % media.length);
  }, [media.length]);

  // Keyboard navigation
  useEffect(() => {
    if (!fullscreen) return;
    const handler = (e) => {
      if (e.key === 'Escape') closeFullscreen();
      if (e.key === 'ArrowLeft') goPrev();
      if (e.key === 'ArrowRight') goNext();
    };
    window.addEventListener('keydown', handler);
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', handler);
      document.body.style.overflow = '';
    };
  }, [fullscreen, closeFullscreen, goPrev, goNext]);

  const totalMedia = media.length;
  const hasMedia   = totalMedia > 0;

  /* ── Placeholder Grid (no images) ──────────────────────── */
  if (!hasMedia) {
    return (
      <div className="relative mx-auto max-w-6xl lg:mx-4">
        <div className="grid grid-cols-4 grid-rows-2 gap-1 overflow-hidden lg:rounded-2xl h-[240px] sm:h-[320px] lg:h-[400px]">
          <div className="flex items-center justify-center col-span-2 row-span-2 bg-gradient-to-br from-brand-gold/20 to-brand-gold/5">
            <span className="text-7xl font-black font-display text-brand-gold/25">A</span>
          </div>
          <div className="col-span-1 row-span-1 bg-gradient-to-br from-gray-100 to-gray-50 dark:from-gray-800 dark:to-gray-900" />
          <div className="col-span-1 row-span-1 bg-gradient-to-br from-gray-100 to-gray-50 dark:from-gray-800 dark:to-gray-900" />
          <div className="col-span-1 row-span-1 bg-gradient-to-br from-gray-100 to-gray-50 dark:from-gray-800 dark:to-gray-900" />
          <div className="col-span-1 row-span-1 bg-gradient-to-br from-gray-100 to-gray-50 dark:from-gray-800 dark:to-gray-900" />
        </div>
      </div>
    );
  }

  /* ── Image/Video Thumbnail ─────────────────────────────── */
  const Thumb = ({ item, className, showOverlay }) => (
    <button
      type="button"
      onClick={() => openFullscreen(item.idx)}
      className={`relative overflow-hidden cursor-pointer group ${className}`}
    >
      {item.type === 'image' ? (
        <img src={item.src} alt={`${title} ${item.idx + 1}`} className="object-cover w-full h-full transition-transform duration-300 group-hover:scale-105" loading="lazy" />
      ) : (
        <div className="flex items-center justify-center w-full h-full bg-gray-900">
          <img
            src={`https://img.youtube.com/vi/${item.youtubeId}/hqdefault.jpg`}
            alt="Video thumbnail"
            className="absolute inset-0 object-cover w-full h-full opacity-70"
            loading="lazy"
          />
          <div className="relative z-10 flex items-center justify-center rounded-full w-14 h-14 bg-white/90 shadow-lg">
            <Play size={24} className="ml-1 text-brand-charcoal-dark" fill="currentColor" />
          </div>
        </div>
      )}
      {showOverlay && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/50">
          <span className="text-lg font-bold text-white">+{totalMedia - 4}</span>
        </div>
      )}
    </button>
  );

  /* ── Grid Layouts ──────────────────────────────────────── */
  return (
    <>
      <div className="relative mx-auto max-w-6xl lg:mx-4">
        {/* 1 image */}
        {totalMedia === 1 && (
          <div className="overflow-hidden lg:rounded-2xl h-[240px] sm:h-[320px] lg:h-[400px]">
            <Thumb item={media[0]} className="w-full h-full" />
          </div>
        )}

        {/* 2 media */}
        {totalMedia === 2 && (
          <div className="grid grid-cols-2 gap-1 overflow-hidden lg:rounded-2xl h-[240px] sm:h-[320px] lg:h-[400px]">
            <Thumb item={media[0]} className="w-full h-full" />
            <Thumb item={media[1]} className="w-full h-full" />
          </div>
        )}

        {/* 3 media */}
        {totalMedia === 3 && (
          <div className="grid grid-cols-2 grid-rows-2 gap-1 overflow-hidden lg:rounded-2xl h-[240px] sm:h-[320px] lg:h-[400px]">
            <Thumb item={media[0]} className="row-span-2 w-full h-full" />
            <Thumb item={media[1]} className="w-full h-full" />
            <Thumb item={media[2]} className="w-full h-full" />
          </div>
        )}

        {/* 4+ media */}
        {totalMedia >= 4 && (
          <div className="grid grid-cols-4 grid-rows-2 gap-1 overflow-hidden lg:rounded-2xl h-[240px] sm:h-[320px] lg:h-[400px]">
            <Thumb item={media[0]} className="col-span-2 row-span-2 w-full h-full" />
            <Thumb item={media[1]} className="w-full h-full" />
            <Thumb item={media[2]} className="w-full h-full" />
            <Thumb item={media[3]} className="w-full h-full" showOverlay={totalMedia > 5} />
            {totalMedia > 4 ? (
              <button
                type="button"
                onClick={() => openFullscreen(4)}
                className="flex items-center justify-center bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
              >
                <div className="text-center">
                  <Grid3X3 size={18} className="mx-auto mb-1 text-gray-400" />
                  <span className="text-xs font-bold text-gray-500 dark:text-gray-400">+{totalMedia - 4}</span>
                </div>
              </button>
            ) : (
              <div className="bg-gray-100 dark:bg-gray-800" />
            )}
          </div>
        )}

        {/* "Show all photos" button overlay */}
        {totalMedia > 1 && (
          <button
            type="button"
            onClick={() => openFullscreen(0)}
            className="absolute flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold transition-colors bg-white/90 backdrop-blur-sm rounded-lg shadow-sm bottom-3 right-3 lg:right-7 text-brand-charcoal-dark hover:bg-white"
          >
            <Maximize2 size={12} /> Show all photos
          </button>
        )}
      </div>

      {/* ── Fullscreen Viewer ────────────────────────────────── */}
      {fullscreen && (
        <div className="fixed inset-0 z-[200] bg-black flex flex-col" role="dialog" aria-label="Image viewer">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 shrink-0">
            <span className="text-sm font-medium text-white/70">
              {activeIdx + 1} / {totalMedia}
            </span>
            <button
              type="button"
              onClick={closeFullscreen}
              className="flex items-center justify-center w-10 h-10 text-white transition-colors rounded-full hover:bg-white/10"
              aria-label="Close"
            >
              <X size={22} />
            </button>
          </div>

          {/* Main content */}
          <div className="relative flex items-center justify-center flex-1 min-h-0 px-4">
            {media[activeIdx]?.type === 'image' ? (
              <img
                src={media[activeIdx].src}
                alt={`${title} ${activeIdx + 1}`}
                className="object-contain max-w-full max-h-full select-none"
                draggable={false}
              />
            ) : media[activeIdx]?.type === 'video' ? (
              <div className="w-full max-w-4xl mx-auto aspect-video">
                <iframe
                  src={`https://www.youtube-nocookie.com/embed/${media[activeIdx].youtubeId}?autoplay=1`}
                  title="Video tour"
                  className="w-full h-full rounded-xl"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  sandbox="allow-scripts allow-same-origin allow-presentation"
                />
              </div>
            ) : null}

            {/* Nav arrows */}
            {totalMedia > 1 && (
              <>
                <button
                  type="button"
                  onClick={goPrev}
                  className="absolute flex items-center justify-center transition-colors rounded-full left-2 top-1/2 -translate-y-1/2 w-11 h-11 bg-white/10 backdrop-blur-sm text-white hover:bg-white/20"
                  aria-label="Previous"
                >
                  <ChevronLeft size={22} />
                </button>
                <button
                  type="button"
                  onClick={goNext}
                  className="absolute flex items-center justify-center transition-colors rounded-full right-2 top-1/2 -translate-y-1/2 w-11 h-11 bg-white/10 backdrop-blur-sm text-white hover:bg-white/20"
                  aria-label="Next"
                >
                  <ChevronRight size={22} />
                </button>
              </>
            )}
          </div>

          {/* Thumbnail strip */}
          {totalMedia > 1 && (
            <div className="flex items-center justify-center gap-2 px-4 py-3 overflow-x-auto shrink-0 scroll-x" style={{ scrollbarWidth: 'none' }}>
              {media.map((item, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setActiveIdx(i)}
                  className={`w-14 h-14 rounded-lg overflow-hidden shrink-0 border-2 transition-all ${
                    i === activeIdx ? 'border-white scale-110' : 'border-transparent opacity-50 hover:opacity-80'
                  }`}
                >
                  {item.type === 'image' ? (
                    <img src={item.src} alt="" className="object-cover w-full h-full" loading="lazy" />
                  ) : (
                    <div className="flex items-center justify-center w-full h-full bg-gray-700">
                      <Play size={14} className="text-white" fill="currentColor" />
                    </div>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </>
  );
}
