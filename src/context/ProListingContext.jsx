import {
  createContext, useContext, useReducer,
  useCallback, useMemo, useEffect,
} from 'react';
import * as proListingService from '../services/proListing.service.js';
import { MOCK_PRO_SERVICES } from '../data/proMockData.js';

/* ════════════════════════════════════════════════════════════
   PRO LISTING CONTEXT — Service listing state management
   Follows PropertyContext pattern: useReducer + Context + mock fallback
════════════════════════════════════════════════════════════ */

// ── State & Reducer ─────────────────────────────────────────
const initialState = {
  listings:    [],
  loading:     true,
  error:       null,
  searchQuery: '',
};

function reducer(state, action) {
  switch (action.type) {
    case 'FETCH_START':
      return { ...state, loading: true, error: null };

    case 'FETCH_SUCCESS':
      return { ...state, loading: false, listings: action.listings };

    case 'FETCH_ERROR':
      return { ...state, loading: false, error: action.error };

    case 'USE_FALLBACK':
      return { ...state, loading: false, listings: MOCK_PRO_SERVICES, error: null };

    case 'SET_SEARCH':
      return { ...state, searchQuery: action.query };

    case 'ADD_LISTING':
      return { ...state, listings: [action.listing, ...state.listings] };

    case 'REMOVE_LISTING':
      return { ...state, listings: state.listings.filter(l => l.id !== action.listingId) };

    case 'UPDATE_LISTING': {
      const { listingId, data } = action;
      return {
        ...state,
        listings: state.listings.map(l =>
          l.id === listingId ? { ...l, ...data } : l
        ),
      };
    }

    default:
      return state;
  }
}

// ── Context ─────────────────────────────────────────────────
const ProListingContext = createContext(null);

export function ProListingProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, initialState);

  // ── Fetch listings (API → mock fallback) ──────────────────
  const fetchListings = useCallback(async () => {
    dispatch({ type: 'FETCH_START' });
    try {
      const res = await proListingService.getProListings();
      if (res.success && res.listings) {
        dispatch({ type: 'FETCH_SUCCESS', listings: res.listings });
      } else {
        dispatch({ type: 'USE_FALLBACK' });
      }
    } catch {
      dispatch({ type: 'USE_FALLBACK' });
    }
  }, []);

  useEffect(() => {
    fetchListings();
  }, [fetchListings]);

  // ── Actions ───────────────────────────────────────────────

  const setSearch = useCallback((query) => {
    dispatch({ type: 'SET_SEARCH', query });
  }, []);

  const addListing = useCallback(async (listingData) => {
    const listing = {
      id:        `ps_${Date.now()}`,
      createdAt: Date.now(),
      active:    true,
      rating:    0,
      reviewCount: 0,
      ...listingData,
    };
    dispatch({ type: 'ADD_LISTING', listing });

    try {
      const res = await proListingService.createProListing(listingData);
      if (res.success && res.listing) {
        dispatch({ type: 'REMOVE_LISTING', listingId: listing.id });
        dispatch({ type: 'ADD_LISTING', listing: res.listing });
        return res.listing;
      }
    } catch { /* keep optimistic */ }

    return listing;
  }, []);

  const updateListing = useCallback(async (listingId, data) => {
    dispatch({ type: 'UPDATE_LISTING', listingId, data });

    try {
      await proListingService.updateProListing(listingId, data);
    } catch { /* keep optimistic */ }
  }, []);

  const removeListing = useCallback(async (listingId) => {
    dispatch({ type: 'REMOVE_LISTING', listingId });

    try {
      await proListingService.deleteProListing(listingId);
    } catch { /* keep optimistic */ }
  }, []);

  const toggleListing = useCallback(async (listingId, active) => {
    dispatch({ type: 'UPDATE_LISTING', listingId, data: { active } });

    try {
      await proListingService.toggleProListing(listingId, active);
    } catch { /* keep optimistic */ }
  }, []);

  // ── Derived data ──────────────────────────────────────────

  const getByCategory = useCallback((category) =>
    state.listings.filter(l => l.category === category && l.active),
  [state.listings]);

  const getByTier = useCallback((tier) =>
    state.listings.filter(l => l.tier === tier && l.active),
  [state.listings]);

  const getByState = useCallback((stateName) =>
    state.listings.filter(l => l.state === stateName && l.active),
  [state.listings]);

  const getByProvider = useCallback((providerId) =>
    state.listings.filter(l => l.providerId === providerId),
  [state.listings]);

  const getListingById = useCallback((id) =>
    state.listings.find(l => l.id === id),
  [state.listings]);

  const getFeatured = useMemo(() =>
    state.listings.filter(l => l.featured && l.active),
  [state.listings]);

  const getActiveListings = useMemo(() =>
    state.listings.filter(l => l.active),
  [state.listings]);

  const value = useMemo(() => ({
    listings:    state.listings,
    loading:     state.loading,
    error:       state.error,
    searchQuery: state.searchQuery,
    getByCategory,
    getByTier,
    getByState,
    getByProvider,
    getListingById,
    getFeatured,
    getActiveListings,
    setSearch,
    addListing,
    updateListing,
    removeListing,
    toggleListing,
    refreshListings: fetchListings,
  }), [
    state.listings, state.loading, state.error, state.searchQuery,
    getByCategory, getByTier, getByState, getByProvider, getListingById,
    getFeatured, getActiveListings,
    setSearch, addListing, updateListing, removeListing, toggleListing, fetchListings,
  ]);

  return <ProListingContext.Provider value={value}>{children}</ProListingContext.Provider>;
}

export function useProListing() {
  const ctx = useContext(ProListingContext);
  if (!ctx) throw new Error('useProListing must be used inside ProListingProvider');
  return ctx;
}

export default ProListingContext;
