import { useState, useRef, useCallback } from 'react';
import { Upload, X, FileText, Image, CheckCircle2, AlertCircle, Eye } from 'lucide-react';
import { useImageCompress } from '../../hooks/useImageCompress.js';

/**
 * Drag-drop + mobile-friendly file uploader
 * Handles: image preview, compression, size validation, type validation
 */
export default function FileUpload({
  label,
  hint,
  error,
  accept        = ['image/jpeg', 'image/png', 'application/pdf'],
  maxMB         = 10,
  value,           // { file, preview, name, size }
  onChange,
  multiple       = false,
  compress       = true,
  required       = false,
  optional       = false,
  recommended    = false,
  showDataCost   = true,
  id,
}) {
  const [dragOver, setDragOver] = useState(false);
  const [loading,  setLoading]  = useState(false);
  const inputRef   = useRef(null);
  const fileId     = id || `file-${Math.random().toString(36).slice(2, 7)}`;
  const { compress: compressImage, getDataCostEstimate } = useImageCompress();

  const acceptString = accept.join(',');
  const maxBytes     = maxMB * 1024 * 1024;

  const processFile = useCallback(async (file) => {
    if (!file) return;

    // Type check
    if (!accept.includes(file.type)) {
      onChange?.({ error: `Invalid file type. Use: ${accept.map((a) => a.split('/')[1].toUpperCase()).join(', ')}` });
      return;
    }
    // Size check (before compression)
    if (file.size > maxBytes) {
      onChange?.({ error: `File too large - max ${maxMB}MB` });
      return;
    }

    setLoading(true);
    try {
      let processed = file;
      if (compress && file.type.startsWith('image/')) {
        processed = await compressImage(file);
      }

      const preview = file.type.startsWith('image/')
        ? await new Promise((res) => {
            const reader = new FileReader();
            reader.onload = (e) => res(e.target.result);
            reader.readAsDataURL(processed);
          })
        : null;

      onChange?.({
        file:     processed,
        preview,
        name:     file.name,
        size:     processed.size,
        type:     file.type,
        error:    null,
      });
    } finally {
      setLoading(false);
    }
  }, [accept, maxBytes, maxMB, compress, compressImage, onChange]);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) processFile(file);
  }, [processFile]);

  const handleChange = useCallback((e) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
    e.target.value = '';
  }, [processFile]);

  const isImage = value?.type?.startsWith('image/');
  const isPDF   = value?.type === 'application/pdf';

  return (
    <div className="w-full">
      {label && (
        <div className="flex items-center gap-2 mb-1.5">
          <label htmlFor={fileId} className="label-sm">{label}</label>
          {required    && <span className="text-[10px] font-medium text-red-400 bg-red-50 px-1.5 py-0.5 rounded">Required</span>}
          {optional    && <span className="text-[10px] font-medium text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded">Optional</span>}
          {recommended && <span className="text-[10px] font-medium text-brand-gold-dark bg-brand-gold/10 px-1.5 py-0.5 rounded">Recommended</span>}
        </div>
      )}

      <input
        ref={inputRef}
        id={fileId}
        type="file"
        accept={acceptString}
        multiple={multiple}
        onChange={handleChange}
        className="sr-only"
        aria-label={label}
      />

      {/* Uploaded state */}
      {value?.file && !value?.error ? (
        <div className="p-4 border border-brand-gold/30 bg-brand-gold/5 rounded-2xl">
          <div className="flex items-center gap-3">
            {isImage && value.preview ? (
              <div className="overflow-hidden bg-gray-100 w-14 h-14 rounded-xl shrink-0">
                <img src={value.preview} alt="Preview" className="object-cover w-full h-full" />
              </div>
            ) : (
              <div className="flex items-center justify-center w-14 h-14 rounded-xl bg-brand-gold/10 shrink-0">
                {isPDF ? <FileText size={22} className="text-brand-gold-dark" /> : <Image size={22} className="text-brand-gold-dark" />}
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold truncate text-brand-charcoal-dark">{value.name}</p>
              <div className="flex items-center gap-2 mt-0.5">
                <CheckCircle2 size={12} className="text-emerald-500 shrink-0" />
                <span className="text-xs text-emerald-600">Uploaded</span>
                {showDataCost && (
                  <span className="text-xs text-gray-400">
                    - {getDataCostEstimate(value.size)}
                  </span>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              {isImage && value.preview && (
                <a
                  href={value.preview}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center w-8 h-8 text-gray-400 transition-colors bg-white border border-gray-200 rounded-xl hover:text-brand-charcoal"
                  aria-label="Preview"
                >
                  <Eye size={14} />
                </a>
              )}
              <button
                type="button"
                onClick={() => onChange?.(null)}
                className="flex items-center justify-center w-8 h-8 text-gray-400 transition-colors bg-white border border-gray-200 rounded-xl hover:text-red-500"
                aria-label="Remove file"
              >
                <X size={14} />
              </button>
            </div>
          </div>
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="mt-2 text-xs font-medium text-brand-gold hover:underline"
          >
            Change file
          </button>
        </div>
      ) : (
        /* Drop zone */
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          disabled={loading}
          className={[
            'w-full border-2 border-dashed rounded-2xl p-6 text-center',
            'transition-all duration-200 cursor-pointer outline-none',
            'focus-visible:ring-2 focus-visible:ring-brand-gold/40',
            dragOver
              ? 'border-brand-gold bg-brand-gold/5 scale-[1.01]'
              : error
                ? 'border-red-300 bg-red-50/50 hover:border-red-400'
                : 'border-gray-200 hover:border-brand-gold hover:bg-brand-gold/3',
          ].join(' ')}
          aria-label={`Upload ${label || 'file'}`}
        >
          {loading ? (
            <div className="flex flex-col items-center gap-2">
              <div className="w-8 h-8 border-2 rounded-full border-brand-gold border-t-transparent animate-spin" />
              <p className="text-xs text-gray-400">Processing...</p>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${dragOver ? 'bg-brand-gold/20' : 'bg-gray-100'}`}>
                <Upload size={18} className={dragOver ? 'text-brand-gold-dark' : 'text-gray-400'} />
              </div>
              <div>
                <p className="text-sm font-semibold text-brand-charcoal-dark">
                  {dragOver ? 'Drop it here' : 'Upload file'}
                </p>
                <p className="text-xs text-gray-400 mt-0.5">
                  Drag & drop or tap to browse - Max {maxMB}MB
                </p>
                <p className="text-xs text-gray-400 mt-0.5">
                  {accept.map((a) => a.split('/')[1].toUpperCase()).join(', ')}
                </p>
              </div>
            </div>
          )}
        </button>
      )}

      {hint && !error && !value?.file && (
        <p className="mt-1.5 text-xs text-gray-400">{hint}</p>
      )}
      {(error || value?.error) && (
        <p role="alert" className="mt-1.5 flex items-center gap-1.5 text-xs text-red-500">
          <AlertCircle size={12} className="shrink-0" />
          {error || value?.error}
        </p>
      )}
    </div>
  );
}
