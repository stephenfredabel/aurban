import { useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Package, Search, Clock, Shield, AlertTriangle,
  CheckCircle2, XCircle, DollarSign, TrendingUp,
  Lock, Unlock, RotateCcw,
} from 'lucide-react';
import * as orderService from '../../services/order.service.js';
import RequirePermission from '../../components/admin/RequirePermission.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import { ORDER_STATUSES } from '../../context/OrderContext.jsx';

/* ════════════════════════════════════════════════════════════
   MARKETPLACE ORDERS — Admin oversight of all marketplace orders
   Route: /admin/marketplace-orders
════════════════════════════════════════════════════════════ */

const MOCK_ORDERS = [
  { id: 'ord_a01', ref: 'ORD-240201-AAA', buyer: 'Adaeze Okafor', seller: 'Chukwuemeka Eze', items: 3, total: 155220, status: 'shipped',   escrow: 'held',     date: Date.now() - 3 * 86400_000 },
  { id: 'ord_a02', ref: 'ORD-240202-BBB', buyer: 'Ibrahim Musa',  seller: 'Ngozi Furniture',  items: 1, total: 195775, status: 'delivered', escrow: 'held',     date: Date.now() - 7 * 86400_000 },
  { id: 'ord_a03', ref: 'ORD-240203-CCC', buyer: 'Chinwe Eze',    seller: 'TechHome',         items: 2, total: 324800, status: 'disputed',  escrow: 'frozen',   date: Date.now() - 5 * 86400_000 },
  { id: 'ord_a04', ref: 'ORD-240204-DDD', buyer: 'Tunde Bakare',  seller: 'Chukwuemeka Eze',  items: 10,total: 228150, status: 'completed', escrow: 'released', date: Date.now() - 14 * 86400_000 },
  { id: 'ord_a05', ref: 'ORD-240205-EEE', buyer: 'Funke Adeyemi', seller: 'Lagos Plumbing',   items: 4, total: 135450, status: 'refund_requested', escrow: 'frozen', date: Date.now() - 2 * 86400_000 },
  { id: 'ord_a06', ref: 'ORD-240206-FFF', buyer: 'Oluwaseun Ade', seller: 'TechHome',         items: 1, total: 89000,  status: 'paid',      escrow: 'held',     date: Date.now() - 1 * 86400_000 },
];

const TABS = [
  { id: 'all',      label: 'All'      },
  { id: 'active',   label: 'Active',   statuses: ['paid', 'accepted', 'processing', 'shipped'] },
  { id: 'disputed', label: 'Disputed', statuses: ['disputed', 'refund_requested'] },
  { id: 'completed',label: 'Completed',statuses: ['completed', 'refunded'] },
];

const ESCROW_STYLES = {
  held:     'bg-blue-50 dark:bg-blue-500/10 text-blue-600',
  frozen:   'bg-red-50 dark:bg-red-500/10 text-red-600',
  released: 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600',
  refunded: 'bg-purple-50 dark:bg-purple-500/10 text-purple-600',
  pending:  'bg-gray-100 dark:bg-white/10 text-gray-500',
};

