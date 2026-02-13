/**
 * Client-side search helper
 * Sanitizes input, scores matches, supports multi-field weighted search
 */

// ── Sanitize ──────────────────────────────────────────────────

const XSS_PATTERN = /<[^>]+>|javascript:|on\w+\s*=|data:/gi;

/**
 * Strip HTML tags and dangerous strings from user input
 */
export function sanitize(str) {
  if (typeof str !== 'string') return '';
  return str
    .replace(XSS_PATTERN, '')
    .trim()
    .slice(0, 200); // hard cap prevents ReDoS on huge inputs
}

// ── Tokenize ──────────────────────────────────────────────────

/**
 * Split query into tokens, min length 2, max 10 tokens
 */
export function tokenize(query) {
  return sanitize(query)
    .toLowerCase()
    .split(/[\s,]+/)
    .filter((t) => t.length >= 2)
    .slice(0, 10);
}

// ── Scoring ───────────────────────────────────────────────────

const DEFAULT_FIELD_WEIGHTS = {
  title:    10,
  name:     10,
  location: 8,
  category: 6,
  type:     5,
  tags:     4,
  description: 2,
};

/**
 * Score a single item against a set of query tokens
 * @param {object} item
 * @param {string[]} tokens
 * @param {object} fieldWeights  Optional override
 * @returns {number} 0 = no match, positive = match strength
 */
export function scoreItem(item, tokens, fieldWeights = DEFAULT_FIELD_WEIGHTS) {
  if (!tokens.length) return 0;
  let totalScore = 0;

  for (const [field, weight] of Object.entries(fieldWeights)) {
    const raw = item[field];
    if (!raw) continue;

    const value = (Array.isArray(raw) ? raw.join(' ') : String(raw)).toLowerCase();

    for (const token of tokens) {
      if (value === token) {
        totalScore += weight * 3;       // Exact match
      } else if (value.startsWith(token)) {
        totalScore += weight * 2;       // Prefix match
      } else if (value.includes(token)) {
        totalScore += weight * 1;       // Substring match
      }
    }
  }

  return totalScore;
}

/**
 * Search and rank an array of items
 * @param {object[]} items
 * @param {string}   query
 * @param {object}   opts
 * @param {number}   opts.minScore  Items below this score are excluded (default 1)
 * @param {number}   opts.limit     Max results (default 20)
 * @param {object}   opts.weights   Field weight overrides
 * @returns {object[]} Ranked results
 */
export function search(items, query, {
  minScore     = 1,
  limit        = 20,
  weights      = DEFAULT_FIELD_WEIGHTS,
  fallback     = [],  // Return these when query is empty
} = {}) {
  const clean  = sanitize(query);
  if (!clean) return fallback.length ? fallback : items.slice(0, limit);

  const tokens = tokenize(clean);
  if (!tokens.length) return fallback.length ? fallback : items.slice(0, limit);

  return items
    .map((item) => ({ item, score: scoreItem(item, tokens, weights) }))
    .filter(({ score }) => score >= minScore)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map(({ item }) => item);
}

/**
 * Filter items by an object of active filters
 * @param {object[]} items
 * @param {object}   filters  e.g. { category: 'rental', minPrice: 100000, maxPrice: 500000 }
 * @returns {object[]}
 */
export function applyFilters(items, filters = {}) {
  return items.filter((item) => {
    for (const [key, value] of Object.entries(filters)) {
      if (value === '' || value === null || value === undefined) continue;

      if (key === 'minPrice' && item.price < value) return false;
      if (key === 'maxPrice' && item.price > value) return false;
      if (key === 'minBeds'  && item.bedrooms < value) return false;
      if (key === 'maxBeds'  && item.bedrooms > value) return false;
      if (key === 'verified' && value && !item.verified) return false;

      // Array field: item must include value
      if (Array.isArray(item[key])) {
        if (!item[key].includes(value)) return false;
      } else if (item[key] !== undefined && String(item[key]).toLowerCase() !== String(value).toLowerCase()) {
        return false;
      }
    }
    return true;
  });
}

/**
 * Highlight matching tokens in a string for display
 * Returns an array of { text, highlight } segments
 * @param {string}   str
 * @param {string[]} tokens
 * @returns {{ text: string, highlight: boolean }[]}
 */
export function highlight(str, tokens) {
  if (!str || !tokens.length) return [{ text: str || '', highlight: false }];

  const regex   = new RegExp(`(${tokens.map((t) => t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|')})`, 'gi');
  const parts   = str.split(regex);
  const lowerTokens = tokens.map((t) => t.toLowerCase());

  return parts.map((part) => ({
    text:      part,
    highlight: lowerTokens.includes(part.toLowerCase()),
  }));
}

/**
 * Debounced search wrapper
 * Returns a function that delays invoking `fn` until after `ms` ms
 */
export function debounce(fn, ms = 300) {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), ms);
  };
}