import {
  createContext, useContext, useReducer,
  useCallback, useMemo, useEffect,
} from 'react';
import { useAuth } from './AuthContext.jsx';
import * as proBookingService from '../services/proBooking.service.js';
import { MOCK_PRO_BOOKINGS } from '../data/proMockData.js';

/* ════════════════════════════════════════════════════════════
   PRO BOOKING CONTEXT — Service booking state management
   Follows OrderContext pattern: useReducer + Context + mock fallback
════════════════════════════════════════════════════════════ */

// ── State & Reducer ─────────────────────────────────────────
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
      return { ...state, loading: false, bookings: MOCK_PRO_BOOKINGS, error: null };

    case 'ADD_BOOKING':
      return { ...state, bookings: [action.booking, ...state.bookings] };

    case 'REMOVE_BOOKING':
      return { ...state, bookings: state.bookings.filter(b => b.id !== action.bookingId) };

    case 'UPDATE_STATUS': {
      const { bookingId, status, meta } = action;
      return {
        ...state,
        bookings: state.bookings.map(b =>
          b.id === bookingId
            ? {
              ...b,
              status,
              ...meta,
              updatedAt: Date.now(),
              timeline: [...(b.timeline || []), { status, date: Date.now(), note: meta?.note }],
            }
            : b
        ),
      };
    }

    case 'UPDATE_BOOKING': {
      const { bookingId, data } = action;
      return {
        ...state,
        bookings: state.bookings.map(b =>
          b.id === bookingId ? { ...b, ...data, updatedAt: Date.now() } : b
        ),
      };
    }

    case 'SET_ACTIVE':
      return { ...state, activeBookingId: action.id };

    default:
      return state;
  }
}

// ── Status constants (stable references outside component) ──
const ACTIVE_STATUSES = ['pending', 'confirmed', 'provider_confirmed', 'en_route', 'checked_in', 'in_progress'];
const OBSERVATION_STATUSES = ['complete', 'observation'];
const COMPLETED_STATUSES = ['paid', 'completed'];

// ── Context ─────────────────────────────────────────────────
const ProBookingContext = createContext(null);