export default function MarketplaceOrders() {
  const { t } = useTranslation('admin');
  useAuth();

  const [orders, setOrders]     = useState(MOCK_ORDERS);
  const [tab, setTab]           = useState('all');
  const [search, setSearch]     = useState('');
  const [, setLoading]   = useState(true);
  const [usingFallback, setUsingFallback] = useState(false);

  useEffect(() => { document.title = 'Marketplace Orders — Admin'; }, []);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      try {
        const res = await orderService.getOrders({ page: 1, limit: 100 });
        if (!cancelled && res.success && res.orders?.length) {
          const normalized = res.orders.map((o) => ({
            id: o.id,
            ref: o.ref || o.reference || `ORD-${o.id}`,
            buyer: o.buyer_name || o.buyerName || 'Unknown',
            seller: o.seller_name || o.sellerName || 'Unknown',
            items: Array.isArray(o.items) ? o.items.length : (o.items?.length || 0),
            total: Number(o.total || 0),
            status: o.status || 'pending_payment',
            escrow: o.escrow_status || o.escrow || 'pending',
            date: o.created_at || o.createdAt || Date.now(),
            raw: o,
          }));
          setOrders(normalized);
          setUsingFallback(false);
        } else if (!cancelled) {
          setUsingFallback(true);
        }
      } catch {
        if (!cancelled) setUsingFallback(true);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, []);

  const filtered = useMemo(() => {
    const activeTab = TABS.find(t => t.id === tab);
    let list = activeTab?.statuses
      ? orders.filter(o => activeTab.statuses.includes(o.status))
      : orders;

    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(o =>
        o.ref?.toLowerCase().includes(q) ||
        o.buyer?.toLowerCase().includes(q) ||
        o.seller?.toLowerCase().includes(q)
      );
    }
    return list;
  }, [tab, orders, search]);

  // Stats
  const stats = useMemo(() => ({
    total:    orders.length,
    active:   orders.filter(o => ['paid','accepted','processing','shipped','delivered'].includes(o.status)).length,
    disputed: orders.filter(o => ['disputed','refund_requested'].includes(o.status)).length,
    revenue:  orders.filter(o => ['completed'].includes(o.status)).reduce((s, o) => s + o.total, 0),
  }), [orders]);

  const handleAction = async (orderId, action) => {
    setOrders(prev => prev.map(o => {
      if (o.id !== orderId) return o;
      if (action === 'freeze')  return { ...o, escrow: 'frozen' };
      if (action === 'release') return { ...o, escrow: 'released', status: 'completed' };
      if (action === 'refund')  return { ...o, escrow: 'refunded', status: 'refunded' };
      return o;
    }));

    try {
      if (action === 'freeze') {
        await orderService.updateOrderStatus(orderId, 'disputed', { escrow_status: 'frozen' });
      } else if (action === 'release') {
        await orderService.updateOrderStatus(orderId, 'completed', { escrow_status: 'released' });
      } else if (action === 'refund') {
        await orderService.updateOrderStatus(orderId, 'refunded', { escrow_status: 'refunded' });
      }
    } catch { /* keep optimistic */ }
  };

  const formatDate = (ts) => new Date(ts).toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: 'numeric' });
  const formatMoney = (n) => '₦' + n.toLocaleString();

  return (
    <RequirePermission permission="bookings:view" fallback={<p className="p-8 text-center text-gray-400">Access denied</p>}>
      <div>
        <h1 className="mb-1 section-title">Marketplace Orders</h1>
        <p className="mb-5 text-sm text-gray-400">Monitor orders, escrow, and disputes across the platform</p>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-3 mb-5 lg:grid-cols-4">
          {[
            { label: 'Total Orders', value: stats.total,    icon: Package,       color: 'text-blue-500',    bg: 'bg-blue-50 dark:bg-blue-500/10' },
            { label: 'Active',       value: stats.active,   icon: TrendingUp,    color: 'text-amber-500',   bg: 'bg-amber-50 dark:bg-amber-500/10' },
            { label: 'Disputed',     value: stats.disputed, icon: AlertTriangle, color: 'text-red-500',     bg: 'bg-red-50 dark:bg-red-500/10' },
            { label: 'Revenue',      value: formatMoney(stats.revenue), icon: DollarSign, color: 'text-emerald-500', bg: 'bg-emerald-50 dark:bg-emerald-500/10' },
          ].map(({ label, value, icon: Icon, color, bg }) => (
            <div key={label} className="p-4 bg-white border border-gray-100 dark:border-white/10 rounded-2xl dark:bg-gray-900">
              <div className={`flex items-center justify-center w-9 h-9 mb-2 rounded-xl ${bg}`}>
                <Icon size={16} className={color} />
              </div>
              <p className="text-xs text-gray-400">{label}</p>
              <p className="text-lg font-extrabold text-brand-charcoal-dark dark:text-white">{value}</p>
            </div>
          ))}
        </div>

        {/* Search */}
        <div className="relative mb-4">
          <Search size={14} className="absolute text-gray-400 left-3 top-3" />
          <input type="text" value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search by reference, buyer, or seller..."
            className="w-full py-2.5 pl-9 pr-4 text-sm border border-gray-200 dark:border-white/10 rounded-xl bg-white dark:bg-white/5 text-brand-charcoal-dark dark:text-white placeholder:text-gray-300 focus:ring-2 focus:ring-brand-gold/30 focus:border-brand-gold outline-none"
          />
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-5 overflow-x-auto">
          {TABS.map(({ id, label }) => (
            <button key={id} onClick={() => setTab(id)}
              className={`px-4 py-2 text-xs font-bold rounded-xl transition-colors whitespace-nowrap ${
                tab === id ? 'bg-brand-gold text-white' : 'bg-gray-100 dark:bg-white/5 text-gray-500'
              }`}>
              {label}
            </button>
          ))}
        </div>

        {usingFallback && (
          <div className="flex items-center gap-2 px-4 py-2.5 mb-4 text-xs font-medium text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-500/10 rounded-xl">
            <AlertTriangle size={14} className="shrink-0" />
            {t('fallback', 'Could not reach server. Showing cached data.')}
          </div>
        )}

        {/* Orders table */}
        <div className="overflow-x-auto bg-white border border-gray-100 dark:border-white/10 rounded-2xl dark:bg-gray-900">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left border-b border-gray-100 dark:border-white/10">
                <th className="px-4 py-3 text-xs font-bold text-gray-400">Reference</th>
                <th className="px-4 py-3 text-xs font-bold text-gray-400">Buyer</th>
                <th className="px-4 py-3 text-xs font-bold text-gray-400">Seller</th>
                <th className="px-4 py-3 text-xs font-bold text-gray-400">Total</th>
                <th className="px-4 py-3 text-xs font-bold text-gray-400">Status</th>
                <th className="px-4 py-3 text-xs font-bold text-gray-400">Escrow</th>
                <th className="px-4 py-3 text-xs font-bold text-gray-400">Date</th>
                <th className="px-4 py-3 text-xs font-bold text-gray-400">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(order => {
                const statusDef = ORDER_STATUSES[order.status] || ORDER_STATUSES.pending_payment;
                const escrowStyle = ESCROW_STYLES[order.escrow] || ESCROW_STYLES.pending;
                return (
                  <tr key={order.id} className="border-b border-gray-50 dark:border-white/5 hover:bg-gray-50/50 dark:hover:bg-white/5">
                    <td className="px-4 py-3 font-mono text-xs text-gray-500">{order.ref}</td>
                    <td className="px-4 py-3 font-semibold text-brand-charcoal-dark dark:text-white">{order.buyer}</td>
                    <td className="px-4 py-3 text-gray-500 dark:text-gray-400">{order.seller}</td>
                    <td className="px-4 py-3 font-bold text-brand-charcoal-dark dark:text-white">{formatMoney(order.total)}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center px-2 py-0.5 text-[10px] font-bold rounded-full ${statusDef.color}`}>
                        {statusDef.label}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center px-2 py-0.5 text-[10px] font-bold rounded-full capitalize ${escrowStyle}`}>
                        {order.escrow}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-400">{formatDate(order.date)}</td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1">
                        {order.escrow === 'held' && (
                          <>
                            <button onClick={() => handleAction(order.id, 'freeze')} title="Freeze Escrow"
                              className="p-1.5 text-orange-500 rounded-lg hover:bg-orange-50 dark:hover:bg-orange-500/10">
                              <Lock size={13} />
                            </button>
                            <button onClick={() => handleAction(order.id, 'release')} title="Release to Seller"
                              className="p-1.5 text-emerald-500 rounded-lg hover:bg-emerald-50 dark:hover:bg-emerald-500/10">
                              <Unlock size={13} />
                            </button>
                          </>
                        )}
                        {order.escrow === 'frozen' && (
                          <>
                            <button onClick={() => handleAction(order.id, 'release')} title="Release"
                              className="p-1.5 text-emerald-500 rounded-lg hover:bg-emerald-50 dark:hover:bg-emerald-500/10">
                              <Unlock size={13} />
                            </button>
                            <button onClick={() => handleAction(order.id, 'refund')} title="Refund to Buyer"
                              className="p-1.5 text-purple-500 rounded-lg hover:bg-purple-50 dark:hover:bg-purple-500/10">
                              <RotateCcw size={13} />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {filtered.length === 0 && (
            <div className="py-12 text-center text-gray-400 text-sm">No orders match your filters</div>
          )}
        </div>
      </div>
    </RequirePermission>
  );
}
