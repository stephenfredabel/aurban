import { useCallback } from 'react';

const TARGET_MAX_KB  = 500;  // compress to under 500KB
const TARGET_MAX_DIM = 1600; // max width or height in px
const QUALITY_START  = 0.85;
const QUALITY_MIN    = 0.40;
const QUALITY_STEP   = 0.05;

/**
 * Browser-side canvas image compression
 * Reduces file size before upload to save mobile data costs
 */
export function useImageCompress() {
  const compress = useCallback(async (file) => {
    if (!file || !file.type.startsWith('image/')) return file;

    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const canvas  = document.createElement('canvas');
          let { width, height } = img;

          // Scale down if too large
          if (width > TARGET_MAX_DIM || height > TARGET_MAX_DIM) {
            const ratio = Math.min(TARGET_MAX_DIM / width, TARGET_MAX_DIM / height);
            width  = Math.round(width  * ratio);
            height = Math.round(height * ratio);
          }

          canvas.width  = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, width, height);

          // Try progressively lower quality until under target size
          let quality = QUALITY_START;
          const tryCompress = () => {
            canvas.toBlob(
              (blob) => {
                if (!blob) { resolve(file); return; }
                const kb = blob.size / 1024;
                if (kb <= TARGET_MAX_KB || quality <= QUALITY_MIN) {
                  const compressed = new File([blob], file.name, { type: 'image/jpeg', lastModified: Date.now() });
                  resolve(compressed);
                } else {
                  quality = Math.max(QUALITY_MIN, quality - QUALITY_STEP);
                  tryCompress();
                }
              },
              'image/jpeg',
              quality
            );
          };
          tryCompress();
        };
        img.src = e.target.result;
      };
      reader.readAsDataURL(file);
    });
  }, []);

  const getDataCostEstimate = useCallback((sizeBytes) => {
    const kb = sizeBytes / 1024;
    if (kb < 100)   return `~${Math.round(kb)}KB`;
    if (kb < 1024)  return `~${Math.round(kb)}KB`;
    return `~${(kb / 1024).toFixed(1)}MB`;
  }, []);

  return { compress, getDataCostEstimate };
}
