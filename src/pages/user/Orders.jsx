import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  Package, ShoppingCart, Clock, ChevronRight, Search,
  Truck, CheckCircle2, XCircle, AlertTriangle,
} from 'lucide-react';
import { useOrder, ORDER_STATUSES } from '../../context/OrderContext.jsx';
import { useCurrency } from '../../hooks/useCurrency.js';
import { PRODUCT_CATEGORY_MAP } from '../../data/categoryFields.js';

/* ════════════════════════════════════════════════════════════
   USER ORDERS — Marketplace order list
   Route: /dashboard/orders
════════════════════════════════════════════════════════════ */

const TABS = [
  { id: 'active',    label: 'Active'    },
  { id: 'completed', label: 'Completed' },
  { id: 'cancelled', label: 'Cancelled' },
  { id: 'all',       label: 'All'       },
];

export default function Orders() {
  const {
    orders, getActiveOrders, getCompletedOrders, getCancelledOrders,
  } = useOrder();
  const { symbol } = useCurrency();
  const [tab, setTab] = useState('active');
  const [search, setSearch] = useState('');

  useEffect(() => { document.title = 'Orders — Aurban'; }, []);

  const filtered = useMemo(() => {
    let list;
    if (tab === 'active')    list = getActiveOrders;
    else if (tab === 'completed') list = getCompletedOrders;
    else if (tab === 'cancelled') list = getCancelledOrders;
    else list = orders;

    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(o =>
        o.ref?.toLowerCase().includes(q) ||
        o.sellerName?.toLowerCase().includes(q) ||
        o.items?.some(i => i.title?.toLowerCase().includes(q))
      );
    }
    return list;
  }, [tab, orders, getActiveOrders, getCompletedOrders, getCancelledOrders, search]);

  const formatDate = (ts) => {
    const d = new Date(ts);
    return d.toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  return (
    <div>
      <h1 className="mb-1 section-title">Orders</h1>
      <p className="mb-5 text-sm text-gray-400">Track your marketplace purchases</p>

      {/* Search */}
      <div className="relative mb-4">
        <Search size={14} className="absolute text-gray-400 left-3 top-3" />
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search orders by reference, seller, or product..."
          className="w-full py-2.5 pl-9 pr-4 text-sm border border-gray-200 dark:border-white/10 rounded-xl bg-white dark:bg-white/5 text-brand-charcoal-dark dark:text-white placeholder:text-gray-300 focus:ring-2 focus:ring-brand-gold/30 focus:border-brand-gold outline-none"
        />
      </div>

      {/* Tab bar */}
      <div className="flex gap-2 mb-5 overflow-x-auto">
        {TABS.map(({ id, label }) => {
          const count = id === 'active' ? getActiveOrders.length
            : id === 'completed' ? getCompletedOrders.length
            : id === 'cancelled' ? getCancelledOrders.length
            : orders.length;
          return (
            <button key={id} onClick={() => setTab(id)}
              className={`px-4 py-2 text-xs font-bold rounded-xl transition-colors whitespace-nowrap ${
                tab === id
                  ? 'bg-brand-gold text-white'
                  : 'bg-gray-100 dark:bg-white/5 text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-white/10'
              }`}>
              {label}
              {count > 0 && (
                <span className="ml-1.5 px-1.5 py-0.5 text-[10px] bg-white/20 rounded-full">{count}</span>
              )}
            </button>
          );
        })}
      </div>

      {/* Order list */}
      {filtered.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-2xl shadow-card dark:bg-gray-900">
          <div className="flex items-center justify-center w-16 h-16 mx-auto mb-4 rounded-full bg-brand-gold/10">
            <Package size={28} className="text-brand-gold" />
          </div>
          <h3 className="font-semibold font-display text-brand-charcoal-dark dark:text-white">
            No orders found
          </h3>
          <p className="mt-1 text-sm text-gray-400 max-w-xs mx-auto">
            {tab === 'all' ? 'Browse the marketplace to place your first order' : `No ${tab} orders right now`}
          </p>
          <Link to="/marketplace"
            className="inline-flex items-center gap-2 mt-5 px-5 py-2.5 bg-brand-gold hover:bg-brand-gold-dark text-white text-sm font-bold rounded-xl transition-colors">
            <ShoppingCart size={14} /> Browse Marketplace
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((order) => {
            const status = ORDER_STATUSES[order.status] || ORDER_STATUSES.pending_payment;
            const itemCount = order.items?.reduce((s, i) => s + i.quantity, 0) || 0;
            const firstEmoji = PRODUCT_CATEGORY_MAP[order.items?.[0]?.category]?.emoji || '📦';

            return (
              <Link
                key={order.id}
                to={`/dashboard/orders/${order.id}`}
                className="block p-4 transition-shadow bg-white rounded-2xl shadow-card dark:bg-gray-900 hover:shadow-md sm:p-5"
              >
                {/* Top row: ref + status */}
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="min-w-0">
                    <p className="text-xs font-mono text-gray-400">{order.ref}</p>
                    <p className="mt-0.5 text-sm font-bold text-brand-charcoal-dark dark:text-white">
                      {order.sellerName}
                    </p>
                  </div>
                  <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-bold whitespace-nowrap ${status.color}`}>
                    {status.label}
                  </span>
                </div>

                {/* Product thumbnails */}
                <div className="flex items-center gap-2 mb-3">
                  <div className="flex -space-x-2">
                    {order.items?.slice(0, 3).map((item, idx) => (
                      <div key={idx} className="flex items-center justify-center w-10 h-10 text-sm border-2 border-white rounded-lg dark:border-gray-900 bg-brand-gray-soft dark:bg-white/5">
                        {PRODUCT_CATEGORY_MAP[item.category]?.emoji || '📦'}
                      </div>
                    ))}
                    {order.items?.length > 3 && (
                      <div className="flex items-center justify-center w-10 h-10 text-[10px] font-bold border-2 border-white rounded-lg dark:border-gray-900 bg-gray-100 dark:bg-white/10 text-gray-500">
                        +{order.items.length - 3}
                      </div>
                    )}
                  </div>
                  <span className="text-xs text-gray-400">
                    {itemCount} item{itemCount !== 1 ? 's' : ''}
                  </span>
                </div>

                {/* Bottom row: total + date + arrow */}
                <div className="flex items-center justify-between pt-2 border-t border-gray-100 dark:border-white/10">
                  <div className="flex items-center gap-4">
                    <span className="text-sm font-extrabold text-brand-charcoal-dark dark:text-white">
                      {symbol}{order.total?.toLocaleString()}
                    </span>
                    <span className="flex items-center gap-1 text-xs text-gray-400">
                      <Clock size={11} /> {formatDate(order.createdAt)}
                    </span>
                  </div>
                  <ChevronRight size={16} className="text-gray-300 dark:text-gray-600" />
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
