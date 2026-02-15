import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  Package, Clock, CheckCircle2, Truck, XCircle,
  Search, ChevronRight, AlertTriangle, ShoppingCart,
} from 'lucide-react';
import { useOrder, ORDER_STATUSES } from '../../context/OrderContext.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import { useCurrency } from '../../hooks/useCurrency.js';
import { PRODUCT_CATEGORY_MAP } from '../../data/categoryFields.js';

/* ════════════════════════════════════════════════════════════
   PROVIDER ORDERS — Incoming marketplace orders for sellers
   Route: /provider/orders
════════════════════════════════════════════════════════════ */

const TABS = [
  { id: 'new',        label: 'New',        statuses: ['paid'] },
  { id: 'processing', label: 'Processing', statuses: ['accepted', 'processing'] },
  { id: 'shipped',    label: 'Shipped',    statuses: ['shipped'] },
  { id: 'completed',  label: 'Completed',  statuses: ['delivered', 'completed'] },
  { id: 'all',        label: 'All',        statuses: [] },
];

export default function ProviderOrders() {
  const { user } = useAuth();
  const { orders, getOrdersBySeller, updateStatus } = useOrder();
  const { symbol } = useCurrency();
  const [tab, setTab] = useState('new');
  const [search, setSearch] = useState('');

  useEffect(() => { document.title = 'Orders — Provider Dashboard'; }, []);

  // Get orders for this seller
  const sellerOrders = useMemo(() => {
    const sellerId = user?.id || 'u_provider_01';
    return getOrdersBySeller(sellerId);
  }, [getOrdersBySeller, user]);

  const filtered = useMemo(() => {
    const activeTab = TABS.find(t => t.id === tab);
    let list = activeTab?.statuses.length
      ? sellerOrders.filter(o => activeTab.statuses.includes(o.status))
      : sellerOrders;

    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(o =>
        o.ref?.toLowerCase().includes(q) ||
        o.buyerName?.toLowerCase().includes(q) ||
        o.items?.some(i => i.title?.toLowerCase().includes(q))
      );
    }
    return list;
  }, [tab, sellerOrders, search]);

  const tabCounts = useMemo(() => {
    const counts = {};
    for (const t of TABS) {
      counts[t.id] = t.statuses.length
        ? sellerOrders.filter(o => t.statuses.includes(o.status)).length
        : sellerOrders.length;
    }
    return counts;
  }, [sellerOrders]);

  const formatDate = (ts) => {
    const d = new Date(ts);
    return d.toLocaleDateString('en-NG', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
  };

  const handleAccept = (orderId, e) => {
    e.preventDefault();
    e.stopPropagation();
    updateStatus(orderId, 'accepted');
  };

  const handleDecline = (orderId, e) => {
    e.preventDefault();
    e.stopPropagation();
    updateStatus(orderId, 'cancelled', { cancelReason: 'Declined by seller', escrowStatus: 'refunded' });
  };

  const handleMarkProcessing = (orderId, e) => {
    e.preventDefault();
    e.stopPropagation();
    updateStatus(orderId, 'processing');
  };

  const handleMarkShipped = (orderId, e) => {
    e.preventDefault();
    e.stopPropagation();
    updateStatus(orderId, 'shipped');
  };

  return (
    <div>
      <h1 className="mb-1 section-title">Orders</h1>
      <p className="mb-5 text-sm text-gray-400">Manage incoming marketplace orders</p>

      {/* Search */}
      <div className="relative mb-4">
        <Search size={14} className="absolute text-gray-400 left-3 top-3" />
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search by reference, buyer, or product..."
          className="w-full py-2.5 pl-9 pr-4 text-sm border border-gray-200 dark:border-white/10 rounded-xl bg-white dark:bg-white/5 text-brand-charcoal-dark dark:text-white placeholder:text-gray-300 focus:ring-2 focus:ring-brand-gold/30 focus:border-brand-gold outline-none"
        />
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-5 overflow-x-auto">
        {TABS.map(({ id, label }) => (
          <button key={id} onClick={() => setTab(id)}
            className={`px-4 py-2 text-xs font-bold rounded-xl transition-colors whitespace-nowrap ${
              tab === id
                ? 'bg-brand-gold text-white'
                : 'bg-gray-100 dark:bg-white/5 text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-white/10'
            }`}>
            {label}
            {tabCounts[id] > 0 && (
              <span className="ml-1.5 px-1.5 py-0.5 text-[10px] bg-white/20 rounded-full">{tabCounts[id]}</span>
            )}
          </button>
        ))}
      </div>

      {/* Order list */}
      {filtered.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-2xl shadow-card dark:bg-gray-900">
          <div className="flex items-center justify-center w-16 h-16 mx-auto mb-4 rounded-full bg-brand-gold/10">
            <Package size={28} className="text-brand-gold" />
          </div>
          <h3 className="font-semibold font-display text-brand-charcoal-dark dark:text-white">No orders here</h3>
          <p className="mt-1 text-sm text-gray-400">
            {tab === 'new' ? 'No new orders waiting for you' : `No ${tab} orders`}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((order) => {
            const status = ORDER_STATUSES[order.status] || ORDER_STATUSES.pending_payment;
            const itemCount = order.items?.reduce((s, i) => s + i.quantity, 0) || 0;

            return (
              <Link
                key={order.id}
                to={`/provider/orders/${order.id}`}
                className="block p-4 transition-shadow bg-white rounded-2xl shadow-card dark:bg-gray-900 hover:shadow-md sm:p-5"
              >
                {/* Top: ref + status */}
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div className="min-w-0">
                    <p className="text-xs font-mono text-gray-400">{order.ref}</p>
                    <p className="mt-0.5 text-sm font-bold text-brand-charcoal-dark dark:text-white">
                      {order.buyerName}
                    </p>
                  </div>
                  <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-bold whitespace-nowrap ${status.color}`}>
                    {status.label}
                  </span>
                </div>

                {/* Items summary */}
                <p className="mb-2 text-xs text-gray-400">
                  {itemCount} item{itemCount !== 1 ? 's' : ''} — {order.items?.map(i => i.title).join(', ').slice(0, 80)}
                </p>

                {/* Total + date */}
                <div className="flex items-center justify-between pt-2 mb-3 border-t border-gray-100 dark:border-white/10">
                  <span className="text-sm font-extrabold text-brand-charcoal-dark dark:text-white">
                    {symbol}{order.total?.toLocaleString()}
                  </span>
                  <span className="flex items-center gap-1 text-xs text-gray-400">
                    <Clock size={11} /> {formatDate(order.createdAt)}
                  </span>
                </div>

                {/* Quick actions */}
                <div className="flex gap-2">
                  {order.status === 'paid' && (
                    <>
                      <button type="button" onClick={(e) => handleAccept(order.id, e)}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-white bg-brand-gold rounded-xl hover:bg-brand-gold-dark transition-colors">
                        <CheckCircle2 size={12} /> Accept
                      </button>
                      <button type="button" onClick={(e) => handleDecline(order.id, e)}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-red-500 bg-red-50 dark:bg-red-500/10 rounded-xl hover:bg-red-100 transition-colors">
                        <XCircle size={12} /> Decline
                      </button>
                    </>
                  )}
                  {order.status === 'accepted' && (
                    <button type="button" onClick={(e) => handleMarkProcessing(order.id, e)}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-white bg-amber-500 rounded-xl hover:bg-amber-600 transition-colors">
                      <Package size={12} /> Mark Processing
                    </button>
                  )}
                  {order.status === 'processing' && (
                    <button type="button" onClick={(e) => handleMarkShipped(order.id, e)}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-white bg-indigo-500 rounded-xl hover:bg-indigo-600 transition-colors">
                      <Truck size={12} /> Mark Shipped
                    </button>
                  )}
                  <div className="flex items-center gap-1 ml-auto text-xs text-gray-400">
                    View <ChevronRight size={12} />
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
