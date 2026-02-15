import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  ChevronLeft, Package, Truck, CheckCircle2, Clock,
  MapPin, Phone, Shield, MessageSquare, CreditCard,
  XCircle, User, AlertTriangle,
} from 'lucide-react';
import { useOrder, ORDER_STATUSES } from '../../context/OrderContext.jsx';
import { useCurrency } from '../../hooks/useCurrency.js';
import { PRODUCT_CATEGORY_MAP } from '../../data/categoryFields.js';

/* ════════════════════════════════════════════════════════════
   PROVIDER ORDER DETAIL — Single order view for sellers
   Route: /provider/orders/:id
════════════════════════════════════════════════════════════ */

const TIMELINE_STEPS = [
  { key: 'pending_payment', label: 'Order Placed',     icon: Package },
  { key: 'paid',            label: 'Payment Received', icon: CreditCard },
  { key: 'accepted',        label: 'You Accepted',     icon: CheckCircle2 },
  { key: 'processing',      label: 'Processing',       icon: Clock },
  { key: 'shipped',         label: 'Shipped',          icon: Truck },
  { key: 'delivered',       label: 'Delivered',         icon: MapPin },
  { key: 'completed',       label: 'Completed',        icon: CheckCircle2 },
];

export default function ProviderOrderDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { getOrderById, updateStatus } = useOrder();
  const { symbol } = useCurrency();

  const [trackingInfo, setTrackingInfo] = useState('');
  const [showShipForm, setShowShipForm] = useState(false);

  const order = getOrderById(id);

  useEffect(() => {
    document.title = order ? `Order ${order.ref} — Provider` : 'Order — Provider';
  }, [order]);

  if (!order) {
    return (
      <div className="py-16 text-center">
        <Package size={48} className="mx-auto mb-4 text-gray-200 dark:text-gray-700" />
        <p className="mb-2 text-lg font-bold text-brand-charcoal-dark dark:text-white">Order not found</p>
        <Link to="/provider/orders" className="text-sm font-semibold text-brand-gold hover:underline">
          Back to orders
        </Link>
      </div>
    );
  }

  const status = ORDER_STATUSES[order.status] || ORDER_STATUSES.pending_payment;
  const itemCount = order.items?.reduce((s, i) => s + i.quantity, 0) || 0;
  const isCancelled = ['cancelled', 'disputed', 'refund_requested', 'refunded'].includes(order.status);

  const timelineMap = {};
  for (const entry of (order.timeline || [])) {
    timelineMap[entry.status] = entry.date;
  }

  const formatDate = (ts) => {
    const d = new Date(ts);
    return d.toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  const handleAccept = () => updateStatus(order.id, 'accepted');
  const handleDecline = () => updateStatus(order.id, 'cancelled', { cancelReason: 'Declined by seller', escrowStatus: 'refunded' });
  const handleProcessing = () => updateStatus(order.id, 'processing');

  const handleShip = () => {
    if (trackingInfo.trim()) {
      updateStatus(order.id, 'shipped', { trackingInfo: trackingInfo.trim() });
      setShowShipForm(false);
    }
  };

  return (
    <div className="max-w-2xl">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <button type="button" onClick={() => navigate('/provider/orders')}
          className="flex items-center justify-center w-9 h-9 rounded-xl hover:bg-brand-gray-soft dark:hover:bg-white/10">
          <ChevronLeft size={18} />
        </button>
        <div className="flex-1 min-w-0">
          <h1 className="text-lg font-extrabold font-display text-brand-charcoal-dark dark:text-white">
            Order {order.ref}
          </h1>
          <p className="text-xs text-gray-400">{formatDate(order.createdAt)}</p>
        </div>
        <span className={`inline-flex items-center px-3 py-1.5 rounded-full text-xs font-bold ${status.color}`}>
          {status.label}
        </span>
      </div>

      {/* ── Actions (top-level, prominent) ── */}
      {!isCancelled && (
        <div className="flex flex-wrap gap-3 p-4 mb-5 border border-gray-100 dark:border-white/10 rounded-2xl bg-brand-gray-soft dark:bg-white/5">
          {order.status === 'paid' && (
            <>
              <button type="button" onClick={handleAccept}
                className="flex items-center gap-2 px-5 py-3 text-sm font-bold text-white transition-colors rounded-xl bg-brand-gold hover:bg-brand-gold-dark">
                <CheckCircle2 size={14} /> Accept Order
              </button>
              <button type="button" onClick={handleDecline}
                className="flex items-center gap-2 px-5 py-3 text-sm font-bold text-red-500 transition-colors bg-red-50 dark:bg-red-500/10 rounded-xl hover:bg-red-100">
                <XCircle size={14} /> Decline
              </button>
            </>
          )}
          {order.status === 'accepted' && (
            <button type="button" onClick={handleProcessing}
              className="flex items-center gap-2 px-5 py-3 text-sm font-bold text-white transition-colors bg-amber-500 rounded-xl hover:bg-amber-600">
              <Package size={14} /> Start Processing
            </button>
          )}
          {order.status === 'processing' && !showShipForm && (
            <button type="button" onClick={() => setShowShipForm(true)}
              className="flex items-center gap-2 px-5 py-3 text-sm font-bold text-white transition-colors bg-indigo-500 rounded-xl hover:bg-indigo-600">
              <Truck size={14} /> Mark as Shipped
            </button>
          )}
          {showShipForm && (
            <div className="w-full space-y-3">
              <input
                type="text"
                value={trackingInfo}
                onChange={e => setTrackingInfo(e.target.value)}
                placeholder="Tracking info / driver details / estimated arrival..."
                className="w-full py-3 px-4 text-sm border border-gray-200 dark:border-white/10 rounded-xl bg-white dark:bg-white/5 text-brand-charcoal-dark dark:text-white placeholder:text-gray-300 focus:ring-2 focus:ring-brand-gold/30 outline-none"
              />
              <div className="flex gap-2">
                <button type="button" onClick={handleShip}
                  className="px-5 py-2.5 text-sm font-bold text-white bg-indigo-500 rounded-xl hover:bg-indigo-600 transition-colors">
                  Confirm Shipment
                </button>
                <button type="button" onClick={() => setShowShipForm(false)}
                  className="px-5 py-2.5 text-sm font-bold border border-gray-200 dark:border-white/10 rounded-xl text-gray-500 hover:bg-gray-50 transition-colors">
                  Cancel
                </button>
              </div>
            </div>
          )}
          {['delivered', 'completed'].includes(order.status) && (
            <p className="text-sm text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-2">
              <CheckCircle2 size={14} />
              {order.status === 'completed' ? 'Order completed — Escrow released' : 'Awaiting buyer confirmation'}
            </p>
          )}
        </div>
      )}

      {/* Cancelled notice */}
      {isCancelled && (
        <div className="flex gap-3 p-4 mb-5 border border-red-200 dark:border-red-500/20 bg-red-50 dark:bg-red-500/5 rounded-2xl">
          <XCircle size={18} className="mt-0.5 text-red-500 shrink-0" />
          <div>
            <p className="text-sm font-bold text-red-700 dark:text-red-400">
              {order.status === 'cancelled' ? 'Order Cancelled' : 'Dispute Filed'}
            </p>
            {order.cancelReason && <p className="mt-1 text-xs text-red-600 dark:text-red-400/80">{order.cancelReason}</p>}
            {order.refundReason && <p className="mt-1 text-xs text-red-600 dark:text-red-400/80">Buyer: {order.refundReason}</p>}
          </div>
        </div>
      )}

      {/* ── Timeline ── */}
      {!isCancelled && (
        <div className="p-5 mb-5 bg-white border border-gray-100 rounded-2xl dark:bg-gray-900 dark:border-white/10">
          <h3 className="mb-4 text-xs font-bold tracking-wider text-gray-400 uppercase">Order Timeline</h3>
          <div className="relative pl-6">
            {TIMELINE_STEPS.map((step, idx) => {
              const isCompleted = !!timelineMap[step.key];
              const isCurrent = order.status === step.key;
              const date = timelineMap[step.key];

              return (
                <div key={step.key} className="relative pb-5 last:pb-0">
                  {idx < TIMELINE_STEPS.length - 1 && (
                    <div className={`absolute left-[-16px] top-6 w-0.5 h-full ${
                      isCompleted ? 'bg-brand-gold' : 'bg-gray-200 dark:bg-white/10'
                    }`} />
                  )}
                  <div className={`absolute left-[-22px] top-0.5 flex items-center justify-center w-5 h-5 rounded-full border-2 ${
                    isCompleted
                      ? 'bg-brand-gold border-brand-gold text-white'
                      : isCurrent
                        ? 'bg-white dark:bg-gray-900 border-brand-gold'
                        : 'bg-white dark:bg-gray-900 border-gray-200 dark:border-white/20'
                  }`}>
                    {isCompleted ? (
                      <CheckCircle2 size={10} />
                    ) : (
                      <div className={`w-2 h-2 rounded-full ${isCurrent ? 'bg-brand-gold animate-pulse' : 'bg-gray-300 dark:bg-gray-600'}`} />
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-sm font-semibold ${
                      isCompleted || isCurrent ? 'text-brand-charcoal-dark dark:text-white' : 'text-gray-300 dark:text-gray-600'
                    }`}>
                      {step.label}
                    </span>
                    {date && <span className="text-[10px] text-gray-400">{formatDate(date)}</span>}
                  </div>
                  {step.key === 'shipped' && isCompleted && order.trackingInfo && (
                    <p className="mt-1 text-xs text-brand-gold">{order.trackingInfo}</p>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Buyer Info ── */}
      <div className="p-4 mb-5 bg-white border border-gray-100 rounded-2xl dark:bg-gray-900 dark:border-white/10">
        <h3 className="mb-3 text-xs font-bold tracking-wider text-gray-400 uppercase">Buyer</h3>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-500/15">
              <User size={16} className="text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <p className="text-sm font-bold text-brand-charcoal-dark dark:text-white">{order.buyerName}</p>
              <p className="text-xs text-gray-400">{order.buyerPhone}</p>
            </div>
          </div>
          <Link to={`/provider/messages?buyer=${order.buyerId}&type=order`}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold border border-gray-200 dark:border-white/10 rounded-xl hover:border-brand-gold transition-colors">
            <MessageSquare size={12} /> Message
          </Link>
        </div>
      </div>

      {/* ── Delivery Address ── */}
      {order.address && (
        <div className="p-4 mb-5 bg-white border border-gray-100 rounded-2xl dark:bg-gray-900 dark:border-white/10">
          <h3 className="mb-3 text-xs font-bold tracking-wider text-gray-400 uppercase">Delivery Address</h3>
          <div className="space-y-1 text-sm">
            <p className="font-semibold text-brand-charcoal-dark dark:text-white">{order.address.fullName}</p>
            <p className="text-gray-500 dark:text-gray-400">{order.address.address}</p>
            <p className="text-gray-500 dark:text-gray-400">{order.address.city}, {order.address.state}</p>
            {order.address.landmark && <p className="text-xs text-gray-400">Near: {order.address.landmark}</p>}
            <p className="flex items-center gap-1.5 text-gray-500 dark:text-gray-400">
              <Phone size={12} /> {order.address.phone}
            </p>
          </div>
        </div>
      )}

      {/* ── Items ── */}
      <div className="p-4 mb-5 bg-white border border-gray-100 rounded-2xl dark:bg-gray-900 dark:border-white/10">
        <h3 className="mb-3 text-xs font-bold tracking-wider text-gray-400 uppercase">
          Items ({itemCount})
        </h3>
        <div className="space-y-3">
          {order.items?.map((item, idx) => {
            const emoji = PRODUCT_CATEGORY_MAP[item.category]?.emoji || '📦';
            return (
              <div key={idx} className="flex gap-3">
                <div className="flex items-center justify-center w-12 h-12 text-lg rounded-xl bg-brand-gray-soft dark:bg-white/5 shrink-0">
                  {emoji}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-brand-charcoal-dark dark:text-white line-clamp-1">{item.title}</p>
                  <p className="text-xs text-gray-400">Qty: {item.quantity} × {symbol}{item.price?.toLocaleString()}</p>
                </div>
                <p className="text-sm font-extrabold text-brand-charcoal-dark dark:text-white shrink-0">
                  {symbol}{(item.price * item.quantity).toLocaleString()}
                </p>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Payment Summary ── */}
      <div className="p-4 mb-5 bg-white border border-gray-100 rounded-2xl dark:bg-gray-900 dark:border-white/10">
        <h3 className="mb-3 text-xs font-bold tracking-wider text-gray-400 uppercase">Payment</h3>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between text-gray-500 dark:text-gray-400">
            <span>Subtotal</span>
            <span className="font-semibold text-brand-charcoal-dark dark:text-white">{symbol}{order.subtotal?.toLocaleString()}</span>
          </div>
          <div className="flex justify-between text-gray-500 dark:text-gray-400">
            <span>Delivery fee</span>
            <span className="font-semibold text-brand-charcoal-dark dark:text-white">
              {order.deliveryFee === 0 ? 'Free' : `${symbol}${order.deliveryFee?.toLocaleString()}`}
            </span>
          </div>
          <div className="flex justify-between text-gray-500 dark:text-gray-400">
            <span>Platform fee (1.5%)</span>
            <span className="font-semibold text-red-500">-{symbol}{order.serviceFee?.toLocaleString()}</span>
          </div>
          <div className="flex justify-between pt-2 border-t border-gray-100 dark:border-white/10">
            <span className="font-bold text-brand-charcoal-dark dark:text-white">Your Earnings</span>
            <span className="text-lg font-extrabold text-brand-gold">
              {symbol}{((order.subtotal || 0) + (order.deliveryFee || 0) - (order.serviceFee || 0)).toLocaleString()}
            </span>
          </div>
        </div>

        {/* Escrow */}
        <div className="flex items-center gap-2 mt-3 p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-500/5 border border-emerald-100 dark:border-emerald-500/20">
          <Shield size={14} className="text-emerald-500 shrink-0" />
          <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-400">
            Escrow: {order.escrowStatus === 'held' ? 'Funds held — released after buyer confirms' : order.escrowStatus === 'released' ? 'Released to your wallet' : order.escrowStatus === 'refunded' ? 'Refunded to buyer' : 'Pending'}
          </span>
        </div>
      </div>
    </div>
  );
}