export function ProBookingProvider({ children }) {
  const { user }          = useAuth();
  const [state, dispatch] = useReducer(reducer, initialState);

  // ── Fetch bookings (API → mock fallback) ──────────────────
  const fetchBookings = useCallback(async () => {
    dispatch({ type: 'FETCH_START' });
    try {
      const res = await proBookingService.getProBookings();
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

  // ── Actions (optimistic + API) ────────────────────────────

  const addBooking = useCallback(async (bookingData) => {
    const booking = {
      id:          `pb_${Date.now()}`,
      ref:         bookingData.ref || `PRO-${Date.now()}`,
      clientId:    user?.id || 'u_user_01',
      clientName:  user?.name || 'User',
      createdAt:   Date.now(),
      updatedAt:   Date.now(),
      status:      'pending',
      escrowStatus: 'pending',
      timeline:    [{ status: 'pending', date: Date.now(), note: 'Booking created' }],
      ...bookingData,
    };
    dispatch({ type: 'ADD_BOOKING', booking });

    try {
      const res = await proBookingService.createProBooking(bookingData);
      if (res.success && res.booking) {
        dispatch({ type: 'REMOVE_BOOKING', bookingId: booking.id });
        dispatch({ type: 'ADD_BOOKING', booking: res.booking });
        return res.booking;
      }
    } catch { /* keep optimistic */ }

    return booking;
  }, [user]);

  const updateStatus = useCallback(async (bookingId, status, meta = {}) => {
    const prev = state.bookings.find(b => b.id === bookingId)?.status;
    dispatch({ type: 'UPDATE_STATUS', bookingId, status, meta });

    try {
      const res = await proBookingService.updateProBookingStatus(bookingId, status, meta);
      if (!res.success && prev) {
        dispatch({ type: 'UPDATE_STATUS', bookingId, status: prev });
      }
    } catch {
      if (prev) dispatch({ type: 'UPDATE_STATUS', bookingId, status: prev });
    }
  }, [state.bookings]);

  const cancelBooking = useCallback(async (bookingId, reason) => {
    const prev = state.bookings.find(b => b.id === bookingId)?.status;
    dispatch({ type: 'UPDATE_STATUS', bookingId, status: 'cancelled', meta: { cancelReason: reason, escrowStatus: 'refunded' } });

    try {
      const res = await proBookingService.cancelProBooking(bookingId, reason);
      if (!res.success && prev) {
        dispatch({ type: 'UPDATE_STATUS', bookingId, status: prev });
      }
    } catch {
      if (prev) dispatch({ type: 'UPDATE_STATUS', bookingId, status: prev });
    }
  }, [state.bookings]);

  const checkIn = useCallback(async (bookingId, { otp, lat, lng } = {}) => {
    dispatch({ type: 'UPDATE_STATUS', bookingId, status: 'checked_in', meta: { checkedInAt: Date.now(), escrowStatus: 'commitment_released', note: 'OTP verified. Commitment fee released.' } });

    try {
      const res = await proBookingService.checkInProvider(bookingId, { otp, lat, lng });
      if (res.success && res.booking) {
        dispatch({ type: 'UPDATE_BOOKING', bookingId, data: res.booking });
      }
    } catch { /* keep optimistic */ }
  }, []);

  const checkOut = useCallback(async (bookingId, { notes, photos } = {}) => {
    dispatch({ type: 'UPDATE_STATUS', bookingId, status: 'complete', meta: { completedAt: Date.now(), note: 'Work complete' } });

    try {
      await proBookingService.checkOutProvider(bookingId, { notes, photos });
    } catch { /* keep optimistic */ }
  }, []);

  const reportCompletion = useCallback(async (bookingId, { notes, beforePhotos, afterPhotos } = {}) => {
    dispatch({ type: 'UPDATE_STATUS', bookingId, status: 'observation', meta: {
      completedAt: Date.now(),
      escrowStatus: 'observation_active',
      note: 'Observation window started',
    } });

    try {
      await proBookingService.reportCompletion(bookingId, { notes, beforePhotos, afterPhotos });
    } catch { /* keep optimistic */ }
  }, []);

  const setActive = useCallback((id) => {
    dispatch({ type: 'SET_ACTIVE', id });
  }, []);

  // ── Derived data ──────────────────────────────────────────
  const getActiveBookings = useMemo(() =>
    state.bookings.filter(b => ACTIVE_STATUSES.includes(b.status)),
  [state.bookings]);

  const getInObservation = useMemo(() =>
    state.bookings.filter(b => OBSERVATION_STATUSES.includes(b.status)),
  [state.bookings]);

  const getCompletedBookings = useMemo(() =>
    state.bookings.filter(b => COMPLETED_STATUSES.includes(b.status)),
  [state.bookings]);

  const getCancelledBookings = useMemo(() =>
    state.bookings.filter(b => b.status === 'cancelled'),
  [state.bookings]);

  const getByStatus = useCallback((status) =>
    state.bookings.filter(b => b.status === status),
  [state.bookings]);

  const getBookingById = useCallback((id) =>
    state.bookings.find(b => b.id === id),
  [state.bookings]);

  const getByProvider = useCallback((providerId) =>
    state.bookings.filter(b => b.providerId === providerId),
  [state.bookings]);

  const getByClient = useCallback((clientId) =>
    state.bookings.filter(b => b.clientId === clientId),
  [state.bookings]);

  const getByCategory = useCallback((category) =>
    state.bookings.filter(b => b.category === category),
  [state.bookings]);

  const value = useMemo(() => ({
    bookings:        state.bookings,
    activeBookingId: state.activeBookingId,
    loading:         state.loading,
    error:           state.error,
    getActiveBookings,
    getInObservation,
    getCompletedBookings,
    getCancelledBookings,
    getByStatus,
    getBookingById,
    getByProvider,
    getByClient,
    getByCategory,
    addBooking,
    updateStatus,
    cancelBooking,
    checkIn,
    checkOut,
    reportCompletion,
    setActive,
    refreshBookings: fetchBookings,
  }), [
    state.bookings, state.activeBookingId, state.loading, state.error,
    getActiveBookings, getInObservation, getCompletedBookings, getCancelledBookings,
    getByStatus, getBookingById, getByProvider, getByClient, getByCategory,
    addBooking, updateStatus, cancelBooking, checkIn, checkOut, reportCompletion,
    setActive, fetchBookings,
  ]);

  return <ProBookingContext.Provider value={value}>{children}</ProBookingContext.Provider>;
}

export function useProBooking() {
  const ctx = useContext(ProBookingContext);
  if (!ctx) throw new Error('useProBooking must be used inside ProBookingProvider');
  return ctx;
}

export default ProBookingContext;
