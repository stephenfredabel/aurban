import api, { ApiError } from './api.js';

/**
 * Upload service
 * Handles single + multi file uploads with progress callbacks
 * Returns signed URLs for storage (S3 / Cloudinary / Bunny CDN)
 */

const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const ALLOWED_DOC_TYPES   = [...ALLOWED_IMAGE_TYPES, 'application/pdf'];
const MAX_IMAGE_BYTES      = 8  * 1024 * 1024;  // 8 MB
const MAX_DOC_BYTES        = 15 * 1024 * 1024;  // 15 MB

// ── Local validation ─────────────────────────────────────────

export function validateFile(file, { maxBytes = MAX_DOC_BYTES, allowedTypes = ALLOWED_DOC_TYPES } = {}) {
  if (!allowedTypes.includes(file.type)) {
    return {
      valid:   false,
      error:   `Invalid file type. Allowed: ${allowedTypes.map((t) => t.split('/')[1].toUpperCase()).join(', ')}`,
    };
  }
  if (file.size > maxBytes) {
    return {
      valid:  false,
      error:  `File too large. Maximum size: ${Math.round(maxBytes / 1024 / 1024)}MB`,
    };
  }
  return { valid: true };
}

// ── Single upload ─────────────────────────────────────────────

/**
 * Upload a single file
 * @param {File}   file
 * @param {object} opts
 * @param {string} opts.purpose  'avatar' | 'id_doc' | 'selfie' | 'address_proof' | 'business_doc' | 'portfolio' | 'property'
 * @param {string} opts.entityId  Associated user/provider/property ID
 * @param {function} opts.onProgress  (percent: number) => void
 * @returns {{ success, url?, key?, error? }}
 */
export async function uploadFile(file, {
  purpose    = 'general',
  entityId,
  onProgress,
  signal,
} = {}) {
  // Client-side validation
  const maxBytes    = purpose === 'portfolio' ? 25 * 1024 * 1024 : MAX_DOC_BYTES;
  const validation  = validateFile(file, { maxBytes });
  if (!validation.valid) return { success: false, error: validation.error };

  const form = new FormData();
  form.append('file',     file);
  form.append('purpose',  purpose);
  if (entityId) form.append('entityId', entityId);

  try {
    // Use XHR for upload progress (fetch doesn't support it)
    const result = await uploadWithProgress('/uploads/single', form, onProgress, signal);
    return { success: true, ...result };
  } catch (err) {
    return { success: false, error: err.message || 'Upload failed' };
  }
}

/**
 * Upload multiple files (portfolio, property images)
 * Returns array of { url, key } objects in same order as input
 */
export async function uploadFiles(files, {
  purpose    = 'portfolio',
  entityId,
  onProgress,
  signal,
} = {}) {
  const form = new FormData();
  files.forEach((f) => form.append('files', f));
  form.append('purpose', purpose);
  if (entityId) form.append('entityId', entityId);

  try {
    const result = await uploadWithProgress('/uploads/multiple', form, onProgress, signal);
    return { success: true, files: result.files || [] };
  } catch (err) {
    return { success: false, error: err.message || 'Upload failed', files: [] };
  }
}

/**
 * Delete an uploaded file by its storage key
 */
export async function deleteFile(key) {
  try {
    await api.delete(`/uploads/${encodeURIComponent(key)}`);
    return { success: true };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

/**
 * Get a short-lived signed URL for a private document
 * (ID docs, selfies are private — never directly accessible)
 */
export async function getSignedUrl(key, expiresInSeconds = 300) {
  try {
    const data = await api.get('/uploads/signed-url', {
      params: { key, expires: expiresInSeconds },
      dedup:  false,
    });
    return { success: true, url: data.url };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

// ── XHR upload with progress ──────────────────────────────────

function uploadWithProgress(path, formData, onProgress, signal) {
  return new Promise((resolve, reject) => {
    const BASE_URL = import.meta.env.VITE_SUPABASE_URL

    // Token
    let token = null;
    try {
      const session = sessionStorage.getItem('aurban_session');
      if (session) token = JSON.parse(session).token;
    } catch { /* ignore */ }

    const xhr = new XMLHttpRequest();
    xhr.open('POST', `${BASE_URL}${path}`);
    if (token) xhr.setRequestHeader('Authorization', `Bearer ${token}`);
    xhr.setRequestHeader('X-Client', 'aurban-web');

    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable && onProgress) {
        onProgress(Math.round((e.loaded / e.total) * 100));
      }
    };

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          resolve(JSON.parse(xhr.responseText));
        } catch {
          resolve({ url: xhr.responseText });
        }
      } else {
        try {
          const body = JSON.parse(xhr.responseText);
          reject(new ApiError(body.message || 'Upload failed', xhr.status, body));
        } catch {
          reject(new ApiError('Upload failed', xhr.status));
        }
      }
    };

    xhr.onerror   = () => reject(new ApiError('Network error during upload', 0));
    xhr.ontimeout = () => reject(new ApiError('Upload timed out', 0));
    xhr.timeout   = 60_000;

    if (signal) {
      signal.addEventListener('abort', () => {
        xhr.abort();
        reject(new ApiError('Upload cancelled', 0));
      });
    }

    xhr.send(formData);
  });
}