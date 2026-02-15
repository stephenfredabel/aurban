import {
  createContext, useContext, useReducer,
  useCallback, useMemo, useEffect,
} from 'react';
import { useAuth } from './AuthContext.jsx';
import * as bookingService from '../services/booking.service.js';

// ── Mock bookings ────────────────────────────────────────────
// Used as dev fallback when API is unavailable
const MOCK_BOOKINGS = [
  {
    id:          'bk_001',
    listingId:   'prop_001',
    listingTitle:'3-Bedroom Flat in Lekki Phase 1',
    listingType: 'rental',
    address:     'Admiralty Way, Lekki Phase 1, Lagos',
    userId:      'u_user_01',
    userName:    'Adaeze Okafor',
    userPhone:   '08012345678',
    providerId:  'u_provider_01',
    providerName:'Chukwuemeka Eze',
    date:        new Date(Date.now() + 2 * 86400_000).toISOString().split('T')[0],
    time:        '10:00',
    transport:   'drive',
    notes:       'I want to focus on the kitchen and master bedroom.',
    status:      'confirmed',
    escrowAmount:0,
    notifications: { email: true, calendar: true, whatsapp: false },
    createdAt:   Date.now() - 86400_000,
  },
  {
    id:          'bk_002',
    listingId:   'svc_201',
    listingTitle:'Emergency Plumbing Services — Lagos',
    listingType: 'service',
    address:     'Victoria Island, Lagos',
    userId:      'u_user_01',
    userName:    'Adaeze Okafor',
    userPhone:   '08012345678',
    providerId:  'u_provider_02',
    providerName:'Rasheed Adewale',
    date:        new Date(Date.now() + 5 * 86400_000).toISOString().split('T')[0],
    time:        '14:00',
    transport:   'transit',
    notes:       '',
    status:      'pending',
    escrowAmount:15000,
    notifications: { email: true, calendar: false, whatsapp: true },
    createdAt:   Date.now() - 3600_000,
  },
  {
    id:          'bk_003',
    listingId:   'prop_002',
    listingTitle:'Land for Sale — 500sqm Ibeju-Lekki',
    listingType: 'land',
    address:     'Ibeju-Lekki, Lagos',
    userId:      'u_user_01',
    userName:    'Adaeze Okafor',
    userPhone:   '08012345678',
    providerId:  'u_provider_01',
    providerName:'Chukwuemeka Eze',
    date:        new Date(Date.now() - 3 * 86400_000).toISOString().split('T')[0],
    time:        '12:00',
    transport:   'drive',
    notes:       '',
    status:      'completed',
    escrowAmount:5000,
    notifications: { email: true, calendar: true, whatsapp: false },
    createdAt:   Date.now() - 5 * 86400_000,
  },
];

// ── State & Reducer ──────────────────────────────────────────
const initialState = {
  bookings:        [],
  activeBookingId: null,
  loading:         true,
  error:           null,
};

function reducer(state, action) {
  switch (action.type) {
    case 'FETCH_START':
      return { ...state, loading: true, error: null };

    case 'FETCH_SUCCESS':
      return { ...state, loading: false, bookings: action.bookings };

    case 'FETCH_ERROR':
      return { ...state, loading: false, error: action.error };

    case 'USE_FALLBACK':
      return { ...state, loading: false, bookings: MOCK_BOOKINGS, error: null };

    case 'ADD_BOOKING':
      return { ...state, bookings: [action.booking, ...state.bookings] };

    case 'REMOVE_BOOKING':
      return { ...state, bookings: state.bookings.filter(b => b.id !== action.bookingId) };

    case 'UPDATE_STATUS': {
      const { bookingId, status } = action;
      return {
        ...state,
        bookings: state.bookings.map(b =>
          b.id === bookingId ? { ...b, status } : b
        ),
      };
    }

    case 'SET_ACTIVE':
      return { ...state, activeBookingId: action.id };

    case 'CANCEL_BOOKING':
      return {
        ...state,
        bookings: state.bookings.map(b =>
          b.id === action.bookingId ? { ...b, status: 'cancelled' } : b
        ),
      };

    default:
      return state;
  }
}

// ── Context ──────────────────────────────────────────────────
const BookingContext = createContext(null);

