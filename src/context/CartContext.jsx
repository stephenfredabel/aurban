import { createContext, useContext, useReducer, useCallback, useMemo } from 'react';

/* ════════════════════════════════════════════════════════════
   CART CONTEXT — Manages marketplace shopping cart
   Persists to sessionStorage. Groups items by seller.
════════════════════════════════════════════════════════════ */

const CartContext = createContext(null);

const STORAGE_KEY = 'aurban_cart';

function loadCart() {
  try {
    // Prefer localStorage for cross-session persistence, fall back to sessionStorage
    const raw = localStorage.getItem(STORAGE_KEY) || sessionStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      // Migrate: if it was in sessionStorage only, copy to localStorage
      if (!localStorage.getItem(STORAGE_KEY)) localStorage.setItem(STORAGE_KEY, raw);
      return parsed.items || [];
    }
    return [];
  } catch { return []; }
}

function persist(items) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ items, updatedAt: new Date().toISOString() }));
  } catch {}
}

function reducer(state, action) {
  let next;
  switch (action.type) {
    case 'ADD_ITEM': {
      const existing = state.items.find(i => i.productId === action.item.productId);
      if (existing) {
        next = state.items.map(i =>
          i.productId === action.item.productId
            ? { ...i, quantity: i.quantity + (action.item.quantity || 1) }
            : i
        );
      } else {
        next = [...state.items, { ...action.item, addedAt: new Date().toISOString() }];
      }
      persist(next);
      return { ...state, items: next };
    }
    case 'UPDATE_QUANTITY': {
      next = state.items.map(i =>
        i.productId === action.productId ? { ...i, quantity: Math.max(1, action.quantity) } : i
      );
      persist(next);
      return { ...state, items: next };
    }
    case 'REMOVE_ITEM': {
      next = state.items.filter(i => i.productId !== action.productId);
      persist(next);
      return { ...state, items: next };
    }
    case 'CLEAR_CART': {
      persist([]);
      return { ...state, items: [] };
    }
    case 'CLEAR_SELLER': {
      next = state.items.filter(i => i.sellerId !== action.sellerId);
      persist(next);
      return { ...state, items: next };
    }
    default:
      return state;
  }
}

export function CartProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, { items: loadCart() });

  const addItem = useCallback((product, quantity = 1, preferences = null) => {
    dispatch({
      type: 'ADD_ITEM',
      item: {
        productId: product.id,
        sellerId: product.providerId,
        sellerName: product.providerName,
        title: product.title,
        image: product.images?.[0] || null,
        category: product.category,
        price: product.price,
        pricingUnit: product.pricingUnit,
        quantity,
        deliveryOption: product.deliveryOption,
        deliveryFee: product.deliveryFee || 0,
        deliveryTime: product.deliveryTime,
        preferences: preferences || null,
      },
    });
  }, []);

  const updateQuantity = useCallback((productId, quantity) => {
    dispatch({ type: 'UPDATE_QUANTITY', productId, quantity });
  }, []);

  const removeItem = useCallback((productId) => {
    dispatch({ type: 'REMOVE_ITEM', productId });
  }, []);

  const clearCart = useCallback(() => {
    dispatch({ type: 'CLEAR_CART' });
  }, []);

  const clearSeller = useCallback((sellerId) => {
    dispatch({ type: 'CLEAR_SELLER', sellerId });
  }, []);

  const itemCount = state.items.reduce((sum, i) => sum + i.quantity, 0);
  const subtotal = state.items.reduce((sum, i) => sum + i.price * i.quantity, 0);

  // Group items by seller
  const groupedBySeller = useMemo(() => {
    const groups = {};
    for (const item of state.items) {
      const key = item.sellerId;
      if (!groups[key]) {
        groups[key] = { sellerId: key, sellerName: item.sellerName, items: [], subtotal: 0, deliveryFee: 0 };
      }
      groups[key].items.push(item);
      groups[key].subtotal += item.price * item.quantity;
      // Use highest delivery fee per seller
      if (item.deliveryFee > groups[key].deliveryFee) {
        groups[key].deliveryFee = item.deliveryFee;
      }
    }
    return Object.values(groups);
  }, [state.items]);

  const totalDeliveryFee = groupedBySeller.reduce((sum, g) => sum + g.deliveryFee, 0);
  const serviceFee = Math.round(subtotal * 0.015); // 1.5% platform fee
  const grandTotal = subtotal + totalDeliveryFee + serviceFee;

  const value = useMemo(() => ({
    items: state.items,
    itemCount,
    subtotal,
    totalDeliveryFee,
    serviceFee,
    grandTotal,
    groupedBySeller,
    addItem,
    updateQuantity,
    removeItem,
    clearCart,
    clearSeller,
  }), [state.items, itemCount, subtotal, totalDeliveryFee, serviceFee, grandTotal, groupedBySeller, addItem, updateQuantity, removeItem, clearCart, clearSeller]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used inside CartProvider');
  return ctx;
}

export default CartContext;
