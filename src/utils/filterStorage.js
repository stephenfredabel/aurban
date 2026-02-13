const FILTER_KEY = 'aurban_filters';

export const saveFilters = (filters) => {
  try {
    const safe = Object.fromEntries(
      Object.entries(filters).map(([k, v]) => [k, typeof v === 'string' ? v.replace(/<[^>]*>/g, '').slice(0, 200) : v])
    );
    sessionStorage.setItem(FILTER_KEY, JSON.stringify(safe));
  } catch { /* fail silently */ }
};

export const loadFilters = () => {
  try { return JSON.parse(sessionStorage.getItem(FILTER_KEY)); }
  catch { return null; }
};

export const clearFilters = () => {
  try { sessionStorage.removeItem(FILTER_KEY); } catch { /* fail silently */ }
};