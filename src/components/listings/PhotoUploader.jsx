import { useState, useRef, useCallback } from 'react';
import { Upload, X, Star, AlertCircle, CheckCircle2, GripVertical, Eye } from 'lucide-react';

/**
 * PhotoUploader
 * Props:
 *   photos        — array of { id, url, file, caption }
 *   onChange      — (photos) => void
 *   minPhotos     — number (default 4)
 *   maxPhotos     — number (default 20)
 *   requiredViews — string[] (e.g. ['Living Room', 'Kitchen'])
 *   disabled      — boolean
 */
export default function PhotoUploader({
  photos       = [],
  onChange,
  minPhotos    = 4,
  maxPhotos    = 20,
  requiredViews= [],
  disabled     = false,
}) {
  const inputRef   = useRef(null);
  const [dragOver, setDragOver] = useState(false);
  const [preview,  setPreview]  = useState(null); // { url, index }

  const canAdd = photos.length < maxPhotos && !disabled;

  // ── Process files ───────────────────────────────────────────
  const processFiles = useCallback(async (files) => {
    const remaining = maxPhotos - photos.length;
    const toProcess = Array.from(files).slice(0, remaining);

    const newPhotos = await Promise.all(
      toProcess.map(async (file) => {
        // Only images
        if (!file.type.startsWith('image/')) return null;
        // Max 8MB
        if (file.size > 8 * 1024 * 1024) return null;

        return new Promise((resolve) => {
          const reader = new FileReader();
          reader.onload = (e) => resolve({
            id:      `photo_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
            url:     e.target.result,
            file,
            caption: '',
          });
          reader.readAsDataURL(file);
        });
      })
    );

    const valid = newPhotos.filter(Boolean);
    if (valid.length) onChange([...photos, ...valid]);
  }, [photos, maxPhotos, onChange]);

  // ── Drag handlers ───────────────────────────────────────────
  const handleDrop = useCallback((e) => {
    e.preventDefault();
    setDragOver(false);
    if (!canAdd) return;
    processFiles(e.dataTransfer.files);
  }, [canAdd, processFiles]);

  const handleDragOver = (e) => { e.preventDefault(); setDragOver(true); };
  const handleDragLeave = () => setDragOver(false);

  // ── Remove photo ─────────────────────────────────────────────
  const removePhoto = (id) => onChange(photos.filter(p => p.id !== id));

  // ── Set cover (first photo = hero) ───────────────────────────
  const setCover = (id) => {
    const idx = photos.findIndex(p => p.id === id);
    if (idx <= 0) return;
    const reordered = [photos[idx], ...photos.filter((_, i) => i !== idx)];
    onChange(reordered);
  };

  const meetsMin  = photos.length >= minPhotos;
  const isFull    = photos.length >= maxPhotos;

  return (
    <div className="space-y-4">

      {/* ── Progress bar ──────────────────────────────────── */}
      <div className="flex items-center justify-between mb-1">
        <div>
          <p className="text-sm font-bold text-brand-charcoal-dark dark:text-white">
            Property Photos
          </p>
          <p className="text-xs text-gray-500 mt-0.5">
            Minimum {minPhotos} · Maximum {maxPhotos}
            {!meetsMin && (
              <span className="ml-1 font-semibold text-amber-500">
                ({minPhotos - photos.length} more required)
              </span>
            )}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {meetsMin
            ? <CheckCircle2 size={18} className="text-emerald-500" />
            : <AlertCircle  size={18} className="text-amber-500"  />
          }
          <span className={`text-sm font-bold ${meetsMin ? 'text-emerald-600' : 'text-amber-600'}`}>
            {photos.length}/{maxPhotos}
          </span>
        </div>
      </div>

      {/* ── Required views checklist ──────────────────────── */}
      {requiredViews.length > 0 && (
        <div className="p-3 bg-brand-gray-soft dark:bg-white/5 rounded-xl">
          <p className="mb-2 text-xs font-bold text-brand-charcoal-dark dark:text-white">
            Required views to include:
          </p>
          <div className="flex flex-wrap gap-2">
            {requiredViews.map(view => (
              <span key={view}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-white dark:bg-white/10 text-brand-charcoal dark:text-white/80 border border-gray-200 dark:border-white/10">
                📷 {view}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* ── Drop zone ──────────────────────────────────────── */}
      {canAdd && (
        <div
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onClick={() => inputRef.current?.click()}
          role="button"
          tabIndex={0}
          onKeyDown={e => e.key === 'Enter' && inputRef.current?.click()}
          aria-label={`Upload photos — ${photos.length} of ${maxPhotos} added`}
          className={[
            'border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all',
            dragOver
              ? 'border-brand-gold bg-brand-gold/5'
              : 'border-gray-200 dark:border-white/20 hover:border-brand-gold hover:bg-brand-gray-soft dark:hover:bg-white/5',
          ].join(' ')}
        >
          <Upload size={28} className={`mx-auto mb-3 ${dragOver ? 'text-brand-gold' : 'text-gray-300 dark:text-white/30'}`} />
          <p className="text-sm font-semibold text-brand-charcoal-dark dark:text-white">
            {dragOver ? 'Drop photos here' : 'Click or drag photos here'}
          </p>
          <p className="mt-1 text-xs text-gray-400">
            JPG, PNG, WEBP · Max 8MB per photo · {photos.length}/{maxPhotos} added
          </p>
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={e => processFiles(e.target.files)}
            aria-hidden="true"
          />
        </div>
      )}

      {/* ── Photo grid ─────────────────────────────────────── */}
      {photos.length > 0 && (
        <div>
          {/* Cover indicator */}
          <p className="text-xs text-gray-500 dark:text-white/50 mb-2 flex items-center gap-1.5">
            <Star size={12} className="text-brand-gold" fill="currentColor" />
            First photo is the cover image. Tap ⭐ to set a new cover.
          </p>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {photos.map((photo, index) => (
              <div key={photo.id}
                className="relative overflow-hidden bg-gray-100 group aspect-square rounded-xl dark:bg-white/10">

                {/* Image */}
                <img
                  src={photo.url}
                  alt={`Property photo ${index + 1}`}
                  className="object-cover w-full h-full"
                  loading="lazy"
                />

                {/* Overlay on hover */}
                <div className="absolute inset-0 flex items-start justify-between p-2 transition-opacity opacity-0 bg-black/40 group-hover:opacity-100">
                  {/* View */}
                  <button
                    type="button"
                    onClick={() => setPreview({ url: photo.url, index })}
                    aria-label="Preview photo"
                    className="flex items-center justify-center text-white transition-colors rounded-lg w-7 h-7 bg-white/20 hover:bg-white/40">
                    <Eye size={13} />
                  </button>

                  {/* Actions */}
                  <div className="flex gap-1.5">
                    {/* Set cover */}
                    {index !== 0 && (
                      <button
                        type="button"
                        onClick={() => setCover(photo.id)}
                        aria-label="Set as cover photo"
                        className="flex items-center justify-center text-white transition-colors rounded-lg w-7 h-7 bg-white/20 hover:bg-brand-gold">
                        <Star size={13} />
                      </button>
                    )}
                    {/* Remove */}
                    <button
                      type="button"
                      onClick={() => removePhoto(photo.id)}
                      aria-label="Remove photo"
                      className="flex items-center justify-center text-white transition-colors rounded-lg w-7 h-7 bg-white/20 hover:bg-red-500">
                      <X size={13} />
                    </button>
                  </div>
                </div>

                {/* Cover badge */}
                {index === 0 && (
                  <div className="absolute bottom-2 left-2 flex items-center gap-1 px-2 py-0.5 bg-brand-gold rounded-full text-white text-[10px] font-bold">
                    <Star size={9} fill="currentColor" />
                    Cover
                  </div>
                )}

                {/* Number badge */}
                <div className="absolute top-2 left-2 w-5 h-5 bg-black/50 rounded-full flex items-center justify-center text-white text-[10px] font-bold">
                  {index + 1}
                </div>
              </div>
            ))}

            {/* Add more slot */}
            {canAdd && (
              <button
                type="button"
                onClick={() => inputRef.current?.click()}
                className="flex flex-col items-center justify-center gap-2 text-gray-400 transition-all border-2 border-gray-200 border-dashed aspect-square rounded-xl dark:border-white/20 hover:border-brand-gold hover:bg-brand-gray-soft dark:hover:bg-white/5"
                aria-label="Add more photos"
              >
                <Upload size={20} />
                <span className="text-xs font-semibold">Add more</span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* Full photo count warning */}
      {isFull && (
        <p className="text-xs font-semibold text-center text-amber-600">
          Maximum {maxPhotos} photos reached.
        </p>
      )}

      {/* ── Lightbox preview ───────────────────────────────── */}
      {preview && (
        <div
          className="fixed inset-0 z-[100] bg-black/90 flex items-center justify-center p-4 animate-fade-in"
          onClick={() => setPreview(null)}
          role="dialog"
          aria-label="Photo preview"
          aria-modal="true"
        >
          <button
            type="button"
            className="absolute flex items-center justify-center w-10 h-10 text-white transition-colors rounded-full top-4 right-4 bg-white/20 hover:bg-white/40"
            onClick={() => setPreview(null)}
            aria-label="Close preview"
          >
            <X size={20} />
          </button>
          <img
            src={preview.url}
            alt={`Photo ${preview.index + 1}`}
            className="max-w-full max-h-[90vh] rounded-2xl object-contain"
            onClick={e => e.stopPropagation()}
          />
          <p className="absolute text-sm -translate-x-1/2 bottom-6 left-1/2 text-white/60">
            Photo {preview.index + 1} of {photos.length}
          </p>
        </div>
      )}
    </div>
  );
}