export function BookingProvider({ children }) {
  const { user }          = useAuth();
  const [state, dispatch] = useReducer(reducer, initialState);

  // ── Fetch bookings from API (fall back to mock) ────────────
  const fetchBookings = useCallback(async () => {
    dispatch({ type: 'FETCH_START' });
    try {
      const res = await bookingService.getBookings();
      if (res.success && res.bookings) {
        dispatch({ type: 'FETCH_SUCCESS', bookings: res.bookings });
      } else {
        dispatch({ type: 'USE_FALLBACK' });
      }
    } catch {
      dispatch({ type: 'USE_FALLBACK' });
    }
  }, []);

  useEffect(() => {
    fetchBookings();
  }, [fetchBookings]);

  // ── Actions (optimistic + API) ─────────────────────────────
  const addBooking = useCallback(async (bookingData) => {
    const booking = {
      id:        `bk_${Date.now()}`,
      userId:    user?.id || 'u_user_01',
      userName:  user?.name || 'User',
      createdAt: Date.now(),
      status:    'pending',
      ...bookingData,
    };
    // Optimistic add
    dispatch({ type: 'ADD_BOOKING', booking });

    // Try API
    try {
      const res = await bookingService.createBooking(bookingData);
      if (res.success && res.booking) {
        // Replace optimistic entry with server version
        dispatch({ type: 'REMOVE_BOOKING', bookingId: booking.id });
        dispatch({ type: 'ADD_BOOKING', booking: res.booking });
        return res.booking;
      }
    } catch { /* keep optimistic version */ }

    return booking;
  }, [user]);

  const updateStatus = useCallback(async (bookingId, status) => {
    const prev = state.bookings.find(b => b.id === bookingId)?.status;
    // Optimistic update
    dispatch({ type: 'UPDATE_STATUS', bookingId, status });

    try {
      const res = await bookingService.updateBookingStatus(bookingId, status);
      if (!res.success && prev) {
        // Revert on failure
        dispatch({ type: 'UPDATE_STATUS', bookingId, status: prev });
      }
    } catch {
      if (prev) dispatch({ type: 'UPDATE_STATUS', bookingId, status: prev });
    }
  }, [state.bookings]);

  const cancelBooking = useCallback(async (bookingId, reason) => {
    const prev = state.bookings.find(b => b.id === bookingId)?.status;
    // Optimistic cancel
    dispatch({ type: 'CANCEL_BOOKING', bookingId });

    try {
      const res = await bookingService.cancelBooking(bookingId, reason);
      if (!res.success && prev) {
        dispatch({ type: 'UPDATE_STATUS', bookingId, status: prev });
      }
    } catch {
      if (prev) dispatch({ type: 'UPDATE_STATUS', bookingId, status: prev });
    }
  }, [state.bookings]);

  const setActive = useCallback((id) => {
    dispatch({ type: 'SET_ACTIVE', id });
  }, []);

  // ── Derived data ───────────────────────────────────────────
  const today = new Date().toISOString().split('T')[0];

  const getUpcoming = useMemo(() =>
    state.bookings.filter(b =>
      b.date >= today && !['cancelled', 'completed', 'released'].includes(b.status)
    ),
  [state.bookings, today]);

  const getPast = useMemo(() =>
    state.bookings.filter(b =>
      b.date < today || ['completed', 'released', 'cancelled'].includes(b.status)
    ),
  [state.bookings, today]);

  const getByStatus = useCallback((status) =>
    state.bookings.filter(b => b.status === status),
  [state.bookings]);

  const totalUpcoming = getUpcoming.length;

  return (
    <BookingContext.Provider value={{
      bookings:        state.bookings,
      activeBookingId: state.activeBookingId,
      loading:         state.loading,
      error:           state.error,
      totalUpcoming,
      getUpcoming,
      getPast,
      getByStatus,
      addBooking,
      updateStatus,
      cancelBooking,
      setActive,
      refreshBookings: fetchBookings,
    }}>
      {children}
    </BookingContext.Provider>
  );
}

export function useBooking() {
  const ctx = useContext(BookingContext);
  if (!ctx) throw new Error('useBooking must be used inside BookingProvider');
  return ctx;
}
