import {
  createContext, useContext, useReducer,
  useCallback, useMemo,
} from 'react';
import { useAuth } from './AuthContext.jsx';

// ── Mock bookings ────────────────────────────────────────────
// Replace with API calls in production
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
  bookings:        MOCK_BOOKINGS,
  activeBookingId: null,
  loading:         false,
};

function reducer(state, action) {
  switch (action.type) {
    case 'SET_BOOKINGS':
      return { ...state, bookings: action.bookings };

    case 'ADD_BOOKING':
      return { ...state, bookings: [action.booking, ...state.bookings] };

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

  // ── Actions ────────────────────────────────────────────────
  const addBooking = useCallback((bookingData) => {
    const booking = {
      id:        `bk_${Date.now()}`,
      userId:    user?.id || 'u_user_01',
      userName:  user?.name || 'User',
      createdAt: Date.now(),
      status:    'pending',
      ...bookingData,
    };
    dispatch({ type: 'ADD_BOOKING', booking });
    return booking;
  }, [user]);

  const updateStatus = useCallback((bookingId, status) => {
    dispatch({ type: 'UPDATE_STATUS', bookingId, status });
  }, []);

  const cancelBooking = useCallback((bookingId) => {
    dispatch({ type: 'CANCEL_BOOKING', bookingId });
  }, []);

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
      totalUpcoming,
      getUpcoming,
      getPast,
      getByStatus,
      addBooking,
      updateStatus,
      cancelBooking,
      setActive,
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
