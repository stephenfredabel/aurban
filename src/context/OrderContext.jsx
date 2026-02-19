import {
  createContext, useContext, useReducer,
  useCallback, useMemo, useEffect,
} from 'react';
import { useAuth } from './AuthContext.jsx';
import * as orderService from '../services/order.service.js';

/* ════════════════════════════════════════════════════════════
   ORDER CONTEXT — Marketplace order state management
   Follows BookingContext pattern exactly
════════════════════════════════════════════════════════════ */

// ── Status flow ─────────────────────────────────────────────
// pending_payment → paid → accepted → processing → shipped → delivered → completed
// ├── cancelled (any pre-ship step)
// ├── disputed (delivered)
// ├── refund_requested (delivered, within window)
// └── refunded (after dispute/refund approval)

export const ORDER_STATUSES = {
  pending_payment:  { label: 'Pending Payment',  color: 'bg-gray-100 text-gray-600 dark:bg-gray-500/15 dark:text-gray-400' },
  paid:             { label: 'Paid',              color: 'bg-blue-50 text-blue-600 dark:bg-blue-500/15 dark:text-blue-400' },
  accepted:         { label: 'Accepted',          color: 'bg-cyan-50 text-cyan-600 dark:bg-cyan-500/15 dark:text-cyan-400' },
  processing:       { label: 'Processing',        color: 'bg-amber-50 text-amber-600 dark:bg-amber-500/15 dark:text-amber-400' },
  shipped:          { label: 'Shipped',           color: 'bg-indigo-50 text-indigo-600 dark:bg-indigo-500/15 dark:text-indigo-400' },
  delivered:        { label: 'Delivered',         color: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-400' },
  completed:        { label: 'Completed',         color: 'bg-green-50 text-green-700 dark:bg-green-500/15 dark:text-green-400' },
  cancelled:        { label: 'Cancelled',         color: 'bg-red-50 text-red-600 dark:bg-red-500/15 dark:text-red-400' },
  disputed:         { label: 'Disputed',          color: 'bg-orange-50 text-orange-600 dark:bg-orange-500/15 dark:text-orange-400' },
  refund_requested: { label: 'Refund Requested',  color: 'bg-rose-50 text-rose-600 dark:bg-rose-500/15 dark:text-rose-400' },
  refunded:         { label: 'Refunded',          color: 'bg-purple-50 text-purple-600 dark:bg-purple-500/15 dark:text-purple-400' },
};

// ── Mock orders (dev fallback) ──────────────────────────────
const MOCK_ORDERS = [
  {
    id: 'ord_001',
    ref: 'ORD-230101-ABC123',
    buyerId: 'u_user_01',
    buyerName: 'Adaeze Okafor',
    buyerPhone: '08012345678',
    sellerId: 'u_provider_01',
    sellerName: 'Chukwuemeka Eze',
    items: [
      { productId: 'pr1', title: 'Premium Portland Cement (Dangote) — 50kg', quantity: 10, price: 5800, category: 'building_materials' },
      { productId: 'pr2', title: 'Granite Chippings — Per Tonne', quantity: 2, price: 45000, category: 'building_materials' },
    ],
    subtotal: 148000,
    deliveryFee: 5000,
    serviceFee: 2220,
    total: 155220,
    status: 'shipped',
    deliveryChoice: 'delivery',
    address: { fullName: 'Adaeze Okafor', phone: '08012345678', state: 'Lagos', city: 'Lekki', address: '15 Admiralty Way', landmark: 'Opposite Shoprite' },
    trackingInfo: 'Driver on the way — ETA 2hrs',
    escrowStatus: 'held',
    createdAt: Date.now() - 3 * 86400_000,
    updatedAt: Date.now() - 1 * 86400_000,
    timeline: [
      { status: 'pending_payment', date: Date.now() - 3 * 86400_000 },
      { status: 'paid', date: Date.now() - 3 * 86400_000 + 600_000 },
      { status: 'accepted', date: Date.now() - 2.5 * 86400_000 },
      { status: 'processing', date: Date.now() - 2 * 86400_000 },
      { status: 'shipped', date: Date.now() - 1 * 86400_000 },
    ],
  },
  {
    id: 'ord_002',
    ref: 'ORD-230102-DEF456',
    buyerId: 'u_user_01',
    buyerName: 'Adaeze Okafor',
    buyerPhone: '08012345678',
    sellerId: 'u_provider_02',
    sellerName: 'Ngozi Furniture Palace',
    items: [
      { productId: 'pr3', title: 'Executive Office Desk — L-Shaped Mahogany', quantity: 1, price: 185000, category: 'furniture_fittings' },
    ],
    subtotal: 185000,
    deliveryFee: 8000,
    serviceFee: 2775,
    total: 195775,
    status: 'delivered',
    deliveryChoice: 'delivery',
    address: { fullName: 'Adaeze Okafor', phone: '08012345678', state: 'Lagos', city: 'Ikeja', address: '22 Allen Avenue', landmark: 'Near Ikeja City Mall' },
    escrowStatus: 'held',
    createdAt: Date.now() - 7 * 86400_000,
    updatedAt: Date.now() - 1 * 86400_000,
    timeline: [
      { status: 'pending_payment', date: Date.now() - 7 * 86400_000 },
      { status: 'paid', date: Date.now() - 7 * 86400_000 + 300_000 },
      { status: 'accepted', date: Date.now() - 6 * 86400_000 },
      { status: 'processing', date: Date.now() - 5 * 86400_000 },
      { status: 'shipped', date: Date.now() - 2 * 86400_000 },
      { status: 'delivered', date: Date.now() - 1 * 86400_000 },
    ],
  },
  {
    id: 'ord_003',
    ref: 'ORD-230103-GHI789',
    buyerId: 'u_user_01',
    buyerName: 'Adaeze Okafor',
    buyerPhone: '08012345678',
    sellerId: 'u_provider_01',
    sellerName: 'Chukwuemeka Eze',
    items: [
      { productId: 'pr4', title: 'Armitage Shanks WC + Cistern Complete Set', quantity: 2, price: 65000, category: 'plumbing_sanitary' },
    ],
    subtotal: 130000,
    deliveryFee: 3500,
    serviceFee: 1950,
    total: 135450,
    status: 'completed',
    deliveryChoice: 'delivery',
    address: { fullName: 'Adaeze Okafor', phone: '08012345678', state: 'Abuja', city: 'Wuse', address: '7 Aminu Kano Cres', landmark: '' },
    escrowStatus: 'released',
    createdAt: Date.now() - 14 * 86400_000,
    updatedAt: Date.now() - 5 * 86400_000,
    timeline: [
      { status: 'pending_payment', date: Date.now() - 14 * 86400_000 },
      { status: 'paid', date: Date.now() - 14 * 86400_000 + 180_000 },
      { status: 'accepted', date: Date.now() - 13 * 86400_000 },
      { status: 'processing', date: Date.now() - 12 * 86400_000 },
      { status: 'shipped', date: Date.now() - 10 * 86400_000 },
      { status: 'delivered', date: Date.now() - 8 * 86400_000 },
      { status: 'completed', date: Date.now() - 5 * 86400_000 },
    ],
  },
  {
    id: 'ord_004',
    ref: 'ORD-230104-JKL012',
    buyerId: 'u_user_01',
    buyerName: 'Adaeze Okafor',
    buyerPhone: '08012345678',
    sellerId: 'u_provider_03',
    sellerName: 'TechHome Appliances',
    items: [
      { productId: 'pr8', title: 'Samsung 1.5HP Split AC — Inverter', quantity: 1, price: 320000, category: 'home_appliances' },
    ],
    subtotal: 320000,
    deliveryFee: 0,
    serviceFee: 4800,
    total: 324800,
    status: 'paid',
    deliveryChoice: 'delivery',
    address: { fullName: 'Adaeze Okafor', phone: '08012345678', state: 'Lagos', city: 'VI', address: '10 Adeola Odeku', landmark: '' },
    escrowStatus: 'held',
    createdAt: Date.now() - 1 * 86400_000,
    updatedAt: Date.now() - 1 * 86400_000,
    timeline: [
      { status: 'pending_payment', date: Date.now() - 1 * 86400_000 },
      { status: 'paid', date: Date.now() - 1 * 86400_000 + 120_000 },
    ],
  },
  {
    id: 'ord_005',
    ref: 'ORD-230105-MNO345',
    buyerId: 'u_user_02',
    buyerName: 'Ibrahim Musa',
    buyerPhone: '08098765432',
    sellerId: 'u_provider_01',
    sellerName: 'Chukwuemeka Eze',
    items: [
      { productId: 'pr6', title: 'Aluminium Roofing Sheets — 0.55mm Long Span', quantity: 50, price: 4200, category: 'building_materials' },
    ],
    subtotal: 210000,
    deliveryFee: 15000,
    serviceFee: 3150,
    total: 228150,
    status: 'cancelled',
    deliveryChoice: 'delivery',
    address: { fullName: 'Ibrahim Musa', phone: '08098765432', state: 'Kano', city: 'Kano', address: '55 Murtala Mohammed Way', landmark: '' },
    cancelReason: 'Changed mind — found cheaper locally',
    escrowStatus: 'refunded',
    createdAt: Date.now() - 10 * 86400_000,
    updatedAt: Date.now() - 9 * 86400_000,
    timeline: [
      { status: 'pending_payment', date: Date.now() - 10 * 86400_000 },
      { status: 'paid', date: Date.now() - 10 * 86400_000 + 300_000 },
      { status: 'cancelled', date: Date.now() - 9 * 86400_000 },
    ],
  },
];

// ── State & Reducer ─────────────────────────────────────────
const initialState = {
  orders:        [],
  activeOrderId: null,
  loading:       true,
  error:         null,
};

function reducer(state, action) {
  switch (action.type) {
    case 'FETCH_START':
      return { ...state, loading: true, error: null };

    case 'FETCH_SUCCESS':
      return { ...state, loading: false, orders: action.orders };

    case 'FETCH_ERROR':
      return { ...state, loading: false, error: action.error };

    case 'USE_FALLBACK':
      return { ...state, loading: false, orders: MOCK_ORDERS, error: null };

    case 'ADD_ORDER':
      return { ...state, orders: [action.order, ...state.orders] };

    case 'REMOVE_ORDER':
      return { ...state, orders: state.orders.filter(o => o.id !== action.orderId) };

    case 'UPDATE_STATUS': {
      const { orderId, status, meta } = action;
      return {
        ...state,
        orders: state.orders.map(o =>
          o.id === orderId
            ? {
              ...o,
              status,
              ...meta,
              updatedAt: Date.now(),
              timeline: [...(o.timeline || []), { status, date: Date.now() }],
            }
            : o
        ),
      };
    }

    case 'SET_ACTIVE':
      return { ...state, activeOrderId: action.id };

    default:
      return state;
  }
}

// ── Status constants (stable references outside component) ──
const ACTIVE_STATUSES = ['pending_payment', 'paid', 'accepted', 'processing', 'shipped', 'delivered'];
const COMPLETED_STATUSES = ['completed', 'refunded'];
const CANCELLED_STATUSES = ['cancelled'];

// ── Context ─────────────────────────────────────────────────
const OrderContext = createContext(null);

export function OrderProvider({ children }) {
  const { user }          = useAuth();
  const [state, dispatch] = useReducer(reducer, initialState);

  // ── Fetch orders from API (fall back to mock) ─────────────
  const fetchOrders = useCallback(async () => {
    dispatch({ type: 'FETCH_START' });
    try {
      const res = await orderService.getOrders();
      if (res.success && res.orders) {
        dispatch({ type: 'FETCH_SUCCESS', orders: res.orders });
      } else {
        dispatch({ type: 'USE_FALLBACK' });
      }
    } catch {
      dispatch({ type: 'USE_FALLBACK' });
    }
  }, []);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  // ── Actions (optimistic + API) ────────────────────────────
  const addOrder = useCallback(async (orderData) => {
    const order = {
      id:        `ord_${Date.now()}`,
      ref:       orderData.ref || `ORD-${Date.now()}`,
      buyerId:   user?.id || 'u_user_01',
      buyerName: user?.name || 'User',
      createdAt: Date.now(),
      updatedAt: Date.now(),
      status:    'pending_payment',
      escrowStatus: 'pending',
      timeline:  [{ status: 'pending_payment', date: Date.now() }],
      ...orderData,
    };
    dispatch({ type: 'ADD_ORDER', order });

    try {
      const res = await orderService.createOrder(orderData);
      if (res.success && res.order) {
        dispatch({ type: 'REMOVE_ORDER', orderId: order.id });
        dispatch({ type: 'ADD_ORDER', order: res.order });
        return res.order;
      }
    } catch { /* keep optimistic version */ }

    return order;
  }, [user]);

  const updateStatus = useCallback(async (orderId, status, meta = {}) => {
    const prev = state.orders.find(o => o.id === orderId)?.status;
    dispatch({ type: 'UPDATE_STATUS', orderId, status, meta });

    try {
      const res = await orderService.updateOrderStatus(orderId, status, meta);
      if (!res.success && prev) {
        dispatch({ type: 'UPDATE_STATUS', orderId, status: prev });
      }
    } catch {
      if (prev) dispatch({ type: 'UPDATE_STATUS', orderId, status: prev });
    }
  }, [state.orders]);

  const cancelOrder = useCallback(async (orderId, reason) => {
    const prev = state.orders.find(o => o.id === orderId)?.status;
    dispatch({ type: 'UPDATE_STATUS', orderId, status: 'cancelled', meta: { cancelReason: reason, escrowStatus: 'refunded' } });

    try {
      const res = await orderService.cancelOrder(orderId, reason);
      if (!res.success && prev) {
        dispatch({ type: 'UPDATE_STATUS', orderId, status: prev });
      }
    } catch {
      if (prev) dispatch({ type: 'UPDATE_STATUS', orderId, status: prev });
    }
  }, [state.orders]);

  const confirmDelivery = useCallback(async (orderId) => {
    dispatch({ type: 'UPDATE_STATUS', orderId, status: 'completed', meta: { escrowStatus: 'releasing' } });

    try {
      await orderService.confirmDelivery(orderId);
    } catch { /* keep optimistic */ }
  }, []);

  const requestRefund = useCallback(async (orderId, reason) => {
    dispatch({ type: 'UPDATE_STATUS', orderId, status: 'refund_requested', meta: { refundReason: reason } });

    try {
      await orderService.requestRefund(orderId, { reason });
    } catch { /* keep optimistic */ }
  }, []);

  const setActive = useCallback((id) => {
    dispatch({ type: 'SET_ACTIVE', id });
  }, []);

  // ── Derived data ──────────────────────────────────────────
  const getActiveOrders = useMemo(() =>
    state.orders.filter(o => ACTIVE_STATUSES.includes(o.status)),
  [state.orders]);

  const getCompletedOrders = useMemo(() =>
    state.orders.filter(o => COMPLETED_STATUSES.includes(o.status)),
  [state.orders]);

  const getCancelledOrders = useMemo(() =>
    state.orders.filter(o => CANCELLED_STATUSES.includes(o.status)),
  [state.orders]);

  const getDisputedOrders = useMemo(() =>
    state.orders.filter(o => ['disputed', 'refund_requested'].includes(o.status)),
  [state.orders]);

  const getByStatus = useCallback((status) =>
    state.orders.filter(o => o.status === status),
  [state.orders]);

  const getOrderById = useCallback((id) =>
    state.orders.find(o => o.id === id),
  [state.orders]);

  const getOrdersByBuyer = useCallback((buyerId) =>
    state.orders.filter(o => o.buyerId === buyerId),
  [state.orders]);

  const getOrdersBySeller = useCallback((sellerId) =>
    state.orders.filter(o => o.sellerId === sellerId),
  [state.orders]);

  const value = useMemo(() => ({
    orders:          state.orders,
    activeOrderId:   state.activeOrderId,
    loading:         state.loading,
    error:           state.error,
    getActiveOrders,
    getCompletedOrders,
    getCancelledOrders,
    getDisputedOrders,
    getByStatus,
    getOrderById,
    getOrdersByBuyer,
    getOrdersBySeller,
    addOrder,
    updateStatus,
    cancelOrder,
    confirmDelivery,
    requestRefund,
    setActive,
    refreshOrders: fetchOrders,
  }), [
    state.orders, state.activeOrderId, state.loading, state.error,
    getActiveOrders, getCompletedOrders, getCancelledOrders, getDisputedOrders,
    getByStatus, getOrderById, getOrdersByBuyer, getOrdersBySeller,
    addOrder, updateStatus, cancelOrder, confirmDelivery, requestRefund,
    setActive, fetchOrders,
  ]);

  return <OrderContext.Provider value={value}>{children}</OrderContext.Provider>;
}

export function useOrder() {
  const ctx = useContext(OrderContext);
  if (!ctx) throw new Error('useOrder must be used inside OrderProvider');
  return ctx;
}

export default OrderContext;
